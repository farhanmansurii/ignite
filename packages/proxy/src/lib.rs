use worker::*;
use serde::{Deserialize, Serialize};

// ─── Rate limit config ─────────────────────────────────────────────────────
const RATE_LIMIT_MAX: u32 = 30;  // requests per window
const RATE_LIMIT_WINDOW_SECS: u64 = 60;

#[derive(Serialize, Deserialize)]
struct IgnitePayload {
    #[serde(rename = "__ignite")]
    ignite: bool,
}

// ─── Pure logic — fully testable with `cargo test` ────────────────────────

/// Returns true if the provided key matches the expected secret.
pub fn verify_auth(auth_key: &str, secret: &str) -> bool {
    !auth_key.is_empty() && auth_key == secret
}

/// Returns true if function_name is in the comma-separated allowlist.
/// Uses exact-match comparison after trimming whitespace.
pub fn verify_allowlist(function_name: &str, allowed_list: &str) -> bool {
    !function_name.is_empty()
        && allowed_list.split(',').any(|s| s.trim() == function_name)
}

/// Builds the KV key for rate limiting: "rate:{ip}:{60s_bucket}".
pub fn rate_limit_key(ip: &str, timestamp_secs: u64) -> String {
    let bucket = timestamp_secs / RATE_LIMIT_WINDOW_SECS;
    format!("rate:{}:{}", ip, bucket)
}

/// Builds the Firebase target URL.
pub fn build_target_url(base_url: &str, function_name: &str) -> String {
    format!("{}/{}", base_url.trim_end_matches('/'), function_name)
}

// ─── Worker handler ────────────────────────────────────────────────────────

#[event(fetch)]
pub async fn main(req: Request, env: Env, ctx: worker::Context) -> Result<Response> {
    let router = Router::new();

    router
        .options("/warm", |_req, _ctx| {
            let mut headers = Headers::new();
            headers.set("Access-Control-Allow-Origin", "*")?;
            headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")?;
            headers.set("Access-Control-Allow-Headers", "Content-Type, X-Ignite-Key")?;
            Ok(Response::empty()?.with_headers(headers))
        })
        .post_async("/warm", |req, ctx| async move {
            let url = req.url()?;
            let query: std::collections::HashMap<_, _> =
                url.query_pairs().into_owned().collect();

            // 1. Auth check
            let auth_key = req.headers().get("X-Ignite-Key")?.unwrap_or_default();
            let secret = ctx.env.var("IGNITE_SECRET")?.to_string();
            if !verify_auth(&auth_key, &secret) {
                return Response::error("Unauthorized", 401);
            }

            // 2. Function name check
            let function_name = match query.get("fn") {
                Some(name) => name.clone(),
                None => return Response::error("Missing function parameter", 400),
            };

            // 3. Allowlist check
            let allowed = ctx.env.var("ALLOWED_FUNCTIONS")?.to_string();
            if !verify_allowlist(&function_name, &allowed) {
                return Response::error("Forbidden", 403);
            }

            // 4. Rate limiting — 30 requests per IP per 60s window via KV
            if let Ok(kv) = ctx.env.kv("RATE_LIMIT_KV") {
                let ip = req
                    .headers()
                    .get("CF-Connecting-IP")?
                    .unwrap_or_else(|| "unknown".to_string());

                // Use seconds since epoch as the time bucket
                let now_secs = js_sys::Date::now() as u64 / 1000;
                let key = rate_limit_key(&ip, now_secs);

                let count: u32 = kv
                    .get(&key)
                    .text()
                    .await?
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(0);

                if count >= RATE_LIMIT_MAX {
                    let mut resp = Response::error("Too Many Requests", 429)?;
                    resp.headers_mut()
                        .set("Retry-After", &RATE_LIMIT_WINDOW_SECS.to_string())?;
                    resp.headers_mut()
                        .set("Access-Control-Allow-Origin", "*")?;
                    return Ok(resp);
                }

                // Increment counter; expire after 2 windows to avoid stale keys
                let _ = kv
                    .put(&key, (count + 1).to_string())?
                    .expiration_ttl(RATE_LIMIT_WINDOW_SECS * 2)
                    .execute()
                    .await;
            }

            // 5. Immediate response + background warm via ctx.wait_until
            let target_url = build_target_url(
                &ctx.env.var("FIREBASE_BASE_URL")?.to_string(),
                &function_name,
            );

            ctx.wait_until(async move {
                let mut headers = Headers::new();
                let _ = headers.set("Content-Type", "application/json");
                let _ = headers.set("X-Ignite-Warm", "true");
                let _ = headers.set("X-Ignite-Key", &secret);

                if let Ok(request) = Request::new_with_init(
                    &target_url,
                    RequestInit::new()
                        .with_method(Method::Post)
                        .with_headers(headers)
                        .with_body(Some(
                            serde_json::to_string(&IgnitePayload { ignite: true })
                                .unwrap()
                                .into(),
                        )),
                ) {
                    let _ = Fetch::Request(request).send().await;
                }
            });

            let mut resp = Response::ok("Ignited")?;
            resp.headers_mut()
                .set("Access-Control-Allow-Origin", "*")?;
            Ok(resp)
        })
        .run(req, env)
        .await
}

// ─── Unit tests ────────────────────────────────────────────────────────────
// Run with: cargo test
// These test pure logic functions only — no CF runtime needed.

#[cfg(test)]
mod tests {
    use super::*;

    // ── verify_auth ──────────────────────────────────────────────────────

    #[test]
    fn auth_passes_with_correct_secret() {
        assert!(verify_auth("my-secret", "my-secret"));
    }

    #[test]
    fn auth_fails_with_wrong_secret() {
        assert!(!verify_auth("wrong", "my-secret"));
    }

    #[test]
    fn auth_fails_with_empty_key() {
        assert!(!verify_auth("", "my-secret"));
    }

    #[test]
    fn auth_fails_when_both_empty() {
        assert!(!verify_auth("", ""));
    }

    #[test]
    fn auth_is_case_sensitive() {
        assert!(!verify_auth("MY-SECRET", "my-secret"));
    }

    // ── verify_allowlist ─────────────────────────────────────────────────

    #[test]
    fn allowlist_passes_exact_match() {
        assert!(verify_allowlist("createProject", "createProject,processPayment"));
    }

    #[test]
    fn allowlist_passes_with_spaces_in_list() {
        assert!(verify_allowlist("processPayment", "createProject, processPayment, login"));
    }

    #[test]
    fn allowlist_rejects_partial_match() {
        assert!(!verify_allowlist("createProjectAdmin", "createProject,processPayment"));
    }

    #[test]
    fn allowlist_rejects_substring_match() {
        assert!(!verify_allowlist("create", "createProject,processPayment"));
    }

    #[test]
    fn allowlist_rejects_empty_function_name() {
        assert!(!verify_allowlist("", "createProject,processPayment"));
    }

    #[test]
    fn allowlist_rejects_unlisted_function() {
        assert!(!verify_allowlist("deleteEverything", "createProject,processPayment"));
    }

    #[test]
    fn allowlist_single_entry() {
        assert!(verify_allowlist("login", "login"));
    }

    // ── rate_limit_key ───────────────────────────────────────────────────

    #[test]
    fn rate_limit_key_same_bucket_within_window() {
        let k1 = rate_limit_key("1.2.3.4", 0);
        let k2 = rate_limit_key("1.2.3.4", 59);
        assert_eq!(k1, k2); // same 60s bucket
    }

    #[test]
    fn rate_limit_key_different_bucket_across_window() {
        let k1 = rate_limit_key("1.2.3.4", 59);
        let k2 = rate_limit_key("1.2.3.4", 60);
        assert_ne!(k1, k2); // different buckets
    }

    #[test]
    fn rate_limit_key_different_ips_different_keys() {
        let k1 = rate_limit_key("1.2.3.4", 0);
        let k2 = rate_limit_key("5.6.7.8", 0);
        assert_ne!(k1, k2);
    }

    #[test]
    fn rate_limit_key_format() {
        let key = rate_limit_key("1.2.3.4", 120);
        assert_eq!(key, "rate:1.2.3.4:2"); // bucket = 120 / 60 = 2
    }

    // ── build_target_url ─────────────────────────────────────────────────

    #[test]
    fn target_url_basic() {
        let url = build_target_url(
            "https://us-central1-myapp.cloudfunctions.net",
            "createProject",
        );
        assert_eq!(
            url,
            "https://us-central1-myapp.cloudfunctions.net/createProject"
        );
    }

    #[test]
    fn target_url_strips_trailing_slash() {
        let url = build_target_url(
            "https://us-central1-myapp.cloudfunctions.net/",
            "processPayment",
        );
        assert_eq!(
            url,
            "https://us-central1-myapp.cloudfunctions.net/processPayment"
        );
    }
}
