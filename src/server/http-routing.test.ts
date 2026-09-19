import type { IncomingMessage, ServerResponse } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleApi } from './http';
import { clearRoutingCache } from './routing-adapter';

/** Minimal Node request/response doubles. The routing route is deliberately
 * served before `createTrunkRepository()`, so these tests also prove the route
 * works with NO database configured. */
const request = (method: string, url: string) =>
  ({ method, url, headers: {}, async *[Symbol.asyncIterator]() {} }) as unknown as IncomingMessage;

function response() {
  const chunks: string[] = [];
  const res = {
    statusCode: 0,
    body: '',
    setHeader() {},
    end(chunk: string) { chunks.push(chunk); res.body = chunks.join(''); },
  } as unknown as ServerResponse & { body: string };
  return res;
}

async function call(url: string) {
  const res = response();
  await handleApi(request('GET', url), res, url.split('?')[0]!, new URL(url, 'https://omni.test'));
  return { status: res.statusCode, body: JSON.parse(res.body) as any };
}

const ADAWLATO = 'from_lat=6.1315&from_lng=1.2138';
const TOKOIN = 'to_lat=6.1655&to_lng=1.2226';

describe('GET /api/v2/public/routing', () => {
  afterEach(() => {
    delete process.env.OSRM_BASE_URL;
    clearRoutingCache();
  });

  it('rejects a request with no coordinates rather than routing to 0,0', async () => {
    // Regression guard: `Number(null)` is 0, so a naive param read would have
    // accepted this request and routed from Null Island.
    const result = await call('/api/v2/public/routing');
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('INVALID_INPUT');
  });

  it('rejects a partially specified request', async () => {
    const result = await call(`/api/v2/public/routing?${ADAWLATO}`);
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('INVALID_INPUT');
  });

  it('rejects blank coordinate values', async () => {
    const result = await call('/api/v2/public/routing?from_lat=&from_lng=&to_lat=&to_lng=');
    expect(result.status).toBe(400);
  });

  it('answers honestly when no provider is configured, without a 500', async () => {
    delete process.env.OSRM_BASE_URL;
    const result = await call(`/api/v2/public/routing?${ADAWLATO}&${TOKOIN}`);
    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.data).toMatchObject({ available: false, reason: 'PROVIDER_NOT_CONFIGURED' });
  });

  it('refuses a real out-of-zone facility with a readable reason', async () => {
    delete process.env.OSRM_BASE_URL;
    // Real coordinates of a Ghana facility present in the canonical branch.
    const result = await call(`/api/v2/public/routing?${ADAWLATO}&to_lat=6.3418223&to_lng=-1.0013403`);
    expect(result.status).toBe(200);
    expect(result.body.data.reason).toBe('OUT_OF_ZONE');
    expect(result.body.data.message).toEqual(expect.any(String));
  });
});