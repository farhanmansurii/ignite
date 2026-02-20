# @farhanmansuri/ignite-react

React hook for [Ignite](https://github.com/farhanmansurii/ignite) — eliminates serverless cold starts by pre-warming Cloud Functions on hover intent.

## Install

```bash
npm install @farhanmansuri/ignite-react @farhanmansuri/ignite-core
```

## Usage

```tsx
import { useIgnite } from '@farhanmansuri/ignite-react';

function CreateProjectButton({ onClick }) {
  const ignite = useIgnite('createProject', {
    proxyUrl: 'https://your-proxy.workers.dev',
    apiKey: 'your-secret',
    onWarm: (fn, ms) => console.log(`${fn} warmed in ${ms}ms`),
  });

  return (
    <button {...ignite} onClick={onClick}>
      Create Project
    </button>
  );
}
```

Spread `{...ignite}` onto any element to attach `onMouseEnter`, `onMouseLeave`, `onFocus`, and `onTouchStart` handlers automatically.

## How it works

1. User hovers for >150ms → `onMouseEnter` fires the warm-up signal
2. On mobile → `onTouchStart` fires immediately (no delay)
3. On keyboard navigation → `onFocus` fires immediately
4. `onMouseLeave` cancels the timeout if the user moves away before 150ms
5. Once warmed, the function is cached globally — subsequent hovers are no-ops

## API

### `useIgnite(functionName, options)`

| Option | Type | Required | Description |
|---|---|---|---|
| `proxyUrl` | `string` | ✅ | URL of your deployed proxy worker |
| `apiKey` | `string` | — | Shared secret (`X-Ignite-Key`) |
| `hoverTimeout` | `number` | — | Intent threshold in ms (default: `150`) |
| `onWarm` | `(fn, ms) => void` | — | Called after signal is sent |
| `onError` | `(err) => void` | — | Called if signal fails |

Returns `{ onMouseEnter, onMouseLeave, onFocus, onTouchStart }`.

## Part of the Ignite monorepo

| Package | Description |
|---|---|
| `@farhanmansuri/ignite-core` | Framework-agnostic signal logic |
| `@farhanmansuri/ignite-react` | This package |
| `@farhanmansuri/ignite-firebase` | Firebase early-exit middleware |
