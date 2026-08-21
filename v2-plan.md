# Omni V2 — Implementation Plan

**Document ID:** `OMNI-V2-PLAN-001`
**Version:** 1.0.0
**Status:** Approved execution plan derived from the canonical V2 documents
**Canonical inputs:** [`v2-flow.md`](./v2-flow.md), [`omni-v2-prd.md`](./omni-v2-prd.md), [`v2-feature-list.md`](./v2-feature-list.md)

> This document is the execution plan, not a new product specification. It converts the canonical flow, PRD and feature inventory into dependency-ordered vertical slices. A slice is complete only when its UI, server behavior, persistence, authorization, failure states, responsive behavior and proof artifacts work together. If a feature decision is missing or contradictory, patch the flow or PRD before changing this plan.

## 1. Execution model

Omni V2 will be rebuilt as a clean-slate product. Work proceeds in vertical slices rather than by completing a large frontend layer and postponing the backend. Each slice must produce a usable, testable increment and must leave the previous slices working.

A feature is not complete when a screen exists. It is complete when the authoritative state, server action, persistence, UI state, permission boundary, recovery path, analytics event and automated/manual proof are present where the feature requires them.

### 1.1 Definition of ready

Before implementation begins for a feature, the team must identify its owning flow states, actor, authoritative source, server mutations, data contract, UI surfaces, failure states, analytics events, security constraints and acceptance proof. Unknowns that change money, privacy, trust, authority or scope must be resolved in `v2-flow.md` or `omni-v2-prd.md` first.

### 1.2 Definition of done

A feature is done only when its implementation passes type and unit checks, server/client boundary checks, authorization tests, idempotency tests where relevant, responsive checks at 320/375/768/1280 px, accessibility checks for its states, and a flow-level proof that demonstrates the feature in context. Temporary fixtures are allowed for proof but must be clearly isolated from production data.

### 1.3 Standard work package for every feature

| Work package | Required output |
|---|---|
| Contract | Feature ID mapped to source flow state, actor, authority and acceptance criterion. |
| Data | Schema, constraints, indexes, read model and migration if persistence is required. |
| Server | Typed query/mutation, authorization, idempotency, audit event and failure mapping. |
| UI | Loading, ready, empty, error, retry, back, cancel, close, locked and success states. |
| Integration | Route/sheet ownership, context preservation and event instrumentation. |
| Proof | Unit/integration test plus an end-to-end proof at the relevant responsive widths. |
| Operations | Logging, recovery procedure, seed/fixture strategy and manual owner where applicable. |

## 2. Slice map and dependency order

| Slice | Name | Primary outcome | Depends on |
|---|---|---|---|
| V0 | Product kernel and proof harness | Empty but production-shaped V2 foundation with typed state and test infrastructure | None |
| V1 | Map-first public discovery | Visitor opens a rotating globe, searches visible geography and inspects public facilities | V0 |
| V2 | Catalogue-first availability | Buyer selects a real facility product, submits the four-stage availability flow and compares responses | V1 |
| V3 | Facility verification and trust | Seller creates evidence requests and admin produces audited facility outcomes | V0, V1 |
| V4 | Seller map-first operations | Verified seller manages facilities, products, stock, requests and coupons | V3, V2 |
| V5 | Omni Wallet and entitlements | User recharges one wallet and server enforces Free/Pro and platform credit rules | V0, V3, V4 |
| V6 | Purchase intent and transaction room | Eligible comparison response becomes one resumable authorized transaction | V2, V4 |
| V7 | QR, external payment and fulfilment | Seller verifies buyer QR and both actors complete external payment, fulfilment, receipt and rating | V6, V5 |
| V8 | Auth, resume, notifications and PWA | Protected actions restore exact context across sessions and mobile surfaces | V1–V7 foundations |
| V9 | Admin, analytics and operations | Trust review, discovery observability and privacy-safe product metrics are operational | V1–V8 |
| V10 | Security, resilience and release certification | All required gates pass without false states, leaks, duplicate mutations or mobile regressions | V1–V9 |

Slices may contain parallel implementation work internally, but their exit gates are sequential. No later slice may be declared complete by bypassing an earlier gate with a mock state that contradicts the server contract.

## 3. V0 — Product kernel and proof harness

**Goal:** establish the smallest technical base from which every later slice can be built without importing V1 code or decisions.

**Exit gate:** a blank but running V2 shell can mount typed map/sheet state, make an authorized server call, record an audit event and pass client-boundary, unit and responsive smoke checks.

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| FND-001 | Create the isolated V2 application, database branch/schema namespace, environment contract and repository boundary. Keep V1 code, migrations, users and production runtime out of the dependency graph. Add a clean-slate check that fails if V1-only imports or tables are used. |
| FND-002 | Define the persistent shell regions: map scene, chrome, dock, result/facility/catalogue/availability/comparison surfaces and transaction surface. Mount the map region once and route typed state changes through a central reducer/store. |
| FND-003 | Implement one responsive Omni sheet primitive with mobile bottom anchoring, desktop bounded layout, scroll body, reachable footer, focus ownership and complete async states. Add component contracts rather than one-off panel variants. |
| FND-004 | Create the state registry for routes, sheets, menu actions and actor context. Every registered action must have an owner, destination, permission rule and proof identifier. |
| FND-005 | Establish server-only authority modules and typed result/error envelopes. Reject client-supplied status, price, stock, QR validity, discount and availability transitions. |
| FND-006 | Add mutation idempotency keys, audit-event schema, request correlation IDs and a standard test fixture factory. Prove duplicate mutation returns the original result rather than creating a second event. |

**V0 proof:** architecture check, client-boundary check, state registry test, sheet primitive responsive test and duplicate mutation integration test.

## 4. V1 — Map-first public discovery

**Goal:** deliver the public product’s defining experience: a real globe/map, honest source-backed facilities and catalogue-aware search without protected transaction access.

**Exit gate:** a visitor can open the globe, explore or locate, search, see source-backed pins/clusters, select a facility, inspect public content and return without losing context.

### 4.1 Map feature tasks

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| MAP-001 | Integrate MapLibre with a real globe projection, deterministic initial camera, resize handling and an explicit provider/fallback contract. Verify the canvas fills the scene at all release widths. |
| MAP-002 | Add idle rotation state with pause/resume ownership. Rotation must stop on search focus, keyboard input, drag, zoom, recenter and selected-facility focus. |
| MAP-003 | Implement camera ownership arbitration so manual interaction always wins over automated reveal, selection framing and idle rotation. |
| MAP-004 | Emit debounced visible bounds on map movement and make the server query contract antimeridian-safe. Preserve query/context while bounds update. |
| MAP-005 | Build the bounded OSM/Overpass source adapter as a manual-operational capability. Store source reference, import status, dedupe key, owner, evidence and recovery state. Do not promise instant global prepopulation. |
| MAP-006 | Normalize source-backed facilities into a public discovery read model. Render only source-backed pins and keep supply, claim, certification and inventory facts separate. |
| MAP-007 | Add cluster and individual-pin layers with zoom thresholds, stable identifiers and selected cluster expansion behavior. |
| MAP-008 | Implement selected-pin focus/highlight without replacing the result set or destroying the map query. Add back/close restoration. |
| MAP-009 | Implement non-blocking location permission states: requesting, exact, approximate, denied, timeout and fallback market. |
| MAP-010 | Enforce marker truth on the server/client contract: exact blue marker only for a fresh acceptable browser fix; approximate context has neutral copy. |
| MAP-011 | Add explicit recenter action with loading, failure and cancellation behavior. Recenter must not silently submit a search. |
| MAP-012 | Add zoom, recenter and rotation controls in a map-safe zone that cannot overlap dock/sheets at 320, 375, 768 or 1280 px. |
| MAP-013 | Add geographic highlight only when a matching asset exists; return an honest no-highlight state otherwise. |
| MAP-014 | Add provider attribution to the map scene and test that it remains visible above overlays and on mobile. |

### 4.2 Buyer discovery feature tasks

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| BUY-001 | Build the visitor arrival state with clear explanation of globe, search and public data. Do not force authentication before public discovery. |
| BUY-002 | Build one search row plus one Options chevron. Remove competing global navigation controls and dead menu actions. |
| BUY-003 | Connect search intent to catalogue products and return typed product matches. Use free text only when no catalogue product is available. |
| BUY-004 | Implement the Options surface for category, open-now, radius, discount, sort, quantity, budget, location mode and retry. |
| BUY-005 | Keep quantity hidden until relevant and make it manually editable without changing the map state. |
| BUY-006 | Support unlimited and manually entered budget without creating a different search view. |
| BUY-007 | Route Enter and button submission through one guarded submit handler with validation and busy protection. |
| BUY-008 | Implement search submitting/reveal states with cancellation and map-preserving progress. |
| BUY-009 | Implement empty discovery with scope explanation, retry, scope adjustment and return actions; never fabricate results. |
| BUY-010 | Implement timeout/network/server error with preserved query/options and retry. |
| BUY-011 | Implement responsive result cards/rail with no inaccessible horizontal overflow and a stable selected state. |
| BUY-012 | Render product-first cards with media, facility identity, public trust/status, distance, price/offer, product count and one next action. |
| BUY-013 | Ensure card/pin selection only selects a facility. Add negative tests proving it cannot claim, request availability or create intent. |
| BUY-014 | Persist result query, viewport, selected facility and card state through close/back/reopen. |

**V1 proof:** visitor click-through at 320/375/768/1280 px, map canvas assertion, cluster/pin assertion, location-state tests, search Enter/button parity test, no-horizontal-overflow assertion and public-data/privacy negative tests.

## 5. V2 — Catalogue-first availability

**Goal:** let a buyer move from a selected facility to a real catalogue product, then through `Produit → Portée → Contraintes → Réponses` with real, non-reserving availability responses.

**Exit gate:** a buyer can inspect facility details, select a catalogue product, complete the four named stages, receive ordered responses or an honest empty/error state, and return to the map without losing context.

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| CAT-001 | Build the public facility sheet with identity, media, search context, trust/status, address, hours/open state, matched product and product count. |
| CAT-002 | Map unclaimed, certified, unconfirmed, confirmed and unavailable status to explicit allowed actions. Prove private contact and transaction actions remain locked. |
| CAT-003 | Add server-backed active product loading with loading, retry and error states scoped to the selected facility. |
| CAT-004 | Rank the matched catalogue product first while preserving stable product identity and deterministic fallback ordering. |
| CAT-005 | Render product media, price, offer/discount and quantity eligibility with server-derived values. |
| CAT-006 | Add empty, sold-out, closed and unavailable catalogue states with recovery actions. |
| CAT-007 | Define and validate `ProductSelection`; selection must not create a demand or reserve stock. |
| CAT-008 | Build the named four-stage availability state machine and persistent progress indicator. |
| CAT-009 | Enforce Free single-facility scope on the server and show the buyer the scope honestly. |
| CAT-010 | Enforce Pro bounded visible-facility scope only when the server entitlement allows it; provide a useful Free alternative when blocked. |
| CAT-011 | Add quantity/private budget constraints, including unlimited budget, without moving the map or losing product selection. |
| CAT-012 | Order responses by available, partial, unavailable, then price using server data. |
| CAT-013 | Render response facility, product, freshness, quantity, price, offer and seller message. |
| CAT-014 | Build comparison surface with eligible-response highlighting and no contact unlock before intent. |
| CAT-015 | Add no-response, timeout, entitlement and server-error recovery with preserved inputs and retry. |

**V2 proof:** facility-to-catalogue-to-availability E2E; server tests for product identity, scope entitlement, no reservation and ordering; empty/error recovery proof; contact/intent lock proof; responsive sheet certification.

## 6. V3 — Facility verification and trust

**Goal:** make facility identity and supply trust reviewable. A click never claims a facility; only audited evidence review changes status.

**Exit gate:** seller can start or resume evidence for an unclaimed/new facility, submit idempotently, admin can review with audit context, and outcomes create exactly the permitted next state.

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| TRUST-001 | Build seller entry/onboarding education explaining facility-first verification, evidence, catalogue eligibility and next steps. |
| TRUST-002 | Let an eligible seller select an unclaimed public facility while preserving `unclaimed` status. |
| TRUST-003 | Support new facility verification request with location/company context and no automatic certification. |
| TRUST-004 | Implement the verification request state machine from unclaimed through admin review. |
| TRUST-005 | Add typed evidence categories for identity, company/facility, product/article and location/facility proof. |
| TRUST-006 | Persist drafts, support edit/cancel/resume and make submission idempotent. |
| TRUST-007 | Build the manual admin evidence queue with claimant, facility, evidence stage and history. |
| TRUST-008 | Implement audited certified/unconfirmed/rejected outcomes with actor, reason, timestamp and evidence reference. |
| TRUST-009 | Implement certified-to-unconfirmed operational onboarding and optional channel invitation without making membership a requirement. |
| TRUST-010 | Count only eligible completed Omni sales toward confirmation and transition unconfirmed to confirmed exactly once. |
| TRUST-011 | Create locked non-cash $20 seller credit, communicate it early and unlock it only after three qualifying sales. |
| TRUST-012 | Separate trust status from Pro/entitlement payment and block any bypass. |
| TRUST-013 | Display rejection reasons and support policy-approved resubmission/new evidence. |

**V3 proof:** seller evidence journey, admin review journey, authorization matrix tests, audit completeness test, claim-click negative test, three-sale unlock test and rejection/resubmission recovery test.

## 7. V4 — Seller map-first operations

**Goal:** provide a seller workspace as clean and map-first as buyer discovery, centered on owned facilities and real operations.

**Exit gate:** an eligible seller can inspect an owned facility, manage real products/stock/coupons, receive and answer requests, and enter the scanner without dead controls.

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| SELL-001 | Build seller map workspace showing owned facilities and operational state as the primary scene. |
| SELL-002 | Build facility operations for open/closed state, hours and discovery mode with server validation. |
| SELL-003 | Build demand queue with request context, freshness, response state and valid seller actions. |
| SELL-004 | Add one-step correction for automatic responses with audit event and buyer notification. |
| SELL-005 | Build product catalogue management for create, edit, validate, publish and sold-out operations. |
| SELL-006 | Enforce Omni stock allocation against real stock with server and database constraints. |
| SELL-007 | Implement product draft, pending-validation, published and field-error states. |
| SELL-008 | Add a guided coupon form with clear eligibility, dates/limits and server-side validation. |
| SELL-009 | Show active coupon/offer or honest no-discount state on published products. |
| SELL-010 | Snapshot coupon eligibility/redemption/discount outcome into the transaction and prevent client rewrite. |
| SELL-011 | Add scanner entry as a real seller operation, not a placeholder. |
| SELL-012 | Add secondary account surface only for wallet, subscription and settings actions that have real callbacks and permissions. |
| SELL-013 | Add operational discovery mode and valid open/closed state to the seller facility surface. |
| SELL-014 | Add advertising only when the feature is funded, authorized and backed by a working spend callback. |

**V4 proof:** seller workspace E2E, product lifecycle tests, stock constraint tests, coupon calculation/snapshot tests, auto-response correction test and no-dead-action audit.

## 8. V5 — Omni Wallet and entitlements

**Goal:** make one rechargeable Omni Wallet understandable and reliable for platform consumption, without creating buyer-seller payments or seller withdrawal.

**Exit gate:** recharge, confirmation, balance presentation, platform spend, restriction and Free/Pro enforcement work from server-confirmed ledger state.

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| WAL-001 | Build a single Omni Wallet surface and consistent copy explaining its platform-only role. |
| WAL-002 | Integrate FedaPay for wallet recharge only; keep buyer-seller payment outside the wallet. |
| WAL-003 | Implement pending, confirmed, failed, cancelled and expired recharge states driven by server callback. |
| WAL-004 | Implement append-only wallet ledger and balance reconciliation checks. |
| WAL-005 | Add authorized platform spend for subscription, Pro, advertising, coupon/ad credit and other explicitly eligible features. |
| WAL-006 | Block insufficient, restricted and unconfirmed spends with explanation and recovery. |
| WAL-007 | Implement Free/Pro entitlement checks for limits, bulk availability and other explicitly active capabilities. |
| WAL-008 | Unlock the non-cash seller bonus only under the three-sale condition and keep it non-withdrawable. |
| WAL-009 | Remove or reject all payout/withdrawal/buyer-seller transfer surfaces and API paths. |

**V5 proof:** FedaPay callback integration test, ledger reconciliation test, pending-to-available test, failed recharge recovery, spend authorization test, Free/Pro bulk-scope test and withdrawal-negative test.

## 9. V6 — Purchase intent and transaction room

**Goal:** convert one eligible comparison response into one authorized, resumable transaction context.

**Exit gate:** only an eligible response can create intent; the server snapshots transaction facts exactly once; contact/chat/QR unlock only after that transition; the room resumes with actor-specific next action.

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| TXN-001 | Expose purchase intent only on eligible comparison responses. |
| TXN-002 | Implement idempotent intent mutation with duplicate and concurrent-submit protection. |
| TXN-003 | Create immutable snapshot of product, facility, quantity, gross price, offer/coupon and net amount. |
| TXN-004 | Implement server-authorized unlocks for private contact, itinerary, chat, QR and sensitive seller data only after intent. |
| TXN-005 | Build one scoped transaction room owning facts, QR reference, next action, timeline and messages. |
| TXN-006 | Implement canonical transaction timeline with named stages from intention to completion. |
| TXN-007 | Derive buyer/seller next action from persisted state and actor, never from client labels. |
| TXN-008 | Scope chat messages to authorized transaction participants and reject public/unscoped conversation. |
| TXN-009 | Generate system messages from server events and prevent client text from advancing state. |
| TXN-010 | Persist room context and restore it from menu, notifications, orders or saved context. |
| TXN-011 | Add resume bar for incomplete transactions with exact deep-link context. |
| TXN-012 | Add expiry, unavailable-response and server-error recovery without losing safe selection context. |

**V6 proof:** comparison-to-intent E2E, concurrent idempotency test, immutable snapshot test, unlock negative/positive test, transaction timeline/state machine test, chat authorization test and resume/reopen test.

## 10. V7 — QR, external payment and fulfilment

**Goal:** complete the physical/external handoff while preserving Omni’s boundary: Omni records and authorizes the flow but does not process buyer-seller payment or withdrawals.

**Exit gate:** QR camera/manual verification works on supported and unsupported browsers, external payment and fulfilment states advance only by the correct actor, and the buyer can rate after receipt.

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| QR-001 | Generate buyer QR only from the authorized transaction room and bind it to one transaction/token. |
| QR-002 | Add visible expiry, countdown/state and expired-code recovery. |
| QR-003 | Enforce replay-safe server token state and idempotent duplicate verification. |
| QR-004 | Build scanner-ready screen before camera permission with clear camera CTA and manual fallback. |
| QR-005 | Request camera permission only from explicit CTA on secure top-level origin. |
| QR-006 | Keep live video preview mounted after permission; assert play resolution, non-zero dimensions and live tracks. |
| QR-007 | Decode BarcodeDetector-supported QR and stop tracks exactly once after submission/close. |
| QR-008 | Provide manual code fallback for denied, unsupported, malformed and failed camera flows. |
| QR-009 | Distinguish expired, replayed, mismatched and malformed QR recovery states. |
| PAY-001 | Add external method selection for cash on delivery, TMoney, Flooz and supported methods. |
| PAY-002 | Let buyer declare payment without treating declaration as confirmed payment. |
| PAY-003 | Let seller confirm receipt or leave payment pending/disputed under authorized state. |
| PAY-004 | Implement delivery/pickup fulfilment states and seller completion action. |
| PAY-005 | Let buyer confirm receipt only after allowed fulfilment state. |
| PAY-006 | Let buyer rate after receipt and close transaction only through server transition. |
| PAY-007 | Ensure no in-app buyer-seller payment, payout or withdrawal appears in UI/API. |

**V7 proof:** camera permission/preview tests on HTTPS-capable browser, manual fallback test, QR expiry/replay/mismatch test, actor authorization test, external payment timeline E2E and receipt/rating completion test.

## 11. V8 — Auth, notifications, resume and PWA

**Goal:** make protected flows understandable, restorable and usable as the immediate mobile product.

**Exit gate:** authentication, role transition, notifications and PWA behavior preserve context and all required flows work without mobile overflow or lost focus.

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| SYS-001 | Add authentication gate at the first protected action with clear reason and restoration promise. |
| SYS-002 | Snapshot query, filters, quantity, budget, location, facility, product, request and return route through auth. |
| SYS-003 | Clear private context safely on sign-out while retaining only permitted public state. |
| SYS-004 | Build transactional notifications for availability, response, intent, QR, payment, fulfilment, certification and account events. |
| SYS-005 | Route missing/expired notification context to a safe recovery surface. |
| SYS-006 | Add PWA manifest, service worker, icons, install behavior and relaunch handling. |
| SYS-007 | Define network-first private data and offline public-context policy; block offline transaction mutations honestly. |
| SYS-008 | Apply dynamic viewport, safe areas and responsive sheet/dock rules at 320/375/768/1280 px. |
| SYS-009 | Preserve input focus, keyboard behavior, Escape, back gesture and sheet ownership. |
| SYS-010 | Add accessibility names, focus order, live-state announcements and keyboard reachability for critical states. |

**V8 proof:** auth restoration E2E, role-switch context test, notification deep-link test, PWA install/lifecycle check, offline policy test, focus/keyboard tests and four-width accessibility/layout certification.

## 12. V9 — Admin, analytics and operations

**Goal:** make trust, discovery, transaction and product health observable without collecting private secrets or bypassing authority.

**Exit gate:** admins can review evidence and operators can inspect bounded discovery and product funnel health with privacy-safe events.

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| ADM-001 | Implement admin evidence queue filtering and review context. |
| ADM-002 | Persist complete audited outcomes with actor, reason, timestamp, evidence and previous state. |
| ADM-003 | Enforce controlled trust mutations and reject generic direct status bypass. |
| ADM-004 | Add OSM/Overpass import status, dedupe metrics, failure visibility, retry and operator recovery. |
| ADM-005 | Implement consent-aware, minimized, pseudonymous analytics without raw secrets. |
| ADM-006 | Instrument arrival, search, result, facility, catalogue, product and availability transitions. |
| ADM-007 | Instrument availability scope, constraints, responses, freshness and comparison outcomes. |
| ADM-008 | Instrument intent, QR, payment declaration, fulfilment, receipt, rating and completion. |
| ADM-009 | Instrument verification, product publication, first request and completed-sale activation metrics. |
| ADM-010 | Instrument recharge callbacks, spend ledger and available/pending/restricted balance integrity. |
| ADM-011 | Instrument retries, empty states, permission denial, expiry, replay and duplicate prevention. |
| ADM-012 | Add production observability for errors, latency, availability and critical flow completion without private-data leakage. |

**V9 proof:** admin review audit test, import recovery drill, analytics schema/privacy test, event completeness test and production-log redaction check.

### 12.1 Manual and deferred boundaries

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| MAN-001 | Assign an operator owner and runbook for bounded OSM/Overpass backfill, including source evidence, dedupe, import failure, retry, rollback and recovery. |
| MAN-002 | Assign an admin review owner and runbook for evidence review, explicit outcome, audit history and escalation when automated proof is unavailable. |
| DFR-001 | Keep AI orchestration out of implementation scope until the manual discovery, trust, transaction and operational loops have measurable proof. Record any future AI proposal as a separate change to the canonical documents. |
| DFR-002 | Keep native mobile applications out of the V2 build; collect PWA evidence and define a future reassessment gate after production verification. |
| DFR-003 | Keep buyer-seller in-app payments deferred; implement only external payment declaration and seller confirmation in V7. |
| DFR-004 | Keep seller withdrawal/payout absent from UI, API and wallet ledger; include a negative authorization test in V5 and V10. |
| DFR-005 | Keep unrestricted instant global prepopulation out of the promise; implement bounded source discovery with honest empty and operational recovery states. |

## 13. V10 — Security, resilience and release certification

**Goal:** certify the complete product rather than merely rerunning happy paths.

**Exit gate:** release gates from the PRD are met, all required states have recovery, and no feature exposes a false, unauthorized or non-resumable outcome.

| Feature IDs | Feature-by-feature implementation tasks |
|---|---|
| SEC-001 | Audit every asynchronous surface for bounded loading, preserved context and cancel/back behavior. |
| SEC-002 | Audit discovery, facility, catalogue and availability empty/unavailable states for honest copy and no fabricated data. |
| SEC-003 | Verify retry/cancellation for search, catalogue, availability, verification, wallet, intent, QR and transaction actions. |
| SEC-004 | Run duplicate/concurrency tests for all mutating actions and confirm authoritative existing-result behavior. |
| SEC-005 | Run expiry tests for responses, intents, QR, auth context and notification links. |
| SEC-006 | Run unauthorized-route and role-boundary tests for visitor, buyer, seller and admin. |
| SEC-007 | Run offline tests proving wallet, QR, payment and transaction mutations cannot appear complete locally. |
| SEC-008 | Review database/server enforcement for stock, entitlement, wallet, trust, QR and transaction invariants. |
| SEC-009 | Run client-boundary and secret scanning checks; prevent server-only imports and credentials in browser bundles. |
| SEC-010 | Run dead-action audit across routes, menus, sheets and buttons; remove or implement every visible action. |

### 13.1 Release proof matrix

| Gate | Required proof |
|---|---|
| Buyer gate | Visitor arrival, search, facility, catalogue, availability, comparison, intent and transaction resume. |
| Seller gate | Onboarding, evidence, facility operations, product/coupon, demand response, scanner, payment confirmation and fulfilment. |
| Trust gate | No claim-by-click, audited outcomes, reason/actor/timestamp/evidence completeness and three-sale confirmation. |
| Money gate | One wallet, FedaPay callback, ledger integrity, no buyer-seller rail and no withdrawal. |
| QR gate | HTTPS camera preview, permission denial, manual fallback, valid, expired, replayed, mismatch and malformed QR. |
| Mobile gate | 320/375/768/1280 px, no horizontal overflow, preserved focus, reachable footer and readable state names. |
| Recovery gate | Empty, timeout, server error, offline, cancellation, duplicate, unauthorized and expired flows. |
| Observability gate | Event definitions, privacy review, production errors, latency and critical funnel visibility. |

## 14. Delivery controls and branching

Each slice is developed on a short-lived implementation branch from `omni-v2-rebuild`, reviewed against this plan, merged only after its gate passes and then tagged with the slice ID. The V2 branch remains isolated from V1 code, database branch, migrations, users and production deployment until the full release gate is approved.

The implementation should use separate commits for contract/data, server authority, UI surfaces, integrations and proof where practical. A slice handoff must include changed feature IDs, migration notes, fixture identities, test commands, known limitations and screenshots or trace evidence for responsive surfaces.

No provider, framework, payment integration, AI service or external data source may be introduced as an implicit product decision. It must be compatible with the PRD and flow authority rules, documented in the relevant slice handoff and tested with a local fallback or recovery path when the capability is marked manual.

## 15. Backlog extraction format

Every implementation task created from this plan must use the following fields:

| Field | Required content |
|---|---|
| Task ID | Slice prefix plus sequential number, for example `V2-CAT-003`. |
| Feature IDs | One or more exact IDs from `v2-feature-list.md`. |
| State contract | The flow state(s) entered, exited or preserved. |
| Actor/authority | Visitor, buyer, seller, admin or server and the authoritative source. |
| Change surface | Data, server, UI, integration, analytics and operations. |
| Acceptance proof | Test, trace, screenshot, audit record or manual runbook. |
| Dependencies | Prior tasks or slice gates that must already pass. |
| Recovery | Empty, error, retry, cancellation, expiry, duplicate or unauthorized behavior. |
| Release notes | Migration, fixture, environment and rollout considerations. |

## 16. Recommended first execution batch

The next implementation batch is V0 only. It should create the clean application kernel, typed state registry, shared sheet primitive, server authority envelope, idempotency/audit foundation and proof harness. It should not implement a fake map, seller dashboard, transaction screen or placeholder backend merely to make the interface appear complete.

When V0 passes, begin V1 with the real MapLibre globe and public discovery. V1 must be visually certified before catalogue or transaction surfaces are added, because the map is the product’s primary scene and the persistent context for every later vertical slice.

## 17. References

[1]: ./v2-flow.md "Omni V2 canonical flow contract"

[2]: ./omni-v2-prd.md "Omni V2 product requirements document"

[3]: ./v2-feature-list.md "Omni V2 complete feature inventory"
