import { describe, expect, it } from 'vitest';
import { PILOT_ZONE_BOUNDS, isInsidePilotZone } from './routing-adapter';

/** The import perimeter guard lives in `http.ts` but its decision is this
 * predicate, so the boundary behaviour is pinned here against the coordinates
 * the canonical branch actually contains. */
describe('import perimeter guard predicate', () => {
  const IN_ZONE = [
    { label: 'Adawlato market', latitude: 6.1315, longitude: 1.2138 },
    { label: 'Tokoin', latitude: 6.1655, longitude: 1.2226 },
    { label: 'Baguida', latitude: 6.16, longitude: 1.32 },
    { label: 'Agoè', latitude: 6.2, longitude: 1.19 },
  ];
  const OUT_OF_ZONE = [
    { label: 'Total (Ghana)', latitude: 6.3418223, longitude: -1.0013403 },
    { label: 'Goil (Ghana)', latitude: 6.0923585, longitude: -0.8399508 },
    { label: 'Galaxy Oil (Ghana)', latitude: 6.1165795, longitude: -0.0041448 },
    { label: 'Accra', latitude: 5.6037, longitude: -0.187 },
  ];

  it('admits every in-zone point', () => {
    for (const point of IN_ZONE) expect(isInsidePilotZone(point), point.label).toBe(true);
  });

  it('refuses every out-of-zone point instead of publishing an unreachable pin', () => {
    for (const point of OUT_OF_ZONE) expect(isInsidePilotZone(point), point.label).toBe(false);
  });

  it('keeps the zone anchored to the Lomé pilot area, not the whole planet', () => {
    expect(PILOT_ZONE_BOUNDS.east).toBeLessThan(180);
    expect(PILOT_ZONE_BOUNDS.west).toBeGreaterThan(-180);
    // A world-wide bound would have silently re-admitted the Ghana points.
    expect(PILOT_ZONE_BOUNDS.west).toBeGreaterThan(0);
  });
});