# Contributing to Ignite

Thank you for your interest in contributing to Ignite.

## Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **Rust** + **wrangler** (only needed for the `packages/proxy` package)

## Setup

```bash
git clone https://github.com/farhanmansurii/ignite.git
cd ignite
pnpm install
```

## Building

```bash
pnpm build
```

## Running Tests

```bash
# All packages
pnpm test

# Single package
pnpm --filter @farhanmansuri/ignite-core test
pnpm --filter @farhanmansuri/ignite-react test

# Proxy (Rust)
cd packages/proxy && cargo test
```

## Package Structure

| Package | Role |
|---|---|
| `packages/core` | Framework-agnostic signal logic (sendBeacon, fetch fallback, warm cache) |
| `packages/react` | Thin React adapter — IgniteProvider + useIgnite hook |
| `packages/vue` | Thin Vue 3 adapter — createIgnitePlugin + useIgnite composable |
| `packages/svelte` | Thin Svelte adapter — setIgniteConfig + use:ignite action |
| `packages/js` | Vanilla JS re-export of core's configureIgnite |
| `packages/firebase` | Express-compatible server middleware for early-exit warm detection |
| `packages/proxy` | Rust Cloudflare Worker — auth, allowlist, rate limiting |

## Pull Request Guidelines

1. Run `pnpm test` and ensure all tests pass before submitting.
2. Keep changes focused — one feature or fix per PR.
3. If adding a new package, follow the existing structure (src/index.ts, tsup config, vitest).
4. Update relevant README files if the public API changes.
5. The CI pipeline runs on every PR — make sure it passes.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
