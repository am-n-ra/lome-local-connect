# Omni V2 — Roots Contract

**Status:** Approved Roots — isolated schema applied
**Parent:** [`v2-seed.md`](./v2-seed.md)
**Rule:** This is the first technical authority after Seed. Pre-Nature-Way implementation and downstream planning documents are not authoritative.

## 1. Roots objective

Roots defines the load-bearing contracts that must exist before Omni’s new interface is built. It separates account capacity, facility identity, trust, catalogue capacity, wallet money and transaction state so that no client screen can silently combine them.

The first implementation target is a production-like PWA on the existing Vercel/React environment, with server-authoritative domain operations and a real persistent database selected before production data is connected. Every temporary adapter or fixture must be visibly labelled and replaceable.

## 2. Domain ownership

| Domain | Owns | Does not own |
| --- | --- | --- |
| Identity | Accounts, sessions, roles and authentication context | Facility trust or wallet balance |
| Account capacity | Facility Slots and workspace-level entitlements | Facility Pro or confirmed trust |
| Facilities | Company/facility identity, public data and lifecycle | Buyer transaction state |
| Trust | Evidence, review decisions and confirmation history | Catalogue limits or wallet deposits |
| Catalogue | Products, media, prices and Omni allocation | Availability truth at a later time |
| Discovery | Source-backed locations, bounds, ranking and freshness | Certification or inventory proof |
| Availability | Requests, responses, freshness and scope | Inventory reservation |
| Entitlements | Facility Pro, slot rights and feature limits | Trust badge creation |
| Wallet | Recharge and platform spending ledger | Buyer-seller money or withdrawals |
| Transactions | Intent, snapshot, QR, payment declaration and fulfilment | Public discovery |
| Communications | Authorized transaction messages and system events | Unscoped public chat |
| Operations | Admin review, ingestion recovery, audit and analytics | Client-authoritative mutation |

## 3. Core invariants

1. An account has one free facility slot by default.

1. Additional facility slots require a confirmed Omni Wallet spend or an explicitly granted workspace entitlement.

1. A facility belongs to an account and may be associated with a company, but facility identity is distinct from account identity.

1. An unclaimed or newly created facility cannot publish visible supply until certification has an audited outcome.

1. Certification produces `certified` and then `unconfirmed`; it never directly produces `confirmed`.

1. A facility may publish at most five offers on Free capacity while unconfirmed.

1. Facility Pro expands catalogue capacity and facility tools only for that facility.

1. Facility Pro cannot create, purchase or preserve the `confirmed` trust badge.

1. Exactly three qualifying successful Omni sales create `confirmed`; the transition is idempotent and irreversible unless a future explicit suspension policy is introduced.

1. The $20 bonus belongs to the facility, becomes spendable only after the qualifying sales threshold and is non-withdrawable.

1. There is one rechargeable Omni Wallet per account; internal allocations are ledger entries, not additional rechargeable wallets.

1. A public facility pin proves public source presence only, never current stock, certification or ownership.

1. Availability checks do not reserve stock.

1. Only an eligible comparison response can create a purchase intent.

1. Intent creation is idempotent and stores an immutable transaction snapshot.

1. Contact, itinerary, private chat and QR are unavailable before the authorized intent transition.

1. QR verification is server-authoritative, transaction-scoped, expiring and replay-safe.

1. Omni records external payment declarations but does not process buyer-seller payment or seller withdrawal in the first release.

1. Client-provided status, price, stock, trust, wallet or QR values are never authoritative.

1. Every sensitive mutation creates an audit event with actor, entity, correlation ID, reason where required and timestamp.

## 4. Minimum data model

### 4.1 Identity and capacity

`accounts` stores the user identity reference, role capabilities, onboarding state, created time and suspension state. `facility_slots` stores account owner, source (`free`, `wallet`, `workspace`), status, creation and release metadata. A unique constraint guarantees that a free default slot is issued once per account.

`companies` stores account ownership and public identity. `facilities` stores company/account ownership, source reference, coordinates, public profile, lifecycle state, certification state, trust sales count, facility plan, discovery mode and public hours. Ownership changes are audited and never inferred from a client claim.

### 4.2 Trust and catalogue

`verification_requests` stores facility, claimant, state, version, submitted time and review outcome. `verification_evidence` stores evidence type, secure reference, checksum/metadata, visibility and review linkage. `verification_reviews` stores admin actor, outcome, reason and timestamp.

`products` stores facility, identity, media reference, price, unit, actual stock reference, Omni allocation, publication state and version. `facility_entitlements` stores plan, limits, effective period and source. `facility_bonus_ledger` stores the $20 grant, lock condition, unlock event and spendable platform allocation.

### 4.3 Discovery and availability

`public_sources` stores provider, source reference, ingestion status and attribution metadata. `facility_source_refs` links public records to facilities and supports deduplication. `discovery_runs` stores viewport, source, outcome, count, duration, error class and operator recovery state.

`availability_requests` stores buyer, product/facility scope, quantity, budget mode/value, request state, correlation ID and expiry. `availability_responses` stores seller/automation actor, status, quantity, price/offer snapshot, freshness, correction metadata and audit linkage.

### 4.4 Wallet and transactions

`wallets` stores one account-level wallet. `wallet_ledger_entries` is append-only and records confirmed recharge, pending/failed recharge, hold, spend, release, bonus allocation and correction. Balance is derived from confirmed ledger entries, not client arithmetic.

`purchase_intents` stores buyer, selected response, idempotency key, state and transaction ID. `transaction_snapshots` stores facility, product, quantity, price, coupon, net amount, response freshness and fulfilment context immutably. `transaction_events` stores the canonical timeline. `transaction_members` stores authorized participants. `qr_tokens` stores hashed token, transaction, expiry, verification and replay state. `external_payment_declarations` stores method, actor, declared time and seller acknowledgement. `fulfilments` and `ratings` store actor-authorized completion records.

### 4.5 Analytics and audit

`audit_events` is append-only and contains event type, actor, entity, before/after references or hashes, correlation ID and timestamp. `analytics_events` stores minimized pseudonymous product events with consent state, not secret values, raw QR tokens or unnecessary personal data.

## 5. API contract conventions

Every mutation accepts an idempotency key where duplicate submission is possible. Every response includes `ok`, `correlationId`, a typed payload or a typed error. Errors are stable classes: `AUTH_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`, `STALE_STATE`, `ENTITLEMENT_REQUIRED`, `SOURCE_UNAVAILABLE`, `CONFLICT`, `EXPIRED`, `REPLAYED` and `INTERNAL_RECOVERABLE`.

| Operation | Required authorization | Server result |
| --- | --- | --- |
| `discover(bounds, query, filters)` | Visitor for public source data; buyer for account-tracked database search | Facilities/clusters, source status, freshness and recovery state |
| `getFacility(facilityId)` | Public fields by visitor; protected fields by transition | Facility public detail and permitted actions |
| `getCatalogue(facilityId)` | Public active catalogue according to facility policy | Facility-scoped products and eligibility |
| `createAvailability(request)` | Authenticated buyer | Request ID, scope, limits and state |
| `respondAvailability(requestId)` | Authorized seller/approved automation | Response snapshot and audit event |
| `submitVerification(facilityId, evidence)` | Authorized claimant | Versioned evidence request |
| `reviewVerification(requestId, outcome)` | Admin | Audited trust outcome |
| `createFacility(companyId, slotId)` | Account with available slot | Facility in verification lifecycle |
| `buyFacilitySlot()` | Account with confirmed wallet funds | Idempotent slot and spend entry |
| `activateFacilityPro(facilityId)` | Facility owner with confirmed funds | Facility-scoped entitlement |
| `rechargeWallet(reference)` | Account and trusted payment boundary | Pending/confirmed/failed wallet event |
| `createIntent(responseId)` | Authenticated buyer and eligible response | One transaction snapshot and unlock scope |
| `verifyQr(transactionId, token/code)` | Authorized seller | Verified/expired/replayed/mismatch result |
| `declareExternalPayment(transactionId, method)` | Authorized buyer | Payment declaration |
| `confirmPayment(transactionId)` | Authorized seller | Seller-owned payment event |
| `advanceFulfilment(transactionId, state)` | Actor allowed by state machine | Next state and event |

## 6. Authorization model

Authorization is evaluated server-side from authenticated actor, account ownership, company/facility relationship, transaction membership, current persisted state, entitlement and feature policy. UI visibility is not authorization.

Visitors may read public data only. Buyers may act on their own availability requests, intents, transactions, receipt and ratings. Sellers may act only on owned/managed facilities and transaction roles. Admins may review evidence and controlled operational records with reasons. No role may advance another role’s state.

## 7. Recovery and consistency

All critical operations use correlation IDs and idempotency. Refresh and reconnect recover from persisted state. Stale availability produces a refresh path. Expired or replayed QR produces a non-destructive recovery. Failed recharge never creates spendable balance. A failed admin review remains reviewable. Overpass failure preserves the last safe result or labelled fallback.

## 8. Proof strategy

Roots proof must include unit tests for invariant reducers and money/status calculations, integration tests for authorization and idempotency, database constraint tests for one-wallet/slot rules, negative tests for client forgery, browser tests for map-to-facility-to-availability and seller trust states, and responsive tests at 320/375/768/1280 px.

Fixtures must include a visitor, buyer, seller account, one free slot, a second-slot denial, one unclaimed facility, one certified/unconfirmed facility, one Pro-only non-confirmed facility, one confirmed facility, a three-sale progression, a locked bonus, a confirmed wallet recharge, a failed recharge, available/partial/unavailable responses, a stale response, an eligible intent and replayed/expired QR tokens.

## 9. Roots gate

Roots is ready for Trunk only when the database provider and migration strategy are chosen, the API envelopes are typed, the authorization matrix is executable, the one-wallet and per-facility entitlement invariants are tested, the transaction/QR state machine is persisted, recovery fixtures exist and no UI decision contradicts these contracts.

## 10. Proposed platform decisions

These decisions are proposed from the current project constraints and can be approved as the Roots baseline. They are deliberately separated from business invariants.

| Concern | Proposed decision | Reason |
| --- | --- | --- |
| Application runtime | React with TanStack Start-style server/client boundaries on Vercel | Supports a persistent map shell and server-authoritative operations without returning to a static-only prototype |
| Database | Neon PostgreSQL with Drizzle migrations | Matches the existing isolated V2 database branch and provides transactional constraints for wallet, entitlements and state transitions |
| Authentication | Neon Auth initially; OAuth providers may be added later | Retains existing Neon Auth identities while the V2 application starts with a clean business-data schema |
| Evidence/media storage | S3-compatible private object storage with signed access | Verification evidence and product media must not be public by default |
| Map renderer | MapLibre GL with an approved vector-tile style and explicit attribution | Preserves globe-first behavior and avoids a vendor-locked UI abstraction |
| Public data | Bounded server-side OSM/Overpass adapter with timeout, dedupe, attribution and operator recovery | Public data is a discovery source, not an unbounded synchronous dependency |
| Wallet recharge | FedaPay recharge boundary only | Omni records platform-credit deposits; it does not process buyer-seller payment or seller payout |
| Application state | Server-persisted domain state plus typed client surface state | Map/sheet presentation may be local, but trust, money and transaction state must persist server-side |
| Analytics | First-party consent-aware events with pseudonymous actor references | Supports the data-company objective without collecting raw secrets or unnecessary personal data |
| PWA | Responsive web/mobile first with install metadata, service-worker policy and resume support | Native mobile is deferred until the PWA core is proven |
| Commerce integration | No Shopify integration for the first release | Omni is not implementing a conventional checkout/cart or buyer-seller payment rail in this scope |

## 11. Proposed status vocabulary

Business status and UI status are separate. Business state is persisted and server-authoritative; UI state may be ephemeral and must not be used to authorize a transition.

| Layer | Examples |
| --- | --- |
| Facility business state | `unclaimed`, `verification_draft`, `verification_submitted`, `admin_review`, `certified`, `unconfirmed`, `confirmed`, `rejected`, `suspended` |
| Facility commercial state | `free`, `pro_active`, `pro_expired` |
| Account capacity state | `slot_available`, `slot_exhausted`, `workspace_entitled`, `suspended` |
| Availability state | `draft`, `submitted`, `responding`, `available`, `partial`, `unavailable`, `stale`, `expired`, `cancelled`, `failed` |
| Intent state | `creating`, `active`, `cancelled`, `expired`, `completed`, `disputed` |
| Transaction state | `intent_created`, `qr_ready`, `qr_verified`, `payment_declared`, `payment_confirmed`, `fulfilment_pending`, `fulfilled`, `received`, `rated`, `closed` |
| Wallet state | `pending`, `confirmed`, `failed`, `reversed` |
| UI state | `idle`, `loading`, `ready`, `empty`, `error`, `retrying`, `cancelled`, `locked`, `success` |

## 12. Fresh V2 data-start strategy and migration order

There are no active Omni business users whose historical product data must be preserved. V2 therefore uses a fresh application-data schema while retaining existing Neon Auth identities. Auth user IDs are re-linked to new V2 account rows through explicit first-login provisioning; no old V1/V2 business rows are imported by accident.

The schema is migrated in dependency order: identity references and account capacity; companies and facilities; source references and discovery; verification evidence and reviews; catalogue and facility entitlements; wallet and append-only ledger; availability requests and responses; intents and immutable transaction snapshots; QR and transaction events; fulfilment and ratings; audit and analytics.

The migration was applied to Neon project `wild-moon-30984513`, branch `br-dawn-hill-am5amy22` (`omni-v2-rebuild`), database `neondb`. Production branch and Neon Auth identities were not modified.

No migration may introduce a client-writeable trust, money or transaction status. Constraints and indexes must be reviewed alongside the API operation that depends on them.

## 13. Roots approval decisions

Before Trunk implementation begins, the owner must approve or change:

1. Neon PostgreSQL as the authoritative V2 database;

1. React/TanStack Start-style server/client boundaries on Vercel;

1. Neon Auth as the initial identity boundary, with later OAuth providers added through an explicit Roots change;

1. private object storage for evidence and media;

1. MapLibre plus an approved vector tile source;

1. bounded server-side OSM/Overpass discovery;

1. FedaPay for Omni Wallet recharge only;

1. the separation of business state from ephemeral UI state;

1. the proposed status vocabulary and migration order;

1. Facility Slot and Facility Pro pricing as explicit policy configuration, with no hard-coded amounts until pricing is approved;

## 14. Roots gate outcome

When these decisions are approved, the next Nature Way phase is Trunk: one complete core journey from map arrival through authenticated search, facility inspection, catalogue selection and an availability request. That slice must use the real database contracts, not the existing prototype fixtures, and must ship with its UI, server operation and browser/integration proof together.
