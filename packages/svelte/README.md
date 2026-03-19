# @farhanmansuri/ignite-svelte

Svelte action for [Ignite](https://github.com/farhanmansurii/ignite) -- eliminates serverless cold starts by pre-warming functions on hover intent.

## Install

```bash
npm install @farhanmansuri/ignite-svelte @farhanmansuri/ignite-core
```

## Usage

Set config in a parent component, then use the `ignite` action:

```svelte
<!-- App.svelte -->
<script>
  import { setIgniteConfig } from '@farhanmansuri/ignite-svelte';

  setIgniteConfig({
    serverBaseURL: 'https://us-central1-myapp.cloudfunctions.net',
  });
</script>

<slot />
```

```svelte
<!-- CreateProject.svelte -->
<script>
  import { ignite } from '@farhanmansuri/ignite-svelte';
</script>

<button use:ignite={{ functionName: 'createProject' }} on:click={handleSubmit}>
  Create Project
</button>
```

When the user hovers for 150ms, a warm signal fires. By the time they click, the function is already warm.

## Links

- [Main repository](https://github.com/farhanmansurii/ignite)
- [npm](https://www.npmjs.com/package/@farhanmansuri/ignite-svelte)
