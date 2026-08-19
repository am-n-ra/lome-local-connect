# Omni V1 — A–E Certification Crosswalk

**Date:** 2026-08-19  
**Branch:** `main`  
**Commit:** `cc043ae`  
**Overall slice status:** `blocked` for execution of staging certification; production core remains `partial`.

## Phase 0 reconciliation result

The existing A–G recovery sequence remains authoritative. Slices A–E were not lost or replaced by the continuation plan. The current task is a cross-slice certification pass over the implemented A–E core; Slice F (Omni Wallet/FedaPay sandbox) and Slice G (onboarding/PWA/notifications/data governance) remain separate lanes.

The repository is on `main` at `cc043ae`, matching `origin/main`. Tracked changes are absent. Pre-existing untracked local artifacts remain under `.vercel/` and several audit/refactor scripts; they were not included in the certified commits and were not modified by this reconciliation. The required authoritative contracts, Slice A acceptance matrix, transaction certification plan, and E2E operator README are present.

The Vercel deployment inventory contains READY deployments with `target=production` only. No distinct preview/staging target was proven. The local environment has a `DATABASE_URL`, but no staging markers or guarded staging fixture variables were present: `OMNI_E2E_TARGET`, `OMNI_E2E_ALLOW_MUTATION`, `OMNI_E2E_SELLER_ID`, `OMNI_E2E_BUYER_ID`, and `OMNI_E2E_RUN_ID` are not configured. The current `DATABASE_URL` must therefore be treated as production-bound and must not be used for E2E mutation.

## Slice crosswalk

| Slice | Current classification | Evidence already recorded | Remaining proof or blocker |
| --- | --- | --- | --- |
| **A — Map-first discovery and authenticated search replay** | `partial` | MapLibre globe, truthful location states, visible-bounds discovery, OSM/unclaimed results, search submission, result selection, reversible return, and approximate-location fallback were observed. | Real-device location/pin comparison and mobile keyboard/safe-area proof remain unrecorded. No map redesign is authorized. |
| **B — Manual availability** | `verified` for the bounded manual production path; staging retry proof `untested` | Three-step single-facility flow, seller response, response resume, Free/Pro boundary, and no manual Pro-gate regression were proven. | Staging ownership/privacy, expiry, and sequential/concurrent retry evidence remain unrecorded. |
| **C — Purchase intent, QR, and transaction chat** | `partial` | Notification-driven response resume, one intent, atomic QR, transaction room, contact boundary, manual fallback, seller QR verification, and replay idempotency were proven sequentially. | Independent buyer/seller contexts, real camera decode, wrong-actor/expired/malformed QR, concurrent intent/scan retries, and complete chat authorization proof are unavailable. |
| **D — External payment and fulfilment completion** | `partial` | External payment preference, buyer declaration, seller confirmation, fulfilment, receipt, rating, completion, one review, and one payout ledger entry were proven sequentially. | Staging wrong-role/premature actions, duplicate payment/rating retries, stale amount manipulation, cancellation/expiry branches, and independent reload/resume proof remain untested. |
| **E — Seller map-first operations** | `partial` | Seller map-first shell, facility/demand/catalogue/coupon/scanner/wallet surfaces, onboarding, notifications, and V1 navigation cleanup exist. | Independent two-role browser proof, mobile-width certification, camera lifecycle, isolated product/coupon mutation proof, and dead-destination audit remain unrecorded. |

## Blocking prerequisites

| Prerequisite | Result | Consequence |
| --- | --- | --- |
| Isolated staging database | **Missing/unproven** | Cannot run guarded E2E seed or any mutation safely. |
| Staging seller and buyer fixture IDs | **Missing** | Cannot execute the two-role staging scenario. |
| Independent authenticated contexts | **Not proven** | Existing certification used sequential role switching, not concurrent independent sessions. |
| HTTPS camera-capable device/context | **Not available in the current sandbox proof** | Real preview/decode cannot be certified here; manual fallback remains the only proven QR path. |
| Negative authorization/concurrency matrix | **Untested** | `verified` release status is not admissible. |

## Decision

Phase 0 is **blocked for safe execution**, not because the A–E implementation was lost. No production database mutation, staging seed, migration, user deletion, legacy-row rewrite, payment change, or global UI work is permitted until an isolated staging boundary and the required test contexts are available.

The smallest next action is to obtain or configure a distinct staging Neon database, create or identify redacted staging buyer/seller fixture IDs, and provide an HTTPS camera-capable testing context. Once those prerequisites exist, resume with the guarded staging seed and the two-session A–E flow; do not repeat the already-proven sequential production transaction unless a specific regression is found.
