import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * MAP-TRANSFORM — façons de casser la projection MapLibre, verrouillées ici.
 *
 * 1. Changer de projection pendant que la caméra bouge : `invert()` renvoie `null`
 *    sur une matrice globe singulière, et le rendu suivant lève
 *    `transformMat4(c, c, null)`. Le `zoom` se déclenche pendant un flyTo, le
 *    `moveend` une seule fois posé : seul `moveend` peut piloter le changement.
 *
 * 2. Appeler `setProjection` avant que le style soit chargé : MapLibre lève
 *    « Style is not done loading. ». Si l'intention (`globeProjection`) est écrite
 *    AVANT l'appel qui lève, le drapeau ment (« déjà globe ») et toutes les gardes
 *    suivantes sautent l'application réelle. L'intention ne doit bouger qu'après un
 *    appel réussi, et l'appel doit être entouré d'un `try/catch` (le style peut
 *    légitimement ne pas être prêt).
 *
 * 3. GLOBE-REG (2026-10-07) — `isStyleLoaded()` renvoie un FAUX NÉGATIF sur
 *    MapLibre 6.x tant que les tuiles streament. L'arrival décolle depuis le globe
 *    et atterrit au zoom rue (14.2), mais aucun `moveend` ne suit la fin de
 *    l'animation, et `syncProjection` est bloqué pendant l'animation
 *    (`arrivalInProgress`). Résultat : la carte RESTAIT sur `globe` à zoom 14.2 —
 *    matrice dégénérée (`null[0]` à chaque frame) et pins non projetés. Deux
 *    corrections verrouillées : (a) `applyProjection` ne se fie plus à
 *    `isStyleLoaded()` comme garde (le `try/catch` est le garde fiable) ; (b) la fin
 *    de l'arrival applique explicitement la projection du zoom atterri.
 *
 * Non reproductible en headless (timing swiftshader), donc contrat verrouillé à la source.
 */
const source = readFileSync(new URL('./TrunkMap.tsx', import.meta.url), 'utf8');
const lines = source.split('\n');

function projectionSites(): string[] {
  return lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.includes('.setProjection('))
    .map(({ index }) => lines.slice(Math.max(0, index - 10), index + 8).join('\n'));
}

describe('MAP-TRANSFORM — la projection ne change que sur une carte posée et chargée', () => {
  it('chaque setProjection est entouré d’un try/catch (le style peut ne pas être prêt)', () => {
    const sites = projectionSites();
    expect(sites.length).toBeGreaterThan(0);
    for (const site of sites) {
      expect(site).toContain('try {');
      expect(site).toContain('catch');
    }
  });

  it('applyProjection ne se fie plus à isStyleLoaded() comme garde (faux négatif MapLibre 6)', () => {
    const applyIndex = lines.findIndex((line) => line.includes('const applyProjection ='));
    expect(applyIndex).toBeGreaterThan(-1);
    const body = lines.slice(applyIndex, applyIndex + 16).join('\n');
    expect(body).not.toContain('typed.isStyleLoaded()');
  });

  it('la fin de l’arrival applique la projection du zoom atterri (GLOBE-REG)', () => {
    // `finishArrival` remet arrivalInProgress à false puis doit appeler syncProjection(),
    // sinon la carte reste sur globe au zoom rue et les pins ne se projettent pas.
    const finishIndex = lines.findIndex((line) => line.includes('const finishArrival ='));
    expect(finishIndex).toBeGreaterThan(-1);
    const body = lines.slice(finishIndex, finishIndex + 30).join('\n');
    const clearIndex = body.indexOf('arrivalInProgressRef.current = false');
    const syncIndex = body.indexOf('syncProjection()');
    expect(clearIndex).toBeGreaterThan(-1);
    expect(syncIndex).toBeGreaterThan(clearIndex);
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

/**
 * MAP-TRANSFORM-ERROR (Heartwood HP-1) — les frames MapLibre (`_calcMatrices` rendu,
 * `unprojectScreenPoint` pointeur) lèvent SYNCHRONEMENT sur une matrice dégénérée et
 * remontent au `window.onerror`, échappant au `map.on('error')`. Sans un catch window
 * qui les reconnaît, l'erreur se répète à CHAQUE frame (le flood observé). Le catch doit
 * (a) reconnaître la classe, (b) re-ancrer la caméra, (c) empêcher le log par défaut,
 * et (d) être retiré au démontage. Le prédicat lui-même est testé dans
 * map-transform-error.test.ts (dont le cas « n'avale pas une erreur générique »).
 */
describe('MAP-TRANSFORM-ERROR — le flood MapLibre est reconnu, soigné et coupé', () => {
  it('TrunkMap importe le prédicat de transform error', () => {
    expect(source).toContain("import { isTransformMatrixError } from './map-transform-error'");
  });

  it('un listener window « error » en capture soigne et coupe le flood', () => {
    const idx = lines.findIndex((line) => line.includes("window.addEventListener('error', handleWindowError"));
    expect(idx).toBeGreaterThan(-1);
    const body = lines.slice(idx - 8, idx + 1).join('\n');
    expect(body).toContain('isTransformMatrixError');
    expect(body).toContain('healTransform()');
    expect(body).toContain('preventDefault()');
  });

  it('le listener est retiré au démontage (pas de fuite)', () => {
    expect(source).toContain("window.removeEventListener('error', handleWindowError, true)");
  });
});
