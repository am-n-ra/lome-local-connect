/**
 * BRANCH-2 — Omni se rouvre là où l'utilisateur l'a laissé.
 *
 * Un utilisateur ferme Omni (PWA ou onglet) au milieu d'une action : au retour, il doit
 * retrouver le MÊME endroit — feuille, rôle, lieu ouvert, visite de tournée — pas la carte
 * nue, pas l'écran d'accueil.
 *
 * On restaure une **surface** (feuille + rôle + id de lieu), jamais une donnée volatile qui
 * doit se recharger (les détails du lieu sont re-fetchés). `sessionStorage` : la mémoire vit
 * le temps de l'onglet/PWA et est oubliée à la fermeture de session — cohérent avec le
 * panier par vendeur.
 */

export const NAV_STATE_STORAGE_KEY = 'omni-nav-state';

export interface NavSurfaceState {
  role: string;
  /** Feuille active au moment de quitter (`none` = carte). */
  sheet: string;
  /** Lieu actuellement ouvert (fiche facilité), si applicable. */
  selectedId: string | null;
  /** Visite de tournée ouverte (opérateur), si applicable. */
  selVisitId: string | null;
}

/** Feuilles qu'on accepte de restaurer sans logique serveur complexe. */
const RESTORABLE_SHEETS = new Set([
  'none', 'results', 'facility', 'home', 'menu', 'seller', 'wallet', 'plans',
  'saved', 'favorites', 'notifs', 'account', 'tour', 'op-side', 'bulk', 'compare',
]);

/** Rôles valides. */
const ROLES = new Set(['buyer', 'seller', 'admin', 'operator']);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Un id de lieu n'est restauré que s'il ressemble à un identifiant (jamais d'injection). */
function safeId(value: unknown): string | null {
  return typeof value === 'string' && UUID.test(value) ? value : null;
}

/** Ramène une feuille inconnue à `none` (jamais de feuille restaurée qui n'existe pas). */
export function sanitizeNavSheet(sheet: unknown): string {
  return typeof sheet === 'string' && RESTORABLE_SHEETS.has(sheet) ? sheet : 'none';
}

/** Sérialise l'état de surface pour `sessionStorage`. */
export function serializeNavState(state: NavSurfaceState): string {
  return JSON.stringify({
    role: ROLES.has(state.role) ? state.role : 'buyer',
    sheet: sanitizeNavSheet(state.sheet),
    selectedId: safeId(state.selectedId),
    selVisitId: safeId(state.selVisitId),
  });
}

/**
 * Relit une surface persistée. Renvoie `null` si rien d'exploitable — dans ce cas l'app
 * démarre normalement (aucune restauration partielle trompeuse).
 */
export function parseNavState(raw: string | null | undefined): NavSurfaceState | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return null; }
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const role = typeof record.role === 'string' && ROLES.has(record.role) ? record.role : 'buyer';
  const sheet = sanitizeNavSheet(record.sheet);
  const selectedId = safeId(record.selectedId);
  const selVisitId = safeId(record.selVisitId);
  // Une feuille qui dépend d'un lieu sans lieu, ou l'inverse, est incohérente → on ne
  // restaure que ce qui a un sens (évite une fiche vide).
  if (sheet === 'facility' && !selectedId) return null;
  if (sheet === 'none' && role === 'buyer' && !selectedId) return null;
  return { role, sheet, selectedId, selVisitId };
}
