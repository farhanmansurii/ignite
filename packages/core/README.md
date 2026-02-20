# @farhanmansuri/ignite-core

Framework-agnostic core logic for [Ignite](https://github.com/farhanmansurii/ignite) — a predictive pre-warming system that eliminates serverless cold starts.

## What it does

Sends a non-blocking warm-up signal to an edge proxy before the user clicks. Uses `navigator.sendBeacon` as the primary transport (fire-and-forget, survives tab close) with a `fetch` fallback. Maintains a module-level cache so each function is only warmed once per session.

## Install

```bash
npm install @farhanmansuri/ignite-core
```

## Usage

```ts
import { sendIgniteSignal, clearWarmCache } from '@farhanmansuri/ignite-core';

await sendIgniteSignal('createProject', {
  proxyUrl: 'https://your-proxy.workers.dev',
  apiKey: 'your-secret',
  onWarm: (fn, ms) => console.log(`${fn} warmed in ${ms}ms`),
  onError: (err) => console.error(err),
});
```

## API

### `sendIgniteSignal(functionName, options)`

| Option | Type | Required | Description |
|---|---|---|---|
| `proxyUrl` | `string` | ✅ | URL of your deployed `@farhanmansuri/ignite-proxy` worker |
| `apiKey` | `string` | — | Shared secret sent as `X-Ignite-Key` header |
| `hoverTimeout` | `number` | — | Delay in ms before firing signal (default: `150`) |
| `onWarm` | `(fn, ms) => void` | — | Called after signal is sent |
| `onError` | `(err) => void` | — | Called if signal fails |

### `clearWarmCache()`

Clears the module-level warm cache. Useful for testing.

## Part of the Ignite monorepo

| Package | Description |
|---|---|
| `@farhanmansuri/ignite-core` | This package |
| `@farhanmansuri/ignite-react` | React hook (`useIgnite`) |
| `@farhanmansuri/ignite-firebase` | Firebase early-exit middleware |
