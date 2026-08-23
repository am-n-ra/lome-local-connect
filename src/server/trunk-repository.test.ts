import { describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { AvailabilityPolicyError, createTrunkRepository, toProduct } from './trunk-repository';

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
