import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendIgniteSignal, sendIgniteSignals, clearWarmCache, isWarmed } from './index';

// Mock navigator.sendBeacon
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

  it('skips sendBeacon if already warmed within TTL', async () => {
    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);

    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(1); // still 1 — skipped
  });

  it('re-fires after TTL expires', async () => {
    vi.useFakeTimers();

    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);

    // Advance past 5-minute TTL
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(2);
  });

  it('calls onError when proxyUrl is missing', async () => {
    const onError = vi.fn();
    await sendIgniteSignal('myFn', { proxyUrl: '', onError });
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toBe('proxyUrl is required');
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });

  it('calls onError when functionName is empty', async () => {
    const onError = vi.fn();
    await sendIgniteSignal('', { proxyUrl: 'https://example.com', onError });
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toBe('functionName is required');
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });
});

describe('clearWarmCache', () => {
  it('resets warm state so next call fires again', async () => {
    await sendIgniteSignal('myFn', { proxyUrl: 'https://example.com' });
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);

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
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);

    await sendIgniteSignals(['fn1', 'fn2'], { proxyUrl: 'https://example.com' });
    // fn1 is already warmed, only fn2 fires
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
    expect(isWarmed('fn1')).toBe(true);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(isWarmed('fn1')).toBe(false);
  });
});
