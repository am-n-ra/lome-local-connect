# Intra-skill Plan — `NW-PROD-OMNI-RD-01`

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02`
> **Local Plan ID:** `NW-PROD-OMNI-RD-01`
> **Assigned gate:** `ROOT` (Species close `founder-confirmed` 2026-09-25)
> **Local owner:** `/nature-way`
> **Founder decisions this pass:** « retirer » (`SP-V2-01` / `R-C`) · « r-d » (`R-D`)

## Resource Receipt

| Status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `references/intra-skill-execution-controller.md` |
| Loaded | `references/execution-controller.md` |
| Loaded | `references/risk-and-escalation-matrix.md` |
| Loaded | `references/prerequisite-architecture.md` (dependency logic for seller→offer→buyer chain) |
| Template instantiated | `templates/intra-skill-plan.md` (this document) |
| Loaded (state of record) | `docs/nature-way/omni-root-finishing-inventory-2026-09-25.md` · `docs/founder-hq/handoff-receipt-HO-OMNI-22.md` · `db/migrations/058_v2_entity_layer_r1.sql` |
| Not loaded / reason | `templates/system-dependency-map.md` — the map exists (`omni-system-dependency-map-2026-09-02.md`); this slice adds no new actor. `templates/production-evidence-register.md` — no release decision this pass. |

## Measurement that changed the slice — `R-D` is not what the inventory said

The inventory (`omni-root-finishing-inventory-2026-09-25.md`) described `R-D` as:

> « `C-6` est **corrigé en code**, mais **0 entité `individu`** existe en base… **Finition** : créer une entité `individu` de bout en bout. **Effort : petite** (fixture + preuve). »

**That is wrong, and re-measuring before executing is exactly what this session's lesson demands.** The truth, code-verified:

| Claim | Measured |
|---|---|
| « `C-6` corrigé en code » | **True for the threshold**, false for the *path*: the server branches `case when e.kind = 'individu'` at **4 sites** (`:3202`, `:3253`, `:3541`, `:3614`). |
| « créer une entité `individu` … fixture + preuve » | **A fixture would be a lie.** `createSellerFacility` hardcodes `'organisation'` (`:1222`). **No code path in `src/` can produce `kind = 'individu'`.** A row inserted by hand would prove a path that **does not exist** — a demo row, not a working path. |

**So `R-D` is not a fixture task; it is a missing product capability.** The Seed promise (« un particulier vend sans structure ») has **no way to be expressed**. The honest slice is therefore: **let the seller declare it, then exercise it for real.**

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | `SP-V2-01` removal | 3 orphan offers archived; dead-end request path closed | live before/after counts | `ready` | founder reverses |
| 2 | `R-D` mechanism | seller can declare `individu`; persisted; read back | SQL + repo + http + api tests | `ready` | schema rejects a real case |
| 3 | `R-D` exercise | real individu → offer → 1 sale → threshold **1** | live end-to-end proof | `ready` | a 2nd sale is needed for trust |
| 4 | Guards falsified | each guard fails on the pre-fix state | falsification runs | `ready` | guard cannot fail |

## Dependency-aware task tree

| ID | Parent | Structural path / phase | Objective | Depends on | Owner | Status | Acceptance / proof | Risk/debt boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| G-RD | — | `root > entity-kind` | `individu` expressible + exercised | `ROOT` open | `/nature-way` | `in_progress` | live proof T1–T5 | no new actor | schema gap |
| T-RC-1 | G-RD | `root > data > sp-v2-01` | archive the 3 orphan offers | founder « retirer » | `/nature-way` | `ready` | 0 published ownerless | **data only, reversible** | founder reverses |
| T-RD-1 | G-RD | `root > data > entity-kind` | migration: entity kind is a declared field, not a default | T-RC-1 | `/nature-way` | `todo` | idempotent; temp-branch proof | additive only | existing rows change |
| T-RD-2 | G-RD | `root > server > facility-create` | seller declares `individu`/`organisation` | T-RD-1 | `/nature-way` | `todo` | repo + http tests | free-slot rule untouched | — |
| T-RD-3 | G-RD | `root > client > seller-form` | seller chooses nature; honest labels | T-RD-2 | `/nature-way` | `todo` | tsc + build | **no new design pattern** | new pattern needed |
| T-RD-4 | G-RD | `root > proof > live` | real individu → 1 sale → threshold 1 | T-RD-2 | `/nature-way` | `todo` | live branch proof | disposable branch | append-only tables |
| T-RD-5 | G-RD | `root > guard` | falsified guards for the path | T-RD-4 | `/nature-way` | `todo` | exit 1 on pre-fix | — | — |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-09-26 | Inventory described `R-D` as « fixture + preuve, effort petite »; measurement shows **no code path can create `individu`** | Split `R-D` into mechanism (`T-RD-1…3`) + exercise (`T-RD-4`) | **advance** with the honest scope | `/nature-way` | after live proof |
| 2026-09-26 | Founder ordered « retirer » for `SP-V2-01` and « r-d » | Added `T-RC-1` | **advance** | `/nature-way` | — |

## Handoff to Founder HQ

> **Local status:** `in_progress`
> **Gate decision:** `advance`
> **Closed:** —
> **Open:** `T-RC-1`…`T-RD-5`
> **Resource Receipt:** see above
> **Residual gap:** the *real* residual is not « no individu row » but « **no way to declare one** »
> **Next smallest action:** archive the 3 orphan offers, then migration + seller nature field
> **Re-plan trigger:** the Seed intends `individu` to be automatic (e.g. derived from offer count) rather than declared — that would change the slice
