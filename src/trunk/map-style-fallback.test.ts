import { describe, expect, it } from 'vitest';
import {
  RASTER_STYLE_URL,
  VECTOR_STYLE_URL,
  shouldFallbackToRaster,
  styleChoiceFor,
} from './map-style-fallback';

describe('map style failure policy', () => {
  it('prefers the vector style on first mount', () => {
    expect(styleChoiceFor('local')).toEqual({ basemap: 'local', url: VECTOR_STYLE_URL });
  });

  it('picks the committed raster fallback once a fallback happened', () => {
    expect(styleChoiceFor('raster')).toEqual({ basemap: 'raster', url: RASTER_STYLE_URL });
    expect(styleChoiceFor('raster', true)).toEqual({ basemap: 'local', url: VECTOR_STYLE_URL });
  });

  it('falls back when the vector style errors or stalls, but never when loaded', () => {
    expect(shouldFallbackToRaster('local', false, false, false)).toBe(false);
    expect(shouldFallbackToRaster('local', false, false, true)).toBe(true);
    expect(shouldFallbackToRaster('local', false, true, false)).toBe(true);
    expect(shouldFallbackToRaster('local', true, false, false)).toBe(false);
    expect(shouldFallbackToRaster('local', true, true, false)).toBe(false);
    expect(shouldFallbackToRaster('raster', false, true, true)).toBe(false);
  });
});