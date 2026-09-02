# Intra-Skill Plan — `/nature-way` — Omni Gate 1 (Seed reconciliation + SDM)

> **Plan ID:** `NW-PROD-OMNI-01`  
> **Handoff ID:** `HO-OMNI-01` (from `docs/founder-hq/handoff-receipt-HO-OMNI-01.md`)  
> **As of:** 2026-09-02 (UTC)  
> **Gate owned:** Seed reconciliation + System Dependency Map  
> **Return to:** Founder HQ (`docs/founder-hq/founder-hq-master-plan.md`)

## Resource Receipt

| Status | Exact path |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/founder-intent-discovery.md` |
| Loaded | `.agents/skills/nature-way/references/prerequisite-architecture.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/intra-skill-execution-controller.md` |
| Template instantiated | `.agents/skills/nature-way/templates/intent-brief.md` → `docs/nature-way/omni-intent-brief-2026-09-02.md` |
| Template instantiated | `.agents/skills/nature-way/templates/system-dependency-map.md` → `docs/nature-way/omni-system-dependency-map-2026-09-02.md` |
| Template instantiated | `.agents/skills/nature-way-founder-hq/templates/intra-skill-plan.md` → this file |
| Read (founder inputs) | Problem statement transcript; `OMNI — MASTER SYSTEM` (§1–202); `OMNI — MASTER V1` (§1–82) |
| Read (repo) | `README.md`; `OMNI-V3-MASTER-PLAN.md`; `docs/omni-founder-hq-dispatch-2026-08-28.md`; `v2-founder-hq.md`; `db/migrations/001–012`; `src/server/http.ts`, `trunk-repository.ts`, `roots-operations.ts`; `src/trunk/` file inventory; `vercel.json`; `git log` (last 12) |
| Executed | `npm install`, `npm test` → 29 files / 184 tests pass; `npm run lint` (tsc) → clean |
| Not loaded / reason | `nature-way/references/species-*`, `root-*`, `technical-lead-production-review.md`, `autonomous-delivery-gates.md`, `proof-and-decision-ledger.md`, `templates/founder-mission-contract.md` — not needed until Species/Root open. `docs/omni-species-*` bodies — deferred to the Species audit. Production site and Neon data — not inspected (no founder request; treat as unverified). |

## Local gate plan

| Order | Local gate | Decision condition | Evidence | Status |
|---|---|---|---|---|
| 1 | Reconstruct Intent Brief from the three founder inputs; label inferences | Brief covers all 13 fields; every inference labelled | `omni-intent-brief-2026-09-02.md` | `done (draft)` |
| 2 | Build SDM from repository evidence | Every V1 loop capability has an edge with status and proof | `omni-system-dependency-map-2026-09-02.md` | `done` |
| 3 | Diagnose phase and orphaned leaves | Phase named; stale plan rows identified | SDM "Phase diagnosis" + "Existing-surface rescue" | `done` |
| 4 | Founder confirmation of Seed | Founder confirms brief and decides D-01…D-07 | Founder reply recorded in Intent Brief "Founder confirmation" | `open — awaiting founder` |

## Task tree

| ID | Parent | Objective | Depends on | Status | Proof |
|---|---|---|---|---|---|
| T-01 | Gate 1 | Read founder inputs, extract need / solution / feature ideas / assumptions separately | — | `done` | Intent Brief |
| T-02 | Gate 1 | Inspect repo schema, API, server, trunk; re-run tests | — | `done` | SDM evidence basis |
| T-03 | Gate 1 | Cross-source contradiction table D-01…D-07 | T-01, T-02 | `done` | Intent Brief table |
| T-04 | Gate 1 | Founder decisions | T-03 | `blocked on founder` | — |
| T-05 | Gate 2 (planned) | Species audit of existing maquettes vs MV1 §75–77 | T-04 | `planned` | — |
| T-06 | Gate 3 (planned) | Root decision records: trust/operational state, StockEvent, auto-availability contract, freshness window | T-04, T-05 | `planned` | — |
| T-07 | Gate 4 (planned) | Prove first truthful chain with one real seller + one non-team buyer | T-06 | `planned` | — |

## Reconciliation log

| Date | Fact | Change | Decision |
|---|---|---|---|
| 2026-09-02 | `OMNI-V3-MASTER-PLAN.md §5` gap rows D/E/F (product model, constraints, grid), H (stepper/rating) and I (`pay_on_delivery`) are already landed (#58, #72, `97b4eff`). | Marked MP gap inventory stale in SDM. | MP is no longer the product source of truth; its §7 workflow rules remain valid. |
| 2026-09-02 | No stock-decrement-on-completion or StockEvent found in server code although `quantity_allocated_omni` exists. | E-07 `bounded`; flagged as highest-leverage missing parent. | Verify in Root before any availability claim. |
| 2026-09-02 | Availability freshness hard-coded at 10 minutes; founder transcript mentions "a few hours". | Added freshness window to founder questions. | — |
| 2026-09-02 | No automatic availability reply exists; `facility_pro` entitlement does. | E-10 `missing`. | D-03. |

## Return handoff to Founder HQ

| Field | Value |
|---|---|
| Gate outcome | Seed **reopened and reconstructed**; SDM built; founder confirmation pending. Not closed. |
| Evidence | `docs/nature-way/omni-intent-brief-2026-09-02.md`, `docs/nature-way/omni-system-dependency-map-2026-09-02.md`; test run 184/184; lint clean. |
| Residual gap | Founder decisions D-01…D-07 and the freshness window; production/Neon state unverified. |
| Risk classification | Elevated (identity, wallet money, payment method display, production DB). No implementation authorized. |
| Smallest next action | Founder answers the questions below. Then Nature Way opens Species (audit existing maquettes against MV1 §75–77); no code. |
| Re-plan trigger | Founder rejects the V1 loop as the milestone, or changes the ontology (D-02) in a way that invalidates `v2_*` tables. |

### Founder questions (answer to close Gate 1)

1. **D-01 Trust states** — Keep the 9-state internal lifecycle and show a 3–4 value public label plus a separate operational state (open/closed/temporarily off)? Or collapse the DB to exactly `{unclaimed, unconfirmed, confirmed}` as `OMNI-V3-MASTER-PLAN.md` demanded?
2. **D-02 Ontology** — Confirm "Product" becomes "Offer" in contracts, and that V1 adds a `StockEvent` ledger tied to completed transactions. Is supply-location ≠ facility-location (real estate, mobile providers) in V1 or later?
3. **D-03 Auto-availability** — Is the deterministic automatic reply (allocation ≥ requested qty AND last seller confirmation within the freshness window) part of V1, and is it Pro-only?
4. **Freshness window** — How long does a seller confirmation keep allocated stock "visible/available": 10 minutes (current code), a few hours (transcript), or configurable per facility?
5. **D-04 Free vs paid** — Confirm: free = single-facility availability checks unlimited + 3 bulk operations/month; Buyer Pro $5 = bulk credits; Seller Pro $10 = auto-reply + >5 offers; facility slots purchasable; $20 credit locked until confirmed.
6. **D-05 Auth boundary** — Confirm: anyone can browse the map and tap pins; constraint search, availability, scan-to-buy require an account; the query is preserved through auth + onboarding.
7. **First proof** — Do you accept the proposed first truthful chain (one real Lomé seller + one non-team buyer completing availability → QR → external payment → fulfilment → stock event) as the Trunk milestone, before any v3 re-skin?
