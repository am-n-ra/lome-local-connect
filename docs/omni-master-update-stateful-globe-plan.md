# Omni Website Completion, Master-Spec Update, and Rotating Globe Plan

## Goal

Update and complete the selected repository, `am-n-ra/lome-local-connect`, as one **map-first, stateful Omni interface** for discovery, real-time availability, and transaction. The work must not merely implement the previous completion plan beside the master document. It must first **update the repository master with the newly supplied Product & Interface Specification and the completion/rotating-globe requirements**, then implement against that merged source of truth.

The finished experience will open directly into Omni’s map/globe, use the supplied orange eye-in-location mark as the brand reference, keep search persistently available at the bottom, use a slow rotating globe as the idle global state, and support the specified progression from discovery to availability, purchase intent, QR, transaction, and completion. AI will remain an orchestration layer over manual actions and will disappear behind the global kill switch without breaking manual functionality.

## Source-of-truth decision

The repository’s master must become a **merged and versioned specification**, not a copy of only the older document. During execution, the existing master source (`pasted_content_2.txt`), the newly supplied Product & Interface Specification (`pasted_content_3.txt`), and the completion/rotating-globe plan will be reconciled into `docs/OMNI_MASTER.md` or the repository’s equivalent canonical path.

The merged master will preserve the original product model and acceptance criteria while adding the newer, more concrete interface contract: map-first home composition, Mercator/globe-light geographic onboarding, left-side map controls, persistent search and category behavior, Manual/Agent mode, authentication/query restoration, result and facility-card rules, media-ready UI-disabled policy, availability and recommendation behavior, Purchase Intent/QR transaction timeline, seller operations, catalogue/allocation/promotions/wallet, notifications and menus, Free/Pro entitlements, AI kill switch, and the stateful interface rule.

It will also make the globe choreography a first-class product requirement rather than an implementation detail. The resting globe must be clean and intentionally sparse: it communicates global supply and demand without becoming a dashboard of pins. Search is the moment when spatial information unfolds. A new search first returns to the rotating world state, then flies through the user’s continent, country, region, town/area, and final location with short visual pauses and highlights before revealing the user position and result pins.

Where the documents differ, the implementation interpretation will be explicit in the master. Global/world views may use clustering to avoid rendering excessive facilities, while a local search-results state will show individual relevant result pins without clusters when that is the desired result model. The map remains the main canvas; separate search, facility, checkout, and dashboard pages will not replace the stateful interface.

## Current grounding and assumptions

The supplied status document reports that Phases 1 and 2 are implemented and that work had reached Phase 6, but the actual repository is not currently checked out in the sandbox. Execution must therefore begin with a read-only repository audit before code changes. Existing APIs, auth, persistence, map library, and deployment conventions will be reused where present.

If a production integration is absent, implementation will use typed adapters and deterministic demo states that are clearly isolated from real payment, purchase, or account mutation. No external purchase, payment, publication, or irreversible action will be performed as part of the build. The supplied logo image will be handled through the repository’s supported asset workflow rather than being copied into a prohibited large-media directory.

## Step-by-step execution plan

### 1. Establish the repository baseline

Clone `am-n-ra/lome-local-connect` with the authenticated GitHub CLI, inspect branches and recent commits, create a dedicated working branch, and run the existing type-check, tests, lint/format checks, and production build. Record pre-existing failures before modifying anything.

Audit the actual routing, state management, map implementation, auth flow, backend/API boundaries, asset conventions, and current Phase 1–6 surfaces. Locate the buyer home/map shell, search, facility cards, seller dashboard, catalogue, promotions, wallet, notifications, and agent flags. The audit determines whether the current project is static or full-stack and prevents replacing working pieces unnecessarily.

### 2. Merge and update the master specification before feature implementation

Create or update the canonical master file, preferably `docs/OMNI_MASTER.md`, by merging the older master, the new Product & Interface Specification, and the completion/rotating-globe plan. Preserve all governing object models, lifecycle states, security constraints, and acceptance tests from the older master; add the newer concrete UI and entitlement rules rather than overwriting them.

Add a short `docs/README.md` or repository README entry explaining that `OMNI_MASTER.md` is the product source of truth and that the phase-status/build-plan document is the implementation tracker. Include a clearly marked “Current V1/V2-ready interface contract” section covering the following non-negotiables:

| Area             | Master requirement to preserve and implement                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product loop     | Search → Discover → Check Availability → Compare/Recommend → Purchase Intent → QR → Transaction                                                                                                                        |
| Opening state    | No in-app landing page; open directly to map/globe with logo, location, notifications/menu, and persistent search                                                                                                      |
| Geography        | Clean Mercator/globe-light background; Globe → Continent → Country → Region → Zone/neighborhood → exact user location on onboarding and search reveal                                                                  |
| Map controls     | Left-centered vertical `+`, `−`, and recenter-user controls only for the V1 main map                                                                                                                                   |
| Search           | Bottom floating glass search bar; chevron opens horizontally scrollable category shortcuts                                                                                                                             |
| Modes            | Manual for all users; Agent only for Buyer Pro when AI is enabled; Agent uses the same manual APIs                                                                                                                     |
| Auth             | Preserve the exact first query, require authentication before first backend retrieval, restore and execute it after onboarding                                                                                         |
| Results          | Reset to spinning globe, then staged continent/country/region/town-area flight with pauses and highlights; finish on actual user position plus visible individual result pins and contextual product/service-led cards |
| Availability     | Post-discovery manual and bulk availability; Free buyer bulk limit of 3/month; Available/Partial/Unavailable responses; budget stays inside Omni                                                                       |
| Transaction      | Purchase Intent gateway, QR at intent creation, gated contact/directions, traceable transaction timeline, explicit payment confirmation                                                                                |
| Seller           | Map-first seller surface showing only owned facilities, buyer preview parity, certification, online/offline, hours, catalogue, requests, promotions, ads, agent, balance, subscription, settings                       |
| Commercial model | Product/service price, status, quantity, Omni allocation, promotion scope, wallet categories, auto-renewal and insufficient-balance downgrade                                                                          |
| Safeguards       | Manual flows work with AI OFF; media-ready architecture with UI disabled; agents cannot do anything without a corresponding manual action                                                                              |

Resolve any remaining ambiguity in this file before coding. This updated master is a required repository change and must be committed with the implementation.

### 3. Prepare the Omni identity asset

Use `/home/ubuntu/upload/ChatGPTImageAug11,2026,06_28_39PM.png` as the supplied visual reference for Omni’s orange eye-in-location mark. Store the original outside the application source tree where required, upload it through the project’s supported asset mechanism, and reference the stable returned asset URL.

Create a reusable logo treatment for compact controls, the opening globe state, and metadata/favicon fallback where supported. Include meaningful alt text and an accessible text label. Do not redraw or materially alter the supplied mark unless a small technical fallback is necessary.

### 4. Rebuild the map-first stateful shell

Make `/` render the product directly. The buyer opening state will contain a calm map/globe background, Omni mark, location/onboarding affordance, only notifications and menu in the top-right, left-side zoom/recenter controls, and a persistent bottom search bar. There will be no permanent marketing navbar or traditional hero section.

Consolidate reusable creamy-glass primitives—`GlassCard`, `GlassButton`, `GlassInput`, `GlassSearchBar`, `GlassSheet`, `GlassModal`, `GlassBadge`, `GlassTab`, and `GlassNavigation`—and Omni map components such as facility pins, clusters where required at global scale, user location, search radius, availability pulse, agent highlight, facility preview, map bottom sheet, and globe controls. Maintain keyboard navigation, visible focus, screen-reader labels, mobile touch targets, contrast, and reduced-motion support.

Model the core interface as explicit states rather than isolated pages:

```text
MAP → SEARCH ACTIVE → SEARCH RESULTS → FACILITY SELECTED
→ AVAILABILITY → AVAILABILITY RESULTS → PURCHASE INTENT
→ TRANSACTION CHAT → COMPLETED
```

Facility detail will remain above the map: a desktop side sheet/floating panel and a mobile bottom sheet. The map remains visible behind it, and the detail view will show identity, search context, relevant products/services, price, promotions, distance, availability, certification/state, and the appropriate `Check availability` action.

### 5. Implement the clean globe, geographic onboarding, and staged search reveal

Use the repository’s existing compatible map layer or add the smallest compatible MapLibre implementation. At global zoom, use globe projection or globe-light behavior; as the camera moves inward, transition through world, continent/country, region, neighborhood, and facility levels while retaining viewport-aware retrieval and scale-appropriate rendering.

The resting state is intentionally clean. Show a calm globe with restrained geography, the Omni identity, and only the minimum interface controls; do not render a dense field of facility pins, labels, clusters, or promotional cards while the user is simply arriving. The visual message is that Omni represents the world’s supply and demand, not that the user has landed on a cluttered analytics screen. The recommended treatment is subtle geography and atmosphere only in the resting state. Optional information can briefly fly outward during an active search as one to three restrained supply/demand signal arcs or small contextual callouts, but these must be transient, sparse, and subordinate to the globe and result pins. They should never become a permanent data cloud.

At first opening, request location only when appropriate. If accepted, animate the geographic progression from globe toward the user’s continent, country, region, neighborhood, and final location, highlighting the current geographic level at each step and ending with the user pin. If denied, keep the globe/map usable with a clear manual location path.

The idle global state is a slow, continuous rotation: it is the platform’s resting and research state. Rotation must pause immediately on drag, zoom, keyboard navigation, location onboarding, search focus or submission, map control use, facility selection, sheet opening, or any other meaningful interaction. It may resume only after a quiet inactivity delay, and it must be disabled under `prefers-reduced-motion: reduce`.

Every new search follows an explicit spatial choreography instead of jumping directly to results:

```text
RESTING ROTATING GLOBE
  ↓ new search
QUICK RESET / WORLD VIEW
  ↓
HIGHLIGHT USER CONTINENT → brief pause
  ↓
ZOOM TO USER COUNTRY → brief pause
  ↓
ZOOM TO USER REGION → highlight → brief pause
  ↓
ZOOM TO TOWN / AREA → brief pause
  ↓
ZOOM TO ACTUAL USER POSITION AND SEARCH AREA
  ↓
SHOW USER POSITION + INDIVIDUAL FINDING PINS + RESULT UI
```

The same sequence applies when the query targets another location: the intermediate geography follows the relevant search destination, while the user position remains visible in the final framing when it is part of the requested context. If another search begins from a result state, quickly zoom out to the clean globe, resume the spinning state for the reset moment, then run the next staged reveal. Search, location, and facility state should be explicit in a small state machine so the globe cannot rotate during a reveal or be interrupted by stale animation callbacks.

Use clusters at global/large-scale views to avoid rendering millions of facilities, but show individual search-result pins in the local results mode specified by the new interface document. Support subtle visual states for normal, unclaimed, claimed/unconfirmed, certified, confirmed, sponsored, selected, available, partial, low-stock, company, mobile, digital, and offline/online facilities.

### 6. Complete search, modes, and authentication behavior

Validate that the bottom search accepts a product/service query and optional quantity, budget, location/category, radius, and online-only parameters. Quantity and budget remain optional when irrelevant. The chevron opens a horizontal category row such as All, Food, Health, Retail, and Services; these are search shortcuts, not marketplace navigation.

Manual Mode is available to all users. Agent Mode is visible only for Buyer Pro when the AI configuration allows it. Agent Mode accepts natural language, extracts structured parameters, and invokes the same search, availability, comparison, and intent APIs as Manual Mode. Out-of-scope chat must return the approved Omni-only response rather than becoming a general chatbot.

For a first-time unauthenticated user, accept the search input but do not execute full backend retrieval. Persist the exact original query and all relevant parameters, show the authentication-required onboarding prompt, restore the query after sign-up or login/onboarding, and then execute it. Never lose the original query or expose results before the required authentication boundary.

After every search, automatically frame the camera around the user position and relevant facilities without requiring manual zoom-out. Result cards will lead with the searched product/service, then the facility, distance, certification/trust, price/promotion, availability signal, and next action. Offline facilities remain hidden from normal buyer results unless debug/admin mode explicitly enables them.

### 7. Finish availability, comparison, recommendation, and transaction gateway

Implement or complete manual facility-specific availability and bulk availability. Enforce three bulk searches per month for Buyer Free, retain expanded bulk capability for Buyer Pro, send only relevant product/service, variant, quantity, and operational parameters to sellers, and keep budget exclusively inside Omni filtering/ranking. Support seller responses of Available, Partial, and Unavailable with notifications and contextual map/card updates.

For Buyer Pro with AI enabled, allow recommendation over availability responses according to full quantity, budget, distance, and confirmation quality. The user must retain control over all critical decisions; the agent may recommend but not silently commit.

Make Purchase Intent the explicit gateway into transaction. Before intent, keep direct contact, detailed directions, and transaction elements gated. After confirmed intent, generate a QR linked to buyer, seller, facility, product/service, quantity, offer, coupon, and session/transaction ID; unlock the permitted contact/directions; and create a transaction chat/timeline containing intent created, offer confirmed, QR generated, seller verified, payment, seller confirmation, product received, and completed. Pickup remains Omni-managed while delivery is coordinated between seller and user in this version. Persist enough metadata to answer who bought what, from whom, where, when, at what offer, with which promotion, and with what outcome.

### 8. Complete seller map operations and Phase 6 commerce

Ensure the seller surface remains map-first and shows only seller-owned facilities. Provide buyer-preview parity and operational actions for facility editing, products/services, promotions, availability, hours, online/offline state, and emergency shutdown. Keep certification mandatory before complete publication and preserve unclaimed/claim/certification/confirmed distinctions.

Audit Phase 6 against the merged master and complete missing states, validation, empty states, and error states. Each product/service must include name, category, description, price, availability, quantity, Omni allocation, promotion scope, and status. Seller automation must never promise more than the available Omni allocation.

Represent the seller sections—Facilities, Products/Services, Availability, Requests, Transactions, Promotions, Ads, Agent, Balance, Subscription, and Settings—within the operational stateful experience or its existing route structure without undermining the facility-centered map anchor. Wallet/balance must distinguish subscriptions, paid features/services, credits, advertising, and other Omni consumption. Auto-renewal checks balance at expiry; sufficient balance renews, insufficient balance downgrades. Any paid or renewal-critical action requires explicit user confirmation, and absent payment infrastructure must be isolated behind a typed boundary rather than presented as a completed charge.

### 9. Complete notifications, menus, entitlements, and kill switches

Make Notifications first-class and deep-linked into search, availability, recommendations, promotions, Purchase Intent, QR, seller, payment, transactions, account, subscription, certification, ads, and agent contexts. Keep the buyer menu minimal but include Profile, Plan, Balance, Searches, Availability, Transactions, Notifications, Settings, Help, and Logout. Keep the seller menu operational with catalogue, requests, transactions, promotions, ads, agent, balance, subscription, and settings.

Add or verify explicit configuration flags: `aiAutomationEnabled`, `buyerAgentEnabled`, `sellerAgentEnabled`, `mediaUiEnabled`, `freeBuyerBulkLimit`, and `sellerFreeFacilityLimit`. Admin’s global `AI / Automation [ON]` switch must remove Agent Mode, orchestration, recommendations, Seller Agent, and automated availability when OFF while leaving all manual discovery, availability, comparison, intent, catalogue, and transaction flows usable.

Keep media-ready data structures for photos, videos, social content, facility media, product media, and media search, but keep the media UI disabled in the current release unless `mediaUiEnabled` is deliberately enabled.

### 10. Verify and deliver the implementation

Test desktop and mobile opening states; clean-globe visual density; rotation speed and pause/resume; reduced-motion behavior; first-location onboarding; search choreography timing; continent/country/region/town highlights and pauses; reset-to-globe behavior before a second search; stale-animation cancellation; map controls; manual and Agent mode visibility; authentication/query restoration; automatic camera framing; global clustering versus local unclustered result pins; user-position visibility; facility sheets; availability limits and responses; Buyer Pro recommendation; Purchase Intent confirmation; QR/timeline rendering; seller-owned facility filtering; certification and online/offline states; catalogue/allocation/promotions; wallet edge cases; notification deep links; and the AI kill switch.

Run type-checking, unit/component tests, production build, and all repository checks. Inspect the final diff for broken routes, missing alt text, hard-coded secrets, prohibited local media, nested interactive elements, console errors, render-phase state mutations, and accidental external side effects. Commit the **updated master plus implementation**, push the branch, and report the commit and preview details after verification.

## Proposed implementation order

| Order | Workstream                                            | Completion signal                                                                                                                                   |
| ----- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Repository audit and baseline                         | Actual architecture and pre-existing failures are documented                                                                                        |
| 2     | Merged master update                                  | Older master, new product/interface spec, and rotating-globe plan are reconciled in the canonical master                                            |
| 3     | Logo and design system                                | Supplied mark is referenced through the supported asset path and glass primitives are reusable                                                      |
| 4     | Stateful map shell                                    | `/` opens directly to map/globe with logo, controls, location, notifications/menu, and persistent search                                            |
| 5     | Clean globe, idle rotation, and search choreography   | Resting globe is sparse and rotating; each search resets to the world, pauses through geographic levels, then reveals user position and result pins |
| 6     | Search, modes, auth, and results                      | Manual/Agent entitlements, query restoration, camera framing, and result presentation are correct                                                   |
| 7     | Availability, recommendation, intent, QR, transaction | Manual core works with limits, confirmation gates, traceability, and AI OFF                                                                         |
| 8     | Seller operations and Phase 6 commerce                | Facilities, catalogue, allocation, promotions, wallet, subscription, and seller states are complete                                                 |
| 9     | Notifications, menus, flags, media policy             | Deep links, entitlements, kill switch, and media-ready/UI-disabled behavior are explicit                                                            |
| 10    | QA and repository handoff                             | Checks pass or pre-existing failures are reported; master and code are committed together                                                           |

## Acceptance criteria

The canonical repository master explicitly contains the newly supplied product/interface requirements and the completion plan’s rotating-globe behavior. The app opens directly into Omni rather than an in-app landing page. Its resting state is a clean, sparse, slowly rotating globe that communicates worldwide supply and demand without visual clutter. Meaningful interaction pauses it; reduced-motion users do not receive non-essential rotation.

Every search visibly comes alive through a controlled spatial reveal: the globe resets/spins, the user’s continent is highlighted and held briefly, then the country, region, town/area, and final location are highlighted with deliberate pauses before the camera settles on the actual position and individual finding pins. A second search repeats the reset-to-globe behavior rather than snapping directly from one local result set to another. Optional supply/demand arcs or callouts are transient and restrained, never a persistent cloud of information.

The opening state has only the required top-right notifications/menu, left-side `+`, `−`, and recenter controls, the supplied Omni identity, location context, and persistent bottom search. Manual search and discovery work for all users, Agent Mode is correctly gated, the original unauthenticated query survives onboarding, and final camera framing shows the user plus relevant facilities. Facility selection, availability, recommendations, Purchase Intent, QR, transaction timeline, seller operations, Phase 6 commerce, notifications, wallet, entitlements, and AI kill-switch behavior follow the merged master.

The result is one responsive, accessible, reduced-motion-aware spatial interface—not a map with a chatbot attached and not a collection of disconnected product pages. The updated master specification and implementation are versioned together in the selected repository.

## Open risks to resolve during the audit

The repository’s current branch and implementation may differ from the supplied status document. The audit must resolve the actual map library, available globe projection support, auth/backend state, asset-upload path, payment boundary, and phase-6 completeness before choosing exact files. If MapLibre globe support or an existing proxy is unavailable, use the smallest compatible implementation and document the limitation in the master rather than silently weakening the required behavior. Any missing service integration will remain an explicit adapter boundary with deterministic demo states.

## MapLibre projection clarification

The rotating globe is the actual MapLibre globe projection, not a visual substitute. Remove decorative SVG/CSS globe surfaces from the active map route. The MapLibre canvas must fill the viewport, render real geographic basemap data, rotate slowly at global scale, pause on interaction, and transition through the staged search reveal on the same map instance. If a style fails, use a MapLibre-rendered style fallback or a transparent retry/error state; never mask a missing map with artwork.
