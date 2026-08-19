# Omni V1 — A–E Certification Crosswalk

**Date:** 2026-08-19  
**Branch:** `main`  
**Certification target:** isolated Omni Staging Neon branch
**Overall status:** `partial` — the sequential staging transaction loop is verified, but live camera decoding and the complete runtime adversarial/concurrency matrix remain outstanding.

## Phase 0 reconciliation result

The existing A–G recovery sequence remains authoritative. Slices A–E were not lost or replaced by the continuation plan. This pass certifies the implemented A–E core against an isolated staging database and records the remaining risks without expanding scope into Slice F or Slice G.

The staging boundary is now provisioned and guarded. The Neon project is **Omni Staging** (`old-unit-98112236`) on branch `br-bitter-forest-a6e6nem5`. The staging buyer and seller Auth fixtures, profiles, facilities, products, coupons, and seller wallet account were created idempotently. The baseline and post-flow invariant queries ran through Neon MCP against the staging branch only.

## Slice crosswalk

| Slice | Current classification | Staging evidence | Remaining proof or blocker |
| --- | --- | --- | --- |
| **A — Map-first discovery and authenticated search replay** | `verified` for the tested staging path; real-device location remains separate | Buyer authenticated, MapLibre globe loaded, seeded product search returned the E2E facility card, approximate-market fallback was used because sandbox GPS was unavailable, and the request was resumed from a notification/deep link. | Real-device location/pin comparison and mobile keyboard/safe-area proof remain outside this run. The MapLibre GL v5 globe projection was not changed. |
| **B — Manual availability** | `verified` for the staging manual path | Buyer created a single-facility request for the seeded seller facility. Database state recorded `mode = manual`, `targeted_count = 1`, and `credit_cost = 0`. Seller answered with server-side price 1,250 XOF and quantity 12. Buyer resumed the response from the notification surface. | Concurrent retry and expiry branches still require dedicated runtime negative tests. |
| **C — Purchase intent, QR, and transaction chat** | `verified` sequentially; `partial` for full L3 runtime coverage | Exactly one purchase intent and one QR transaction were created. The transaction room displayed the step labels, QR state, amount, event timeline, and seller contact boundary. Seller camera authorization was triggered; the sandbox reported no camera, and the manual eight-character fallback successfully verified the QR. | A physical HTTPS mobile device or browser with a real camera is still required to prove live preview and decode. Wrong-actor, expired, malformed, and concurrent QR runtime cases remain to be executed. |
| **D — External payment and fulfilment completion** | `verified` sequentially; `partial` for full L3 runtime coverage | The staging transaction advanced through `qr_verified → payment_pending → paid → fulfillment → rating_pending → completed` using Cash à la livraison. The buyer declared external payment, the seller confirmed it, fulfillment started, the buyer confirmed receipt, and a five-star review completed the transaction. | Runtime duplicate payment, duplicate rating, amount-manipulation, cancellation, and expiry cases remain to be executed after the bounded payment-declaration idempotency fix is deployed. |
| **E — Seller map-first operations** | `verified` for the tested seller surface; `partial` for mobile and live-camera coverage | Seller dashboard opened in map-first mode with Facility, Catalogue, Demandes reçues, Scanner QR, Omni Wallet, Coupons, notifications, and the QR fallback surface. Seller demand response and transaction confirmations were completed from the map-first panel. | Mobile-width certification, live camera lifecycle, and dead-destination audit remain outstanding. |

## Certified staging transaction

The sequential buyer/seller run completed the following path in isolated staging:

> Search → manual single-facility availability → seller response → notification resume → purchase intent → QR generation → seller camera attempt and manual fallback → QR verification → external Cash à la livraison selection → buyer payment declaration → seller payment confirmation → fulfillment → buyer receipt confirmation → five-star rating → `completed`.

The final database audit recorded exactly one transaction, one QR token, twelve transaction events, one review, and one payout ledger entry. The server-calculated amount was 1,250 XOF, the platform fee was 25 XOF, and the expected payout was 1,225 XOF. No QR token, password, database URL, or Auth secret is recorded in this document.

## Adversarial and integrity findings

The source-level adversarial matrix and the passing unit suite confirm the principal ownership and state guards: authenticated access, buyer/facility-owner transaction visibility, facility-scoped QR redemption, QR expiry and replay handling, active intent-key uniqueness, premature-action rejection, server-authoritative amounts, seller ownership for payment and fulfillment, review upsert, and payout idempotency.

One bounded defect was identified: a repeated buyer payment-declaration request previously failed without an explicit idempotent success path after the declaration timestamp had already been set. A source fix now returns `{ ok: true, alreadyDeclared: true }` for an already-declared transaction in a valid downstream state, without recording a duplicate event. The fix passed the full local test suite and production build; a fresh deployed-staging duplicate-request proof is still required.

## Blocking prerequisites and release decision

| Prerequisite | Result | Consequence |
| --- | --- | --- |
| Isolated staging database | **Complete** | Safe guarded staging execution was possible. |
| Staging buyer and seller fixtures | **Complete** | Two-role sequential run was possible. |
| Independent concurrent authenticated contexts | **Not proven** | The run used sequential role switching in one browser origin; full concurrent-context evidence remains open. |
| HTTPS camera-capable device/context | **Not available in sandbox** | Manual fallback is proven; live camera preview/decode is not certified. |
| Runtime adversarial/concurrency matrix | **Partially covered by source/unit evidence** | A `verified` release status is not yet admissible. |
| Post-flow invariants | **Complete** | All seven checks returned zero, including completed-without-review, duplicate active intents, duplicate coupon redemptions, wallet ledger coverage, and snapshot drift. |

The release decision is therefore **`partial`**. The A–E happy-path core is materially certified in isolated staging, but Omni V1 must not yet be described as fully production-ready until the bounded fix is deployed and re-tested, the runtime adversarial matrix is executed, and live camera scanning is proven on a real HTTPS mobile device.
