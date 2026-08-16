import { query } from "@/lib/db.server";

/**
 * On-demand worldwide coverage of `unclaimed` facilities.
 *
 * When the buyer pans the map into an area we never imported, we fetch the
 * commercial POIs of that tile from OpenStreetMap (Overpass), normalise them
 * and store them as `unclaimed` facilities. Each tile is only fetched once.
 */

export type Bounds = { minLat: number; minLng: number; maxLat: number; maxLng: number };

/** Tiles of ~0.05° (~5.5 km) keep Overpass requests small and cacheable. */
const TILE_SIZE = 0.05;
/** Below this zoom the viewport is far too wide to import anything sane. */
export const MIN_IMPORT_ZOOM = 13;
const MAX_TILES_PER_REQUEST = 4;
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const LOME_BOUNDS: Bounds = { minLat: 6.05, minLng: 1.05, maxLat: 6.35, maxLng: 1.45 };

function marketFor(lat: number, lng: number): string {
  return lat >= LOME_BOUNDS.minLat &&
    lat <= LOME_BOUNDS.maxLat &&
    lng >= LOME_BOUNDS.minLng &&
    lng <= LOME_BOUNDS.maxLng
    ? "TG-LOME"
    : "GLOBAL";
}

function tileKey(lat: number, lng: number): string {
  return `${Math.floor(lat / TILE_SIZE)}:${Math.floor(lng / TILE_SIZE)}`;
}

function tilesFor(bounds: Bounds): { key: string; bounds: Bounds }[] {
  const tiles: { key: string; bounds: Bounds }[] = [];
  const latStart = Math.floor(bounds.minLat / TILE_SIZE);
  const latEnd = Math.floor(bounds.maxLat / TILE_SIZE);
  const lngStart = Math.floor(bounds.minLng / TILE_SIZE);
  const lngEnd = Math.floor(bounds.maxLng / TILE_SIZE);
  for (let y = latStart; y <= latEnd; y += 1) {
    for (let x = lngStart; x <= lngEnd; x += 1) {
      tiles.push({
        key: `${y}:${x}`,
        bounds: {
          minLat: y * TILE_SIZE,
          minLng: x * TILE_SIZE,
          maxLat: (y + 1) * TILE_SIZE,
          maxLng: (x + 1) * TILE_SIZE,
        },
      });
      if (tiles.length >= MAX_TILES_PER_REQUEST * 4) return tiles;
    }
  }
  return tiles;
}

const CATEGORY_BY_TAG: Record<string, string> = {
  supermarket: "food",
  convenience: "food",
  grocery: "food",
  bakery: "food",
  butcher: "food",
  greengrocer: "food",
  restaurant: "food",
  fast_food: "food",
  cafe: "food",
  bar: "food",
  pharmacy: "health",
  chemist: "health",
  doctors: "health",
  clinic: "health",
  hospital: "health",
  dentist: "health",
  clothes: "fashion",
  shoes: "fashion",
  boutique: "fashion",
  tailor: "fashion",
  jewelry: "fashion",
  hairdresser: "beauty",
  beauty: "beauty",
  cosmetics: "beauty",
  mobile_phone: "tech",
  electronics: "tech",
  computer: "tech",
  hardware: "home",
  doityourself: "home",
  furniture: "home",
  car_repair: "services",
  car_parts: "services",
  fuel: "services",
  bank: "services",
  laundry: "services",
  bicycle: "services",
};

function normaliseCategory(tags: Record<string, string>): string {
  const candidates = [tags["shop"], tags["amenity"], tags["craft"], tags["office"]];
  for (const candidate of candidates) {
    if (candidate && CATEGORY_BY_TAG[candidate]) return CATEGORY_BY_TAG[candidate]!;
  }
  return "other";
}

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

async function fetchOverpass(bounds: Bounds): Promise<OverpassElement[]> {
  const bbox = `${bounds.minLat},${bounds.minLng},${bounds.maxLat},${bounds.maxLng}`;
  const body = `[out:json][timeout:25];(
    node["shop"](${bbox});
    way["shop"](${bbox});
    node["amenity"~"restaurant|cafe|fast_food|bar|pharmacy|marketplace|fuel|bank|clinic|doctors|hospital|dentist"](${bbox});
    way["amenity"~"restaurant|cafe|fast_food|bar|pharmacy|marketplace|fuel|bank|clinic|doctors|hospital|dentist"](${bbox});
    node["craft"](${bbox});
  );out center 400;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(body)}`,
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as { elements?: OverpassElement[] };
      return payload.elements ?? [];
    } catch {
      // Try the next mirror.
    }
  }
  return [];
}

async function importTile(key: string, bounds: Bounds): Promise<number> {
  const elements = await fetchOverpass(bounds);
  let inserted = 0;

  for (const element of elements) {
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    const tags = element.tags ?? {};
    const name = (tags["name"] ?? "").trim();
    if (!name || lat == null || lng == null) continue;

    const rows = await query<{ id: string }>(
      `INSERT INTO public.facilities
         (market_code, name, category, address, neighbourhood, latitude, longitude, phone,
          status, type, is_online, source, source_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unclaimed', 'fixe', false, 'osm', $9)
       ON CONFLICT (source, source_ref) WHERE source_ref IS NOT NULL DO NOTHING
       RETURNING id`,
      [
        marketFor(lat, lng),
        name.slice(0, 160),
        normaliseCategory(tags),
        [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ").slice(0, 200) ||
          null,
        (tags["addr:suburb"] ?? tags["addr:city"] ?? null)?.slice(0, 120) ?? null,
        lat,
        lng,
        (tags["phone"] ?? tags["contact:phone"] ?? null)?.slice(0, 40) ?? null,
        `${element.type}/${element.id}`,
      ],
    );
    if (rows.length > 0) inserted += 1;
  }

  await query(
    `INSERT INTO public.osm_tiles (tile_key, min_lat, min_lng, max_lat, max_lng, facility_count)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tile_key) DO UPDATE SET facility_count = EXCLUDED.facility_count, fetched_at = now()`,
    [key, bounds.minLat, bounds.minLng, bounds.maxLat, bounds.maxLng, inserted],
  );
  return inserted;
}

/**
 * Makes sure the visible area has `unclaimed` coverage, importing at most a few
 * tiles per call so one pan never blocks the response for long.
 */
export async function ensureCoverage(bounds: Bounds, zoom: number): Promise<number> {
  if (zoom < MIN_IMPORT_ZOOM) return 0;
  const tiles = tilesFor(bounds);
  if (tiles.length === 0) return 0;

  const known = await query<{ tile_key: string }>(
    `SELECT tile_key FROM public.osm_tiles WHERE tile_key = ANY($1::text[])`,
    [tiles.map((tile) => tile.key)],
  );
  const seen = new Set(known.map((row) => row.tile_key));
  const missing = tiles.filter((tile) => !seen.has(tile.key)).slice(0, MAX_TILES_PER_REQUEST);
  if (missing.length === 0) return 0;

  const results = await Promise.allSettled(
    missing.map((tile) => importTile(tile.key, tile.bounds)),
  );
  return results.reduce(
    (total, result) => total + (result.status === "fulfilled" ? result.value : 0),
    0,
  );
}

export { tileKey };
