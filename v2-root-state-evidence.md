# Omni V2 — Root Transaction State Evidence

**Document ID:** `OMNI-V2-ROOT-STATE-001`
**Method:** Nature Way — Phase 2, Root System
**Observed:** 2026-08-23
**Status:** `partial`

## Policy proof

The Root operation `authorizeTransactionTransition` now encodes the approved server-authoritative transaction path: intent creation to QR readiness is system-owned; QR verification is seller-owned; payment declaration is buyer-owned; payment confirmation, fulfilment preparation and fulfilment are seller-owned; receipt and rating are buyer-owned; and final closure is system-owned.

The policy requires an authenticated, non-suspended actor with the correct role and a matching transaction membership. It rejects invalid jumps, system-only transitions attempted by an actor, wrong-role actors and missing or forged membership. It returns a typed envelope with the transaction ID, prior state, next state and authorized actor role.

## Validation result

The focused Root tests cover authorized seller and buyer transitions, invalid state jumps, wrong-role membership, missing membership and system-only closure. The full repository pass reports 11 Vitest files and 50 passing tests, a successful TypeScript/Vite build, 3 bundled Vercel functions and `Client boundary: clean`.

## Purchase-intent repository seam

The actual server repository now exposes `createPurchaseIntent`. Its guarded statement requires an existing, non-suspended V2 account linked to the authenticated Neon Auth subject; joins the selected availability response to its buyer-owned request and facility; accepts only `available`, `partial` or `corrected` responses with positive quantity and non-negative price; requires the response facility to remain inside the request scope; and requires a seller-owned facility. It then creates or reuses one purchase intent by buyer/idempotency key, creates the immutable transaction snapshot, adds buyer and seller membership, and appends the initial `intent_created` event with conflict-safe replay behavior.

The local repository seam tests cover eligible intent creation/replay, unavailable or out-of-scope rejection, and idempotency mismatch rejection. The Neon explanation attempt was blocked by a temporary connector-maintenance response, so SQL planning was not claimed from that attempt; TypeScript/build/test validation remains green.

## Critical limitation

This artifact proves the pure state-policy boundary and the local repository seam only. It does not prove that a live Neon mutation reads the current persisted state, locks or conditionally updates the transaction row, appends the canonical transaction event exactly once, or returns the original authoritative result on duplicate/retry. No transaction state was changed during this pass.

## Nature Way decision

Transaction state authority is **partially evidenced**. The pure transition graph and actor policy are now tested, but Root remains `review` until live persistence, event idempotency, concurrency and recovery behavior are proven or explicitly assigned as manual work.
