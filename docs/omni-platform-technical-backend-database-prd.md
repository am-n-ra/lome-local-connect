# Omni Technical Backend & Database PRD

**Status:** Draft implementation baseline

**Runtime:** React/TanStack Start server functions deployed to Cloudflare Workers

**Data/auth:** Neon PostgreSQL and Neon Auth/JWKS only

## 1. Technical objective

Provide a durable, auditable backend for Omni’s map-first global supply-and-demand system. The backend must unify facilities, products/services, content, search, demand, availability, transaction intent, fulfilment, plans, credits, seller operations, OSM provenance, notifications, and optional Agent orchestration.

The backend is authoritative for identity, ownership, plan entitlements, facility state, product publication, allocation, inventory, availability, transaction transitions, wallet arithmetic, coupon consumption, notifications, and audit history. The browser may propose actions but may never authoritatively mutate money, permissions, or state-machine transitions without server validation.

## 2. Architecture constraints

The existing React/TanStack Start server-function architecture remains the application contract. New business capabilities should be split into cohesive modules rather than creating an unbounded monolithic function file. The implementation must preserve Cloudflare Workers compatibility and the current Neon serverless connection approach.

Neon Auth provides the identity/session source. Server middleware verifies the Neon Auth bearer/session token through the live JWKS JSON endpoint, synchronizes the authenticated subject to the local profile row, and attaches a stable `userId` to server functions. A missing or invalid token returns a typed authorization error rather than an empty success response.

Neon PostgreSQL is the only database. All migrations live in `db/migrations/` with unique monotonically increasing filenames. Every applied migration is verified against the live schema. `.env` and database credentials are never committed.

## 3. Canonical domains

| Domain | Authoritative objects | Primary responsibilities |
|---|---|---|
| Identity | Profiles, roles, company membership | Authentication, ownership, role checks, onboarding state |
| Facilities | Companies, facilities, claims, sources, certification | Spatial supply identity, ownership lifecycle, provenance |
| Catalogue | Company products, facility products/overrides, variants, services | Searchable supply definitions and facility-specific commercial state |
| Inventory | Balances, movements, reservations | Safe quantity changes, allocation, low stock, fulfilment |
| Discovery | Searches, results, indexed facilities/products/content/offers | Query execution, ranking, viewport filtering, result traceability |
| Demand/availability | Demand requests, availability requests/responses | Buyer demand broadcast, seller answers, comparison inputs |
| Commerce | Orders, transactions, events, QR, payments, fulfilment | Purchase intent and transaction state machine |
| Money/platform balance | Wallets, deposits, wallet transactions, credits, ad credits | Deposits, spend, subscription, feature/ad credits; no seller withdrawals initially |
| Plans | Subscriptions, renewals, entitlements | Free/Pro gating, renewal, downgrade, configuration |
| Engagement | Notifications, saved searches, reviews, audit log | Operational events, deep links, trust, traceability |
| Ingestion | OSM import jobs, source records, dedupe decisions | Safe external discovery and provenance |
| Intelligence | Agent config, tools, actions, approvals, usage | Controlled orchestration behind flags and permissions |

## 4. Target data model

### 4.1 Identity and company model

Extend local profiles with onboarding and role data as needed, but retain Neon Auth as the identity authority. Add companies and company members so a Pro seller can share a company catalogue across facilities. Membership roles should include owner, manager, editor, inventory operator, responder, and viewer. Every seller mutation resolves the active company/facility through membership rather than trusting a client-provided owner identifier.

### 4.2 Facility and provenance model

Facilities retain geometry/latitude/longitude, market/country/region/city/district/locality, type, online state, operating hours, source, source reference, source authority, owner/company, claim status, certification metadata, and confirmation metrics. Add explicit facility claims, facility sources, and certification submissions if the current schema does not already provide equivalent objects.

The lifecycle is:

`discovered → unclaimed → claim_requested → unconfirmed → certified → confirmed`.

The transition to confirmed is earned by at least three distinct buyers completing qualifying QR-authorized transactions. A facility can be online/offline independently from trust status. Unclaimed facilities can be returned by discovery queries but fail the server-side purchase-intent eligibility check.

### 4.3 Catalogue model

Retain existing products as the compatibility surface, then add the smallest additive model that supports company catalogue plus facility overrides:

- `catalogue_products`: company-level canonical product/service identity, category, description, item type, SKU/reference, publication state, and metadata.
- `catalogue_variants`: optional variant name, attributes, SKU, and parent product.
- `facility_catalogue_items`: facility-specific publication, price, status, offer links, and allocation policy.
- Existing `products`: either become the facility item compatibility table or receive a canonical product reference and migration mapping.

The technical PRD must choose one normalized representation after inspecting existing data and avoid duplicating the same product in multiple incompatible tables. The selected representation must support digital products and services later without forcing physical inventory semantics onto them.

Product publication states are `draft`, `active`, `paused`, `sold_out`, and `archived`. An item is eligible for buyer search only when the facility is allowed to publish, the product status is active, the facility is online where required, stock/allocation rules permit visibility, and the item is not expired or suppressed.

### 4.4 Inventory model

Add an inventory balance or movement model with:

- total quantity;
- available quantity;
- reserved quantity;
- fulfilled quantity;
- Omni allocation percentage or allocation quantity;
- low-stock threshold;
- last confirmed timestamp;
- movement source and reason.

Each movement is append-only and records product/variant/facility, signed quantity or before/after quantity, operation type, actor, reason, source transaction/order, idempotency key, and timestamp. Reservation and fulfilment operations run in a database transaction with row locking or an equivalent concurrency-safe mechanism.

The buyer-visible Omni quantity is derived server-side and cannot exceed the allocation-derived quantity. When the seller changes allocation, the system recalculates the effective visible quantity and prevents an impossible availability answer.

### 4.5 Offers and coupons

Extend current offers/coupons to support typed rule payloads rather than unstructured client logic. Required rule dimensions include percentage or fixed discount, product/facility scope, minimum order, start/end time, maximum redemptions, quantity bounds, first-purchase condition, and optional buy-X-get-Y. Coupon redemption uses a single atomic transaction that validates eligibility, records the redemption, and calculates the price snapshot.

### 4.6 Discovery and OSM

Add import jobs and source records for OSM and other legitimate public sources. Each imported facility stores source name, source reference, source version/import job, raw category, normalized category, coordinates, dedupe result, confidence/provenance, and review status. Import jobs track queued/running/preview/approved/partially_applied/completed/failed states, row counts, error summaries, retry count, and timestamps.

The import pipeline is:

`Extraction → Normalization → Category mapping → Geospatial normalization → Deduplication → Company/facility resolution → Source attribution → Approval/merge → Database → Search index.`

OSM records default to unclaimed. Stronger verified records are protected from weaker overwrite. Duplicate matches create a review/merge decision rather than silently creating or replacing a facility.

### 4.7 Search and spatial retrieval

Search indexes facilities, companies, products, services, offers, content, and media references. Search accepts keyword/semantic/structured/geospatial intent. Queries carry market, viewport/bounding box, radius, category, quantity, budget, online status, and trust/status filters.

The backend must apply viewport filtering and candidate pagination. It may cluster/deduplicate internally for load reduction, but the visual response may still return individual pins. The MapLibre globe and staged reveal receive geographic boundary metadata and result framing coordinates so the UI can pause/highlight each level before rendering the final result set.

### 4.8 Demand and availability

Availability requests reference buyer, demand request, facility/product/service/variant, quantity, and relevant parameters. Budget remains a buyer-side ranking/filtering parameter and is not sent to sellers as an instruction. Seller responses use `available`, `partial`, `unavailable`, and optional alternative semantics with confirmed quantity, price, validity, response mode, and seller confirmation state.

Bulk availability is quota-metered for Buyer Free. Manual single-facility availability is not charged against the bulk quota. Every request/response event creates an audit/notification opportunity.

### 4.9 Orders, transactions, QR, and fulfilment

Keep a clear distinction between an order/order intent and a financial transaction. Purchase intent creates the transaction session and records buyer, seller/company, facility, item, quantity, price/offer/coupon snapshot, location/session metadata, and source. Transaction events are append-only.

The transaction state machine is:

`pending → qr_generated → qr_verified → payment_pending → paid → fulfillment → user_confirmed → completed`.

Terminal exception states are `cancelled`, `expired`, `failed`, and `disputed`. Seller QR verification transitions only to `payment_pending`; only the buyer can confirm payment. Product receipt confirmation is a buyer action. Any payment provider integration must be idempotent and auditable.

### 4.10 Wallet, deposits, credits, and subscription

Existing `wallet_deposits` remain provider reconciliation records. Add a wallet aggregate and append-only wallet transactions. A wallet transaction has wallet, type, signed amount, currency, balance-before/after or a deterministic balance query, reference type/id, idempotency key, actor/source, status, and timestamp.

Initial wallet types include available platform balance, pending deposit, subscription charge, feature credit, advertising credit, campaign spend, refund/adjustment, and administrative grant. Seller payouts/withdrawals are not enabled. A seller’s ledger must make it impossible to confuse promotional/ad credits with deposited balance.

Subscriptions retain the current plan row but add renewal preference, cadence/configuration, renewal attempts, last renewal event, downgrade reason, and entitlement snapshot. Renewal runs once per period, atomically debits available balance when sufficient, and downgrades without negative balance when insufficient. Exact pricing remains configuration-driven.

### 4.11 Notifications and audit

Notifications include event type, title/body, deep-link target, structured payload, read state, and timestamps. Event types distinguish essential transaction/security events from marketing events. Audit records are written for ownership changes, claims, product publication, inventory movements, wallet debits/credits, subscription changes, coupon redemptions, imports, agent actions, and admin configuration changes.

### 4.12 Agent and feature flags

Add configuration and usage records for Buyer Agent, Seller Agent, AI actions, approval requirements, and global kill switch. Agent tools are typed server functions with explicit authorization. The LLM may select a tool or produce a proposal but cannot issue arbitrary SQL or mutate production state directly.

Recommended production defaults:

- `aiAutomationEnabled = false` until manual parity and safety tests pass;
- `buyerAgentEnabled = false` and `sellerAgentEnabled = false` by default, enabled for Pro test cohorts;
- `mediaUiEnabled = false` while media metadata remains supported;
- manual availability, inventory, wallet, and transaction operations always remain available.

## 5. State machines and invariants

| State machine | States | Critical invariant |
|---|---|---|
| Facility | discovered, unclaimed, claim_requested, unconfirmed, certified, confirmed | Unclaimed cannot create purchase intent; confirmed requires qualifying completed sales. |
| Product | draft, active, paused, sold_out, archived | Only eligible active items enter buyer availability/search result ranking. |
| Inventory | available, reserved, fulfilled effects | Reservation/fulfilment cannot exceed available quantity; movements are auditable. |
| Claim | pending, approved, rejected, cancelled | Only authorized claimant/admin can transition; approved claim assigns ownership. |
| Availability | open, answered, closed, expired | Responses reference the request and cannot be edited after buyer acceptance without an event. |
| Transaction | pending, qr_generated, qr_verified, payment_pending, paid, fulfillment, user_confirmed, completed plus exceptions | Seller QR verification cannot confirm buyer payment. |
| Wallet | pending, available, spent, failed, reversed | No negative available balance; every debit has idempotency/reference. |
| Subscription | free, pro, renewal_pending, downgraded | Entitlements derive from active configuration and renewal state. |
| Coupon | draft, active, paused, expired, exhausted | Redemption eligibility and consumption are atomic. |
| Import | queued, running, preview, approved, partially_applied, completed, failed | No import row bypasses plan, validation, ownership, or allocation rules. |
| Agent action | proposed, awaiting_confirmation, approved, executing, completed, rejected, failed | High-risk actions require explicit confirmation unless an enabled rule permits automation. |

## 6. Server-function contract standards

Every function must define input schema, authenticated context, authorization/ownership policy, plan gate, idempotency behavior, transaction boundary, audit event, notification side effect, and typed output/error.

Recommended module boundaries include `identity.functions.ts`, `facility.functions.ts`, `catalogue.functions.ts`, `inventory.functions.ts`, `search.functions.ts`, `demand.functions.ts`, `availability.functions.ts`, `checkout.functions.ts`, `wallet.functions.ts`, `subscription.functions.ts`, `promotion.functions.ts`, `notification.functions.ts`, `osm.functions.ts`, `analytics.functions.ts`, and `agent.functions.ts`.

Use consistent domain errors for `UNAUTHORIZED`, `FORBIDDEN`, `PLAN_REQUIRED`, `NOT_FOUND`, `CONFLICT`, `INVALID_STATE`, `INSUFFICIENT_BALANCE`, `QUOTA_EXCEEDED`, and `RATE_LIMITED`. Never turn a server error into an empty list in the UI.

## 7. Plan and entitlement policy

The initial configuration recommendation is:

| Capability | Buyer Free | Buyer Pro | Seller Free | Seller Pro |
|---|---|---|---|---|
| Map/search/discovery | Yes | Yes | Preview/own facilities | Yes |
| Manual availability | Yes | Yes | Manual response | Manual/advanced |
| Bulk availability | 3/month | Configuration-driven expanded limit | N/A | N/A |
| Agent | No | Opt-in when enabled | No | Opt-in when enabled |
| Facilities | N/A | N/A | 1 | Multiple |
| Products | N/A | N/A | 5 | Expanded/configuration-driven |
| Bulk import | N/A | N/A | No | Yes |
| Wallet deposits | N/A | N/A | Yes | Yes |
| Seller withdrawal | No | No | No | No in initial release |
| AI recommendation | No | Opt-in | No | Opt-in |

The user-facing explanation must name the limit and what Pro unlocks. Server functions enforce the same entitlement independently of the UI.

## 8. Security, privacy, and reliability requirements

Use Neon Auth subject verification and profile synchronization on every protected request. Enforce facility/company membership server-side. Verify claim and certification permissions. Validate all inputs with Zod or equivalent. Apply rate limits to authentication-adjacent operations, deposits, imports, search-heavy endpoints, bulk availability, and Agent tools.

FedaPay/webhook reconciliation must validate provider references and idempotency. Wallet debits use database transactions and concurrency protection. Inventory reservations use row locks or serializable/atomic updates. Coupon redemption and transaction transitions use explicit state checks. All money values are integer minor units in the configured currency; timestamps are UTC.

Sensitive identifiers are not placed in marketing notifications or public facility pages. Audit detail avoids secrets and stores only the minimum needed for traceability. Error capture must include a correlation/request ID. Import jobs require retries, bounded work, and failure summaries rather than unbounded synchronous requests.

## 9. Observability and operations

Log domain event type, actor class, entity ID, request/correlation ID, duration, outcome, and error class. Track metrics for search latency, viewport candidate counts, OSM import success, claim conversion, availability response latency, purchase-intent conversion, QR verification, wallet reconciliation, renewal success, inventory conflicts, and notification delivery.

Operational dashboards should expose failed imports, pending deposits, renewal failures, stuck transactions, and authorization anomalies without exposing secrets.

## 10. Migration strategy

Migrations are additive and numbered uniquely. Before each migration, inspect live schema and existing data. Backfill in bounded batches with safe defaults. Preserve compatibility columns until all server functions and UI consumers have moved. Add constraints only after backfill validation. Record migration verification output in the release notes.

The first database release should establish company membership, catalogue linkage, inventory movements/reservations, wallet ledger, subscription renewal metadata, promotion rules, notification event metadata, and OSM import/source records. Later releases add import staging, analytics aggregates, and Agent action/usage records.

## 11. Technical acceptance criteria

The backend release is accepted only when:

1. Protected functions reject invalid/stale auth and do not silently return empty success values.
2. Ownership and company membership are enforced for every seller mutation.
3. Unclaimed OSM facilities can be searched but fail purchase-intent eligibility.
4. Free/Pro limits are enforced server-side and return typed upgrade explanations.
5. Catalogue, facility overrides, allocation, and inventory movements produce consistent buyer-visible quantities.
6. Inventory reservation/release/fulfilment operations are concurrency-safe and auditable.
7. Availability requests and responses preserve buyer/seller context and correct quota accounting.
8. Transaction transitions preserve buyer control of payment and receipt confirmation.
9. Wallet ledger entries are idempotent, atomic, and never allow negative spendable balance.
10. Pending deposits remain non-spendable, and subscription renewal/downgrade is deterministic.
11. Coupon redemption is atomic and respects rule scope, dates, caps, and price snapshots.
12. Notifications deep-link to contextual buyer/seller states and distinguish essential events.
13. OSM import/deduplication retains provenance and does not overwrite stronger data with weaker data.
14. Agent tools are permissioned functions behind feature flags; AI cannot execute arbitrary database mutations.
15. Migrations, tests, type checks, and production build complete without credential leakage.
