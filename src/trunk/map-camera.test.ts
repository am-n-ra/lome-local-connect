import { describe, expect, it, vi } from 'vitest';
import { bottomPaddingFor, cameraIsReadable, globeContextLabelsVisibleForZoom, isFiniteCameraCenter, isFiniteCameraZoom, projectionChanged, projectionForZoom, safeEaseTo, safeFlyTo } from './map-camera';

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

describe('camera padding clamp (null-matrix guard)', () => {
  it('never squeezes the map below a usable band while a keyboard opens', () => {
    // An 844px phone: a sheet whose top is 120px would ask for 734px of padding — 87% of
    // the viewport. The clamp keeps at least 45% (≥200px) visible instead.
    const padding = bottomPaddingFor(724, 844);
    expect(padding).toBeLessThanOrEqual(844 - 200);
    expect(844 - padding).toBeGreaterThanOrEqual(200);
  });

  it('caps padding at 45% of the viewport for tall viewports', () => {
    expect(bottomPaddingFor(2000, 1000)).toBe(1000 - 450);
  });

  it('keeps the sheet height + 56 when it already fits the band', () => {
    expect(bottomPaddingFor(200, 844)).toBe(256);
  });

  it('returns no padding without a sheet or viewport', () => {
    expect(bottomPaddingFor(0, 844)).toBe(0);
    expect(bottomPaddingFor(300, 0)).toBe(0);
  });
});

describe('camera readability (transform heal trigger)', () => {
  it('accepts a finite centre and zoom', () => {
    expect(cameraIsReadable([1.22, 6.13], 11.5)).toBe(true);
  });
  it('rejects a poisoned (NaN) transform', () => {
    expect(cameraIsReadable([Number.NaN, 6.13], 11.5)).toBe(false);
    expect(cameraIsReadable([1.22, 6.13], Number.NaN)).toBe(false);
    expect(cameraIsReadable(null, 11.5)).toBe(false);
  });
});
