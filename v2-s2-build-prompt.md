# Omni V2 — S2 Build Prompt

## Slice

Implement S2: public facility detail and catalogue-first product selection on top of the certified S1 buyer globe and discovery loop.

## Source of truth

Derive decisions from `v2-master.md`, `v2-flow.md`, `v2-flow-spec.md`, `v2-product-interface-architecture.md`, `v2-data-schema.md` and the S2 entry in `v2-vertical-slices.md`. Do not restore V1 components, providers, routes or business logic.

## Observable outcome

A buyer searches the visible map, opens a public facility result, reviews a source-backed facility detail with media and public metadata, opens its catalogue, selects one product, and returns to the facility detail with the selection preserved. No demand request, availability request, purchase intent, QR, chat, contact, route or claim is created in S2.

## States

Use explicit typed states: `facility_selected`, `facility_detail_loading`, `facility_detail_ready`, `facility_detail_error`, `catalogue_visible`, `product_selected`, `catalogue_empty`, and `catalogue_unavailable`. Back navigation must preserve the S1 result set and map context. Retry must preserve the selected facility and query.

## Data contract

Use a typed public catalogue adapter with deterministic fixtures for S2. A public facility can expose media, description, address label, source, lifecycle status and products. A product exposes id, name, category, media, unit, public availability label and source-backed facility id. Never expose private seller contact, internal inventory, wallet, credentials or unverified claims.

## UI constraints

Keep the map as the persistent scene. Use the existing V2 sheet/dock composition. The facility sheet must show a clear identity block, status/source treatment, media strip, public metadata and a single catalogue action. The catalogue must be readable on mobile and desktop, use cards with product media where available, and show an explicit selection state. The selection action is informational only until S3.

## Trust boundary

S2 client code may import only typed public contracts and mock adapters. Server-only modules, database clients and secrets must not enter the client graph. Replace the mock adapter later without changing route-level UI contracts.

## Acceptance proof

- Typecheck and production build pass.
- S0 and S1 tests remain green.
- Unit tests cover facility lookup, media fallback, catalogue filtering, empty catalogue, unavailable adapter, product selection and preserved selection on back navigation.
- A click-through shows: search → result card → facility detail → catalogue → product selection → back to detail/results.
- Grep confirms no V1 imports, no transaction/QR/chat creation and no secrets.
- The app remains runnable after this slice.
