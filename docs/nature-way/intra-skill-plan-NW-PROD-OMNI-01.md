# Intra-Skill Plan — `/nature-way` — Omni Gate 1 (Seed reconciliation + SDM) → Gate 2 (Species)

> **Plan ID:** `NW-PROD-OMNI-01`  
> **Handoff ID:** `HO-OMNI-01` (from `docs/founder-hq/handoff-receipt-HO-OMNI-01.md`)  
> **As of:** 2026-09-02 (UTC)  
> **Gate owned:** Seed reconciliation + System Dependency Map (closed 2026-09-02) → Species (active, handoff `HO-OMNI-02`)  
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
| 1 | Reconstruct Intent Brief from the three founder inputs; label inferences | Brief covers all 13 fields; every inference labelled | `omni-intent-brief-2026-09-02.md` | `done` |
| 2 | Build SDM from repository evidence | Every V1 loop capability has an edge with status and proof | `omni-system-dependency-map-2026-09-02.md` | `done` |
| 3 | Diagnose phase and orphaned leaves | Phase named; stale plan rows identified | SDM "Phase diagnosis" + "Existing-surface rescue" | `done` |
| 4 | Founder confirmation of Seed | Founder confirms brief and decides D-01…D-07 | Founder reply recorded in Intent Brief "Founder confirmation" | `done` (2026-09-02) |
| 5 | **Species — Gate 2** | Founder accepts maquette sets in order Admin/operator → Seller → Buyer; design system locked | Audit table + accepted sets | `active` |

## Task tree

| ID | Parent | Objective | Depends on | Status | Proof |
|---|---|---|---|---|---|
| T-01 | Gate 1 | Read founder inputs, extract need / solution / feature ideas / assumptions separately | — | `done` | Intent Brief |
| T-02 | Gate 1 | Inspect repo schema, API, server, trunk; re-run tests | — | `done` | SDM evidence basis |
| T-03 | Gate 1 | Cross-source contradiction table D-01…D-07 | T-01, T-02 | `done` | Intent Brief table |
| T-04 | Gate 1 | Founder decisions | T-03 | `done` | Intent Brief § Founder confirmation |
| T-05 | Gate 2 | Audit existing `docs/omni-species-*` + `docs/maquette` vs MV1 §75–77 and D-01…D-06: keep / revise / reject per screen; list missing admin screens | T-04 | `ready` | Audit table |
| T-05a | Gate 2 | Admin/operator maquette set: role management, claim/verification review, trust + operational state transitions, operator field runs, audit views | T-05 | `planned` | Founder acceptance |
| T-05b | Gate 2 | Seller maquette set: company/facility onboarding + claim, Offer editor (discount, allocation), StockEvent history, availability inbox + auto-reply setting, QR verification, payment/fulfilment, wallet + per-facility Pro | T-05a | `planned` | Founder acceptance |
| T-05c | Gate 2 | Buyer maquette set: map, constraint search, facility sheet with trust label + open/closed, availability request (credits), intent, QR, delayed contact/itinerary, payment declaration, fulfilment, rating | T-05b | `planned` | Founder acceptance |
| T-06 | Gate 3 (planned) | Root contracts: trust label derivation + operational state, Offer naming, StockEvent ledger, auto-availability rule, 4 h/24 h freshness, per-facility entitlements, per-account credits; non-destructive migration plan | T-05c | `planned` | — |
| T-07 | Gate 4 (planned) | Trunk in order Admin → Seller → Buyer; each slice proven before the next | T-06 | `planned` | — |
| T-08 | Gate 4 (planned) | Integrated proof: one real seller + one non-team buyer + one team operator complete the loop flawlessly | T-07 | `planned` | Proof record |

## Reconciliation log

| Date | Fact | Change | Decision |
|---|---|---|---|
| 2026-09-02 | `OMNI-V3-MASTER-PLAN.md §5` gap rows D/E/F (product model, constraints, grid), H (stepper/rating) and I (`pay_on_delivery`) are already landed (#58, #72, `97b4eff`). | Marked MP gap inventory stale in SDM. | MP is no longer the product source of truth; its §7 workflow rules remain valid. |
| 2026-09-02 | No stock-decrement-on-completion or StockEvent found in server code although `quantity_allocated_omni` exists. | E-07 `bounded`; flagged as highest-leverage missing parent. | Verify in Root before any availability claim. |
| 2026-09-02 | Availability freshness hard-coded at 10 minutes; founder transcript mentions "a few hours". | Added freshness window to founder questions. | — |
| 2026-09-02 | No automatic availability reply exists; `facility_pro` entitlement does. | E-10 `missing`. | D-03. |
| 2026-09-02 | Founder answered all 7 questions; rejected buyer-chain-first slice; imposed Admin → Seller → Buyer rebuild order. | Gate 1 closed; SDM slice selection rewritten; task tree T-05…T-08 reordered. | Freshness 4 h / 24 h and per-facility / per-account entitlements stand as accepted defaults until the founder reopens them. |

## Return handoff to Founder HQ

| Field | Value |
|---|---|
| Gate outcome | Seed **closed** (founder confirmation 2026-09-02); SDM built and re-sliced to the founder's rebuild order. Species **open**. |
| Evidence | `docs/nature-way/omni-intent-brief-2026-09-02.md`, `docs/nature-way/omni-system-dependency-map-2026-09-02.md`; test run 184/184; lint clean. |
| Residual gap | D-07 (which maquettes survive) — answered by T-05; production/Neon state unverified; no admin/operator maquette exists today. |
| Risk classification | Elevated (identity, wallet money, payment method display, production DB). No implementation authorized. |
| Smallest next action | T-05: audit existing maquettes and return a keep/revise/reject table plus the list of missing Admin/operator screens; then propose the Admin/operator set (T-05a). No code. |
| Re-plan trigger | Founder rejects the V1 loop as the milestone, or changes the ontology (D-02) in a way that invalidates `v2_*` tables. |

### Founder questions (asked to close Gate 1 — answered 2026-09-02, see Intent Brief)

1. **D-01 Trust states** — Keep the 9-state internal lifecycle and show a 3–4 value public label plus a separate operational state (open/closed/temporarily off)? Or collapse the DB to exactly `{unclaimed, unconfirmed, confirmed}` as `OMNI-V3-MASTER-PLAN.md` demanded?
2. **D-02 Ontology** — Confirm "Product" becomes "Offer" in contracts, and that V1 adds a `StockEvent` ledger tied to completed transactions. Is supply-location ≠ facility-location (real estate, mobile providers) in V1 or later?
3. **D-03 Auto-availability** — Is the deterministic automatic reply (allocation ≥ requested qty AND last seller confirmation within the freshness window) part of V1, and is it Pro-only?
4. **Freshness window** — How long does a seller confirmation keep allocated stock "visible/available": 10 minutes (current code), a few hours (transcript), or configurable per facility?
5. **D-04 Free vs paid** — Confirm: free = single-facility availability checks unlimited + 3 bulk operations/month; Buyer Pro $5 = bulk credits; Seller Pro $10 = auto-reply + >5 offers; facility slots purchasable; $20 credit locked until confirmed.
6. **D-05 Auth boundary** — Confirm: anyone can browse the map and tap pins; constraint search, availability, scan-to-buy require an account; the query is preserved through auth + onboarding.
7. **First proof** — Do you accept the proposed first truthful chain (one real Lomé seller + one non-team buyer completing availability → QR → external payment → fulfilment → stock event) as the Trunk milestone, before any v3 re-skin?
