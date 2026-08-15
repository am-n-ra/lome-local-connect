# Omni Platform Glossary and State-Machine Catalogue

## 1. Glossary

| Term | Canonical meaning |
|---|---|
| Omni | A global geospatial supply-and-demand operating system combining discovery, availability, and transaction action. |
| Map-first | The map/globe is the primary application surface; panels and sheets are contextual layers over it. |
| Facility | A physical, mobile, digital, or hybrid location/entity where supply can be discovered or fulfilled. |
| Company | The business identity that may own multiple facilities and a shared catalogue. |
| Catalogue product | A company-level product/service definition that can be published through one or more facilities. |
| Facility override | A facility-specific price, inventory, availability, status, or offer applied to a shared catalogue item. |
| Omni allocation | The percentage or quantity of inventory that the seller permits Omni to expose and promise. |
| Discovered | A facility or supply object found through an external/public source but not yet sufficiently resolved. |
| Unclaimed | A discovered facility with no authorized Omni owner; searchable but non-purchasable through Omni. |
| Claim requested | An owner/representative has submitted a claim awaiting review. |
| Unconfirmed | A claimed/created facility that has not completed the required trust threshold. |
| Certified | A facility/business that passed the required identity/facility verification process. |
| Confirmed | A certified facility that also completed at least three qualifying verified sales to distinct buyers. |
| Search | A discovery operation combining keyword/semantic/structured/geospatial/indexed-content inputs. |
| Demand request | A buyer expression of a need that may be broadcast to relevant facilities. |
| Availability request | A post-discovery request asking one or more sellers whether a specific item/service can be supplied now. |
| Purchase intent | The transition from research/discovery into a traceable transaction session. |
| QR verification | Seller-side verification that the buyer’s transaction QR is valid; it does not confirm buyer payment. |
| Wallet | A platform balance used for deposits, subscriptions, credits, advertising, and paid Omni services. It is not a seller withdrawal account in the initial release. |
| Credit | A metered entitlement for an expensive Omni operation such as bulk availability, AI, catalogue processing, or advertising. |
| Agent | An optional orchestration layer that proposes or executes typed existing Omni actions under permissions and confirmation rules. |
| Kill switch | Admin-controlled configuration that disables AI/automation while leaving manual flows operational. |
| Source authority | The relative strength of data provenance; confirmed/certified seller data outranks weaker imported or inferred data. |

## 2. State machines

### 2.1 Facility lifecycle

```text
discovered
  └─ import/source resolution → unclaimed
unclaimed
  └─ authorized claim submitted → claim_requested
claim_requested
  ├─ admin approves → unconfirmed
  ├─ admin rejects → unclaimed
  └─ claimant cancels → unclaimed
unconfirmed
  └─ certification approved → certified
certified
  └─ 3 qualifying distinct-buyer verified sales → confirmed
confirmed
  └─ trust/admin review may suspend publication, never silently erase history
```

Unclaimed facilities may appear in discovery, content, and sharing. They cannot receive seller-controlled catalogue mutation, seller availability response, or purchase intent through Omni.

### 2.2 Product publication

```text
draft → active → paused → active
active → sold_out → active
active/paused/sold_out → archived
```

The server determines whether an active item is buyer-visible from facility eligibility, online state, effective price, stock, Omni allocation, publication rules, and search filters.

### 2.3 Inventory effects

Inventory is represented through movements and balances rather than only a boolean:

```text
receive/adjust → available
available → reserve → reserved
reserved → release → available
reserved → fulfil → fulfilled
available → fulfil → fulfilled   (only when reservation is not required by the flow)
```

A movement cannot create negative available quantity, exceed physical quantity, or expose more than allocation permits. Replayed idempotency keys return the original movement result.

### 2.4 Claim and certification

```text
not_claimed → pending_review → approved/rejected/cancelled
approved → unconfirmed facility ownership
unconfirmed → certification_pending → certified/rejected
certified + 3 qualifying verified sales → confirmed
```

Only authorized claimant/member/admin roles can act at each transition.

### 2.5 Availability

```text
open → answered → closed
open → expired
answered → closed
```

Response kinds are:

```text
available | partial | unavailable | alternative
```

A manual seller response is always possible when the seller is authorized. Semi-automatic or automatic responses require seller rules plus enabled AI configuration.

### 2.6 Purchase intent and transaction

```text
pending
  → qr_generated
  → qr_verified
  → payment_pending
  → paid
  → fulfillment
  → user_confirmed
  → completed
```

Exception states are `cancelled`, `expired`, `failed`, and `disputed`. Seller QR verification may move a transaction to `payment_pending` but never to buyer-confirmed payment. Buyer payment and receipt confirmation are explicit actions.

### 2.7 Wallet ledger

```text
pending_deposit → available_balance → spent
pending_deposit → failed
available_balance → reversed/refunded
credit_grant → credit_spent → credit_expired
```

Wallet debits require sufficient available balance, an idempotency key, a typed reason, a reference, and an atomic transaction. Seller withdrawals are not a valid transition in the initial release.

### 2.8 Subscription

```text
free → pro
pro → renewal_pending → pro
pro → renewal_pending → downgraded/free
pro → free (manual expiry/downgrade)
```

The renewal worker or server action must run once per period. Insufficient balance produces a clear downgrade event and does not create a negative wallet.

### 2.9 Coupon and offer

```text
draft → active → paused → active
active → expired
active → exhausted
```

A redemption transaction validates scope, dates, minimum order, quantity rules, user conditions, and maximum redemptions before atomically consuming the coupon and recording the price snapshot.

### 2.10 OSM/import job

```text
queued → running → preview → approved → partially_applied → completed
running/preview/approved → failed
failed → queued (bounded retry)
```

Import rows retain raw source references, normalized values, dedupe candidates, errors, and applied entity IDs. Import cannot bypass plan, ownership, source-authority, or allocation rules.

### 2.11 Agent action

```text
proposed → awaiting_confirmation → approved → executing → completed
proposed → rejected
approved → failed
```

Low-risk drafts may skip confirmation only when policy permits. Price changes, publishing, spending, inventory mutations, purchase, and external communication require explicit confirmation unless the seller/buyer has enabled a documented automation rule and the global AI switch is on.

## 3. Cross-domain invariants

1. A browser cannot elevate a facility, company, product, wallet, transaction, or plan entitlement by changing request payloads.
2. All timestamps are stored in UTC; local timezone conversion happens at the presentation edge.
3. All financial amounts are integer minor units in the configured market currency.
4. Every wallet debit/credit, inventory movement, claim decision, coupon redemption, transaction transition, import approval, and Agent action is auditable.
5. Every retryable external/provider operation is idempotent by provider event/reference or explicit idempotency key.
6. Manual operations remain available when AI is disabled.
7. Unclaimed OSM facilities remain searchable but non-purchasable.
8. Stronger source authority cannot be silently overwritten by weaker data.
9. Plan limits are enforced server-side and represented in user-readable UI.
10. The MapLibre globe and staged reveal remain real spatial behavior, not decorative substitutes.
