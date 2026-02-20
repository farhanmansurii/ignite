export interface IgniteOptions {
  proxyUrl: string;
  apiKey?: string;
  hoverTimeout?: number;
  onWarm?: (fnName: string, latency: number) => void;
  onError?: (err: any) => void;
}

const warmedFunctions = new Set<string>();

export const clearWarmCache = () => warmedFunctions.clear();

/**
 * Core signal logic. Framework agnostic.
 */
export const sendIgniteSignal = async (
  functionName: string,
  options: IgniteOptions
): Promise<void> => {
  if (warmedFunctions.has(functionName)) return;

  const start = Date.now();
  const url = `${options.proxyUrl}/warm?fn=${functionName}`;

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ __ignite: true })], { type: 'application/json' });
      const success = navigator.sendBeacon(url, blob);
      if (success) {
        warmedFunctions.add(functionName);
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

    warmedFunctions.add(functionName);
    options.onWarm?.(functionName, Date.now() - start);
  } catch (err) {
    options.onError?.(err);
  }
};
