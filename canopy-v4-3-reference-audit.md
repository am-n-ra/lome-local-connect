# Canopy V4.3 reference audit — 2026-08-25

## New owner reference

The attached text describes a MapLibre-native globe using the OpenFreeMap Positron vector style, a full-screen map shell, a native globe projection, calm longitudinal orbit around approximately 2.8 degrees per second, a staged world → continent → country → region/city → local reveal, vector layers progressively exposing roads/labels, and native clustered facility features. It also describes semantic colored pins and dynamic worldwide unclaimed-facility discovery via bounds/Overpass.

The standing Omni authority keeps the important visual/behavioral intent but retains two explicit exclusions: the reference’s literal `Votre position` chip is not part of Omni, and the heavy selected-region highlight is not part of Omni. Existing Root/API, privacy, Auth, claim, availability, Seller/Reviewer, OSM-import and multi-product boundaries remain unchanged.

## Current implementation delta

The current `TrunkMap` uses a direct static `new Map` controller with OpenFreeMap Liberty, its Natural Earth raster silhouette and a fallback `/omni-local-style.json` after an eight-second timer. Globe contrast is achieved through grayscale/inversion/brightness treatment. Native facility GeoJSON layers and the progressive reveal helper exist, but the V4.2 canonical result proof showed a blank canvas at mercator zoom `12.80`; vector street/boundary and moving native-pin behavior remain unproven.

## Positron lifecycle experiment

A bounded local experiment changed only the remote style from Liberty to Positron and supplied `projection: { type: 'globe' }` at construction, while leaving the fallback timer in place. The page still reported `Carte active` after the wait, but the canvas remained a blank white field. This does not yet prove that the constructor projection is irrelevant because the current fallback/status lifecycle can mask provider failure; a direct style-loaded/error diagnostic is required before choosing the next architecture.

The legacy `origin/main` implementation differs in three material ways: it loads MapLibre through a `useMapLibreState` dynamic wrapper, constructs Positron with the globe projection from the first frame, and treats style readiness/error as an explicit state instead of replacing the provider with a raster fallback. It also re-applies native layers after style readiness and changes label/boundary treatment as zoom changes.

## Decision boundary

The smallest credible next experiment is to port the legacy wrapper lifecycle into the current `TrunkMap` without touching business contracts, then test Positron with explicit `load`/`style.load`/`error` diagnostics and no silent raster substitution. Only if `isStyleLoaded`, source-loaded state, vector PBF activity and visible globe frames pass should the provider change be kept. Worldwide Overpass enrichment and broader OSM importer work remain outside this Canopy gate and must not be claimed from this visual reference alone.


## Positron test result

At local `390×844`, after waiting past the eight-second lifecycle window, the DOM reported `data-projection="globe"`, `data-zoom="1.35"`, `data-camera-mode="resting_globe"` and `data-rotation="rotating`, while the canvas remained blank white. Public resources included the Positron style, `/planet` TileJSON and sprite JSON/PNG only; no vector `.pbf`, glyph `.pbf` or Natural Earth raster request appeared. The current `Carte active`/rotation state is therefore not sufficient evidence of loaded Positron vector content. The next experiment must expose explicit style/source readiness without allowing the fallback timer to mask failure.


## Diagnostic setup

A temporary DEV-only `window.__omniMap` reference was added solely to inspect `isStyleLoaded`, `areTilesLoaded`, source metadata and source-loaded state on a fresh Positron instance. It is not a product feature and must be removed before commit.


## Decisive Positron diagnostic

On a fresh instance, the map object exists and the style contains 59 layers plus sources `ne2_shaded`, `openmaptiles` and `omni-v2-facilities`. The `openmaptiles` source is a vector source with resolved direct tiles `https://tiles.openfreemap.org/planet/20260816_080001_pt/{z}/{x}/{y}.pbf`, `minzoom=0`, `maxzoom=14`, and no pending TileJSON request. Nevertheless `isStyleLoaded=false`, `areTilesLoaded=false`, `isSourceLoaded('openmaptiles')=false` and the source’s `loaded()` is false. This confirms the failure is after TileJSON resolution and before usable vector-source rendering; the existing `Carte active` state is not a valid source-readiness signal.


## Event-order finding

The fresh Positron instance emits `style.load` and several `styledata`/`data` events, but never emits `load` or `idle` in the sampled window. Its `openmaptiles` source remains `loaded()=false`, `isSourceLoaded=false`, `isStyleLoaded=false`, and `areTilesLoaded=false`; only the style and `/planet` TileJSON resources appear. The current `style.load` handler sets `Carte active` and starts rotation before the vector source is usable, which explains the misleading active/rotating DOM state and blank canvas. The next implementation must separate style readiness from source/idle readiness and must not silently substitute a raster fallback if the attached reference is adopted.


## MapLibre 5.24.0 compatibility test

The local `node_modules` was temporarily resolved to MapLibre `5.24.0`, matching origin/main, without changing `package.json` or `package-lock.json`. With Positron and constructor-time globe projection, the settled local screenshot remained a blank white canvas while the UI still showed `Carte active`. This makes a simple v6-versus-v5 explanation unlikely; the direct controller’s lifecycle/source handling remains the primary diagnostic target. The temporary DEV-only event/map diagnostics are still not release code.


## Cache and environment result

The MapLibre instance exposes the style object and its `openmaptiles` vector source, but the sampled source-cache internals do not expose any created tile entries; `isSourceLoaded('openmaptiles')` and `isStyleLoaded()` remain false. The browser console did not surface a useful additional renderer error. The origin/main reproduction could not be run cleanly in the shared worktree because its versioned Vite plugin/dependency graph was incomplete in the current install; the attempt was removed and the current branch dependencies were restored with `npm ci`. The evidence supports a wrapper/readiness refactor, not a package-version claim.


## Direct-style result

A locally served Positron style with `openmaptiles.tiles` set directly to the versioned PBF template produced the same blank white canvas after settle. The experiment therefore rejects “TileJSON indirection alone” as the fix. The style asset and the temporary Positron URL/projection/diagnostic changes are experimental only and must be removed unless a later verified wrapper path makes the source usable.


## Mercator isolation

Starting Positron direct style at `zoom=3.35` with constructor projection `mercator` also produced a blank settled canvas. The failure is therefore not limited to the globe projection; the vector source/worker/style configuration remains unusable in the current direct controller. This experiment was reverted from the intended implementation path.


## Public reference basis

The official MapLibre globe example creates a normal vector-style `Map` and calls `setProjection({ type: 'globe' })` from `style.load`, confirming that a native globe projection is compatible with a vector map when the source lifecycle completes: [MapLibre globe example](https://www.maplibre.org/maplibre-gl-js/docs/examples/display-a-globe-with-a-vector-map/). OpenFreeMap’s quick-start documents the Positron/Liberty style URLs, MapLibre integration and custom-style hosting path: [OpenFreeMap Quick Start](https://openfreemap.org/quick_start/). The Positron style is an OpenMapTiles vector style rather than a raster-only map: [OpenMapTiles Positron GL style](https://github.com/openmaptiles/positron-gl-style).


## Isolated MapLibre result

A separate minimal page following the official MapLibre globe pattern with CDN MapLibre `6.6.0`, OpenFreeMap Positron, constructor-time globe projection and no Omni code reached `state=idle`, `isStyleLoaded=true`, `areTilesLoaded=true` and `isSourceLoaded('openmaptiles')=true`. The first screenshot was captured at `style.load` and looked like a pale/blank globe before the later settle; the provider did not remain blocked. This is the key isolation result: OpenFreeMap Positron and native globe projection are viable in the browser, while the current Omni direct controller’s lifecycle/interaction additions prevent the same source from reaching usable readiness.


## Isolated visual inspection

After the isolated page reached `idle`, the screenshot visibly showed a vector globe with Africa, country boundaries and labels on a light field. The provider therefore renders the desired globe outside Omni; the current defect is application-specific. The screenshot was read only as a transient local diagnostic and no user-uploaded image was revisited.


## Lifecycle guard result

Adding `if (!map.isStyleLoaded()) return` to the `style.load` handler prevented premature configuration, but the current app then reached its eight-second fallback and showed `Carte en mode de secours` with the synthetic black globe. Positron still did not reach the controller’s usable `load` path. The isolated page proves the provider itself can settle; the current app still needs a structural lifecycle change rather than another event guard. All current Positron/direct-style/constructor experiments remain rejected.


## npm/Vite isolation result

A minimal Vite page importing `Map` from the same npm MapLibre package as Omni and using the same Positron/globe options remained at `style.load` with a pale blank globe after settle, unlike the CDN ESM isolation page which reached `idle`. This isolates the remaining difference to the Vite/npm bundle or worker resolution, not Omni’s business/UI logic and not the OpenFreeMap provider itself. The temporary isolation pages and server are not repository deliverables.


## Explicit worker resolution result

The npm/Vite isolation was reloaded after calling `setWorkerUrl('/node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs')` before constructing the map. It reached `state=idle`, `styleLoaded=true`, `tilesLoaded=true` and `sourceLoaded=true`, and the settled screenshot visibly rendered the Africa-facing Positron globe. This is the minimal root cause and fix direction: the application bundle needs an explicit MapLibre worker URL (served as a stable same-origin asset), then the Positron vector style can be used without the raster fallback. The temporary isolation page used the local package asset only for diagnosis.


## Worker build result

After removing the unsupported constructor `projection` option, the production build passed with the explicit worker import. Vite emitted `dist/assets/maplibre-gl-worker-f96B2wcH.mjs` and the server bundler reported exactly 12 Vercel V2 functions. The projection is still set through `map.setProjection` after the style lifecycle, which matches the current TypeScript API contract.


## Omni worker fix result

After importing the Vite-managed worker asset and calling `setWorkerUrl` before map construction, the real Omni preview reached `load` and repeated `idle` events. The DOM reported `Carte active`, `data-projection="globe"`, `data-camera-mode="resting_globe"`, `data-rotation="rotating"`, `styleLoaded=true`, `tilesLoaded=true` and `sourceLoaded=true`. Public resources now include the same-origin worker, Positron style/TileJSON, sprites and glyph PBFs. The settled screenshot shows the Positron vector globe; the source-loading blocker is resolved in local development.


## Visual adjustment after worker fix

The loaded Omni globe is no longer blank: vector labels and a small dark globe edge are visible. However, the current V4.2 CSS inversion/brightness treatment and the Liberty-oriented palette assumptions make the Positron land masses too close to the white field, leaving labels visually detached and the globe composition weaker than the supplied reference. Before release, the palette must be adapted to Positron’s vector layer IDs and the globe-only filter must be removed or reduced; this is a visual Canopy correction, not a provider rollback.


## Positron layer inventory

The loaded Omni style exposes vector layers `water`, `park`, `landcover_ice_shelf`, `landcover_glacier`, `landuse_residential`, `landcover_wood`, `building`, `boundary_2`, `boundary_3`, `boundary_disputed`, `highway_*`, `railway*`, `airport`, `label_*` and the native Omni facility layers. It does not expose the Liberty-specific `natural_earth` layer. The palette must therefore use Positron’s vector fills/lines directly, with low-zoom labels/roads suppressed by layer visibility or existing style minzoom behavior and local detail allowed to emerge progressively.


## Palette evidence

The live Positron layers already expose a suitable neutral basis: `background` is white with opacity `0`, `water` is `#111111`, `park` is near-white, and `boundary_2`/`boundary_3`/`boundary_disputed` use restrained charcoal with zoom-dependent opacity/width. Roads are naturally gated by minzoom (`highway_minor` at 8, major layers later), while country labels begin around zoom 1–3 and city labels later. The current all-canvas globe inversion is therefore counterproductive for Positron; the correct visual path is to keep the vector style’s native neutral fills/lines, tune only the land/water/boundary layers where needed, and use layer visibility for globe/local progression.


## No raster layer in Positron

The live Positron style contains no active raster layer matching `raster`, `natural`, `shaded`, `globe` or `terrain`; its low-zoom globe is rendered by vector fills/lines and atmosphere/land behavior supplied by MapLibre/style layers. The Liberty Natural Earth treatment must not be retained in the Positron path.


## Clean local provider proof

After the final local preview restart, the settled compact frame visibly showed the Africa-facing Positron globe on a white field with dark water and light/neutral land, fine country boundaries and labels, plus the permanent right-side controls. The DOM reported `Carte active`, globe projection, resting-globe camera mode, map-only rotation, `data-zoom="1.35"`, worker resource present, Positron style present, 19 `.pbf` resources and no `/omni-local-style` fallback request. This is the first clean local proof that the requested vector globe path works end-to-end inside Omni.


## Responsive visual proof

The mobile `390×844` settled capture now matches the intended composition closely: white field, large contained dark-ocean globe, light Africa/continents, fine boundaries and labels, permanent minus/plus/recenter controls on the right, no `Votre position` chip and no visible approximate-location band. The desktop `1024×880` harness assertions all passed for motion/drag/resume, but its settled screenshot is effectively a pale empty field without a visible globe. This is a new responsive visual gap: the source lifecycle is technically ready, yet the desktop capture needs a separate settle/resize investigation before the desktop frame can be considered proven.


## Desktop state probe correction

A temporary desktop probe captured `initial`, `after-idle`, `after-drag`, `after-leave` and `final` separately. All frames visibly contain a complete globe. The final frame keeps the released camera and shows the Atlantic/Americas side after the drag, while the initial frame shows the Africa-facing side. The earlier committed-style desktop capture that looked blank was therefore a capture-timing/settle artifact, not a persistent MapLibre rendering failure. The standard desktop harness assertions and these state frames together now support the desktop globe proof.


## Manual zoom observation

The local read-only preview started with the Africa-facing globe at zoom `1.35`; one approved Plus control action visibly enlarged the globe while preserving the same dark-ocean/light-continent composition and making national boundaries/labels more legible. The three controls remained present on the right and the search dock stayed separate at the bottom. This is a manual transition observation, not yet proof of the full real-result reveal.


## Globe-to-mercator observation

The second Plus action crossed the approved projection threshold. The settled frame visibly remained populated by Positron vector geography: national boundaries, country labels and coastlines persisted at the closer scale rather than disappearing. The view was intentionally read-only and no facility or business action was opened. A dedicated real-result query is still required to prove local streets and source-backed facility features at the final reveal zoom.


## Canonical V4.3 smoke blocker

Deployment `dpl_8kiibzXkDsFKPZB55Toedmc8SnYJ` is READY for commit `be7cff4` and aliases `omni.sparkafrika.online`, but the first canonical smoke did not reach a usable map. After the initial loading frame and a further settle, the public domain reported `Carte indisponible` with the explicit message `La carte vectorielle est temporairement indisponible.` and a visible `Réessayer` action. The permanent map controls and dock remained mounted, but no globe was visible. This is an honest production blocker; V4.3 is not accepted. The next action is to inspect the public worker asset/console path and repair or revert the deployment-safe worker resolution before any further release claim.


## Canonical worker diagnostics

The canonical browser requested the Vite worker at `https://omni.sparkafrika.online/assets/maplibre-gl-worker-f96B2wcH.mjs`, the Positron style/TileJSON, sprites and fonts, but recorded **zero PBF resources** before the 8-second timeout. The DOM remained mounted at globe zoom `1.35` with map-only rotating state while the visible status became `Carte indisponible`. The worker URL is therefore present but its production runtime does not reach a loaded vector source; the production-safe fix must validate worker execution/format, not merely publish the asset URL.


## Production-preview reproduction

The exact Vite production build reproduced the canonical failure on `http://localhost:4179/`: after the loading window, Omni displayed `Carte indisponible` with the explicit retry state and no globe. Development mode on 4174 succeeds, so the regression is in the bundled production worker/runtime path rather than the Positron provider itself or Vercel-only networking.


## Production-preview resource diagnosis

The production preview requested `http://localhost:4179/assets/maplibre-gl-worker-f96B2wcH.mjs`, the Positron style/planet, sprites and fonts, but still recorded zero `.pbf` resources before `Carte indisponible`. No useful console output was emitted. This reproduces the canonical path exactly and confirms the worker file is fetched but not completing the MapLibre worker/source lifecycle in the production bundle.


## V4.3 worker packaging reconciliation

The production failure was narrowed to the built worker rather than OpenFreeMap Positron. The Vite-emitted worker requested a relative `maplibre-gl-shared.mjs` module that was not emitted beside it, so the worker URL could return `200` while the MapLibre source lifecycle never completed. This explains the earlier canonical and `vite preview` observations of a fetched worker with no usable vector source.

The repair publishes the version-matched MapLibre runtime pair at stable same-origin paths: `public/maplibre-gl-worker.mjs` and `public/maplibre-gl-shared.mjs`. `TrunkMap.tsx` now calls `setWorkerUrl('/maplibre-gl-worker.mjs')`, preserving the worker's relative shared-module import in both development and production builds. The readiness timeout is 20 seconds so a cold Positron vector load does not present a false retry state at eight seconds; the error remains explicit and retryable if the style still does not become ready.

The rebuilt production preview at `http://localhost:4179/` reached `Carte active` at globe zoom `1.35`, retained the white-field/dark-ocean/light-continent monochrome Positron rendering, and transitioned to `mercator` at zoom `5.35` after four safe Plus actions. The browser captured the public worker, Positron style/planet/sprites, and actual OpenFreeMap PBF and glyph resources. Tile requests aborted during camera replacement were normal request cancellation during zoom, not a provider-unavailable state. The mobile proof remained green across 390x844, including three permanent controls, 16px input, touch movement, reversible projection, no visible approximate-location band and no HTML pins. The desktop proof remained green across 1024x880, including idle motion, globe-axis drag, released-camera retention, and rotation resumption outside the map.

The earlier canonical blocker is therefore resolved in source and production-like preview, but canonical acceptance remains pending until the new GitHub-triggered Vercel deployment is READY and the same read-only browser smoke passes on `omni.sparkafrika.online`. Real-result street-level reveal and source-backed facility visibility remain separate, unproven gates.
