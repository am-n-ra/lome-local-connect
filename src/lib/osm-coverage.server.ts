import { query } from "./db.server";

export type CoverageBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type CoverageViewport = CoverageBounds & {
  zoom: number;
};

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = { elements?: OverpassElement[] };

type CoverageTile = CoverageBounds & {
  tileKey: string;
  zoom: number;
  tileX: number;
  tileY: number;
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const COVERAGE_ZOOM = 14;
const MAX_IMPORT_TILES = 6;
const TILE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MAX_BOUNDS_SPAN = 0.32;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeLongitude(value: number): number {
  return Math.min(180, Math.max(-180, value));
}

function validateBounds(bounds: CoverageViewport): CoverageViewport {
  const south = clamp(bounds.south, -85, 85);
  const north = clamp(bounds.north, south, 85);
  const west = normalizeLongitude(bounds.west);
  const east = normalizeLongitude(bounds.east);
  return { west, south, east, north, zoom: clamp(bounds.zoom, 0, 22) };
}

function lonToTileX(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const radians = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2) * 2 ** zoom);
}

function tileXToLon(x: number, zoom: number): number {
  return (x / 2 ** zoom) * 360 - 180;
}

function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

function boundsToTiles(viewport: CoverageViewport): CoverageTile[] {
  const bounds = validateBounds(viewport);
  if (bounds.zoom < 9 || bounds.north - bounds.south > MAX_BOUNDS_SPAN) return [];

  const zoom = COVERAGE_ZOOM;
  const minX = lonToTileX(bounds.west, zoom);
  const maxX = lonToTileX(bounds.east, zoom);
  const minY = latToTileY(bounds.north, zoom);
  const maxY = latToTileY(bounds.south, zoom);
  const tiles: CoverageTile[] = [];

  for (let tileY = minY; tileY <= maxY && tiles.length < MAX_IMPORT_TILES; tileY += 1) {
    for (let tileX = minX; tileX <= maxX && tiles.length < MAX_IMPORT_TILES; tileX += 1) {
      const west = tileXToLon(tileX, zoom);
      const east = tileXToLon(tileX + 1, zoom);
      const north = tileYToLat(tileY, zoom);
      const south = tileYToLat(tileY + 1, zoom);
      tiles.push({
        tileKey: `osm:${zoom}:${tileX}:${tileY}`,
        zoom,
        tileX,
        tileY,
        west: Math.max(bounds.west, west),
        south: Math.max(bounds.south, south),
        east: Math.min(bounds.east, east),
        north: Math.min(bounds.north, north),
      });
    }
  }

  return tiles.filter((tile) => tile.east > tile.west && tile.north > tile.south);
}

function normalizeCategory(tags: Record<string, string>): string {
  const raw = [tags["shop"], tags["amenity"], tags["office"], tags["craft"], tags["tourism"]]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/supermarket|grocery|convenience|market|bakery|butcher/.test(raw)) return "food";
  if (/restaurant|cafe|bar|fast_food/.test(raw)) return "restaurant";
  if (/clothes|fashion|shoes|jewelry|beauty|hairdresser/.test(raw)) return "fashion";
  if (/pharmacy|clinic|hospital|dentist|doctors/.test(raw)) return "health";
  if (/car|bicycle|motorcycle|repair|parts/.test(raw)) return "automotive";
  if (/school|college|university|kindergarten/.test(raw)) return "education";
  if (/hotel|guest_house|hostel|tourism/.test(raw)) return "hospitality";
  if (/hardware|electronics|mobile_phone|computer/.test(raw)) return "technology";
  if (/bank|insurance|lawyer|accountant|real_estate/.test(raw)) return "services";
  return "other";
}

function elementPosition(element: OverpassElement): { lat: number; lng: number } | null {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function tileContains(tile: CoverageTile, point: { lat: number; lng: number }): boolean {
  return (
    point.lat >= tile.south &&
    point.lat <= tile.north &&
    point.lng >= tile.west &&
    point.lng <= tile.east
  );
}

function overpassQuery(tile: CoverageTile): string {
  const box = `${tile.south},${tile.west},${tile.north},${tile.east}`;
  return `[out:json][timeout:25];(node["name"](${box});way["name"]["shop"](${box});way["name"]["amenity"](${box});way["name"]["office"](${box});way["name"]["craft"](${box}););out center tags;`;
}

async function fetchOverpass(tile: CoverageTile): Promise<OverpassElement[]> {
  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: overpassQuery(tile) }),
        signal: AbortSignal.timeout(28000),
      });
      if (!response.ok) throw new Error(`Overpass ${response.status}`);
      const payload = (await response.json()) as OverpassResponse;
      return payload.elements ?? [];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Overpass indisponible");
}

async function claimTile(tile: CoverageTile): Promise<boolean> {
  const existing = await query<{ status: string; expires_at: string | null }>(
    `SELECT status, expires_at FROM public.osm_tiles WHERE tile_key = $1 LIMIT 1`,
    [tile.tileKey],
  );
  const cached = existing[0];
  if (
    cached &&
    cached.status !== "failed" &&
    cached.expires_at &&
    new Date(cached.expires_at).getTime() > Date.now()
  ) {
    return false;
  }

  await query(
    `INSERT INTO public.osm_tiles
       (tile_key, zoom, tile_x, tile_y, west, south, east, north, status, fetched_at, expires_at, error_message, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NULL, NULL, NULL, now())
     ON CONFLICT (tile_key) DO UPDATE SET
       status = 'pending', fetched_at = NULL, expires_at = NULL, error_message = NULL, updated_at = now()`,
    [tile.tileKey, tile.zoom, tile.tileX, tile.tileY, tile.west, tile.south, tile.east, tile.north],
  );
  return true;
}

async function markTile(tile: CoverageTile, status: "ready" | "empty" | "failed", error?: string) {
  await query(
    `UPDATE public.osm_tiles
     SET status = $2, fetched_at = now(), expires_at = now() + interval '30 days',
         error_message = $3, updated_at = now()
     WHERE tile_key = $1`,
    [tile.tileKey, status, error ?? null],
  );
}

function marketForPoint(point: { lat: number; lng: number }): string {
  // Keep local-market semantics for Grand Lomé and its immediate border area;
  // all other imported points belong to the global catch-all context.
  const nearLome = point.lat >= 5.85 && point.lat <= 6.45 && point.lng >= 0.85 && point.lng <= 1.55;
  return nearLome ? "TG-LOME" : "GLOBAL";
}

async function importElements(tile: CoverageTile, elements: OverpassElement[]): Promise<number> {
  const seen = new Set<string>();
  let imported = 0;
  for (const element of elements) {
    const position = elementPosition(element);
    const tags = element.tags ?? {};
    const name = tags["name"]?.trim();
    if (!position || !name || !tileContains(tile, position)) continue;
    const sourceRef = `osm:${element.type}/${element.id}`;
    if (seen.has(sourceRef)) continue;
    seen.add(sourceRef);
    await query(
      `INSERT INTO public.facilities
        (market_code, name, category, description, address, neighbourhood, latitude, longitude,
         status, type, is_online, source, source_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unclaimed', 'fixe', true, 'osm', $9)
       ON CONFLICT (source, source_ref) WHERE source_ref IS NOT NULL DO UPDATE SET
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         address = EXCLUDED.address,
         neighbourhood = EXCLUDED.neighbourhood,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         updated_at = now()
       WHERE public.facilities.status = 'unclaimed'`,
      [
        marketForPoint(position),
        name.slice(0, 180),
        normalizeCategory(tags),
        tags["description"]?.slice(0, 500) ?? null,
        [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ") || null,
        tags["addr:suburb"] ?? tags["addr:district"] ?? null,
        position.lat,
        position.lng,
        sourceRef,
      ],
    );
    imported += 1;
  }
  return imported;
}

export async function ensureOsmCoverage(
  viewport: CoverageViewport,
): Promise<{ imported: number; tiles: number }> {
  const tiles = boundsToTiles(viewport);
  let imported = 0;
  let processed = 0;
  for (const tile of tiles) {
    if (!(await claimTile(tile))) continue;
    processed += 1;
    try {
      const elements = await fetchOverpass(tile);
      imported += await importElements(tile, elements);
      await markTile(tile, elements.length ? "ready" : "empty");
    } catch (error) {
      await markTile(tile, "failed", error instanceof Error ? error.message : "Overpass error");
    }
  }
  return { imported, tiles: processed };
}
