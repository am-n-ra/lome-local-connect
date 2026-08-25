import { describe, expect, it } from 'vitest';
import {
  bearingForGlobeAxisDrag,
  centerForGlobeAxisDrag,
  GLOBE_MAX_LATITUDE,
  GLOBE_MIN_LATITUDE,
} from './globe-axis';

describe('globe axis drag', () => {
  const start = { longitude: 1.22, latitude: 6.13, bearing: 0 };

  it('orbits longitude responsively while preserving the vertical bearing axis', () => {
    expect(centerForGlobeAxisDrag(start, { x: 40, y: 0 })).toEqual([-20.78, 6.13]);
    expect(centerForGlobeAxisDrag(start, { x: -40, y: 0 })).toEqual([23.22, 6.13]);
    expect(bearingForGlobeAxisDrag(start)).toBe(0);
  });

  it('moves latitude for vertical drag and clamps at safe globe bounds', () => {
    const vertical = centerForGlobeAxisDrag(start, { x: 0, y: 20 });
    expect(vertical[0]).toBeCloseTo(1.22, 6);
    expect(vertical[1]).toBeCloseTo(12.53, 6);
    expect(centerForGlobeAxisDrag({ ...start, latitude: 80 }, { x: 0, y: 20 })[1]).toBe(GLOBE_MAX_LATITUDE);
    expect(centerForGlobeAxisDrag({ ...start, latitude: -80 }, { x: 0, y: -20 })[1]).toBe(GLOBE_MIN_LATITUDE);
  });

  it('keeps bearing unchanged for diagonal primary globe drag', () => {
    const next = centerForGlobeAxisDrag(start, { x: 15, y: -10 });
    expect(next[0]).toBeCloseTo(-7.03, 6);
    expect(next[1]).toBeCloseTo(2.93, 6);
    expect(bearingForGlobeAxisDrag({ ...start, bearing: 23 })).toBe(23);
  });
});
