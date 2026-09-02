# Omni V2 — Seed

**Document ID:** `OMNI-V2-SEED-001`
**Status:** Authoritative restart baseline
**Method:** Nature Way — Phase 0, Seed
**Version:** 2.0.0
**Date:** 2026-08-22

> **Omni is a map-first geospatial supply-and-demand search engine that helps a person understand what may be available around them before they waste time moving, calling or repeatedly asking suppliers.**

This Seed is the product’s compressed identity. Every later design, data model, state machine, implementation slice and release decision must grow from it. Existing prototype screens, routes and implementation assumptions are not authoritative when they conflict with this document.

## 1. The problem

A person may know what they need without knowing which nearby facility, professional or supplier may provide it. Existing tools separate maps, directories, catalogues, messaging and payment coordination. They rarely create a trustworthy path from “what do I need?” to “which real place may provide it now?”, and they make people contact several providers merely to discover that an item is unavailable.

The supply side is equally fragmented. A person or organization may operate a shop, branch, home activity, mobile service, professional practice or personal expertise. The account owner, company, facility, catalogue, trust status and commercial capacity must remain distinct so that Omni can represent reality without creating unlimited untrusted supply.

## 2. Product identity

Omni connects four kinds of knowledge:

1. **Geographic context:** what places exist around a person and where they are.
2. **Catalogue truth:** what a facility says it offers, through a facility-scoped catalogue.
3. **Availability evidence:** what a supplier can currently confirm, with freshness and explicit uncertainty.
4. **Resumable handoff:** what happens after a buyer selects an eligible option and proceeds toward fulfilment.

Omni is not primarily a conventional marketplace grid, a social network, a public chat app, a payment processor or a decorative globe. The map is the product’s permanent spatial scene, not a background image behind unrelated dashboard pages.

## 3. Users and actors

| Actor | Desired outcome | Initial access |
|---|---|---|
| Visitor | Understand Omni, explore the real map and inspect public facilities | Public map, public facility and public catalogue information |
| Buyer | Search a need, choose a catalogue offer, verify and compare availability, then complete a traceable handoff | Account required for database search, availability and protected actions |
| Seller | Represent companies and facilities, publish supported supply, respond to demand and complete handoffs | Authenticated, facility-scoped operations after the relevant trust gates |
| Admin | Review evidence and make auditable trust decisions | Controlled administrative operations |
| Operator | Maintain public discovery, recovery, analytics and operational health | Manual or controlled operational access |

## 4. Core promise

> **Search what you need, see where a real facility may provide it, verify availability without unnecessary seller polling, compare your options and complete a traceable handoff without losing your place on the map.**

The promise is successful only if a new user can understand the map, identify what Omni knows and does not know, select a real catalogue product, complete an availability request without guessing, distinguish public presence from trust, and resume unfinished work later.

## 5. Core journey

The first product journey is:

```text
arrive on the map
→ understand public exploration
→ search a product or service need
→ discover source-backed facilities
→ inspect a facility
→ inspect and select an existing catalogue offer
→ request bounded availability
→ receive honest responses or recovery
→ compare eligible responses
→ create an authorized purchase intent
→ enter the transaction room
→ use QR and/or declare an external payment method
→ seller confirms and fulfils
→ buyer confirms receipt
→ rate
```

The map remains mounted throughout. Dock, cards, rails, sheets, menus and the transaction room are contextual surfaces above the map. Leaving a surface must preserve safe unfinished context unless the user explicitly cancels or completes it.

## 6. Product laws

### 6.1 Public knowledge is not supply proof

Anyone may explore the globe/map and inspect public facility information. Public data may show identity, category, source, location, public hours, public media and public catalogue content according to policy. A public pin proves public source presence only; it does not prove current stock, ownership, certification or availability.

Database-backed Omni search, availability verification, purchase intent and private seller information require an account and an explicit state transition. Contact details, itinerary and private chat remain hidden until the authorized intent transition.

### 6.2 Claiming is not certification

A facility can arrive from public data as `unclaimed` or be created by a seller. Clicking Claim only creates or resumes a verification request. It never changes the facility’s trust state.

The claimant submits evidence of identity, company/facility association and product/service activity. Admin review produces an audited outcome. Successful certification moves the facility to `unconfirmed`; it does not directly create `confirmed`.

### 6.3 Trust cannot be purchased

A certified/unconfirmed facility may publish a maximum of five offers on Free capacity. A facility becomes `confirmed` only after three qualifying successful Omni sales. The badge is a trust signal, not a product that can be bought.

Facility Pro may expand catalogue capacity and unlock tools for that facility. Pro cannot create, purchase or preserve `confirmed` without the qualifying sales. When Pro expires, the facility returns to Free limits; the `confirmed` badge remains only if independently earned.

### 6.4 Capacity, facility and account are different

Every account receives one free Facility Slot. Additional companies or facilities require additional slots purchased from the Omni Wallet or included in a future account-level workspace entitlement. Slots control account capacity; they do not grant product limits, Pro or trust.

A facility is the commercial and trust unit. Its catalogue limits, Pro entitlement, bonus state and sales progression are facility-scoped. The account owns access to the facilities but is not itself a facility.

### 6.5 The bonus is facility-scoped and non-cash

The $20 welcome/traction bonus belongs to the facility and is announced when a facility is created or certified. It becomes spendable only after that facility completes three qualifying successful Omni sales. It is non-withdrawable and usable only for Omni platform features.

### 6.6 There is one rechargeable Omni Wallet

Each account has one rechargeable Omni Wallet. A server ledger allocates confirmed wallet funds to Facility Slots, facility Pro, advertising, coupon credits and other explicitly approved platform consumption. Internal allocations are ledger entries, not additional rechargeable wallets.

Omni V1 does not process buyer-to-seller in-app payments, seller withdrawals or seller payouts. It may record external payment declarations and seller acknowledgement as part of a transaction state machine.

### 6.7 Availability is not reservation

An availability check asks for evidence within a defined scope and time. It never silently reserves stock, guarantees fulfilment or converts a public pin into inventory. Responses must include explicit status, quantity/offer information where available and freshness.

### 6.8 Sensitive actions are state-gated and server-authoritative

Only an eligible availability response can create a purchase intent. Intent creation is idempotent and creates an immutable transaction snapshot. Contact, itinerary, private chat and QR become available only after the authorized transition.

The server owns trust, price, stock, availability, discounts, wallet balance, permissions, QR validity and transaction transitions. The client may present state but may not invent or authorize it.

## 7. Experience direction

Omni should feel like a calm, premium instrument for seeing what exists in the world. The map/globe is permanent and dominant. Contextual surfaces float above it with generous breathing room, clear hierarchy and restrained glass/translucent treatment rather than dense SaaS chrome.

The founder’s visual reference establishes a compact mobile composition: a pale spatial map with quiet dot texture, a centered facility marker and label, minimal top controls, a floating search pill, and a bottom sheet with a strong “near you” heading, a product/facility card and one clear availability action. This is an initial Species input, not yet the complete design blueprint.

The logo’s location pin and eye represent seeing what exists in a place. Brand use must be consistent across arrival, navigation, authentication, PWA metadata and seller surfaces.

## 8. Seed success criteria

The Seed is successful when the product direction is unambiguous and a competent builder can explain:

- why the map is always present;
- which public information a visitor may inspect;
- exactly when an account is required;
- why a catalogue product must be selected before availability;
- why a public pin, Pro plan or claim click does not prove trust or stock;
- how `unclaimed`, certification, `unconfirmed` and `confirmed` differ;
- why the one Wallet is platform-only in the first release;
- how a buyer leaves and resumes an unfinished action.

A production-ready first release must also prove that sensitive state is server-authoritative, availability does not reserve inventory, trust cannot be bought, wallet spending is ledgered without withdrawal, and every critical action has loading, empty, error, retry, cancellation and recovery behavior.

## 9. Scope gate

| Capability | Seed treatment |
|---|---|
| Map-first globe and public source-backed discovery | Build now |
| Catalogue-first buyer search and availability comparison | Build now |
| Facility claim request, evidence and certification | Build now; admin review may be manual |
| Seller map-first workspace and facility operations | Build now |
| Products, Omni allocation, coupons and availability responses | Build now |
| Purchase intent, transaction room, scoped chat and resume | Build now |
| QR verification, external payment declaration, fulfilment and rating | Build now |
| One Omni Wallet and FedaPay recharge for platform use | Build now; no seller withdrawal |
| PWA/mobile web | Build now |
| Bounded public-data ingestion and operator recovery | Build now as an explicit operational capability |
| Fully automated admin certification | Manual/deferred |
| AI that mutates business state | Deferred |
| Native mobile applications | Deferred until PWA proof |
| Buyer-seller in-app payment | Deferred/not in first release |
| Seller payouts and withdrawals | Deferred/not in first release |
| Instant unrestricted global prepopulation | Not promised/deferred |

## 10. Explicit non-goals

Omni is not a generic social network, unrestricted public chat, conventional cart marketplace, buyer-seller payment processor, seller withdrawal product, static directory, decorative globe, unrestricted global data dump or autonomous AI agent that mutates trust, money, inventory or transaction state before the manual loops are proven.

No visible action may be fake, dead or silently future-facing. If an operation is manual, the product must represent its state honestly and the operating procedure must have an owner and recovery path.

## 11. Seed gate

The Seed is ready for Species only when the owner confirms:

1. Omni is a map-first geospatial supply-and-demand search engine.
2. The core journey begins with the map and reaches catalogue-aware availability before transaction.
3. Public exploration is distinct from account-gated search, availability and protected actions.
4. Facility claim, certification, `unconfirmed`, `confirmed`, Pro and the three-sale rule remain distinct.
5. One account-level Omni Wallet funds platform consumption only in the first release.
6. The listed build-now, manual and deferred boundaries are accepted.

Only after this gate should the visual Species blueprint and Root System be frozen for implementation.


## 12. 2026-08-26 — Seed re-alignment after Seller/navigation audit

This amendment preserves the original Seed and makes the current launch envelope explicit. The active structural path is `product > role separation > Seller operational workspace`. The existing Buyer map-first journey and bounded Buyer→Seller response/comparison proof are foundations, not evidence that the complete Seller product or global marketplace is production-ready.

### Launch envelope

Omni may be presented to a small, explicitly labelled pilot for read-only discovery, feedback and bounded availability testing. It must not yet be presented as a broadly production-ready marketplace. The pilot may use real accounts and real public discovery, but any fixture-based transaction or temporary Seller rebind remains labelled as demo-only. Real seller activation, billing, payment settlement, payout, broad global coverage, push delivery and complete device coverage remain separate release gates.

### Actor and navigation policy

An authenticated Neon user is not automatically an Omni operator, reviewer or Seller. Neon Auth identity and administrative metadata are not an Omni business role. The server must remain authoritative for account context, active Omni roles, Seller onboarding state, suspension and owned facilities. The client must render only the navigation entries allowed by that server context.

| Actor state | Allowed product surfaces | Explicitly unavailable or hidden |
|---|---|---|
| Visitor | Public map, public facility detail, public catalogue, sign-in/create-account entry, install when available | Buyer requests, Inbox, Seller, Field Pilot, Reviewer/Admin |
| Ordinary authenticated Buyer | Buyer search, availability, own requests, own Inbox, account/install, return to map | Field Pilot, claims review, reviewer activation/suspension, Seller operations until Seller context is granted |
| Seller applicant | Buyer surfaces, own claim draft/evidence/resume, applicant status and Inbox | Seller-ready operations, reviewer/operator tools, any claim-to-certification shortcut |
| Seller-ready account | Buyer surfaces, Seller workspace, owned facilities/catalogue/demand/transaction surfaces permitted by server state, own Inbox | Reviewer/operator tools unless separately granted; billing/withdrawal/payment settlement not yet supported |
| Operator | Operator Field Pilot and approved public-data recovery/import surfaces, plus ordinary account surfaces if separately applicable | Reviewer decisions, arbitrary Seller ownership changes, billing authority |
| Reviewer/Admin | Claims review, Seller activation/suspension and approved administrative surfaces, plus ordinary account surfaces if separately applicable | Unscoped Seller ownership mutation, buyer/seller private data outside policy, payment or payout authority |

### Seller scope correction

The current Seller implementation is only a bounded mini-cycle: seller authorization, owned-facility-scoped incoming availability requests, response submission and limited transaction/QR controls. It does not yet constitute the full Seller operational workspace. The next Seller Trunk must be selected after the Root audit and must include an authoritative account/facility context, a complete applicant-to-ready state boundary, owned-facility management and a catalogue lifecycle contract before broader Seller branches are attempted.

### Decisions required before money-like or communication features

No implementation may invent the following policies: whether an applicant can self-claim or requires team activation; evidence and reviewer requirements; Free/Pro benefits, prices, currency, payment provider, renewal, expiry, refunds and overrides; whether “balance” means platform wallet, earnings ledger, prepaid credit or another financial concept; chat participants, retention, moderation, attachments and notifications; or which actor scans which QR at handoff. Until each is explicitly approved, the product must show an honest unavailable/decision-pending state rather than a fake control.

### Seed gate status

The original product identity and map-first promise remain valid. This re-alignment Seed is `review`, not `verified`, until the owner confirms the actor policy and unresolved business decisions above. Species and Root work may proceed as audit and blueprint work; implementation is limited to the role-context/menu hardening slice until the Seller Trunk policy is confirmed.

## 13. 2026-08-26 — Owner-confirmed commercial handoff direction

The owner confirmed four product rules. First, an authenticated person may self-claim a public or created facility as a Seller applicant; the Omni team verifies the submitted evidence manually, and certification remains separate from operational Seller activation. Second, Omni should generate revenue from day one through clearly defined Free and Pro plans and a rechargeable Omni Wallet, but no exact price, currency, provider, entitlement list or lifecycle may be invented in code before the commercial Root contract is approved. Third, V1 does not process Buyer-to-Seller payments and does not support Seller payout or withdrawal. Fourth, after an eligible intent creates a transaction, the Buyer receives access to the transaction-scoped chat, itinerary, approved Seller contact and a server-issued Buyer QR; the Seller receives an intent notification and can open the transaction from the notification, a safe authenticated link or the QR scanner. The Seller scans the Buyer QR at the physical handoff, and server verification routes the Seller to the correct transaction.

The monetization model must preserve this separation: Omni Wallet recharge and Free/Pro purchases pay for Omni platform capabilities; an Omni discount is validated and snapshotted as part of the eligible offer/transaction; the external handoff payment remains between Buyer and Seller in V1. No UI may imply that an Omni discount, Wallet credit or external payment declaration settles funds to a Seller.

**Seed status:** `review / owner direction accepted; commercial Root details and post-intent implementation remain open`.

## 14. 2026-08-26 — Bulk Availability and global Wallet clarification

The owner clarified that Omni does not sell search or ordinary availability checking. Search is free for every account, and a manual single-facility availability check remains free. The paid value is the convenience and compute of **Bulk Availability**: after a search such as `banane`, a Buyer can select the eligible facilities, enter quantity and constraints once, preview the estimated cost and ask all selected facilities in one operation. The Seller receives the product/request context and quantity, not the Buyer’s private maximum budget by default. Sellers answer `available`, `partial` or `unavailable`.

Bulk is not priced as a fixed number of requests. It consumes an internal availability-credit budget based on the estimated number of targeted facilities and approved processing/constraint weight. Free receives three included Bulk Availability operations per billing period under the published guardrail; Pro receives a monthly unit allowance, and heavier bulk checks consume more units. Additional availability credits may be purchased from the Omni Wallet. This model also leaves room for a future AI agent to consume the same availability and AI-credit budgets while performing only actions available to a human Buyer.

The Omni Wallet is one global account-level Wallet, not a set of user-managed disconnected wallets. It can be recharged through the approved provider boundary and then allocate funds internally to subscriptions, Facility Slots and Bulk/other platform credits. Users may opt into auto-renewal: at expiry, Omni checks the Wallet balance in the subscription currency and renews only when the exact amount is available. It never silently charges a card, creates a negative balance or treats a failed renewal as successful. The display currency follows authorized location context where supported — XOF for Togo/Benin, GHS for Ghana and EUR for France — with an explicit fallback and no silent conversion.

The historical `origin/main` branch contains a FedaPay hosted-checkout, provider-lookup, signed-webhook and idempotent-crediting pattern, but it is vendor-scoped legacy code and is not integrated into the current V2 account Wallet. Reuse requires a Root adaptation, secure environment verification and production proof. Existing V2 schema/ledger work remains the authority for the new implementation.

**Commercial Seed gate:** the value proposition is now accepted as `free discovery + free simple check + credit-metered bulk convenience + Wallet-funded Pro/slots/credits`; exact credit estimator, allowances, prices, supported currencies, conversion/refund rules and plan entitlements remain Root decisions.

## 15. 2026-08-26 — Two-problem product model

Omni must explicitly serve two different user problems:

1. **Discover before moving:** a person searches from home or another location, filters by product, quantity, area and permitted price constraints, checks one facility for free or launches a credit-metered Bulk Availability operation across eligible facilities, compares honest responses and decides whether to travel or buy.
2. **Activate an Omni advantage on site:** a person is already at a restaurant, shop or other facility, scans that facility’s public QR, opens its Omni catalogue, selects an active product/offer and quantity, receives a server-snapshotted offer and presents a transaction QR to the Seller for verification before paying the Seller externally.

These are not two labels for the same availability request. The first creates a `discovery_availability` path and may create a Buyer intent after an eligible response. The second creates an `onsite_facility_qr` path and an `onsite_offer` intent without asking a remote availability question. Both can enter the same authorized transaction room, but origin, snapshots, permissions, metrics, expiry and recovery remain persisted separately.

The public facility QR and Buyer transaction QR are different objects. A facility QR is stable/public and opens only public facility/catalogue context. A Buyer QR is server-issued only after an authorized intent and account-bound offer/coupon binding, is transaction-bound, expiring and replay-safe, and is verified by the Seller. The QR carries only a server-verifiable transaction reference; the coupon, Buyer identity, price, reduction, place and time remain authoritative in the server-side snapshot. A link shared outside Omni is a secure authenticated resume path, never a raw QR token.

In V1 Omni may validate and record the offer, Seller verification, external payment declaration and fulfilment, but it does not settle Buyer money to Sellers, provide Seller payout or call the on-site action “Payer avec Omni”. The honest product language is `Activer l’offre Omni`, `Profiter du prix Omni` or `Valider l’avantage chez le vendeur` until a future regulated settlement contract is approved.

The complete brainstorm and proposed state separation are recorded in [`v2-problem-model-and-flow-brainstorm-2026-08-26.md`](./v2-problem-model-and-flow-brainstorm-2026-08-26.md).

## 16. 2026-08-26 — Seller-distributed Omni entry point

A listed Seller is not only a supply record responding to Buyer demand. The Seller may also become an acquisition partner for Omni. To be presented as an active Omni offer partner, a facility must maintain an Omni-readable catalogue and publish at least one active product/service offer or reduction. Omni generates a stable facility QR/link automatically, but the Seller’s physical display or social distribution of it is voluntary.

This creates two acquisition routes. A person may discover the facility on the Omni map, or may already be inside the facility and scan a QR/link voluntarily displayed by the Seller. In the second case, the user installs/opens Omni and lands directly on that facility’s catalogue. In both cases, the public facility QR opens public catalogue context only. It does not grant private transaction access and is never reused as the Buyer transaction QR. When the Seller distributes the QR, Omni can attribute visits, activations, verified transactions and eligible reviews to that channel.

The on-site route is not a remote availability request. The Buyer selects a listed product and quantity, the server validates the active offer, binds the eligible coupon/advantage to the authenticated Buyer account and snapshots the price, reduction, currency, campaign, place/context and expiry, then creates an `onsite_offer` intent and a Buyer-owned transaction QR that references this server-side transaction/coupon binding. At the counter, the Seller uses Omni Scanner to verify the transaction, the Buyer pays the Seller through the Seller’s accepted external method, and the Seller separately confirms receipt and fulfilment in Omni. Omni records the offer activation and handoff but does not settle or withdraw Seller funds in V1.

The phrase “pay with Omni” may be used as user shorthand only if the surface explains the exact V1 boundary: Omni validates the eligible price/advantage and transaction; the Seller receives payment externally. Until a future settlement contract is approved, product copy should prefer `Activer l’offre Omni`, `Profiter du prix Omni` or `Valider l’avantage chez le vendeur`.

A facility may remain publicly visible without an active offer when policy permits, but it must not be labelled an active Omni offer partner and its QR must not promise an unavailable discount. The Seller Trunk therefore owns not only catalogue CRUD but also offer lifecycle, automatic QR/link generation, optional sharing/attribution controls, credibility/review display and the cashier verification path.
