# Founder HQ Board — Omni

**As of:** 2026-09-03 (UTC)  
**Plan:** `HQ-OMNI-2026-09-02` (`docs/founder-hq/founder-hq-master-plan.md`)  
**Supersedes:** `v2-founder-hq.md` (2026-08-25) as the operating index. That file is kept as history.

| Area | Current truth | Authority / record | Gate or status | Owner | Next action | Capacity / risk |
|---|---|---|---|---|---|---|
| Active milestone | M-01: pilot-ready V1 loop derived from `OMNI — MASTER V1`. Seed confirmed 2026-09-02. Rebuild order fixed by the founder: **Admin/team ops → Seller → Buyer**, then a seller + buyer + team operator prove the loop. | Confirmed Intent Brief; HQ Master Plan | Gate 1–3 `done`; **Gate 4 Trunk — `active`** | Founder + Nature Way | Founder confirmed 2026-09-03: maquette = accepted unified (`docs/maquette/omni-species-maquette.html`) → Species stays closed. Nature Way executes T-07a Admin slice: inventory vs A1–A8 + R-01/02/03, close gaps, prove slice. | Do not resume PR 2–6 of `OMNI-V3-MASTER-PLAN.md` beyond Trunk slices. |
| Product proof | Root applied: `038_v2_g03_root_gaps.sql` on Neon (founder, 2026-09-02, manual proof). Trunk: seller availability loop + stock events proven locally; **274/274 tests pass @ `deb5072` (observed 2026-09-03)**; SearchDock maquette-aligned rewrite @ `deb5072` (current HEAD). **Prod deploy current: `omni.sparkafrika.online` hash `index-DzG1YV4e.js` === local build (observed 2026-09-03) — 2026-09-02 stale-deploy blocker resolved.** | `db/migrations/038_*`, `src/server/*`, `src/trunk/*`, git `omni-v2-rebuild` | `in progress — Trunk slices Admin → Seller → Buyer` | Nature Way | T-07a `in_progress`: Admin slice inventory vs accepted A1–A8 maquette, close gaps, prove slice (API + browser, 4 widths). | Existing code is evidence to inspect; slice proofs not yet recorded. |
| Customer / commercial | Lomé field pilot intended; no live customer transaction evidence in repo beyond demo/bounded fixtures. | `v2-field-pilot-*.md`, `docs/omni-production-walkthrough-2026-08-27.md` | `unproven` | Founder | None until Trunk proof. | Do not present demo seed as marketplace traction. |
| Capital / runway | Not in scope; no capital process active. | — | `inactive` | Founder | — | — |
| Opportunity pipeline | None active. | — | `inactive` | — | — | — |
| Release / operations | `omni-v2-rebuild` auto-deploys to Vercel prod; skills bundle merged (#75). No release decision is open. | Git, `vercel.json` | `frozen for product changes` | Founder HQ | Keep prod stable; docs-only PRs until Species and Root close. | Any UI/migration PR before Seed acceptance repeats the rushed pattern. |
| Decisions | **Resolved 2026-09-02:** D-01 keep 9 internal trust states, derive public label, add operational state; D-02 Offer naming + `StockEvent` ledger; D-03 deterministic auto-availability in V1, `facility_pro`-gated; freshness 4 h fresh / 24 h expired (accepted recommendation); D-04 supply≠facility location deferred post-V1; D-05 seller entitlements per facility, buyer credits per account (accepted recommendation); D-06 one identity, buyer+seller capabilities, mode switch. **Open:** D-07 which existing maquettes survive — answered by the Species audit. | Intent Brief § Founder confirmation | `resolved except D-07` | Founder | Accept/reject maquette sets in build order. | Reopening any decision reopens Seed. |

## Branch rule (founder locked 2026-09-02)

Only `omni-v2-rebuild` is touched. Never merge to `main`. "Merge" = "push prod branch". Feature branches merge into `omni-v2-rebuild` only if founder explicitly names one.

## Current gate

> **Gate 1 — closed** (founder confirmation 2026-09-02).
> **Gate 2 — Species — closed** (G-02a audit; G-02b/c/d all accepted 2026-09-02; unified master `docs/maquette/omni-species-maquette.html`).
> **Gate 3 — Root — closed** (inspection `omni-root-inspection-G03-2026-09-02.md`; `038_v2_g03_root_gaps.sql` applied on Neon by founder).
> **Gate 4 — Trunk — open.** Order Admin → Seller → Buyer, each slice proven before the next. Founder request 2026-09-03 (« développer la V1 », maquette de placement) dispatched to Nature Way as `HO-OMNI-04`. Branch rule locked (see above). Canopy/Rings stay planned.
