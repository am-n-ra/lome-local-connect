# Omni V2 — Trackable Implementation Backlog

**Document ID:** `OMNI-V2-TASKS-001`
**Version:** 1.0.0
**Status:** Initial backlog; all tasks are `todo`
**Canonical sources:** [`v2-flow.md`](./v2-flow.md), [`omni-v2-prd.md`](./omni-v2-prd.md), [`v2-feature-list.md`](./v2-feature-list.md), [`v2-plan.md`](./v2-plan.md)

> This is the operational backlog for completing Omni V2. It is intentionally more granular than the implementation plan: every feature has a trackable parent task and a standard set of subtasks. No feature may be marked complete until its subtasks and slice gate are complete.

## 1. Tracking contract

### 1.1 Status values

| Status | Meaning |
|---|---|
| `todo` | Not started; no implementation claim is made. |
| `ready` | Contract and dependencies are clear; it may enter execution. |
| `in_progress` | Implementation is actively underway. |
| `blocked` | Cannot proceed because a dependency, decision, credential, environment or proof is missing. Record the blocker in the task row or handoff. |
| `review` | Implementation exists and is awaiting code, security, product or visual review. |
| `verified` | Required automated/manual evidence passes, but the parent slice is not yet closed. |
| `done` | Feature and all subtasks are verified and accepted inside a closed slice. |
| `deferred` | Explicitly deferred by the canonical scope; do not implement in the current release. |
| `manual` | User-facing capability exists but an explicitly owned human/external process completes the bounded operation. |

### 1.2 Priority values

`P0` blocks the product foundation or a release gate; `P1` is required for the V2 product flow; `P2` is required for operational completeness; `P3` is deferred or optional after the current release gate.

### 1.3 Standard subtasks for every feature

Each feature row below contains the same seven subtasks. Track them independently in the implementation branch or issue tracker using the parent task ID plus suffix.

| Suffix | Subtask | Required output |
|---|---|---|
| `-C` | Contract | Map feature to flow state, actor, authority, acceptance criterion and data contract. |
| `-D` | Data | Schema/read model, constraints, indexes, migration and fixture changes where persistence is required. |
| `-S` | Server | Query/mutation, authorization, idempotency, audit event and failure mapping. |
| `-U` | UI | Loading, ready, empty, error, retry, back, cancel, close, locked and success states. |
| `-I` | Integration | Route/sheet ownership, context preservation, notifications and analytics events. |
| `-P` | Proof | Unit/integration tests, negative authorization tests and responsive/E2E evidence. |
| `-O` | Operations | Logs, recovery runbook, seed/fixture strategy and manual owner where applicable. |

Default state for every subtask is `[ ] todo`. A task row is not `done` while any required subtask remains unchecked.

### 1.4 Update rules

Every implementation session must update status, owner, last evidence and blocker fields. A status change must reference a commit, test command, screenshot, trace, audit record or runbook. If the canonical flow or PRD changes, stop implementation, update affected tasks and record the decision before continuing.

## 2. Slice tracker

| Slice | Name | Parent gate | Dependencies | Status |
|---|---|---|---|---|
| V0 | Product kernel and proof harness | Kernel can run, authorize, audit and pass boundary checks | None | `partial` |
| V1 | Map-first public discovery | Visitor can search and inspect source-backed facilities without losing map context | V0 | `partial` |
| V2 | Catalogue-first availability | Buyer completes product, scope, constraints and response comparison | V1 | `todo` |
| V3 | Facility verification and trust | Evidence submission and audited outcomes work without claim-by-click | V0, V1 | `todo` |
| V4 | Seller map-first operations | Seller manages facility, catalogue, stock, requests and coupons | V2, V3 | `todo` |
| V5 | Omni Wallet and entitlements | Recharge, ledger, platform spend and Free/Pro rules are authoritative | V0, V3, V4 | `todo` |
| V6 | Purchase intent and transaction room | One eligible response creates one resumable authorized transaction | V2, V4 | `todo` |
| V7 | QR, external payment and fulfilment | QR verification and external handoff reach rating/completion | V5, V6 | `todo` |
| V8 | Auth, resume, notifications and PWA | Protected context restores and mobile proof passes | V1–V7 | `todo` |
| V9 | Admin, analytics and operations | Review, observability and privacy-safe events are operational | V1–V8 | `todo` |
| V10 | Security, resilience and release | All release gates pass; no false or unauthorized state remains | V1–V9 | `todo` |

## 3. V0 — Product kernel and proof harness

**Slice status:** `partial` · **Gate status:** `partial` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V0-FND-001 | FND-001 | Isolate V2 app, database namespace, environment and clean-slate boundary | P0 | None | `verified` | `npm run build`; clean V2 clone |
| V0-FND-002 | FND-002 | Create persistent map-first shell and typed surface store | P0 | FND-001 | `verified` | Local V0 smoke; map slot preserved |
| V0-FND-003 | FND-003 | Implement shared responsive Omni sheet primitive | P0 | FND-002 | `partial` | Type/build proof; browser bridge visual check pending |
| V0-FND-004 | FND-004 | Implement typed route/sheet/menu/action registry | P0 | FND-002 | `verified` | Registry unit test |
| V0-FND-005 | FND-005 | Implement server authority envelope and client/server boundary | P0 | FND-001 | `verified` | `npm run check:boundary`; authority unit test |
| V0-FND-006 | FND-006 | Implement idempotency, audit events, correlation IDs and fixture factory | P0 | FND-005 | `verified` | Idempotency/audit unit test |

**V0 subtasks:** For each row create `-C`, `-D`, `-S`, `-U`, `-I`, `-P`, `-O`; the slice gate requires architecture, client-boundary, state-registry, sheet-responsive and duplicate-mutation proofs.

## 3.1 V0 execution record

**Outcome:** `partial`

**Verified evidence:** `npm test -- --run` (4 tests passed), `npm run check:boundary` (clean), `npm run build` (passed), local HTTP smoke (HTML root served).

**Known limitation:** the connected browser bridge timed out during visual inspection, so responsive screenshots and browser interaction proof remain pending. This is a proof limitation, not a build failure.

**Next action:** complete the browser-level V0 sheet and shell proof, then begin V1 Map-first public discovery.

## 4. V1 — Map-first public discovery

**Slice status:** `partial` · **Gate status:** `partial` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V1-MAP-001 | MAP-001 | Integrate real MapLibre globe, camera, resize and provider/fallback contract | P0 | V0 | `verified` | MapLibre canvas geometry proof |
| V1-MAP-002 | MAP-002 | Implement idle globe rotation and pause/resume ownership | P1 | MAP-001 | `verified` | Map interaction pause logic |
| V1-MAP-003 | MAP-003 | Implement camera ownership arbitration | P1 | MAP-001 | `verified` | User interaction pauses idle rotation |
| V1-MAP-004 | MAP-004 | Implement debounced visible-bounds discovery and antimeridian handling | P0 | MAP-001, FND-005 | `verified` | Debounced bounds adapter + antimeridian test |
| V1-MAP-005 | MAP-005 | Implement bounded OSM/Overpass adapter and manual recovery runbook | P2 | MAP-004 | `partial` | Overpass mirrors, timeout and local fallback implemented; runbook pending |
| V1-MAP-006 | MAP-006 | Normalize and render source-backed facility read model | P0 | MAP-004 | `verified` | Typed public read model and pins |
| V1-MAP-007 | MAP-007 | Implement low-zoom clusters and local individual pins | P1 | MAP-006 | `verified` | MapLibre cluster layers |
| V1-MAP-008 | MAP-008 | Implement selected-pin focus and restoration | P1 | MAP-006 | `verified` | Pin click and ease-to proof |
| V1-MAP-009 | MAP-009 | Implement exact, approximate, denied, timeout and fallback location states | P1 | MAP-001 | `verified` | Exact/approximate/denied/timeout/cancel states |
| V1-MAP-010 | MAP-010 | Enforce truthful exact/approximate marker semantics | P0 | MAP-009 | `verified` | Accuracy threshold changes zoom/state |
| V1-MAP-011 | MAP-011 | Implement explicit recenter loading/failure/cancel flow | P1 | MAP-009 | `verified` | Requesting, timeout, denied and cancel control |
| V1-MAP-012 | MAP-012 | Implement non-overlapping zoom/recenter/rotation controls | P1 | FND-003, MAP-001 | `verified` | Four-width geometry proof |
| V1-MAP-013 | MAP-013 | Implement evidence-backed geographic highlight only | P2 | MAP-006 | `verified` | Selected facility halo only; no unverified area highlight |
| V1-MAP-014 | MAP-014 | Implement visible provider attribution above overlays | P1 | MAP-001 | `verified` | Attribution visible at four widths |
| V1-BUY-001 | BUY-001 | Implement visitor public arrival and discovery explanation | P0 | FND-002, MAP-001 | `verified` | Public discovery shell |
| V1-BUY-002 | BUY-002 | Implement one search row and one Options chevron | P0 | FND-003, BUY-001 | `verified` | One search row with Options disclosure |
| V1-BUY-003 | BUY-003 | Connect catalogue-aware intent and typed product matches | P1 | BUY-002, V2 data contract | `todo` | — |
| V1-BUY-004 | BUY-004 | Implement Options category/filter/constraint surface | P1 | BUY-002 | `verified` | Category, quantity and budget controls remain in dock |
| V1-BUY-005 | BUY-005 | Implement relevant, editable quantity | P1 | BUY-004 | `verified` | Non-default editable quantity in Options |
| V1-BUY-006 | BUY-006 | Implement unlimited/manual budget without view switching | P1 | BUY-004 | `verified` | Unlimited/manual budget in Options |
| V1-BUY-007 | BUY-007 | Unify Enter and button guarded submission | P0 | BUY-002 | `verified` | Playwright Enter/button path |
| V1-BUY-008 | BUY-008 | Implement search submitting/reveal/cancel states | P0 | BUY-007, MAP-004 | `verified` | Loading and cancel states |
| V1-BUY-009 | BUY-009 | Implement honest empty discovery state | P1 | BUY-008 | `verified` | Empty result copy |
| V1-BUY-010 | BUY-010 | Implement search timeout/network/server recovery | P1 | BUY-008 | `partial` | Overpass timeout fallback and retry control; automated failure proof pending |
| V1-BUY-011 | BUY-011 | Implement responsive cards/rail with no horizontal trap | P0 | BUY-008 | `verified` | Four-width no-overflow proof |
| V1-BUY-012 | BUY-012 | Implement product-first result card with media and trust data | P1 | MAP-006, BUY-008 | `todo` | — |
| V1-BUY-013 | BUY-013 | Enforce facility-only selection with negative tests | P0 | BUY-012 | `todo` | — |
| V1-BUY-014 | BUY-014 | Preserve query, viewport, selection and result restoration | P0 | FND-002, BUY-013 | `partial` | Back restores result surface/query; viewport proof pending |

**V1 subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`. Gate evidence: four-width visitor click-through, canvas/clustering/location assertions, Enter/button parity, empty/error recovery, no-overflow and public-data privacy negatives.

### 4.3 V1 execution record

**Outcome:** `partial`

**Verified evidence:** `npm test -- --run` (7 tests passed), `npm run check:boundary` (clean), `npm run build` (passed), and `scripts/v1-map-certification.mjs` across 320/375/768/1280 px. Each width rendered a full-size MapLibre canvas, visible attribution, three deterministic public results and no horizontal overflow.

**Implemented in this pass:** real MapLibre globe projection, OpenFreeMap Liberty primary style with local fallback, resize handling, idle rotation, camera interaction pause, zoom/recenter controls, deterministic source-backed fixtures, GeoJSON clustering, facility pin selection, public search Enter/button path, bounds-aware local discovery, approximate-location thresholding, result sheet and facility detail sheet.

**Remaining V1 proof/implementation gaps:** the operational Overpass adapter now exists with timeout, mirror fallback and local recovery, but its manual runbook and automated failure proof remain open; bounds updates are debounced and connected to the bounded adapter; explicit catalogue-aware product matching remains a V2 dependency and full viewport restoration still needs dedicated proof; the connected browser bridge remains unavailable for a live visual session. The V1 task remains `partial` until these are closed.

## 4.4 Approved search-dock ring — 2026-08-22

**Slice status:** `in_progress` · **Gate status:** `todo` · **Owner:** Manus AI

This ring narrows the current buyer Trunk into a map-first search engine. Its authoritative contract is [`v2-search-dock-interface.md`](./v2-search-dock-interface.md). The current code already has a single dock, one chevron and the verified map/result composition; the options contract, typed menu ownership, context restoration and complete collision proof remain the implementation target.

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V1-SEARCH-001 | SD-001 | Reconcile and approve search-dock interface contract | P0 | V1 | `in_progress` | `v2-search-dock-interface.md` added; filter API support still to reconcile |
| V1-SEARCH-002 | SD-002 | Implement shared map-first safe-area layer model | P0 | SD-001, FND-003 | `ready` | Explicit top, left-control, metadata, rail, options and dock zones |
| V1-SEARCH-003 | SD-003 | Implement real options chevron with supported filter contract | P0 | SD-001, MAP-004 | `ready` | Current public API is query+bounds; extra filters require typed contract or explicit deferment |
| V1-SEARCH-004 | SD-004 | Implement typed top-right hamburger menu | P1 | SD-002, FND-004 | `ready` | Only current V2 actions may be exposed; no dead prototype routes |
| V1-SEARCH-005 | SD-005 | Integrate rail/options/dock collision and context recovery | P0 | SD-002, SD-003, BUY-014 | `ready` | Preserve query, options, viewport, facility and product context |
| V1-SEARCH-006 | SD-006 | Prove responsive, accessibility and reduced-motion behavior | P0 | SD-003, SD-004, SD-005 | `todo` | Required 320/375/768/1280 geometry and keyboard/touch evidence |

**Search-dock subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`; the ring gate requires real options behavior, no dead menu actions, no overlay collisions, context preservation, accessibility proof and canonical-domain screenshots.

## 5. V2 — Catalogue-first availability

**Slice status:** `partial` · **Gate status:** `partial` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V2-CAT-001 | CAT-001 | Build public facility detail sheet | P0 | V1 | `verified` | Facility sheet with public data and map return |
| V2-CAT-002 | CAT-002 | Map status-specific facility actions and locks | P0 | CAT-001 | `todo` | — |
| V2-CAT-003 | CAT-003 | Load active facility products with async states | P0 | CAT-001 | `partial` | Typed catalogue read model; async error states pending |
| V2-CAT-004 | CAT-004 | Prioritize matched product with stable identity | P1 | CAT-003 | `todo` | — |
| V2-CAT-005 | CAT-005 | Render media, price, offer and quantity eligibility | P1 | CAT-003 | `todo` | — |
| V2-CAT-006 | CAT-006 | Implement empty, sold-out, closed and unavailable catalogue states | P1 | CAT-003 | `todo` | — |
| V2-CAT-007 | CAT-007 | Implement typed ProductSelection without demand/reservation | P0 | CAT-003 | `verified` | Facility-scoped product selection |
| V2-CAT-008 | CAT-008 | Implement Produit → Portée → Contraintes → Réponses state machine | P0 | CAT-007 | `partial` | Product handoff to availability surface; response state pending |
| V2-CAT-009 | CAT-009 | Enforce Free single-facility availability scope | P0 | CAT-008 | `todo` | — |
| V2-CAT-010 | CAT-010 | Enforce Pro bounded visible-facility scope and Free alternative | P1 | CAT-008, V5 | `todo` | — |
| V2-CAT-011 | CAT-011 | Implement quantity and unlimited/private budget constraints | P1 | CAT-008 | `todo` | — |
| V2-CAT-012 | CAT-012 | Order availability responses by authoritative status and price | P0 | CAT-008 | `todo` | — |
| V2-CAT-013 | CAT-013 | Render response freshness, quantity, price, offer and message | P1 | CAT-012 | `todo` | — |
| V2-CAT-014 | CAT-014 | Implement comparison and eligible-response highlighting | P0 | CAT-012, CAT-013 | `todo` | — |
| V2-CAT-015 | CAT-015 | Implement no-response, timeout, entitlement and server recovery | P0 | CAT-008 | `todo` | — |

**V2 subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`. Gate evidence: facility-to-catalogue-to-comparison E2E, product identity/no-reservation tests, entitlement and ordering tests, contact/intent locks and responsive sheet proof.

## 6. V3 — Facility verification and trust

**Slice status:** `todo` · **Gate status:** `todo` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V3-TRUST-001 | TRUST-001 | Build seller verification education and entry | P1 | V1 | `todo` | — |
| V3-TRUST-002 | TRUST-002 | Select unclaimed facility without changing status | P0 | V1 | `todo` | — |
| V3-TRUST-003 | TRUST-003 | Create new facility verification request | P1 | TRUST-001 | `todo` | — |
| V3-TRUST-004 | TRUST-004 | Implement verification state machine | P0 | TRUST-002, TRUST-003 | `todo` | — |
| V3-TRUST-005 | TRUST-005 | Implement typed evidence categories | P0 | TRUST-004 | `todo` | — |
| V3-TRUST-006 | TRUST-006 | Persist/edit/cancel/resume evidence drafts idempotently | P0 | TRUST-005, FND-006 | `todo` | — |
| V3-TRUST-007 | TRUST-007 | Build manual admin evidence queue | P1 | TRUST-006 | `manual` | — |
| V3-TRUST-008 | TRUST-008 | Implement audited certified/unconfirmed/rejected outcomes | P0 | TRUST-007, FND-005 | `manual` | — |
| V3-TRUST-009 | TRUST-009 | Implement certified-to-unconfirmed onboarding and optional channel invitation | P1 | TRUST-008 | `todo` | — |
| V3-TRUST-010 | TRUST-010 | Count eligible sales and confirm facility exactly once | P0 | TRUST-008, V7 | `todo` | — |
| V3-TRUST-011 | TRUST-011 | Create locked non-cash $20 seller credit | P1 | TRUST-010, V5 | `todo` | — |
| V3-TRUST-012 | TRUST-012 | Separate trust status from Pro/entitlement payment | P0 | TRUST-008, V5 | `todo` | — |
| V3-TRUST-013 | TRUST-013 | Implement rejection reason and resubmission path | P1 | TRUST-008 | `todo` | — |

**V3 subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`. Gate evidence: claim-click negative test, evidence resume/submit, admin audit completeness, authorization matrix, three-sale unlock and rejection/resubmission proof.

## 7. V4 — Seller map-first operations

**Slice status:** `todo` · **Gate status:** `todo` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V4-SELL-001 | SELL-001 | Build seller map-first workspace | P0 | V2, V3 | `todo` | — |
| V4-SELL-002 | SELL-002 | Build owned-facility operations and open/discovery state | P0 | SELL-001 | `todo` | — |
| V4-SELL-003 | SELL-003 | Build demand/request queue | P0 | SELL-001, V2 | `todo` | — |
| V4-SELL-004 | SELL-004 | Build automatic-response correction with audit/notification | P0 | SELL-003, FND-006 | `todo` | — |
| V4-SELL-005 | SELL-005 | Build product catalogue lifecycle | P0 | V3, SELL-001 | `todo` | — |
| V4-SELL-006 | SELL-006 | Enforce Omni stock allocation against real stock | P0 | SELL-005 | `todo` | — |
| V4-SELL-007 | SELL-007 | Implement product draft/pending/published/error states | P0 | SELL-005 | `todo` | — |
| V4-SELL-008 | SELL-008 | Implement guided coupon creation | P1 | SELL-005 | `todo` | — |
| V4-SELL-009 | SELL-009 | Show honest active/no-discount offer state | P1 | SELL-008 | `todo` | — |
| V4-SELL-010 | SELL-010 | Snapshot coupon outcome transactionally | P0 | SELL-008, V6 | `todo` | — |
| V4-SELL-011 | SELL-011 | Implement real scanner entry | P1 | SELL-001, V6 | `todo` | — |
| V4-SELL-012 | SELL-012 | Implement valid seller account surface | P2 | V5 | `todo` | — |
| V4-SELL-013 | SELL-013 | Implement operational discovery mode | P1 | SELL-002 | `todo` | — |
| V4-SELL-014 | SELL-014 | Implement only authorized/funded advertising | P2 | V5 | `todo` | — |

**V4 subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`. Gate evidence: seller workspace E2E, product lifecycle, stock constraint, coupon snapshot, demand correction and dead-action audits.

## 8. V5 — Omni Wallet and entitlements

**Slice status:** `todo` · **Gate status:** `todo` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V5-WAL-001 | WAL-001 | Build one Omni Wallet surface and copy contract | P0 | V0 | `todo` | — |
| V5-WAL-002 | WAL-002 | Integrate FedaPay wallet recharge only | P0 | WAL-001 | `todo` | — |
| V5-WAL-003 | WAL-003 | Implement pending/confirmed/failed recharge states | P0 | WAL-002 | `todo` | — |
| V5-WAL-004 | WAL-004 | Implement append-only wallet ledger and reconciliation | P0 | WAL-003 | `todo` | — |
| V5-WAL-005 | WAL-005 | Implement authorized platform spending | P1 | WAL-004 | `todo` | — |
| V5-WAL-006 | WAL-006 | Implement insufficient/restricted/unconfirmed spend blocking | P0 | WAL-004 | `todo` | — |
| V5-WAL-007 | WAL-007 | Implement Free/Pro entitlement checks | P0 | WAL-004 | `todo` | — |
| V5-WAL-008 | WAL-008 | Unlock non-cash seller bonus under three-sale rule | P1 | WAL-004, TRUST-010 | `todo` | — |
| V5-WAL-009 | WAL-009 | Remove/reject payout and buyer-seller transfer surfaces | P0 | WAL-001 | `todo` | — |

**V5 subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`. Gate evidence: FedaPay callback, ledger reconciliation, pending-to-available, failed recharge, spend authorization, Free/Pro and withdrawal-negative tests.

## 9. V6 — Purchase intent and transaction room

**Slice status:** `todo` · **Gate status:** `todo` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V6-TXN-001 | TXN-001 | Gate intent CTA to eligible comparison responses | P0 | V2 | `todo` | — |
| V6-TXN-002 | TXN-002 | Implement idempotent/concurrency-safe intent mutation | P0 | FND-006, TXN-001 | `todo` | — |
| V6-TXN-003 | TXN-003 | Create immutable product/facility/price/coupon snapshot | P0 | TXN-002 | `todo` | — |
| V6-TXN-004 | TXN-004 | Implement private contact/chat/QR unlock boundary | P0 | TXN-003 | `todo` | — |
| V6-TXN-005 | TXN-005 | Build one authorized transaction room | P0 | TXN-003 | `todo` | — |
| V6-TXN-006 | TXN-006 | Implement canonical transaction timeline | P0 | TXN-005 | `todo` | — |
| V6-TXN-007 | TXN-007 | Derive actor-specific next actions | P0 | TXN-006 | `todo` | — |
| V6-TXN-008 | TXN-008 | Scope chat to authorized transaction participants | P0 | TXN-005 | `todo` | — |
| V6-TXN-009 | TXN-009 | Generate system messages from server events | P1 | TXN-006 | `todo` | — |
| V6-TXN-010 | TXN-010 | Persist and restore transaction room context | P0 | TXN-005, V8 | `todo` | — |
| V6-TXN-011 | TXN-011 | Build incomplete-transaction resume bar | P1 | TXN-010 | `todo` | — |
| V6-TXN-012 | TXN-012 | Implement expiry/unavailable/server-error recovery | P0 | TXN-002 | `todo` | — |

**V6 subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`. Gate evidence: comparison-to-intent E2E, concurrent idempotency, immutable snapshot, unlock negative/positive, timeline, chat authorization and resume tests.

## 10. V7 — QR, external payment and fulfilment

**Slice status:** `todo` · **Gate status:** `todo` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V7-QR-001 | QR-001 | Generate transaction-bound buyer QR | P0 | V6 | `todo` | — |
| V7-QR-002 | QR-002 | Implement visible QR expiry and recovery | P0 | QR-001 | `todo` | — |
| V7-QR-003 | QR-003 | Enforce QR replay-safe server state | P0 | QR-001, FND-006 | `todo` | — |
| V7-QR-004 | QR-004 | Build scanner-ready screen before camera request | P0 | V4, V6 | `todo` | — |
| V7-QR-005 | QR-005 | Gate permission to explicit secure-origin CTA | P0 | QR-004 | `todo` | — |
| V7-QR-006 | QR-006 | Mount live preview and manage stream lifecycle | P0 | QR-005 | `todo` | — |
| V7-QR-007 | QR-007 | Decode supported QR and stop tracks exactly once | P0 | QR-006 | `todo` | — |
| V7-QR-008 | QR-008 | Implement manual QR fallback | P0 | QR-005 | `todo` | — |
| V7-QR-009 | QR-009 | Implement expired/replayed/mismatch/malformed states | P0 | QR-003, QR-007 | `todo` | — |
| V7-PAY-001 | PAY-001 | Implement external method selection | P1 | V6 | `todo` | — |
| V7-PAY-002 | PAY-002 | Implement buyer payment declaration | P0 | PAY-001 | `todo` | — |
| V7-PAY-003 | PAY-003 | Implement seller payment confirmation/pending/dispute | P0 | PAY-002 | `todo` | — |
| V7-PAY-004 | PAY-004 | Implement pickup/delivery fulfilment states | P0 | PAY-003 | `todo` | — |
| V7-PAY-005 | PAY-005 | Implement buyer receipt confirmation | P0 | PAY-004 | `todo` | — |
| V7-PAY-006 | PAY-006 | Implement rating and server completion | P0 | PAY-005 | `todo` | — |
| V7-PAY-007 | PAY-007 | Enforce no in-app payment/payout/withdrawal surface | P0 | PAY-001 | `todo` | — |

**V7 subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`. Gate evidence: HTTPS camera preview, denial/manual fallback, valid/expired/replay/mismatch QR, actor payment authorization and complete external handoff E2E.

## 11. V8 — Auth, resume, notifications and PWA

**Slice status:** `todo` · **Gate status:** `todo` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V8-SYS-001 | SYS-001 | Add protected-action authentication gate and copy | P0 | V1, V6 | `todo` | — |
| V8-SYS-002 | SYS-002 | Preserve full buyer/seller context across auth | P0 | SYS-001 | `todo` | — |
| V8-SYS-003 | SYS-003 | Clear private state safely on sign-out | P1 | SYS-002 | `todo` | — |
| V8-SYS-004 | SYS-004 | Implement transactional notifications and deep links | P1 | V6, V7 | `todo` | — |
| V8-SYS-005 | SYS-005 | Implement safe recovery for expired/missing notification context | P1 | SYS-004 | `todo` | — |
| V8-SYS-006 | SYS-006 | Implement PWA manifest, worker, icons and install lifecycle | P1 | V1 | `todo` | — |
| V8-SYS-007 | SYS-007 | Implement offline public/private data policy and mutation blocking | P1 | SYS-006 | `todo` | — |
| V8-SYS-008 | SYS-008 | Certify dynamic viewport, safe areas and responsive surfaces | P0 | V1–V7 | `todo` | — |
| V8-SYS-009 | SYS-009 | Preserve focus, keyboard, Escape and back ownership | P0 | FND-003, SYS-008 | `todo` | — |
| V8-SYS-010 | SYS-010 | Implement accessibility names, focus order and announcements | P1 | SYS-008, SYS-009 | `todo` | — |

**V8 subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`. Gate evidence: auth restoration, role context, notification deep-link, PWA lifecycle, offline policy, focus/keyboard and four-width accessibility tests.

## 12. V9 — Admin, analytics and operations

**Slice status:** `todo` · **Gate status:** `todo` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V9-ADM-001 | ADM-001 | Build admin evidence queue and filters | P1 | V3 | `manual` | — |
| V9-ADM-002 | ADM-002 | Persist complete audited outcome records | P0 | ADM-001 | `manual` | — |
| V9-ADM-003 | ADM-003 | Enforce controlled trust mutations | P0 | ADM-002 | `manual` | — |
| V9-ADM-004 | ADM-004 | Implement source-import observability and recovery | P2 | MAP-005 | `manual` | — |
| V9-ADM-005 | ADM-005 | Implement consent-aware minimized analytics | P0 | V0 | `todo` | — |
| V9-ADM-006 | ADM-006 | Instrument discovery funnel events | P1 | V1 | `todo` | — |
| V9-ADM-007 | ADM-007 | Instrument availability/comparison events | P1 | V2 | `todo` | — |
| V9-ADM-008 | ADM-008 | Instrument transaction/QR/payment events | P1 | V6, V7 | `todo` | — |
| V9-ADM-009 | ADM-009 | Instrument seller activation metrics | P2 | V3, V4 | `todo` | — |
| V9-ADM-010 | ADM-010 | Instrument wallet integrity metrics | P1 | V5 | `todo` | — |
| V9-ADM-011 | ADM-011 | Instrument recovery/permission/expiry/duplicate metrics | P1 | V1–V8 | `todo` | — |
| V9-ADM-012 | ADM-012 | Implement production errors/latency/availability observability | P1 | V8 | `todo` | — |

**V9 subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`. Gate evidence: admin audit test, import recovery drill, analytics privacy/schema test, event completeness and production-log redaction.

## 13. V10 — Security, resilience and release certification

**Slice status:** `todo` · **Gate status:** `todo` · **Owner:** unassigned

| Task ID | Feature | Parent task | Priority | Dependencies | Status | Evidence / blocker |
|---|---|---|---|---|---|---|
| V10-SEC-001 | SEC-001 | Audit all async surfaces for bounded loading and context preservation | P0 | V1–V9 | `todo` | — |
| V10-SEC-002 | SEC-002 | Audit honest empty/unavailable states and no fabricated data | P0 | V1–V9 | `todo` | — |
| V10-SEC-003 | SEC-003 | Verify retry/cancel/back for every critical mutation | P0 | V1–V9 | `todo` | — |
| V10-SEC-004 | SEC-004 | Run duplicate/concurrency suite for all mutations | P0 | V0, V1–V9 | `todo` | — |
| V10-SEC-005 | SEC-005 | Run expiry suite for response, intent, QR, auth and notification | P0 | V1–V9 | `todo` | — |
| V10-SEC-006 | SEC-006 | Run unauthorized-route and actor-boundary suite | P0 | V1–V9 | `todo` | — |
| V10-SEC-007 | SEC-007 | Run offline mutation-blocking suite | P1 | V8 | `todo` | — |
| V10-SEC-008 | SEC-008 | Review database/server invariants for stock, trust, wallet, QR and transaction | P0 | V1–V9 | `todo` | — |
| V10-SEC-009 | SEC-009 | Run client-boundary and secret scanning checks | P0 | V0, V8 | `todo` | — |
| V10-SEC-010 | SEC-010 | Run dead-action audit and remove fake/deferred controls | P0 | V1–V9 | `todo` | — |

**V10 subtasks:** Each row requires `-C/-D/-S/-U/-I/-P/-O`. Gate evidence: release matrix, security suite, recovery matrix, four-width mobile certification, accessibility review, observability review and production readiness sign-off.

## 14. Manual and deferred backlog

These rows are included so they cannot be forgotten, but their status is governed by the canonical scope rather than normal feature completion.

| Task ID | Feature | Parent task | Priority | Status | Required action |
|---|---|---|---|---|---|
| V9-MAN-001 | MAN-001 | OSM/Overpass bounded backfill | P2 | `manual` | Assign operator, evidence, dedupe, retry, rollback and recovery runbook. |
| V9-MAN-002 | MAN-002 | Admin evidence review | P1 | `manual` | Assign reviewer, queue, decision reasons, audit history and escalation. |
| V10-DFR-001 | DFR-001 | AI orchestration | P3 | `deferred` | Do not implement until manual loops have measurable proof and canonical docs are patched. |
| V10-DFR-002 | DFR-002 | Native mobile apps | P3 | `deferred` | Reassess only after PWA production verification. |
| V10-DFR-003 | DFR-003 | Buyer-seller in-app payments | P3 | `deferred` | Keep external declarations only; no payment rail. |
| V10-DFR-004 | DFR-004 | Seller withdrawal/payout | P3 | `deferred` | Keep absent from UI, API and wallet. |
| V10-DFR-005 | DFR-005 | Instant unrestricted global prepopulation | P3 | `deferred` | Keep bounded coverage and honest empty states. |

## 15. Coverage and completion rules

The backlog must maintain a one-to-one parent task for every feature ID in `v2-feature-list.md`. The current inventory is **152 feature IDs**. The expected parent count is therefore 152, excluding slice gates and the standard subtasks. Before closing this document’s preparation pass, run a coverage check that reports the inventory count, unique backlog feature count and missing IDs.

A slice may move from `todo` to `ready` only when its dependencies are `done`, `manual` or explicitly accepted as a manual gate. It may move to `in_progress` only after the contract subtask is complete. It may move to `review` only after data/server/UI/integration subtasks exist. It may move to `verified` only after proof artifacts are attached. It may move to `done` only after the slice gate is accepted.

The first execution batch is V0. Create issues or work items from `V0-FND-001` through `V0-FND-006`, then execute their `-C`, `-D`, `-S`, `-U`, `-I`, `-P` and `-O` subtasks. No V1 UI implementation should begin until the V0 gate is `verified`.

## 16. References

[1]: ./v2-flow.md "Omni V2 canonical flow contract"

[2]: ./omni-v2-prd.md "Omni V2 product requirements document"

[3]: ./v2-feature-list.md "Omni V2 complete feature inventory"

[4]: ./v2-plan.md "Omni V2 implementation plan"
