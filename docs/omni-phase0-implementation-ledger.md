# Omni Phase 0 Implementation Ledger

**Baseline:** `main` at `18fd726` (`Merge Add manual availability and Lot E purchase flow`).

**Audit status:** Static repository audit complete. Live Neon introspection is pending because the configured Neon endpoint returned a TLS connection reset during the read-only inventory attempt; no database write was attempted.

## 1. Current baseline

| Area | Evidence | Status | Notes |
|---|---|---|---|
| Map-first root | `src/routes/index.tsx`, `src/routes/carte.tsx` | Verified/partial | Root renders `CartePage`; map experience is present. Buyer shell still has some French route/deep-link assumptions. |
| Real MapLibre globe | `src/components/omni/MapCanvas.tsx` | Verified | Uses `projection: { type: "globe" }`, globe-to-Mercator switching, native markers, and boundary loader. |
| Resting globe rotation | `MapCanvas.tsx` idle rotation | Verified/needs visual refinement | Center/longitude motion is used with fixed bearing/pitch; the calibrated positive direction is being checked against the Africa/Europe → Asia → Americas sequence. |
| Staged reveal | `MapCanvas.tsx` lines 55–61, 741–852 | Verified/needs acceptance regression | Continent, country, region, city/zone, and position stages exist with pauses and boundary highlight calls. |
| User location | `MapCanvas.tsx` lines 611–632; `carte.tsx` lines 111–127 | Verified/partial | User marker exists only when `showUserLocation` is true; resting globe intentionally hides it until search. Revised PRD says user position must be visible on the map/globe, so the final visual decision needs implementation. |
| Globe visual quietness | `MapCanvas.tsx` layers/labels and public discovery feed | Verified/needs acceptance regression | Resting discovery uses bounded source-backed facilities with native pin markers, suppressed dense labels, and no visual cluster bubbles; the unrelated flat raster fallback has been removed. |
| Buyer top-right chrome | `TopNav.tsx`, `carte.tsx` | Verified | Minimal map chrome hides the top-left brand mark and shows notifications/menu. |
| Persistent search dock | `SearchDock.tsx`, `carte.tsx` | Verified/partial | Dock, categories, filters, quantity/budget chips, and bulk CTA exist; local quantity state is not yet a shared app-state coordinator. |
| Auth/query restoration | `auth.tsx`, `carte.tsx` | Verified/needs regression | Exact query handoff and server-function bearer bridge exist; default paths still use `/carte` and `/vendeur`. |
| Facility result cards/pins | `carte.tsx`, `MapCanvas.tsx` | Verified/partial | Native pins/cards render after reveal; cards are still generic in places and use mixed French/English copy. |
| OSM import | `scripts/import-osm.ts` | Partial | Imports only Lomé bounding box, limited shop/amenity categories, source/source_ref, and unclaimed state. It is not a global population pipeline and is not exposed as an npm command. |
| OSM provenance/deduplication | `import-osm.ts`, `schema.sql` | Partial | Unique source reference prevents exact duplicate source records; there is no geospatial/name/company dedupe decision workflow or import-job model. |
| Unclaimed semantics | `omni.functions.ts`, `FacilityPanel.tsx`, `checkout.functions.ts` | Verified/partial | Unclaimed facilities are included in search and purchase-intent boundaries are enforced; claim/certification lifecycle is not fully represented. |
| Claim/certification | `omni.functions.ts`, `admin.tsx`, `schema.sql` | Partial | Claim and certification submission primitives exist; full request/review/status UI and source authority workflow are incomplete. |
| Buyer availability | `demand.functions.ts`, `DemandRequestPanel.tsx` | Verified | Manual/bulk modes, Free quota, response ranking, and purchase-intent CTA are present. |
| Seller availability response | `vendor.functions.ts`, `DemandPanel.tsx`, `RequestsPanel.tsx` | Partial | Seller manual response surfaces exist, but request/response model and seller operational UX are not yet unified. |
| Purchase intent/QR/timeline | `checkout.functions.ts`, `OrdersPanel.tsx` | Verified/partial | Lot E state transitions and buyer controls exist; full offer/coupon/pickup/delivery data model remains incomplete. |
| Seller route | `src/routes/vendeur.tsx` | Partial | Seller route is a tabbed map preview plus panels; many final sections are informational or placeholders and route is French `/vendeur`. |
| Seller company catalogue | `vendor.functions.ts`, `schema.sql` | Missing | Current model is facility-owned `products`; no company/company-member/shared catalogue/facility override model. |
| Product baseline | `products`, `vendor.functions.ts`, seller products tab | Partial | Status, price, quantity, allocation, photo URL exist; category, description, SKU, variants, service type, archive, and effective facility override are absent. |
| Inventory | `products.quantity_available`, `in_stock` | Partial | Quantity and boolean stock exist; no immutable movements, reservations, fulfilment ledger, low-stock thresholds, or concurrency-safe operations. |
| Offers/coupons | `offers`, `coupons`, `CouponsPanel.tsx` | Partial | Simple percentage offers/coupons exist; explicit rule builder and atomic redemption depth are incomplete. |
| Seller wallet | `subscriptions.wallet_balance`, `wallet_deposits`, `AdsPanel.tsx` | Partial | FedaPay top-up and campaign spend exist; no general append-only wallet ledger, pending/spend buckets, credits/ad credits, or renewal ledger. No withdrawals are exposed, which matches the revised PRD. |
| Subscriptions | `subscriptions`, `vendor.functions.ts`, seller panel | Partial | Free/Pro and lapse logic exist; actionable auto-renew, renewal preview, downgrade events, and config-driven pricing are incomplete. |
| Plan enforcement | `vendor.functions.ts`, `omni.config.ts` | Partial | Seller Free facility/product cap and buyer bulk cap are partly enforced; one shared entitlement resolver and admin-visible plan configuration are missing. |
| Notifications | `notifications`, `NavMenuSheet.tsx`, domain functions | Partial | In-app feed exists, but event taxonomy, structured deep links, and buyer/seller preference classes are incomplete. |
| Admin-only flags | `auth.tsx`, `identity.functions.ts`, `admin.tsx`, `omni.config.ts` | Partial | Staff/admin identity exists and flags are static constants; feature-switch controls are not yet admin-configurable or consistently hidden from non-admin users. |
| Agent | `ai-search.server.ts`, config flags | Guarded/partial | AI search/server support and static flags exist; buyer/seller Agent tool/action architecture is not implemented. |
| Media | `MediaManager.tsx`, media functions, config | Guarded/partial | Media primitives exist; revised PRD correctly keeps UI disabled by default. |
| API/mobile readiness | Existing server functions and public API routes | Partial | Domain server functions exist, but route naming and contracts are not consistently language-neutral/English and there is no complete documented mobile API contract. |

## 2. Main contradictions or risks

1. The revised visual requirement says the user position must be visible on the globe/map, while the current buyer route passes `showUserLocation={Boolean(searchRunKey)}` and hides it in the resting state.
2. The revised visual requirement asks for clean geography with only restrained continent labels/highlight, while current map layers can display facility labels and native pins according to search state; the final label policy must be explicit.
3. The user requested English endpoints for future mobile/API reuse, while the current primary routes and deep links use `/carte`, `/vendeur`, and `/fiche/$id`.
4. Feature flags are static code constants, while the revised plan requires Agent/media controls visible only to admin accounts and globally switchable.
5. The OSM pipeline is Lomé-only and script-only; the revised requirement says the globe should be populated with unclaimed facilities globally. This requires a staged ingestion architecture, not simply changing the bounding box.
6. The repository’s canonical `db/schema.sql` contains a rebuild script that drops many tables and is not equivalent to the additive migration history. Live introspection is required before any new migration or schema reconciliation.
7. The seller route contains visible tabs that are informational or placeholder-like, which conflicts with the revised PRD rule that visible navigation must either work or clearly indicate a disabled/plan-gated state.

## 3. First foundation PR file list

The initial foundation PR should be limited to high-risk shared foundations and final visual convergence:

| File/group | Purpose |
|---|---|
| `src/lib/omni-state.tsx` or equivalent new shared state module | Typed stateful map/application states and transitions. |
| `src/components/omni/MapCanvas.tsx` | Globe resting state, user marker policy, clean geography, subtle boundary/continent emphasis, reduced-motion handling. |
| `src/routes/carte.tsx` | Consume shared state, preserve search/auth/availability/transaction regression, keep search dock/menu behavior. |
| `src/components/omni/SearchDock.tsx` | Align dock/category/filter visual behavior with the revised PRD and shared state. |
| `src/components/omni/TopNav.tsx` and `NavMenuSheet.tsx` | Top-right chrome, menu/sheet parity, admin-only feature visibility, remove misleading placeholders or label them clearly. |
| `src/lib/auth.tsx`, `src/lib/auth-middleware.ts`, `src/lib/neon-auth.server.ts` | Typed auth errors and reliable bearer/JWKS propagation; do not change Neon Auth provider. |
| `src/lib/omni.config.ts` plus admin configuration path | Keep AI/media hidden for non-admins and manual flows independent. Do not add speculative billing tables. |
| `src/lib/errors.ts` or equivalent | Shared typed domain errors, correlation IDs, and UI-safe error mapping. |
| `src/lib/notifications.ts` or equivalent | Shared event/deep-link types without broad new domain tables. |
| Tests under `src/`/`scripts/` appropriate to current stack | State transition, auth failure, feature-flag visibility, and map regression coverage. |
| Documentation updates | Record actual deviations discovered during the foundation PR. |

## 4. Phase 2 OSM/global-population file list

The global unclaimed-facility requirement should be a separate bounded phase:

- `scripts/import-osm.ts` or a new import-job module for market/region/bbox parameters;
- additive migrations for import jobs, source records, dedupe decisions, and normalized geographic hierarchy;
- server functions for import status, preview/approval, source attribution, and claim workflow;
- search-index publication and viewport-aware facility retrieval;
- admin OSM/import monitoring panel;
- buyer unclaimed source/status/claim UI;
- fixture tests for duplicate sources, global-region batches, and unclaimed purchase rejection.

## 5. Live-schema audit blocker

The first read-only Neon inventory attempt failed before SQL execution with a TLS connection reset while reaching the configured Neon API host. The database URL host is present and the local `.env` was not modified. Before any schema-changing phase, retry the inventory from a healthy network path and save:

- public table list and row counts;
- columns/defaults/nullability;
- constraints/foreign keys/checks;
- indexes;
- applied migration evidence;
- current counts for facilities by status/source, products, transactions, demand requests/responses, subscriptions, deposits, notifications, and roles.

No migration should be authored from the static `schema.sql` alone because it contains a destructive rebuild script and may not represent the exact live database state.

## 6. Live database audit status

Two read-only inventory attempts were made using the configured `DATABASE_URL`. Both failed before SQL execution because the Neon serverless endpoint reset the TLS connection to `api.c-5.us-east-1.aws.neon.tech:443`. IPv4 DNS resolution succeeded, but the HTTPS/TLS probe also failed. No migration, insert, update, or delete was attempted, and the temporary inventory script was removed.

The static schema and migration map are sufficient for planning the foundation PR, but **no schema-changing PR may be authored or applied until the live inventory succeeds**. The next database audit should be retried from a healthy network path and must save the table/column/constraint/index/count output described in §5.

## 7. Phase 0 outcome

The repository baseline, current UI/API surface inventory, revised-PRD contradictions, static schema shape, migration numbering, OSM limitations, and first foundation PR file list are documented. The only outstanding Phase 0 item is live Neon introspection, which is an infrastructure/network blocker rather than a product ambiguity. No product behavior was changed during this audit.


## 8. User correction pass — map and discovery contract

The latest product correction adds these mandatory behaviors:

- The arrival experience must explicitly ask for location permission without blocking map exploration.
- A denied/unavailable location must produce a truthful market-fallback state and must not place a user marker at the fallback centre.
- Resting globe motion must move the visible earth horizontally around a stable vertical axis, not roll like a clock through camera bearing.
- The arrival map must be populated with sparse real source-backed claimed/unclaimed facility discovery points; a naked map or fake marker layer is not acceptable.
- Country/city label density must be suppressed at default globe scale.
- Passive arrival, zoom, pan, recenter, and panel opening must not trigger the staged reveal; only a real or restored search may trigger it.
- Search highlights must be black/near-black and restrained; orange remains for Omni actions and pins.
- Quantity and budget must be moved into a deliberate, responsive search-dock hierarchy that does not collide with result count or availability actions.

The correction-pass plan is recorded in `omni-map-discovery-correction-plan.md`. Before any new import/provenance migration, the blocked live Neon read-only inventory must succeed.
