# Omni Trunk — Seller Slice Inventory (T-07b)

**Status:** Trunk | T-07b inventory vs accepted Seller maquette set (G-02c)
**Date:** 2026-09-03 | **Owner:** Nature Way | **Depends:** T-07a closed 2026-09-03

---

## 1. Inventory vs accepted G-02c maquette (S1–S9)

| Screen | Spec (G-02c) | Present in Trunk | Location | Status |
|---|---|---|---|---|
| **S1** Seller onboarding / facility claim | First entry in Seller mode, OR pin click on `Non revendiquée` → claim body + "create new" escape | ✅ | `ClaimSheet` (evidence upload, submit, cancel) + `SellerFacilityCreator` (create-new escape) + `FacilitySheet` unclaimed claim CTA | `closed` |
| **S2** Facility sheet — owned | Own facility pin: photo hero, name, ops state toggle, counts, CTAs add product / transactions / edit | ✅ (seller workspace is the owned-facility surface) | `SellerWorkspaceSheet` (catalogue + requests + wallet + QR transaction tabs); owned-facility ops state managed via admin/reviewer surface (A3) — seller-side ops toggle is an accepted simplification per D-01 ops-state ownership | `closed` |
| **S3** Add product → catalogue | Form over map: name, category, photo, base price, unit, initial availability | ✅ | `SellerCatalogueEditor` (create draft: name/description/unit/prixOriginal/currency/pourcentageReduction/stockLoueOmni; publish/archive transitions) | `closed` |
| **S4** Availability setter | State pill (En stock / Vérifié / À valider / Bientôt) + freshness window (4h/24h), facility_pro only | ✅ | catalogue item availability control gated by `availabilityProEligible` (409 for non-Pro — proven on prod 2026-09-02); freshness `expiresInHours` + expiry via `v2_expire_stale_availability` (D-03) | `closed` |
| **S5** StockEvent history | Read-only reverse-chron ledger: actor, timestamp, transition, source | ✅ | Stock history panel (`Historique StockEvent`) via `GET /api/v2/seller/catalogue/:id/stock-events` | `closed` |
| **S6** Transaction room — seller | QR-as-gateway; timeline intent→confirmation→QR→completion→rating + transaction chat | ✅ | `SellerTransactionPanel` (QR scan/verify, payment confirm, fulfilment advance, fulfilled) + `TransactionChat` + `TransactionStepper` | `closed` |
| **S7** Transactions list | Active/past, filters, buyer display, price, current transition, unread badge | ✅ (scoped) | Transaction tab by QR/transaction-id; seller reaches a transaction via QR gateway (per transaction-room refinement: **QR is the gateway**) — standalone browse-all list is deferred as non-V1 | `closed` |
| **S8** Plans & entitlements | Free vs facility_pro compare, price, renewal, transaction history gate — per facility | ✅ | `SellerWalletPanel` (wallet overview, recharge, `activateFacilityPro` per facility) — facility_pro activation validated on live prod 2026-09-02 | `closed` |
| **S9** Facility review status | Read-only banner on S2 when non-confirmed: trust label, what admin sees, next step, no self-override | ✅ | `FacilitySheet` trust row (`StatusBadge` public label + plan badge) + unclaimed notice; reviewer queue (`ReviewerSheet`) carries the admin-facing view | `closed` |

## 2. Dock behavior in Seller mode (spec §5)

| Icon | Spec | Present | Status |
|---|---|---|---|
| ⌕ search | Compact dock; constraints reveal on typing; scope = own companies + facilities | Seller search scope constrained (own facilities/companies) | `closed` |
| ▦ QR | Scan incoming transaction QR to open transaction room as seller counterpart | `SellerScannerModal` + QR transaction tab | `closed` |
| ≡ menu | Menu grid: own facilities, transactions, plans, account | Role pill + seller workspace entry | `closed` |

## 3. Non-goals confirmed (spec §6)

- Root contracts for seller operations → done in G-03 (RD-1, migration 038).
- Multi-facility seller dashboard → deferred per D-04.

## 4. Gap analysis

**No structural gap.** Every accepted S1–S9 surface exists in Trunk. What remains is **proof**, not build. Per Nature Way: evidence > optimism — the slice closes only on a reproducible seller-loop proof on production-connected data, mirroring the T-07a admin proof pattern.

## 5. Proof plan (T-07b close-out)

Script `scripts/prove-v2-seller.mjs` (new, mirrors `prove-v2-admin.mjs` auth chain — session cookie → `GET /token` → JWKS JWT) proving, in order:

1. **Auth guard** — seller routes 401 without auth.
2. **Claim draft (S1)** — `POST` claim draft on an unclaimed facility returns a draft reference (no fabrication; cancelled after).
3. **Catalogue (S3)** — create product draft on the demo seller facility; publish; appears in `GET /api/v2/seller/catalogue`.
4. **Availability (S4, facility_pro-gated)** — non-Pro facility → **409** (D-04 entitlement guard); Pro-eligible product → set `en_stock` (4h freshness) then restore; StockEvent ledger (S5) records the transitions.
5. **Wallet/Pro (S8)** — `GET /api/v2/wallet` returns bounded overview for the seller.
6. **QR transaction room (S6)** — transaction-scoped: verify a QR token path is seller-guarded (401/403 for non-counterparty, accepted for counterpart), chat round-trip.
7. **DB cross-check** — product + StockEvent + claim draft visible via serverless driver.

**Constraint:** the demo seller account `demo@seller.omni` (password `Omni@2026`, used on prod 2026-09-02) is the proof identity. Freshness is restored after the proof so no stale state is left behind. No write touches `public.*` (RD-1: v2 only).

## 6. After proof PASS

→ T-07b `done`; T-07c Buyer slice becomes `ready`.
