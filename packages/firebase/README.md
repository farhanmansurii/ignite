# @farhanmansuri/ignite-firebase

Firebase middleware for [Ignite](https://github.com/farhanmansurii/ignite) — detects pre-warm signals and exits early, keeping your container alive without running business logic or hitting your billing.

## Install

```bash
npm install @farhanmansuri/ignite-firebase
```

## Usage

### `onCall` functions

```ts
import { igniteWrapper } from '@farhanmansuri/ignite-firebase';

export const createProject = igniteWrapper(async (request) => {
  // your real logic — only runs on actual calls
  const { name, location } = request.data;
  return { success: true };
}, process.env.IGNITE_SECRET);
```

### `onRequest` (HTTP) functions

```ts
import { igniteMiddleware } from '@farhanmansuri/ignite-firebase';

export const processPayment = igniteMiddleware(async (req, res) => {
  // your real logic
  res.json({ success: true });
}, process.env.IGNITE_SECRET);
```

## How it works

When the Ignite proxy sends a warm-up signal, it includes:
- `X-Ignite-Warm: true` header
- `X-Ignite-Key: <secret>` header
- `{ __ignite: true }` in the request body

The middleware verifies the secret and returns `{ status: "ignited" }` immediately — the container spins up but your database, auth, and business logic are never touched.

On a real user request (no warm headers), control passes through to your handler as normal.

## API

### `igniteWrapper<T, R>(handler, secret)`

Wraps a Firebase `onCall` handler. Generic over request data `T` and response `R`.

### `igniteMiddleware(handler, secret)`

Wraps a Firebase `onRequest` handler. Uses Express `Request` / `Response` types.

## Part of the Ignite monorepo

| Package | Description |
|---|---|
| `@farhanmansuri/ignite-core` | Framework-agnostic signal logic |
| `@farhanmansuri/ignite-react` | React hook (`useIgnite`) |
| `@farhanmansuri/ignite-firebase` | This package |
