import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * MAP-TRANSFORM — un changement de projection pendant que la caméra bouge casse la
 * transformation MapLibre. Preuve (bundle servi) : `invert()` renvoie `null` sur une
 * matrice globe singulière, et le rendu suivant lève
 * `Cannot read properties of null (reading '0')` dans `transformMat4(c, c, null)`.
 *
 * Ce n'est pas reproductible en headless (swiftshader/timing différents), donc le
 * contrat est verrouillé à la source : les deux sites qui appellent `setProjection`
 * doivent d'abord s'assurer que la caméra est immobile (`map.isMoving()`), et le
 * `zoom` — qui se déclenche pendant un flyTo — ne doit plus piloter le changement.
 */
const source = readFileSync(new URL('./TrunkMap.tsx', import.meta.url), 'utf8');

function projectionSites(): string[] {
  return source
    .split('\n')
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.includes('map.setProjection('))
    .map(({ index }) => source.split('\n').slice(Math.max(0, index - 8), index + 1).join('\n'));
}

describe('MAP-TRANSFORM — le changement de projection attend une caméra immobile', () => {
  it('aucun setProjection ne s’exécute sans garde isMoving()', () => {
    const sites = projectionSites();
    expect(sites.length).toBeGreaterThan(0);
    for (const site of sites) {
      expect(site).toContain('isMoving()');
    }
  });

  it('syncProjection ne réagit plus au `zoom` (qui tire pendant un flyTo)', () => {
    expect(source).not.toContain("map.on('zoom', syncProjection)");
  });

  it('syncProjection reste appliqué au `moveend` (caméra posée)', () => {
    expect(source).toContain("map.on('moveend', syncProjection)");
  });
});
