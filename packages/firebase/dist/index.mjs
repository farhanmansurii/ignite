// src/index.ts
import { onCall } from "firebase-functions/v2/https";
function igniteWrapper(handler, secret) {
  return onCall(async (request) => {
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
export {
  igniteMiddleware,
  igniteWrapper
};
