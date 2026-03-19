# @farhanmansuri/ignite-firebase

Firebase middleware for [Ignite](https://github.com/farhanmansurii/ignite) -- detects warm-up signals and exits early, keeping your container alive without running business logic.

## Install

```bash
npm install @farhanmansuri/ignite-firebase
```

## Usage

### onCall functions

```ts
import { igniteWrapper } from '@farhanmansuri/ignite-firebase';

export const createProject = igniteWrapper(async (request) => {
  // Your logic -- only runs on real calls, never on warm signals
  return { success: true };
}, process.env.IGNITE_SECRET);
```

### onRequest (HTTP) functions

```ts
import { igniteMiddleware } from '@farhanmansuri/ignite-firebase';

export const processPayment = igniteMiddleware(async (req, res) => {
  // Your logic
  res.json({ success: true });
}, process.env.IGNITE_SECRET);
```

When a warm signal arrives (`X-Ignite-Warm: true` header or `{ __ignite: true }` body), the middleware returns `{ status: "ignited" }` immediately. The container wakes up but your business logic is never executed.

## Links

- [Main repository](https://github.com/farhanmansurii/ignite)
- [npm](https://www.npmjs.com/package/@farhanmansuri/ignite-firebase)
