import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendIgniteSignal, sendIgniteSignals, clearWarmCache, isWarmed } from './index';

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
    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledOnce();
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://example.com/warm?fn=myFn',
      expect.any(Blob)
    );
  });

  it('URL-encodes the functionName', async () => {
    await sendIgniteSignal('my fn/test', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledWith(
      'https://example.com/warm?fn=my%20fn%2Ftest',
      expect.any(Blob)
    );
  });

  it('skips sendBeacon if already warmed within TTL', async () => {
    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
  });

  it('re-fires after TTL expires', async () => {
    vi.useFakeTimers();
    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(2);
  });

  it('calls onError when proxyUrl is missing', async () => {
    const onError = vi.fn();
    await sendIgniteSignal('myFn', { proxyUrl: '', onError });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'proxyUrl is required' }));
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });

  it('calls onError when functionName is empty', async () => {
    const onError = vi.fn();
    await sendIgniteSignal('', { proxyUrl: 'https://example.com', onError });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'functionName is required' }));
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });

  it('falls back to fetch when sendBeacon returns false', async () => {
    mockSendBeacon.mockReturnValue(false);
    const fetchSpy = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchSpy);

    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/warm?fn=myFn',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetch fallback includes X-Ignite-Key header when apiKey provided', async () => {
    mockSendBeacon.mockReturnValue(false);
    const fetchSpy = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchSpy);

    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com', apiKey: 'secret123' });

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

    const promise = sendIgniteSignal('myFn', { proxyUrl: 'https://example.com', onError });
    vi.advanceTimersByTime(5001);
    await promise;

    expect(onError).toHaveBeenCalled();
  }, 10000);
});

describe('clearWarmCache', () => {
  it('resets warm state so next call fires again', async () => {
    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    clearWarmCache();
    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(2);
  });
});

describe('sendIgniteSignals (batch)', () => {
  it('fires one signal per function', async () => {
    await sendIgniteSignals(['fn1', 'fn2', 'fn3'], { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(3);
  });

  it('skips already-warmed functions in batch', async () => {
    await sendIgniteSignal('fn1', { proxyUrl: 'https://example.com' });
    await sendIgniteSignals(['fn1', 'fn2'], { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(2);
  });
});

describe('isWarmed', () => {
  it('returns false for unknown function', () => {
    expect(isWarmed('unknown')).toBe(false);
  });

  it('returns true after warming', async () => {
    await sendIgniteSignal('fn1', { proxyUrl: 'https://example.com' });
    expect(isWarmed('fn1')).toBe(true);
  });

  it('returns false after TTL expires', async () => {
    vi.useFakeTimers();
    await sendIgniteSignal('fn1', { proxyUrl: 'https://example.com' });
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(isWarmed('fn1')).toBe(false);
  });
});
