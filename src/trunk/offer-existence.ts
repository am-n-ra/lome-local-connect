/**
 * S-06 — échelle d'existence (0→4) and S-32 — intégrité / réputation de l'OFFRE.
 *
 * Both are DERIVED, never stored. A stored `existence_level` or `integrity_state` column can
 * age or desynchronise; a derivation cannot. These are pure functions so the rules are
 * provable without a database, and the SQL only supplies the raw facts.
 *
 * S-06 invariant (Seed): Discoverable ≠ Queryable ≠ Available ≠ Transactable — four distinct
 * capabilities. Level 4 requires *reservable* stock, not merely "published": an offer that is
 * published but has nothing left to reserve is NOT transactable, and saying so would be a lie.
 */

import type { ProductMediaItem } from './types';

export type ExistenceLevel = 0 | 1 | 2 | 3 | 4;

export interface OfferExistence {
  level: ExistenceLevel;
  label: string;
  hint: string;
}

export type OfferIntegrityState = 'ok' | 'partielle' | 'insuffisante';
export type OfferIntegrityCheck = 'visuel' | 'prix' | 'description' | 'doublon';

export interface OfferIntegrity {
  state: OfferIntegrityState;
  passed: number;
  total: number;
  failed: OfferIntegrityCheck[];
}

export interface OfferReputation {
  count: number;
  score: number | null;
}

const LEVELS: readonly { label: string; hint: string }[] = [
  { label: 'Présente', hint: 'sur la carte, pas encore gérée' },
  { label: 'Revendiquée', hint: 'une entité en a pris la responsabilité' },
  { label: 'Offre publiée', hint: 'stock déclaré, non confirmé' },
  { label: 'Disponibilité vivante', hint: 'confirmée récemment' },
  { label: 'Transactable', hint: 'transaction Omni possible maintenant' },
];

/** The 4 checks S-32 names, in the order the UI lists them. */
export const INTEGRITY_CHECKS: readonly OfferIntegrityCheck[] = ['visuel', 'prix', 'description', 'doublon'];

export interface ExistenceInput {
  publicationState: string | null;
  /** The place has an entity → the offer is at least "Revendiquée". */
  hasEntity: boolean;
  availabilityState: string | null;
  /** ISO string, Date, or null. Null means "no expiry recorded" (never expires by freshness). */
  availabilityExpiresAt: string | Date | null;
  quantityAllocated: number;
  quantityReserved: number;
  /** Injectable for tests; defaults to now. */
  now?: Date;
}

function isExpired(value: string | Date | null, now: Date): boolean {
  if (value === null || value === undefined) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= now.getTime();
}

/**
 * S-06 — the offer's existence level.
 *
 * 0 Présente            : on the map, no entity behind the place yet
 * 1 Revendiquée         : an entity owns the place, offer not published
 * 2 Offre publiée       : published (stock declared, unconfirmed)
 * 3 Disponibilité vivante: published + live availability, not expired
 * 4 Transactable        : level 3 + reservable stock > 0
 */
export function computeExistenceLevel(input: ExistenceInput): ExistenceLevel {
  const published = input.publicationState === 'published';
  if (!published) return input.hasEntity ? 1 : 0;

  const liveAvailability =
    (input.availabilityState === 'en_stock' || input.availabilityState === 'verifie') &&
    !isExpired(input.availabilityExpiresAt, input.now ?? new Date());
  if (!liveAvailability) return 2;

  // FF-8: availability net of reservations. Never negative.
  const reservable = Math.max(0, input.quantityAllocated - input.quantityReserved);
  return reservable > 0 ? 4 : 3;
}

export function existenceFor(input: ExistenceInput): OfferExistence {
  const level = computeExistenceLevel(input);
  return { level, label: LEVELS[level].label, hint: LEVELS[level].hint };
}

export interface IntegrityInput {
  media: unknown;
  priceMinor: number;
  description: string | null;
  /** True when another PUBLISHED offer of the SAME entity shares this normalised name. */
  duplicate: boolean;
}

function hasMedia(media: unknown): boolean {
  if (media === null || media === undefined) return false;
  if (Array.isArray(media)) return media.length > 0;
  if (typeof media === 'string') {
    const trimmed = media.trim();
    return trimmed !== '' && trimmed !== '[]' && trimmed !== 'null';
  }
  return false;
}

/**
 * S-20 / E-03 — read the offer's visual references out of the raw `media` jsonb.
 * Tolerant of the legacy `[]` / `null` shapes so an old row never throws. Returns `[]`
 * when nothing valid is declared — which is exactly what the publication refusal tests.
 */
export function normalizeProductMedia(raw: unknown): ProductMediaItem[] {
  let parsed: unknown = raw;
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (trimmed === '' || trimmed === 'null') return [];
    try { parsed = JSON.parse(trimmed); } catch { return []; }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const url = typeof record.url === 'string' ? record.url.trim() : '';
      if (!url || !/^https:\/\//i.test(url) || url.length > 500) return null;
      return { url, kind: 'image' as const };
    })
    .filter((item): item is ProductMediaItem => item !== null)
    .slice(0, 4);
}

/**
 * S-32 — automatic offer integrity. Four measurable checks, and the FAILED ones are named:
 * a ✗ without a reason is unusable and unbelievable.
 *
 * `prix` is `price_minor > 0`, not `>= 0` (which the schema CHECK already guarantees, so it
 * would be vacuous). Trade-off: a genuinely free offer would be flagged — documented in the
 * contract, revisitable when `price_kind='gratuit'` becomes a real case.
 */
export function computeIntegrity(input: IntegrityInput): OfferIntegrity {
  const results: Record<OfferIntegrityCheck, boolean> = {
    visuel: hasMedia(input.media),
    prix: input.priceMinor > 0,
    description: (input.description ?? '').trim().length >= 10,
    doublon: !input.duplicate,
  };
  const failed = INTEGRITY_CHECKS.filter((check) => !results[check]);
  const passed = INTEGRITY_CHECKS.length - failed.length;
  const state: OfferIntegrityState = failed.length === 0 ? 'ok' : passed >= 2 ? 'partielle' : 'insuffisante';
  return { state, passed, total: INTEGRITY_CHECKS.length, failed };
}

/**
 * S-32 — reputation of THIS offer, from the transactions that traced it (S-26).
 * `score` is null when there is no rating — the UI shows "muted", never "0 ★" (which would
 * read as a bad score). Never attributed to the entity (S-30: trust is the entity's).
 */
export function computeReputation(count: number, scoreSum: number | null): OfferReputation {
  if (count <= 0 || scoreSum === null) return { count: 0, score: null };
  return { count, score: Math.round((scoreSum / count) * 10) / 10 };
}

/** The place shows the max level of its published offers (a projection, not a second rule). */
export function facilityExistenceLevel(levels: readonly ExistenceLevel[], hasEntity: boolean): ExistenceLevel {
  if (levels.length === 0) return hasEntity ? 1 : 0;
  return Math.max(...levels) as ExistenceLevel;
}
