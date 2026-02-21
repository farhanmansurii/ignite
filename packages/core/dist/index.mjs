// src/index.ts
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
export {
  clearWarmCache,
  isWarmed,
  sendIgniteSignal,
  sendIgniteSignals
};
