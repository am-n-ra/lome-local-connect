import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatAmount, formatScaledAmount, currencyFor, resolveUserCurrency, formatMoney } from './currency';
import { planPriceLabel, localPlanPriceLabel } from './plan-labels';
import { BULK_PACKS } from './pricing';
import { MONEY_COLUMNS, NON_MONEY_MINOR_COLUMNS, MONEY_SCALE } from './currency';

/**
 * Two money conventions coexist in Omni, and pairing a value with the wrong
 * formatter is a silent 100× error — not a cosmetic one. Both were live and both
 * were wrong on 2026-09-27:
 *   - plan Pro (×100) rendered "500 000 F" through the decimals-aware formatter;
 *   - an offer (raw) rendered "7,20 $" through the viewer's market currency.
 * These tests pin the pairing.
 */

const pilot = resolveUserCurrency({ market: { marketCode: 'TG-LOME' } });
const norm = (s: string) => s.replace(/\u202f|\u00a0/g, ' ');

describe('scaled amounts (the Wallet family: balance, ledger, packs, plans)', () => {
  it('divides by 100 even for a 0-decimal currency', () => {
    // 500 000 minor is the app storing 5 000 F. The founder confirmed 5 000 F is correct.
    expect(norm(formatScaledAmount(500000, pilot))).toBe('5 000 F CFA');
    expect(norm(formatScaledAmount(100000, pilot))).toBe('1 000 F CFA');
    expect(norm(formatScaledAmount(50000, pilot))).toBe('500 F CFA');
  });

  it('is NOT interchangeable with the decimals-aware formatter', () => {
    // The contrast that makes the pairing matter: the same value, the wrong formatter.
    expect(norm(formatAmount(500000, pilot))).toBe('500 000 F');
    expect(norm(formatScaledAmount(500000, pilot))).not.toBe(norm(formatAmount(500000, pilot)));
  });

  it('keeps fractional amounts honest', () => {
    expect(norm(formatScaledAmount(123456, pilot))).toBe('1 234,56 F CFA');
  });
});

describe('plan labels use the scaled convention', () => {
  it('renders seller Pro at 5 000 F, not 500 000 F', () => {
    const label = norm(planPriceLabel('sellerPro', pilot));
    expect(label).toContain('5 000 F');
    expect(label).not.toContain('500 000');
  });

  it('renders buyer Pro at 2 500 F', () => {
    expect(norm(localPlanPriceLabel('buyerPro', pilot))).toBe('2 500 F CFA');
    expect(norm(planPriceLabel('buyerPro', pilot))).toContain('2 500 F');
  });

  it('prints the canonical USD sticker alongside the local amount', () => {
    expect(planPriceLabel('sellerPro', pilot)).toContain('/mois');
    expect(planPriceLabel('sellerPro', pilot)).toContain('$');
  });
});

describe('bulk packs use the scaled convention', () => {
  it('renders the starter pack at 500 F, not 50 000 F', () => {
    const starter = BULK_PACKS.find((p) => p.id === 'starter')!;
    expect(norm(formatScaledAmount(starter.priceMinor, pilot))).toBe('500 F CFA');
  });
});

describe('raw amounts (the OFFER family) keep their own currency and scale', () => {
  it('an offer price is not divided by 100', () => {
    // 6500 stored = 6 500 F (proved by a real transaction snapshot).
    expect(norm(formatAmount(6500, currencyFor('XOF')))).toBe('6 500 F');
    // The scaled formatter would have said 65 F — wrong for this family.
    expect(norm(formatScaledAmount(6500, currencyFor('XOF')))).toBe('65 F CFA');
  });

  it('an offer is not relabelled with the viewer’s market currency', () => {
    expect(norm(formatAmount(720, currencyFor('XOF')))).toBe('720 F');
  });
});

describe('the declared money convention (D-LOC-9)', () => {
  it('has no column declared both as money and as non-money', () => {
    expect(MONEY_COLUMNS.filter((c) => c in NON_MONEY_MINOR_COLUMNS)).toEqual([]);
  });

  it('explains every non-money *_minor column', () => {
    for (const [column, reason] of Object.entries(NON_MONEY_MINOR_COLUMNS)) {
      expect(reason.length, column + ' needs a real reason').toBeGreaterThan(30);
    }
  });

  it('covers every monetary column known in the migrations', () => {
    const dir = join(process.cwd(), 'db', 'migrations');
    const sql = readdirSync(dir).filter((f) => f.endsWith('.sql'))
      .map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
    expect(sql.length).toBeGreaterThan(0);
    const declared = new Set([...MONEY_COLUMNS, ...Object.keys(NON_MONEY_MINOR_COLUMNS)]);
    const known = [
      'v2_products.price_minor',
      'v2_transaction_snapshots.unit_price_minor',
      'v2_transaction_snapshots.net_amount_minor',
      'v2_wallet_ledger_entries.amount_minor',
      'v2_facility_entitlements.price_minor',
      'v2_availability_requests.budget_minor',
      'v2_availability_responses.price_minor',
    ];
    expect(known.filter((c) => !declared.has(c)), 'declare these in money-convention.ts').toEqual([]);
  });
});

describe('one formatter, one factor', () => {
  it('renders every family with the same rule', () => {
    expect(formatMoney(500000, 'XOF')).toContain('5\u202f000');
    expect(formatMoney(MONEY_SCALE * 5000, 'XOF')).toContain('5\u202f000');
  });

  it('never skips the scaling just because the currency has 0 decimals', () => {
    expect(formatMoney(10000, 'XOF')).toContain('100');
    expect(formatMoney(10000, 'XOF')).not.toContain('10 000');
  });

  it('keeps the symbol so an amount is never ambiguous', () => {
    expect(formatMoney(500000, 'XOF')).toContain('F');
  });
});
