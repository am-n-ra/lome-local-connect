# Omni — Trunk Admin Slice Inventory (T-07a)

> **Plan:** `NW-PROD-OMNI-01` · **Handoff:** `HO-OMNI-04` · **Gate:** Trunk (G-04), slice Admin
> **As of:** 2026-09-03 (UTC)
> **Visual authority:** accepted unified maquette `docs/maquette/omni-species-maquette.html` (founder confirmed 2026-09-03) + spec `docs/nature-way/omni-admin-operator-maquette-set-G02b-2026-09-02.md` (A1–A8)
> **Method:** Nature Way Trunk — inventory current admin surfaces against the accepted set before closing gaps.

## Inventory: accepted set vs current Trunk (`src/trunk/TrunkApp.tsx` @ `deb5072`)

| # | Maquette surface (accepted) | Trunk today | Verdict | Gap to close |
|---|---|---|---|---|
| A1 | Console équipe — landing: queue counts + one obvious next action + contextual chips (R-01/R-02) | Admin role switch jumps straight into `reviewer` panel; no console, no counts, no next-action line | `missing` | A1 console panel with real counts (claims queue, activations, runs, audit) + next-action line + chips to A2/A5/A7/A8 |
| A2 | File de revue — claim dossier: evidence, certify / request evidence / reject w/ reason, locked when decided | `reviewer` panel + `ReviewerSheet`: queue, select, outcome, reason, submit; server `GET reviewer=queue` + `reviewFacilityClaim` | `present` | Verify key states (loading/error/decided lock) in proof; add R-03 map focus on select |
| A3 | Confiance & état opérationnel — two dimensions (D-01): internal trust transition + derived public label + operational state `Ouvert/Fermé/Temp. indispo.` | Trust transitions exist via review; **no `operational_state` column, route, or UI** (checked: no `operational_state` in `db/migrations/*` or `src/server/*`) | `missing` (Root + Trunk) | Root amendment (migration 039, non-destructive, D-01 confirmed) + admin setter route with reason + audit + UI control |
| A4 | Activation & suspension vendeurs | Present inside `ReviewerSheet`: `activationQueue`, activate + suspend/unsuspend with reason; server routes `admin/seller-activations`, `reviewer-seller-activation/suspension` | `present` | Surface entry from A1 console chip; proof |
| A5 | Gestion des rôles | `admin-roles` panel + `AdminRoleManagementSheet`; server `GET/POST /api/v2/admin/role-management`; self-assign admin blocked server-side | `present` | Proof |
| A6 | Correction compteur ventes (exceptionnelle) — founder-accepted set; reason required, audited; not part of A2 per G-02b honest boundary | No route, no UI (`qualifying_sales` only auto-increments at completion, `trunk-repository.ts:1960`) | `missing` | Admin-only route (reason required, audit event) + exceptional UI entry (A1 chip → guarded modal) |
| A7 | Sorties opérateur & push | `field-pilot` panel: runs list, create run, OSM discovery/import; server `operator=runs`, `operator-import[-batch]`; push route `/notifications/push` exists (bounded) | `partial` | Console chip to runs; push send stays `bounded` (out of slice scope unless trivial) |
| A8 | Audit & mesure — reverse-chronological decision log with reasons, filter, hop-to-object | `v2_audit_events` table exists (001); **no read route, no UI** | `missing` | `GET /api/v2/admin/audit-events` + audit panel with filter; hop-to-object = map focus (R-03) |
| R-01 | Dock minimal 3 icônes, contextual per role; nothing overlays dock | `navpill` present; role pill with Buyer/Seller/Admin/Operator per eligibility (D-06) | `present` | Proof at 4 widths |
| R-02 | Simple/direct first visit: one obvious next action | No first-visit line for admin | `missing` → folded into A1 | A1 next-action line |
| R-03 | Map-contextual: selecting a claim/audit object focuses it on the map (pin + ring) | `selectedReview` does not touch the map (no flyTo) | `missing` | Map focus on claim select + audit hop |

## Out of scope for T-07a (recorded, not silently dropped)

- Push notification sending UI (A7): server route bounded; pilot-ops feature, not needed to prove the admin gate. Owner: Nature Way, review at A7 proof or pilot ops ring.
- Measurement dashboard beyond the audit list (A8 « mesure » = success-signal queries): SDM E-20 is `bounded`; first-class analytics is a Canopy/Ring concern.

## Root amendment required (D-01 confirmed decision, RD-1 v2-canonical)

Migration `039_v2_operational_state.sql`: `v2_facilities.operational_state text not null default 'ouvert' check in ('ouvert','ferme','temporairement_indisponible')` + index. Public label derivation stays in the read path; admin never free-types labels (G-02b honest boundary).

## Acceptance for slice proof — results (2026-09-03)

1. ✅ `npm test` green: **44 files / 285 tests** (274 → 285, +11 admin tests incl. authz + reason-required + no-fabricated-trust negatives).
2. ✅ `npm run lint` (tsc) clean; `npm run build` green → `index-BCg5G0cM.js` (786 KB); `npm run check:boundary` clean.
3. ⚠️ Browser sandbox proof (local preview, bundle `index-BCg5G0cM.js`): app shell renders without JS crash — Buyer role pill, R-01 dock (⌕ ▦ ≡), map controls, menu grid sheet over fully visible map. **The admin panels themselves could not be exercised locally** (no Neon DB / Auth in the sandbox; local preview has no `/api` backend). Full truthful-chain browser + API proof remains the founder's prod step (G-04 decision condition), after applying migration 039.
4. ✅ No Buyer/Seller surface changed beyond the admin entry switch (Admin chip → console instead of reviewer queue).

## Close-out (2026-09-03, implementation)

| # | Verdict after slice | Evidence |
|---|---|---|
| A1 | `closed` | `getAdminConsole` + `GET /api/v2/admin/console`; `AdminConsoleSheet` (counts, next-action line, 4 contextual chips); role pill Admin → console (was: straight into reviewer queue) |
| A2 | `present` | unchanged logic; `onSelect` now routes through `selectReview` which focuses the map |
| A3 | `closed` | migration `039_v2_operational_state.sql` (D-01, non-destructive); `POST /api/v2/admin/facilities/:id/operational-state` (admin-guarded, reason 3–1000, audit `facility_operational_state_changed`); UI control in claim context (Ouvert / Fermé / Temp. indispo.) |
| A4 | `present` | entry surfaced from console chip (existing reviewer activation section) |
| A5 | `present` | entry surfaced from console chip |
| A6 | `closed` | `POST /api/v2/admin/facilities/:id/sales-counter` (admin-guarded, integer 0–3, no-op rejected, reason + audit `old -> new`, **trust_state untouched**); exceptional UI block in claim context |
| A7 | `partial` → kept | console chip opens operator runs; push send UI stays out of slice |
| A8 | `closed` | `GET /api/v2/admin/audit-events` (admin-guarded, type filter, limit 1–100, facility coords joined); `AdminAuditSheet` with filter + « Voir sur la carte » hop |
| R-03 | `closed` | `ReviewQueueItem` carries latitude/longitude; `TrunkMap.focusTarget` pans/zooms (zoom ≥ 14) on claim select and audit hop |

## Deploy ordering constraint (founder)

`039_v2_operational_state.sql` must be applied on Neon **before** pushing `omni-v2-rebuild` to prod: the new routes reference `v2_facilities.operational_state`. Order: ① founder applies 039 on Neon SQL editor → ② founder pushes (push = prod deploy) → ③ G-04 browser + API proof of the admin chain on prod.
