import { describe, expect, it } from 'vitest';
import { boundsOfPoints, buildSearchRevealSteps, centerOfPoints, pointsForResultFraming } from './map-reveal';

const facilities = [
  { longitude: 1, latitude: 6 },
  { longitude: 2, latitude: 7 },
] as const;

describe('map search reveal contract', () => {
  it('builds world-to-results steps around source-backed results', () => {
    const steps = buildSearchRevealSteps(facilities);
    expect(steps.map((step) => step.kind)).toEqual(['world', 'continent', 'country', 'region', 'city', 'results']);
    expect(steps.map((step) => step.zoom)).toEqual([1.05, 2.15, 5.35, 8.25, 11.25, 14.2]);
    expect(steps.every((step) => step.center[0] === 1.5 && step.center[1] === 6.5)).toBe(true);
  });

  it('includes an explicitly authorized user position in the target and final frame', () => {
    const userPosition = { longitude: 0, latitude: 5 };
    const steps = buildSearchRevealSteps(facilities, userPosition);
    expect(steps.slice(0, 5).every((step) => step.center[0] === 0 && step.center[1] === 5)).toBe(true);
    expect(steps.at(-1)?.center).toEqual([1, 6]);
    expect(pointsForResultFraming(facilities, userPosition)).toHaveLength(3);
    expect(boundsOfPoints(pointsForResultFraming(facilities, userPosition))).toEqual([[0, 5], [2, 7]]);
  });

  it('returns truthful fallbacks for absent or invalid points', () => {
    expect(centerOfPoints([], [9, 8])).toEqual([9, 8]);
    expect(boundsOfPoints([])).toBeNull();
    expect(buildSearchRevealSteps([])).toEqual([]);
    expect(boundsOfPoints([{ longitude: Number.NaN, latitude: 1 }])).toBeNull();
  });
});
