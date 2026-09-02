# Globe v2 diagnostics

The resting map is the real MapLibre globe at zoom approximately 0.8, with the OpenFreeMap vector style retained through initialization and projection changes. Idle rotation now moves the map center longitude at a calibrated positive velocity of approximately 2.8 degrees per second while bearing and pitch remain fixed at zero. The approved visual sequence is Africa/Europe → Asia → the Americas → Africa/Europe, like a person slowly spinning a physical globe around its vertical axis.

The resting discovery feed is populated from the anonymous public facility API with a bounded source-backed set. The current representative market is Lomé, so many facilities occupy a compact geographic area and can overlap at globe scale; individual native pin markers remain mounted and become spatially distinct as the user zooms. No decorative scatter or visual cluster bubble is used.

The former CARTO raster fallback has been removed from the buyer map path because it produced a visually unrelated flat gray map and could rebuild the projection and custom facility layers. If the vector style fails before readiness, the MapLibre canvas now exposes a truthful retry/status surface rather than silently presenting a different basemap.

## Live correction evidence

A clean browser reload showed the same pale vector globe with OpenFreeMap/OpenStreetMap attribution, the non-blocking location prompt, and no delayed automatic local zoom. After the public feed arrived, 32 facility marker buttons were exposed and an orange Omni pin was visibly rendered at the market coordinate while the globe rotated through the requested longitudinal sequence.

An explicit `rice` search stopped the resting rotation, reset to the globe, displayed the black continent/region boundary choreography, and completed with four individual result pins and cards on the same vector map at local framing. The search reveal did not trigger the old raster fallback or leave facility markers hidden.

## Remaining non-blocking warnings

The browser still reports OpenFreeMap font-range 404 warnings for unavailable glyph ranges and a TanStack route code-splitting warning. Neither warning prevented globe rendering, boundary rendering, facility pin rendering, or the staged search reveal.
