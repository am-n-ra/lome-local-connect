import { describe, expect, it } from 'vitest';
import {
  BULK_PACKS, OMNI_BASE_CURRENCY, OMNI_DEFAULT_LOCAL_CURRENCY, OMNI_PLAN_PRICES_USD_MINOR,
  bulkPackById, convertUsdMinorToLocal, planBaseUsdMinor,
} from './pricing';

describe('pricing canonical USD base (founder correction 2026-09-13)', () => {
  it('keeps USD as the canonical base currency', () => {
    expect(OMNI_BASE_CURRENCY).toBe('USD');
    expect(OMNI_DEFAULT_LOCAL_CURRENCY).toBe('XOF');
  });

  it('prices Seller Pro at 10 USD and Buyer Pro at 5 USD (minor = cents)', () => {
    expect(OMNI_PLAN_PRICES_USD_MINOR.sellerPro).toBe(1000); // $10.00
    expect(OMNI_PLAN_PRICES_USD_MINOR.buyerPro).toBe(500); // $5.00
    expect(planBaseUsdMinor('sellerPro')).toBe(1000);
    expect(planBaseUsdMinor('buyerPro')).toBe(500);
  });

  it('converts USD base to the local billing currency (1 USD = 500 XOF pilot)', () => {
    // $10 Seller Pro → 5 000 F → 500 000 minor
    expect(convertUsdMinorToLocal(OMNI_PLAN_PRICES_USD_MINOR.sellerPro, 'XOF')).toBe(500000);
    // $5 Buyer Pro → 2 500 F → 250 000 minor
    expect(convertUsdMinorToLocal(OMNI_PLAN_PRICES_USD_MINOR.buyerPro, 'XOF')).toBe(250000);
  });

  it('leaves amounts unchanged for USD or unknown currencies', () => {
    expect(convertUsdMinorToLocal(1000, 'USD')).toBe(1000);
    expect(convertUsdMinorToLocal(500, 'EUR')).toBe(500);
    expect(convertUsdMinorToLocal(500, '')).toBe(500);
  });

  it('returns 0 for unknown plan kinds', () => {
    expect(planBaseUsdMinor('sellerPro' as 'sellerPro')).toBeGreaterThan(0);
    expect(planBaseUsdMinor('bogus' as 'buyerPro')).toBe(0);
  });
});

describe('bulk credit packs (NW-13i, D-J hypothesis)', () => {
  it('exposes a small positive catalog in XOF, prices above the FedaPay minimum', () => {
    expect(BULK_PACKS.length).toBeGreaterThan(0);
    const ids = new Set(BULK_PACKS.map((pack) => pack.id));
    expect(ids.size).toBe(BULK_PACKS.length);
    for (const pack of BULK_PACKS) {
      expect(pack.credits).toBeGreaterThan(0);
      expect(pack.priceMinor).toBeGreaterThanOrEqual(10000); // ≥ 100 F — FedaPay recharge minimum
      expect(pack.billingCurrency).toBe('XOF');
    }
  });

  it('resolves a known pack by id and rejects unknown ones', () => {
    expect(bulkPackById(BULK_PACKS[0].id)).toBeDefined();
    expect(bulkPackById('bogus')).toBeUndefined();
  });
});