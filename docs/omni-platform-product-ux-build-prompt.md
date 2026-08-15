# Omni Platform Product & UI/UX Build Prompt

## Mission

Implement the complete Omni product experience described in `docs/omni-platform-product-ux-prd.md` inside the existing React 19 + TanStack Start + TypeScript application. Preserve the product’s identity as a global geospatial supply-and-demand search engine with a real MapLibre globe/map as the primary interface.

This prompt governs product and frontend implementation. Backend/database work must follow `docs/omni-platform-technical-backend-database-prd.md` and its companion build prompt. Do not invent frontend-only state that contradicts server contracts.

## Non-negotiable constraints

- Use the real MapLibre GL globe projection. Never replace it with SVG, CSS, a decorative canvas, a screenshot, or a simulated globe.
- Preserve the approved horizontal resting rotation direction and the user-requested vertical-axis interpretation. Rotate the globe’s longitude/center around a stable camera bearing; do not create a clock-like roll with bearing animation.
- On first arrival, invoke the browser’s native geolocation permission request through a non-blocking page effect while the globe keeps spinning. Do not show a large explanatory location card; keep a truthful distinction between browser location, market fallback, and unknown location with compact dock recovery actions.
- Preserve the staged geographic reveal with continent, country, region, local area, and exact-position pauses/highlights, but trigger it only after an explicit search or restored search—not on passive arrival or manual map navigation.
- Keep the resting map populated with sparse, real, source-backed facility discovery points. Do not use a naked map or fake markers. Preserve the grey/black water and white-land globe; use a separate warm white/cream spatial field behind and around the globe. Suppress country/city labels at default globe scale unless needed for the search reveal.
- Use black or near-black boundary emphasis with restrained opacity for active reveal highlights; reserve orange for Omni actions, pins, and primary emphasis.
- Keep the buyer map chrome top-right-only: notifications and menu. Keep the persistent bottom search dock.
- Do not add a traditional in-app marketing landing page.
- Keep first-search authentication behavior exact-query-safe: do not execute the first backend retrieval while unauthenticated; restore the exact query after login.
- Keep Neon Auth and Neon PostgreSQL as the only auth/database systems.
- Treat OSM facilities as discoverable unclaimed supply. Never expose purchase intent or seller-controlled product actions for an unclaimed facility.
- Keep manual flows independent from AI. The AI kill switch must hide Agent/automation surfaces without breaking manual search, availability, catalogue, inventory, wallet, or transaction operations.
- Do not expose seller withdrawals or in-app seller payouts in this release. Seller wallet is platform balance for deposits, subscriptions, credits, advertising, and paid Omni services.
- Do not visually show cluster bubbles as the default buyer result experience. Backend viewport limiting/deduplication is allowed for scale.
- Keep media-ready data structures, but hide media UI unless `mediaUiEnabled` is enabled.
- Do not commit `.env`, credentials, browser tokens, temporary fixtures, or generated secrets.

## Required working method

1. Read the two Omni PRDs, the master specification, the interface specification, the existing build plan, the current route/component code, and the relevant database/server-function contracts before editing.
2. Create a traceability checklist mapping each implementation change to a PRD requirement and acceptance test.
3. Inspect the current branch and use existing components, server functions, design tokens, and state machines where they are correct. Refactor rather than duplicate.
4. Make changes in bounded vertical slices. Each slice must type-check, build, and be browser-testable before the next slice.
5. Add or update migrations only through the approved repository migration runner and keep migration numbering unique.
6. Keep browser stateful: panels and sheets are overlays on the map, not disconnected page replacements.
7. Add tests for every new server contract and plan/permission invariant before declaring the slice complete.

## Product/UI implementation sequence

### Slice 1 — Shared product shell and state inventory

Audit and stabilize the buyer and seller route shells. Define or consolidate shared state types for:

`MAP → SEARCH ACTIVE → SEARCH RESULTS → FACILITY SELECTED → AVAILABILITY → AVAILABILITY RESULTS → PURCHASE INTENT → TRANSACTION CHAT → COMPLETED`.

Ensure every sheet/panel can close or return to the map, every loading/error/empty state is explicit, and the map is not unmounted during normal panel transitions. Create or reuse the glass card, sheet, button, input, badge, tab, and navigation primitives rather than scattering one-off styles.

### Slice 2 — Globe and location experience

Verify and refine `MapCanvas` using MapLibre’s actual globe projection. Implement resting rotation by moving the globe center/longitude around a stable camera axis so the earth moves horizontally like a physical globe; do not use camera bearing as the primary idle-rotation mechanism. Pause rotation during gestures, panels, recentering, and active reveal, and resume it only in the resting state.

Invoke the browser’s native location permission on landing arrival through an idempotent non-blocking effect, keep the globe visible while pending, show a clear exact-position pin only after browser success without moving the resting camera, and label denied/timeout/unsupported cases as approximate market fallback without misplacing or fabricating the user marker. Use only compact dock retry/recovery treatment after denial; do not add a large arrival card. Implement the staged reveal only after a real or restored search, with black/near-black highlights, suppressed country/city labels, semantic pauses, reduced-motion behavior, camera framing, and result reveal callbacks. Verify that manual zoom and pan never start the reveal.

### Slice 3 — Buyer search, structured controls, and auth restoration

Refine the bottom search dock into named primary, discovery/filter, structured-parameters, location-context, and action/request rows. Put quantity and maximum budget in a deliberate secondary row/grid with stable desktop alignment and a mobile-safe refine layout. Keep result count and bulk availability visible without overlap. When there are no direct results, render the request surface in the action/request row as a mutually exclusive replacement, never above quantity/budget. Preserve quantity, budget, location source, and all structured fields through auth restoration and availability opening. Preserve exact input and structured fields in the pending auth handoff. Ensure unauthenticated first search stops before the backend search and resumes automatically after login/onboarding.

Keep result cards contextual to the searched product/service. Show status, certification, OSM provenance, distance, price, promotion, and valid next actions. Add clear no-results, partial-results, request-failed, and retry states.

### Slice 4 — OSM facility and claim UX

Expose source and ownership state in facility cards and detail panels. For unclaimed facilities show discovery information, source attribution, public content if available, sharing, and “Are you the owner? Claim this facility.” Never show a purchase-intent action for an unclaimed facility. For claimed/certified facilities show products, availability, and purchase intent according to server eligibility.

Implement claim request, claimant information, verification status, admin outcome, and duplicate/conflict messaging. Reuse the existing facility detail design so buyer and seller preview remain consistent.

### Slice 5 — Availability and transaction journey

Retain the manual single-facility availability path and bulk availability path. Make mode and facility context explicit. Show the Free buyer bulk quota and explain that manual requests do not consume it. Render responses in the server-defined ranking order with best-option guidance but no automatic purchase.

Retain the Lot E purchase-intent, QR, timeline, buyer payment confirmation, and buyer receipt confirmation surfaces. Ensure seller verification cannot confirm buyer payment. Add explicit states for pending, payment pending, paid, fulfilment, user confirmed, completed, expired, cancelled, and failed.

### Slice 6 — Seller onboarding and map-first workspace

Refactor `/vendeur` into an operational map-first workspace. Provide a facility switcher when the account has more than one facility, an active-facility anchor, nearby demand/request/order/inventory summaries, buyer preview, online/offline state, hours, emergency shutdown, certification state, and clear map return behavior.

Implement progressive seller onboarding rather than a single overwhelming form. Preserve the current simple path as a fallback, but add steps for identity, facility, catalogue, inventory, verification, plan, and automation preferences. Make plan limits visible before submission.

### Slice 7 — Company catalogue, products, and inventory

Implement the company-level catalogue and facility overrides approved for P2. Product/service surfaces must support name, category, description, SKU/reference, item type, variants where needed, price, publication state, inventory, Omni allocation, promotions, and media reference when enabled.

Replace the boolean-only inventory interaction with explicit receive, adjust, reserve, release, and fulfilment actions. Show total stock, Omni-visible stock, reserved stock, low-stock threshold, and last movement. Require reason/confirmation for destructive or high-impact changes. Free limits and allocation constraints must be reflected in the UI but also enforced by server functions.

### Slice 8 — Offers, coupons, wallet, and subscription

Expand seller offers/coupons into explicit rule builders with preview and validation. Keep unsupported advanced rules visibly disabled until backend support is complete.

Build a wallet panel with available balance, pending deposits, ledger entries, spend category, credits/ad credits, and top-up reconciliation. Build a subscription panel with current tier, renewal date, price/configuration, auto-renew toggle, renewal preview, insufficient-balance outcome, and downgrade explanation. Do not show seller withdrawal controls.

### Slice 9 — Notifications, Agent, and admin-controlled flags

Add seller and buyer operational notification deep links. Separate transactional, operational, and marketing notifications. Add Agent action cards only when Pro and AI flags allow them. A proposed action must show what will change, why it was suggested, affected facility/product, expected cost, and confirmation requirement.

The global kill switch must hide Agent mode, recommendation, automated availability, and AI action controls while leaving manual flows intact. Media UI stays hidden when disabled.

### Slice 10 — Responsive and accessibility hardening

Validate desktop side sheets/split layouts, mobile bottom sheets, seller daily operations, keyboard navigation, visible focus, semantic labels, screen-reader status, contrast, reduced motion, touch targets, and error recovery. No action should depend on hover or color alone.

## Frontend contract rules

Use the existing TanStack Start server-function pattern and typed return values. Do not build an alternate fetch abstraction. Keep mutation loading and error states local to the panel. Use optimistic updates only for low-risk reversible edits; use explicit refetch/invalidation for auth, wallet, subscription, payment, inventory reservations, and transaction state.

Never infer ownership from client state. Never compute spendable wallet balance entirely in the client. Never show a purchase button based only on a facility card’s visual status. Server eligibility is authoritative.

## Visual and motion rules

Use Omni’s warm cream/white spatial field surrounding a grey/black-water and white-land globe, frosted glass, soft shadows, rounded geometry, premium typography, restrained orange accent, and quiet-but-populated map treatment. Make the exact browser-derived user pin visibly distinct from facility pins. Resting discovery uses sparse real facility points without fake markers or a wall of country/city text. Active geographic highlights use black or near-black emphasis with restrained opacity; orange is reserved for Omni actions and pins. Keep entering/exiting panel motion short and use transform/opacity rather than layout animation. Avoid generic dark SaaS dashboards, neon/cyberpunk styling, heavy 3D, and permanent top-left branding on the buyer map.

The globe reveal is the principal exception to short UI motion: it may take longer because it communicates geography, but it must be triggered only by a real/restored search, interruptible, pausable, and reduced-motion aware. Manual zoom/pan remains user-controlled.

## Acceptance test matrix

| Area | Required browser scenario |
|---|---|
| Globe/location | Open `/carte`; confirm native permission is requested on arrival without a blocking card, real marker only after permission, truthful fallback after denial, grey/black-ocean white-land globe projection, horizontal center/longitude rotation, pause/resume, and no decorative substitute. |
| Resting discovery | Open `/carte`; verify sparse real source-backed claimed/unclaimed facility points, no fake markers, no naked map, and suppressed country/city labels at globe scale. |
| Manual navigation | Zoom, pan, recenter, and open a panel before searching; verify no staged reveal or forced camera reset. |
| Reveal | Submit a real search from a clean state; observe continent, country, region/local-area, and exact-position pauses with black/near-black boundary emphasis before final pins/cards. |
| Auth | Log out; submit a query; verify no full search occurs before auth; log in; verify exact query and parameters restore. |
| OSM | Open an unclaimed OSM facility; verify source/status/claim CTA and absence of purchase intent. |
| Claimed | Open a claimed/certified facility; verify product context, availability CTA, and eligible purchase intent. |
| Availability | Test manual request, bulk request, quota display, seller response states, ranking, and best-option guidance. |
| Transaction | Verify purchase intent, QR, seller verification, buyer payment confirmation, fulfilment, receipt confirmation, and completed timeline states. |
| Seller onboarding | Create or load a seller; complete facility/catalogue/inventory/verification/plan steps; verify clear limits and errors. |
| Catalogue | Create/edit/pause/archive product; apply facility override; verify allocation and publication state. |
| Inventory | Receive, adjust, reserve, release, and fulfil stock; verify movement history and low-stock alert. |
| Wallet | Start deposit, inspect pending/approved state, view ledger, spend on a campaign, and confirm pending funds are not spendable. |
| Subscription | Toggle auto-renew, inspect renewal preview, simulate insufficient balance, and verify Free downgrade messaging. |
| Agent | Confirm Agent is hidden when disabled; enable safe fixture; verify recommendation/action confirmation; kill switch restores manual-only UI. |
| Search controls | Verify the dock’s named rows keep quantity/budget separate from location, result count, availability, and the no-results request surface; remain visible/editable on mobile; and survive auth restoration. |
| Responsive | Repeat key buyer/seller flows on mobile viewport with accessible focus and no clipped sheets. |

## Completion gate

Do not call this build prompt complete until all required manual flows work with AI disabled, all plan/ownership rules are visible and server-enforced, the MapLibre globe and staged reveal are verified, OSM unclaimed facilities remain non-purchasable, and the regression suite covers the previously accepted buyer availability and Lot E transaction flow.
