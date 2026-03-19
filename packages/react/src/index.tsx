import React, { createContext, useContext, useCallback, useRef, useMemo, useEffect } from 'react';
import type { ReactNode, FC } from 'react';
import { sendIgniteSignal } from '@farhanmansuri/ignite-core';
export type { IgniteConfig } from '@farhanmansuri/ignite-core';
import type { IgniteConfig } from '@farhanmansuri/ignite-core';

// 3.1 — Context
const IgniteContext = createContext<IgniteConfig | null>(null);

// 3.2 — Provider
interface IgniteProviderProps extends IgniteConfig {
  children: ReactNode;
}

export const IgniteProvider: FC<IgniteProviderProps> = ({ children, ...config }) => {
  return <IgniteContext.Provider value={config}>{children}</IgniteContext.Provider>;
};

// 3.3 — Hook (reads from context, merges with per-call overrides)
export const useIgnite = (functionName: string, options?: Partial<IgniteConfig>) => {
  const ctx = useContext(IgniteContext);

  // 3.4 — Validation
  const serverBaseURL = options?.serverBaseURL ?? ctx?.serverBaseURL;
  if (!serverBaseURL) {
    throw new Error(
      'useIgnite requires either an IgniteProvider or per-call options with serverBaseURL'
    );
  }

  // Merge: context as defaults, per-call options override
  const merged: IgniteConfig = {
    ...ctx,
    ...options,
    serverBaseURL,
  };

  const hoverTimeoutRef = useRef<number | null>(null);

  // Use refs for callbacks to prevent re-renders when inline functions are passed
  const onWarmRef = useRef(merged.onWarm);
  const onErrorRef = useRef(merged.onError);

  useEffect(() => {
    onWarmRef.current = merged.onWarm;
    onErrorRef.current = merged.onError;
  }, [merged.onWarm, merged.onError]);

  // Stable options object
  const memoizedOptions = useMemo(() => ({
    ...merged,
    onWarm: (fn: string, lat: number) => onWarmRef.current?.(fn, lat),
    onError: (err: any) => onErrorRef.current?.(err),
  }), [merged.serverBaseURL, merged.apiKey, merged.hoverTimeout, merged.buildURL]);

  const ignite = useCallback(() => {
    sendIgniteSignal(functionName, memoizedOptions);
  }, [functionName, memoizedOptions]);

  const onMouseEnter = useCallback(() => {
    hoverTimeoutRef.current = window.setTimeout(ignite, memoizedOptions.hoverTimeout ?? 150);
  }, [ignite, memoizedOptions.hoverTimeout]);

  const onMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const onFocus = useCallback(() => ignite(), [ignite]);
  const onTouchStart = useCallback(() => ignite(), [ignite]);

  return {
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onTouchStart,
  };
};
