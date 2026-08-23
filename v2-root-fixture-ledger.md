# Omni V2 — Root Fixture Ledger

**Document ID:** `OMNI-V2-ROOT-FIXTURES-001`  
**Method:** Nature Way — Phase 2, Root System  
**Observed:** 2026-08-23  
**Status:** `bounded`

## Purpose and non-claim

This ledger identifies every database fixture currently used by Root and public-discovery proof work. A fixture is a controlled test record, not a real buyer, seller, facility, product, payment, transaction or marketplace outcome.

> No record in this ledger may be presented as user adoption, real inventory, live availability, a completed sale, a verified seller, a successful payment, production readiness or release clearance.

Auth credentials, bearer tokens and Neon Auth user identifiers are intentionally excluded. The Auth preservation evidence is recorded only as aggregate counts and non-reversible checksums in [`v2-root-disposable-migration-evidence.md`](./v2-root-disposable-migration-evidence.md) and [`v2-root-auth-evidence.md`](./v2-root-auth-evidence.md).

## Environment boundaries

| Environment | Branch ID | Permitted use | Prohibited use |
|---|---|---|---|
| Persistent V2 development branch | `br-dawn-hill-am5amy22` (`omni-v2-rebuild`) | Read-only public catalogue/map proof and preservation comparisons | Authenticated user proof, production claims or treating seeded rows as real supply |
| Production/default Neon branch | `br-bitter-math-amrlbym6` | Historical/canonical public API smoke evidence and the single explicitly confirmed live Auth/idempotency proof recorded below | Further mutations, authenticated session simulation beyond the recorded proof or release approval |
| Disposable Root-proof branch | `br-broad-wildflower-amw7k0om` (`omni-v2-root-proof-20260822`) | Isolated migration, negative-guard, duplicate-denial and QR policy database tests | Promotion, merge, production data, user-success claims or use as a live marketplace |

Migration 003 and migration 004 were applied only to the disposable branch. The persistent V2 and production/default branches remain unmodified by those migrations. The disposable branch is expiring and must not be promoted automatically.

## Persistent V2 public fixtures

The following rows were inventoried read-only on 2026-08-23. They are the three public V2 facilities and three published products used in preservation and branch-side public-data evidence.

| Fixture key | Record ID | Label | State | Allowed assertion |
|---|---|---|---|---|
| `P-V2-FAC-001` | `20000000-0000-0000-0000-000000000001` | Marche de Hanoukope | `unclaimed`, `public_import` | Public source-presence fixture only; no catalogue-backed supply claim |
| `P-V2-FAC-002` | `20000000-0000-0000-0000-000000000002` | Atelier Kegue | `unconfirmed`, `public_import` | Public facility/detail and catalogue-shape proof only |
| `P-V2-FAC-003` | `20000000-0000-0000-0000-000000000003` | Pharmacie du Port | `certified`, `public_import` | Public facility/detail and catalogue-shape proof only |
| `P-V2-PROD-001` | `30000000-0000-0000-0000-000000000001` | Kente tote bag | `published`; facility `P-V2-FAC-002` | Catalogue serialization and facility scope only; not live stock |
| `P-V2-PROD-002` | `30000000-0000-0000-0000-000000000002` | Natural shea butter | `published`; facility `P-V2-FAC-002` | Catalogue serialization and facility scope only; not live stock |
| `P-V2-PROD-003` | `30000000-0000-0000-0000-000000000003` | First-aid kit | `published`; facility `P-V2-FAC-003` | Catalogue serialization and facility scope only; not live stock |

The persistent V2 branch has no V2 account rows in the recorded comparison. Its 35 Neon Auth users are preserved identities, not assigned fixture actors.

## Production/default public smoke fixtures

These are separate from the persistent V2 fixture set and are retained only to explain canonical-domain/API evidence already recorded. They must not be conflated with the persistent V2 branch.

| Fixture key | Record ID | Label | State | Allowed assertion |
|---|---|---|---|---|
| `P-CAN-FAC-001` | `00000000-0000-0000-0000-000000000001` | Cotonou Fresh Hub | `unconfirmed`, `public_import` | Historical public facility/detail smoke evidence |
| `P-CAN-FAC-002` | `00000000-0000-0000-0000-000000000002` | Zongo Mobile Market | `unclaimed`, `public_import` | Historical public source-presence smoke evidence only |
| `P-CAN-FAC-003` | `00000000-0000-0000-0000-000000000003` | Mènontin Home Bakery | `unconfirmed`, `public_import` | Historical public facility/detail smoke evidence |
| `P-CAN-PROD-001` | `00000000-0000-0000-0000-000000000011` | Tomatoes | `published`; facility `P-CAN-FAC-001` | Historical facility-scoped catalogue smoke evidence |
| `P-CAN-PROD-002` | `00000000-0000-0000-0000-000000000012` | Corn flour | `published`; facility `P-CAN-FAC-003` | Historical facility-scoped catalogue smoke evidence |

The canonical smoke request for facility ID `00000000-0000-0000-0000-000000000001` and the unauthenticated availability 401 probe are API evidence only. The live authenticated proof below used the same public facility/product context but is recorded separately because it landed on production/default.

## Explicitly confirmed live Auth proof fixture

| Fixture key | Environment | Actor label | Observed state | Allowed assertion |
|---|---|---|---|---|
| `L-CAN-AUTH-AVAIL-20260823` | Production/default Neon `br-bitter-math-amrlbym6` via Vercel deployment from `omni-v2-rebuild` | User-controlled authenticated buyer session; identity omitted | One `submitted` availability request for `Tomatoes` at `Cotonou Fresh Hub`; the same browser flow was submitted twice and aggregate checks showed one request, one buyer account, one idempotency key, one linked account and one linked wallet | Live bearer-backed availability-writer and sequential idempotency proof on production/default only; not persistent-V2 proof, inventory proof, sale proof or adoption proof |

This fixture was created only after explicit user confirmation. Its existence is an environment-bound test result and must not be presented as a real marketplace user, live stock, successful sale, payment, transaction or release signal. The persistent V2 branch remained at zero availability requests. No IDs, key values, emails, bearer tokens or passwords are recorded.

## Disposable Root-proof fixtures

The disposable branch contains labeled business fixtures created only for migration and guardrail testing. The following IDs are non-secret UUIDs; no Auth user IDs or QR token hashes are recorded.

| Fixture key | Record ID | Role/state | Allowed assertion |
|---|---|---|---|
| `D-ROOT-ACCOUNT-BUYER` | `00000000-0000-4000-8000-000000000101` | Account, `buyer_ready` | Buyer-side policy/ownership fixture only |
| `D-ROOT-ACCOUNT-SELLER` | `00000000-0000-4000-8000-000000000102` | Account, `seller_ready` | Seller-side policy/ownership fixture only |
| `D-ROOT-FACILITY` | `00000000-0000-4000-8000-000000000301` | `Root Proof Fixture Facility`, `unconfirmed`, `created` | Same-account ownership and catalogue-scope guard proof only |
| `D-ROOT-PRODUCT` | `00000000-0000-4000-8000-000000000401` | `Root Proof Fixture Product`, `published` | Availability scope and intent guard proof only |
| `D-ROOT-REQUEST` | `00000000-0000-4000-8000-000000000601` | Availability request; key `root-proof-fixture-request-20260822` | Buyer ownership, scope and duplicate/idempotency guard proof only |
| `D-ROOT-RESPONSE` | `00000000-0000-4000-8000-000000000701` | Availability response, `available` | Purchase-intent authority proof only |
| `D-ROOT-TRANSACTION` | `00000000-0000-4000-8000-000000000801` | Transaction snapshot | Membership, state-event and QR policy proof only |
| `D-ROOT-QR` | `00000000-0000-4000-8000-000000000901` | QR token; verified, replay count `1` | First-pass/second-pass replay behavior only; token hash remains secret |
| `D-ROOT-EVENT` | `8d6d3414-16c1-443b-9090-f9111082d57c` | Transaction event, `intent_created` | Disposable transaction-event inspection only |

The disposable transaction has buyer membership for account `D-ROOT-ACCOUNT-BUYER` and seller membership for account `D-ROOT-ACCOUNT-SELLER`. It is not a real transaction and has no release, payment or marketplace meaning. The recorded database checks also proved representative denials for mismatched company ownership, product/scope mismatch, response/scope mismatch, forged buyer intent and wallet-ledger update/delete attempts; those denials do not turn the fixture into a successful business flow.

## Fixture operating rules

All proof scripts and tests must use a fixture key from this document or create a newly labeled fixture entry before execution. A test must state its branch/environment, actor class, intended mutation, and cleanup/expiry boundary. A fixture may not be used to infer stock, availability, seller identity, payment, sale count, trust beyond the seeded state, or production behavior.

No fixture row may be copied into the production/default branch without a separately explicit decision and a new preservation record. No Auth user may be created, deleted or repurposed autonomously for proof. No QR hash, bearer token, password or database secret may be placed in this ledger, source code, logs or chat.

## Evidence links

The source and prior observations are recorded in [`v2-root-live-evidence.md`](./v2-root-live-evidence.md), [`v2-root-live-api-evidence.md`](./v2-root-live-api-evidence.md), [`v2-root-disposable-migration-evidence.md`](./v2-root-disposable-migration-evidence.md), [`v2-root-auth-evidence.md`](./v2-root-auth-evidence.md), [`trunk-proof.md`](./trunk-proof.md), and [`live-current-neon-evidence.md`](./live-current-neon-evidence.md). This ledger now closes the inventory/documentation part of FIX-01 and records one bounded live Auth proof fixture; it does not close persistent-V2 binding, recovery, concurrent QR proof, persistent migration approval or Trunk release clearance.
