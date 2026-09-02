import { describe, expect, it } from "vitest";
import { getProduct, listCatalogue } from "./catalogue";

describe("catalogue", () => {
  it("lists only products owned by the selected facility", () => {
    expect(listCatalogue("fac-lome-market").map((product) => product.id)).toEqual(["prod-lome-tomato", "prod-lome-rice"]);
    expect(listCatalogue("fac-accra-market")).toHaveLength(1);
  });
  it("returns a typed product by id and rejects unknown products", () => {
    expect(getProduct("prod-lome-rice")?.unit).toBe("50 kg bag");
    expect(getProduct("missing-product")).toBeUndefined();
  });
});
