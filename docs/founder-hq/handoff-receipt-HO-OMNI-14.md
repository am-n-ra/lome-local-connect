# Skill Handoff and Activation Receipt

> **Request ID:** `HO-OMNI-14`
> **Founder HQ timestamp:** 2026-09-13 (UTC), amended same day (founder update #2)
> **Primary authority:** mixed — **Venture Lifecycle** (Gate 7 demand/Lomé) + **Opportunity Intelligence** (YC Winter 2027) + **Fundraising** (pre-YC bridge via HERLOG S.A.)
> **Exact invocation:** `/nature-way-venture-lifecycle`, `/nature-way-opportunity-intelligence`, `/nature-way-fundraising`
> **Activation status:** `user invocation required` for all three. The repo-local specialist skills cannot be invoked dynamically by the agent in this environment (same constraint recorded in `HO-OMNI-06`). Founder HQ prepares and preserves the handoff; it does **not** simulate any specialist's gate.

## Dispatch record

| Field | Value |
|---|---|
| User objective | "je veux apply au batch winter de yc avec omni" → **YC Winter 2027 application** with Omni + "lever des fonds pour les premiers mois d'activité pré-YC au travers de HERLOG SA" → **pre-YC operational runway through HERLOG S.A.** |
| Current milestone and gate | M-01 pilot-ready V1 loop. Gates 1–5 closed; **Gate 6 CLOSED** (`Go with limits` 2026-09-11, maintained); **Gate 7 Venture Lifecycle AWAKENED (2026-09-13)** by founder-stated demand signals (~30 early joiners + field plan Lomé/Aflao + real CAC). P1 (NW-13c→d→d2→e→g) shipped to prod. Next product slice: NW-13h (Acheteur Pro, D-K) on founder order. **No revenue/traction number is asserted — none exists yet as verified evidence.** |
| Structural path / venture stage | Canopy/launch-readiness → **demand/Lomé (Gate 7)** + new **capital** track + new **external-opportunity** track. Branch `omni-v2-rebuild`. |
| Relevant artifacts and proof | Gate 7 handoff `docs/founder-hq/gate7-lome-demand-evidence-handoff.md`; YC record `docs/founder-hq/yc-winter-2027-opportunity-record.md` (+ Djanta historical); capital handoff `docs/founder-hq/capital-track-pre-yc-herlog-handoff.md` (C-01 partial DE C-Corp, C-08 HERLOG 50M floor, fit tension); board + master plan `docs/founder-hq/`. |
| Dependencies and constraints | Specialist activation = user invocation required. No HERLOG contact made by session (founder's own contact predates it). No YC submission. **Capital entity = Delaware C-Corp (YC path), not yet incorporated** — raise sequencing = qualified counsel. **HERLOG floor ~50M (assumed FCFA)** → capital-fit tension. Founder still to supply: C-03 (amount/duration/burn), C-06 (default-alive), C-07 (milestone). Push/commit to remote = founder explicit order only. |
| Secondary route | YC application → `/nature-way-fundraising` for pitch-readiness + bilingual deck (when the opportunity qualifies). |
| Expected specialist return | **Venture Lifecycle:** stage scorecard; next-proof experiment (Lomé/Aflao CAC, first free+Pro users); evidence class. **Opportunity Intelligence:** source re-verification; qualification card (veto or fit); one status; owner + next action; deadline/time zone. **Fundraising:** Phase 0 capital thesis + capital-fit resolution (incl. HERLOG 50M floor vs bridge size); claim/evidence ledger; next capital gate. |

## Handoff input — Opportunity Intelligence (YC W27)

| Field | Value |
|---|---|
| Opportunity | YC Winter 2027 (real, selectable per official apply/early-decision pages; exact deadline not yet published) |
| Verified facts | see `yc-winter-2027-opportunity-record.md` |
| Requested decision | qualification card: fit vs actual milestone, evidence readiness, capacity, terms, veto; then `watch`/`pursue` |
| Constraint | No submission until founder explicitly confirms after specialist qualification |

## Handoff input — Venture Lifecycle (Gate 7, Lomé demand)

| Field | Value |
|---|---|
| Demand signals (founder-stated) | ~30 early joiners requested a real product + more facilities, flagged maquette errors; field plan = cover Lomé + potentially Aflao, first free + Pro users, measure real buyer & seller CAC |
| Verified? | No — no contracts/paying users/CAC recorded. To be measured in field |
| Requested decision | Stage scorecard; next-proof experiment (validation method + CAC basis); evidence class for the 30 early joiners |
| Constraint | Early-joiners = demand signal, never revenue/traction |

## Handoff input — Fundraising (pre-YC bridge, HERLOG S.A.)

| Field | Value |
|---|---|
| Capital request | raise for first months of pre-YC activity via HERLOG S.A. |
| Factual company record | see `capital-track-pre-yc-herlog-handoff.md` (strategy & financial engineering firm, Lomé; **founder-stated 2026-09-13: HERLOG already in contact + invests directly AND facilitates via banks/angels/others; engages ABOVE ~50M (assumed FCFA)** — to verify directly with HERLOG) |
| Required founder inputs | **C-02/C-04/C-08 resolved** (open contact; direct investor + facilitator; 50M floor — founder-stated); **C-01 partial** (Delaware C-Corp target, not yet incorporated → counsel); still required: C-03 amount+duration+burn, C-05 evidence basis (or leave to specialist), C-06 default-alive plan, C-07 milestone mapping |
| Requested decision | Phase 0 capital thesis + **capital-fit resolution** (bridge size vs HERLOG 50M floor) + entity/raise sequencing flag for counsel |
| Constraint | No deck, no new investor contact, no term advice without specialist + qualified counsel |

## Specialist resource receipt (Founder HQ preparation context — **not** the specialists' own receipts)

| Resource | Status | Explanation |
|---|---|---|
| `nature-way-founder-hq/SKILL.md` + `references/ecosystem-orchestration-protocol.md`, `ecosystem-activation-manifest.md`, `founder-hq-board.md`, `portability-protocol.md`, `intra-skill-execution-controller.md`, `intra-skill-planning-protocol.md` | Loaded | HQ orchestration resources |
| `templates/founder-hq-master-plan.md`, `templates/skill-handoff-receipt.md` | Instantiated | reconciled master plan (this session) + this receipt |
| `nature-way-fundraising/references/capital-fit-and-pipeline.md`, `readiness-and-data-room.md`, `product-proof-handoff.md`, `pitch-readiness-and-bilingual-decks.md`, `evidence-and-claim-ledger.md`, `raise-contingency-and-operating-plan.md`; `templates/intra-skill-plan.md` | Loaded as preparation context | **the specialist must load its own and issue its own receipt on activation** |
| `nature-way-opportunity-intelligence/references/source-verification.md`, `qualification-and-tracker.md`; `templates/intra-skill-plan.md` | Loaded as preparation context | same — specialist's responsibility on activation |
| `nature-way-fundraising/SKILL.md`, `nature-way-opportunity-intelligence/SKILL.md`, `nature-way-venture-lifecycle/SKILL.md` | Read (method understood) | HQ confirms the correct routes; HQ does **not** perform the specialists' work |

## Dispatch result

Founder HQ has reconciled the demand, capital, and opportunity demands into the Master Plan and Board as **`watch` / `user invocation required`** tracks. **Gate 7 (Lomé demand) is now a live gate** (founder-stated early-joiners + field plan); the capital track gained C-08 (HERLOG 50M floor) + a fit tension; the opportunity track gained the Djanta historical signal. The product gate (Gate 6 closed; NW-13h next on founder order) is **not** displaced. **The founder must invoke each specialist** for the gate to open; HQ will reconcile the returned handoffs and then sequence YC timing vs the pre-YC bridge vs Gate 7 demand proof vs the product slice.

**Next smallest actions (owner: founder):**
1. Invoke **`/nature-way-venture-lifecycle`** → Gate 7 stage scorecard + next-proof experiment (input: `gate7-lome-demand-evidence-handoff.md`).
2. Invoke **`/nature-way-opportunity-intelligence`** → YC W27 qualification (input: `yc-winter-2027-opportunity-record.md`).
3. Invoke **`/nature-way-fundraising`** → Phase 0 capital thesis + HERLOG fit resolution (input: `capital-track-pre-yc-herlog-handoff.md`; answer C-03/C-06/C-07 first).
4. Decide sequencing once specialists return: NW-13h vs Gate 7 demand proof vs bridge vs YC timing.