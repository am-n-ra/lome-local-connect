# Omni V1 Continuity — Source of Truth

**Status:** normative implementation contract for the continuity program  
**Date:** 18 August 2026  
**Architecture baseline:** current production Omni on MapLibre globe, OSM discovery, Neon/Postgres and TanStack Start server functions

## 1. Purpose and precedence

This document reconciles the current Omni master/interface specification, the supplied one-shot UI prompt, the complete flow specification, the data/business-rules specification, and the latest continuity clarification. It is the implementation source of truth for the next program of work.

The continuity decision is explicit: **Omni must not regress from the current production direction to a greenfield Mercator-only mock application.** The MapLibre globe, global viewport discovery, OSM-backed unclaimed facilities, real Neon/Postgres contracts, PWA shell and published map-first work remain. The supplied one-shot document contributes stricter UI composition, state-machine, error, QR, payment-choice and data-invariant requirements.

When documents conflict, precedence is:

1. The current production architecture and user-confirmed continuity decision.
2. This document’s V1 loop and security/financial rules.
3. The existing master scope gate and manual operations layer, with existing implemented V1 capabilities retained unless explicitly marked for correction.
4. The supplied one-shot UI and flow documents for screen composition, state naming, CTA behavior and test coverage.
5. Historical brainstorms and reports, which are evidence only.

## 2. Product identity and V1 loop

Omni is a geospatial supply-and-demand discovery engine. The map is the product surface, search is the entry point, the facility is the primary supply object, availability is the bridge between discovery and action, and the transaction record is the durable outcome.

> **Search → Discover → Facility/Product → Check availability → Compare responses → Purchase intent → Shared transaction chat → QR generation/share/verification → Payment preference → Seller confirmation → Fulfilment/receipt confirmation → Completed transaction**

The experience must be honest about what Omni did and did not process. Omni can record a cash or external mobile-money payment without claiming that Omni processed the money. The QR is a transaction identity and verification mechanism, not automatically a payment QR.

## 3. Scene grammar and panel hierarchy

The globe/map remains the permanent scene for normal product interaction. The shared shell is:

```text
OmniAppShell
└── OmniMapShell
    ├── MapCanvas / globe
    ├── MapChrome: notifications + menu
    ├── MapControls: zoom +, zoom −, recenter/location state
    ├── Facility pins and selected result state
    ├── ResultRail above the search dock
    ├── SearchDock
    └── OverlayHost
        ├── FacilitySheet
        ├── AvailabilitySheet
        ├── SellerOperationSheet
        ├── WalletSheet
        └── TransactionSurface
```

Discovery result cards remain a horizontal snap rail because they are the approved discovery pattern. Facility, availability, seller operations, wallet and focused forms use **centered glass panels** above the map rather than drifting side panels. The transaction surface may become full-screen because it is the focused conversation and execution surface; returning from it restores the previous scene and selection.

Every overlay follows the same rules: one primary CTA, two sheet levels maximum, one-gesture close/back, focus restoration, internally scrolling body, sticky action footer, safe-area insets, minimum 44px touch targets, no page-level horizontal overflow and no loss of the map context unless the transaction surface is intentionally full-screen.

## 4. Brand, copy and motion rules

The visual system is Creamy Glass: warm cream background, frosted translucent surfaces, quiet water and land styling, restrained warm orange actions, soft depth and semantic success/warning/danger colors. Tokens are defined centrally; component-level arbitrary hex colors are prohibited.

UI copy is French, formal and sentence case. Buttons use verbs. The product copy says *indexer*, *trouver* and *découvrir* rather than presenting Omni as a generic marketplace. Errors state what happened and what to do next. Empty states invite an action. No raw stack traces, apology-only messages, dead buttons or indefinite spinners are allowed.

The globe can rotate in its resting state and search can trigger the existing progressive reveal choreography. Camera commands remain explicit and interruptible. Reduced motion preserves the semantic states while shortening or removing motion. Typing in the search field never changes the search scene or unexpectedly zooms the mobile page.

## 5. Buyer flow contract

### 5.1 Search and authentication

The buyer may browse public map and facility data without an account. Submitting a protected search or action opens an auth gate. Query, quantity and budget are preserved in ephemeral router/session state and replayed exactly after authentication. Auth checking is bounded; it never becomes an infinite loading screen.

Search has one primary field and one shared submit handler for Enter and the search button. Structured quantity and budget controls are optional refinements, not a default oversized card. Budget is a buyer-side ranking/filter signal and must never appear in the seller-visible availability payload.

### 5.2 Discovery and facility

Result cards prioritize the searched product/service and offer, then availability signal, distance/context, facility name/state, certification, media and valid action. Claimed, certified and confirmed facilities may expose availability. Unclaimed facilities remain discoverable and show their OSM provenance, but cannot expose seller-controlled availability, direct purchase or private contact. Suspended facilities are excluded from public discovery.

Facility detail is a centered sheet. Contact and precise directions are not fetched or rendered before purchase intent. The primary eligible action is `Vérifier la disponibilité`. The unclaimed variant shows only the honest claim path and explanation.

### 5.3 Availability

Availability is a three-step centered sheet: product/service, target facilities, and constraints. The target step supports one facility or small bulk up to 12 results. Bulk quota is enforced server-side and may be limited by plan; quota exhaustion never removes the unlimited single-facility path.

The result phase remains in the same surface and keeps the map visible behind it. It shows live count/SLA, target pins, sorting and persistent response cards. States are `sent`, `awaiting_seller`, `available`, `partial`, `unavailable`, `sla_expired` and `closed_no_purchase`. Available and partial responses can create an intent; unavailable and expired responses remain visible without a purchase CTA.

## 6. Shared transaction and chat contract

Buyer and seller open the same transaction record and the same interleaved feed of system events and human messages. The progress labels are always visible: `Intention`, `Offre`, `QR`, `Paiement`, `Réception`. Exactly one role-specific primary action is visible at a time.

Purchase intent starts from an eligible availability response. The server freezes the product, quantity, price and coupon calculation, reserves stock atomically, creates the intent and opens the transaction chat. The QR is absent until the explicit offer-confirmation state required by the current transaction contract. Coupon application is represented as a system event when a coupon is actually applied.

The buyer can enlarge, copy, share or send the QR as a code or deep link. The link carries only a non-sensitive transaction token. A recipient opening it is routed through authentication when needed; after authorization, the server verifies account/role/ownership and reopens the correct transaction chat. It must never create a duplicate transaction or expose private data before authorization.

The seller can enter the transaction from notification, chat or console. Camera scan, manual code entry and QR deep-link verification converge on one server-side verification function. Replayed, expired, invalid, wrong-facility, wrong-seller and already-completed tokens produce persistent transaction events with explicit next actions.

## 7. Payment preference, external payment and fulfilment

Omni V1 does not process buyer payment in-app. After seller QR verification, the buyer chooses a recorded payment preference, including cash on delivery, TMoney, Flooz or another configured external method. The seller sees the permitted payment method and, for remote/mobile-money payment, the permitted seller payment contact details in the transaction chat. Disclosure is server-authorized and happens only after the transaction state permits it.

The buyer may mark that payment was initiated or made, but this is not sufficient to write `payment_recorded`. For external payment, the seller is the source of truth and must confirm receipt. For a future Omni-internal method, an authenticated provider callback is the source of truth. The seller then confirms fulfilment/dispatch. The buyer confirms reception. Only then does the transaction reach `completed`.

The exact vocabulary for fulfilment can remain provider-neutral in the contract while the UI presents clear states such as `Paiement à confirmer`, `Paiement reçu`, `Colis en route`, `Marchandise reçue` and `Transaction terminée`.

## 8. Seller flow contract

Seller onboarding is resumable: identity, facility placement, category, first product, hours and buyer-facing preview. A newly published facility remains `claimed` until certification. The buyer FacilitySheet is reused for the preview to prevent drift.

Product creation progressively exposes essential fields, media, visibility, optional coupon and summary. Free/Pro facility and product limits are enforced server-side. Coupon creation supports percentage or fixed discount, validity window, optional usage limit and optional product scope. Coupon validation and usage increments happen server-side, with usage consumed only on completed transaction.

Seller availability responses are one-gesture actions: `Disponible`, `Partiel`, `Indisponible`. Partial reveals quantity and price overrides inline. Once submitted, a response is immutable from the pending-demand console and remains in history. Seller notifications are transactional and deep-link to the exact demand or transaction state.

## 9. Omni Wallet contract

Omni has one rechargeable Wallet. The wallet can fund internal platform uses such as Pro, advertising, coupon and search-credit allocations, but it is not a seller withdrawal account. No withdrawal CTA is rendered.

Allocations are **not a free-form user reallocation flow** in V1. They are actionable internal ledger buckets: eligible platform operations may allocate or consume them through server-authorized operations, while the UI may display the current balance, available amount and usage actions. Users cannot drag arbitrary money between buckets, withdraw, or pretend that an internal allocation is cash.

FedaPay is a hosted recharge flow only. Recharge states are `amount_entry`, `pending`, `approved`, `declined`, `canceled` and `timeout`, with retry, cancel and status-check paths. The wallet is credited only after an authenticated approved callback or verified reconciliation, never optimistically. Duplicate callbacks are idempotent.

## 10. Data and security invariants

The server/database remains authoritative for authentication, ownership, facility state, plans, stock, coupons, money, QR verification and transaction transitions. UI-safe modules cannot import database drivers, server secrets or Node-only APIs directly or transitively.

The backend must enforce valid coordinates, seller ownership except for unclaimed facilities, facility certification rules, active-product filtering, product plan limits, atomic stock reservation, maximum 12 bulk targets, bulk quota, private buyer budget, SLA expiry, legal transaction order, QR uniqueness/expiry/replay protection, coupon validity, seller-only external payment confirmation, wallet callback idempotency, and role-scoped transaction messages/events.

## 11. V1, V1-Manual and V2 boundary

V1 includes the current globe/OSM discovery direction, search, facility states, manual availability, small bulk availability where enabled by plan, purchase intent, shared transaction chat, shareable QR, seller verification, external payment recording, fulfilment/receipt confirmation, basic coupons, seller onboarding/catalogue, transactional notifications, Omni Wallet recharge and internal allocation usage.

V1-Manual includes human-operated seller availability, manual certification, external payment confirmation and operations logging. The buyer-facing outcome must be indistinguishable from a future automated response.

V2 or later includes autonomous AI agent UI, visual/voice search, mass import, advertising campaign builder, fraud scoring, offline sync, native push/background capabilities, automated OSM backfill only where not already part of the current production decision, and any seller withdrawal/payout product.

## 12. Certification definition

The program is complete only when the existing production map-first direction remains intact, all buyer/seller states are reachable, QR code/link/manual/camera paths converge on one protected transaction, external payment is represented honestly, wallet recharge is independently correct, invariants are server-enforced, every documented error has recovery, and the test matrix passes at 320, 375, 390, 768 and 1280px plus a real HTTPS mobile camera/geolocation check.

## References

[1]: ./OMNI_MASTER_PRODUCT_INTERFACE.md "Current normative Omni master and V1 scope gate"
[2]: ./omni-v1-ui-one-shot-build-prompt.md "Current repository-specific V1 UI prompt"
[3]: ./omni-v1-ui-phase0-audit.md "Prior implementation audit"
[4]: ../omni-continuity-v1-plan.md "Approved continuity execution plan"
