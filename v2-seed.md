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
