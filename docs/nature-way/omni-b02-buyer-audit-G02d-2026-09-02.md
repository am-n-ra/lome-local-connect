# Omni G-02d Buyer Maquette Audit — 2026-09-02

**Scope:** Audit existing unified `omni-species-maquette.html` against V1 Master buyer screen spec (B01–B15 + shared X01–X05).
**Mode:** Gap-closure only; sheet/grid/pattern inheritance per founder ruling ("sheet et grid ne devraient pas être différents"). Locked direction applies: liquid glass/monochrome/#2e8b6f/dock/map-always-visible.

## Existing → Spec mapping

| Maquette ID | V1 Master | Status |
|---|---|---|
| BUYERHOME | B01 Map Home | ✔ present |
| SEARCH | B02 + B03 constraints | ✔ present |
| RESULTS | B04 Search Results | ✔ present |
| FACILITY (buyer body) | B05 + B06 | ✔ present |
| FACILITY → AVAIL | B07 + B08 | ✔ present |
| PENDING | B09 | ✔ present |
| BULK | B10 (grouped) | ✔ present |
| COMPARE | B11 | ✔ present |
| (TXN entry from FACILITY) | B12 Purchase Intent | ✔ implicit TXN entry |
| TXN | B13 Tracking | ✔ present |
| QR | B14 QR sheet | ✔ present |
| TXN stages (payment/complete) | B15/B16/B17 | ✔ in-tracking stage |
| MENU | B18 History | ✔ menu link exists |
| ONBOARD | Shared | ✔ demo |
| PLANS | Buyer plans | ✔ present |
| WALLET | Buyer wallet | ✔ present |

## Shared/system gaps to verify

- X01 Facility Claim → FACILITY unclaimed body ✔ (with create escape from G-02c)
- X02 Certification → read-only label display ✔
- X03 Notifications → not present yet in maquette (memo)
- X04 Search Demand Signal → bounded fixture in file ✔
- X05 Error/Recovery → toast-only currently ✔ trailing

## Additive gaps (B15 / B19 / B20)
- **B15 payment** — exists as stage inside TXN tracker; entry screen missing ⚠ needed
- **B19 saved searches** — not represented ⚠ to add
- **B20 account** — only as demo role switch ⚠ to add

All 14 primary Buyer screens are represented. Three small additions complete the audit: PAYMENT (B15), SAVED (B19), ACCOUNT (B20).

## Verdict
Audit requires 3 small additions. If founder confirms, I extend the unified file with these and return for acceptance.
