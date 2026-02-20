// src/index.ts
import { useCallback, useRef, useMemo, useEffect } from "react";
import { sendIgniteSignal } from "@farhanmansuri/ignite-core";
var useIgnite = (functionName, options) => {
  const hoverTimeoutRef = useRef(null);
  const onWarmRef = useRef(options.onWarm);
  const onErrorRef = useRef(options.onError);
  useEffect(() => {
    onWarmRef.current = options.onWarm;
    onErrorRef.current = options.onError;
  }, [options.onWarm, options.onError]);
  const memoizedOptions = useMemo(() => ({
    ...options,
    onWarm: (fn, lat) => {
      var _a;
      return (_a = onWarmRef.current) == null ? void 0 : _a.call(onWarmRef, fn, lat);
    },
    onError: (err) => {
      var _a;
      return (_a = onErrorRef.current) == null ? void 0 : _a.call(onErrorRef, err);
    }
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
    onTouchStart
  };
};
export {
  useIgnite
};
