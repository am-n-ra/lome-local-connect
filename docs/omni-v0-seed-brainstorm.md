# Omni V0 Seed & Species Brainstorming & Specification

**Date:** August 28, 2026 UTC
**Authority:** Nature Way (`/nature-way` Seed & Species Alignment)
**Status:** Approved by Founder

---

## 1. Core Buyer Journey: Map-First Search Engine
- **Landing Experience**: Opens directly on the slow-rotating globe centered over Lomé, Togo, transitioning to a clean monochrome MapLibre map.
- **Unauthenticated Discovery**: Buyers can search freely ("pneus 15 pouces", "sac de riz 25kg") or browse category pills (Alimentation, Électronique, Mode, Artisanat, Matériaux, Services) without logging in.
- **Auth Handoff**: If an action requires authentication (e.g., creating an intent, sending a availability query), the active search query, category, and filters are saved to `sessionStorage` and automatically restored upon login.
- **Walking Itinerary**: Built-in OSRM walking route calculation rendered on-map with step-by-step guidance and French SpeechSynthesis.

---

## 2. Public Facility QR vs. Transactional QR
- **Public Facility QR Code (Static)**:
  - Physical QR code placed at shop locations.
  - Scanning opens the facility's public detail sheet and active product catalog.
  - Does NOT create a transaction intent or trigger purchase logic.
- **Transactional QR Code (Dynamic)**:
  - Generated ONLY when the buyer clicks **"Je veux acheter"** (Intent confirmed).
  - Contains buyer ID, facility ID, selected product list, prices, applied coupons, and an expiration timer.
  - **Validation & Handoff**: Validatable inside the seller's private transaction chat (whether scanned in person via camera, received via Omni notification, or received via external link/WhatsApp).

---

## 3. Real-Time Availability Engine & Omni Allocated Stock
- **Two-Stage Availability Logic**:
  - **Stage 1 (Search Filtering)**: Filters visible facilities instantaneously based on `quantity_allocated_omni >= requested_quantity` and `price <= budget`.
  - **Stage 2 (Verification & Auto-Response)**:
    - **Free Sellers**: Always require manual human verification for availability queries.
    - **Pro Sellers**: Auto-response triggers IF `is_online == true`, `quantity_allocated_omni >= requested_quantity`, AND `(now - last_confirmed_at) < 48 hours`.
    - If `last_confirmed_at` is older than 48 hours, the request automatically falls back to manual seller verification.
- **48h Batch Freshness Confirmation ("Tout confirmer")**:
  - A single button on the seller dashboard sets `last_confirmed_at = now()` for all products owned by that facility in one tap.
- **Future AI Agent Readiness**:
  - Allocated stock (`quantity_allocated_omni`) serves as the structured boundary that future AI agents will query and manage automatically.

---

## 4. Multi-Product Intent & Coupon System
- **Multi-Item Support**: An intent request can group multiple products from the same seller facility (`1 buyer -> 1 seller -> N products`).
- **Coupon Rule**: **1 coupon per product** (coupons are product-scoped, not global cart discounts).

---

## 5. Seller Trust Milestone: `0/3 -> 3/3` Sales & $20 Reward Unlock
- **Facility Progression**: `Brouillon` → `En revue` → `Certifiée` (by Admin) → `Confirmée` (after 3 verified sales).
- **$20 (~10,000 FCFA) Reward**:
  - Upon completion of the 3rd verified sale (`3/3`), a celebration modal opens and **$20 (~10,000 FCFA)** is automatically credited to the facility wallet.
  - This reward can be used to activate Pro status or fund usage credits.

---

## 6. Omni Pro Tier & Wallet Integration
- **Pro Tier Benefits**:
  - Automated Omni stock availability responses (within 48h freshness window).
  - Access to Bulk Availability query processing.
- **Ranking**: Pure distance, freshness, and relevance ranking (No sponsored ranking boost for V0).
- **FedaPay Production Wallet Top-Up**:
  - FedaPay API keys are configured in Vercel production environment.
  - Wallet deposits execute real/production-configured FedaPay transactions with server webhook validation.
