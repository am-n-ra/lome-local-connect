# Omni V2 — Nature Way Task Backlog

**Document ID:** `OMNI-V2-TASKS-002`
**Status:** Regenerated backlog for the Seed-derived rebuild
**Method:** Nature Way
**Authority chain:** [`v2-seed.md`](./v2-seed.md) → [`v2-species.md`](./v2-species.md) → [`v2-roots.md`](./v2-roots.md) → [`v2-flow.md`](./v2-flow.md) → [`v2-plan.md`](./v2-plan.md) → [`v2-feature-list.md`](./v2-feature-list.md)

> This backlog tracks the new implementation surface. Existing prototype commits and proof remain historical reference evidence; they do not automatically satisfy the rewritten Seed, Species, Root System or Trunk gates.

## 1. Tracking contract

### 1.1 Statuses

| Status | Meaning |
|---|---|
| `todo` | Not started; no implementation claim is made. |
| `ready` | Contract and dependencies are clear; it may enter execution. |
| `in_progress` | Work is actively underway. |
| `blocked` | A dependency, decision, credential, environment or proof is missing. |
| `review` | Implementation exists and awaits product, visual, code or security review. |
| `verified` | Required evidence passes, but the parent phase is not closed. |
| `done` | Feature and parent gate are accepted. |
| `partial` | Useful work exists but required implementation or proof remains. |
| `manual` | A bounded human/external operation is the authority. |
| `deferred` | Explicitly outside the current release. |

### 1.2 Standard nested work package

Each substantial task is decomposed only as deeply as its structure requires. Use the following work package when applicable:

| Suffix | Subtask | Required result |
|---|---|---|
| `-SEED` | Objective | User outcome, actor, scope and acceptance criterion |
| `-SPECIES` | Blueprint | Visual/state composition or inherited blueprint decision |
| `-ROOT` | Contract | Data, API, permissions, invariants and dependencies |
| `-TRUNK` | Vertical implementation | UI, server and data connected for the core case |
| `-HEARTWOOD` | Hardening | Edge states, validation, duplicates, recovery and negative proof |
| `-CANOPY` | Quality | Responsive, accessibility, performance and visual proof |
| `-RING` | Gate | Evidence, residual gaps, owner, rollback and next decision |

A trivial task may use fewer subtasks when the unit is genuinely simple. A complex nested unit receives its own mini-cycle and structural path.

## 2. Phase and slice tracker

| Unit | Nature Way phase | Dependency | Status |
|---|---|---|---|
| SEED | Seed and PRD | None | `ready` |
| SPECIES | Design blueprint and complete maquette | SEED | `partial` |
| ROOTS | Root System | SEED, SPECIES | `review` |
| TRUNK | Buyer map → availability core | ROOTS | `partial` |
| HEARTWOOD | Harden buyer trunk | TRUNK | `partial` |
| BRANCH-A | Trust and facility verification | HEARTWOOD | `todo` |
| BRANCH-B | Seller map-first operations | BRANCH-A, TRUNK | `partial` | Seller mini-cycle implementation is deployed; official seller bearer and cross-flow proof remain open |
| BRANCH-C | Omni Wallet, slots and Pro | ROOTS, BRANCH-B | `todo` |
| BRANCH-D | Intent and transaction room | TRUNK, BRANCH-B | `todo` |
| BRANCH-E | QR, external payment and fulfilment | BRANCH-D, BRANCH-C | `todo` |
| BRANCH-F | Resume, notifications and PWA | HEARTWOOD, BRANCH-D | `todo` |
| BRANCH-G | Admin, analytics and operations | BRANCH-A, BRANCH-E | `todo` |
| CANOPY | Product-wide quality pass | Required branches | `todo` |
| RING | Release certification | CANOPY | `todo` |

## 3. Seed and Species preparation

| Task ID | Task | Dependencies | Status | Gate evidence |
|---|---|---|---|---|
| RESET-001 | Freeze current prototype commit, deployment and known gaps as reference | None | `ready` | Reference record |
| SEED-001 | Reconcile and approve product identity, promise, actors and core journey | RESET-001 | `ready` | Owner approval in `v2-seed.md` |
| SEED-002 | Approve build-now, manual and deferred scope | SEED-001 | `ready` | Scope gate |
| SPECIES-001 | Reproduce the supplied Canva buyer arrival frame as the exact reference composition | SEED-001 | `review` | S01 arrival frame in complete maquette |
| SPECIES-002 | Lock color, type, spacing, material, motion and status semantics | SPECIES-001 | `review` | Token/contrast review |
| SPECIES-003 | Create and review the S00–S27 screen/state maquette and surface ownership | SPECIES-001 | `review` | Complete static maquette and state contract |
| SPECIES-004 | Approve 320/375/768/1280 responsive and accessibility inheritance matrix | SPECIES-002 | `review` | Responsive proof matrix |
| SPECIES-005 | Approve map-only bottom dock, separated result dock, focused submit dock and upward Options surface | SPECIES-003 | `review` | Dock maquette and no-overlap measurements |
| SPECIES-006 | Approve J5-owned account navigation and role-aware intermediate surface | SPECIES-003 | `review` | Account navigation opened/closed states and real-action inventory |
| SPECIES-007 | Approve guest Account, authenticated Account and context Resume surfaces | SPECIES-003 | `review` | Account sheets, preserved context and safe return paths |
| SPECIES-008 | Approve comparison and intent-review surfaces with contact/itinerary locked | SPECIES-003 | `review` | Response comparison, coupon snapshot and locked-state proof |
| SPECIES-009 | Approve intent-created and contact/itinerary-unlocked surfaces | SPECIES-008 | `review` | Server-confirmed intent boundary and permitted contact actions |
| SPECIES-010 | Approve transaction room, QR, external payment, fulfilment and rating surfaces | SPECIES-009 | `review` | Timeline, QR/payment and completion/recovery maquette |
| SPECIES-011 | Approve idle globe and local fullscreen map states | SPECIES-001 | `review` | Globe/local maquette and camera ownership rules |
| SPECIES-012 | Approve cluster, pin and facility trust-marker semantics | SPECIES-011 | `review` | Density, unclaimed/unconfirmed/confirmed legend and no-supply implication proof |
| SPECIES-013 | Approve selected facility focus, protected route and map recovery states | SPECIES-012 | `review` | Route-after-intent and Back/Escape context restoration maquette |

## 4. Root System

The active Root closure register is [`v2-root-closure-register.md`](./v2-root-closure-register.md). It assigns owners and stop conditions for Auth, migration preservation, ownership, wallet integrity, QR concurrency, route privacy, browser recovery and fixtures. Trunk remains blocked until these items are closed or explicitly accepted as manual/blocked/deferred.


| Task ID | Task | Dependencies | Status | Gate evidence |
|---|---|---|---|---|
| ROOT-001 | Establish clean browser/server boundary and typed result/error envelope | SEED, SPECIES | `review` | Build, Vercel bundling, `check:boundary`, public API 200, protected API 401, branch JWKS reachability, fail-closed malformed-token, malformed JSON 400 and redacted internal-error tests pass; connected-browser inspection hit HTTP 504 |
| ROOT-002 | Link Neon Auth identity to idempotent Omni account provisioning | ROOT-001 | `partial` | The latest aggregate check reports 30 Auth users; persistent V2 still has one buyer-ready account with one matching Auth row and one seller-ready account whose V2 binding field has no matching Auth row after the user-reported demo deletion. The availability writer provisions buyer account/wallet idempotently; seller rebinding must use a supported Auth lifecycle and remain bounded to the authorized fixture |
| AUTH-03 | Recreate only authorized demo Auth identities for live bearer proof | ROOT-001, ROOT-002 | `in_progress` | [`v2-root-demo-recreation-decision.md`](./v2-root-demo-recreation-decision.md) records the confirmed scope and observed post-deletion state: Auth users decreased from 35 to 30, the buyer-ready fixture remains linked, and the seller-ready V2 account has a stale/unmatched Auth binding while its facility/product rows remain. Disposable branch `omni-v2-seller-proof-20260823` now has branch-local Better Auth; `scripts/prove-v2-live-seller.mjs` performs guarded sign-in/branch-local sign-up, fixture binding and in-memory bearer proof. External CI/Preview secret injection and deployment binding remain required; direct SQL, hand-crafted JWTs and agent password handling remain prohibited |
| ROOT-003 | Define domain ownership and persistence model | ROOT-001 | `partial` | Static review plus isolated-branch catalog of 26 V2 tables/125 constraints; disposable branch denies mismatched facility/company ownership and availability scope; the bounded fixture ledger records exact environment/actor boundaries; preserved-row, persistent-guardrail and live transaction enforcement remain open |
| ROOT-004 | Add facility, trust, catalogue and availability contracts | ROOT-003 | `partial` | 86-test suite plus canonical facility detail HTTP 200; branch serializer/SQL scan proves no public stock field; actual availability writer validates product/facility publication and trust, returns canonical replay and rejects shape mismatch; authenticated Buyer request creation and aggregate persistence are browser-proven; the Seller response now validates owned facility, published product, request scope and allocated quantity and is browser-proven after the quantity integer-cast fix; deployed recovery, concurrency and broader Root gates remain open |
| ROOT-005 | Add wallet, entitlement, transaction, QR and fulfilment contracts | ROOT-003 | `partial` | Root/Flow contracts plus QR and transaction state-policy tests cover actor ownership, approved transitions, match, expiry and replay denials; repository seams now cover seller response, server-issued QR, conditional QR verification, guarded purchase-intent scaffolding, append-only wallet spending, one-time confirmed-trust/three-sale bonus granting, conditional buyer/seller transaction-state events, declaration-only cash, mobile money and pay-on-delivery payment and seller confirmation with immutable snapshot, membership and initial event; authenticated response/QR/intent/transition/payment wrappers are included in the ten-function serverless bundle; [`v2-root-wallet-evidence.md`](./v2-root-wallet-evidence.md), [`v2-root-payment-evidence.md`](./v2-root-payment-evidence.md) and [`v2-root-demo-transaction-evidence.md`](./v2-root-demo-transaction-evidence.md) record the boundaries; persistent V2 bounded evidence reaches `payment_confirmed` with QR replay count 1; live bearer execution, concurrency, recovery and fulfilment remain required |
| ROOT-006 | Add audit events, correlation IDs and mutation idempotency | ROOT-001 | `partial` | 12 test files/86 tests pass, including redacted internal errors, typed malformed-input handling, availability replay-shape checks, seller response policy/idempotency checks, Auth-linked conditional QR persistence, server-issued QR, current-state QR verification/audit, guarded purchase-intent replay checks, wallet spend/bonus replay checks, transaction event/audit append conflict checks, declaration-only payment replay/authorization plus HTTP policy checks and seller confirmation gating/replay checks; response/QR/intent/transition/payment wrappers are bundled in the ten-function build; migration 005 adds persistent response/event/audit/QR uniqueness guards; bounded V2 evidence records the response, snapshot, QR first-pass/replay rejection and payment audit facts; database concurrency, live audit append and broader live mutation replay remain open |
| ROOT-007 | Define bounded public-source adapter and recovery procedure | ROOT-003 | `manual` | Operator runbook |
| ROOT-008 | Define private media/evidence storage boundary | ROOT-003 | `todo` | Access-control test |
| ROOT-009 | Preserve Auth identities and legacy records during additive migration | ROOT-003 | `partial` | Migration 003 executed on the former disposable branch with 2 constraints, 7 triggers and QR function; migration 005 was explicitly applied to persistent V2 using only additive column/index objects; read-only Auth/schema/public-row coexistence and exact fixture inventory remain recorded; preserved-row rollback/recovery and production/default decision remain required |
| ROOT-010 | Build labelled fixture factory across actors and failure states | ROOT-004, ROOT-005 | `partial` | [`v2-root-fixture-ledger.md`](./v2-root-fixture-ledger.md) inventories persistent public, canonical smoke and disposable Root-proof records with non-claim rules; reusable factory and fixture-change discipline remain |
| ROOT-011 | Define analytics schema, consent and retention boundary | ROOT-006 | `todo` | Privacy/schema review |
| ROOT-012 | Define map context, pin/cluster, route authorization and camera recovery boundary | ROOT-001, ROOT-004 | `review` | MapContextSnapshot restoration, public-marker semantics and protected-route policy tests pass; live route/provider and browser recovery remain open |
| ROOT-013 | Complete seller availability response and server-issued QR seams | ROOT-004, ROOT-005, ROOT-006 | `partial` | [`v2-root-seller-response.md`](./v2-root-seller-response.md) defines server seller ownership, scope, publication, allocation and response idempotency; source tests pass and the corrected canonical quantity-one Seller response plus Buyer comparison card are browser-proven for the bounded fixture. [`v2-root-seller-bearer-simulation-options.md`](./v2-root-seller-bearer-simulation-options.md) and `scripts/prove-v2-live-seller.mjs` still define the isolated branch/Preview runner with guarded external secret injection, branch-local sign-in/sign-up and in-memory bearer use; [`v2-root-live-seller-runner-evidence.md`](./v2-root-live-seller-runner-evidence.md) records the READY code deployment and expected preflight block; server-issued QR, concurrency, camera recovery and broader production proof remain open |
| SEC-001 | Rotate persistent-V2 credential, update Vercel binding and preserve secret hygiene | ROOT-001, ROOT-003 | `manual` | [`v2-root-credential-rotation-evidence.md`](./v2-root-credential-rotation-evidence.md) records the initial exposure boundary, the user-performed follow-up rotation/redeployment, latest READY production metadata, aggregate/public/protected smoke checks and the rule that no credential value is recorded; provider action is accepted as manual evidence |

## 5. Buyer Trunk

| Task ID | Task | Dependencies | Status | Gate evidence |
|---|---|---|---|---|
| TRUNK-MAP | Build persistent MapLibre globe/map arrival and camera ownership | ROOTS | `partial` | Canvas, motion and location proof |
| TRUNK-SEARCH | Build one search pill/dock and one Options disclosure | TRUNK-MAP | `partial` | Submit parity and context proof |
| TRUNK-DISCOVERY | Connect bounded source-backed discovery, pins/clusters and results | TRUNK-SEARCH | `partial` | Bounds/source/error proof |
| TRUNK-FACILITY | Build public facility detail and result restoration | TRUNK-DISCOVERY | `partial` | Privacy and back/close proof |
| TRUNK-CATALOGUE | Build facility-scoped catalogue and typed product selection | TRUNK-FACILITY | `verified` | Product/no-reservation proof |
| TRUNK-AVAILABILITY | Build Product → Scope → Constraints → Responses | TRUNK-CATALOGUE | `verified` | Auth, scope, freshness and response proof |
| TRUNK-COMPARISON | Build comparison with eligible-response lock | TRUNK-AVAILABILITY | `verified` | Canonical J5 resume and Buyer response-stage proof show one real `Disponible` / `Actualisée` card with facility, product, quantity, price, receipt time and intention lock; broader Heartwood/Canopy gates remain open |

## 6. Heartwood

| Task ID | Task | Dependencies | Status | Gate evidence |
|---|---|---|---|---|
| HEART-001 | Add complete async, empty, locked, error, retry, cancel and success states | TRUNK | `partial` | [`v2-buyer-trunk-heartwood-evidence.md`](./v2-buyer-trunk-heartwood-evidence.md) records implemented states; forced error/cancellation coverage remains |
| HEART-002 | Prove Auth cancellation/error and exact context restoration | TRUNK | `partial` | Official Auth return is proven; cancellation/interrupted return remains manual |
| HEART-003 | Prove duplicate/concurrent requests and no reservation | TRUNK | `partial` | No-reservation boundary and request-shape idempotency are implemented; concurrency proof remains |
| HEART-004 | Prove back, close, refresh, interrupted session and stale-response recovery | TRUNK | `partial` | Stale-detail guard, step-back code and server-backed J5 `Mes demandes` resume seam landed; canonical refresh/resume proof remains open |
| HEART-005 | Certify focus, keyboard, touch, safe areas and reduced motion | TRUNK | `partial` | Accessible names/live regions and responsive CSS exist; canonical resume sheet added, four-width/manual pass remains |
| HEART-006 | Run adversarial false-state, permission and privacy review | HEART-001–005 | `todo` | Rejection report resolved |

## 7. Branches

### 7.1 Branch A — Trust and facility verification

| Task ID | Task | Dependencies | Status |
|---|---|---|---|
| TRUST-001 | Educate seller and start/resume facility verification | HEARTWOOD | `todo` |
| TRUST-002 | Select unclaimed facility without changing status | TRUST-001 | `todo` |
| TRUST-003 | Create new facility verification request | TRUST-001 | `todo` |
| TRUST-004 | Capture identity, company/facility, product and location evidence | TRUST-002/003 | `todo` |
| TRUST-005 | Persist/edit/cancel/resume evidence and submit idempotently | TRUST-004 | `todo` |
| TRUST-006 | Provide manual admin review queue and audited outcome | TRUST-005 | `manual` |
| TRUST-007 | Transition certified → unconfirmed and invite optional channels | TRUST-006 | `todo` |
| TRUST-008 | Count three qualifying sales and create confirmed exactly once | TRUST-007, BRANCH-E | `todo` |
| TRUST-009 | Lock and unlock facility-scoped $20 platform credit | TRUST-008, BRANCH-C | `todo` |
| TRUST-010 | Prove rejection reason, resubmission and Pro/trust separation | TRUST-006 | `todo` |

### 7.2 Branch B — Seller map-first operations

| Task ID | Task | Dependencies | Status |
|---|---|---|---|
| SELL-001 | Seller map-first workspace and owned facility context | BRANCH-A, TRUNK | `partial` | [`v2-seller-mini-cycle.md`](./v2-seller-mini-cycle.md); map-mounted Species-aligned workspace is deployed, the explicitly approved demo rebind is guarded, official seller proof remains open |
| SELL-002 | Facility open/closed, hours and discovery mode | SELL-001 | `todo` |
| SELL-003 | Demand queue and manual availability response | SELL-001, TRUNK | `verified` | Protected queue read, guarded demo rebind and Species-aligned response form are deployed; canonical browser proof shows one fresh `Sans réponse` request answered once as Disponible, quantity 1, 15.00, then read-only Seller acknowledgement and Buyer comparison refresh; concurrency, recovery, Canopy and broader onboarding remain open |
| SELL-004 | Automatic response correction, audit and buyer notification | SELL-003 | `todo` |
| SELL-005 | Product draft/create/edit/publish/sold-out lifecycle | SELL-001, BRANCH-A | `todo` |
| SELL-006 | Omni stock allocation server constraint | SELL-005 | `todo` |
| SELL-007 | Guided coupon creation, eligibility and limits | SELL-005 | `todo` |
| SELL-008 | Coupon outcome snapshot and honest offer state | SELL-007, BRANCH-D | `todo` |
| SELL-009 | Real scanner entry with no dead seller actions | SELL-001, BRANCH-D | `todo` |

### 7.3 Branch C — Wallet and entitlements

| Task ID | Task | Dependencies | Status |
|---|---|---|---|
| WAL-001 | One Omni Wallet surface and explanatory copy | ROOTS | `todo` |
| WAL-002 | FedaPay recharge-only boundary | WAL-001 | `todo` |
| WAL-003 | Pending/confirmed/failed/cancelled/expired recharge states | WAL-002 | `todo` |
| WAL-004 | Append-only ledger, derived balance and reconciliation | WAL-003 | `todo` |
| WAL-005 | Facility Slot spend and account capacity | WAL-004 | `todo` |
| WAL-006 | Facility Pro activation/expiry and limits | WAL-004, BRANCH-A | `todo` |
| WAL-007 | Platform spend and insufficient/restricted recovery | WAL-004 | `todo` |
| WAL-008 | Non-withdrawable facility bonus unlock | WAL-004, BRANCH-A | `todo` |
| WAL-009 | No payout/withdrawal/buyer-seller transfer negative proof | WAL-001 | `todo` |

### 7.4 Branch D — Intent and transaction room

| Task ID | Task | Dependencies | Status |
|---|---|---|---|
| TXN-001 | Eligible-response intent CTA | HEARTWOOD | `todo` |
| TXN-002 | Idempotent/concurrency-safe intent creation | TXN-001, ROOTS | `todo` |
| TXN-003 | Immutable product/facility/price/coupon snapshot | TXN-002 | `todo` |
| TXN-004 | Private contact/itinerary unlock | TXN-003 | `todo` |
| TXN-005 | One authorized transaction room and named timeline | TXN-003 | `todo` |
| TXN-006 | Actor-specific next action and transaction-scoped chat | TXN-005 | `todo` |
| TXN-007 | System messages and resume bar/deep link | TXN-005 | `todo` |
| TXN-008 | Expiry, unavailable, refresh and recovery | TXN-002 | `todo` |

### 7.5 Branch E — QR, payment declaration and fulfilment

| Task ID | Task | Dependencies | Status |
|---|---|---|---|
| QR-001 | Transaction-bound buyer QR and expiry | BRANCH-D | `todo` |
| QR-002 | Replay-safe server verification | QR-001 | `todo` |
| QR-003 | Scanner-ready screen before camera permission | SELL-009, QR-001 | `todo` |
| QR-004 | Secure-origin camera CTA and visible live preview | QR-003 | `todo` |
| QR-005 | Detection, stream lifecycle and manual fallback | QR-004 | `todo` |
| QR-006 | Expired/replayed/mismatch/malformed recovery | QR-002, QR-005 | `todo` |
| PAY-001 | External method selection and buyer declaration | BRANCH-D | `todo` |
| PAY-002 | Seller confirmation/rejection/dispute | PAY-001 | `todo` |
| FUL-001 | Pickup/delivery fulfilment and buyer receipt | PAY-002 | `todo` |
| FUL-002 | Rating and transaction close | FUL-001 | `todo` |

### 7.6 Branch F — Resume, notifications and PWA

| Task ID | Task | Dependencies | Status |
|---|---|---|---|
| SYS-001 | Manifest, icons and PWA install metadata | HEARTWOOD | `todo` |
| SYS-002 | Service-worker and public/private network policy | SYS-001 | `todo` |
| SYS-003 | Auth restoration and safe sign-out | ROOTS, HEARTWOOD | `todo` |
| SYS-004 | Transactional notifications and deep links | BRANCH-D/E | `todo` |
| SYS-005 | Mobile viewport, safe areas, focus and relaunch restoration | SYS-001 | `todo` |

### 7.7 Branch G — Admin, analytics and operations

| Task ID | Task | Dependencies | Status |
|---|---|---|---|
| OPS-001 | Admin evidence queue and audit history | BRANCH-A | `manual` |
| OPS-002 | Bounded source-import recovery and operator runbook | ROOTS, TRUNK | `manual` |
| OPS-003 | Consent-aware event schema and retention | ROOTS | `todo` |
| OPS-004 | Discovery/search/catalogue/availability funnel | OPS-003, TRUNK | `todo` |
| OPS-005 | Transaction/QR/fulfilment and rating metrics | OPS-003, BRANCH-D/E | `todo` |
| OPS-006 | Seller activation and three-sale metrics | OPS-003, BRANCH-A/B | `todo` |
| OPS-007 | Wallet/trust/integrity and recovery metrics | OPS-003, BRANCH-A/C | `todo` |
| OPS-008 | Error, latency, availability and log-redaction observability | OPS-003 | `todo` |
| OPS-009 | Manual runbooks and support context | BRANCH-A/G | `manual` |

## 8. Canopy and Rings

| Task ID | Task | Dependencies | Status |
|---|---|---|---|
| CANOPY-001 | Reconcile all surfaces against Species blueprint | Required branches | `todo` |
| CANOPY-002 | Four-width responsive and safe-area certification | Required branches | `todo` |
| CANOPY-003 | Accessibility, keyboard, focus and reduced-motion certification | Required branches | `todo` |
| CANOPY-004 | Map, API, database, cache and bundle performance audit | Required branches | `todo` |
| CANOPY-005 | Dead-action, false-state, privacy and client-boundary audit | Required branches | `todo` |
| RING-001 | Buyer release gate | CANOPY | `todo` |
| RING-002 | Seller/trust release gate | CANOPY | `todo` |
| RING-003 | Wallet/money release gate | CANOPY | `todo` |
| RING-004 | Transaction/QR/recovery release gate | CANOPY | `todo` |
| RING-005 | Operations, rollback and acceptance record | CANOPY | `todo` |

## 9. Backlog gate

A task may move to `ready` only when its parent contract and dependencies are clear. It may move to `in_progress` only when its Seed/Species/Root work is complete at the required depth. It may move to `verified` only when proof artifacts exist. It may move to `done` only when its parent Nature Way gate is accepted.

The first execution batch is `SEED-001` through `ROOT-011`, followed by the buyer Trunk. Root evidence currently includes 12 local test files/75 tests, ten Vercel functions, the recorded disposable-branch database behavior checks, one bounded live Auth/availability idempotency proof on production/default and one corrected proof on persistent V2, plus the bounded demo seller transaction fixture, manual credential-rotation record, blocked demo-Auth-recreation decision and session-simulation decision. No new seller, wallet, transaction or QR UI implementation should begin while the Root gate remains in review.
