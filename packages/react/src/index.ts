import { useCallback, useRef, useMemo, useEffect } from 'react';
import { sendIgniteSignal, IgniteOptions } from '@farhanmansuri/ignite-core';

export const useIgnite = (functionName: string, options: IgniteOptions) => {
  const hoverTimeoutRef = useRef<number | null>(null);
  
  // Use refs for callbacks to prevent re-renders when inline functions are passed
  const onWarmRef = useRef(options.onWarm);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onWarmRef.current = options.onWarm;
    onErrorRef.current = options.onError;
  }, [options.onWarm, options.onError]);

  // Stable options object
  const memoizedOptions = useMemo(() => ({
    ...options,
    onWarm: (fn: string, lat: number) => onWarmRef.current?.(fn, lat),
    onError: (err: any) => onErrorRef.current?.(err),
  }), [options.proxyUrl, options.apiKey, options.hoverTimeout]);

  const ignite = useCallback(() => {
    sendIgniteSignal(functionName, memoizedOptions);
  }, [functionName, memoizedOptions]);

  const onMouseEnter = useCallback(() => {
    hoverTimeoutRef.current = window.setTimeout(ignite, memoizedOptions.hoverTimeout ?? 150);
  }, [ignite, memoizedOptions.hoverTimeout]);

  const onMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
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
