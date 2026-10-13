/**
 * BRANCHES-IDENTITY (2026-10-07) — deux règles porteuses, pures donc testables.
 *
 * 1. **Usurpation à la création.** Créer une facilité ne doit pas pouvoir *dédoubler*
 *    un lieu qui existe déjà sur la carte : sinon n'importe qui ouvre « Chez Afi »
 *    à côté du vrai, contourne la revendication (S-18) et brouille la carte.
 *
 *    ⚠️ Mesuré sur la canonique (13 738 lieux OSM) : un rapprochement par NOM SEUL
 *    est FAUX — « Alimentation générale » ×101, « Atelier de couture » ×54. Le signal
 *    d'usurpation n'est pas le nom, c'est **le nom normalisé ET la proximité** :
 *    sur 18 986 paires homonymes, **93** sont à ≤ 50 m — de vrais doublons ; le reste
 *    est de la toponymie générique. On refuse donc seulement le recouvrement étroit.
 *
 * 2. **Le slot est la porte.** Un compte ne peut créer/tenir qu'un nombre borné de
 *    facilités (D-J : 1 gratuit + des slots payants). La règle de solde est pure :
 *    elle décide, le SQL ne fait que fournir les faits.
 */

import { foldAccents } from '../domain/text-fold';

/** Rayon de recouvrement qui dénonce un doublon réel (mesuré : 93 paires ≤ 50 m). */
export const SHADOW_PROXIMITY_METERS = 250;

/** Normalise un nom de lieu pour la comparaison : accents repliés, ponctuation → espace,
 *  espaces compactés. Même map d'accents que le SQL (`translate`), une seule source. */
export function foldPlaceName(input: string): string {
  const folded = foldAccents(String(input ?? ''));
  return folded
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export interface PlaceCandidate {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

/** Distance en mètres (haversine). */
export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Le lieu que la création viendrait recouvrir, s'il existe. Le SQL fournit les
 * candidats (même nom normalisé, dans une boîte géographique) ; la décision
 * (nom normalisé + rayon) est ici, donc prouvable sans base.
 *
 * Renvoie le candidat le plus proche sous le seuil, ou `null`.
 */
export function findShadowedPlace(
  candidates: readonly PlaceCandidate[],
  target: { name: string; latitude: number; longitude: number },
): PlaceCandidate | null {
  const wanted = foldPlaceName(target.name);
  if (!wanted) return null;
  let best: PlaceCandidate | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (foldPlaceName(candidate.name) !== wanted) continue;
    const d = distanceMeters(target, candidate);
    if (d <= SHADOW_PROXIMITY_METERS && d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}

/** Message FR honnête : on nomme le fait, on route vers la revendication. */
export function shadowRefusalMessage(placeName: string): string {
  return `« ${placeName} » existe déjà sur la carte à cet endroit. Ce n'est pas une création : c'est une revendication. Ouvrez la fiche du lieu et revendiquez-le (preuve de contrôle, arbitrage opérateur).`;
}

export interface SlotFact {
  source: string;
  status: string;
}

export interface SlotStanding {
  /** Slots gratuits (1 par compte, D-J). */
  freeTotal: number;
  freeUsed: number;
  freeAvailable: number;
  /** Slots payés tenus. */
  paidTotal: number;
  paidUsed: number;
  paidAvailable: number;
  /** Peut-on créer une nouvelle facilité (un slot libre, gratuit ou payé) ? */
  canCreate: boolean;
  /** Faut-il acheter un slot payé pour créer ? */
  needsPaidSlot: boolean;
}

/**
 * Solde de slots d'un compte, dérivé des faits. Un slot est consommé dès qu'il est
 * `assigned`. `revoked` ne compte pas. La règle : **un slot libre = droit de créer** ;
 * au-delà du gratuit, il faut un slot payé.
 */
export function slotStanding(slots: readonly SlotFact[]): SlotStanding {
  const live = slots.filter((s) => s.status !== 'revoked');
  const free = live.filter((s) => s.source === 'free');
  const paid = live.filter((s) => s.source === 'wallet' || s.source === 'workspace');
  const freeUsed = free.filter((s) => s.status === 'assigned').length;
  const freeAvailable = free.filter((s) => s.status === 'available').length;
  const paidUsed = paid.filter((s) => s.status === 'assigned').length;
  const paidAvailable = paid.filter((s) => s.status === 'available').length;
  const canCreate = freeAvailable > 0 || paidAvailable > 0;
  return {
    freeTotal: free.length,
    freeUsed,
    freeAvailable,
    paidTotal: paid.length,
    paidUsed,
    paidAvailable,
    canCreate,
    needsPaidSlot: !canCreate,
  };
}
