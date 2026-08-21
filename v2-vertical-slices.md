# Omni V2 — Vertical Slice Backlog

**Version:** 1.0.0 · **Derived from:** [`v2-master.md`](./v2-master.md), [`v2-flow.md`](./v2-flow.md), [`v2-product-interface-architecture.md`](./v2-product-interface-architecture.md) and [`v2-data-schema.md`](./v2-data-schema.md)

> Every ticket below is an end-to-end slice. It owns its data/migration work, server/API contract, UI surface, authorization/business rules, automated tests and proof. Do not execute all frontend first or all backend first.

## 1. Slice selection rule

Choose the next slice by core-loop value, risk reduction and dependency readiness. Start with the highest-risk observable buyer loop while keeping the app runnable. Before implementation, create a focused prompt containing the relevant master excerpt, exact states, architecture seam, data rules, acceptance matrix and stopping condition.

A slice is not complete because its UI renders or its build passes. It is complete only when its user-visible path works, its authority boundary is enforced, its failure/retry paths are covered and the required proof is recorded.

## 2. Ordered backlog

| ID | Slice | Priority | Depends on | Outcome |
|---|---|---:|---|---|
| S0 | V2 foundation and contract seams | P0 | None | Runnable app, migration ledger, typed adapter boundary and test harness. |
| S1 | Buyer globe, location and visible-bounds discovery | P0 | S0 | Visitor can see the globe, search and discover source-backed facilities. |
| S2 | Facility detail and catalogue-first selection | P0 | S1 | Visitor can inspect a facility and select a real product. |
| S3 | Availability request and comparison | P0 | S2 | Buyer can check a product and compare honest responses. |
| S4 | Seller verification and admin review | P0 | S0/S1 | Seller request/evidence and audited facility outcomes work. |
| S5 | Seller map-first workspace and catalogue operations | P0 | S4 | Eligible seller can manage facilities, products, stock allocation and coupons. |
| S6 | Purchase intent and resumable transaction room | P0 | S3/S5 | Eligible buyer response creates one authorized transaction context. |
| S7 | QR verification and external payment/fulfilment | P0 | S6/S5 | Seller verifies QR and both parties complete external payment/fulfilment. |
| S8 | Omni Wallet, notifications and PWA hardening | P1 | S6/S7 | Recharge, platform spending, resume notifications and mobile proof work. |
| S9 | Production certification and operational hardening | P0 | S1–S8 | Risk-based release proof and explicit release state. |

## 3. Slice specifications

### S0 — V2 foundation and contract seams

**User-visible outcome:** The V2 app boots on the isolated branch with a stable root, map-ready layout seam, typed mock adapters, no V1 providers/routes and a migration/test foundation.

**Data and migration:** Create V2 migration ledger and shared database prerequisites only. Do not create V1 application tables or copy V1 data. Add deterministic development fixture strategy without production credentials.

**Server/API:** Add typed health/config boundary and mock discovery/catalogue adapter interfaces. Server-only imports and secrets remain outside browser bundles.

**UI:** Replace placeholder with a neutral map-first shell seam: persistent scene container, chrome/dock/sheet primitives and empty/loading/error slots. Do not implement product behavior yet.

**Rules:** Root must remain runnable; client boundary check must pass; V1 routes, components and migration history are not dependencies.

**Tests/proof:** Build, type check, client-boundary check, migration apply/rollback smoke, adapter contract test and root route smoke.

**Done when:** The app can start, build and render the V2 shell with no V1 imports and the next slice can add one feature without refactoring the foundation.

**Stop if:** The architecture requires restoring V1 providers or an unresolved auth/database decision blocks the boundary.

### S1 — Buyer globe, location and visible-bounds discovery

**User-visible outcome:** A visitor sees the real rotating globe, can search without camera movement while typing, can discover source-backed facilities in the visible bounds and can select a result.

**Data and migration:** Create facilities/source lineage, geometry/indexes, coverage tiles/import status and safe public projections. Add only the minimum source fields required for pins/cards.

**Server/API:** Implement `listFacilitiesInBounds` and `getFacility` with bbox, zoom, filters, clustering and source/error distinction. Enforce Free/Pro scope at the server boundary where already decided; leave unresolved limits in the master.

**UI:** Implement MapLibre globe, idle horizontal rotation, location states, dock search/options, search submit, result rail/cards, clusters, source-backed pins, selection and public facility sheet shell.

**Rules:** Manual interaction outranks animation; no automatic arrival zoom; no fabricated pin; public facility does not imply supply or claim; no private fields.

**Tests/proof:** Map/search state unit tests, bbox query contract, cluster ordering, location exact/approximate/fallback tests, public route smoke and browser proof at 320/375/768/1280px.

**Done when:** Visitor completes `idle_globe → search_submitting → search_reveal → results_visible → facility_selected` and can return to results without context loss.

**Stop if:** MapLibre behavior, location permission semantics or source adapter authority cannot be demonstrated with a safe fixture.

### S2 — Facility detail and catalogue-first selection

**User-visible outcome:** A selected facility opens public detail and its active catalogue; the buyer selects a matched product without creating availability or purchase intent.

**Data and migration:** Create products/media/public catalogue projection, product status and stock/Omni allocation fields needed for display. Do not add coupon policy beyond a safe display seam if the exact decision remains open.

**Server/API:** Implement `listFacilityProducts`, product eligibility and safe media references. Preserve product IDs and hide private data.

**UI:** Implement facility sheet actions, catalogue sheet, matched-product-first ordering, media, price/offer state, quantity eligibility, selected state, empty/sold-out/error/retry states.

**Rules:** Existing catalogue product beats fallback free text; selection returns typed `ProductSelection`; selection does not create demand or reserve stock.

**Tests/proof:** Product ordering, selection contract, empty/sold-out/error recovery, media fallback, no-demand/no-reservation assertion and browser click-through.

**Done when:** `facility_selected → catalogue_loading → catalogue_ready → product_selected` works and back/close restores map and results.

**Stop if:** Product authority, media storage or stock allocation semantics require an unresolved schema decision.

### S3 — Availability request and comparison

**User-visible outcome:** A buyer moves through `Produit → Portée → Contraintes → Réponses`, requests availability and sees honest comparison results.

**Data and migration:** Create availability requests/responses, entitlement snapshot, idempotency and freshness fields. Add indexes for visible scope and response ordering.

**Server/API:** Implement request creation, Free one-facility scope, bounded Pro scope where decided, response listing and seller/approved-auto response contract. A request never reserves stock.

**UI:** Implement four-stage availability sheet, editable quantity and unlimited budget, scope explanation, loading/error/empty/retry states and comparison cards ordered available/partial/unavailable/price.

**Rules:** Product selection is catalogue-first; response CTA is eligibility-gated; contact/itinerary remain locked; duplicate request returns existing context.

**Tests/proof:** State machine tests, entitlement tests, idempotency, no-reservation database assertion, response ordering, timeout/empty recovery and authenticated buyer proof.

**Done when:** A real selected product produces one availability request and a comparison state with no dead end.

**Stop if:** Free/Pro limits or auto-response authority cannot be decided without a master patch.

### S4 — Seller verification and admin review

**User-visible outcome:** A seller can start/resume evidence for an unclaimed or newly created facility, submit it, and an admin can produce an audited outcome.

**Data and migration:** Create companies, verification requests, evidence references, review outcomes and audit records. Store evidence metadata safely; exact document retention remains an open decision.

**Server/API:** Implement create/save/submit verification, admin pending queue and `reviewVerification` with role checks, reason, actor, idempotency and current-state guard.

**UI:** Implement seller onboarding education, evidence draft/submission, status tracker, admin review queue, evidence context and explicit certified/unconfirmed/rejected actions.

**Rules:** Claim click creates a request only; only audited review changes status; channel join is optional; rejected does not silently become operational.

**Tests/proof:** Role and authorization tests, direct status bypass rejection, draft persistence, duplicate submit, audit completeness, browser seller/admin proof.

**Done when:** `unclaimed → verification_requested → evidence_draft → evidence_submitted → admin_review → certified|unconfirmed|rejected` is proven.

**Stop if:** Evidence policy/retention or admin identity cannot be made safe and explicit.

### S5 — Seller map-first workspace and catalogue operations

**User-visible outcome:** An eligible seller sees owned facilities on a map and can publish a valid product, allocate stock to Omni, create an honest coupon/offer and respond to requests.

**Data and migration:** Add product stock/Omni allocation, coupon offer/redemption snapshot, facility operational state and seller request projections. Add constraints for allocation ≤ stock and product ownership.

**Server/API:** Implement `upsertProduct`, coupon creation/association, seller request list and `respondAvailability`; enforce facility eligibility, stock, offer and freshness rules.

**UI:** Implement seller map workspace, facility operations, guided product/coupon form, product list, demand queue and response controls. No dead menu actions.

**Rules:** Product must show active offer or `Aucune remise active`; client cannot fabricate discount state; auto-response corrections are explicit/audited; unconfirmed/confirmed policy is visible.

**Tests/proof:** Stock allocation constraint, coupon eligibility, product publication, request ownership, response correction and responsive seller browser proof.

**Done when:** Seller can go from owned facility to published valid product to availability response without leaving the map-first workspace.

**Stop if:** Coupon stacking, exact Pro eligibility or three-sale qualification is needed to complete the slice without a decision patch.

### S6 — Purchase intent and resumable transaction room

**User-visible outcome:** An eligible buyer response creates exactly one authorized transaction room with a canonical timeline and resume bar.

**Data and migration:** Create transactions, immutable snapshots, participants, event log, idempotency keys, authorization projections and notifications/resume references.

**Server/API:** Implement `createPurchaseIntent`, transaction read projection, authorized message/event surface and resume/deep-link contract.

**UI:** Implement intent CTA, intent loading/error/expired states, transaction room, timeline, actor-specific next action, authorized chat and close/resume behavior.

**Rules:** Only eligible response can create intent; contact, itinerary, private chat and seller-sensitive data unlock at intent; client text cannot advance state.

**Tests/proof:** Intent duplicate/concurrency test, snapshot immutability, authorization projection test, resume/deep-link browser proof and actor matrix.

**Done when:** `comparison_ready → response_selected → intent_submitting → transaction_created` works and closing/reopening preserves state.

**Stop if:** Transaction snapshot fields, participant authorization or message scope remains ambiguous.

### S7 — QR verification and external payment/fulfilment

**User-visible outcome:** Buyer receives an expiring QR; seller sees live camera/manual fallback, verifies it safely and both parties complete external payment declaration, fulfilment, receipt and rating.

**Data and migration:** Create QR, redemption, payment method/declaration, fulfilment, receipt/rating fields and unique event constraints.

**Server/API:** Implement QR generation/redeem, expiry/replay/mismatch outcomes, external payment declaration, seller confirmation, fulfilment, receipt/rating transitions.

**UI:** Implement buyer QR room, seller scanner with permission/preview/manual states, actor-specific transaction actions and terminal rating.

**Rules:** QR server-bound and replay-safe; camera permission from user gesture; BarcodeDetector absence does not hide preview; no in-app payment; buyer declaration does not equal seller receipt; no seller withdrawal.

**Tests/proof:** QR expiry/replay/mismatch, duplicate redemption, camera lifecycle/unit tests, real HTTPS device/browser preview proof, authenticated buyer/seller transaction E2E and event convergence.

**Done when:** Safe fixture completes `qr_generated → seller_verified → payment_declared → payment_received → fulfilment_pending_buyer → receipt_confirmed → rating_published → transaction_completed`.

**Stop if:** Authorized seller fixture, camera-capable HTTPS context or external payment policy is unavailable; mark proof blocked rather than weakening the contract.

### S8 — Omni Wallet, notifications and PWA hardening

**User-visible outcome:** A user recharges one Omni Wallet via FedaPay, sees pending/available/failed states, spends only on platform features and resumes transactional contexts from notifications on mobile.

**Data and migration:** Create wallet ledger, provider references, notification/read state and consent-aware analytics events. Keep exact bucket priorities open until decided.

**Server/API:** Implement recharge intent, server callback reconciliation, idempotent platform spend, notification deep links and safe analytics event ingestion.

**UI:** Implement wallet surface, pending/available/failed states, eligible platform spend, notifications, resume bar and PWA install/offline messaging.

**Rules:** One wallet; FedaPay recharge only; pending not spendable; wallet is not buyer-seller payment; no withdrawal; sensitive event payloads excluded.

**Tests/proof:** Ledger/reconciliation tests, pending-not-spendable assertion, notification authorization, consent/redaction tests and mobile/PWA viewport proof.

**Done when:** Recharge callback converges to available wallet state and a user can resume an incomplete transaction from a notification.

**Stop if:** Wallet bucket semantics, FedaPay callback contract or notification retention is unresolved.

### S9 — Production certification and operational hardening

**User-visible outcome:** The validated V2 core loop is release-ready with documented residual risks and rollback path.

**Data/server/UI:** No broad new feature. Harden indexes, rate limits, observability, audit retention, source adapters, error pages, accessibility and safe fixture lifecycle.

**Proof:** Run unit/integration, build/client-boundary, public smoke, authenticated buyer/seller, real camera, QR replay, wallet reconciliation, responsive and safe production E2E proofs.

**Rules:** Release outcome is exactly `verified`, `partial`, `blocked` or `needs-decision`; a successful build alone is insufficient.

**Done when:** Every P0 acceptance item has admissible proof, residual risks are recorded, and V1 remains untouched.

## 4. Per-slice implementation packet

Before each slice, create a focused prompt containing:

| Required section | Content |
|---|---|
| Master excerpt | Relevant scope, invariants and non-goals. |
| Flow states | Exact start, success, failure, retry, cancel, duplicate and terminal states. |
| Architecture seam | Owned entities, server adapter/API, UI surface and test location. |
| Data rules | Constraint, server check, UI feedback and concurrency behavior. |
| Allowed files | Exact V2 files/directories the slice may add or change. |
| Acceptance matrix | User click-through, automated tests and proof evidence. |
| Stopping condition | What blocks the slice and requires a master patch or external dependency. |

## 5. Definition of done for every slice

A slice is done only if the implementation is runnable, the end-to-end user-visible path works, business rules are enforced outside the UI, authorization is tested, duplicate/error/retry paths are covered, the app remains buildable, and proof artifacts identify environment, fixture, command, result and known limitations.
