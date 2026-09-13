import { afterEach, describe, expect, it, vi } from 'vitest';
import { activateSellerAccount, createPurchaseIntent, createSellerFacility, getAccountCapabilities, getAvailabilityResponses, getBuyerAvailabilityRequests, getBuyerCreditSummary, getSellerActivationQueue, getSellerAvailabilityQueue, getTransaction, issueBuyerQrToken, issueQrToken, listPublicFacilities, rebindDemoSeller, requestBulkAvailability, setSellerAccountSuspension, verifyQrToken } from './api';

describe('account context contract', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads the authenticated account context through one server endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { accountId: 'account-1', roles: ['buyer'], onboardingState: 'buyer_ready', suspended: false, facilityCount: 0, capabilities: { sellerWorkspace: false, operatorTools: false, reviewerWorkspace: false } } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await getAccountCapabilities({ token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v2/account/context', { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } });
  });
});

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

 it('serializes wired search constraints including operational state', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await listPublicFacilities(undefined, 'riz', { category: '', quantiteMin: 10, budgetMaxMinor: 100000, rayonKm:   10, operationalState: 'ouvert' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/public/facilities?q=riz&budget_max=100000&quantite_min=10&rayon_km=10&operational_state=ouvert',
      { headers: { Accept: 'application/json' } },
    );
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

  it('reads the buyer bulk-credit summary with the bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { accountId: 'account-1', plan: 'free', monthlyQuota: 3, creditsUsed: 1, extraCredits: 0, creditsRemaining: 2, periodMonth: '2026-09' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await getBuyerCreditSummary({ token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/buyer/credits',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
    expect(result).toEqual({ ok: true, correlationId: 'test', data: { accountId: 'account-1', plan: 'free', monthlyQuota: 3, creditsUsed: 1, extraCredits: 0, creditsRemaining: 2, periodMonth: '2026-09' } });
  });

  it('serializes a bulk-availability create with facilityIds and idempotency headers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { requestId: 'request-1', productId: 'product-1', facilityIds: ['facility-1', 'facility-2'], facilityCount: 2, status: 'submitted', expiresAt: '2026-09-13T10:00:00.000Z', deliveryMode: 'retrait', note: null, message: 'sent', creditCost: 1, creditsRemaining: 2, monthlyQuota: 3, plan: 'free' } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    const result = await requestBulkAvailability({ productId: 'product-1', facilityIds: ['facility-1', 'facility-2'], quantity: 1, budgetMode: 'unlimited', budgetMinor: null, deliveryMode: 'retrait', note: null, token: 'session-token', idempotencyKey: 'bulk-key-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/bulk-availability',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token', 'Idempotency-Key': 'bulk-key-1' }, body: JSON.stringify({ productId: 'product-1', facilityIds: ['facility-1', 'facility-2'], quantity: 1, budgetMode: 'unlimited', budgetMinor: null, deliveryMode: 'retrait', note: null }) },
    );
    expect(result.data?.creditCost).toBe(1);
    expect(result.data?.facilityCount).toBe(2);
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

    expect(fetchMock).toHaveBeenCalledWith('/api/v2/transaction-transitions?action=snapshot&transactionId=tx-1', { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } });
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

  it('posts a Buyer QR issuance through the shared QR function route with an explicit actor marker', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { transactionId: 'tx-1', token: 'qr-token' } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    await issueBuyerQrToken({ transactionId: 'tx-1', token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v2/qr-issuances?actor=buyer', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }, body: JSON.stringify({ transactionId: 'tx-1' }) });
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


describe('createSellerFacility contract (NW-13c)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('serializes a typed facility with optional rayon to the seller facility endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { facilityId: 'facility-1', slotId: 'slot-1', trustState: 'unconfirmed', facilityType: 'mobile', created: true } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    await createSellerFacility({ token: 'session-token', name: 'Échoppe mobile', facilityType: 'mobile', category: 'Épicerie', description: null, address: 'Lomé', latitude: 6.13, longitude: 1.22, rayonKm: 5, idempotencyKey: 'nwc13-client-key-0001' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token', 'Idempotency-Key': 'nwc13-client-key-0001' }),
        body: JSON.stringify({ name: 'Échoppe mobile', facilityType: 'mobile', category: 'Épicerie', description: null, address: 'Lomé', latitude: 6.13, longitude: 1.22, rayonKm: 5 }),
      }),
    );
  });

  it('serializes a digital facility without coordinates', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { facilityId: 'facility-2', slotId: 'slot-2', trustState: 'unconfirmed', facilityType: 'digital', created: true } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    await createSellerFacility({ token: 'session-token', name: 'Boutique en ligne', facilityType: 'digital', category: 'Textile', description: null, address: null, latitude: null, longitude: null, rayonKm: null, idempotencyKey: 'nwc13-client-key-0002' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities',
      expect.objectContaining({ body: JSON.stringify({ name: 'Boutique en ligne', facilityType: 'digital', category: 'Textile', description: null, address: null, latitude: null, longitude: null, rayonKm: null }) }),
    );
  });
});
