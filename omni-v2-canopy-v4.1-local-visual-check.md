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
