# Omni V2 — Product Requirements Document

**Document ID:** `OMNI-V2-PRD-001`

**Version:** 1.0.0

**Status:** Approved product baseline for implementation planning

**Owner:** Omni product team

**Author:** Manus AI

**Date:** 2026-08-21

**Canonical flow source:** [`v2-flow.md`](./v2-flow.md)

> This PRD defines what Omni V2 must accomplish for users and operators. The canonical flow contract defines the authoritative states, transitions, permissions and proof boundaries. Neither document restores V1 implementation. Any future change to product identity, money movement, privacy, authority, state or scope must update the appropriate authoritative document before implementation artifacts are regenerated.

## 1. Executive summary

Omni V2 is a **global geospatial supply-and-demand search engine**. It helps a person search for a product or need, discover source-backed facilities on a live MapLibre globe/map, inspect a facility’s real catalogue, verify availability, compare responses and initiate a controlled purchase flow. The product continues through a transaction room with a server-generated QR, external payment declaration, fulfilment, receipt confirmation and rating.

Omni is map-first rather than catalogue-grid-first. The facility is the core supply object, the catalogue is the bridge between place and demand, and sheets/cards are temporary surfaces above a persistent map. Public discovery is intentionally separate from private transaction data: a public pin may prove that a facility exists in a source, but it does not prove inventory, certification, contact access or seller identity.

V2 is a clean-slate rebuild. The current production V1 remains protected on its own branch, tag and database branch. This PRD describes only the new product contract and does not require V1 code, migrations or UI components.

## 2. Problem statement

People often know what they need but do not know which nearby facility has it, whether it is available now, how much it costs, or how to complete a trusted handoff. Existing discovery tools separate maps, directories, messaging and purchase coordination. They also make it difficult to distinguish public place data from verified supply data.

Sellers face the inverse problem. They need a clear way to establish facility identity, publish a trustworthy catalogue, answer availability requests, receive controlled purchase intents and complete handoffs without exposing private information too early or operating a full in-app payment processor.

Admins need a reviewable trust boundary. A public facility must not become claimed merely because a user clicks a button. Evidence, review outcome, operational sales and entitlement state must remain separate and auditable.

## 3. Product vision and desired outcome

Omni should make the following promise credible:

> **Search for what you need, see where a real source-backed facility may have it, verify availability, and complete a traceable handoff without losing the map context.**

The desired user outcome is that a buyer can move from a vague need to a trustworthy, resumable transaction without guessing which screen to use or when private seller data becomes available. The desired seller outcome is that a legitimate facility can progress from public/unclaimed presence to reviewed and operational supply through a clear evidence and catalogue workflow.

The desired operator outcome is that every trust-sensitive or money-adjacent state has an explicit authority, audit trail, recovery path and admissible proof.

## 4. Product principles

| Principle | Requirement consequence |
| --- | --- |
| Map is the scene | The active map remains mounted through discovery, catalogue, availability and comparison. |
| Facility before transaction | Product, availability and purchase intent are always contextual to a facility. |
| Public data is not supply proof | Source-backed pins may be shown publicly but never imply verified inventory. |
| Catalogue before free text | Buyers select a real catalogue product whenever one exists. |
| Explicit unlocks | Contact, itinerary, private chat, QR and seller-sensitive data open only after named server transitions. |
| Server authority | Client text, displayed price, status, QR and availability never advance business state. |
| External payment in V1 | Omni records external payment declarations and confirmations; it does not operate buyer-seller payment or withdrawals. |
| Resumability | Closing a surface must preserve the exact unfinished context unless the user explicitly cancels. |
| Honest states | Loading, empty, unavailable, denied, expired, replayed and error states are first-class product states. |
| Manual proof before AI | Manual actions must work and be measurable before AI orchestration is introduced. |

## 5. Users and actors

### 5.1 Visitor

A visitor can open Omni without an account, observe the globe, search public data, inspect public facilities and view public catalogue content. The visitor is invited to authenticate only when a protected action requires it. The visitor must never receive private contact, itinerary, transaction chat, QR or purchase access through a public route.

### 5.2 Buyer

A buyer searches for a product or need, selects a catalogue product, chooses scope and constraints, requests availability, compares responses, creates a purchase intent and completes the authorized transaction flow. The buyer can declare an external payment method and confirm receipt, but cannot verify a seller QR, confirm seller payment receipt or advance seller-owned states.

### 5.3 Seller

A seller establishes identity and facility evidence, submits verification, manages eligible facilities and products, publishes offers/coupons, receives availability requests, corrects or answers responses, verifies QR, confirms external payment receipt and completes fulfilment. The seller cannot directly certify a facility, fabricate discount state, exceed real stock or withdraw from the Omni Wallet in V1.

### 5.4 Admin

An admin reviews evidence and produces explicit audited outcomes. Admin actions must identify actor, reason, timestamp and evidence context. A generic direct status mutation is not a product capability.

## 6. Jobs to be done

| Actor | Job | Desired result |
| --- | --- | --- |
| Visitor | “I want to know what Omni is and whether it can help me without filling a form first.” | The globe, dock and public discovery loop are understandable immediately. |
| Buyer | “I need a product near me and want evidence it is actually available.” | A catalogue-backed availability comparison with honest freshness and constraints. |
| Buyer | “I decided to buy but may need to leave and return later.” | A resumable transaction room with a clear next action. |
| Buyer | “I paid externally and need the seller to acknowledge the handoff.” | A traceable payment declaration, fulfilment and receipt sequence. |
| Seller | “I have a facility or public place and want to prove it is mine.” | Persistent evidence request, review outcome and clear next onboarding step. |
| Seller | “I want to publish only what I can actually supply.” | Catalogue, stock allocation, offer and coupon controls with server validation. |
| Seller | “A buyer is in front of me with a valid Omni transaction.” | Camera/manual QR verification and controlled fulfilment actions. |
| Admin | “I need to make trust decisions without bypassing audit.” | Evidence queue, review context, explicit outcome and history. |
| Operator | “I need to understand whether discovery and transactions are working.” | Consent-aware, minimized, pseudonymous events and operational observability. |

## 7. Goals and success measures

### 7.1 Product goals

1. Make map-first discovery the default experience rather than a marketing landing page or conventional ecommerce grid.
2. Make the buyer journey complete from search through catalogue, availability, comparison, intent, QR, external payment, fulfilment, receipt and rating.
3. Make seller verification and facility lifecycle explicit, reviewable and impossible to bypass from the client.
4. Make seller operations as map-first, clean and comprehensible as the buyer experience.
5. Make the single Omni Wallet understandable as platform credit infrastructure, not buyer-seller payment or seller payout.
6. Make every critical flow resumable, responsive and honest about failure.
7. Establish production-grade proof boundaries before adding AI orchestration or native mobile.

### 7.2 Outcome metrics

| Outcome | Initial measurement | Target direction |
| --- | --- | --- |
| Search usefulness | Percentage of valid searches returning at least one source-backed result or a useful empty-state action | Increase without fabricating coverage. |
| Discovery comprehension | Visitor/buyer completion of search → facility selection without dead-end or accidental claim | Increase. |
| Catalogue relevance | Percentage of availability requests linked to an existing catalogue product when one exists | Increase toward full catalogue-first compliance. |
| Availability usefulness | Requests reaching an explicit available/partial/unavailable comparison state | Increase; reduce silent failures. |
| Intent quality | Eligible comparison responses that produce exactly one resumable transaction context | Increase; zero duplicate transactions. |
| Transaction completion | Intents reaching receipt confirmation and rating where the parties continue the flow | Increase with visible recovery. |
| Seller activation | Verified facilities that publish a valid product and receive an operational request | Increase. |
| Trust integrity | Facility status changes with complete evidence/review audit context | 100%. |
| Wallet integrity | Confirmed recharge ledger events whose spendable balance matches server state | 100%. |
| Recovery quality | Critical failures with preserved context and a valid retry/back path | 100% for required states. |
| Mobile usability | Required flows passing 320/375px checks without horizontal overflow or lost focus | 100% of release criteria. |

Targets are intentionally directional until baseline instrumentation is available. The first release must establish event definitions and denominators before committing to numeric growth targets.

## 8. Scope gate

| Capability | Status | V2 requirement |
| --- | --- | --- |
| Live MapLibre globe/map | Build now | Real globe projection, sparse geography, slow horizontal idle rotation and persistent scene. |
| Buyer search and discovery | Build now | Search by catalogue-aware intent, visible-bounds discovery, source-backed pins, clustering and result states. |
| Facility detail and catalogue | Build now | Public facility sheet, media, matched product, products sheet and honest empty/error states. |
| Availability and comparison | Build now | Named four-stage flow, Free/Pro scope enforcement, real responses and eligibility-gated intent. |
| Purchase intent | Build now | Idempotent server action and immutable transaction snapshot. |
| Transaction room and timeline | Build now | One authorized room with actor-specific next action, messages and resume. |
| QR generation and seller verification | Build now | Expiry, replay safety, camera preview, manual fallback and mismatch states. |
| External payment and fulfilment | Build now | Method selection, buyer declaration, seller confirmation, fulfilment, receipt and rating. |
| Facility verification/onboarding | Build now | Evidence draft/submission and audited certified/unconfirmed/rejected outcomes. |
| Seller workspace | Build now | Map-first facility operations, requests, catalogue, coupons and scanner. |
| Omni Wallet recharge | Build now | One wallet, FedaPay recharge only, pending/confirmed/failed states and platform spending. |
| PWA | Build now | Responsive mobile web, safe areas, dynamic viewport and resumability. |
| OSM/Overpass backfill | Build-manual | Server adapter, bounded viewport import, dedupe, observability and operator recovery. |
| Admin evidence review | Build-manual | Human review queue and audited outcomes. |
| AI orchestration | Deferred | No AI-driven mutation or assistant before manual loop proof. |
| Native mobile apps | Deferred | Reassess after PWA production verification. |
| Buyer-seller in-app payments | Deferred/not in V1 | External payment declarations only. |
| Seller withdrawal/payout | Deferred/not in V1 | Must not appear in UI or API. |
| Instant global prepopulation | Deferred | No promise of an unrestricted global dataset. |

## 9. Non-goals

Omni V2 is not a generic social network, public chat application, conventional ecommerce cart, seller payment processor, seller withdrawal product, marketing landing page, decorative globe, unrestricted global data dump or AI chatbot that replaces unproven manual operations.

The product will not present disabled or fake actions for future capabilities. If a menu item, button or route is visible, it must map to an implemented or explicitly manual operation with a clear status.

## 10. End-to-end buyer requirements

### 10.1 Arrival and location

The buyer must enter a real MapLibre globe in `idle_globe`. The globe rotates slowly from left to right like a human viewing a rotating globe. The arrival experience must not automatically search, auto-zoom into an arbitrary place or replace the globe with a flat grey/black map. An explicit valid search enters `search_reveal`, which is cancellable and yields `results_visible` or `empty_results`; it never owns the camera after manual interaction.

Location permission may be requested without blocking the globe. Exact browser location, approximate context, denied/timeout and fallback-market states must be visibly distinct. A blue marker is allowed only for a fresh browser fix with acceptable accuracy. Approximate location must not be labelled exact.

### 10.2 Search dock

The buyer must see one primary search row and one Options chevron. The chevron contains filters and constraints instead of producing multiple competing controls. Quantity and budget are hidden until relevant, manually editable and budget supports unlimited. Typing must not change the map camera or switch to a different quantity/budget view.

Enter and the search button must use the same guarded submission path. Search failures preserve the query and options, show a retry and never leave the user in a blank or unexplained state.

### 10.3 Discovery and result cards

Discovery is bounded by the visible map viewport. Low zoom uses clusters and local result framing uses individual source-backed pins. Results show the matched product first, facility identity, media when available, public status/trust, distance, price/offer, product count and one next action.

Selecting a card selects a facility only. The card must not claim the facility, request availability or create an intent. The result set, selected state and map context survive closing and reopening the facility sheet.

### 10.4 Facility detail and catalogue

The facility sheet displays public identity, media, search context, trust/status, address, public hours/open state, matched product and product count. Unclaimed facilities show public content and a seller verification request action only; they do not expose private contact or transaction actions.

The catalogue sheet loads active facility products, places the matched product first, displays media, price, discount/offer state and quantity eligibility, and supports explicit selection. Product selection is required before availability when a catalogue product exists.

### 10.5 Availability and comparison

Availability is presented as `Produit → Portée → Contraintes → Réponses`. Free mode targets one eligible facility. Pro bulk mode is bounded by server entitlement and visible scope. A check does not reserve inventory.

Responses are ordered available, partial, unavailable, then price. Each response displays facility, product, freshness, quantity, price, offer and seller message. Only eligible responses expose the purchase-intent CTA. Contact and itinerary remain locked.

### 10.6 Intent and transaction

The buyer can create intent only from an eligible response. The action enters `intent_submitting`; the server must make the operation idempotent and either return the existing context or create exactly one transaction context. The transaction room snapshots product, facility, quantity, gross price, coupon/discount and net amount.

The transaction room must be resumable from notifications, menu, orders or a visible resume bar. It contains the canonical event timeline and actor-specific next action. Private contact, itinerary and transaction chat unlock only after the intent transition.

### 10.7 QR, external payment and completion

The transaction enters `qr_generated` when the server creates the QR with expiry, transaction binding and replay state. The seller sees a prepared camera preview after permission, with manual code fallback. The buyer does not pay inside Omni in V1. The buyer selects cash, TMoney, Flooz or another external method; the transaction enters `payment_declared`; the buyer then waits for seller confirmation.

The seller confirms receipt and fulfilment. The buyer confirms receipt and then rates. The transaction closes only after the authorized sequence reaches `transaction_completed`.

## 11. End-to-end seller requirements

### 11.1 Seller entry and education

Seller onboarding must explain the facility lifecycle before asking for catalogue enrichment. It must distinguish an unclaimed public facility from a verification request, a certified outcome, an unconfirmed operational state and confirmed status.

The onboarding flow must persist drafts, support retry and clearly explain that selecting or claiming a facility does not itself change status.

### 11.2 Verification and facility lifecycle

A seller can select an unclaimed facility or create a facility. The resulting request follows `verification_requested → evidence_draft → evidence_submitted → admin_review`, then produces `certified`, `unconfirmed` or `rejected` with reason, actor and audit history. A rejected request can return to a new verification request or remain unclaimed according to the audited decision.

After certification, channel participation may be offered but remains optional. An unconfirmed facility can list according to the product policy. The rule is defined by three qualifying completed Omni sales: when the server confirms them, the non-cash $20 platform bonus unlocks. The bonus cannot be withdrawn and is not spendable before unlock.

### 11.3 Seller workspace

The seller dashboard must be map-first and facility-first. The central view is the map with owned facilities and operational state; operational surfaces appear above it as focused sheets or panels. The seller must not receive a second unrelated global navigation bar or a menu full of unavailable actions.

The primary seller actions are facility operations, products, requests, scanner, coupons and valid advertising/account features. A product form must make name, media, price, stock, Omni allocation, offer/coupon and publication state understandable in one guided flow.

### 11.4 Requests and availability

The seller sees incoming availability requests with product, quantity, constraints, buyer context allowed by policy and response deadline/freshness. The seller can answer available, partial or unavailable. If an automated response is corrected, the correction must be explicit, audited and visible to the buyer where appropriate.

### 11.5 Scanner and transaction operations

The scanner must have states for idle, permission requesting, `camera_active` live preview, denied, unsupported, error and stopped. Camera permission is requested from a user gesture. Manual code fallback is always available when camera or decoder support is absent.

After QR verification, the seller sees the transaction timeline and only the seller action allowed by the current state: confirm external payment receipt, mark fulfilment, or resolve an operational exception. The seller cannot advance buyer receipt or rating.

## 12. Admin and operational requirements

Admin review must show a queue of pending evidence, claimant/facility context, evidence stages, audit history and the outcome controls. The outcome control must require explicit status, reason and actor context. Review actions must be idempotent and protected by role authorization.

The discovery operator surface must expose viewport backfill status, source, dedupe outcome, errors, retry state and coverage freshness without exposing raw secrets. The system must distinguish no data from import failure.

## 13. Wallet and monetization requirements

Omni presents one rechargeable Omni Wallet. Users add money through FedaPay. A server-confirmed callback moves a recharge from pending to the `wallet_available` state. Failed, cancelled or expired recharges remain non-spendable and provide retry/reconciliation guidance.

Wallet spending may fund Omni subscriptions, Pro access, advertising, coupon/ad credit and other platform features explicitly enabled by policy. The UI must not imply that the wallet is a buyer-seller payment rail. Seller withdrawal and payout must be absent from V2 V1-scope UI and API.

Pro is an entitlement layer and cannot manufacture certification. Free/Pro scope, limits, analytics and automation are server-authoritative. The $20 seller bonus is platform-restricted credit, not cash.

## 14. PWA and responsive requirements

The web app is the immediate mobile product. It must support dynamic viewport units, safe-area insets, install prompts that do not interrupt critical flows, network-first private data and resumable transaction context.

The release must be tested at 320, 375, 768 and 1280px. At each width, the map remains visible, sheets do not create horizontal overflow, cards remain fully readable, the keyboard does not cause unwanted zoom, search focus does not move the camera, controls do not overlap and footer actions remain reachable.

## 15. Functional requirements matrix

| ID | Requirement | Priority | Acceptance summary |
| --- | --- | --- | --- |
| FR-MAP-001 | Real globe scene | P0 | First load shows MapLibre globe with idle horizontal rotation. |
| FR-MAP-002 | Camera priority | P0 | Manual interaction cancels automated reveal and pauses rotation. |
| FR-MAP-003 | Visible-bounds discovery | P0 | Server request uses visible bbox and returns only source-backed facilities. |
| FR-MAP-004 | Clustering | P0 | Low zoom clusters; local zoom shows individual relevant pins. |
| FR-LOC-001 | Location states | P0 | Exact, approximate, denied/timeout and fallback states are distinct. |
| FR-SEARCH-001 | Single dock | P0 | One search row and one Options chevron contain the search controls. |
| FR-SEARCH-002 | Guarded submit | P0 | Enter and button share one path with loading, error and duplicate protection. |
| FR-SEARCH-003 | Catalogue-aware query | P0 | Existing catalogue product is preferred over forcing free text. |
| FR-RESULT-001 | Contextual cards | P0 | Cards show matched product, media, facility, status, distance and offer. |
| FR-RESULT-002 | Selection boundary | P0 | Card click selects only; no claim, availability or intent. |
| FR-CAT-001 | Product selection | P0 | Catalogue returns typed selection and handles empty/sold-out/error states. |
| FR-AVAIL-001 | Four stages | P0 | Product, scope, constraints and responses are named and resumable. |
| FR-AVAIL-002 | Entitlement scope | P0 | Free/Pro scope is server-authoritative and bounded to visible facilities. |
| FR-AVAIL-003 | Comparison | P0 | Responses order by availability then price and expose CTA only when eligible. |
| FR-VERIFY-001 | Evidence request | P0 | Claim/create action creates a request, never a status mutation. |
| FR-VERIFY-002 | Admin outcome | P0 | Only audited review yields certified, unconfirmed or rejected. |
| FR-SELL-001 | Seller map-first workspace | P0 | Seller operations remain anchored to owned facilities on the map. |
| FR-SELL-002 | Product/coupon form | P0 | Valid product, stock allocation and honest offer state are server-validated. |
| FR-TRANS-001 | Intent idempotency | P0 | One eligible response produces one transaction context. |
| FR-TRANS-002 | Resume | P0 | Closed transaction resumes at the exact persisted state. |
| FR-TRANS-003 | Timeline | P0 | Canonical transaction stages and actor actions are visible. |
| FR-QR-001 | QR security | P0 | QR has expiry, transaction binding and replay-safe redemption. |
| FR-QR-002 | Camera preview | P0 | Permission, preview, decoder absence and manual fallback are explicit. |
| FR-PAY-001 | External payment | P0 | Method, declaration, seller confirmation and fulfilment are recorded. |
| FR-WALLET-001 | Single wallet | P0 | FedaPay recharge is the only deposit rail and pending is not spendable. |
| FR-PWA-001 | Responsive PWA | P0 | Required widths pass no-overflow and focus/safe-area checks. |
| FR-ANALYTICS-001 | Consent-aware events | P1 | Events are pseudonymous/minimized and omit raw sensitive payloads. |
| FR-OSM-001 | Bounded coverage | P1 | Backfill is viewport-bounded, deduplicated and observable. |
| FR-AI-001 | AI orchestration | Deferred | No AI mutation or assistant is required for V2 initial release. |

## 16. Non-functional requirements

### 16.1 Security and privacy

The client must not import server-only modules, secrets, database drivers or platform-only APIs. All sensitive transitions pass through typed server functions or routes. QR tokens, credentials, payment secrets, raw GPS and private chat contents must not enter generic analytics.

Authorization must be checked server-side for every private route, transaction action, evidence review action, wallet operation and seller-owned mutation. Idempotency keys and transaction locks are required for intent, QR redemption, payment declarations, fulfilment transitions, review outcomes and wallet ledger mutations.

### 16.2 Reliability and recovery

Every required flow must have loading, ready, empty, error, retry, cancellation, unauthorized, expired and offline behavior where applicable. Inputs and context survive network failures unless the user explicitly cancels. Duplicate submissions return the existing authoritative result or a clear rejection.

### 16.3 Accessibility

All controls must be keyboard reachable, have visible focus, expose semantic names and preserve focus when sheets open or close. Motion must respect `prefers-reduced-motion`. The map must not be the only way to access a result or next action.

### 16.4 Observability

Critical mutations emit structured audit events with safe identifiers, actor, action, prior state, next state, timestamp, idempotency key and failure reason. Product analytics remain separate from sensitive audit data. Operators must be able to distinguish discovery emptiness, source failure, authorization failure and connectivity failure.

### 16.5 Performance

The map scene should remain interactive while panels load. Search input must remain responsive and must not trigger unnecessary map rerenders. Result cards, sheets and transaction data should load incrementally. Camera preview setup must not block the rest of the seller workspace.

## 17. Release acceptance criteria

### 17.1 Buyer release gate

The buyer gate passes when an unauthenticated visitor can open the globe, search, see source-backed results, select a facility, open its catalogue, select a product, complete the four-stage availability flow and see honest results without a dead end. The authenticated buyer gate additionally requires idempotent intent, transaction resume, QR generation, external payment declaration, fulfilment, receipt and rating.

### 17.2 Seller release gate

The seller gate passes when an eligible seller can start or resume evidence, submit for review, see the audited outcome, publish a valid product/coupon, receive and answer a request, open the scanner, verify a valid QR or use manual fallback, confirm payment receipt and complete fulfilment.

### 17.3 Trust and money gate

The trust and money gate passes when no client-only action changes facility status, product price/stock authority, transaction state, QR validity or wallet availability. FedaPay confirmation is reconciled server-side. Buyer-seller payment remains external and seller withdrawal is unavailable.

### 17.4 Mobile gate

The mobile gate passes at 320, 375 and 768px, with desktop confirmation at 1280px. No required flow has horizontal overflow, hidden footer action, impossible safe-area placement, unwanted input zoom, lost focus or overlapping controls.

### 17.5 Evidence required

| Proof | Required evidence |
| --- | --- |
| Build and trust boundary | Production build, type check and client-boundary check. |
| Pure state logic | Unit tests for state transitions, ordering, idempotency and entitlement boundaries. |
| Public routes | Smoke checks for route availability and safe error responses. |
| Authenticated buyer | Browser click-through with context restoration. |
| Authenticated seller | Seller workspace, request, scanner and transaction action proof. |
| Real camera | HTTPS permission, live preview, decode and cleanup evidence on a camera-capable device/browser. |
| QR security | Expiry, replay, mismatch and duplicate redemption tests. |
| Wallet | FedaPay test callback/reconciliation proof and pending/available/failed ledger checks. |
| Responsive UI | Captures or automated checks at required viewport widths. |
| Production E2E | Safe fixture transaction with audit convergence and no duplicate events. |

## 18. Delivery phases

| Phase | Outcome | Exit condition |
| --- | --- | --- |
| 0. Contract and foundation | V2 flow, PRD, design tokens, route/surface contract and test strategy | No blocking ambiguity in the first vertical slice. |
| 1. Buyer map/search | Globe, location states, dock, viewport discovery, pins/clusters, cards and facility sheet | Visitor reaches a source-backed facility and returns without context loss. |
| 2. Catalogue/availability | Catalogue selection, four stages, scope entitlement and comparison | Buyer can compare honest responses from a selected product. |
| 3. Verification/seller foundation | Seller onboarding, evidence, admin review, facility states and map-first workspace | Status changes occur only through audited review. |
| 4. Intent/transaction | Idempotent intent, transaction room, timeline, resume and authorized chat | Buyer and seller see the correct next action from persisted state. |
| 5. QR/fulfilment | QR, camera/manual verification, external payment, fulfilment, receipt and rating | Safe fixture completes the full transaction loop. |
| 6. Wallet/PWA/observability | FedaPay recharge, single wallet, responsive PWA and event instrumentation | Wallet and mobile gates pass with proof. |
| 7. Release hardening | Adversarial critique, API/security audit, production E2E and rollback rehearsal | Release decision is `verified` or explicitly `partial` with blockers. |

## 19. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Public OSM data is mistaken for verified supply | Trust failure | Separate public source status, evidence status and availability authority. |
| Scope expands into conventional ecommerce | Product dilution | Enforce map-first surface hierarchy and non-goals. |
| Client advances sensitive state | Security/financial risk | Database constraint, server check, UI feedback and audit event. |
| QR camera works inconsistently | Transaction dead end | Explicit camera lifecycle, manual fallback and real-device proof. |
| Wallet semantics become multiple payment rails | User confusion and accounting risk | One Omni Wallet, FedaPay recharge only, no withdrawal. |
| Mobile sheets obscure map or actions | Usability failure | Required viewport certification and shared sheet primitive. |
| Duplicate intent/payment/fulfilment requests | Data corruption | Idempotency keys, state guards, unique events and concurrency tests. |
| AI is added before manual proof | Unverifiable automation | Keep AI deferred until the manual loop is production-verified. |
| Multiple documents drift | Implementation contradiction | `v2-flow.md` remains authority for states and transitions; derived artifacts link back to it. |

## 20. Open decisions before affected implementation

The following decisions remain explicitly open in the flow contract and must be resolved before their implementation slice:

| Decision | Why it matters |
| --- | --- |
| Exact Free/Pro city, radius and bulk limits | Determines availability scope, entitlement checks and pricing. |
| Evidence types and retention | Determines verification schema, privacy and admin workflow. |
| Definition of three qualifying completed sales | Determines confirmed status and $20 credit unlock. |
| Wallet ledger bucket names and spending priority | Determines schema, accounting and UI balances. |
| Coupon eligibility, stacking and expiry rules | Determines product form and transaction snapshot. |
| FedaPay callback/reconciliation contract | Determines wallet reliability and operations. |
| Delivery/pickup metadata | Determines fulfilment states and seller actions. |
| Notification retention/read policy | Determines resume and deep-link behavior. |
| OSM provider quotas and operator runbook | Determines manual coverage operations and cost controls. |

No implementation prompt may silently decide these items. A decision patch must update the flow contract and this PRD together.

## 21. References

[1]: ./v2-flow.md "Omni V2 — Canonical Flow Contract"
[2]: ./omni-v2-isolated-rebuild-plan.md "Omni V2 isolation and rebuild plan"

The PRD is derived from the authoritative V2 flow contract [1]. The repository isolation and rollback boundary are governed by the V2 rebuild plan [2].
