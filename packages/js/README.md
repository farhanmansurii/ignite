# @farhanmansuri/ignite-js

Vanilla JavaScript client for warming serverless functions on user intent — no framework required.

## Install

```bash
npm install @farhanmansuri/ignite-js
```

## Usage

```js
import { configureIgnite } from '@farhanmansuri/ignite-js'

const ignite = configureIgnite({
  serverBaseURL: 'https://your-serverless-backend.com',
  apiKey: 'optional-secret',
})

// Warm a function before the user needs it
document.querySelector('#submit-btn').addEventListener('mouseenter', () => {
  ignite.warm('createProject')
})
```

## API

- `configureIgnite(config)` — Create a configured ignite instance
- `ignite.warm(functionName)` — Send a warm signal
- `ignite.warmMany(functionNames)` — Warm multiple functions
- `ignite.isWarmed(functionName)` — Check if already warmed
- `sendIgniteSignal(functionName, options)` — Low-level signal function
- `clearWarmCache()` — Reset the warm cache

For full documentation, see the [main repository](https://github.com/farhanmansurii/ignite).
