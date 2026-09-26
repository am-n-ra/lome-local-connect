// Root — D-LOC-3 currency-aware budget filter.
//
// The bug this guards: `listPublicFacilities` compared `price_minor <= budget`
// with **no currency condition and no conversion**. With a catalogue that mixes
// XOF and USD rows, a "2 500 F" budget was silently compared to a dollar price
// (true by accident today, false the moment a real USD price appears).
//
// These drive the shipped read path through the stubbed `sql`, which records the
// exact SQL text — the invariant is asserted on the statement that would run.
import { describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from './trunk-repository';

type SqlStub = ReturnType<typeof neon>;

function stubSql(): { sql: SqlStub; queries: string[] } {
  const queries: string[] = [];
  const rows: Record<string, unknown>[] = [];
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push(strings.raw.join(' | '));
    void values;
    return Promise.resolve(rows);
  }) as SqlStub;
  return { sql, queries };
}

describe('budget filter is currency-aware (D-LOC-3)', () => {
  it('compares currencies instead of ignoring them', async () => {
    const { sql, queries } = stubSql();
    const repository = createTrunkRepository(sql);
    await repository.listPublicFacilities(undefined, undefined, undefined, {
      budgetMaxMinor: 2500,
      budgetCurrency: 'XOF',
      budgetRatePerUsdMinor: 500,
    });
    const budgetQuery = queries.find((q) => q.includes('bpp')) ?? '';
    // The statement must name the currency — otherwise it is a blind filter.
    expect(budgetQuery).toContain('bpp.currency');
    expect(budgetQuery).toContain('USD');
  });

  it('excludes an unconvertible currency rather than comparing it blindly', async () => {
    const { sql, queries } = stubSql();
    const repository = createTrunkRepository(sql);
    await repository.listPublicFacilities(undefined, undefined, undefined, {
      budgetMaxMinor: 2500,
      budgetCurrency: 'XOF',
    });
    const budgetQuery = queries.find((q) => q.includes('bpp')) ?? '';
    // Only an explicit same-currency branch OR a USD→local conversion branch may pass.
    expect(budgetQuery).toContain("upper(coalesce(bpp.currency, 'XOF')) = ");
  });

  it('omits the filter entirely when no budget is set', async () => {
    const { sql, queries } = stubSql();
    const repository = createTrunkRepository(sql);
    await repository.listPublicFacilities(undefined, undefined, undefined, {});
    expect(queries.some((q) => q.includes('bpp'))).toBe(false);
  });
});
