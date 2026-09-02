
## Console measurement checkpoint

A first browser-console drag dispatch was scheduled against the local canvas. The console runner returned `undefined` for the asynchronous expression, so that attempt is not treated as proof. No state or data mutation was intended. A deterministic Playwright pointer test will be used for the next measurement rather than inferring interaction from the console runner.

## Native gesture proof on local V3

A deterministic Playwright run at 1024×880 measured the local V3 stage. Before interaction: center longitude `1.2200`, zoom `1.35`, bearing `0.00`, mode `resting_globe`. After a 180px left-button drag: center longitude `-67.6047`, zoom `1.31`, bearing `0.00`, mode `manual_navigation`. The camera therefore accepted a material native pan and did not reset. A subsequent right-button drag changed bearing to `64.23`; a subsequent Ctrl+left drag changed bearing to `112.35`. All remained `manual_navigation` and `rotation=paused`. This proves the patched native interaction path locally. Production proof remains pending after deployment, and the map visual remains to be darkened in the next UI slice.

## V3 visual/browser checkpoint

After the V3 CSS patch, the local 1024×880 screenshot is materially darker than the previous production frame: the globe edges and land/water separation read more clearly, while the map remains cool and restrained. The local public API still returns the honest unavailable state, so no facilities/cluster ring can appear there. The current persistent browser context did not show a location state after reload; because the new arrival guard is session-scoped, this context may already contain `omni.canopy.v3.location-attempted`. A clean-session geolocation proof is required rather than treating this reload as failure.

## Clean location-session setup

The local browser session guard `omni.canopy.v3.location-attempted` was removed and the page was reloaded. This altered only the temporary session flag; it did not request, store or expose any coordinate. The fresh arrival state is ready for browser observation.

## Geolocation proof with synthetic granted permission

A temporary Playwright browser context granted geolocation using synthetic demo coordinates `(longitude 1.22, latitude 6.13, accuracy 25)`. The local V3 arrival reported `location=exact`, `userPosition=visible`, `markerCount=1`, accessible label `Votre position sur la carte`, and `cameraMode=manual_navigation`. The test context was destroyed immediately; the coordinates were not sent to the application API, written to project files, or persisted. This proves the UI path with granted browser permission. A real production prompt/denied outcome remains subject to the user’s browser permission state and must be reported separately.

## Production V3 initial arrival

Vercel deployment `dpl_HypoyQEouvDUqfKScLwm6LMmv61G` reached `READY` and serves the canonical aliases including `omni.sparkafrika.online`. The fresh production browser view at 1024×880 now shows the V3 darker map treatment, real public data with one visible ring cluster and accessible count `4`, and the new arrival location state `Localisation en cours…` with `Annuler`. The account orb reflects the authenticated Sandbox session (`DE`), but no sensitive identity was recorded. The browser proof is read-only.

## Production camera proof on READY deployment

A deterministic Playwright run on the production domain measured the real V3 stage. Before the gesture: center longitude `1.2200`, zoom `1.35`, bearing `0.00`, projection `globe`, mode `manual_navigation`, location `denied`, user marker hidden, one cluster. After a 190px left drag: center longitude `-60.1860`, zoom `1.32`, bearing `0.00`, mode remained `manual_navigation`. A right-button drag then changed bearing to `56.46` without resetting the center. Three Zoom avant clicks moved zoom to `4.32` and projection to `mercator`; the cluster disappeared as the map entered local context. The production browser context reported `location=denied` and `userPosition=hidden`, which is an honest permission-denied path rather than a fake marker.

The first pointer-leave sample moved to `(8,8)`, which is still inside the full-viewport map canvas. It therefore stayed `manual_navigation/paused`; this does not disprove delayed resume. A follow-up must move over a real overlay/control or outside the viewport and then measure current-position idle behavior.

## Production idle-resume proof

A follow-up production run started from a free canvas point, avoiding the central cluster overlay. After release, the camera was `center=-37.8814`, `zoom=1.34`, `mode=manual_navigation`, `rotation=paused`. After moving the pointer over the `Acheter` control and waiting 2.4 seconds, the camera was `center=-37.6521`, `zoom=1.34`, `mode=resting_globe`, `rotation=rotating`. The center remained different from the initial `1.2200` and changed only by the resumed slow rotation, proving the release position was retained and idle resumed from that position.

## Production search re-entry proof

On the authenticated Sandbox session, submitting `Marche de Hanoukope` on production immediately kept the search dock mounted above the result surface. The DOM exposed the reveal stage `Le continent`, the result heading, and the new visible actions `Nouvelle recherche`, `Affiner`, and `Retour à la carte` while the sheet transitioned through loading. This is read-only and uses the prior bounded search fixture; no availability or facility CTA was activated.

## Production ready result and exit proof

The production result settled on a real local OSM frame with visible country/region/road labels and one source-backed facility pin. The ready DOM exposed `Nouvelle recherche`, `Affiner` and `Retour à la carte` alongside the retained search dock. Activating `Retour à la carte` removed the result sheet and left the query in the dock with the map still mounted and navigable. No facility detail, availability CTA, claim, seller or reviewer write was opened.

## Re-entry transition checkpoint

Submitting the same query again from the retained dock reopened the nearby sheet and showed `Recherche de « Marche de Hanoukope »…` in the sheet, confirming that the result surface can be re-entered without leaving the map. The next ready state will be used to test `Affiner` and `Nouvelle recherche` directly.

## Search loading diagnosis

The second same-query run appeared loading at the 18:44 view, but read-only resource timing showed the expected query-only request completed: one initial bounds request and one `/api/v2/public/facilities?q=Marche+de+Hanoukope` request with approximately 600ms duration. The loading snapshot was taken before React’s completion/reveal settled, so a post-network view is required before calling this a regression. No duplicate bounds cadence or business mutation occurred.

## Second production release

The repeated-search fix was pushed as commit `60403a3` and Vercel deployment `dpl_4h49A7jHsfgvddme6qwohw9VsC3x` reached `READY` with `lambdaRuntimeStats={nodejs:12}`. A fresh canonical production load now shows the V3 arrival cluster ring, darker map, dock and authenticated account context with no stale result sheet. The same-query loading regression is ready for a post-fix proof.

## Repeated-search fix proven in production

On the second READY production release, re-submitting the identical query `Marche de Hanoukope` first showed the expected loading state and then reached `ready` with the real public card. The result sheet exposed `Nouvelle recherche`, `Affiner` and `Retour à la carte`; the earlier permanent-loading behavior is therefore resolved. The map remained mounted and the only facility action visible was the read-only `Voir le lieu` path for the public result.

## Responsive proof on final production release

The committed responsive proof script was made timing-robust: normal mode may start in `idle` and must be rotating after the observation delay. On the final production release, the 390×844 normal run passed `rotationMoved`, `controlsEnabled`, `zoomIncreased`, `dockSheetSeparated` and `noHorizontalOverflow`; it reported `data-basemap=deep-neutral`, `data-rotation=rotating`, zoom `1.35` before the control click and `2.35` after it. The reduced-motion run passed the same assertions with `data-rotation=reduced`, unchanged center longitude during the idle interval, and zoom `1.35→2.35`. The dock measured `left=27`, `right=363`, `top=781`, `bottom=830`, and the map canvas remained full `390×844`.

## Desktop composition proof

At 1024×880 on the authenticated production result state, DOM measurement returned a bounded nearby sheet `left=154, right=870, width=717, top=585`, a separate search dock `left=236, right=788, width=553, top=522, bottom=571`, and a `14px` dock-to-sheet gap. The result toolbar occupied the sheet width and exposed exactly `Nouvelle recherche`, `Affiner`, and `Retour à la carte`. `document.documentElement.scrollWidth` did not exceed the viewport. This is intentionally wider and more spatially generous than the mobile 390px composition, while remaining a bottom contextual surface rather than a dashboard rail.

## Refine and new-search proof

From the ready production result, `Affiner` opened the options popover in a separate reserved area above the dock; the map controls and result sheet remained visible and distinct. Activating `Nouvelle recherche` then closed the options and result sheet, cleared the query and restored the map-only dock with the public map and clusters. This path is read-only and leaves no request, claim or availability mutation.

## Production granted-location proof

A temporary production Playwright context granted geolocation with the same synthetic demo coordinates `(1.22, 6.13, accuracy 25)`. The real deployment reported `location=exact`, `userPosition=visible`, `markerCount=1`, accessible marker label `Votre position sur la carte`, `cameraMode=manual_navigation`, and one separate public cluster. The context was destroyed immediately; no coordinate was sent to the API or written to project documentation. The persistent Sandbox browser separately proved the denied/timeout recovery states.


## 2026-08-24 — Canopy V4 re-entry: new owner observations

The owner added a new set of Species/Canopy observations after the V3 release. These are recorded as `observed / user-reported` and are not yet implementation acceptance:

1. Globe↔normal map projection must switch automatically in both directions at a zoom threshold, rather than showing raster/globe pixel artifacts or requiring a manual mode change.
2. Facility pins must remain part of the moving map context while the camera moves. They must not look like HTML objects temporarily detached from the map and then reattached after the camera settles.
3. The mobile arrival should not be automatically centered on the user; that state hides useful map space and is not considered necessary for the core discovery experience.
4. Tapping anywhere in the mobile search text field must not trigger browser input zoom or an aesthetically incorrect viewport scale change.
5. Darker means stronger continent/country edges and a darker ocean, while land should remain lighter and cleaner. The branch-main grey highlight treatment should not be copied.
6. When a facility is selected and its result grid/sheet is closed, selection/focus must be cleared rather than leaving the map visually focused on a closed facility.

The current V3 audit already proves a partial zoom projection switch, but not its bidirectional visual quality through repeated zoom-in/zoom-out. The current visible facility layer is an HTML projected overlay (`groupProjectedFacilities`), which is the likely cause of the detached-pin perception; this requires a mini-root/rendering decision before replacing or synchronizing it. The current arrival attempt explicitly calls `requestLocation()` and the success callback recenters to the user, so the mobile non-centered rule requires a contract change, not only CSS. The current interactive inputs use `12px`, below the common mobile anti-auto-zoom threshold, so all focused dock/options/auth inputs need a deliberate minimum-size contract. The current nearby collapse callback closes the sheet but does not clear `selectedFacility`, so the focus-loss request has a concrete state-owner defect.

No code has been changed for these V4 observations at this checkpoint. Preserve the existing public data, Auth identities, submitted bounded claim, availability contract and 12-function release path while diagnosing the smallest coherent patch.


## 2026-08-24 — Canopy V4 local browser checkpoint

The local V4 instance loaded the new dark-ocean treatment and showed the revised arrival copy `La carte reste sur votre vue pendant la demande.` The local API then entered the honest fallback/unavailable state, so no source-backed public facility or native cluster was available for this isolated view. This is not treated as proof of vector layer styling or pin anchoring. The local browser showed no unexpected mobile recenter in the arrival frame; the location request remained cancellable. The next proof must use the real production API after deployment.


## 2026-08-24 — Canopy V4 production initial view

Deployment `dpl_2WVikNUNw82fPyKqwHFPJ2bJtCUE` reached READY and the canonical domain loaded the V4 shell. The first production view showed the dark ocean treatment, right controls, role switch, account orb and bottom search dock. The first wait still reported `Chargement de la carte` and did not yet show source-backed facilities or the location state, so this is only an initial shell checkpoint. A later stable view is required before measuring native pin presence and projection transitions.


## Production V4 stable arrival and native-renderer checkpoint

The stable canonical V4 view loaded four source-backed public facilities, the dark-ocean/light-land globe and the existing authenticated session. At `zoom=1.35`, the DOM reported `projection=globe`, `center=42.9025`, `bearing=0.00`, `location=idle`, `userPosition=hidden`, one MapLibre canvas, `visibleHtmlFacilityPins=0` and four `.map-pin-a11y` buttons. This confirms the visible facility renderer is no longer the projected HTML overlay; the four HTML buttons are the keyboard fallback only. The current session had no location state, so no arrival recenter or marker was fabricated.


## Production V4 zoom-in checkpoint

After one read-only `Zoom avant` action, the real production stage moved from `zoom=1.35` to `zoom=2.35`, kept `projection=globe`, changed center longitude to `105.7532` through the existing idle/manual camera behavior, retained one MapLibre canvas and reported `visibleHtmlPins=0`. The bidirectional projection threshold has not yet been crossed at this sample.


## Production V4 bidirectional projection checkpoint — zoom in

After the second read-only zoom, production reported `zoom=3.35`, `projection=mercator`, `center=141.4093`, `bearing=0.00`, one MapLibre canvas and `visibleHtmlPins=0`. The visible screenshot changed from the globe to a normal local-map projection while retaining the dark-ocean/light-land direction. The projection switch occurred automatically at the V4 threshold; no camera reset was observed.


## Production V4 bidirectional projection checkpoint — zoom out

A read-only zoom-out from the local-map state returned production to `zoom=2.35`, `projection=globe`, `center=156.2686`, `bearing=0.00`, one MapLibre canvas and `visibleHtmlPins=0`. The globe reappeared from the current camera rather than resetting to the initial center. This proves both directions at the DOM/render level; street-label quality and high-zoom facility rendering still require a dedicated result search proof.


## Production V4 result checkpoint — remote style issue observed

The canonical V4 search `Marche de Hanoukope` reached `ready` with the retained dock, result toolbar (`Nouvelle recherche`, `Affiner`, `Retour à la carte`) and a source-backed public card. However, the production map status reported `Carte en mode de secours` and the screenshot showed the fallback globe/local frame rather than a fully rendered Liberty vector basemap. No visible facility pin was counted in the HTML (`map-pin` remains absent by design), and this state is not accepted as proof of native vector pin visibility. The remote style/tile failure must be diagnosed before claiming the V4 visual goal.


## Production V4 remote-style diagnosis

The production console did not expose a MapLibre exception, but resource timing showed many OpenFreeMap `natural_earth/ne2sr` tile requests. The style endpoint is therefore reached and at least its natural-earth background assets load; the current visible `Carte en mode de secours` state is driven by the application fallback flag rather than a simple missing network request. Native pin visibility is still not proven in this result because the current map status is fallback. The next step is to inspect MapLibre style/error timing and, if needed, keep the existing stable OSM raster style while applying the V4 dark palette through an additive style layer instead of depending on the remote vector style.


## Production V4 post-fallback patch reload

After deployment `dpl_ApabU8DnQR48ikjBQxGFXfcaAALK` reached READY, a fresh canonical navigation and a second wait both remained visually blank with no interactive elements detected. This is a new production loading failure relative to the earlier V4 shell. No business action was taken. The next step is console/network diagnosis; the V4 gate is not accepted while the canonical page fails to mount.


## Production V4 post-fallback diagnosis resolved

The blank screenshot was a transient browser loading frame. The subsequent DOM interrogation showed a mounted `main.species-app`, a MapLibre canvas, four keyboard fallback facility buttons, `Carte active`, `projection=globe`, `zoom=1.35`, `rotation=rotating`, and no location recenter. The production page therefore mounted successfully after the deferred fallback patch. A stable visual wait is still required to verify actual vector tiles and native MapLibre features.


## Production V4 stable style checkpoint

The post-patch production view now reports `Carte active`, `projection=globe`, `zoom=1.35`, `rotation=rotating`, one MapLibre canvas, four accessible fallback buttons and `visibleHtmlPins=0`. The computed canvas treatment is `saturate(0.88) sepia(0.01) brightness(0.94) contrast(1.08)`. The stable screenshot shows the intended dark ocean and light land globe; the native feature layer is now the only visible facility renderer. The current stable frame has no user marker and does not recenter on arrival.


## Production V4 stable zoom checkpoint

From the stable V4 globe, one read-only zoom reached `zoom=2.35`, kept `projection=globe`, preserved `visibleHtmlPins=0`, and reported `rotation=rotating` in the sampled DOM. The screenshot remained a single continuous globe. Because the plus-control transition and the RAF state can overlap in the same frame, a second sample after the threshold is required before interpreting the rotation flag; no visible facility overlay was introduced.


## Production V4 stable bidirectional zoom proof — local map

After the second zoom from the stable globe, the production DOM reported `projection=mercator`, `zoom=3.35`, `center=-129.7551`, `bearing=0.00`, `rotation=paused`, `status=Carte active`, `visibleHtmlPins=0` and `a11yButtons=0` at this moment. The V4 switch is therefore active on the live map and the rotation pauses on the user action. The screenshot shows the normal map projection; this sample did not yet contain a visible facility at the current center, so facility pin tracking remains to be proven with a focused result frame.


## Production V4 real search checkpoint

The production search for `Marche de Hanoukope` completed with `Carte active`, the retained input dock, the result sheet, the public facility card and the three recovery actions. The current screenshot still showed a pale low-detail local frame at the reveal checkpoint and no HTML pins, which is consistent with native MapLibre rendering but does not by itself prove that the result has reached the intended street/neighborhood zoom or that the native facility feature is visible. This remains a visual-quality checkpoint, not final acceptance of the pin/raster/vector requirement.


## Production V4 result framing proof

After the reveal settled, production reported `cameraMode=manual_navigation`, `projection=mercator`, `zoom=12.80`, `reveal=idle`, `status=Carte active`, an open result sheet, `htmlPins=0` and `a11yPins=1`. This confirms the new result frame reaches local-map scale and keeps the visible marker responsibility inside MapLibre rather than the old HTML overlay. The single facility card corresponds to the one public result; street/neighborhood raster detail is rendered on the map canvas, while the pin’s exact on-screen position requires a visual screenshot at a less obstructed sheet state for full acceptance.


## Production V4 result exit and focus proof

From the ready result state, `Retour à la carte` removed the nearby result sheet and any facility panel, left the search dock present with the query retained, changed the camera mode to `manual_navigation`, reported no `selected_facility` mode and kept `visibleHtmlPins=0`. This proves the explicit exit clears the facility focus context rather than leaving a stale selected grid/pin state.

The standalone compact Playwright run also confirmed canvas mounting, 16px mobile input sizing, no HTML marker overlay and no horizontal overflow, but its reduced-motion sequence did not cross the projection threshold before the result wait; it is retained as partial evidence rather than a full V4 acceptance proof.


## Production V4 free-globe gesture proof — deployment `6399b68`

The refreshed production camera proof passed on `1024×880`. Initial state was `centerLng=1.2200`, `bearing=0.00`, `zoom=1.35`, `projection=globe`, `cameraMode=manual_navigation`, one MapLibre canvas and zero visible HTML pins. A left drag changed the center to `-51.9800` and bearing to `34.20`; a subsequent right-button pivot kept the center and changed bearing to `-85.80`. All frames kept `cameraMode=manual_navigation`, zero HTML facility pins and a valid globe projection. This is the required proof that the free globe gesture is no longer blocked and the released camera is preserved.


## Production V4 manual camera and idle-resume proof

The enriched production Playwright proof on `1024×880` passed all camera assertions. Initial state: `centerLng=1.2200`, `bearing=0.00`, `zoom=1.35`, `projection=globe`. Left drag produced `centerLng=-51.9800`, `bearing=34.20`, `cameraMode=manual_navigation`. Right-button pivot kept the center and produced `bearing=-85.80`. After moving to the topbar and waiting, the state became `cameraMode=resting_globe`, `rotation=idle`, with the same `centerLng=-51.9800` and `bearing=-85.80`; no reset occurred. One MapLibre canvas and zero visible HTML pins persisted throughout.
