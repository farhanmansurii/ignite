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
  sendIgniteSignal: () => sendIgniteSignal
});
module.exports = __toCommonJS(index_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clearWarmCache,
  sendIgniteSignal
});
