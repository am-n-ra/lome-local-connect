# Omni V2 — Seed Brief

**Status:** Approved Seed — restart baseline
**Method:** Nature Way — Seed phase
**Date:** 2026-08-22
**Design anchor:** Omni location-eye logo supplied by the founder

> Omni is a geospatial supply-and-demand search engine that helps a person understand what is available in the environment around them before they waste time moving, calling or sending repetitive availability requests.

## 1. The problem

A person may need a product or service without knowing which nearby facility, professional or supplier can provide it. Existing tools separate maps, directories, catalogues, messaging and payment coordination. They rarely show a trustworthy path from “what do I need?” to “which real place may have it now?”, and they make the user contact several providers just to discover that an item is unavailable.

Omni solves this by connecting a live geographic context, source-backed facilities, facility catalogues, availability verification and an eventual traceable handoff. The buyer can discover several options, inspect what each facility offers, ask for availability without blindly polling every seller, compare responses and choose one or more final options. A buyer may also use the catalogue for research and discover other products offered by the same facility without committing to purchase them.

The seller-side problem is complementary. A person or organization may operate several kinds of supply contexts: a physical shop, a home-based activity, a branch in another city, a mobile professional service or an individual expertise. Omni must allow these distinct companies and facilities to exist without confusing the account owner, the facility identity, the catalogue limits or the trust signal.

## 2. Target users

### 2.1 Visitor

A visitor can open Omni and immediately explore the real globe/map, inspect public facilities and understand the product without an account. A visitor does not receive private contact, itinerary, chat, QR or purchase access.

### 2.2 Buyer

A buyer has an account and wants to search for products or services, filter by urgent criteria such as distance, price and quantity, inspect facility catalogues, verify availability across eligible suppliers, compare responses and continue into a controlled purchase handoff. The buyer may leave and return without losing the unfinished context.

### 2.3 Seller

A seller manages one or more companies and facilities. A facility may be public/unclaimed or created by the seller. The seller must provide evidence of identity, facility and product/service activity before the facility can publish visible supply. The seller manages each facility independently while the account manages the rights to create additional facilities.

### 2.4 Admin/operator

An admin reviews evidence and makes audited trust decisions. Operators maintain public-data ingestion, recovery and system observability. These operations must not be disguised as automatic certainty.

## 3. Core promise

> **Search what you need, see where a real facility may provide it, verify availability without unnecessary seller polling, compare your options, and complete a traceable handoff without losing your place on the map.**

The promise has four parts: geographic context, catalogue truth, availability evidence and resumable action. Omni must never imply that a public pin proves current stock, that a paid plan proves trust, or that a search result has already reserved inventory.

## 4. The one core journey

The core journey is:

```text
open Omni → understand the map → search a product/service need → discover source-backed facilities → inspect a facility → choose a catalogue product → request availability → compare verified responses → choose an option → create an authorized intent → complete the external-payment/fulfilment handoff → confirm receipt → rate
```

The map/globe remains mounted throughout the journey. Sheets, rails and cards are contextual surfaces above the map; they are not disconnected page replacements.

## 5. Confirmed business invariants

### 5.1 Public discovery and account gates

Anyone may view the map, public pins and public facility information. A search that queries Omni’s catalogue/discovery database requires an account so Omni can measure and improve discovery. Availability verification, purchase intent and all private seller information require an account and the relevant state transition.

A public facility may show identity, category, source, public hours, public media and public catalogue content. Contact details and Omni-provided itinerary remain hidden until an authorized purchase-intent transition unlocks them.

### 5.2 Facility lifecycle and trust

A facility can be imported as `unclaimed` or created by a seller. Clicking claim never changes the facility status. The seller submits evidence of identity, facility ownership/association and product/service activity. Admin review produces an audited outcome.

After successful certification, a facility becomes `unconfirmed`. It may publish a maximum of five products or services. A facility becomes `confirmed` only after three successful Omni sales. The `confirmed` badge is a trust signal and is never directly purchasable.

### 5.3 Account slots and per-facility Pro

Each seller account receives one facility slot by default. Additional companies or facilities require additional Facility Slots purchased from the single Omni Wallet or included in a future account-level Seller Workspace plan. A global workspace entitlement controls how many facilities an account may manage; it does not grant catalogue limits or the `confirmed` badge.

Each facility has its own commercial plan and limits. Facility Pro can unlock higher catalogue limits and advanced tools for that facility. A facility that is Pro but has not completed three successful sales may exceed the Free catalogue limit, but it displays `certified`/`Pro`, never `confirmed`.

If Facility Pro expires, the facility returns to Free catalogue limits. It keeps `confirmed` only if it has independently completed three successful Omni sales. Pro expiry must never create or preserve a misleading trust badge.

### 5.4 Bonus and wallet

The $20 welcome/traction bonus belongs to the facility, not the account. It becomes spendable only after that facility completes three successful Omni sales, regardless of whether the facility reached higher catalogue capacity through Pro. The bonus is non-withdrawable and usable only for Omni platform features.

There is one rechargeable Omni Wallet per account. A server ledger allocates confirmed funds to Facility Slots, facility Pro, advertising, coupon credits and other platform consumption. Omni V1 does not provide buyer-to-seller in-app payment, seller withdrawal or payout.

## 6. Experience direction

The globe/map is a permanent, dominant, calm visual scene. The interface is not a collection of dashboard pages placed beside a map. It should feel like a premium instrument for seeing availability in the world: restrained glass surfaces, clear spatial hierarchy, generous breathing room, readable cards and motion that explains state rather than decorating it.

The supplied logo establishes the visual language: warm ivory, translucent white, soft peach and a confident orange accent. The eye inside the location pin represents Omni’s purpose: seeing what exists in a place. The logo must be used consistently in arrival, navigation, authentication, PWA metadata and seller surfaces.

## 7. Success criteria for the Seed

The Seed is successful when a new user can explain Omni after seeing the arrival state, complete the map-to-facility-to-availability journey without guessing which control to use, understand exactly when an account is required, distinguish a public source-backed facility from a trusted confirmed facility, and return to an unfinished action without losing context.

A production-ready first release must also prove that seller trust states are not client-mutable, availability does not reserve inventory, paid capacity does not masquerade as trust, wallet spending is ledgered without withdrawal, and every critical action has loading, empty, error, retry, cancellation and recovery behavior.

## 8. Explicit non-goals for the first release

Omni will not be a generic social network, unrestricted public chat, conventional cart marketplace, buyer-seller payment processor, seller withdrawal product, decorative globe, static directory, unrestricted global-data promise or AI agent that mutates business state before the manual workflows are proven.

Native mobile applications, fully automated admin certification, automatic world prepopulation, buyer-seller in-app payments, seller payouts and AI orchestration remain deferred. PWA/mobile web is the first mobile surface.

## 9. Locked Seed decisions

The following decisions were explicitly reconfirmed after the earlier V2 documents were audited and are now authoritative for the restart:

| Decision | Locked rule |
|---|---|
| Primary product | Omni is a map-first geospatial supply-and-demand search engine, not a conventional marketplace grid |
| Core user outcome | Discover nearby products/services, inspect real facilities, verify availability with less seller polling, compare options and complete a traceable handoff |
| Public access | Anyone may explore the globe and public facility information; account is required for database search, availability and protected actions |
| Facility model | One account may manage multiple companies and facilities, including physical, mobile, personal and branch contexts |
| Facility trust | Certification requires evidence and admin review; claim click never changes status |
| `confirmed` badge | Only three successful Omni sales can produce it; Pro cannot purchase or preserve it without those sales |
| Facility Pro | Per-facility commercial entitlement that expands limits and tools for that facility only |
| Facility slots | One free facility slot per account; additional slots come from the Omni Wallet or a future workspace entitlement |
| Bonus | $20 belongs to the facility and becomes spendable only after three successful Omni sales; it is non-withdrawable |
| Wallet | One rechargeable Omni Wallet per account with a server ledger allocating platform consumption |
| Payments | No buyer-seller in-app payment, seller payout or withdrawal in the first release |
| Visual experience | The globe/map remains the permanent dominant scene with floating contextual surfaces |
| Data promise | Use available public data, but never promise unrestricted global coverage or infer supply from a public pin |

## 10. Decisions requiring later Roots contracts

The Seed intentionally does not yet choose the database vendor schema, precise Pro pricing, exact Facility Slot price, supported payment methods, admin evidence taxonomy, geographic coverage SLO, ranking algorithm or final MapLibre tile infrastructure. These must be decided in Roots with explicit API/data contracts before implementation.

## 11. Seed gate

Before Roots begins, the owner must approve this Seed brief and specifically confirm:

1. the core journey and map-first experience;
2. public exploration versus account-gated database search and availability;
3. facility lifecycle and non-purchasable `confirmed` trust badge;
4. one free facility slot, paid/included additional slots, and per-facility Pro;
5. facility-scoped $20 bonus and one rechargeable Omni Wallet;
6. the explicit non-goals and deferred capabilities.
