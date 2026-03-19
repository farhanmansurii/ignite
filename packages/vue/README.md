# @farhanmansuri/ignite-vue

Vue 3 composable for [Ignite](https://github.com/farhanmansurii/ignite) -- eliminates serverless cold starts by pre-warming functions on hover intent.

## Install

```bash
npm install @farhanmansuri/ignite-vue @farhanmansuri/ignite-core
```

## Usage

Register the plugin, then use `useIgnite` in any component:

```ts
// main.ts
import { createApp } from 'vue';
import { createIgnitePlugin } from '@farhanmansuri/ignite-vue';

const app = createApp(App);
app.use(createIgnitePlugin({
  serverBaseURL: 'https://us-central1-myapp.cloudfunctions.net',
}));
```

```vue
<template>
  <button @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" @click="submit">
    Create Project
  </button>
</template>

<script setup lang="ts">
import { useIgnite } from '@farhanmansuri/ignite-vue';

const { onMouseEnter, onMouseLeave } = useIgnite('createProject');
</script>
```

When the user hovers for 150ms, a warm signal fires. By the time they click, the function is already warm.

## Links

- [Main repository](https://github.com/farhanmansurii/ignite)
- [npm](https://www.npmjs.com/package/@farhanmansuri/ignite-vue)
