import { describe, expect, it } from 'vitest';
import { globeContextLabelsVisibleForZoom, projectionChanged, projectionForZoom } from './map-camera';

describe('map projection contract', () => {
  it('uses globe below the local-map threshold and mercator at the threshold', () => {
    expect(projectionForZoom(2.39)).toBe('globe');
    expect(projectionForZoom(2.4)).toBe('mercator');
    expect(projectionForZoom(8)).toBe('mercator');
  });

  it('switches back to globe when the user zooms out', () => {
    expect(projectionChanged('mercator', 2.39)).toBe(true);
    expect(projectionChanged('globe', 2.4)).toBe(true);
    expect(projectionChanged('globe', 1.35)).toBe(false);
  });

  it('hides country and water-body names on the fully zoomed-out globe and restores them locally', () => {
    expect(globeContextLabelsVisibleForZoom(1.35)).toBe(false);
    expect(globeContextLabelsVisibleForZoom(2.39)).toBe(false);
    expect(globeContextLabelsVisibleForZoom(2.4)).toBe(true);
  });

  it('does not turn an invalid zoom into a globe claim', () => {
    expect(projectionForZoom(Number.NaN)).toBe('mercator');
    expect(projectionForZoom(Number.POSITIVE_INFINITY)).toBe('mercator');
  });
});
