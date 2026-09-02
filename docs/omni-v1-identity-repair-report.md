# Omni V1 — Demo Identity Repair Report

**Date:** 2026-08-19  
**Scope:** Current application test/demo dataset only  
**Status:** `partial` — repair verified; full production-readiness proof remains incomplete

## Decision and safety boundary

The current user confirmed that Omni has not yet onboarded real users and that the present application records are demo/test records. The repair therefore reconciled application profile references without deleting any `neon_auth.user` row and without deleting any `public.profiles` row. The current Neon Auth identity was retained as canonical; two legacy application-only profiles sharing the same redacted email hash were preserved as historical rows.

The repair runner required explicit test-data flags, a unique run ID, a private identity-surface snapshot, canonical-auth existence, absence of the legacy IDs in Neon Auth and a single transaction with an advisory lock. It preserved the duplicate `user_plans` rows because both canonical and secondary profiles had a plan row and no plan-merge decision was required to restore seller authorization.

## Applied changes

| Surface | Rows changed | Result |
| --- | ---: | --- |
| `facilities.owner_id` | 5 | All five legacy-owned test facilities now belong to the canonical application profile. |
| `demand_requests.buyer_id` | 1 | The legacy test request is visible to the canonical buyer. |
| `notifications.user_id` | 17 | Legacy seller/buyer notifications are visible to the canonical identity. |
| Other identity-bearing surfaces | 0 | No source/secondary rows existed there or no update was required. |
| `public.profiles` | 0 | All three duplicate application profiles were preserved. |
| `neon_auth.user` | 0 | No Neon Auth user was modified or deleted. |
| `user_plans` | 0 | Both existing plan rows were preserved. |
| Wallet ledger facts | 0 | No wallet actor rows required relinking and the ledger total remained unchanged. |
| Transactions | 0 | Existing canonical buyer transactions were preserved; legacy profiles owned no transactions. |

The repair wrote one new audit-log event with the run ID and snapshot checksum. A second run with the same run ID is designed to be idempotent and update no additional rows.

## Verification evidence

The redacted post-repair dependency audit shows six facilities under the canonical profile and zero facilities under either legacy profile. It shows four canonical buyer transactions, zero legacy wallet actors, preserved plan rows and no raw email or ID output. The existing invariant checker reports zero current completed transactions without reviews, zero active transactions without intent keys, zero duplicate active intent keys, zero duplicate coupon redemptions, zero approved deposits without a wallet ledger entry and zero wallet snapshot drift. It reports three **legacy** completed transactions without reviews; these pre-enforcement fixtures are not classified as current invariant failures.

The full unit suite and production build passed before this report, and the client-boundary check passed. The deployed buyer route loaded the MapLibre globe and resumed the authenticated demo session. The deployed seller route then loaded successfully and displayed the repaired seller facility, map-first operations shell, catalogue, scanner, Omni Wallet and coupon surfaces. The scanner showed a reserved camera viewport and explicit manual-code fallback, but real camera permission and QR decoding were intentionally not triggered in the read-only browser certification.

## Rollback artifact

The private JSON snapshot at `/home/ubuntu/omni-backups/omni-identity-surfaces-20260819.json` covers 29 identity-bearing public tables. Its SHA-256 checksum is `f4ba28f519d06f499b5d006a2bfc91788185188b59af79ce29d0437da2dedcad`. The installed `pg_dump` client was version 16.14 while the Neon server reported 17.10, so the Node snapshot helper was used instead of claiming a native pg_dump backup.

## Remaining limitations

This report does not claim production-ready transaction certification. The remaining proof is a two-session buyer/seller E2E with real authentication, QR verification, payment preference, external payment declaration, seller confirmation, fulfillment, receipt and rating; camera permission/decoding on a real HTTPS device; and a separate decision for the three legacy completed transactions without reviews if they are to be cleaned rather than retained as legacy fixtures. No Neon Auth deletion was performed.
