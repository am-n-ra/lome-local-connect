# Omni V2 buyer usability contract — zoom, location and result rail

## Scope

This ring corrects three buyer Trunk blockers without changing public facility pin semantics, discovery data, Neon Auth identities or the Roots schema: map zoom, explicit location permission and facility-card composition.

## Location contract

Omni must not trigger a browser location permission prompt silently on initial page load. The map must present a visible `Search near you / Use my location` action. Clicking it requests the browser permission through `navigator.geolocation`.

The visible state machine is `idle → requesting → granted`, with `denied` and `unavailable` recovery states. `granted` centers the MapLibre camera on the returned coordinates at a useful local zoom. `denied` tells the buyer how to enable permission and offers `Try again`; `unavailable` preserves public exploration and does not block the map.

## Zoom contract

The buyer must be able to zoom using the left-side `Zoom in` and `Zoom out` controls and through ordinary pointer wheel/touch map gestures. The map controls must not be covered by discovery copy, facility cards, the dock or location messaging. Camera changes must be observable in the map state and must pause idle globe rotation until the map settles.

## Facility-card contract

At desktop widths, the result rail may use a compact horizontal layout centered above the dock. At mobile widths, cards become a contained vertical rail with a left gutter reserved for the map-control stack, a bounded height and internal scrolling only when necessary. Cards must retain facility name, category/offer summary, trust state and a clear tap target. The rail must not overlap the controls, location prompt or dock.

## Responsive acceptance

The ring is accepted at 320, 375, 768 and 1280 CSS pixels when body width equals viewport width; every required control is reachable; base and Options-open states have no measured rail/control, rail/dock, location/control, location/rail or location/dock collision; and public/detail APIs remain unaffected.

## Deferred proof

A real human permission prompt and authenticated availability write still require a user-controlled browser session. This ring proves the request surface and the granted-permission behavior with controlled browser permission, but it does not create or delete any Auth identity.
