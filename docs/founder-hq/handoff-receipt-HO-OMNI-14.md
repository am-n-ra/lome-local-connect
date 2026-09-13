# Skill Handoff and Activation Receipt

> **Request ID:** `HO-OMNI-14`
> **Founder HQ timestamp:** 2026-09-13 (UTC)
> **Primary authority:** mixed — **Opportunity Intelligence** (YC Winter 2027) + **Fundraising** (pre-YC bridge via HERLOG S.A.)
> **Exact invocation:** `/nature-way-opportunity-intelligence` and `/nature-way-fundraising`
> **Activation status:** `user invocation required` for both. The repo-local specialist skills cannot be invoked dynamically by the agent in this environment (same constraint recorded in `HO-OMNI-06`). Founder HQ prepares and preserves the handoff; it does **not** simulate either specialist's gate.

## Dispatch record

| Field | Value |
|---|---|
| User objective | "je veux apply au batch winter de yc avec omni" → **YC Winter 2027 application** with Omni + "lever des fonds pour les premiers mois d'activité pré-YC au travers de HERLOG SA" → **pre-YC operational runway through HERLOG S.A.** |
| Current milestone and gate | M-01 pilot-ready V1 loop. Gates 1–5 closed; **Gate 6 CLOSED** (`Go with limits` 2026-09-11, maintained); Gate 7 Venture Lifecycle = `watch`. P1 (NW-13c→d→d2→e→g) shipped to prod. Next product slice: NW-13h (Acheteur Pro, D-K) on founder order. **No revenue/traction number is asserted — none exists yet as verified evidence.** |
| Structural path / venture stage | Canopy/launch-readiness → new **capital** track + new **external-opportunity** track. Branch `omni-v2-rebuild`. |
| Relevant artifacts and proof | YC record `docs/founder-hq/yc-winter-2027-opportunity-record.md`; capital handoff `docs/founder-hq/capital-track-pre-yc-herlog-handoff.md`; board `docs/founder-hq/founder-hq-board.md`; master plan `docs/founder-hq/founder-hq-master-plan.md`; evidence ledger (393 tests, migrations 042→047, prod hash, live wallet). |
| Dependencies and constraints | Specialist activation = user invocation required. No HERLOG contact made. No YC submission. Founder must supply C-01…C-07 (entity, HERLOG status, amount/duration, instrument type, default-alive position, milestone mapping). Push/commit to remote = founder explicit order only. |
| Secondary route | YC application → `/nature-way-fundraising` for pitch-readiness + bilingual deck (when the opportunity qualifies). |
| Expected specialist return | **Opportunity Intelligence:** resource receipt; source re-verification; qualification card (veto or fit); one status (`watch/verify/qualified/pursue/declined`); owner + next action; deadline/time zone. **Fundraising:** Phase 0 capital thesis (or explicit founder-input blocker C-01…C-07); claim/evidence ledger; potential readiness score; next capital gate. |

## Handoff input — Opportunity Intelligence (YC W27)

| Field | Value |
|---|---|
| Opportunity | YC Winter 2027 (real, selectable per official apply/early-decision pages; exact deadline not yet published) |
| Verified facts | see `yc-winter-2027-opportunity-record.md` |
| Requested decision | qualification card: fit vs actual milestone, evidence readiness, capacity, terms, veto; then `watch`/`pursue` |
| Constraint | No submission until founder explicitly confirms after specialist qualification |

## Handoff input — Fundraising (pre-YC bridge, HERLOG S.A.)

| Field | Value |
|---|---|
| Capital request | raise for first months of pre-YC activity via HERLOG S.A. |
| Factual company record | see `capital-track-pre-yc-herlog-handoff.md` (strategy & financial engineering firm, Lomé; **founder-stated 2026-09-13: HERLOG already in contact + invests directly AND facilitates via banks/angels/others** — founder-stated, pending direct verification of terms) |
| Required founder inputs | **C-02 resolved** (open contact), **C-04 resolved** (direct investor + facilitator — founder-stated); still required: C-01 entity, C-03 amount+duration+burn, C-05 evidence basis, C-06 default-alive plan, C-07 milestone mapping |
| Requested decision | Phase 0 capital thesis + next capital gate (fit, not prestige); verify HERLOG's direct-investment mandate/terms + facilitation network directly |
| Constraint | No deck, no new investor contact, no term advice without specialist + qualified counsel |

## Specialist resource receipt (Founder HQ preparation context — **not** the specialists' own receipts)

| Resource | Status | Explanation |
|---|---|---|
| `nature-way-founder-hq/SKILL.md` + `references/ecosystem-orchestration-protocol.md`, `ecosystem-activation-manifest.md`, `founder-hq-board.md`, `portability-protocol.md`, `intra-skill-execution-controller.md`, `intra-skill-planning-protocol.md` | Loaded | HQ orchestration resources |
| `templates/founder-hq-master-plan.md`, `templates/skill-handoff-receipt.md` | Instantiated | reconciled master plan (this session) + this receipt |
| `nature-way-fundraising/references/capital-fit-and-pipeline.md`, `readiness-and-data-room.md`, `product-proof-handoff.md`, `pitch-readiness-and-bilingual-decks.md`, `evidence-and-claim-ledger.md`, `raise-contingency-and-operating-plan.md`; `templates/intra-skill-plan.md` | Loaded as preparation context | **the specialist must load its own and issue its own receipt on activation** |
| `nature-way-opportunity-intelligence/references/source-verification.md`, `qualification-and-tracker.md`; `templates/intra-skill-plan.md` | Loaded as preparation context | same — specialist's responsibility on activation |
| `nature-way-fundraising/SKILL.md`, `nature-way-opportunity-intelligence/SKILL.md` | Read (method understood) | HQ confirms the correct route; HQ does **not** perform the specialists' work |

## Dispatch result

Founder HQ has reconciled the new capital + opportunity demands into the Master Plan and Board as two **`watch` / `user invocation required`** tracks. The product gate (Gate 6 closed; NW-13h next on founder order) is **not** displaced — the note "Ne pas élargir le périmètre au-delà de M-01" remains. The two specialists are named and their required return artifacts are defined. **The founder must invoke each specialist** for the gate to open; HQ will reconcile the returned handoffs and then sequence YC timing vs the pre-YC bridge vs the product slice.

**Next smallest actions (owner: founder):**
1. Invoke **`/nature-way-opportunity-intelligence`** → YC W27 qualification (input: `yc-winter-2027-opportunity-record.md`).
2. Invoke **`/nature-way-fundraising`** → Phase 0 capital thesis (input: `capital-track-pre-yc-herlog-handoff.md`; answer C-01…C-07 first).
3. Decide product slice ordering once specialists return: NW-13h vs Gate 7 demand-proof vs the bridge timeline.