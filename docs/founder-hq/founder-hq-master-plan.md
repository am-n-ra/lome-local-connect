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
| 1 | **Seed reconciliation + System Dependency Map** | Founder confirms one Intent Brief derived from the three inputs; contradictions between Master V1, Master System, `OMNI-V3-MASTER-PLAN.md` and the repository are listed and each has a decision owner; a System Dependency Map names the first truthful parent→child chain. | `/nature-way` | `nature-way/references/founder-intent-discovery.md`, `prerequisite-architecture.md`, `intra-skill-execution-controller.md`; templates `intent-brief.md`, `system-dependency-map.md`, `intra-skill-plan.md` | Resource Receipt; reconciled Intent Brief (draft, labelled inferences); SDM; phase diagnosis; founder questions; residual gap; next task | `done` (founder confirmed 2026-09-02) | Founder reopens any of D-01…D-07. |
| 2 | Species — approved maquette for the V1 screen architecture (Master V1 §75–77) in the founder's build order **Admin/team ops → Seller → Buyer** | Locked design system; complete, founder-accepted maquette set per actor, accepted in that order; existing `docs/omni-species-*` audited (kept / revised / rejected). | `/nature-way` | Species references; `visual-and-logic-coherence-review.md`; existing `docs/omni-species-*` and `docs/maquette` as candidates to audit | Species blueprint + accepted maquette set, or explicit rejection | `active` | Founder changes build order or rejects direction. |
| 3 | Root — reconcile data/API contract with the confirmed decisions (Offer naming, `StockEvent` ledger, operational state, 4 h/24 h freshness window as facility setting, per-facility Seller Pro, per-account buyer credits, deterministic auto-availability) | Migration plan preserves existing Neon records; contracts written before code; qualified review for wallet/trust changes. | `/nature-way` | `technical-lead-production-review.md`, `proof-and-decision-ledger.md` | Root decision records + migration plan | `planned` | Species not approved or ontology decision changes. |
| 4 | Trunk — rebuild in order Admin → Seller → Buyer, then prove the full loop | Each actor's slice proven before the next starts; final proof = one real seller + one non-team buyer + one team operator complete the loop flawlessly. | `/nature-way` | `autonomous-delivery-gates.md`, `execution-controller.md` | Proof record | `planned` | Root contract rejected. |
| 5 | Venture Lifecycle — Lomé pilot demand/proof | Only if problem/segment evidence becomes the uncertainty after Trunk. | `/nature-way-venture-lifecycle` | — | Stage scorecard | `watch` | Founder requests or Trunk evidence exposes segment doubt. |

Deliberately **not** active: Fundraising, Opportunity Intelligence, Founder Learning, Sidereal Reflection. No capital or external commitment is part of the current milestone.

## Activation ledger

| Handoff ID | Specialist | Activation status | Input passed | Resource Receipt | Gate owned | Returned evidence | Next action |
|---|---|---|---|---|---|---|---|
| `HO-OMNI-01` | `/nature-way` | `activated` (skill present at `.agents/skills/nature-way/SKILL.md`, loaded in this session) | Three founder inputs of 2026-09-02; repository `omni-v2-rebuild` @ `3c4bea1`; `OMNI-V3-MASTER-PLAN.md`; prior dispatch of 2026-08-28 | see `docs/founder-hq/handoff-receipt-HO-OMNI-01.md` | Gate 1 — Seed reconciliation + SDM | see `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-01.md` handoff section; founder confirmation recorded in the Intent Brief | Gate 1 closed |
| `HO-OMNI-02` | `/nature-way` | `activated` (same session, continued control) | Confirmed Intent Brief + decisions D-01…D-07; build order Admin → Seller → Buyer | `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-01.md` (extended for Gate 2) | Gate 2 — Species | pending: G-02a audit table | Run G-02a; present Admin/operator direction and maquette set for acceptance |

## Dependency-aware task tree

| ID | Parent | Gate / specialist | Objective | Depends on | Owner | Status | Acceptance / proof | Blocker or risk | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| M-01 | — | HQ / milestone | Pilot-ready V1 loop derived from Master V1 | — | Founder + Nature Way | `in_progress` | Loop proven end-to-end on the field pilot with bounded real supply | Rushed re-implementation before Seed accepted | Founder changes V1 boundary |
| G-01 | M-01 | Seed + SDM / `/nature-way` | One confirmed Intent Brief and dependency map | — | Nature Way (draft), Founder (confirm) | `done` | Intent Brief "Founder confirmation" table, 2026-09-02 | — | Founder reopens a decision |
| G-02 | M-01 | Species / `/nature-way` | Accepted maquette set, Admin → Seller → Buyer | G-01 | Founder | `in_progress` | Founder acceptance recorded per actor set | Existing Species docs may be stale; no admin maquette exists yet | Seed changes screen list |
| G-02a | G-02 | Species / `/nature-way` | Audit existing `docs/omni-species-*` + `docs/maquette` against MV1 §75–77 and confirmed decisions | G-01 | Nature Way | `ready` | Audit table: keep / revise / reject per screen | — | — |
| G-02b | G-02 | Species / `/nature-way` | Admin/operator maquette set (roles, claim review, operator runs, audit) | G-02a | Founder | `planned` | Accepted set | None exists today | — |
| G-02c | G-02 | Species / `/nature-way` | Seller maquette set (company/facility, claim, offers + allocation, availability inbox, auto-reply, wallet/pro) | G-02b | Founder | `planned` | Accepted set | — | — |
| G-02d | G-02 | Species / `/nature-way` | Buyer maquette set (map, constraint search, availability, intent, QR, payment, fulfilment, rating) | G-02c | Founder | `planned` | Accepted set | — | — |
| G-03 | M-01 | Root / `/nature-way` | Contract reconciled with Master V1 ontology | G-01, G-02 | Nature Way | `planned` | Decision records + migration plan | 9 trust states in DB vs 3–6 in docs | Ontology decision |
| G-04 | M-01 | Trunk / `/nature-way` | First truthful chain proven | G-03 | Nature Way | `planned` | Proof record, browser + API evidence | — | Root rejected |

## Active-control rules

Only Gate 2 (Species) and its ready work may be active. Root and Trunk stay `planned` until the founder accepts the maquette sets. Within Species the order is Admin → Seller → Buyer; a later actor's set may not be accepted before the earlier one. `activated` means the specialist has actually taken control; `done` requires evidence.

## Reconciliation log

| Date | Specialist return or new fact | Plan changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-09-02 | Founder supplied problem statement, Master System, Master V1 and asked to restart "the proper way" with Founder HQ. | New HQ plan created; prior 2026-08-28 dispatch preserved as history; `OMNI-V3-MASTER-PLAN.md` PR roadmap (PR 2–6) moved to `paused` pending Seed. | replan | Founder HQ | On Nature Way Gate 1 return |
| 2026-09-02 | Nature Way returned Gate 1 handoff (Intent Brief draft, SDM, phase diagnosis, 7 founder questions). | G-01 stays `in_progress` awaiting founder confirmation. | pause at gate | Founder | Founder reply |
| 2026-09-02 | Founder answered all 7: keep 9 trust states; confirm Offer/StockEvent; auto-availability in V1; accept recommendations for freshness window and per-facility/per-account entitlements; auth boundary confirmed; **rebuild in order Admin/team ops → Seller → Buyer**, then prove with seller + buyer + team. | G-01 `done`; G-02 `in_progress` split into G-02a–d in that order; Gate 3/4 rewritten to the confirmed decisions. | advance | Founder HQ | On Species audit (G-02a) return |

## Founder checkpoint

> **Where we are:** Milestone M-01; Gate 2 (Species) open; first ready task G-02a — audit existing maquettes; `/nature-way` active.  
> **Why this is next:** Seed is confirmed. The founder wants the product rebuilt in dependency order (Admin → Seller → Buyer); the maquette set must be accepted in that order before Root contracts and Trunk code, so the existing buyer-first maquettes are audited rather than reused blindly.  
> **What is not active:** Root migrations, any code, PR 2–6 of `OMNI-V3-MASTER-PLAN.md`, OSM import expansion, AI agents, in-app payments, global cart, ads, all non-product specialists.  
> **What proves the next move:** Founder accepts the Admin/operator maquette set (G-02b).  
> **What happens if it fails:** Stay in Species; do not open Root.
