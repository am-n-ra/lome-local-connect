import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * MAP-TRANSFORM — deux façons de casser la projection MapLibre, verrouillées ici.
 *
 * 1. Changer de projection pendant que la caméra bouge : `invert()` renvoie `null`
 *    sur une matrice globe singulière, et le rendu suivant lève
 *    `transformMat4(c, c, null)`. Le `zoom` se déclenche pendant un flyTo, le
 *    `moveend` une seule fois posé : seul `moveend` peut piloter le changement.
 *
 * 2. Appeler `setProjection` avant que le style soit chargé : MapLibre lève
 *    « Style is not done loading. ». Si l'intention (`globeProjection`) est écrite
 *    AVANT l'appel qui lève, le drapeau ment (« déjà globe ») et toutes les gardes
 *    suivantes sautent l'application réelle — la carte reste en mercator au zoom
 *    monde, plus de globe. L'intention ne doit bouger qu'après un appel réussi.
 *
 * Non reproductible en headless (timing swiftshader), donc contrat verrouillé à la source.
 */
const source = readFileSync(new URL('./TrunkMap.tsx', import.meta.url), 'utf8');
const lines = source.split('\n');

function projectionSites(): string[] {
  return lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.includes('.setProjection('))
    .map(({ index }) => lines.slice(Math.max(0, index - 8), index + 1).join('\n'));
}

describe('MAP-TRANSFORM — la projection ne change que sur une carte posée et chargée', () => {
  it('aucun setProjection sans garde isStyleLoaded() (sinon MapLibre lève et le drapeau ment)', () => {
    const sites = projectionSites();
    expect(sites.length).toBeGreaterThan(0);
    for (const site of sites) {
      expect(site).toContain('isStyleLoaded()');
    }
  });

  it('le drapeau globeProjection ne bouge qu’APRÈS l’appel setProjection (jamais avant)', () => {
    const setIndex = lines.findIndex((line) => line.includes('.setProjection('));
    const flagIndex = lines.findIndex((line) => line.includes('globeProjection = wantsGlobe'));
    expect(setIndex).toBeGreaterThan(-1);
    expect(flagIndex).toBeGreaterThan(setIndex);
  });

  it('syncProjection ne réagit plus au `zoom` (qui tire pendant un flyTo)', () => {
    expect(source).not.toContain("map.on('zoom', syncProjection)");
  });

  it('syncProjection reste appliqué au `moveend` (caméra posée)', () => {
    expect(source).toContain("map.on('moveend', syncProjection)");
  });

  // GLOBE-START — le style ne déclare aucune projection, donc MapLibre défaut à
  // mercator : le globe n'existe qu'après setProjection. Supposer l'intention
  // `true` faisait sauter cette première application.
  it('l’intention globe n’est jamais supposée `true` au départ', () => {
    expect(source).not.toContain('let globeProjection = true');
  });
});
