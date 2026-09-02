# Omni V2 — Authorized Demo Seller Fixture

**Document ID:** `OMNI-V2-ROOT-DEMO-SELLER-001`  
**Method:** Nature Way — Root System, bounded fixture preparation  
**Observed:** 2026-08-23  
**Status:** `authorized-for-bounded-proof`

## Mini-seed

Prepare the smallest clearly labeled seller-side fixture required to exercise the Root transaction path on the persistent V2 development branch. The fixture exists only to prove server authority, seller ownership, purchase intent, transaction membership, QR verification, external-payment declaration and seller acknowledgement. It must never be interpreted as a real seller, real inventory, real sale, marketplace adoption or production readiness.

The explicitly authorized scope is to reuse an existing demo-like Neon Auth identity, create the corresponding V2 seller account binding, create one owned demo facility and one published demo product with bounded stock, and create only the transaction records required for the proof. The existing KH-controlled buyer session and its existing V2 buyer account remain the buyer-side actor. No Auth identity is created, deleted, or removed.

## Root boundary

| Concern | Bounded decision |
|---|---|
| Environment | Persistent V2 Neon branch `omni-v2-rebuild`; never production/default |
| Seller identity | One existing unlinked demo-like Auth identity selected deterministically by the fixture operation; raw Auth ID is not recorded in source, docs, logs or chat |
| Buyer identity | Existing authenticated KH-backed V2 buyer account; no second buyer account is created |
| Seller account | One deterministic V2 fixture account labeled `D-V2-DEMO-SELLER`; `seller_ready`; not a user-success claim |
| Facility | One deterministic created facility labeled `D-V2-DEMO-FACILITY`; owned by the fixture seller; `unconfirmed`; no claim-by-click or public-import row is rewritten |
| Product | One deterministic published fixture product labeled `D-V2-DEMO-PRODUCT`; actual stock and Omni allocation are bounded and non-zero solely for proof |
| Transaction | Only records produced by the bounded proof flow; no production/default writes |
| Payment | External declaration/acknowledgement only; no in-app buyer-seller rail, payout or withdrawal |
| Cleanup | Retain as labeled evidence unless a separate explicit cleanup instruction is provided; no DELETE/DROP/TRUNCATE |

## Acceptance intent

The proof is successful only if the application/server path enforces the seller account binding and facility ownership, creates an immutable transaction snapshot and memberships, issues a protected QR, accepts the first seller verification, rejects the replay, accepts an external payment declaration, accepts the seller acknowledgement exactly once, and records auditable state/event facts. A direct fixture insert by itself is not proof of any of these operations.

The fixture remains a bounded Root artifact even after a successful transaction path. It does not authorize the Seller Trunk, facility claim/certification UI, admin UI, Pro UI, new buyer UI or release clearance.

## Preservation and secrecy

All existing Auth identities, V2 records, legacy tables and production/default records remain preserved. No passwords, bearer tokens, QR token hashes, connection strings or raw Auth identifiers are written to the repository, evidence or chat. Evidence records only aggregate counts, deterministic fixture keys and non-secret outcome facts.

## User authorization

The user explicitly authorized reuse of demo accounts and creation of demo-related transactions/data in the current task message. This document narrows that authorization to the persistent V2 branch, the single seller fixture and the single bounded proof path above.
