# Omni V2 — Seller Availability Response Mini-Root

**Structural path:** `Root System > Branch B prerequisite > seller availability response`  
**Method:** Nature Way  
**Status:** `implemented-bounded`

## Mini-seed

Allow an authenticated seller to respond to a buyer availability request for an owned facility and an eligible published product. The operation exists only to connect an authorized seller fixture to the existing purchase-intent and transaction Root path. A response does not reserve stock, does not create a purchase intent, and does not expose private seller data.

## Contract

`POST /api/v2/availability-responses`

The request body contains `requestId`, `facilityId`, `productId`, `status`, `quantityAvailable`, `priceMinor`, and an optional `sellerMessage`. The request must include an `Idempotency-Key` header of at least eight characters. The bearer session supplies the seller Auth identity; the client cannot choose the seller account.

The server requires a non-suspended account bound to the authenticated Auth identity, `seller_ready` or `complete` onboarding, an owned facility, a published product belonging to that facility, and a request whose facility scope and product match the submitted response. The product’s persisted `quantity_allocated_omni` is the upper bound for an available quantity. The client-provided quantity and price are validated against persisted product policy; a response does not decrement or reserve stock.

The operation is idempotent for the same request, facility, product, seller and idempotency key. A replay returns the original response. A conflicting reuse of the same key for another response is rejected. The operation creates a response snapshot and an audit event with a correlation ID. It must never mutate public-import ownership, trust state, stock, wallet balance, transaction state or the buyer’s request ownership.

## Allowed statuses

| Status | Required fields | Meaning |
|---|---|---|
| `available` | positive quantity, non-negative price | Seller can meet the requested quantity within the allocated bound |
| `partial` | positive quantity, non-negative price | Seller can meet part of the requested quantity within the allocated bound |
| `unavailable` | quantity `0`, no price required | Seller cannot currently satisfy the request |

`corrected` is a persisted correction state but is not directly submitted by this operation. `stale`, `expired` and `no_response` are server/system outcomes and are not seller-selected here.

## Mini-heartwood acceptance

Positive source/repository proof accepts an authorized seller response to a matching buyer request and records one response plus one audit fact; the persistent-V2 bounded fixture then contains one buyer intent, one immutable snapshot, two memberships and the expected QR/payment event path. Negative unit coverage rejects invalid status/quantity combinations and missing authorized context. The live bearer-backed HTTP response, conflicting-key replay, buyer-actor rejection, concurrent execution and deployed camera recovery remain open; the bounded direct database procedure must not be mistaken for those claims.

## Fixture boundary

The operation was exercised only on the persistent V2 branch using `D-V2-DEMO-SELLER`, `D-V2-DEMO-FACILITY`, `D-V2-DEMO-PRODUCT` and the existing KH buyer fixture. Aggregate results are recorded in [`v2-root-demo-transaction-evidence.md`](./v2-root-demo-transaction-evidence.md). The operation is not a seller workspace UI and does not authorize facility claim, certification, admin review, Pro activation or production writes.
