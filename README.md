# Ignite

[![npm version](https://img.shields.io/npm/v/@farhanmansuri/ignite-core.svg)](https://www.npmjs.com/package/@farhanmansuri/ignite-core)
[![CI](https://github.com/farhanmansurii/ignite/actions/workflows/ci.yml/badge.svg)](https://github.com/farhanmansurii/ignite/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Serverless cold starts add seconds of latency. Ignite warms your functions before the user clicks.**

When a user hovers over a button, Ignite sends a lightweight warm-up signal to your serverless backend. By the time they click, the container is already hot -- zero cold start.

---

## Quick Start

### React

```bash
npm install @farhanmansuri/ignite-react @farhanmansuri/ignite-core
```

```tsx
import { IgniteProvider, useIgnite } from '@farhanmansuri/ignite-react';

function App() {
  return (
    <IgniteProvider serverBaseURL="https://us-central1-myapp.cloudfunctions.net">
      <CreateProjectButton />
    </IgniteProvider>
  );
}

function CreateProjectButton() {
  const ignite = useIgnite('createProject');
  return <button {...ignite} onClick={handleSubmit}>Create Project</button>;
}
```

### Vue 3

```bash
npm install @farhanmansuri/ignite-vue @farhanmansuri/ignite-core
```

```ts
// main.ts
import { createIgnitePlugin } from '@farhanmansuri/ignite-vue';
app.use(createIgnitePlugin({ serverBaseURL: 'https://us-central1-myapp.cloudfunctions.net' }));
```

```vue
<template>
  <button @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" @click="submit">
    Create Project
  </button>
</template>

<script setup>
import { useIgnite } from '@farhanmansuri/ignite-vue';
const { onMouseEnter, onMouseLeave } = useIgnite('createProject');
</script>
```

### Svelte

```bash
npm install @farhanmansuri/ignite-svelte @farhanmansuri/ignite-core
```

```svelte
<script>
  import { ignite } from '@farhanmansuri/ignite-svelte';
</script>

<button use:ignite={{ functionName: 'createProject', serverBaseURL: 'https://us-central1-myapp.cloudfunctions.net' }} on:click={handleSubmit}>
  Create Project
</button>
```

### Vanilla JS

```bash
npm install @farhanmansuri/ignite-js
```

```js
import { configureIgnite } from '@farhanmansuri/ignite-js';

const ignite = configureIgnite({
  serverBaseURL: 'https://us-central1-myapp.cloudfunctions.net',
});

document.querySelector('#submit-btn').addEventListener('mouseenter', () => {
  ignite.warm('createProject');
});
```

---

## How It Works

```
1. User hovers over a button       (intent detected)
2. Ignite sends a warm-up signal   (sendBeacon -- non-blocking)
3. Serverless function receives it  (container spins up)
4. User clicks                      (function is already warm)
5. Response is instant              (no cold start)
```

The warm signal sends `{ __ignite: true }` in the POST body. Your server detects this and returns early -- the container is now warm but no business logic runs.

---

## Server-Side Detection

Any serverless function can detect and short-circuit warm signals:

```js
// Express / any Node.js server
app.post('/myFunction', (req, res) => {
  if (req.body?.__ignite) {
    return res.json({ status: 'ignited' });
  }
  // ... your actual function logic
});
```

This works with any backend -- Firebase, AWS Lambda, Vercel, Railway, or a plain Express server. The client sends a POST with `__ignite: true`; the server checks for it and exits early.

---

## Packages

| Package | Description |
|---|---|
| [`@farhanmansuri/ignite-core`](packages/core) | Framework-agnostic signal logic (sendBeacon + fetch fallback, 5-min warm cache) |
| [`@farhanmansuri/ignite-react`](packages/react) | React hook -- `IgniteProvider` + `useIgnite` |
| [`@farhanmansuri/ignite-vue`](packages/vue) | Vue 3 composable -- `createIgnitePlugin` + `useIgnite` |
| [`@farhanmansuri/ignite-svelte`](packages/svelte) | Svelte action -- `setIgniteConfig` + `use:ignite` |
| [`@farhanmansuri/ignite-js`](packages/js) | Vanilla JS -- `configureIgnite` + `warm` |
| [`@farhanmansuri/ignite-firebase`](packages/firebase) | Firebase middleware for early-exit warm detection |
| [`@farhanmansuri/ignite-proxy`](packages/proxy) | Rust/Wasm Cloudflare Worker with auth, allowlist, and rate limiting |

---

## Advanced

### Firebase Middleware

If you use Firebase Cloud Functions, the `@farhanmansuri/ignite-firebase` package provides drop-in wrappers:

```ts
import { igniteWrapper, igniteMiddleware } from '@farhanmansuri/ignite-firebase';

// onCall
export const createProject = igniteWrapper(async (req) => {
  // your logic -- skipped on warm signals
}, process.env.IGNITE_SECRET);

// onRequest
export const processPayment = igniteMiddleware(async (req, res) => {
  res.json({ success: true });
}, process.env.IGNITE_SECRET);
```

### Edge Proxy

For production setups that need auth, allowlisting, and rate limiting, deploy `@farhanmansuri/ignite-proxy` -- a Rust Cloudflare Worker that sits between your frontend and backend:

```bash
cd packages/proxy
wrangler secret put IGNITE_SECRET
wrangler secret put FIREBASE_BASE_URL
wrangler secret put ALLOWED_FUNCTIONS   # comma-separated: createProject,processPayment
wrangler deploy
```

Then point `serverBaseURL` at your proxy URL instead of directly at your backend.

---

## Development

```bash
pnpm install
pnpm build
pnpm test

# Proxy tests (requires Rust)
cd packages/proxy && cargo test
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines.

---

## License

[MIT](./LICENSE)
