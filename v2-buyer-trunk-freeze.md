# Omni V2 — Buyer Trunk Freeze

**Document ID:** `OMNI-V2-BUYER-TRUNK-FREEZE-001`
**Method:** Nature Way — Phase 3 entry preparation
**Status:** `authorized_next_slice`
**Root status:** `review` — not silently promoted
**Date:** 2026-08-23
**Authority chain:** Seed → Species → Root System → Flow → Buyer Trunk Entry Boundary

> This artifact freezes the next Buyer Trunk slice so implementation can proceed without reopening the visual direction, inventing a second layout language or pulling Seller, Wallet, QR or payment branches into the buyer core.

## 1. Decision

The next implementation unit is the map-first Buyer Trunk from public arrival to a persisted availability request and an honest pending/comparison boundary:

```text
idle_globe | local_map
→ search_input
→ bounded_discovery
→ facility_focus
→ public_facility_detail
→ catalogue_ready
→ product_selected
→ availability_scope
→ availability_constraints
→ auth_required | availability_submitting
→ submitted/pending
→ responses_visible | no_response | recovery
→ comparison
```

This is the defining buyer promise in the Seed: a person can discover a source-backed facility, choose an existing facility-scoped catalogue offer and ask for bounded availability without confusing a public pin with stock, availability, purchase intent or seller permission. The map remains mounted throughout, and all sheets, cards, docks and account surfaces remain contextual overlays above it.[1] [2]

The user has authorized this Buyer-first execution order. That authorization does not claim that the global Root gate is closed, nor does it authorize direct Auth-table writes, fabricated bearer tokens, a second authentication provider, in-app buyer/seller payment, seller payout, or a Seller Trunk implementation inside this slice.

## 2. Inherited visual and interaction DNA

The Buyer Trunk inherits the approved Species composition rather than creating a new dashboard. The application viewport is full-screen map context. The upper-left role switch remains compact, the upper-right J5/account control remains the only navigation owner, map controls remain on the right, and the search dock remains a distinct bottom region. When nearby results are visible, the dock occupies its own band above the lower sheet/grid with a measured gap; it may not overlap the rail, cards, map controls or location state.[3]

The first result surface retains `Proche de vous`, `Voir tout`, one complete facility/product card, a safe partial next card and one dark-green `Vérifier la disponibilité` action. Facility detail uses the same white rounded sheet family. Catalogue selection appears before the availability steps. The availability rhythm remains `Produit → Portée → Contraintes → Réponses`, and the contact, itinerary, chat and QR actions remain visibly locked until a later server-confirmed purchase intent.[3] [4]

## 3. Current implementation reconciliation

| Contract area | Current evidence | Decision for this slice |
|---|---|---|
| Public discovery | `listPublicFacilities` reads bounded map bounds, query and category and returns a typed public result; the current UI loads a ready, empty or error state | Preserve the seam and complete loading/timeout/retry/fallback evidence without inventing supply facts |
| Map | `TrunkMap` mounts MapLibre, real OSM raster tiles, a local fallback, a globe projection, clustered public facilities, selected-pin focus, right-side zoom/location controls and interruptible idle motion | Keep map ownership; close the approved gaps around explicit map modes, location timeout/approximate recovery, zoom controls and measured safe areas |
| Search | One dock input and one Options disclosure exist; submit and Enter use the same handler; authenticated search preserves the query/options boundary | Keep one dock; expand only typed options required by the contract and preserve query/filter/context across Auth and errors |
| Facility | Selecting a card or pin opens public detail and loads the facility catalogue; contact and itinerary are not exposed | Preserve source/trust distinction and back restoration; prove catalogue loading, empty, closed, unavailable and ready states |
| Catalogue | Facility-scoped products are selected from the existing catalogue; the availability flow starts with the first product selected | Preserve product identity; no free-text product creation, reservation, intent or private unlock |
| Availability | The four-step Product/Scope/Constraints/Responses surface calls the protected availability writer with an Auth bearer and idempotency key; the current production-connected UI request was accepted and reached `submitted` state | Keep the real operation; complete Auth restoration, pending/resume, duplicate/retry/error and comparison boundary states |
| Comparison | Current UI ends at a comparison placeholder and has no response-card API/client model | Add only the typed response/comparison read seam and honest empty/no-response states required by the Buyer Trunk; leave purchase intent for a later branch unless its contract is separately opened |
| Account | Official sign-in/sign-up exists in the J5-owned sheet and preserves an availability return target | Keep the account owner singular; prove guest/authenticated/resume states and never add a hamburger or side dashboard |
| Seller | Current `Vendre` surface is an authenticated entry boundary only; it does not respond to demand or issue QR | Keep Seller outside this slice; design its mini-species only after the Buyer Trunk gate as the next sequenced unit |

The current API client already has three real seams: bounded public discovery, public facility detail and authenticated availability creation.[5] The implementation gap is therefore primarily completion of state ownership, response/comparison contracts, recovery and proof—not a reason to introduce a second frontend architecture.

## 4. Buyer Trunk acceptance contract

| Gate | Required behavior | Evidence required |
|---|---|---|
| Map arrival | Real map/globe remains dominant, public pins/clusters are source-backed and the idle motion is interruptible | Browser proof at 320/375/768/1280; reduced-motion and map-control checks |
| Location | Permission is explicit; granted, denied, unavailable and timeout/approximate outcomes preserve manual exploration | Controlled browser permission proof and safe retry/fallback state |
| Search | One dock, one Options disclosure, right-aligned submit, Enter/button parity and no camera movement from typing | UI/browser assertions plus query/options persistence |
| Discovery | Bounded source read returns ready, empty, timeout, error and labelled fallback states | API and browser proof; no fabricated data |
| Facility | Card/pin selection opens public detail and returns to the prior map/result context | Back/Escape/close and selected-context proof |
| Catalogue | Existing facility product identity is selected before availability; loading/empty/closed/unavailable/error states are honest | Facility-scoped API and UI proof; no reservation/intent side effect |
| Availability | Product, scope, quantity and budget reach the protected server operation; account is required at the boundary; success shows persisted pending state | Real Auth bearer, one request, no-reservation negative, duplicate idempotency and recovery proof |
| Pending/comparison | Pending state names owner/freshness/expiry and offers resume; eligible responses are ordered by facility, freshness, price, quantity and status; private actions stay locked | Browser and integration proof for pending, no-response, stale/expired and eligible comparison |
| Privacy | Public facility/pin never exposes private seller data; contact, itinerary, chat and QR remain locked before intent | API response inspection and negative UI assertions |
| Responsive/accessibility | No overlap or horizontal overflow; focus, keyboard, touch, reduced motion and sheet safe areas work | Four-width visual/browser pass and semantic accessible-name checks |

The server remains authoritative for trust, price, stock, freshness, eligibility, persistence and success. The client can render state but cannot establish those facts.[1] [2] [4]

## 5. Explicitly out of scope

The Buyer Trunk does not implement seller demand response, seller workspace, facility claim/certification, wallet recharge, Facility Pro, purchase intent, transaction-room chat, QR issuance or verification, camera permission, external payment declaration, seller acknowledgement, fulfilment, rating, seller payout or withdrawal. It may render their pre-intent locked states only when that is required to explain the boundary honestly.

The Buyer Trunk does not replace the current Auth provider, create Neon Auth rows through SQL, fabricate a JWT, read a bearer token into evidence or use the old chat password. The existing current-environment demo request is bounded evidence of Auth-backed buyer availability/account provisioning; it is not a seller proof or a global Root pass.

## 6. Implementation order for the next phase

1. Freeze the shared state model and typed API envelopes for map, discovery, facility, catalogue, Auth return, availability pending and comparison.
2. Complete the map-owned states and safe-area layout without changing the Species composition.
3. Complete the dock/search/options and facility/catalogue transitions with context restoration.
4. Add the pending/no-response/comparison client seam against server-authoritative response data, keeping protected actions locked.
5. Add the required error, retry, cancel, duplicate, expiry, refresh, back, Escape and interrupted-session recovery behavior.
6. Prove the complete Buyer Trunk with real or explicitly bounded current-environment data, update the Root/Trunk evidence ledgers and stop before opening the Seller Trunk.

## 7. Ring decision

This freeze is ready for the Buyer Trunk implementation phase because the visual authority, state sequence, server seams, privacy locks, current gaps and non-goals are explicit. It does not close Root. The next ring is implementation of this single Buyer Trunk, followed by its own Heartwood proof. Seller mini-species and Seller Trunk work begin only after the Buyer Trunk ring has a recorded decision.

## References

[1]: ./v2-seed.md "Omni V2 Seed"
[2]: ./v2-flow.md "Omni V2 Flow and State Contract"
[3]: ./v2-species.md "Omni V2 Species Design Blueprint"
[4]: ./v2-trunk-entry-boundary.md "Omni V2 Buyer Trunk Entry Boundary"
[5]: ./src/trunk/api.ts "Omni V2 Buyer API client"
