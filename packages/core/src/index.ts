export interface IgniteOptions {
  proxyUrl: string;
  apiKey?: string;
  hoverTimeout?: number;
  onWarm?: (fnName: string, latency: number) => void;
  onError?: (err: any) => void;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Map from fnName → timestamp of when it was warmed
const warmedFunctions = new Map<string, number>();

export const clearWarmCache = () => warmedFunctions.clear();

/** Returns true if the function is warmed and not stale; evicts stale entries. */
export const isWarmed = (functionName: string): boolean => {
  const ts = warmedFunctions.get(functionName);
  if (ts === undefined) return false;
  if (Date.now() - ts > CACHE_TTL_MS) {
    warmedFunctions.delete(functionName);
    return false;
  }
  return true;
};

/**
 * Core signal logic. Framework agnostic.
 */
export const sendIgniteSignal = async (
  functionName: string,
  options: IgniteOptions
): Promise<void> => {
  if (!options.proxyUrl) {
    console.warn('[Ignite] proxyUrl is required');
    options.onError?.(new Error('proxyUrl is required'));
    return;
  }
  if (!functionName) {
    console.warn('[Ignite] functionName is required');
    options.onError?.(new Error('functionName is required'));
    return;
  }

  if (isWarmed(functionName)) return;

  const start = Date.now();
  const url = `${options.proxyUrl}/warm?fn=${functionName}`;

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ __ignite: true })], { type: 'application/json' });
      const success = navigator.sendBeacon(url, blob);
      if (success) {
        warmedFunctions.set(functionName, Date.now());
        // Note: For beacons, latency reflects transmission queuing, not execution.
        options.onWarm?.(functionName, Date.now() - start);
        return;
      }
    }

    await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        ...(options.apiKey && { 'X-Ignite-Key': options.apiKey }),
      },
      body: JSON.stringify({ __ignite: true }),
    });

    warmedFunctions.set(functionName, Date.now());
    options.onWarm?.(functionName, Date.now() - start);
  } catch (err) {
    options.onError?.(err);
  }
};

/**
 * Batch warming: fires parallel signals for multiple functions.
 */
export const sendIgniteSignals = (
  fnNames: string[],
  options: IgniteOptions
): Promise<void[]> => {
  return Promise.all(fnNames.map((fn) => sendIgniteSignal(fn, options)));
};
