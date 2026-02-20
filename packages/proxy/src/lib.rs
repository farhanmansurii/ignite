use worker::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct IgnitePayload {
    #[serde(rename = "__ignite")]
    ignite: bool,
}

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
            let query: std::collections::HashMap<_, _> = url.query_pairs().into_owned().collect();
            
            // 1. Auth & Registry Check
            let auth_key = req.headers().get("X-Ignite-Key")?.unwrap_or_default();
            let secret = ctx.env.var("IGNITE_SECRET")?.to_string();
            if auth_key != secret {
                return Response::error("Unauthorized", 401);
            }

            let function_name = match query.get("fn") {
                Some(name) => name,
                None => return Response::error("Missing function parameter", 400),
            };

            let allowed = ctx.env.var("ALLOWED_FUNCTIONS")?.to_string();
            let is_allowed = allowed.split(',').any(|s| s.trim() == function_name);
            if !is_allowed {
                return Response::error("Forbidden", 403);
            }

            let target_url = format!("{}/{}", ctx.env.var("FIREBASE_BASE_URL")?.to_string(), function_name);

            // 2. Immediate Response + Background Warm
            // Using ctx.wait_until ensures the proxy returns 200 OK instantly.
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
                        .with_body(Some(serde_json::to_string(&IgnitePayload { ignite: true }).unwrap().into()))
                ) {
                    let _ = Fetch::Request(request).send().await;
                }
            });

            let mut resp = Response::ok("Ignited")?;
            resp.headers_mut().set("Access-Control-Allow-Origin", "*")?;
            Ok(resp)
        })
        .run(req, env)
        .await
}
