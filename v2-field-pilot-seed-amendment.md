# Omni V2 — Seed amendment: field pilot

**Document ID:** `OMNI-V2-SEED-AMENDMENT-FIELD-PILOT-001`

**Status:** `accepted for bounded planning / Root and release gates remain open`

**Method:** Nature Way — Seed → Species → Root System → Trunk → Heartwood → Canopy → Rings

**Parent authority:** [`v2-seed.md`](./v2-seed.md)

**Date:** 2026-08-24

> This is a focused amendment for a controlled field pilot. It does not silently replace the original Seed, the Species blueprint or the Root System. The owner confirmed the bounded planning defaults on 2026-08-24: initial geography Lomé–Aflao, as much OSM-backed coverage as can be responsibly imported, one or more Omni team members as reviewers, Omni inbox first with PWA-capable opt-in notifications, and OSM path A. Root and release gates remain open.

## 1. Pilot objective

Omni must become usable by a small, real field cohort: an operator can discover or register a facility, a legitimate facility representative can create or resume a claim, the facility can complete the approved verification boundary, the seller can publish a facility-scoped catalogue, and a real buyer can search the map, select a catalogue product, ask for availability, receive an honest response and resume the request. The map must contain source-backed public context without turning a public pin into stock, trust, ownership or permission.

The pilot is not an unrestricted global marketplace launch. It is a controlled ring that proves the complete operational loop in one bounded geography and with named human ownership for review, support, source recovery and incident response.

## 2. Actors and responsibilities

| Actor | Pilot responsibility | Boundary |
|---|---|---|
| Visitor | Explore the world map and public facility context | No protected search, claim, availability, contact or transaction action |
| Buyer | Create an account, search a need, select an existing catalogue product and request availability | Own requests only; availability is not reservation; private handoff remains state-gated |
| Seller / facility representative | Create or claim a facility, submit evidence, publish eligible products and answer owned demand | Cannot self-certify, fabricate trust, exceed allocation or mutate another facility |
| Omni field operator | Import or register bounded public context, assist onboarding, inspect queue and run recovery | No silent trust mutation, no arbitrary database edits and no impersonation of a user |
| Admin reviewer | Review evidence and issue an audited outcome | Manual authority until an automated review system is separately proven |
| Server | Authorize, validate, persist, notify and audit every sensitive transition | Never trusts client status, price, stock, trust, QR or identity claims |

## 3. Pilot success criteria

The pilot ring is successful only when all of the following are demonstrated in one bounded geography using real Auth sessions and explicitly labelled pilot data:

1. A new Buyer and a new Seller can create accounts through the official Auth surface, return to their triggering context and receive idempotent Omni account provisioning.
2. An operator can import or register a facility with source attribution, stable deduplication and a visible `unclaimed` state, or a facility representative can create a new facility through the account’s available Facility Slot.
3. `Claim` creates or resumes a versioned verification request. It never changes a facility to `certified`, `unconfirmed` or `confirmed` by itself.
4. Evidence is private, owned by the claimant, auditable by the reviewer and recoverable after refresh, cancellation or a request for more evidence.
5. A facility can publish only products allowed by its trust, plan, slot and allocation rules. The map and catalogue distinguish public presence, catalogue publication and current availability.
6. A real Buyer can complete `map → facility → catalogue → product → availability request`; a real Seller can answer only an owned eligible request; the Buyer can read an honest pending, unavailable, partial or available response.
7. If the post-availability branches are included in the ring, intent, immutable snapshot, authorized contact/itinerary, transaction room, QR, external payment declaration, fulfilment and receipt are each server-confirmed. No client label unlocks a private surface.
8. Every critical operation has loading, empty, error, retry, cancellation, duplicate, expiry and recovery behavior, plus correlation/audit evidence and a rollback procedure.
9. The operator can explain the source, freshness, trust state and current availability of every visible pilot facility without using OSM as a trust or notification authority.

## 4. OSM/public-source policy for the pilot

OSM is a geographic/public-source input, not Omni’s business database. Omni stores a source reference and a normalized public-facility record; it owns the claim, verification, catalogue, availability and transaction state. A local Omni claim must not silently edit an OSM object. Any future OSM edit requires a separate, explicit OSM-authorized editing flow with contributor consent, changeset semantics and its own audit.

For map tiles, Omni must use a provider adapter with visible attribution and a runtime-switchable source. Direct use of community-funded OSM tile servers is best-effort and has no SLA; the application must respect HTTPS URL, User-Agent/Referer, caching and no bulk/prefetch/offline rules. If those requirements cannot be met, use an OSM-derived provider or self-hosted stack rather than claiming that the public OSM tile endpoint is production infrastructure.

For lookup and import, the public Nominatim service is limited to deliberate moderate end-user requests and must not be used for autocomplete, systematic grids, bulk POI downloads or recurring bulk geocoding. The pilot therefore uses bounded operator imports and cached source records, not a browser-wide Nominatim search loop. A later source-sync worker may consume OSM replication diffs with state checkpoints, sequence validation, deduplication, retry and recovery; source changes remain separate from user notifications.

## 5. Notification policy

OpenStreetMap does not provide Omni’s Buyer/Seller notification system. OSM’s messaging scopes are for authenticated messages between OSM users, and replication/diff feeds are source-update signals. Omni notifications must originate from server-authoritative domain events such as `verification_submitted`, `verification_needs_more_evidence`, `product_published`, `availability_requested`, `availability_responded`, `intent_created`, `qr_verified`, `payment_declared`, `fulfilment_updated` and `recovery_required`.

The first notification layer is an in-app, account-owned inbox backed by a versioned event/outbox contract. Opt-in Web Push, email or SMS are delivery channels layered on that outbox, with delivery status, retries, suppression, preference and privacy rules. No channel may expose private facility, buyer or transaction data to an unauthorised recipient.

## 6. Explicit non-goals for the first pilot ring

The pilot does not promise unrestricted global facility coverage, instant synchronization of every OSM change, automated certification, claim-by-click trust, buyer-seller in-app payments, seller withdrawals, AI mutations, anonymous availability requests, private contact from a public pin, or OSM as an Omni notification provider. A facility may be visible on the map and remain unclaimed, uncertified, without a published catalogue or without current availability.

## 7. Current baseline and gap statement

The current aggregate Neon baseline, read without exposing rows, reports one V2 account, three V2 facilities, two V2 products, one V2 availability request, no V2 companies, no V2 public-source rows, no facility-source references, no discovery runs, no verification requests/evidence/reviews, no availability responses, no purchase intents and no V2 transaction events. A legacy `notifications` table contains rows but is keyed to legacy profiles and is not by itself a V2 event/outbox contract.

The current V2 HTTP surface has public facility reads, facility detail, Buyer availability, Seller queue/response, purchase-intent, QR, transaction and external-payment seams. It does not yet expose a complete real-user facility creation/claim/evidence/admin-review workflow, bounded OSM import/sync operation, V2 notification outbox/delivery contract or an operator console. The current Buyer map and bounded Buyer/Seller comparison proof therefore cannot be described as field-pilot readiness.

## 8. Definition of pilot-ready

`Pilot-ready` means a bounded, reversible, monitored ring with real Auth sessions, a named operator, a documented geography and source policy, additive migration checks, a working registration/claim/catalogue/availability loop, honest notification behavior, support/recovery instructions and a browser/API evidence record. It does not mean global coverage, zero failures or unrestricted production readiness.

## 9. Owner decisions required before Root implementation

| Decision | Safe default proposed | Why it changes architecture |
|---|---|---|
| Pilot geography | **Confirmed: Lomé–Aflao, with as much responsibly bounded OSM-backed coverage as possible** | Bounds import, data review, support and map freshness |
| Facility onboarding | **Confirmed: one or more Omni team members may review; operator-assisted registration plus self-service account/claim remains the model** | Determines roles, evidence capture, duplicate handling and admin queue |
| Notifications | **Confirmed: Omni inbox first, then opt-in PWA/Web Push capabilities; external email/SMS only after a provider is supplied and verified** | Determines outbox, subscription, privacy and delivery infrastructure |
| OSM role | **Confirmed: path A — bounded operator import/read context with attribution; no automatic OSM edits by Omni** | Determines OAuth/consent, changesets, legal/audit and source-sync design |

No production migration, destructive data action, Auth identity modification or new real-user mutation is authorized by this amendment alone. Each such action requires its own confirmed Root gate and evidence.

## 10. References

[1]: https://operations.osmfoundation.org/policies/nominatim/ "Nominatim Usage Policy"

[2]: https://operations.osmfoundation.org/policies/tiles/ "OSM Tile Usage Policy"

[3]: https://wiki.openstreetmap.org/wiki/API_v0.6 "OpenStreetMap API v0.6"

[4]: https://wiki.openstreetmap.org/wiki/Planet.osm/diffs "Planet.osm replication diffs"

[5]: https://developer.mozilla.org/en-US/docs/Web/API/Push_API "MDN Push API"
