# Omni V1 Continuity and Flow Convergence Plan

## Goal

Bring the current production Omni application into full alignment with the newly supplied buyer, seller, availability, transaction-chat, QR, payment-choice, wallet, onboarding, and data-contract specifications **without regressing the existing product direction**. The current MapLibre globe, global OSM discovery, real backend contracts, PWA surface, and already-published map-first work remain in place. The supplied one-shot V1 document is treated as a detailed UX and state-contract reference, not as permission to replace the production architecture with a Mercator-only mock application.

The final product loop must be reliable and traceable:

> Search → discover → facility/product → availability check → response comparison → purchase intent → shared buyer/seller transaction chat → QR generation and verification → payment method declaration → seller payment confirmation → fulfilment/receipt confirmation → completed transaction.

## Decisions locked before implementation

| Decision | Implementation consequence |
| --- | --- |
| Preserve current production direction | Keep MapLibre globe projection, OSM discovery/backfill, Neon/Postgres, TanStack Start server functions, PWA, and current deployment path. Do not rebuild the app around the mock-only adapter or remove global discovery. |
| Use the supplied documents as the canonical flow contract | Consolidate their state machines, copy rules, CTA rules, data contracts, and failure branches into one repository master document and an implementation matrix. Resolve conflicts in favor of the current production architecture while preserving the stricter flow behavior. |
| Centered, layered panels replace side-panel drift | Rework the shared overlay system so search refinement, facility detail, availability, wallet, QR, and seller actions use centered glass sheets or focused full-screen transaction surfaces. The map remains visible behind every map-context surface; only the transaction screen may become full-screen. |
| One shared transaction thread | Buyer and seller open the same transaction record and the same interleaved event/message timeline. Their available primary action is role- and state-dependent, with exactly one primary action visible per role at a time. |
| QR is shareable and account-bound | The buyer can display, copy, or share a QR link/code. A seller opening the link is routed through authentication when necessary, the token is verified server-side, and the correct transaction chat reopens without creating a duplicate transaction. Physical camera scan and manual code entry remain equivalent entry points. |
| Omni does not process buyer payment in-app in the current V1 | The buyer declares a payment method and preference, such as cash on delivery, TMoney, Flooz, or another supported external method. Omni records the choice and exposes seller payment contact details only at the permitted transaction state. The seller confirms receipt; payment status is never written from the buyer’s claim alone. |
| Wallet recharge is separate from purchase payment | FedaPay remains a hosted recharge flow for the single Omni Wallet. It must not be conflated with external buyer-to-seller payment. Wallet allocations should not remain read-only in V1, with no seller withdrawal CTA. |
| Bulk availability is limited maybe in free plan not paid, single-target is not | A bulk request may target at most 12 facilities and consumes the applicable monthly bulk quota. A single-facility availability request remains available even when the bulk quota is exhausted. Buyer budget remains private and is never included in the seller-visible payload. |
| Honest facility and transaction states | Unclaimed, claimed, certified, confirmed, and suspended facilities remain distinct. Suspended facilities leave public discovery. Availability, QR, payment, cancellation, timeout, and completion states are visible with recovery actions rather than silent toasts or indefinite loading. |

## Phase 0 — Reconcile the master specifications and current code

First, create one repository source-of-truth document that merges the existing Omni master/interface specification with the three supplied documents and the new continuity requirements. The document will explicitly mark what is retained, what is refined, and what remains V2. It will include the scene grammar, component hierarchy, role/state matrix, backend contracts, security rules, copy rules, and the complete flow diagrams.

Next, audit the current implementation against that document. The audit will classify each requirement as already implemented, partially implemented, backend-blocked, UI-only debt, or intentionally deferred. It will specifically inspect `CartePage`, `FacilityPanel`, `DemandRequestPanel`, `TransactionThreadCard`, `CheckoutPanel`, `vendeur.tsx`, wallet/payment functions, auth flow, navigation, notification surfaces, and the existing database migrations. No code will be changed during this audit phase.

**Exit criteria:** one approved master document, one gap matrix, and an explicit list of contracts that can be implemented without migration versus contracts requiring database or server-function changes.

## Phase 1 — Establish canonical contracts and state machines

Define or reconcile shared TypeScript contracts for facility state, product state, availability status, transaction status, transaction event types, payment preference, payment status, QR link state, wallet recharge state, onboarding state, and notification deep links. These contracts will be placed in UI-safe modules and will not import database drivers, secrets, or Node-only code.

Implement explicit transition helpers for the following machines before changing screens: search and auth replay; facility selection and availability; bulk quota versus single target; buyer purchase intent; offer confirmation and QR; QR deep-link authentication; seller verification; payment preference and contact disclosure; seller payment confirmation; buyer fulfilment/receipt confirmation; cancellation and expiry; wallet recharge; seller availability response; and onboarding resume. Each transition helper will reject illegal jumps and return a user-facing recovery state.

Add or strengthen the client/server boundary guard so UI files cannot import server-only modules directly or transitively. Preserve the repository’s current `useServerFn` pattern and server-function architecture instead of introducing a second adapter stack. Where a mock adapter is useful for deterministic UI tests, place it behind the same typed contract without replacing production functions.

**Exit criteria:** transition unit tests cover every happy path and every documented failure branch; boundary checks fail intentionally for a known illegal import and pass for the production graph.

## Phase 2 — Converge the shared map-first scene and centered panel system

Refine the shared scene so the globe is always the background context for search, result, facility, availability, wallet, seller operations, and onboarding surfaces. Establish one overlay host with a consistent centered-sheet behavior, maximum two sheet levels, sticky header/body/footer structure, safe-area handling, 44px touch targets, focus restoration, Escape/back/swipe dismissal, and internal scrolling without page overflow.

Unify the visual language around the existing Omni creamy-glass tokens: warm cream surfaces, restrained orange accent, soft borders/shadows, semantic success/warning/danger tones, and no hard-coded colors scattered through components. Ensure all labels use sentence case and formal French copy. Replace ambiguous labels with verbs and make every error state state the cause and next action.

Preserve the globe animation and location behavior already present in production, but make all camera movements explicit and interruptible. Search must not trigger unrelated quantity/budget layouts. The result rail and selected pin must share one selection state; rail movement must settle before camera recentering. Respect reduced motion.

**Exit criteria:** buyer and seller use the same scene grammar, no side-panel variant remains where a centered panel is specified, and responsive checks show no horizontal overflow at 320, 375, 390, 768, and 1280px.

## Phase 3 — Rebuild buyer search, discovery, facility, and availability composition

Keep the search dock as the dominant entry point. Add the auth gate behavior required by the flow contract: an unauthenticated search may browse public data, but a protected search action preserves query, quantity, and budget in ephemeral router/session state, authenticates, and automatically replays the request after login.

Refine the result rail to prioritize the matched product and price, then availability state, distance, facility identity, certification, and media. Preserve OSM/unclaimed honesty and never show a direct purchase CTA for an unclaimed facility. Facility details will expose only the data allowed at that state; contact and precise directions remain unavailable until purchase intent.

Rework the availability composer into the three documented steps: product, target facilities, and private constraints. The live results phase remains in the same centered surface, keeps the map active behind it, shows response count and SLA, and renders Available, Partial, Unavailable, Awaiting, and SLA-expired states distinctly. A Partial response exposes the offered quantity and price, and each eligible response can enter the purchase-intent flow.

**Exit criteria:** single-target and bulk flows both work; quota exhaustion leaves single-target available; budget is not sent to sellers; closing a request preserves history; timeout and zero-result states have recovery actions.

## Phase 4 — Implement the complete shared transaction chat and QR lifecycle

Replace fragmented buyer/seller transaction surfaces with one shared transaction screen and one interleaved feed of system events and human messages. The screen will show facility/product, quantity, price, coupon calculation, fulfillment/payment preference, progress labels, QR state, event timestamps, and one role-specific primary action.

The buyer path will create intent from an availability response, freeze the quantity and price, validate and apply a coupon server-side, open the transaction chat, and generate the QR only at the contract-defined point. The buyer can enlarge, copy, download/share, or send a deep link for the QR. The shared link must carry only a non-sensitive transaction token and route the recipient to authentication and verification without exposing private transaction data before authorization.

The seller path will receive the same transaction in notifications and console surfaces, open the shared chat, scan the QR with the camera or enter the code manually, and see the transaction move to `seller_verified`. QR replay, expiry, invalid token, wrong seller, and already-completed conditions will be recorded as persistent inline transaction events with retry or terminal explanations.

After verification, the buyer chooses a payment preference: cash on delivery, external mobile money, or another supported external method. For remote/mobile-money payment, the seller’s permitted payment contact information becomes visible in the transaction chat. The buyer can mark that payment was made, but only the seller confirmation or a future authenticated provider callback can write `payment_recorded`. The seller then confirms receipt/dispatch, and the buyer confirms reception. The final event is `completed`; stock reservation release, coupon usage, and facility sales counters update atomically.

**Exit criteria:** both roles see the same transaction thread; QR sharing, deep-link auth, camera scan, and manual code entry converge on one server verification; no buyer-only payment claim can complete a transaction; receipt confirmation and completion are reachable without dead ends.

## Phase 5 — Align seller console, onboarding, catalogue, availability response, and notifications

Refine seller onboarding to be resumable and persistent: identity, facility placement, category, first product, hours, and buyer-facing preview. A published facility remains honestly `claimed` until manual certification. The actual buyer `FacilitySheet` component will be reused for the preview so the two experiences cannot drift.

Refine product creation into a clear progressive flow with essential fields first, media, visibility, optional coupon, summary, and live buyer-card preview. Enforce Free/Pro limits server-side. Coupon creation will support percentage or fixed discount, validity window, optional usage limit and product scope, with validation and a preview of the buyer’s savings.

Implement seller availability responses as one-tap Available/Partial/Unavailable actions. Partial reveals quantity and price overrides inline. A submitted response becomes immutable from the availability console, disappears from pending work, and remains in history. Notifications will be transactional only and deep-link directly to the relevant request or transaction state.

**Exit criteria:** seller can respond to a live request, buyer receives the response, the seller sees only permitted information, and all pending/empty/error states have explicit actions.

## Phase 6 — Harden wallet and FedaPay recharge separately from transaction payment

Consolidate the single Omni Wallet surface for buyer and seller. Show the rechargeable balance, read-only allocations, available-to-allocate calculation, and an explicit statement that allocations are internal and withdrawals are unavailable in V1.

Implement the FedaPay-shaped recharge machine with amount entry, pending, approved, declined, canceled, and timeout states. Credit the wallet only after an authenticated approved callback or verified reconciliation; never optimistically credit on checkout creation. Make retry, cancel, and status-check behavior explicit and idempotent. Reuse the same payment-state helper only where it is semantically appropriate, while keeping wallet recharge and external seller payment clearly distinct in the UI and ledger.

Review the existing multi-bucket wallet ledger migration and reconcile its bucket names and semantics with the supplied contract. Preserve append-only ledger behavior, idempotency, non-negative balances, and allocation-sum invariants. Any migration must be additive, reversible where possible, and applied only after reading/generated SQL, backup verification, and database contract tests.

**Exit criteria:** wallet recharge has deterministic state tests, no duplicate callback credit, no withdrawal path, and no confusion between Omni Wallet funds and buyer-to-seller payment.

## Phase 7 — Implement auth replay, onboarding recovery, notifications, and admin boundaries

Ensure the auth gate works from search and transaction actions, with a bounded five-second auth check and preservation/replay of the original context. New accounts route through resumable buyer or seller onboarding and never land in an indefinite loading state.

Add or refine transactional notification deep links for availability responses, purchase intent, QR, payment, and completion. Remove promotional or V2-only notifications from the V1 experience. Keep the buyer/seller role switch in the intended chrome location and prevent non-V1 entries from reappearing in the hamburger menu.

Define the minimal admin certification queue and metrics header behind explicit authorization. Unauthorized users see an intentional access state, never a blank screen or redirect loop. No fraud scoring, AI agent console, or campaign builder is added.

**Exit criteria:** auth, onboarding, notification, and admin authorization branches are testable independently and have no dead ends.

## Phase 8 — Backend schema and invariant enforcement

Map every UI-safe contract to the current Neon/Postgres schema and existing migrations. Add only the missing tables/columns/indexes/constraints needed for users, facilities/media, products/reservations, availability requests/targets, transactions/events/messages, coupons, seller plans, wallet/recharges, payment preferences, QR verification, fulfilment confirmations, notifications, and admin certification evidence.

Enforce at the server/database boundary: facility state ownership and certification rules; product limits; active product filtering; quantity reservation with atomic conditional updates; maximum 12 availability targets; bulk quota before insertion; budget isolation from seller payloads; SLA expiry; legal transaction transitions; QR uniqueness/expiry/replay protection; coupon validity and usage increment on completion; seller-only external payment confirmation; wallet callback idempotency; and role-based access to transaction messages/events.

Add indexes for public discovery, facility/product joins, pending availability, transaction participants, QR lookup, notification deep links, and wallet ledger reconciliation. Add migration tests and concurrent reservation tests before production deployment.

**Exit criteria:** every business rule in the data document has a server-side enforcement point and a test; no rule exists only as a disabled button in the UI.

## Phase 9 — Test matrix and certification

Run unit tests for state transitions, price/coupon calculation, quota behavior, payment preference visibility, QR token validation, duplicate/expired scans, wallet recharge outcomes, auth replay, onboarding resume, and CTA uniqueness. Run server/integration tests for permission boundaries, budget isolation, transaction sequencing, stock reservation concurrency, coupon usage, wallet callback idempotency, and facility state transitions.

Run browser E2E scenarios in both roles:

1. Anonymous browse → search submission → auth gate → preserved query replay.

1. Search → result rail → facility detail → single-target availability.

1. Search → bulk availability up to 12 → quota exhaustion → single-target fallback.

1. Seller response Available, Partial, Unavailable, and SLA expiry.

1. Buyer selects offer → coupon applied → transaction chat opens → QR generated.

1. Buyer shares QR by code/link → seller authenticates if needed → seller verifies via manual code and camera fallback.

1. Buyer selects cash/mobile-money preference → permitted seller contact disclosure → buyer marks paid → seller confirms payment → buyer confirms reception → completed.

1. QR replay, expired QR, wrong seller, canceled intent, declined payment, and stock shortage recovery.

1. Wallet recharge pending, approved, declined, canceled, timeout, retry, and duplicate callback.

1. Seller onboarding, first product/coupon, buyer-facing preview, availability response, wallet and notification deep links.

Certify at 320, 375, 390, 768, and 1280px with keyboard navigation, reduced motion, safe areas, no unwanted mobile input zoom, no horizontal overflow, stable map context, recoverable loading states, and functional camera permission/fallback on a real HTTPS mobile device.

## Phase 10 — Production rollout and reporting

Before deployment, run Prettier, TypeScript, unit/integration tests, build, client-boundary guard, migration verification, and secret scanning. Commit atomically per phase with a focused message and push only validated commits to `main`.

Deploy behind reversible flags where backend contracts or payment preference disclosure are new. Verify production HTTP status and SSR hydration for all routes, then execute the buyer and seller E2E matrix with a seeded test account and non-production payment configuration. Monitor QR validation latency, auth replay errors, availability SLA expiry, payment callback reconciliation, and transaction completion events.

The final report will include the source-of-truth document, state/contract matrix, migration list, test results, production evidence, known limitations, and the exact V2 boundary. It will explicitly distinguish what is certified in the sandbox, what is certified in production, and what still requires a physical mobile device or external payment-provider sandbox.

## Assumptions and open risks

The plan assumes that continuity means preserving the current globe/OSM/real-backend direction, as clarified in the latest attachment. If the user instead wants the mock/Mercator document to become the production scope, this plan must be revised before implementation.

The exact external mobile-money provider contracts, seller contact disclosure policy, fulfillment vocabulary, and whether a future Omni-internal payment should be enabled are open backend decisions. The UI will model these as typed states and provider-neutral choices until the real provider/API contract is approved.

The current repository already has substantial transaction, wallet, OSM, camera, and map infrastructure. The implementation will therefore favor incremental extraction, shared state machines, and additive migrations over a greenfield rewrite. Any conflict between an uploaded mock-only instruction and the current production contract will be recorded in the reconciliation document and resolved before code changes.

## Definition of done

The work is complete when the current production map-first experience remains intact, every specified user flow is reachable from search through completion, buyer and seller share one transaction thread, QR code/link/manual/camera paths converge on the same protected transaction, external payment choices are recorded without falsely claiming Omni processed the payment, wallet recharge is independently correct, all server-side invariants are enforced, all documented error branches have recovery actions, and the full test and production certification matrix passes.

