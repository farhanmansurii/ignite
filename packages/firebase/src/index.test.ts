import { describe, it, expect, vi } from 'vitest';

vi.mock('firebase-functions/v2/https', () => ({
  onCall: (fn: Function) => fn,
}));

const { igniteWrapper, igniteMiddleware } = await import('./index');

const SECRET = 'test-secret';

// ─── igniteWrapper tests ───────────────────────────────────────────────────

describe('igniteWrapper', () => {
  it('returns { status: "ignited" } on warm signal with correct secret (data)', async () => {
    const handler = vi.fn();
    const wrapped = igniteWrapper(handler, SECRET);

    const result = await wrapped({
      data: { __ignite: true },
      rawRequest: { headers: { 'x-ignite-key': SECRET } },
    } as any);

    expect(result).toEqual({ status: 'ignited' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns { status: "ignited" } on warm signal via x-ignite-warm header', async () => {
    const handler = vi.fn();
    const wrapped = igniteWrapper(handler, SECRET);

    const result = await wrapped({
      data: {},
      rawRequest: { headers: { 'x-ignite-warm': 'true', 'x-ignite-key': SECRET } },
    } as any);

    expect(result).toEqual({ status: 'ignited' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('handles uppercase X-Ignite-Warm header (case-insensitive fix)', async () => {
    const handler = vi.fn();
    const wrapped = igniteWrapper(handler, SECRET);

    const result = await wrapped({
      data: {},
      rawRequest: { headers: { 'X-Ignite-Warm': 'true', 'X-Ignite-Key': SECRET } },
    } as any);

    expect(result).toEqual({ status: 'ignited' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls handler on real (non-warm) request', async () => {
    const handler = vi.fn().mockResolvedValue({ data: 'hello' });
    const wrapped = igniteWrapper(handler, SECRET);

    const result = await wrapped({
      data: {},
      rawRequest: { headers: { 'x-ignite-key': SECRET } },
    } as any);

    expect(handler).toHaveBeenCalledOnce();
    expect(result).toEqual({ data: 'hello' });
  });

  it('calls handler when secret is wrong', async () => {
    const handler = vi.fn().mockResolvedValue({ data: 'real' });
    const wrapped = igniteWrapper(handler, SECRET);

    await wrapped({
      data: { __ignite: true },
      rawRequest: { headers: { 'x-ignite-key': 'wrong-secret' } },
    } as any);

    expect(handler).toHaveBeenCalledOnce();
  });

  it('handles missing rawRequest gracefully', async () => {
    const handler = vi.fn().mockResolvedValue({ data: 'ok' });
    const wrapped = igniteWrapper(handler, SECRET);

    await wrapped({ data: {}, rawRequest: undefined } as any);
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ─── igniteMiddleware tests ────────────────────────────────────────────────

const makeRes = () => ({ json: vi.fn() } as any);
const makeReq = (headers: Record<string, string> = {}) => ({ headers } as any);

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

  it('handles uppercase headers (case-insensitive fix)', async () => {
    const handler = vi.fn();
    const wrapped = igniteMiddleware(handler, SECRET);

    const req = makeReq({ 'X-Ignite-Warm': 'true', 'X-Ignite-Key': SECRET });
    const res = makeRes();

    await wrapped(req, res);

    expect(res.json).toHaveBeenCalledWith({ status: 'ignited' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls handler on real request', async () => {
    const handler = vi.fn();
    const wrapped = igniteMiddleware(handler, SECRET);

    await wrapped(makeReq({ 'x-ignite-key': SECRET }), makeRes());

    expect(handler).toHaveBeenCalledOnce();
  });

  it('calls handler when secret is wrong', async () => {
    const handler = vi.fn();
    const wrapped = igniteMiddleware(handler, SECRET);

    const req = makeReq({ 'x-ignite-warm': 'true', 'x-ignite-key': 'wrong' });
    const res = makeRes();

    await wrapped(req, res);

    expect(handler).toHaveBeenCalledOnce();
    expect(res.json).not.toHaveBeenCalled();
  });
});
