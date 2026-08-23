import { describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { AvailabilityPolicyError, AvailabilityResponsePolicyError, createTrunkRepository, PurchaseIntentPolicyError, toProduct, TransactionPolicyError, WalletPolicyError } from './trunk-repository';

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
      amountMinor: 2000,
      status: 'confirmed',
      facilityId: 'facility-1',
    });
    expect(call.queries[0]).toContain("f.trust_state = 'confirmed'");
    expect(call.queries[0]).toContain('f.qualifying_sales >= 3');
    expect(call.queries[0]).toContain('f.bonus_unlocked_at is null');
    expect(call.queries[0]).toContain('for update of f');
    expect(call.queries[0]).toContain("'bonus_grant', 2000, 'confirmed'");
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
