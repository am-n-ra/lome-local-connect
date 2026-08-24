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
