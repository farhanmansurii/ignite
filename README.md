# Ignite

[![npm version](https://img.shields.io/npm/v/@farhanmansuri/ignite-core.svg)](https://www.npmjs.com/package/@farhanmansuri/ignite-core)
[![npm downloads](https://img.shields.io/npm/dm/@farhanmansuri/ignite-core.svg)](https://www.npmjs.com/package/@farhanmansuri/ignite-core)
[![CI](https://github.com/farhanmansurii/ignite/actions/workflows/ci.yml/badge.svg)](https://github.com/farhanmansurii/ignite/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Your users click. Your function is already awake.**

Firebase Cloud Functions cold start in 800ms–2s. Ignite eliminates that by detecting hover intent 150ms before a click and firing a non-blocking warm-up signal through a Rust edge proxy — so by the time the user's finger lifts, the container is hot.

---

## How it works

1. User hovers over a button for >150ms — intent detected (`onFocus` for keyboard, `onTouchStart` for mobile)
2. `sendBeacon` fires a POST to the Rust proxy — non-blocking, zero impact on the user
3. Proxy authenticates, checks the allowlist, triggers warm-up via `ctx.wait_until` — returns `200 OK` instantly
4. Firebase function receives `__ignite: true`, verifies the secret, exits early — container is now warm
5. User clicks — real request hits a warm container, cold start eliminated

---

## Packages

| Package | Description |
|---|---|
| [`@farhanmansuri/ignite-core`](packages/core) | Framework-agnostic signal logic. `sendBeacon` primary, `fetch` fallback. 5-min TTL warm cache. |
| [`@farhanmansuri/ignite-react`](packages/react) | React hook with stable `useRef` callbacks, hover/focus/touch support. |
| [`@farhanmansuri/ignite-vue`](packages/vue) | Vue 3 composable with `onUnmounted` cleanup. |
| [`@farhanmansuri/ignite-svelte`](packages/svelte) | Svelte `use:ignite` action with full lifecycle cleanup. |
| [`@farhanmansuri/ignite-firebase`](packages/firebase) | Type-safe early-exit middleware for `onCall` and `onRequest` triggers. |
| [`@farhanmansuri/ignite-proxy`](packages/proxy) | Rust/Wasm Cloudflare Worker. Auth, exact-match allowlist, `ctx.wait_until`. |

---

## Setup

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) + [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) for the proxy
- Firebase project with Cloud Functions v2

### 1. Deploy the Proxy

The proxy is a Rust/Wasm Cloudflare Worker that sits between your frontend and Firebase.

```bash
# Install Rust + wrangler if you haven't
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
npm install -g wrangler && wrangler login

cd packages/proxy
wrangler secret put IGNITE_SECRET       # shared auth key — keep this private
wrangler secret put FIREBASE_BASE_URL   # e.g. https://us-central1-your-project.cloudfunctions.net
wrangler secret put ALLOWED_FUNCTIONS   # comma-separated: createProject,processPayment,loginUser
wrangler deploy
```

> The allowlist uses exact-match validation — `createProject` will never match `createProjectAdmin`.

### 2. Wrap your Firebase Function

```ts
import { igniteWrapper, igniteMiddleware } from '@farhanmansuri/ignite-firebase';

// onCall
export const createProject = igniteWrapper(async (req) => {
  // your logic here — never reached on warm signals
}, process.env.IGNITE_SECRET);

// onRequest
export const processPayment = igniteMiddleware(async (req, res) => {
  // your logic here
}, process.env.IGNITE_SECRET);
```

### 3. Add to your frontend

**React**
```tsx
import { useIgnite } from '@farhanmansuri/ignite-react';

const ignite = useIgnite('createProject', {
  proxyUrl: 'https://your-proxy.workers.dev',
  onWarm: (fn, ms) => console.log(`${fn} warmed in ${ms}ms`),
  onError: (err) => console.error(err),
});

<button {...ignite} onClick={handleSubmit}>
  Create Project
</button>
```

**Vue 3**
```vue
<template>
  <button
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="handleSubmit"
  >
    Create Project
  </button>
</template>

<script setup lang="ts">
import { useIgnite } from '@farhanmansuri/ignite-vue';

const { onMouseEnter, onMouseLeave } = useIgnite('createProject', {
  proxyUrl: 'https://your-proxy.workers.dev',
});
</script>
```

**Svelte**
```svelte
<script>
  import { ignite } from '@farhanmansuri/ignite-svelte';
</script>

<button
  use:ignite={{ functionName: 'createProject', proxyUrl: 'https://your-proxy.workers.dev' }}
  on:click={handleSubmit}
>
  Create Project
</button>
```

---

## Security

- **Shared secret** — `X-Ignite-Key` header verified on the proxy and re-verified on the Firebase function. Never exposed to the browser.
- **Exact-match allowlist** — `ALLOWED_FUNCTIONS` env var on the proxy. `split(',').any(|s| s.trim() == name)` — no substring bypass possible.
- **Early exit** — the Firebase function returns `{ status: "ignited" }` before touching any business logic or incurring billing for real work.

---

## Architecture

```
Browser
  │  mouseenter (150ms)
  ▼
ignite-react / vue / svelte
  │  sendBeacon (non-blocking)
  ▼
ignite-proxy  (Rust · Cloudflare Worker)
  │  auth + allowlist + ctx.wait_until
  ▼
Firebase Function  →  __ignite: true  →  early exit, container warm
```

---

## Troubleshooting

### Warm signals are firing but cold starts still happen

**Most likely cause:** The Firebase function container spun down between the warm signal and the click.

- Check that your `hoverTimeout` (default 150ms) is appropriate — increase it if users tend to click slowly after hovering
- Confirm the warm signal is reaching Firebase: add `onWarm: (fn, ms) => console.log(...)` and check the browser console
- Firebase containers can spin down in as little as a few minutes of inactivity — Ignite only prevents cold starts when the user hovers shortly before clicking

---

### The proxy returns `401 Unauthorized`

The `X-Ignite-Key` header doesn't match `IGNITE_SECRET` on the proxy.

1. Verify the secret is set on the proxy: `wrangler secret list`
2. Verify the secret matches what you pass as `apiKey` in the frontend options
3. If you recently rotated the secret, redeploy the proxy: `wrangler deploy`

---

### The proxy returns `403 Forbidden`

The function name is not in `ALLOWED_FUNCTIONS`.

1. Check the exact value: `wrangler secret list` (won't show the value, but confirms it exists)
2. The allowlist is **exact-match and case-sensitive** — `CreateProject` ≠ `createProject`
3. Update the allowlist: `wrangler secret put ALLOWED_FUNCTIONS` then redeploy

---

### The proxy returns `429 Too Many Requests`

Rate limit hit — 30 warm signals per IP per 60 seconds.

- This is normal if you're testing rapidly from the same machine
- In production this should never trigger for real users — each user hovers once before clicking
- If you need a higher limit, change `RATE_LIMIT_MAX` in `packages/proxy/src/lib.rs` and redeploy

---

### `sendBeacon` fires but nothing reaches Firebase

The proxy deployed successfully but the background `ctx.wait_until` call to Firebase is failing silently.

1. Check `FIREBASE_BASE_URL` is set and correct: `wrangler secret list`
2. The URL should be the base path — **no trailing slash**, e.g. `https://us-central1-myapp.cloudfunctions.net`
3. Confirm the function name matches exactly: `createProject` not `createProject-v2`
4. Check Firebase Function logs in the Google Cloud console for errors

---

### Firebase function is being called but `onWarm` is never triggered

`sendBeacon` doesn't return a response body — `onWarm` latency is measured from queue time, not execution. This is expected.

If using the `fetch` fallback (sendBeacon unavailable), `onWarm` fires after the fetch resolves.

---

### `onError` fires with `AbortError`

The fetch fallback timed out (default 5 seconds). The proxy may be slow or unreachable.

1. Check your Cloudflare Worker is deployed and healthy in the Cloudflare dashboard
2. Try increasing the timeout by modifying `FETCH_TIMEOUT_MS` in `packages/core/src/index.ts` if your proxy is in a distant region

---

### Warm signals work in dev but not in production

**CORS:** Make sure the proxy `wrangler.toml` is deployed — the `Access-Control-Allow-Origin: *` header is set by the Worker, not by Firebase.

**CSP:** If your app uses a `Content-Security-Policy`, add your proxy URL to `connect-src`:
```
Content-Security-Policy: connect-src 'self' https://your-proxy.workers.dev;
```

---

### How to rotate `IGNITE_SECRET`

1. Generate a new secret: `openssl rand -hex 32`
2. Update the proxy: `wrangler secret put IGNITE_SECRET` → enter new value → `wrangler deploy`
3. Update Firebase env: re-deploy your Firebase functions with the new secret value
4. Update your frontend `apiKey` option and redeploy your app
5. The old secret stops working immediately after step 2

---

### Debugging locally

```bash
# Run the proxy locally (requires wrangler + Rust toolchain)
cd packages/proxy
wrangler dev

# Test it directly
curl -X POST "http://localhost:8787/warm?fn=createProject" \
  -H "X-Ignite-Key: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"__ignite": true}'
# Expected: "Ignited"
```

---

## Development

```bash
pnpm install
pnpm build        # builds all JS packages
pnpm test         # runs all test suites (46 tests)

# Proxy tests (requires Rust)
cd packages/proxy && cargo test
```
