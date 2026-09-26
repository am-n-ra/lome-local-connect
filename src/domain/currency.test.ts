import { describe, expect, it } from 'vitest';
import { resolveUserCurrency, formatAmount, normaliseMinor } from './currency';

describe('currency resolution (D-LOC-1…5)', () => {
  it('resolves the Lomé market row to XOF with its symbol and rate', () => {
    const resolved = resolveUserCurrency({ market: { marketCode: 'TG-LOME' } });
    expect(resolved.currency).toBe('XOF');
    expect(resolved.symbol).toBe('F');
    expect(resolved.decimals).toBe(0);
    expect(resolved.ratePerUsdMinor).toBe(500);
    expect(resolved.source).toBe('market');
  });

  it('resolves currency from the user locale, not a constant (D-LOC-1)', () => {
    // This is the amendment: "la devise dépend de localization de user".
    const ghana = resolveUserCurrency({ locale: 'en-GH' });
    expect(ghana.currency).toBe('GHS');
    expect(ghana.symbol).not.toBe('F');
    const usa = resolveUserCurrency({ locale: 'en-US' });
    expect(usa.currency).toBe('USD');
    const togo = resolveUserCurrency({ locale: 'fr-TG' });
    expect(togo.currency).toBe('XOF');
  });

  it('falls back to the pilot currency only when localisation is unknown (D-LOC-5)', () => {
    const resolved = resolveUserCurrency({ locale: 'de-DE' });
    expect(resolved.currency).toBe('XOF');
    expect(resolved.source).toBe('fallback');
  });

  it('lets a market row override its own display facts', () => {
    const resolved = resolveUserCurrency({ market: { marketCode: 'TG-LOME', currencySymbol: 'CFA', currencyDecimals: 0 } });
    expect(resolved.symbol).toBe('CFA');
  });
});

describe('amount formatting (D-LOC-4 — always show the currency)', () => {
  it('does not divide a 0-decimal currency by 100', () => {
    // Regression: a 255 F offer rendered "2.55 XOF" because money() always /100.
    const xof = resolveUserCurrency({ market: { marketCode: 'TG-LOME' } });
    expect(formatAmount(255, xof)).toBe('255 F');
    // fr-FR groups with a narrow no-break space (U+202F) — that is correct, so
    // normalise the separator rather than assert an ASCII space.
    expect(formatAmount(2500, xof).replace(/\u202f|\u00a0/g, ' ')).toBe('2 500 F');
  });

  it('keeps two decimals for a 2-decimal currency', () => {
    const usd = resolveUserCurrency({ locale: 'en-US' });
    expect(formatAmount(1250, usd)).toContain('12,50');
  });

  it('always carries the symbol', () => {
    const ghs = resolveUserCurrency({ locale: 'en-GH' });
    expect(formatAmount(1000, ghs)).toContain(ghs.symbol);
  });
});

describe('currency normalisation (D-LOC-3)', () => {
  it('returns the amount unchanged for the same currency', () => {
    expect(normaliseMinor(2500, 'XOF', 'XOF', 500)).toBe(2500);
  });

  it('converts a USD-priced offer into the local currency', () => {
    expect(normaliseMinor(500, 'USD', 'XOF', 500)).toBe(250000);
  });

  it('returns null when the conversion is unknown, never a silent wrong answer', () => {
    // A blind comparison is the bug this exists to prevent.
    expect(normaliseMinor(1000, 'GHS', 'XOF', 500)).toBeNull();
    expect(normaliseMinor(1000, 'USD', 'XOF', null)).toBeNull();
  });
});
