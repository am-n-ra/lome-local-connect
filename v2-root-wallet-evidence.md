# Omni V2 — Root Wallet Evidence

**Document ID:** `OMNI-V2-ROOT-WALLET-001`
**Method:** Nature Way — Phase 2, Root System
**Observed:** 2026-08-23
**Status:** `partial`

## Mini-seed

Protect the single account-level Omni Wallet from unauthorized or negative spending while preserving the V1 boundary: no seller payouts or withdrawals, confirmed ledger entries only, and facility-scoped platform spending.

## Repository seam

The actual server repository now exposes `spendWallet`. It resolves the wallet through the authenticated Neon Auth subject, rejects suspended accounts, requires that the requested facility belongs to that account, locks the wallet row with `FOR UPDATE`, calculates balance only from confirmed ledger entries, and inserts a confirmed spend entry only when the balance covers the amount. The database uniqueness rule `(wallet_id, kind, reference)` makes a retried spend return the original ledger result instead of creating a duplicate. The operation accepts only platform-spend kinds and never exposes a withdrawal operation.

The confirmed-balance calculation treats `recharge`, `bonus_grant`, `coupon_credit` and `reversal` as credits and all supported spend kinds as debits. Unconfirmed entries do not contribute to the balance. The pure invariant test now covers coupon credit as a positive balance contribution.

## Local proof

The repository tests cover the Auth-linked account join, facility ownership condition, wallet row lock, confirmed-balance filter, append-only ledger insert, conflict-safe reference replay, invalid amount rejection before SQL, and no-row rejection for missing wallet, invalid ownership or insufficient funds. The full local validation reports 11 Vitest files and 57 passing tests, a successful TypeScript/Vite build, four bundled Vercel functions and `Client boundary: clean`.

## Explicit non-evidence

No recharge provider, bonus-grant writer, production wallet mutation, persistent-branch migration, live authenticated request, failed external payment recovery or withdrawal attempt was executed. The disposable Neon branch was not used for this repository seam. Therefore DATA-03 remains `partial` until the live writer boundary, ledger invariants, recharge/bonus authorization, retry behavior and non-withdrawal proof are exercised or assigned as explicit manual work.

## Facility bonus seam

The repository now exposes `unlockFacilityBonus`. It requires the authenticated account to own the facility, requires `trust_state = 'confirmed'` and at least three qualifying sales, locks the facility and wallet rows, sets `bonus_unlocked_at` once, and writes a single confirmed `bonus_grant` ledger entry for `2000` minor units using the deterministic facility reference. A replay returns the existing ledger row rather than issuing another grant. The resulting balance is platform credit only; there is no withdrawal path.

Focused tests cover the confirmed-trust and three-sale predicates, one-time unlock condition, exact 2000-minor-unit grant, owned-wallet failure and replay-safe existing-row return. This remains a local repository seam: no live facility mutation, bonus grant or production wallet operation was executed.
