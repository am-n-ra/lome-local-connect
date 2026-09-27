import { describe, expect, it } from 'vitest';
import {
  capacityForUniqueness,
  isReservable,
  isSinglePiece,
  normalizeStockForUniqueness,
  uniquenessStockRejection,
} from './offer-uniqueness';
import { computeExistenceLevel } from './offer-existence';

/**
 * S-01 — une pièce unique est une PRÉSENCE, pas un stock.
 *
 * Le défaut que ces tests verrouillent : une offre « piece_unique » portait un stock de N, était
 * annoncée « en stock », et son niveau 4 se déduisait d'un décompte qui n'a aucun sens pour un
 * objet unique. Les six cas fondateur (ordinateur d'occasion, appartement) n'étaient servis par
 * AUCUNE logique.
 */
describe('S-01 — présence d’une pièce unique', () => {
  it('une pièce unique se déclare présente (1) ou retirée (0), jamais plusieurs exemplaires', () => {
    expect(uniquenessStockRejection(1, 'piece_unique')).toBeNull();
    expect(uniquenessStockRejection(0, 'piece_unique')).toBeNull();
    // La contradiction même : « j'ai 3 pièces uniques identiques ».
    expect(uniquenessStockRejection(3, 'piece_unique')).toMatch(/pièce unique/i);
  });

  it('une offre renouvelable n’est jamais bridée par cette règle', () => {
    expect(uniquenessStockRejection(0, 'renouvelable')).toBeNull();
    expect(uniquenessStockRejection(40, 'renouvelable')).toBeNull();
    // Caractéristique non déclarée (héritage) : on ne refuse rien.
    expect(uniquenessStockRejection(12, null)).toBeNull();
    expect(uniquenessStockRejection(12, undefined)).toBeNull();
  });

  it('normalise le nombre d’exemplaires selon la caractéristique', () => {
    expect(normalizeStockForUniqueness(9, 'piece_unique')).toBe(1);
    expect(normalizeStockForUniqueness(7, 'renouvelable')).toBe(7);
    // Héritage NULL : inchangé, une migration ne réécrit pas une offre muette.
    expect(normalizeStockForUniqueness(7, null)).toBe(7);
  });

  it('la capacité suit la caractéristique — une seule vérité', () => {
    expect(capacityForUniqueness('piece_unique')).toBe(1);
    expect(capacityForUniqueness('renouvelable')).toBe(Number.POSITIVE_INFINITY);
    expect(capacityForUniqueness(null)).toBe(Number.POSITIVE_INFINITY);
    expect(isSinglePiece('piece_unique')).toBe(true);
    expect(isSinglePiece('renouvelable')).toBe(false);
  });

  it('la réservabilité se lit par PRÉSENCE pour une pièce unique, par décompte sinon', () => {
    // Pièce unique présente, non engagée → réservable.
    expect(isReservable({ uniquenessKind: 'piece_unique', quantityAllocated: 1, quantityReserved: 0 })).toBe(true);
    // Pièce unique déjà engagée → plus rien à vendre, elle disparaît.
    expect(isReservable({ uniquenessKind: 'piece_unique', quantityAllocated: 1, quantityReserved: 1 })).toBe(false);
    // Renouvelable : décompte net.
    expect(isReservable({ uniquenessKind: 'renouvelable', quantityAllocated: 10, quantityReserved: 3 })).toBe(true);
    expect(isReservable({ uniquenessKind: 'renouvelable', quantityAllocated: 3, quantityReserved: 3 })).toBe(false);
  });

  it('une pièce unique vendue n’est PLUS transactable — le mensonge exact à empêcher', () => {
    const base = { publicationState: 'published', hasEntity: true, availabilityState: 'en_stock', availabilityExpiresAt: null };
    // Présente → niveau 4 (transactable).
    expect(computeExistenceLevel({ ...base, uniquenessKind: 'piece_unique', quantityAllocated: 1, quantityReserved: 0 })).toBe(4);
    // Vendue → niveau 3 : disponibilité vivante, mais rien à réserver.
    expect(computeExistenceLevel({ ...base, uniquenessKind: 'piece_unique', quantityAllocated: 1, quantityReserved: 1 })).toBe(3);
    // Retirée (0) → niveau 3 : une pièce qui n'est plus là n'est PAS transactable. C'est le
    // cas qui distingue « présence » d'un décompte naïf : une implémentation par
    // `max(1, allocated)` aurait dit « réservable » — bug réel attrapé ici et corrigé dans
    // `isReservable` (trouvé par la passe de falsification, pas par relecture).
    expect(computeExistenceLevel({ ...base, uniquenessKind: 'piece_unique', quantityAllocated: 0, quantityReserved: 0 })).toBe(3);
    // Une offre renouvelable garde son comportement historique.
    expect(computeExistenceLevel({ ...base, uniquenessKind: 'renouvelable', quantityAllocated: 3, quantityReserved: 0 })).toBe(4);
  });
});
