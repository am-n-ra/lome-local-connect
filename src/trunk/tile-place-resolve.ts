// Tile-tap claim (DEC-V2-30, contract §6): our vector tiles carry NO OSM id (CARTO poi =
// class/subclass/name/rank only, verified on a real tile), so queryRenderedFeatures can only
// ever give a label hint. The OSM reference comes from ONE user-triggered Nominatim reverse
// lookup on the tap coordinates — never bulk, never server-side (no OSM calls from Root).

export interface TileTapPoint {
  longitude: number;
  latitude: number;
  hintName?: string | null;
  hintClass?: string | null;
}

export interface ResolvedTilePlace {
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  /** Null when neither Nominatim nor the tile names the place: the sheet must ask the user. */
  name: string | null;
  category: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
}

export type TilePlaceResolution =
  | { ok: true; data: ResolvedTilePlace }
  | { ok: false; error: string };

function isTappedPoint(point: TileTapPoint): boolean {
  return Number.isFinite(point.longitude) && Number.isFinite(point.latitude)
    && point.latitude >= -90 && point.latitude <= 90
    && point.longitude >= -180 && point.longitude <= 180;
}

export async function resolveTilePlace(
  point: TileTapPoint,
  fetchFn: typeof fetch = fetch,
): Promise<TilePlaceResolution> {
  if (!isTappedPoint(point)) return { ok: false, error: 'Point invalide sur la carte.' };
  let body: Record<string, unknown>;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.latitude}&lon=${point.longitude}&zoom=18&addressdetails=1`;
    const response = await fetchFn(url, { headers: { Accept: 'application/json', 'Accept-Language': 'fr' } });
    if (!response.ok) return { ok: false, error: 'Le service de repérage est indisponible. Réessayez.' };
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, error: 'Le service de repérage est indisponible. Réessayez.' };
  }
  const osmType = body.osm_type;
  if (osmType !== 'node' && osmType !== 'way' && osmType !== 'relation') {
    return { ok: false, error: 'Ce point ne désigne pas un lieu revendicable.' };
  }
  const osmId = Number(body.osm_id);
  if (!Number.isSafeInteger(osmId) || osmId < 1) {
    return { ok: false, error: 'Ce point ne désigne pas un lieu revendicable.' };
  }
  const named = body.namedetails && typeof body.namedetails === 'object' && !Array.isArray(body.namedetails)
    ? (body.namedetails as Record<string, unknown>).name : undefined;
  const name = (typeof named === 'string' && named.trim()) || (typeof point.hintName === 'string' && point.hintName.trim()) || null;
  const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : null;
  const address = typeof body.display_name === 'string' && body.display_name.trim() ? body.display_name.trim() : null;
  const latitude = Number(body.lat);
  const longitude = Number(body.lon);
  return {
    ok: true,
    data: {
      osmType, osmId, name, category, address,
      latitude: Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 ? latitude : point.latitude,
      longitude: Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? longitude : point.longitude,
    },
  };
}
