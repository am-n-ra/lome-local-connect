/**
 * BRANCH-1 — retirer une feuille mobile en la tenant par le haut et en la tirant vers le bas.
 *
 * Le CSS portait déjà le point d'ancrage (`transform:translateY(var(--ty,0px))`) mais RIEN
 * ne l'écrivait : la poignée `.handle` était purement décorative. Sur mobile une feuille ne
 * se fermait donc qu'au bouton — impossible de la « repousser » d'un geste, comme partout
 * ailleurs. Ce module est PUR (aucun DOM) : il décide, à partir du déplacement vertical et
 * du temps écoulé, si relâcher FERME la feuille. Le câblage pointer vit dans `use-sheet-drag`.
 */

/** Distance (px) au-delà de laquelle relâcher ferme la feuille. */
export const SHEET_DISMISS_THRESHOLD = 96;
/** Vitesse (px/ms) qui ferme même sous le seuil de distance : un geste vif suffit. */
export const SHEET_DISMISS_VELOCITY = 0.6;
/** Déplacement minimal pour qu'un appui devienne un geste (sinon c'est un tap). */
export const SHEET_DRAG_START = 6;

/**
 * Relâcher ferme-t-il la feuille ? Oui si le geste est allé assez loin, OU assez vite.
 * Un geste vers le haut (dy ≤ 0) ne ferme jamais : on ne « pousse » pas une feuille vers
 * le haut. `elapsedMs ≤ 0` est traité comme instantané (vélocité infinie).
 */
export function shouldDismissSheet(dy: number, elapsedMs: number): boolean {
  if (dy <= 0) return false;
  if (dy >= SHEET_DISMISS_THRESHOLD) return true;
  const velocity = elapsedMs > 0 ? dy / elapsedMs : Infinity;
  return velocity >= SHEET_DISMISS_VELOCITY && dy >= SHEET_DRAG_START;
}

/** La feuille suit le doigt vers le BAS, jamais vers le haut (décalage borné à ≥ 0). */
export function sheetDragOffset(dy: number): number {
  return dy > 0 ? dy : 0;
}

/** Un appui est-il devenu un geste (et non un simple tap) ? */
export function isSheetDrag(dy: number): boolean {
  return Math.abs(dy) >= SHEET_DRAG_START;
}
