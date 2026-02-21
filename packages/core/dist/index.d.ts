interface IgniteOptions {
    proxyUrl: string;
    apiKey?: string;
    hoverTimeout?: number;
    onWarm?: (fnName: string, latency: number) => void;
    onError?: (err: any) => void;
}
declare const clearWarmCache: () => void;
/** Returns true if the function is warmed and not stale; evicts stale entries. */
declare const isWarmed: (functionName: string) => boolean;
/**
 * Core signal logic. Framework agnostic.
 */
declare const sendIgniteSignal: (functionName: string, options: IgniteOptions) => Promise<void>;
/**
 * Batch warming: fires parallel signals for multiple functions.
 */
declare const sendIgniteSignals: (fnNames: string[], options: IgniteOptions) => Promise<void[]>;

export { type IgniteOptions, clearWarmCache, isWarmed, sendIgniteSignal, sendIgniteSignals };
