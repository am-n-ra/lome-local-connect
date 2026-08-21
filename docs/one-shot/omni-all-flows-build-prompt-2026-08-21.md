# Omni All V1 Flows — Execution Build Prompt

## 1. Scope rationale

Implement Omni as one map-first stateful product rather than a collection of unrelated pages. The build must connect discovery, facility catalogue, product selection, availability, comparison, purchase intent, authorized transaction room/chat, QR verification, external payment declaration, fulfilment, receipt, rating, seller operations, verification review, wallet recharge, notifications, auth restoration and PWA behavior.

The active code already contains pieces of these flows. The builder must converge them into one production-active surface per responsibility, remove competing legacy paths from active routes, and preserve MapLibre GL v5 globe projection, OpenFreeMap, source-backed pins, native clustering, viewport discovery, exact/approximate location semantics and the single-chevron buyer dock.

The master describes the destination. This prompt describes what ships. Do not implement deferred capabilities, including as disabled placeholder controls, unless the master scope gate explicitly permits them.

## 2. Product identity and proof loop

Omni is a global geospatial supply-and-demand search engine. The proof loop is:

```text
map/globe → search → facility/product discovery → facility detail → catalogue
→ product selection → availability → comparison → purchase intent
→ authorized transaction room/chat + QR → external payment declaration
→ seller confirmation → fulfilment → buyer receipt → rating → completion
```

The build succeeds only when this loop is reachable, resumable and truthful under replay, timeout, cancellation, stale data and unauthorized access.

## 3. Scope lock

| Capability | Ship status |
|---|---|
| Map/globe, dock, pins, clusters, cards, facility detail, catalogue, product selection | Build now |
| Manual availability, Pro bulk availability, comparison and server gating | Build now / Build-manual response |
| Purchase intent, authorized transaction room/chat, timeline and notifications | Build now |
| QR creation, camera scanner and manual fallback | Build now / Build-manual device proof |
| External/manual payment declaration, seller confirmation, fulfilment, receipt and rating | Build-manual operational branch with real data model |
| Seller onboarding, certification request/evidence/admin outcome | Build now / Build-manual review |
| Seller map-first workspace, catalogue, requests, scanner, coupons and valid wallet/account surfaces | Build now |
| One Omni Wallet recharge through FedaPay and platform-only spend | Build now / Build-manual provider settlement |
| PWA shell, context restoration, responsive/safe-area behavior | Build now |
| Seller withdrawals, buyer-seller in-app payment, AI agents, native mobile, offline real-time transactions, unrestricted global prepopulation, 3D/media discovery and future automation | Deferred |

## 4. Stack and trust boundary

Use the repository’s existing React 19/TanStack/Vite/Nitro/Neon/MapLibre stack and conventions. UI modules must not import database drivers, secrets, auth middleware internals or server-only modules directly or transitively. Screens consume typed server-function adapters. Run `scripts/check-client-boundary.mjs` before release. Database constraints and server functions are authoritative; disabled buttons are only feedback.

## 5. Typed adapter seams

Use or create these route-owned interfaces:

```ts
type DiscoveryAdapter = {
  listInBounds(input: ViewportSearch): Promise<DiscoveryResult>;
};
type FacilityAdapter = {
  getDetail(input: { facilityId: string }): Promise<FacilityDetail>;
};
type CatalogAdapter = {
  listProducts(input: { facilityId: string }): Promise<CatalogProduct[]>;
};
type DemandAdapter = {
  create(input: AvailabilityDraft): Promise<{ requestId: string }>;
  read(input: { requestId: string }): Promise<DemandReadModel>;
};
type IntentAdapter = {
  create(input: IntentInput): Promise<{ transactionId: string }>;
};
type TransactionAdapter = {
  timeline(input: { transactionId: string }): Promise<TransactionTimeline>;
  sendMessage(input: TransactionMessageInput): Promise<TransactionMessage>;
  act(input: TransactionActionInput): Promise<TransactionTimeline>;
};
type VerificationAdapter = {
  createRequest(input: VerificationRequestInput): Promise<VerificationRequest>;
  submitEvidence(input: EvidenceInput): Promise<VerificationRequest>;
  review(input: VerificationReviewInput): Promise<VerificationRequest>;
};
type WalletAdapter = {
  balance(): Promise<WalletReadModel>;
  recharge(input: RechargeInput): Promise<RechargeSession>;
};
```

No screen may use component-local arrays as source of truth. Test adapters may simulate latency and controlled failures, but production adapters return real server data.

## 6. Design tokens and visual rules

Use the existing Omni cream/paper/orange/ink and shared glass/sheet tokens. All color, radius, shadow, type, spacing and motion values are tokenized. The map remains the scene. Use orange for action/selection, near-black for geographic highlights, green/amber/red for operational status, and neutral ink for unclaimed/public context. Sheets are bottom anchored on mobile and bounded/floating on desktop. Every footer primary action remains reachable above safe-area insets.

Reject generic marketplace grids, generic social inboxes, opaque dashboard tab bars, stacked modal chains, decorative globe substitutes, permanently visible empty controls and visual hiding of unauthorized data.

## 7. Screen-by-screen build contract

### Map and buyer discovery

`/` and `/carte` own the MapLibre scene, one dock, map controls, result rail and stateful overlays. Arrival has no automatic search zoom. Explicit search/categorie/restored search/retry may start a cancellable reveal. Pins are source-backed, clusters are scale-appropriate, and local results can be individual relevant pins. A card click selects only.

### Facility detail and catalogue

Facility detail owns public identity, media, status, address, hours, matched product and actions. It must show `Voir les produits` when products exist. Catalogue is a separate sheet reading real products; matched product first; empty/sold-out/error/retry explicit. Selecting a product returns `ProductSelection` and opens availability or prepares it.

### Availability and comparison

Availability is a four-stage sheet: `Produit`, `Portée`, `Contraintes`, `Réponses`. Product identity is catalog-first. Free manual mode targets one facility; Pro bulk is server-gated. Quantity/budget are editable and camera-inert. Responses are deterministic and only eligible responses expose intent.

### Intent

Intent confirmation shows selected facility, product, quantity, price, offer/coupon and payment-not-yet-processed wording. Server recalculates and snapshots amounts, enforces idempotency and returns an authorized transaction context. Stale/replay/timeout branches preserve comparison context.

### Transaction room/chat

`CleanTransactionRoom` or the canonical equivalent owns the room. It shows facility/product, gross/net amount, coupon state, status, five-step progress, server event timeline, scoped chat, QR state, external payment method, fulfilment and rating. It polls or subscribes through the existing server adapter and can be closed/reopened without changing the transaction. Message composer is visible only for authorized participants. Each state has one role-specific primary action.

### QR scanner

`/transaction/qr` or the seller scanner surface requests camera permission, renders the live preview in the reserved camera area, attempts supported `BarcodeDetector`, and offers manual entry. Both paths call the same server verifier. Expiry, replay, wrong transaction, malformed code, camera denial, no camera and network timeout are explicit and recoverable.

### Payment/fulfilment/rating

The room offers cash delivery, TMoney, Flooz and other external methods. Buyer declaration and seller confirmation are separate. Seller starts fulfilment; buyer confirms receipt; buyer rates after receipt. No in-app buyer-seller payment or seller withdrawal is added.

### Seller workspace/onboarding

Seller route stays map-first and facility-first. It owns facilities, products, requests, scanner, coupons and functional account surfaces. Claim creates a verification request and never changes status. Evidence drafts/submission and admin review are explicit. Product creation is clear, catalog-oriented and validates stock/discount/offer state.

### Wallet/auth/menu/PWA

Wallet clearly communicates one rechargeable Omni Wallet and FedaPay recharge-only boundary. Pending deposit is distinct from available balance and platform-only credits. Menu is typed/action-backed and role-aware. Auth preserves query, facility, product, request and transaction context. PWA shell is safe-area aware and private data is network-first.

## 8. Data and sensitive-data rules

Product IDs, response IDs, amounts, coupon snapshots, QR validity and transaction status are server-authoritative. Contact, itinerary, private chat, QR raw token and payment secrets must be absent before successful intent authorization. Verification status is changed only by audited review. All transaction actions use valid transition checks and idempotency. Limited stock uses atomic reservation/update patterns.

## 9. Seed/test cases

Use plausible French/West African facility names, products, FCFA prices, locations and seller responses. Include at least one unclaimed facility, a facility with multiple products, a matched product, empty catalogue, stale product, available/partial/unavailable answers, expired/replayed QR, denied camera, external payment dispute, delivery failure, wallet pending deposit and restored auth context. Never use generic `Shop A` or fabricated production records.

## 10. Delivery order

First reconcile adapters and client boundary. Then complete buyer catalogue/availability/intent. Then converge transaction room/chat and QR states. Then seller workspace/onboarding/review. Then wallet/auth/menu/PWA recovery. Finally execute the proof matrix. After each slice run focused tests, strict TypeScript, build and boundary checks. Do not declare the whole loop production-ready while real camera, authenticated responsive, transaction E2E or production audit evidence remains open.

## 11. Definition of done

1. Every listed screen has named loading, ready, empty, unavailable, error, retry, cancellation, replay and authorization states where meaningful.
2. Card click, catalogue selection, availability, intent and transaction room are distinct and reachable in order.
3. `productId` survives catalogue → availability → response → intent.
4. Unclaimed facilities cannot receive controlled availability or intent.
5. Intent is idempotent and returns/reopens one authorized transaction room.
6. Chat is transaction-scoped and inaccessible before authorization.
7. QR is server-generated, expiring, replay-safe and camera/manual equivalent.
8. External payment and Omni Wallet recharge are separate rails.
9. Seller confirmation, fulfilment, buyer receipt and rating have distinct actor gates.
10. Verification request never directly changes facility status.
11. Wallet has no seller withdrawal path and pending deposits cannot be spent.
12. Context survives auth, role switch, close/back, notification and deep-link restoration.
13. UI remains map-first, token-only and responsive at 320/390/768/1024/1280 px.
14. Unit/integration tests, strict TypeScript, production build, client-boundary, public smoke and proof matrix pass or are honestly marked partial.
15. No deferred feature appears as a dead placeholder or hidden business rule.
