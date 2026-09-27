import { describe, expect, it } from 'vitest';
import { MAP_FILTERS, facilityMatchesFilter, filterFacilities } from './map-filters';

/**
 * S-07 — « la carte est filtrable » est décrit dans la maquette acceptée et était ABSENT de l'app.
 * Ces tests verrouillent la règle : le filtre porte sur l'ENTITÉ (S-13), jamais sur un attribut produit.
 */

describe('S-07 map filters — rail', () => {
  it('exposes the four chips the founder described, with Transport as an honest "soon"', () => {
    expect(MAP_FILTERS.map((f) => f.label)).toEqual(['Tout', 'Commerces', 'Particuliers', 'Transport']);
    const transport = MAP_FILTERS.find((f) => f.id === 'transport');
    expect(transport?.soon).toBe(true);
    // V1+ (S-08/S-12) : la chip doit porter une raison, pas un silence.
    expect(transport?.soonReason).toBeTruthy();
  });

  it('classifies by entity kind, not by product attribute', () => {
    const commerce = { entityKind: 'organisation' as const };
    const particulier = { entityKind: 'individu' as const };
    const unclaimed = { entityKind: null };

    expect(facilityMatchesFilter(commerce, 'commerces')).toBe(true);
    expect(facilityMatchesFilter(commerce, 'particuliers')).toBe(false);
    expect(facilityMatchesFilter(particulier, 'particuliers')).toBe(true);
    expect(facilityMatchesFilter(particulier, 'commerces')).toBe(false);
    expect(facilityMatchesFilter(unclaimed, 'tout')).toBe(true);
  });

  it('hides unclaimed map-floor places from Commerces/Particuliers (S-05 honesty)', () => {
    // Un lieu `public_import` sans entité n'est NI un commerce NI un particulier.
    // Le montrer sous ces filtres prétendrait ce que S-05 interdit de promettre.
    const unclaimed = { entityKind: null };
    expect(facilityMatchesFilter(unclaimed, 'commerces')).toBe(false);
    expect(facilityMatchesFilter(unclaimed, 'particuliers')).toBe(false);
  });

  it('never silently claims Transport when no transport offer is modelled', () => {
    const anyFacility = { entityKind: 'organisation' as const };
    expect(facilityMatchesFilter(anyFacility, 'transport')).toBe(false);
  });

  it('filterFacilities keeps `tout` intact and returns a fresh array (no aliasing)', () => {
    const all = [{ entityKind: 'organisation' as const }, { entityKind: 'individu' as const }, { entityKind: null }];
    const tout = filterFacilities(all, 'tout');
    expect(tout).toHaveLength(3);
    expect(tout).not.toBe(all);
    expect(filterFacilities(all, 'particuliers')).toHaveLength(1);
    expect(filterFacilities(all, 'commerces')).toHaveLength(1);
  });

  it('renders the case the founder described: a particulier selling a used object is discoverable', () => {
    // Cas fondateur 4 — « un particulier vend son ordinateur d'occasion ».
    // Il n'est découvrable QUE par le filtre Particuliers (le filtre neuf/occasion n'est pas réclamé).
    const quartier = [
      { entityKind: 'organisation' as const, name: 'Boulangerie' },
      { entityKind: 'individu' as const, name: 'Particulier — ordinateur' },
    ];
    const found = filterFacilities(quartier, 'particuliers');
    expect(found.map((f) => f.name)).toEqual(['Particulier — ordinateur']);
  });
});
