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

## Final screenshot findings after the second correction pass

At 320 px, the top-left pin-and-eye mark is now shown without the rectangular white asset background. The globe is visibly rendered in a restrained gray/white treatment, the map controls are separate on the left, and the dock owns the `3 public places in view` context. The `+` and `−` controls are visibly reachable.

At 1280 px, the same transparent logo treatment and grayscale globe scale cleanly to desktop. The globe is dominant, the left map-control stack is isolated, facility rail and search dock are separate, and the metadata remains above the map interaction zones.

The final proof artifact reports `data-basemap=monochrome`, `data-zoom-enabled=true`, zoom transitions from 1.35 to 2.35 and back to 1.00, and normal-motion center longitude changes from 1.22 to 1.30 before interaction pauses rotation.

## Buyer zoom, location and facility-rail correction — final visual findings

At 320 px, the new `Search near you / Use my location` prompt is visible in its own upper-left band. Facility cards now form a readable contained vertical stack beginning at x=58, leaving the x=12–46 map-control stack unobstructed and ending above the search dock. The three cards retain names, offer/category summaries and trust badges. The `+` and `−` controls remain visibly reachable.

At 1280 px, the location prompt occupies a compact upper-left surface without competing with the metadata band, and the three facility cards form a wider horizontal rail above the dock. The map remains dominant and the left control group stays isolated.

The settled post-deploy probe measured three cards at both 320 and 768 widths. At 320 px the rail was x=58–308 and y=503–652 while controls were x=12–46 and y=476–594; at 768 px the rail was x=90–678 and y=602–652 while controls were x=23–61 and y=464–594. All rail/control, rail/dock, location/control, location/rail and location/dock collision flags were false. Initial geolocation state was `prompt`, confirming the browser permission is requested from an explicit user action rather than silently on page load.
