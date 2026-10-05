import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * BUYER-PRO-STATUS — `getBuyerProStatus` used `cross join lateral (select * from
 * entitlement)`. The `entitlement` CTE is empty for any buyer who never
 * subscribed to Pro, and a cross join against an empty set collapses the whole
 * row to zero → the repository returned null → HTTP 403 ACCOUNT_UNAVAILABLE for
 * a perfectly provisioned buyer (everyone, on 2026-10-04, founder included).
 *
 * The repository tests use a stubbed `sql` that never executes, so only a real
 * database catches a row-collapse. This guard is the static half: the optional
 * CTEs must be joined with `left join lateral ... on true`, never `cross join`.
 * (The real-SQL half lives in `scripts/prove-root-read-paths.mjs`.)
 */
const source = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');

describe('BUYER-PRO-STATUS — les CTE optionnelles se joignent en LEFT', () => {
  it('getBuyerProStatus n’utilise aucun cross join lateral', () => {
    const start = source.indexOf('async getBuyerProStatus');
    const end = source.indexOf('async activateBuyerPro', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const block = source.slice(start, end);
    expect(block).not.toContain('cross join lateral');
    expect(block).toContain('left join lateral (select * from entitlement) e on true');
  });

  it('aucun cross join lateral ne subsiste dans le dépôt serveur', () => {
    expect(source).not.toContain('cross join lateral');
  });
});
