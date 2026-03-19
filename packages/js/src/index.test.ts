import { describe, it, expect } from 'vitest';
import { configureIgnite, sendIgniteSignal, sendIgniteSignals, isWarmed, clearWarmCache } from './index';

describe('ignite-js re-exports', () => {
  it('exports configureIgnite', () => {
    expect(typeof configureIgnite).toBe('function');
  });

  it('exports sendIgniteSignal', () => {
    expect(typeof sendIgniteSignal).toBe('function');
  });

  it('exports sendIgniteSignals', () => {
    expect(typeof sendIgniteSignals).toBe('function');
  });

  it('exports isWarmed', () => {
    expect(typeof isWarmed).toBe('function');
  });

  it('exports clearWarmCache', () => {
    expect(typeof clearWarmCache).toBe('function');
  });
});
