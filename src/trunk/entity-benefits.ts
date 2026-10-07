/**
 * Heartwood S1b — « Vos avantages Omni ici » (S-21).
 *
 * La remise est un fait déjà en base (Seed S-19 `discount_percent`). Ici on ne calcule rien de
 * neuf : on lit le meilleur **pourcentage** d'avantage parmi les offres publiées de l'entité.
 * Règle d'honnêteté : **aucun avantage → on se tait** (jamais un faux « −15 % »).
 */
import type { PublicProduct } from './types';

/** Meilleur avantage Omni en pourcentage (>0) parmi les offres ; `null` si aucune remise en %. */
export function bestEntityDiscountPercent(offers: PublicProduct[]): number | null {
  let best: number | null = null;
  for (const offer of offers) {
    const pct = offer.pourcentageReduction;
    if (typeof pct === 'number' && pct > 0 && (best === null || pct > best)) best = pct;
  }
  return best;
}

/** Libellé prêt à l'affichage, ou `null` pour que la surface se taise. */
export function entityBenefitLabel(offers: PublicProduct[]): string | null {
  const pct = bestEntityDiscountPercent(offers);
  return pct === null ? null : `−${pct} % sur ses offres`;
}
