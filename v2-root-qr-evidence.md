# Omni V2 — Root QR Verification Evidence

**Document ID:** `OMNI-V2-ROOT-QR-001`
**Method:** Nature Way — Root System evidence
**Observed:** 2026-08-22
**Status:** `partial`

## Policy proof

The Root operation `verifyQrAttempt` now enforces the protected QR boundary before any persistence mutation. It requires a non-suspended seller actor, a seller transaction membership belonging to that actor, a transaction ID matching the membership and token, an exact token-hash match, a valid verification timestamp before expiry, and an unverified token with zero prior replay count.

The focused Root test covers the authorized first-pass result, buyer-role denial, forged seller denial, non-member denial, transaction mismatch denial, token mismatch, invalid expiry handling, expiry denial and replay denial. The policy returns the next replay count but does not mutate the token record itself.

## Validation result

The repository validation pass reports 8 Vitest files and 31 passing tests, a successful TypeScript/Vite build, successful bundling of 3 Vercel functions and `Client boundary: clean`. The existing chunk-size warning remains informational.

## Critical limitation

This artifact proves policy ordering and actor authorization only. It does not prove an atomic database transition. The eventual persistence operation must update a matching unverified token conditionally inside a transaction or row lock, increment replay state exactly once, append the audit event and return `REPLAYED` for all later/concurrent attempts. No QR token was created or changed during this pass.

## Nature Way decision

QR verification is **partially evidenced**. The pure Root policy is now covered, but the Root gate remains `review` until the atomic Neon mutation, concurrent replay proof, authenticated seller session and recovery states are implemented and verified or assigned as explicit manual work.
