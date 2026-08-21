# Omni V2 — Data Schema and Business Rules

**Version:** 1.0.0 · **Derived from:** [`v2-master.md`](./v2-master.md) and [`v2-flow.md`](./v2-flow.md)

> This is a planning artifact for migrations and server contracts. Exact open decisions remain open in the master and must not be invented here.

## 1. Data authority order

Every durable business rule follows:

`database constraint → server-side check → UI feedback`

The client may propose input and display server state, but never authorizes a status, amount, stock, QR result, payment receipt, fulfilment completion or wallet availability.

## 2. Core entities

### `companies`

Stores seller/company identity and ownership relationships. A company may own or operate multiple facilities. Company verification facts are separate from facility operational status.

### `facilities`

Stores source-backed or seller-created facility identity, geometry, public metadata, ownership/company relation and current audited operational state.

Required conceptual fields:

| Field | Rule |
|---|---|
| `id` | Stable primary key. |
| `geometry` | PostGIS point/shape; validated and indexed. |
| `source_ref` | Unique within source where present; public source lineage preserved. |
| `status` | Server-controlled; no client direct mutation. |
| `company_id` | Nullable until audited ownership relationship exists. |
| `manual_open`/opening metadata | Operational display only; never proof of stock. |
| `discovery_mode`/expiry | Server-bounded discovery behavior. |
| `created_at`, `updated_at` | Audit and freshness. |

Allowed facility lifecycle is the flow contract sequence, not a free-form enum mutation.

### `facility_verification_requests`

Stores seller request, facility/create context, evidence draft/submission, review state, reason, actor and audit references. A request has an idempotency key for submission and cannot mutate facility status directly.

### `products`

Stores facility-owned catalogue identity, media references, price, real stock, quantity allocated to Omni, publication status and product freshness.

Rules:

- `quantity_allocated_omni >= 0`.
- `quantity_allocated_omni <= real_stock`.
- Product must belong to an eligible facility owner.
- Product identity is referenced by `product_id` in availability and transaction snapshots.
- Client-submitted product text cannot replace an existing catalogue product identity.

### `coupon_offers`

Stores server-owned discount/offer state, eligibility, expiry, redemption policy and product/facility relation. Exact stacking and eligibility rules remain open in the master.

### `availability_requests`

Stores buyer, selected facility/product, scope, quantity, budget, constraints, status, freshness, entitlement snapshot and idempotency key.

Rules:

- A request references a real active product where one exists.
- A request may target one Free facility or bounded visible Pro scope according to server entitlement.
- A request does not reserve stock or mutate product allocation.
- Quantity is positive when provided.
- Budget may be unlimited.
- Duplicate idempotency key returns the original request.

### `availability_responses`

Stores seller/approved-auto response, status (`available`, `partial`, `unavailable`), quantity, price, offer snapshot, message, freshness, correction metadata and idempotency key.

Rules:

- Response belongs to one request and eligible facility/product.
- Auto-response correction is explicit and audited.
- Response ordering is server-defined: available, partial, unavailable, then price.
- A response does not expose private contact or create a transaction by itself.

### `transactions`

Stores one purchase context created from one eligible response. Immutable snapshot fields include facility, product, quantity, gross price, coupon/discount, net amount and relevant response freshness.

Rules:

- Creation requires an eligible response and buyer authorization.
- One idempotency key produces one transaction.
- Snapshot values cannot be changed by later catalogue edits.
- State transitions are actor- and current-state-checked.

### `transaction_events`

Append-only event log with transaction id, event type, actor, previous state, next state, safe metadata, idempotency key and timestamp. Duplicate event keys are no-ops or return the original event.

### `transaction_qr`

Stores a server token reference, transaction id, expiry, status, redemption count/result and safe audit references. Raw token values are never generic analytics data and must not be logged.

Rules:

- QR is created only for an authorized open transaction.
- Redemption requires transaction match, expiry check and replay protection.
- A valid duplicate redemption is idempotent; replayed/expired/mismatched/malformed codes have distinct outcomes.

### `wallet_ledger`

Stores one Omni Wallet ledger for recharge and platform spending. Provider deposits begin pending and become available only after server-confirmed callback/reconciliation. Exact bucket names and spending priority remain a master decision.

Rules:

- FedaPay is recharge only.
- Pending, failed, cancelled and expired deposits are not spendable.
- Buyer-seller payment is not recorded as wallet spend.
- Withdrawal/payout is not a V2 V1-scope operation.
- Every provider reference and ledger mutation is idempotent.

### `notifications`

Stores transactional event, safe deep-link context, recipient, read state and expiry/retention policy. Notification payloads must not contain QR secrets, raw payment secrets or private content beyond recipient authorization.

### `analytics_events`

Stores consent-aware pseudonymous events with safe context, timestamp, event type and coarse location where permitted. Raw GPS, private chat contents, QR tokens, credentials and payment secrets are excluded.

## 3. Transition enforcement matrix

| Rule | Database | Server | UI |
|---|---|---|---|
| Claim click does not certify | constrained status transition/review relation | role + review outcome check | label as request, not claim/status change |
| Allocation cannot exceed stock | check constraint | re-check in transaction | field validation and server error |
| Availability does not reserve | separate request/response tables | no allocation mutation | copy says check, not reservation |
| One intent per idempotency key | unique index | return existing context | disable while submitting, recover on retry |
| Contact after intent only | projection/authorization view | omit private fields before authorized state | locked CTA with explanation |
| QR replay safety | unique redemption/event relation | expiry/match/replay check | explicit expired/replay/mismatch state |
| Seller confirms payment | transaction state transition | seller actor + current state | buyer declaration stops at payment declared |
| Wallet pending not spendable | ledger status constraint | callback reconciliation | show pending, never available prematurely |
| Review outcome audited | review/outcome relation | admin role, reason, actor | explicit outcome controls |

## 4. Concurrency and idempotency

Every mutation that can be retried from a browser, webhook, scanner, double tap or reconnect must accept an idempotency key. The server must use a unique operation key and current-state guard within one database transaction. A duplicate must return the existing authoritative outcome rather than create a second transaction, QR redemption, ledger entry, review decision or fulfilment event.

Optimistic UI is permitted for non-critical presentation only. Intent, QR, payment, fulfilment, review and wallet operations use explicit pending states and server reconciliation.

## 5. Migration sequence

1. Create V2 migration ledger and shared PostGIS/index prerequisites without importing V1 application tables.
2. Create companies, facilities and verification request tables.
3. Create products, media references and coupon offers.
4. Create availability requests/responses and entitlement references.
5. Create transactions, events, QR and participant authorization.
6. Create payment/fulfilment/rating fields and event constraints.
7. Create Omni Wallet ledger and FedaPay reconciliation references.
8. Create notifications and consent-aware analytics events.
9. Add indexes, unique/idempotency constraints, state checks and audit triggers.
10. Seed only deterministic development fixtures; never copy V1 production data into V2 without an explicit decision.

Each migration must be applied to the V2 Neon branch, reviewed, tested against rollback/forward expectations and kept separate from V1 migration history.

## 6. Open schema decisions

The master must resolve exact Free/Pro scope, evidence types/retention, three-sale qualification, wallet bucket names/spending priority, coupon stacking/eligibility, FedaPay callback details, fulfilment metadata, notification retention and OSM operations before those migrations are finalized.
