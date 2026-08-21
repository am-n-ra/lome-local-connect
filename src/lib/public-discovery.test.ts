import { describe, expect, it } from "vitest";
import { discoverInBounds, type DiscoveryFacility } from "./public-discovery";

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
