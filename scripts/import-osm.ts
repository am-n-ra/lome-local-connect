import { neon } from "@neondatabase/serverless";

/**
 * Imports Lomé businesses from OpenStreetMap (Overpass API) as unclaimed
 * listings (status = 'non_reclame'). ODbL data, attribution required in the UI.
 *
 *   DATABASE_URL=... bun scripts/import-osm.ts
 */
const url = process.env["DATABASE_URL"];
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const sql = neon(url);

const OVERPASS = "https://overpass-api.de/api/interpreter";

// Lomé bounding box: south, west, north, east
const BBOX = "6.08,1.13,6.30,1.32";

const QUERY = `
[out:json][timeout:120];
(
  node["shop"](${BBOX});
  way["shop"](${BBOX});
  node["amenity"~"^(pharmacy|restaurant|cafe|fast_food|marketplace|fuel|bakery)$"](${BBOX});
  way["amenity"~"^(pharmacy|restaurant|cafe|fast_food|marketplace|fuel|bakery)$"](${BBOX});
);
out center tags;
`;

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function categorise(tags: Record<string, string>): string {
  const shop = tags["shop"] ?? "";
  const amenity = tags["amenity"] ?? "";
  if (
    ["supermarket", "convenience", "greengrocer", "butcher", "bakery", "alcohol", "beverages"].includes(shop) ||
    ["restaurant", "cafe", "fast_food", "bakery", "marketplace"].includes(amenity)
  ) {
    return "food";
  }
  if (["electronics", "mobile_phone", "computer", "hifi"].includes(shop)) return "electronics";
  if (["clothes", "shoes", "boutique", "fabric", "tailor", "jewelry"].includes(shop)) return "fashion";
  if (["hardware", "doityourself", "building_materials", "paint", "trade"].includes(shop)) return "hardware";
  if (amenity === "pharmacy") return "health";
  return "other";
}

const response = await fetch(OVERPASS, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: `data=${encodeURIComponent(QUERY)}`,
});
if (!response.ok) {
  console.error(`Overpass failed: ${response.status} ${await response.text()}`);
  process.exit(1);
}

const payload = (await response.json()) as { elements: OsmElement[] };
console.log(`Overpass returned ${payload.elements.length} element(s)`);

let inserted = 0;
let skipped = 0;

for (const element of payload.elements) {
  const tags = element.tags ?? {};
  const name = tags["name"]?.trim();
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (!name || lat === undefined || lon === undefined) {
    skipped += 1;
    continue;
  }

  const address = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || null;
  const neighbourhood = tags["addr:suburb"] ?? tags["addr:city"] ?? tags["addr:neighbourhood"] ?? null;
  const phone = tags["phone"] ?? tags["contact:phone"] ?? null;

  await sql.query(
    `INSERT INTO public.facilities
       (market_code, name, category, address, neighbourhood, latitude, longitude, phone,
        status, type, is_online, source, source_ref)
     VALUES ('TG-LOME', $1, $2, $3, $4, $5, $6, $7, 'non_reclame', 'fixe', false, 'osm', $8)
     ON CONFLICT (source, source_ref) WHERE source_ref IS NOT NULL
     DO UPDATE SET name = EXCLUDED.name, latitude = EXCLUDED.latitude,
                   longitude = EXCLUDED.longitude, updated_at = now()`,
    [
      name.slice(0, 120),
      categorise(tags),
      address,
      neighbourhood,
      lat,
      lon,
      phone,
      `${element.type}/${element.id}`,
    ],
  );
  inserted += 1;
}

console.log(`imported/updated ${inserted}, skipped ${skipped} (missing name or position)`);
