# Omni V2 — Nature Way Implementation Plan

**Document ID:** `OMNI-V2-PLAN-002`
**Status:** Rewritten execution architecture — pending Seed/Species/Roots approval
**Method:** Nature Way
**Authority chain:** [`v2-seed.md`](./v2-seed.md) → [`v2-species.md`](./v2-species.md) → [`v2-roots.md`](./v2-roots.md) → [`v2-flow.md`](./v2-flow.md)

> This document is not a second product specification. It turns the authoritative Seed, Species, Root System and Flow into a dependency-ordered growth plan. Each unit uses the full vertical-slice standard at the depth its structure requires.

## 1. Delivery posture

Omni will be rebuilt as a clean implementation surface. The current prototype branch is reference evidence and salvageable infrastructure, not the visual or state authority. Existing Neon Auth identities, legacy records and approved database boundaries remain protected. No destructive reset is part of this plan.

The product is not built as “frontend first, backend later,” “all dashboards first” or “all APIs first.” Each delivered unit contains its contract, data, server operation, UI, integration, hardening and proof. A later branch may reuse a proven adapter only after it passes the current Root System and Species contracts.

## 2. Structural growth path

```text
Omni product
├── Seed: identity, promise, actors, laws, scope
├── Species: map-first visual and interaction blueprint
├── Root System: domains, persistence, server authority, security, recovery
├── Trunk: map → search → facility → catalogue → availability → comparison
│   ├── trunk flow: arrival and location
│   ├── trunk flow: search and discovery
│   ├── trunk flow: facility and catalogue
│   └── trunk flow: availability and comparison
├── Heartwood: harden the complete buyer trunk
├── Branches
│   ├── trust and facility verification
│   ├── seller map-first operations
│   ├── wallet, slots and facility Pro
│   ├── purchase intent and transaction room
│   ├── QR, external payment and fulfilment
│   ├── resume, notifications and PWA completion
│   └── admin, analytics and operations
├── Canopy: holistic quality, performance and accessibility
└── Rings: release certification and future iteration
```

This is a structural path, not a fixed number of implementation tickets. Any branch, flow or operation may recurse into its own Seed → Species → Root System → Trunk → Heartwood → Branches → Canopy → Ring cycle when it has independent decisions, states, failure modes or proof gates.

## 3. Global gates

| Gate | Entry condition | Exit condition |
|---|---|---|
| Seed | Product direction is disputed, incomplete or stale | Identity, core promise, laws, success and non-goals are approved |
| Species | Seed is approved | Visual blueprint, wireframes, surface ownership and responsive rules are approved |
| Root System | Seed and Species are approved | Data/API/auth/security/recovery contracts and migration boundaries are executable |
| Trunk | Root System is executable | Buyer core journey works UI-to-database and matches Species |
| Heartwood | Trunk happy path works | Buyer trunk survives failure, duplicate, refresh, back, lock, expiry and responsive/accessibility proof |
| Branch | Heartwood is stable | One feature is complete end-to-end and integrated without regressions |
| Canopy | Required branches are complete | Cross-product quality, performance, accessibility and operational pass succeeds |
| Ring | Canopy is complete | Release evidence, rollback, known limits and acceptance decision are recorded |

Never advance because a document sounds complete. Advance because the exit evidence exists.

## 4. Phase 0 — Seed

**Outcome:** a stable product identity from which all architecture and implementation decisions grow.

Use [`v2-seed.md`](./v2-seed.md) as the authority. Verify the map-first search-engine identity, the core journey, public/protected boundary, facility trust lifecycle, account capacity, per-facility Pro, facility-scoped bonus, one Wallet and first-release non-goals.

**Seed proof:** owner approval of the six locked decisions, no unresolved critical ambiguity, explicit build-now/manual/deferred scope and a named failure the product must not ship.

## 5. Phase 1 — Species

**Outcome:** a visual and interaction blueprint that prevents the UI from being improvised during logic implementation.

Use [`v2-species.md`](./v2-species.md) as the authority. Confirm the pale quiet map, floating search pill/dock, contextual bottom sheet, compact controls, facility/product card hierarchy, restrained translucent material, green/orange semantic accents, permanent map composition, named stages, no dead actions and responsive safe zones.

**Species proof:** approved wireframe/state compositions for arrival, search, results, facility, catalogue, availability, comparison, Auth, transaction and seller workspace at mobile and desktop compositions; design tokens and a 320/375/768/1280 proof matrix.

## 6. Phase 2 — Root System

**Outcome:** server-authoritative architecture that can bear the Trunk.

Use [`v2-roots.md`](./v2-roots.md) and [`v2-flow.md`](./v2-flow.md). Implement or verify:

1. clean browser/server boundary and typed result/error envelopes;
2. Neon Auth identity linking and actor/role context without identity deletion;
3. domain-owned persistence for facilities, trust, catalogue, availability, entitlements, wallet, transactions, QR, audit and analytics;
4. database constraints and server checks for trust, stock, slots, wallet, coupon, intent and QR invariants;
5. idempotency keys, correlation IDs and append-only audit/ledger foundations;
6. public-data source adapter timeout/fallback/recovery boundary;
7. fixture factory with visitor, buyer, seller, admin, unclaimed, certified/unconfirmed, Pro, confirmed, stale, unavailable, wallet and QR cases;
8. migration forward checks, preservation statement and recovery procedure.

**Root System proof:** schema/constraint tests, authorization matrix, client-boundary check, idempotency/audit check, secret scan, recovery contract review and a runnable empty product shell.

## 7. Phase 3 — Trunk: buyer core

**Outcome:** the product’s defining promise works from the map to availability comparison with real or explicitly bounded data.

### 7.1 Trunk structural units

| Unit | User-visible outcome | Required proof |
|---|---|---|
| `TRUNK-MAP` | Arrival shows a usable globe/map, public context, location and calm motion | Map canvas, camera ownership, location states, motion/reduced-motion and responsive geometry |
| `TRUNK-SEARCH` | User searches a need through one dock and one Options disclosure | Auth boundary, Enter/button parity, query/options preservation, bounded discovery and honest errors |
| `TRUNK-FACILITY` | User selects a facility and sees public detail without losing results | Pin/card semantics, source/trust distinction, back restoration and no private leakage |
| `TRUNK-CATALOGUE` | User chooses an existing facility product rather than retyping it | Catalogue loading/empty/sold-out/closed/error states and no reservation/intent side effect |
| `TRUNK-AVAILABILITY` | User completes Product → Scope → Constraints → Responses | Auth restoration, scope/constraint validation, freshness, non-reservation and response recovery |
| `TRUNK-COMPARISON` | User can distinguish eligible options without premature contact or intent | Ordered response proof, stale/expired states and intent/contact locks |

These units are nested Trunk work, not permission to build isolated UI pieces. The Trunk gate passes only when the complete chain is usable in production-like conditions.

### 7.2 Trunk acceptance path

```text
arrival map
→ public exploration
→ search need
→ discover facilities
→ facility detail
→ catalogue loading/ready
→ product selected
→ availability scope
→ constraints
→ authenticated submission
→ responses or honest recovery
→ comparison
```

The map remains mounted. Search typing never moves the camera. The buyer cannot create availability or intent from a public pin alone. Product selection does not reserve stock. The interface matches the Species blueprint at 320/375/768/1280 CSS pixels.

**Trunk proof:** browser click-through with real/bounded server data, unit and integration tests, authorization negatives, no-reservation negative, empty/error/retry/cancel proof, context restoration and responsive visual evidence.

## 8. Phase 4 — Heartwood: harden the buyer trunk

**Outcome:** the buyer trunk is reliable outside the happy path.

Run adversarial review and implement:

- loading, empty, error, retry, cancel, locked, success and unavailable states for every Trunk surface;
- duplicate-submit and concurrent-submit behavior;
- refresh, back, Escape, close, keyboard and interrupted-session recovery;
- Auth cancellation/error with exact context restoration;
- stale availability, expired response and source timeout recovery;
- public/private boundary tests for contact, itinerary, chat, QR, price, stock, trust and status;
- mobile keyboard, safe-area, sheet-footer, focus and reduced-motion proof;
- logging and analytics with no secret or unnecessary personal data.

**Heartwood gate:** a browser or integration proof can intentionally trigger every critical failure and reach a safe next action. No unresolved blocker may be hidden behind a green visual state.

## 9. Phase 5 — Branches

Each branch runs its own nested mini-seed, mini-species when needed, mini-root, mini-trunk, mini-heartwood, mini-canopy and ring decision. Branches are sequenced by dependency.

### Branch A — Trust and facility verification

**Dependency:** Root System and public facility selection.
**Outcome:** an owner can select an unclaimed facility or start a new facility request, submit evidence, and receive an audited outcome without claim-by-click.

Implement evidence drafts, typed evidence categories, resume/edit/cancel, idempotent submit, admin queue, audited `certified`/`unconfirmed`/`rejected`/`needs_more_evidence`, optional channel invitation, three-sale confirmation and locked facility bonus. Pro remains separate from trust.

**Gate:** claim-click negative test, evidence privacy/ownership tests, admin audit completeness, rejection/resubmission recovery and exactly-once three-sale progression.

### Branch B — Seller map-first operations

**Dependency:** Trust lifecycle and Trunk catalogue/availability contracts.
**Outcome:** a seller manages one authorized facility in the same spatial language as the buyer.

Implement facility context, open/closed state, hours, discovery mode, demand queue, automatic-response correction, product lifecycle, stock allocated to Omni, clear product form, guided coupon form and honest published/no-discount state. Keep account slots, facility limits, Pro, bonus and trust visibly separate.

**Gate:** seller E2E, server stock/coupon constraints, response correction audit/notification, no-dead-action audit and responsive Species match.

### Branch C — Wallet, slots and Facility Pro

**Dependency:** Root ledger and seller facility identity.
**Outcome:** one account-level Wallet reliably funds platform consumption and facility-scoped entitlements.

Implement FedaPay recharge-only boundary, pending/confirmed/failed/cancelled/expired states, append-only ledger, reconciliation, slot purchase, facility Pro activation/expiry, platform spend, insufficient-funds recovery and non-withdrawable facility bonus unlock. Keep buyer-seller money and seller withdrawal absent.

**Gate:** callback, ledger and reconciliation tests; failed-recharge recovery; server spend/entitlement checks; Pro-expiry and withdrawal-negative proof.

### Branch D — Purchase intent and transaction room

**Dependency:** Trunk comparison and seller operations.
**Outcome:** an eligible response becomes one authorized, resumable transaction.

Implement eligibility-gated idempotent intent creation, immutable snapshot, private contact/itinerary unlock, one transaction room, named timeline, actor-specific next action, transaction-scoped chat/system messages and resume bar/deep link.

**Gate:** concurrent intent proof, snapshot immutability, unlock positive/negative proof, chat authorization and refresh/close/reopen recovery.

### Branch E — QR, external payment and fulfilment

**Dependency:** Transaction room and Wallet boundary.
**Outcome:** buyer and seller complete a traceable physical/external handoff.

Implement transaction-bound QR, expiry, replay-safe server verification, scanner-ready camera flow, explicit permission CTA, visible live preview, manual fallback, valid/expired/replayed/mismatch/malformed states, external method declaration, seller acknowledgement, pickup/delivery, receipt and rating.

**Gate:** secure-origin camera proof, denial/manual fallback, replay and expiry proof, actor authorization, complete fulfilment E2E and negative proof that Omni does not process seller payout.

### Branch F — Resume, notifications and PWA completion

**Dependency:** Root identity, Heartwood recovery and transaction events.
**Outcome:** the first mobile surface can be installed, relaunched and resumed without losing safe context.

Implement manifest/icons/install metadata, service-worker policy, network/offline policy, transactional notifications, deep links, auth restoration, safe sign-out clearing and dynamic viewport/safe-area behavior.

**Gate:** install/lifecycle check, notification recovery, offline mutation blocking, role/context restoration and four-width mobile/accessibility proof.

### Branch G — Admin, analytics and operations

**Dependency:** Trust, discovery, transaction and wallet events.
**Outcome:** human operators can review trust and monitor the product without bypassing authority or collecting unnecessary data.

Implement evidence queue and audit history, bounded source-import recovery, consent-aware event schema, funnel denominators, error/latency/availability monitoring, ledger anomaly visibility and runbooks for manual review/import/recovery.

**Gate:** admin audit test, import recovery drill, analytics privacy/schema test, event completeness and production-log redaction.

## 10. Phase 6 — Canopy

After required branches work, perform the holistic pass across buyer, seller, admin and PWA surfaces:

- reconcile every screen with the Species blueprint;
- remove duplicate primitives, dead menu actions and contradictory labels;
- validate hierarchy, spacing, typography, color, contrast, safe areas and card density;
- certify 320/375/768/1280 widths with no horizontal overflow or overlay collisions;
- test keyboard, screen-reader names, focus restoration, touch targets and reduced motion;
- measure map, API, database and bundle performance;
- verify loading, caching, source fallback, offline and recovery behavior;
- finalize operational runbooks, support context and rollback procedure.

Canopy may refine appearance and ergonomics. It may not introduce uncontracted business behavior.

## 11. Phase 7 — Rings

A release ring is accepted only when the release matrix is green or every exception is explicitly `partial`, `blocked`, `manual` or `deferred` with an owner and recovery plan.

| Release gate | Required evidence |
|---|---|
| Buyer | Map, search, facility, catalogue, availability, comparison, Auth restore and resume |
| Seller | Verification, facility operations, products, coupons, demand, scanner and fulfilment |
| Trust | No claim-by-click, audited outcomes, three-sale confirmation and bonus lock/unlock |
| Money | One Wallet, FedaPay boundary, ledger integrity, no payout/withdrawal |
| Transaction | Idempotent intent, immutable snapshot, scoped room/chat and actor actions |
| QR | Secure preview, denial fallback, valid/expired/replayed/mismatch/malformed outcomes |
| Mobile | PWA lifecycle, safe areas, focus, no overflow and four-width proof |
| Recovery | Empty, timeout, server error, offline, cancellation, duplicate, expiry and unauthorized |
| Operations | Manual runbooks, analytics privacy, error/latency health and audit evidence |

Record commit, deployment, environment, migrations, fixtures, tests, screenshots/traces, known limitations, rollback and acceptance owner. Do not call the product production-ready because a single branch or public map ring passed.

## 12. Recommended execution order

The first actual work package is **Seed + Species approval and Root System reconciliation**, not another UI patch. Once those gates are accepted, execute only the buyer Trunk and its Heartwood. The first branch after that is Trust, then Seller Operations, Wallet/Entitlements, Transaction Room, QR/Handoff, PWA/Notifications and Operations.

At every stop, report the current structural path, phase, changed surfaces, evidence, residual gaps and one next gate. If a requirement changes the Seed, Species or Root System, stop implementation and update the authority before continuing.
