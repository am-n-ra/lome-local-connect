import { describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository, FieldPilotPolicyError } from './trunk-repository';

type SqlStub = ReturnType<typeof neon>;

function stubSql(rows: Record<string, unknown>[]): { sql: SqlStub; queries: string[] } {
  const queries: string[] = [];
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push(strings.raw.join('¦'));
    void values;
    return Promise.resolve(rows);
  }) as SqlStub;
  return { sql, queries };
}

function stubSqlSequence(sequence: Record<string, unknown>[][]): { sql: SqlStub; queries: string[] } {
  const queries: string[] = [];
  let index = 0;
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push(strings.raw.join('¦'));
    void values;
    const rows = sequence[Math.min(index, sequence.length - 1)];
    index += 1;
    return Promise.resolve(rows);
  }) as SqlStub;
  return { sql, queries };
}

describe('admin role management Root seam ( NW-12.5)', () => {
  it('locks the role list for a session without an active admin role', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.listRoleManagementAccounts({ authUserId: 'auth-user-1' })).resolves.toEqual({ authorized: false, accounts: [] });
    expect(call.queries).toHaveLength(1);
    expect(call.queries[0]).toContain("ar.role = 'admin'");
  });

  it('maps real accounts with active roles and facility counts', async () => {
    const rows = [
      { account_id: 'account-1', auth_user_id: 'auth-1', onboarding_state: 'seller_ready', suspended_at: null, facility_count: 2, roles: ['buyer', 'seller', 'operator', 'revoked'] },
      { account_id: 'account-2', auth_user_id: 'auth-2', onboarding_state: 'created', suspended_at: '2026-09-01T10:00:00.000Z', facility_count:  ​0, roles: ['buyer', 'reviewer'] },
    ];
    const call = stubSql(rows);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.listRoleManagementAccounts({ authUserId: 'auth-admin' });
    expect(result.authorized).toBe(true);
    expect(result.accounts).toEqual([
      { accountId: 'account-1', authUserId: 'auth-1', roles: ['buyer', 'seller', 'operator'], onboardingState: 'seller_ready', suspended: false, facilityCount: 2 },
      { accountId: 'account-2', authUserId: 'auth-2', roles: ['buyer', 'reviewer'], onboardingState: 'created', suspended: true, facilityCount:  ​0 },
    ]);
    expect(call.queries[0]).toContain('count(distinct f.id)::int as facility_count');
    expect(call.queries[0]).toContain('left join v2_account_roles ar');
  });

  it('grants and revokes a managed staff role with an audit trail', async () => {
    const call = stubSqlSequence([
      [{ account_id: 'account-1', role: 'operator', status: 'active' }],
    ]);
    const repository = createTrunkRepository(call.sql);
    const result = await repository.setManagedStaffRole({
      authUserId: 'auth-admin', accountId: 'account-1', role: 'operator', status: 'active', reason: 'Activation pour tournée', correlationId: 'corr-role',
    });
    expect(result).toMatchObject({ accountId: 'account-1', role: 'operator', status: 'active' });
    expect(call.queries[0]).toContain("ar.role = 'admin'");
    expect(call.queries[0]).toContain('on conflict (account_id, role) do update set status = excluded.status');
    expect(call.queries[0]).toContain("'staff_role_granted'");
  });

  it('rejects invalid managed role inputs before any query', async () => {
    const call = stubSql([]);
    const repository = createTrunkRepository(call.sql);
    await expect(repository.setManagedStaffRole({ authUserId: 'auth-admin', accountId: 'account-1', role: 'owner' as never, status: 'active', reason: 'x', correlationId: 'corr-role' })).rejects.toBeInstanceOf(FieldPilotPolicyError);
    expect(call.queries).toHaveLength(0);
  });
});