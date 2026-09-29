import { describe, expect, it, vi } from 'vitest';
import { resolveTilePlace } from './tile-place-resolve';

function nominatim(body: unknown, ok = true): typeof fetch {
  return (vi.fn(async () => new Response(JSON.stringify(body), { status: ok ? 200 : 503 }))) as unknown as typeof fetch;
}

describe('tile-tap place resolution contract', () => {
  it('resolves an OSM reference from tap coordinates through one reverse lookup', async () => {
    const fetchFn = nominatim({
      osm_type: 'node', osm_id: 452001, lat: '6.1373', lon: '1.2225',
      category: 'amenity', display_name: 'Pharmacie, Lomé, Togo',
      namedetails: { name: 'Pharmacie du Port' },
    });
    await expect(resolveTilePlace({ longitude: 1.2224, latitude: 6.1372 }, fetchFn)).resolves.toEqual({
      ok: true,
      data: {
        osmType: 'node', osmId: 452001, name: 'Pharmacie du Port', category: 'amenity',
        address: 'Pharmacie, Lomé, Togo', latitude: 6.1373, longitude: 1.2225,
      },
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const url = String((fetchFn as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0]);
    expect(url).toContain('nominatim.openstreetmap.org/reverse');
    expect(url).toContain('lat=6.1372');
  });
  it('falls back to the tile label when Nominatim names nothing, and to tap coords on bad geometry', async () => {
    const fetchFn = nominatim({ osm_type: 'way', osm_id: 77, lat: 'north', lon: 'east', category: '', namedetails: {} });
    await expect(resolveTilePlace({ longitude: 1.22, latitude: 6.13, hintName: 'Atelier' }, fetchFn)).resolves.toEqual({
      ok: true,
      data: {
        osmType: 'way', osmId: 77, name: 'Atelier', category: null, address: null,
        latitude: 6.13, longitude: 1.22,
      },
    });
  });
  it('returns a null name when nobody names the place, never an invented one', async () => {
    const fetchFn = nominatim({ osm_type: 'relation', osm_id: 9, lat: '6.1', lon: '1.2', namedetails: {} });
    const result = await resolveTilePlace({ longitude: 1.2, latitude: 6.1 }, fetchFn);
    expect(result).toEqual({
      ok: true,
      data: {
        osmType: 'relation', osmId: 9, name: null, category: null, address: null,
        latitude: 6.1, longitude: 1.2,
      },
    });
  });
  it('refuses a non-place reference or a bad id before any sheet', async () => {
    await expect(resolveTilePlace({ longitude: 1.2, latitude: 6.1 }, nominatim({ osm_type: 'area', osm_id: 1 }))).resolves.toEqual({
      ok: false, error: 'Ce point ne désigne pas un lieu revendicable.',
    });
    await expect(resolveTilePlace({ longitude: 1.2, latitude: 6.1 }, nominatim({ osm_type: 'node', osm_id: 0 }))).resolves.toEqual({
      ok: false, error: 'Ce point ne désigne pas un lieu revendicable.',
    });
  });
  it('never calls the lookup with junk coordinates and reports an outage honestly', async () => {
    const fetchFn = vi.fn(async () => new Response('{}')) as unknown as typeof fetch;
    await expect(resolveTilePlace({ longitude: Number.NaN, latitude: 6.1 }, fetchFn)).resolves.toEqual({
      ok: false, error: 'Point invalide sur la carte.',
    });
    expect(fetchFn).not.toHaveBeenCalled();
    const down = vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    await expect(resolveTilePlace({ longitude: 1.2, latitude: 6.1 }, down)).resolves.toEqual({
      ok: false, error: 'Le service de repérage est indisponible. Réessayez.',
    });
  });
});
