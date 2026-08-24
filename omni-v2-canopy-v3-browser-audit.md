
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
