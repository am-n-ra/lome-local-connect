import { describe, expect, it } from "vitest";
import { mockDiscovery } from "./discovery";

describe("S1 public discovery adapter", () => {
  const lomeBounds = {
    west: 1.1,
    south: 6.05,
    east: 1.3,
    north: 6.22,
    zoom: 10,
  };

  it("returns only source-backed facilities inside the visible bounds", async () => {
    const result = await mockDiscovery({ query: "", bounds: lomeBounds });

    expect(result.facilities.length).toBeGreaterThan(0);
    expect(result.facilities.every((facility) => facility.source === "osm" || facility.source === "public_registry")).toBe(true);
    expect(result.facilities.every((facility) => facility.longitude >= lomeBounds.west && facility.longitude <= lomeBounds.east)).toBe(true);
  });

  it("matches a query without changing the map authority", async () => {
    const result = await mockDiscovery({ query: "pharmacie", bounds: lomeBounds });

    expect(result.facilities).toHaveLength(1);
    expect(result.facilities[0]?.name).toContain("Pharmacie");
    expect(result.bounds).toEqual(lomeBounds);
  });

  it("clusters multiple low-zoom facilities", async () => {
    const result = await mockDiscovery({ query: "", bounds: { ...lomeBounds, zoom: 5 } });

    expect(result.facilities.length).toBeGreaterThan(1);
    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0]?.count).toBe(result.facilities.length);
  });

  it("returns an honest empty result", async () => {
    const result = await mockDiscovery({ query: "introuvable", bounds: lomeBounds });

    expect(result.facilities).toEqual([]);
    expect(result.clusters).toEqual([]);
  });
});
