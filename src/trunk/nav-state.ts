/**
 * BRANCH-2 — Omni se rouvre là où l'utilisateur l'a laissé.
 *
 * Un utilisateur ferme Omni (PWA ou onglet) au milieu d'une action : au retour, il doit
 * retrouver le MÊME endroit — feuille, rôle, lieu ouvert, visite de tournée — pas la carte
 * nue, pas l'écran d'accueil.
 *
 * On restaure une **surface** (feuille + rôle + id de lieu), jamais une donnée volatile qui
 * doit se recharger (les détails du lieu sont re-fetchés).
 *
 * `localStorage` (et non `sessionStorage`) : le cas visé est « fermer Omni puis le rouvrir »
 * — un onglet/PWA fermé vide `sessionStorage`, donc la mémoire doit survivre à la fermeture.
 * Aucune donnée sensible ici (nom de feuille + id public de lieu) ; l'autorisation est
 * re-vérifiée au démarrage (une surface dont le rôle n'est plus éligible retombe sur Acheteur).
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
  /**
   * GR-2 — la requête de la feuille `results`, pour la REJOUER au retour.
   * Sans elle, la feuille se rouvrirait vide : un « aucun résultat » qui n'en est pas un
   * (la recherche vit en mémoire, elle ne survit pas au rechargement).
   */
  searchQuery?: string;
  /** Niveau de la recherche persistée (S-11) : `offer` ou `entity`. */
  searchLevel?: 'offer' | 'entity';
  /**
   * GR-2 — la transaction ouverte dans la **Room** (S-27). Sans elle, recharger au milieu
   * d'une transaction ramenait sur la carte nue : l'utilisateur perdait le fil de son achat.
   */
  roomTransactionId?: string;
}

/** Feuilles qu'on accepte de restaurer sans logique serveur complexe. */
const RESTORABLE_SHEETS = new Set([
  'none', 'results', 'facility', 'home', 'menu', 'seller', 'wallet', 'plans',
  'saved', 'favorites', 'notifs', 'account', 'tour', 'op-side', 'bulk', 'compare',
  'room',
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
  const query = safeQuery(state.searchQuery);
  const sheet = sanitizeNavSheet(state.sheet);
  const roomTransactionId = sheet === 'room' ? safeId(state.roomTransactionId) : null;
  const base = {
    role: ROLES.has(state.role) ? state.role : 'buyer',
    sheet,
    selectedId: safeId(state.selectedId),
    selVisitId: safeId(state.selVisitId),
    // La transaction ne voyage qu'avec la Room (même règle que la requête avec `results`).
    ...(roomTransactionId ? { roomTransactionId } : {}),
  };
  // La requête (et son niveau) ne voyagent QUE s'il y en a une — la forme historique de
  // l'état reste inchangée pour les surfaces sans recherche.
  return query
    ? JSON.stringify({ ...base, searchQuery: query, searchLevel: state.searchLevel === 'entity' ? 'entity' : 'offer' })
    : JSON.stringify(base);
}

/** Une requête persistée est du texte court et non vide (jamais une valeur arbitraire). */
function safeQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, 200);
  return trimmed === '' ? null : trimmed;
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
  const searchQuery = safeQuery(record.searchQuery) ?? undefined;
  const roomTransactionId = safeId(record.roomTransactionId);
  // Une feuille qui dépend d'un lieu sans lieu, ou l'inverse, est incohérente → on ne
  // restaure que ce qui a un sens (évite une fiche vide).
  if (sheet === 'facility' && !selectedId) return null;
  if (sheet === 'none' && role === 'buyer' && !selectedId) return null;
  // GR-2 — la feuille `results` SANS requête se rouvrirait vide (faux « aucun résultat »).
  // Mieux vaut ne rien restaurer : l'app repart sur la carte, ce qui est honnête.
  if (sheet === 'results' && !searchQuery) return null;
  // GR-2 — la Room SANS transaction se rouvrirait sur rien : on ne la restaure pas.
  if (sheet === 'room' && !roomTransactionId) return null;
  return {
    role,
    sheet,
    selectedId,
    selVisitId,
    // Le niveau ne porte que s'il y a une requête (miroir exact de la sérialisation).
    ...(searchQuery
      ? { searchQuery, searchLevel: record.searchLevel === 'entity' ? ('entity' as const) : ('offer' as const) }
      : {}),
    ...(roomTransactionId ? { roomTransactionId } : {}),
  };
}
