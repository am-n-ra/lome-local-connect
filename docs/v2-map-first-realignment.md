# Omni V2 — Map-first realignment

**Status:** Proposed correction derived from the V2 master and visual audit
**Scope:** Buyer discovery scene only; no S3 business logic changes

## Brainstorm conclusion

Omni is not a card dashboard with a map decoration. It is a geospatial discovery instrument whose primary surface is a living, real MapLibre map. The map must carry geographic meaning before any search is made, while the dock, chrome, results, and facility sheets act as restrained instruments layered above it.

The current V2 does mount a real MapLibre canvas, but the local basemap is too abstract to read as a real map: it contains only simplified land, water, and coastline geometry. The overlay zones also drift from the locked contract: controls are on the right, the chrome is visually heavy, and the mobile globe is clipped by the combined sheet/dock stack.

## Locked decisions

| Decision | Rule |
|---|---|
| Map source | Use a real labelled vector basemap as the primary style, with the deterministic local style as a fail-soft fallback. |
| Projection | Keep MapLibre globe projection at rest; allow normal mercator/local detail through MapLibre camera behavior. |
| Rest camera | Start at a readable world/globe framing, not a decorative isolated circle. Keep the globe centered in the unobstructed scene area. |
| Pins | Preserve the existing facility pin appearance and React marker ownership. Do not replace pins with a new visual system in this slice. |
| Clustering | Do not change the current pin contract in this correction. Advanced clustering remains a later explicit slice. |
| Controls | Place map controls in the lower-left safe zone, independent from the dock and result sheet. |
| Chrome | Keep only a compact brand mark and minimal location control; do not let chrome compete with the map. |
| Dock | One bottom search instrument, compact enough to preserve map context on 320–375 px screens. |
| Results | Results sit above the dock with a bounded sheet; mobile sheet and dock must have a measured gap and never merge visually. |
| Safety | No horizontal overflow; no overlay may cover the recenter/pause controls. |

## Implementation seams

1. Add MapLibre base CSS to the root document so navigation controls and attribution have predictable geometry.
2. Load OpenFreeMap Liberty as the primary map style and retain `/assets/omni-map-style.json` as a one-time fail-soft fallback if the remote style cannot load.
3. Ensure the runtime projection remains globe after either style load.
4. Adjust overlay zoning and mobile heights through the brand layer, not by introducing route-specific inline values.
5. Add screenshot checks for the canvas, map-control side, visible land/water contrast, overlay separation, and overflow at 320, 375, 768, and 1280 px.

## Definition of done

A reviewer can identify a genuine geographic basemap without reading the code; the MapLibre canvas is present at all required widths; the globe remains the visual focus; the search dock, result sheet, and controls occupy distinct zones; and the S1/S2 click-through remains functional.
