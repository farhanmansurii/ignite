// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIgnite } from './index';
import { clearWarmCache } from '@farhanmansuri/ignite-core';

// Mock the core signal
vi.mock('@farhanmansuri/ignite-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@farhanmansuri/ignite-core')>();
  return {
    ...actual,
    sendIgniteSignal: vi.fn().mockResolvedValue(undefined),
  };
});

const mockSendBeacon = vi.fn(() => true);

beforeEach(() => {
  clearWarmCache();
  vi.stubGlobal('navigator', { sendBeacon: mockSendBeacon });
  mockSendBeacon.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
});

const defaultOptions = { proxyUrl: 'https://example.com' };

describe('useIgnite', () => {
  it('returns all 4 event handlers', () => {
    const { result } = renderHook(() => useIgnite('myFn', defaultOptions));
    expect(result.current).toHaveProperty('onMouseEnter');
    expect(result.current).toHaveProperty('onMouseLeave');
    expect(result.current).toHaveProperty('onFocus');
    expect(result.current).toHaveProperty('onTouchStart');
    expect(typeof result.current.onMouseEnter).toBe('function');
    expect(typeof result.current.onMouseLeave).toBe('function');
    expect(typeof result.current.onFocus).toBe('function');
    expect(typeof result.current.onTouchStart).toBe('function');
  });

  it('onMouseEnter sets a timeout', () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const { result } = renderHook(() => useIgnite('myFn', defaultOptions));

    act(() => {
      result.current.onMouseEnter();
    });

    expect(setTimeoutSpy).toHaveBeenCalledOnce();
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 150);
  });

  it('onMouseLeave clears the timeout', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { result } = renderHook(() => useIgnite('myFn', defaultOptions));

    act(() => {
      result.current.onMouseEnter();
    });

    act(() => {
      result.current.onMouseLeave();
    });

    expect(clearTimeoutSpy).toHaveBeenCalledOnce();
  });

  it('respects custom hoverTimeout option', () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const { result } = renderHook(() =>
      useIgnite('myFn', { ...defaultOptions, hoverTimeout: 300 })
    );

    act(() => {
      result.current.onMouseEnter();
    });

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
  });

  it('stable refs: changing onWarm callback does not change handler identity', () => {
    const onWarm1 = vi.fn();
    const onWarm2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ onWarm }) => useIgnite('myFn', { ...defaultOptions, onWarm }),
      { initialProps: { onWarm: onWarm1 } }
    );

    const handlerBefore = result.current.onMouseEnter;

    rerender({ onWarm: onWarm2 });

    // The handler reference should be stable across onWarm changes
    expect(result.current.onMouseEnter).toBe(handlerBefore);
  });
});
