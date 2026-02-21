var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

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
  const memoizedOptions = useMemo(() => __spreadProps(__spreadValues({}, options), {
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
    var _a;
    hoverTimeoutRef.current = window.setTimeout(ignite, (_a = memoizedOptions.hoverTimeout) != null ? _a : 150);
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
