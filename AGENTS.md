# AGENTS.md — lome-local-connect (Omni)

Repository memory for OpenHands agents working on Omni.

## What this project is
Omni: a map-first, constraint-based search engine for local supply (Lomé field pilot first). A buyer finds where something exists near them, learns whether it can satisfy their request now, and converts that into a QR-traced Omni transaction. Sellers of any shape become supply without maintaining a full inventory.

## Active operating plan
- **Founder HQ Master Plan:** `docs/founder-hq/founder-hq-master-plan.md` (`HQ-OMNI-2026-09-02`).
- **Board:** `docs/founder-hq/founder-hq-board.md`.
- **Specialist plan:** `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-01.md`.
- **Intent Brief (founder-confirmed):** `docs/nature-way/omni-intent-brief-2026-09-02.md`.
- **System Dependency Map:** `docs/nature-way/omni-system-dependency-map-2026-09-02.md`.
- Method skills live in `.agents/skills/` (nature-way ecosystem). Always start via Nature Way Founder HQ; route product work to `/nature-way`.

## Current gate (as of 2026-09-02)
Gate 2 — **Species**. Order of acceptance: **Admin/operator → Seller → Buyer** (founder decision #7).
- G-02a (audit existing maquettes): **done** → `docs/nature-way/omni-species-audit-G02a-2026-09-02.md`.
- G-02b (Admin/operator maquette set): **ACCEPTED (founder 2026-09-02)** → `docs/maquette/omni-species-maquette.html` + spec `docs/nature-way/omni-admin-operator-maquette-set-G02b-2026-09-02.md`. **Renamed 2026-09-02 to unified master file.**
- G-02c (Seller maquette): **ACCEPTED (founder 2026-09-02)** — same sheet/grid inheritance, no divergence → in same unified `omni-species-maquette.html` + spec `docs/nature-way/omni-seller-maquette-set-G02c-2026-09-02.md`. Next: G-02d Buyer.

- **G-03 Root System (2026-09-02):** inspection report `docs/nature-way/omni-root-inspection-G03-2026-09-02.md`. **RD-1 (founder decision): v2-canonical — v2_* is the only root schema; public.* frozen for new tables.** Migration `038_v2_g03_root_gaps.sql` closes: RG-1 product availability state + freshness (D-02/D-03), RG-2 StockEvent ledger (S5), RG-3 saved searches (B19), claim requests ported to v2 (S1). **APPLIED: founder executed 038 on Neon SQL editor 2026-09-02, all statements success (manual proof class).**


- **G-04 Trunk VERIFIED ON PROD (2026-09-02):** deployed to `omni.sparkafrika.online` (commit 8ef1400, bundle `index-rQmYubTH.js`).
  - **Live test results with `demo@seller.omni` (Omni@2026):**
    1. Neon Auth sign-in → JWT token issued (200 OK)
    2. `GET /api/v2/seller/catalogue` returns 6 real products from "Omni Demo Seller Hub" with new G-03/G-04 fields (`availabilityState: 'a_valider'`, `availabilityProEligible: false`)
    3. `POST /api/v2/seller/catalogue/:id/availability` rejects non-Pro facility with **409 Conflict** (D-04 entitlement guard verified on live prod)
    4. `POST /api/v2/wallet/pro` validates wallet balance and slot rules on live prod
    5. `GET /api/v2/seller/catalogue/:id/stock-events` route active and protected (401 without auth)
  - Vercel build pipeline stabilized on `npm@10.9.8` with single maintained `package-lock.json`.
- **G-04 Trunk — Seller availability loop (2026-09-02, commit 2d4b487):** product availability setter (facility_pro-gated per D-04), StockEvent history view (S5), opportunistic freshness expiry via v2_expire_stale_availability (D-03). Files: trunk-repository.ts (+setProductAvailability/listProductStockEvents, catalogue lists availability), http.ts (+2 routes), trunk/api.ts, trunk/types.ts, TrunkApp.tsx (catalogue availability control + Historique panel), +6 repository tests. **Proven:** 274/274 tests, build green, route dispatches locally. **Blocked:** prod omni.sparkafrika.online serves stale deploy (new routes NOT_FOUND while older routes 401) — Vercel not picking up omni-v2-rebuild pushes; — update 2026-09-02 21:45: npm pinned via packageManager=npm@10.9.8 (commit 3d3b3ec) after pnpm frozen-lockfile failure; prod still serves stale bundle (hash mismatch: prod Cg1UeOOH vs local C_BL1ui-); latest build log needed.
- **G-04 Trunk — reconciliation pass (2026-09-03, HO-OMNI-04):** founder asked « développer la V1 » with a maquette reference. Founder HQ Master Plan + Board reconciled (they were stale, still showed G-02c active): Gates 1–3 `done`, **Gate 4 Trunk active**. Evidence observed this session: `npm ci` + `npm test` → **44 files / 274 tests pass @ `deb5072`**; `npm run build` → `index-DzG1YV4e.js`; prod `omni.sparkafrika.online` serves **the same hash** → **2026-09-02 stale-deploy blocker RESOLVED**. Local plan `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-01.md` extended: T-07a Admin slice inventory/proof `ready` (single active slice), T-07b Seller, T-07c Buyer, T-08 integrated proof `planned`; T-07d deploy-freshness guardrail `done`. Open founder question: is the mentioned maquette the accepted unified `docs/maquette/omni-species-maquette.html` or a NEW artifact (→ Species re-audit before Trunk inherits)?
- **G-04 Trunk — T-07a Admin slice IMPLEMENTED (2026-09-03, HO-OMNI-04):** founder confirmed the unified maquette is the authority (Species stays closed). Inventory vs accepted A1–A8 (`docs/nature-way/omni-trunk-admin-inventory-T07a-2026-09-03.md`): A2/A4/A5 already present; closed A1 console (`GET /api/v2/admin/console` + `AdminConsoleSheet` w/ counts + next-action + chips; Admin pill → console), A3 operational state (migration **`039_v2_operational_state.sql`** + `POST /admin/facilities/:id/operational-state`, admin-guarded, reason + audit), A6 exceptional counter correction (`POST /admin/facilities/:id/sales-counter`, 0–3, no-op rejected, **trust_state untouched**), A8 audit log (`GET /admin/audit-events` + `AdminAuditSheet` + hop-to-map), R-03 (`ReviewQueueItem` lat/lng + `TrunkMap.focusTarget` easeTo ≥14 on claim select / audit hop). **Proven:** 285/285 tests (+11), tsc clean, build `index-BCg5G0cM.js`, boundary clean; sandbox browser shell proof only (no DB/Auth locally). **Status 039: APPLIED — founder executed `039_v2_operational_state.sql` on Neon SQL editor 2026-09-03 (manual proof class, same class as 038). Remaining founder steps: ① push (= prod deploy, founder-only) → ② prod proof of admin chain (script `scripts/prove-v2-admin.mjs` ready) → T-07a closes → T-07b Seller.** Prod before push (observed 2026-09-03): `/api/v2/admin/console` + `/admin/audit-events` = 404, bundle `index-DzG1YV4e.js` (pre-T-07a) — push is the only missing step.
- G-02d (Buyer maquette): **ACCEPTED (founder 2026-09-02)** — audit complete, PAYMENT/SAVED/ACCOUNT added. Species gate now closed across all four roles (Admin/Seller/Buyer/Operator). Next gate: **Root System (G-03)** — schema, contracts, invariants.
- **Art direction locked (founder 2026-09-02): liquid glass** — inherit the REAL `LiquidGlass` tokens from `src/components/ui/LiquidGlass.tsx` (ink #1A1C1B, forest #234D40→#1A3B31, accent coral #F08F5A; surfaces bg-white/70..95 backdrop-blur-md..2xl border-white/40..80). **Logo = location pin with an eye inside, 3D-shaped** (SVG gradients + iris). All flows épurés/minimalistes, map-centric, contextual (surfaces = frosted overlays over the map, not separate dashboards).
- **Admin screen set A1–A8** (founder accepted): A1 Console équipe, A2 File de revue, A3 Confiance & état opérationnel (two dimensions per D-01), A4 Activation/suspension vendeurs, A5 Gestion rôles, A6 Correction compteur (exceptionnelle), A7 Sorties opérateur & push, A8 Audit & mesure. Public trust label `Non revendiquée`/`Non confirmée`/`Confirmée`; `Certifiée` = internal milestone; separate operational state `Ouvert`/`Fermé`/`Temp. indispo.`.
- Founder rules: **R-01** dock = minimal floating pill at bottom, **3 icons** (search ⌕ · QR ▦ · menu ≡), contextual per role (Buyer ⌕→search dock, ▦→scan facility public QR, ≡→menu grid; Admin pin/search → admin sheet); **R-02** simple/direct; **R-03** map is the heart for EVERY flow, **always fully visible**, content = partial bottom sheets/grids only; **admin is a role in the top pill** (Buyer default, +Seller/+Admin/+Operator if eligible — one identity + capability, D-06); facility pin-click shows **buyer info vs admin review sheet** (different per role).
- **FINAL PALETTE (locked 2026-09-02): monochrome** — ink `#0f0f0f`, white, panel `#f7f7f7`; **one accent `#2e8b6f`** (desaturated green, close to ink/white dominance) = "En stock / Vérifié" only. Map = white base, **REAL continent silhouette**, single circular count marker. **Naming (unambiguous):** `En stock`, `Vérifié`, `À valider`, `Non revendiquée`, `Bientôt`.
- **ORDER OF EXISTENCE (locked):** Admin → Seller → Buyer. Contractually: **Facility before Offer**; **verification before availability is shown**; place → listing → discovery → intent → transaction.
- **EVERYTHING CONTEXTUAL (locked):** dock, search, plans, constraints all adapt to **screen + focused sheet + role + active constraints**. Horizontal **result grid** with thumbnails; **search dock compact at first** (constraints reveal on typing, per-role); **facilities/products have visuals**; **unclaimed facilities** show a claim body; **comparison + bulk availability**; **plans differ by role** (Seller ≠ Buyer); **search is role-scoped** (Seller→own companies/facilities, Admin/Operator→review objects).
- **REFINEMENTS (transaction-room pass, 2026-09-02):** **transaction room** = one sheet where **QR is the gateway** into the locked flow; inside it a **state-tracking timeline intent → rating** and **transaction-scoped chat**; **back disabled only inside the locked transaction flow** (cancel/advance), free elsewhere; **nothing overlays the bottom dock**; **scrollbars hidden**; **SVG line icons** (not unicode stickers) aligned with Omni V1 master.
- Root and Trunk stay **planned**; **no code** until Species accepted. Do not resume PR 2–6 of `OMNI-V3-MASTER-PLAN.md`.

## Confirmed decisions (D-01…D-07, see Intent Brief)
D-01 keep 9 internal trust states + derive public label + separate operational state (open/closed/temporarily_off). D-02 Product→Offer in contracts; add StockEvent ledger. D-03 deterministic auto-availability in V1 (facility_pro-gated). Freshness 4 h fresh / 24 h expired, facility-level setting. D-04 entitlements per facility (seller), per account (buyer); $20 bonus locked until confirmed. D-05 browse without account; search/availability/buy require auth. D-06 one identity + capability toggle. D-07 nothing pre-accepted.

## Key authoritative artifacts
- MV1 screen spec: `docs/omni-v1-screen-and-state-specification.md` (§4 screen registry, §75–77 completion/contract, §78 build order). Note: MV1 lists NO dedicated admin/operator screen — admin is implied by X02 Certification + governance parent in SDM; the founder's Admin-first build order fills that gap.
- Species blueprint: `docs/omni-species-blueprint-2026-08-27.md` (§4D Admin/Reviewer/Operator; §2 design system).
- Existing prototype (buyer/seller/admin stubs): `docs/omni-species-html/index.html` + `app.js`. Design tokens in `:root` of index.html.

## Branch rule (founder locked 2026-09-02)
**Only `omni-v2-rebuild` is touched.** Never merge to `main`. "Merge" means "push prod branch"; feature branches merge into `omni-v2-rebuild` only if founder explicitly names one.

## Commands
- `npm install`, `npm test` (29 files / 184 tests as of last run), `npm run lint` (tsc). Build: Vite. Deploy: Vercel (prod frozen for product changes).

## Conventions
- French UI (vouvoiement). Mobile-first PWA. MapLibre only (no Google Maps). Neon Postgres. FedaPay for wallet reloads only.
- Preserve existing DB records/identities by default; destructive migration needs a confirmed decision.
- Maquette before pixels, contract before code. Evidence > optimism. No orphaned layers.
* All UI must reference `docs/design.md` vocabulary (committed); legacy `omni-sheet`, `glass-*`, `liquid-*` aliases are retired — use `.sheet`, `.pitem`, `.hcard`, `.status`, `.btn`, `.cardbox`, `.searchdock`, `.chip`, `.compte`, `rolepill`, `.navpill` only. Trust accent `#2E8B6F/#EEF4F1` only for `.vmark` / `.status.ok`.
