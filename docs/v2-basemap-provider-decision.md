# Omni V2 basemap provider decision

## Decision

Use the OpenFreeMap Liberty MapLibre style as the primary production basemap:

`https://tiles.openfreemap.org/styles/liberty`

Keep `/assets/omni-map-style.json` as a fail-soft local fallback. OpenFreeMap documents this style as a MapLibre integration and identifies the underlying attribution as OpenMapTiles and OpenStreetMap contributors [1].

## Why this choice

Omni needs a genuine labelled vector basemap without introducing an API key or coupling the V2 branch to a paid provider during the first vertical slices. OpenFreeMap provides a direct MapLibre style URL and supports custom styles/self-hosting later [1]. The local style remains necessary because a public hosted provider is not an SLA-backed dependency.

## Attribution and policy

The map must display visible attribution for OpenStreetMap contributors and OpenMapTiles. Omni will use MapLibre’s attribution control rather than hiding attribution beneath the search dock. The project will not use `tile.openstreetmap.org` raster tiles directly: the OSM Foundation states that its standard raster tile service is best-effort, requires visible attribution and identifiable traffic, and must not be used for bulk/offline downloading [2].

## Fallback behaviour

If the primary style fails before loading, the map switches once to the local deterministic style. The fallback preserves the MapLibre globe and facility markers, so discovery remains usable instead of showing an empty scene. The application does not prefetch, scrape, or bulk-download tiles.

## References

[1]: https://openfreemap.org/quick_start/ "OpenFreeMap Quick Start Guide"
[2]: https://operations.osmfoundation.org/policies/tiles/ "OpenStreetMap Foundation Tile Usage Policy"
