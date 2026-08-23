import { describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { AvailabilityPolicyError, createTrunkRepository, PurchaseIntentPolicyError, toProduct, WalletPolicyError } from './trunk-repository';

type SqlStub = ReturnType<typeof neon>;

const availabilityInput = {
  authUserId: 'auth-user-1',
  productId: 'product-1',
  facilityId: 'facility-1',
  quantity: 2,
  budgetMode: 'maximum' as const,
  budgetMinor: 1000,
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
  expires_at: '2026-08-22T01:00:00.000Z',
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

describe('public product boundary', () => {
  it('does not expose allocated stock as a public catalogue fact', () => {
    const product = toProduct({
      id: 'product-1',
      facility_id: 'facility-1',
      name: 'Tomatoes',
      description: 'Fresh tomatoes',
      category: 'Fresh produce',
      unit: '1 kg',
      price_minor: 1500,
      currency: 'XOF',
      quantity_allocated_omni: 12,
      coupon_label: null,
    });

    expect(product).not.toHaveProperty('availableQuantity');
    expect(product).not.toHaveProperty('quantity_allocated_omni');
    expect(product).toMatchObject({ id: 'product-1', facilityId: 'facility-1', name: 'Tomatoes', priceMinor: 1500 });
  });
});

describe('availability repository Root seam', () => {
  it('keeps account, wallet and request provisioning in one guarded statement and replays the canonical request', async () => {
    const firstCall = stubSql([resultRow]);
    const repository = createTrunkRepository(firstCall.sql);

    const first = await repository.createAvailabilityRequest(availabilityInput);
    const replay = await repository.createAvailabilityRequest(availabilityInput);

    expect(first.requestId).toBe('request-1');
    expect(replay).toEqual(first);
    expect(firstCall.queries).toHaveLength(2);
    expect(firstCall.queries[0]).toContain('with valid_selection as');
    expect(firstCall.queries[0]).toContain('on conflict (auth_user_id)');
    expect(firstCall.queries[0]).toContain('on conflict (account_id)');
    expect(firstCall.queries[0]).toContain('on conflict (buyer_account_id, idempotency_key)');
    expect(firstCall.queries[0]).toContain("p.publication_state = 'published'");
    expect(firstCall.queries[0]).toContain("f.trust_state in ('certified', 'unconfirmed', 'confirmed')");
  });

  it('does not provision an account or wallet when the selected product is outside the requested facility or unpublished', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.createAvailabilityRequest(availabilityInput)).rejects.toBeInstanceOf(AvailabilityPolicyError);
    expect(call.queries[0]).toContain('where exists (select 1 from valid_selection)');
  });

  it('rejects an idempotency replay whose request shape differs from the stored response', async () => {
    const call = stubSql([{ ...resultRow, requested_quantity: 1 }]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.createAvailabilityRequest(availabilityInput)).rejects.toThrow(
      'The idempotency key is already used for a different availability request.',
    );
  });
});

describe('wallet persistence Root seam', () => {
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
    });
    const replay = await repository.createPurchaseIntent({
      authUserId: 'auth-user-1',
      responseId: 'response-1',
      idempotencyKey: 'intent-key-1',
    });

    expect(replay).toEqual(first);
    expect(call.queries).toHaveLength(2);
    expect(call.queries[0]).toContain("ar.status in ('available', 'partial', 'corrected')");
    expect(call.queries[0]).toContain('r.buyer_account_id');
    expect(call.queries[0]).toContain('insert into v2_transaction_snapshots');
    expect(call.queries[0]).toContain('insert into v2_transaction_members');
    expect(call.queries[0]).toContain('insert into v2_transaction_events');
    expect(call.queries[0]).toContain('on conflict (transaction_id, state) do nothing');
  });

  it('rejects an unavailable or out-of-scope response without returning an intent', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);

    await expect(repository.createPurchaseIntent({
      authUserId: 'auth-user-1',
      responseId: 'response-1',
      idempotencyKey: 'intent-key-2',
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
    })).rejects.toThrow('The idempotency key is already used for a different purchase intent.');
  });
});

describe('QR persistence Root seam', () => {
  it('conditionally verifies one authorized seller token and returns the committed replay count', async () => {
    const call = stubSql([{
      transaction_id: 'transaction-1',
      verified_at: '2026-08-23T00:00:00.000Z',
      replay_count: 1,
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
