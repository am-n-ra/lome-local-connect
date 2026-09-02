# Skill Handoff and Activation Receipt — HO-OMNI-03

> **Request ID:** `HO-OMNI-03`
> **Founder HQ timestamp:** 2026-09-02 (UTC)
> **Primary authority:** Nature Way (Species gate, G-02a + G-02b)
> **Exact invocation:** `/nature-way`
> **Activation status:** `activated` (skill present at `.agents/skills/nature-way/SKILL.md`, loaded in this session)

## Dispatch Record

| Field | Value |
|---|---|
| Classification | Product / Species maquette work — Admin/operator surface design. Not capital, opportunity, capability, or reflection. |
| Primary skill | `/nature-way` — Species gate (G-02a audit of existing maquettes, then G-02b Admin/operator maquette set with three new founder rules). |
| Reason | The founder is adding product rules to the Admin/operator maquette (G-02b). The Founder HQ product guardrail requires Nature Way to inspect the existing maquettes, run the Species audit (G-02a), and produce/accept the Admin/operator set before Root/Trunk. The existing prototype already has a bottom-docked `bottom-nav` (buyer) and minimal `admin()`/`adminReview()` screens — these are candidates to audit, not accepted Species. |
| Secondary handoff | None. `/nature-way-venture-lifecycle` remains on `watch`. |
| Known artifacts | `docs/founder-hq/founder-hq-master-plan.md` (HQ-OMNI-2026-09-02); `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-01.md`; `docs/nature-way/omni-intent-brief-2026-09-02.md` (founder-confirmed); `docs/nature-way/omni-system-dependency-map-2026-09-02.md`; `docs/omni-species-blueprint-2026-08-27.md` §4D (Admin/Reviewer/Operator); `docs/omni-species-complete-maquette-inventory-2026-08-27.md`; `docs/omni-species-html/index.html` + `app.js` (existing prototype incl. `bottom-nav`, `admin()`, `adminReview()`); `docs/maquette/omni-species-maquette.html`. Prior maquette URLs (`omni-admin-operator-maquette.png/.html` at `work-1-rzeifabagwoechdf`) are from a prior runtime host no longer reachable; local equivalents are the `docs/omni-species-html/` prototype and `docs/maquette/`. No standalone Admin/operator maquette set exists today (G-02b status `planned`, none exists). |
| First required gate | Species — G-02a (audit existing maquettes vs MV1 §75–77 + D-01…D-07), then G-02b (Admin/operator maquette set incorporating the three new rules below). |

## Handoff input — the founder's three new rules for the Admin/operator maquette

The founder request (2026-09-02) adds three rules to the Admin/operator surface (G-02b). These are **Species design rules** that the Admin/operator maquette must obey, on top of `omni-species-blueprint-2026-08-27.md` §4D and the confirmed decisions D-01…D-07.

| Rule | Founder statement (paraphrased) | Species consequence |
|---|---|---|
| **R-01 Bottom navigation / minimal reach** | "navigation de omni la plus minimale possible et atteignable proche du doigt; aucune exagération, rien de superflu" | Navigation is a **single floating minimal pill** anchored at the bottom within thumb reach — **3 icons only** (search, QR center elevated, menu). Not a tab bar, not a control panel. Everything else opens from context. |
| **R-02 Simple, direct** | "easy to understand at first visit, direct to the point" | First visit shows one obvious next action; no dashboard chrome. |
| **R-03 Map is the heart, always visible (refined)** | "peu importe le flow admin/team/buyer/seller, la carte reste le cœur de l'expérience; la carte doit toujours être totalement visible; les éléments apparaissent comme des grids qui montent du bas de l'écran, occupant juste une partie de l'écran" | For **every** flow (admin/team/buyer/seller), the map is the heart and **always remains fully visible**. Any content appears as a **partial bottom sheet / grid rising from the bottom**, occupying only part of the screen — never a full-screen takeover. Map reflects the selection. |

### Context the founder asked to be carried in

- The prior conversation was working on the **omni maquette** (`omni-admin-operator-maquette.png/.html`). The archived conversation in this workspace (`/workspace/conversations/4dbe...`) contains only the early steps of the current session; the substantive prior maquette work lives in the repo artifacts above. The user's instruction to "read that archived conversation to grasp where we at" is satisfied by: the HQ Master Plan, the NW intra-skill plan, the Intent Brief, the SDM, the blueprint §4D, and the existing `docs/omni-species-html/` prototype — these *are* where we are at (Gate 2 Species, Admin/operator set not yet produced).
- The build order stays **Admin/operator → Seller → Buyer** (founder decision #7). Admin/operator is the **first** set to accept, so these three rules shape the very first Species deliverable.

## Specialist resource receipt (Founder HQ side)

| Resource status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/intra-skill-execution-controller.md` |
| Template instantiated | `.agents/skills/nature-way-founder-hq/templates/intra-skill-plan.md` → existing `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-01.md` (extend for G-02a/G-02b) |
| Read | `docs/founder-hq/founder-hq-master-plan.md`; `docs/founder-hq/founder-hq-board.md`; `docs/nature-way/omni-intent-brief-2026-09-02.md`; `docs/nature-way/omni-system-dependency-map-2026-09-02.md`; `docs/omni-species-blueprint-2026-08-27.md`; `docs/omni-species-complete-maquette-inventory-2026-08-27.md`; `docs/omni-species-html/index.html` + `app.js` |
| Not loaded / reason | Nature Way Species references — to be loaded by the specialist at gate entry. Prior-runtime PNG/HTML (unreachable host) — replaced by local artifacts. |

## Activation manifest

| Field | Value |
|---|---|
| Primary skill and exact invocation | `/nature-way` |
| Activation status | `activated` |
| Concise handoff input | Gate 2 Species; first produce G-02a audit table (keep/revise/reject per screen) of existing `docs/omni-species-*` + `docs/omni-species-html` + `docs/maquette`; then produce the **Admin/operator maquette set (G-02b)** obeying R-01 (bottom simple control panel), R-02 (simple/direct first-visit admin), R-03 (map-contextual actions), consistent with blueprint §4D and D-01…D-07. No code; maquette/specs only until founder acceptance. |
| Primary authority / gate | Nature Way — Species (G-02a then G-02b) |
| Specialist resource requirement | Nature Way Species references; visual-and-logic-coherence review; MV1 §75–77 screen architecture |
| Expected return artifact | G-02a audit table + G-02b Admin/operator maquette set (visual maquettes or precise-enough specs), returned for founder acceptance |
