// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import { MAP_FILTERS, facilityMatchesFilter, filterFacilities } from './map-filters';

/**
 * S-07 — « la carte est filtrable » est décrit dans la maquette acceptée et était ABSENT de l'app.
 * Ces tests verrouillent la règle : le filtre porte sur l'ENTITÉ (S-13), jamais sur un attribut produit.
 */

describe('S-07 map filters — rail', () => {
  it('exposes the four chips; the mobile-place chip is honest about what it filters', () => {
    // S-12 — le TRANSPORT (service A→B) est `V1+` et n'existe pas ici. La chip filtre la
    // FORME du lieu (`mobile` = ambulant), donc elle est étiquetée « Ambulants », pas
    // « Transport » (ce dernier promettrait une catégorie d'offre absente).
    expect(MAP_FILTERS.map((f) => f.label)).toEqual(['Tout', 'Commerces', 'Particuliers', 'Ambulants']);
    const transport = MAP_FILTERS.find((f) => f.id === 'transport');
    // S4 — la chip n'est plus « soon » : elle filtre la FORME du lieu (mobile = ambulant).
    expect(transport?.soon).toBe(false);
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

  it('the mobile-place chip matches only `mobile` places, never fixe/digital/undeclared (S4)', () => {
    // S4 — le filtre porte sur la FORME du lieu, pas sur une catégorie d'offre. Un lieu de
    // forme non déclarée (`null`, fond de carte) ne matche pas : on n'invente pas une forme.
    expect(facilityMatchesFilter({ facilityType: 'mobile' }, 'transport')).toBe(true);
    expect(facilityMatchesFilter({ facilityType: 'fixe' }, 'transport')).toBe(false);
    expect(facilityMatchesFilter({ facilityType: 'digital' }, 'transport')).toBe(false);
    expect(facilityMatchesFilter({ facilityType: null }, 'transport')).toBe(false);
    expect(facilityMatchesFilter({}, 'transport')).toBe(false);
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

  it('renders the mobile-vendor case: an ambulant is discoverable under Ambulants (S4)', () => {
    const marche = [
      { entityKind: 'organisation' as const, facilityType: 'fixe' as const, name: 'Boutique fixe' },
      { entityKind: 'individu' as const, facilityType: 'mobile' as const, name: 'Vendeur ambulant' },
      { entityKind: 'organisation' as const, facilityType: 'digital' as const, name: 'Boutique en ligne' },
    ];
    expect(filterFacilities(marche, 'transport').map((f) => f.name)).toEqual(['Vendeur ambulant']);
  });
});

/**
 * BRANCH-3 — « Ambulants » doit être sur la MÊME ligne que les autres catégories
 * (fondateur 2026-10-07). Le rail s'enroulait (`flex-wrap:wrap` + `max-width:220px`) et la
 * 4e chip tombait seule en dessous. Ce garde lit le CSS réel de l'app.
 */
describe('BRANCH-3 — le rail de catégories tient sur une seule ligne', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/trunk/ui-v13.css'), 'utf8');

  function rule(selector: string): string {
    const match = css.match(new RegExp(`${selector.replace('.', '\\.')}\\{([^}]*)\\}`));
    return match?.[1] ?? '';
  }

  it('le rail n\'a plus de retour à la ligne ni de largeur qui le force', () => {
    const rail = rule('.filterrail');
    expect(rail).toContain('flex-wrap:nowrap');
    expect(rail).not.toContain('flex-wrap:wrap');
    expect(rail).not.toMatch(/max-width:220px/);
  });

  it('les chips ne se coupent pas et ne se compressent pas (elles restent sur la ligne)', () => {
    const chip = rule('.fchip');
    expect(chip).toContain('white-space:nowrap');
    expect(chip).toContain('flex:none');
  });
});
