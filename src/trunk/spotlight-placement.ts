/**
 * GUIDE-1b — placement de la bulle du spotlight.
 *
 * Défaut mesuré (fondateur 2026-10-15) : à la 3ᵉ étape (le dock), la bulle était placée
 * SOUS l'anneau (`top = ring.bottom + 10`). Or le dock est collé au bas de l'écran : la
 * bulle tombait à `840px` sur un écran de `844px` → **4 px visibles sur 128**. « Terminer »
 * et « Passer » devenaient inaccessibles — le guide « s'arrêtait en route au dock ».
 *
 * Règle : la bulle suit l'élément réel, mais **reste toujours dans la fenêtre**. Si elle ne
 * tient pas sous l'élément, elle passe AU-DESSUS ; si elle ne tient ni dessous ni dessus
 * (élément plein écran), elle est ancrée en bas de la fenêtre. Jamais de position figée :
 * le calcul dépend de la mesure réelle (`getBoundingClientRect`), pas d'un numéro d'étape.
 */

export interface PlacementInput {
  /** Rectangle de l'anneau, en coordonnées fenêtre. */
  ring: { top: number; left: number; width: number; height: number };
  /** Hauteur estimée de la bulle (px). */
  cardHeight: number;
  /** Dimensions de la fenêtre (px). */
  viewport: { width: number; height: number };
  /** Marge de sécurité au bord (px). */
  gap?: number;
  /** Marge minimale par rapport aux bords (px). */
  margin?: number;
}

export interface Placement {
  top: number;
  left: number;
  /** `below` | `above` | `anchor-bottom` — d'où vient la position (diagnostic/tests). */
  placement: 'below' | 'above' | 'anchor-bottom';
}

/**
 * Calcule la position de la bulle : sous l'anneau si possible, sinon au-dessus, sinon
 * ancrée en bas. Toujours bornée à la fenêtre (jamais hors écran).
 */
export function placeSpotlightCard({ ring, cardHeight, viewport, gap = 10, margin = 12 }: PlacementInput): Placement {
  const maxTop = Math.max(margin, viewport.height - cardHeight - margin);
  const belowTop = ring.top + ring.height + gap;
  const aboveTop = ring.top - gap - cardHeight;

  let top: number;
  let placement: Placement['placement'];

  if (belowTop <= maxTop) {
    top = belowTop;
    placement = 'below';
  } else if (aboveTop >= margin) {
    top = aboveTop;
    placement = 'above';
  } else {
    top = maxTop;
    placement = 'anchor-bottom';
  }

  // Jamais au-dessus de la marge haute, jamais au-delà de la marge basse.
  top = Math.min(Math.max(top, margin), maxTop);

  const left = Math.min(Math.max(ring.left, margin), Math.max(margin, viewport.width - margin));

  return { top, left, placement };
}
