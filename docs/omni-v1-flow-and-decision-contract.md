# Omni V1 Flow and Decision Contract

## Identity

- Contract ID: `OMNI-V1-FLOW`
- Version: `1.0`
- Status: `decided`
- Related brief: `docs/omni-v1-field-brief.md`
- Date: 2026-08-19

## Decision register

| ID | Decision | Status | Impact |
| --- | --- | --- | --- |
| `DEC-V1-001` | Use the latest normative implementation annex and field-ready objective as the active V1 contract when earlier master sections conflict. | `decided` | Promotes MapLibre globe behavior, source-backed discovery, QR-at-intent, camera fallback, wallet/FedaPay and seller map-first; keeps AI/automation/native mobile/buyer in-app payment/withdrawal deferred. |
| `DEC-V1-002` | Keep three authoritative documents only: brief, flow/decision contract, combined product/interface/architecture contract. | `decided` | Backlogs, prompts, audits and screenshots are derivatives. |
| `DEC-V1-003` | Preserve one real MapLibre map instance for buyer and seller; never use a decorative globe or unrelated flat substitute. | `decided` | Affects map shell, seller shell, motion and browser proof. |
| `DEC-V1-004` | Require authentication before persistent search/demand/transaction actions, but preserve and replay the visitor’s query and constraints exactly once. | `decided` | Affects auth, onboarding, routing and session state. |
| `DEC-V1-005` | Keep unclaimed facilities discoverable but prohibit private contact, seller response authority and purchase intent until trust/claim rules permit them. | `decided` | Affects discovery cards, facility permissions and checkout guards. |
| `DEC-V1-006` | Free buyers use manual facility-by-facility availability; Pro bulk is permitted only through server-side plan enforcement and does not expose budget to sellers. | `decided` | Affects quotas, request payloads and availability UI. |
| `DEC-V1-007` | Every published product has an honest offer state: explicit active offer or `Aucune remise active`; never fabricate a discount. | `decided` | Affects product creation, cards, coupon assignment and redemption. |
| `DEC-V1-008` | Eligible `Je veux acheter` creates or reuses one idempotent intent and generates the transaction QR atomically with expiry in the same operation. | `decided` | Affects checkout function, events, QR, chat and seller deep links. |
| `DEC-V1-009` | Create a transaction-scoped chat at intent creation; unlock contact/directions after intent and unlock later controls by state. | `decided` | Affects authorization, notifications, timeline and resumability. |
| `DEC-V1-010` | Omni records external/manual buyer-to-seller payment. Buyer selects a method and may declare payment; seller alone confirms external receipt; buyer confirms receipt after fulfilment. | `decided` | Affects transaction schema, permissions, copy and completion tests. |
| `DEC-V1-011` | Present one rechargeable Omni Wallet with backend buckets `wallet`, `payout`, `ad_credit`, `coupon_credit`, `pro_credit`; FedaPay recharge credits only after approved provider evidence; no withdrawal CTA. | `decided` | Affects ledger, recharge, balance UI and migration proof. |
| `DEC-V1-012` | Seller V1 exposes only functional facility, catalogue/offer, demand, QR and wallet/recharge operations. | `decided` | Removes dead navigation and constrains seller redesign. |
| `DEC-V1-013` | Product analytics are consented, minimized, pseudonymous and separate from private chat, exact location and payment secrets. | `decided` | Affects event schema, admin views and retention. |

## Actors

| Actor | Authority |
| --- | --- |
| Visitor | May explore source-backed discovery and type a query; cannot persist demand or access protected transaction actions before auth. |
| Buyer | Owns query, demand, purchase intent, transaction participation, buyer payment declaration, receipt confirmation and rating. |
| Seller | Owns facilities/products/offers, responds to owned availability requests, verifies owned-facility QR, confirms external receipt and fulfils. |
| Field operator | May perform documented manual availability/certification operations under an authorized role; every action records actor and evidence. |
| Admin | Manages certification/evidence and operational controls; never bypasses audit or silently changes financial state. |
| System | Computes server-authoritative amounts, permissions, trust status, coupons, idempotency, event timeline, expiry and ledger effects. |

## State machines

### Buyer discovery and auth

```text
MAP_IDLE
  -> SEARCH_EDITING                 visitor focuses or types
  -> AUTH_REQUIRED                  protected execution requested while unauthenticated
  -> ONBOARDING                     account creation/login begins
  -> SEARCH_RESTORED                original query/context restored after auth
  -> SEARCH_RESULTS                 server-backed discovery succeeds
  -> FACILITY_SELECTED              buyer opens a facility
  -> AVAILABILITY                   buyer opens an availability request
```

Location states are independent: `prompt`, `granted_precise`, `granted_approximate`, `denied`, `unavailable`, `retrying`. Only a fresh successful coordinate in the accepted accuracy band creates a personal marker. A market center or ISP/network estimate is approximate discovery context and must never be labeled as exact user location.

### Facility trust and operation

```text
UNCLAIMED -> CLAIMED -> CERTIFIED -> CONFIRMED
```

Operational availability is independent:

```text
ONLINE <-> OFFLINE
```

Every trust transition records actor, timestamp, evidence, reason and provenance. Unclaimed facilities may be discovered, but they cannot expose private contact, accept seller-owned availability responses or create purchase intent until the trust rules allow it.

### Availability

```text
REQUEST_DRAFT
  -> SUBMITTED
  -> AWAITING_RESPONSE
  -> AVAILABLE
  -> PARTIAL
  -> UNAVAILABLE
  -> SLA_EXPIRED
  -> CANCELLED
```

`AVAILABLE`, `PARTIAL`, and `UNAVAILABLE` are mutually exclusive terminal responses for a request. `PARTIAL` may include a server-validated quantity and price override. The submitted response is immutable; a later correction is a new auditable event or a controlled transition, never a silent mutation.

Free buyers may request manually facility by facility. Pro bulk capability is authorized server-side. Buyer budget is private and may be used by Omni for ranking/filtering but is not included in seller-facing request payloads.

### Transaction

```text
INTENT_CREATED
  -> OFFER_CONFIRMED
  -> QR_GENERATED
  -> QR_VERIFIED
  -> PAYMENT_PENDING
  -> PAID
  -> FULFILLMENT
  -> RECEIVED
  -> COMPLETED
```

Error/terminal branches are `EXPIRED`, `DECLINED`, and `CANCELLED`. `QR_GENERATED` is created atomically with the intent operation for an eligible response; it is not a client-generated visual code. An expired or replayed QR cannot authorize verification.

Transaction events include at minimum: `intent_created`, `offer_confirmed`, `qr_generated`, `qr_verified`, `payment_preference_selected`, `buyer_declared_paid`, `seller_confirmed_payment`, `fulfillment_started`, `product_received`, `completed`, and explicit failure/cancellation events.

### Wallet recharge

```text
RECHARGE_CREATED
  -> PROVIDER_PENDING
  -> PROVIDER_APPROVED
  -> RECONCILED
  -> LEDGER_CREDITED
```

Failure branches are `DECLINED`, `CANCELLED`, `EXPIRED`, and `RECONCILIATION_RETRY`. A browser return may display pending but cannot credit any bucket. Only an approved provider status/callback and idempotent reconciliation can create the ledger credit.

## Transition contracts

### Purchase intent creation

```text
Transition: AVAILABLE|PARTIAL -> INTENT_CREATED -> OFFER_CONFIRMED -> QR_GENERATED
Event: buyer_clicks_buy
Actor: authenticated buyer who owns the availability response
Preconditions: response is eligible; facility is trusted enough; product and quantity are valid; offer is valid
Server effects: recompute amount; apply offer/coupon atomically; freeze values; create/reuse intent; create QR with expiry; append events; create transaction thread
Client projection: show amount before/after offer, QR, timeline and next action
Failure: preserve prior response; return stable error; no duplicate coupon consumption or transaction
Idempotency: same intent fingerprint returns the active transaction and QR if active
Proof: authorization, stale-price, duplicate-intent, coupon-atomicity and browser transition tests
```

### Seller QR verification

```text
Transition: QR_GENERATED -> QR_VERIFIED
Event: seller_scans_or_enters_code
Actor: authenticated seller authorized for the transaction facility
Preconditions: token valid, unexpired, not consumed, seller owns facility, transaction participant check passes
Server effects: persist verification event; expose payment preference controls; audit actor and time
Client projection: seller sees verified transaction; buyer sees verified timeline state
Failure: return expired, wrong-seller, already-used or malformed error without private disclosure
Idempotency: repeated valid verification returns the existing verified state
Proof: camera/manual fallback, wrong seller, replay, expiry and reload tests
```

### External payment and fulfilment

```text
Transition: QR_VERIFIED -> PAYMENT_PENDING
Event: buyer_selects_payment_preference
Actor: buyer participant
Server effects: persist supported method and buyer-facing instructions from seller profile

Transition: PAYMENT_PENDING -> PAID
Event: seller_confirms_external_receipt
Actor: seller authorized for facility and transaction
Server effects: append seller confirmation and audit record

Transition: PAID -> FULFILLMENT -> RECEIVED
Event: seller_marks_fulfilled; buyer_confirms_received
Actors: seller then buyer
Server effects: enforce order, append events, release/settle any reserved business state

Transition: RECEIVED -> COMPLETED
Event: completion_finalized
Actor: system after required confirmations
Client projection: enable rating exactly once
```

A buyer declaration is evidence of the buyer’s action, not proof that the seller received money. A buyer cannot emit `seller_confirmed_payment`; a seller cannot emit `product_received` on behalf of the buyer.

## Global invariants

1. Server authority governs amounts, discounts, transaction status, permissions, trust status, QR validity, coupon consumption and ledger balances.
2. Every side-effecting mutation has an idempotency rule and safe retry behavior.
3. Every protected read/write checks the authenticated actor and object ownership.
4. Unclaimed facilities cannot be purchased, contacted privately or treated as seller-owned availability sources.
5. Buyer budget never appears in seller-facing request payloads or generic analytics.
6. QR tokens are expiring, transaction-bound, seller/facility-authorized and replay-protected.
7. Coupon assignment, discount amount, redemption and consumption are atomic and auditable.
8. FedaPay browser return alone never credits the wallet.
9. No withdrawal or buyer-to-seller Omni checkout action appears in V1.
10. Every non-terminal state has a reload/back/network-loss recovery path or explicit expiry.
11. Product analytics do not contain private chat content, exact coordinates or payment secrets.
12. A new user can close an overlay and return to the same map/search context without losing the pending work.

## Change protocol

Any change to a state, actor, amount, permission, migration, irreversible side effect or terminal transition requires a new decision ID and impact list. Update the combined architecture contract and affected derivative acceptance matrices before implementation resumes.

## Gate status

- Flow defined before detailed UI: `yes`
- Critical transitions have actors and invariants: `yes`
- First implementation slice: `Slice A — Map-first discovery and authenticated search replay`
- L3 decisions requiring additional schema review: payment preference/fulfilment, QR deep links, wallet reconciliation and any migration required by current code.
