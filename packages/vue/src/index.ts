import { ref, inject, onUnmounted, type InjectionKey, type Plugin } from 'vue';
import { sendIgniteSignal } from '@farhanmansuri/ignite-core';
export type { IgniteConfig } from '@farhanmansuri/ignite-core';
import type { IgniteConfig } from '@farhanmansuri/ignite-core';

/**
 * Injection key used by the Ignite Vue plugin to provide config
 * to all descendant components via provide/inject.
 */
export const IGNITE_INJECTION_KEY: InjectionKey<IgniteConfig> = Symbol('ignite');

/**
 * Creates a Vue plugin that provides IgniteConfig to all components.
 *
 * @example
 * const app = createApp(App);
 * app.use(createIgnitePlugin({ serverBaseURL: 'https://example.com' }));
 */
export const createIgnitePlugin = (config: IgniteConfig): Plugin => ({
  install(app) {
    app.provide(IGNITE_INJECTION_KEY, config);
  },
});

/**
 * Vue 3 composable for Ignite.
 * Pre-warms serverless functions on hover intent.
 *
 * Reads config from the Ignite plugin (if installed) and merges with
 * per-call options. Per-call options take precedence over plugin config.
 *
 * @example
 * // With plugin installed:
 * const { onMouseEnter, onMouseLeave } = useIgnite('myFunction');
 *
 * @example
 * // With per-call options:
 * const { onMouseEnter, onMouseLeave } = useIgnite('myFunction', { serverBaseURL: '...' });
 */
export const useIgnite = (functionName: string, options?: Partial<IgniteConfig>) => {
  const injectedConfig = inject(IGNITE_INJECTION_KEY, null);

  const mergedConfig = { ...injectedConfig, ...options } as IgniteConfig;

  if (!mergedConfig.serverBaseURL) {
    throw new Error(
      'useIgnite requires either the ignite plugin or per-call options with serverBaseURL',
    );
  }

  const hoverTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

  const ignite = () => {
    sendIgniteSignal(functionName, mergedConfig);
  };

  const onMouseEnter = () => {
    hoverTimeout.value = setTimeout(ignite, mergedConfig.hoverTimeout ?? 150);
  };

  const onMouseLeave = () => {
    if (hoverTimeout.value !== null) {
      clearTimeout(hoverTimeout.value);
      hoverTimeout.value = null;
    }
  };

  const onFocus = () => ignite();
  const onTouchStart = () => ignite();

  onUnmounted(() => {
    if (hoverTimeout.value !== null) {
      clearTimeout(hoverTimeout.value);
    }
  });

  return {
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onTouchStart,
  };
};
