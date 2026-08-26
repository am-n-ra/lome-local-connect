import { afterEach, describe, expect, it, vi } from 'vitest';
import { activateSellerAccount, createPurchaseIntent, getAvailabilityResponses, getBuyerAvailabilityRequests, getSellerActivationQueue, getSellerAvailabilityQueue, getTransaction, issueQrToken, listPublicFacilities, rebindDemoSeller, setSellerAccountSuspension, verifyQrToken } from './api';

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

  it('serializes a text query without viewport bounds for global search', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await listPublicFacilities(undefined, 'Marche de Hanoukope');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/public/facilities?q=Marche+de+Hanoukope',
      { headers: { Accept: 'application/json' } },
    );
  });

  it('reads buyer-owned availability responses with the bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { requestId: 'request-1', responses: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await getAvailabilityResponses({ requestId: 'request-1', token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/availability-responses?requestId=request-1',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
  });

  it('reads the buyer-owned request list with the bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { requests: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await getBuyerAvailabilityRequests({ token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/availability-responses',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
  });

  it('reads the seller-owned availability queue with the bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { authorized: true, requests: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await getSellerAvailabilityQueue({ token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/availability-requests',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
  });

  it('reads an authenticated transaction snapshot', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { transactionId: 'tx-1', state: 'intent_created' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await getTransaction({ transactionId: 'tx-1', token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v2/transactions/tx-1', { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } });
  });

  it('posts a Buyer purchase intent with idempotency', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { transactionId: 'tx-1' } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    await createPurchaseIntent({ responseId: 'response-1', token: 'session-token', idempotencyKey: 'intent-response-1' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v2/purchase-intents', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token', 'Idempotency-Key': 'intent-response-1' }, body: JSON.stringify({ responseId: 'response-1' }) });
  });

  it('reads the seller activation queue through the existing public function route', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { candidates: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await getSellerActivationQueue({ token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/public/facilities?reviewer=seller-activations',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
  });

  it('posts seller account suspension through the existing facility detail function route', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { accountId: 'account-1', suspended: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await setSellerAccountSuspension({ accountId: 'account-1', suspended: true, reason: 'Controlled test reason', token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/facilities/account-1?action=reviewer-seller-suspension',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }, body: JSON.stringify({ suspended: true, reason: 'Controlled test reason' }) },
    );
  });

  it('posts seller activation through the existing facility detail function route', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { accountId: 'account-1', onboardingState: 'seller_ready', activated: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await activateSellerAccount({ accountId: 'account-1', token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/facilities/account-1?action=reviewer-seller-activation',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }, body: JSON.stringify({}) },
    );
  });

  it('posts a Seller QR issuance and verification with the bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { transactionId: 'tx-1', token: 'qr-token' } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    await issueQrToken({ transactionId: 'tx-1', token: 'session-token' });
    await verifyQrToken({ transactionId: 'tx-1', tokenHash: 'hash-1', token: 'session-token' });

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v2/qr-issuances', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }, body: JSON.stringify({ transactionId: 'tx-1' }) });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v2/qr-verifications', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }, body: JSON.stringify({ transactionId: 'tx-1', tokenHash: 'hash-1' }) });
  });

  it('posts the explicit bounded Seller demo rebind with the bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { authorized: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await rebindDemoSeller({ token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/demo-rebind',
      { method: 'POST', headers: { Accept: 'application/json', Authorization: 'Bearer session-token' }, body: '{}' },
    );
  });
});
