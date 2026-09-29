import { describe, expect, it, vi } from 'vitest';
import { globeContextLabelsVisibleForZoom, isFiniteCameraCenter, isFiniteCameraZoom, projectionChanged, projectionForZoom, safeEaseTo, safeFlyTo } from './map-camera';

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

describe('camera-input guard contract', () => {
  it('accepts a bounded center and zoom, refuses NaN, infinity and out-of-range', () => {
    expect(isFiniteCameraCenter([1.22, 6.13])).toBe(true);
    expect(isFiniteCameraCenter([Number.NaN, 6.13])).toBe(false);
    expect(isFiniteCameraCenter([1.22, Number.POSITIVE_INFINITY])).toBe(false);
    expect(isFiniteCameraCenter([200, 6.13])).toBe(false);
    expect(isFiniteCameraCenter([1.22, -91])).toBe(false);
    expect(isFiniteCameraCenter('Lome')).toBe(false);
    expect(isFiniteCameraZoom(11.5)).toBe(true);
    expect(isFiniteCameraZoom(Number.NaN)).toBe(false);
    expect(isFiniteCameraZoom(-1)).toBe(false);
    expect(isFiniteCameraZoom(23)).toBe(false);
  });

  it('never invokes the engine on an insane command and reports the skip', () => {
    const engine = { easeTo: vi.fn(), flyTo: vi.fn() };
    expect(safeFlyTo(engine, { center: [Number.NaN, 6.13], zoom: 8 })).toBe(false);
    expect(safeEaseTo(engine, { center: [1.22, 6.13], zoom: Number.NaN })).toBe(false);
    expect(engine.flyTo).not.toHaveBeenCalled();
    expect(engine.easeTo).not.toHaveBeenCalled();
  });

  it('catches a sick engine instead of throwing uncaught into event handlers', () => {
    const sick = {
      easeTo: vi.fn(() => { throw new Error('Invalid LngLat'); }),
      flyTo: vi.fn(() => { throw new Error('Invalid LngLat'); }),
    };
    expect(safeEaseTo(sick, { center: [1.22, 6.13], zoom: 8 })).toBe(false);
    expect(safeFlyTo(sick, { center: [1.22, 6.13], zoom: 8 })).toBe(false);
  });

  it('passes a sane command through untouched', () => {
    const engine = { easeTo: vi.fn(), flyTo: vi.fn() };
    expect(safeFlyTo(engine, { center: [1.22, 6.13], zoom: 8, duration: 600 })).toBe(true);
    expect(engine.flyTo).toHaveBeenCalledWith({ center: [1.22, 6.13], zoom: 8, duration: 600 });
  });
});
