import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Species `lieu-connaitre` conformance for the app `tile-place` sheet.
 *
 * A tile tap opens a place Omni knows NOTHING about. The maquette answers with four
 * honesty elements; the app sheet must carry all four, or the tap becomes a trap
 * (a dead end) or a lie (implying knowledge). Like `route-intent-lock`, this reads
 * the source: mounting the map to check a sentence would cost more than it proves.
 */
const source = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');
const mapSource = readFileSync(new URL('./TrunkMap.tsx', import.meta.url), 'utf8');

describe('tile-place Species conformance (lieu-connaitre)', () => {
  it('states the unclaimed level and the absent owner', () => {
    expect(source).toContain('Niv. 0 · Non revendiquée');
    expect(source).toContain('aucune entité');
  });

  it('says what Omni cannot say, including that there is nothing to query', () => {
    expect(source).toContain('Ce qu’Omni ne peut pas dire');
    expect(source).toContain('rien à interroger');
  });

  it('never lets creation pose as claiming (maquette: « pas ce lieu »)', () => {
    expect(source).toContain('Créer (pas ce lieu)');
    expect(source).not.toMatch(/Créer une facilité ici/);
  });

  it('names the two paths and the anti-usurpation rule (S-18)', () => {
    expect(source).toContain('Preuve + arbitrage opérateur');
    expect(source).toContain('Non vérifié');
    expect(source).toContain('empêche l’usurpation');
  });

  it('never lets a tap throw uncaught (style loading or sick map)', () => {
    // `queryRenderedFeatures` throws synchronously while the style loads. The prod
    // flood class is one uncaught throw per gesture. Scoped to the tap handler block:
    // it must carry its own try/catch (an `isStyleLoaded()` pre-check ALONE proved
    // insufficient — its reporting can lag and silently eat every tap).
    const tapHandler = mapSource.slice(mapSource.indexOf('Bare-map tap'));
    const block = tapHandler.slice(0, 2500);
    expect(block).toContain('a tap must never throw uncaught');
    expect((block.match(/catch/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(mapSource).toContain('a tap must never throw uncaught');
  });
});
