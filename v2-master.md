# Omni V2 — MASTER

> **Canonical version:** 2026-08-21 / 1.1.0
>
> **Patch note:** Establishes the V2 product master and makes `v2-flow.md` the authoritative state and transition contract; the prior V2 PRD is retained as a derived snapshot. Adds the supplied Omni logo and the warm ivory/orange visual identity as the canonical S1/S2 presentation system.
>
> **Status:** Approved baseline for clean-slate implementation planning

## 0. Product identity

Omni is a global geospatial supply-and-demand search engine whose primary interface is a live MapLibre globe/map. A visitor searches for a need, discovers source-backed facilities, inspects a facility and its catalogue, verifies availability, compares real responses, creates an authorized purchase intent, uses a server-bound QR transaction room, records external payment and fulfilment, confirms receipt and rates the outcome. Omni is not primarily a marketplace grid, generic chat application, directory, decorative globe, buyer-seller payment processor or seller withdrawal product.

The facility is the core supply object. The catalogue bridges a facility and buyer demand. The map remains mounted as the scene while sheets and cards present temporary stateful surfaces above it.

The supplied Omni logo is the canonical brand mark. S1/S2 use its warm ivory, pale peach and orange language: the globe remains the visual field, while chrome, dock, sheets, cards and controls use a consistent warm glass system with stable spacing and explicit non-overlap zones. The complete token contract is documented in [`docs/v2-omni-design-system.md`](./docs/v2-omni-design-system.md).

## 0.5 Scope gate

| Area | Status | Note and re-evaluation trigger |
|---|---|---|
| Map-first globe and visible-bounds discovery | **Build now** | Core product identity. Must pass buyer map/search proof. |
| Catalogue-first buyer availability and comparison | **Build now** | Core buyer value. Must pass selected-product and honest-response proof. |
| Purchase intent and transaction room | **Build now** | Core trust loop. Must pass idempotency, resume and actor-state proof. |
| QR verification and external payment/fulfilment | **Build now** | Core operational handoff. Must pass safe fixture, replay and camera/manual proof. |
| Facility verification and seller onboarding | **Build now** | Trust boundary. Must pass audited outcome proof. |
| Map-first seller workspace | **Build now** | Required supply-side operation. Must pass facility/product/request/scanner proof. |
| One Omni Wallet and FedaPay recharge | **Build now** | Platform consumption only; no buyer-seller money rail or withdrawal. |
| PWA mobile experience | **Build now** | Immediate mobile product; native app only after PWA verification. |
| OSM/Overpass viewport backfill | **Build-manual** | Human/operator recovery remains allowed until coverage volume and mismatch data justify automation. |
| Admin evidence review | **Build-manual** | Human review is the authoritative outcome until automation is justified by volume and quality evidence. |
| AI orchestration | **Deferred** | Re-evaluate after manual core loop has production proof and measured bottlenecks. |
| Native mobile apps | **Deferred** | Re-evaluate after PWA release verification. |
| Instant world prepopulation | **Deferred** | Re-evaluate only with source capacity, cost and coverage evidence. |
| Buyer-seller in-app payment | **Deferred** | Re-evaluate only through a separate money-movement decision and compliance review. |
| Seller withdrawal/payout | **Deferred** | Not part of V2 V1-scope semantics. |

If a later section conflicts with this table, the scope gate wins.

## 0.6 Manual operations layer

### OSM/Overpass backfill

The discovery adapter imports only the visible map bounds, deduplicates by source reference, records source and freshness, and exposes import failure separately from empty coverage. Operators may retry failed tiles, inspect provider status and reconcile mismatches. Measure import latency, failure rate, duplicate rate, facility correction rate and source freshness. Graduation to automation requires stable provider quotas, an observed operational bottleneck and a tested retry/reconciliation procedure.

### Admin evidence review

An admin reviews claimant identity, facility/company evidence, product evidence and location context. The admin chooses `certified`, `unconfirmed` or `rejected`, records reason, actor, timestamp and evidence reference, and may request new evidence. Measure review latency, rejection reasons, correction rate and post-review mismatch rate. Graduation to automation requires sufficient labeled evidence, stable precision/recall targets and a human override path.

## 1. Full vision

Omni should make it possible for a person to search for what they need without first understanding a marketplace taxonomy or knowing a seller name. The product uses public source-backed geography for discovery while refusing to conflate a public place with verified supply. Buyers receive catalogue-backed availability responses and a controlled path to external payment and handoff. Sellers receive a progressive trust path from unclaimed public presence to reviewed operational facility and later confirmed status through qualifying completed sales.

The platform’s trust model is explicit: public source data proves a location/name/category may exist; audited review proves a facility status; catalogue/server validation proves product identity/price/stock; seller or approved auto-response proves availability; the buyer’s idempotent intent creates a transaction context; the server creates and validates the QR; buyer and seller declarations record external payment and fulfilment; the buyer confirms receipt and rates.

## 2. Validated flows

The complete state and transition contract is [`v2-flow.md`](./v2-flow.md). It is authoritative for:

- Map arrival, location, idle globe, camera priority, search reveal, pins and coverage.
- Buyer dock, search, facility selection, catalogue, availability, comparison and intent.
- Seller evidence request, admin review, facility lifecycle, catalogue and scanner.
- Transaction room, QR, external payment, fulfilment, receipt and rating.
- Omni Wallet recharge, platform spending, PWA, notifications and resume behavior.

No derived artifact may introduce a new state, actor authority, money rail, unlock point or scope status without a patch to this master and the affected flow contract.

## 3. Product requirements

The complete requirements snapshot is [`omni-v2-prd.md`](./omni-v2-prd.md). It is derived from this master and the flow contract and covers users, jobs, goals, metrics, requirements, release gates, risks and delivery phases. If it conflicts with this master or `v2-flow.md`, the master and flow contract take precedence until the PRD is regenerated.

## 4. Core invariants

| Invariant | Enforcement preference |
|---|---|
| A public facility is not proof of supply or identity | Server response shape and UI status labeling. |
| Clicking claim never changes facility status | Database transition constraint and audited server mutation. |
| Only audited review produces certified/unconfirmed/rejected | Role-checked mutation, audit event and review record. |
| Catalogue product identity is server authority | Foreign keys, server validation and immutable transaction snapshot. |
| Availability checks do not reserve stock | Separate response/request model and no allocation mutation. |
| One eligible response creates one transaction context | Idempotency key, unique transaction constraint and server return of existing context. |
| Contact/chat/itinerary unlock only after intent | Server projection omits private fields before authorized state. |
| QR is bound, expiring and replay-safe | Server token state, expiry, transaction match and unique redemption event. |
| Buyer-seller payment remains external in V1 | No in-app payment route or seller payout capability. |
| FedaPay recharges one Omni Wallet only | Server callback reconciliation and wallet ledger. |
| Client values never advance business state | Database constraint → server check → UI feedback. |
| Sensitive analytics payloads are excluded | Consent-aware event schema and ingestion redaction. |

## 5. Actors and permissions

The visitor, buyer, seller, admin and server permissions are defined in the authority tables in [`v2-flow.md`](./v2-flow.md). The implementation must use typed role and resource authorization, never route visibility alone. Every private mutation must identify actor, target resource, current state, next state and idempotency behavior.

## 6. UX and composition contract

The map is the permanent scene. The composition hierarchy is:

`MAP → CHROME → DOCK → RESULT CARD/RAIL → FACILITY SHEET → CATALOGUE SHEET → AVAILABILITY SHEET → COMPARISON → TRANSACTION ROOM`

The shared sheet primitive is bottom anchored on mobile and bounded/floating on desktop, with scrollable body, reachable footer, preserved focus, no horizontal overflow and explicit loading/ready/empty/error/retry/cancel/close/back behavior. Top-right chrome contains notifications and a typed menu only. Any visible menu action must resolve to a real route or state.

## 7. Data, architecture and derived artifacts

The implementation architecture, API seams and repository boundaries are defined in [`v2-product-interface-architecture.md`](./v2-product-interface-architecture.md) once generated. Durable data constraints and server/UI rule mappings are defined in [`v2-data-schema.md`](./v2-data-schema.md). The normalized state-to-screen flow specification is defined in [`v2-flow-spec.md`](./v2-flow-spec.md). These are derived artifacts and must link back to this master.

## 8. Vertical-slice execution rule

Every implementation ticket is an observable end-to-end vertical slice. A slice includes the migration/data change, typed server/API contract, UI surface, authorization/business-rule enforcement, automated tests and a proof command or click-through. “All frontend first” and “all backend first” are not valid feature plans except for a narrowly justified infrastructure dependency.

Before starting a slice, the team must provide its relevant master excerpt, validated flow states, architecture seam, data rules, focused build prompt, acceptance matrix and stopping condition. The application must remain runnable after every slice. If a slice reveals ambiguity, stop, patch this master and regenerate affected artifacts before continuing.

## 9. Release definition

V2 is releasable only when the buyer map/search loop, catalogue/availability loop, seller verification/workspace loop, transaction/QR/external fulfilment loop, wallet/PWA loop and their risk-based proofs meet the acceptance criteria in the PRD and flow contract. A successful build alone is not release proof.

The release state must be exactly one of `verified`, `partial`, `blocked` or `needs-decision`, with commands, environments, fixtures, evidence, residual risks and next action recorded.

## 10. Open decisions

The following decisions remain open and must be resolved before their affected slice:

| Decision | Affected slice |
|---|---|
| Exact Free/Pro city, radius and bulk limits | Buyer availability and entitlement. |
| Evidence types and retention | Seller verification and admin review. |
| Definition of three qualifying completed sales | Confirmed status and $20 bonus. |
| Wallet ledger bucket names and spending priority | Wallet schema and platform spending. |
| Coupon eligibility, stacking and expiry | Product/coupon and transaction snapshot. |
| FedaPay callback and reconciliation contract | Wallet recharge. |
| Delivery/pickup metadata | Fulfilment. |
| Notification retention/read policy | Resume and deep links. |
| OSM quotas and operator runbook | Build-manual coverage. |

No open decision may be silently selected inside a component, migration or build prompt.

## References

[1]: ./v2-flow.md "Omni V2 — Canonical Flow Contract"
[2]: ./omni-v2-prd.md "Omni V2 — Product Requirements Document"
[3]: ./docs/v2-process-audit-2026-08-21.md "Omni V2 — One-Shot Process Audit"

The master is derived from the approved V2 flow contract [1], reconciles the existing PRD snapshot [2], and records the process correction in the audit [3].
