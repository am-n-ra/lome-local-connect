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
