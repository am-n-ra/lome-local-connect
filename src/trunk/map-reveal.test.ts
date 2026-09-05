import { describe, expect, it } from 'vitest';
import { boundsOfPoints, centerOfPoints, computeSearchFlight, labelForZoom, pointsForResultFraming } from './map-reveal';

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
