// src/index.ts
var warmedFunctions = /* @__PURE__ */ new Set();
var clearWarmCache = () => warmedFunctions.clear();
var sendIgniteSignal = async (functionName, options) => {
  var _a, _b, _c;
  if (warmedFunctions.has(functionName)) return;
  const start = Date.now();
  const url = `${options.proxyUrl}/warm?fn=${functionName}`;
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ __ignite: true })], { type: "application/json" });
      const success = navigator.sendBeacon(url, blob);
      if (success) {
        warmedFunctions.add(functionName);
        (_a = options.onWarm) == null ? void 0 : _a.call(options, functionName, Date.now() - start);
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
    warmedFunctions.add(functionName);
    (_b = options.onWarm) == null ? void 0 : _b.call(options, functionName, Date.now() - start);
  } catch (err) {
    (_c = options.onError) == null ? void 0 : _c.call(options, err);
  }
};
export {
  clearWarmCache,
  sendIgniteSignal
};
