# Omni V2 — Canonical Flow Contract

**Version:** 1.0.0

**Status:** Approved baseline for the clean-slate V2 rebuild

**Scope:** Flow, state, authority, screen and proof contract. This document does not itself implement UI, backend or database code.

**Source:** The supplied Omni Catalog — Locked Product, UI and Flow Decisions.

> This is the canonical V2 flow contract. Any later change to product identity, authority, permissions, state transitions, money movement, privacy, or scope must patch this document first. Build prompts, schemas, task lists and UI specifications are derived artifacts and must not silently override it.

## 1. Product identity

Omni is a **global geospatial supply-and-demand search engine** whose primary interface is a live MapLibre globe/map. It is not primarily a marketplace grid, social network, directory, generic chat application or decorative globe.

The core loop is:

`search → discover source-backed facilities → inspect facility and catalogue → verify availability → compare real responses → create purchase intent → use the authorized transaction room and QR → record external payment and fulfilment → confirm receipt → rate → improve discovery data`

The facility is the core supply object. The catalogue bridges a spatial facility and a buyer request. The map remains the scene; sheets and cards are temporary stateful surfaces above it. Every sensitive transition has a named server-authoritative unlock.

### 1.1 Scope levels

| Area | Status | Contract |
| --- | --- | --- |
| Map-first geospatial search | Build now | The map/globe is the primary interface, not a conventional ecommerce grid. |
| Buyer discovery and catalogue-first availability | Build now | Search, facility discovery, catalogue selection, availability and comparison are the first vertical buyer slice. |
| Purchase intent and transaction room | Build now | Intent, QR, authorized room/timeline, external payment declaration, fulfilment, receipt and rating. |
| Facility verification and seller onboarding | Build now | Evidence submission and audited outcomes; a claim click never changes status. |
| Seller map-first workspace | Build now | Facilities, products, requests, scanner, coupons and operational states. |
| One Omni Wallet and FedaPay recharge | Build now | Wallet recharge and platform consumption only; no buyer-seller payment rail or withdrawal. |
| PWA mobile experience | Build now | Responsive web/PWA is the immediate mobile product. Native app is not required for this slice. |
| Public OSM/Overpass coverage | Build-manual | Viewport-bounded server discovery/backfill with observability and operator recovery. |
| Admin evidence review | Build-manual | Human review may complete the operational decision until automated proof exists. |
| AI orchestration | Deferred | Manual actions must be proven before AI orchestration is added. |
| Native mobile app | Deferred | Revisit after the PWA flow is production-verified. |
| Instant world prepopulation | Deferred | Omni must not promise unrestricted global data coverage. |

`Build-manual` means the user-facing capability exists but a human or external process completes a bounded step. Manual procedures must have an owner, evidence, audit record and recovery path.

## 2. Actors and authority

| Actor | May do | May not do |
| --- | --- | --- |
| Visitor | View public map/facilities, search, inspect public facility and catalogue content, request sign-in when a protected action is reached. | Access private contact, itinerary, chat, QR, purchase intent or seller-sensitive data without the required transition. |
| Buyer | Search, select catalogue products, request availability, compare responses, create intent, use the transaction room, declare external payment, confirm receipt and rate. | Change catalogue authority, reserve stock through a check, verify seller QR, confirm seller payment receipt or advance a seller-owned state. |
| Seller | Onboard, submit evidence, manage eligible facilities/products/coupons, answer or correct availability, view authorized requests, verify QR, confirm payment, fulfil and mark delivery/pickup. | Directly certify a facility, fabricate discount/redemption state, exceed real stock, withdraw the Omni Wallet or advance buyer-only states. |
| Admin | Review evidence, produce audited certification outcomes, record reasons and actor, inspect audit history and controlled trust data. | Bypass the evidence review contract through a generic uncontrolled status mutation. |
| Server | Authorize transitions, enforce constraints, issue tokens, snapshot transaction facts, enforce idempotency, audit events and scope entitlements. | Trust client text, client money values, client status claims or unverified QR assertions. |

### 2.1 Source-of-truth rules

| Fact | Authoritative source | Client consequence |
| --- | --- | --- |
| Public location/name/category | Public source or server discovery adapter | May appear on map/card; does not prove supply. |
| Facility status | Audited server mutation | Client can request verification but cannot mutate status. |
| Product identity/price/stock | Facility catalogue and server validation | Catalogue `productId` is preserved; client text is never authority. |
| Availability | Seller/manual/approved auto-response server path | A check does not reserve allocation. |
| Purchase intent | Idempotent buyer server action | Creates one transaction context and authorized unlocks. |
| QR validity | Server token, expiry and replay state | Buyer presents; seller verifies through camera/manual path. |
| Payment | External method and explicit declarations | Omni records state; Omni does not process buyer-seller money in V1. |
| Fulfilment/receipt | Authorized seller and buyer actions | State advances only through the allowed actor/action. |
| Rating | Buyer after receipt/completion | Cannot unlock earlier private data. |
| Wallet balance | Server-confirmed ledger/FedaPay deposit | Spendable only after confirmation; no withdrawal. |
| Analytics | Consent-aware event pipeline | Minimized and pseudonymous; never raw private secrets. |

## 3. Global navigation and surface composition

Omni is a stateful map interface rather than a chain of disconnected pages. The active map canvas remains mounted while dock, result cards, facility detail, catalogue, availability, comparison, intent and transaction sheets open.

The surface hierarchy is:

`MAP → CHROME → DOCK → RESULT CARD/RAIL → FACILITY SHEET → CATALOGUE SHEET → AVAILABILITY SHEET → COMPARISON → TRANSACTION ROOM`

Top-right chrome contains notifications and the hamburger menu only. The menu is a typed action registry; every visible action must resolve to a real route or state. No dead placeholder menu items are allowed. A role switch snapshots supported context and restores it when the destination can represent it.

### 3.1 Shared sheet contract

Every sheet has a typed state and uses one shared Omni primitive:

- Bottom anchored on mobile.
- Bounded floating or centered on desktop.
- Scrollable body with preserved focus and no horizontal overflow.
- Reachable footer action that remains visible or is reachable after scrolling.
- Explicit loading, ready, empty, error, retry, cancellation, close and back behavior.
- Escape, back gesture and close button have defined ownership.
- Opening a sheet does not destroy the map, query, selected facility or saved draft unless the flow explicitly completes or cancels it.

### 3.2 Page ownership

| Route/surface | Owns | Must not own |
| --- | --- | --- |
| `/`, `/carte` | Buyer map, dock, result rail, facility selection, catalogue/availability overlays | Seller operations, generic chat, private contact before intent |
| `/auth` | Sign-in/up and restoration intent | Dropping search/product/transaction context |
| `/onboarding` | Progressive buyer/seller education and required identity/context | Claim/status mutation or unrelated dashboard density |
| `/vendeur` | Seller map-first workspace, facilities, requests, products, scanner, coupons and valid account surfaces | Buyer map discovery or dead placeholder actions |
| `/admin` | Evidence review, audit and controlled outcomes | Direct generic status bypass |
| `/transaction/$id` | Authorized transaction room, timeline, chat and actor action | Public messages or unscoped conversation |
| `/transaction/qr` | QR verification entry and camera/manual fallback | In-app payment or arbitrary QR decoding |

## 4. Map and globe flow

### 4.1 Resting and arrival states

| State | Entry | Visible behavior | Allowed actions | Exit |
| --- | --- | --- | --- | --- |
| `idle_globe` | First load with no active search | Real MapLibre globe, sparse geography, slow left-to-right horizontal rotation; no decorative substitute or flat fallback. | Search, manual pan/zoom, recenter, menu, notifications, optional location permission. | `locating`, `search_input`, `manual_exploration`, `location_exact`, `location_approximate`, `fallback_market`. |
| `locating` | Browser location request or explicit recenter | Non-blocking loading indicator; globe remains usable; no automatic search zoom. | Cancel/retry, continue exploring, enter search. | `location_exact`, `location_approximate`, `fallback_market`, `idle_globe`. |
| `location_exact` | Fresh browser fix with acceptable accuracy | Blue personal marker; neutral accuracy copy; map may offer local context but does not force a search. | Search, recenter, explore, open results. | Search or idle/manual states. |
| `location_approximate` | Network/coarse context or low-confidence browser fix | Neutral approximate marker/context; never described as exact GPS. | Search, retry precise location, explore. | `locating`, search or idle. |
| `fallback_market` | Location denied, unavailable or timed out and product has a fallback context | Fallback market is explicit and reversible; no false blue exact marker. | Search, retry location, change context. | `locating`, search or idle. |

Camera priority is:

`manual interaction > selected facility focus > active search reveal > result framing > idle rotation`

Manual drag, zoom, recenter, keyboard input and search focus pause rotation and cancel active reveal ownership. Search reveal is explicit and cancellable; arrival never silently zooms into an unrelated place.

### 4.2 Map coverage and pins

- The client sends the visible MapLibre bounding box to the server.
- Free/Pro scope, antimeridian handling and OSM backfill are server-authoritative.
- Source-backed facilities only are rendered.
- Global/low zoom uses clusters; local result zoom shows relevant individual pins.
- A selected pin/card opens facility detail and preserves viewport/context.
- Black or near-black boundary highlight is used only when a matching geographic asset exists. No false highlight is created.
- A blue personal marker is rendered only from a fresh browser fix with acceptable accuracy.

### 4.3 Map state machine

```text
idle_globe
  → [explicit search/category/restored-search/retry] → search_reveal
  → [manual pan/zoom] → manual_exploration
  → [location request] → locating

search_reveal
  → [server returns facilities] → results_visible
  → [server returns none] → empty_results
  → [cancel, manual interaction, timeout] → idle_globe or manual_exploration

results_visible
  → [select pin/card] → facility_selected
  → [new search] → search_reveal
  → [close rail] → idle_globe/manual_exploration

facility_selected
  → [close/back] → results_visible
  → [view products] → catalogue_open
  → [verify availability] → availability_open
```

## 5. Buyer discovery and search flow

### 5.1 Buyer dock

The dock contains one search row and one **Options** chevron. Categories, open-now, radius, discounts, sort, quantity, budget, location mode and retries live inside that one surface. Quantity and budget are silent until relevant, editable and budget may be unlimited. Typing never changes the map view. Enter and the search button share one guarded submit path.

Search input represents intent against the existing catalogue. The buyer should not be forced to invent a product name when a catalogue product exists. Fallback text is allowed only when no catalogue product can be selected.

### 5.2 Search state machine

```text
search_input
  → [type] → search_input (map unchanged)
  → [open Options] → options_open
  → [submit by Enter or button] → search_submitting
  → [close/cancel] → prior map state

options_open
  → [edit filters] → options_open
  → [apply] → search_input
  → [dismiss] → search_input

search_submitting
  → [valid query] → search_reveal
  → [missing required context] → search_input with inline correction
  → [unauthenticated protected continuation] → auth_required with full context snapshot
  → [timeout/error] → search_error with retry and preserved inputs
```

### 5.3 Result card and rail

A result card is contextual to the query and shows the matched product first, media when available, facility identity, public trust/status, distance, price/offer, product count and one next action. Clicking selects the facility only. It does not claim, request availability or create intent.

The rail/cards must remain fully visible within the viewport and responsive at 320, 375, 768 and 1280px. Cards do not create an inaccessible horizontal-scroll trap. A closed or selected card can be reopened without losing the result set or map context.

### 5.4 Facility detail

A selected facility opens a public detail surface above the map. It shows facility identity, media, search context, status/trust, address, public hours/open state, matched product and product count.

Actions:

| Facility condition | Allowed actions |
| --- | --- |
| Public/unclaimed | View public content; `Demander une vérification` for an eligible seller. No private contact, itinerary, chat, QR or purchase actions. |
| Certified/unconfirmed | View catalogue and verify availability where the facility/product is eligible. Sensitive contact remains gated by intent. |
| Confirmed | Same buyer flow with trust/status shown; still requires the same authorized purchase transitions. |
| Unavailable/error | Show honest state, retry or return to results; never invent inventory. |

`Voir les produits` opens the catalogue. `Vérifier la disponibilité` is a separate action.

## 6. Catalogue and availability flow

### 6.1 Catalogue sheet

The catalogue loads real active products from the selected facility, places the matched product first and provides explicit selected state. Each product shows name, photo, price, discount/offer state and quantity eligibility.

States are `catalogue_loading`, `catalogue_ready`, `catalogue_empty`, `catalogue_sold_out`, `catalogue_error` and `catalogue_closed`. Empty, sold-out and error states have explicit recovery. Selecting a product returns a typed `ProductSelection` to availability; selection alone does not create a demand.

```text
facility_selected
  → [view products] → catalogue_loading
catalogue_loading
  → [loaded] → catalogue_ready
  → [empty] → catalogue_empty
  → [error] → catalogue_error
catalogue_ready
  → [select product] → product_selected
  → [back] → facility_selected
product_selected
  → [verify availability] → availability_product_stage
```

### 6.2 Availability stages

The availability surface has named stages:

`Produit → Portée → Contraintes → Réponses`

- **Produit:** catalogue product is selected first. Fallback text is allowed only if no catalogue product exists.
- **Portée:** Free manual mode targets one eligible facility. Pro bulk targets bounded visible facilities under server entitlement.
- **Contraintes:** Quantity and private budget remain editable. Budget may be unlimited. Typing or editing constraints does not move the map.
- **Réponses:** Results are real server responses; a check does not reserve stock.

Availability state machine:

```text
availability_product_stage
  → [product selected] → availability_scope_stage
  → [back] → catalogue_ready

availability_scope_stage
  → [scope accepted] → availability_constraints_stage
  → [not entitled to bulk] → availability_scope_error with Free alternative

availability_constraints_stage
  → [submit] → availability_submitting
  → [back] → availability_scope_stage

availability_submitting
  → [responses] → comparison_ready
  → [no responses] → comparison_empty
  → [timeout/error] → availability_error with retry and preserved inputs
```

Responses are ordered `available → partial → unavailable`, then price. Each response shows facility, product, freshness, quantity, price, offer and seller message. The best eligible response may be highlighted. Only eligible responses show the intent CTA. Comparison does not unlock contact.

## 7. Seller verification and facility lifecycle

### 7.1 Verification request

A seller may select a public unclaimed facility or create a new facility. The click creates a **verification request**, never a claim and never a direct status transition.

Evidence may include identity, facility/company information, product or article proof and location/facility proof. Drafts persist and submission is idempotent.

### 7.2 Facility state machine

```text
unclaimed
  → [eligible seller starts request] → verification_requested
verification_requested
  → [save evidence draft] → evidence_draft
  → [cancel] → unclaimed or saved draft

evidence_draft
  → [submit] → evidence_submitted
  → [edit] → evidence_draft

evidence_submitted
  → [admin accepts queue] → admin_review
  → [withdraw before review] → verification_requested

admin_review
  → [approve certified outcome] → certified
  → [approve unconfirmed outcome] → unconfirmed
  → [reject with reason] → rejected

rejected
  → [new evidence/request] → verification_requested or unclaimed, according to audit decision

certified
  → [operational onboarding] → unconfirmed
unconfirmed
  → [three eligible completed sales] → confirmed and unlock eligible $20 platform credit
  → [seller pays for confirmed/Pro path where policy allows] → confirmed, without bypassing required trust rules
confirmed
  → [loss of qualifying operational condition] → confirmed with restricted entitlement or the policy-defined downgrade; never silently grants Pro
```

Only audited server review creates `certified` or `unconfirmed`. A rejected request does not silently become operational. The seller may optionally join an Omni channel after certification; channel membership is not required for status.

The $20 seller bonus is a non-cash Omni platform credit. It is communicated during facility creation/certification as a benefit, but remains locked until the server confirms the qualifying three completed Omni sales. It cannot be withdrawn. A confirmed facility may use it for eligible platform features according to the wallet/credit policy.

### 7.3 Admin review

Admin sees a pending evidence queue, claimant/facility context, evidence stages and audit history. Every review outcome is explicit: `certified`, `unconfirmed` or `rejected`, with reason, actor, timestamp and evidence reference. Generic direct status mutation cannot bypass review authority.

## 8. Seller workspace and catalogue flow

The seller workspace is map-first and facility-first. The map shows seller-owned facilities and operational state. Primary operational surfaces are facility, products/catalogue, received demands, QR scanner, coupons and advertising only when functional. Wallet, subscription and settings are secondary and appear only when their callbacks and permissions are real.

### 8.1 Seller workspace states

```text
seller_entry
  → [authenticated seller] → seller_map_workspace
  → [missing onboarding context] → seller_onboarding
  → [not authorized] → seller_access_error

seller_map_workspace
  → [select owned facility] → facility_operations
  → [open requests] → demand_queue
  → [open products] → product_catalogue
  → [open scanner] → scanner_entry
  → [open wallet/account] → account_surface
```

### 8.2 Product and coupon publication

Product creation is catalogue-oriented and must be as clear as the buyer flow. A published product satisfies the discount constraint and displays an honest offer state: active coupon/offer or `Aucune remise active`. A product may create a coupon in the same guided form, but the client cannot fabricate discount/redemption state. Quantity allocated to Omni cannot exceed real stock.

```text
product_draft
  → [save draft] → product_draft
  → [validate and publish] → product_pending_validation
  → [server accepts] → product_published
  → [server rejects] → product_error with field-level correction
product_published
  → [edit] → product_draft
  → [stock reaches zero] → product_sold_out
```

Coupon state, eligibility, redemption and transaction discount are server snapshots. A seller cannot alter a completed transaction’s coupon outcome from the client.

## 9. Purchase intent and transaction room

### 9.1 Intent gate

Only an eligible comparison response may expose the purchase-intent CTA. The buyer’s action is idempotent. The server creates one transaction context, snapshots product/facility/quantity/price/coupon facts and unlocks the authorized transaction room.

Before intent, the following remain locked: private contact, itinerary, private chat, seller-sensitive transaction details and QR actions. Selecting a result, opening a facility or checking availability never unlocks them.

### 9.2 Intent state machine

```text
comparison_ready
  → [select eligible response] → response_selected
response_selected
  → [want to buy] → intent_submitting
intent_submitting
  → [new transaction context] → transaction_created
  → [duplicate request/idempotency hit] → existing_transaction_resumed
  → [response expired/unavailable] → intent_blocked with refresh/retry
  → [server error] → intent_error with retry and preserved selection
```

### 9.3 Transaction room

The transaction room is the only authorized transaction surface. It is scoped to one demand/offer/transaction and shows product, facility, quantity, gross price, Omni discount/coupon snapshot, net amount, QR reference, next action and event timeline.

The canonical timeline is:

`Intention créée → Offre confirmée → Coupon appliqué (if applicable) → QR généré → Vendeur vérifié → Mode de paiement choisi → Paiement déclaré → Paiement reçu → Fulfilment → Réception confirmée → Avis publié → Transaction terminée`

Buyer and seller see different primary actions according to actor and persisted state. A chat message is allowed only when the participant is authorized for that transaction/demand. System messages are generated from server events; client text cannot advance the transaction.

The room can be closed and resumed from notifications, menu, orders or context snapshots without losing state. A resume bar appears when an incomplete transaction exists and deep-links to the exact transaction context.

## 10. QR, external payment and fulfilment

### 10.1 QR flow

The buyer QR is generated at the approved intent/transaction point. It has an expiry and replay-safe server state. The seller verifies it by camera when permission and `BarcodeDetector` are available, or by manual code fallback.

```text
transaction_created
  → [generate QR] → qr_generated
qr_generated
  → [seller opens scanner] → scanner_ready
  → [expiry] → qr_expired
  → [buyer closes room] → qr_generated resumable

scanner_ready
  → [camera CTA] → camera_requesting
  → [permission granted + live preview] → camera_active
  → [denied] → camera_denied with manual fallback
  → [unsupported/error] → camera_unavailable with manual fallback

camera_active
  → [valid QR decode] → qr_submitting
  → [close/unmount] → scanner_stopped
  → [stream failure] → scanner_error with retry/manual fallback

qr_submitting
  → [valid intended transaction] → seller_verified
  → [duplicate verification] → seller_verified idempotently
  → [expired] → qr_rejected_expired
  → [replayed] → qr_rejected_replay
  → [wrong transaction] → qr_rejected_mismatch
  → [malformed] → qr_rejected_invalid
```

Permission must be requested only from the camera CTA on a secure top-level origin. Preview remains mounted after permission, `video.play()` resolves, dimensions are non-zero and tracks remain live until stop/unmount. BarcodeDetector absence must not hide the preview; manual fallback remains available. Late permission results after close/unmount are ignored and tracks are stopped exactly once.

### 10.2 External payment and fulfilment

Omni does not process buyer-seller payment inside V1. The buyer chooses cash on delivery, TMoney, Flooz or another external method. The buyer declares payment; the seller confirms receipt. Pickup is represented by Omni; delivery is coordinated between buyer and seller.

```text
seller_verified
  → [buyer chooses external method] → payment_method_selected
payment_method_selected
  → [buyer declares payment] → payment_declared
payment_declared
  → [seller confirms receipt] → payment_received
  → [seller rejects/does not confirm] → payment_pending or payment_disputed
payment_received
  → [seller marks delivered/ready] → fulfilment_in_progress
fulfilment_in_progress
  → [seller marks fulfilled] → fulfilment_pending_buyer
fulfilment_pending_buyer
  → [buyer confirms receipt] → receipt_confirmed
receipt_confirmed
  → [buyer rates] → rating_published
rating_published
  → [server closes transaction] → transaction_completed
```

No payout or seller withdrawal is exposed. Every state has visible next action, current actor, timestamp and recovery route.

## 11. Omni Wallet and entitlements

There is one rechargeable **Omni Wallet**. FedaPay is for wallet recharge only. The wallet can fund subscriptions, Pro access, advertising, coupon/ad credit and other platform consumption according to server-confirmed ledger rules. It is not the buyer-seller payment rail, and sellers cannot withdraw from it in V1.

Balance displays distinguish available, pending and platform-restricted credits. No client can display a deposit as spendable before server confirmation.

```text
wallet_view
  → [start recharge] → recharge_pending
recharge_pending
  → [FedaPay confirmed server callback] → wallet_available
  → [failed/cancelled/expired] → recharge_failed with retry
wallet_available
  → [eligible platform spend] → spend_submitting
spend_submitting
  → [server confirms] → wallet_available with ledger event
  → [insufficient/restricted] → spend_blocked with explanation
```

Free/Pro is an entitlement surface, not a trust shortcut. Pro may unlock bulk availability, scope, limits, analytics or automation where explicitly active; it cannot manufacture facility certification. The $20 seller credit is a non-cash platform bonus and is unavailable until the server unlocks it.

## 12. Auth, notifications, resume and PWA

Auth redirects preserve query, category, filters, quantity, budget, location mode, selected facility, selected product, request and return route. Sign-out clears private context. A protected action must explain why an account is needed and return the buyer to the exact prior step after authentication.

Notifications are transactional and deep-link to a valid context: availability, response, intent, QR, payment, fulfilment, certification or account. A notification with a missing/expired context opens a safe recovery screen rather than a dead route.

The web app is the immediate PWA mobile product. It uses dynamic viewport and safe-area spacing, network-first private transaction data and non-disruptive install prompts. Offline discovery context may be cached; real-time availability, wallet, payment, QR and transaction completion require visible connectivity.

## 13. Failure, recovery and duplicate handling

| Failure | Required behavior |
| --- | --- |
| Loading | Preserve map/context; show bounded progress and a cancel or back action. |
| Empty discovery | Explain that no source-backed facilities were found in the current scope; allow retry, scope adjustment or return. Never fabricate pins. |
| Unavailable facility/product | Mark stale/unavailable explicitly; allow refresh or alternate result. |
| Timeout/network loss | Preserve inputs and selected context; show retry; do not duplicate mutations. |
| Permission denied | Explain camera/location consequence and provide manual or fallback path. Never loop permission prompts. |
| Expired QR/response | Block the sensitive action and offer refresh/new authorized request. |
| Replay/duplicate submit | Return the existing authoritative result or an explicit rejection; never create a second transaction/event. |
| Unauthorized route | Preserve safe context, require authentication/role, then restore or explain why restoration is impossible. |
| Server error | Show a human-readable error and retry; do not expose secrets or raw backend traces. |
| Cancellation/back | Close only the current surface; keep map, drafts and incomplete transaction resumable. |
| Offline transaction action | Disable or block with connectivity explanation; never imply completion locally. |

## 14. Authorization matrix

| Action | Visitor | Buyer | Seller | Admin | Server requirement |
| --- | --- | --- | --- | --- | --- |
| Search/public facility view | Yes | Yes | Yes | Yes | Public source-backed data only. |
| View public catalogue | Yes | Yes | Yes | Yes | Active public product. |
| Request availability | No/ask auth if required | Yes | No as buyer | No as buyer | Entitlement and product/facility eligibility. |
| Create purchase intent | No | Yes | No as buyer | No as buyer | Eligible response, idempotency key, snapshot. |
| View private contact/itinerary | No | After intent | Authorized seller side | Controlled audit | Transaction authorization. |
| Send transaction message | No | Authorized transaction participant | Authorized transaction participant | Audit/support context only | Participant and transaction scope. |
| Start verification request | No | If seller role/context | Yes | Yes for review | Draft/request ownership. |
| Change facility status | No | No | No | Controlled review only | Audited review mutation. |
| Publish product/coupon | No | No | Eligible facility owner | Controlled support | Stock, discount and facility rules. |
| Verify QR | No | No | Authorized seller | Controlled support | Token, expiry, replay, transaction match. |
| Declare external payment | No | Authorized buyer | No as buyer | No as buyer | Transaction state and actor. |
| Confirm payment/fulfilment | No | Confirm receipt only | Confirm payment and fulfilment | Controlled support | Actor/state transition. |
| Recharge Omni Wallet | No/ask auth | Yes | Yes | Yes | FedaPay server callback. |
| Withdraw wallet | No | No | No | No in V1 | Not supported. |

## 15. Analytics and privacy

Analytics are consent-aware and minimized. Omni may collect pseudonymous events for search, facility/product open, availability, chat/intent, QR, payment, fulfilment, rating, coupon and wallet actions at appropriate geographic precision.

Raw GPS, private chat contents, QR tokens, payment secrets, credentials and full evidence documents are not generic analytics payloads. Event payloads use stable pseudonymous identifiers, coarse location where possible, event type, timestamp, safe context identifiers and consent state. Sensitive operational audit records remain access-controlled and separate from product analytics.

## 16. Responsive and accessibility contract

The flow must be tested at 320, 375, 768 and 1280px widths. At every width:

- The map remains visible and is not pushed out of the viewport by safe-area padding.
- Search focus does not trigger an unwanted mobile zoom or map camera movement.
- Cards and sheets do not overflow horizontally.
- Footer actions remain reachable above the keyboard and safe-area inset.
- Menu, notifications, recenter and close controls do not overlap.
- All actions are keyboard reachable with visible focus.
- Motion pauses for manual interaction and respects `prefers-reduced-motion`.
- The same state names and next actions are used across buyer and seller surfaces.

## 17. Proof catalog and acceptance criteria

| Proof class | Can prove | Cannot prove |
| --- | --- | --- |
| Unit tests | Pure state, ordering, idempotency helper and boundary logic | Real MapLibre paint, camera, GPS, permission or production data. |
| Type/build/client boundary | Compile/build and trust-boundary hygiene | Authenticated behavior or real device UX. |
| Public smoke | Route availability and status codes | Buyer/seller transaction authorization. |
| Authenticated browser | Real route/session click-through and context restore | Physical camera optics unless camera-capable. |
| Real mobile/camera | Permission, preview, QR decode and replay | Production database outcome unless connected to a safe fixture. |
| Production E2E | Real transaction loop and audit records | Deferred scope. |

### 17.1 V2 first-slice acceptance

The first implementation slice is complete only when a visitor can:

1. Enter a real MapLibre globe with slow horizontal idle rotation.
2. Search without the map changing while typing.
3. Submit with Enter or the search button through the same guarded path.
4. See source-backed results scoped to the visible map.
5. Select a facility without accidentally claiming it, creating a demand or opening private data.
6. Open the catalogue, select a real product and move through the named availability stages.
7. Receive an explicit result, empty or retry state without fabricated availability.
8. Create an idempotent purchase intent only from an eligible response.
9. Resume the resulting transaction room after closing it.

The transaction slice is complete only when QR expiry/replay/mismatch, external payment declaration, seller confirmation, fulfilment, receipt, rating and terminal completion are all represented with actor-specific actions and server-authoritative events.

The verification slice is complete only when a claim/creation request produces evidence states, admin review produces an audited outcome, and no client action can bypass the review.

The wallet slice is complete only when a confirmed FedaPay recharge becomes spendable in the single Omni Wallet ledger, pending/failed/available states are visible, no buyer-seller payment is implied, and withdrawal is absent.

## 18. Implementation boundaries

The UI must not import server-only modules, secrets, database drivers or platform-only APIs directly or transitively. Screen data must pass through typed interfaces and realistic mock adapters until real server adapters exist. Durable rules prefer this enforcement order:

`database constraint → server-side check → UI feedback`

Every critical mutation requires an idempotency strategy, audit event and explicit failure response. Client text, displayed amounts, displayed status, QR contents and availability claims are never accepted as authority.

## 19. Decision ledger

The following items are intentionally not invented by this contract and must be decided in a later master patch before they affect implementation:

| Decision | Current status | Required before |
| --- | --- | --- |
| Exact Free/Pro city, radius and bulk limits | Open | Availability scope implementation. |
| Exact evidence document types and retention periods | Open | Verification schema and admin UI. |
| Exact qualifying definition of the three completed sales | Open | Confirmed status and $20 credit enforcement. |
| Exact wallet ledger bucket names and spending priority | Open | Wallet schema and recharge/spend implementation. |
| Exact coupon eligibility formula and stacking policy | Open | Product/coupon and transaction snapshot implementation. |
| Exact FedaPay callback contract and reconciliation schedule | Open | Wallet production integration. |
| Exact delivery/pickup method metadata | Open | Fulfilment UI and seller operations. |
| Exact notification retention/read policy | Open | Notification persistence and resume. |
| Exact OSM provider quotas and operator runbook | Open/manual | Global coverage operations. |

These items must not be resolved ad hoc inside UI code or a generated build prompt. Once decided, patch this document first and regenerate the affected artifacts.

## 20. Explicit non-goals

Omni does not become a generic social chat, a seller withdrawal/payment processor, a marketing landing page, an unrestricted global data dump, a decorative globe, a generic ecommerce cart checkout, an AI chatbot before manual proof, or a page full of disabled promises. Any such feature requires a master patch and its own bounded one-shot package.
