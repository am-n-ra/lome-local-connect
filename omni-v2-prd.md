# Omni V2 — Product Requirements Document

**Status:** Rewritten from approved Nature Way Seed
**Authority:** Product problem, users, outcomes, scope and requirements
**Rule:** This document supersedes all pre-Nature-Way PRD drafts.

## 1. Executive summary

Omni is a global geospatial supply-and-demand search engine. It helps people discover products and services in the environment around them, inspect source-backed facilities, select real catalogue offers, verify availability across relevant suppliers, compare responses and complete a traceable handoff.

The product is map-first. The globe/map is the permanent scene; contextual sheets, cards and rails are temporary surfaces above it. Omni separates public place knowledge from trusted supply knowledge and separates commercial capacity from trust. A facility can use Pro to publish more, but only three successful Omni sales create the `confirmed` trust badge.

## 2. Problem

A person may know what they need without knowing where it is available, whether it is available now, what quantity exists, what it costs or which supplier is worth contacting. Current tools force the user to move between maps, directories, catalogues, messages and payment coordination, often making the user ask many suppliers the same question.

A seller may operate a shop, branch, home activity, mobile service or personal expertise. Existing models tend to confuse the account owner with the place, company, catalogue and trust level. Omni must support multiple real operating contexts without allowing unlimited untrusted facilities or purchased trust signals.

## 3. Vision and promise

> **Search what you need, see where a real facility may provide it, verify availability without unnecessary seller polling, compare your options and complete a traceable handoff without losing your place on the map.**

Omni succeeds when a buyer can move from an uncertain need to a trustworthy, resumable next action, while a legitimate seller can establish a facility, publish only what it can support and progress through evidence and real usage.

## 4. Users

| User | Need | Product response |
|---|---|---|
| Visitor | Understand Omni and explore nearby context without onboarding friction | Public globe, facilities and public information |
| Buyer | Find products/services, verify and compare availability | Catalogue-first search, bounded requests and comparison |
| Seller | Represent distinct companies/facilities and operate supply | Evidence workflow, facility-scoped catalogue and operations |
| Admin | Make trust decisions with evidence and audit | Review queue, reasons, actor and history |
| Operator | Know whether public discovery and transactions are healthy | Consent-aware analytics, logs, runbooks and recovery |

## 5. Core journey

```text
arrive on map → search need → discover facilities → inspect facility → choose catalogue offer → request availability → compare responses → create intent → access transaction room → show QR/declare external payment → fulfil → confirm receipt → rate
```

The map remains mounted. The user can close a surface, explore elsewhere and return to the unfinished context. A search or availability check never silently reserves stock.

## 6. Product principles

| Principle | Requirement |
|---|---|
| Map is the scene | Never replace the primary experience with a conventional grid or disconnected dashboard |
| Public data is not supply proof | A public pin proves source presence only |
| Catalogue before free text | Use real facility offers whenever they exist |
| Trust cannot be bought | Pro expands capacity; only three successful sales produce `confirmed` |
| Facility is the commercial unit | Limits, Pro, bonus and trust belong to the facility |
| Account controls access breadth | One free slot; additional facility slots require paid/included entitlement |
| Server owns sensitive facts | Status, price, stock, availability, money, QR and permissions are authoritative server facts |
| Private data is unlocked | Contact, itinerary, chat and QR follow named transitions |
| One wallet | One rechargeable Omni Wallet per account; ledgered platform spending only |
| Resumability is a feature | Refresh, close, back and interruption preserve unfinished intent |
| Honest states | Empty, unavailable, stale, denied, expired, replayed and error states are designed |
| Manual before AI | Manual operations must be proven before AI mutates business state |

## 7. Functional requirements

### 7.1 Public map and discovery

Omni must render a genuine MapLibre globe/map as the arrival surface, with optional idle rotation, manual camera controls, truthful location states, source-backed pins, low-zoom clustering and visible-bounds discovery. The server must handle antimeridian bounds, source status, deduplication, timeout and bounded fallback.

Visitors may inspect public facilities and public catalogue information. A database-backed search, availability check or protected continuation requires authentication and must preserve the context that triggered the gate.

### 7.2 Buyer search

The buyer uses one search dock with a primary input and one Options disclosure. Options include category, open-now, distance/radius, discounts, sorting, location mode, quantity and budget. Quantity and budget are not shown as distracting default panels; both are manually editable when relevant, and budget supports unlimited.

Enter and the visible search action share one guarded submission. Typing never changes the map view. Search results are bounded by the visible viewport, contextual to the query and recoverable on failure.

### 7.3 Facility and catalogue

A result card shows the matched product/service first, media when available, facility identity, public source/trust status, distance, price/offer and product count. Selecting it only opens facility context.

A public facility surface shows public identity, media, address, public hours, status and catalogue summary. The catalogue is scoped to the selected facility, places the matched offer first and shows media, price, offer status and quantity eligibility. Selecting a product creates a typed selection only; it does not create a request or transaction.

### 7.4 Availability and comparison

An authenticated buyer selects scope and constraints, then submits one availability request. The server validates product, quantity, budget, eligibility, freshness and scope. A request does not reserve stock. Responses are timestamped and explicit: available, partial, unavailable, expired, corrected, no response or error.

Comparison makes differences legible: facility, distance, freshness, price/offer, quantity, response status and next action. Intent is possible only from an eligible comparison response.

### 7.5 Seller facility lifecycle

A seller may claim an imported unclaimed facility or create a new one. A claim action creates an evidence request only. The seller submits identity, facility and product/service evidence. Admin review produces certified, rejected or needs-more-evidence outcomes.

A certified facility becomes `unconfirmed` and may publish five offers on Free capacity. Three successful Omni sales create the non-purchasable `confirmed` trust badge. Facility Pro may expand catalogue limits and tools without creating `confirmed`.

### 7.6 Account slots and facility Pro

Every seller account receives one free facility slot. Additional facility/company slots require Omni Wallet payment or a future workspace entitlement. Slot entitlement controls facility count; it does not grant catalogue capacity or trust.

Facility Pro is scoped to one facility. It expands that facility’s commercial limits and tools. If it expires, Free limits return. A facility keeps `confirmed` only when it has completed three successful Omni sales independently.

### 7.7 Bonus and wallet

The $20 bonus is facility-scoped and becomes spendable only after three successful Omni sales. It is non-withdrawable and usable only for platform features. There is one rechargeable Omni Wallet per account with a server ledger for deposits and platform spending, including slots, facility Pro, ads and coupon credits.

Omni V1 does not process buyer-to-seller payments, seller withdrawals or seller payouts.

### 7.8 Intent and transaction

An eligible comparison response creates an idempotent purchase intent with an immutable snapshot of facility, product, price, offer, quantity, response freshness and fulfilment context. The intent opens one authorized transaction room with timeline, actor-specific next action, chat and QR.

Contact and itinerary become available only after intent creation. QR is server-issued, expiring and replay-safe. The buyer declares an external method such as cash, mobile money or pay-on-delivery. The seller confirms receipt, fulfils the order, and the buyer confirms receipt before rating.

### 7.9 Admin and operations

Admins review evidence with actor, time, reason and evidence context. Operators can inspect discovery failures, recovery status, ingestion outcomes, ledger anomalies and consent-aware analytics. Manual work must have an owner, runbook, audit record and recovery path.

## 8. Success measures

The first release must establish event definitions and denominators for search usefulness, discovery comprehension, catalogue relevance, availability completion, intent uniqueness, transaction completion, seller activation, trust integrity, wallet integrity, recovery quality and mobile usability.

Release targets are directional until the baseline is measured. Non-negotiable integrity targets are zero client-authorized trust/status transitions, zero duplicate intents, 100% auditable trust outcomes and no hidden wallet withdrawal path.

## 9. Scope

| Capability | Release treatment |
|---|---|
| Map-first globe and public discovery | Build now |
| Catalogue-first availability and comparison | Build now |
| Facility certification and seller onboarding | Build now; admin step may be manual |
| Seller map-first workspace | Build now |
| Purchase intent, transaction room, QR and fulfilment | Build now |
| One Omni Wallet and FedaPay recharge | Build now; platform spending only |
| PWA/mobile web | Build now |
| OSM/public-data adapter | Build now as bounded/manual operational capability |
| Automated admin certification | Deferred/manual initially |
| AI orchestration | Deferred |
| Native apps | Deferred |
| Buyer-seller in-app payment | Deferred/not in first release |
| Seller withdrawals and payouts | Deferred/not in first release |
| Instant unrestricted global prepopulation | Deferred/not promised |

## 10. Non-goals

Omni is not a generic social network, public chat application, conventional ecommerce cart, seller payment processor, seller payout system, static directory, decorative globe, unrestricted global data dump or AI agent that replaces unproven manual operations.

No visible action may be fake, dead or silently future-facing. If an operation is manual, the UI must say so and identify its state.

## 11. Roots gate

Before implementation resumes, Roots must define and test the data/API contracts for account slots, facility identity, certification evidence, trust progression, facility Pro, bonus unlock, wallet ledger, public source ingestion, availability freshness, intent idempotency, QR replay safety, external payment declarations and resumable context.
