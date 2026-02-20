import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { Request, Response } from "express";

interface IgniteData {
  __ignite?: boolean;
}

/**
 * igniteWrapper for onCall (Callable)
 */
export function igniteWrapper<T = any, R = any>(
  handler: (request: CallableRequest<T>) => R | Promise<R>,
  secret: string
) {
  return onCall<T>(async (request) => {
    const isWarmingHeader = request.rawRequest?.headers['x-ignite-warm'] === 'true';
    const data = request.data as IgniteData;
    const isWarmingData = data?.__ignite === true;
    const providedSecret = request.rawRequest?.headers['x-ignite-key'];

    if ((isWarmingHeader || isWarmingData) && providedSecret === secret) {
      return { status: "ignited" } as any;
    }

    return handler(request);
  });
}

/**
 * igniteMiddleware for onRequest (HTTP)
 */
export function igniteMiddleware(
  handler: (req: Request, res: Response) => void | Promise<void>,
  secret: string
) {
  return async (req: Request, res: Response) => {
    if (
      req.headers['x-ignite-warm'] === 'true' && 
      req.headers['x-ignite-key'] === secret
    ) {
      res.json({ status: "ignited" });
      return;
    }
    return handler(req, res);
  };
}
