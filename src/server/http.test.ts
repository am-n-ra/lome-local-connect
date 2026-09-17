import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import { ApiInputError, extractFedaPayTransaction, isTransactionState, parseRequestBody, toApiErrorResponse, validateAdCampaignCreate, validateAvailabilityRequestCreate, validateBulkAvailabilityRequestCreate, validateFacilityZoneAssignment, validateSellerFacilityCreate, validateTeamInviteAccept } from './http';
import { AvailabilityPolicyError, BuyerSearchPolicyError, EvidenceStoragePolicyError, InsufficientCreditsError, PurchaseIntentPolicyError, SellerAuthorizationPolicyError, TransactionPolicyError, WalletPolicyError } from './trunk-repository';
import { ClaimEvidenceNotFoundError } from './evidence-storage';

const requestWithBody = (value: string) => ({
  async *[Symbol.asyncIterator]() {
    yield Buffer.from(value);
  },
}) as unknown as IncomingMessage;

describe('Root HTTP error boundary', () => {
  it('rejects malformed JSON as a typed invalid-input error', async () => {
    await expect(parseRequestBody(requestWithBody('{"productId":'))).rejects.toMatchObject({
      name: 'ApiInputError',
      message: 'Request body must be valid JSON.',
    });
  });

  it('rejects array bodies as typed invalid-input errors', async () => {
    await expect(parseRequestBody(requestWithBody('[]'))).rejects.toBeInstanceOf(ApiInputError);
  });

  it('maps malformed input to a retry-free 400 envelope', () => {
    const response = toApiErrorResponse('corr-input', new ApiInputError('Request body must be valid JSON.'));
    expect(response).toEqual({
      status: 400,
      body: {
        ok: false,
        correlationId: 'corr-input',
        error: {
          code: 'INVALID_INPUT',
          message: 'Request body must be valid JSON.',
          retryable: false,
        },
      },
    });
  });

  it('maps availability policy rejection to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-policy', new AvailabilityPolicyError('The selected product is not published at the requested facility.'));
    expect(response).toEqual({
      status: 409,
      body: {
        ok: false,
        correlationId: 'corr-policy',
        error: {
          code: 'POLICY_REJECTED',
          message: 'The selected product is not published at the requested facility.',
          retryable: false,
        },
      },
    });
  });

  it('maps purchase-intent policy rejection to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-intent', new PurchaseIntentPolicyError('No eligible availability response belongs to the authenticated buyer.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });

  it('maps insufficient bulk credits to a non-retryable 403 INSUFFICIENT_CREDITS', () => {
    const response = toApiErrorResponse('corr-credits', new InsufficientCreditsError('Your monthly bulk credits are exhausted. Recharge with packs to keep sending availability requests.'));
    expect(response).toEqual({
      status: 403,
      body: {
        ok: false,
        correlationId: 'corr-credits',
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: 'Your monthly bulk credits are exhausted. Recharge with packs to keep sending availability requests.',
          retryable: false,
        },
      },
    });
  });

  it('normalizes a valid availability-request create and leaves defaults for optional fields', () => {
    const validated = validateAvailabilityRequestCreate(
      { productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', facilityId: '1e0b1e44-9f36-4f9c-bf60-1d0a5d2f7a01', quantity: 2, idempotencyKey: 'https://x' },
      'https://x',
      'auth-user-1',
    );
    expect(validated).toEqual({ authUserId: 'auth-user-1', productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', facilityId: '1e0b1e44-9f36-4f9c-bf60-1d0a5d2f7a01', quantity: 2, budgetMode: 'unlimited', budgetMinor: null, deliveryMode: 'retrait', note: null, idempotencyKey: 'https://x' });
  });

  it('rejects an availability-request create with an unknown product or a too-short idempotency key', () => {
    expect(() => validateAvailabilityRequestCreate({ productId: 'not-a-uuid', quantity: 1, idempotencyKey: 'short' }, 'short', 'auth-user-1')).toThrow(ApiInputError);
    expect(() => validateAvailabilityRequestCreate({ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', facilityId: '1e0b1e44-9f36-4f9c-bf60-1d0a5d2f7a01', quantity: 0, idempotencyKey: 'https://x' }, 'https://x', 'auth-user-1')).toThrow('A valid product, facility, positive quantity and a stable idempotency key are required.');
  });

  it('maps a disruptive-missing bulk request to a non-retryable 409 POLICY_REJECTED', () => {
    const response = toApiErrorResponse('corr-bulk-reject', new AvailabilityPolicyError('A bulk request must target at least 2 facilities. Use single availability request for one facility.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });

  it('maps insufficient bulk credits to a non-retryable 403 INSUFFICIENT_CREDITS with the exact counted shortfall', () => {
    const response = toApiErrorResponse('corr-bulk-credits', new InsufficientCreditsError('This bulk addresses 250 facility(ies) = 3 bulk credit(s). You have 1. Missing 2. Recharge with packs to send.'));
    expect(response).toEqual({
      status: 403,
      body: {
        ok: false,
        correlationId: 'corr-bulk-credits',
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: 'This bulk addresses 250 facility(ies) = 3 bulk credit(s). You have 1. Missing 2. Recharge with packs to send.',
          retryable: false,
        },
      },
    });
  });

  it('normalizes a valid bulk-availability create with 2+ distinct facility ids', () => {
    const validated = validateBulkAvailabilityRequestCreate(
      { productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', facilityIds: ['1e0b1e44-9f36-4f9c-bf60-1d0a5d2f7a01', '9d3f6a1b-1d1e-4c7a-8f0c-0d0c0f0a0b0c'], quantity: 1, idempotencyKey: 'bulk-key-https' },
      'bulk-key-https',
      'auth-user-1',
    );
    expect(validated).toEqual({ authUserId: 'auth-user-1', productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', facilityIds: ['1e0b1e44-9f36-4f9c-bf60-1d0a5d2f7a01', '9d3f6a1b-1d1e-4c7a-8f0c-0d0c0f0a0b0c'], quantity: 1, budgetMode: 'unlimited', budgetMinor: null, deliveryMode: 'retrait', note: null, idempotencyKey: 'bulk-key-https' });
  });

  it('rejects a bulk-availability create with a single facility, duplicates or malformed ids', () => {
    const validA = '1e0b1e44-9f36-4f9c-bf60-1d0a5d2f7a01';
    const validB = '9d3f6a1b-1d1e-4c7a-8f0c-0d0c0f0a0b0c';
    expect(() => validateBulkAvailabilityRequestCreate({ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', facilityIds: [validA], idempotencyKey: 'bulk-key-https' }, 'bulk-key-https', 'auth-user-1')).toThrow('A valid product, at least 2 distinct facility ids and a stable idempotency key are required');
    expect(() => validateBulkAvailabilityRequestCreate({ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', facilityIds: [validA, validA], idempotencyKey: 'bulk-key-https' }, 'bulk-key-https', 'auth-user-1')).toThrow('A valid product, at least 2 distinct facility ids and a stable idempotency key are required');
    expect(() => validateBulkAvailabilityRequestCreate({ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', facilityIds: [validA, 'not-a-uuid'], idempotencyKey: 'bulk-key-https' }, 'bulk-key-https', 'auth-user-1')).toThrow('A valid product, at least 2 distinct facility ids and a stable idempotency key are required');
    expect(() => validateBulkAvailabilityRequestCreate({ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', facilityIds: [validA, validB], idempotencyKey: 'short' }, 'short', 'auth-user-1')).toThrow(ApiInputError);
  });

  it('maps external-payment policy rejection to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-payment', new TransactionPolicyError('Payment declaration requires a buyer member after QR verification.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });

  it('maps a refused availability-request cancel to a non-retryable 409 POLICY_REJECTED', () => {
    const response = toApiErrorResponse('corr-cancel', new AvailabilityPolicyError("Cette demande ne peut pas être annulée : elle est déjà engagée, expirée ou introuvable."));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });

  it('maps a refused QR revocation to a non-retryable 409 POLICY_REJECTED (FF-5)', () => {
    const response = toApiErrorResponse('corr-qr-revoke', new TransactionPolicyError('QR revocation requires an authorized unverified transaction QR.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });

  it('accepts only the locked transaction states at the HTTP boundary', () => {
    expect(isTransactionState('qr_verified')).toBe(true);
    expect(isTransactionState('closed')).toBe(true);
    expect(isTransactionState('rejected')).toBe(false);
    expect(isTransactionState('disputed')).toBe(false);
    expect(isTransactionState(null)).toBe(false);
  });

  it('maps unavailable private evidence storage to a retryable provider boundary', () => {
    const response = toApiErrorResponse('corr-evidence', new EvidenceStoragePolicyError('Private evidence storage is not configured.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EVIDENCE_STORAGE_UNAVAILABLE');
    expect(response.body.error.retryable).toBe(false);
  });

  it('does not expose private evidence when the object is unavailable', () => {
    const response = toApiErrorResponse('corr-evidence-not-found', new ClaimEvidenceNotFoundError());
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('EVIDENCE_NOT_FOUND');
    expect(response.body.error.message).not.toContain('object key');
  });

  it('maps a not-yet-unlockable trust bonus to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-bonus', new WalletPolicyError('Facility bonus requires confirmed trust, three qualifying sales and an owned wallet.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });

  it('maps the Pro auto-renewal opt-in WalletPolicyError to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-renew-optin', new WalletPolicyError('Activate Omni Pro once before choosing auto-renewal.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });
  it('maps a non-owned facility analytics request to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-analytics', new SellerAuthorizationPolicyError('Facility not found or not owned by the current user.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });
  it('maps a favorites buyer-search policy rejection to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-favorites', new BuyerSearchPolicyError('NOT_FOUND'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });
  it('maps a buyer pro activation shortfall to a non-retryable 409', () => {
    const response = toApiErrorResponse('corr-buyer-pro', new WalletPolicyError('Insufficient wallet balance to activate Buyer Pro.'));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('POLICY_REJECTED');
    expect(response.body.error.retryable).toBe(false);
  });
  it('redacts unexpected internal details behind a recoverable 500', () => {
    const response = toApiErrorResponse('corr-internal', new Error('database password leaked'));
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_RECOVERABLE');
    expect(response.body.error.retryable).toBe(true);
    expect(response.body.error.message).not.toContain('database password');
  });

  it('extracts the transaction from the live FedaPay entity payload shape', () => {
    const payload = {
      name: 'transaction.approved',
      object: 'transaction',
      entity: {
        klass: 'v1/transaction',
        id: 113034942,
        reference: 'trx_9L0_1788932131726',
        amount: 100,
        description: 'Recharge Omni Wallet',
        status: 'approved',
        currency: { klass: 'v1/currency', id: 1, iso: 'XOF', div: 1 },
        custom_metadata: { omni_recharge_id: 'f8406146-2938-4811-910b-c6229c77399a' },
        customer_id: 7872480,
      },
    };
    const { transaction, metadata } = extractFedaPayTransaction(payload);
    expect(transaction.id).toBe(113034942);
    expect((transaction.currency as Record<string, unknown>).iso).toBe('XOF');
    expect(metadata.omni_recharge_id).toBe('f8406146-2938-4811-910b-c6229c77399a');
  });

  it('extracts the transaction from the documented nested object shape', () => {
    const payload = {
      id: 'evt_1',
      type: 'transaction.approved',
      object: { transaction: { id: 'trx_1', amount: 100, currency: { iso: 'XOF' }, custom_metadata: { omni_recharge_id: 'recharge-1' } } },
    };
    const { transaction, metadata } = extractFedaPayTransaction(payload);
    expect(transaction.id).toBe('trx_1');
    expect(metadata.omni_recharge_id).toBe('recharge-1');
  });
});


describe('seller facility create validator (NW-13c)', () => {
  const key = 'nwc13-http-key-0001';

  it('accepts a fixe facility with coordinates and no rayon', () => {
    const out = validateSellerFacilityCreate({ name: 'Boutique A', facilityType: 'fixe', category: null, description: null, address: null, latitude: 6.13, longitude: 1.22, rayonKm: null }, key, 'auth-user-1');
    expect(out).toMatchObject({ name: 'Boutique A', facilityType: 'fixe', latitude: 6.13, longitude: 1.22, rayonKm: null });
  });

  it('accepts a digital facility without coordinates', () => {
    const out = validateSellerFacilityCreate({ name: 'En ligne', facilityType: 'digital', category: null, description: null, address: 'Lomé', latitude: null, longitude: null, rayonKm: null }, key, 'auth-user-1');
    expect(out).toMatchObject({ facilityType: 'digital', latitude: null, longitude: null, rayonKm: null });
  });

  it('rejects a fixe facility missing coordinates', () => {
    expect(() => validateSellerFacilityCreate({ name: 'Boutique A', facilityType: 'fixe', category: null, description: null, address: null, latitude: null, longitude: null, rayonKm: null }, key, 'auth-user-1')).toThrow(ApiInputError);
  });

  it('rejects an unknown facility type', () => {
    expect(() => validateSellerFacilityCreate({ name: 'Boutique A', facilityType: 'parking', category: null, description: null, address: null, latitude: 6.13, longitude: 1.22, rayonKm: null }, key, 'auth-user-1')).toThrow(ApiInputError);
  });

  it('rejects a rayon on a fixe facility', () => {
    expect(() => validateSellerFacilityCreate({ name: 'Boutique A', facilityType: 'fixe', category: null, description: null, address: null, latitude: 6.13, longitude: 1.22, rayonKm: 10 }, key, 'auth-user-1')).toThrow(ApiInputError);
  });

  it('requires a rayon on a mobile facility', () => {
    expect(() => validateSellerFacilityCreate({ name: 'Échoppe', facilityType: 'mobile', category: null, description: null, address: null, latitude: 6.13, longitude: 1.22, rayonKm: null }, key, 'auth-user-1')).toThrow(ApiInputError);
  });

  it('accepts optional contact fields (RAC-1)', () => {
    const out = validateSellerFacilityCreate({ name: 'Boutique A', facilityType: 'fixe', category: null, description: null, address: null, latitude: 6.13, longitude: 1.22, rayonKm: null, contactPhone: '+22890000000', contactWhatsapp: '' }, key, 'auth-user-1');
    expect(out).toMatchObject({ contactPhone: '+22890000000', contactWhatsapp: null });
  });

  it('rejects a too-short contact phone (RAC-1)', () => {
    expect(() => validateSellerFacilityCreate({ name: 'Boutique A', facilityType: 'fixe', category: null, description: null, address: null, latitude: 6.13, longitude: 1.22, rayonKm: null, contactPhone: '1234', contactWhatsapp: null }, key, 'auth-user-1')).toThrow(ApiInputError);
  });

  it('rejects an over-long contact whatsapp (RAC-1)', () => {
    expect(() => validateSellerFacilityCreate({ name: 'Boutique A', facilityType: 'fixe', category: null, description: null, address: null, latitude: 6.13, longitude: 1.22, rayonKm: null, contactPhone: null, contactWhatsapp: 'x'.repeat(41) }, key, 'auth-user-1')).toThrow(ApiInputError);
  });
});

describe('ad campaign validator (NW-13j)', () => {
  const key = 'nw13j-http-key-0001';
  const facilityId = '8e0e2268-b5bb-4b8c-9b3e-1f0a90d6f7c2';
  it('accepts a valid manual campaign', () => {
    const input = validateAdCampaignCreate({ name: 'Coup de projecteur', budgetMinor: 50000, startsAt: '2026-09-13T00:00:00.000Z', endsAt: '2026-10-13T00:00:00.000Z' }, facilityId, key, 'auth-user-1');
    expect(input).toMatchObject({ authUserId: 'auth-user-1', facilityId, name: 'Coup de projecteur', budgetMinor: 50000 });
  });
  it('rejects a blank or over-long name', () => {
    expect(() => validateAdCampaignCreate({ name: '   ', budgetMinor: 5000, startsAt: '2026-09-13T00:00:00.000Z', endsAt: '2026-10-13T00:00:00.000Z' }, facilityId, key, 'auth-user-1')).toThrow(ApiInputError);
    expect(() => validateAdCampaignCreate({ name: 'x'.repeat(61), budgetMinor: 5000, startsAt: '2026-09-13T00:00:00.000Z', endsAt: '2026-10-13T00:00:00.000Z' }, facilityId, key, 'auth-user-1')).toThrow(ApiInputError);
  });
  it('rejects a non-positive or non-integer budget', () => {
    expect(() => validateAdCampaignCreate({ name: 'Boost', budgetMinor: 0, startsAt: '2026-09-13T00:00:00.000Z', endsAt: '2026-10-13T00:00:00.000Z' }, facilityId, key, 'auth-user-1')).toThrow(ApiInputError);
    expect(() => validateAdCampaignCreate({ name: 'Boost', budgetMinor: 50.5, startsAt: '2026-09-13T00:00:00.000Z', endsAt: '2026-10-13T00:00:00.000Z' }, facilityId, key, 'auth-user-1')).toThrow(ApiInputError);
  });
  it('rejects an invalid window', () => {
    expect(() => validateAdCampaignCreate({ name: 'Boost', budgetMinor: 5000, startsAt: '2026-10-13T00:00:00.000Z', endsAt: '2026-09-13T00:00:00.000Z' }, facilityId, key, 'auth-user-1')).toThrow(ApiInputError);
    expect(() => validateAdCampaignCreate({ name: 'Boost', budgetMinor: 5000, startsAt: 'nope', endsAt: '2026-10-13T00:00:00.000Z' }, facilityId, key, 'auth-user-1')).toThrow(ApiInputError);
  });
  it('rejects a malformed facility id or short idempotency key', () => {
    expect(() => validateAdCampaignCreate({ name: 'Boost', budgetMinor: 5000, startsAt: '2026-09-13T00:00:00.000Z', endsAt: '2026-10-13T00:00:00.000Z' }, 'not-a-uuid', key, 'auth-user-1')).toThrow(ApiInputError);
    expect(() => validateAdCampaignCreate({ name: 'Boost', budgetMinor: 5000, startsAt: '2026-09-13T00:00:00.000Z', endsAt: '2026-10-13T00:00:00.000Z' }, facilityId, 'short', 'auth-user-1')).toThrow(ApiInputError);
  });
  it('maps WalletPolicyError to a 409 POLICY_REJECTED non-retryable response', () => {
    const response = toApiErrorResponse('corr-1', new WalletPolicyError('Insufficient wallet balance to reserve the campaign budget.'));
    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ ok: false, error: { code: 'POLICY_REJECTED', retryable: false } });
  });
});

describe('team invite / facility zone validators (NW-15 P2-C)', () => {
  const inviteId = '6d8f7a1e-2f2a-4e22-9d1c-7b5c88a1e9d4';
  const facilityId = '8e0e2268-b5bb-4b8c-9b3e-1f0a90d6f7c2';

  it('accepts a valid team invite id', () => {
    expect(validateTeamInviteAccept({}, inviteId)).toEqual({ inviteId });
  });
  it('rejects a malformed team invite id', () => {
    expect(() => validateTeamInviteAccept({}, 'not-a-uuid')).toThrow(ApiInputError);
  });

  it('accepts an optional zone on a valid facility id', () => {
    expect(validateFacilityZoneAssignment({ zone: 'Lomé Est' }, facilityId)).toEqual({ facilityId, zone: 'Lomé Est' });
    expect(validateFacilityZoneAssignment({ zone: null }, facilityId)).toEqual({ facilityId, zone: null });
    expect(validateFacilityZoneAssignment({}, facilityId)).toEqual({ facilityId, zone: null });
  });
  it('rejects a malformed facility id or an over-long zone', () => {
    expect(() => validateFacilityZoneAssignment({ zone: 'A' }, 'not-a-uuid')).toThrow(ApiInputError);
    expect(() => validateFacilityZoneAssignment({ zone: 'x'.repeat(121) }, facilityId)).toThrow(ApiInputError);
  });
});
