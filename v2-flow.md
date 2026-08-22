# Omni V2 — Flow and State Contract

**Document ID:** `OMNI-V2-FLOW-001`
**Status:** Authoritative flow contract for implementation
**Method:** Nature Way — phases Seed → Species → Root System
**Parent:** [`v2-seed.md`](./v2-seed.md)
**Species:** [`v2-species.md`](./v2-species.md)
**Root System:** [`v2-roots.md`](./v2-roots.md)

> Every meaningful Omni behavior is a state transition owned by an actor and enforced by the server. A screen may present a state; it may not invent one.

## 1. Product flow identity

Omni is a map-first geospatial supply-and-demand search engine. The map is the permanent scene. Sheets, cards, rails, dock, menus and the transaction room are contextual surfaces above it, not disconnected page replacements.

The full core journey is:

```text
arrive
→ understand map
→ search a need
→ discover source-backed facilities
→ inspect facility
→ inspect/select catalogue offer
→ request availability
→ compare responses
→ create purchase intent
→ access authorized transaction room
→ QR and/or external payment declaration
→ seller confirmation and fulfilment
→ buyer receipt confirmation
→ rating
```

## 2. Actor authority

| Actor | May do | May not do |
|---|---|---|
| Visitor | Explore map, public pins, public facility and public catalogue information | Protected search, availability, private contact, itinerary, chat, intent or QR |
| Buyer | Search, filter, select offers, request availability, compare, create intent, use own transaction room, declare external payment, confirm receipt and rate | Mutate catalogue, confirm seller payment, verify seller QR or advance seller-owned states |
| Seller | Manage authorized facilities, submit evidence, manage catalogue/coupons, answer requests, verify QR, confirm payment and fulfil | Self-certify, fabricate trust/status/discount, exceed stock or withdraw wallet funds |
| Admin | Review evidence and issue audited outcomes | Bypass evidence with an unreasoned generic status mutation |
| Operator | Run bounded discovery/import/recovery and inspect health | Mutate business state outside an owned operational procedure |
| Server | Authorize, validate, snapshot, issue tokens, ledger money and audit transitions | Trust client status, price, stock, identity, QR or money claims |

## 3. Global surface rules

The map remains mounted through all map-first buyer and seller flows. Use one shared contextual sheet contract:

- bottom anchored on mobile;
- bounded floating surface on desktop;
- scrollable body with reachable primary footer;
- explicit loading, ready, empty, error, retry, cancel, locked and success states where applicable;
- defined back, Escape, close and gesture ownership;
- preserved unfinished context unless the user explicitly cancels or completes it.

The top chrome contains the compact J5/account icon as the sole account and navigation owner, plus only real contextual actions. Omni does not add a separate hamburger menu. Pressing the J5 icon opens the account/navigation sheet, whose contents vary by visitor/authenticated state and authorized role. The search dock contains one search input and one Options disclosure. Every visible action resolves to a typed state and operation or is clearly labelled manual/unavailable.

## 4. Visitor and authentication flow

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

A visitor can understand and explore public context without an account. The first protected database search, availability request or private action opens an explicit Auth explanation and preserves query, filters, viewport, selected facility and selected product where applicable.

## 5. Map and location flow

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

The resting map is a real globe/map with slow idle rotation. Camera ownership priority is:

```text
manual interaction > selected facility > active search reveal > result framing > idle rotation
```

Pan, zoom, keyboard focus, search reveal, location and selected-facility focus pause or override rotation. Reduced motion disables continuous rotation. A personal marker appears only for a fresh acceptable browser position; approximate context is never labelled exact.

Visible bounds are sent through an abortable server request. The adapter handles antimeridian crossing, source status, deduplication, timeout and bounded fallback. Public pins represent source-backed facilities, not current inventory.

## 6. Search flow

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

The search dock has one input row and one Options disclosure. Options may include category, open-now, distance/radius, discount, sort, location mode, quantity and budget. Typing never changes the camera. Enter and the visible search action use the same guarded submission path.

The buyer selects an existing catalogue product when one exists. Free text is a fallback when no matching catalogue identity is available; it is not the preferred path. Search scope, eligibility and tracking requirements are enforced server-side.

## 7. Result and facility flow

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

A result card shows matched product/service first where applicable, media, facility identity, source/trust status, distance, price/offer, product count and one next action. Selecting a card selects a facility only. It never claims, certifies, checks availability, reserves stock or creates intent.

Public facility detail shows public identity, media, source/status, location/address, public hours, matched offer and product count. Contact details, itinerary and private seller information remain hidden until the authorized intent transition.

Closing detail restores the prior result context. Back, Escape and sheet close never silently erase the query, viewport or selection.

## 8. Catalogue and product selection

```text
catalogue_loading
  → catalogue_ready | catalogue_empty | catalogue_sold_out | catalogue_closed | catalogue_error

catalogue_ready
  → product_selected | facility_detail

product_selected
  → availability_scope
```

The catalogue is scoped to the selected facility. The matched offer appears first. Each offer shows stable identity, authoritative media or neutral placeholder, price, offer/discount state, quantity eligibility and freshness where relevant.

Product selection is a typed UI/domain state. It does not create a demand, reserve inventory, unlock contact or create a transaction. A facility’s catalogue limit and publication state are evaluated by the server.

## 9. Availability and comparison flow

```text
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

The buyer provides product, eligible scope, requested quantity, budget/range, location/context and urgency as applicable. Free and Pro scope rules are server-authoritative. Availability does not reserve inventory.

Responses are explicit and timestamped:

```text
available | partial | unavailable | stale | expired | corrected | no_response | error
```

Comparison makes facility, distance, freshness, price/offer, quantity, status and seller message legible. Only an eligible, non-expired response can expose the intent action.

## 10. Facility verification and trust flow

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

A claim click creates or resumes a verification request and does not change facility status. Evidence covers claimant identity, company/facility association, product/service activity and location/facility proof according to the approved evidence taxonomy.

Admin review must record actor, reason, evidence reference, prior state and timestamp. Certification creates `certified`/`unconfirmed`; it never directly creates `confirmed`. An unconfirmed Free facility may publish at most five offers.

Three qualifying successful Omni sales create `confirmed` exactly once. Pro expands facility capacity/tools but cannot create, purchase or preserve the trust badge. Rejection supports a reasoned resubmission path. Optional post-certification channel invitation never becomes a certification condition.

## 11. Account capacity, Pro and Wallet flow

```text
account_created
  → free_slot_available
  → facility_created
  → slot_exhausted
  → buy_additional_slot | workspace_entitled
```

There is one free Facility Slot per account. Additional slots require confirmed Omni Wallet spend or an explicit workspace entitlement. Slots control account capacity, not trust or product limits.

```text
facility_free
  → pro_checkout
  → pro_pending
  → pro_active | pro_failed | pro_expired
```

Facility Pro is scoped to one facility and may expand its catalogue and tools. Pro never changes trust state. On expiry, Free catalogue limits return; independently earned `confirmed` may remain.

```text
wallet_idle
  → recharge_pending
  → recharge_confirmed | recharge_failed | recharge_cancelled | recharge_expired

recharge_confirmed
  → platform_spend
  → spend_confirmed | spend_rejected | spend_reversed
```

The account has one rechargeable Omni Wallet. Its append-only ledger records confirmed recharge and platform consumption such as Facility Slots, Pro, advertising and coupon credits. The $20 facility bonus is a separate facility-scoped non-withdrawable platform credit, locked until three qualifying sales.

Omni V1 has no buyer-seller in-app payment, seller payout or withdrawal transition.

## 12. Purchase intent and transaction room flow

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

Only an eligible comparison response can create an intent. Intent creation accepts an idempotency key and creates one immutable snapshot of facility, product, quantity, price, offer/coupon, response freshness and fulfilment context.

The transaction room owns the single canonical timeline, scoped chat, QR context and actor-specific next action. Contact, itinerary, private seller data and transaction chat unlock only after intent creation. Messages cannot advance the state machine.

The room is resumable through the J5 account/navigation sheet, notifications, saved context or direct transaction entry. Missing, expired, unavailable and unauthorized context leads to a safe recovery state.

After `transaction_created`, the buyer’s transaction sheet becomes the single owner of the post-intent surface. It exposes the transaction summary, seller contact details and itinerary only after the intent exists. Before intent, comparison and intent-review surfaces show the contact and itinerary actions as locked with an explicit explanation. After intent, the buyer may leave and return through the J5 account/navigation sheet without losing the transaction context. No contact or itinerary action is available from a public facility card.

## 13. QR and external handoff flow

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

The buyer QR is transaction-bound, server-issued, expiring and replay-safe. The seller scanner opens in a scanner-ready state before requesting camera permission. Permission is requested only after an explicit action on a secure top-level origin. A visible live preview must remain mounted after permission; manual code entry is always available for denied, unsupported, malformed or failed camera paths.

Omni records external cash, mobile-money, pay-on-delivery or other configured payment declarations. A buyer declaration is not seller confirmation. The seller may confirm, reject or dispute according to the state. Fulfilment, buyer receipt and rating are actor-specific transitions.

## 14. Recovery contract

Every protected state persists enough context to resume: actor, map viewport, query, filters, selected facility, selected product, availability request, comparison choice, intent ID and transaction ID.

| Failure | Required recovery |
|---|---|
| Auth cancellation/error | Return to the triggering public or draft state with context preserved |
| Search timeout/server error | Preserve input/options; allow retry or return to map |
| Empty result | Explain scope and allow retry, adjustment or return; never fabricate data |
| Catalogue unavailable | Preserve facility context and show retry/return |
| Stale availability | Show freshness and return to constraints or request a refresh |
| Duplicate mutation | Return the original authoritative result |
| Location denied/timeout | Preserve manual exploration and provide retry/fallback |
| Camera denied/unavailable | Preserve transaction and provide manual code path |
| QR expired/replayed/mismatch | Show exact reason and safe regeneration/manual path |
| Failed recharge | Do not create spendable funds; show retry/support state |
| Expired notification/context | Route to a safe surface without exposing private data |
| Offline mutation | Block or explicitly queue only when the contract supports it; never show false completion |
| Back/close/refresh | Restore the last safe state unless explicitly cancelled |

## 15. Flow gate

The flow is ready for the Trunk when:

1. each core journey has explicit states, actors, authorities and terminal outcomes;
2. every meaningful fork covers success, empty, timeout, error, cancellation, duplicate, expiry and unauthorized behavior where applicable;
3. state-to-screen ownership matches the Species blueprint;
4. the server-authoritative data source for every sensitive fact is named;
5. protected transitions preserve context and public/private boundaries;
6. no card, pin, menu item or CTA implies a transition it cannot perform;
7. the first vertical slice has a testable state path from map arrival to availability comparison.
