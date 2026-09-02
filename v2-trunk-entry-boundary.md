# Omni V2 — Buyer Trunk Entry Boundary

**Document ID:** `OMNI-V2-TRUNK-ENTRY-001`
**Method:** Nature Way — Phase 3 entry definition
**Status:** `authorized_next_slice`
**Root status:** `review` — the global Root proof is not silently closed
**Parent:** [`v2-root-system-proof.md`](./v2-root-system-proof.md)
**Design:** [`v2-species.md`](./v2-species.md)
**Flow:** [`v2-flow.md`](./v2-flow.md)

## Purpose

This document defines the first Trunk slice without permitting implementation to expand into seller, wallet, QR, payment or admin branches. It is a boundary, not a claim that the Trunk is implemented.

## Core journey

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
  → responses_visible
  → comparison
```

The slice exists to prove Omni’s defining buyer promise: a person can use a real map to find an existing facility-scoped product and request evidence of availability without confusing a public pin with stock, availability or a purchase.

## Species inheritance

The Trunk inherits the approved Canva composition and map states:

| Trunk surface | Species source |
|---|---|
| Arrival | S01 reference frame, S28 idle globe and S29 local fullscreen map |
| Search | S02/S03 bottom dock and upward Options surface |
| Discovery | S04 result sheet, S30 cluster and S31 trust-marker semantics |
| Facility | S05/S06 and S32 selected-facility focus |
| Availability | S07/S08/S09 with map preserved behind the sheet |
| Comparison | S10/S22 with contact, itinerary, chat and QR locked |
| Return | S34 map recovery plus account-owned resume rules |

No new dashboard, hamburger, side rail or alternative search bar may be introduced. The J5/account control remains the sole navigation owner.

## Root API seam

The Trunk may call only these Root operations until a later branch is approved:

| Operation | Input | Output | Public/protected boundary |
|---|---|---|---|
| `discover(bounds, query, filters)` | Map bounds, query and typed filters | Facilities/clusters, source/status, freshness and recovery outcome | Public bounded read; no private data or stock guarantee |
| `getFacility(facilityId)` | Public facility ID | Public identity, location policy, trust/source state and catalogue summary | Public fields only |
| `getCatalogue(facilityId)` | Public facility ID | Facility-scoped published offers and eligibility | Public active catalogue policy |
| `createAvailability(request)` | Authenticated buyer, facility/product, scope, quantity and constraints | Persisted request ID/state, expiry and correlation ID | Auth required; no reservation or intent |

The Trunk must not implement `createIntent`, `getRoute`, QR verification, external payment, fulfilment, wallet recharge or seller response mutation as part of this entry slice.

## Non-negotiable invariants

Public source presence is not stock. A cluster is density, not supply. An unclaimed or uncertified facility cannot be presented as a verified seller catalogue. Product selection uses an existing facility catalogue identity; it does not silently create a product. Availability does not reserve stock. Auth is requested at the protected availability boundary and not earlier than necessary. Comparison exposes only persisted eligible responses. Contact, itinerary, chat and QR remain locked because intent has not yet been created.

The client cannot establish price, stock, trust, freshness, availability, entitlement, permissions or success. The server owns those facts. Each mutation uses a correlation ID and idempotency key where duplicate submission is possible.

## Context preservation

Every transition preserves map mode, camera center/zoom/bounds, query, filters, selected facility, selected product and request ID. Facility close returns to the prior result context. Back/Escape/close never erase a query or recreate an availability request. A refresh may restore the client snapshot, but it must re-read business state from the server.

## Entry proof plan

The Trunk gate requires a positive and negative proof for each boundary:

1. Map canvas and approved arrival composition are visible at 320, 375, 768 and 1280 pixels.
2. Globe, local map, cluster and selected-pin modes preserve camera ownership and do not imply supply.
3. Discovery handles bounded success, empty, source failure, timeout and labelled fallback.
4. Facility selection opens public detail and restores the previous map/result context.
5. Catalogue loading, empty, closed, unavailable and ready states are visible; product selection has no reservation or intent side effect.
6. Availability requires Auth at the protected boundary, validates scope/quantity/constraints, rejects forged actor or facility data, persists once and returns a recoverable request state.
7. Comparison orders only eligible fresh responses and visibly locks contact, itinerary, chat and QR.
8. Browser/server boundary, secret scan, API envelope and correlation/idempotency checks pass.

## Stop conditions

Stop Trunk work and return to Root System if a decision changes schema authority, migration strategy, privacy, trust, money, Auth, route authorization or the critical buyer journey. Stop and mark the unit `blocked` if live Auth, database persistence, bounded source behavior or a required recovery proof cannot be exercised. Do not replace a missing proof with a screenshot or fixture.

## Nature Way decision

The Trunk entry boundary is authorized for the next bounded Buyer implementation slice by the current product decision, while the global Root System remains `review`. This is an explicit sequencing exception for the buyer core, not a claim that seller bearer/QR/payment proof is complete. Implement only this complete vertical slice and do not open the Seller, Wallet, Transaction or QR branches until the Buyer Trunk ring has a recorded decision and the Root residuals are reconciled.
