/**
 * SEARCH-02 — disponibilité : fraîcheur DÉRIVÉE, jamais stockée (décision D-03).
 *
 * La donnée existe déjà : `v2_products.availability_expires_at` (migration 038),
 * la fenêtre 4 h frais / 24 h expiré, et l'auto-transition serveur vers
 * `a_valider` à l'échéance (`v2_expire_stale_availability`). On ne crée AUCUNE
 * colonne : on rend lisible l'état que le serveur applique déjà.
 *
 * Seuils (D-03, réglés par établissement à l'écriture — 4 h par défaut) :
 *   - `expired` : l'échéance est passée, ou l'offre n'est pas `en_stock`/`verifie`.
 *   - `stale`   : l'échéance tombe dans moins de 4 h — encore bonne, mais à re-confirmer.
 *   - `fresh`   : plus de 4 h devant, ou aucune fenêtre posée (pas de mensonge).
 */

export type OfferFreshnessLevel = 'fresh' | 'stale' | 'expired';

/** D-03 — au-delà de cette marge avant l'échéance, la dispo est dite vieillissante. */
export const FRESHNESS_STALE_WINDOW_MS = 4 * 60 * 60 * 1000;

export interface OfferFreshness {
  level: OfferFreshnessLevel;
  /** Échéance en ms epoch, ou null quand aucune fenêtre n'est posée. */
  expiresAtMs: number | null;
  /** État de disponibilité porteur, ou null/absent quand la surface n'a aucun fait. */
  state: string | null;
}

const ACTIVE_STATES = new Set(['en_stock', 'verifie']);

export function computeOfferFreshness(
  availabilityState: string | null | undefined,
  availabilityExpiresAt: string | number | Date | null | undefined,
  now: number,
): OfferFreshness {
  const expiresAtMs =
    availabilityExpiresAt === null || availabilityExpiresAt === undefined
      ? null
      : new Date(availabilityExpiresAt).getTime();
  const hasExpiry = expiresAtMs !== null && Number.isFinite(expiresAtMs);
  // `undefined` state = the surface has no availability fact: unknown, never a claim.
  const hasState = availabilityState !== null && availabilityState !== undefined;
  const state = hasState ? String(availabilityState) : null;
  const inactive = hasState && !ACTIVE_STATES.has(availabilityState as string);
  if (inactive || (hasExpiry && now >= (expiresAtMs as number))) {
    return { level: 'expired', expiresAtMs: hasExpiry ? expiresAtMs : null, state };
  }
  if (hasExpiry && now >= (expiresAtMs as number) - FRESHNESS_STALE_WINDOW_MS) {
    return { level: 'stale', expiresAtMs, state };
  }
  return { level: 'fresh', expiresAtMs: hasExpiry ? expiresAtMs : null, state };
}

/**
 * Le niveau le plus pessimiste d'une liste — la surface parle d'un ensemble,
 * elle doit montrer le maillon faible, jamais le meilleur cas. À niveau égal,
 * une entrée qui porte une fenêtre réelle l'emporte sur une inconnue (pour ne
 * pas masquer une fenêtre par une absence de fait).
 */
export function worstFreshness(
  offers: Array<{ availabilityState?: string | null; availabilityExpiresAt?: string | null }>,
  now: number,
): OfferFreshness {
  const rank: Record<OfferFreshnessLevel, number> = { fresh: 0, stale: 1, expired: 2 };
  let worst: OfferFreshness | null = null;
  for (const offer of offers) {
    const current = computeOfferFreshness(offer.availabilityState, offer.availabilityExpiresAt, now);
    if (!worst) {
      worst = current;
    } else if (
      rank[current.level] > rank[worst.level] ||
      (rank[current.level] === rank[worst.level] && current.expiresAtMs !== null && worst.expiresAtMs === null)
    ) {
      worst = current;
    }
    if (worst.level === 'expired') break;
  }
  return worst ?? { level: 'fresh', expiresAtMs: null, state: null };
}

function humanDuration(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} j`;
}

/**
 * Phrase de la `freshbar` (maquette results L537-539). Dit ce qui est VRAI :
 * quand la dispo est vivante et quand elle lapses, ou qu'elle n'est simplement
 * pas confirmée (a_valider/bientot) — jamais un faux « vérifiée », jamais une
 * fausse alerte « expirée » sur une offre qui n'a jamais été déclarée vivante.
 */
export function freshnessLabel(freshness: OfferFreshness, now: number): string {
  const { level, expiresAtMs, state } = freshness;
  if (level === 'expired') {
    if (state === null) return 'Disponibilité non confirmée';
    if (state === 'a_valider') return 'Disponibilité non confirmée : le vendeur ne l’a pas déclarée vivante';
    if (state === 'bientot') return 'Disponibilité à venir : pas encore ouverte';
    return 'Disponibilité expirée : à re-confirmer par le vendeur';
  }
  if (expiresAtMs === null) return 'Disponibilité déclarée · sans fenêtre de fraîcheur';
  if (level === 'stale') {
    return `Disponibilité vieillissante (expire dans ${humanDuration(expiresAtMs - now)}) : encore bonne`;
  }
  return `Disponibilité vivante · expire dans ${humanDuration(expiresAtMs - now)}`;
}
