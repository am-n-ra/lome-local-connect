# Founder HQ Master Plan — OmniView (Lomé, Togo)

> **Plan ID:** NW-OMNI-HQ-001
> **As of:** August 28, 2026 UTC
> **Founder outcome:** Build and launch Omni V0 MVP (Search-Engine Map-First + Public vs Transactional QR + Multi-item Intent with Per-Product Coupons + Seller 0/3 Sales Milestone & $20 Reward Unlock + Pro 48h Auto-Stock Response & Production FedaPay Wallet) straight to initial revenue and user validation for $150k–$500k seed raise & YC application.
> **Maturity target:** V0 Pilot & Revenue-Ready Production Candidate
> **Capacity limit:** Active execution on V0 MVP reconciled Seed & Species
> **Plan owner:** Founder HQ

## Reconciled Versioning Roadmap (Aug 28 Seed Brainstorm)

- **V0 MVP (Immediate Focus - Straight to Initial Revenue):**
  - **Buyer Experience:** Map-first local search engine (MapLibre GL, slow globe reveal, category pills, text/voice search, preserved auth query handoff, OSRM walking route).
  - **Public vs Transactional QR:**
    - Public Facility QR (Static): In-person physical QR scan opens facility detail sheet and catalog directly.
    - Transactional QR (Dynamic): Generated only post "Je veux acheter" intent; validatable in private transaction chat (camera scan, notification, or shared link).
  - **Multi-Product Intent & Coupons:** Buyers can group multiple items from the same seller facility in one intent; coupons apply **1 per product**.
  - **Real-Time Availability & 48h Freshness:**
    - Two-stage availability: Stage 1 pre-filters by allocation & budget; Stage 2 checks 48h freshness.
    - Pro Sellers: Auto-response if `quantity_allocated_omni >= qty` AND `last_confirmed_at < 48h`. Fallback to manual if older.
    - Free Sellers: Always human manual verification.
    - Seller 1-tap freshness batch button ("Tout confirmer").
  - **Seller Trust Milestone (3 Sales -> $20 Bonus Reward):**
    - Status progression: Draft -> In Review -> Certified (Admin) -> Confirmed (0/3 sales).
    - Upon 3/3 verified completed sales, unlock **$20 (~10 000 FCFA)** reward bonus to facility wallet.
  - **Pro Tier & Production FedaPay Wallet:**
    - Pro tier centered around automated Omni stock responses & Bulk Availability credits.
    - Pure relevance & distance ranking (no sponsored ranking boost in V0).
    - Production FedaPay wallet top-ups with server webhook confirmation.

- **V1 (Post Seed Raise $150k–$500k & YC Application):**
  - Native Mobile Application / PWA.
  - Mobile money (FedaPay / Flooz / T-Money) payout integration.
  - Physical QR sticker distribution for Lomé shops.
  - Cohort analytics (CAC Seller/Buyer, LTV, retention).

- **V2 / V3 (Alipay-Like Ecosystem Scale):**
  - Instant Omni Wallet digital payment ecosystem across Lomé and West Africa.
  - Bulk availability enterprise APIs & AI proximity push alerts.

---

## Ordered Gate Plan

| Order | Ecosystem Gate | Decision Condition | Primary Specialist | Required Artifacts | Expected Return | Status | Re-Plan Trigger |
|---|---|---|---|---|---|---|---|
| 1 | Seed & Species Brainstorming | Reconcile all V0 details (Public/Transac QR, 48h freshness, 1 coupon/product, FedaPay live) | `/nature-way` | `docs/omni-v0-seed-brainstorm.md` | Approved V0 Seed Spec | `done` | Scope change |
| 2 | Root System & Schema Alignment | Update backend data models, DB schema, API handlers (`src/server/`) | `/nature-way` | `src/server/`, Vitest | Verified backend endpoints, 0/3 sales counter, FedaPay integration | `in_progress` | Backend or API error |
| 3 | Trunk Buyer & Seller UI Execution | Implement stateful map landing, public/transaction QR, multi-item intent, seller 0/3 milestone, $20 reward unlock | `/nature-way` | `src/trunk/` | Working V0 web app | `todo` | UI breakage |
| 4 | Verification & Test Gate | Pass unit & integration Vitest suites (`npx vitest run`) | `/nature-way` | Vitest test suites | Clean test pass | `todo` | Test failures |
| 5 | Pre-Commit & Submission | Final review, documentation, code freeze | `/nature-way` | Pre-commit check | Production ready submit | `todo` | Drift |

---

## Reconciliation Log

| Date | Specialist Return or New Fact | Plan Changes | Decision | Owner | Next Review |
|---|---|---|---|---|---|
| 2026-08-28 | Completed interactive Seed & Species brainstorming. Fixed 48h freshness rule, 1 coupon per product, no sponsored ranking in V0, and production FedaPay keys. | Updated Seed brainstorm & Master Plan. | Complete Gate 1, advance to Gate 2 | Founder HQ | 2026-08-28 |
