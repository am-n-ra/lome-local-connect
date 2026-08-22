# Omni V2 — Canonical Flow Contract

**Status:** Rewritten from approved Nature Way Seed
**Authority:** Flow, state, transition, permission and recovery contract
**Rule:** This document supersedes all pre-Nature-Way flow drafts.

## 1. Product identity

Omni is a **map-first geospatial supply-and-demand search engine**. Its job is to help a person understand what products and services may be available in the environment around them, identify the relevant facilities, verify availability without unnecessary seller polling, compare options and complete a traceable handoff.

The map is the permanent scene. Sheets, cards and focused panels are temporary surfaces above it. Omni is not primarily a marketplace grid, social network, generic chat product, payment processor or decorative globe.

The core journey is:

```text
arrive → understand the map → search a need → discover facilities → inspect a facility → inspect/select catalogue offer → request availability → compare responses → create purchase intent → access authorized handoff → declare external payment → fulfil → confirm receipt → rate
```

## 2. Actors and authority

| Actor | Can do | Cannot do |
|---|---|---|
| Visitor | Explore the map, view public facilities, inspect public facility and catalogue information | Query protected database search, request availability, see private contact/itinerary, create intent, access chat or QR |
| Buyer | Search, filter, select offers, request availability, compare, create intent, use authorized room, declare external payment, confirm receipt and rate | Mutate catalogue, confirm seller payment, verify seller QR, advance seller-owned states |
| Seller | Manage authorized facilities, submit evidence, manage catalogues, answer availability, configure coupons, verify QR, confirm payment and fulfil | Self-certify, fabricate trust/status/discount, exceed stock, withdraw wallet funds |
| Admin | Review evidence, issue audited outcomes, inspect history and correct bounded operational records | Bypass evidence review with an unreasoned generic status mutation |
| Server | Authorize transitions, enforce invariants, issue tokens, snapshot facts, ledger money and audit changes | Trust client status, price, stock, QR, identity or money claims |

## 3. Source-of-truth boundaries

| Fact | Authority |
|---|---|
| Public facility existence, name, category and location | Source-backed public data or reviewed server record |
| Facility certification and trust | Admin-reviewed evidence outcome |
| Product identity, price, media and stock allocation | Facility catalogue plus server validation |
| Availability response | Seller action or explicitly bounded approved automation |
| Purchase intent and transaction facts | Idempotent server operation and immutable snapshot |
| QR validity | Server-issued token, expiry and replay state |
| External payment | Buyer declaration and seller acknowledgement; Omni does not move buyer-seller money |
| Fulfilment and receipt | Authorized seller and buyer actions |
| Wallet balance | Confirmed recharge ledger and server spend ledger |
| Analytics | Consent-aware, minimized and pseudonymous event pipeline |

## 4. Global surface rules

The map remains mounted through all buyer and seller map-first flows. The UI uses one shared sheet primitive:

- bottom anchored on mobile;
- bounded floating surface on desktop;
- scrollable body without horizontal overflow;
- reachable primary footer action;
- explicit loading, ready, empty, error, retry, cancel, locked and success states;
- back, escape, close and gesture ownership defined per surface;
- unfinished context preserved unless the user explicitly cancels or completes it.

The top chrome contains only brand/context, notifications and a typed menu. Every visible action resolves to a real state or a clearly labelled manual operation. No dead menu item is permitted.

## 5. Visitor and buyer access states

```text
visitor_arrival
  → explore_map
  → public_facility
  → auth_required

visitor_arrival
  → request_location
  → location_exact | location_approximate | location_denied | location_timeout

visitor/public_facility
  → protected_search
  → auth_required(context_snapshot)

auth_required
  → authenticated
  → cancelled | auth_error

authenticated
  → restore_context
  → prior_safe_state
```

A visitor can see public information but cannot execute a protected Omni database search. The authentication transition must preserve query, filters, map viewport, selected facility and selected product where applicable.

## 6. Map and location state machine

```text
idle_globe
  → locating
  → location_exact | location_approximate | location_denied | location_timeout | idle_globe

idle_globe
  → manual_exploration
  → search_input
  → public_facility

locating
  → cancelled
  → location_exact | location_approximate | location_denied | location_timeout

location_exact
  → idle_globe | search_input | manual_exploration
location_approximate
  → retry_precise_location | search_input | manual_exploration
location_denied | location_timeout
  → retry_location | fallback_context | search_input
```

The resting state is a real MapLibre globe with slow idle rotation. User pan, zoom, keyboard focus, search reveal and selected-facility focus pause or override rotation according to priority:

```text
manual interaction > selected facility > active search reveal > result framing > idle rotation
```

A blue personal marker is shown only for a fresh browser position with acceptable accuracy. Approximate location is never labelled exact. Location requests are cancellable and non-blocking.

Visible bounds are sent to the server with an abortable request. The server handles antimeridian crossing, scope, source status, deduplication and fallback. Public pins represent source-backed facilities; they do not prove current inventory.

## 7. Search state machine

```text
search_input
  → options_open
  → search_submitting
  → auth_required
  → search_reveal

options_open
  → edit_options
  → apply_options
  → search_input

search_submitting
  → search_reveal | search_error | auth_required

search_reveal
  → results_visible | empty_results | search_error | cancelled

search_error
  → retry_search | preserve_input | return_to_map
```

The search dock has one input row and one Options disclosure. Quantity, budget, category, distance/radius, open-now, discounts, sort and location mode live inside that disclosure. Typing never changes the camera. Enter and the search button use the same guarded submission path. Budget supports unlimited and manually editable values. The buyer selects an existing catalogue product when one exists; free text is a fallback, not the preferred path.

## 8. Results and facility state machine

```text
results_visible
  → facility_selected
  → result_list_restored
  → search_input
  → map_idle

facility_selected
  → facility_detail
  → result_list_restored
  → catalogue_loading
  → auth_required
  → verification_request

facility_detail
  → catalogue_loading
  → availability_product_stage
  → result_list_restored
```

Result cards show the matched product or service first, media where available, facility identity, source/trust status, distance, offer/price, product count and one next action. Selecting a card only selects a facility. It never claims, checks availability or creates purchase intent.

Public facility detail shows identity, media, source/status, address, public hours/open state, matched offer and product count. Contact and Omni-provided itinerary remain hidden until the purchase-intent unlock.

## 9. Catalogue and availability state machine

```text
catalogue_loading
  → catalogue_ready | catalogue_empty | catalogue_sold_out | catalogue_closed | catalogue_error

catalogue_ready
  → product_selected | facility_detail

product_selected
  → availability_scope

availability_scope
  → availability_constraints

availability_constraints
  → availability_submitting | auth_required

availability_submitting
  → responses_visible | no_response | availability_error | cancelled

responses_visible
  → comparison
  → availability_scope
  → product_selected

comparison
  → purchase_intent | responses_visible
```

The catalogue is scoped to the selected facility. The matched offer appears first. Each offer shows name, media, price, discount/offer state, stock/quantity eligibility and freshness. A catalogue selection never reserves inventory and never creates a demand by itself.

Availability requires an account. The request records product, requested quantity, budget/range, location/context, urgency and eligible scope. A request must not silently query unlimited sellers or imply reservation. Responses are real, bounded and timestamped. `available`, `partial`, `unavailable`, `expired`, `corrected`, `no_response` and error states are explicit.

## 10. Facility trust and seller onboarding

```text
unclaimed
  → verification_draft
  → verification_submitted
  → admin_review
  → certified | rejected | needs_more_evidence

certified
  → unconfirmed

unconfirmed
  → confirmed_after_three_sales
  → remains_unconfirmed

unconfirmed + facility_pro
  → expanded_catalogue_capacity
  → still_unconfirmed_until_three_sales

confirmed
  → confirmed_with_pro | confirmed_free_limits
```

A claim click only creates an evidence request. Certification requires identity, facility and product/service evidence and an audited admin outcome. After certification, the facility becomes `unconfirmed` and may publish a maximum of five offers.

`confirmed` is a non-purchasable trust badge. It requires three successful Omni sales and is never granted by Pro. Facility Pro may expand catalogue capacity and tools, but a Pro facility with fewer than three sales displays `certified`/`Pro`, never `confirmed`.

If Pro expires, catalogue limits return to Free. The `confirmed` badge remains only when the facility has independently completed three successful sales.

## 11. Account slots, wallet and entitlements

Each account has one free facility slot. Additional facility/company slots require an Omni Wallet purchase or inclusion in a future Seller Workspace entitlement. Slots control how many facilities an account may manage; they do not grant product limits or trust.

Each facility has its own Pro entitlement, catalogue limit, advanced tools, bonus state and trust progression. There is one rechargeable Omni Wallet per account. A server ledger records recharge, slot purchase, facility Pro, advertising, coupon credits and other platform consumption.

The $20 facility bonus is non-withdrawable and becomes spendable only after that facility completes three successful Omni sales. It cannot be created by purchasing Pro.

## 12. Purchase intent and transaction room

```text
comparison
  → intent_review
  → intent_creating
  → transaction_created
  → transaction_room

intent_creating
  → duplicate_intent_reused | intent_error

transaction_room
  → qr_ready
  → contact_unlocked
  → payment_method_selected
  → buyer_payment_declared
  → seller_payment_confirmed
  → fulfilment_pending
  → buyer_received
  → rated
```

Only an eligible comparison response can create an intent. Intent creation is idempotent and snapshots facility, product, price, offer, quantity, response freshness and selected fulfilment context. The transaction room is the single authorized room for timeline, chat, QR and next action.

Contact, itinerary and private seller information unlock only after intent creation. QR generation occurs inside the transaction context. The buyer presents the QR; the seller verifies it through camera or manual fallback. Omni records external cash, mobile money, pay-on-delivery or other configured methods but does not process buyer-seller funds.

## 13. QR, fulfilment and rating

```text
qr_ready
  → camera_permission
  → camera_preview
  → qr_detected
  → qr_verified | qr_expired | qr_replayed | qr_mismatch | manual_code

seller_payment_pending
  → seller_payment_confirmed | seller_rejects_payment

seller_payment_confirmed
  → pickup_ready | delivery_in_progress

pickup_ready | delivery_in_progress
  → fulfilled

fulfilled
  → buyer_received | fulfilment_disputed

buyer_received
  → rated | rating_skipped
```

The camera permission prompt must lead to a visible live preview area. If permission is denied, unavailable or interrupted, manual code entry remains available. Verification is server-authoritative and replay-safe. Seller confirmation, fulfilment, buyer receipt and rating are actor-specific transitions.

## 14. Recovery contract

Every protected state must preserve the exact context required to resume: actor, map viewport, query, filters, selected facility, selected product, availability request, comparison choice, intent ID and transaction ID. Refresh, close, back navigation, duplicate submission, timeout, offline transition, denied permission and expired token each have a defined recovery path.

## 15. Seed gate for Roots

Roots may begin only when the following are represented in data/API contracts: public versus protected access, facility identity and lifecycle, separate account slots and facility Pro, non-purchasable confirmed trust, one-wallet ledger, availability freshness, idempotent intent, QR replay safety, external payment boundaries and resumability.
