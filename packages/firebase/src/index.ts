import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { Request, Response } from "express";

interface IgniteData {
  __ignite?: boolean;
}

// Normalize header lookup to be case-insensitive. Node.js lowercases headers
// from the HTTP layer, but middleware or test stubs may not.
const getHeader = (
  headers: Record<string, string | string[] | undefined>,
  name: string
): string => {
  const lower = name.toLowerCase();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === lower);
  return key ? String(headers[key] ?? '') : '';
};

const isWarmHeader = (headers: Record<string, string | string[] | undefined>): boolean =>
  getHeader(headers, 'x-ignite-warm').toLowerCase() === 'true';

const getSecret = (headers: Record<string, string | string[] | undefined>): string =>
  getHeader(headers, 'x-ignite-key');

/**
 * igniteWrapper for onCall (Callable)
 */
export function igniteWrapper<T = any, R = any>(
  handler: (request: CallableRequest<T>) => R | Promise<R>,
  secret: string
) {
  return onCall<T>(async (request) => {
    const headers = request.rawRequest?.headers ?? {};
    const isWarmingHeader = isWarmHeader(headers);
    const data = request.data as IgniteData;
    const isWarmingData = data?.__ignite === true;
    const providedSecret = getSecret(headers);

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
      isWarmHeader(req.headers) &&
      getSecret(req.headers) === secret
    ) {
      res.json({ status: "ignited" });
      return;
    }
    return handler(req, res);
  };
}
