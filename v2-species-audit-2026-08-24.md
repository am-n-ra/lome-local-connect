# Omni V2 — Species audit, 2026-08-24

**Structural path:** product → Species → map/search composition → Buyer/Seller/Reviewer surfaces
**Status:** `observed / diagnosis in progress`
**Primary authority:** `v2-species.md` and the approved maquette contract

## User-reported symptoms

The owner reports that the canonical V2 map blinks, zoom is not reliably usable, search feels disconnected because results appear without a clear intermediate transition, and the bottom grid can remain on `Recherche des lieux autour de vous…` even when the rest of the interface has changed. The owner also reports that Buyer, Seller and Reviewer/Admin surfaces remain visually incomplete.

These observations are treated as a material Species signal. They are not yet a full browser reproduction because My Browser timed out during the initial fresh capture; the code path and main-branch comparison below are therefore a diagnosis basis, not a completed visual acceptance proof.

## Main-branch comparison

The main-branch reference contains a dedicated `MapCanvas` with explicit camera ownership (`resting_globe`, `manual_navigation`, `search_reveal`, `result_framing`, `selected_facility`), a reveal token that cancels stale camera flights, requestAnimationFrame-based idle rotation, style reapplication after load/recovery, and throttled viewport emission. The main-branch `SearchDock` derives its action mode from active search, result count and coverage status and renders separate loading, ready, error, result and request rows. `CleanBuyerMapStage` does not mount result cards until an active search reveal is complete and results are ready.

V2’s `TrunkMap` is a newer, smaller controller. It uses a repeating `easeTo` rotation timer, emits bounds on every `moveend`, and passes those bounds directly into the public-facility effect in `TrunkApp`. It also maintains both MapLibre source layers and a projected HTML pin overlay for the same facilities. V2’s `NearbySheet` is mounted as soon as `nearbyOpen` is set and keys all of its body state directly off the single `mapState` value.

## Most likely causes

1. **Idle rotation can create a fetch loop.** V2 rotates with `easeTo`, which produces `moveend`; `moveend` emits new bounds; `TrunkApp` sets those bounds; the public-facility effect sets `mapState` to `loading` and starts another request. This can repeatedly re-enter the grid’s searching state and can cause visible map/result churn.

2. **Camera and data ownership are coupled.** The map controller does not distinguish internal idle rotation from user camera movement when emitting bounds. A camera animation intended only as visual idle motion can therefore change the data query.

3. **The map has two facility-rendering paths.** MapLibre clusters/pins and HTML projected pins are both added. Even if one path is visually dominant, both are updated during camera/data changes, which can appear as marker flicker or inconsistent pin placement. The main branch uses a source/layer system with feature state rather than this duplicated visual path.

4. **Search has no explicit reveal/action state.** `NearbySheet` is opened immediately by `beginSearch`, while the fetch effect asynchronously changes `mapState`. The sheet’s only loading copy is the generic nearby label. There is no reveal token or result-ready transition separating search intent, camera/data loading, ready results, empty results and error recovery.

5. **Auth return can lose search composition.** If a guest submits a search, `beginSearch` opens Auth before setting the search composition. `submitAuth` restores `committedQuery` but does not restore `nearbyOpen` and `showAllResults`, so the search can feel disconnected after authentication.

6. **Zoom has no explicit readiness/ownership contract.** V2 exposes the zoom control before a map style is confirmed ready and uses an immediate `zoomIn` call. The controller does not expose a camera mode or a projection transition based on zoom. The main reference pauses rotation, owns the camera explicitly and re-applies projection/layers as the style becomes ready.

## Acceptance target for the next corrections

The smallest corrective slice should make idle rotation visual-only and interruptible, prevent internal rotation from triggering public data refetches, provide one authoritative pin-rendering path or ensure the secondary path cannot flicker, make zoom a reliable explicit camera action, and give search distinct loading/ready/empty/error states. The first proof must use the canonical domain at supported widths and record whether the globe, zoom, search transition, grid result resolution, pin continuity and back/recovery behavior remain stable. Seller and Reviewer/Admin visual alignment will be audited after the shared map/search foundation is corrected.

## Evidence class and gate

The current evidence is `observed / user-reported` plus `code-compared` against `origin/main`. It is not a Species acceptance. No data mutation, role change, OSM import, payment or new claim action is authorized by this audit. Global Root remains `review`.

## Canonical post-deployment proof

Deployment `dpl_8gPXTT1Dyde8RwmbHDtXQDPHYehd` is READY from GitHub commit `2c63cda` on ref `omni-v2-rebuild`, with aliases including `omni.sparkafrika.online` and `lambdaRuntimeStats` indicating exactly 12 Node functions.

A public-only Playwright run at 390×844 captured the canonical initial state with `data-rotation="rotating"`, `data-zoom="1.35"`, active map status and enabled `Zoom avant` / location controls. Clicking `Zoom avant` changed the measured zoom from `1.35` to `2.35`. The map remained mounted through the guest search boundary, and submitting `Marche de Hanoukope` opened the intentional Account sheet rather than fabricating public results. The initial and post-search screenshots show the globe remains behind the sheet and the sheet keeps its own safe lower band.

The run observed three public-facility requests: two initial requests approximately 65 ms apart during first readiness/bounds settling, then one request approximately 6.5 seconds later after the explicit zoom action. No repeated request cadence was observed during the idle rotation interval, which supports that the new RAF rotation no longer creates a fetch-on-every-easeTo loop. This is a bounded public proof; authenticated search result-ready/empty/error transitions and Seller/Reviewer role states still require a session-appropriate browser proof.
