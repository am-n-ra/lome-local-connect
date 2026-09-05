# Founder HQ Board — Omni

**As of:** 2026-09-03 (UTC)  
**Plan:** `HQ-OMNI-2026-09-02` (`docs/founder-hq/founder-hq-master-plan.md`)  
**Supersedes:** `v2-founder-hq.md` (2026-08-25) as the operating index. That file is kept as history.

| Area | Current truth | Authority / record | Gate or status | Owner | Next action | Capacity / risk |
|---|---|---|---|---|---|---|
| Active milestone | M-01: pilot-ready V1 loop derived from `OMNI — MASTER V1`. Seed confirme 2026-09-02. Rebuild order fixe par le fondateur: **Admin/team ops → Seller → Buyer**, puis seller+buyer+team operator prouvent la boucle. | Confirmed Intent Brief; HQ Master Plan | Gate​​1—4 `done`; **Gate 5 Branches/UI — `active`** | Founder + Nature Way | Foundateur a confirme 2026-09-03 la maquette unifiee et la cloture de Gate​​4; travail G-05 execute(commits `51c24a6`→`986fc8d`, T-10…T-10r, retours PC fondateur integres(. Nature Way: inventaire UI final vs maquette V1.1 → fermeture gaps → preuve (navigateur 4 largeurs + prod( → cloture Gate​​5. | Ne pas elargir le perimetre au-dela de M-01 (pas de PR 2—6; Canopy attend Gate​​​5 clos(. |
| Product proof |Root applique: `038_v2_g03_root_gaps.sql` + `039_v2_operational_state.sql` sur Neon (fondateur, manuel(. Trunk: slices Admin/Seller/Buyer prouvees en prod(9/9, 8/8,  8/8(, **preuve integree 16/16** (correlation `65488663-91f4-4347-ba46-4fd9d600991d`, commit `ebd9d80`) → **Gate​​4 CLOSED 2026-09-03** (decision fondateur: console admin suffit pour le volet operateur(. G-05/Branches UI execute(commits `51c24a6`→`986fc8d`, T-10…T-10r(; tests rapportes 296/296 a T-10l, puis retours PC integres. | `db/migrations/038_*`/`039_*`, `src/server/*`, `src/trunk/*`, `src/` (UI(, git `omni-v2-rebuild` HEAD `986fc8d` | `in progress — Gate​​5: inventaire UI final + conformite` | Nature Way | T-10r+ (Gate​​5(: inventaire des surfaces UI vs maquette unifiee V1.1 (Admin/Seller/Buyer, 4 largeurs(, fermeture gaps, `npm test` + build + verif bundle prod `===` build local, puis cloture Gate​​5. | Gaps UI eventuels a fermer avant cloture Gate​​​5; aucune preuve navigateur 4 largeurs enregistree pour G-05. |
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
> **Gate 4 — Trunk — closed 2026-09-03** (console admin = volet opérateur — décision fondateur; preuve intégrée 16/16(.
> **Gate 5 — Branches/UI — open.** Surfaces UI conformes à la maquette unifiée V1.1 acceptée(travail T-10…T-10r déjà exécuté et intégrant les retours PC du fondateur(; reste à prouver la conformité finale(inventaire, 4 largeurs, `npm test`, build, prod(hash===build(, puis clore la gate. Nature Way en contrôle via la même route (`/nature-way`(. Branch rule locked( voir ci-dessus(. Canopy/Rings restent planned(Gate​​6 = Canopy/launch-readiness, en `watch`(.