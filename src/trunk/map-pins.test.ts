import { describe, expect, it } from 'vitest';
import { groupProjectedFacilities, type ProjectedFacility } from './map-pins';
import type { PublicFacility } from './types';

function facility(id: string, longitude: number, latitude: number): PublicFacility {
  return {
    id,
    name: `Lieu ${id}`,
    category: 'local',
    address: null,
    latitude,
    longitude,
    trust: 'unclaimed',
    plan: 'free',
    productCount: 1,
  };
}

function projected(id: string, x: number, y: number, longitude = x / 100, latitude = y / 100): ProjectedFacility {
  return { facility: facility(id, longitude, latitude), x, y };
}

describe('groupProjectedFacilities', () => {
  it('keeps a nearby group as one public cluster with an honest count', () => {
    const pins = groupProjectedFacilities([
      projected('a', 120, 180, 1.2, 6.1),
      projected('b', 150, 185, 1.5, 6.2),
      projected('c', 155, 190, 1.6, 6.3),
    ], 48);

    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({ kind: 'cluster', count: 3, left: 141.66666666666666, top: 185 });
    expect(pins[0].facility).toBeUndefined();
  });

  it('keeps isolated facilities as individually selectable pins', () => {
    const first = facility('first', 1.2, 6.1);
    const second = facility('second', 2.4, 6.3);
    const pins = groupProjectedFacilities([
      { facility: first, x: 100, y: 120 },
      { facility: second, x: 220, y: 120 },
    ], 48);

    expect(pins).toHaveLength(2);
    expect(pins[0]).toMatchObject({ kind: 'facility', left: 100, top: 120, count: 1, facility: first });
    expect(pins[1]).toMatchObject({ kind: 'facility', left: 220, top: 120, count: 1, facility: second });
  });

  it('uses the public geographic coordinates for a cluster camera target', () => {
    const pins = groupProjectedFacilities([
      projected('a', 100, 100, 1.0, 6.0),
      projected('b', 120, 100, 1.4, 6.4),
    ], 48);

    expect(pins[0]).toMatchObject({ kind: 'cluster', longitude: 1.2, latitude: 6.2 });
  });
});
