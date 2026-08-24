# Canopy audit notes — 2026-08-24

## Scope and source of truth

Current branch: `omni-v2-rebuild`. Founder HQ keeps Species/Canopy active and pauses role bootstrap, OSM, PWA, payment, QR, transaction and field-pilot expansion. This audit is read-only and contains no new business mutation.

The approved Species rules require a persistent dominant MapLibre map/globe, a slow interruptible idle state, right-side controls, a compact Buyer/Seller switch and J5 account owner, a bottom dock separate from the result sheet, calm public markers, explicit map modes and reversible camera context.

## Current V2 observations from source

`src/trunk/TrunkMap.tsx` already uses an RAF plus `jumpTo` rotation, stops motion on `mousedown`, `touchstart`, `wheel`, `dragstart` and `zoomstart`, and suppresses bounds emission while rotating. It keeps the accessible projected HTML overlay as the visible pin renderer, while transparent MapLibre layers retain source/cluster semantics. It currently resumes rotation after settled map events when zoom is below `2.4`, and selected facilities use `easeTo` to zoom to at least `5.2`. Location uses an explicit browser permission request and a bounded `easeTo`; exact/approximate/denied/timeout/unavailable/cancelled states exist. The map has a hard grayscale/saturation filter in `src/styles.css` and a simple selected-pin color swap.

`src/trunk/TrunkApp.tsx` now sends non-empty text searches through `listPublicFacilities(undefined, committedQuery, appliedOptions)` and keeps viewport bounds for nearby discovery. The authenticated Buyer search settlement is already bounded-proven for loading → ready. No search camera choreography or explicit result framing exists in the current V2 path yet.

## Reference findings from origin/main

The main-branch reference component is `src/components/omni/MapCanvas.tsx`, supported by `src/lib/map-globe-state.ts` and `src/lib/map-context.ts`. It defines explicit camera modes: `resting_globe`, `manual_navigation`, `search_reveal`, `result_framing`, and `selected_facility`. It uses a monotone reveal token and cancels active reveal on manual interaction, new search, selected facility, provider error or unmount. Idle motion is scheduled through RAF and is permitted only in the resting-globe mode; interaction changes ownership to manual navigation without restoring the initial camera.

The main branch also contains an explicit `REVEAL_STEPS` sequence and an async search reveal that: stops rotation, hides facilities during the choreography, starts from the globe frame, flies through bounded waypoints, waits for the map to settle, loads boundary layers only where supported, optionally highlights the target boundary, then frames public facilities with a bounded fit. It guards each stage with the reveal token and restores facility visibility after rendering. It supports a user-position target when one exists and falls back to an approximate market target when it does not. Its camera context contract preserves route, role, query, filters, quantity, budget, selected facility and viewport with expiry.

## Adaptation decisions for V2

Reuse the existing V2 map contracts instead of copying the main branch wholesale. The V2 implementation must not reintroduce rotation → bounds fetch coupling, fake administrative labels, a second visible pin renderer, or any protected/precise location assumption. The planned reveal should be result/data-led and bounded: use stable global query results, show perceptible world/context/result framing, fit all public results with safe padding, and only show country/region/city labels if authoritative data exists. The user-position marker must remain distinct from public facilities and only appear after explicit browser permission.

## Phase 1 decision

Proceed with a focused mini-Root/mini-Trunk camera ownership extension: explicit camera mode/ref/token, interruption-safe RAF rotation and search reveal, source-backed result framing, a subtle user-location marker, and a lighter color treatment. Preserve existing API/search behavior and document unproven geocoding/location conditions rather than inventing them.

## Canonical initial frame — Canopy deployment `38d37cb`

After deployment `38d37cb` reached READY, the canonical authenticated Sandbox page at the available `891×765` viewport mounted a MapLibre canvas/globe, one visible public cluster labelled `4`, right-side `Zoom avant` and `Utiliser ma localisation` controls, Buyer/Seller switch, J5 account owner, and the bottom search dock. The settled DOM reported `Carte active`, `data-basemap="soft-color"` in the implementation, and the map remained present behind the idle composition. Initial screenshot: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-38-57_1442.webp`.

The initial frame is a bounded authenticated visual observation only. No facility, claim, availability, seller response, reviewer action or location permission was triggered.

## Initial idle rotation measurement

At the current Sandbox viewport `1024×880`, the settled stage reported `cameraMode="resting_globe"`, `data-rotation="rotating"`, `data-reveal-stage="idle"`, `data-zoom="1.35"`, no nearby sheet, one cluster and no facility overlay pins. After approximately 1.6 seconds, `centerLng` changed from `54.4780` to `109.7567` while zoom remained `1.35` and the camera mode remained `resting_globe`. This confirms real RAF globe motion on the deployed build, not a static screenshot. One initial console expression had a syntax error because of an unwrapped async expression; the corrected read-only measurement succeeded and changed nothing.

## Hover interruption proof

The cursor was moved to the globe center on the canonical page. After approximately 1.2 seconds, the DOM reported the same `centerLng` before and after (`147.7913`), `zoom="1.35"`, `cameraMode="resting_globe"` and `data-rotation="paused"`. The globe therefore stopped at its current position rather than returning to its initial center. Screenshot: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-39-49_4261.webp`.

## Hover-leave diagnosis

Moving the cursor from the globe to the search dock produced a screenshot with the dock under the pointer, but after approximately 1.7 seconds the DOM still reported the same `centerLng="147.7913"`, `zoom="1.35"`, `cameraMode="resting_globe"` and `data-rotation="paused"`. The canvas container spans the whole viewport beneath overlay surfaces, so its DOM `mouseleave` is not a reliable signal when the pointer enters the dock/control layers. The smallest correction is a window-level pointer-move ownership check using `canvasContainer.contains(event.target)`, with cleanup, so overlays release the resting-globe pause without changing the camera.

## Canonical replay after `bf72e22`

The canonical READY replay of commit `bf72e22` mounted the MapLibre globe/canvas, one public cluster with count `4`, right-side zoom/location controls, J5, Buyer/Seller switch and the separated search dock at the available `1024×880` Sandbox viewport. Screenshot: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-42-37_2542.webp`.

## Corrected hover pause

On the `bf72e22` replay, hovering the globe again produced `data-rotation="paused"` with identical `centerLng="59.3189"` and `zoom="1.35"` across approximately 1.1 seconds. The stage remained in `cameraMode="resting_globe"`; no search sheet or extra request was introduced. Screenshot: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-42-56_6372.webp`.

## Corrected hover-leave replay result

The `bf72e22` replay still reported `data-rotation="paused"`, unchanged `centerLng="59.3189"` and `zoom="1.35"` after the pointer was moved to the dock and held there for approximately 1.9 seconds. The global listener was not sufficient in this browser harness, likely because `browser_move_mouse` does not emit the expected pointer transition to the page or because the map/canvas remains the event target beneath the overlay. The pause behavior is proven; resume-outside-canvas remains unproven and requires either a controlled real pointer event or an interaction-state adjustment that does not reset the camera.

## Canonical replay after `375e4f2`

The latest READY deployment replayed with the authenticated Sandbox session at `1024×880`: MapLibre globe/canvas mounted, public cluster count `4`, right-side controls, J5, Buyer/Seller switch and the bottom dock remained visible. Screenshot: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-46-23_2210.webp`.

## Latest hover pause proof

On `375e4f2`, hovering the globe kept `centerLng="49.7527"` and `zoom="1.35"` unchanged across approximately 1 second while `cameraMode="resting_globe"` and `data-rotation="paused"` remained stable. The pause at the current position is reproducible on the canonical deployment. Screenshot: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-46-39_1071.webp`.

## Latest hover-leave result

On `375e4f2`, moving from the globe to the dock and waiting approximately 1.9 seconds still left `centerLng="49.7527"`, `zoom="1.35"`, `cameraMode="resting_globe"` and `data-rotation="paused"`. The browser harness continues to provide reliable hover pause but not a detectable leave transition. The camera is not reset; however, automatic resume outside overlays remains unproven. This is retained as a residual Canopy gap rather than declared fixed.

## Controlled hover-leave proof

Because the browser movement helper did not emit a usable overlay transition, a non-mutative synthetic `mousemove` event was dispatched on the search input, with `elementFromPoint(500,722)` confirming the dock coordinate resolves to the canvas in this harness. After approximately 1.9 seconds, the stage reported `data-rotation="rotating"`, `cameraMode="resting_globe"`, unchanged `zoom="1.35"` and `centerLng="51.0228"` at capture time. This demonstrates the implemented release path resumes RAF rotation without resetting the camera. The limitation is recorded: physical cursor leave is not independently measurable through this browser helper. Screenshot: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-47-49_8747.webp`.

## First deployed search reveal observation

On READY `375e4f2`, the authenticated search `Marche de Hanoukope` returned one public result and the contextual sheet rendered `Résultats pour « Marche de Hanoukope »`, `Marche de Hanoukope`, `Market · Lieu local` and `Voir le lieu`. The map remained mounted behind the sheet, the public cluster remained visible and the search dock stayed in its own band above the sheet. The screenshot after submit shows the globe framed over the Africa region while the result sheet is present: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-48-19_9575.webp`.

The browser click returned after the asynchronous path had already settled, so a distinct loading/reveal-stage capture is still required.

## `5bff6ef` replay and identical-submit diagnosis

The canonical replay after READY deployment `5bff6ef` mounted the same MapLibre globe, public cluster count `4`, zoom/location controls, J5 and separated search dock at `1024×880`; screenshot: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-50-52_1574.webp`.

A read-only `requestSubmit()` of the already settled query `Marche de Hanoukope` was sampled every 250 ms for 6 seconds. The sheet correctly entered `nearby-state-loading` with `Recherche de « Marche de Hanoukope »…`, but the request never settled; the map had already moved to `zoom="1.05"`, `centerLng="1.2124"`, one projected public pin and no cluster. The cause was identified as `beginSearch` setting `mapState="loading"` while `facilityQueryKeyRef` still held the identical global-search key, so the effect deduped the new request and never returned to ready. This led to commit `5bff6ef`, which clears the query key before both `beginSearch` and `applyOptions`.

## Canonical replay after `bc8e730`

The latest READY deployment mounted at `1024×880` with the MapLibre globe/canvas, public cluster count `4`, right-side zoom/location controls, J5 and the separated search dock. Screenshot: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-54-04_4888.webp`.

## Progressive Buyer reveal proof on `bc8e730`

The authenticated query was submitted through the real form and sampled every 250 ms for 8 seconds. At `250–500 ms`, the nearby sheet was `nearby-state-loading` with `Recherche de « Marche de Hanoukope »…`, while the globe remained mounted. At `750 ms`, the sheet became `nearby-state-ready` with one public result. From `1000 ms` onward, the map entered `cameraMode="search_reveal"`; the stage labels and zoom progressed through `Le continent` (`1.35→1.85`), `Le pays` (`1.85→2.75`), `La région` (`2.75→3.80`), `La ville` (`3.80→5.25`), and `Facilités trouvées` (`5.25→6.20`). The result sheet remained ready with `Marche de Hanoukope`, one projected facility pin replaced the cluster, and the map remained mounted throughout. At approximately `5.0 s`, the camera entered `result_framing` at zoom `6.20`; by `5.5 s`, reveal UI cleared and the camera stayed at `manual_navigation`/`6.20` with the ready card visible. This proves the user-requested intermediate animation and final local framing for the bounded query. The `Le monde` label existed as the first step but was too short to appear in the 250 ms first sample; the world-scale zoom frame is still represented by the first `1.05` camera step in the implementation contract.

## Final Buyer framing geometry on `bc8e730`

The final visual frame showed a readable regional map around Lomé with one facility pin, the separated search dock and result sheet: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-55-22_8382.webp`. At `1024×880`, the DOM measured the full canvas `0–1024 × 0–880`, search dock `top=561,bottom=610`, nearby sheet `top=624,bottom=858`, result card `top=704,bottom=836`, and facility pin `top=246,bottom=284`. Both `overlapDockSheet` and `overlapDockPin` were `false`. Final stage attributes were `data-basemap="soft-color"`, `cameraMode="manual_navigation"`, `data-reveal-stage="idle"`, `zoom="6.20"`, `data-location="idle"`. No location permission was requested in this proof, so the user marker remains unproven for actual geolocation permission; the implementation path is present and bounded for a future manual permission test.

## Post-reveal zoom proof

After the final Buyer result frame, clicking the visible `Zoom avant` control changed the map from `zoom="6.20"` to `zoom="7.20"`, set `cameraMode="manual_navigation"`, kept the MapLibre canvas mounted, preserved the `Marche de Hanoukope` card, and left `data-rotation="paused"`. The dock remained `top=561,bottom=610` and the sheet `top=624,bottom=858`, with `separated=true`. Screenshot: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-55-53_4719.webp`.

## Keyboard/focus proof

On the final Buyer result frame after manual zoom, one `Tab` moved focus to the location control. The focused element was a `BUTTON` with accessible name `Utiliser ma localisation`; the computed outline was visible. This is a bounded focus-name observation at `1024×880`. A full keyboard traversal and reduced-motion browser profile remain outside this pass.

## Bounded user-location marker proof

To avoid requesting real location permission, the browser console temporarily injected a bounded demonstration position `(longitude 1.23, latitude 6.15, accuracy 120 m)` for the existing read-only location control, then restored the native geolocation object immediately. The resulting DOM reported `data-location="exact"`, `data-user-position="visible"`, accessible label `Votre position sur la carte`, `cameraMode="manual_navigation"` and `zoom="7.20"`. The visual frame showed the discrete position confirmation surface while the map, facility pin, result card and separated dock/sheet remained mounted: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-24_17-57-02_2913.webp`. This proves the UI/marker path only; real permission and real coordinates remain unproven and no actual user location was requested or stored.

## Compact public Playwright proof

A local Playwright run against the canonical URL at `390×844` with `no-preference` motion moved the pointer to the dock before measurement. The initial frame reported a full `390×844` canvas, `cameraMode="resting_globe"`, `data-rotation="rotating"`, `zoom="1.35"`, soft-color basemap, two enabled named controls (`Zoom avant`, `Utiliser ma localisation`), a `335×49` dock within the viewport, no nearby sheet in guest mode, `bodyOverflow="hidden"`, and no horizontal overflow. After 1.6 seconds, `centerLng` advanced from `2.3400` to `6.8200` with zoom still `1.35`; after one Zoom avant action, zoom increased to `2.35`, camera mode became `manual_navigation`, and all controls remained enabled. All scripted assertions passed: canvas mounted, rotation moved, controls enabled, zoom increased, dock separation valid for guest state, and no horizontal overflow. Artifacts: `/home/ubuntu/lome-local-connect-git/canopy-proof/canopy-compact-public.json` and `/home/ubuntu/lome-local-connect-git/canopy-proof/canopy-compact-public.png`.

This is public guest responsive evidence; authenticated compact result-sheet layout, keyboard traversal and reduced-motion rendering remain residual gaps.

## Compact reduced-motion Playwright proof

A second Playwright run at `390×844` with `prefers-reduced-motion: reduce` reported `data-rotation="reduced"` and unchanged `centerLng="1.2200"` across the idle interval, while the full canvas remained `390×844`, both controls were enabled and named, Zoom avant still increased zoom `1.35→2.35`, the guest dock stayed inside the viewport, and `bodyOverflow="hidden"`. All reduced-motion assertions passed. Artifacts: `/home/ubuntu/lome-local-connect-git/canopy-proof-reduced/canopy-compact-public.json` and `/home/ubuntu/lome-local-connect-git/canopy-proof-reduced/canopy-compact-public.png`.

## Search request cadence check

On the authenticated final frame, performance entries contained two public-facility requests: one initial viewport request with `west/south/east/north` and one explicit query-only request with `q` and no bounds. The nearby sheet was `nearby-state-ready`; the stage was `cameraMode="manual_navigation"`, `data-reveal-stage="idle"`, `data-rotation="paused"`, `data-user-position="visible"`, `zoom="7.20"`. No continuous bounds request cadence appeared during the reveal/result path. This is read-only browser evidence with query parameter names only; no IDs, tokens or secret values were recorded.
