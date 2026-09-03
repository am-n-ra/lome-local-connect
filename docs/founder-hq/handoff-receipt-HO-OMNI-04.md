# Skill Handoff and Activation Receipt

> **Request ID:** `HO-OMNI-04`
> **Founder HQ timestamp:** 2026-09-03 (UTC)
> **Primary authority:** Nature Way
> **Exact invocation:** `/nature-way`
> **Activation status:** `activated` (skill present at `.agents/skills/nature-way/SKILL.md`, loaded in this session)

## Handoff input

| Field | Value |
|---|---|
| User objective | « Ce projet doit être développé dans sa V1 » + le fondateur a fait une maquette représentant le placement des éléments — demande : que faire ? |
| Current milestone and gate | M-01 pilot-ready V1 loop. Gates 1–3 `done` (Seed confirmed; Species G-02a–d accepted; Root `038_v2_g03_root_gaps.sql` applied on Neon). **Gate 4 — Trunk — active.** |
| Structural path / venture stage | Trunk, locked order Admin → Seller → Buyer, each actor slice proven before the next starts. |
| Relevant artifacts and proof | Unified maquette `docs/maquette/omni-species-maquette.html` (+ `.md` contract, `.png` render); specs `docs/nature-way/omni-*-maquette-set-G02*`, audit `omni-species-audit-G02a-2026-09-02.md`, buyer audit `omni-b02-buyer-audit-G02d-2026-09-02.md`; Root inspection `docs/nature-way/omni-root-inspection-G03-2026-09-02.md`; SDM `docs/nature-way/omni-system-dependency-map-2026-09-02.md`; Intent Brief `omni-intent-brief-2026-09-02.md` (D-01…D-07); git `omni-v2-rebuild` @ `deb5072`; seller availability loop proven locally 274/274 tests @ `2d4b487`; prod stale-deploy recorded 2026-09-02, re-verification pending. |
| Dependencies and constraints | Capacity: one gate, one specialist, one vertical slice (solo founder + AI). Branch rule: only `omni-v2-rebuild`; never merge to `main`. Decisions D-01…D-07 locked. Art direction locked: liquid glass + monochrome palette + one accent `#2e8b6f`; map-first, contextual surfaces; R-01…R-03. Design vocabulary per `docs/design.md` (`.sheet`, `.pitem`, `.hcard`, `.status`, `.btn`, `.cardbox`, `.searchdock`, `.chip`, `.compte`, `rolepill`, `.navpill`). |
| Secondary route | None. |
| Expected specialist return | Active gate; identification of the founder's maquette artifact (existing accepted unified maquette vs NEW artifact → Species re-audit branch); Trunk V1 execution sequence (Admin → Seller → Buyer slices) with per-slice acceptance + proof plan (API + browser evidence); prod deploy re-verification result; residual gap; owner; next smallest action; Resource Receipt; task-tree changes. |

## Specialist resource receipt

| Resource status | Exact path or explanation |
|---|---|
| Loaded (Founder HQ orchestration resources) | `.agents/skills/nature-way-founder-hq/references/ecosystem-orchestration-protocol.md`; `references/intra-skill-execution-controller.md`; `references/ecosystem-activation-manifest.md`; `references/founder-hq-board.md` |
| Template instantiated | `templates/skill-handoff-receipt.md` → this receipt; `templates/founder-hq-master-plan.md` → reconciled (existing plan `HQ-OMNI-2026-09-02`, not recreated) |
| Not loaded / reason | `references/portability-protocol.md`, `templates/portable-starter` — no migration/transfer in scope. Nature Way loads its own phase references (Species audit / Trunk delivery gates) at activation. |

## Dispatch result

Nature Way takes control of Gate 4 — Trunk, with a Species re-audit branch if the founder's maquette is a NEW artifact rather than the accepted unified `docs/maquette/omni-species-maquette.html`. Founder HQ waits at the dispatch boundary for the specialist return handoff (gate, evidence, residual gap, owner, next smallest action, task-tree changes) before reconciling the Master Plan.
