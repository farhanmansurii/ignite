"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  useIgnite: () => useIgnite
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");
var import_ignite_core = require("@farhanmansuri/ignite-core");
var useIgnite = (functionName, options) => {
  const hoverTimeoutRef = (0, import_react.useRef)(null);
  const onWarmRef = (0, import_react.useRef)(options.onWarm);
  const onErrorRef = (0, import_react.useRef)(options.onError);
  (0, import_react.useEffect)(() => {
    onWarmRef.current = options.onWarm;
    onErrorRef.current = options.onError;
  }, [options.onWarm, options.onError]);
  const memoizedOptions = (0, import_react.useMemo)(() => __spreadProps(__spreadValues({}, options), {
    onWarm: (fn, lat) => {
      var _a;
      return (_a = onWarmRef.current) == null ? void 0 : _a.call(onWarmRef, fn, lat);
    },
    onError: (err) => {
      var _a;
      return (_a = onErrorRef.current) == null ? void 0 : _a.call(onErrorRef, err);
    }
  }), [options.proxyUrl, options.apiKey, options.hoverTimeout]);
  const ignite = (0, import_react.useCallback)(() => {
    (0, import_ignite_core.sendIgniteSignal)(functionName, memoizedOptions);
  }, [functionName, memoizedOptions]);
  const onMouseEnter = (0, import_react.useCallback)(() => {
    var _a;
    hoverTimeoutRef.current = window.setTimeout(ignite, (_a = memoizedOptions.hoverTimeout) != null ? _a : 150);
  }, [ignite, memoizedOptions.hoverTimeout]);
  const onMouseLeave = (0, import_react.useCallback)(() => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
  }, []);
  const onFocus = (0, import_react.useCallback)(() => ignite(), [ignite]);
  const onTouchStart = (0, import_react.useCallback)(() => ignite(), [ignite]);
  return {
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onTouchStart
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useIgnite
});
