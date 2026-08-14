# Omni — Build Plan after the Build Prompt

This plan translates the V1/V2-ready specification into build phases. The goal is to keep Free/Pro, Manual/Agent and Buyer/Seller as configurations of one stateful Omni system, not separate products.


## Implementation status
- **Phase 1 — Map-first landing state:** implemented in the current app shell: `/` renders the map experience, the buyer map chrome is reduced to notifications + menu, the persistent bottom search is retained, and search camera framing is preserved.
- **Phase 2 — Search and discovery core:** implemented for the current discovery surface: product/service search, category shortcuts, budget/radius filters, online-only facilities, map pins and contextual search-result cards.

## Phase 0 — Product source of truth and configuration
- Add explicit product configuration flags: `aiAutomationEnabled`, `buyerAgentEnabled`, `sellerAgentEnabled`, `mediaUiEnabled`, `freeBuyerBulkLimit`, `sellerFreeFacilityLimit`.
- Document the state machines for Facility, Availability, Purchase Intent, Subscription and Agent.
- Keep manual flows independent from AI flags.

## Phase 1 — Map-first landing state
- `/` must render the map application directly.
- Remove visible in-app landing chrome from the buyer home.
- Keep only top-right notifications and account/menu.
- Keep bottom persistent search as the main navigation element.
- Ensure camera framing displays user location plus search results after every search.

## Phase 2 — Search and discovery core
- Search accepts product/service query with optional manual parameters: quantity, budget, location/category.
- Categories remain horizontal shortcuts, not marketplace navigation.
- Results are map pins + contextual facility cards/sheets.
- Facility cards prioritize the searched product/service above generic seller branding.
- Hide offline facilities from search results unless an admin/debug mode explicitly requests them.

## Phase 3 — Availability layer
- Add manual facility availability requests.
- Add bulk availability requests with Free buyer monthly limit of 3.
- Ensure budget is not sent to sellers; it only filters/ranks results inside Omni.
- Implement seller responses: available, partial, unavailable.
- Add notification events for requests and responses.

## Phase 4 — Purchase Intent and QR transaction gateway
- Introduce Purchase Intent as the required transition from discovery to transaction.
- Generate QR at intent creation.
- Unlock contact/directions only after intent.
- Create the transaction chat/timeline automatically.
- Track all transaction metadata: buyer, seller, facility, product/service, quantity, offer, promotion, timestamp, location and outcome.

## Phase 5 — Seller map dashboard
- Rework seller dashboard as a map-first operational layer showing only seller-owned facilities.
- Add facility preview matching buyer card/detail design.
- Add online/offline state, operating hours and emergency shutdown.
- Keep certification mandatory before full publication.

## Phase 6 — Catalogue, allocation, promotions and wallet
- Products/services support price, status, quantity and Omni allocation.
- Promotions attach to facility/product/service/offer.
- Wallet/balance supports subscriptions, credits, ads and paid Omni services.
- Auto-renew subscriptions from balance; downgrade when insufficient.

## Phase 7 — Notifications and account surfaces
- Make notification center first-class and deep-linked.
- Keep account menu minimal for buyer and operational for seller.
- Add transaction, availability, promotion, subscription and certification notification types.

## Phase 8 — Agent orchestration behind kill switch
- Implement Buyer Agent as orchestration of existing search, availability, comparison and intent APIs.
- Implement Seller Agent as structured automated availability responses from catalogue/allocation data.
- Block out-of-scope free chat with the approved Omni-only response.
- Turning off `aiAutomationEnabled` must remove Agent UI and keep all manual flows functional.

## Phase 9 — Media-ready but disabled
- Keep data structures extensible for media.
- Hide media search/photo/video/social ingestion in the current UI unless `mediaUiEnabled` is turned on.
- Do not make media a blocker for V1 search, availability or transaction.

## Acceptance criteria
- The app feels like one spatial stateful interface.
- Manual buyer and seller flows work without any AI feature.
- Agent features never bypass manual capabilities.
- Purchase/payment critical decisions require explicit user confirmation.
- Every transaction is traceable end-to-end.
