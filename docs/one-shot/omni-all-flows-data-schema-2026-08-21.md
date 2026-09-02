# Omni All V1 Flows — Data Schema and Business Rules

## Enforcement order

Omni uses **database constraint → server-side check → UI feedback**. UI states communicate server truth; they do not establish it. All client modules remain separated from database drivers, secrets, auth internals and server-only modules through typed server-function adapters and the client-boundary check.

## Core object correspondence

| Frontend type | Backend table/function | Database/server rules | Failure if ignored |
|---|---|---|---|
| `MapFacility` / `FacilityDiscoveryCard` | `facilities`, `products`, `listFacilitiesInBounds` | Bounds, scope, antimeridian, public fields and source provenance are server-controlled | Client could widen global scope or present invented stock |
| `FacilityDetail` | `getFacility`, `facility_media`, `products`, offers/coupons | Public detail only; private contact excluded until intent | Contact or private seller data could leak before intent |
| `CatalogProduct` / `ProductSelection` | `products`, `facilities`, `demand_requests.product_id` | Product belongs to facility, active, valid discount, current stock and eligible facility status | Request could target another facility or stale/deleted product |
| `AvailabilityDraft` | `createDemandRequest`, `demand_requests` | Free/manual one target; Pro bulk bounds; product/status/stock/idempotency | Direct request could bypass entitlement or unclaimed lock |
| `DemandResponse` | `demand_responses` | Response relation, status enum and seller authority; auto-response double condition | Buyer could treat a stale or unverified response as purchasable |
| `PurchaseIntent` | `createPurchaseIntent`, transactions/purchase intents | Server amount, offer/coupon snapshot, idempotency and eligible response | Client amount/coupon tampering or duplicate transaction |
| `TransactionTimeline` | `transactions`, `transaction_events` | Actor/status transition matrix, immutable event/audit trail | A client could jump from intent to paid/complete |
| `TransactionMessage` | `transaction_messages`, `chat.functions` | Membership/authorization, message idempotency and moderation fields | Generic chat access or duplicate messages |
| `TransactionQr` | transaction QR columns/functions | Server token, expiry, transaction binding, single-use/replay state | Forged, replayed or wrong-transaction QR |
| `PaymentDeclaration` | transaction payment fields/events | Buyer declaration and seller confirmation are separate actor actions | Buyer claim could falsely mark money received |
| `FulfilmentState` | transaction status/events | Seller action starts fulfilment; buyer confirms receipt | Transaction could complete before delivery/receipt |
| `Rating` | rating table/function | Only buyer after receipt; one rating per transaction | Rating could unlock early or be duplicated |
| `FacilityVerificationRequest` | `facility_claim_requests`, `facility_claim_evidence` | Idempotent request, claimant ownership, evidence stages and review audit | Claim click could directly change public facility status |
| `WalletLedgerEntry` | wallet/balance/deposit tables and FedaPay functions | Confirmed deposit only spendable; ledger immutable; bucket authorization | Pending or external money could be spent/withdrawn |
| `Notification` | notifications | Deep link validated against actor and target authorization | Notification could expose private transaction context |
| `MapContextSnapshot` | session storage/memory adapter | TTL, no raw GPS/tokens/QR/chat/payment secrets | Private context leakage or stale action replay |

## Facility and certification rules

The facility lifecycle is represented by public status plus a separate verification-request workflow. The database must prevent invalid status values with an enum/check. `facility_claim_requests` has a unique idempotency key per claimant/facility/request type and foreign keys to facility/user. Evidence rows belong to the request and carry stage, storage reference, checksum/metadata and submitted timestamp. Review rows/audit events carry actor, outcome, reason and timestamp.

Server rules:

1. A public unclaimed facility can be discovered and inspected but cannot receive controlled availability, contact, intent or transaction operations.
2. Creating or clicking claim creates/reuses a verification request and never mutates facility status.
3. Only staff review can output `certified`, `unconfirmed` or `rejected`.
4. `confirmed` requires the approved eligible completed-sales condition and audit record.
5. Pro payment never changes trust status.

## Product and catalogue rules

Products use existing foreign keys to facilities and existing status/stock/discount constraints. Every published product satisfies the repository’s discount requirement. Product selection carries `productId`; fallback `searchTerm` is descriptive context when no catalogue match exists.

A server request with `productId` must verify:

- product exists and belongs to the target facility;
- facility status is not `unclaimed`;
- product is active and currently eligible;
- requested quantity is within current available/Omni allocation rules;
- target facility list is compatible with the product facility;
- current price/offer/coupon is re-read at intent time.

The server may reject a stale product with a refreshable error. It must not silently substitute another product.

## Availability and concurrency

`demand_requests.product_id` is nullable for fallback search, but non-null product IDs are validated. Manual mode targets exactly one eligible facility. Bulk mode requires Pro entitlement and a bounded target list. A check does not reserve or consume allocation.

If a later transaction path reserves limited inventory, use an atomic conditional update rather than read-then-write:

```sql
UPDATE products
SET quantity_reserved = quantity_reserved + :requested_quantity
WHERE id = :product_id
  AND (quantity_available - quantity_reserved) >= :requested_quantity;
```

Zero affected rows produces an insufficient-stock state. Completion deducts real quantity and releases any reservation. Cancellation/expiry releases only the reservation. No unresolved hold may remain indefinitely.

Availability creation uses a stable idempotency key derived from buyer, product/facility target, quantity, budget, mode and search context. A timeout requires lookup before retry. Repeating a successful key returns the same request.

Auto-response remains bounded by the locked rule: facility open **and** `quantity_allocated_omni > 0`. A simple availability check does not consume allocation. Seller correction creates a correction event and buyer notification.

## Purchase intent and transaction data

Intent creation is an atomic/idempotent server operation. It snapshots buyer, seller, facility, product/service, quantity, current server price, coupon/offer result, discount reason, net amount, payment mode placeholder and transaction/session ID. Client-supplied amounts are never authoritative.

The server returns an authorized transaction context only after creation. Before that response, read models must omit private contact, itinerary, chat authorization, QR token and payment secrets. The intent must bind to the selected response and reject stale/expired/unavailable responses.

Transaction events form an append-only timeline. Current transaction status is derived from valid transitions; arbitrary client status writes are rejected. A status transition records actor, timestamp, reason and idempotency key.

## Chat data rules

Transaction messages belong to a transaction/demand/offer thread. The server checks that the caller is the buyer, seller, facility owner or staff actor authorized for that transaction. Message sends include a client message ID or idempotency key. Server/system messages are generated from events and cannot be spoofed by the client.

The chat read model may return product/facility/amount/next-action context, but no transaction thread exists for unauthenticated public discovery. Contact and itinerary are separate authorized fields and must not be smuggled through message payloads.

## QR rules

QR creation stores token hash/reference, transaction binding, created time, expiry, generated-by actor and replay/verified timestamp. The raw token is returned only to the authorized buyer/seller surface that needs it. Verification performs an atomic check that the token is current, bound to the expected transaction and unused/replay-safe, then records the verifying actor/device/time.

Camera and manual entry share the same verification function. Wrong transaction, malformed, expired, replayed and network-unknown results are distinct recoverable states. A replay must return the true existing resolved state or an explicit rejection, never a second verification side effect.

## Payment, fulfilment, receipt and rating

Payment method selection and payment declaration are buyer actions. Seller payment confirmation is a separate server-authorized action. External payment methods include cash delivery, TMoney, Flooz or other agreed external method. Omni stores the fact, method and audit timestamps but does not claim to process the money.

Seller fulfilment starts only from a paid/appropriate state. Buyer receipt confirmation is separate. Rating is permitted only after receipt and is unique per transaction. Cancelled, expired or disputed states do not silently become completed.

## Wallet and FedaPay

The product has one rechargeable Omni Wallet. FedaPay is a recharge provider boundary only. A deposit starts pending, is confirmed by the server/webhook/reconciliation path and only then updates spendable balance. Ledger entries are immutable and bucket/feature usage is server-authorized.

The wallet can fund Omni platform features such as Pro, advertising or coupon/ad credits where enabled. It is not the buyer-seller payment rail. Seller withdrawals and payout buckets are outside V1. UI must distinguish pending deposit, available wallet, restricted platform credit and transaction amount.

## Notifications and analytics

Notifications refer to validated object IDs and deep links. A notification handler rechecks authorization and current state before revealing a transaction or certification surface. Analytics events are consent-aware and minimized. Generic analytics do not contain raw GPS, private chat content, raw QR tokens, payment secrets or unnecessary identity fields.

## Frontend/backend correspondence checklist

| UI state | Adapter | Authoritative server fact |
|---|---|---|
| Globe/results | discovery adapter | viewport/scope/source-backed facility payload |
| Facility detail/catalogue | facility/catalogue adapter | public facility and active product payload |
| Availability setup | demand adapter | entitlement, target, product, stock and idempotency |
| Comparison | demand response read model | current response status/freshness/eligibility |
| Intent confirmation | intent adapter | server amount/offer/coupon and transaction ID |
| Transaction room | timeline/chat adapter | actor-authorized timeline and message access |
| QR scanner | QR adapter | token validity/expiry/replay/transaction binding |
| Payment/fulfilment | transaction action adapter | actor transition matrix |
| Wallet | wallet/FedaPay adapter | confirmed deposit and ledger spend |
| Verification review | staff verification adapter | evidence ownership, outcome and audit |

## Closing checks

Every locked UI rule has a database or server enforcement location. Limited inventory uses atomic operations. Product identity is preserved from catalogue to intent. Unclaimed status is operationally locked. Chat and contact are authorization-bound. QR cannot be minted or replayed client-side. FedaPay recharge is separate from external transaction payment. No frontend type or backend table in this artifact is intentionally orphaned.
