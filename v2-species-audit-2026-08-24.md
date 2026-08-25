# Omni V2 — Species audit, 2026-08-24

**Structural path:** product → Species → map/search composition → Buyer/Seller/Reviewer surfaces
**Status:** `partial / Canopy bounded proof recorded; Species gate open`
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

The current evidence is `bounded authenticated browser proof` plus `code-compared` against `origin/main`. It is not a full Species acceptance. No data mutation, role change, OSM import, payment or new claim action is authorized by this audit. Global Root remains `review`.

## Canonical post-deployment proof

Deployment `dpl_8gPXTT1Dyde8RwmbHDtXQDPHYehd` is READY from GitHub commit `2c63cda` on ref `omni-v2-rebuild`, with aliases including `omni.sparkafrika.online` and `lambdaRuntimeStats` indicating exactly 12 Node functions.

A public-only Playwright run at 390×844 captured the canonical initial state with `data-rotation="rotating"`, `data-zoom="1.35"`, active map status and enabled `Zoom avant` / location controls. Clicking `Zoom avant` changed the measured zoom from `1.35` to `2.35`. The map remained mounted through the guest search boundary, and submitting `Marche de Hanoukope` opened the intentional Account sheet rather than fabricating public results. The initial and post-search screenshots show the globe remains behind the sheet and the sheet keeps its own safe lower band.

The run observed three public-facility requests: two initial requests approximately 65 ms apart during first readiness/bounds settling, then one request approximately 6.5 seconds later after the explicit zoom action. No repeated request cadence was observed during the idle rotation interval, which supports that the new RAF rotation no longer creates a fetch-on-every-easeTo loop. This is a bounded public proof; authenticated search result-ready/empty/error transitions and Seller/Reviewer role states still require a session-appropriate browser proof.

## Authenticated read-only session checkpoint

The Manus computer browser successfully loaded the canonical alias with an existing authenticated session. The account is represented in the UI by a short avatar label; no raw Auth ID, email or credential was recorded. Opening J5 remained read-only and exposed the expected single account/navigation surface with `Mes demandes`, `Inbox Omni`, `Outils terrain Omni`, `Revue des claims`, `Se déconnecter` and `Réinitialiser la carte`. No business mutation was performed.

The recovered authenticated Buyer session returned to the idle map after closing J5. The query `Marche de Hanoukope` was entered in the bottom dock without submission; the map remained mounted, the dock stayed below the map content and no nearby grid or mutation appeared. The account is recorded only as the visible session state, not by raw identity data.

## Authenticated Buyer search proof — current deployment

The authenticated Buyer search was submitted for `Marche de Hanoukope` from the bottom dock. The immediate browser state correctly mounted a contextual nearby sheet with query-aware loading copy: `Recherche de « Marche de Hanoukope »…`, while keeping the map and dock visible with separate geometry. After the request settled, the public result was present as an accessible `Ouvrir Marche de Hanoukope` facility action and the globe/pin presentation changed appropriately. However, the extracted text and screenshot still showed the nearby sheet’s loading copy instead of a result card, indicating a stale loading/render synchronization defect despite the result action being present in the DOM. This is a concrete remaining Species bug to fix before acceptance; no business mutation occurred.

The READY search-fix deployment `dpl_9UJqdAERp3A9Rv2zMSnjNXS11WJJ` loaded successfully in the Manus computer browser. The existing authenticated session is present in the UI, the map and J5 controls are mounted, and the browser has no pending mutation from the reload. The next action is the same bounded Buyer query proof.

On the READY search-fix deployment, the authenticated Buyer submit action again mounted the nearby sheet with the explicit query-aware loading copy and preserved the map/dock geometry. The next settled-state observation will determine whether the request-key guard now replaces this loading view with the result card; no business mutation occurred.

## Follow-up authenticated search diagnosis

On deployment `dpl_9UJqdAERp3A9Rv2zMSnjNXS11WJJ`, the authenticated search still reproduces a concrete synchronization defect. The live DOM contains one public facility pin and the nearby result controls, but `.nearby-sheet` remains `nearby-sheet nearby-state-loading` with `Recherche de « Marche de Hanoukope »…`. The map stage reports `data-rotation="paused"`, `data-zoom="1.35"` and a changed center longitude, so opening the contextual sheet or another camera event is likely causing a bounds-driven request after the query result. The previous request-key guard alone did not close this path; further code diagnosis is required. No business mutation occurred.

The latest map-pause fix deployment `dpl_4Pz58aTrRkuVHG2f9bCFJGAdVi8R` is READY for commit `12c8623` and reloads successfully in the authenticated Manus computer browser. The canonical page exposes the existing account session, the map canvas and the Buyer search dock; no mutation is pending after reload.

## Authenticated Buyer search follow-up after moveend fix

On READY deployment `dpl_4Pz58aTrRkuVHG2f9bCFJGAdVi8R`, the same authenticated query submission now removes the stale loading state in the extracted DOM and exposes the explicit `Aucun résultat ici` / `Essayez un autre commerce, produit ou filtre.` state. The map and dock remain mounted. The public map pin remains visible while the query result is empty, so the lifecycle synchronization is improved, but the search semantics still need diagnosis: `Marche de Hanoukope` is a public facility visible in the base map but is not returned by the authenticated query. No business mutation occurred.

The live request log explains the remaining empty-result behavior. The authenticated query first requests the very wide initial globe bounds, then the map rotation/camera settling changes the center and issues a second query with bounds approximately `west=2.2269, east=171.3693, south=-76.0164, north=88.2764`. The final DOM state is `nearby-state-empty`, while the map still shows the public cluster/pin. This is now a bounds/camera query-sequencing issue: the search result can be filtered out by a globe viewport that has moved east after the query, even though the base map fixture remains visible. No business mutation occurred.

## READY deployment reload proof

After the GitHub push, Vercel produced a READY production deployment for commit `add616b` (exactly 12 functions). On the canonical URL in the authenticated 891×765 Sandbox viewport, the session reload shows the dominant MapLibre globe/canvas, four public facilities, enabled zoom and location controls, the compact Acheter/Vendre switch, J5 account owner, and the separated bottom search dock. The globe and canvas persist in the viewport; no mutation was performed.

The same query was replayed from the authenticated Buyer dock. Immediately after submit, the read-only contextual sheet entered `nearby-state-loading` with `Recherche de « Marche de Hanoukope »…`; the MapLibre globe remained mounted, the search dock remained above the sheet with visible separation, and the sheet exposed only collapse/`Voir tout` controls. This confirms the intended intermediate animation/state is now visible; no facility or business action was opened.

After waiting, the live request log contains the expected query-only request `/api/v2/public/facilities?q=Marche+de+Hanoukope` with no bounds, while `.nearby-sheet` is still `nearby-state-loading` and no `Ouvrir Marche de Hanoukope` action exists. The map stage remains mounted at zoom `1.35` with rotation paused. The viewport-scope mismatch is therefore removed from the request, but the promise/result path is still unresolved in the browser and requires direct read-only response inspection.

## Global-search replay on `6e9c335`

After deployment READY, the same authenticated query was replayed. The extracted DOM now exposes the expected public result immediately after submit: `PUBLIC — Marche de Hanoukope — Market · Lieu local — Voir le lieu`. The map canvas remains mounted and the dock/sheet remain separated. The screenshot renderer still showed the nearby body copy `Recherche de…` at that instant, so the next check must reconcile DOM and visual paint rather than claim full visual acceptance from a single frame. No facility was opened and no business mutation occurred.

A subsequent DOM inspection reported `nearby-state-ready` with one `Ouvrir Marche de Hanoukope` action, and the next browser frame visibly showed the public card replacing the loading copy. The globe/canvas remains persistent, the matching pin is visible, zoom remains enabled, and the search dock sits above the rounded result sheet with a measured visual gap in the authenticated 891×765 Sandbox viewport. This closes the authenticated Buyer search lifecycle proof for the bounded public facility query: loading → ready. The facility was not opened and no business mutation occurred.

## Read-only Seller surface proof

From the authenticated J5-owned navigation, the visible `Vendre` mode opened the Seller sheet without an Auth loop. In the authenticated 891×765 Sandbox viewport the MapLibre canvas remains behind a rounded contextual surface; the sheet has a clear `Espace vendeur` heading, `Accès vendeur à vérifier` lock state, `Demandes` and `Catalogue` tabs, a `Retour à acheter` return path, and the safety copy `Handoff encore verrouillé`. No seller profile was activated, no demo rebind was used, and no seller response or other business mutation occurred. The request tab was still resolving at the instant of capture; a settled locked-state check remains to be recorded.

After settling, the Seller sheet reports `Contexte vendeur autorisé`, `Demandes · 2`, two read-only `Root proof demo product` request rows, an `Actualiser` affordance, `Catalogue`, and the explicit `Handoff encore verrouillé` safety boundary. The map remains mounted behind the sheet at zoom `1.35`; no request row, response, catalogue action, rebind, or mutation was triggered.

The J5 account surface remains the sole navigation owner. Returning from the Seller sheet via J5 restored the Buyer result composition, and reopening J5 exposed the expected `Revue des claims` menu item. An indexed menu click did not persist and a coordinate retry closed the menu without opening a review surface; this was a navigation-tool interaction issue only, with no data or role mutation.

The J5 menu was reopened and the exact `Revue des claims` item was triggered through the rendered DOM only to avoid another coordinate selection mismatch. The call was read-only and did not touch a claim, role, or reviewer decision.

The Reviewer/Admin surface is now visually proven in the authenticated 891×765 Sandbox viewport. Its hierarchy reads `Équipe Omni · Review`, `Revue des claims`, `Validation humaine, trace par trace`, `Rôle reviewer non ouvert`, and `Validation par l’équipe`; it explicitly states that no facility status will be changed from this surface. The MapLibre canvas and public pin remain visible behind the rounded review sheet, the close action is available, and the DOM exposes no reviewer form inputs or decision controls. This is read-only visual evidence only; no role assignment, claim decision or other mutation occurred.

The Reviewer surface returned to the Buyer result composition through J5, and the same account menu reopened with `Inbox Omni` available. This confirms the account/navigation owner remains shared across the map-first Buyer, Seller and Reviewer surfaces; no role, claim, request or catalogue state was changed.

The read-only Inbox path opened successfully after the menu selection settled. At the available Sandbox viewport, `Compte J5 — Inbox Omni` shows the truthful `Inbox vide` state, `Actualiser`, and the boundary copy that claim/account events appear here first while PWA Web Push remains opt-in and OSM does not receive these events. The map canvas and public pin remain visible behind the rounded sheet; no notification was marked, sent, or mutated.


## 2026-08-24 — Canopy globe and search reveal checkpoint

The Canopy pass extended the existing Species/Buyer proof without opening a new business branch. Commits `38d37cb`, `bf72e22`, `375e4f2`, `5bff6ef` and `bc8e730` add and harden an explicit camera ownership model, interruption-safe RAF rotation, a bounded search reveal helper, a source-backed final result frame, a distinct user-position marker path and a slightly more legible soft-color basemap treatment. The public-facility API contract remains unchanged: idle nearby discovery uses viewport bounds, while text search is query-only and global within the bounded public dataset.

The canonical authenticated Browser Sandbox proof at `1024×880` showed the real query `Marche de Hanoukope` moving through `nearby-state-loading` to `nearby-state-ready`, then `cameraMode=search_reveal` with perceptible `Le continent → Le pays → La région → La ville → Facilités trouvées` stages and zoom `1.35 → 1.85 → 2.75 → 3.80 → 5.25 → 6.20`. The map remained mounted, the single projected public facility pin replaced the cluster at local framing, and the final result card remained available. Post-reveal Zoom avant changed zoom `6.20 → 7.20` and switched the camera to `manual_navigation` without losing the result. A performance-entry read showed one initial bounds request and one query-only request, with no continuous rotation/bounds cadence.

The same canonical session proved that hover pauses the globe at its current center, a controlled non-mutative mouse event on the search overlay releases the pause and resumes rotation without resetting the center, and a temporary bounded geolocation stub rendered the distinct accessible `Votre position sur la carte` marker before the native geolocation object was restored. No real location permission, claim, seller response, reviewer decision, role assignment or persistent business mutation occurred.

A standalone Playwright proof at `390×844` passed normal-motion rotation (`centerLng 2.3400 → 6.8200` at stable zoom `1.35`), enabled named controls, zoom `1.35 → 2.35`, full canvas geometry, contained guest dock and no horizontal overflow. A second `390×844` run with `prefers-reduced-motion: reduce` passed with `data-rotation=reduced`, unchanged center, enabled controls, working zoom and no overflow. These compact proofs are public guest evidence; authenticated compact result-sheet geometry, full keyboard traversal, real permission flow, facility-focus/back recovery, remote-tile resilience and full Seller/Reviewer responsive coverage remain open.

**Ring decision:** `partial / bounded Canopy evidence recorded; Species gate remains open`. The active next action is the smallest remaining Canopy matrix: authenticated compact result-sheet and Seller/Reviewer responsive/focus/recovery proof, followed by a separate Ring decision. Global Root remains `review`; no operational branch may advance from this checkpoint.


## 2026-08-24 — Canopy globe, reveal and responsive proof

The Canopy ring extended the existing Species/search repair without changing the public API or opening a business operation. Commits `38d37cb`, `bf72e22`, `375e4f2`, `5bff6ef` and `bc8e730` add an explicit camera ownership state, RAF globe rotation with pause/resume ownership, a bounded world→context→results reveal helper, final result framing, a distinct user-location marker path, soft-color map treatment and identical-query lifecycle invalidation.

The authenticated canonical Browser Sandbox proof at `1024×880` used the existing query `Marche de Hanoukope`. The nearby sheet showed loading then one ready public result; the map entered `search_reveal` and sampled stages `Le continent`, `Le pays`, `La région`, `La ville`, `Facilités trouvées` with zoom progression `1.35→1.85→2.75→3.80→5.25→6.20`. The single projected public pin replaced the cluster at local framing, the result card stayed present and the dock/sheet geometry measured `14px` apart with no overlap. Post-reveal Zoom avant reached `7.20` and manual navigation without losing the card. The request log contained one initial bounds request and one query-only request, with no continuous bounds cadence during reveal.

The same read-only session proved hover pause at the current center and a controlled synthetic overlay mouse event proved release/resume without resetting the camera. A temporary bounded geolocation stub rendered the accessible `Votre position sur la carte` marker and was restored immediately; real permission was not requested. Public Playwright at `390×844` passed normal idle rotation, full canvas, enabled named controls, zoom `1.35→2.35`, contained guest dock and no horizontal overflow. A second compact run under `prefers-reduced-motion: reduce` passed with no automatic rotation, unchanged center, enabled controls and working zoom. These are bounded visual/runtime proofs, not marketplace or production-readiness proof.

**Current decision:** `partial / Canopy evidence materially advanced; Species gate remains open`. Remaining gates are authenticated compact result-sheet and Seller/Reviewer responsive proof, full keyboard traversal, real location permission, empty/error/retry/recovery, facility focus/back restoration, remote tile resilience, deeper performance, and release-ring acceptance. Global Root remains `review`; the prior bounded private test claim is preserved and no role, claim, seller, reviewer, notification, wallet, transaction, QR, payment, OSM or PWA mutation was performed in this Canopy pass.


## 2026-08-24 — Canopy V3 re-entry: camera, rings, location and result recovery

The owner’s new Canopy feedback was treated as an `observed / user-reported` Species signal: the map needed darker/cleaner edges, unconstrained manual drag and rotation, position retention after release, a real location prompt/marker path, a more living discovery arrival than bare cluster counts, an intentional desktop composition, a recoverable search after results and a future path for checking multiple products. The focused companion contract is `omni-v2-canopy-v3-contract-2026-08-24.md`; no competing Root plan was created.

The V3 implementation keeps the MapLibre canvas dominant, applies the darker `deep-neutral` map treatment, renders public cluster density as calm concentric rings with the count secondary, preserves the facility pin with an inner location circle, and gives desktop a wider bounded contextual sheet without a side dashboard rail. The search result sheet now exposes `Nouvelle recherche`, `Affiner` and `Retour à la carte`; `Affiner` opens in its own upper surface and `Nouvelle recherche` clears the result back to map-only dock. The Species blueprint and maquette now carry this amendment explicitly.

On production deployment `dpl_HypoyQEouvDUqfKScLwm6LMmv61G` for commit `9b7ed9c`, a deterministic read-only camera run showed a left drag changing center `1.2200→-60.1860`, a right-button pivot changing bearing to `56.46`, three zoom clicks changing zoom `1.32→4.32` and switching projection `globe→mercator`; the map remained mounted. A corrected free-canvas run showed release at `center=-37.8814`, `mode=manual_navigation`, then after leaving to `Acheter` the camera resumed `mode=resting_globe`, `rotation=rotating` at `center=-37.6521`, proving the release position was retained rather than reset. These are native MapLibre gestures in a read-only context.

Production deployment `dpl_4h49A7jHsfgvddme6qwohw9VsC3x` for commit `60403a3` reached READY with the canonical aliases and exactly 12 Node functions. The same authenticated `Marche de Hanoukope` query was submitted twice across fresh/reloaded sessions. The first V3 pass exposed a real same-value React lifecycle defect: the second submission could set loading without re-running the effect because the query string was unchanged. Adding `searchRevealRevision` to the relevant effects fixed the path. The post-fix run reached `nearby-state-ready` with the real public card and the three explicit continuation actions. The query remained query-only; no facility CTA or business write was used.

The persistent authenticated browser observed the honest timeout/denied location state with `Localisation trop lente`, `Réessayer`, `location=denied` and no marker. A separate disposable production Playwright context granted synthetic coordinates `(1.22, 6.13, accuracy 25)` and observed `location=exact`, `userPosition=visible`, one marker labelled `Votre position sur la carte`, and one separate public cluster. The context was destroyed immediately; these coordinates are not personal data and were not sent to Omni.

Desktop result geometry at `1024×880` measured dock `553px` wide, sheet `717px` wide and `14px` dock-to-sheet gap, with no horizontal overflow. Compact public normal and reduced-motion proofs at `390×844` passed canvas mounting, adaptive rotation/reduced-motion behavior, enabled controls, zoom `1.35→2.35`, dock-sheet separation and no horizontal overflow. The normal proof script was made robust to an initial `idle` snapshot before rotation starts.

Multi-product availability remains deliberately **not implemented**. The current server contract accepts one product per request; V3 adds only an honest planning note in the Product step and does not fake a grouped request, persist a selection basket, or alter idempotency/expiry/response ownership. A Root/API decision is still required before any multi-product mutation or contract change.

**Current decision:** `partial / Canopy V3 materially proven; Species gate remains open`. Proven in this ring: dark map/rings, native manual camera and retained idle resume, permission-granted marker path with synthetic coordinates, denied/timeout fallback, identical-query recovery, explicit result refinement/exit, desktop/mobile spacing and 12-function release. Still open: full keyboard/focus traversal, authenticated compact result-sheet/Seller/Reviewer matrix, facility-focus/back recovery, remote tile reliability, deeper performance, exact real-user permission UX in the owner’s browser, and any multi-product Root/API design. Global Root remains `review`; no Ring is closed and no operational expansion is authorized.

## 2026-08-25 — Canopy V4.1 monochrome implementation checkpoint

The owner clarified that the approved map reference is the existing white/black/gray direction, not the green-toned V4 treatment. The implementation correction sets the map field/background to white, the ocean to near-black, land to white/light tones and geographic boundaries to charcoal/gray; it removes the green/sepia map wash and colored selected-facility halo while retaining MapLibre-native source/layer rendering for visible public facilities.

Rotation ownership is narrowed to the map interaction surface and explicit map controls. Search/options/Auth focus, J5/account and non-map navigation are not intended to pause idle globe motion. Primary globe drag now uses a deterministic vertical-axis helper: horizontal movement changes longitude responsively, vertical movement changes latitude within safe bounds, pitch remains zero and ordinary left drag does not change bearing. Minus, plus and recenter render together from the initial frame. The visible approximate-zone banner is replaced by a screen-reader-only status; automatic arrival remains non-recentering and explicit recenter remains available. The V3 session-attempt key is bumped so the current build can make a fresh permission-aware attempt.

The V4.1 source baseline now passes `git diff --check`, **122 tests across 18 files**, TypeScript/Vite build, `check:boundary` and exact 12-function bundling; the Vite chunk warning remains non-blocking. Bounded local browser proofs at `390×844` and `1024×880` confirm the white/black/gray direction, idle movement, direct map-only interruption, non-map search/Options/account continuity, vertical-axis globe drag, permanent controls, 16px mobile input, `visualViewport.scale=1`, no visible approximate-location band, reversible projection and zero visible HTML pin overlays. The local compact screenshot also confirmed the temporary error alert no longer obscures the three controls.

This remains an implementation and bounded-proof checkpoint, not full Species acceptance. Canonical production deployment proof, real-device/native touch proof, owner-browser permission proof, source-backed facility pins during a real result movement, full authenticated Buyer/Seller/Reviewer focus/recovery, keyboard traversal and remote-tile/performance coverage remain open. Species and Global Root remain `review`; multi-product availability remains Root/API-blocked.
