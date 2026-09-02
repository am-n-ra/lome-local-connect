import { describe, it, expect } from 'vitest';
import { BUYER_PRO_PLANS, formatPlanPrice } from './BuyerProPlansModal';

describe('BuyerProPlansModal and Plan data', () => {
  it('defines 3 distinct buyer pro tiers according to master plan', () => {
    expect(BUYER_PRO_PLANS).toHaveLength(3);
    const ids = BUYER_PRO_PLANS.map((p) => p.id);
    expect(ids).toEqual(['pass-24h', 'mensuel', 'illimite']);
  });

  it('formats currency in XOF appropriately', () => {
    expect(formatPlanPrice(3000)).toContain('3');
    expect(formatPlanPrice(15000)).toContain('15');
    expect(formatPlanPrice(50000)).toContain('50');
  });

  it('marks popular plan correctly', () => {
    const monthly = BUYER_PRO_PLANS.find((p) => p.id === 'mensuel');
    expect(monthly?.tag).toBe('Recommandé');
  });
});
