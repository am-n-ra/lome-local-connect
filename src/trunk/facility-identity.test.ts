import { describe, expect, it } from 'vitest';
import { findShadowedPlace, foldPlaceName, distanceMeters, slotStanding, SHADOW_PROXIMITY_METERS } from './facility-identity';

// Lomé : 0.001° de latitude ≈ 111 m. Le seuil de recouvrement est de 250 m.
const LOME = { latitude: 6.13, longitude: 1.22 };
const atMetersNorth = (meters: number) => ({ latitude: LOME.latitude + meters / 111320, longitude: LOME.longitude });

describe('BRANCHES-IDENTITY — normalisation du nom de lieu', () => {
  it('replie les accents, la casse et la ponctuation (même règle que le SQL)', () => {
    expect(foldPlaceName('Boulangerie du Marché')).toBe('boulangerie du marche');
    expect(foldPlaceName('ÉPICERIE  "Chez Afi"')).toBe('epicerie chez afi');
    expect(foldPlaceName('Le Fournil d’Or')).toBe('le fournil d or');
  });

  it('un nom vide ou sans caractère exploitable ne recouvre rien', () => {
    expect(foldPlaceName('   ')).toBe('');
    expect(foldPlaceName('— —')).toBe('');
  });
});

describe('BRANCHES-IDENTITY — recouvrement d’un lieu existant', () => {
  it('refuse une création qui dédouble un lieu au MÊME endroit', () => {
    const existing = [{ id: 'f1', name: 'Boulangerie du Marché', latitude: LOME.latitude, longitude: LOME.longitude }];
    const shadowed = findShadowedPlace(existing, { name: 'Boulangerie du Marché', ...atMetersNorth(20) });
    expect(shadowed?.id).toBe('f1');
  });

  it('détecte le recouvrement malgré l’accent et la casse', () => {
    const existing = [{ id: 'f1', name: 'Épicerie Chez Afi', latitude: LOME.latitude, longitude: LOME.longitude }];
    expect(findShadowedPlace(existing, { name: 'epicerie chez afi', ...atMetersNorth(30) })?.id).toBe('f1');
  });

  it('ne refuse PAS un homonyme éloigné (la toponymie générique est légitime)', () => {
    // Mesuré sur la canonique : « Alimentation générale » existe 101 fois. Un nom seul
    // produirait 101 faux positifs ; à 1 km, c'est un autre commerce, pas une usurpation.
    const existing = [{ id: 'f1', name: 'Alimentation générale', latitude: LOME.latitude, longitude: LOME.longitude }];
    expect(findShadowedPlace(existing, { name: 'Alimentation générale', ...atMetersNorth(1000) })).toBeNull();
  });

  it('ne refuse PAS un nom différent au même endroit (plusieurs commerces cohabitent)', () => {
    const existing = [{ id: 'f1', name: 'Boulangerie du Marché', latitude: LOME.latitude, longitude: LOME.longitude }];
    expect(findShadowedPlace(existing, { name: 'Pharmacie du Port', ...atMetersNorth(10) })).toBeNull();
  });

  it('le seuil est bien de 250 m (juste en dessous = recouvre, juste au-dessus = non)', () => {
    const existing = [{ id: 'f1', name: 'Chez Afi', latitude: LOME.latitude, longitude: LOME.longitude }];
    expect(findShadowedPlace(existing, { name: 'Chez Afi', ...atMetersNorth(SHADOW_PROXIMITY_METERS - 10) })?.id).toBe('f1');
    expect(findShadowedPlace(existing, { name: 'Chez Afi', ...atMetersNorth(SHADOW_PROXIMITY_METERS + 10) })).toBeNull();
  });

  it('distanceMeters est une vraie distance (≈ le déplacement attendu)', () => {
    expect(distanceMeters(LOME, atMetersNorth(100))).toBeGreaterThan(90);
    expect(distanceMeters(LOME, atMetersNorth(100))).toBeLessThan(110);
  });
});

describe('BRANCHES-SLOT (D-J) — solde d’emplacements', () => {
  it('un emplacement gratuit libre = droit de créer', () => {
    const standing = slotStanding([{ source: 'free', status: 'available' }]);
    expect(standing.canCreate).toBe(true);
    expect(standing.needsPaidSlot).toBe(false);
    expect(standing.freeAvailable).toBe(1);
  });

  it('gratuit occupé et aucun payant = il faut acheter (D-J : 1 gratuit par compte)', () => {
    const standing = slotStanding([{ source: 'free', status: 'assigned' }]);
    expect(standing.canCreate).toBe(false);
    expect(standing.needsPaidSlot).toBe(true);
    expect(standing.freeUsed).toBe(1);
  });

  it('un emplacement payant libre rouvre le droit de créer', () => {
    const standing = slotStanding([
      { source: 'free', status: 'assigned' },
      { source: 'wallet', status: 'available' },
    ]);
    expect(standing.canCreate).toBe(true);
    expect(standing.paidAvailable).toBe(1);
    expect(standing.paidUsed).toBe(0);
  });

  it('un emplacement révoqué ne compte pas (ni occupé, ni libre)', () => {
    const standing = slotStanding([
      { source: 'free', status: 'assigned' },
      { source: 'wallet', status: 'revoked' },
    ]);
    expect(standing.paidTotal).toBe(0);
    expect(standing.canCreate).toBe(false);
  });

  it('plusieurs lieux tiennent sur 1 gratuit + des payants', () => {
    const standing = slotStanding([
      { source: 'free', status: 'assigned' },
      { source: 'wallet', status: 'assigned' },
      { source: 'wallet', status: 'available' },
    ]);
    expect(standing.freeUsed).toBe(1);
    expect(standing.paidUsed).toBe(1);
    expect(standing.paidAvailable).toBe(1);
    expect(standing.canCreate).toBe(true);
  });
});
