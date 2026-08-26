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
  → local_map
  → search_input
  → public_facility

local_map
  → cluster_selected
  → public_facility
  → search_input
  → idle_globe

cluster_selected
  → local_map
  → public_facility

facility_selected
  → facility_detail
  → local_map

transaction_intent_confirmed
  → route_visible
  → transaction_room

route_visible
  → transaction_room
  → facility_detail
  → prior_safe_state

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

Map presentation has four explicit modes. `idle_globe` is the resting, slowly rotating global context with sparse source-backed pins or clusters. `local_map` is the fullscreen geographic context after explicit location, manual exploration or a search reveal; it keeps the same top controls and bottom dock but may show more source-backed facilities. `facility_focus` highlights one selected facility while preserving the prior camera and result context. `route_visible` displays an honest route/itinerary only after a server-confirmed purchase intent unlocks the permitted seller location; it is not available from a public pin or facility card.

Pin and cluster semantics are separate from supply truth. A cluster communicates multiple source-backed facilities at the current zoom and expands or zooms into its members. A public facility pin communicates geographic presence only. Unclaimed facilities use a neutral source marker; certified/unconfirmed facilities may carry an explicit trust status; confirmed facilities may carry the approved confirmed status. None of these markers may imply stock, price, availability or seller permission. Selected pins use a restrained highlight and a visible label, then return to the prior map state when detail closes.

The map itself is always full-screen and dominant. Sheets and transaction surfaces are overlays with reserved safe areas, not replacements for the map. Globe-to-local transitions must be explicit or caused by a permitted search reveal, must preserve the previous context for Back/Escape/close, and must never silently jump to a precise personal location without user permission.

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

Closing detail restores the prior result context. Back, Escape and sheet close never silently erase the query, viewport or selection. Back from local map returns to the prior camera mode; Back from a selected pin restores local map; Back from route returns to the transaction room without revoking intent; Back from transaction returns to the account-owned resume context. Every restoration records query, filters, camera center/zoom, selected facility, selected product, availability request and transaction/intent IDs where they exist.

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

## 16. 2026-08-26 — Confirmed post-intent handoff amendment

The owner confirmed that the post-intent experience must be a real two-sided operational handoff, not only a payment-state demo. The following behavior is now the product direction for the next Species/Root reconciliation:

```text
eligible response
→ buyer creates intent
→ transaction and immutable snapshot created
→ buyer sees transaction room
→ buyer sees scoped chat, itinerary and Seller contact
→ Seller receives an in-app intent notification (and Push only when configured/consented)
→ Seller opens the notification or a safe transaction link
→ both actors enter the same transaction-scoped room with role-specific actions
→ Buyer presents a transaction-bound QR
→ Seller opens Scan QR, grants camera permission, scans Buyer QR
→ server verifies transaction/member/expiry/replay and routes Seller to the correct transaction
→ buyer may declare the configured external payment method
→ seller acknowledges or rejects according to the state contract
→ seller fulfils; buyer confirms receipt; rating closes the journey
```

### Post-intent privacy and surface ownership

Before intent, the public facility and comparison surfaces must not expose Seller contact, itinerary, private chat or a handoff QR. After `transaction_created`, the Buyer and Seller transaction members may access the transaction room. The Buyer sees the Seller’s approved contact and itinerary context; the Seller sees only the Buyer information needed for the authorized handoff and the role-specific transaction actions. Chat is scoped to that transaction and cannot advance state by itself.

The Seller notification is a resumable entry point, not a second transaction. If the Seller does not see the notification, the Buyer may share a safe Omni transaction link or present the Buyer QR through an approved fallback. A shared link must never carry a raw token or bypass authentication; after sign-in it resolves only to a server-authorized transaction room. The manual or camera QR path must also resolve to the correct transaction without allowing a client-selected transaction ID to authorize access.

### QR ownership correction

The current deployed implementation issues the QR from the Seller workspace and accepts a pasted payload. That is inconsistent with this confirmed product direction. The Root change must move QR issuance/display to the Buyer transaction room after intent creation, while preserving server-issued, expiring and replay-safe tokens. The Seller’s primary handoff action becomes `Scanner le QR`, with explicit camera permission, live preview, QR detection, verification result, manual fallback and recovery for expired, replayed or mismatched codes. The Seller remains the actor that verifies the Buyer QR at handoff.

### Omni discount and payment boundary

Omni discounts belong to the **offer/transaction snapshot**, not to an untrusted client claim. The Buyer must see the base price, discount rule, discount amount and final payable amount before creating intent. The Seller response may propose an eligible offer, but the server validates the rule and snapshots the resulting commercial values at intent creation. V1 still does not route buyer money to the Seller: the Buyer may pay the Seller externally or use a future Omni platform charge only for approved Omni Wallet/plan purchases. A discounted external handoff does not create a Seller payout or settlement record.

This amendment does not authorize payment-provider integration, Wallet recharge, coupon issuance or a discount engine by itself. Those require the commercial Root contract, provider configuration, webhook signature verification, idempotent reconciliation, refund/reversal handling and owner-approved prices before implementation.

## 17. 2026-08-26 — Bulk Availability and global Wallet clarification

### Search versus availability

The Buyer does not pay for ordinary search or for the ordinary single-facility availability check. Search remains free for every Omni user. The product must not force a Buyer who searched `banane` to open ten facilities and repeat the same form ten times. After a search returns eligible facilities, the Buyer may select a **Bulk Availability** action, set quantity and other constraints once, and ask the eligible facilities in one operation.

Budget may filter the Buyer’s discovery results and shape the Buyer’s own comparison request, but the Seller response surface receives the quantity and the relevant product/request context, not the Buyer’s private maximum budget unless a later approved policy explicitly says otherwise. Sellers answer only `available`, `partial` or `unavailable`, with any valid quantity and offer information allowed by the response contract.

```text
free search
→ eligible multi-facility results
→ bulk constraints (quantity, location/scope, optional budget/filter context)
→ cost preview
→ credit authorization
→ one bulk availability job
→ per-facility responses
→ comparison
```

### Credit model

Bulk is measured in **availability credits**, not a simple number of requests. The server estimates a cost from the targeted facility count and approved constraint/processing weight, persists that `credit_cost` before execution and consumes the allowance atomically. A Free account receives three included Bulk Availability operations per billing period, subject to the published cost/eligibility guardrail. A Pro account receives an included monthly credit allowance measured in units, not a fixed number of requests; heavier searches consume more units. Additional Bulk credits may be purchased from the Omni Wallet after the commercial price and unit schedule are approved. A cost preview must be visible before confirmation, and insufficient-credit recovery must preserve the query and constraints.

The exact estimator, Free guardrail, Pro monthly allowance, overage unit price and period are Root decisions. The historical main-branch schema already records `credit_cost`, including a later compatibility rule allowing zero for manual/single-facility checks or approved Pro bulk paths, but these migrations are not part of the active V2 branch and must not be treated as deployed capability.[1]

### Global Wallet and local currency

The Omni Wallet is one logical account-level Wallet with internal ledger buckets for money and platform credits; the user does not manage disconnected wallets. The display and recharge currency is selected from the confirmed location context when possible: XOF for Togo/Benin and other configured CFA coverage, GHS for Ghana, EUR for France, and a safe fallback when location is unavailable. A currency conversion, supported-country and refund policy must be explicit before multi-currency recharge is enabled; Omni must never silently convert a balance.

Subscriptions, Facility Slots and Bulk credit overages consume the appropriate internal allocation from the same Wallet. Auto-renewal is an explicit opt-in: at expiry, the server checks whether the Wallet has the exact amount in the subscription currency, consumes it idempotently and extends the entitlement. If funds are insufficient, the entitlement expires cleanly and the user receives a notice; no card is charged, no negative balance is created and no partial renewal is shown as successful.

The Wallet is not Seller earnings. V1 has no Buyer-to-Seller settlement, Seller payout or withdrawal. FedaPay recharge is a platform funding boundary only. The reusable implementation found on `origin/main` is a legacy/vendor-scoped XOF deposit flow; it demonstrates hosted checkout, provider transaction lookup, signed webhook verification and idempotent crediting, but it is not wired into the current V2 account Wallet and requires a Root adaptation before reuse.[2]

### Future agent boundary

A future Omni agent may automate the same search, Bulk Availability and comparison operations that a Buyer can perform manually. It may consume the same Bulk/AI credit budgets and may recommend the closest, cheapest or otherwise user-selected option, but it may not invent a new authority, bypass availability limits, expose private contact before intent or alter a transaction state without the existing server contract.

## References

[1]: ./db/migrations/030_demand_credit_cost_allow_zero.sql "Historical Bulk Availability credit compatibility migration"
[2]: ./src/lib/fedapay.server.ts on origin/main "Historical FedaPay checkout, reconciliation and signed-webhook implementation"

## 18. 2026-08-26 — Seller-distributed facility QR and on-site offer handoff

A Seller who wants to be presented as an active Omni offer partner must do more than receive availability requests. The Seller must maintain an Omni-readable catalogue and publish at least one active product/service offer or reduction. Omni generates a stable facility QR or link automatically; the Seller may expose it physically or share it socially, but distribution is voluntary. This QR is an acquisition and catalogue entry point, not a transaction credential.

The public facility QR supports both first-time and returning users:

```text
public facility QR/link
→ install or open Omni
→ preserve facilityId + campaign/source + optional product context
→ public facility/catalogue context
→ select product + quantity
→ validate active offer server-side
→ create onsite_offer intent
→ issue Buyer transaction QR
→ Seller scans at counter
→ Seller validates/accepts advantage
→ Buyer pays Seller externally
→ Seller confirms receipt/fulfilment in Omni
```

The facility QR may be printed at the entrance, counter or next to products when the Seller chooses to distribute it. It contains only a public facility reference and optional campaign/source metadata. When distributed, its source may attribute visits, offer activations, verified transactions and eligible reviews to the Seller’s channel. It must not contain a session, raw transaction token or private contact. If the user has not installed Omni, the destination may offer PWA installation or web continuation and must restore the facility context after authentication. If the user already has Omni, the link opens the facility directly instead of forcing global search.

This on-site intent is distinct from `availability_request`: the Buyer is already facing the facility and is not asking remote Sellers whether the product exists. Omni validates the listed product, declared quantity, price, currency, active offer, reduction rule, limits and expiry, then creates an immutable offer snapshot. If the offer includes a coupon, the coupon is selected/issued server-side for the authenticated Buyer account, with its eligibility, consumption state and transaction binding recorded. The transaction QR carries only a server-verifiable reference to that transaction/coupon binding; it must never expose a reusable coupon secret or rely on client-supplied price/discount fields. If the product is not listed or the offer is unavailable, no transaction QR is created; the user may return to global discovery.

At the counter, the Buyer may describe the action as paying with Omni, but V1 semantics are narrower: Omni validates and records the eligible offer and transaction; the Seller accepts the external payment method and receives the money outside Omni. The Seller’s scan proves QR/offer validity, not payment receipt. `external_payment_declared` and `seller_payment_acknowledged` remain separate events from `qr_verified` and `fulfilment_completed`.

The Seller Scanner is the operational entry point and must route a successful verification directly to the correct transaction room. Verification resolves the server-side Buyer, facility, product, coupon/offer snapshot, amount and timestamps; it must not trust a QR payload as the source of truth. A Seller who missed the Inbox/Push event can reach the same transaction through Scanner or a secure authenticated deep link. Chat helps clarify the product or offer after intent; it does not prove payment and cannot advance fulfilment without the authorized Seller action.

The two QR classes must remain separate:

| QR class | Owner | Reader | Authority |
|---|---|---|---|
| Facility QR | Seller/Omni | Buyer | Public facility/catalogue entry; no private access |
| Buyer transaction QR | Omni after account-bound offer/coupon binding | Seller | Expiring reference to the transaction/coupon binding; replay-safe verification; no raw coupon or private data |

A facility without an active offer may remain publicly listed only as a clearly labelled non-offer facility. It must not be advertised as an active Omni discount partner, and its automatically generated QR must not promise a discount that the catalogue cannot fulfil. After an eligible fulfilment, the Buyer enters the review step; a review is tied to that transaction and cannot be created from a scan or abandoned intent alone. The QR is therefore an optional growth channel, while verified transactions and reviews build the Seller’s credibility.
