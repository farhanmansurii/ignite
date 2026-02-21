// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ignite } from './index';

vi.mock('@farhanmansuri/ignite-core', () => ({
  sendIgniteSignal: vi.fn().mockResolvedValue(undefined),
  clearWarmCache: vi.fn(),
}));

import { sendIgniteSignal } from '@farhanmansuri/ignite-core';

const defaultParams = { functionName: 'myFn', proxyUrl: 'https://example.com' };

const makeNode = () => document.createElement('button');

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ignite (Svelte action)', () => {
  it('attaches mouseenter listener that sets a timeout', () => {
    const node = makeNode();
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    ignite(node, defaultParams);

    node.dispatchEvent(new Event('mouseenter'));
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 150);
  });

  it('fires sendIgniteSignal after hover timeout', () => {
    const node = makeNode();
    ignite(node, defaultParams);

    node.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(150);

    expect(sendIgniteSignal).toHaveBeenCalledWith('myFn', expect.objectContaining({ proxyUrl: 'https://example.com' }));
  });

  it('mouseleave clears the timeout', () => {
    const node = makeNode();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    ignite(node, defaultParams);

    node.dispatchEvent(new Event('mouseenter'));
    node.dispatchEvent(new Event('mouseleave'));

    expect(clearTimeoutSpy).toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(sendIgniteSignal).not.toHaveBeenCalled();
  });

  it('focus fires signal immediately', () => {
    const node = makeNode();
    ignite(node, defaultParams);

    node.dispatchEvent(new Event('focus'));
    expect(sendIgniteSignal).toHaveBeenCalledOnce();
  });

  it('touchstart fires signal immediately', () => {
    const node = makeNode();
    ignite(node, defaultParams);

    node.dispatchEvent(new Event('touchstart'));
    expect(sendIgniteSignal).toHaveBeenCalledOnce();
  });

  it('destroy removes all event listeners', () => {
    const node = makeNode();
    const action = ignite(node, defaultParams);
    action.destroy();

    node.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(150);
    expect(sendIgniteSignal).not.toHaveBeenCalled();
  });

  it('destroy clears pending timeout', () => {
    const node = makeNode();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const action = ignite(node, defaultParams);

    node.dispatchEvent(new Event('mouseenter'));
    action.destroy();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('update changes the params used for signal', () => {
    const node = makeNode();
    const action = ignite(node, defaultParams);
    action.update({ functionName: 'otherFn', proxyUrl: 'https://other.com' });

    node.dispatchEvent(new Event('focus'));
    expect(sendIgniteSignal).toHaveBeenCalledWith('otherFn', expect.objectContaining({ proxyUrl: 'https://other.com' }));
  });

  it('respects custom hoverTimeout', () => {
    const node = makeNode();
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    ignite(node, { ...defaultParams, hoverTimeout: 300 });

    node.dispatchEvent(new Event('mouseenter'));
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
  });
});
