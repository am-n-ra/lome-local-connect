
## UX debt ring observation — 2026-08-27 14:36 UTC

After commit `77a343c` was pushed to `omni-v2-rebuild`, GitHub reported the Vercel Preview check as completed/success. A fresh navigation to https://omni.sparkafrika.online/ showed the map canvas and controls immediately in the DOM, while the visible status initially remained `Chargement de la carte`. The screenshot still showed a predominantly white canvas during the observed initial window; final tile rendering was not yet confirmed in this single observation. The account orb was anonymous (`J5`) in the sandbox browser, so Admin menu visibility could not be tested without an authenticated browser session.

The new code now keeps the canvas visible during loading, only renders the user-position overlay once `mapStatus=ready`, applies a grayscale/contrast filter to the raster fallback, retries account capabilities after session synchronization delays, restores the `admin-roles` Auth return path, and embeds `FieldPilotLocationMap` in Seller facility creation. Further production proof must wait for final tile settle and an authenticated Admin session.

## Post-`9f299f1` production observation — 2026-08-27 14:42 UTC

Vercel accepted deployment `dpl_5Yzft5dkthP4b2ZuN4F2bMiYyyKM` for commit `9f299f1`, state BUILDING at the time of inspection, target production. The production alias was reloaded immediately after the build wait: first frame showed a pale loading surface with spinner; settled observation showed the DOM and canvas present but the visible status still `Chargement de la carte` and a white canvas. The account orb showed `DE` in the persisted sandbox browser session, but no authenticated account menu was opened. This indicates the production alias can still expose a prolonged map readiness state; the monochrome filter cannot be visually confirmed until a basemap canvas paints. Treat map readiness as an open production issue, not closed by the CSS-only patch.

## Post-`56b5fd5` production observation — 2026-08-27 14:48 UTC

Deployment `56b5fd5` was READY on the branch production target before reload. The public alias showed controls immediately and a pale canvas; after settle, the DOM reported `data-basemap="raster"`, `data-projection="mercator"`, `data-map-status="ready"`, but the visual canvas remained white and the page text remained `Chargement de la carte`. Network resources included successful OSM raster tile requests (`tile.openstreetmap.org/...png`, status 200) and WebGL context was not lost. This narrows the defect to MapLibre raster compositing/rendering in the current fallback path, not network reachability, CSS filter, or the initial UI shell. The globe-rotation guard is active in source, but this proof is not yet a functional map pass.
