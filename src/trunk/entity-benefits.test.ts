import { describe, expect, it } from 'vitest';
import { bestEntityDiscountPercent, entityBenefitLabel } from './entity-benefits';
import type { PublicProduct } from './types';

/**
 * Heartwood S1b (S-21) — « Vos avantages Omni ici » lit la remise RÉELLE (Seed S-19) et
 * **se tait** s'il n'y en a pas. Un faux « −15 % » serait un mensonge de plus que la démo
 * `entity-from-qr` ne doit pas imposer au fond.
 */
const offer = (pct: number): PublicProduct => ({
  id: `p-${pct}`,
  name: `Offre ${pct}`,
  description: null,
  unit: 'pièce',
  currency: 'XOF',
  prixOriginal: 1000,
  prixReduit: 1000 - pct * 10,
  pourcentageReduction: pct,
  stockLoueOmni: 1,
} as unknown as PublicProduct);

describe('Heartwood S1b — avantage Omni de l’entité', () => {
  it('retient le MEILLEUR pourcentage parmi les offres publiées', () => {
    expect(bestEntityDiscountPercent([offer(10), offer(15), offer(5)])).toBe(15);
    expect(entityBenefitLabel([offer(10), offer(15), offer(5)])).toBe('−15 % sur ses offres');
  });

  it('se TAIT quand aucune offre ne porte d’avantage (jamais un faux −X %)', () => {
    expect(bestEntityDiscountPercent([])).toBeNull();
    expect(bestEntityDiscountPercent([offer(0)])).toBeNull();
    expect(entityBenefitLabel([])).toBeNull();
    expect(entityBenefitLabel([offer(0), offer(0)])).toBeNull();
  });
});
