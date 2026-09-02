# G-03 Root System — Inspection Report (2026-09-02)

**Scope:** Inspect existing 37 migrations before any new Root work. Existing migrations = evidence, not proof.

## What exists

**Two parallel schemas (coherence finding — violates "one source of truth per concern"):**

| Schema | Era | Tables | Still active? |
|---|---|---|---|
| `v2_*` (34 tables) | Rebuild root (001_v2_roots.sql onward) | accounts, account_roles, facility_slots, companies, facilities, facility_entitlements, products, availability_requests/responses, purchase_intents, transaction_events/messages/members/snapshots, qr_tokens, fulfilments, ratings, external_payment_declarations, wallets, wallet_ledger, notification_*, operator_runs, audit_events, verification_requests/evidence/reviews | Yes — matches D-01..D-07 shape |
| `public.*` (35 tables) | V1 era | facilities, profiles, companies, demand_requests/responses, wallet_*, transaction_*, coupon_*, catalog_imports, osm_tiles, search_documents, etc. | **Yes — 016 and 037 (latest) still ALTER/CREATE on public.*** |

**Latest migration (037) builds on `public.facilities` + `public.profiles`, not v2.** The v1 schema is still being extended.

## Coverage vs accepted maquette (G-02b/c/d)

| Accepted surface | v2 schema support | Gap |
|---|---|---|
| A1–A8 admin (review, roles, audit, operator runs) | v2_verification_*, v2_account_roles, v2_audit_events, v2_operator_runs | OK covered |
| S1 claim + create escape (V1 Master 57) | 037 facility_claim_requests is on public.*; v2 has v2_facilities.source_kind='claimed' but no v2 claim-request table | WARN claim flow straddles both schemas |
| S2 facility sheet + ops state | v2_facility_status_history (Ouvert/Ferme/Temp. indispo.) | OK covered |
| S3/S4 product + availability setter | v2_products has publication_state (draft/pending/published/sold_out/archived) but **no availability_state (En stock/Verifie/A valider/Bientot) and no freshness window (D-03: 4h fresh / 24h expired)** | MISSING |
| S5 StockEvent ledger | v2_facility_status_history is facility-level; **no product-level state-transition ledger** | MISSING |
| S6/S7 transactions + QR + chat | v2_purchase_intents, v2_transaction_*, v2_qr_tokens, v2_fulfilments, v2_ratings, v2_external_payment_declarations (D-05 OK) | OK covered |
| S8 per-facility plans (D-04) | v2_facility_slots + v2_facility_entitlements | OK covered |
| B15 payment (no money transit, D-05) | v2_external_payment_declarations | OK covered |
| B19 saved searches | user_interests is public.* v1 | MISSING in v2 |
| B20 account / D-06 one identity + capability | v2_accounts + v2_account_roles | OK covered |
| Notifications (X03) | v2_notification_events/deliveries + web_push | OK covered |

## Gaps to close in G-03 (4)

1. **RD-1 (decision, blocking):** canonical schema — extend v2_* and freeze public.*, or reconcile first? 037 on public.* suggests live drift.
2. **RG-1:** product availability state + freshness window (D-02/D-03) — new columns + deterministic transition rule (facility_pro only per D-04).
3. **RG-2:** product StockEvent ledger (accepted S5) — product-level transitions with actor/timestamp/source(auto|manual).
4. **RG-3:** saved searches table in v2 (accepted B19).

## Verdict

Existing v2_* root covers ~80% of accepted surfaces. Do NOT restart schema. Close RD-1 first (founder decision), then 3 additive migrations (RG-1..3).
