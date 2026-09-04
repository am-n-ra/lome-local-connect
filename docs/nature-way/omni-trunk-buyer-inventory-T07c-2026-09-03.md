# Omni Trunk — Buyer Slice Inventory (T-07c)

**Status:** Trunk | T-07c inventory vs accepted Buyer maquette set (G-02d) | **PROOF: PASS**
**Date:** 2026-09-03 | **Owner:** Nature Way | **Depends:** T-07b closed 2026-09-03

---

## 1. Inventory vs accepted G-02d audit (B01–B20 + X01–X05)

| Screen | Spec (G-02d audit) | Present in Trunk | Location | Status |
|---|---|---|---|---|
| B01 Map Home | Map-first home | ✅ | `TrunkMap` + `MapCanvas` | `closed` |
| B02+B03 Search + constraints | Compact dock, constraints reveal on typing | ✅ | `LiquidSearchDock` (`StructuredDemand`) | `closed` |
| B04 Search Results | Result grid with thumbnails | ✅ | `NearbySheet` + `FacilityCard` | `closed` |
| B05+B06 Facility (buyer body) | Facility sheet | ✅ | `FacilitySheet` | `closed` |
| B07+B08 Availability | Availability flow | ✅ | `AvailabilitySheet` (multi-step) | `closed` |
| B09 Pending | Awaiting sellers state | ✅ | `AvailabilitySheet` step + `ResponseComparison` empty state | `closed` |
| B10 Bulk (grouped) | Grouped requests | ✅ | `BuyerRequestsSheet` | `closed` |
| B11 Compare | Response comparison | ✅ | `ResponseComparison` | `closed` |
| B12 Purchase Intent | Intent creation | ✅ | `ResponseComparison` → `createPurchaseIntent` | `closed` |
| B13 Tracking | Transaction tracking timeline | ✅ | `AvailabilitySheet` transaction steps + `TransactionStepper` | `closed` |
| B14 QR sheet | Buyer QR issuance | ✅ | `TransactionQrCard` + `issueBuyerQrToken` | `closed` |
| B15 Payment | Payment declaration | ✅ | `AvailabilitySheet` payment stage + `PaymentMethodSelector` | `closed` |
| B16/B17 Fulfilment/Rating | Completion + rating | ✅ | `AvailabilitySheet` (mark received, `ReviewStars`, submit rating) | `closed` |
| B18 History | Past transactions | ✅ | `BuyerRequestsSheet` (resume) + menu | `closed` |
| **B19 Saved searches** | Saved searches (RG-3) | ✅ **built this slice** | routes `GET/POST/DELETE /api/v2/saved-searches` + `v2_saved_searches` (038) | `closed` |
| B20 Account | Account surface | ✅ | `AuthSheet` + account context + role pill | `closed` |
| X01 Facility claim | Unclaimed claim body | ✅ | `FacilitySheet` + `ClaimSheet` (ported to v2, S1) | `closed` |
| X02 Certification | Read-only trust label | ✅ | `StatusBadge` public label | `closed` |
| X03 Notifications | Inbox | ✅ | `InboxSheet` | `closed` |
| X04 Search demand signal | Bounded demand signal | ✅ | search demand fixture | `closed` |
| X05 Error/Recovery | Recovery surfaces | ✅ | inline-error / retry patterns | `closed` |

## 2. Gap closed this slice

**B19 saved searches** was the only structural gap: the `v2_saved_searches` table existed (migration 038, RG-3) with **0 rows and no route or surface**. This slice added:

- Repository: `listSavedSearches` / `createSavedSearch` / `deleteSavedSearch` (soft-delete via `active=false`), account-resolved by `auth_user_id`, suspended-account guarded.
- Routes: `GET`/`POST` `/api/v2/saved-searches`, `DELETE /api/v2/saved-searches/:id` (auth-gated 401; query ≤200 chars validated; constraints bounded to a JSON object).
- Error class `BuyerSearchPolicyError` mapped to `POLICY_REJECTED` (409).
- Client: `listSavedSearches` / `createSavedSearch` / `deleteSavedSearch` + `SavedSearch` / `SavedSearchListResult` types.

## 3. Proof results — PASS 8/8 (2026-09-03)

`scripts/prove-v2-buyer.mjs` executed against production-connected data, correlationId `9839cc09-2b30-4a84-85fd-90d761652390`. Proof identity: `demo@buyer.omni` (account `237d44d1-…`, `buyer_ready`).

| # | Step | Result |
|---|---|---|
| 1 | Buyer routes reject anonymous access (401) | ✅ saved=401 responses=401 |
| 2 | Public browse reachable without account (D-05) | ✅ HTTP_200 |
| 3 | B19 saved search created | ✅ HTTP_201 |
| 4 | B19 saved searches listed for account | ✅ searches=1 |
| 5 | B19 saved search deleted (cleanup, no leftover) | ✅ HTTP_200 |
| 6 | Buyer availability requests authorized | ✅ requests=1 |
| 7 | Buyer wallet overview authorized | ✅ HTTP_200 |
| 8 | DB reflects cleanup (no active leftover saved search), v2 only | ✅ active_leftover=0 |

**Deploy freshness guardrail (T-07d):** routes deployed (saved-searches 401 anonymous → live); prod bundle hash `index-BCg5G0cM.js` unchanged (no UI change in this slice).

**Coverage note:** the deeper buyer transaction loop (availability request → seller response → purchase intent → QR → payment → fulfilment → rating) is exercised end-to-end in **T-08 integrated proof** (one real seller + one non-team buyer + one team operator). This slice proves the buyer-scoped surfaces and guards are live and authorized; it does not fabricate a full transaction.

→ **T-07c CLOSED.** All three Trunk slices (Admin T-07a, Seller T-07b, Buyer T-07c) are proven. Next: **T-08 integrated proof**.
