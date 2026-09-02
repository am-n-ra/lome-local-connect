# Omni Seller Maquette Set — G-02c Spec

**Status:** Species (mini-pass) | Inherits locked parent direction (G-02b accepted 2026-09-02)
**Gate:** G-02c | **Owner:** Nature Way | **Decides:** Seller visual layer before Root System contracts
**Acceptance:** Founder (visual acceptance signal)

---

## 1. Locked inheritance (from G-02b)

Binding on every seller screen — no re-exploration:

- **Art direction:** liquid glass; surfaces = frosted overlays over map, NOT separate dashboards
- **Logo:** location pin with eye inside, 3D-shaped, SVG gradients + iris
- **Palette:** monochrome — ink `#0f0f0f`, white, panel `#f7f7f7`; ONE accent `#2e8b6f` = "En stock / Vérifié" only
- **Tokens (LiquidGlass):** ink `#1A1C1B`, forest `#234D40→#1A3B31`, coral `#F08F5A`; surfaces bg-white/70..95 backdrop-blur-md..2xl border-white/40..80
- **Map:** always fully visible, real continent silhouette, single circular count marker
- **Dock:** minimal floating pill, bottom; **3 icons only** (⌕ ▦ ≡); contextual per role
- **Protected surface:** nothing overlays the dock; scrollbars hidden; SVG line icons (not unicode)

## 2. Public/ops label system (unchanged from G-02b)

- Public trust labels: `Non revendiquée` / `Non confirmée` / `Confirmée`
- Operational states: `Ouvert` / `Fermé` / `Temp. indispo.`
- Availability states: `En stock` / `Vérifié` / `À valider` / `Non revendiquée` / `Bientôt`
- `Certifiée` = internal milestone only, NOT public

## 3. Role/system context

- **One identity, buyer default → Seller capability toggle** in top pill (D-06)
- **Search scope:** Seller searches own companies + own facilities only (per R-specs)
- **Entitlements:** per facility (D-04) — a seller may have one free + one facility_pro facility
- **Order of existence:** Admin → Seller → Buyer (seller inherits admin's pattern language)

## 4. Screen set S1–S9

Each is a **bottom sheet** or **contextual panel** floating over the always-visible map, in the liquid-glass/sidebar pattern inherited from A1–A8 admin.

| ID | Name | Trigger | Content/spec |
|---|---|---|---|
| **S1** | Seller onboarding / facility claim | First entry into Seller mode (no facility yet), OR facility pin click on `Non revendiquée` facility | Claim body: facility name, geolocation confirm, role declaration, phone, **Plus a "Facility not on map? Create new" escape path at bottom** (per V1 Master §57: unclaimed ≠ invisible; claim = preferred path, creation = escape). Map shows the target pin centered. |
| **S2** | Facility sheet — owned | Own facility pin click | Facility: photo hero, name, operational state toggle (Ouvert/Fermé/Temp. indispo.), counts (products, pending verification, active transactions), CTAs: add product, open transactions, edit |
| **S3** | Add product → catalogue | CTA from S2 | Form over map: product name, category, photo, base price, unit, initial availability state |
| **S4** | Availability setter | Button on S3 product, or product list item | Two-step: state pill (`En stock` / `Vérifié` / `À valider` / `Bientôt`) + freshness window (4h fresh / 24h expired per D-03) — only visible if facility_pro |
| **S5** | StockEvent history (ledger view) | From S2 → "Historique stock" | Read-only reverse-chron StockEvent ledger: actor, timestamp, state transition, source (auto vs manual). Bounded: D-02 says ledger exists. |
| **S6** | Transaction room — seller side | From incoming transaction OR from transactions list | QR-as-gateway when buyer opens; inside: state-tracking timeline (intent → confirmation → QR → completion → rating) + transaction-scoped chat; back disabled in locked flow |
| **S7** | Transactions list | CTA from S2 → "Transactions" | Active / past transactions, filters: state, date; per-item: buyer display, price, current transition, unread messages badge |
| **S8** | Plans & entitlements (per facility) | Menu ≡ → Seller plan | Compare free vs facility_pro on this facility: deterministic auto-availability, facility_pro price, renewal, transaction history gate. NOT a seller-account page — plans exist per facility (D-04) |
| **S9** | Facility review status | Read-only banner on S2 when facility is non-confirmed | Current trust label (`Non revendiquée` / `Non confirmée`), what admin sees, next step ("Complétez le profil" / operator contact), no self-override |

## 5. Dock behavior in Seller mode

| Icon | Seller-context behavior |
|---|---|
| ⌕ (search) | Compact search dock; constraints reveal on typing; search scope = own companies + own facilities only |
| ▦ (QR) | Scans incoming transaction QR to open transaction room as seller counterpart |
| ≡ (menu) | Menu grid: S2 (own facilities), S7 (transactions), S8 (plans), account |

## 6. Non-goals (explicitly deferred)

- Root/System contracts for seller operations → Root System phase (G-03)
- Code/implementation → Trunk (G-04)
- Buyer maquette → G-02d (after this gate)
- Facility creation by admin/operator (covered in G-02b admin set)
- Multi-facility seller dashboard beyond per-facility sheet → D-04 deferred to post-V1

## 7. Founder review-request list (what acceptance judges)

1. Pattern continuity with accepted A1–A8 (visual language, surfaces, dock behavior)
2. Screen completeness S1–S9 (nothing missing for V1 seller loop)
3. Claim/claimless facility flows (S1 + S9) respect D-04, D-05
4. Transaction room consistent with admin's transaction-room refinements
5. Public labels + ops states + availability states presented correctly
6. French UI (vouvoiement); mobile-first PWA targets

## 8. After acceptance

→ Founder HQ closes G-02c, next gate dispatch: Buyer maquette set (G-02d), same pattern.
