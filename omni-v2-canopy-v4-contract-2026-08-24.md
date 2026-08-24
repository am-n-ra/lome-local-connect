# Omni V2 — Canopy V4 contract, 2026-08-24

**Structural path:** produit → Species → Canopy → carte → caméra/pins → dock mobile → focus de facilité  
**Status:** `approved for bounded implementation; release gate remains open`  
**Authorities:** `v2-seed.md`, `v2-flow.md`, `v2-species.md`, `docs/maquette/omni-species-maquette.md`, `omni-v2-canopy-v3-contract-2026-08-24.md`, current V2 map contracts and `origin/main` comparison

## Mini-seed

The user must experience one continuous geographic world. At low zoom, Omni presents a calm globe; as the user zooms in, the map becomes a normal local map with readable roads, neighborhoods and boundaries. Public facility pins must move with the map as map content, not appear as detached HTML stickers. On mobile, the arrival must preserve useful map space, text entry must not trigger browser viewport zoom, and closing a facility result must clear its visual focus. Existing public data, Auth, availability and claim boundaries remain unchanged.

## Species amendment

The reference direction is the main-branch map treatment: a dark ocean, lighter land, stronger country/continent edges and no heavy grey highlight wash. The V4 map remains sparse and modern. It does not add a dashboard rail, a second search surface or a new business state.

## Camera and projection contract

| Rule | Contract |
|---|---|
| Globe threshold | `zoom < 2.4` renders MapLibre `globe`; `zoom >= 2.4` renders MapLibre `mercator` |
| Hysteresis | Use a small transition band or guarded state so repeated zoom events cannot thrash projection at the threshold; transition must be bidirectional |
| Ownership | User drag, pan, rotate, wheel and zoom pause idle motion and own camera; no reset to initial globe |
| Projection transition | Switch on the live MapLibre zoom event, preserve center/bearing/pitch, call resize/repaint and keep the same facility source visible |
| Local context | At zoom `>= 2.4`, normal map remains interactive up to the existing max zoom; no artificial return to a low zoom |
| Idle | Idle rotation is allowed only below the globe threshold and resumes from the current camera after the existing delay; it must not resume while a contextual surface or gesture owns the map |

The threshold is an implementation contract, not a claim that a particular raster/vector provider can guarantee every street label. Provider quality remains separately proven. The existing OSM/OpenFreeMap path is allowed; changing provider configuration must remain additive and reversible.

## Pin rendering contract

The visible facility renderer must have one authoritative coordinate space. The preferred implementation is MapLibre-native GeoJSON source/layers for public clusters and facilities, because MapLibre reprojects source features during every camera transform. If an accessible HTML overlay is retained temporarily, it must be updated from the live `move` event without frame gaps, must not be hidden during movement, and must share the same projection/padding as the map. A static overlay that is only refreshed after `moveend` is not accepted.

The facility source remains source-backed. Facility presence, cluster density and trust semantics are unchanged. Public pins may use an inner location circle and light halo, but never imply stock, availability, trust, ownership or permission. Cluster rings remain a visual density cue with accessible count secondary.

## Arrival and mobile camera contract

The mobile first frame does not automatically recenter on the user. The browser location attempt may remain permission-aware and session-scoped, but an accepted position only renders the distinct user marker and stores bounded in-memory display state. It must not force a mobile camera jump unless the user explicitly activates `Utiliser ma localisation` or a later search reveal requires a target. The visible location control remains an explicit opt-in recenter action.

## Mobile input contract

Every text-like input that can receive focus on a mobile viewport, including the primary search input, options inputs, Auth inputs, facility and availability inputs, must use a minimum effective font size of `16px` or an equivalent platform-safe strategy. The search dock must not call `zoom`, `flyTo`, `easeTo`, `focus`-driven camera changes or scroll-into-view behavior when the user taps anywhere inside its input. The map must remain at the same center, zoom and projection during text focus.

## Facility focus and close contract

Selecting a facility may enter `selected_facility` and show its public detail. Closing the nearby result grid/sheet is a map recovery action: it clears `selectedFacility`, removes selected-pin styling and returns the map to the previous non-selected camera mode. Closing a facility detail itself remains a separate back/close path. No stale selected ID may survive a grid close and reappear as a focused pin on the next arrival.

## Mini-root impact

No database migration, API shape, Auth change, availability mutation or claim operation is required for this V4 slice. The existing `selectedId`, `onSelect`, `onBoundsChange`, `revealKey` and location state contracts remain typed and server-neutral. The only client rendering change is the map source/layer ownership and camera synchronization. OpenFreeMap Liberty is already used by an existing V2 component and is reachable with HTTP 200 in this audit; use remains subject to remote-tile reliability proof and fallback behavior.

## Definition of done

The implementation must pass the existing source validation and 12-function boundary. Browser proof must show bidirectional globe→mercator→globe transitions through repeated zoom-in/zoom-out, unchanged center/bearing across each switch, facility pins visibly tracking during `move` rather than appearing after `moveend`, no automatic mobile recenter on arrival, no mobile input-induced zoom, darker ocean/lighter land/clearer edges, and selected facility focus cleared after grid close. Existing location, search, Seller, Reviewer, Inbox, Auth, claim and availability behavior must remain non-destructive.

## Non-goals

This slice does not add multi-product availability, new OSM ingestion, route/itinerary, role bootstrap, PWA/Web Push, payment, QR, wallet or transaction behavior. It does not delete or rewrite users, Auth identities, claims, historical rows or Neon branches. It does not claim that OpenFreeMap remote tiles are production-reliable merely because the style endpoint is reachable.

## Revisit trigger

Reopen this contract if the owner rejects the `zoom 2.4` threshold, if the live provider cannot maintain readable local geography at high zoom, if native MapLibre layers cannot preserve the desired facility-pin art direction/accessibility, or if mobile user-location recentering is later requested as an explicit action rather than arrival behavior.
