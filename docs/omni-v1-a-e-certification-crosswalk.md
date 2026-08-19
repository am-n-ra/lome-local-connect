# Omni V1 — A–E Certification Crosswalk

**Date:** 2026-08-19  
**Branch:** `main`  
**Certified source commit:** `02910b1`
**Production deployment:** `dpl_BetrRfbm1aLAsE9LqLvcTBNZdmUJ` (`READY`)
**Certification target:** isolated Omni Staging Neon branch
**Overall status:** `partial` — the A–E transaction core, duplicate-payment idempotency, adversarial authorization probes, and concurrent duplicate-intent protection are verified in staging; live camera decode and one concurrent QR replay remain unproven.

## Phase 0 reconciliation result

The existing A–G recovery sequence remains authoritative. Slices A–E were not lost or replaced by the continuation plan. This pass certifies the implemented A–E core against an isolated staging database and records the remaining risks without expanding scope into Slice F or Slice G.

The staging boundary is provisioned and guarded. The Neon project is **Omni Staging** (`old-unit-98112236`) on branch `br-bitter-forest-a6e6nem5`. The buyer and seller Auth fixtures, profiles, facilities, products, coupons, and seller wallet account were created idempotently. All staging mutations and read-only assertions were executed against this branch only. No production database URL or credential is recorded in this document.

## Slice crosswalk

| Slice | Current classification | Staging evidence | Remaining proof or blocker |
| --- | --- | --- | --- |
| **A — Map-first discovery and authenticated search replay** | `verified` for the tested staging path; real-device location remains separate | Buyer authentication, MapLibre globe loading, seeded product search, facility-card discovery, approximate-market fallback, notification resume, and direct transaction-room recovery were exercised. The MapLibre GL v5 globe projection was not changed. | Real-device location/pin comparison and mobile keyboard/safe-area proof remain outside this certification slice. |
| **B — Manual availability** | `verified` for the tested manual path | Buyer created a single-facility request; the database recorded manual scope with zero bulk credit cost. The seller answered with server-authoritative price 1,250 XOF and quantity 12, and the buyer resumed the response from notification/deep-link context. | Dedicated concurrent availability retry and expiry branches remain outside the verified claim. |
| **C — Purchase intent, QR, and transaction chat** | `verified` sequentially; `partial` for full L3 runtime coverage | The certified room displayed the transaction state labels, QR state, server amount, event timeline, seller-contact boundary, and transaction chat. Seller camera authorization was attempted; the sandbox correctly exposed manual fallback and the fallback QR verification succeeded. A separate concurrent duplicate-intent probe sent two identical requests and both returned the same transaction ID; the database recorded one active matching transaction and zero duplicate active-key groups. | A physical HTTPS mobile device or browser with a real camera is still required to prove live preview and decode. A dedicated concurrent QR-verification replay remains open. |
| **D — External payment and fulfilment completion** | `verified` for the fresh sequential loop and duplicate-payment proof; `partial` for the remaining concurrency matrix | The fresh transaction advanced through `qr_verified → payment_pending → paid → fulfillment → rating_pending → completed` using Cash à la livraison. Two identical buyer payment declarations produced exactly one `payment_declared` event. The completed transaction retained server amount 1,250 XOF, one review, one completion event, and one payout ledger entry. A repeated rating RPC was rejected after completion. | Cancellation and expiry branches are not part of this run. One concurrent QR replay remains open. |
| **E — Seller map-first operations** | `verified` for the tested seller surface; `partial` for mobile and live-camera coverage | The seller dashboard opened in map-first mode with Facility, Catalogue, Demandes reçues, Scanner QR, Omni Wallet, Coupons, notifications, and the QR fallback surface. Seller demand response, QR verification, payment confirmation, fulfillment, and final transaction notification were exercised in staging. | Mobile-width certification, live camera lifecycle, and a complete dead-destination audit remain outstanding. |

## Certified staging transaction

The fresh sequential buyer/seller run completed the following path in isolated staging:

> Search → manual single-facility availability → seller response → notification resume → purchase intent → QR generation → seller camera attempt and manual fallback → QR verification → external Cash à la livraison selection → buyer payment declaration twice → seller payment confirmation → fulfillment → buyer receipt confirmation → five-star rating → `completed`.

The final audit of the certified transaction recorded exactly twelve transaction events, one review, one payout ledger entry, one completion event, and one `payment_declared` event. The server-calculated amount was 1,250 XOF; the source and staging assertions retain server authority over the amount. No QR token, password, database URL, or Auth secret is recorded in this document.

## Adversarial and integrity findings

The runtime matrix produced an explicit `UNAUTHORIZED` result for anonymous timeline access. A wrong non-owner seller could not read the fresh transaction and received `Transaction introuvable.`. A malformed QR token failed input validation, and an unknown well-formed QR token did not disclose a transaction. A repeated buyer rating after completion was rejected before any additional review, completion event, or payout could be created. The final database assertion recorded one review, one payout ledger entry, one completion event, and one payment-declaration event.

A bounded defect was identified and fixed in `src/lib/checkout.functions.ts`: the buyer payment-declaration update now includes `AND buyer_payment_declared_at IS NULL`, while the existing idempotent return path handles the second request. This makes the timestamp transition atomic under sequential and concurrent retries and prevents duplicate `payment_declared` events. The fix is committed in `02910b1`, passed 64/64 local tests, passed the production build and client-boundary check, and is deployed in the READY production deployment listed above.

The concurrent duplicate-intent probe sent two simultaneous requests using the same fresh availability response. Both returned the same transaction identifier with status `qr_generated` and amount 1,250 XOF. The staging assertion recorded one matching active transaction, one distinct ID, and zero duplicate active intent-key groups. The post-probe seven-invariant check also returned zero for every invariant.

## Runtime and release prerequisites

| Prerequisite | Result | Consequence |
| --- | --- | --- |
| Isolated staging database | **Complete** | Safe guarded staging execution was possible. |
| Buyer and seller staging fixtures | **Complete** | Two-role sequential and adversarial runs were possible. |
| Independent-context recovery | **Complete for buyer transaction room** | After sign-out and local app restart, the buyer re-authenticated and restored the room through the supported `transactionId` route. |
| Runtime authorization probes | **Complete for exercised cases** | Anonymous access, wrong seller read, wrong seller mutation rejection, malformed QR, unknown QR, duplicate rating, and concurrent duplicate intent were exercised. |
| HTTPS camera-capable device/context | **Not available in sandbox** | Camera permission/unavailable state and manual fallback are proven; live camera preview/decode is not certified. |
| Concurrent QR-verification replay | **Not proven** | Source and unit evidence pass, but a dedicated runtime fan-out remains required for a `verified` release. |
| Post-flow and post-concurrency invariants | **Complete** | All seven checks returned zero, including duplicate active intents, duplicate coupon redemptions, wallet ledger coverage, and wallet snapshot drift. |
| Production deployment and observability | **Complete for current deployment window** | Commit `02910b1` is READY in production, and Vercel reported no runtime error clusters in the selected 24-hour window. |

The release decision is therefore **`partial`**. Omni V1 must not yet be described as fully production-ready until a real HTTPS mobile camera decode is proven and the concurrent QR-verification replay is recorded. The bounded duplicate-payment idempotency defect itself is fixed, tested, staged, and deployed.
