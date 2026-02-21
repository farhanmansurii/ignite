import { ref, onUnmounted } from 'vue';
import { sendIgniteSignal, IgniteOptions } from '@farhanmansuri/ignite-core';

/**
 * Vue 3 composable for Ignite.
 * Pre-warms serverless functions on hover intent.
 *
 * @example
 * const { onMouseEnter, onMouseLeave } = useIgnite('myFunction', { proxyUrl: '...' });
 */
export const useIgnite = (functionName: string, options: IgniteOptions) => {
  const hoverTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

  const ignite = () => {
    sendIgniteSignal(functionName, options);
  };

  const onMouseEnter = () => {
    hoverTimeout.value = setTimeout(ignite, options.hoverTimeout ?? 150);
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
