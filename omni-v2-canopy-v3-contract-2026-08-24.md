# Omni V2 — Canopy V3 contract, 2026-08-24

**Structural path:** produit → Species → Canopy → carte, arrivée, recherche, disponibilité
**Status:** `approved for bounded implementation; multi-product Root decision remains explicit`
**Authorities:** `v2-species.md`, `v2-flow.md`, current V2 API contracts, `origin/main` behavior, Founder HQ

## User-visible outcome

L’utilisateur arrive dans un monde public explorable, avec une carte MapLibre réelle, un globe plus lisible et des marqueurs calmes. Il peut faire pivoter et déplacer la carte librement, conserver exactement la caméra qu’il a atteinte, zoomer du globe vers le contexte local puis les rues lorsque les tuiles le permettent, lancer une recherche, voir son reveal géographique, puis continuer à chercher ou quitter proprement la grille de résultats. La localisation est tentée une fois de manière permission-aware et reste annulable; le repère personnel est distinct des présences publiques. La disponibilité reste sans réservation et la sélection de plusieurs produits ne sera soumise que si son Root/API est réellement supporté.

## Camera ownership contract

| State | Owner | Behavior | Exit |
|---|---|---|---|
| `resting_globe` | Omni idle | Slow RAF longitude rotation at low zoom only; no reset of center | Pointer/touch/drag/wheel/zoom, search, location, sheet, J5 |
| `manual_navigation` | User | Native MapLibre drag/pan/rotate/zoom; preserve center, zoom, bearing and pitch after release | Delayed idle resume only if low-zoom, no pointer over map/overlay and no contextual surface |
| `search_reveal` | Search choreographer | Bounded flyTo sequence; MapLibre synthetic camera events cannot cancel it | User interaction cancels and preserves current camera |
| `result_framing` | Search result frame | Fit all public results with safe padding, no false administrative data | User interaction or explicit new search |
| `selected_facility` | Facility context | Focus selected public facility and preserve previous camera in context | Back, Escape, close or a new search |

Ordinary map interaction must never call a reset-to-globe helper. `mousedown`, `touchstart`, `dragstart`, `zoomstart`, `rotatestart` and `wheel` may stop idle/reveal, but `dragend` must leave the camera where the user released it. A low-zoom drag does not immediately resume while the pointer remains over the map. When the pointer leaves the map/context and no surface owns the camera, a delayed resume may start from the current center.

## Arrival and location contract

On first mount, V2 may make one permission-aware location attempt that mirrors the reference behavior: check geolocation support, inspect `navigator.permissions` where available, guard repeated attempts with a session-scoped key, and stop without a prompt if the browser has already denied access. If the user accepts, retain only the bounded session display state needed to show the marker and center the map; do not persist raw location in logs, evidence or Founder HQ. If denied, unavailable or timed out, keep the world public map usable and show concise recovery copy with `Réessayer`. Real permission outcomes remain a browser proof requirement.

The position marker uses a blue-green or other selected Species accent with an outer ring, an accessible label and no claim of stock, trust or ownership. It must not be grouped with public facility pins. The arrival should communicate discovery through a non-blocking phrase such as `Présences publiques autour de vous`, not an unexplained dashboard counter.

## Marker and map visual contract

The map should be darker and cleaner than the current `soft-color` frame, with low-contrast but visible roads/labels and a restrained cool-gray/green palette. The renderer must preserve real raster/vector geographic context and honest fallback behavior. Public clusters retain an accessible count and expansion affordance, but the visual treatment may use a soft concentric ring/orbit and a small contextual label rather than a dominant numeric badge. Facility pins keep the approved pin-with-inner-circle treatment and may use a light outer ring inspired by origin/main. No public marker may imply inventory, availability, ownership, permission or certification.

Responsive inheritance is deliberately asymmetric: mobile preserves the reference bottom dock/sheet anatomy; desktop uses more map breathing room and a wider bounded bottom sheet/rail without introducing a dashboard rail or covering map controls. Every measured width must preserve top safe area, right controls, marker, dock, options and sheet separation.

## Search/result continuation contract

The search dock remains available in the result state. A ready result sheet must provide, through accessible controls, `Nouvelle recherche`/clear semantics and `Retour à la carte`/collapse semantics. Clearing a search must cancel any active reveal, restore the map-only dock and return to nearby discovery without a hidden stale query. Collapsing the sheet must remove the grid while keeping the query in the dock only if that is visually and behaviorally explicit. A new submit must invalidate an identical prior query key and restart loading and reveal.

`Voir tout` means expand the public rail, not exit the search. Result cards remain source-backed; the search action is always available in its own dock band above the sheet.

## Multi-product availability decision

The current server contract creates one availability request with one `productId`, and the idempotency key and response model are also single-product. Therefore the Canopy UI must not pretend that selecting several products can be submitted as one request. The safe staged path is:

1. Add a read-only multi-select intent in the catalogue sheet only if it has a clear `Vérifier ensemble` label and a visible count.
2. Define a Root/API contract for an atomic request group or an explicitly sequenced set of independent request IDs, including authorization, ownership, idempotency, expiry, response grouping and recovery.
3. Implement server and client together with tests before enabling any write.
4. Until that contract exists, retain the working single-product path and record multi-product as `blocked / Root decision required`.

No new availability request is authorized in this Canopy proof pass.

## Canopy definition of done

The implementation passes source tests and the exact 12-function boundary. A real browser proof measures native drag center/zoom/bearing changes and confirms no camera reset; idle rotation stops on interaction and resumes from the current position outside the map. A guarded location attempt yields an honest allowed/denied/unavailable state without storing raw coordinates. Arrival has a darker readable map and non-numeric discovery language; public rings are visually calm and semantically neutral. A result keeps the search dock and exposes clear exit/new-search actions. Desktop and mobile are measured at the widths available, with authenticated and guest limitations reported separately. Multi-product is either fully Root/API backed or clearly blocked without mutation.
