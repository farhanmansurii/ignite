"use strict";
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
  igniteMiddleware: () => igniteMiddleware,
  igniteWrapper: () => igniteWrapper
});
module.exports = __toCommonJS(index_exports);
var import_https = require("firebase-functions/v2/https");
function igniteWrapper(handler, secret) {
  return (0, import_https.onCall)(async (request) => {
    var _a, _b;
    const isWarmingHeader = ((_a = request.rawRequest) == null ? void 0 : _a.headers["x-ignite-warm"]) === "true";
    const data = request.data;
    const isWarmingData = (data == null ? void 0 : data.__ignite) === true;
    const providedSecret = (_b = request.rawRequest) == null ? void 0 : _b.headers["x-ignite-key"];
    if ((isWarmingHeader || isWarmingData) && providedSecret === secret) {
      return { status: "ignited" };
    }
    return handler(request);
  });
}
function igniteMiddleware(handler, secret) {
  return async (req, res) => {
    if (req.headers["x-ignite-warm"] === "true" && req.headers["x-ignite-key"] === secret) {
      res.json({ status: "ignited" });
      return;
    }
    return handler(req, res);
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  igniteMiddleware,
  igniteWrapper
});
