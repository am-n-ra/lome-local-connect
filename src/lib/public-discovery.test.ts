import { afterEach, describe, expect, it, vi } from "vitest";
import { discoverFromOverpass, discoverInBounds, type DiscoveryFacility } from "./public-discovery";

afterEach(() => vi.restoreAllMocks());

const facilities: DiscoveryFacility[] = [
  { id: "west", name: "West Market", category: "Produce", lng: -1, lat: 6 },
  { id: "east", name: "East Hub", category: "Wholesale", lng: 10, lat: 6 },
  { id: "date-west", name: "Pacific West", category: "Produce", lng: 175, lat: 0 },
  { id: "date-east", name: "Pacific East", category: "Produce", lng: -175, lat: 0 },
];

describe("discoverInBounds", () => {
  it("filters by bounds and normalized query", () => {
    expect(discoverInBounds(facilities, [-2, 5, 2, 7], "market").map((f) => f.id)).toEqual(["west"]);
  });
  it("supports bounds crossing the international date line", () => {
    expect(discoverInBounds(facilities, [170, -5, -170, 5]).map((f) => f.id)).toEqual(["date-west", "date-east"]);
  });
  it("returns all facilities when bounds and query are empty", () => {
    expect(discoverInBounds(facilities, null)).toHaveLength(4);
  });
});

describe("discoverFromOverpass", () => {
  it("falls back to the next mirror when the first endpoint fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockRejectedValueOnce(new Error("primary mirror unavailable"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elements: [{ id: 42, lat: 6.13, lon: 1.22, tags: { name: "Lome Market", amenity: "marketplace" } }] }),
      } as Response);

    await expect(discoverFromOverpass([-1.4, 5.9, 1.8, 6.5])).resolves.toEqual([
      { id: "osm-42", name: "Lome Market", category: "Market", lng: 1.22, lat: 6.13, source: "osm" },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
