import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAvailabilityResponses, listPublicFacilities } from './api';

describe('listPublicFacilities search contract', () => {
  afterEach(() => vi.restoreAllMocks());

  it('serializes visible bounds, query and category together', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await listPublicFacilities([-2, 5, 2, 7], 'tomato', { category: 'Fresh produce' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/public/facilities?west=-2&south=5&east=2&north=7&q=tomato&category=Fresh+produce',
      { headers: { Accept: 'application/json' } },
    );
  });

  it('does not serialize an empty category', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await listPublicFacilities(undefined, undefined, { category: '' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v2/public/facilities?', { headers: { Accept: 'application/json' } });
  });

  it('reads buyer-owned availability responses with the bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { requestId: 'request-1', responses: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await getAvailabilityResponses({ requestId: 'request-1', token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/availability-responses?requestId=request-1',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
  });
});
