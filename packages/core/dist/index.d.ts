interface IgniteOptions {
    proxyUrl: string;
    apiKey?: string;
    hoverTimeout?: number;
    onWarm?: (fnName: string, latency: number) => void;
    onError?: (err: any) => void;
}
declare const clearWarmCache: () => void;
/**
 * Core signal logic. Framework agnostic.
 */
declare const sendIgniteSignal: (functionName: string, options: IgniteOptions) => Promise<void>;

export { type IgniteOptions, clearWarmCache, sendIgniteSignal };
