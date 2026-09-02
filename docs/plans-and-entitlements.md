# Omni Free / Pro Entitlement Boundary

## Current contract

Omni currently stores a facility commercial plan as one of `free`, `pro_active` or `pro_expired`. It also has an additive entitlement table with three entitlement kinds: `facility_pro`, `catalogue_limit` and `advanced_tools`. Entitlements carry a state, an optional limit, a source and an optional end date.

The application may display the authoritative facility plan and must treat `pro_expired` as non-active. No payment provider, invoice state or recurring billing contract is assumed by this record alone.

## Safe enforcement boundary

| Capability | Safe current behavior | Missing decision |
|---|---|---|
| Public facility visibility | Allowed independently of Pro | None for map discovery |
| Claim and verification | Governed by trust and reviewer evidence | None for current flow |
| Seller activation | Governed by reviewer activation and account state | None for current flow |
| Catalogue size | Must be checked against an active `catalogue_limit` when a catalogue-write endpoint exists | Exact Free default and Pro limit |
| Advanced tools | Must require an active `advanced_tools` entitlement | Exact tool list |
| Pro facility features | Must require active `facility_pro` or an authoritative `pro_active` plan | Which features and expiry policy |
| Billing and payment | Not claimed by Omni in this seam | Provider, checkout, webhook, refund and reconciliation contract |

## Decision gate before billing implementation

Before adding a checkout or payment mutation, define the exact Free defaults, Pro benefits, price and currency, renewal/expiry behavior, source of truth for entitlement changes, webhook authenticity policy, refund/revocation behavior and operator override policy. Until those decisions are approved, Omni should expose plan state and enforce only entitlements that already have a named capability and limit.

## Current Founder HQ status

The schema supports authoritative plan state and entitlement records. The product does not yet have a billing provider or a complete capability matrix. Therefore Free/Pro is `partial / enforcement-gated`, not production-ready billing.
