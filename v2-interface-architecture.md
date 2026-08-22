# Omni V2 — Interface and Architecture Contract

**Status:** Rewritten from approved Nature Way Seed
**Authority:** Interface composition, screen contracts, data boundaries and implementation constraints
**Rule:** This document supersedes all pre-Nature-Way UI and architecture drafts.

## 1. Experience thesis

Omni should feel like a calm, premium instrument for seeing what exists in the world. The globe/map is not a background image behind an application; it is the application’s permanent spatial scene. Every surface explains or advances the current map context.

The supplied Omni logo — a warm ivory location pin containing an eye and a saturated orange center — is the identity anchor. The visual system uses warm ivory, translucent white, soft peach, deep charcoal and orange as an action accent. It avoids generic SaaS blue, dense dashboard chrome and decorative cards disconnected from geography.

## 2. Persistent composition

```text
┌──────────────────────────────────────────────┐
│ brand/context                 notifications ☰ │
│                                              │
│             persistent MapLibre scene        │
│        controls       pins / clusters         │
│                                              │
│     attribution                            │
│       ┌──────── contextual sheet ────────┐   │
│       │ result / facility / catalogue   │   │
│       └─────────────────────────────────┘   │
│       ┌──────── search dock ─────────────┐   │
│       │ search row              Options⌄ │   │
│       └─────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

The map occupies the full available viewport under safe areas. Chrome is minimal and never creates an old global navigation bar. The dock owns search and one Options disclosure. Sheets own contextual detail. Result cards are fully visible surfaces, not inaccessible horizontal scroll traps.

On mobile, the dock and sheets anchor from the bottom and leave enough map visible to preserve orientation. On desktop, sheets are bounded floating surfaces with the map visible around them. No overlay may cover camera controls, attribution or the primary search action.

## 3. Screen and state contracts

| Surface | Primary responsibility | Required states |
|---|---|---|
| Arrival map | Explain Omni and enable public exploration | idle globe, locating, exact, approximate, denied, timeout |
| Search dock | Accept need and reveal options | input, options open, submitting, error, retry, auth required |
| Result surface | Explain contextual matches | loading, results, empty, source fallback, selected, closed |
| Facility sheet | Show public facility context | loading, ready, unclaimed, certified, unconfirmed, confirmed, unavailable, error |
| Catalogue sheet | Show facility-scoped offers | loading, ready, empty, sold out, closed, error |
| Availability flow | Capture product, scope and constraints | product, scope, constraints, submitting, responses, no response, error |
| Comparison surface | Make response differences legible | loading, response set, stale, unavailable, selected |
| Intent review | Confirm the buyer’s choice | review, creating, reused, error |
| Transaction room | Own one authorized handoff | QR ready, chat, payment declaration, fulfilment, receipt, rating, recovery |
| Seller workspace | Operate facilities above a map | facility list, map context, requests, products, coupons, scanner, empty/error |
| Admin review | Review evidence and outcomes | queue, evidence, approve, reject, needs more, audit error |
| Auth/onboarding | Authenticate and explain Omni | sign-in, sign-up, restore context, education, error |

## 4. Shared component rules

The implementation must have one `OmniSheet`, one search dock, one map scene and typed state transitions. A component may not invent a second variant of the same surface to bypass the contract.

Every async surface has loading, ready, empty, error, retry, cancel, locked and success treatment where applicable. Every primary action has disabled reasons and an honest pending state. Back and close preserve context. Focus remains in the active input on mobile and keyboard focus is visible.

Cards use a consistent hierarchy: identity first, matched offer second, evidence/status third, distance/freshness next, and one primary next action. Product media is shown when authoritative media exists; missing media produces a stable neutral placeholder, never a broken image or decorative substitute.

## 5. Buyer map contract

The buyer route mounts MapLibre as the root scene. Public map data comes from a bounded server adapter. The client sends viewport bounds, zoom, query and filters; the server returns source-backed facilities, source status, cluster information and freshness metadata.

Map camera ownership is explicit. Manual interaction interrupts idle rotation and search reveal. Selecting a card focuses a facility without destroying the result context. Closing a facility returns to the prior result state. Restoring a session restores the map viewport, query, filters, selected facility, product and protected continuation where safe.

## 6. Seller map-first contract

The seller route is not a conventional dashboard placed beside a map. It uses the same map scene and sheet language as the buyer route. A seller can switch between authorized facilities, see their geographic context, open requests, manage products and coupons, and launch scanner actions without losing the map orientation.

Seller UI must expose the difference between account capacity and facility capacity. Facility Slots appear at account/workspace level. Catalogue limits, Pro, bonus and trust status appear at facility level. The seller must never see a single global Pro badge that implies every facility is confirmed or unrestricted.

## 7. Data and API boundaries

Browser components may call typed client functions only. Server operations own validation, authorization, status transitions, price and stock snapshots, source ingestion, ledger mutation and audit events. Secrets, database clients and payment credentials never enter browser modules.

Required boundary contracts include:

| Contract | Input | Authoritative output |
|---|---|---|
| Public discovery | bounds, zoom, query, filters | source-backed facilities, clusters, freshness, fallback status |
| Facility detail | facility ID, public context | public facility and permitted catalogue summary |
| Catalogue | facility ID, buyer context | active facility-scoped offers and eligibility |
| Availability | account, product ID, quantity, scope, constraints | request ID, response state, freshness, limits |
| Facility certification | seller, facility, evidence set | audited outcome and reason |
| Facility slot | account, purchase source | idempotent entitlement and ledger event |
| Facility Pro | facility, plan, wallet authorization | facility entitlement, limits and expiration |
| Wallet recharge | account, FedaPay reference | pending/confirmed/failed ledger event |
| Purchase intent | buyer, selected response | immutable transaction snapshot and unlock scope |
| QR verification | transaction, token/code | verified/expired/replayed/mismatch result |
| Fulfilment | authorized actor, transaction | next allowed state and audit event |

## 8. Responsive and accessibility baseline

The release baseline is 320, 375, 768 and 1280 CSS pixels. The map must remain usable at each width, no horizontal overflow is allowed, sheets must be scrollable without trapping the primary footer, and the search field must not trigger browser zoom through unsuitable mobile typography.

Keyboard navigation, visible focus, reduced-motion behavior, semantic labels, contrast, touch target sizing and screen-reader names are part of the core path, not a later polish task.

## 9. Performance and resilience

The map shell loads without waiting for protected data. Discovery requests are debounced and abortable. Remote vector or public-data sources have timeouts and an explicitly labelled fallback. Large result sets cluster by zoom and never render unbounded pins.

Refresh, tab restoration, back navigation, duplicate submit, offline transition, permission denial, expired QR, failed recharge and stale availability each have a recoverable state. Telemetry records state transitions and failure causes without collecting secrets or unnecessary personal data.

## 10. Architecture decisions for Roots

Roots must choose and document the authoritative database schema, authentication provider, server framework, deployment topology, MapLibre tile strategy, public-data adapter limits, FedaPay integration boundary, event schema and feature-flag strategy. No UI implementation may silently choose values that change the Seed invariants.

The preferred application structure is domain-oriented: `identity`, `discovery`, `facilities`, `catalogue`, `availability`, `entitlements`, `wallet`, `transactions`, `verification`, `analytics` and `operations`. Each domain exposes typed contracts, server authorization, UI states and proof fixtures together.

## 11. Interface gate

The interface is ready for implementation only when every visible action maps to a typed state and operation, every protected field has an unlock owner, the map remains the dominant scene, seller/account/facility entitlements are visually distinct, and the responsive proof matrix is defined before the first screen is built.
