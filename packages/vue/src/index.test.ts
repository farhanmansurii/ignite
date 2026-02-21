// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useIgnite } from './index';

vi.mock('@farhanmansuri/ignite-core', () => ({
  sendIgniteSignal: vi.fn().mockResolvedValue(undefined),
  clearWarmCache: vi.fn(),
}));

import { sendIgniteSignal, clearWarmCache } from '@farhanmansuri/ignite-core';

const defaultOptions = { proxyUrl: 'https://example.com' };

const makeComponent = (fn = 'myFn', opts = defaultOptions) =>
  defineComponent({
    setup() {
      return useIgnite(fn, opts);
    },
    render() {
      return h('div');
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useIgnite (Vue)', () => {
  it('returns all 4 event handlers', () => {
    const wrapper = mount(makeComponent());
    const { onMouseEnter, onMouseLeave, onFocus, onTouchStart } = wrapper.vm as any;
    expect(typeof onMouseEnter).toBe('function');
    expect(typeof onMouseLeave).toBe('function');
    expect(typeof onFocus).toBe('function');
    expect(typeof onTouchStart).toBe('function');
  });

  it('onMouseEnter sets a timeout', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const wrapper = mount(makeComponent());
    (wrapper.vm as any).onMouseEnter();
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 150);
  });

  it('onMouseLeave clears the timeout', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const wrapper = mount(makeComponent());
    (wrapper.vm as any).onMouseEnter();
    (wrapper.vm as any).onMouseLeave();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('fires sendIgniteSignal after hover timeout', async () => {
    const wrapper = mount(makeComponent());
    (wrapper.vm as any).onMouseEnter();
    vi.advanceTimersByTime(150);
    expect(sendIgniteSignal).toHaveBeenCalledWith('myFn', expect.objectContaining({ proxyUrl: 'https://example.com' }));
  });

  it('respects custom hoverTimeout', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const wrapper = mount(makeComponent('myFn', { proxyUrl: 'https://example.com', hoverTimeout: 300 }));
    (wrapper.vm as any).onMouseEnter();
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
  });

  it('clears pending timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const wrapper = mount(makeComponent());
    (wrapper.vm as any).onMouseEnter();
    wrapper.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('onFocus fires signal immediately', async () => {
    const wrapper = mount(makeComponent());
    (wrapper.vm as any).onFocus();
    expect(sendIgniteSignal).toHaveBeenCalledOnce();
  });
});
