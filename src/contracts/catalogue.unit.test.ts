import { describe, expect, it } from "vitest";
import { filterPublicProducts, mockCatalogue } from "./catalogue";
import type { PublicFacility } from "./discovery";

const facility: PublicFacility = {
  id: "fixture-lome-market",
  name: "Marché central",
  category: "Marché",
  latitude: 6.1316,
  longitude: 1.2228,
  source: "osm",
  status: "unclaimed",
  city: "Lomé",
  productCount: 12,
};

describe("S2 public catalogue contract", () => {
  it("loads a public facility detail with media and products", async () => {
    const result = await mockCatalogue(facility);
    expect(result.facility.id).toBe(facility.id);
    expect(result.facility.media[0]?.kind).toBe("facility");
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products.every((product) => product.facilityId === facility.id)).toBe(true);
  });

  it("filters products without changing the source result", async () => {
    const result = await mockCatalogue(facility);
    const filtered = filterPublicProducts(result.products, "riz");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toContain("Riz");
    expect(result.products).toHaveLength(2);
  });

  it("returns an empty public catalogue for an unknown facility", async () => {
    const result = await mockCatalogue({ ...facility, id: "unknown-facility" });
    expect(result.products).toEqual([]);
    expect(result.facility.catalogueCount).toBe(0);
  });

  it("keeps availability unknown separate from publicly listed", async () => {
    const result = await mockCatalogue({ ...facility, id: "fixture-adewui-pharmacy" });
    expect(result.products[0]?.availability).toBe("availability_unknown");
  });
});
