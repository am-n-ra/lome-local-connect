import { describe, expect, it } from 'vitest';
import { ROUTE_QUOTA, pruneRouteRequests, recordRouteRequest, routeQuotaExceeded, type QuotaSql } from './route-quota';

/** Records every statement and answers the count query from a supplied number.
 * The real SQL text is inspected, so a wrong column name or a dropped window
 * filter fails the test instead of passing silently. */
function stubSql(input: { hourly: number; daily: number; statements?: string[] }): QuotaSql {
  return (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?');
    input.statements?.push(text);
    if (!text.includes('count(*)')) return [];
    const interval = String(values[1] ?? '');
    return [{ used: interval.includes('1 hour') ? input.hourly : input.daily }];
  }) as QuotaSql;
}

describe('routeQuotaExceeded', () => {
  it('allows a request when the buyer is under both windows', async () => {
    const reason = await routeQuotaExceeded({ authUserId: 'auth-1', sql: stubSql({ hourly: 3, daily: 40 }) });
    expect(reason).toBeNull();
  });

  it('reports the hourly window first so the client can say when to retry', async () => {
    const reason = await routeQuotaExceeded({ authUserId: 'auth-1', sql: stubSql({ hourly: ROUTE_QUOTA.perHour, daily: 40 }) });
    expect(reason).toBe('QUOTA_HOURLY');
  });

  it('reports the daily window when only the day is exhausted', async () => {
    const reason = await routeQuotaExceeded({ authUserId: 'auth-1', sql: stubSql({ hourly: 2, daily: ROUTE_QUOTA.perDay }) });
    expect(reason).toBe('QUOTA_DAILY');
  });

  it('keys the count on the authenticated user, not on an account id', async () => {
    // Regression guard: the first draft keyed on a `v2_accounts` uuid, but the
    // route only ever holds the auth subject. A uuid cast there would have
    // failed every insert for a signed-in buyer.
    const statements: string[] = [];
    await routeQuotaExceeded({ authUserId: 'auth-1', sql: stubSql({ hourly: 0, daily: 0, statements }) });
    expect(statements.join(' ')).toContain('auth_user_id');
    expect(statements.join(' ')).not.toContain('account_id =');
  });

  it('fails open when no database is configured, so a free itinerary still works', async () => {
    // `sql: null` models the unconfigured/outage path without touching the
    // environment. Routing is deliberately not a money path.
    const reason = await routeQuotaExceeded({ authUserId: 'auth-1', sql: null });
    expect(reason).toBeNull();
  });
});

describe('recordRouteRequest', () => {
  it('writes one row against the authenticated user', async () => {
    const statements: string[] = [];
    const sql = (async (strings: TemplateStringsArray) => {
      statements.push(strings.join('?'));
      return [];
    }) as QuotaSql;
    await recordRouteRequest({ authUserId: 'auth-1', sql });
    expect(statements.join(' ')).toContain('insert into v2_route_requests');
    expect(statements.join(' ')).toContain('auth_user_id');
  });

  it('is a no-op without a database rather than throwing on the request path', async () => {
    await expect(recordRouteRequest({ authUserId: 'auth-1', sql: null })).resolves.toBeUndefined();
  });
});

describe('pruneRouteRequests', () => {
  it('deletes rows past the longest window', async () => {
    const statements: string[] = [];
    const sql = (async (strings: TemplateStringsArray) => {
      statements.push(strings.join('?'));
      return [];
    }) as QuotaSql;
    await pruneRouteRequests({ sql });
    expect(statements.join(' ')).toContain('delete from v2_route_requests');
    // The table only ever needs to answer "this hour" and "today".
    expect(statements.join(' ')).toContain("48 hours");
  });
});