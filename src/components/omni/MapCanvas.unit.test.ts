import { describe, expect, it } from "vitest";
import { readViewportSnapshot } from "./MapCanvas";
import type { MapInstance } from "@/lib/maplibre";

function createMap(bounds: {
  west: number;
  south: number;
  east: number;
  north: number;
  zoom: number;
}) {
  return {
    getBounds: () => ({
      getWest: () => bounds.west,
      getSouth: () => bounds.south,
      getEast: () => bounds.east,
      getNorth: () => bounds.north,
    }),
    getZoom: () => bounds.zoom,
  } as unknown as MapInstance;
}

describe("readViewportSnapshot", () => {
  it("returns a normalized viewport for a globe-sized map", () => {
    expect(
      readViewportSnapshot(createMap({ west: -210, south: -91, east: 210, north: 91, zoom: 0.8 })),
    ).toEqual({ west: -180, south: -85, east: 180, north: 85, zoom: 0.8 });
  });

  it("orders latitude bounds and clamps the zoom to the server contract", () => {
    expect(
      readViewportSnapshot(createMap({ west: 1, south: 20, east: 2, north: -20, zoom: 30 })),
    ).toEqual({ west: 1, south: -20, east: 2, north: 20, zoom: 24 });
  });

  it("returns null when MapLibre has no bounds yet", () => {
    const map = { getBounds: () => undefined, getZoom: () => 1 } as unknown as MapInstance;
    expect(readViewportSnapshot(map)).toBeNull();
  });
});
