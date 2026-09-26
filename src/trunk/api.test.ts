import { afterEach, describe, expect, it, vi } from 'vitest';
import { activateBuyerPro, activateSellerAccount, addFavorite, createFacilityAdCampaign, createPurchaseIntent, createSellerFacility, getAccountCapabilities, getAvailabilityResponses, getBuyerAvailabilityRequests, getBuyerCreditSummary, getBuyerProRenewalStatus, getBuyerProStatus, getFacilityAnalytics, getFacilityBonusStatus, getFacilityRenewalStatus, getSellerActivationQueue, getSellerAvailabilityQueue, getTransaction, issueBuyerQrToken, issueQrToken, listFacilityAdCampaigns, listFavorites, listPublicFacilities, rebindDemoSeller, removeFavorite, renewBuyerPro, renewFacilityPro, requestBulkAvailability, setBuyerProRenewalOptIn, setFacilityRenewalOptIn, setSellerAccountSuspension, unlockFacilityBonus, verifyQrToken } from './api';

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

  it('reads the buyer pro status with the bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { accountId: 'account-1', plan: 'free', entitlementId: null, startsAt: null, endsAt: null, renewalOptIn: false, daysLeft: 0, proPriceMinor: 250000, billingCurrency: 'XOF', walletBalanceMinor: 0, sufficientFunds: false, compareQuota: 1 } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await getBuyerProStatus({ token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/buyer/pro-status',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
    expect(result.data?.compareQuota).toBe(1);
    expect(result.data?.plan).toBe('free');
  });

  it('activates buyer pro through one endpoint with an idempotency key', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { accountId: 'account-1', entitlementId: 'ent-1', plan: 'pro_active', endsAt: '2026-10-13T00:00:00.000Z', spendLedgerEntryId: 'ledger-1' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await activateBuyerPro({ token: 'session-token', idempotencyKey: 'buyer-pro-key-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/buyer/pro',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token', 'Idempotency-Key': 'buyer-pro-key-1' }, body: JSON.stringify({ reference: 'buyer-pro-key-1' }) },
    );
    expect(result.data?.plan).toBe('pro_active');
  });

  it('lists favorite establishments with the bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { favorites: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await listFavorites({ token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/buyer/favorites',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
    expect(result).toEqual({ ok: true, correlationId: 'test', data: { favorites: [] } });
  });

  it('adds a favorite establishment to the buyer favorites endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { favoriteId: 'fav-1', facilityId: 'facility-1' } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    const result = await addFavorite({ token: 'session-token', facilityId: 'facility-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/buyer/favorites',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }, body: JSON.stringify({ facilityId: 'facility-1' }) },
    );
    expect(result.data?.favoriteId).toBe('fav-1');
  });

  it('removes a favorite establishment by facility id', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { removed: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await removeFavorite({ token: 'session-token', facilityId: 'facility-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/buyer/favorites/facility-1',
      { method: 'DELETE', headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
  });

  it('reads the buyer pro renewal status with the bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { accountId: 'account-1', plan: 'pro_expired', entitlementId: 'ent-1', startsAt: '2026-08-13T00:00:00.000Z', endsAt: '2026-09-12T00:00:00.000Z', renewalOptIn: true, daysLeft: 0, proPriceMinor: 250000, billingCurrency: 'XOF', walletBalanceMinor: 250000, sufficientFunds: true, compareQuota: 1 } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await getBuyerProRenewalStatus({ token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/buyer/pro/renewal-status',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
    expect(result.data?.plan).toBe('pro_expired');
  });

  it('sets the buyer pro renewal opt-in', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { accountId: 'account-1', renewalOptIn: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await setBuyerProRenewalOptIn({ token: 'session-token', optIn: true });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/buyer/pro/renewal-opt-in',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }, body: JSON.stringify({ optIn: true }) },
    );
  });

  it('renews buyer pro through the renewal endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { accountId: 'account-1', renewed: true, reason: 'renewed', newEntitlementId: 'ent-2', endsAt: '2026-10-13T00:00:00.000Z', spendLedgerEntryId: 'ledger-2', status: 'succeeded' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await renewBuyerPro({ token: 'session-token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/buyer/pro/renew',
      { method: 'POST', headers: { Accept: 'application/json', Authorization: 'Bearer session-token' }, body: '{}' },
    );
    expect(result.data?.renewed).toBe(true);
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
        body: JSON.stringify({ name: 'Échoppe mobile', facilityType: 'mobile', ownerKind: 'organisation', category: 'Épicerie', description: null, address: 'Lomé', latitude: 6.13, longitude: 1.22, rayonKm: 5, contactPhone: null, contactWhatsapp: null }),
      }),
    );
  });

  it('serializes a digital facility without coordinates', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { facilityId: 'facility-2', slotId: 'slot-2', trustState: 'unconfirmed', facilityType: 'digital', created: true } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    await createSellerFacility({ token: 'session-token', name: 'Boutique en ligne', facilityType: 'digital', category: 'Textile', description: null, address: null, latitude: null, longitude: null, rayonKm: null, idempotencyKey: 'nwc13-client-key-0002' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities',
      expect.objectContaining({ body: JSON.stringify({ name: 'Boutique en ligne', facilityType: 'digital', ownerKind: 'organisation', category: 'Textile', description: null, address: null, latitude: null, longitude: null, rayonKm: null, contactPhone: null, contactWhatsapp: null }) }),
    );
  });
});

describe('facility trust bonus contract (NW-13e)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads the owning seller bonus status from the facility bonus endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { facilityId: 'facility-1', unlockType: 'pro_test_credit_20_usd', distinctBuyerCount: 2, requiredCount: 3, status: 'locked', amountMinor: 10000, trustState: 'unconfirmed', qualifyingSales: 2, bonusUnlockedAt: null } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await getFacilityBonusStatus({ token: 'session-token', facilityId: 'facility-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities/facility-1/bonus',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
  });

  it('posts an unlock request to the facility bonus unlock endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { ledgerEntryId: 'ledger-1', walletId: 'wallet-1', kind: 'bonus_grant', amountMinor: 10000, status: 'confirmed', facilityId: 'facility-1' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await unlockFacilityBonus({ token: 'session-token', facilityId: 'facility-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities/facility-1/bonus/unlock',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }, body: '{}' },
    );
  });
});
describe('facility pro renewal contract (NW-13g)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads the renewal status from the facility pro renewal-status endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { facilityId: 'facility-1', facilityName: 'Atelier', plan: 'pro_active', entitlementId: 'ent-1', startsAt: '2026-08-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', renewalOptIn: true, proPriceMinor: 1000, billingCurrency: 'XOF', walletBalanceMinor: 5000, sufficientFunds: true, daysLeft: 112 } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await getFacilityRenewalStatus({ token: 'session-token', facilityId: 'facility-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities/facility-1/pro/renewal-status',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
  });

  it('posts the opt-in change to the facility pro renewal-opt-in endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { facilityId: 'facility-1', renewalOptIn: true } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await setFacilityRenewalOptIn({ token: 'session-token', facilityId: 'facility-1', optIn: true });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities/facility-1/pro/renewal-opt-in',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }, body: '{"optIn":true}' },
    );
  });

  it('posts a manual renewal to the facility pro renew endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { facilityId: 'facility-1', renewed: true, reason: 'renewed', newEntitlementId: 'ent-new', endsAt: '2026-10-22T00:00:00.000Z', spendLedgerEntryId: 'spend-1', status: 'succeeded' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await renewFacilityPro({ token: 'session-token', facilityId: 'facility-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities/facility-1/pro/renew',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }, body: '{}' },
    );
  });
});
describe('facility analytics contract (NW-13f)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads the performance analytics from the facility analytics endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { facilityId: 'facility-1', facilityName: 'Atelier', requests: 12, responsesAvailable: 9, transactionsStarted: 6, qrScansVerified: 4, transactionsClosed: 3, grossRevenueMinor: 24500, billingCurrency: 'XOF', scanToVerifyAvgMs: 3200 } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await getFacilityAnalytics({ token: 'session-token', facilityId: 'facility-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities/facility-1/analytics',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
  });
});
describe('facility ad campaign contract (NW-13j)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lists the campaigns from the facilities campaigns endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { campaigns: [], budgetRemainingMinor: 100000, billingCurrency: 'XOF' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await listFacilityAdCampaigns({ token: 'session-token', facilityId: 'facility-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities/facility-1/campaigns',
      { headers: { Accept: 'application/json', Authorization: 'Bearer session-token' } },
    );
  });

  it('creates a campaign with the Idempotency-Key header and the ad body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true, correlationId: 'test', data: { campaign: { id: 'campaign-1', facilityId: 'facility-1', name: 'Coup de projecteur', budgetMinor: 50000, spentMinor: 0, status: 'active', startsAt: '2026-09-13T00:00:00.000Z', endsAt: '2026-10-13T00:00:00.000Z', createdAt: '2026-09-13T00:00:00.000Z' }, spendLedgerEntryId: 'spend-1', budgetRemainingMinor: 100000, billingCurrency: 'XOF' } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));

    await createFacilityAdCampaign({ token: 'session-token', facilityId: 'facility-1', name: 'Coup de projecteur', budgetMinor: 50000, startsAt: '2026-09-13T00:00:00.000Z', endsAt: '2026-10-13T00:00:00.000Z', idempotencyKey: 'nw13j-key-0001' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/seller/facilities/facility-1/campaigns',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer session-token', 'Idempotency-Key': 'nw13j-key-0001' }, body: JSON.stringify({ name: 'Coup de projecteur', budgetMinor: 50000, startsAt: '2026-09-13T00:00:00.000Z', endsAt: '2026-10-13T00:00:00.000Z' }) },
    );
  });
});
