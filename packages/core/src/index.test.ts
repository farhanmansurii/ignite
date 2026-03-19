import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendIgniteSignal, sendIgniteSignals, clearWarmCache, isWarmed, configureIgnite } from './index';

const mockSendBeacon = vi.fn(() => true);

beforeEach(() => {
  clearWarmCache();
  vi.stubGlobal('navigator', { sendBeacon: mockSendBeacon });
  mockSendBeacon.mockClear();
  mockSendBeacon.mockReturnValue(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('sendIgniteSignal', () => {
  it('fires sendBeacon on first call', async () => {
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledOnce();
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://example.com/myFn',
      expect.any(Blob)
    );
  });

  it('URL-encodes the functionName', async () => {
    await sendIgniteSignal('my fn/test', { serverBaseURL: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://example.com/my%20fn%2Ftest',
      expect.any(Blob)
    );
  });

  it('skips sendBeacon if already warmed within TTL', async () => {
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com' });
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
  });

  it('re-fires after TTL expires', async () => {
    vi.useFakeTimers();
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(2);
  });

  it('calls onError when serverBaseURL is missing', async () => {
    const onError = vi.fn();
    await sendIgniteSignal('myFn', { serverBaseURL: '', onError });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'serverBaseURL is required' }));
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });

  it('calls onError when functionName is empty', async () => {
    const onError = vi.fn();
    await sendIgniteSignal('', { serverBaseURL: 'https://example.com', onError });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'functionName is required' }));
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });

  it('falls back to fetch when sendBeacon returns false', async () => {
    mockSendBeacon.mockReturnValue(false);
    const fetchSpy = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchSpy);

    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com' });

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/myFn',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetch fallback includes X-Ignite-Key header when apiKey provided', async () => {
    mockSendBeacon.mockReturnValue(false);
    const fetchSpy = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchSpy);

    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com', apiKey: 'secret123' });

    const [, init] = fetchSpy.mock.calls[0];
    expect(init.headers['X-Ignite-Key']).toBe('secret123');
  });

  it('calls onError when fetch times out', async () => {
    mockSendBeacon.mockReturnValue(false);
    const onError = vi.fn();
    // Simulate a fetch that respects the AbortSignal
    vi.stubGlobal('fetch', (_url: string, init?: RequestInit) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('The operation was aborted.', 'AbortError'))
        );
      })
    );
    vi.useFakeTimers();

    const promise = sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com', onError });
    vi.advanceTimersByTime(5001);
    await promise;

    expect(onError).toHaveBeenCalled();
  }, 10000);
});

describe('URL construction', () => {
  it('builds default URL as {serverBaseURL}/{functionName}', async () => {
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://example.com/myFn',
      expect.any(Blob)
    );
  });

  it('strips trailing slash from serverBaseURL to avoid double slash', async () => {
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com/' });
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://example.com/myFn',
      expect.any(Blob)
    );
  });

  it('strips multiple trailing slashes', async () => {
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com///' });
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://example.com/myFn',
      expect.any(Blob)
    );
  });

  it('uses custom buildURL when provided', async () => {
    const buildURL = (base: string, fn: string) => `${base}/custom/${fn}`;
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com', buildURL });
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://example.com/custom/myFn',
      expect.any(Blob)
    );
  });
});

describe('clearWarmCache', () => {
  it('resets warm state so next call fires again', async () => {
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com' });
    clearWarmCache();
    await sendIgniteSignal('myFn', { serverBaseURL: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(2);
  });
});

describe('sendIgniteSignals (batch)', () => {
  it('fires one signal per function', async () => {
    await sendIgniteSignals(['fn1', 'fn2', 'fn3'], { serverBaseURL: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(3);
  });

  it('skips already-warmed functions in batch', async () => {
    await sendIgniteSignal('fn1', { serverBaseURL: 'https://example.com' });
    await sendIgniteSignals(['fn1', 'fn2'], { serverBaseURL: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(2);
  });
});

describe('isWarmed', () => {
  it('returns false for unknown function', () => {
    expect(isWarmed('unknown')).toBe(false);
  });

  it('returns true after warming', async () => {
    await sendIgniteSignal('fn1', { serverBaseURL: 'https://example.com' });
    expect(isWarmed('fn1')).toBe(true);
  });

  it('returns false after TTL expires', async () => {
    vi.useFakeTimers();
    await sendIgniteSignal('fn1', { serverBaseURL: 'https://example.com' });
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(isWarmed('fn1')).toBe(false);
  });
});

describe('configureIgnite', () => {
  it('returns an object with warm, warmMany, and isWarmed', () => {
    const ignite = configureIgnite({ serverBaseURL: 'https://example.com' });
    expect(typeof ignite.warm).toBe('function');
    expect(typeof ignite.warmMany).toBe('function');
    expect(typeof ignite.isWarmed).toBe('function');
  });

  it('warm() sends a signal for the given function', async () => {
    const ignite = configureIgnite({ serverBaseURL: 'https://example.com' });
    await ignite.warm('myFn');
    expect(mockSendBeacon).toHaveBeenCalledOnce();
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://example.com/myFn',
      expect.any(Blob)
    );
  });

  it('warmMany() sends signals for multiple functions', async () => {
    const ignite = configureIgnite({ serverBaseURL: 'https://example.com' });
    await ignite.warmMany(['fn1', 'fn2']);
    expect(mockSendBeacon).toHaveBeenCalledTimes(2);
  });

  it('isWarmed() returns true after warming via the instance', async () => {
    const ignite = configureIgnite({ serverBaseURL: 'https://example.com' });
    await ignite.warm('fn1');
    expect(ignite.isWarmed('fn1')).toBe(true);
  });

  it('shares warm cache across multiple configureIgnite instances', async () => {
    const ignite1 = configureIgnite({ serverBaseURL: 'https://example.com' });
    const ignite2 = configureIgnite({ serverBaseURL: 'https://example.com' });

    await ignite1.warm('sharedFn');
    expect(ignite2.isWarmed('sharedFn')).toBe(true);
    // Second instance should not re-fire since already warmed
    await ignite2.warm('sharedFn');
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
  });

  it('throws when serverBaseURL is missing', () => {
    expect(() => configureIgnite({} as any)).toThrow('serverBaseURL');
  });

  it('uses custom buildURL from config', async () => {
    const buildURL = (base: string, fn: string) => `${base}/api/warm/${fn}`;
    const ignite = configureIgnite({ serverBaseURL: 'https://example.com', buildURL });
    await ignite.warm('myFn');
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://example.com/api/warm/myFn',
      expect.any(Blob)
    );
  });
});
