// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useIgnite, createIgnitePlugin } from './index';

vi.mock('@farhanmansuri/ignite-core', () => ({
  sendIgniteSignal: vi.fn().mockResolvedValue(undefined),
  clearWarmCache: vi.fn(),
}));

import { sendIgniteSignal, clearWarmCache } from '@farhanmansuri/ignite-core';

const defaultOptions = { serverBaseURL: 'https://example.com' };

const makeComponent = (fn = 'myFn', opts?: Parameters<typeof useIgnite>[1]) =>
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
    const wrapper = mount(makeComponent('myFn', defaultOptions));
    const { onMouseEnter, onMouseLeave, onFocus, onTouchStart } = wrapper.vm as any;
    expect(typeof onMouseEnter).toBe('function');
    expect(typeof onMouseLeave).toBe('function');
    expect(typeof onFocus).toBe('function');
    expect(typeof onTouchStart).toBe('function');
  });

  it('onMouseEnter sets a timeout', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const wrapper = mount(makeComponent('myFn', defaultOptions));
    (wrapper.vm as any).onMouseEnter();
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 150);
  });

  it('onMouseLeave clears the timeout', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const wrapper = mount(makeComponent('myFn', defaultOptions));
    (wrapper.vm as any).onMouseEnter();
    (wrapper.vm as any).onMouseLeave();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('fires sendIgniteSignal after hover timeout', async () => {
    const wrapper = mount(makeComponent('myFn', defaultOptions));
    (wrapper.vm as any).onMouseEnter();
    vi.advanceTimersByTime(150);
    expect(sendIgniteSignal).toHaveBeenCalledWith('myFn', expect.objectContaining({ serverBaseURL: 'https://example.com' }));
  });

  it('respects custom hoverTimeout', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const wrapper = mount(makeComponent('myFn', { serverBaseURL: 'https://example.com', hoverTimeout: 300 }));
    (wrapper.vm as any).onMouseEnter();
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
  });

  it('clears pending timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const wrapper = mount(makeComponent('myFn', defaultOptions));
    (wrapper.vm as any).onMouseEnter();
    wrapper.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('onFocus fires signal immediately', async () => {
    const wrapper = mount(makeComponent('myFn', defaultOptions));
    (wrapper.vm as any).onFocus();
    expect(sendIgniteSignal).toHaveBeenCalledOnce();
  });

  it('works when app has plugin installed with no per-call options', () => {
    const wrapper = mount(makeComponent('myFn'), {
      global: {
        plugins: [createIgnitePlugin({ serverBaseURL: 'https://plugin.example.com' })],
      },
    });
    (wrapper.vm as any).onFocus();
    expect(sendIgniteSignal).toHaveBeenCalledWith('myFn', expect.objectContaining({ serverBaseURL: 'https://plugin.example.com' }));
  });

  it('per-call options override plugin config', () => {
    const wrapper = mount(makeComponent('myFn', { serverBaseURL: 'https://override.example.com' }), {
      global: {
        plugins: [createIgnitePlugin({ serverBaseURL: 'https://plugin.example.com' })],
      },
    });
    (wrapper.vm as any).onFocus();
    expect(sendIgniteSignal).toHaveBeenCalledWith('myFn', expect.objectContaining({ serverBaseURL: 'https://override.example.com' }));
  });

  it('throws error when no plugin and no serverBaseURL', () => {
    expect(() => {
      mount(makeComponent('myFn'));
    }).toThrow('useIgnite requires either the ignite plugin or per-call options with serverBaseURL');
  });
});
