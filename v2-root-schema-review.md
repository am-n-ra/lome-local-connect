# Omni V2 — Root Schema and Preservation Review

**Document ID:** `OMNI-V2-ROOT-SCHEMA-REVIEW-001`
**Method:** Nature Way — Root System evidence
**Status:** `partial_blocked`
**Reviewed files:** `db/migrations/001_v2_roots.sql`, `db/migrations/002_v2_public_facility_ownership.sql`
**Review date:** 2026-08-22

## Review boundary

This is a static, read-only review of the additive V2 migration text. No migration was executed by this review, and no Neon Auth identity, legacy table or historical row was modified. The review does not claim that the current database branch matches the migration text until a separately authorized forward check is performed.

## Verified from migration text

| Root concern | Evidence in migration text | Assessment |
|---|---|---|
| Auth preservation boundary | `v2_accounts.auth_user_id` is a unique text reference; the migration does not delete from `neon_auth` | Contractually additive; live preservation still manual |
| Public unclaimed facilities | Migration 002 drops `NOT NULL` from `v2_facilities.account_id` and explicitly describes public imports before claiming | Correct direction for the locked unclaimed flow |
| Facility/company references | Facilities reference companies with `ON DELETE SET NULL`; companies reference accounts with `ON DELETE RESTRICT` | Ownership relationship exists, but same-account company ownership needs server/constraint proof |
| Catalogue limit inputs | Products are facility-scoped; publication state is constrained; `quantity_allocated_omni <= actual_stock` is enforced when stock is present | Correct base constraint; publish entitlement remains server-authoritative |
| One free slot | Partial unique index `v2_one_free_slot_per_account` exists for `source = 'free'` | Database-backed uniqueness present |
| One wallet per account | `v2_wallets.account_id` is unique | Database-backed uniqueness present |
| Wallet entry uniqueness | `unique(wallet_id, kind, reference)` prevents duplicate references of one kind | Useful idempotency primitive; append-only enforcement is still absent |
| Availability idempotency | `unique(buyer_account_id, idempotency_key)` exists | Database-backed duplicate boundary present |
| Intent idempotency and response uniqueness | Purchase intents have unique response and unique buyer/key constraints | Database-backed duplicate boundary present |
| Transaction membership | Membership has a composite primary key and references transaction snapshots/accounts | Base membership integrity present |
| QR record | Token hash is unique and replay count is non-negative | Token identity base exists; atomic replay transition is not a schema constraint |
| Audit trace | Audit rows require actor/entity/correlation fields and have an entity index | Audit shape exists; write coverage remains to be proven |

## Gaps requiring Root closure or explicit owner

| Gap | Why it matters | Required disposition |
|---|---|---|
| Facility/company account relationship is not a database constraint | A facility could reference a company owned by a different account if an API path is forged | Enforce in a server transaction and/or add a constraint-safe ownership model; add a negative test |
| Availability `facility_scope` is a UUID array without foreign keys | Scope can contain deleted or unrelated facilities | Validate every scope member server-side and preferably normalize or add a validated relation before Trunk |
| Availability product/facility relationship is not constrained by this migration | A request can pair a product with an unrelated facility unless the server checks it | A pure Root validator and negative tests now exist; wire the validator into the live API/repository transaction before Trunk |
| Response facility is not constrained to request scope | A response could be written for a facility outside the buyer’s request | Intent creation now resolves a stored response and verifies request ownership/scope in a tested Root operation; live response mutation/transaction enforcement remains open |
| Wallet ledger is not append-only at database level | Application convention alone does not prevent update/delete of balances or bonus entries | Add append-only database policy/trigger or a restricted writer boundary and a deletion/update negative proof |
| State transitions are represented by checks but not transition constraints | Invalid jumps can be written unless every mutation uses a state machine | Centralize server transitions and add positive/negative transition tests |
| QR replay safety is not atomic in schema text | Concurrent scanner requests could both pass if replay guard is not serialized | Use a conditional update/transaction with row locking and prove first-pass/second-pass/concurrent behavior |
| Migration execution and preservation are not re-verified in this ring | Static review cannot prove current Neon branch structure or preserved identities | Run an authorized read-only/forward compatibility check; record counts and non-destructive statement review without exposing secrets |

## Explicit non-claims

This artifact does not claim production readiness, live Auth, live migration success, transaction completion, QR verification, payment, route-provider access or seller certification. It is evidence of document-level review plus a concrete list of load-bearing gaps.

## Nature Way decision

The schema review is **partial**. It supports Root planning but does not close the Root gate. The next implementation-safe action is to wire the tested server validators into the live repository transaction and resolve the database-authority gaps or assign each one to a named server/migration owner before the buyer Trunk writes against these seams.
