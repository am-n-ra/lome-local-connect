# Founder HQ Master Plan — Omni

> **Plan ID:** `HQ-OMNI-2026-09-02`  
> **As of:** 2026-09-02 (UTC)  
> **Founder outcome:** Omni becomes a map-first, constraint-based representation of the world's supply where a buyer can find where something exists, know whether it can satisfy their request now, and convert that into a QR-traced Omni transaction — with sellers of any shape (shop, stall, individual, mobile professional, digital) able to become supply without maintaining a full inventory.  
> **Maturity target:** pilot-ready V1 loop (`Find → Verify availability → Decide → Transact → stock event`) on the Lomé field pilot, then production-candidate.  
> **Capacity limit:** one active gate, one active specialist, one vertical slice at a time (solo founder + AI).  
> **Plan owner:** Founder HQ

## Why this plan restarts the prior one

A Founder HQ dispatch already exists (`docs/omni-founder-hq-dispatch-2026-08-28.md`) and a board (`v2-founder-hq.md`, as of 2026-08-25). The founder's judgement on 2026-09-02 is that prior work was rushed: Species/Canopy visuals and a PR roadmap (`OMNI-V3-MASTER-PLAN.md`) advanced while the Seed had not been re-confirmed against the founder's authoritative product thinking. On 2026-09-02 the founder supplied three authoritative inputs:

| Input | Role in the source-of-truth hierarchy |
|---|---|
| Founder problem statement (voice transcript, FR/EN) | The *need* and the founder's own reasoning for each mechanism (discount, allocated stock, delayed contact, auto-response, agents). |
| `OMNI — MASTER SYSTEM` (maturity master, 202 sections) | What Omni ultimately becomes. Not a V1 spec, not a roadmap. |
| `OMNI — MASTER V1` (82 sections) | "The first market-ready species of Omni." The canonical implementation master from which V1 is derived. |

These supersede the product framing in `OMNI-V3-MASTER-PLAN.md §2–3` where they disagree. They do **not** invalidate verified repository evidence (migrations, server authority, tests, deployment) — that evidence must be inspected and reconciled, not discarded.

## Ordered gate plan

| Order | Nature Way / ecosystem gate | Decision condition | Primary specialist | Required resources | Expected return | Status | Re-plan trigger |
|---|---|---|---|---|---|---|---|
| 1 | **Seed reconciliation + System Dependency Map** | Founder confirms one Intent Brief derived from the three inputs; contradictions between Master V1, Master System, `OMNI-V3-MASTER-PLAN.md` and the repository are listed and each has a decision owner; a System Dependency Map names the first truthful parent→child chain. | `/nature-way` | `nature-way/references/founder-intent-discovery.md`, `prerequisite-architecture.md`, `intra-skill-execution-controller.md`; templates `intent-brief.md`, `system-dependency-map.md`, `intra-skill-plan.md` | Resource Receipt; reconciled Intent Brief (draft, labelled inferences); SDM; phase diagnosis; founder questions; residual gap; next task | `active` | Founder corrects the Intent Brief or rejects the chosen chain. |
| 2 | Species — approved maquette for the V1 screen architecture (Master V1 §75–77) | One complete, founder-accepted maquette set for Buyer map/search/results/facility/availability/transaction and Seller mode; design system locked. | `/nature-way` | Species references; existing `docs/omni-species-*` and `docs/maquette` as candidates to audit | Approved maquette set or explicit rejection | `planned` | Seed gate not accepted. |
| 3 | Root — reconcile data/API contract with Master V1 ontology (Provider → Facility/Presence → Offer → Allocation → StockEvent; four discovery states; trust-state decision) | Migration plan preserves existing Neon records; one facility trust-state model decided; auto-availability contract written. | `/nature-way` | `technical-lead-production-review.md`, `proof-and-decision-ledger.md` | Root decision records + migration plan | `planned` | Species not approved or ontology decision changes. |
| 4 | Trunk — first truthful chain end-to-end on the field pilot | Chosen chain from the SDM proven UI→API→DB with bounded real data. | `/nature-way` | `autonomous-delivery-gates.md`, `execution-controller.md` | Proof record | `planned` | Root contract rejected. |
| 5 | Venture Lifecycle — Lomé pilot demand/proof | Only if problem/segment evidence becomes the uncertainty after Trunk. | `/nature-way-venture-lifecycle` | — | Stage scorecard | `watch` | Founder requests or Trunk evidence exposes segment doubt. |

Deliberately **not** active: Fundraising, Opportunity Intelligence, Founder Learning, Sidereal Reflection. No capital or external commitment is part of the current milestone.

## Activation ledger

| Handoff ID | Specialist | Activation status | Input passed | Resource Receipt | Gate owned | Returned evidence | Next action |
|---|---|---|---|---|---|---|---|
| `HO-OMNI-01` | `/nature-way` | `activated` (skill present at `.agents/skills/nature-way/SKILL.md`, loaded in this session) | Three founder inputs of 2026-09-02; repository `omni-v2-rebuild` @ `3c4bea1`; `OMNI-V3-MASTER-PLAN.md`; prior dispatch of 2026-08-28 | see `docs/founder-hq/handoff-receipt-HO-OMNI-01.md` | Gate 1 — Seed reconciliation + SDM | see `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-01.md` handoff section | Founder answers the open Seed questions |

## Dependency-aware task tree

| ID | Parent | Gate / specialist | Objective | Depends on | Owner | Status | Acceptance / proof | Blocker or risk | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| M-01 | — | HQ / milestone | Pilot-ready V1 loop derived from Master V1 | — | Founder + Nature Way | `in_progress` | Loop proven end-to-end on the field pilot with bounded real supply | Rushed re-implementation before Seed accepted | Founder changes V1 boundary |
| G-01 | M-01 | Seed + SDM / `/nature-way` | One confirmed Intent Brief and dependency map | — | Nature Way (draft), Founder (confirm) | `in_progress` | Founder-confirmed brief; SDM with first chain | Contradictions across four sources | Founder rejects brief |
| G-02 | M-01 | Species / `/nature-way` | Accepted maquette set for V1 screens | G-01 | Founder | `planned` | Founder acceptance recorded | Existing Species docs may be stale | Seed changes screen list |
| G-03 | M-01 | Root / `/nature-way` | Contract reconciled with Master V1 ontology | G-01, G-02 | Nature Way | `planned` | Decision records + migration plan | 9 trust states in DB vs 3–6 in docs | Ontology decision |
| G-04 | M-01 | Trunk / `/nature-way` | First truthful chain proven | G-03 | Nature Way | `planned` | Proof record, browser + API evidence | — | Root rejected |

## Active-control rules

Only Gate 1 and its ready work may be active. Species, Root and Trunk stay `planned` until `/nature-way` returns the Gate 1 handoff and the founder confirms the Intent Brief. `activated` means the specialist has actually taken control; `done` requires evidence.

## Reconciliation log

| Date | Specialist return or new fact | Plan changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-09-02 | Founder supplied problem statement, Master System, Master V1 and asked to restart "the proper way" with Founder HQ. | New HQ plan created; prior 2026-08-28 dispatch preserved as history; `OMNI-V3-MASTER-PLAN.md` PR roadmap (PR 2–6) moved to `paused` pending Seed. | replan | Founder HQ | On Nature Way Gate 1 return |
| 2026-09-02 | Nature Way returned Gate 1 handoff (Intent Brief draft, SDM, phase diagnosis, 7 founder questions). | G-01 stays `in_progress` awaiting founder confirmation. | pause at gate | Founder | Founder reply |

## Founder checkpoint

> **Where we are:** Milestone M-01; Gate 1 (Seed reconciliation + System Dependency Map); `/nature-way` active.  
> **Why this is next:** Four sources currently disagree on facility trust states, product/offer model, what is free vs paid, and whether auto-availability is in V1. Coding against any one of them repeats the rushed pattern.  
> **What is not active:** PR 2–6 of `OMNI-V3-MASTER-PLAN.md`, OSM import expansion, AI agents, in-app payments, global cart, ads, all non-product specialists.  
> **What proves the next move:** The founder confirms or corrects the Intent Brief and answers the open questions in the Nature Way handoff.  
> **What happens if it fails:** Stay in Seed; do not open Species or Root.
