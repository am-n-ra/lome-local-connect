# Omni V2 — Root QR Verification Evidence

**Document ID:** `OMNI-V2-ROOT-QR-001`
**Method:** Nature Way — Root System evidence
**Observed:** 2026-08-23
**Status:** `partial`

## Policy proof

The Root operation `verifyQrAttempt` now enforces the protected QR boundary before any persistence mutation. It requires a non-suspended seller actor, a seller transaction membership belonging to that actor, a transaction ID matching the membership and token, an exact token-hash match, a valid verification timestamp before expiry, and an unverified token with zero prior replay count.

The focused Root test covers the authorized first-pass result, buyer-role denial, forged seller denial, non-member denial, transaction mismatch denial, token mismatch, invalid expiry handling, expiry denial and replay denial. The policy returns the next replay count but does not mutate the token record itself.

## Validation result

The repository validation pass reports 11 Vitest files and 45 passing tests, a successful TypeScript/Vite build, successful bundling of 3 Vercel functions and `Client boundary: clean`. The existing chunk-size warning remains informational.

## Critical limitation

This artifact proves policy ordering and actor authorization only. It does not prove an atomic database transition. The eventual persistence operation must update a matching unverified token conditionally inside a transaction or row lock, increment replay state exactly once, append the audit event and return `REPLAYED` for all later/concurrent attempts. No QR token was created or changed during this pass.

## Current disposable-branch boundary

On 2026-08-23 the disposable branch `br-broad-wildflower-amw7k0om` was read-only inspected and remained available. Its previously recorded single-transaction QR fixture still has `verified=true` and `replay_count=1`. No new mutation was performed during this inspection. The available Neon connector provides a single SQL invocation at a time in this environment; it does not provide a safe concurrent-session runner, so a simultaneous two-caller result was not attempted or inferred from the sequential evidence.

## Nature Way decision

QR verification is **partially evidenced**. The pure Root policy and isolated sequential database result are covered, but the Root gate remains `review` until the atomic Neon mutation is wired to a live writer, concurrent replay is proven, an authenticated seller session is available and recovery states are verified or assigned as explicit manual work.
