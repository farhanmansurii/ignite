import { describe, it, expect, vi, beforeEach } from 'vitest';
import { igniteMiddleware } from './index';

// Mock firebase-functions so we can test the logic without the full SDK
vi.mock('firebase-functions/v2/https', () => ({
  onCall: (fn: Function) => fn,
}));

// Re-import after mock
const { igniteWrapper } = await import('./index');

const SECRET = 'test-secret';

// ─── igniteWrapper tests ───────────────────────────────────────────────────

describe('igniteWrapper', () => {
  it('returns { status: "ignited" } on warm signal with correct secret', async () => {
    const handler = vi.fn();
    const wrapped = igniteWrapper(handler, SECRET);

    const fakeRequest = {
      data: { __ignite: true },
      rawRequest: {
        headers: { 'x-ignite-key': SECRET, 'x-ignite-warm': 'false' },
      },
    };

    const result = await wrapped(fakeRequest as any);
    expect(result).toEqual({ status: 'ignited' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls handler on real (non-warm) request', async () => {
    const handler = vi.fn().mockResolvedValue({ data: 'hello' });
    const wrapped = igniteWrapper(handler, SECRET);

    const fakeRequest = {
      data: {},
      rawRequest: {
        headers: { 'x-ignite-key': SECRET },
      },
    };

    const result = await wrapped(fakeRequest as any);
    expect(handler).toHaveBeenCalledOnce();
    expect(result).toEqual({ data: 'hello' });
  });

  it('rejects warm signal with wrong secret — falls through to handler', async () => {
    const handler = vi.fn().mockResolvedValue({ data: 'real' });
    const wrapped = igniteWrapper(handler, SECRET);

    const fakeRequest = {
      data: { __ignite: true },
      rawRequest: {
        headers: { 'x-ignite-key': 'wrong-secret' },
      },
    };

    await wrapped(fakeRequest as any);
    // Wrong secret → handler is called instead of early-exit
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ─── igniteMiddleware tests ────────────────────────────────────────────────

const makeRes = () => {
  const res = { json: vi.fn() } as any;
  return res;
};

const makeReq = (headers: Record<string, string> = {}, body: any = {}) => {
  return { headers, body } as any;
};

describe('igniteMiddleware', () => {
  it('returns { status: "ignited" } on warm signal with correct secret', async () => {
    const handler = vi.fn();
    const wrapped = igniteMiddleware(handler, SECRET);

    const req = makeReq({ 'x-ignite-warm': 'true', 'x-ignite-key': SECRET });
    const res = makeRes();

    await wrapped(req, res);

    expect(res.json).toHaveBeenCalledWith({ status: 'ignited' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls handler on real request', async () => {
    const handler = vi.fn();
    const wrapped = igniteMiddleware(handler, SECRET);

    const req = makeReq({ 'x-ignite-key': SECRET });
    const res = makeRes();

    await wrapped(req, res);

    expect(handler).toHaveBeenCalledOnce();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('rejects warm signal with wrong secret — calls handler', async () => {
    const handler = vi.fn();
    const wrapped = igniteMiddleware(handler, SECRET);

    const req = makeReq({ 'x-ignite-warm': 'true', 'x-ignite-key': 'wrong' });
    const res = makeRes();

    await wrapped(req, res);

    expect(handler).toHaveBeenCalledOnce();
    expect(res.json).not.toHaveBeenCalled();
  });
});
