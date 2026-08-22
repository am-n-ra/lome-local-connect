# Pre-Heartwood buyer correction audit — 2026-08-22

## Canonical domain

Target: `https://omni.sparkafrika.online/`

The initial browser navigation loaded the V2 buyer page and extracted the following live content: `Omni V2`, `© OpenStreetMap contributors · © OpenMapTiles`, `Live map`, the Omni logo/wordmark, `live discovery`, `The world around you`, `3 public places in view`, and `Public exploration · account required to verify`.

The connected browser viewport inspection then returned HTTP 504 from the browser bridge. This is recorded as an inspection limitation, not as a functional UI failure. Playwright remains the repeatable visual/geometry proof path.

## Reported defects to reproduce and close

1. The floating `The world around you / 3 public places in view` caption is too close to the left map controls and must move into the dock metadata or a dedicated non-control zone.
2. Manual map zoom is reported as unavailable; both explicit `+/-` controls and direct wheel/touch behavior must be tested.
3. The map should use a modern grayscale direction while preserving OSM attribution and Omni orange pin semantics.
4. The top-left icon should show the supplied pin/eye mark without a decorative background box.
5. Idle globe rotation must be observed in a normal-motion browser and stopped by interaction; reduced-motion behavior must remain disabled.
6. Neon Auth must be diagnosed separately on the client and server. Missing runtime configuration must remain explicit and must not be bypassed with a fake token or client-trusted identity.

## Non-negotiable preservation

No Neon Auth identities, historical tables, legacy rows or Roots invariants may be deleted or modified as part of this correction slice.

## Updated screenshot findings after the first correction pass

At 320 px, the floating caption is gone from the left control area. The map controls are isolated on the left, the result rail is above the dock, and the dock now displays `3 public places in view`. Direct zoom buttons are visible. The live screenshot still shows a pale square around the top-left logo mark; this appears to be baked into the RGB logo asset rather than introduced by a CSS background and requires a transparent asset treatment or a carefully isolated replacement.

At 1280 px, the grayscale OSM map is visible with the white land / gray water direction, Omni orange pins, separated left controls, facility rail and bottom dock. The top-right menu/live chip are clear. Attribution remains in the upper metadata band. The desktop screenshot shows no caption/control collision and the map remains dominant.
