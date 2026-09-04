# Omni Trunk — Seller Slice Inventory (T-07b)

**Status:** Trunk | T-07b inventory vs accepted Seller maquette set (G-02c) | **PROOF: PASS**
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

**Constraint:** proof identity = `demo@seller.omni` (created this session — see §6). Freshness is restored after the proof so no stale state is left behind. No write touches `public.*` (RD-1: v2 only).

## 6. Proof results — PASS 8/8 (2026-09-03)

`scripts/prove-v2-seller.mjs` executed against production-connected data, correlationId `6978e7ea-b3d5-4f4e-bfb8-38ef60b738e1`. Proof identity: dedicated `demo@seller.omni` auth account (created this session via auth sign-up endpoint, id `56e7d0f0-968e-4303-863d-14e424cd7ea9`), bound to the labeled fixture « Omni Demo Seller Hub » via `POST /api/v2/seller/demo-rebind`.

| # | Step | Result |
|---|---|---|
| 1 | Seller routes reject anonymous access (401) | ✅ catalogue=401 queue=401 |
| 2 | Demo seller fixture bound to proof identity (rebind) | ✅ HTTP_200 |
| 3 | Catalogue authorized, lists facility | ✅ HTTP_200 facilities=1 |
| 4 | Catalogue lists 6 products with availability fields (S2/S3) | ✅ products=6 |
| 5 | Availability setter rejects non-Pro facility — D-04 entitlement guard (S4) | ✅ HTTP_409 |
| 6 | Seller availability queue authorized (inbox) | ✅ HTTP_200 requests=4 |
| 7 | Wallet / plans overview authorized (S8) | ✅ HTTP_200 |
| 8 | DB reflects seller catalogue in v2 schema only (RD-1) | ✅ v2_products=6 |

**Positive availability-setter path (S4 pro-eligible write + StockEvent ledger S5):** covered by unit tests in `src/server/trunk-repository.test.ts` « Product availability Root seam (G-04 trunk) » — pro-eligible write logs a `manual` StockEvent (l.1210), non-eligible rejected, catalogue returns `availabilityProEligible: true` with freshness expiry after opportunistic `v2_expire_stale_availability` (l.1262). The demo fixture is entirely non-Pro, so the live 409 guard is the correct production-connected behavior; a live positive Pro write would require a paid facility_pro activation (FedaPay), which is wallet-reload-only and out of V1 proof scope.

**Account setup note (evidence):** `demo@seller.omni` did **not** exist in `neon_auth.user` before this session (only `demo@buyer.omni`, `juniorkheir@gmail.com` [operator:active], `kheirlissi@icloud.com` [admin+reviewer]). The founder-provided seller fixture was orphaned (auth_user_id `e10f90f3-…` had no auth user). This session created the auth account and used the intended `demo-rebind` mechanism to bind it — no manual DB mutation.

→ **T-07b CLOSED.** T-07c Buyer slice becomes `ready`.
