
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
