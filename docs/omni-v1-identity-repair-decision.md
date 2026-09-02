# Omni V1 — Identity Repair Decision Record

**Decision ID:** `ID-REPAIR-007`  
**Status:** `decided-for-current-test-dataset`  
**Date:** 2026-08-19  
**Risk:** `L3`

## Decision

Treat the current application database as a test/demo dataset for this Omni build. Reconcile duplicate application profiles and their test-owned facilities/dependencies into the current Neon Auth identity without deleting any row from `neon_auth.user` and without deleting application profiles in the first pass.

The canonical identity is the current Neon Auth user ID `a8c23f6a-84a9-452c-8be6-f0278060e436`. The legacy application profile IDs to relink are `8f5cc1cb-03cb-4c88-a9b2-c6ec5a5d70db` and `791e3fb5-facb-4287-ae64-0d0737261f8e`. All three profiles share the same redacted email hash in the read-only audit. The current user confirmed that only demo/test use has occurred and that Neon Auth users must not be deleted.

## Scope

Relink application identity fields for facilities, buyer/sender/user references, roles if present, demand/cart/transaction/chat/review/coupon/offer/analytics/notification/favorites/wishlist references and wallet deposits/ledger actor metadata. Preserve historical `audit_log.actor_id` values and record the repair as a new audit event instead of rewriting provenance. Keep the source and secondary `public.profiles` rows. Do not merge or delete the duplicate `user_plans` row automatically because the canonical and secondary profiles both have a plan row and this requires a separate explicit policy; record it as a residual test-data cleanup item.

## Invariants

The runner must require explicit test-data flags and a unique run ID, validate that the canonical ID exists in `neon_auth.user`, validate that source and secondary IDs do not exist in `neon_auth.user`, refuse different profile email hashes, take the local identity-surface snapshot first, use one database transaction, use an advisory lock, be idempotent, emit redacted counts only, preserve amounts/statuses/timestamps/ledger facts, and write an audit-log record. No Neon Auth table is updated or deleted.

## Out of scope

Do not delete Neon Auth users, delete profiles, alter password/session/provider records, change transaction amounts or statuses, rewrite wallet balances, alter production Vercel settings, or claim production readiness from this repair. Do not change the canonical product/interface/architecture contracts unless verification discovers a new product decision.

## Rollback

Use the private identity-surface snapshot `/home/ubuntu/omni-backups/omni-identity-surfaces-20260819.json` and the recorded audit-log mapping to reverse application identity fields only if the post-repair invariants fail. Keep the raw snapshot private and never publish it as an attachment.
