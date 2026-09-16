import { describe, expect, it } from 'vitest';
import { arrivalTargetFor, boundsOfPoints, centerOfPoints, computeSearchFlight, DEFAULT_ARRIVAL_TARGET, labelForZoom, pointsForResultFraming } from './map-reveal';

const facilities = [
  { longitude: 1, latitude: 6 },
  { longitude: 2, latitude:   7 },
] as const;

describe('map search flight contract V1.3', () => {
  it('computes a single cinematic flight target around user + results', () => {
    const flight = computeSearchFlight(facilities, { longitude:  0, latitude:  5 });
    expect(flight.hasResults).toBe(true);
    expect(flight.targetZoom).toBe(14.2);
    expect(flight.targetCenter).toEqual([1, 6]);
  });

  it('parks at city level when there are no results', () => {
    const flight = computeSearchFlight([]);
    expect(flight.hasResults).toBe(false);
    expect(flight.targetZoom).toBe(12.5);
    expect(flight.targetCenter).toEqual([1.22, 6.13]);
  });

  it('labels zoom bands contextually', () => {
    expect(labelForZoom(1)).toBe('Recherche dans le monde…');
    expect(labelForZoom(5)).toBe("Afrique de l'Ouest");
    expect(labelForZoom(7)).toBe('Togo');
    expect(labelForZoom(10)).toBe('Région Maritime');
    expect(labelForZoom(13)).toBe('Lomé');
    expect(labelForZoom(15)).toBeNull();
  });

  it('returns truthful framing/bounds helpers', () => {
    expect(centerOfPoints([])).toEqual([1.22, 6.13]);
    expect(boundsOfPoints([])).toBeNull();
    const pts = pointsForResultFraming(facilities, { longitude: 0, latitude: 5 });
    expect(pts).toHaveLength(3);
    expect(boundsOfPoints(pts)).toEqual([[0, 5], [2, 7]]);
  });
});

describe('COR-1a initial arrival recenter contract', () => {
  it('recenters on the real user location when it is available', () => {
    expect(arrivalTargetFor({ longitude: 1.2228, latitude: 6.1319 })).toEqual({ center: [1.2228, 6.1319], hasUserLocation: true });
  });

  it('falls back to the Lomé default only when no valid user location exists', () => {
    expect(arrivalTargetFor(null)).toEqual({ center: DEFAULT_ARRIVAL_TARGET, hasUserLocation: false });
    expect(arrivalTargetFor({ longitude: Number.NaN, latitude: 6.13 })).toEqual({ center: DEFAULT_ARRIVAL_TARGET, hasUserLocation: false });
  });

  it('treats the user (0,0) as a real location, not a missing one', () => {
    expect(arrivalTargetFor({ longitude: 0, latitude: 0 })).toEqual({ center: [0, 0], hasUserLocation: true });
  });
});
