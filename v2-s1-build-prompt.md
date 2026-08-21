# Omni V2 — S1 Build Prompt

**Slice:** S1 — Buyer globe, location and visible-bounds discovery

**Master:** [`v2-master.md`](./v2-master.md)

**Flow:** [`v2-flow.md`](./v2-flow.md) and [`v2-flow-spec.md`](./v2-flow-spec.md)

**Architecture:** [`v2-product-interface-architecture.md`](./v2-product-interface-architecture.md)

## Goal

Implement the first observable buyer loop on top of the S0 shell: a real MapLibre globe with slow horizontal idle rotation, explicit location states, a single search dock, visible-bounds discovery, clusters/source-backed pins, result cards and public facility selection. The slice must remain public-first and must not implement catalogue, availability, claim, intent or private seller data.

## In scope

- Real MapLibre GL v5 globe projection, persistent across surface changes.
- Idle globe rotation from left to right; manual interaction has priority and pauses rotation.
- Location states: idle, locating, exact, approximate, fallback/denied/timeout.
- One search row and one Options chevron in the dock.
- Search typing does not move the camera; Enter and the button share one guarded submit path.
- Typed public discovery adapter contract with a deterministic mock dataset for development.
- Visible-map bbox/zoom query contract, result loading/empty/error/retry states.
- Cluster representation at low zoom and individual source-backed result pins/cards at local zoom.
- Public facility selection sheet with safe fields only and back/close context restoration.
- Focus-safe, responsive behavior at 320/375/768/1280px.
- Unit tests for pure discovery/search/location state and adapter ordering.

## Out of scope

Catalogue, product selection, availability, seller verification, facility claim/status mutation, auth, private contact/itinerary/chat, transaction, QR, payment, wallet, OSM/Overpass imports and production database migrations.

## Trust boundary

`listFacilitiesInBounds` is a typed server adapter seam in S1; the browser may send bbox, zoom and public search/filter input but cannot fabricate facility status, trust, availability or private fields. The mock adapter is deterministic and replaceable by a server implementation. No source import or database secret crosses the client boundary.

## Required state machine

```text
idle_globe
  → [explicit search/category/retry] → search_submitting
  → [location request] → locating
  → [manual pan/zoom] → manual_exploration

locating
  → [fresh acceptable browser fix] → location_exact
  → [coarse/low-confidence context] → location_approximate
  → [denied/timeout/unavailable] → fallback_market
  → [cancel] → idle_globe

search_submitting
  → [valid query] → search_reveal
  → [missing input] → search_input with correction
  → [timeout/error] → search_error with retry

search_reveal
  → [facilities returned] → results_visible
  → [none] → empty_results
  → [cancel/manual interaction] → idle_globe or manual_exploration

results_visible
  → [select pin/card] → facility_selected
  → [new search] → search_submitting
  → [close rail] → idle_globe/manual_exploration

facility_selected
  → [back/close] → results_visible
```

## Acceptance matrix

| Check | Required result |
|---|---|
| Globe | Real MapLibre globe renders; no flat fallback replaces it. |
| Rotation | Idle motion is horizontal left-to-right; drag/zoom/search focus pauses it. |
| Location | Exact, approximate and denied/timeout/fallback states are distinct; exact marker requires fresh acceptable fix. |
| Search | Typing does not change map state; Enter/button use one guarded submit path. |
| Discovery | Query includes visible bbox/zoom; mock returns only source-backed public facilities. |
| Results | Low zoom clusters; local zoom shows individual pins/cards; no fabricated pins. |
| Selection | Pin/card opens public facility sheet only; no claim, availability, intent or private fields. |
| Recovery | Empty/error/timeout/retry/cancel/back preserve query and map context. |
| Responsive | No horizontal overflow and map remains visible at 320/375/768/1280px. |
| Tests | S1 unit tests pass; production build and client-boundary check pass. |

## Stopping conditions

Patch the master before continuing if location semantics, discovery authority, Free/Pro scope, source data shape or facility privacy requires a new product decision. Do not add a real OSM integration, auth gate, claim action or seller workflow in S1.
