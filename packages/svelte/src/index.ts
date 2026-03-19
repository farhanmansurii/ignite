import { sendIgniteSignal } from '@farhanmansuri/ignite-core';
export type { IgniteConfig } from '@farhanmansuri/ignite-core';
import type { IgniteConfig } from '@farhanmansuri/ignite-core';
import { setContext, getContext } from 'svelte';

const IGNITE_CONTEXT_KEY = Symbol('ignite');

/**
 * Set Ignite config in Svelte context so child components
 * using the `ignite` action inherit defaults.
 */
export const setIgniteConfig = (config: IgniteConfig): void => {
  setContext(IGNITE_CONTEXT_KEY, config);
};

const getIgniteConfig = (): IgniteConfig | null => {
  try {
    return getContext<IgniteConfig>(IGNITE_CONTEXT_KEY) ?? null;
  } catch {
    return null;
  }
};

/**
 * Svelte action for Ignite.
 * Pre-warms serverless functions on hover intent.
 *
 * @example
 * <button use:ignite={{ functionName: 'myFn', serverBaseURL: '...' }}>Click me</button>
 */
export interface IgniteActionParams {
  functionName: string;
  serverBaseURL?: string;
  apiKey?: string;
  hoverTimeout?: number;
  buildURL?: (serverBaseURL: string, functionName: string) => string;
  onWarm?: (fnName: string, latency: number) => void;
  onError?: (err: any) => void;
}

export const ignite = (node: HTMLElement, params: IgniteActionParams) => {
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  const contextConfig = getIgniteConfig();

  const mergeParams = (p: IgniteActionParams): IgniteActionParams & { serverBaseURL: string } => {
    const merged = { ...contextConfig, ...p };
    if (!merged.serverBaseURL) {
      throw new Error(
        'ignite action requires either setIgniteConfig() in a parent component or per-action serverBaseURL',
      );
    }
    return merged as IgniteActionParams & { serverBaseURL: string };
  };

  let currentParams = mergeParams(params);

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
      currentParams = mergeParams(newParams);
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
