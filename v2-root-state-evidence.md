# Omni V2 — Root Transaction State Evidence

**Document ID:** `OMNI-V2-ROOT-STATE-001`
**Method:** Nature Way — Phase 2, Root System
**Observed:** 2026-08-23
**Status:** `partial`

## Policy proof

The Root operation `authorizeTransactionTransition` now encodes the approved server-authoritative transaction path: intent creation to QR readiness is system-owned; QR verification is seller-owned; payment declaration is buyer-owned; payment confirmation, fulfilment preparation and fulfilment are seller-owned; receipt and rating are buyer-owned; and final closure is system-owned.

The policy requires an authenticated, non-suspended actor with the correct role and a matching transaction membership. It rejects invalid jumps, system-only transitions attempted by an actor, wrong-role actors and missing or forged membership. It returns a typed envelope with the transaction ID, prior state, next state and authorized actor role.

## Validation result

The focused Root tests cover authorized seller and buyer transitions, invalid state jumps, wrong-role membership, missing membership and system-only closure. The full repository pass reports 11 Vitest files and 68 passing tests, a successful TypeScript/Vite build, 8 bundled Vercel functions and `Client boundary: clean`. Wallet balance and bonus-grant evidence is maintained separately in [`v2-root-wallet-evidence.md`](./v2-root-wallet-evidence.md).

## Purchase-intent repository seam

The actual server repository now exposes `createPurchaseIntent`. Its guarded statement requires an existing, non-suspended V2 account linked to the authenticated Neon Auth subject; joins the selected availability response to its buyer-owned request and facility; accepts only `available`, `partial` or `corrected` responses with positive quantity and non-negative price; requires the response facility to remain inside the request scope; and requires a seller-owned facility. It then creates or reuses one purchase intent by buyer/idempotency key, creates the immutable transaction snapshot, adds buyer and seller membership, and appends the initial `intent_created` event with conflict-safe replay behavior.

The local repository seam tests cover eligible intent creation/replay, unavailable or out-of-scope rejection, and idempotency mismatch rejection. The Neon explanation attempt was blocked by a temporary connector-maintenance response, so SQL planning was not claimed from that attempt; TypeScript/build/test validation remains green.

The serverless HTTP boundary exposes `POST /api/v2/purchase-intents`. It requires a bearer-authenticated subject, a UUID `responseId` and a stable `Idempotency-Key` header or body value, then delegates to the guarded repository operation. The route returns `401 AUTH_REQUIRED` before protected work, `400 INVALID_INPUT` for malformed request data, `201` with the canonical intent result on success, `409 POLICY_REJECTED` for an ineligible or mismatched request, and a redacted retryable `500` for unexpected failures. The current Vercel bundler and dedicated serverless wrappers include this route in the eight-function build surface.

This is an implemented HTTP seam, not live session evidence: no bearer-authenticated intent request or transaction mutation was executed in this pass.

## Transaction state-transition repository seam

The actual server repository now exposes `transitionTransaction`. It resolves the authenticated Neon Auth subject to a non-suspended account, locks the transaction snapshot, requires matching buyer or seller membership, derives the latest persisted event state, allows only the actor-owned transitions in the Root state matrix, inserts the next immutable event with the migration-004 uniqueness boundary, appends a correlation-keyed `v2_audit_events` row in the same SQL operation, and returns the same canonical transition result for an already-applied retry. System-owned transitions remain excluded from actor calls.

Focused repository tests cover an authorized seller transition, stale or unauthorized rejection, canonical retry response and the transaction/audit conflict boundaries. This is a local repository seam only: no live transaction state, event row, audit row or authenticated actor was changed in this pass, and the disposable branch was not used for this test.

## Transaction state-transition HTTP seam

The authenticated `POST /api/v2/transaction-transitions` route now delegates to `transitionTransaction` through a dedicated Vercel wrapper. It requires a bearer-authenticated subject, a UUID transaction ID, `from` and `to` values from the locked `TransactionState` union, and an explicit `buyer` or `seller` actor role. The server generates the correlation ID and timestamp; callers cannot select system-owned transitions because the repository policy remains authoritative. Invalid route input returns `400 INVALID_INPUT`, missing authentication returns `401 AUTH_REQUIRED`, policy rejection maps to a non-retryable `409 POLICY_REJECTED`, and unexpected failures remain behind the redacted recoverable error envelope. This is an HTTP/build seam only, not evidence of a live authenticated mutation.

## Critical limitation

This artifact proves the pure state-policy boundary and the local repository seam only. It does not prove that a live Neon mutation reads the current persisted state, locks or conditionally updates the transaction row, appends the canonical transaction event exactly once, or returns the original authoritative result on duplicate/retry. No transaction state was changed during this pass.

## Nature Way decision

Transaction state authority is **partially evidenced**. The pure transition graph and actor policy are now tested, but Root remains `review` until live persistence, event idempotency, concurrency and recovery behavior are proven or explicitly assigned as manual work.
