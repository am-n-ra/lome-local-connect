export type DiscoveryFacility = { id: string; name: string; category: string; lng: number; lat: number; source?: "fixture" | "osm" };
export type DiscoveryBounds = [west: number, south: number, east: number, north: number];

export function discoverInBounds(facilities: DiscoveryFacility[], bounds: DiscoveryBounds | null, query = "") {
  const normalized = query.trim().toLocaleLowerCase();
  return facilities.filter((facility) => {
    const inLatitude = !bounds || (facility.lat >= bounds[1] && facility.lat <= bounds[3]);
    const crossesDateLine = Boolean(bounds && bounds[0] > bounds[2]);
    const inLongitude = !bounds || (crossesDateLine ? facility.lng >= bounds[0] || facility.lng <= bounds[2] : facility.lng >= bounds[0] && facility.lng <= bounds[2]);
    const matchesQuery = !normalized || `${facility.name} ${facility.category}`.toLocaleLowerCase().includes(normalized);
    return inLatitude && inLongitude && matchesQuery;
  });
}

const OVERPASS_ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

export async function discoverFromOverpass(bounds: DiscoveryBounds, signal?: AbortSignal): Promise<DiscoveryFacility[]> {
  const [west, south, east, north] = bounds;
  const bbox = `${south},${west},${north},${east}`;
  const query = `[out:json][timeout:8];(nwr["amenity"~"marketplace|market|warehouse|fuel|shop"](${bbox}););out center tags;`;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { signal });
      if (!response.ok) continue;
      const payload = await response.json() as { elements?: Array<{ id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> };
      return (payload.elements ?? []).flatMap((element) => {
        const lat = element.lat ?? element.center?.lat; const lng = element.lon ?? element.center?.lon; if (lat === undefined || lng === undefined) return [];
        const tags = element.tags ?? {}; const name = tags.name ?? tags["name:en"] ?? tags.shop ?? "Unnamed public place";
        const category = tags.amenity === "marketplace" || tags.amenity === "market" ? "Market" : tags.shop ?? tags.amenity ?? "Public place";
        return [{ id: `osm-${element.id}`, name, category, lng, lat, source: "osm" as const }];
      });
    } catch { /* try the next public mirror, then let caller use fallback */ }
  }
  throw new Error("Public discovery unavailable");
}
