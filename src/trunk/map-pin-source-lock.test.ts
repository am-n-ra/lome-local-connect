import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Régression réelle (2026-10-07) : `visibleFacilities` (ce que la carte DESSINE)
// dérivait uniquement de `orderedResults` (les RÉSULTATS de recherche). La
// DÉCOUVERTE du viewport vit dans un état distinct `facilities` → au repos la
// carte ne recevait AUCUN pin (250 lieux chargés, 0 dessiné) ; après recherche
// elle n'affichait que les résultats. La découverte n'atteignait jamais le
// `SOURCE` MapLibre. Garde : la carte doit dessiner la découverte quand aucune
// recherche n'est active.

const SOURCE = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');

describe('la carte dessine la découverte, pas seulement les résultats de recherche', () => {
  it('visibleFacilities retombe sur `facilities` (découverte) quand results est vide', () => {
    // la memo doit citer les deux états : résultats ET découverte
    const memo = SOURCE.slice(SOURCE.indexOf('const visibleFacilities = useMemo'), SOURCE.indexOf('const visibleFacilities = useMemo') + 400);
    expect(memo).toContain('results.length > 0');
    expect(memo).toContain('facilities');
    expect(memo).toContain('orderedResults');
  });

  it('le prop `facilities` du TrunkMap vient bien de visibleFacilities', () => {
    expect(SOURCE).toMatch(/facilities=\{visibleFacilities\}/);
  });

  it('`facilities` (découverte) est alimenté par loadPublic, pas seulement par la recherche', () => {
    // garde anti-régression : si quelqu'un rebranche la carte sur les seuls
    // résultats, la découverte redevient invisible au repos.
    expect(SOURCE).toMatch(/setFacilities\(result\.data\)/);
  });
});
