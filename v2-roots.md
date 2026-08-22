# Omni V2 — Root System

**Document ID:** `OMNI-V2-ROOTS-001`
**Status:** Architecture baseline to be approved after Seed and Species
**Method:** Nature Way — Phase 2, Root System
**Parent:** [`v2-seed.md`](./v2-seed.md)
**Design contract:** [`v2-species.md`](./v2-species.md)

> **Root System rule:** no UI state, product promise or integration may be implemented unless its authoritative data, operation, permission boundary, failure behavior and recovery path are defined here or in a referenced domain contract.

This document defines the load-bearing technical architecture for a clean Omni implementation. It is not a continuation of the current prototype’s component structure. Existing code is reusable only after it satisfies these boundaries.

## 1. Architecture objective

Build a production-shaped PWA in which one persistent map scene supports buyer and seller work, while server-authoritative domain operations provide public discovery, catalogue truth, availability evidence, facility trust, entitlements, wallet spending, transaction handoff and operations.

The architecture must prevent the following false combinations:

- a public pin being treated as current stock;
- a Claim click being treated as certification;
- Pro being treated as trust;
- an account being treated as a facility;
- wallet balance being treated as an arbitrary client number;
- availability being treated as reservation;
- a client label being treated as a transaction transition;
- a QR image being treated as verification;
- a buyer-seller payment declaration being treated as payment processing.

## 2. System shape

```text
                 ┌────────────────────────────┐
                 │      Map-first PWA shell   │
                 │ map scene · dock · sheets  │
                 │ buyer · seller · admin     │
                 └─────────────┬──────────────┘
                               │ typed client contracts
                 ┌─────────────▼──────────────┐
                 │      Server authority      │
                 │ auth · validation · state  │
                 │ idempotency · audit · logs │
                 └───────┬─────────┬──────────┘
                         │         │
          ┌──────────────▼───┐ ┌───▼────────────────┐
          │ Omni domain APIs  │ │ bounded adapters    │
          │ discovery         │ │ Neon Auth           │
          │ facilities/trust  │ │ Map/tile provider   │
          │ catalogue         │ │ OSM/public sources  │
          │ availability      │ │ FedaPay recharge    │
          │ wallet/entitlement│ │ object storage      │
          │ transaction/QR    │ └────────────────────┘
          └──────────────┬────┘
                         │ transactional persistence
                 ┌───────▼───────────────────────┐
                 │ Neon PostgreSQL V2 application │
                 │ ledger · audit · events · data │
                 └────────────────────────────────┘
```

The browser imports only typed client contracts and presentation state. Server modules own database clients, secrets, validation, authorization, state transitions, ledger mutations and audit events. No server-only module may enter the browser bundle directly or transitively.

## 3. Domain ownership

| Domain | Owns | Must not own |
|---|---|---|
| Identity | Account reference, session, actor and roles | Facility trust, wallet balance or product stock |
| Account capacity | Facility Slots and workspace entitlements | Facility Pro, catalogue limits or trust badge |
| Companies | Organization identity and account association | Facility availability or buyer transaction state |
| Facilities | Facility identity, location, public profile and lifecycle | Wallet funds or buyer intent |
| Trust | Evidence, review outcomes and confirmation history | Paid capacity or product publication alone |
| Discovery | Public sources, bounds, ranking, freshness and fallback | Certification or inventory proof |
| Map context | Client camera mode, bounds, query/filters, selected facility and reversible view context | Source truth, trust, stock, authorization or transaction state |
| Catalogue | Products, media, price, publication and Omni allocation | Later availability truth or reservation |
| Availability | Requests, responses, freshness and scope | Stock reservation or purchase intent |
| Entitlements | Facility Pro, catalogue limits, slots and feature permissions | Trust badge creation or money movement |
| Wallet | Recharge confirmation and platform-spend ledger | Buyer-seller payment or withdrawal |
| Transactions | Intent, immutable snapshot, QR, payment declaration and fulfilment state | Public discovery or arbitrary chat |
| Communications | Authorized transaction messages and system events | Public/unscoped chat or state mutation by message |
| Operations | Admin review, imports, recovery, analytics and observability | Client-authoritative mutations |

Each domain exposes a typed contract, server operation, UI state set, proof fixtures and recovery behavior. A domain is not complete because its database table exists.

## 4. Authoritative facts

| Fact | Authoritative source |
|---|---|
| Public facility existence/name/location | Reviewed server record or source-backed public-data record |
| Facility certification/trust | Versioned evidence and audited admin review |
| Product identity, price, media and allocation | Facility catalogue plus server/database validation |
| Current availability | Seller action or explicitly bounded approved automation, with timestamp |
| Purchase intent and transaction facts | Idempotent server operation and immutable snapshot |
| QR validity | Server-issued hashed token, expiry and replay state |
| External payment | Buyer declaration and seller acknowledgement; Omni does not move the funds |
| Route/itinerary | Authorized route provider result or explicitly labelled manual directions after intent | Public discovery, trust, stock or pre-intent private location |
| Fulfilment/receipt/rating | Actor-authorized transaction transitions |
| Wallet balance | Confirmed recharge and append-only server ledger |
| Analytics | Consent-aware, minimized and pseudonymous event pipeline |

The client may cache or render these facts, but it cannot establish them.

## 5. Persistence and migration boundary

Use the authorized Neon PostgreSQL application branch as the V2 persistence boundary while preserving existing Neon Auth identities, legacy tables and historical records. V2 application data must be additive and clearly namespaced or otherwise distinguishable from legacy data. No migration may use `DROP`, `TRUNCATE`, destructive replacement, identity deletion or an unreviewed historic-table rewrite.

First-login provisioning links an authenticated Neon Auth user ID to an Omni account row. It must be idempotent, must not create duplicate accounts and must not alter the Auth identity. If an existing legacy account relationship is discovered, the system records an explicit migration/link decision instead of guessing.

Migrations are dependency-ordered:

```text
identity reference and account capacity
→ companies and facilities
→ public sources and discovery read model
→ verification evidence and reviews
→ catalogue and facility entitlements
→ wallet and append-only ledger
→ availability requests and responses
→ intents and immutable transaction snapshots
→ transaction events and participants
→ QR and payment declarations
→ fulfilment, receipt and ratings
→ audit and analytics projections
```

Every migration must ship with a forward check, invariant check, rollback or recovery procedure, fixture impact and a statement of preserved data.

## 6. Minimum data model

### 6.1 Identity and capacity

- `omni_accounts`: Neon Auth user reference, onboarding state, role capabilities, suspension state and timestamps.
- `facility_slots`: account owner, source, status, creation/release metadata and unique free-slot rule.
- `companies`: account owner, public identity and lifecycle.
- `facilities`: company/account owner, source reference, coordinates, public profile, lifecycle, certification, sales count, plan, discovery mode and public hours.

### 6.2 Trust and catalogue

- `verification_requests`: facility, claimant, version, state, submitted time and outcome.
- `verification_evidence`: typed evidence, private object reference, checksum/metadata, visibility and review linkage.
- `verification_reviews`: admin actor, outcome, reason, prior state and timestamp.
- `products`: facility, stable identity, media reference, price, unit, actual-stock reference, Omni allocation, publication state and version.
- `facility_entitlements`: facility plan, limits, capabilities, effective period and source.
- `facility_bonus_ledger`: facility-scoped $20 grant, lock condition, unlock event and platform-only allocation.

### 6.3 Discovery and availability

- `public_sources`: provider, reference, ingestion status, attribution and freshness.
- `facility_source_refs`: source-to-facility relation, deduplication key and review status.
- `discovery_runs`: viewport, source, outcome, count, duration, error class and operator recovery state.
- `facility_status_history`: facility, prior/current trust status, reason, actor, evidence/review reference and timestamp.
- `availability_requests`: buyer, selected product/facility scope, quantity, budget mode/value, context, state, correlation ID and expiry.
- `availability_responses`: request, seller/automation actor, status, quantity, price/offer snapshot, freshness, correction metadata and audit linkage.

### 6.4 Wallet and transaction

- `omni_wallets`: exactly one account-level wallet.
- `wallet_ledger_entries`: append-only recharge, pending/failed/reversed, hold, spend, release, bonus allocation and correction entries.
- `purchase_intents`: buyer, response, idempotency key, state and transaction ID.
- `transaction_snapshots`: immutable facility, product, quantity, gross price, coupon, net amount, response freshness and fulfilment context.
- `transaction_events`: canonical timeline with actor, event type, prior/next state and correlation ID.
- `transaction_members`: authorized buyer, seller and controlled operators.
- `qr_tokens`: hashed token, transaction, expiry, verification, replay state and attempt metadata.
- `external_payment_declarations`: method, actor, declaration time, seller acknowledgement and dispute status.
- `fulfilments`: pickup/delivery state, actor, timestamps and evidence.
- `ratings`: actor-authorized rating after receipt.

### 6.5 Audit, analytics and operations

- `audit_events`: append-only actor, entity, event, reason, before/after references or hashes, correlation ID and timestamp.
- `analytics_events`: minimized pseudonymous event, consent state, product context and schema version; never raw passwords, QR tokens, payment credentials or unnecessary personal data.
- `operator_runs`: bounded import/recovery/review actions, owner, outcome, evidence and next action.

## 7. Invariants that must be enforced

1. One free Facility Slot is issued once per account.
2. Additional slots require confirmed wallet spend or explicit workspace entitlement.
3. Facility identity is distinct from account and company identity.
4. Unclaimed or newly created facilities cannot publish visible supply before certification has an audited outcome.
5. Certification moves a facility to `certified`/`unconfirmed`; it never directly creates `confirmed`.
6. An unconfirmed Free facility may publish at most five offers.
7. Facility Pro expands capacity/tools for one facility only.
8. Pro cannot create, purchase or preserve the `confirmed` trust badge.
9. Three qualifying successful Omni sales create `confirmed` exactly once.
10. The $20 bonus belongs to the facility, is locked until the qualifying sales threshold and is non-withdrawable.
11. There is one rechargeable Omni Wallet per account; internal buckets are ledger allocations, not separate wallets.
12. Public pins prove source presence only.
13. Availability checks do not reserve stock.
14. Only an eligible comparison response can create a purchase intent.
15. Intent creation is idempotent and snapshots immutable transaction facts exactly once.
16. Contact, itinerary, private chat and QR are unavailable before the authorized intent transition.
17. QR verification is transaction-scoped, expiring, server-authoritative and replay-safe.
18. Omni records external payment declarations but does not process buyer-seller payment or seller withdrawal in V1.
19. Client-provided status, price, stock, trust, wallet balance, coupon outcome or QR validity is never authoritative.
20. Every sensitive mutation creates an audit event with actor, entity, reason where required, correlation ID and timestamp.

Enforce invariants with database constraints where possible, server-side checks everywhere else and UI feedback last. Each non-trivial invariant needs a positive test and a negative/forgery test.

## 8. API contract

### 8.1 Map and discovery contract

The map presentation is client-owned visual state backed by server-owned discovery facts. The browser may hold and restore a `MapContextSnapshot`, but it may not promote a pin, cluster, camera label or cached result into a business fact.

```ts
type MapContextSnapshot = {
  mode: "idle_globe" | "local_map" | "cluster_selected" | "facility_focus" | "route_visible" | "map_recovery";
  center: { lng: number; lat: number };
  zoom: number;
  bounds?: { west: number; south: number; east: number; north: number };
  query?: string;
  filters?: Record<string, string | number | boolean | null>;
  selectedFacilityId?: string;
  selectedProductId?: string;
  availabilityRequestId?: string;
  intentId?: string;
  transactionId?: string;
};
```

`discover` returns source-backed facilities, clusters, freshness, attribution/status and a recoverable source outcome. It does not return private contact data, precise seller-only location, stock guarantees or transaction permissions. A cluster is a density result at a zoom/bounds; expanding it requests a new bounded discovery read. A facility marker carries only an authoritative facility ID and public status. The selected marker is presentation state, not authorization.

`getRoute` is a protected read. It requires transaction membership, confirmed intent and a permitted location policy. A route response must identify its provider or manual status, freshness, destination policy and failure state; it must never expose a private precise location to a visitor or pre-intent buyer.

Every API response uses one envelope:

```ts
{
  ok: boolean;
  correlationId: string;
  data?: unknown;
  error?: {
    code: "AUTH_REQUIRED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID_INPUT" |
      "STALE_STATE" | "ENTITLEMENT_REQUIRED" | "SOURCE_UNAVAILABLE" |
      "ROUTE_NOT_AUTHORIZED" | "ROUTE_UNAVAILABLE" |
      "CONFLICT" | "EXPIRED" | "REPLAYED" | "INTERNAL_RECOVERABLE";
    message: string;
    fieldErrors?: Record<string, string>;
    retryable?: boolean;
  };
}
```

Mutations accept an idempotency key whenever duplicate submission is possible. The server derives actor, ownership, current state, pricing, stock, trust, entitlements and permissions from persisted context.

| Operation | Required authority | Result |
|---|---|---|
| `discover(bounds, query, filters)` | Public source access; account for tracked catalogue search | Bounded facilities/clusters, freshness, source status and recovery state |
| `getFacility(facilityId)` | Public fields by visitor; protected fields only after transition | Facility profile and permitted actions |
| `getCatalogue(facilityId)` | Public active catalogue policy | Facility-scoped offers and eligibility |
| `getRoute(transactionId)` | Authorized transaction member after confirmed intent | Provider/manual route result, freshness and recoverable error |
| `createAvailability(request)` | Authenticated buyer | Request ID, scope, limits and persisted state |
| `respondAvailability(requestId)` | Authorized seller or approved automation | Response snapshot and audit event |
| `submitVerification(facilityId, evidence)` | Authorized claimant | Versioned evidence request |
| `reviewVerification(requestId, outcome)` | Admin | Audited trust outcome |
| `createFacility(companyId, slotId)` | Account with available slot | Facility in verification lifecycle |
| `buyFacilitySlot()` | Account with confirmed wallet funds | Idempotent entitlement and spend event |
| `activateFacilityPro(facilityId)` | Facility owner with confirmed funds | Facility-scoped entitlement |
| `rechargeWallet(reference)` | Account and trusted recharge boundary | Pending/confirmed/failed ledger event |
| `createIntent(responseId)` | Authenticated buyer with eligible response | One immutable transaction snapshot |
| `verifyQr(transactionId, code)` | Authorized seller | Verified, expired, replayed or mismatch result |
| `declareExternalPayment(transactionId, method)` | Authorized buyer | Buyer payment declaration |
| `confirmPayment(transactionId)` | Authorized seller | Seller acknowledgement or dispute state |
| `advanceFulfilment(transactionId, state)` | Actor allowed by state machine | Next state and event |

## 9. Authorization model

Authorization is evaluated server-side from authenticated actor, account ownership, company/facility relationship, transaction membership, persisted state, entitlement, evidence outcome and feature policy. UI visibility is not authorization.

Visitors read public data only. Buyers act on their own availability requests, intents, transactions, receipt and ratings. Sellers act only on owned or managed facilities and their transaction role. Admins review evidence and controlled operational records with a reason. Operators execute bounded operational procedures. No actor may advance another actor’s state merely by changing a client payload or sending a message.

## 10. Recovery and consistency

Persist enough context to recover after refresh, reconnect, close, back navigation or session interruption. Protected context includes actor, map mode, map viewport/center/zoom/bounds, query, filters, selected facility, selected product, availability request, comparison selection, intent ID and transaction ID. The client may preserve this snapshot locally for safe UI restoration; the server remains authoritative for every business state.

Define recovery for:

- stale availability: refresh or return to constraints without losing product selection;
- duplicate mutation: return the original authoritative result;
- expired or replayed QR: show a non-destructive state and safe regeneration/manual path;
- denied camera/location: preserve the flow and provide explicit fallback;
- failed recharge: never create spendable balance; show pending/failed recovery;
- unavailable product/facility: preserve safe context and explain the next action;
- offline mutation: block or queue only when the contract explicitly supports it; never show false completion;
- failed source import: show last safe result or labelled fallback plus operator recovery;
- unavailable route provider: show a labelled unavailable/manual-directions state without exposing unauthorized precise location;
- failed admin review: preserve a reviewable request and evidence history.

## 11. Observability and privacy

Every critical operation receives a correlation ID. Logs record operation, outcome, latency, actor class, entity reference and error class without secrets or raw sensitive content. Analytics uses versioned event names, consent state, pseudonymous actor references and retention rules.

At minimum, measure discovery comprehension, search submission/completion, catalogue relevance, availability completion, response freshness, comparison choice, intent uniqueness, transaction completion, seller activation, certification outcomes, three-sale progression, wallet integrity, recovery quality and mobile usability. Metrics require denominators and definitions before being presented as product truth.

## 12. Root System gate

The Root System is ready for Trunk only when:

1. the Seed and Species are approved and no technical choice contradicts them;
2. domain ownership and authoritative sources are explicit;
3. the data model and migration preserve Auth identities and legacy records;
4. API envelopes, actor permissions and error classes are typed;
5. state transitions and invariants have positive and negative tests;
6. idempotency, auditability and recovery are designed for every sensitive mutation;
7. browser/server boundaries prevent secret and database leakage;
8. the first Trunk slice has a stable data/API seam and proof plan;
9. temporary fixtures, manual operations and external dependencies are labelled;
10. no unresolved decision can change the critical journey, trust, money, privacy or data authority during Trunk execution.

A visual screen without this gate is a Species artifact, not a Trunk implementation.
