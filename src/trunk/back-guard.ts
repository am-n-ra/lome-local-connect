/**
 * BRANCH-3 — le geste « retour » du navigateur (swipe gauche sur mobile, bouton retour
 * Android) ne doit pas FERMER Omni quand une surface est ouverte : il ferme la surface du
 * dessus, comme le bouton de fermeture. Deux défenses :
 *   1. `overscroll-behavior` (CSS) empêche le navigateur d'interpréter un swipe comme un
 *      « retour » de page (edge-swipe Chrome Android).
 *   2. Un garde `popstate` : tant qu'une surface est ouverte, une entrée d'historique
 *      sentinelle est empilée ; un retour la consomme → on ferme la surface et on reste
 *      dans Omni, au lieu de quitter l'app.
 *
 * Ce module est PUR (aucun DOM) : il décide seulement OÙ mène un retour, et s'il doit
 * quitter l'app. `backDestination` est la table unique — testable, falsifiable.
 */

export const NAV_ROLES = ['buyer', 'seller', 'admin', 'operator'] as const;

/** Feuille parente d'une feuille : où mène « retour ». `none` = la carte. */
const PARENT_SHEET: Record<string, string> = {
  search: 'none', results: 'none', facility: 'none', entity: 'none', flow: 'none',
  qr: 'none', room: 'none', 'tile-place': 'none',
  bulk: 'facility', compare: 'facility', claim: 'facility', signal: 'facility',
  'seller-reply': 'seller', 'seller-qr': 'seller', products: 'seller',
  stockevent: 'seller', offers: 'seller', company: 'seller', freshness: 'seller',
  verification: 'seller',
  receipt: 'home', 'op-side': 'home',
  auth: 'none', legal: 'none', welcome: 'none',
  menu: 'menu', account: 'menu', admin: 'menu', home: 'menu', wallet: 'menu',
  plans: 'menu', saved: 'menu', favorites: 'menu', notifs: 'menu', recovery: 'menu',
  tour: 'menu', install: 'menu',
};

export interface BackOutcome {
  /** Le retour doit-il quitter Omni (plus rien à fermer) ? */
  exit: boolean;
  /** Feuille après le retour. */
  sheet: string;
  /** Rôle après le retour. */
  role: string;
  /** La sélection de lieu doit-elle être effacée ? */
  clearSelection: boolean;
  /** Une surface reste ouverte après le retour (⇒ re-empiler la sentinelle). */
  stillOpen: boolean;
}

/**
 * Où mène « retour » depuis l'état courant. Ne quitte l'app QUE carte nue, sans sélection,
 * en contexte acheteur : partout ailleurs, le retour ferme d'abord la surface du dessus.
 * Une feuille « racine » (parent = elle-même, ex. le menu) se ferme vers la carte.
 */
export function backDestination(sheet: string, role: string, hasSelection: boolean): BackOutcome {
  const currentRole = (NAV_ROLES as readonly string[]).includes(role) ? role : 'buyer';

  if (sheet !== 'none') {
    const parent = PARENT_SHEET[sheet] ?? 'none';
    const nextSheet = parent === sheet ? 'none' : parent;
    const clearSelection = nextSheet === 'none';
    const stillOpen = nextSheet !== 'none' || currentRole !== 'buyer';
    return { exit: false, sheet: nextSheet, role: currentRole, clearSelection, stillOpen };
  }

  if (hasSelection) return { exit: false, sheet: 'none', role: currentRole, clearSelection: true, stillOpen: currentRole !== 'buyer' };
  if (currentRole !== 'buyer') return { exit: false, sheet: 'none', role: 'buyer', clearSelection: false, stillOpen: false };
  return { exit: true, sheet: 'none', role: 'buyer', clearSelection: false, stillOpen: false };
}

/** Y a-t-il une surface ouverte (donc un retour à intercepter) ? */
export function shouldInterceptBack(sheet: string, role: string, hasSelection: boolean): boolean {
  return sheet !== 'none' || role !== 'buyer' || hasSelection;
}
