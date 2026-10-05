import { describe, expect, it } from 'vitest';
import { hideIrrelevantShieldLayers, shouldHideIrrelevantShieldLayer } from './maplibre';

type Layer = { id: string; layout?: { visibility?: string } };

function stubMap(layers: Layer[]) {
  const calls: Array<[string, string, string]> = [];
  return {
    calls,
    getStyle: () => ({ layers }),
    setLayoutProperty: (id: string, prop: string, value: string) => {
      calls.push([id, prop, value]);
    },
  };
}

describe('MAP-SHIELD — les couches US-shield sont masquées (bruit worker OpenFreeMap)', () => {
  it('ne reconnaît que les couches shield', () => {
    expect(shouldHideIrrelevantShieldLayer('highway-shield-non-us')).toBe(true);
    expect(shouldHideIrrelevantShieldLayer('highway-shield-us-interstate')).toBe(true);
    expect(shouldHideIrrelevantShieldLayer('road_shield_us')).toBe(true);
    expect(shouldHideIrrelevantShieldLayer('road_motorway')).toBe(false);
    expect(shouldHideIrrelevantShieldLayer('water')).toBe(false);
    expect(shouldHideIrrelevantShieldLayer('place_city')).toBe(false);
  });

  it('masque les shield, laisse le reste, et est idempotent', () => {
    const map = stubMap([{ id: 'water' }, { id: 'highway-shield-non-us' }, { id: 'road_shield_us' }]);
    expect(hideIrrelevantShieldLayers(map as never)).toEqual(['highway-shield-non-us', 'road_shield_us']);
    expect(map.calls).toEqual([
      ['highway-shield-non-us', 'visibility', 'none'],
      ['road_shield_us', 'visibility', 'none'],
    ]);

    // Une couche déjà masquée n'est pas retouchée.
    const already = stubMap([{ id: 'highway-shield-non-us', layout: { visibility: 'none' } }]);
    expect(hideIrrelevantShieldLayers(already as never)).toEqual([]);
    expect(already.calls).toEqual([]);
  });
});
