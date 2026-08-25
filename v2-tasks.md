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
| SPECIES-005 | Approve map-only bottom dock, separated result dock, focused submit dock and upward Options surface | SPECIES-003 | `verified` | Public responsive no-overlap proof plus authenticated Buyer loading/result sheet with separated dock geometry; broader matrix remains |
| SPECIES-006 | Approve J5-owned account navigation and role-aware intermediate surface | SPECIES-003 | `verified` | Authenticated J5 menu, Seller, Reviewer/Admin and Inbox read-only surfaces opened without mutation; active-role proof remains manual |
| SPECIES-007 | Approve guest Account, authenticated Account and context Resume surfaces | SPECIES-003 | `verified` | Guest Auth boundary and authenticated J5/context return proof; full resume/focus matrix remains |
| SPECIES-008 | Approve comparison and intent-review surfaces with contact/itinerary locked | SPECIES-003 | `review` | Response comparison, coupon snapshot and locked-state proof |
| SPECIES-009 | Approve intent-created and contact/itinerary-unlocked surfaces | SPECIES-008 | `review` | Server-confirmed intent boundary and permitted contact actions |
| SPECIES-010 | Approve transaction room, QR, external payment, fulfilment and rating surfaces | SPECIES-009 | `review` | Timeline, QR/payment and completion/recovery maquette |
| SPECIES-011 | Approve idle globe and local fullscreen map states | SPECIES-001 | `verified` | Public and authenticated map-mounted proof shows contained globe/canvas, interruptible idle behavior and enabled zoom; local fullscreen/recovery remains |
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
| ROOT-008 | Define private media/evidence storage boundary | ROOT-003 | `partial` | Shared evidence contract and Vercel Blob private adapter enforce claimant token authorization, path binding, MIME/10 MB limits, provider metadata verification and authenticated no-store reads. Owner-authorized draft proof now shows the production runtime recognizes private storage as available; actual upload/download, retention and access-control proof remain open |
| ROOT-009 | Preserve Auth identities and legacy records during additive migration | ROOT-003 | `partial` | Migration 003 executed on the former disposable branch with 2 constraints, 7 triggers and QR function; migration 005 was explicitly applied to persistent V2 using only additive column/index objects; read-only Auth/schema/public-row coexistence and exact fixture inventory remain recorded; preserved-row rollback/recovery and production/default decision remain required |
| ROOT-010 | Build labelled fixture factory across actors and failure states | ROOT-004, ROOT-005 | `partial` | [`v2-root-fixture-ledger.md`](./v2-root-fixture-ledger.md) inventories persistent public, canonical smoke and disposable Root-proof records with non-claim rules; reusable factory and fixture-change discipline remain |
| ROOT-011 | Define analytics schema, consent and retention boundary | ROOT-006 | `todo` | Privacy/schema review |
| ROOT-012 | Define map context, pin/cluster, route authorization and camera recovery boundary | ROOT-001, ROOT-004 | `review` | MapContextSnapshot restoration, public-marker semantics and protected-route policy tests pass; live route/provider and browser recovery remain open |
| ROOT-013 | Complete seller availability response and server-issued QR seams | ROOT-004, ROOT-005, ROOT-006 | `partial` | [`v2-root-seller-response.md`](./v2-root-seller-response.md) defines server seller ownership, scope, publication, allocation and response idempotency; source tests pass and the corrected canonical quantity-one Seller response plus Buyer comparison card are browser-proven for the bounded fixture. [`v2-root-seller-bearer-simulation-options.md`](./v2-root-seller-bearer-simulation-options.md) and `scripts/prove-v2-live-seller.mjs` still define the isolated branch/Preview runner with guarded external secret injection, branch-local sign-in/sign-up and in-memory bearer use; [`v2-root-live-seller-runner-evidence.md`](./v2-root-live-seller-runner-evidence.md) records the READY code deployment and expected preflight block; server-issued QR, concurrency, camera recovery and broader production proof remain open |
| SEC-001 | Rotate persistent-V2 credential, update Vercel binding and preserve secret hygiene | ROOT-001, ROOT-003 | `manual` | [`v2-root-credential-rotation-evidence.md`](./v2-root-credential-rotation-evidence.md) records the initial exposure boundary, the user-performed follow-up rotation/redeployment, latest READY production metadata, aggregate/public/protected smoke checks and the rule that no credential value is recorded; provider action is accepted as manual evidence |

## 5. Buyer Trunk

| Task ID | Task | Dependencies | Status | Gate evidence |
|---|---|---|---|---|
| TRUNK-MAP | Build persistent MapLibre globe/map arrival and camera ownership | ROOTS | `verified` | Canonical proof plus public `390×844` and authenticated wide proof: persistent MapLibre canvas/globe, idle rotation, hover pause/resume path, manual zoom, public pin continuity and no continuous rotation-fetch loop; real location success, remote raster reliability and recovery remain |
| TRUNK-SEARCH | Build one search pill/dock and one Options disclosure | TRUNK-MAP | `verified` | Authenticated canonical proof shows query-aware loading → `nearby-state-ready` for `Marche de Hanoukope` through a query-only global request, followed by bounded reveal/result framing; anonymous Auth boundary, manual zoom and separated dock/sheet are also proven. Empty/error/recovery, keyboard and full context-motion proof remain |
| TRUNK-DISCOVERY | Connect bounded source-backed discovery, pins/clusters and results | TRUNK-SEARCH | `partial` | Canonical public cluster/pin proof plus authenticated one-result global text search; broader bounds, empty/error/recovery, facility focus and trust-state coverage remains |
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
| HEART-005 | Certify focus, keyboard, touch, safe areas and reduced motion | TRUNK | `partial` | Accessible names/live regions, named map controls, one visible focus proof, public compact normal/reduced-motion geometry and zoom pass; authenticated compact traversal, real permission and four-width/manual pass remain |
| HEART-006 | Run adversarial false-state, permission and privacy review | HEART-001–005 | `todo` | Rejection report resolved |

## 7. Branches

### 7.1 Branch A — Trust and facility verification

| Task ID | Task | Dependencies | Status |
|---|---|---|---|
| TRUST-001 | Educate seller and start/resume facility verification | HEARTWOOD | `todo` |
| TRUST-002 | Select unclaimed facility without changing status | TRUST-001 | `todo` |
| TRUST-003 | Create new facility verification request | TRUST-001 | `todo` |
| TRUST-004 | Capture identity, company/facility, product and location evidence | TRUST-002/003 | `partial` | J5 sheet has six typed upload categories, progress/error/removal states and private-only copy; production storage availability is browser-proven through an owner-authorized empty draft, while real file capture awaits a trusted claimant and separate upload authorization |
| TRUST-005 | Persist/edit/cancel/resume evidence and submit idempotently | TRUST-004 | `partial` | Versioned draft, claimant-owned pre-review cancel, direct private upload, provider object verification and multiplexed submit route exist; draft opening, typed evidence sheet and immediate cancel are live-proven, while real upload, resume/idempotency and live submit proof await a trusted claimant session and explicit evidence authorization |
| TRUST-006 | Provide manual admin review queue and audited outcome | TRUST-005 | `partial / manual` | Reviewer queue requires verified private evidence, records facility history, queues in-app delivery and maps certified→unconfirmed; active reviewer role, authenticated evidence read and real decision remain open |
| TRUST-007 | Transition certified → unconfirmed and invite optional channels | TRUST-006 | `partial` | Server mapping is corrected to Free `unconfirmed`; three-sale confirmation, catalogue lifecycle and optional PWA channel remain open |
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
| CANOPY-001 | Reconcile all surfaces against Species blueprint | Required branches | `partial` | Buyer map-first structure now inherits the V4.2 Africa-globe white-field/black-ocean/light-land direction, neutral source-backed density marks, native free camera ownership with retained idle resume, bounded search reveal and explicit result toolbar; deployment `dpl_8UondDSFQHjPKmdu8dY1GZajpV2a` confirms the arrival/result shell, while the final high-zoom canvas reproduced blank and the full authenticated compact matrix remains open |
| CANOPY-002 | Four-width responsive and safe-area certification | Required branches | `partial` | Final production proofs pass `390×844` normal/reduced-motion canvas, dock containment, controls, zoom and no horizontal overflow; authenticated desktop `1024×880` measures a 717px bounded sheet, 553px dock and 14px gap with no overflow; authenticated compact result-sheet and full Seller/Reviewer width matrix remain open |
| CANOPY-003 | Accessibility, keyboard, focus and reduced-motion certification | Required branches | `partial` | V4.1 preserves native accessible pin fallback and named `Zoom arrière`/`Zoom avant`/`Utiliser ma localisation` controls, replaces the visible approximate-zone band with a screen-reader-only status, and adds globe-axis unit coverage; full Tab/Shift+Tab, touch, authenticated compact traversal and screen-reader review remain |
| CANOPY-004 | Map, API, database, cache and bundle performance audit | Required branches | `partial` | V4.2 source validation passes 122 tests across 18 files, build bundling exactly 12 Vercel functions and clean client boundary; canonical arrival is visible, but high-zoom vector street/boundary loading is not proven and the remote-tile/performance/recovery review remains open |
| CANOPY-005 | Dead-action, false-state, privacy and client-boundary audit | Required branches | `partial` | Rings remain density-only, pins remain public presence only, denied/timeout location stays honest, synthetic granted location is explicitly bounded, same-query re-entry and result refine/exit actions are real, the canonical query remained read-only, and multi-product remains a planning note only; blank final reveal, native-pin movement and the full negative-state/facility-focus sweep remain open |
| RING-001 | Buyer release gate | CANOPY | `todo` |
| RING-002 | Seller/trust release gate | CANOPY | `todo` |
| RING-003 | Wallet/money release gate | CANOPY | `todo` |
| RING-004 | Transaction/QR/recovery release gate | CANOPY | `todo` |
| RING-005 | Operations, rollback and acceptance record | CANOPY | `todo` |

## 9. Species/Canopy audit checkpoint — 2026-08-23

The live `48bf064` audit closed the immediate public map-pin visibility blocker without changing the approved Species: the canonical MapLibre canvas now visibly exposes a public cluster and accessible facility pins in fallback mode, supports cluster expansion and facility context selection, and preserves the separate dock/sheet geometry. Buyer structural measurements pass at 320×760, 375×812, 768×900 and 1280×900 with no horizontal overflow or measured overlaps. The authenticated Seller surface remains map-mounted, scoped to `Demandes / Catalogue`, and its read-only request detail now returns to the Seller queue on Escape.

The checkpoint is intentionally **partial**. Seller four-width capture, full keyboard/focus/reduced-motion/location/recovery/concurrency coverage, remote tile reliability, performance, broader onboarding and every post-verification branch are not proven. Global Root remains `review`; no Ring is closed and no production-readiness claim is made.

## 10. Backlog gate

A task may move to `ready` only when its parent contract and dependencies are clear. It may move to `in_progress` only when its Seed/Species/Root work is complete at the required depth. It may move to `verified` only when proof artifacts exist. It may move to `done` only when its parent Nature Way gate is accepted.

The first execution batch is `SEED-001` through `ROOT-011`, followed by the buyer Trunk. Root/Trunk evidence currently includes 13 local test files/90 tests, exactly 12 Vercel functions, the recorded disposable-branch database behavior checks, one bounded live Auth/availability idempotency proof on production/default and one corrected proof on persistent V2, plus the bounded demo seller transaction fixture, manual credential-rotation record, blocked demo-Auth-recreation decision and session-simulation decision. No new seller, wallet, transaction or QR UI implementation should begin while the Root gate remains in review.


## 11. 2026-08-24 — Final dock/globe Species checkpoint

The dock/grid branch is now **implemented and browser-proven for the Buyer surface** on the canonical production deployment published through the configured Manus Vercel connector. The dock band is derived from the real nearby-sheet geometry; the facility sheet is repliable; Options is anchored outside the dock flow and protected on short mobile screens. The final audit covered 320×760, 375×812, 768×900, 1280×900, 1731×818 and 375×620 with three public cards on each viewport, 8px mobile / 14px desktop dock-to-sheet gaps, no dock/sheet/rail/card overlap, no Options/control overlap and no horizontal overflow.

The globe behavior branch is **partially proven**: MapLibre canvas, public cluster/pin visibility, zoom-in/zoom-out, normal idle globe rotation, reduced-motion pause, honest fallback status and denied-location retry are observed. Exact and approximate successful location outcomes, full camera-priority interruption coverage and remote raster reliability remain open.

Seller remains **partial**: the authenticated map-mounted queue, two tabs, existing-response read-only state and Escape-to-queue recovery are proven at 1024×880 only. Seller all-width capture and full focus/keyboard/recovery coverage remain open. No new Buyer request, Seller response, Auth modification or persistent write was made in this audit.

Global Root remains `review`. `CANOPY-001` through `CANOPY-005` remain `partial`; `RING-001` through `RING-005` remain `todo`. Production readiness is not claimed. Next gate: complete authenticated Seller responsive/focus evidence and the remaining location, concurrency, interrupted-session, remote-map and broader Canopy/Ring proofs.

## 12. 2026-08-24 — Contextual nearby / contained globe checkpoint

Commit `d3a550f` is the current local source and canonical READY deployment `dpl_8ZsUTb7Gv1ckgzNh5QirUbfe7MN2`. The six-viewport Playwright audit confirms that the Buyer idle is map-only: no nearby sheet is mounted, the compact dock and visible submit action remain present, the map stage/canvas fill the viewport, there is no horizontal overflow or measured idle collision, and zoom in/out returns to the global frame. The anonymous path opens official Auth on submit rather than presenting a fabricated discovery result.

The authenticated Browser Sandbox proof at approximately `1024×880` confirms that `Proche de vous` appears only after `Rechercher`, that the loading surface is compact (`163.3px`) with a `14px` dock-to-sheet gap and no measured overlap, and that `Replier les facilités proches` unmounts the sheet and restores true idle. The run remained loading, so successful catalogue-result settlement is not claimed. No Buyer/Seller/Auth mutation or persistent write was made.

This is a **partial/verified checkpoint for the focused Species/Canopy layout slice**, not a closed Buyer Heartwood, Canopy or Ring. Seller all-width and focus certification, exact/approximate location success, concurrency/interrupted-session recovery, remote tile reliability, complete result-card reveal, onboarding/trust, QR/payment/transaction and release acceptance remain open.


## 12. 2026-08-24 — Ring A runtime alignment, reviewer and inbox checkpoint

The field-pilot Root migration was first applied to the default Neon branch, but Vercel runtime diagnostics identified that production uses the persistent V2 branch `omni-v2-rebuild`. The same additive foundations were therefore verified on an exact disposable fork of that persistent branch and then applied to the persistent runtime branch. Post-application aggregate checks pass with five Root tables present, public facility ownership nullable until a reviewed claim, the one-active-claim guard present, and existing counts unchanged at three V2 accounts and four V2 facilities. The earlier production `42P01` schema error is resolved; runtime now returns the intended role boundary instead of a generic service error.

The Trunk slice now includes a J5-owned `Inbox Omni`, a reviewer queue and an auditable review action. Any active reviewer can see submitted claims and decide `certified`, `rejected` or `needs_more_evidence` with a bounded reason; certification is server-authoritative, claimant clicks never certify, and the claimant receives a deduplicated in-app notification event. The current authenticated Browser Sandbox session has no `operator` or `reviewer` role, so the canonical deployment truthfully renders both surfaces locked and performs no import or review mutation. The browser proof also confirms the MapLibre globe remains mounted behind the contextual sheets and the J5 menu remains the sole owner of these surfaces.

This checkpoint advances `TRUST-006`, `OPS-001` and `BRANCH-F- inbox foundation` from `todo` to `partial/review`; it does not close Branch A, Branch F, Root, Canopy or any release Ring. Actual team-role assignment, evidence capture/storage, reviewer decision with an authorized team member, PWA permission/service worker, OSM source refresh/import runs, catalogue publication, availability, transaction, QR, payment and fulfilment remain open. Global Root remains `review`, and production readiness is not claimed.

## 13. 2026-08-25 — Canopy V4.1 monochrome and map-only motion checkpoint

The owner clarified the target as the existing white/black/gray map: white map field/background, near-black ocean, light land, charcoal/gray boundaries, neutral roads/labels and no green/sepia wash or decorative selection halo. V4.1 also narrows idle rotation ownership to direct map interaction and explicit map controls, adds a deterministic vertical-axis globe drag helper with zero pitch and no primary bearing drift, keeps minus/plus/recenter visible together, removes the visual approximate-zone banner, and preserves passive non-recentering arrival location.

The contract, Species blueprint, maquette, TrunkMap, fallback style, stylesheet and globe-axis unit tests were updated. Current task truth is `partial / validation required`: full test/build/boundary validation, canonical monochrome screenshots, touch/axis proof, real location proof, native pin movement inspection, full responsive/accessibility proof and GitHub/Vercel deployment evidence remain open. `CANOPY-001` through `CANOPY-005` remain `partial`; `RING-001` through `RING-005` remain `todo`; multi-product availability remains `blocked / Root/API decision required`; Global Root remains `review`.


## 13. 2026-08-24 — Claim Heartwood evidence/storage checkpoint

Deployment `dpl_3bWyJ4ArKKYmAfXBwi6JxHRwBxxw` is `READY` with the canonical aliases and exactly 12 Node.js functions. The field-pilot code now includes versioned draft resume shape, claimant-owned pre-review cancellation, typed evidence validation, a multiplexed claim-submit route, reviewer evidence count/category summary, facility status history, deduplicated in-app delivery creation and the corrected `certified → unconfirmed` mapping. The compact logo was shipped only to keep the manual Vercel payload below the connector’s 4 MB limit; the original local asset remains outside the payload.

The active gate is **ROOT-008 / TRUST-004/005**: configure and prove private object storage and the upload/access-control contract. Until then, valid evidence submission returns `EVIDENCE_STORAGE_UNAVAILABLE`, the claim remains a draft, the UI keeps submit disabled and no reviewer happy path can be legitimately exercised. The Browser Sandbox session still lacks active `operator` and `reviewer` roles, so no role grant or persistent pilot mutation was made. Global Root remains `review`; no Ring or production-readiness claim is closed.


## 14. 2026-08-24 — GitHub-linked deployment and storage-status checkpoint

The validated UUID boundary correction was pushed to `am-n-ra/lome-local-connect` on `omni-v2-rebuild`, the branch used for the Vercel-linked release path. The canonical alias then served the corrected claim route: the bounded public `Marche de Hanoukope` fixture opened a real version-1 draft instead of returning `Choose a valid facility`. The canonical response was `HTTP 200` from Vercel with a cache miss; the Vercel connector was unavailable for direct deployment-ID polling during this window, so no exact GitHub-triggered deployment ID is asserted.

With explicit owner authorization, one empty draft was opened, the J5 sheet displayed six typed private-evidence categories and the storage-ready `Preuves privées, statut séparé` state, and the draft was immediately cancelled. No file was selected or uploaded, no claim was submitted, and the public facility returned to `unclaimed`. ROOT-008 and TRUST-004/005 therefore advance from storage-unavailable wording to `partial`, not `verified`; actual private upload/download, evidence metadata verification, active claimant/reviewer roles, submitted review, Inbox delivery, OSM import and production readiness remain open. Global Root remains `review`.

## 15. 2026-08-24 — Bounded private upload and submitted-claim checkpoint

The first live upload attempt exposed a Vercel Blob response-shape defect. Commit `cfbd3da` corrected the direct provider callback response and was deployed from GitHub as READY deployment `dpl_HCr8LaWg3n1LJFycmTYE7qRdSGUP`. Commit `973b6bc` then normalized internal `verification_draft` to public `unclaimed` semantics so an existing claimant draft could be resumed after reload; its GitHub-triggered Vercel deployment `dpl_82TxYc43dCHQAEV29CKwbHXDLKVr` reached READY with exactly 12 Node.js functions.

On the refreshed canonical deployment, the existing `Marche de Hanoukope` draft was resumed, the single attached non-sensitive manga screenshot was uploaded under the typed `identity` category, and the UI confirmed one private file. After point-of-action confirmation, the claim was submitted. Aggregate verification on persistent Neon branch `br-dawn-hill-am5amy22` recorded one submitted request, one private evidence object and facility state `verification_submitted`, confirming that server-side private object verification passed before persistence.

## 16. 2026-08-24 — Species authenticated read-only proof checkpoint

Commit `6e9c335` is deployed through the GitHub-linked Vercel path as READY deployment `dpl_B1HfPNbXJaiyq4WEtj7JNWyQW3xD`, with exactly 12 Node functions and the canonical production alias. The authenticated Buyer replay at the available 891×765 Sandbox viewport showed the query-aware loading state followed by `nearby-state-ready` and the accessible `Ouvrir Marche de Hanoukope` result. The client now uses a stable query-only global request for text search; the public endpoint independently returned HTTP 200 with one safe public-name match. Map/canvas, public pin, zoom control, J5 owner and separated result surface remained present.

The same read-only session opened Seller with `Contexte vendeur autorisé`, two request rows, `Catalogue` and `Handoff encore verrouillé`; Reviewer/Admin with `Rôle reviewer non ouvert` and no decision inputs; and Inbox Omni with `Inbox vide`, `Actualiser` and the explicit Inbox-before-PWA boundary. The MapLibre canvas and public pin remained behind each contextual surface. This verifies bounded authenticated visual states only. Compact-width authenticated matrix, Buyer empty/error/recovery/facility-focus, full keyboard/focus, remote tile reliability, active role bootstrap and all operational branches remain open. No role, claim, notification, seller response or other business mutation was performed; the submitted private test claim and historical rows were preserved. Global Root remains `review` and no release Ring is closed.

No reviewer role was active, so reviewer event and in-app delivery counts were zero. No role grant, reviewer decision, private reviewer GET/read, OSM import or other unrelated pilot mutation occurred. This closes the bounded claimant upload → provider verification → submitted-claim proof, but `TRUST-006`, role bootstrap, reviewer read/decision, notification delivery, retention/reconciliation and all global Canopy/Ring acceptance remain open. The submitted test claim is auditable test data, not certification, ownership or marketplace proof; Global Root remains `review` and production readiness is not claimed.


## 16. 2026-08-24 — Founder HQ Species re-entry and map/search stabilization

The owner reported that the current Species still felt incomplete: the MapLibre map appeared to blink, zoom was unreliable, search lacked a connected intermediate transition, and the lower grid could remain in a searching state. Seller and Reviewer/Admin were also visually incomplete. Founder HQ therefore routed work back to the Nature Way Species gate instead of advancing role bootstrap, OSM or pilot breadth.

A read-only comparison against `origin/main` identified the likely V2 failure boundary: timer-driven `easeTo` idle rotation generated `moveend`, which emitted bounds and re-entered the public-facility loading effect; V2 also painted both MapLibre facility layers and projected HTML pins. The correction in commit `2c63cda` uses interruptible requestAnimationFrame rotation, keeps idle motion from emitting data-query bounds, and makes the projected accessible overlay the sole visible pin renderer while retaining the provider-backed source semantics.

The same checkpoint makes search state transitions query-aware and explicit (`loading`, `ready`, `empty`, `error`) with an honest state remount/animation that respects reduced motion. Seller and Reviewer/Admin received nested mini-Species documentation and a shared visual hierarchy; Reviewer gained a clear validation-workspace summary without changing its permission contract.

A public-only canonical Playwright proof at 390×844 observed active rotation, enabled controls, zoom `1.35 → 2.35`, a map that stayed mounted through the guest Auth boundary and no repeated facility-fetch cadence during idle rotation. The run recorded two initial settling requests and one explicit post-zoom request, not a continuous rotation loop. This is a bounded map/public proof, not Species acceptance: authenticated result-ready/empty/error search settlement, full Buyer state coverage, Seller all-width/focus proof, Reviewer authorized proof, exact location success, remote tile reliability and broader Canopy/Ring evidence remain open. Global Root remains `review`; production readiness is not claimed.


## 12. 2026-08-24 — Canopy globe/search reveal checkpoint

The Canopy implementation added `src/trunk/map-reveal.ts`, its three-test contract, explicit camera ownership in `TrunkMap`, stable identical-query invalidation in `TrunkApp`, a soft-color map treatment, and a distinct user-position marker path. The canonical READY deployment for the current proof is Vercel `dpl_B46QuQiAxUWnqymZ5HPtdmBVNBMA`, commit `bc8e730`, with exactly 12 Node functions.

The authenticated Buyer proof at `1024×880` covers loading → ready, query-only global request, a visible bounded world/context/results reveal, final local framing, post-reveal Zoom avant, map/pin continuity, separated dock/sheet geometry and no continuous bounds request cadence. Public Playwright proof at `390×844` covers normal idle rotation, zoom, enabled named controls, full canvas, no horizontal overflow and contained guest dock; a companion reduced-motion run proves no automatic rotation with zoom and controls preserved. A bounded temporary geolocation stub proves the UI marker path only and does not represent real permission or real user coordinates.

The Canopy status remains **partial**. Authenticated compact result-sheet and Seller/Reviewer responsive proof, full keyboard traversal, real permission path, empty/error/retry/recovery, facility focus/back restoration, remote tile resilience, bundle-warning review and broader release certification remain open. Global Root remains `review`; no Ring is closed and no role, claim, notification, seller, wallet, transaction, QR, payment, OSM or PWA mutation was performed in this pass.


## 17. 2026-08-24 — Canopy V3 re-entry checkpoint

The owner’s Canopy re-entry is addressed as a focused Species amendment rather than operational expansion. The production implementation now has darker `deep-neutral` map treatment and clean geographic edges, concentric public-density rings, native MapLibre drag/pan/rotate/zoom with retained camera position, delayed idle resume from the released camera, one permission-aware arrival attempt with honest denied/timeout recovery, explicit result `Nouvelle recherche` / `Affiner` / `Retour à la carte` actions, and a wider desktop bottom composition without a side rail. The identical-query lifecycle defect discovered during proof was fixed by including the search revision token in the public-facility effects.

Source validation after the fix passed `116 tests / 16 files`, Vite build with exactly `12` bundled Vercel functions and `check:boundary`. Deployment `dpl_4h49A7jHsfgvddme6qwohw9VsC3x` is READY for commit `60403a3`; production proofs cover native center/bearing movement, retained idle resume, globe→mercator local zoom, repeated-query loading→ready, refine/new-search/return recovery, synthetic granted marker, honest denied/timeout state, desktop `1024×880` geometry and compact `390×844` normal/reduced-motion behavior.

`CANOPY-001` through `CANOPY-005` remain `partial`; `RING-001` through `RING-005` remain `todo`. Full keyboard/focus, authenticated compact Seller/Reviewer/facility recovery, remote-tile resilience and deeper performance remain open. Multi-product availability is explicitly **blocked pending a Root/API decision** because the current server contract is one product per request; no grouped selection, batch write, idempotency, expiry or response-ownership semantics were invented. Global Root remains `review`; no Ring or production-readiness claim is closed.


## 2026-08-24 — Canopy V4 re-entry checkpoint

Canopy V4 is now implemented and materially browser-proven on the canonical deployment `dpl_7gg9Rxv5mR9whTgUw42WHCVaMVaQ` for commit `6399b68`: the map switches automatically globe→mercator at zoom `2.4` and back on zoom-out; facility features are rendered by the MapLibre source/layers rather than the prior projected HTML overlay; mobile arrival does not recenter automatically; mobile text inputs are held at `16px`; the V4 palette uses a dark ocean, light land and stronger geographic edges; and closing result/facility context clears selected focus.

The wide production gesture proof passed free left-drag center change, right-button bearing change, retained camera position and idle resumption from the released camera. The result frame reached local-map zoom `12.80`, retained the explicit result actions and returned to map-only dock state without selected-facility mode. The compact proof passed canvas, 16px input sizing, zero visible `.map-pin` overlays and no horizontal overflow, but its reduced-motion one-click sequence did not independently cross the projection threshold; compact authenticated and touch proofs remain open.

| Task ID | V4 checkpoint update | Status after evidence |
|---|---|---|
| SPECIES-011 | Bidirectional projection, persistent MapLibre canvas, free globe gesture and retained idle resume are now materially proven on production; compact/touch/full recovery remain. | `verified / parent open` |
| SPECIES-012 | Discovery rings and native facility layers are implemented; visible dense-cluster, trust-state and moving-frame inspection remain. | `review` |
| SPECIES-013 | Closing result/facility context clears selected focus and returns to map-only dock; facility detail back/Escape and route recovery remain. | `review` |
| TRUNK-MAP | Globe/local-map threshold and no-reset camera ownership are proven; remote tile resilience, touch and full responsive certification remain. | `verified / parent open` |
| TRUNK-DISCOVERY | Native MapLibre source/layers replace the visible HTML overlay and query result reaches local-map zoom; dense/moving pin continuity and error/retry remain. | `partial` |
| HEART-004 | Explicit `Retour à la carte` clears the facility focus context; full facility-focus/back, refresh and interrupted-session proof remain. | `partial` |
| HEART-005 | Mobile 16px entry, compact geometry, named controls and no-overflow checks pass; authenticated compact, touch and full keyboard/focus matrix remain. | `partial` |

Multi-product availability remains `blocked / Root/API decision required`; no grouped selection, basket, batch request or mutation was added. Global Root remains `review`, and no release Ring is closed.


## 16. 2026-08-25 — Canopy V4.2 Africa-globe reference checkpoint

The owner confirmed the map reference as the existing Omni black-ocean/white-land globe with a white surrounding field and restrained charcoal/gray geographic boundaries. The green/sepia treatment, heavy dark selection highlight and permanent `Votre position` chip are excluded. The implementation keeps the existing source-backed MapLibre facility path and adds the reference-matched globe treatment without changing any business or Root/API contract.

| Task ID | V4.2 update | Status | Remaining evidence |
|---|---|---|---|
| CANOPY-001 | Species/Canopy map direction reconciled with the supplied Africa-globe reference; local settled screenshots at 390×844 and 1024×880 show black ocean, light land, white field, neutral marker and no location chip. | `partial` | Owner review plus canonical post-commit visual frame. |
| CANOPY-002 | Permanent minus/plus/recenter remain visible; compact control/error overlap is corrected; settled mobile and desktop geometry remains bounded. | `partial` | Authenticated compact and real-device safe-area matrix. |
| CANOPY-003 | Map-only rotation, vertical-axis drag, idle resume outside map, 16px inputs and screen-reader-only location status remain covered; reveal step contract updated. | `partial` | Device-native touch/input zoom and full keyboard/screen-reader traversal. |
| CANOPY-004 | The globe filter and provider comparison were audited. Liberty remains the visible release-safe path; Positron from `origin/main` was tested but direct-controller style loading did not reach loaded vector tiles and was not retained. | `partial` | Remote-tile reliability, local vector streets/boundaries after reveal and performance review. |
| CANOPY-005 | No heavy highlight, no permanent location chip, no visible HTML facility-pin overlay and no public-trust semantics were introduced. | `partial` | Real-result native pin movement, focus/back recovery and negative-state sweep. |
| RING-001 | V4.2 reference correction is materially advanced but parent Canopy/Species acceptance is not requested or granted. | `todo` | Complete residual evidence and Founder HQ gate decision. |

The search-reveal contract now protects the origin/main-inspired progression `world 1.05 → continent 2.15 → country 5.35 → region 8.25 → city/zone 11.25 → local result framing 14.2`, crossing the V4 globe/mercator threshold `2.4`. Source validation passes with 122 tests across 18 files, exact 12-function bundling and a clean client boundary. Local mobile/desktop proof assertions pass, and screenshots provide the first actual reference-matched map frames. The parent Species, Buyer Heartwood, Global Root and release Rings remain open; multi-product availability remains blocked behind Root/API.


## 17. 2026-08-25 — Canopy V4.3 vector-globe reference checkpoint

The owner’s latest reference text clarifies that the intended map is a **MapLibre-native Positron-style vector globe**: white outer field, dark ocean, light continents, fine contours, calm physical orbit, and progressive world → continent → country → region/city → local zoom. The reference’s heavy selected-region highlight and literal `Votre position` chip remain excluded. The new implementation must not silently substitute the synthetic raster fallback.

| Task ID | V4.3 update | Status | Remaining evidence / next action |
|---|---|---|---|
| CANOPY-001 | Trunk now uses Positron vector style with a Vite-managed same-origin MapLibre worker, and compact/desktop local frames visibly render the requested Africa-facing globe. | `partial` | Canonical deployment and owner review of the new visual reference. |
| CANOPY-002 | Provider readiness is truthful: `style.load` is not treated as active until the usable `load/idle` path; provider failure presents retry instead of `/omni-local-style.json`. | `verified / parent open` | Canonical failure/retry observation and production monitoring. |
| CANOPY-003 | Search reveal keeps `world 1.05 → continent 2.15 → country 5.35 → region 8.25 → city/zone 11.25 → results 14.2`; early stages use the authorized user context when available and final framing uses result context. | `partial` | Real canonical fixture reveal with visible local roads and source-backed pins. |
| CANOPY-004 | Positron layer palette is vector-native; the prior globe inversion and Liberty Natural Earth raster treatment are removed. Local compact and desktop motion proofs pass with no fallback request. | `partial` | Local streets/neighborhood readability and performance on the final reveal. |
| CANOPY-005 | Permanent minus/plus/recenter, map-only rotation ownership, vertical-axis drag, mobile 16px input and no visible location chip/band remain preserved. | `verified / parent open` | Authenticated compact/a11y matrix, real-device touch and full negative sweep. |
| CANOPY-006 | The attached text’s dynamic worldwide OSM/Overpass enrichment is recorded as a separate future operations/Root dependency; no global coverage or 4,067+ facility claim is made from this visual pass. | `deferred` | Reopen only after the OSM/importer Root gate is explicitly scheduled. |
| RING-001 | V4.3 is materially advanced but Species, Buyer Heartwood, Global Root and release Rings remain open. | `todo` | Deploy the implementation, run canonical read-only smoke, then decide the residual vector-detail gate. |

The exact next smallest action for the next ring is now the residual Species/Canopy proof: authenticated compact keyboard/focus and recovery, real-device touch/input/permission evidence, dense native-pin movement and remote-tile/performance observation. V4.3 itself is deployed and boundedly proven: commit `2cab2d8` reached READY deployment `dpl_62FQ6GnjqnTMbJsMpbW1cya6sa41`, canonical `Carte active` loaded the same-origin worker and Positron PBF/glyph resources, and safe query `Marche de Hanoukope` settled to visible Lome/Aflao streets, neighbourhoods, boundaries/coastline and an anchored native point. No availability, claim, Seller, Reviewer, transaction, payment, QR, PWA, OSM or multi-product action was permitted in this gate. `CANOPY-001` through `CANOPY-005` remain `partial`, `CANOPY-006` remains `deferred`, `RING-001` through `RING-005` remain `todo`, Global Root remains `review` and multi-product remains `blocked / Root/API decision required`.

## 2026-08-25 — Canopy motion blocker closed, residual tasks remain

**Status:** `partial / desktop Canopy blocker resolved; release Rings remain open`.

**Changed:** `TrunkMap.tsx` uses pointer event target ownership for overlay-aware map exit; `scripts/canopy-v4.1-local-desktop-proof.mjs` now exits through the real search input overlay. The full-screen canvas coordinate ambiguity is documented rather than hidden by weakening the assertion.

**Proven:** Local desktop and mobile responsive proofs pass; 127 tests in 19 files, build, client boundary, diff check and exactly 12 generated Vercel functions pass. Canonical deployment `dpl_GetKcB8WL2b4A8d8iauCRJ8SKSp1` for `6711151` is READY and the read-only drag/release/outside-overlay/resume smoke passes.

**Not proven:** Native-pin density/movement, real-device touch/input/permission, full keyboard/screen-reader proof, remote performance, full Species acceptance and operational readiness remain open. No business mutation was performed.

**Preserved:** Existing tasks and branch boundaries for Auth, claims, mono-product availability, Seller/Reviewer, OSM/Overpass, PWA/Web Push, payment, QR, transactions and multi-product were not expanded or deleted.

**Deployment:** GitHub branch `omni-v2-rebuild`, commit `6711151`, Vercel READY `dpl_GetKcB8WL2b4A8d8iauCRJ8SKSp1`, canonical alias present, 12 functions.

**Next gate:** Keep CANOPY tasks partial until dense native-pin motion and the residual device/a11y/performance matrix are linked. Keep Global Root `review`, release Rings open and multi-product `Root/API-blocked`.

## 2026-08-25 — Native movement evidence reconciliation

**Status:** `partial / CANOPY-005 native movement bounded-proven; CANOPY and release Rings remain open`.

**Changed:** No source task was added. Existing MapLibre native cluster/pin layers were verified through read-only camera moves; no second HTML pin renderer or fixture mutation was introduced.

**Proven:** One initial native cluster and one result native pin both moved with the camera and returned after reversible moves while feature counts stayed stable. Visible HTML pins remained zero. Local mobile/desktop proofs, 127 tests/19 files, build, boundary and 12-function generation pass; canonical READY proof ran on `dpl_Czq84yAUzdHpjur3w6ehb6ZunKwk`.

**Not proven:** Dense multi-pin coverage, real-device and full accessibility behavior, extended remote performance, complete recovery and operational readiness remain open. The four public fixtures remain bounded proof data, not worldwide coverage.

**Preserved:** CANOPY-001 through CANOPY-004, Auth, mono-product availability, users, historical data and all paused Seller/Reviewer, OSM/Overpass, PWA/Web Push, payment, QR, transaction and multi-product boundaries remain intact.

**Deployment:** Application code remains commit `6711151`; canonical proof was read-only on `dpl_Czq84yAUzdHpjur3w6ehb6ZunKwk`, source `git`, alias `omni.sparkafrika.online`, 12 functions.

**Next gate:** Keep CANOPY-005 partial until a genuinely multi-pin local frame is available and observed; otherwise move to device/a11y/performance proof. Keep Global Root `review`, release Rings open and multi-product `Root/API-blocked`.

## 2026-08-25 — Canopy accessibility/recovery reconciliation

**Status:** `partial / keyboard, focus, read-only recovery and reduced-motion evidence added; CANOPY and Rings remain open`.

**Changed:** No product task was added or marked done. Existing safe surfaces were tested; no fixture, account, business record or operation changed.

**Proven:** ARIA menu focus, first read-only menuitem reachability, Enter to `Mes demandes`, Escape recovery, options Escape ownership and compact reduced-motion constraints passed. Local mobile/desktop proofs, 127 tests/19 files, build, boundary and 12-function bundling pass. Canonical proof is linked to READY `dpl_FELsPP7PgX6UEzFHesgzwa74p5eV`.

**Not proven:** Device-native touch/input/permission, complete screen-reader traversal, dense multi-pin coverage, extended remote performance and operational readiness remain open.

**Preserved:** CANOPY-001 through CANOPY-005 remain partial, CANOPY-006 deferred, Auth and mono-product boundaries remain stable, and all Seller/Reviewer/OSM/PWA/payment/QR/transaction/multi-product work remains paused.

**Deployment:** Commit `9f31dc3`, source `git`, canonical alias present, 12 functions.

**Next gate:** Add only the next bounded device/a11y/performance proof. Keep Global Root `review`, release Rings open and multi-product `Root/API-blocked`.

## 2026-08-25 — Device-native Canopy reconciliation

**Status:** `partial / permission, touch persistence and reduced-motion evidence added; CANOPY and release Rings remain open`.

**Changed:** No product task was marked done and no source correction was added. Temporary probes were removed; no data changed.

**Proven:** Synthetic compact permission and integrated touch preserved the accessible user marker and mounted map while moving the camera without an intrusive prompt band. Reduced-motion, keyboard/recovery, mobile and desktop contracts pass. Full source validation remains 127 tests/19 files, build/boundary clean and 12 functions.

**Not proven:** Real device/OS input and permission, assistive technology, extended performance, dense pins and operations remain open. CANOPY-001 through CANOPY-005 stay partial; CANOPY-006 remains deferred.

**Preserved:** Auth and mono-product boundaries remain stable; Seller/Reviewer, OSM/Overpass, PWA/Web Push, payment, QR, transaction and multi-product work remains paused.

**Deployment:** Commit `b0b995e`, canonical READY `dpl_4ZByA7G1W6KLVnwieGzgP23LQs2Y`, source `git`, alias present and 12 functions.

**Next gate:** Run only the next bounded device/a11y/performance proof. Keep Global Root `review`, release Rings open and multi-product `Root/API-blocked`.
