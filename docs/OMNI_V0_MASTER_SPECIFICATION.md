# Omni V0 Master Specification — The Map-First Local Discovery Engine

## 1. Executive Summary & Vision
**Omni (OmniView Lomé)** is a mobile-first, map-centric geospatial search and discovery engine for urban Commerce in West Africa (starting in Lomé, Togo).

Unlike traditional e-commerce platforms that rely on centralized delivery warehouses or slow directory listings, Omni connects buyers directly with real-time local inventory and proximity points of sale.

### Core Philosophy
* **Map-First, Not List-First:** Discovery begins on an interactive vector globe/map (MapLibre), putting physical proximity and instant availability at the center.
* **Straight-to-Revenue V0:** V0 prioritizes high-value transaction enablers (verified stock checks, single-seller multi-item intents, QR verification, $20 seller onboarding rewards, and FedaPay deposits).
* **Zero Friction for Buyers:** Unauthenticated visitors can freely explore the globe, search for ultra-fresh stock (< 48h), and filter by category or proximity.

---

## 2. Spatial UI Layout & Component Architecture

The interface follows the strict **Nature Way Visual Contract** (`/nature-way`):

```
+-----------------------------------------------------------------+
| [Acheter / Vendre Toggle]                   [Notifications] [≡] |
| (Top-Left floating pill)                   (Top-Right controls) |
+-----------------------------------------------------------------+
|                                                                 |
|                      INTERACTIVE MAP / GLOBE                    |
|                (Dark/Monochrome MapLibre Vector Map)            |
|                                                                 |
|   • Emerald Pins (#10B981) = Confirmed Fresh Stock (< 48h)      |
|   • Gray Pins (#9CA3AF)    = Unconfirmed / Outdated Stock       |
|                                                                 |
+-----------------------------------------------------------------+
|                                                                 |
|  [ SEARCH DOCK ] (Anchored at Screen Bottom)                   |
|  +-----------------------------------------------------------+  |
|  | 🔍 [ Search Input / "Que recherchez-vous ?" ]      [🔍]   |  |
|  | [ All ] [ Alimentation ] [ Électronique ] [ Mode ] ...    |  |
|  | [⚡ Stock ultra-frais < 48h ] [📍 Autour de moi ]            |  |
|  +-----------------------------------------------------------+  |
+-----------------------------------------------------------------+
```

### Component Placement Rules:
1. **Top Nav (`src/components/omni/TopNav.tsx`)**:
   - **Top-Left**: Role Switcher Pill (`Acheter` / `Vendre`). Allows instant transition between Buyer discovery mode and Seller workspace.
   - **Top-Right**: System Notifications Bell and Main Menu Hamburger Drawer button.
2. **Search Dock (`src/components/omni/SearchDock.tsx`)**:
   - **Bottom Anchor**: Docked at the bottom of the viewport with safe-area padding.
   - **Globe Mode (Idle)**: Expanded hero dock featuring search input, geolocation button ("Autour de moi"), quick category chips, and the 48h stock freshness filter.
   - **Map Mode (Active)**: Floating top-compact dock to preserve maximum map canvas area while displaying active search results count and action triggers.
3. **Map Canvas (`src/components/omni/MapCanvas.tsx`)**:
   - Vector map using MapLibre GL JS with custom dark/monochrome tiles.
   - Dynamic clustering and custom pins: **Emerald Green (#10B981)** for verified < 48h fresh stock; **Slate Gray** for unconfirmed/outdated facilities.

---

## 3. Core V0 Functional Requirements

### A. Discovery & Search Engine
* **Natural Querying & Category Filtering**: Fast keyword search across product names, categories (*Alimentation*, *Électronique*, *Mode*, *Matériaux*, *Artisanat & Services*), and facility names.
* **48-Hour Stock Freshness Guarantee**:
  - Stock confirmed within 48 hours is flagged as **Ultra-Frais**.
  - Buyers can toggle `Stock ultra-frais < 48h` to filter out stale inventory.
* **Proximity & Geolocation**: Automatic approximate position detection with option to trigger high-accuracy GPS positioning.

### B. Public vs. Transactional QR Code Separation
* **Public Facility QR (`08-public-qr-facility-entry.png`)**:
  - Displayed on physical storefronts or public profile sheets.
  - Anyone scanning a Public QR accesses the store catalog sheet without authentication.
* **Transactional QR (`/transaction/qr?token=...`)**:
  - Account-bound and encrypted.
  - Used at the point of handover to confirm payment, stock collection, or delivery completion.
  - Access requires authentication by either the buyer or seller belonging to that specific transaction.

### C. Single-Seller Multi-Item Intent Flow
* Buyers can select multiple products from a single point of sale (facility) into one intent request.
* **Rule**: Maximum of **1 coupon per product** applies automatically during intent creation.
* Triggers a transactional chat thread between buyer and seller with real-time status updates (*Pending*, *QR Generated*, *Verified*, *Paid*, *Completed*).

### D. Seller Onboarding & Milestone Rewards
* **$20 (~10,000 FCFA) Seller Milestone Bonus**:
  - Evaluated via `evaluateSellerMilestone(completedSalesCount)`.
  - Unlocked directly into the seller's wallet upon reaching **3 completed/verified sales**.
  - Visible on the Seller Workspace dashboard (`src/components/omni-clean/CleanSellerWorkspace.tsx`) with a 3-step progress indicator.

### E. Monetization & Payments
* Integrated with **FedaPay** for local Mobile Money (T-Money, Flooz) and credit card deposits/payouts.
* Pro Subscriptions:
  - **Buyer Pro**: $5 / month.
  - **Seller Pro**: $10 / month.

---

## 4. Immediate Development Guidelines for Continuing Dev

When continuing implementation in subsequent sprints, adhere strictly to the following guidelines:

1. **State Management**:
   - Use `deriveOmniSurfaceState` and `deriveOmniMotionState` in `src/lib/omni-state.ts` for UI state transitions.
2. **Domain Logic & Testing**:
   - Place all pure domain rules in `src/lib/` (e.g., `v0-milestones.ts`, `finance.ts`, `omni.ts`).
   - Every new domain rule or calculation **must** have corresponding unit tests in `*.unit.test.ts` verified via `npx vitest run`.
3. **UI Modifications**:
   - Always verify responsive visual layout on mobile viewports.
   - Ensure the Search Dock remains bottom-anchored and does not obscure map navigation controls.
