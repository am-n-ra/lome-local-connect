import { describe, expect, it } from 'vitest';
import { groupProjectedFacilities, pinFeatureCollection, pinRadiusPx, pinRingColor, pinRingWidthPx, PIN_RADIUS_PX, PIN_RING_OWNED_COLOR, PIN_RING_THIRD_PARTY_COLOR, PIN_RING_WIDTH_PX, PIN_SELECTED_SCALE, type ProjectedFacility } from './map-pins';
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

describe('rule 7 pin anatomy (owned ring + selected emphasis)', () => {
  it('gives owned pins the Evergreen ring and third-party pins the Cream ring', () => {
    expect(pinRingColor(true)).toBe(PIN_RING_OWNED_COLOR);
    expect(pinRingColor(false)).toBe(PIN_RING_THIRD_PARTY_COLOR);
    expect(pinRingColor(true)).toBe('#234D40');
    expect(pinRingColor(false)).toBe('#F9F7F2');
  });

  it('emphasises the selected pin by the spec scale (1.3), core and ring together', () => {
    expect(PIN_SELECTED_SCALE).toBe(1.3);
    expect(pinRadiusPx(false)).toBe(PIN_RADIUS_PX);
    expect(pinRingWidthPx(false)).toBe(PIN_RING_WIDTH_PX);
    expect(pinRadiusPx(true)).toBeCloseTo(PIN_RADIUS_PX * PIN_SELECTED_SCALE);
    expect(pinRingWidthPx(true)).toBeCloseTo(PIN_RING_WIDTH_PX * PIN_SELECTED_SCALE);
  });

  it('marks only owned facilities on the pin features', () => {
    const facilities = [facility('owned-1', 1.2, 6.1), facility('other-1', 1.5, 6.2)];
    const collection = pinFeatureCollection(facilities, ['owned-1']);
    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(2);
    expect(collection.features[0].properties).toMatchObject({ id: 'owned-1', owned: true });
    expect(collection.features[1].properties).toMatchObject({ id: 'other-1', owned: false });
  });

  it('treats a missing or empty ownership list as no owned facility', () => {
    const facilities = [facility('a', 1.2, 6.1)];
    expect(pinFeatureCollection(facilities, null).features[0].properties.owned).toBe(false);
    expect(pinFeatureCollection(facilities, []).features[0].properties.owned).toBe(false);
  });
});
