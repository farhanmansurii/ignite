# @farhanmansuri/ignite-core

Framework-agnostic core for [Ignite](https://github.com/farhanmansurii/ignite) -- eliminates serverless cold starts by sending warm-up signals before the user clicks.

## Install

```bash
npm install @farhanmansuri/ignite-core
```

## Usage

```ts
import { configureIgnite } from '@farhanmansuri/ignite-core';

const ignite = configureIgnite({
  serverBaseURL: 'https://us-central1-myapp.cloudfunctions.net',
});

// Warm a function
await ignite.warm('createProject');

// Warm multiple functions
await ignite.warmMany(['createProject', 'processPayment']);

// Check cache
ignite.isWarmed('createProject'); // true
```

### Low-level API

```ts
import { sendIgniteSignal, clearWarmCache } from '@farhanmansuri/ignite-core';

await sendIgniteSignal('createProject', {
  serverBaseURL: 'https://us-central1-myapp.cloudfunctions.net',
  onWarm: (fn, ms) => console.log(`${fn} warmed in ${ms}ms`),
});
```

## How it works

Uses `navigator.sendBeacon` (non-blocking, survives tab close) with a `fetch` fallback. Each function is cached for 5 minutes to avoid redundant signals.

## Links

- [Main repository](https://github.com/farhanmansurii/ignite)
- [npm](https://www.npmjs.com/package/@farhanmansuri/ignite-core)
