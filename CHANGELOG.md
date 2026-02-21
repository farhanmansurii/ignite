# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- TTL cache (5-minute expiry) in `@farhanmansuri/ignite-core` — re-fires after TTL, skips within window
- `isWarmed(functionName)` helper for inspecting cache state
- `sendIgniteSignals(fnNames[], options)` batch warming for multiple functions
- Input validation: warns and calls `onError` if `proxyUrl` or `functionName` is empty
- `@farhanmansuri/ignite-vue` — Vue 3 composable with `onUnmounted` cleanup
- `@farhanmansuri/ignite-svelte` — Svelte `use:ignite` action with full lifecycle cleanup
- Vitest test suites for `core`, `react`, and `firebase` packages
- GitHub Actions CI workflow (push to master + PRs)
- GitHub Actions publish workflow (on `v*` tag push with npm provenance)
- MIT `LICENSE` file
- `description` and `license` fields in all `package.json` files

---

## [1.0.3] — 2026-02-21

### Added
- `onFocus` and `onTouchStart` handlers in `@farhanmansuri/ignite-react`
- Stable callback refs pattern in React hook — changing `onWarm`/`onError` no longer recreates handlers
- `igniteWrapper` for Firebase `onCall` (Callable functions)
- `igniteMiddleware` for Firebase `onRequest` (HTTP functions)
- Exact-match allowlist in proxy for security hardening
- `X-Ignite-Key` secret verification in both proxy and Firebase packages

### Changed
- Warm cache upgraded to module-level (persists across hook instances for same function)
- `sendBeacon` is now the primary transport; `fetch` used as fallback

---

## [1.0.2] — 2026-02-21

### Added
- `@farhanmansuri/ignite-firebase` package — type-safe early-exit middleware
- Dual export (CJS + ESM) with `.d.ts` and `.d.mts` type declarations

### Fixed
- Build: switched from `tsc` to `tsup` for reliable DTS generation

---

## [1.0.1] — 2026-02-21

### Added
- `@farhanmansuri/ignite-react` package split from core
- `useMemo` stable options object to prevent unnecessary re-renders

---

## [1.0.0] — 2026-02-21

### Added
- Initial release of `@farhanmansuri/ignite-core`
- Framework-agnostic `sendIgniteSignal` with `sendBeacon` + `fetch` fallback
- Module-level warm cache (`Set<string>`) with `clearWarmCache`
- `IgniteOptions` interface: `proxyUrl`, `apiKey`, `hoverTimeout`, `onWarm`, `onError`
