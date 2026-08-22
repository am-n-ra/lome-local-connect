# Omni V2 — Root Transaction State Evidence

**Document ID:** `OMNI-V2-ROOT-STATE-001`
**Method:** Nature Way — Phase 2, Root System
**Observed:** 2026-08-22
**Status:** `partial`

## Policy proof

The Root operation `authorizeTransactionTransition` now encodes the approved server-authoritative transaction path: intent creation to QR readiness is system-owned; QR verification is seller-owned; payment declaration is buyer-owned; payment confirmation, fulfilment preparation and fulfilment are seller-owned; receipt and rating are buyer-owned; and final closure is system-owned.

The policy requires an authenticated, non-suspended actor with the correct role and a matching transaction membership. It rejects invalid jumps, system-only transitions attempted by an actor, wrong-role actors and missing or forged membership. It returns a typed envelope with the transaction ID, prior state, next state and authorized actor role.

## Validation result

The focused Root tests cover authorized seller and buyer transitions, invalid state jumps, wrong-role membership, missing membership and system-only closure. The full repository pass reports 9 Vitest files and 34 passing tests, a successful TypeScript/Vite build, 3 bundled Vercel functions and `Client boundary: clean`.

## Critical limitation

This artifact proves the pure state-policy boundary only. It does not prove that a live Neon mutation reads the current persisted state, locks or conditionally updates the transaction row, appends the canonical transaction event exactly once, or returns the original authoritative result on duplicate/retry. No transaction state was changed during this pass.

## Nature Way decision

Transaction state authority is **partially evidenced**. The pure transition graph and actor policy are now tested, but Root remains `review` until live persistence, event idempotency, concurrency and recovery behavior are proven or explicitly assigned as manual work.
