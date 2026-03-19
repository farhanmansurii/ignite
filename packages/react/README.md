# @farhanmansuri/ignite-react

React hook for [Ignite](https://github.com/farhanmansurii/ignite) -- eliminates serverless cold starts by pre-warming functions on hover intent.

## Install

```bash
npm install @farhanmansuri/ignite-react @farhanmansuri/ignite-core
```

## Usage

Wrap your app with `IgniteProvider`, then use `useIgnite` in any component:

```tsx
import { IgniteProvider, useIgnite } from '@farhanmansuri/ignite-react';

// In your app root
function App() {
  return (
    <IgniteProvider serverBaseURL="https://us-central1-myapp.cloudfunctions.net">
      <CreateProjectButton />
    </IgniteProvider>
  );
}

// In any child component
function CreateProjectButton() {
  const ignite = useIgnite('createProject');

  return (
    <button {...ignite} onClick={handleSubmit}>
      Create Project
    </button>
  );
}
```

Spreading `{...ignite}` attaches `onMouseEnter`, `onMouseLeave`, `onFocus`, and `onTouchStart` handlers automatically. When the user hovers for 150ms, a warm signal fires. By the time they click, the function is already warm.

## Links

- [Main repository](https://github.com/farhanmansurii/ignite)
- [npm](https://www.npmjs.com/package/@farhanmansuri/ignite-react)
