# Ignite

**Eliminate serverless cold starts by bridging user hover intent with infrastructure pre-warming.**

Ignite detects when a user hovers over a button (150ms intent threshold), fires a non-blocking signal to a Rust edge proxy, which wakes up the target Cloud Function before the user even clicks.

---

## Architecture

```
User Hover → @farhanmansuri/ignite-react → @farhanmansuri/ignite-core (sendBeacon) → @farhanmansuri/ignite-proxy (Rust/CF Worker) → Firebase Function
                                                               ↑
                                                    Auth + Allowlist + ctx.wait_until
```

| Package | Description |
|---|---|
| `@farhanmansuri/ignite-core` | Framework-agnostic signal logic. `sendBeacon` primary, `fetch` fallback. Module-level warm cache. |
| `@farhanmansuri/ignite-react` | React hook with stable `useRef` callbacks, hover/focus/touch support. |
| `@farhanmansuri/ignite-proxy` | Rust/Wasm Cloudflare Worker. Shared-secret auth, exact-match function allowlist, `ctx.wait_until` for zero-latency response. |
| `@farhanmansuri/ignite-firebase` | Type-safe early-exit middleware for `onCall` and `onRequest` triggers. |

---

## Security

- **Shared secret** — `X-Ignite-Key` verified on the proxy and forwarded to the backend.
- **Exact-match allowlist** — `ALLOWED_FUNCTIONS` env var. `split(',').any(|s| s.trim() == name)` — no substring bypass.
- **Early exit** — backend verifies secret before returning `{ status: "ignited" }`, never touching business logic or billing.

---

## Setup

### 1. Deploy the Proxy

```bash
cd packages/proxy
wrangler secret put IGNITE_SECRET       # shared auth key
wrangler secret put FIREBASE_BASE_URL   # e.g. https://us-central1-your-project.cloudfunctions.net
wrangler secret put ALLOWED_FUNCTIONS   # e.g. createProject,processPayment,loginUser
wrangler deploy
```

### 2. Wrap your Firebase Function

```ts
import { igniteWrapper } from '@farhanmansuri/ignite-firebase';

// onCall
export const createProject = igniteWrapper(async (req) => {
  // your logic
}, process.env.IGNITE_SECRET);

// onRequest
export const processPayment = igniteMiddleware(async (req, res) => {
  // your logic
}, process.env.IGNITE_SECRET);
```

### 3. Add to your React component

```tsx
import { useIgnite } from '@farhanmansuri/ignite-react';

const ignite = useIgnite('createProject', {
  proxyUrl: 'https://your-proxy.workers.dev',
  apiKey: process.env.IGNITE_SECRET,
  onWarm: (fn, ms) => console.log(`${fn} warmed in ${ms}ms`),
  onError: (err) => reportToSentry(err),
});

<button {...ignite} onClick={handleSubmit}>
  Create Project
</button>
```

---

## How it works

1. User hovers over the button for >150ms — `onMouseEnter` fires (also `onFocus` for keyboard, `onTouchStart` for mobile)
2. `sendBeacon` queues a POST to the Rust proxy — non-blocking, survives tab close
3. Proxy authenticates the request, checks the allowlist, then fires `ctx.wait_until` — returns `200 OK` immediately
4. Firebase function receives the `__ignite: true` signal, verifies the secret, and returns early — container is now warm
5. When the user clicks, the real request hits a warm container — 0ms cold start

---

## Development

```bash
pnpm install
pnpm build        # builds all packages
```
