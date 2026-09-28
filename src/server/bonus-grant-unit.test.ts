// Guards the money-unit class UM-6 closed on 2026-09-28 (DEC-V2-09, bonus = $20).
//
// Two bonus_grant ledger rows reached production with amount_minor = 2000 — USD cents
// written raw into XOF (correct: 1 000 000 XOF-minor via convertUsdMinorToLocal). They were
// compensated by explicit reversals, not rewritten. Behavioral tests pin the bound value per
// path (unlockFacilityBonus, submitTransactionRating). THIS guard pins the future: any
// bonus_grant ledger write with a bare numeric literal — in server code OR seed scripts —
// fails here, even if no behavioral test exercises that path yet.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const REPO = readFileSync(new URL('./trunk-repository.ts', import.meta.url), 'utf8');
const SEED = readFileSync(new URL('../../scripts/seed-demo-lome.mjs', import.meta.url), 'utf8');
const PRICING = readFileSync(new URL('../domain/pricing.ts', import.meta.url), 'utf8');

function boundAmountBindings(text: string): string[] {
  const re = /'bonus_grant',\s*\$\{([A-Za-z_$][\w$]*)\}/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  return out;
}

describe('bonus_grant ledger writes use the derived unit (UM-6, DEC-V2-09)', () => {
  it.each([
    ['server', REPO, 'sellerBonusLocalMinor'],
    ['seed', SEED, 'SELLER_BONUS_LOCAL_MINOR'],
  ])('%s binds the derived bonus amount at every bonus_grant write site', (_where, text, ident) => {
    const sites = boundAmountBindings(text as string);
    // Never vacuous: both paths exist today (auto-grant on rating + manual unlock + seed).
    expect(sites.length, 'write sites must exist — a guard that finds nothing proves nothing').toBeGreaterThanOrEqual(2);
    for (const b of sites) expect(b).toBe(ident as string);
  });

  it.each([
    ['server', REPO],
    ['seed', SEED],
  ])('%s has no bare numeric literal in a bonus_grant amount position', (_where, text) => {
    expect(text as string).not.toMatch(/'bonus_grant',\s*\d/);
  });

  it.each([
    ['server', REPO],
    ['seed', SEED],
  ])('%s derives from the single pricing constant, never a local literal', (_where, text) => {
    const t = text as string;
    expect(t).toContain('convertUsdMinorToLocal(SELLER_BONUS_USD_MINOR,');
    expect(t).not.toMatch(/const SELLER_BONUS_USD_MINOR\s*=\s*\d/);
  });

  it('the single constant is $20 by founder decision (DEC-V2-09) — changing it is a money decision', () => {
    expect(PRICING).toMatch(/export const SELLER_BONUS_USD_MINOR\s*=\s*2000/);
    expect(REPO).toContain('SELLER_BONUS_USD_MINOR }');
    expect(SEED).toContain('SELLER_BONUS_USD_MINOR, convertUsdMinorToLocal }');
  });
});
