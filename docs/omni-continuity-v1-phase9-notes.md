# Omni continuity V1 — Phase 9 notes

## Database invariants

Migration `db/migrations/029_transaction_invariants.sql` was applied to the verified `neondb` database on 2026-08-18. Its checksum is `d7eaeca5b30a28c3649fb78d8be8f6b1c9b253df1953f37a408cdce3700d8432`.

The migration adds state-aware checks for payment preference, buyer payment declaration, seller payment confirmation and fulfillment start. It also adds a unique partial index on non-null QR tokens and a trigger that rejects illegal transaction status jumps while allowing terminal dispute/refund paths.

The read-only post-migration audit confirmed all four checks, the transition trigger, the QR unique index and the migration registry entry. Existing production data had no duplicate QR tokens and no inconsistent payment or fulfillment timestamps before application.

## Source-of-truth schema

`db/schema.sql` was updated so its transaction definition now documents the actual V1 status machine, payment-choice fields, QR expiry, intent metadata, legacy-compatible timestamps, event timeline, constraints and indexes. This closes the prior drift where the snapshot described only `pending`, `completed`, `failed` and `refunded`.

Wallet parity remains green after the migration: legacy and projected wallet/payout totals match, all five buckets exist per account, and the SQL ledger functions remain present.
