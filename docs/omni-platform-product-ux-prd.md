# Omni Platform Product & UI/UX PRD

**Status:** Draft implementation baseline

**Scope:** Complete Omni product experience for buyers, sellers, facility owners, administrators, and unauthenticated visitors.

**Primary platform constraint:** Omni is a map-first spatial operating system built on the real MapLibre map/globe. It is not a marketing landing page, a generic marketplace, a directory, or a general-purpose chatbot.

## 1. Product definition

Omni makes the world’s supply and demand searchable and actionable. The core relationship is:

> **World → Facilities → Products, services, and content → Search → Demand → Availability → Transaction → Fulfilment → Data → Better discovery.**

The map is the primary interface. Search is the primary discovery mechanism. A facility is the fundamental supply object. Products, services, offers, inventory, content, media, and transactions are associated with facilities and, where appropriate, a company-level catalogue. AI is an optional orchestration layer over manual product actions; every Agent capability must have a corresponding manual action.

The foundational user journey is:

`Open map → Search → Discover → Select facility/product → Check availability → Compare → Create purchase intent → QR → Seller verifies → Buyer confirms payment → Fulfilment → Buyer confirms receipt → Completed.`

## 2. Goals and non-goals

### Goals

Omni must make global supply discoverable through a living MapLibre globe and progressively localized map. It must support text and structured search, authenticated query restoration, OSM-discovered unclaimed facilities, claimed seller facilities, manual and bulk availability, a traceable purchase-intent transaction flow, buyer and seller onboarding, Free/Pro plan boundaries, seller catalogue and inventory operations, a platform wallet for deposits and paid Omni capabilities, and deep-linked operational notifications.

The experience must remain one stateful interface. Panels and sheets are layers above the map, not disconnected product pages. Buyer and seller surfaces must use the same facility identity, trust status, product data, and visual language.

### Non-goals for the initial full-platform release

Omni will not provide seller withdrawals or in-app seller payouts in this release. Seller wallet funds represent platform balance for deposits, subscriptions, credits, advertising, and paid Omni operations; payout accounting can be modelled for traceability but must not expose a withdrawal action.

Omni will not visually render cluster bubbles in the buyer map as a primary experience. The backend may cluster or viewport-limit candidates for performance, but the accepted visual result remains individual facility pins/cards when the result set is manageable.

Media remains schema-ready but UI-disabled by default. Media ingestion, image search, video search, and social content surfaces are deferred behind `mediaUiEnabled`.

AI Agent features are not required for the first manual-flow release. They are Pro/feature-flagged, disabled by default in production until manual parity, safety controls, and observability are complete.

## 3. Personas and permissions

| Persona                 | Primary needs                                                        | Can do                                                                                                                                                         | Cannot do                                                                                 |
| ----------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Unauthenticated visitor | Understand the world is searchable; explore map; formulate a query   | Open globe, rotate/zoom map, enter a query, begin onboarding                                                                                                   | Execute first backend search or access protected transaction data before authentication   |
| Buyer Free              | Discover nearby/global supply and complete limited operational flows | Search, view facilities, use manual availability, perform up to 3 bulk availability operations per month, create purchase intent, QR, transaction confirmation | Use Agent mode or Pro-only automation/recommendation                                      |
| Buyer Pro               | Research and execute complex purchases                               | Everything in Free plus expanded availability, Agent mode, recommendation, saved monitoring, higher credits according to configuration                         | Override seller permissions or confirm seller-side payment on the seller’s behalf         |
| Seller Free             | Establish one trusted facility and basic catalogue                   | One owned facility, up to five products, manual availability responses, basic promotions, wallet deposits, basic transaction operations                        | Create a second facility, exceed five products, bulk-import, or use gated automation      |
| Seller Pro              | Operate multiple facilities and a larger business catalogue          | Company catalogue, facility overrides, expanded products, bulk import, analytics, advanced promotions, ad credit, Agent when enabled                           | Withdraw seller funds in the initial release; bypass ownership, plan, or allocation rules |
| Facility claimant       | Take control of an OSM or public facility                            | Submit a claim, provide verification information, edit only after ownership state permits                                                                      | Purchase through an unclaimed facility or overwrite verified data without authorization   |
| Platform admin          | Trust, safety, configuration, and operations                         | Review claims, certify facilities, configure plans/flags, moderate imports, inspect audit trails, enable/disable AI                                            | Mutate business data without an audit record                                              |

## 4. Global information architecture

### Buyer navigation

The buyer’s map chrome contains only **Notifications** and **Menu** at the top right. The persistent bottom search dock is the primary navigation surface. The buyer menu contains Profile, Plan, Balance/Credits, Searches, Availability, Transactions, Notifications, Settings, Help, and Logout. These are contextual sheets or focused panels that preserve the map beneath them.

### Seller navigation

The seller route is map-first and operational. The active facility is the anchor. The seller menu or contextual workspace exposes Overview, Facilities, Catalogue, Inventory, Requests, Orders, Transactions, Content, Offers, Coupons, Analytics, Advertising, Wallet, Subscription, Agent, and Settings. The initial implementation may group related sections into panels, but each visible entry must either work or clearly state that it is disabled by plan/feature flag; placeholder tabs must not imply completion.

### Admin navigation

Admin surfaces are not part of the buyer map. They provide facility certification, claim review, OSM import monitoring, plan/configuration management, AI kill switch, audit/event review, and operational health. Admin actions must be authenticated, role-gated, auditable, and separate from seller ownership.

## 5. Map-first experience

### 5.1 Opening state

On opening Omni, the user sees the real MapLibre globe or a sufficiently zoomed-out MapLibre map with a warm white or cream spatial field surrounding a grey/black water and white-land globe, plus a sparse layer of real, source-backed facility discovery points. The globe is already in a slow horizontal rotation. The rotation must move the visible earth left-to-right or right-to-left around its vertical axis, as a standing person would perceive a physical globe spinning; it must not roll or turn like a clock through camera bearing. No SVG globe, CSS globe, canvas illustration, or decorative replacement is acceptable.

The map remains visually quieter than the UI while still communicating that Omni represents living global supply. At rest it shows geography plus a sparse, performance-bounded set of real claimed and unclaimed facility discovery points; it must not be a naked map and must not use fake markers. Country and city names are suppressed at default globe scale unless they are needed for a deliberate search reveal. The exact user-position pin is visible whenever the browser provides a real position; a market fallback must never be presented as the user’s location or create a substitute pin. The map prioritizes geography, facilities, search results, and availability state. The Omni orange eye-in-location-pin logo may appear in onboarding or controlled brand moments, but no permanent top-left brand mark appears in the minimal buyer map chrome.

### 5.2 Location onboarding and staged reveal

On first arrival, Omni queries the browser’s geolocation permission state and, when the state is `prompt`, invokes the native location-permission request through a non-blocking page effect while the globe remains visible and spinning. The user is not blocked by a large explanatory card; a compact dock status can provide retry and approximate-market actions. A stale application session flag must not suppress a browser state that is still `prompt`; explicit retry remains available after denial or resolution failure. If permission is granted, the map shows the real user position without moving the resting landing camera. If permission is denied, times out, or is unavailable, Omni uses the active market’s configured centre only as an approximate discovery context and explicitly says that nearby precision is unavailable; it must not display a user marker at the market centre. The user can retry permission later.

A deliberate geographic reveal occurs only after a real search is submitted or an authenticated search is restored. Manual zooming, panning, recentering, or opening a panel must never trigger the reveal. After location is granted, the reveal proceeds as a deliberate sequence:

`Globe → Continent → Country → Region → City/district/local area → Exact position.`

Each stage has a visible pause and highlight. The camera does not jump directly from globe to a pin. The active geographic boundary uses black or near-black emphasis with a restrained dark halo and low-opacity neutral fill; orange remains reserved for Omni actions, pins, and primary emphasis. Country and city names are not required as labels because the geography is visually legible, and the exact user pin appears at the final location only when a real browser position exists. If browser location is absent, the final stage is explicitly approximate market context and must never be labeled or styled as the user’s location. Reduced-motion mode collapses the timing while retaining the semantic stage changes.

After a real search, the map briefly returns to the global/resting orientation when appropriate, then frames the user position only when a real position exists and the relevant facilities. The search result state must show the result pins and cards after the staged reveal completes.

### 5.3 Map controls

The main map exposes only the necessary controls: zoom in, zoom out, recenter on the exact browser position when granted, and a clearly labeled location-permission retry when location is pending or denied. When no exact position exists, the recenter control must be labeled as approximate market exploration rather than personal recentering. They are positioned on the left, vertically centred. No extra decorative control cluster should compete with the search dock. The user can still pan and zoom naturally through MapLibre interactions. Manual map navigation remains independent from the search reveal choreography.

The backend may apply viewport limiting and server-side clustering or deduplication for performance. The accepted V1 visual presentation does not require cluster bubbles; individual result pins remain the visual target when the result set is within the rendering budget.

### 5.4 Search dock structure

The bottom search dock has named, mutually exclusive rows: a primary search row, an optional discovery/filter row, a structured-parameters row, a compact location-context row, and an action/request row. Quantity and maximum budget are first-class controls with clear labels and stable alignment; they must never share a visual surface with the result count, bulk availability CTA, or no-results request surface. On desktop, quantity, budget, location state, filters, result count, and availability action use a predictable secondary grid. On mobile, optional filters may move into a `Refine` sheet, while quantity and budget remain visible and editable without overlap or safe-area clipping. When there are no direct results, the request surface replaces the result action row and preserves the exact query instead of stacking over the structured row. Entered values persist through authentication restoration, search execution, availability mode changes, and facility selection.

## 6. Buyer onboarding and search

### 6.1 First-search authentication wall

An unauthenticated visitor may explore the globe and enter a search. Omni must not execute the full backend retrieval for the first search before authentication. The exact user text, structured fields, category, location context, and intended mode are stored in a pending-search object.

The flow is:

`User searches → Omni detects pending search → Authentication prompt → Account creation/login → Minimal onboarding → Restore exact query and parameters → Execute search → Show map results.`

The original query must not be paraphrased, truncated, or lost. The restored query must produce a visible confirmation that the search is being resumed.

### 6.2 Search modes

Manual mode is available to all users. It accepts a product, service, business, problem, category, location, optional quantity, optional budget, and optional preference filters. Quantity and budget are not mandatory when they are irrelevant.

Agent mode is available only to Buyer Pro when `buyerAgentEnabled` and the global AI switch are enabled. The input remains natural language, but the Agent extracts structured intent and calls the same search, availability, comparison, and transaction APIs as manual mode. It is not a general chat surface. Out-of-scope requests receive:

> “I can only help you search, check availability, and perform actions supported by Omni.”

### 6.3 Search result presentation

The result state shows a count such as “42 facilities found,” a horizontally scrollable or responsive result surface, and native facility pins. Cards are contextual: when the user searches for “Riz parfumé 5 kg,” the searched product appears before generic facility branding. Cards expose price, quantity/stock signal, promotion, distance, facility status, trust/certification, OSM provenance where applicable, and the next valid action.

Unclaimed facilities remain discoverable. They can expose public information and content, but they cannot expose a purchase-intent action through Omni. Their card must say that the facility is unclaimed and offer “Are you the owner? Claim this facility.” Claimed facilities can expose products, availability, and purchase intent according to certification and product state.

## 7. Seller onboarding and workspace

Seller onboarding is progressive and short enough to complete on mobile:

`Account → Buyer/Seller role → Business identity → Facility type → Facility location → Category → Catalogue → Inventory → Contact → Verification → Plan → Automation preferences.`

Free sellers can begin with one facility and five products. The limit is visible before a blocked action and enforced on the server. Pro sellers can create multiple facilities and a shared company catalogue with facility-level price, inventory, availability, and offer overrides. Company-level catalogue support is included in the first full-platform P2 foundation, not postponed to a later rewrite.

The seller map shows only owned/authorized facilities and nearby operational context: demand signals, requests, orders, inventory alerts, and customer activity. A seller can switch the active facility, preview its buyer card, edit location and operating hours, set online/offline, and trigger an emergency shutdown. The buyer preview must use the same facility/product/status presentation as the buyer surface.

## 8. Facility lifecycle and OSM discovery

The product recognises the following lifecycle:

`Discovered → Unclaimed → Claim requested → Unconfirmed → Certified → Confirmed.`

OSM and other public-source facilities begin as discovered/unclaimed unless a trusted ownership or certification process changes their status. Every imported record retains source, source reference, import job, import timestamp, and confidence/provenance metadata.

Unclaimed facilities are not second-class or hidden. They may be searched, displayed, shared, and associated with public content. They may not be edited by ordinary users, expose seller-controlled catalogue actions, or create purchase intents. Claimants submit identity, contact, and facility evidence. Admin review can approve, reject, or request more information. Certification is distinct from confirmation; confirmation is earned after at least three distinct verified buyers complete qualifying QR transactions.

Deduplication combines geospatial proximity, name similarity, phone, website, category, company identity, and source references. Stronger certified or confirmed data cannot be overwritten by weaker OSM or AI-inferred data without a review path.

## 9. Availability and demand

Availability occurs after discovery. Search asks who may potentially satisfy the user; availability asks who can satisfy the request now.

Manual availability targets one facility. Bulk availability targets the relevant result set. Buyer Free receives three bulk availability operations per month; manual single-facility requests do not consume the bulk quota. Buyer Pro limits are configuration-driven and may be expanded.

Seller response choices are Available, Partial, Unavailable, and, where enabled, Alternative available. The response payload includes product/service, variant, quantity, confirmed price, and relevant terms. The buyer’s budget is used for Omni-side ranking and filtering and is not sent to the seller as a constraint.

The comparison state ranks full availability, then partial availability, then unavailable responses, then price/distance/confirmation quality. A best-option highlight may recommend but never silently purchase.

Seller manual responses must work with AI disabled. Semi-automatic responses may read inventory and rules to prepare an answer, but require seller confirmation. Automatic responses are allowed only when the seller has enabled the mode and the global AI flag is on.

## 10. Purchase intent and transactions

Purchase intent is the gateway from discovery/research to transaction. Before intent, direct contact details, precise directions, and transaction-only metadata remain restricted. Creating intent binds buyer, seller, facility, product/service, quantity, offer, coupon, session, and transaction identifiers.

The transaction timeline is:

`Intent created → Offer confirmed → QR generated → Seller verified → Payment pending → Buyer confirms payment → Fulfilment → Buyer confirms product received → Completed.`

The buyer controls payment confirmation. Seller QR verification cannot directly mark buyer payment as confirmed. Pickup is managed by Omni’s transaction flow; delivery arrangements are coordinated between buyer and seller in the initial release. Every state change is visible in the timeline, auditable, and notification-capable.

## 11. Catalogue, inventory, offers, and wallet UX

### Catalogue

A product/service card includes name, category, description, SKU or reference, item type, variant where relevant, price, availability status, inventory quantity, Omni allocation, promotion, media reference if enabled, and publication state. Company-level catalogue items can be reused across facilities with facility-specific overrides.

The seller sees the difference between total stock and Omni-visible allocation. Omni must never promise more than the allocation-derived quantity. Product states are Draft, Active, Paused, Sold out, and Archived. Free/Pro capacity indicators and upgrade explanations are always visible.

### Inventory

Inventory is an operational surface, not a boolean toggle. Sellers can receive stock, adjust stock with a reason, reserve stock for a transaction, release a reservation, and view fulfilled/sold movements. Low-stock thresholds produce alerts and demand opportunities. Every adjustment shows actor, time, reason, and source transaction.

### Offers and coupons

The seller can create percentage or fixed discounts, product/facility-scoped promotions, date-bound rules, minimum-order rules, quantity bounds, redemption limits, first-purchase rules, and buy-X-get-Y where supported. Complex rules must be previewed before publication. Coupon consumption is atomic and the buyer sees the applied rule and final price before purchase intent.

### Wallet and subscription

The wallet is a platform balance used for deposits, subscriptions, feature credits, advertising, and paid Omni services. It is not a seller withdrawal account in this release. The seller sees available balance, pending deposits, ledger history, spend categories, Pro/ad/feature credits, and the next renewal amount/date.

Wallet operations are explicit and confirmed: top up through the existing FedaPay path, view pending/approved/failed deposits, spend on campaigns or subscriptions, and inspect the immutable ledger. Pending funds are not spendable. Auto-renew may be enabled or disabled. If a renewal date arrives without sufficient available balance, the subscription downgrades to Free with a clear explanation and no negative balance.

## 12. Notifications and menus

Operational notifications are distinct from marketing notifications. Events include search restoration, availability request/response, purchase intent, QR, payment, fulfilment, low stock, deposit, wallet debit, subscription renewal/downgrade, claim/certification, promotion, campaign, and Agent action.

Every notification can deep-link to the responsible map state or seller panel. Users can independently control buyer, seller, marketing, and transaction notifications. Essential security and transaction notifications cannot be silently suppressed by promotional settings.

## 13. UI state and component inventory

| Surface             | Required states                                                                                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Map/globe           | Resting rotation, location pending, location granted, location denied, market fallback, resting discovery, loading, search-only staged reveal, search framing, results, empty, error, reduced motion |
| Search dock         | Idle, focused, categories open, quantity/budget row, structured parameters, manual/Agent switch, auth pending, executing, restored query, narrow mobile layout                                       |
| Facility card       | Claimed/unclaimed, certified/confirmed, online/offline, available/partial/unavailable, low stock, sponsored, selected                                                                                |
| Facility sheet      | Identity, source/trust, product/service context, availability CTA, claim CTA, purchase-intent CTA only when valid                                                                                    |
| Availability panel  | Manual/bulk mode, quota, request progress, response ranking, best option, no response, retry                                                                                                         |
| Transaction sheet   | Timeline, QR, payment confirmation, fulfilment, receipt confirmation, cancellation/error                                                                                                             |
| Seller map          | Active facility, facility switcher, demand, requests, orders, inventory alerts, buyer preview                                                                                                        |
| Catalogue/inventory | Loading, empty, draft, active, paused, sold out, low stock, allocation warning, limit reached, error                                                                                                 |
| Wallet/subscription | Available, pending deposit, failed deposit, debit confirmation, ledger empty, renewal due, downgrade, Pro upgrade                                                                                    |
| Agent               | Hidden/off, unavailable plan, recommendation, confirmation, tool progress, result, rejected action, kill switch                                                                                      |

## 14. Accessibility, responsiveness, and visual requirements

Omni uses a warm cream background, frosted glass surfaces, soft shadows, rounded geometry, premium typography, subtle gradients, and restrained orange accents. The map remains quiet but populated with real discovery data. Active geographic highlights use black or near-black emphasis with restrained opacity; orange is reserved for Omni actions and pins. Sheets and panels preserve visible focus rings, keyboard reachability, sufficient contrast, readable status text, and clear disabled states.

Desktop uses side sheets or split map/context layouts. Mobile uses bottom sheets and a seller daily-operations home. Motion is short and physically legible; globe/reveal motion respects `prefers-reduced-motion`. No core action depends on hover, precise map gestures, color alone, or a hidden control.

## 15. Analytics and product signals

Track state transitions, not sensitive free-form content: search started/completed, auth restoration, result viewed, facility opened, claim started/completed, availability requested/responded, purchase intent created, QR verified, payment/receipt confirmed, catalogue changes, inventory adjustments, wallet deposit/debit, renewal/downgrade, coupon creation/redemption, and Agent proposal/confirmation. Make commercial and essential events distinguishable.

## 16. Acceptance criteria

The product/UX release is accepted only if:

1. Omni opens directly into the real MapLibre globe/map with top-right notifications/menu, persistent bottom search, and a sparse layer of real source-backed facility discovery points.

1. The browser receives an explicit non-blocking location prompt; granted location produces a true user marker, while denied or unavailable location produces truthful market-fallback copy without a false user marker.

1. The globe rests in an unmistakably horizontal left-to-right or right-to-left vertical-axis rotation, not a clock-like bearing roll, and only a real search triggers the staged continent-to-exact-location reveal with visible black boundary emphasis and pauses.

1. An unauthenticated first search preserves and restores the exact query after authentication.

1. OSM facilities are discoverable, source-attributed, visibly unclaimed, and non-purchasable until claimed/authorized.

1. Claimed facilities expose valid products, manual availability, and purchase intent; unclaimed facilities do not.

1. Buyer Free and Pro behavior is understandable and consistent with server-enforced limits.

1. Manual availability works without AI; bulk quota is visible; seller responses compare and rank correctly.

1. Purchase intent, QR, seller verification, buyer payment confirmation, receipt confirmation, and completed timeline states are coherent.

1. Sellers can onboard, manage company/facility catalogue, operate inventory, respond to requests, manage wallet/subscription, and preview the buyer surface without leaving the operational map context.

1. Wallet balances, pending deposits, debits, renewals, and downgrades are legible and never imply seller withdrawals.

1. AI and media surfaces are correctly gated, and disabling AI leaves all manual flows available.

1. Quantity and budget are clearly positioned in the search dock on desktop and mobile, survive auth restoration, and never overlap result count or availability actions.

1. Loading, empty, error, reduced-motion, keyboard, and mobile states are intentionally designed rather than accidental.

## 17. Source references

[1]: # "docs/OMNI_MASTER.md, especially sections 1–5, 16–27, 37–48, 61–65, 75–106, 127–133."
[2]: # "docs/omni-product-interface-spec.md, sections 1–24."
[3]: # "docs/omni-build-plan-after-build-prompt.md, phases 0–9 and implemented state machines."
[4]: # ".lovable/plan/omni-interface-produit-map-first-mise-en-conformité-2026-08-15.md, Lots A–H."
[5]: # "Current implementation evidence: src/routes/carte.tsx, src/components/omni/MapCanvas.tsx, src/components/omni/TopNav.tsx, src/components/omni/FacilityPanel.tsx, src/components/omni/DemandRequestPanel.tsx, src/components/omni/OrdersPanel.tsx, src/routes/vendeur.tsx, src/lib/vendor.functions.ts, src/lib/demand.functions.ts, src/lib/checkout.functions.ts, src/lib/auth.tsx, src/lib/omni.config.ts, and db/schema.sql."
