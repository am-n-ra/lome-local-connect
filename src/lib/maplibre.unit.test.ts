import { describe, expect, it } from "vitest";
import { rewriteOpenFreeMapGlyphUrl } from "./maplibre";

describe("OpenFreeMap glyph URL compatibility", () => {
  it("rewrites unavailable Open Sans variants to served Noto Sans variants", () => {
    expect(
      rewriteOpenFreeMapGlyphUrl(
        "https://tiles.openfreemap.org/fonts/Open%20Sans%20Bold/0-255.pbf",
      ),
    ).toBe("https://tiles.openfreemap.org/fonts/Noto%20Sans%20Bold/0-255.pbf");

    expect(
      rewriteOpenFreeMapGlyphUrl(
        "https://tiles.openfreemap.org/fonts/Open%20Sans%20Regular/256-511.pbf",
      ),
    ).toBe("https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/256-511.pbf");
  });

  it("leaves unrelated resource URLs unchanged", () => {
    const url = "https://tiles.openfreemap.org/tiles/12/2048/1365.pbf";
    expect(rewriteOpenFreeMapGlyphUrl(url)).toBe(url);
  });
});
