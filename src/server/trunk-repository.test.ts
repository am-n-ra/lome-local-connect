import { describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { AvailabilityPolicyError, AvailabilityResponsePolicyError, FieldPilotPolicyError, InsufficientCreditsError, PurchaseIntentPolicyError, SellerCataloguePolicyError, TransactionPolicyError, WalletPolicyError, createTrunkRepository, toProduct } from './trunk-repository';
import { qrExpiryFrom, resolveQrTtlMinutes } from '../trunk/transaction-time';

type SqlStub = ReturnType<typeof neon>;

const availabilityInput = {
  authUserId: 'auth-user-1',
  productId: 'product-1',
  facilityId: 'facility-1',
  quantity: 2,
  budgetMode: 'maximum' as const,
  budgetMinor: 1000,
  deliveryMode: 'livraison' as const,
  note: 'Livrer avant 17h',
  idempotencyKey: 'availability-key-1',
};

const resultRow = {
  id: 'request-1',
  product_id: 'product-1',
  facility_id: 'facility-1',
  requested_quantity: 2,
  budget_mode: 'maximum',
  budget_minor: 1000,
  status: 'submitted',
  delivery_mode: 'livraison',
  request_note: 'Livrer avant 17h',
  expires_at: '2026-08-22T01:00:00.000Z',
  monthly_quota: 3,
  extra_credits: 0,
  credits_used_result: 1,
  plan: 'free',
  is_new: 1,
  debited: 1,
};

function stubSql(rows: Record<string, unknown>[]): { sql: SqlStub; queries: string[] } {
  const queries: string[] = [];
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push(strings.raw.join('¦'));
    void values;
    return Promise.resolve(rows);
  }) as SqlStub;
  return { sql, queries };
}

/** Alternates between the given row-sets on every call (credit standing then main statement). */
function stubSqlAlternating(sets: Record<string, unknown>[][]): { sql: SqlStub; queries: string[] } {
  const queries: string[] = [];
  let call = 0;
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push(strings.raw.join('¦'));
    void values;
    const rows = sets[call % sets.length] ?? [];
    call += 1;
    return Promise.resolve(rows);
  }) as SqlStub;
  return { sql, queries };
}

const creditStandingRow = {
  buyer_account_id: 'account-1',
  plan: 'free',
  monthly_quota: 3,
  credits_used: 0,
  extra_credits: 0,
  period_month: '2026-09',
};

describe('account context Root seam', () => {
  it('returns only active role capabilities and safe account state', async () => {
    const call = stubSql([{ id: 'account-1', onboarding_state: 'seller_ready', suspended_at: null, facility_count: 2, facility_ids: ['facility-1', 'facility-2'], roles: ['buyer', 'seller', 'reviewer', 'revoked'] }]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.getAccountContext({ authUserId: 'auth-user-1' })).resolves.toEqual({
      accountId: 'account-1',
      roles: ['buyer', 'seller', 'reviewer'],
      onboardingState: 'seller_ready',
      suspended: false,
      facilityCount: 2,
      ownedFacilityIds: ['facility-1', 'facility-2'],
      capabilities: { sellerWorkspace: true, operatorTools: false, reviewerWorkspace: true, adminTools: false },
    });
    expect(call.queries[0]).toContain("ar.status = 'active'");
    expect(call.queries[0]).not.toContain('select a.auth_user_id');
  });

  it('returns null when Auth is not linked to an Omni account', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.getAccountContext({ authUserId: 'unknown-auth-user' })).resolves.toBeNull();
  });
});

describe('public product boundary (v3 model)', () => {
  it('maps v3 fields without leaking internal columns', () => {
    const product = toProduct({
      id: 'product-1',
      facility_id: 'facility-1',
      name: 'Tomatoes',
      description: 'Fresh tomatoes',
      category: 'Fresh produce',
      unit: '1 kg',
      price_minor: 2000,
      currency: 'XOF',
      discount_kind: 'percentage',
      discount_value_minor: 25,
      quantity_allocated_omni: 12,
      coupon_label: null,
    });
    expect(product).not.toHaveProperty('availableQuantity');
    expect(product).not.toHaveProperty('quantity_allocated_omni');
    expect(product).not.toHaveProperty('priceMinor');
    expect(product).not.toHaveProperty('discountKind');
    expect(product).toMatchObject({
      id: 'product-1',
      facilityId: 'facility-1',
      name: 'Tomatoes',
      prixOriginal: 2000,
      prixReduit: 1500,
      pourcentageReduction: 25,
      stockLoueOmni: 12,
    });
  });

  it('computes a mandatory prixReduit and percent reduction from a percentage discount', () => {
    const product = toProduct({ id: 'p', facility_id: 'f', name: 'n', unit: 'u', price_minor: 5000, currency: 'XOF', discount_kind: 'percentage', discount_value_minor: 10, quantity_allocated_omni: 3 });
    expect(product.pourcentageReduction).toBe(10);
    expect(product.prixReduit).toBe(4500);
    expect(product.prixReduit).toBeLessThan(product.prixOriginal);
    expect(product.stockLoueOmni).toBe(3);
  });

  it('projects reserved units out of the advertised stock (FF-8 no oversell)', () => {
    const product = toProduct({ id: 'p', facility_id: 'f', name: 'n', unit: 'u', price_minor: 5000, currency: 'XOF', discount_kind: 'percentage', discount_value_minor: 10, quantity_allocated_omni: 10, quantity_reserved_omni: 4 });
    expect(product.stockLoueOmni).toBe(6);
    // Une réservation historique supérieure au stock déclaré ne doit jamais
    // produire une disponibilité négative.
    const overReserved = toProduct({ id: 'p', facility_id: 'f', name: 'n', unit: 'u', price_minor: 5000, currency: 'XOF', discount_kind: null, discount_value_minor: null, quantity_allocated_omni: 2, quantity_reserved_omni: 5 });
    expect(overReserved.stockLoueOmni).toBe(0);
  });

  it('a discount-less row maps to 0% (creation itself rejects discount-less products)', () => {
    const product = toProduct({ id: 'p', facility_id: 'f', name: 'n', unit: 'u', price_minor: 1000, currency: 'XOF', discount_kind: null, discount_value_minor: null, quantity_allocated_omni: 0 });
    expect(product.pourcentageReduction).toBe(0);
    expect(product.prixReduit).toBe(product.prixOriginal);
  });

  it('S-06/S-32 — derives existence, integrity and reputation when the query supplies the facts', () => {
    const product = toProduct({
      id: 'p', facility_id: 'f', name: 'n', unit: 'u', price_minor: 5000, currency: 'XOF',
      discount_kind: null, discount_value_minor: null,
      quantity_allocated_omni: 10, quantity_reserved_omni: 0,
      media: [], description: 'Une description assez longue.',
      publication_state: 'published', availability_state: 'en_stock', availability_expires_at: null,
      has_entity: true, reputation_count: 3, reputation_sum: 14, is_duplicate: false,
    });
    expect(product.existence).toEqual({ level: 4, label: 'Transactable', hint: 'transaction Omni possible maintenant' });
    // No visual → never `ok`, and the reason is named.
    expect(product.integrity?.state).toBe('partielle');
    expect(product.integrity?.failed).toEqual(['visuel']);
    expect(product.reputation).toEqual({ count: 3, score: 4.7 });
  });

  it('S-06 — published with nothing reservable is level 3, never 4 (the oversell lie)', () => {
    const product = toProduct({
      id: 'p', facility_id: 'f', name: 'n', unit: 'u', price_minor: 5000, currency: 'XOF',
      discount_kind: null, discount_value_minor: null,
      quantity_allocated_omni: 2, quantity_reserved_omni: 2,
      media: [], description: 'Une description assez longue.',
      publication_state: 'published', availability_state: 'verifie', availability_expires_at: null,
      has_entity: true, reputation_count: 0, reputation_sum: null, is_duplicate: false,
    });
    expect(product.existence?.level).toBe(3);
    expect(product.reputation).toEqual({ count: 0, score: null });
  });

  it('S-06/S-32 — a legacy row without the facts omits the fields instead of inventing them', () => {
    const product = toProduct({ id: 'p', facility_id: 'f', name: 'n', unit: 'u', price_minor: 5000, currency: 'XOF', discount_kind: null, discount_value_minor: null, quantity_allocated_omni: 1 });
    expect(product).not.toHaveProperty('existence');
    expect(product).not.toHaveProperty('integrity');
    expect(product).not.toHaveProperty('reputation');
  });

  it('rejects a seller product draft without a mandatory reduction', async () => {
    const repository = createTrunkRepository(stubSql([]).sql);
    await expect(
      repository.createSellerProductDraft({
        authUserId: 'auth-1', facilityId: '20000000-0000-0000-0000-000000000001', name: 'Riz', description: null, unit: 'sac', prixOriginal: 5000, currency: 'XOF', pourcentageReduction: 0, stockLoueOmni: 5, idempotencyKey: 'idem-discount-mandatory',
      }),
    ).rejects.toThrow(SellerCataloguePolicyError);
  });

  // S-01 — R-B : les caractéristiques de l'offre sont écrites et relues. Avant R-B,
  // les cinq colonnes `*_kind` existaient en base mais n'étaient JAMAIS renseignées :
  // une offre naissait sans aucune caractéristique, ce qui vidait « tout est offre ».
  it('writes the offer characteristics into the draft insert (R-B / S-01)', async () => {
    const call = stubSql([{ id: '30000000-0000-0000-0000-000000000001', facility_id: '20000000-0000-0000-0000-000000000001', name: 'Riz', publication_state: 'draft', price_minor: 5000, discount_kind: 'percentage', discount_value_minor: 10 }]);
    const repository = createTrunkRepository(call.sql);
    await repository.createSellerProductDraft({
      authUserId: 'auth-1', facilityId: '20000000-0000-0000-0000-000000000001', name: 'Riz', description: null, unit: 'sac', prixOriginal: 5000, currency: 'XOF', pourcentageReduction: 10, stockLoueOmni: 5, idempotencyKey: 'idem-carac-write',
      positionKind: 'mobile', uniquenessKind: 'piece_unique', handoverKind: 'livraison', priceKind: 'negociable', conditionKind: 'occasion',
    });
    expect(call.queries[0]).toContain('position_kind');
    expect(call.queries[0]).toContain('uniqueness_kind');
    expect(call.queries[0]).toContain('handover_kind');
    expect(call.queries[0]).toContain('price_kind');
    expect(call.queries[0]).toContain('condition_kind');
  });

  it('rejects an unknown characteristic value instead of writing it (R-B / S-01)', async () => {
    const repository = createTrunkRepository(stubSql([]).sql);
    await expect(
      repository.createSellerProductDraft({
        authUserId: 'auth-1', facilityId: '20000000-0000-0000-0000-000000000001', name: 'Riz', description: null, unit: 'sac', prixOriginal: 5000, currency: 'XOF', pourcentageReduction: 10, stockLoueOmni: 5, idempotencyKey: 'idem-carac-invalid',
        positionKind: 'teleportation',
      }),
    ).rejects.toThrow(SellerCataloguePolicyError);
  });

  it('accepts an offer with no declared characteristic (nullable by design)', async () => {
    const call = stubSql([{ id: '30000000-0000-0000-0000-000000000002', facility_id: '20000000-0000-0000-0000-000000000001', name: 'Riz', publication_state: 'draft', price_minor: 5000, discount_kind: 'percentage', discount_value_minor: 10 }]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createSellerProductDraft({
      authUserId: 'auth-1', facilityId: '20000000-0000-0000-0000-000000000001', name: 'Riz', description: null, unit: 'sac', prixOriginal: 5000, currency: 'XOF', pourcentageReduction: 10, stockLoueOmni: 5, idempotencyKey: 'idem-carac-null',
    })).resolves.toMatchObject({ publicationState: 'draft' });
  });

  it('reads the offer characteristics back on the public offer (R-B / S-01)', () => {
    const product = toProduct({
      id: 'p', facility_id: 'f', name: 'Ordinateur Dell', unit: 'u', price_minor: 5000, currency: 'XOF', discount_kind: 'percentage', discount_value_minor: 10, quantity_allocated_omni: 1,
      position_kind: 'fixe', uniqueness_kind: 'piece_unique', handover_kind: 'retrait', price_kind: 'negociable', condition_kind: 'occasion',
    });
    expect(product).toMatchObject({ positionKind: 'fixe', uniquenessKind: 'piece_unique', handoverKind: 'retrait', priceKind: 'negociable', conditionKind: 'occasion' });
  });

  it('never invents a characteristic the row does not carry (R-B / S-01)', () => {
    const product = toProduct({ id: 'p', facility_id: 'f', name: 'n', unit: 'u', price_minor: 1000, currency: 'XOF', discount_kind: null, discount_value_minor: null, quantity_allocated_omni: 0 });
    expect(product).toMatchObject({ positionKind: null, uniquenessKind: null, handoverKind: null, priceKind: null, conditionKind: null });
  });
});

describe('public facility trust boundary', () => {
  it('does not expose internal pre-review states as public trust claims', async () => {
    const call = stubSql([{
      id: 'facility-1',
      name: 'Marche de Hanoukope',
      category: 'Market',
      address: 'Hanoukope, Lome',
      latitude: 6.1256,
      longitude: 1.2124,
      trust_state: 'verification_draft',
      commercial_plan: 'free',
      product_count: 0,
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.listPublicFacilities();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'Marche de Hanoukope', trust: 'unclaimed' });
  });

  it('derives the sponsored flag from a count, not a min(uuid) aggregate (regression: don\'t 500)', async () => {
    const call = stubSql([{
      id: 'facility-1',
      name: 'Boulangerie du Marché d\'Adawlato',
      category: 'Boulangerie',
      address: 'Marché d\'Adawlato, Lomé, Togo',
      latitude: 6.1319,
      longitude: 1.2225,
      trust_state: 'confirmed',
      commercial_plan: 'free',
      product_count: 3,
      sponsored: false,
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.listPublicFacilities();

    expect(result).toHaveLength(1);
    expect(result[0].sponsored).toBe(false);
    // Real Postgres has no min(uuid); the NW-13j boost must use a count predicate.
    const query = call.queries.join('¦');
    expect(query).not.toContain('min(camp.id)');
    expect(query).toContain('(count(camp.id) > 0) as sponsored');
  });
});

describe('availability repository Root seam', () => {
  it('keeps account, wallet and request in guarded statements; manual check is free and replays the canonical request', async () => {
    const firstCall = stubSqlSequence([[resultRow], [creditStandingRow], [resultRow], [creditStandingRow]]);
    const repository = createTrunkRepository(firstCall.sql);

    const first = await repository.createAvailabilityRequest(availabilityInput);
    const replay = await repository.createAvailabilityRequest(availabilityInput);

    expect(first.requestId).toBe('request-1');
    expect(first).toMatchObject({ creditCost: 0, creditsRemaining: 3, monthlyQuota: 3, plan: 'free' });
    expect(replay).toEqual(first);
    expect(firstCall.queries).toHaveLength(4);
    expect(firstCall.queries[1]).toContain('v2_buyer_credit_accounts');
    expect(firstCall.queries[1]).toContain("'free', 3");
    expect(firstCall.queries[1]).toContain('to_char(now(),');
    expect(firstCall.queries[0]).toContain('with valid_selection as');
    expect(firstCall.queries[0]).toContain('on conflict (auth_user_id)');
    expect(firstCall.queries[0]).toContain('on conflict (account_id)');
    expect(firstCall.queries[0]).toContain('on conflict (buyer_account_id, idempotency_key)');
    expect(firstCall.queries[0]).toContain("p.publication_state = 'published'");
    // R-3a : la confiance se lit sur l'entité d'abord (S-30), repli sur le lieu.
    expect(firstCall.queries[0]).toContain("coalesce(e.trust_state, f.trust_state) in ('certified', 'unconfirmed', 'confirmed')");
    expect(firstCall.queries[0]).not.toContain('credit_spend as');
    expect(firstCall.queries[0]).not.toContain('v2_availability_credit_ledger');
  });

  it('does not provision an account or wallet when the selected product is outside the requested facility or unpublished', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.createAvailabilityRequest(availabilityInput)).rejects.toBeInstanceOf(AvailabilityPolicyError);
    expect(call.queries).toHaveLength(1);
    expect(call.queries[0]).toContain('where exists (select 1 from valid_selection)');
  });

  it('rejects an idempotency replay whose request shape differs from the stored response', async () => {
    const call = stubSqlSequence([[{ ...resultRow, requested_quantity: 1 }], [creditStandingRow]]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.createAvailabilityRequest(availabilityInput)).rejects.toThrow(
      'The idempotency key is already used for a different availability request.',
    );
  });

  it('D-C5: a bulk need costs 1 credit whatever the number of facilities, and stores the whole scope', async () => {
    const bulkResultRow = {
      ...resultRow,
      facility_id: undefined,
      facility_scope: ['facility-1', 'facility-2', 'facility-3'],
      credits_used_result: 1,
      is_new: 1,
      debited: 1,
    };
    const call = stubSqlAlternating([[creditStandingRow], [bulkResultRow]]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.createBulkAvailabilityRequest({
      ...availabilityInput,
      facilityIds: ['facility-1', 'facility-2', 'facility-3'],
      idempotencyKey: 'bulk-key-1',
    });

    expect(result).toMatchObject({ facilityIds: ['facility-1', 'facility-2', 'facility-3'], facilityCount: 3, creditCost: 1, monthlyQuota: 3, plan: 'free', creditsRemaining: 2 });
    expect(call.queries).toHaveLength(2);
    expect(call.queries[1]).toContain('credit_spend as');
    expect(call.queries[1]).toContain('v2_availability_credit_ledger');
    expect(call.queries[1]).toContain('1 credit per need');
    expect(call.queries[1]).toContain('::text[]::uuid[]');
  });

  it('throws InsufficientCreditsError before touching the DB when the monthly bulk credits are exhausted', async () => {
    const call = stubSql([{ ...creditStandingRow, credits_used: 3 }]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.createBulkAvailabilityRequest({ ...availabilityInput, facilityIds: ['facility-1', 'facility-2'], idempotencyKey: 'bulk-key-1' })).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(call.queries).toHaveLength(1);
  });

  it('D-C5: 150 facilities for ONE need still costs 1 credit — the cost does not grow with suppliers', async () => {
    const ids = Array.from({ length: 150 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`);
    const bulk150Row = {
      ...resultRow,
      facility_id: undefined,
      facility_scope: ids,
      credits_used_result: 1,
      is_new: 1,
      debited: 1,
    };
    const call = stubSqlAlternating([[creditStandingRow], [bulk150Row]]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.createBulkAvailabilityRequest({ ...availabilityInput, facilityIds: ids, idempotencyKey: 'bulk-150' });

    expect(result.creditCost).toBe(1);
    expect(result.facilityCount).toBe(150);
    expect(call.queries[1]).toContain('set credits_used = c.credits_used +');
    expect(call.queries[1]).toContain("'bulk_debit', - ");
    expect(call.queries[1]).toContain('credit_spend as');
  });

  it('rejects a bulk request targeting fewer than 2 facilities', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.createBulkAvailabilityRequest({ ...availabilityInput, facilityIds: ['facility-1'], idempotencyKey: 'bulk-key-1' })).rejects.toThrow('A bulk request must target at least 2 facilities');
    expect(call.queries).toHaveLength(0);
  });

  it('creates the monthly credit standing with a free quota of 3 and does not reset used credits mid-month', async () => {
    const call = stubSql([{ ...creditStandingRow, credits_used: 1 }]);
    const repository = createTrunkRepository(call.sql);

    const standing = await repository.getOrCreateCreditStanding({ authUserId: 'auth-user-1' });
    expect(standing).toEqual({ accountId: 'account-1', plan: 'free', monthlyQuota: 3, creditsUsed: 1, extraCredits: 0, creditsRemaining: 2, periodMonth: '2026-09' });
    expect(call.queries[0]).toContain('v2_buyer_credit_accounts');
    expect(call.queries[0]).toContain('period_month <> to_char(now()');
    expect(call.queries[0]).toContain('then 0');
  });

  it('returns the buyer credit summary for an existing standing account', async () => {
    const call = stubSql([{ ...creditStandingRow, extra_credits: 10 }]);
    const repository = createTrunkRepository(call.sql);

    const summary = await repository.getBuyerCreditSummary({ authUserId: 'auth-user-1' });
    expect(summary).toEqual({ accountId: 'account-1', plan: 'free', monthlyQuota: 3, creditsUsed: 0, extraCredits: 10, creditsRemaining: 13, periodMonth: '2026-09' });
    expect(call.queries[0]).toContain('v2_buyer_credit_accounts c');
    expect(call.queries[0]).toContain("a.auth_user_id");
  });
});

describe('buyer availability response read seam', () => {
  it('returns only a buyer-owned request with mapped response and freshness', async () => {
    const call = stubSql([{
      request_id: 'request-1',
      product_id: 'product-1',
      facility_id: 'facility-1',
      expires_at: '2099-08-23T01:00:00.000Z',
      request_status: 'submitted',
      response_id: 'response-1',
      response_facility_id: 'facility-1',
      facility_name: 'Demo Facility',
      facility_category: 'Local supply',
      product_name: 'Tomatoes',
      response_status: 'available',
      quantity_available: 2,
      price_minor: 1500,
      currency: 'USD',
      seller_message: 'Ready for pickup.',
      observed_at: '2099-08-22T23:00:00.000Z',
      freshness: 'fresh',
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.getAvailabilityResponses({ authUserId: 'auth-user-1', requestId: 'request-1' });

    expect(result.requestStatus).toBe('responses');
    expect(result.responses).toEqual([expect.objectContaining({
      id: 'response-1',
      facilityName: 'Demo Facility',
      productName: 'Tomatoes',
      status: 'available',
      quantityAvailable: 2,
      priceMinor: 1500,
      freshness: 'fresh',
    })]);
    expect(call.queries[0]).toContain('a.auth_user_id');
    expect(call.queries[0]).toContain('left join v2_availability_responses');
  });

  it('does not reveal a missing or non-owned request', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.getAvailabilityResponses({ authUserId: 'auth-user-2', requestId: 'request-1' })).rejects.toThrow('not found or is not owned');
  });
});

describe('buyer request resume seam', () => {
  it('returns buyer-owned request summaries with response count and server state', async () => {
    const call = stubSql([{
      id: 'request-1',
      facility_id: 'facility-1',
      facility_name: 'Demo Facility',
      facility_category: 'Local supply',
      facility_latitude: 6.1319,
      facility_longitude: 1.2223,
      product_id: 'product-1',
      product_name: 'Demo product',
      requested_quantity: 2,
      budget_mode: 'unlimited',
      budget_minor: null,
      request_status: 'responses',
      created_at: '2026-08-23T10:00:00.000Z',
      expires_at: '2026-08-23T11:00:00.000Z',
      response_count: 1,
      delivery_mode: 'livraison',
      request_note: 'Livrer avant 17h',
    }]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.getBuyerAvailabilityRequests({ authUserId: 'auth-user-1' })).resolves.toEqual({ requests: [{
      id: 'request-1',
      facilityId: 'facility-1',
      facilityName: 'Demo Facility',
      facilityCategory: 'Local supply',
      productId: 'product-1',
      productName: 'Demo product',
      requestedQuantity: 2,
      budgetMode: 'unlimited',
      budgetMinor: null,
      requestStatus: 'responses',
      createdAt: '2026-08-23T10:00:00.000Z',
      expiresAt: '2026-08-23T11:00:00.000Z',
      responseCount: 1,
      deliveryMode: 'livraison',
      note: 'Livrer avant 17h',
      latitude: 6.1319,
      longitude: 1.2223,
    }] });
    expect(call.queries[0]).toContain('a.auth_user_id');
    expect(call.queries[0]).toContain('a.suspended_at is null');
    expect(call.queries[0]).toContain('limit 50');
  });
});

describe('seller demo rebinding seam', () => {
  it('rebinds only the labeled Seller fixture and records a bounded audit event', async () => {
    const queries: string[] = [];
    const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
      queries.push(strings.raw.join('¦'));
      void values;
      return Promise.resolve(queries.length === 1
        ? [{ id: 'seller-1', auth_user_id: 'old-auth', conflicting_auth_binding: false, labeled_demo_facility: true }]
        : [{ id: 'seller-1' }]);
    }) as unknown as SqlStub;
    const repository = createTrunkRepository(sql);

    await expect(repository.rebindDemoSeller({ authUserId: 'new-auth' })).resolves.toEqual({ authorized: true });
    expect(queries[0]).toContain("f.name = 'Omni Demo Seller Hub'");
    expect(queries[0]).toContain("f.source_ref = 'D-V2-DEMO-FACILITY'");
    expect(queries[1]).toContain('seller_demo_rebound');
    expect(queries[1]).toContain('set auth_user_id');
  });

  it('rejects a missing or unlabeled Seller fixture before any update', async () => {
    const call = stubSql([{ id: 'seller-1', auth_user_id: 'old-auth', conflicting_auth_binding: false, labeled_demo_facility: false }]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.rebindDemoSeller({ authUserId: 'new-auth' })).rejects.toThrow('labeled Seller demonstration fixture');
    expect(call.queries).toHaveLength(1);
  });
});

describe('seller availability queue read seam', () => {
  it('returns only authorized seller-scoped requests and response state', async () => {
    const queries: string[] = [];
    const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
      queries.push(strings.raw.join('¦'));
      void values;
      return Promise.resolve(queries.length === 1 ? [{ id: 'seller-1' }] : [{
        id: 'request-1',
        facility_id: 'facility-1',
        facility_name: 'Demo Facility',
        facility_category: 'Local supply',
        product_id: 'product-1',
        product_name: 'Tomatoes',
        requested_quantity: 2,
        budget_mode: 'maximum',
        budget_minor: 1500,
        request_status: 'submitted',
        created_at: '2026-08-23T00:00:00.000Z',
        expires_at: '2099-08-23T01:00:00.000Z',
        response_status: 'available',
        response_observed_at: '2026-08-23T00:05:00.000Z',
        delivery_mode: 'livraison',
        request_note: 'Livrer avant 17h',
        freshness: 'fresh',
      }]);
    }) as unknown as SqlStub;
    const repository = createTrunkRepository(sql);

    const result = await repository.getSellerAvailabilityQueue({ authUserId: 'auth-seller-1' });

    expect(result).toEqual({ authorized: true, requests: [expect.objectContaining({
      id: 'request-1',
      facilityId: 'facility-1',
      productName: 'Tomatoes',
      requestedQuantity: 2,
      budgetMinor: 1500,
      responseStatus: 'available',
      freshness: 'fresh',
    })] });
    expect(queries[0]).toContain("a.onboarding_state in ('seller_ready', 'complete')");
    expect(queries[1]).toContain('f.account_id');
    expect(queries[1]).toContain("p.publication_state = 'published'");
    expect(queries[1]).toContain('ar.responder_account_id');
  });

  it('returns a locked empty queue when Auth is present but seller authorization is absent', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.getSellerAvailabilityQueue({ authUserId: 'auth-buyer-1' })).resolves.toEqual({ authorized: false, requests: [] });
    expect(call.queries).toHaveLength(1);
  });
});

describe('seller availability response persistence Root seam', () => {
  it('accepts an owned seller response and records idempotent audit context', async () => {
    const call = stubSql([{
      id: 'response-1',
      request_id: 'request-1',
      facility_id: 'facility-1',
      product_id: 'product-1',
      status: 'available',
      quantity_available: 2,
      price_minor: 1500,
      observed_at: '2026-08-23T00:00:00.000Z',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.respondAvailability({
      authUserId: 'auth-seller-1',
      requestId: 'request-1',
      facilityId: 'facility-1',
      productId: 'product-1',
      status: 'available',
      quantityAvailable: 2,
      priceMinor: 1500,
      sellerMessage: 'Ready for pickup.',
      idempotencyKey: 'response-key-1',
      correlationId: 'corr-response-1',
    });
    expect(result).toEqual({
      responseId: 'response-1',
      requestId: 'request-1',
      facilityId: 'facility-1',
      productId: 'product-1',
      status: 'available',
      quantityAvailable: 2,
      priceMinor: 1500,
      observedAt: '2026-08-23T00:00:00.000Z',
    });
    expect(call.queries[0]).toContain("a.onboarding_state in ('seller_ready', 'complete')");
    expect(call.queries[0]).toContain('p.quantity_allocated_omni');
    expect(call.queries[0]).toContain('::int as quantity_available');
    expect(call.queries[0]).toContain('::int as price_minor');
    expect(call.queries[0]).not.toContain('case when ');
    expect(call.queries[0]).toContain('on conflict (responder_account_id, idempotency_key)');
    expect(call.queries[0]).toContain('insert into v2_audit_events');
  });

  it('rejects an unavailable response with a price or an over-allocated response before persistence', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.respondAvailability({
      authUserId: 'auth-seller-1',
      requestId: 'request-1',
      facilityId: 'facility-1',
      productId: 'product-1',
      status: 'unavailable',
      quantityAvailable: 0,
      priceMinor: 1500,
      sellerMessage: null,
      idempotencyKey: 'response-key-2',
      correlationId: 'corr-response-2',
    })).rejects.toBeInstanceOf(AvailabilityResponsePolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('rejects a seller response when the server finds no authorized matching context', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.respondAvailability({
      authUserId: 'auth-seller-1',
      requestId: 'request-1',
      facilityId: 'facility-1',
      productId: 'product-1',
      status: 'partial',
      quantityAvailable: 1,
      priceMinor: 1500,
      sellerMessage: null,
      idempotencyKey: 'response-key-3',
      correlationId: 'corr-response-3',
    })).rejects.toThrow('The seller is not authorized for this request, facility or product.');
  });
});

describe('QR issuance persistence Root seam', () => {
  it('issues a server-generated token only for an owned intent-created transaction', async () => {
    const call = stubSql([{
      transaction_id: 'transaction-1',
      expires_at: '2026-08-23T00:10:00.000Z',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.issueQrToken({
      authUserId: 'auth-seller-1',
      transactionId: 'transaction-1',
      correlationId: 'corr-qr-1',
    });
    expect(result.transactionId).toBe('transaction-1');
    expect(result.token).toHaveLength(43);
    expect(result.expiresAt).toBe('2026-08-23T00:10:00.000Z');
    expect(call.queries[0]).toContain("a.onboarding_state in ('seller_ready', 'complete')");
    expect(call.queries[0]).toContain('insert into v2_qr_tokens');
    expect(call.queries[0]).toContain('on conflict (transaction_id) do nothing');
    expect(call.queries[0]).toContain("'qr_ready'");
  });

  it('rejects QR issuance when seller membership or transaction state is missing', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.issueQrToken({
      authUserId: 'auth-seller-1',
      transactionId: 'transaction-1',
      correlationId: 'corr-qr-2',
    })).rejects.toBeInstanceOf(TransactionPolicyError);
  });
});

describe('Buyer QR issuance persistence Root seam', () => {
  it('issues a server-generated transaction token only for the authenticated buyer member', async () => {
    const call = stubSql([{
      transaction_id: 'transaction-1',
      expires_at: '2026-08-23T00:10:00.000Z',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.issueBuyerQrToken({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      correlationId: 'corr-buyer-qr-1',
    });
    expect(result.transactionId).toBe('transaction-1');
    expect(result.token).toHaveLength(43);
    expect(result.expiresAt).toBe('2026-08-23T00:10:00.000Z');
    expect(call.queries[0]).toContain("m.role = 'buyer'");
    expect(call.queries[0]).toContain("'issuer', 'buyer'");
    expect(call.queries[0]).toContain("'buyer_issued'");
  });

  it('rejects Buyer QR issuance when the authenticated account is not the transaction buyer', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.issueBuyerQrToken({
      authUserId: 'auth-not-buyer',
      transactionId: 'transaction-1',
      correlationId: 'corr-buyer-qr-2',
    })).rejects.toBeInstanceOf(TransactionPolicyError);
  });

  it('rotates an existing Buyer QR token safely when the prepared transaction is retried', async () => {
    const call = stubSql([{
      transaction_id: 'transaction-1',
      expires_at: '2026-08-23T00:20:00.000Z',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.issueBuyerQrToken({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      correlationId: 'corr-buyer-qr-retry',
    });
    expect(result.transactionId).toBe('transaction-1');
    expect(call.queries[0]).toContain("in ('intent_created', 'qr_ready')");
    expect(call.queries[0]).toContain('on conflict (transaction_id) do update');
    expect(call.queries[0]).toContain('verified_at = null');
    expect(call.queries[0]).toContain('replay_count = 0');
  });

  it('honours a configurable QR TTL when the caller shortens or lengthens the window', async () => {
    const call = stubSql([{ transaction_id: 'transaction-1', expires_at: '2026-08-23T00:30:00.000Z' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.issueBuyerQrToken({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      correlationId: 'corr-buyer-qr-ttl',
      now: '2026-08-23T00:00:00.000Z',
      ttlMinutes: 30,
    });
    expect(result.transactionId).toBe('transaction-1');
    // La fenêtre demandée fixe l'échéance (paramètre lié, calculé côté serveur).
    expect(qrExpiryFrom('2026-08-23T00:00:00.000Z', resolveQrTtlMinutes(30))).toBe('2026-08-23T00:30:00.000Z');
  });

  it('clamps an out-of-range TTL back to the 10 minute default', async () => {
    const call = stubSql([{ transaction_id: 'transaction-1', expires_at: '2026-08-23T00:10:00.000Z' }]);
    const repository = createTrunkRepository(call.sql);
    await repository.issueBuyerQrToken({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      correlationId: 'corr-buyer-qr-ttl-bad',
      now: '2026-08-23T00:00:00.000Z',
      ttlMinutes: 9999,
    });
    expect(resolveQrTtlMinutes(9999)).toBe(10);
    expect(qrExpiryFrom('2026-08-23T00:00:00.000Z', resolveQrTtlMinutes(9999))).toBe('2026-08-23T00:10:00.000Z');
  });
});

describe('FF-5 QR revocation Root seam', () => {
  it('revokes an unverified QR held by a participant and audits the action', async () => {
    const call = stubSql([{ transaction_id: 'transaction-1' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.revokeQrToken({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      correlationId: 'corr-qr-revoke-1',
      now: '2026-09-17T10:00:00.000Z',
    });
    expect(result).toEqual({ transactionId: 'transaction-1', revoked: true });
    const query = call.queries[0];
    expect(query).toContain('q.verified_at is null');
    expect(query).toContain('q.replay_count = 0');
    expect(query).toContain('set expires_at =');
    expect(query).toContain("'qr_revoked'");
    expect(query).toContain("'revoked_before_scan'");
    expect(query).toContain('on conflict (correlation_id, event_type, entity_type, entity_id) do nothing');
  });

  it('refuses to revoke when the QR is already scanned or unknown', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.revokeQrToken({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-9',
      correlationId: 'corr-qr-revoke-2',
    })).rejects.toBeInstanceOf(TransactionPolicyError);
  });
});

describe('external payment confirmation persistence Root seam', () => {
  it('confirms a buyer declaration only for an authenticated seller member in payment-declared state', async () => {
    const call = stubSql([{
      declaration_id: 'declaration-1',
      transaction_id: 'transaction-1',
      buyer_account_id: 'buyer-account-1',
      seller_account_id: 'seller-account-1',
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.confirmExternalPayment({
      authUserId: 'auth-seller-1',
      transactionId: 'transaction-1',
      correlationId: 'corr-confirm-1',
      now: '2026-08-23T00:00:00.000Z',
    });

    expect(result).toEqual({
      declarationId: 'declaration-1',
      transactionId: 'transaction-1',
      buyerAccountId: 'buyer-account-1',
      sellerAccountId: 'seller-account-1',
      state: 'payment_confirmed',
    });
    expect(call.queries[0]).toContain("m.role = 'seller'");
    expect(call.queries[0]).toContain("l.current_state = 'payment_declared'");
    expect(call.queries[0]).toContain('d.seller_acknowledged_at is null');
    expect(call.queries[0]).toContain('update v2_external_payment_declarations');
    expect(call.queries[0]).toContain("'payment_confirmed'");
    expect(call.queries[0]).toContain('insert into v2_audit_events');
  });

  it('rejects a missing seller/member/declaration state without mutating payment data', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.confirmExternalPayment({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      correlationId: 'corr-confirm-2',
      now: '2026-08-23T00:00:00.000Z',
    })).rejects.toThrow('Payment confirmation requires a seller member and a buyer declaration in payment-declared state.');
  });

  it('returns the existing confirmed declaration on a replay', async () => {
    const call = stubSql([{
      declaration_id: 'declaration-1',
      transaction_id: 'transaction-1',
      buyer_account_id: 'buyer-account-1',
      seller_account_id: 'seller-account-1',
    }]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.confirmExternalPayment({
      authUserId: 'auth-seller-1',
      transactionId: 'transaction-1',
      correlationId: 'corr-confirm-3',
      now: '2026-08-23T00:00:00.000Z',
    })).resolves.toMatchObject({ state: 'payment_confirmed', transactionId: 'transaction-1' });
  });
});

describe('external payment persistence Root seam', () => {
  it('records one supported buyer payment declaration after QR verification and appends its event/audit', async () => {
    const call = stubSql([{
      id: 'declaration-1',
      transaction_id: 'transaction-1',
      buyer_account_id: 'buyer-account-1',
      method: 'mobile_money',
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.declareExternalPayment({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      method: 'mobile_money',
      correlationId: 'corr-payment-1',
      now: '2026-08-23T00:00:00.000Z',
    });

    expect(result).toEqual({
      declarationId: 'declaration-1',
      transactionId: 'transaction-1',
      method: 'mobile_money',
      buyerAccountId: 'buyer-account-1',
    });
    expect(call.queries[0]).toContain("m.role = 'buyer'");
    expect(call.queries[0]).toContain("current_state in ('qr_verified', 'payment_declared')");
    expect(call.queries[0]).toContain('insert into v2_external_payment_declarations');
    expect(call.queries[0]).toContain('insert into v2_transaction_events');
    expect(call.queries[0]).toContain('insert into v2_audit_events');
    expect(call.queries[0]).toContain('on conflict (transaction_id) do update');
  });

  it('rejects unsupported payment methods before reaching the database', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.declareExternalPayment({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      method: 'card' as never,
      correlationId: 'corr-payment-2',
      now: '2026-08-23T00:00:00.000Z',
    })).rejects.toThrow('External payment method is not supported.');
    expect(call.queries).toHaveLength(0);
  });

  it('rejects a buyer without QR verification or with a different existing method', async () => {
    const emptyCall = stubSql([]);
    const repository = createTrunkRepository(emptyCall.sql);
    await expect(repository.declareExternalPayment({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      method: 'cash',
      correlationId: 'corr-payment-3',
      now: '2026-08-23T00:00:00.000Z',
    })).rejects.toThrow('Payment declaration requires a buyer member after QR verification.');

    const replayCall = stubSql([{
      id: 'declaration-1',
      transaction_id: 'transaction-1',
      buyer_account_id: 'buyer-account-1',
      method: 'cash',
    }]);
    const replayRepository = createTrunkRepository(replayCall.sql);
    await expect(replayRepository.declareExternalPayment({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      method: 'mobile_money',
      correlationId: 'corr-payment-4',
      now: '2026-08-23T00:00:00.000Z',
    })).rejects.toThrow('A different external payment method was already declared for this transaction.');
  });
});

describe('RT-D2 live purchase intent (itinerary gate)', () => {
  it('opens on an active intent alone — never on a live QR token', async () => {
    const call = stubSql([{ '?column?': 1 }]);
    const repository = createTrunkRepository(call.sql);

    expect(await repository.hasLivePurchaseIntent({ authUserId: 'auth-1' })).toBe(true);

    const query = call.queries[0];
    expect(query).toContain('v2_purchase_intents');
    expect(query).toContain("pi.state = 'active'");
    // The regression: a QR token lives 10 minutes, an intent survives 60 min of
    // inactivity and never expires once verified. Requiring a live QR refused
    // buyers who had already paid and scanned — the only moment it is useful.
    expect(query).not.toContain('v2_qr_tokens');
    expect(query).not.toContain('q.expires_at');
    expect(query).not.toContain('v2_transaction_snapshots');
  });

  it('refuses when no active intent exists', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    expect(await repository.hasLivePurchaseIntent({ authUserId: 'auth-1' })).toBe(false);
  });
});

describe('transaction persistence Root seam', () => {
  it('locks an authenticated member transaction and appends an allowed state event', async () => {
    const call = stubSql([{
      transaction_id: 'transaction-1',
      current_state: 'qr_ready',
      event_state: 'qr_verified',
      actor_account_id: 'seller-account-1',
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.transitionTransaction({
      authUserId: 'auth-seller-1',
      transactionId: 'transaction-1',
      from: 'qr_ready',
      to: 'qr_verified',
      actorRole: 'seller',
      correlationId: 'corr-transition-1',
      now: '2026-08-23T00:00:00.000Z',
    });

    expect(result).toEqual({
      accepted: true,
      transactionId: 'transaction-1',
      from: 'qr_ready',
      to: 'qr_verified',
      actorRole: 'seller',
    });
    expect(call.queries[0]).toContain('join v2_transaction_members m on m.transaction_id = s.transaction_id');
    expect(call.queries[0]).toContain('a.suspended_at is null');
    expect(call.queries[0]).toContain('for update of s');
    expect(call.queries[0]).toContain('insert into v2_transaction_events');
    expect(call.queries[0]).toContain("on conflict (transaction_id, state) do nothing");
    expect(call.queries[0]).toContain('insert into v2_audit_events');
    expect(call.queries[0]).toContain('on conflict (correlation_id, event_type, entity_type, entity_id) do nothing');
    // FF-7 : la contrepartie est notifiée (« à vous d'agir »).
    expect(call.queries[0]).toContain('insert into v2_notification_events');
    expect(call.queries[0]).toContain("'transaction_turn'");
    expect(call.queries[0]).toContain("m.role <> ");
    expect(call.queries[0]).toContain('insert into v2_notification_deliveries');
    expect(call.queries[0]).toContain("'web_push'");
    expect(call.queries[0]).toContain('on conflict (recipient_account_id, dedupe_key) do nothing');
  });

  it('rejects a stale or unauthorized transaction transition when the guarded query matches no row', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.transitionTransaction({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      from: 'qr_ready',
      to: 'qr_verified',
      actorRole: 'buyer',
      correlationId: 'corr-transition-2',
      now: '2026-08-23T00:00:00.000Z',
    })).rejects.toThrow('Transaction state is stale, membership is invalid, or the actor transition is not allowed.');
  });

  it('returns the same canonical transition result for an already-applied retry', async () => {
    const call = stubSql([{
      transaction_id: 'transaction-1',
      current_state: 'qr_verified',
      event_state: 'qr_verified',
      actor_account_id: 'seller-account-1',
    }]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.transitionTransaction({
      authUserId: 'auth-seller-1',
      transactionId: 'transaction-1',
      from: 'qr_ready',
      to: 'qr_verified',
      actorRole: 'seller',
      correlationId: 'corr-transition-3',
      now: '2026-08-23T00:00:00.000Z',
    })).resolves.toEqual({
      accepted: true,
      transactionId: 'transaction-1',
      from: 'qr_ready',
      to: 'qr_verified',
      actorRole: 'seller',
    });
  });
});

describe('wallet persistence Root seam', () => {
  it('unlocks exactly one nonwithdrawable $20 facility bonus after confirmed trust and three sales', async () => {
    const call = stubSql([{
      id: 'bonus-ledger-1',
      wallet_id: 'wallet-1',
      facility_id: 'facility-1',
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.unlockFacilityBonus({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      now: '2026-08-23T00:00:00.000Z',
    });

    expect(result).toEqual({
      ledgerEntryId: 'bonus-ledger-1',
      walletId: 'wallet-1',
      kind: 'bonus_grant',
      amountMinor: 10000,
      status: 'confirmed',
      facilityId: 'facility-1',
    });
    // R-3a : la confiance et le compteur se lisent sur l'ENTITE d'abord, repli sur le lieu.
    expect(call.queries[0]).toContain("coalesce(e.trust_state, f.trust_state) = 'confirmed'");
    expect(call.queries[0]).toContain('coalesce(e.qualifying_sales, f.qualifying_sales) >=');
    // C-6/S-14 : le seuil suit le volume (individu 1 / organisation 3), plus de 3 en dur.
    expect(call.queries[0]).toContain("e.kind = 'individu'");
    expect(call.queries[0]).toContain('f.bonus_unlocked_at is null');
    expect(call.queries[0]).toContain('for update of f');
    expect(call.queries[0]).toContain("'bonus_grant', 10000, 'confirmed'");
    expect(call.queries[0]).toContain('e.reference =');
  });

  it('does not grant the bonus when the eligibility or owned-wallet query returns no row', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.unlockFacilityBonus({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      now: '2026-08-23T00:00:00.000Z',
    })).rejects.toThrow('Facility bonus requires confirmed trust, three qualifying sales and an owned wallet.');
  });

  it('returns the existing bonus ledger row on an idempotent replay', async () => {
    const call = stubSql([{
      id: 'bonus-ledger-1',
      wallet_id: 'wallet-1',
      facility_id: 'facility-1',
    }]);
    const repository = createTrunkRepository(call.sql);

    const first = await repository.unlockFacilityBonus({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      now: '2026-08-23T00:00:00.000Z',
    });
    const replay = await repository.unlockFacilityBonus({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      now: '2026-08-23T00:00:00.000Z',
    });

    expect(replay).toEqual(first);
    expect(call.queries[0]).toContain('on conflict (wallet_id, kind, reference) do nothing');
  });

  it('returns the bonus status row for the owning seller and facility', async () => {
    const call = stubSql([{
      facility_id: 'facility-1',
      unlock_type: 'pro_test_credit_20_usd',
      distinct_buyer_count: 2,
      required_count: 3,
      kind_required_count: 3,
      status: 'locked',
      amount_minor: 10000,
      trust_state: 'unconfirmed',
      qualifying_sales: 2,
      bonus_unlocked_at: null,
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.getFacilityBonusStatus({ authUserId: 'auth-user-1', facilityId: 'facility-1' });

    expect(result).toEqual({
      facilityId: 'facility-1',
      unlockType: 'pro_test_credit_20_usd',
      distinctBuyerCount: 2,
      requiredCount: 3,
      status: 'locked',
      amountMinor: 10000,
      trustState: 'unconfirmed',
      qualifyingSales: 2,
      bonusUnlockedAt: null,
    });
    expect(call.queries[0]).toContain('v2_seller_unlocks');
    expect(call.queries[0]).toContain("unlock_type = 'pro_test_credit_20_usd'");
    expect(call.queries[0]).toContain('a.auth_user_id =');
  });

  it('affiche le seuil de volume (individu 1) et non la valeur stockee 3, meme si la ligne est ancienne', async () => {
    // La ligne a ete ecrite avant le correctif R-4c : required_count = DEFAULT 3.
    // Le seuil affiche doit suivre le VOLUME calcule (kind_required_count), sinon un
    // particulier eligible lit '1/3' alors que la porte en exige 1.
    const call = stubSql([{
      facility_id: 'facility-1',
      unlock_type: 'pro_test_credit_20_usd',
      distinct_buyer_count: 1,
      required_count: 3,
      kind_required_count: 1,
      status: 'eligible',
      amount_minor: 10000,
      trust_state: 'confirmed',
      qualifying_sales: 1,
      bonus_unlocked_at: null,
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.getFacilityBonusStatus({ authUserId: 'auth-user-1', facilityId: 'facility-1' });

    expect(result.requiredCount).toBe(1);
    expect(result.requiredCount).not.toBe(3);
    expect(call.queries[0]).toContain('coalesce(e.trust_state, f.trust_state)');
    expect(call.queries[0]).toContain('kind_required_count');
    expect(call.queries[0]).toContain('left join v2_seller_unlocks');
  });

  it('ecrit le seuil de volume dans la ligne de deverrouillage (plus de 3 en dur)', async () => {
    const call = stubSql([{
      facility_id: 'facility-1',
      unlock_type: 'pro_test_credit_20_usd',
      distinct_buyer_count: 1,
      required_count: 1,
      kind_required_count: 1,
      status: 'eligible',
      amount_minor: 10000,
      trust_state: 'confirmed',
      qualifying_sales: 1,
      bonus_unlocked_at: null,
    }]);
    const repository = createTrunkRepository(call.sql);
    await repository.getFacilityBonusStatus({ authUserId: 'auth-user-1', facilityId: 'facility-1' });
    expect(call.queries[0]).toContain('kind_required_count');
  });

  it('returns a locked zero-state when the seller unlock row does not exist yet', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.getFacilityBonusStatus({ authUserId: 'auth-user-1', facilityId: 'facility-1' });

    expect(result).toEqual({
      facilityId: 'facility-1',
      unlockType: 'pro_test_credit_20_usd',
      distinctBuyerCount: 0,
      requiredCount: 3,
      status: 'locked',
      amountMinor: 10000,
      trustState: 'unconfirmed',
      qualifyingSales: 0,
      bonusUnlockedAt: null,
    });
  });
});
describe('facility pro renewal Root seam', () => {
  it('returns the honest plan, opt-in, days left and balance for an active entitlement', async () => {
    const call = stubSql([{
      facility_id: 'facility-1',
      facility_name: 'Atelier Test',
      pro_price_minor: 1000,
      billing_currency: 'XOF',
      base_pro_price_usd_minor: 1000,
      base_billing_currency: 'USD',
      renewal_opt_in: true,
      entitlement_id: 'ent-1',
      starts_at: '2026-08-01T00:00:00.000Z',
      ends_at: '2028-01-01T00:00:00.000Z',
      entitlement_state: 'active',
      balance_minor: 25000,
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.getFacilityRenewalStatus({ authUserId: 'auth-user-1', facilityId: 'facility-1' });
    expect(result.plan).toBe('pro_active');
    expect(result.renewalOptIn).toBe(true);
    expect(result.sufficientFunds).toBe(true);
    expect(result.walletBalanceMinor).toBe(25000);
    expect(result.baseProPriceUsdMinor).toBe(1000);
    expect(result.baseBillingCurrency).toBe('USD');
    expect(result.daysLeft).toBeGreaterThan(100);
    expect(call.queries[0]).toContain('v2_facility_entitlements');
    expect(call.queries[0]).toContain('a.auth_user_id');
    expect(call.queries[0]).toContain('base_pro_price_usd_minor');
  });

  it('marks the plan pro_expired when the entitlement ended, even if renewal_opt_in stayed on', async () => {
    const call = stubSql([{
      facility_id: 'facility-1',
      facility_name: 'Atelier Test',
      pro_price_minor: 1000,
      billing_currency: 'XOF',
      base_pro_price_usd_minor: 1000,
      base_billing_currency: 'USD',
      renewal_opt_in: true,
      entitlement_id: 'ent-1',
      starts_at: '2026-06-01T00:00:00.000Z',
      ends_at: '2026-07-01T00:00:00.000Z',
      entitlement_state: 'expired',
      balance_minor: 0,
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.getFacilityRenewalStatus({ authUserId: 'auth-user-1', facilityId: 'facility-1' });
    expect(result.plan).toBe('pro_expired');
    expect(result.renewalOptIn).toBe(true);
    expect(result.sufficientFunds).toBe(false);
    expect(result.daysLeft).toBe(0);
  });

  it('returns free when the facility has never had a Pro entitlement', async () => {
    const call = stubSql([{
      facility_id: 'facility-1',
      facility_name: 'Atelier Test',
      pro_price_minor: 1000,
      billing_currency: 'XOF',
      base_pro_price_usd_minor: 1000,
      base_billing_currency: 'USD',
      renewal_opt_in: false,
      entitlement_id: null,
      starts_at: null,
      ends_at: null,
      entitlement_state: null,
      balance_minor: 5000,
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.getFacilityRenewalStatus({ authUserId: 'auth-user-1', facilityId: 'facility-1' });
    expect(result.plan).toBe('free');
    expect(result.daysLeft).toBe(0);
  });

  it('rejects a facility that is not owned by the current user', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.getFacilityRenewalStatus({ authUserId: 'auth-user-1', facilityId: 'facility-1' }))
      .rejects.toThrow('Facility not found or not owned by the current user.');
  });

  it('flips the opt-in on the latest Pro entitlement and returns the new state', async () => {
    const call = stubSql([{
      facility_id: 'facility-1',
      renewal_opt_in: true,
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.setFacilityRenewalOptIn({ authUserId: 'auth-user-1', facilityId: 'facility-1', optIn: true });
    expect(result).toEqual({ facilityId: 'facility-1', renewalOptIn: true });
    expect(call.queries[0]).toContain('set renewal_opt_in =');
    expect(call.queries[0]).toContain('a.auth_user_id');
    expect(call.queries[0]).toContain('for update of f');
  });

  it('refuses the opt-in before any Pro activation exists', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setFacilityRenewalOptIn({ authUserId: 'auth-user-1', facilityId: 'facility-1', optIn: true }))
      .rejects.toThrow('Activate Omni Pro once before choosing auto-renewal.');
  });
  it('renews a due Pro facility from the wallet when opt-in is on and funds cover the price', async () => {
      const call = stubSql([{
        facility_id: 'facility-1',
        new_entitlement_id: 'ent-new-1',
        ends_at: '2026-10-22T00:00:00.000Z',
        spend_ledger_entry_id: 'spend-1',
      }]);
      const repository = createTrunkRepository(call.sql);
      const result = await repository.renewFacilityPro({ authUserId: 'auth-user-1', facilityId: 'facility-1', now: '2026-09-22T00:00:00.000Z' });
      expect(result).toEqual({
        facilityId: 'facility-1',
        renewed: true,
        reason: 'renewed',
        newEntitlementId: 'ent-new-1',
        endsAt: '2026-10-22T00:00:00.000Z',
        spendLedgerEntryId: 'spend-1',
        status: 'succeeded',
      });
      expect(call.queries[0]).toContain('insert into v2_wallet_ledger_entries');
      expect(call.queries[0]).toContain('facility_pro_spend');
      expect(call.queries[0]).toContain('insert into v2_facility_renewal_runs');
      expect(call.queries[0]).toContain("'succeeded'");
    });

  it('records an insufficient_funds renewal run and stays expired when opt-in is on but the wallet is short', async () => {
    const call = stubSqlAlternating([[], [{ facility_id: 'facility-1', status: 'insufficient_funds' }]]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.renewFacilityPro({ authUserId: 'auth-user-1', facilityId: 'facility-1', now: '2026-09-22T00:00:00.000Z' });
    expect(result).toEqual({
      facilityId: 'facility-1',
      renewed: false,
      reason: 'insufficient_funds',
      newEntitlementId: null,
      endsAt: null,
      spendLedgerEntryId: null,
      status: 'insufficient_funds',
    });
    expect(call.queries[1]).toContain("'insufficient_funds'");
  });

  it('skips without spending when the facility is still active or has no opt-in', async () => {
    const call = stubSqlAlternating([[], [{ facility_id: 'facility-1', status: 'skipped' }]]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.renewFacilityPro({ authUserId: 'auth-user-1', facilityId: 'facility-1', now: '2026-09-22T00:00:00.000Z' });
    expect(result.renewed).toBe(false);
    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('not_due_or_no_opt_in');
    expect(call.queries[0]).toContain('facility_pro_spend');
    expect(call.queries[1]).toContain('insert into v2_facility_renewal_runs');
  });
});

describe('facility analytics Root seam (NW-13f)', () => {
  it('aggregates the conversion funnel, revenue and QR scan provenance for the owning seller', async () => {
    const call = stubSql([{
      facility_id: 'facility-1',
      facility_name: 'Atelier Test',
      requests: 12,
      responses_available: 9,
      transactions_started: 6,
      qr_scans_verified: 4,
      transactions_closed: 3,
      gross_revenue_minor: 24500,
      scan_to_verify_avg_ms: 3200,
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.getFacilityAnalytics({ authUserId: 'auth-user-1', facilityId: 'facility-1' });
    expect(result).toEqual({
      facilityId: 'facility-1',
      facilityName: 'Atelier Test',
      requests: 12,
      responsesAvailable: 9,
      transactionsStarted: 6,
      qrScansVerified: 4,
      transactionsClosed: 3,
      grossRevenueMinor: 24500,
      billingCurrency: 'XOF',
      scanToVerifyAvgMs: 3200,
    });
    expect(call.queries[0]).toContain('v2_availability_requests');
    expect(call.queries[0]).toContain('v2_transaction_snapshots');
    expect(call.queries[0]).toContain('v2_qr_tokens');
    expect(call.queries[0]).toContain('a.auth_user_id');
  });

  it('returns zeros and a null scan latency when the facility has no activity yet', async () => {
    const call = stubSql([{
      facility_id: 'facility-1',
      facility_name: 'Atelier Test',
      requests: 0,
      responses_available: 0,
      transactions_started: 0,
      qr_scans_verified: 0,
      transactions_closed: 0,
      gross_revenue_minor: 0,
      scan_to_verify_avg_ms: null,
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.getFacilityAnalytics({ authUserId: 'auth-user-1', facilityId: 'facility-1' });
    expect(result.grossRevenueMinor).toBe(0);
    expect(result.scanToVerifyAvgMs).toBe(null);
    expect(result.transactionsStarted).toBe(0);
  });

  it('rejects a facility that is not owned by the current user', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.getFacilityAnalytics({ authUserId: 'auth-user-1', facilityId: 'facility-1' }))
      .rejects.toThrow('Facility not found or not owned by the current user.');
  });
});

describe('facility ad campaign Root seam (NW-13j)', () => {
  it('creates an ad campaign for an active Pro facility, debiting the wallet once with an ad_spend ledger entry', async () => {
    const call = stubSql([{
      campaign_id: 'campaign-1',
      facility_id: 'facility-1',
      name: 'Coup de projecteur',
      budget_minor: 50000,
      spent_minor: 0,
      status: 'active',
      starts_at: '2026-09-13T00:00:00.000Z',
      ends_at: '2026-10-13T00:00:00.000Z',
      created_at: '2026-09-13T00:00:00.000Z',
      spend_ledger_entry_id: 'spend-1',
      budget_remaining_minor: 100000,
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.createAdCampaign({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      name: 'Coup de projecteur',
      budgetMinor: 50000,
      startsAt: '2026-09-13T00:00:00.000Z',
      endsAt: '2026-10-13T00:00:00.000Z',
    });
    expect(result.campaign).toMatchObject({ id: 'campaign-1', facilityId: 'facility-1', name: 'Coup de projecteur', budgetMinor: 50000, spentMinor: 0, status: 'active' });
    expect(result.spendLedgerEntryId).toBe('spend-1');
    expect(result.budgetRemainingMinor).toBe(100000);
    expect(call.queries[0]).toContain('v2_wallet_ledger_entries');
    expect(call.queries[0]).toContain("'ad_spend'");
    expect(call.queries[0]).toContain('v2_ad_campaigns');
    expect(call.queries[0]).toContain('a.auth_user_id');
  });

  it('rejects a Free facility with a Pro-only policy error', async () => {
    const call = stubSqlAlternating([[], [{ commercial_plan: 'free' }]]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createAdCampaign({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      name: 'Boost',
      budgetMinor: 10000,
      startsAt: '2026-09-13T00:00:00.000Z',
      endsAt: '2026-10-13T00:00:00.000Z',
    })).rejects.toThrow('Sponsored ad campaigns require an active Pro plan on the facility.');
  });

  it('rejects a non-owned facility with the seller authorization error', async () => {
    const call = stubSqlAlternating([[], []]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createAdCampaign({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      name: 'Boost',
      budgetMinor: 10000,
      startsAt: '2026-09-13T00:00:00.000Z',
      endsAt: '2026-10-13T00:00:00.000Z',
    })).rejects.toThrow('Facility not found or not owned by the current user.');
  });

  it('rejects a positive budget with a valid window requirement', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createAdCampaign({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      name: 'Boost',
      budgetMinor: 0,
      startsAt: '2026-10-13T00:00:00.000Z',
      endsAt: '2026-09-13T00:00:00.000Z',
    })).rejects.toThrow('Ad campaign requires a positive budget and a window where the start is before the end.');
    expect(call.queries.length).toBe(0);
  });

  it('lists the facility ad campaigns for the owning seller with the current wallet balance', async () => {
    const call = stubSql([{
      campaigns: [{
        id: 'campaign-1',
        facilityId: 'facility-1',
        name: 'Coup de projecteur',
        budgetMinor: 50000,
        spentMinor: 10000,
        status: 'active',
        startsAt: '2026-09-13T00:00:00.000Z',
        endsAt: '2026-10-13T00:00:00.000Z',
        createdAt: '2026-09-13T00:00:00.000Z',
      }],
      budget_remaining_minor: 150000,
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listFacilityAdCampaigns({ authUserId: 'auth-user-1', facilityId: 'facility-1' });
    expect(result.campaigns).toHaveLength(1);
    expect(result.campaigns[0]).toMatchObject({ id: 'campaign-1', name: 'Coup de projecteur', budgetMinor: 50000, spentMinor: 10000, status: 'active' });
    expect(result.budgetRemainingMinor).toBe(150000);
    expect(call.queries[0]).toContain('v2_ad_campaigns');
    expect(call.queries[0]).toContain('a.auth_user_id');
  });

  it('lists zero campaigns as an empty array for an owner without campaigns (regression: don\'t 500 on zero)', async () => {
    const call = stubSql([{
      campaigns: [],
      budget_remaining_minor: 10000,
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listFacilityAdCampaigns({ authUserId: 'auth-user-1', facilityId: 'facility-1' });
    expect(result.campaigns).toEqual([]);
    expect(result.budgetRemainingMinor).toBe(10000);
    // json_agg (json not json[]) so COALESCE types match on real Postgres.
    expect(call.queries[0]).toContain('json_agg(json_build_object');
    expect(call.queries[0]).toContain(`'[]'::json`);
  });

  it('rejects listing campaigns for a non-owned facility', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.listFacilityAdCampaigns({ authUserId: 'auth-user-1', facilityId: 'facility-1' }))
      .rejects.toThrow('Facility not found or not owned by the current user.');
  });
});

describe('buyer pro Root seam (NW-13h D-K)', () => {
  it('returns the honest plan, price, balance and compare quota for an active entitlement', async () => {
    const call = stubSql([{
      account_id: 'account-1',
      entitlement_id: 'ent-1',
      entitlement_state: 'active',
      starts_at: '2026-08-01T00:00:00.000Z',
      ends_at: '2028-01-01T00:00:00.000Z',
      renewal_opt_in: true,
      pro_price_minor: 250000,
      billing_currency: 'XOF',
      base_pro_price_usd_minor: 500,
      base_billing_currency: 'USD',
      balance_minor: 400000,
      credit_plan: 'pro',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.getBuyerProStatus({ authUserId: 'auth-user-1' });
    expect(result!.plan).toBe('pro_active');
    expect(result!.proPriceMinor).toBe(250000);
    expect(result!.billingCurrency).toBe('XOF');
    expect(result!.baseProPriceUsdMinor).toBe(500);
    expect(result!.baseBillingCurrency).toBe('USD');
    expect(result!.walletBalanceMinor).toBe(400000);
    expect(result!.sufficientFunds).toBe(true);
    expect(result!.renewalOptIn).toBe(true);
    expect(result!.compareQuota).toBe(5);
    expect(call.queries[0]).toContain('v2_buyer_pro_entitlements');
    expect(call.queries[0]).toContain('a.auth_user_id');
    expect(call.queries[0]).toContain('base_pro_price_usd_minor');
  });

  it('returns free, quota 1, when the buyer has never had Pro', async () => {
    const call = stubSql([{
      account_id: 'account-1',
      entitlement_id: null,
      entitlement_state: null,
      starts_at: null,
      ends_at: null,
      renewal_opt_in: false,
      pro_price_minor: 250000,
      billing_currency: 'XOF',
      base_pro_price_usd_minor: 500,
      base_billing_currency: 'USD',
      balance_minor: 0,
      credit_plan: 'free',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.getBuyerProStatus({ authUserId: 'auth-user-1' });
    expect(result!.plan).toBe('free');
    expect(result!.compareQuota).toBe(1);
    expect(result!.entitlementId).toBeNull();
    expect(result!.baseProPriceUsdMinor).toBe(500);
  });

  it('returns pro_expired when the entitlement ended even with opt-in still on', async () => {
    const call = stubSql([{
      account_id: 'account-1',
      entitlement_id: 'ent-1',
      entitlement_state: 'expired',
      starts_at: '2026-06-01T00:00:00.000Z',
      ends_at: '2026-07-01T00:00:00.000Z',
      renewal_opt_in: true,
      pro_price_minor: 250000,
      billing_currency: 'XOF',
      base_pro_price_usd_minor: 500,
      base_billing_currency: 'USD',
      balance_minor: 250000,
      credit_plan: 'free',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.getBuyerProStatus({ authUserId: 'auth-user-1' });
    expect(result!.plan).toBe('pro_expired');
    expect(result!.sufficientFunds).toBe(true);
    expect(result!.compareQuota).toBe(1);
    expect(result!.baseProPriceUsdMinor).toBe(500);
  });

  it('returns null when the authenticated identity has no account row yet', async () => {
    // Regression: this used to throw BuyerSearchPolicyError('ACCOUNT_UNAVAILABLE'),
    // which the HTTP layer mapped to 409 POLICY_REJECTED for what is really an
    // account-provisioning precondition. Sibling reads answer 403 instead.
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.getBuyerProStatus({ authUserId: 'auth-without-account' })).resolves.toBeNull();
  });

  it('activates buyer pro from the wallet with spend, entitlement and pro credit plan', async () => {
    const call = stubSql([{
      id: 'ent-new-1',
      account_id: 'account-1',
      ends_at: '2026-10-13T00:00:00.000Z',
      spend_ledger_entry_id: 'spend-1',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.activateBuyerPro({ authUserId: 'auth-user-1', now: '2026-09-13T00:00:00.000Z' });
    expect(result).toEqual({
      accountId: 'account-1',
      entitlementId: 'ent-new-1',
      plan: 'pro_active',
      endsAt: '2026-10-13T00:00:00.000Z',
      spendLedgerEntryId: 'spend-1',
    });
    expect(call.queries[0]).toContain('insert into v2_wallet_ledger_entries');
    expect(call.queries[0]).toContain('buyer_pro_spend');
    expect(call.queries[0]).toContain('insert into v2_buyer_pro_entitlements');
    expect(call.queries[0]).toContain('insert into v2_buyer_credit_accounts');
    expect(call.queries[0]).toContain("'pro'");
  });

  it('refuses to activate buyer pro when the wallet is short', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.activateBuyerPro({ authUserId: 'auth-user-1', now: '2026-09-13T00:00:00.000Z' }))
      .rejects.toThrow('Insufficient wallet balance to activate Buyer Pro.');
  });

  it('flips the buyer pro opt-in and refuses it before any activation', async () => {
    const call = stubSql([{ account_id: 'account-1', renewal_opt_in: true }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.setBuyerProRenewalOptIn({ authUserId: 'auth-user-1', optIn: true });
    expect(result).toEqual({ accountId: 'account-1', renewalOptIn: true });
    expect(call.queries[0]).toContain('set renewal_opt_in =');
    expect(call.queries[0]).toContain('a.auth_user_id');

    const emptyCall = stubSql([]);
    const emptyRepository = createTrunkRepository(emptyCall.sql);
    await expect(emptyRepository.setBuyerProRenewalOptIn({ authUserId: 'auth-user-1', optIn: true }))
      .rejects.toThrow('Activate Buyer Pro once before choosing auto-renewal.');
  });

  it('renews a due buyer pro from the wallet when opt-in is on', async () => {
    const call = stubSql([{
      entitlement_id: 'ent-new-2',
      account_id: 'account-1',
      ends_at: '2026-10-13T00:00:00.000Z',
      spend_ledger_entry_id: 'spend-2',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.renewBuyerPro({ authUserId: 'auth-user-1', now: '2026-09-13T00:00:00.000Z' });
    expect(result.renewed).toBe(true);
    expect(result.status).toBe('succeeded');
    expect(result.newEntitlementId).toBe('ent-new-2');
    expect(call.queries[0]).toContain('buyer_pro_spend');
  });

  it('records an insufficient_funds buyer pro renewal run when the wallet is short', async () => {
    const call = stubSqlAlternating([[], [{ account_id: 'account-1', status: 'insufficient_funds' }]]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.renewBuyerPro({ authUserId: 'auth-user-1', now: '2026-09-13T00:00:00.000Z' });
    expect(result.renewed).toBe(false);
    expect(result.status).toBe('insufficient_funds');
    expect(result.reason).toBe('insufficient_funds');
    expect(result.accountId).toBe('account-1');
    expect(call.queries[1]).toContain("'insufficient_funds'");
  });
});

describe('account favorites Root seam (NW-13h D-K)', () => {
  it('lists the buyer favorites joined to facility names, newest first', async () => {
    const call = stubSql([{
      favorite_id: 'fav-1',
      facility_id: 'facility-1',
      facility_name: 'Marché de Hanoukope',
      facility_category: 'Fresh produce',
      created_at: '2026-09-13T10:00:00.000Z',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listFavorites({ authUserId: 'auth-user-1' });
    expect(result.favorites).toEqual([{
      id: 'fav-1',
      facilityId: 'facility-1',
      facilityName: 'Marché de Hanoukope',
      facilityCategory: 'Fresh produce',
      createdAt: '2026-09-13T10:00:00.000Z',
    }]);
    expect(call.queries[0]).toContain('v2_account_favorites');
    expect(call.queries[0]).toContain('a.auth_user_id');
  });

  it('adds a favorite idempotently and refuses when the account is unavailable', async () => {
    const call = stubSql([{ id: 'fav-1', facility_id: 'facility-1' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.addFavorite({ authUserId: 'auth-user-1', facilityId: 'facility-1' });
    expect(result).toEqual({ favoriteId: 'fav-1', facilityId: 'facility-1' });
    expect(call.queries[0]).toContain('on conflict (account_id, facility_id) do nothing');

    const emptyCall = stubSql([]);
    const emptyRepository = createTrunkRepository(emptyCall.sql);
    await expect(emptyRepository.addFavorite({ authUserId: 'auth-user-1', facilityId: 'facility-1' }))
      .rejects.toThrow('ACCOUNT_UNAVAILABLE');
  });

  it('removes a favorite and throws NOT_FOUND when it is absent', async () => {
    const call = stubSql([{ id: 'fav-1' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.removeFavorite({ authUserId: 'auth-user-1', facilityId: 'facility-1' });
    expect(result).toEqual({ removed: true });
    expect(call.queries[0]).toContain('delete from v2_account_favorites');

    const emptyCall = stubSql([]);
    const emptyRepository = createTrunkRepository(emptyCall.sql);
    await expect(emptyRepository.removeFavorite({ authUserId: 'auth-user-1', facilityId: 'facility-1' }))
      .rejects.toThrow('NOT_FOUND');
  });
});

describe('wallet spend persistence Root seam', () => {
  it('uses the authenticated account, facility ownership, confirmed balance and append-only spend shape', async () => {
    const call = stubSql([{
      id: 'ledger-1',
      wallet_id: 'wallet-1',
      kind: 'facility_pro_spend',
      amount_minor: 1000,
      status: 'confirmed',
      facility_id: 'facility-1',
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.spendWallet({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      kind: 'facility_pro_spend',
      amountMinor: 1000,
      reference: 'pro-cycle-1',
      now: '2026-08-23T00:00:00.000Z',
    });

    expect(result).toEqual({
      ledgerEntryId: 'ledger-1',
      walletId: 'wallet-1',
      kind: 'facility_pro_spend',
      amountMinor: 1000,
      status: 'confirmed',
      facilityId: 'facility-1',
    });
    expect(call.queries[0]).toContain('join v2_accounts a on a.id = w.account_id');
    expect(call.queries[0]).toContain('a.auth_user_id');
    expect(call.queries[0]).toContain('for update of w');
    expect(call.queries[0]).toContain("where e.status = 'confirmed'");
    expect(call.queries[0]).toContain('insert into v2_wallet_ledger_entries');
    expect(call.queries[0]).toContain('on conflict (wallet_id, kind, reference) do nothing');
  });

  it('rejects invalid spend input before reaching the database', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.spendWallet({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      kind: 'facility_pro_spend',
      amountMinor: 0,
      reference: 'pro-cycle-2',
      now: '2026-08-23T00:00:00.000Z',
    })).rejects.toBeInstanceOf(WalletPolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('rejects a missing wallet, ownership failure or insufficient balance without inserting a ledger row', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.spendWallet({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      kind: 'facility_pro_spend',
      amountMinor: 1000,
      reference: 'pro-cycle-3',
      now: '2026-08-23T00:00:00.000Z',
    })).rejects.toThrow('Wallet is unavailable, facility ownership is invalid, or confirmed funds are insufficient.');
  });
});

describe('purchase-intent persistence Root seam', () => {
  it('creates an intent path only from an eligible buyer-owned response and makes replay writes idempotent', async () => {
    const call = stubSql([{
      id: 'intent-1',
      response_id: 'response-1',
      transaction_id: 'transaction-1',
      buyer_account_id: 'buyer-account-1',
      state: 'active',
    }]);
    const repository = createTrunkRepository(call.sql);

    const first = await repository.createPurchaseIntent({
      authUserId: 'auth-user-1',
      responseId: 'response-1',
      idempotencyKey: 'intent-key-1',
      correlationId: 'corr-intent-1',
    });
    const replay = await repository.createPurchaseIntent({
      authUserId: 'auth-user-1',
      responseId: 'response-1',
      idempotencyKey: 'intent-key-1',
      correlationId: 'corr-intent-1',
    });

    expect(replay).toEqual(first);
    expect(call.queries).toHaveLength(2);
    expect(call.queries[0]).toContain("ar.status in ('available', 'partial', 'corrected')");
    expect(call.queries[0]).toContain('r.buyer_account_id');
    expect(call.queries[0]).toContain('r.product_id');
    expect(call.queries[0]).not.toContain('ar.product_id');
    expect(call.queries[0]).toContain('insert into v2_transaction_snapshots');
    expect(call.queries[0]).toContain('insert into v2_transaction_members');
    expect(call.queries[0]).toContain('insert into v2_transaction_events');
    expect(call.queries[0]).toContain('on conflict (transaction_id, state) do nothing');
    expect(call.queries[0]).toContain('insert into v2_qr_tokens');
    expect(call.queries[0]).toContain("'qr_ready'");
    expect(call.queries[0]).toContain("'auto_at_intent'");
    // Régression : le mot-clé AND ne doit jamais être soudé à l'identifiant
    // (bug 'transaction_idand' qui rendait la requête SQL invalide).
    expect(call.queries[0]).not.toContain('transaction_idand');
    // L'éligibilité QR consomme le RETURNING d'intent_upsert : un re-scan de
    // snapshot/members ne voit pas les lignes insérées dans la même instruction.
    expect(call.queries[0]).toContain('qr_eligible as (');
    expect(call.queries[0]).toContain('select i.transaction_id, i.buyer_account_id');
    expect(call.queries[0]).toContain('from intent_upsert i');
    // FF-8 : le verrou réserve le stock et refuse la survente.
    expect(call.queries[0]).toContain('greatest(p.quantity_allocated_omni - p.quantity_reserved_omni, 0) as available');
    expect(call.queries[0]).toContain('rs.available >= e.quantity');
    expect(call.queries[0]).toContain('set quantity_reserved_omni = p.quantity_reserved_omni + fi.quantity');
  });

  it('rejects an unavailable or out-of-scope response without returning an intent', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.createPurchaseIntent({
      authUserId: 'auth-user-1',
      responseId: 'response-1',
      idempotencyKey: 'intent-key-2',
      correlationId: 'corr-intent-2',
    })).rejects.toBeInstanceOf(PurchaseIntentPolicyError);
  });

  it('rejects a stored idempotency result bound to another response', async () => {
    const call = stubSql([{
      id: 'intent-1',
      response_id: 'response-other',
      transaction_id: 'transaction-1',
      buyer_account_id: 'buyer-account-1',
      state: 'active',
    }]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.createPurchaseIntent({
      authUserId: 'auth-user-1',
      responseId: 'response-1',
      idempotencyKey: 'intent-key-3',
      correlationId: 'corr-intent-3',
    })).rejects.toThrow('The idempotency key is already used for a different purchase intent.');
  });
});

describe('QR persistence Root seam', () => {
  it('conditionally verifies one authorized seller token and returns the committed replay count', async () => {
    const call = stubSql([{
      transaction_id: 'transaction-1',
      verified_at: '2026-08-23T00:00:00.000Z',
      replay_count: 1,
      facility_id: 'facility-1',
      product_id: 'product-1',
      product_name: 'Root proof demo product',
      quantity: 2,
      unit_price_minor: 1500,
      coupon_code: 'WELCOME10',
      net_amount_minor: 2700,
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.verifyQrToken({
      authUserId: 'auth-user-1',
      transactionId: 'transaction-1',
      tokenHash: 'hash-not-recorded',
      now: '2026-08-23T00:00:00.000Z',
    });

    expect(result).toEqual({
      accepted: true,
      transactionId: 'transaction-1',
      verifiedAt: '2026-08-23T00:00:00.000Z',
      nextReplayCount: 1,
      facilityId: 'facility-1',
      productId: 'product-1',
      productName: 'Root proof demo product',
      quantity: 2,
      unitPriceMinor: 1500,
      couponCode: 'WELCOME10',
      netAmountMinor: 2700,
    });
    expect(call.queries[0]).toContain('update v2_qr_tokens q');
    expect(call.queries[0]).toContain('q.verified_at is null');
    expect(call.queries[0]).toContain('q.replay_count = 0');
    expect(call.queries[0]).toContain('a.auth_user_id');
    expect(call.queries[0]).toContain("m.role = 'seller'");
  });

  it('returns a non-acceptance result when the conditional QR update matches no row', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.verifyQrToken({
      authUserId: 'auth-user-1',
      transactionId: 'transaction-1',
      tokenHash: 'hash-not-recorded',
      now: '2026-08-23T00:00:00.000Z',
    })).resolves.toEqual({
      accepted: false,
      transactionId: 'transaction-1',
      reason: 'NOT_VERIFIED',
    });
  });
});


describe('field pilot registry Root seam', () => {
  it('rejects a public import without an active operator role before persistence', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createPublicFacilityImport({
      authUserId: 'auth-user-1', provider: 'openstreetmap', attribution: '© OpenStreetMap contributors', sourceRef: 'node/1', name: 'Market', category: 'Market', latitude: 6.13, longitude: 1.22, address: null, correlationId: 'corr-import-1',
    })).rejects.toThrow('active Omni operator role');
    expect(call.queries).toHaveLength(1);
  });

  it('imports a public source facility without assigning it to the operator account', async () => {
    const queries: string[] = [];
    let callNumber = 0;
    const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
      queries.push(strings.raw.join('¦'));
      void values;
      callNumber += 1;
      return Promise.resolve(callNumber === 1 ? [{ id: 'account-1' }] : callNumber === 2 ? [{ id: 'source-1' }] : [{ run_id: 'run-1', facility_id: 'facility-1', created: true }]);
    }) as unknown as SqlStub;
    const repository = createTrunkRepository(sql);
    await expect(repository.createPublicFacilityImport({
      authUserId: 'auth-operator', provider: 'openstreetmap', attribution: '© OpenStreetMap contributors', sourceRef: 'node/1', name: 'Market', category: 'Market', latitude: 6.13, longitude: 1.22, address: 'Lomé', correlationId: 'corr-import-1',
    })).resolves.toEqual({ runId: 'run-1', facilityId: 'facility-1', sourceRef: 'node/1', created: true, trust: 'unclaimed' });
    expect(queries[0]).toContain("ar.role = 'operator'");
    expect(queries[2]).toContain('select null,');
    expect(queries[2]).toContain('v2_facility_source_refs');
    expect(queries[2]).toContain('v2_operator_runs');
  });

  it('refreshes an existing unclaimed public facility on an idempotent source replay', async () => {
    const queries: string[] = [];
    let callNumber = 0;
    const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
      queries.push(strings.raw.join('¦'));
      void values;
      callNumber += 1;
      return Promise.resolve(callNumber === 1 ? [{ id: 'account-1' }] : callNumber === 2 ? [{ id: 'source-1' }] : [{ run_id: 'run-2', facility_id: 'facility-1', created: false }]);
    }) as unknown as SqlStub;
    const repository = createTrunkRepository(sql);
    await expect(repository.createPublicFacilityImport({
      authUserId: 'auth-operator', provider: 'openstreetmap', attribution: '© OpenStreetMap contributors', sourceRef: 'node/1', name: 'Market updated', category: 'Wholesale market', latitude: 6.131, longitude: 1.221, address: 'Updated Lomé', correlationId: 'corr-import-replay',
    })).resolves.toEqual({ runId: 'run-2', facilityId: 'facility-1', sourceRef: 'node/1', created: false, trust: 'unclaimed' });
    expect(queries[2]).toContain('update v2_facilities');
    expect(queries[2]).toContain('f.account_id is null');
    expect(queries[2]).toContain("f.trust_state = 'unclaimed'");
    expect(queries[2]).toContain('on conflict (source_id, source_ref) do update');
    expect(queries[2]).toContain("md5(");
    expect(queries[2]).toContain('on conflict (correlation_id) do update');
  });
  it('rejects invalid import coordinates before reaching Neon', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createPublicFacilityImport({
      authUserId: 'auth-operator', provider: 'openstreetmap', attribution: '© OpenStreetMap contributors', sourceRef: 'node/1', name: 'Market', category: null, latitude: 91, longitude: 1.22, address: null, correlationId: 'corr-import-invalid',
    })).rejects.toThrow('payload is invalid');
    expect(call.queries).toHaveLength(0);
  });

  it('creates a claim draft only from an unowned public facility and returns a safe replay shape', async () => {
    const call = stubSql([{ request_id: 'request-1', facility_id: 'facility-1', version: 1, created: true }]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createClaimDraft({ authUserId: 'auth-claimant', facilityId: 'facility-1' })).resolves.toEqual({ requestId: 'request-1', facilityId: 'facility-1', state: 'draft', version: 1, created: true });
    expect(call.queries[0]).toContain('account_id is null');
    expect(call.queries[0]).toContain('v2_verification_requests');
    expect(call.queries[0]).toContain("state in ('draft', 'submitted', 'admin_review', 'needs_more_evidence')");
  });
});


describe('claim Heartwood seam', () => {
  it('rejects raw or public evidence references before persistence', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.submitClaimEvidence({
      authUserId: 'auth-claimant', requestId: 'request-1', version: 1,
      evidence: [{ evidenceKind: 'facility', objectKey: 'https://example.com/photo.jpg', checksum: null }],
      correlationId: 'corr-submit-1',
    })).rejects.toBeInstanceOf(FieldPilotPolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('keeps a valid evidence submission blocked until private storage is configured', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    const previous = process.env.OMNI_EVIDENCE_STORAGE;
    const prevBlob = process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.OMNI_EVIDENCE_STORAGE;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    await expect(repository.submitClaimEvidence({
      authUserId: 'auth-claimant', requestId: 'request-1', version: 1,
      evidence: [{ evidenceKind: 'facility', objectKey: 'private://omni/request-1/facility.jpg', checksum: 'sha256:abc' }],
      correlationId: 'corr-submit-2',
    })).rejects.toThrow('Private evidence storage is not configured');
    if (previous === undefined) delete process.env.OMNI_EVIDENCE_STORAGE;
    else process.env.OMNI_EVIDENCE_STORAGE = previous;
    if (prevBlob === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = prevBlob;
    expect(call.queries).toHaveLength(0);
  });

  it('requires the claimant-owned current version to cancel a draft', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.cancelClaim({ authUserId: 'auth-other', requestId: 'request-1', version: 1, correlationId: 'corr-cancel-1' })).rejects.toThrow('cannot be cancelled');
    expect(call.queries).toHaveLength(1);
    expect(call.queries[0]).toContain("state in ('draft', 'needs_more_evidence')");
    expect(call.queries[0]).toContain('claimant_account_id');
  });
});

describe('review and inbox Root seam', () => {
  it('returns a locked empty reviewer queue without an active reviewer role', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.listReviewQueue({ authUserId: 'auth-user-1' })).resolves.toEqual({ authorized: false, requests: [] });
    expect(call.queries).toHaveLength(1);
  });

  it('rejects a review with an unbounded reason before persistence', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.reviewFacilityClaim({ authUserId: 'auth-reviewer', requestId: 'request-1', outcome: 'certified', reason: 'x', correlationId: 'corr-review-1' })).rejects.toBeInstanceOf(FieldPilotPolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('writes a review, queues an in-app delivery and maps certification to Free unconfirmed', async () => {
    const call = stubSql([{ request_id: 'request-1', facility_id: 'facility-1', outcome: 'certified', facility_trust: 'unconfirmed', version: 2 }]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.reviewFacilityClaim({ authUserId: 'auth-reviewer', requestId: 'request-1', outcome: 'certified', reason: 'Evidence matches the facility.', correlationId: 'corr-review-1' })).resolves.toEqual({ requestId: 'request-1', facilityId: 'facility-1', outcome: 'certified', state: 'certified', facilityTrust: 'unconfirmed', version: 2 });
    expect(call.queries[0]).toContain("ar.role = 'reviewer'");
    expect(call.queries[0]).toContain('v2_verification_reviews');
    expect(call.queries[0]).toContain('v2_notification_events');
    expect(call.queries[0]).toContain('v2_notification_deliveries');
    expect(call.queries[0]).toContain('v2_facility_status_history');
    expect(call.queries[0]).toContain('unconfirmed');
    expect(call.queries[0]).toContain('claimant_account_id');
  });

  it('returns only the authenticated account inbox and marks its own event seen', async () => {
    const inboxCall = stubSql([{ id: 'notification-1', event_type: 'claim_reviewed', entity_type: 'verification_request', entity_id: 'request-1', state: 'queued', created_at: '2026-08-24T00:00:00.000Z', seen_at: null }]);
    const repository = createTrunkRepository(inboxCall.sql);
    await expect(repository.listNotificationInbox({ authUserId: 'auth-claimant' })).resolves.toEqual({ notifications: [{ id: 'notification-1', eventType: 'claim_reviewed', entityType: 'verification_request', entityId: 'request-1', state: 'queued', createdAt: '2026-08-24T00:00:00.000Z', seenAt: null }] });
    expect(inboxCall.queries[0]).toContain('recipient_account_id');
    const seenCall = stubSql([{ id: 'notification-1' }]);
    const seenRepository = createTrunkRepository(seenCall.sql);
    await expect(seenRepository.markNotificationSeen({ authUserId: 'auth-claimant', notificationId: 'notification-1' })).resolves.toEqual({ notificationId: 'notification-1', seen: true });
    expect(seenCall.queries[0]).toContain('seen_at = coalesce');
  });
});

describe('Buyer transaction rating persistence Root seam', () => {
  it('persists a rating after receipt and returns the rated transaction payload', async () => {
    const call = stubSql([{
      id: 'rating-1',
      transaction_id: 'transaction-1',
      score: 5,
      note: 'Très bonne expérience.',
    }]);
    const repository = createTrunkRepository(call.sql);

    const result = await repository.submitTransactionRating({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      score: 5,
      note: ' Très bonne expérience. ',
      correlationId: 'corr-rating-1',
      now: '2026-08-26T20:00:00.000Z',
    });

    expect(result).toEqual({
      ratingId: 'rating-1',
      transactionId: 'transaction-1',
      score: 5,
      note: 'Très bonne expérience.',
      state: 'rated',
    });
    expect(call.queries[0]).toContain('v2_ratings');
    expect(call.queries[0]).toContain('v2_transaction_events');
    expect(call.queries[0]).toContain("'closed'");
    expect(call.queries[0]).toContain('v2_seller_unlock_progress');
    expect(call.queries[0]).toContain('qualifying_sales = least(ut.threshold');
    expect(call.queries[0]).toContain("e.kind = 'individu'");
    // R-3b : la confiance et le compteur montent aussi sur l'ENTITE (S-30). Sans ce
    // miroir, la colonne d'entite restait celle du backfill -> confiance perimee.
    expect(call.queries[0]).toContain('entity_qualified as (');
    expect(call.queries[0]).toContain('update v2_entities e');
    expect(call.queries[0]).toContain('set qualifying_sales = q.qualifying_sales, trust_state = q.trust_state');
    expect(call.queries[0]).toContain("'bonus_grant', 10000, 'confirmed'");
    expect(call.queries[0]).toContain("'facility-bonus:' || bw.facility_id::text");
    expect(call.queries[0]).toContain("'pro_test_credit_20_usd'");
    // FF-3 : la clôture de la transaction marque l'intention 'completed'.
    expect(call.queries[0]).toContain('update v2_purchase_intents pi');
    expect(call.queries[0]).toContain("set state = 'completed'");
    expect(call.queries[0]).toContain('pi.id = s.intent_id');
    // D-TXN-11 : l'état courant se départage sur state_rank, jamais sur l'uuid
    // aléatoire de l'événement (deux états écrits dans la même instruction
    // partagent leur created_at → un tri par id serait non déterministe).
    expect(call.queries[0]).toContain('order by e.created_at desc, e.state_rank desc');
    expect(call.queries[0]).not.toContain('order by e.created_at desc, e.id desc');
    // FF-8 : la clôture décrémente le stock déclaré ET la réservation, ancré sur
    // closed_event (replay-safe : la CTE est vide si l'événement existe déjà).
    expect(call.queries[0]).toContain('set quantity_allocated_omni = greatest(p.quantity_allocated_omni - s.quantity, 0)');
    expect(call.queries[0]).toContain('quantity_reserved_omni = greatest(p.quantity_reserved_omni - s.quantity, 0)');
    expect(call.queries[0]).toContain('from closed_event c');
    // La notation insérée n'est pas relisible dans la même instruction (snapshot
    // Postgres) : le RETURNING alimente rating_present, sinon le premier appel
    // échouerait tout en ayant persisté la notation.
    expect(call.queries[0]).toContain('rating_present as (');
    expect(call.queries[0]).toContain('select id, transaction_id, score, note from inserted_rating');
    expect(call.queries[0]).toContain('join rating_present r');
    expect(call.queries[0]).toContain('from rating_present r');
  });

  it('rejects an invalid score before touching the database', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.submitTransactionRating({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      score: 6,
      note: '',
      correlationId: 'corr-rating-invalid',
      now: '2026-08-26T20:00:00.000Z',
    })).rejects.toBeInstanceOf(TransactionPolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('rejects rating when the transaction is not in received or rated state', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.submitTransactionRating({
      authUserId: 'auth-buyer-1',
      transactionId: 'transaction-1',
      score: 4,
      note: '',
      correlationId: 'corr-rating-stale',
      now: '2026-08-26T20:00:00.000Z',
    })).rejects.toBeInstanceOf(TransactionPolicyError);
  });
});

describe('publication honnête Root seam (E-03 / E-04, RH-01)', () => {
  // The SDM names the gate: "refus serveur d'une offre sans visuel/avantage". The maquette says
  // `1 image requise` and `Avantage Omni (requis)`. Before this slice NEITHER was enforced.
  it('refuses to publish an offer with no visual, naming the reason', async () => {
    const call = stubSql([{ changed_id: null, changed_state: null, block_reason: 'MEDIA_REQUIRED' }]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.transitionSellerProduct({ authUserId: 'auth-seller-1', productId: 'product-1', to: 'published' }))
      .rejects.toThrow('MEDIA_REQUIRED');
    expect(call.queries[0]).toContain('publication_block');
    expect(call.queries[0]).toContain('jsonb_array_length');
  });

  it('refuses to publish an offer with no advantage, naming the reason', async () => {
    const call = stubSql([{ changed_id: null, changed_state: null, block_reason: 'ADVANTAGE_REQUIRED' }]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.transitionSellerProduct({ authUserId: 'auth-seller-1', productId: 'product-1', to: 'published' }))
      .rejects.toThrow('ADVANTAGE_REQUIRED');
  });

  it('the refusal only fires on draft→published, never on archive (grandfathering D-RH-5)', async () => {
    // The block CTE must be scoped so an already-published offer is never retro-blocked.
    const call = stubSql([{ changed_id: 'product-1', changed_state: 'archived', block_reason: null }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.transitionSellerProduct({ authUserId: 'auth-seller-1', productId: 'product-1', to: 'archived' });
    expect(result).toEqual({ productId: 'product-1', publicationState: 'archived' });
    expect(call.queries[0]).toContain("when (select publication_state from owned) <> 'draft'");
    expect(call.queries[0]).toContain('then null');
  });

  it('publishes and returns the changed row when both facts are present', async () => {
    const call = stubSql([{ changed_id: 'product-1', changed_state: 'published', block_reason: null }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.transitionSellerProduct({ authUserId: 'auth-seller-1', productId: 'product-1', to: 'published' });
    expect(result).toEqual({ productId: 'product-1', publicationState: 'published' });
  });

  it('the archived branch is parenthesised so it cannot archive every offer (pre-existing bug)', async () => {
    // AND binds tighter than OR: without the parentheses the `OR (...= 'archived')` escaped the
    // `p.id = (select id from owned)` filter and an archive would have hit EVERY product.
    const call = stubSql([{ changed_id: 'product-1', changed_state: 'archived', block_reason: null }]);
    const repository = createTrunkRepository(call.sql);
    await repository.transitionSellerProduct({ authUserId: 'auth-seller-1', productId: 'product-1', to: 'archived' });
    expect(call.queries[0]).toContain('and (\n');
    expect(call.queries[0]).toContain("or ((select publication_state from owned) = 'published'");
  });

  it('attaches offer media owner-bound and normalises the references', async () => {
    const call = stubSql([{ id: 'product-1', media: [{ url: 'https://blob.omni.test/a.jpg', kind: 'image' }] }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.setSellerProductMedia({ authUserId: 'auth-seller-1', productId: 'product-1', media: [{ url: 'https://blob.omni.test/a.jpg' }] });
    expect(result.media).toEqual([{ url: 'https://blob.omni.test/a.jpg', kind: 'image' }]);
    expect(call.queries[0]).toContain('a.auth_user_id');
    expect(call.queries[0]).toContain('media =');
  });

  it('resolves ownership through the entity, the canonical path — never facility.account_id', async () => {
    // Live proof on a disposable branch caught this: `facility.account_id` is a SECOND, divergent
    // notion of owner. Every other seller operation (transition, availability) reads
    // coalesce(product.entity_id, facility.entity_id) → v2_entities.account_id. A media attach
    // that read facility.account_id directly refused the real owner.
    const call = stubSql([{ id: 'product-1', media: [{ url: 'https://blob.omni.test/a.jpg', kind: 'image' }] }]);
    const repository = createTrunkRepository(call.sql);
    await repository.setSellerProductMedia({ authUserId: 'auth-seller-1', productId: 'product-1', media: [{ url: 'https://blob.omni.test/a.jpg' }] });
    expect(call.queries[0]).toContain('v2_entities');
    expect(call.queries[0]).toContain('coalesce(p.entity_id, f.entity_id)');
    expect(call.queries[0]).not.toContain('a.id = f.account_id');
  });

  it('authorises an offer-visual upload through the same entity path', async () => {
    const call = stubSql([{ ok: 1 }]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.canManageSellerProduct({ authUserId: 'auth-seller-1', productId: '11111111-1111-4111-8111-111111111111' })).resolves.toBe(true);
    expect(call.queries[0]).toContain('v2_entities');
    expect(call.queries[0]).toContain('coalesce(p.entity_id, f.entity_id)');
  });

  it('refuses an offer-visual upload token for a malformed offer id without querying', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.canManageSellerProduct({ authUserId: 'auth-seller-1', productId: 'not-a-uuid' })).resolves.toBe(false);
    expect(call.queries).toHaveLength(0);
  });

  it('rejects an empty or junk media payload before touching the database', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setSellerProductMedia({ authUserId: 'auth-seller-1', productId: 'product-1', media: [] }))
      .rejects.toBeInstanceOf(SellerCataloguePolicyError);
    await expect(repository.setSellerProductMedia({ authUserId: 'auth-seller-1', productId: 'product-1', media: [{ url: 'http://not-https.test/a.jpg' }] }))
      .rejects.toBeInstanceOf(SellerCataloguePolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('refuses to attach media to an offer the caller does not own', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setSellerProductMedia({ authUserId: 'auth-seller-2', productId: 'product-1', media: [{ url: 'https://blob.omni.test/a.jpg' }] }))
      .rejects.toThrow('FORBIDDEN_OR_NOT_EDITABLE');
  });

  it('reads media back on the public product (E-03 surface)', () => {
    const product = toProduct({ id: 'p', facility_id: 'f', name: 'n', unit: 'u', price_minor: 5000, currency: 'XOF', discount_kind: 'percentage', discount_value_minor: 10, quantity_allocated_omni: 1, media: [{ url: 'https://blob.omni.test/a.jpg', kind: 'image' }] });
    expect(product.media).toEqual([{ url: 'https://blob.omni.test/a.jpg', kind: 'image' }]);
  });

  it('never invents media the row does not carry', () => {
    const product = toProduct({ id: 'p', facility_id: 'f', name: 'n', unit: 'u', price_minor: 5000, currency: 'XOF', discount_kind: null, discount_value_minor: null, quantity_allocated_omni: 0 });
    expect(product.media).toEqual([]);
  });
});

describe('Product availability Root seam (G-04 trunk)', () => {
  it('rejects an invalid availability state before touching the database', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setProductAvailability({
      authUserId: 'auth-seller-1',
      productId: 'product-1',
      to: 'epuise' as 'en_stock',
      expiresInHours: null,
    })).rejects.toBeInstanceOf(SellerCataloguePolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('rejects an invalid expiry window before touching the database', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setProductAvailability({
      authUserId: 'auth-seller-1',
      productId: 'product-1',
      to: 'en_stock',
      expiresInHours: 0,
    })).rejects.toBeInstanceOf(SellerCataloguePolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('writes availability state and logs a manual StockEvent when seller is pro-eligible', async () => {
    const call = stubSql([{ id: 'product-1', from_state: 'a_valider' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.setProductAvailability({
      authUserId: 'auth-seller-1',
      productId: 'product-1',
      to: 'en_stock',
      expiresInHours: 4,
    });
    expect(result).toEqual({ productId: 'product-1', availabilityState: 'en_stock', previousState: 'a_valider' });
    expect(call.queries[0]).toContain('v2_product_stock_events');
    expect(call.queries[0]).toContain('facility_pro');
    expect(call.queries[0]).toContain('manual');
  });

  it('rejects when the seller has no facility_pro entitlement', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setProductAvailability({
      authUserId: 'auth-seller-1',
      productId: 'product-1',
      to: 'en_stock',
      expiresInHours: 4,
    })).rejects.toBeInstanceOf(SellerCataloguePolicyError);
  });

  it('D-04 : la porte de disponibilite exige un entitlement VIVANT (state active ET ends_at futur)', async () => {
    // La colonne commercial_plan n'est jamais remise a 'free' : si la porte se contentait de
    // state='active' (un entitlement n'est jamais bascule a 'expired'), un Pro echou resterait
    // eligible a vie. La porte doit donc exiger ends_at > maintenant.
    const call = stubSql([{ id: 'product-1', from_state: 'a_valider' }]);
    const repository = createTrunkRepository(call.sql);
    await repository.setProductAvailability({ authUserId: 'auth-seller-1', productId: 'product-1', to: 'en_stock', expiresInHours: 4 });
    expect(call.queries[0]).toContain("fe.state = 'active'");
    expect(call.queries[0]).toContain('fe.ends_at > now()');
    // et NE DOIT PLUS juger la capacite sur la colonne collante
    expect(call.queries[0]).not.toContain("e.commercial_plan = 'pro_active' or f.commercial_plan");
  });

  it('D-04 : la porte de PUBLICATION juge l entitlement vivant, pas la colonne collante', async () => {
    // Bug de revenu corrige : avant, la porte lisait e.commercial_plan SEUL, colonne que rien
    // n'alimentait (toujours 'free') -> un vendeur Pro PAYANT ne pouvait pas depasser le plafond.
    const call = stubSql([{ changed_id: 'product-1', changed_state: 'published', block_reason: null }]);
    const repository = createTrunkRepository(call.sql);
    await repository.transitionSellerProduct({ authUserId: 'auth-seller-1', productId: 'product-1', to: 'published' });
    expect(call.queries[0]).toContain("fe.entitlement_kind = 'facility_pro'");
    expect(call.queries[0]).toContain('fe.ends_at > now()');
    expect(call.queries[0]).toContain('is_pro');
  });

  it('liste StockEvent history newest first, bounded to 50', async () => {
    const call = stubSql([{ id: 'event-1', from_state: 'a_valider', to_state: 'en_stock', source: 'manual', reason: null, created_at: '2026-09-02T12:00:00.000Z' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listProductStockEvents({ authUserId: 'auth-seller-1', productId: 'product-1' });
    expect(result.authorized).toBe(true);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ toState: 'en_stock', fromState: 'a_valider', source: 'manual', reason: null });
    expect(call.queries[0]).toContain('limit 50');
  });

  it('returns seller catalogue with availability fields after opportunistic expiry', async () => {
    const facilityRows = [{ id: 'facility-1', name: 'Boutique', category: 'Marché', address: null, operational_state: 'ouvert', currency: 'XOF', product_count: 1 }];
    const productRows = [{ id: 'product-1', facility_id: 'facility-1', facility_name: 'Boutique', name: 'Riz 5kg', description: null, unit: 'sac', price_minor: 5000, currency: 'XOF', discount_kind: 'percentage', discount_value_minor: 10, quantity_allocated_omni: 3, net_price_minor: 4500, publication_state: 'published', availability_state: 'en_stock', availability_expires_at: '2026-09-02T16:00:00.000Z', availability_pro_eligible: true }];
    const queries: string[] = [];
    const seq = [[], [{ id: 'account-1' }], facilityRows, productRows];
    let index = 0;
    const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
      queries.push(strings.raw.join('¦'));
      void values;
      const rows = seq[Math.min(index, seq.length - 1)];
      index += 1;
      return Promise.resolve(rows);
    }) as unknown as SqlStub;
    const repository = createTrunkRepository(sql);
    const result = await repository.listSellerCatalogue({ authUserId: 'auth-seller-1' });
    expect(result.authorized).toBe(true);
    expect(result.products[0]).toMatchObject({ availabilityState: 'en_stock', availabilityProEligible: true });
    expect(result.products[0].availabilityExpiresAt).toBe('2026-09-02T16:00:00.000Z');
    expect(result.catalogReady).toBe(true);
    expect(queries[0]).toContain('v2_expire_stale_availability');
    expect(queries[3]).toContain('availability_state');
  });

  it('lets an owning seller flip its facility operational state (V-7d)', async () => {
    const call = stubSql([{ id: 'facility-1', operational_state: 'ferme' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.setSellerFacilityOperationalState({ authUserId: 'auth-seller-1', facilityId: 'facility-1', state: 'ferme', correlationId: 'corr-seller-1' });
    expect(result.operationalState).toBe('ferme');
    expect(call.queries[0]).toContain('onboarding_state = \'seller_ready\'');
    expect(call.queries[0]).toContain('f.account_id = seller.id');
    expect(call.queries[0]).toContain('facility_operational_state_changed');
  });

  it('rejects seller op-state for a facility it does not own (no row returned', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setSellerFacilityOperationalState({ authUserId: 'auth-seller-1', facilityId: 'facility-1', state: 'ferme', correlationId: 'corr-seller-1' })).rejects.toThrow('Seller session is not authorized');
  });

  it('flags the seller catalogue as not ready when no sellable stock exists', async () => {
    const facilityRows = [{ id: 'facility-1', name: 'Boutique', category: 'Marché', address: null, operational_state: 'ouvert', currency: 'XOF', product_count: 1 }];
    const productRows = [{ id: 'product-1', facility_id: 'facility-1', facility_name: 'Boutique', name: 'Riz 5kg', description: null, unit: 'sac', price_minor: 5000, currency: 'XOF', discount_kind: null, discount_value_minor: null, quantity_allocated_omni: 0, net_price_minor: null, publication_state: 'published', availability_state: 'a_valider', availability_expires_at: null, availability_pro_eligible: false }];
    const { sql, queries } = stubSqlSequence([[], [{ id: 'account-1' }], facilityRows, productRows]);
    const repository = createTrunkRepository(sql);
    const result = await repository.listSellerCatalogue({ authUserId: 'auth-seller-1' });
    expect(result.catalogReady).toBe(false);
    expect(result.products).toHaveLength(1);
  });
});

function stubSqlSequence(sequence: Record<string, unknown>[][]): { sql: SqlStub; queries: string[]; values: unknown[][] } {
  const queries: string[] = [];
  const values: unknown[][] = [];
  let index = 0;
  const sql = ((strings: TemplateStringsArray, ...bound: unknown[]) => {
    queries.push(strings.raw.join('¦'));
    // Les valeurs liées ne figurent JAMAIS dans le texte SQL : un test qui cherche un
    // littéral dans `queries` ne peut pas voir un paramètre. On les capture ici.
    values.push(bound);
    const rows = sequence[Math.min(index, sequence.length - 1)];
    index += 1;
    return Promise.resolve(rows);
  }) as SqlStub;
  return { sql, queries, values };
}

describe('admin console Root seam (T-07a)', () => {
  it('locks the console for a session without an active admin role', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.getAdminConsole({ authUserId: 'auth-user-1' })).resolves.toEqual({ authorized: false, pendingClaims: 0, pendingActivations: 0, operatorRuns: 0, auditEventsToday: 0 });
    expect(call.queries).toHaveLength(1);
    expect(call.queries[0]).toContain("ar.role = 'admin'");
  });

  it('maps real queue counts for an active admin', async () => {
    const call = stubSql([{ is_admin: 1, pending_claims: 3, pending_activations: 2, operator_runs: 5, audit_today: 7 }]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.getAdminConsole({ authUserId: 'auth-admin' })).resolves.toEqual({ authorized: true, pendingClaims: 3, pendingActivations: 2, operatorRuns: 5, auditEventsToday: 7 });
    expect(call.queries[0]).toContain("state in ('submitted', 'admin_review')");
    expect(call.queries[0]).toContain('v2_audit_events');
  });
});

describe('facility operational state Root seam (T-07a, D-01)', () => {
  it('rejects an invalid operational state before persistence', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setFacilityOperationalState({ authUserId: 'auth-admin', facilityId: 'facility-1', state: 'closed' as never, reason: 'motif valide', correlationId: 'corr-op-1' })).rejects.toBeInstanceOf(FieldPilotPolicyError);
    await expect(repository.setFacilityOperationalState({ authUserId: 'auth-admin', facilityId: 'facility-1', state: 'ferme', reason: 'x', correlationId: 'corr-op-2' })).rejects.toBeInstanceOf(FieldPilotPolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('writes the operational state and its audit event in one guarded statement', async () => {
    const call = stubSql([{ id: 'facility-1', operational_state: 'ferme' }]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setFacilityOperationalState({ authUserId: 'auth-admin', facilityId: 'facility-1', state: 'ferme', reason: 'Marché incendié, vérifié terrain', correlationId: 'corr-op-3' })).resolves.toEqual({ facilityId: 'facility-1', operationalState: 'ferme' });
    expect(call.queries[0]).toContain('facility_operational_state_changed');
    expect(call.queries[0]).toContain('v2_audit_events');
    expect(call.queries[0]).toContain("ar.role = 'admin'");
  });

  it('rejects when the admin guard or the facility fails', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setFacilityOperationalState({ authUserId: 'auth-user-1', facilityId: 'facility-1', state: 'ouvert', reason: 'motif valide', correlationId: 'corr-op-4' })).rejects.toBeInstanceOf(FieldPilotPolicyError);
    expect(call.queries).toHaveLength(1);
  });
});

describe('sales counter correction Root seam (T-07a, A6 exceptional)', () => {
  it('rejects out-of-range or fractional counters before persistence', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.correctFacilitySalesCounter({ authUserId: 'auth-admin', facilityId: 'facility-1', qualifyingSales: 4, reason: 'motif valide', correlationId: 'corr-cnt-1' })).rejects.toBeInstanceOf(FieldPilotPolicyError);
    await expect(repository.correctFacilitySalesCounter({ authUserId: 'auth-admin', facilityId: 'facility-1', qualifyingSales: 1.5, reason: 'motif valide', correlationId: 'corr-cnt-2' })).rejects.toBeInstanceOf(FieldPilotPolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('corrects only the counter and never touches the trust state', async () => {
    const call = stubSql([{ id: 'facility-1', qualifying_sales: 1, previous_sales: 3 }]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.correctFacilitySalesCounter({ authUserId: 'auth-admin', facilityId: 'facility-1', qualifyingSales: 1, reason: 'Double comptage vérifié en caisse', correlationId: 'corr-cnt-3' })).resolves.toEqual({ facilityId: 'facility-1', qualifyingSales: 1, previousQualifyingSales: 3 });
    expect(call.queries[0]).toContain('facility_sales_counter_corrected');
    expect(call.queries[0]).toContain('qualifying_sales');
    expect(call.queries[0]).not.toContain('trust_state');
  });

  it('rejects a no-op correction or a failed admin guard', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.correctFacilitySalesCounter({ authUserId: 'auth-admin', facilityId: 'facility-1', qualifyingSales: 2, reason: 'motif valide', correlationId: 'corr-cnt-4' })).rejects.toThrow('already holds that value');
    expect(call.queries).toHaveLength(1);
  });
});

describe('admin audit log Root seam (T-07a)', () => {
  it('locks the audit log for a session without an active admin role', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.listAdminAuditEvents({ authUserId: 'auth-user-1' })).resolves.toEqual({ authorized: false, events: [] });
    expect(call.queries).toHaveLength(1);
  });

  it('returns reverse-chronological events with facility coordinates for the map hop', async () => {
    const call = stubSqlSequence([
      [{ id: 'account-admin' }],
      [{ id: 'event-1', event_type: 'claim_reviewed', entity_type: 'facility', entity_id: 'facility-1', actor_account_id: 'account-admin', reason: 'Preuves suffisantes', created_at: '2026-09-03T10:00:00.000Z', facility_name: 'Marché Hedzranawoé', latitude: 6.17, longitude: 1.22 }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listAdminAuditEvents({ authUserId: 'auth-admin', eventType: 'claim_reviewed' });
    expect(result.authorized).toBe(true);
    expect(result.events).toEqual([{ id: 'event-1', eventType: 'claim_reviewed', entityType: 'facility', entityId: 'facility-1', actorAccountId: 'account-admin', reason: 'Preuves suffisantes', createdAt: '2026-09-03T10:00:00.000Z', facilityName: 'Marché Hedzranawoé', latitude: 6.17, longitude: 1.22 }]);
    expect(call.queries[1]).toContain('where e.event_type');
    expect(call.queries[1]).toContain('order by e.created_at desc');
  });

  it('bounds the requested limit between 1 and 100', async () => {
    const call = stubSqlSequence([[{ id: 'account-admin' }], []]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listAdminAuditEvents({ authUserId: 'auth-admin', limit: 500 });
    expect(result.authorized).toBe(true);
    expect(result.events).toEqual([]);
    expect(call.queries[1]).not.toContain('where e.event_type');
  });
});


describe('seller facility creation Root seam (NW-13c)', () => {
  it('rejects an invalid facility type before touching the database', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createSellerFacility({
      authUserId: 'auth-user-1',
      name: 'Le Fournil',
      facilityType: 'parking' as never,
      ownerKind: 'organisation',
      category: null,
      description: null,
      address: null,
      latitude: 6.13,
      longitude: 1.22,
      rayonKm: null,
      contactPhone: null,
      contactWhatsapp: null,
      idempotencyKey: 'nwc13-facility-key-0000001',
    })).rejects.toBeInstanceOf(SellerCataloguePolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('requires coordinates for a physical (fixe) facility', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createSellerFacility({
      authUserId: 'auth-user-1',
      name: 'Le Fournil',
      facilityType: 'fixe',
      ownerKind: 'organisation',
      category: null,
      description: null,
      address: null,
      latitude: null,
      longitude: null,
      rayonKm: null,
      contactPhone: null,
      contactWhatsapp: null,
      idempotencyKey: 'nwc13-facility-key-0000002',
    })).rejects.toBeInstanceOf(SellerCataloguePolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('rejects a rayon on a fixe facility', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createSellerFacility({
      authUserId: 'auth-user-1',
      name: 'Le Fournil',
      facilityType: 'fixe',
      ownerKind: 'organisation',
      category: null,
      description: null,
      address: null,
      latitude: 6.13,
      longitude: 1.22,
      rayonKm: 10,
      contactPhone: null,
      contactWhatsapp: null,
      idempotencyKey: 'nwc13-facility-key-0000003',
    })).rejects.toBeInstanceOf(SellerCataloguePolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('provisions a free slot and creates an unconfirmed typed facility', async () => {
    const call = stubSqlSequence([
      [], // slot provision: insert ... on conflict
      [{ facility_id: 'facility-9', slot_id: 'slot-9', created: true }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.createSellerFacility({
      authUserId: 'auth-user-1',
      name: 'Ma petite échoppe mobile',
      facilityType: 'mobile',
      ownerKind: 'organisation',
      category: 'Épicerie',
      description: null,
      address: 'Lomé',
      latitude: 6.13,
      longitude: 1.22,
      rayonKm: 5,
      contactPhone: null,
      contactWhatsapp: null,
      idempotencyKey: 'nwc13-facility-key-0000004',
    });
    expect(result).toEqual({ facilityId: 'facility-9', slotId: 'slot-9', trustState: 'unconfirmed', facilityType: 'mobile', created: true });
    expect(call.queries[0]).toContain('insert into v2_facility_slots');
    expect(call.queries[0]).toContain("source = 'free'");
    expect(call.queries[1]).toContain('facility_type');
    expect(call.queries[1]).toContain('rayon_km');
    expect(call.queries[1]).toContain("trust_state)");
    expect(call.queries[1]).toContain('source_name');
  });

  // R-D : la nature de l'offreur est DÉCLARÉE, et le Seed en dépend (D-C6 : un particulier
  // prouve sa confiance par 1 vente, un commerce par 3). Avant ce correctif, `createSellerFacility`
  // écrivait `'organisation'` en dur — aucune requête ne pouvait produire `kind = 'individu'`,
  // donc le chemin `individu` était structurellement inatteignable.
  it('R-D — persists a declared individu owner kind instead of hardcoding organisation', async () => {
    const call = stubSqlSequence([
      [],
      [{ facility_id: 'facility-11', slot_id: 'slot-11', created: true }],
    ]);
    const repository = createTrunkRepository(call.sql);
    await repository.createSellerFacility({
      authUserId: 'auth-user-1',
      name: 'Couture à domicile',
      facilityType: 'digital',
      ownerKind: 'individu',
      category: 'Textile',
      description: null,
      address: null,
      latitude: null,
      longitude: null,
      rayonKm: null,
      contactPhone: null,
      contactWhatsapp: null,
      idempotencyKey: 'nwrd-individu-key-0000001',
    });
    // `ownerKind` est une VALEUR LIÉE : elle n'apparaît pas dans le texte SQL.
    // L'assertion doit donc porter sur les paramètres, pas sur `queries`.
    expect(call.values[1]).toContain('individu');
    expect(call.values[1]).not.toContain('organisation');
  });

  it('R-D — still persists organisation when the seller declares a business', async () => {
    const call = stubSqlSequence([
      [],
      [{ facility_id: 'facility-12', slot_id: 'slot-12', created: true }],
    ]);
    const repository = createTrunkRepository(call.sql);
    await repository.createSellerFacility({
      authUserId: 'auth-user-1',
      name: 'Le Fournil',
      facilityType: 'fixe',
      ownerKind: 'organisation',
      category: null,
      description: null,
      address: null,
      latitude: 6.13,
      longitude: 1.22,
      rayonKm: null,
      contactPhone: null,
      contactWhatsapp: null,
      idempotencyKey: 'nwrd-organisation-key-00001',
    });
    expect(call.values[1]).toContain('organisation');
    expect(call.values[1]).not.toContain('individu');
  });

  it('allows a digital facility without coordinates and without a rayon', async () => {
    const call = stubSqlSequence([
      [],
      [{ facility_id: 'facility-10', slot_id: 'slot-10', created: true }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.createSellerFacility({
      authUserId: 'auth-user-1',
      name: 'Boutique en ligne',
      facilityType: 'digital',
      ownerKind: 'organisation',
      category: 'Textile',
      description: null,
      address: 'Lomé (en ligne)',
      latitude: null,
      longitude: null,
      rayonKm: null,
      contactPhone: null,
      contactWhatsapp: null,
      idempotencyKey: 'nwc13-facility-key-0000005',
    });
    expect(result.created).toBe(true);
    expect(result.trustState).toBe('unconfirmed');
    expect(call.queries[1]).toContain('facility_type');
    expect(call.queries[1]).toContain('rayon_km');
  });

  it('creates the offering ENTITY with the facility (R-2/S-25) — sinon le vendeur ne peut jamais publier', async () => {
    const call = stubSqlSequence([
      [],
      [{ facility_id: 'facility-11', slot_id: 'slot-11', created: true }],
    ]);
    const repository = createTrunkRepository(call.sql);
    await repository.createSellerFacility({
      authUserId: 'auth-user-1',
      name: 'Atelier Kegue',
      facilityType: 'fixe',
      ownerKind: 'organisation',
      category: null,
      description: null,
      address: 'Lomé',
      latitude: 6.13,
      longitude: 1.22,
      rayonKm: null,
      contactPhone: null,
      contactWhatsapp: null,
      idempotencyKey: 'r4-entity-key-0000001',
    });
    const publishSql = call.queries[1];
    // Le lieu reçoit son entité dans la MEME instruction : la publication exige ce lien,
    // donc un vendeur sans entité serait définitivement bloqué.
    expect(publishSql).toContain('insert into v2_entities');
    // R-D : la nature n'est plus un littéral figé dans le SQL — elle est liée. L'assertion
    // porte donc sur la valeur transmise (avant ce correctif : `'organisation'` en dur).
    expect(call.values[1]).toContain('organisation');
    expect(publishSql).toContain('entity_id');
    // Une CTE qui écrit n'est pas visible par les autres CTE de la meme instruction :
    // l'entite doit venir d'un RETURNING, jamais d'une relecture de table.
    expect(publishSql).toContain('returning id, account_id');
  });
});

describe('bulk credit packs (NW-13i)', () => {
  it('exposes the catalog from the single pricing source without DB access', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    const packs = await repository.getBulkPacks();
    expect(packs.length).toBeGreaterThan(0);
    expect(packs[0]).toMatchObject({ id: expect.any(String), credits: expect.any(Number), priceMinor: expect.any(Number), billingCurrency: 'XOF' });
    expect(call.queries).toHaveLength(0);
  });

  it('rejects an unknown pack id before touching the provider boundary', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.createBulkPackRecharge({
      authUserId: 'auth-user-1',
      packId: 'bogus',
      idempotencyKey: 'bulk-pack-key-0000001',
      callbackUrl: 'https://omni.test/callback',
      customer: { email: 'buyer@omni.test' },
    })).rejects.toBeInstanceOf(WalletPolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('derives a pack recharge from the catalog (amount + purpose + credits) when FedaPay is configured', async () => {
      const previous = new Map<string, string | undefined>();
      for (const key of ['FEDAPAY_ENV', 'FEDAPAY_SANDBOX_SECRET_KEY', 'FEDAPAY_SANDBOX_WEBHOOK_SECRET']) {
        previous.set(key, process.env[key]);
      }
      process.env.FEDAPAY_ENV = 'sandbox';
      process.env.FEDAPAY_SANDBOX_SECRET_KEY = 'sandbox-secret-test';
      process.env.FEDAPAY_SANDBOX_WEBHOOK_SECRET = 'sandbox-webhook-test';
      const fetchStub = async () => new Response(JSON.stringify({ id: 'trx_bulk1', status: 'pending', url: 'https://checkout.test' }), { status: 200, headers: { 'content-type': 'application/json' } });
      const originalFetch = globalThis.fetch;
      globalThis.fetch = fetchStub as typeof fetch;
      try {
        const call = stubSqlSequence([
          [], // existing intent lookup → none
          [{ id: 'pack-intent-1', account_id: 'account-1' }], // insert intent
          [{ id: 'pack-intent-1', account_id: 'account-1', amount_minor: 50000, currency: 'XOF', status: 'pending', provider_transaction_id: 'trx_bulk1', checkout_url: 'https://checkout.test', purpose: 'pack', pack_credits: 10 }], // updated
        ]);
        const repository = createTrunkRepository(call.sql);
        const result = await repository.createBulkPackRecharge({
          authUserId: 'auth-user-1',
          packId: 'starter',
          idempotencyKey: 'bulk-pack-key-0000003',
          callbackUrl: 'https://omni.test/callback',
          customer: { email: 'buyer@omni.test' },
        });
        expect(result.purpose).toBe('pack');
        expect(result.packCredits).toBe(10);
        expect(result.amountMinor).toBe(50000);
        expect(call.queries[1]).toContain('purpose');
        expect(call.queries[1]).toContain('pack_credits');
        expect(call.queries[1]).toContain('pack');
      } finally {
        for (const [key, value] of previous) {
          if (value === undefined) delete process.env[key];
          else process.env[key] = value;
        }
        globalThis.fetch = originalFetch;
      }
    });
  });
describe('RAC-1 seller contact Root seam', () => {
  it('exposes the seller contact only within a transaction snapshot (member-scoped)', async () => {
    const call = stubSql([{
      transaction_id: 'transaction-1',
      product_id: 'product-1',
      facility_id: 'facility-1',
      quantity: 2,
      unit_price_minor: 1000,
      coupon_code: null,
      net_amount_minor: 2000,
      seller_facility_name: 'Boutique A',
      seller_contact_phone: '+22890000000',
      seller_contact_whatsapp: '+22890000001',
      actor_role: 'buyer',
      current_state: 'intent_created',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.getTransaction({ authUserId: 'auth-user-1', transactionId: 'transaction-1' });
    expect(result).toMatchObject({
      transactionId: 'transaction-1',
      sellerFacilityName: 'Boutique A',
      sellerContactPhone: '+22890000000',
      sellerContactWhatsapp: '+22890000001',
    });
    expect(call.queries[0]).toContain('join v2_transaction_members');
    expect(call.queries[0]).toContain('join v2_accounts');
    expect(call.queries[0]).toContain('left join v2_facilities f');
    expect(call.queries[0]).toContain('f.contact_phone as seller_contact_phone');
    expect(call.queries[0]).toContain('f.contact_whatsapp as seller_contact_whatsapp');
  });

  it('returns null contact fields when the facility has none set', async () => {
    const call = stubSql([{
      transaction_id: 'transaction-2',
      product_id: 'product-1',
      facility_id: 'facility-1',
      quantity: 1,
      unit_price_minor: 500,
      coupon_code: null,
      net_amount_minor: 500,
      seller_facility_name: 'Boutique B',
      seller_contact_phone: null,
      seller_contact_whatsapp: null,
      actor_role: 'seller',
      current_state: 'payment_declared',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.getTransaction({ authUserId: 'auth-user-1', transactionId: 'transaction-2' });
    expect(result).toMatchObject({
      sellerFacilityName: 'Boutique B',
      sellerContactPhone: null,
      sellerContactWhatsapp: null,
    });
  });

  it('updates the seller contact only for the owning account', async () => {
    const call = stubSql([{
      facility_id: 'facility-1',
      contact_phone: '+22891111111',
      contact_whatsapp: '+22891111112',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.updateSellerFacilityContact({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      contactPhone: ' +22891111111 ',
      contactWhatsapp: '+22891111112',
    });
    expect(result).toEqual({
      facilityId: 'facility-1',
      contactPhone: '+22891111111',
      contactWhatsapp: '+22891111112',
    });
    expect(call.queries[0]).toContain('update v2_facilities f');
    expect(call.queries[0]).toContain('f.account_id = a.id');
    expect(call.queries[0]).toContain('a.auth_user_id =');
  });

  it('rejects an invalid contact length without touching the database', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.updateSellerFacilityContact({
      authUserId: 'auth-user-1',
      facilityId: 'facility-1',
      contactPhone: '1234',
      contactWhatsapp: null,
    })).rejects.toBeInstanceOf(SellerCataloguePolicyError);
    expect(call.queries).toHaveLength(0);
  });

  it('createSellerFacility accepts and persists optional contact fields', async () => {
    const call = stubSqlSequence([
      [],
      [{ facility_id: 'facility-9', slot_id: 'slot-9', created: true }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.createSellerFacility({
      authUserId: 'auth-user-1',
      name: 'Boutique Contact',
      facilityType: 'fixe',
      ownerKind: 'organisation',
      category: 'Marché',
      description: null,
      address: 'Lomé',
      latitude: 6.13,
      longitude: 1.22,
      rayonKm: null,
      contactPhone: '+22890000000',
      contactWhatsapp: '+22890000001',
      idempotencyKey: 'rac1-facility-contact-0001',
    });
    expect(result.facilityId).toBe('facility-9');
    expect(result.created).toBe(true);
    expect(call.queries[1]).toContain('contact_phone');
    expect(call.queries[1]).toContain('contact_whatsapp');
  });
});
describe('FF-2 open transactions Root seam', () => {
  it('lists non-terminal transactions for the caller, member-scoped, newest first', async () => {
    const call = stubSql([{
      transaction_id: 'transaction-1',
      current_state: 'qr_ready',
      actor_role: 'buyer',
      product_id: 'product-1',
      product_name: 'Chaise',
      facility_id: 'facility-1',
      facility_name: 'Boutique A',
      quantity: 10,
      net_amount_minor: 95000,
      last_event_at: '2026-09-16T10:00:00.000Z',
      created_at: '2026-09-16T09:00:00.000Z',
    }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listOpenTransactions({ authUserId: 'auth-user-1' });
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toMatchObject({
      transactionId: 'transaction-1',
      state: 'qr_ready',
      actorRole: 'buyer',
      productName: 'Chaise',
      facilityName: 'Boutique A',
      quantity: 10,
      netAmountMinor: 95000,
    });
    expect(call.queries[0]).toContain('join v2_transaction_members');
    expect(call.queries[0]).toContain("current_state <> 'closed'");
    expect(call.queries[0]).toContain('left join v2_products p');
  });

  it('returns an empty list when the caller has no open transaction', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listOpenTransactions({ authUserId: 'auth-user-empty' });
    expect(result.transactions).toEqual([]);
  });
});

describe('FF-4 buyer cancels an availability request (Phase A only)', () => {
  it('cancels an owned, non-expired request while no purchase intent exists', async () => {
    const call = stubSql([{ id: 'request-1', status: 'cancelled' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.cancelAvailabilityRequest({ authUserId: 'auth-user-1', requestId: 'request-1' });
    expect(result).toEqual({ requestId: 'request-1', status: 'cancelled', cancelled: true });
    const query = call.queries[0];
    expect(query).toContain('v2_availability_requests');
    expect(query).toContain('a.auth_user_id =');
    expect(query).toContain('v2_purchase_intents');
    expect(query).toContain("set status = 'cancelled'");
    expect(query).toContain("r.status in ('draft', 'submitted', 'responding')");
    expect(query).toContain('r.expires_at > now()');
    expect(query).toContain('not exists (select 1 from locked)');
  });

  it('refuses when the request is not owned, already engaged, expired or missing', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.cancelAvailabilityRequest({ authUserId: 'auth-user-1', requestId: 'request-9' }))
      .rejects.toThrow(AvailabilityPolicyError);
  });
});

describe('FF-3 expiration sweep (server, pre-lock only)', () => {
  it('expires stalled pre-lock intents, expires the linked request and audits', async () => {
    const call = stubSql([{ transaction_id: 'transaction-1', request_id: 'request-1' }]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.sweepExpiredIntents({ now: '2026-09-17T10:00:00.000Z', correlationId: 'corr-sweep-1' });
    expect(result).toEqual({ expired: 1, requestIds: ['request-1'] });
    const query = call.queries[0];
    expect(query).toContain("pi.state = 'active'");
    expect(query).toContain("set state = 'expired'");
    expect(query).toContain("e.state = 'qr_verified'");
    expect(query).toContain('not exists');
    expect(query).toContain("r.status in ('draft', 'submitted', 'responding')");
    expect(query).toContain("'intent_expired'");
    expect(query).toContain("'stalled_before_lock'");
    expect(query).toContain('on conflict (correlation_id, event_type, entity_type, entity_id) do nothing');
    // FF-8 : l'expiration libère la réservation, sans toucher au stock déclaré.
    expect(query).toContain('set quantity_reserved_omni = greatest(p.quantity_reserved_omni - s.quantity, 0)');
    expect(query).toContain('join v2_transaction_snapshots s on s.intent_id = ie.id');
  });

  it('reports zero when nothing is stalled (idempotent no-op)', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.sweepExpiredIntents({ now: '2026-09-17T10:00:00.000Z', correlationId: 'corr-sweep-2' });
    expect(result).toEqual({ expired: 0, requestIds: [] });
  });
});

