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
const OVERPASS_REQUEST_TIMEOUT_MS = 12_000;

type OverpassElement = { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

export async function discoverFromOverpass(bounds: DiscoveryBounds, signal?: AbortSignal): Promise<DiscoveryFacility[]> {
  const [west, south, east, north] = bounds;
  const bbox = `${south},${west},${north},${east}`;
  const query = `[out:json][timeout:8];(nwr["amenity"~"marketplace|market|warehouse|fuel|shop"](${bbox}););out center tags;`;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OVERPASS_REQUEST_TIMEOUT_MS);
    const abortUpstream = () => controller.abort();
    signal?.addEventListener("abort", abortUpstream, { once: true });
    try {
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (!response.ok) continue;
      const payload = await response.json() as { elements?: OverpassElement[] };
      return (payload.elements ?? []).flatMap((element) => {
        const lat = element.lat ?? element.center?.lat; const lng = element.lon ?? element.center?.lon; if (lat === undefined || lng === undefined) return [];
        const tags = element.tags ?? {}; const name = tags.name ?? tags["name:en"] ?? tags.shop ?? "Unnamed public place";
        const category = tags.amenity === "marketplace" || tags.amenity === "market" ? "Market" : tags.shop ?? tags.amenity ?? "Public place";
        return [{ id: `osm-${element.id}`, name, category, lng, lat, source: "osm" as const }];
      });
    } catch {
      if (signal?.aborted) throw new DOMException("Discovery cancelled", "AbortError");
      // A timed-out or unavailable mirror is bounded; continue with the next public mirror.
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abortUpstream);
    }
  }
  throw new Error("Public discovery unavailable");
}
