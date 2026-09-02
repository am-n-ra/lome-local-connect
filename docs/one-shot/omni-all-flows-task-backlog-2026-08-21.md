# Omni All V1 Flows — Ordered Task Backlog

## Delivery rules

Tasks are ordered by dependency and risk. Each task must leave the repository in a compiling state, preserve the MapLibre globe and use existing route/server conventions. Do not combine unrelated UI redesign with a transaction authority change. Each task has a testable acceptance evidence requirement. Proof harnesses, secrets and staging credentials remain outside the repository.

## MAPALL-001 — Reconcile scope and route ownership

**Goal:** Make §0.8.4 and `omni-catalog.md` the canonical inventory. Identify every active route/component that duplicates map, dock, sheet, chat, transaction, seller, wallet or admin responsibilities.

**Acceptance:** No active route has two competing owners for a core surface; all deferred features are absent as actionable placeholders; divergence ledger records unresolved legacy surfaces.

**Risk:** Historical components can remain imported through a hidden path.

## MAPALL-002 — Create one typed flow adapter index

**Goal:** Add a typed index for discovery, facility, catalogue, availability, intent, transaction/chat, QR, verification, wallet and notifications.

**Acceptance:** Client-boundary check passes; no screen imports server-only modules; every active surface consumes an adapter or server function with a typed return.

## MAPALL-003 — Complete facility-card and catalogue contract

**Goal:** Finish the buyer sequence `result card → facility detail → catalogue → selected product`.

**Acceptance:** Card click only selects; catalogue loads real products; matched product first; product ID is preserved; empty/sold-out/error/retry branches work; no claim or availability mutation occurs from selection.

## MAPALL-004 — Complete availability selection contract

**Goal:** Make `Vérifier la disponibilité` always start from a selected catalogue product when one exists.

**Acceptance:** Four named stages render; Free single-facility and Pro bulk are server-gated; quantity/budget remain editable/camera-inert; stale/unclaimed/product mismatch is rejected server-side; comparison orders responses deterministically.

## MAPALL-005 — Converge purchase intent

**Goal:** Make one intent action create/reopen one idempotent transaction context.

**Acceptance:** Server recalculates price/offer/coupon; stale responses recover to comparison; replay returns the same transaction; contact/itinerary/chat/QR fields are absent before authorization and present only after success.

## MAPALL-006 — Converge transaction room shell

**Goal:** Make `CleanTransactionRoom` the sole canonical buyer/seller transaction surface.

**Acceptance:** Product/facility/amount/coupon/next action/status/progress/timeline all appear; closing and reopening preserves the server state; generic `ChatPanel` cannot display private transaction content outside authorization.

## MAPALL-007 — Implement transaction-scoped chat

**Goal:** Complete read/send/retry/error/unread behavior within the authorized room.

**Acceptance:** Unauthorized participants cannot read/write; message sends are idempotent; network failure preserves draft; system messages are generated from persisted events; no social/global inbox path is introduced.

## MAPALL-008 — Certify transaction progress machine

**Goal:** Align labels, status values, progress steps and actor actions across buyer and seller.

**Acceptance:** `intent → offer → QR → verified → payment method → declared → seller confirmed → fulfilment → received → rating → completed` has no skipped or contradictory labels; each status has one primary action and a terminal/read-only state.

## MAPALL-009 — Complete QR verification surface

**Goal:** Make the seller scanner ready-to-scan with visible camera preview and manual fallback.

**Acceptance:** Permission, live preview, detection, no camera, denied, malformed, expired, replay, wrong transaction, network timeout and success states are visible; camera/manual use the same server verifier; production-safe replay evidence is recorded externally.

## MAPALL-010 — External payment/fulfilment branch

**Goal:** Separate buyer declaration, seller confirmation, seller fulfilment and buyer receipt.

**Acceptance:** Cash/TMoney/Flooz/other methods are explicit; buyer cannot move directly to paid; seller confirmation is audited; delivery/pickup failure recovers; receipt precedes rating; no in-app buyer-seller payment exists.

## MAPALL-011 — Seller request and operational workspace

**Goal:** Make incoming demand, response correction, product allocation, hours/open state and facility operations coherent on the map-first seller route.

**Acceptance:** Seller sees only authorized requests; auto-response correction is explicit; allocation does not consume on simple check; product stock bounds are enforced; next action is visible at each state.

## MAPALL-012 — Verification request and review completion

**Goal:** Complete unclaimed → request/evidence → admin review → certified/unconfirmed/rejected without bypass paths.

**Acceptance:** Claim click never changes status; request is idempotent; evidence drafts resume; admin sees evidence and reason; generic direct status mutation cannot create a certified/unconfirmed facility; audit event exists for every outcome.

## MAPALL-013 — Coupon/offer truth in product and transaction

**Goal:** Ensure product creation and intent use one server-calculated offer/coupon snapshot.

**Acceptance:** Active offer or honest no-offer state appears; coupon is attached atomically to intent/transaction; redemption is consumed once; client cannot invent discount; product discount constraint remains enforced.

## MAPALL-014 — Omni Wallet and recharge

**Goal:** Converge one wallet explanation, FedaPay recharge and platform-only spend.

**Acceptance:** Pending/confirmed/available states are distinct; FedaPay is recharge-only; platform credits are separate from transaction amount; seller withdrawal controls are absent; failure/timeout/reconciliation branches are visible.

## MAPALL-015 — Menu, notifications and context restoration

**Goal:** Deep-link every functional transactional action while preserving map/product/transaction context.

**Acceptance:** Notifications point to authorized objects; menu has no dead rows; auth and role switches restore supported context; expired context falls back honestly; sign-out clears private state.

## MAPALL-016 — PWA and responsive surface certification

**Goal:** Make the web-first mobile experience safe-area and keyboard robust.

**Acceptance:** 320/390/768/1024/1280 px have no horizontal overflow or collisions; sheets close/back correctly; dock clearance is measured; camera preview area is visible; keyboard does not zoom/reposition the map unexpectedly; reduced motion works.

## MAPALL-017 — State and contract tests

**Goal:** Add focused tests for each pure state machine and adapter contract.

**Acceptance:** Tests cover success, timeout, cancel, retry, replay, expired, unauthorized, stale payload, no camera, no results, unclaimed and wallet pending branches.

## MAPALL-018 — Authenticated buyer/seller E2E

**Goal:** Execute the full flow with safe fixtures.

**Acceptance:** Buyer completes discovery → catalogue → availability → intent → room; seller verifies QR, confirms payment, fulfils; buyer confirms receipt/rates; records and audit events are present. No secret or fixture credential is committed.

## MAPALL-019 — Device camera/QR proof

**Goal:** Certify the real HTTPS camera branch.

**Acceptance:** Permission prompt, live preview, decode, valid verification, replay rejection and manual fallback are recorded on a camera-capable device/browser.

## MAPALL-020 — Release clearance and handoff

**Goal:** Update master, locked inventory, handoff and divergence ledger with exact evidence.

**Acceptance:** Production deployment is READY; public smoke passes; local validation summary is recorded; every unproven external gate remains marked partial; no production-ready claim is made prematurely.

## Explicit deferrals

Do not implement seller withdrawals, buyer-seller in-app payments, generic social chat, AI agents before manual proof, native mobile, offline real-time transaction completion, unrestricted world prepopulation, 3D/media discovery or future advertising automation in this backlog.
