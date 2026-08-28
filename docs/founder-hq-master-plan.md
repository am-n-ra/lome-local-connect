# Founder HQ Master Plan — OmniView (Lomé, Togo)

> **Plan ID:** NW-OMNI-HQ-001
> **As of:** August 28, 2026 UTC
> **Founder outcome:** Build and launch Omni V0 MVP (Search-Engine Map-First + Public vs Transactional QR + Multi-item Intent + Seller 0/3 Sales Milestone & $20 Reward Unlock + Pro Bulk Availability) straight to initial revenue and user validation for $150k–$500k seed raise & YC application.
> **Maturity target:** V0 Pilot & Revenue-Ready Production Candidate
> **Capacity limit:** Active execution on V0 MVP core reconciled slices
> **Plan owner:** Founder HQ

## Reconciled Versioning Roadmap (Aug 28 Blueprint)

- **V0 MVP (Immediate Focus - Straight to Initial Revenue):**
  - **Buyer Experience:** Map-first local search engine (MapLibre GL, slow globe reveal, category pills, text/voice search, preserved auth query handoff, OSRM walking route).
  - **Public vs Transactional QR:**
    - Public Facility QR: In-person physical QR scan opens facility sheet directly.
    - Transactional QR: Generated only after buyer clicks "Je veux acheter" (Intent confirmed); validated by seller at checkout via private chat flow.
  - **Multi-Product Intent & Cart:** Buyers can group multiple items from the same seller facility in one intent request.
  - **Seller Trust Milestone (3 Sales -> $20 Bonus Reward):**
    - Status progression: Draft -> In Review -> Certified (by Admin) -> Confirmed (0/3 sales).
    - Upon 3/3 verified completed sales, unlock **$20 (~10 000 FCFA)** reward bonus attached to the facility wallet.
  - **Pro Tier & Stock Management:**
    - Pro tier centered around **Automated Omni Stock Response** & **Bulk Availability Credits** ($5/mo Buyer Pro, $10/mo Seller Pro).
    - Batch freshness confirmation button ("Tout confirmer" sets 48h fresh timestamp).
  - **Manual / Mocked External Payments:** Wallet top-ups & local money confirmations clearly labeled (Demo Mode).

- **V1 (Post Seed Raise $150k–$500k & YC Application):**
  - Native Mobile Application / PWA.
  - Full mobile money (FedaPay / Flooz / T-Money) webhook automation & payout integration.
  - Physical QR sticker distribution for Lomé shops.
  - Cohort analytics (CAC Seller/Buyer, LTV, retention).

- **V2 / V3 (Alipay-Like Ecosystem Scale):**
  - Instant Omni Wallet digital payment ecosystem across Lomé and West Africa.
  - Bulk availability enterprise APIs & AI proximity push alerts.

---

## Ordered Gate Plan

| Order | Ecosystem Gate | Decision Condition | Primary Specialist | Required Artifacts | Expected Return | Status | Re-Plan Trigger |
|---|---|---|---|---|---|---|---|
| 1 | Founder HQ & Roadmap Alignment | Fully reconcile V0 blueprint (Aug 28 intent, $20 reward, Bulk credits, QR separation) | `/nature-way-founder-hq` | `docs/omni-species-blueprint-2026-08-27.md` | Master Plan & Board updated | `in_progress` | Intent change |
| 2 | Root System & Schema Alignment | Update backend data models, DB schema, API handlers (`src/server/`) | `/nature-way` | `src/server/trunk-repository.ts`, Vitest | Verified backend endpoints, 0/3 sales counter, Bulk availability credits | `ready` | Backend or API error |
| 3 | Trunk Buyer & Seller UI Execution | Implement stateful map landing, public/transaction QR, multi-item intent, seller 0/3 milestone, $20 reward unlock | `/nature-way` | `src/trunk/` | Working V0 web app | `todo` | UI breakage |
| 4 | Verification & Test Gate | Pass unit & integration Vitest suites (`npx vitest run`) | `/nature-way` | Vitest test suites | Clean test pass | `todo` | Test failures |
| 5 | Pre-Commit & Submission | Final review, documentation, code freeze | `/nature-way` | Pre-commit check | Production ready submit | `todo` | Drift |

---

## Reconciliation Log

| Date | Specialist Return or New Fact | Plan Changes | Decision | Owner | Next Review |
|---|---|---|---|---|---|
| 2026-08-28 | Reconciled Aug 28 V2 Blueprint (Public vs Transaction QR, $20/10k FCFA reward after 3/3 sales, Bulk Availability Pro model). | Updated Master Plan & Board to match precise V0 spec. | Advance to Root & Trunk execution | Founder HQ | 2026-08-28 |
