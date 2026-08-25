# Canopy V4.1 local visual check — 2026-08-25

Environment: local Vite preview at `http://localhost:4174/`, default wide viewport.

Observed: the MapLibre canvas mounted and the page reported `Carte active`. The visible globe rendered on a white field with very light/gray land treatment; source-backed map content was not green-toned in the sampled frame. The right-side controls were simultaneously visible: `Zoom arrière`, `Zoom avant`, and `Utiliser ma localisation`. The search dock stayed at the bottom and did not overlap the control stack. No visible approximate-zone banner was rendered; the browser text contained only the screen-reader location status `Localisation en cours…` while permission was being attempted.

Observed limitation: the local public-discovery request surfaced `La découverte publique est temporairement indisponible` with `Réessayer` in this local environment, so this check is palette/control/arrival-only and is not a result/pin proof. Further interaction proof is required for rotation ownership, vertical-axis drag, projection switching, and touch behavior.


## DOM/control checkpoint

The local DOM reported `data-basemap="monochrome"`, `data-projection="globe"`, `data-camera-mode="resting_globe"`, `data-rotation="rotating"`, `data-rotation-owner="map-only"`, one full MapLibre canvas (`1280×1100`), zero visible `.location-prompt` surface, and a screen-reader location status. All three map controls were simultaneously displayed at the same right-side stack: `Zoom arrière`, `Zoom avant`, and `Utiliser ma localisation`, each `38×38px` in the wide viewport. The local search input computed to `12px` at this desktop size, as expected for desktop; mobile 16px proof remains a separate check.

A direct zoom-in control click changed the globe visual scale and the rotation/location state remained permission-aware. The browser later reported the passive location attempt as `Localisation trop lente` without showing the old approximate-zone band. Local public discovery remained unavailable in this local preview, so result/pin behavior was not assessed here.


## Direct control reproduction

On the open local page, direct DOM activation of `.zoom-in-control` changed zoom `0.99→1.99`, and direct activation of `.zoom-out-control` changed it back `1.99→0.99`, both remaining in globe projection. This confirms the explicit control handler changes zoom; the mobile harness’s reverse-transition failure is isolated to the harness sequence/state timing and requires a revised proof before being counted as product evidence.


## Expanded mobile/browser proof

A bounded Playwright run at `390×844` with an isolated synthetic granted location context produced the following assertions: canvas mounted; all three controls visible and enabled from the first frame; search input computed to `16px`; no visible approximate-location prompt; screen-reader location status present; zero visible HTML `.map-pin` overlays; idle longitude changed over time; focusing the search input, opening/closing Options and opening/closing the account surface did not stop the idle globe rotation; zoom `2.35` remained globe, zoom `3.35` switched to mercator, and zoom `2.35` then `1.35` returned to globe; a synthetic one-touch globe gesture changed center longitude while preserving bearing. All assertions passed.

This is bounded local browser evidence, not owner-device proof. The generated screenshot and JSON report remain local proof artifacts and are intentionally not for the Git commit.


## Desktop/browser proof

A bounded Playwright run at `1024×880` reported `basemap=monochrome`, `projection=globe`, `cameraMode=resting_globe` and `rotation=rotating` at the initial frame. After 1.6 seconds, center longitude changed `4.3932→8.8262` while remaining globe/rotating. A primary left globe drag changed center to `-73.1132`, retained `bearing=0.00`, changed mode to `manual_navigation` and paused rotation. After the pointer left the map for the top bar, the camera remained near the released position and idle resumed: center `-73.0668`, `cameraMode=resting_globe`, `rotation=rotating`. All desktop assertions passed.


## Screenshot inspection

The desktop screenshot matches the intended neutral direction: white field, restrained grayscale globe, permanent minus/plus/recenter stack on the right and a separated bottom search dock. The mobile screenshot shows the intended grayscale globe, user position marker and compact search dock, but also reveals a layout issue: the local public-discovery error alert overlaps the first control position, making `Zoom arrière` visually disappear even though the DOM reports all three controls. This must be corrected before counting the mobile control proof as visually complete.


## Corrected mobile proof and screenshot

After moving the compact error alert to `calc(var(--safe-top) + 58px)` and the controls to `calc(var(--safe-top) + 122px)`, the regenerated `390×844` screenshot visibly shows all three controls: minus, plus and recenter, with a clear gap below the alert. The grayscale globe and black user-position marker remain visible; the search dock remains separated at the bottom.

The expanded local mobile proof now passes all assertions: canvas mounted, three controls visible/enabled, mobile input `16px`, no visible approximate band, screen-reader status retained, zero visible HTML pins, idle motion continuing, Options/account not pausing the globe, forward and reverse projection switching (`2.35` globe → `3.35` mercator → `2.35` globe → `1.35` globe), synthetic touch camera movement and unchanged bearing.


## Final mobile scale checkpoint

The final `390×844` proof also reported `visualViewport.scale=1`. Together with the computed `16px` search input and the stylesheet selector covering `.search-pill`, `.options-popover`, and `.omni-sheet` inputs/selects/textareas, this is bounded evidence against browser input zoom in the supported headless mobile context. It is still not a physical iOS device proof.


## Canonical V4.1 smoke check — 2026-08-25

The GitHub-triggered V4.1 deployment is live on `https://omni.sparkafrika.online/`. The canonical page reports `Carte active`, mounts one MapLibre canvas, renders the white-field grayscale globe and shows the three controls together: `Zoom arrière`, `Zoom avant` and `Utiliser ma localisation`. The search dock remains separated at the bottom. The loaded page has real public facility names and a signed-in account label, but no business action was taken. The location status is non-obstructive while the permission-aware attempt is in progress, and no visible approximate-zone band is present in the sampled frame.

This smoke check confirms the release is serving the V4.1 visual/control correction. It does not replace the bounded local touch proof or prove the owner’s physical-device permission and native pin-movement behavior.


## Canonical projection smoke

On the live canonical deployment, the read-only zoom sequence recorded `globe / 1.35 / rotating` → `mercator / 4.35 / paused` → `globe / 2.35 / paused`. The center longitude stayed unchanged during the control-driven projection sequence, the basemap remained `monochrome`, and the three controls remained present. No facility CTA, availability request, claim, seller action or reviewer action was used.


## V4.2 Positron visual checkpoint

Switching the remote style constant from Liberty to OpenFreeMap Positron matches the origin/main provider precedent, but the first local visual run exposed a regression: the MapLibre canvas and controls mount, yet the screenshot is a blank white field with no globe. The local DOM remains `Chargement de la carte`; the browser console showed no actionable MapLibre error in the sampled output. This is not acceptable as a visual proof and must be diagnosed before release. The previous Liberty-based V4.1 screenshot was visually present but too washed out; the target is the reference silhouette, not a blank canvas.


## V4.2 Positron diagnosis checkpoint

After nine seconds the local page changed to `Carte active`, and the browser requested the Positron style, planet source and sprite assets, but no vector tile or glyph `.pbf` resources appeared in the sampled performance list. The canvas remained a blank white field. This indicates that switching only the style URL is insufficient in the current direct MapLibre controller; the origin/main loading path also rewrites OpenFreeMap glyph URLs and owns its MapLibre instance through `useMapLibreState`. The implementation must either reproduce that loading path or return to the last known-good Liberty path with a reference-compatible vector treatment. A blank canvas cannot be accepted.


## External style reference notes

The live [OpenFreeMap Liberty style](https://tiles.openfreemap.org/styles/liberty) includes a `natural_earth` raster layer sourced from `ne2_shaded` with zoom-interpolated opacity, which explains the washed globe behavior when the vector palette is applied underneath it. The live [OpenFreeMap Positron style](https://tiles.openfreemap.org/styles/positron) begins with vector `background`, `park`, `water`, `landcover` and `boundary` layers and is the provider used by `origin/main` through its shared `PASTEL_STYLE_URL` helper. In the current direct controller, switching to Positron alone produced `Carte active` but no visible globe and no sampled vector-tile/glyph `.pbf` resources, so the origin/main loading path or a known-good provider fallback must be reproduced before accepting the switch.


The Positron source metadata exposes `https://tiles.openfreemap.org/planet/20260816_080001_pt/{z}/{x}/{y}.pbf`, and a representative tile returned HTTP 200 with `application/vnd.mapbox-vector-tile`. The blank local frame is therefore a client/style loading-path issue, not evidence that the provider is unavailable.


## V4.2 compact visual checkpoint after glyph-path fix

The regenerated 390×844 screenshot now shows the expected white field, compact role/account controls, stable minus/plus/recenter stack, a small neutral user marker, no visible location chip and the separated bottom dock. However, the geographic globe itself is still absent in the captured frame; the surface remains white apart from the user marker and UI. The DOM/browser proof can report a mounted canvas and camera transitions, but this screenshot is not sufficient visual proof of the reference map. Desktop output must be regenerated separately, and the remote vector layer visibility/loading issue remains an open diagnostic until a globe is visibly captured.


## Provider comparison checkpoint

The local compact screenshot was rerun on Liberty after adding `natural_earth` visibility suppression. It remains a white field with only the neutral user marker and UI; the geographic globe is still not visible. The mobile DOM/camera assertions continue to pass, but both Positron and Liberty are now visually unproven in this current local direct-controller session. The provider switch alone is not the solution; the next implementation step must compare the active remote style loading path against the origin/main map wrapper and capture an actual map frame before release.


## Positron final diagnosis

After reloading the local preview with Positron plus the origin/main glyph rewrite and waiting twelve seconds, the page reported `Carte active` and the camera state continued to rotate, but the screenshot still showed a blank white field. The performance list contained only the Positron style, `/planet` TileJSON and sprite assets; no `.pbf` requests appeared. Positron cannot be selected as the current V4.2 provider without reproducing the origin/main MapLibre wrapper or identifying the missing vector-tile trigger. The direct controller must keep the last known-good Liberty provider for release safety, while the requested visual still requires a real visible geographic frame.


A safe plus-control test moved the local Positron map from zoom `1.35` globe to `6.35` mercator, but the canvas remained visually blank and no `.pbf` resources appeared. The issue is not limited to low-zoom globe rendering; Positron’s vector source is not being consumed by this direct controller in the local proof environment.


## Positron lifecycle diagnostic

A development-only local inspection showed a real MapLibre instance with the Positron style layers and sources `ne2_shaded`, `openmaptiles` and `omni-v2-facilities`, but `isStyleLoaded=false`, `areTilesLoaded=false` and `isSourceLoaded('openmaptiles')=false`. After a further fifteen-second wait, these states remained unchanged and no `.pbf` resource appeared. The UI’s `Carte active` text is therefore misleading in this state because the status is set by the existing deferred path rather than a fully loaded style. Positron must not be released from this direct controller until the loading state is corrected; the diagnostic hook is development-only and must be removed before commit.


## First successful reference silhouette

After restoring Liberty’s raster and applying a transparent map background plus globe-only `grayscale → contrast → invert → brightness` treatment, the local browser visibly rendered the globe again. The field outside the globe is white and the ocean silhouette is near-black, which matches the owner’s reference direction. The land is still medium/dark gray rather than white/light gray in this frame, so the raster filter needs one more contrast/brightness calibration before the visual target can be marked as matched. This is now an actual visual map frame, unlike the earlier blank Positron screenshots.


## Africa-centered reference comparison

A diagnostic Africa-centered frame now visibly matches the key composition from the supplied reference: the application field is white, the globe has a near-black ocean silhouette, and the African/European land masses read light against it. The treatment is intentionally produced by a globe-only grayscale/invert/brightness filter over the existing Natural Earth raster, while local mercator remains non-inverted. The frame has no permanent `Votre position` chip and no heavy selected-region highlight. Boundary detail is visible but still raster-derived and softer than the reference; final release proof must confirm that local vector boundaries/roads remain readable after projection transition.


## Settled compact reference frame

With the proof harness waiting twelve seconds for the remote raster, the 390×844 screenshot now captures the actual reference-style globe. Africa is visibly framed inside a near-black ocean silhouette, the surrounding application field is white, land is light/gray, the user marker is a small neutral in-map ring without a `Votre position` chip, and minus/plus/recenter remain simultaneously visible at the right with safe separation from the temporary discovery error surface. This is the first compact screenshot that can be compared meaningfully with the supplied image. The raster land has natural relief rather than a flat white fill; the target’s key contrast and composition are present without the rejected heavy highlight.


## Settled wide reference frame

The 1024×880 desktop proof now captures the actual globe after the final render settle delay. The globe is visible with a near-black ocean, light/white land, a white surrounding field and restrained geographic relief. The role switch, J5 indicator, permanent minus/plus/recenter controls, temporary public-discovery error surface and bottom dock are separated without overlap. The frame has no dark selected-region highlight and no `Votre position` chip. Camera assertions remain all-pass: idle movement, direct drag, retained camera, map-leave resume and stable bearing axis.
