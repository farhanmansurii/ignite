import { sendIgniteSignal, IgniteOptions } from '@farhanmansuri/ignite-core';

/**
 * Svelte action for Ignite.
 * Pre-warms serverless functions on hover intent.
 *
 * @example
 * <button use:ignite={{ functionName: 'myFn', proxyUrl: '...' }}>Click me</button>
 */
export interface IgniteActionParams extends IgniteOptions {
  functionName: string;
}

export const ignite = (node: HTMLElement, params: IgniteActionParams) => {
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  let currentParams = params;

  const fire = () => {
    sendIgniteSignal(currentParams.functionName, currentParams);
  };

  const handleMouseEnter = () => {
    hoverTimeout = setTimeout(fire, currentParams.hoverTimeout ?? 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout !== null) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  };

  const handleFocus = () => fire();
  const handleTouchStart = () => fire();

  node.addEventListener('mouseenter', handleMouseEnter);
  node.addEventListener('mouseleave', handleMouseLeave);
  node.addEventListener('focus', handleFocus);
  node.addEventListener('touchstart', handleTouchStart);

  return {
    update(newParams: IgniteActionParams) {
      currentParams = newParams;
    },
    destroy() {
      if (hoverTimeout !== null) {
        clearTimeout(hoverTimeout);
      }
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
      node.removeEventListener('focus', handleFocus);
      node.removeEventListener('touchstart', handleTouchStart);
    },
  };
};
