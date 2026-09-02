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


## 2026-08-25 — V4.1 monochrome and map-only interaction amendment

The owner clarified that the intended reference is the existing Omni **white/black/gray map**, not the green-toned Canopy palette: white map background, near-black oceans, white/light continents, and charcoal/gray country and continent boundaries. V4.1 removes the green/sepia map wash and decorative colored selection halo; visible public pins remain source-backed and restrained, while cluster density may use neutral gray rings only where needed for the Species density cue.

Idle globe rotation is now owned strictly by the map interaction surface. Search typing/focus, Options, J5/account, and non-map navigation must not pause the globe. Direct globe touch/pointer drag, wheel/pinch/rotate, native facility/cluster action, and explicit map controls may pause it. Primary left-drag orbit preserves a stable vertical axis: horizontal movement changes longitude responsively, vertical movement changes latitude within a safe clamp, pitch stays zero, and horizontal drag does not create unintended bearing drift. The control group always renders `Zoom arrière`, `Zoom avant` and `Utiliser ma localisation` together in stable order.

The visible `Zone approximative détectée` banner is removed from the compact surface. Automatic location remains permission-aware, in-memory and non-recentering; explicit `Utiliser ma localisation` remains the only arrival recenter action. This is a client-only Canopy amendment with no database, API, Auth, migration or Root impact.

**V4.1 gate remains open** until monochrome visual frames, direct-map-only pause proof, touch/axis proof, always-visible controls, non-obstructive location behavior, reversible projection, native pin movement and the existing accessibility/responsive/performance matrix are recorded.


## Canopy V4.2 reference amendment — 2026-08-25

### Mini-seed
The Buyer should feel that Omni opens onto a readable world map and then guides the eye into the user’s geographic context: world/globe, continent, country, region or city, and finally local public facilities. The owner’s supplied Africa-globe image is the visual reference for this map surface. The target is the map’s composition and behavior, not the dark selection treatment or the literal `Votre position` chip shown in the reference.

### Reference-matched visual DNA

| Element | V4.2 direction | Explicit rejection |
|---|---|---|
| Field outside the globe | White, quiet and untextured | No gray wash or green map treatment |
| Ocean | Near-black charcoal with a clean silhouette | No pale water or raster haze dominating the globe |
| Land | White or very light gray, with subtle relief only where it improves legibility | No green landcover, sepia wash or heavy gray land highlight |
| Country/continent boundaries | Fine charcoal or mid-gray lines, legible but restrained | No thick dark selected-region highlight |
| Roads/labels | Suppressed at globe scale; progressively introduced only at local scale | No global road clutter |
| Public-facility markers | Neutral native MapLibre pins/rings, subordinate to geography | No sticker-like HTML overlays, ownership/trust implication or colored halo |
| User position | Small neutral in-map marker with optional accessible name only | No permanent `Votre position` chip and no heavy accuracy halo |
| Motion | Slow longitudinal orbit around a stable vertical axis when resting | No pause from typing, menus or non-map navigation |

### Camera choreography

The V4.2 reveal inherits the existing origin/main sequence as a behavioral precedent: `Continent` at approximately zoom `2.15`, `Pays` at `5.35`, `Région` at `8.25`, `Ville / zone` at `11.25`, and a final local framing at approximately `14.2` or a fit-bounds result frame. The exact labels are implementation detail; the acceptance requirement is an observable geographic progression with a readable pause at each scale and no camera reset after direct map interaction.

Projection remains automatic and reversible at the Canopy V4 threshold `2.4`: globe below the threshold and mercator at or above it. The reveal must therefore cross the projection threshold deliberately rather than spending the entire continent/country choreography in a pixelated globe. At local zoom, the vector map must expose streets/neighborhood context and source-backed native facility features.

### Location treatment

Automatic arrival location may add an in-memory neutral marker without recentering the user’s current view. An explicit recenter control may focus the camera on the user location. A browser-derived approximate/network estimate must never create a visible explanatory band over the map; it remains an accessible status and a subdued marker only when product state requires it. The reference label `Votre position` is not part of the required UI.

### Acceptance and non-goals

The next proof must show the reference-matched globe at desktop and compact widths, visible minus/plus/recenter together, no heavy selected-region highlight, no location chip, direct-map-only rotation ownership, progressive continent-to-local reveal, reversible projection, local streets/neighborhood detail after reveal, and native pins remaining geographically anchored during camera movement. It must remain read-only and must not change the mono-product availability contract.

OSM importer/field-pilot expansion, PWA/Web Push, payments, QR, transactions, new roles, destructive migrations and the multi-product Root/API decision remain outside this ring.


## Canopy V4.3 vector-reference amendment — 2026-08-25

The latest owner reference confirms the intended Canopy is a **native vector globe**, not a raster approximation. The preferred visual composition is a quiet white outer field, dark charcoal oceans, light continents and fine geographic contours, with labels and roads introduced progressively as the camera moves from world to continent, country, region/city and local context. The reference’s heavy selected-region highlight and literal `Votre position` chip remain explicitly excluded.

The MapLibre worker is a load-bearing part of this visual contract. The controller must set a stable same-origin worker URL before constructing the map, and `style.load` alone must not publish `Carte active`; readiness requires the usable loaded/idle path with the vector source available. Provider failure must expose an honest retry state rather than silently switching to `/omni-local-style.json` or any other raster substitute. This is a Canopy/loader decision only and does not change Root/API, Auth, privacy, trust, availability, Seller, Reviewer, transaction or data-preservation boundaries.

V4.3 acceptance remains gated on a compact and desktop settled vector globe, reversible projection, progressive reveal, visible local vector detail and native geographically anchored facility features when the bounded real data path is available. OSM/Overpass expansion, worldwide coverage claims, PWA/Web Push, payments, QR, transactions, destructive migration and multi-product availability remain outside this ring.
