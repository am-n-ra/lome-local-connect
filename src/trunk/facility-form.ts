import type { FacilityType } from './types';

/**
 * S4 (Heartwood) — libellé de la FORME du lieu, repris du vocabulaire de la maquette
 * acceptée (`Fixe · sur place` / `Mobile · se déplace` / `Immatérielle · origine`).
 *
 * Une forme non déclarée (`null`) ne produit **aucun** libellé : la surface se tait plutôt
 * que de prétendre une forme (S-05, fond de carte). Le rayon n'est affiché que s'il existe ;
 * sinon on ne l'invente pas.
 */
export function facilityFormLabel(
  input: { facilityType?: FacilityType | null; rayonKm?: number | null },
): string {
  switch (input.facilityType) {
    case 'fixe':
      return 'Fixe · sur place';
    case 'mobile':
      return typeof input.rayonKm === 'number' && input.rayonKm > 0
        ? `Mobile · se déplace · rayon ${input.rayonKm} km`
        : 'Mobile · se déplace';
    case 'digital':
      return 'Immatérielle · origine';
    default:
      return '';
  }
}
