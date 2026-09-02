# Species dock visual review

**Date:** 2026-08-22
**Artifact reviewed:** `docs/maquette/omni-species-maquette.png`

The rendered maquette now presents four explicit dock states in the first row: map-only bottom dock, nearby-result dock in its own band above the lower sheet, focused dock, and options surface attached above the dock. The result-state dock is visually separate from the lower card surface; the default map-only state has no grid beneath it. The focused and options states keep the map fixed and put the submit action at the right edge, with the chevron remaining a separate control.

The second row retains the supplied reference composition as the buyer nearby-result frame. The remaining rows extend that same sheet, card, and map language through facility/catalogue, availability, Auth, seller, transaction and recovery states.

This is a visual review of the static maquette, not proof of the application code. The implementation remains frozen at the Species gate until the corrected dock contract is approved.

## Final spacing correction

The regenerated render was inspected after changing `.separated-phone .search` from the overlapping position to `bottom: 242px` and removing the pseudo-surface that visually occupied the same zone as the dock. In the nearby-result frame, the dock now sits above the sheet with a visible separation; the grid/sheet begins below its own boundary. The map-only, focused and Options states remain separate and do not introduce a result surface beneath the dock.

## Final rendered inspection

The final render shows the result-state dock in its own narrow band above the `Proche de vous` sheet, with a visible gap rather than a shared/overlapping edge. The map-only dock remains at the bottom. The Search/Options journey now places the Options surface in the open central corridor, leaving the upper role navigation and right-side map controls unobstructed. The geometry proof passed at 320, 375, 768 and 1280 pixels.
