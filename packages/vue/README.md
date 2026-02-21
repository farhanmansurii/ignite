# @farhanmansuri/ignite-vue

Vue 3 composable for [Ignite](https://github.com/farhanmansurii/ignite) — pre-warms serverless functions on hover intent to eliminate cold starts.

## Installation

```bash
npm install @farhanmansuri/ignite-vue @farhanmansuri/ignite-core
# peer dep
npm install vue
```

## Usage

```vue
<template>
  <button
    v-on="{ mouseenter: onMouseEnter, mouseleave: onMouseLeave }"
    @click="submitForm"
  >
    Submit
  </button>
</template>

<script setup lang="ts">
import { useIgnite } from '@farhanmansuri/ignite-vue';

const { onMouseEnter, onMouseLeave } = useIgnite('processPayment', {
  proxyUrl: 'https://your-ignite-proxy.workers.dev',
  onWarm: (fn, latency) => console.log(`${fn} warmed in ${latency}ms`),
});

function submitForm() {
  // By the time the user clicks, the function is already warm
}
</script>
```

## API

### `useIgnite(functionName, options)`

| Parameter | Type | Description |
|---|---|---|
| `functionName` | `string` | Name of the serverless function to pre-warm |
| `options.proxyUrl` | `string` | URL of your Ignite proxy |
| `options.apiKey` | `string?` | Optional shared secret for proxy auth |
| `options.hoverTimeout` | `number?` | Milliseconds of hover before firing (default: `150`) |
| `options.onWarm` | `(fn, latency) => void` | Callback when function is warmed |
| `options.onError` | `(err) => void` | Callback on error |

Returns: `{ onMouseEnter, onMouseLeave, onFocus, onTouchStart }`

The composable automatically cleans up any pending timeout on `onUnmounted`.

## License

MIT
