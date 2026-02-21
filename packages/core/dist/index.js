var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
  clearWarmCache: () => clearWarmCache,
  isWarmed: () => isWarmed,
  sendIgniteSignal: () => sendIgniteSignal,
  sendIgniteSignals: () => sendIgniteSignals
});
module.exports = __toCommonJS(index_exports);
var CACHE_TTL_MS = 5 * 60 * 1e3;
var warmedFunctions = /* @__PURE__ */ new Map();
var clearWarmCache = () => warmedFunctions.clear();
var isWarmed = (functionName) => {
  const ts = warmedFunctions.get(functionName);
  if (ts === void 0) return false;
  if (Date.now() - ts > CACHE_TTL_MS) {
    warmedFunctions.delete(functionName);
    return false;
  }
  return true;
};
var sendIgniteSignal = async (functionName, options) => {
  var _a, _b, _c, _d, _e;
  if (!options.proxyUrl) {
    console.warn("[Ignite] proxyUrl is required");
    (_a = options.onError) == null ? void 0 : _a.call(options, new Error("proxyUrl is required"));
    return;
  }
  if (!functionName) {
    console.warn("[Ignite] functionName is required");
    (_b = options.onError) == null ? void 0 : _b.call(options, new Error("functionName is required"));
    return;
  }
  if (isWarmed(functionName)) return;
  const start = Date.now();
  const url = `${options.proxyUrl}/warm?fn=${functionName}`;
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ __ignite: true })], { type: "application/json" });
      const success = navigator.sendBeacon(url, blob);
      if (success) {
        warmedFunctions.set(functionName, Date.now());
        (_c = options.onWarm) == null ? void 0 : _c.call(options, functionName, Date.now() - start);
        return;
      }
    }
    await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        ...options.apiKey && { "X-Ignite-Key": options.apiKey }
      },
      body: JSON.stringify({ __ignite: true })
    });
    warmedFunctions.set(functionName, Date.now());
    (_d = options.onWarm) == null ? void 0 : _d.call(options, functionName, Date.now() - start);
  } catch (err) {
    (_e = options.onError) == null ? void 0 : _e.call(options, err);
  }
};
var sendIgniteSignals = (fnNames, options) => {
  return Promise.all(fnNames.map((fn) => sendIgniteSignal(fn, options)));
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clearWarmCache,
  isWarmed,
  sendIgniteSignal,
  sendIgniteSignals
});
