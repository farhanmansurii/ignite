# @farhanmansuri/ignite-svelte

Svelte action for [Ignite](https://github.com/farhanmansurii/ignite) — pre-warms serverless functions on hover intent to eliminate cold starts.

## Installation

```bash
npm install @farhanmansuri/ignite-svelte @farhanmansuri/ignite-core
# peer dep
npm install svelte
```

## Usage

```svelte
<script>
  import { ignite } from '@farhanmansuri/ignite-svelte';

  const igniteParams = {
    functionName: 'processPayment',
    proxyUrl: 'https://your-ignite-proxy.workers.dev',
    onWarm: (fn, latency) => console.log(`${fn} warmed in ${latency}ms`),
  };

  function handleClick() {
    // By the time the user clicks, the function is already warm
  }
</script>

<button use:ignite={igniteParams} on:click={handleClick}>
  Submit
</button>
```

## API

### `ignite(node, params)` — Svelte Action

| Parameter | Type | Description |
|---|---|---|
| `params.functionName` | `string` | Name of the serverless function to pre-warm |
| `params.proxyUrl` | `string` | URL of your Ignite proxy |
| `params.apiKey` | `string?` | Optional shared secret for proxy auth |
| `params.hoverTimeout` | `number?` | Milliseconds of hover before firing (default: `150`) |
| `params.onWarm` | `(fn, latency) => void` | Callback when function is warmed |
| `params.onError` | `(err) => void` | Callback on error |

The action attaches `mouseenter`, `mouseleave`, `focus`, and `touchstart` listeners. All listeners are removed on `destroy` and the pending timeout is cleared automatically.

## License

MIT
