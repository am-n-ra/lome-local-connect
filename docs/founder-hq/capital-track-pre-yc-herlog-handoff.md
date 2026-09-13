# Capital Track — Pre-YC Bridge via HERLOG S.A. (Handoff Input for `/nature-way-fundraising`)

> **Status:** Founder HQ handoff preparation. This is **not** the specialist's capital thesis, readiness score, or investor narrative. The capital gate belongs to `/nature-way-fundraising`. Founder HQ preserves the founder's intent and the factual inputs so the specialist does not start from zero.
> **As of:** 2026-09-13 (UTC), updated same day with founder-confirmed relationship facts.

## Founder intent (verbatim, translated by HQ)

> "Je veux aussi demander à lever des fonds pour les premiers mois d'activité pré-YC au travers de HERLOG SA. Maintenant Nature Way doit pouvoir me guider proprement."
> = "I also want to raise funds for the first months of pre-YC activity through HERLOG S.A. Now Nature Way needs to guide me properly."

> **Founder update (2026-09-13):** « allons y aussi herlog je suis en contact avec eux et ils investissent eux-mêmes de même qu'ils facilitent aussi les investissements via banques angels et autres... »
> = "Let's go with HERLOG too — I'm already in contact with them, and they **invest directly themselves** as well as **facilitating investments via banks, angels, and others**."

This establishes two things the previous pass marked unknown:
- **C-02 resolved** → HERLOG relationship is **already open** (founder in contact).
- **C-04 resolved (founder-confirmed)** → HERLOG operates in **two roles** relevant to Omni: (a) **direct investor** in ventures, and (b) **facilitator/arranger** channeling investment from banks, business angels, and others.

> **Source-provenance note (honest labelling):** C-02 and C-04 are `founder-stated`, not independently source-verified in this repo. The public record (herlog-sa.com) confirms HERLOG S.A. is a strategy & financial-engineering firm in Lomé. Whether the direct-investment mandate and the facilitation network apply to Omni's exact case is a **verification step for the specialist**, not a claim HQ can assert.

The founder wants two things addressed together, in order:
1. **Pre-YC operational runway** — capital to cover the first months of activity *before* a YC batch.
2. **A proper guided process** through the Nature Way ecosystem (not an ad-hoc deck).

## Who HERLOG S.A. is (public record + founder-stated)

| Field | Value | Source / class |
|---|---|---|
| Name | HERLOG S.A. (also "HERLOG"), société de conseil en stratégie et ingénierie financière | herlog-sa.com / `public-record` |
| Location | 37, Rue Amoussimé, Abové, Lomé, Togo | herlog-sa.com / `public-record` |
| Activity | Strategy consulting and financial engineering; structuring/financing advisory | herlog-sa.com / `public-record` |
| Role per founder | **Invests directly in ventures AND facilitates investment via banks, angels, and others** | founder 2026-09-13 / `founder-stated` — verify with HERLOG directly |
| Relationship | **Already in contact (open)** | founder 2026-09-13 / `founder-stated` |
| Notable leadership | PDG with a background at the West African Development Bank (BOAD), finance & economics | LinkedIn (public) / `public-record` |
| Legal form / capital | Early record (HERLOG CONSEAUX SARL) shows SARL with 1,000,000 FCFA capital; **current legal form and status must be re-verified against official registries (RCCM/CFE) before any capital decision** | cfetogo.tg (old record) / needs verification |

**Honest note (updated):** the founder's statement that HERLOG invests directly and facilitates via banks/angels is the *working premise* the fundraising specialist must now verify — what kind of instrument (equity, bridge debt, revenue-based, convertible), what cheque size, what decision speed, what reporting, and what conflict/exclusivity. The public footprint alone does not establish those facts.

## Founder inputs required by the fundraising specialist

| # | Required input (owner: founder) | Why | Current status |
|---|---|---|---|
| C-01 | **Legal identity** of the entity that would raise | Determines the capital type and who signs | **PARTIAL (founder-stated):** target = **Delaware C-Corp** (for the YC path), **not yet incorporated in any form**. Pre-incorporation raise vehicle = open; cross-border/securities decision → qualified counsel required |
| C-02 | HERLOG contact/interaction status | Determines `research` vs `relationship` pipeline state | **RESOLVED (founder-stated): open contact** (info gathered in direct conversation with HERLOG) |
| C-03 | Amount and duration: how many months of pre-YC runway, monthly burn, total ask | Phase 0 milestone-to-buy logic | Unknown |
| C-04 | HERLOG role: direct investor, facilitator, or both? | Required for capital fit | **RESOLVED (founder-stated): both direct + facilitation (banks/angels/others)** — terms to verify |
| C-05 | Any existing evidence (product proof, prod, tests) the founder wants to use | Evidence basis | Omni holds strong product proof (see below) |
| C-06 | Default-alive position: what operating commitments continue if the bridge does not close | Contingency plan basis | Unknown |
| C-07 | Do the founder's numbers (amount, months, use of funds) map to a measurable milestone? | Capital tied to a milestone, not a wish list | Unknown |
| C-08 | **HERLOG minimum ticket** | Capital fit: does the pre-YC bridge meet their floor? | **RESOLVED (founder-stated): HERLOG engages for amounts ABOVE ~50,000,000** (unit to confirm — assumed FCFA, ≈US$80–85k) → **capital-fit question for the specialist** (see below) |

## Capital-fit tension (flagged by HQ; assessed by the specialist, not decided by HQ)

The founder-stated facts raise a sizing question that only the fundraising specialist + qualified counsel can resolve:

- **Need:** pre-YC operational runway (first months) + funding a credible team.
- **HERLOG entrance floor:** above ~50M (unit to confirm, assumed FCFA).
- **Tension:** if the honest pre-YC bridge is materially below ~50M, HERLOG may fit a **later round** (post Gate 7 demand proof / post-incorporation) rather than the initial bridge — **or** the bridge is intentionally sized at/above their floor, which changes dilution and use-of-funds materially.
- **Entity sequencing:** target is a Delaware C-Corp, not yet incorporated. Raising before vs after incorporation is a legal/securities/cross-border decision → the specialist must flag it, not HQ.

HQ does **not** propose an amount, instrument, or sequencing here.

## Product evidence Omni already holds (factual, from repository proof — invite the specialist to classify)

- Live production app `omni.sparkafrika.online`, branch `omni-v2-rebuild`, prod bundle hash === local build (T-07d guardrail).
- **55 files / 393 tests**, tsc clean, boundary clean.
- Migrations 042→047 applied canonical on Neon (facility types, bulk credits, bonus trust, Pro auto-renewal).
- P1 (NW-13c→d→d2→e→g) shipped to prod (seller creation, bulk credits `ceil(N/100)`, bonus 20 USD after 3 distinct buyers, Pro auto-renewal via wallet).
- FedaPay wallet live (3 confirmed recharges reconciled; 17 pending pre-reference — re-drive dashboard).
- Board + master plan evidence ledger in `docs/founder-hq/`.

**None of the above constitutes a revenue, traction, or fundability claim.** The fundraising specialist must classify each proof and decide what the capital thesis can honestly claim.

## Dispatch boundary

Founder HQ stops here. The next step is the specialist: the founder should invoke **`/nature-way-fundraising`** with this file as the handoff input. HQ will not produce the capital thesis, readiness score, investor pipeline, or deck under its own authority.

**No HERLOG contact has been made by this session (the founder's own contact predates it). No term, amount, or instrument is proposed here.**