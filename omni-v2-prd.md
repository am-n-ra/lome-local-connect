# Omni V2 — Product Requirements (Derived View)

**Document ID:** `OMNI-V2-PRD-002`
**Status:** Derived compatibility view — not an independent authority
**Method:** Nature Way
**Authoritative product source:** [`v2-seed.md`](./v2-seed.md)
**Authoritative visual source:** [`v2-species.md`](./v2-species.md)
**Authoritative technical source:** [`v2-roots.md`](./v2-roots.md)
**Authoritative behavior source:** [`v2-flow.md`](./v2-flow.md)

> This file is retained for existing links and tooling. Do not make an independent product decision here. Update `v2-seed.md` first, then regenerate this view if a compatible summary is still needed.

## Product identity

Omni is a **map-first geospatial supply-and-demand search engine**. It helps a person discover what products or services may be available in the surrounding environment, inspect source-backed facilities, select real catalogue offers, verify availability, compare responses and complete a traceable handoff.

The permanent map scene is the application’s spatial context. Search, facilities, catalogue, availability, comparison, seller operations and transaction handoff appear as contextual surfaces above it. Omni is not a conventional marketplace grid, generic social network, unrestricted public chat, buyer-seller payment processor, seller payout product or decorative globe.

## Core journey

```text
map arrival
→ need search
→ source-backed facilities
→ facility detail
→ catalogue product
→ availability request
→ response comparison
→ purchase intent
→ authorized transaction room
→ QR/external payment declaration
→ fulfilment
→ receipt
→ rating
```

## Product users

| Actor | Need | Product response |
|---|---|---|
| Visitor | Explore and understand public context | Public map, pins, facilities and catalogue information |
| Buyer | Find and verify a product/service need | Catalogue-first search, bounded availability and comparison |
| Seller | Represent real companies/facilities and operate supply | Evidence, facility-scoped catalogue, demand response and handoff tools |
| Admin | Make trust decisions from evidence | Audited manual review and explicit outcomes |
| Operator | Keep discovery and operations healthy | Bounded imports, recovery, analytics and observability |

## Non-negotiable requirements

| Requirement | Rule |
|---|---|
| Public access | Public map and facility information are visible; protected search, availability and private data require Auth |
| Catalogue | Select an existing facility product before availability when one exists |
| Availability | It is a request for evidence, never an inventory reservation |
| Facility trust | Claim click creates evidence work; admin certification precedes `unconfirmed`; three successful Omni sales produce `confirmed` |
| Pro | Facility-scoped capacity/tools; never a purchased trust badge |
| Capacity | One free Facility Slot per account; additional slots are platform entitlements |
| Bonus | Facility-scoped $20 non-withdrawable credit, spendable only after three qualifying sales |
| Wallet | One rechargeable Omni Wallet per account; ledgered platform consumption only |
| Transaction | Only an eligible response creates an idempotent intent and immutable snapshot |
| Private data | Contact, itinerary, chat and QR unlock only after intent |
| Payment | External payment declaration/acknowledgement only; no buyer-seller rail, payout or withdrawal in V1 |
| Honesty | No public pin, fixture, Pro plan, claim click or client label may imply unsupported truth |
| Resumability | Refresh, close, back, expiry, failure and interruption preserve safe unfinished context |

## Scope view

| Capability | Treatment |
|---|---|
| Map/globe and public discovery | Build now |
| Catalogue-first availability and comparison | Build now |
| Facility verification and seller onboarding | Build now; admin review may be manual |
| Seller map-first operations | Build now |
| Intent, transaction room, QR and fulfilment | Build now |
| One Wallet and FedaPay recharge | Build now; platform consumption only |
| PWA/mobile web | Build now |
| Bounded public-data adapter | Build now as operational/manual capability |
| Automated certification, native apps, AI state mutation | Deferred |
| Buyer-seller in-app payment, seller withdrawal/payout | Deferred/not in first release |
| Unrestricted global prepopulation | Not promised |

## Requirement gate

This derived view is valid only when it matches the Seed, Species, Root System and Flow. If it differs, the mismatch is a documentation defect; reconcile the authoritative documents before implementation.
