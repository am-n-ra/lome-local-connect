import { describe, expect, it } from 'vitest';
import { isTransformMatrixError } from './map-transform-error';

/**
 * Reconnaître une erreur de transform de caméra MapLibre — et RIEN d'autre.
 * Le cas qui compte autant que les positifs : une lecture nulle GÉNÉRIQUE sans
 * frame MapLibre n'est PAS un transform error, sinon le catch avalerait une
 * vraie erreur applicative.
 */
describe('isTransformMatrixError — signature étroite du transform MapLibre', () => {
  it('reconnaît les frames de rendu/projection MapLibre', () => {
    expect(isTransformMatrixError('TypeError: Cannot read properties of null (reading \'0\')\n    at _calcMatrices (maplibre-gl.js:1)')).toBe(true);
    expect(isTransformMatrixError('Error: Invalid LngLat object: (0, NaN)\n    at unprojectScreenPoint (maplibre-gl.js:1)')).toBe(true);
    expect(isTransformMatrixError('at transformMat4 (maplibre-gl.js:1)')).toBe(true);
  });

  it('N’AVALE PAS une lecture nulle générique sans frame MapLibre', () => {
    expect(isTransformMatrixError("TypeError: Cannot read properties of null (reading '0')\n    at renderRow (our-component.tsx:42)")).toBe(false);
  });

  it('N’AVALE PAS une erreur applicative quelconque', () => {
    expect(isTransformMatrixError('TypeError: r.on2 is not a function')).toBe(false);
    expect(isTransformMatrixError('Failed to fetch')).toBe(false);
    expect(isTransformMatrixError('Invalid LngLat object: (1.2, 6.1)')).toBe(false);
  });

  it('tolère l’absence de texte', () => {
    expect(isTransformMatrixError(null)).toBe(false);
    expect(isTransformMatrixError(undefined)).toBe(false);
    expect(isTransformMatrixError('')).toBe(false);
  });
});
