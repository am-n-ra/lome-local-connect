# Omni Wallet & Facility Pro — Mini-root contract

## Scope

This branch adds the commercial capability required for Omni revenue from day one. A Wallet belongs to an account. A Pro entitlement belongs to one facility. The account may own multiple companies and facilities through Facility Slots, but a Pro purchase never covers another facility implicitly.

Omni V1 does not process seller or buyer purchase money. Transaction payment remains external; Omni records declared and confirmed states, the transaction coupon, and the mandatory rating cycle. The Wallet is reserved for Omni credits, bonuses, and facility-scoped commercial purchases such as a Pro entitlement.

## Actors and boundaries

| Actor | Allowed action | Boundary |
|---|---|---|
| Account holder | View own balance and ledger; spend own confirmed credits | Never view another account’s wallet |
| Seller account | Buy Pro for an owned facility with an assigned active slot | Facility ownership and slot state enforced server-side |
| Omni team | Grant or revoke a bounded entitlement manually | Must be auditable with actor, reason, reference and timestamps |
| FedaPay/webhook adapter | Confirm a recharge only after verified provider reference | Provider callback is not trusted without idempotent verification |
| Buyer or Seller transaction flow | Declare/confirm external payment | Must not debit the Omni Wallet in V1 |

## Data contract

The existing root tables remain authoritative:

- `v2_accounts` owns `v2_wallets`.
- `v2_facility_slots` grants account-level capacity and links an assigned slot to one facility.
- `v2_facilities.commercial_plan` is the fast read model (`free`, `pro_active`, `pro_expired`).
- `v2_facility_entitlements` is the entitlement history and source of truth for facility-scoped Pro periods.
- `v2_wallet_ledger_entries` is append-only for recharge, bonus, spend, reversal, and coupon-credit entries.

Commercial fields added by migration 009 are additive. Currency is stored per ledger entry or entitlement in the transaction’s selected/display currency; UI display may localize XOF, GHS, or EUR, but a provider transaction must retain its original currency and minor-unit amount.

## Invariants

1. Every spend has an idempotency reference unique for the wallet, kind, and reference.
2. A spend is accepted only when the wallet belongs to the authenticated account, the facility belongs to that account, the facility has an assigned active slot for that account, and confirmed balance covers the amount.
3. A Pro entitlement is always attached to exactly one facility and never to the account globally.
4. A facility may not publish more than five offers while its effective plan is Free. Pro removes that catalogue-count ceiling for that facility only.
5. A new Seller offer must carry a positive percentage discount or a positive fixed discount strictly below the base price.
6. Recharge confirmation is idempotent by provider reference and cannot mint balance twice.
7. Provider, webhook, or browser retries must return the original result rather than create a second ledger entry.
8. External transaction payment states and Omni Wallet states are separate state machines.

## V1 commercial flow

The Seller opens Wallet, sees the balance and each facility’s plan. The Seller selects one owned facility, chooses Pro, sees the fixed price of **10 USD per facility per month** localized for display, and starts a recharge if the balance is insufficient. The recharge is confirmed through the provider adapter and creates one confirmed ledger entry. The Pro purchase then creates one facility entitlement, updates the facility plan, and records an audit event. A failed, expired, cancelled, or duplicated provider operation must not activate Pro.

The first implementation should provide a server-authoritative read model and a bounded recharge adapter seam. If FedaPay credentials or webhook verification are not configured, the UI must show `configuration-gated` rather than imply that money was received. A manually confirmed demo recharge must remain explicitly labelled as a bounded proof and must never be presented as a live payment.

## Acceptance gate

The mini-root is accepted when the API contract exists for balance, ledger, facility plan, recharge creation, recharge confirmation, and Pro purchase; ownership, slot, balance, amount, currency, idempotency, and entitlement scope are enforced server-side; the Seller UI can inspect the result; and negative tests prove cross-account facility denial, unassigned-slot denial, insufficient-balance denial, duplicate-provider-reference idempotence, and Free-limit enforcement.
