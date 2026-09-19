import { describe, expect, it } from "vitest";
import { createGlyphTransformRequest, rewriteOpenFreeMapGlyphUrl } from "./maplibre";

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

describe("CARTO glyph host rerouting", () => {
  const transform = createGlyphTransformRequest();

  it("reroutes glyph requests off the host that 404s Noto Sans Bold", () => {
    expect(
      transform(
        "https://tiles.basemaps.cartocdn.com/fonts/Noto%20Sans%20Bold/0-255.pbf",
        "Glyphs",
      ),
    ).toEqual({
      url: "https://fonts.openmaptiles.org/Noto%20Sans%20Bold/0-255.pbf",
    });
  });

  it("leaves non-glyph resources and healthy glyph hosts untouched", () => {
    const tile = "https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/12/2048/1365.pbf";
    expect(transform(tile, "Tile")).toBeUndefined();
    expect(
      transform(
        "https://tiles.basemaps.cartocdn.com/fonts/Noto%20Sans%20Regular/0-255.pbf",
        "Tile",
      ),
    ).toBeUndefined();
    expect(
      transform("https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/0-255.pbf", "glyphs"),
    ).toBeUndefined();
    expect(
      transform("https://fonts.openmaptiles.org/Noto%20Sans%20Bold/0-255.pbf", "glyphs"),
    ).toBeUndefined();
  });
});
