# OMNI V1 — SCREEN & STATE SPECIFICATION

## Founder HQ / Nature Way

### Implementation Contract

---

# 0. PURPOSE

This document converts the Omni V1 product vision and mockup into an implementation-level specification.

It defines:

* every core screen;
* every important state;
* what the user sees;
* what data is required;
* what actions are possible;
* what backend operation occurs;
* what happens next;
* what must remain locked;
* what happens when something fails.

This document is not a design exploration.

It is the **contract between Product, Design, Frontend and Backend** for Omni V1.

---

# 1. NON-NEGOTIABLE PRODUCT PRINCIPLE

Omni is:

> **A geographical representation and query layer for the world's supply.**

The primary user problem is not:

> "How do I buy online?"

It is:

> **"Where can I find what I need, according to my constraints?"**

Availability is the next layer:

> **"Is it actually available for my specific need right now?"**

Transaction is the final layer:

> **"Can I turn this discovery into a verified Omni transaction?"**

Therefore:

```text
SUPPLY
  ↓
DISCOVERY
  ↓
CONSTRAINTS
  ↓
AVAILABILITY
  ↓
INTENT
  ↓
TRANSACTION
  ↓
FULFILMENT
```

Omni must never accidentally become a traditional marketplace where only sellers who maintain a perfect digital catalogue are visible.

---

# 2. THREE LEVELS OF TRUTH

Every offer in Omni belongs conceptually to one of three levels.

## Level 1 — EXISTENCE

Omni knows that something exists.

Example:

```text
ABC Electronics
Laptop
Lomé
```

This is enough for discovery.

---

## Level 2 — AVAILABILITY

Omni has evidence that the product/service can satisfy the user's current request.

Example:

```text
Laptop
Quantity requested: 1
Seller confirms: available
Timestamp: 10:32
```

---

## Level 3 — TRANSACTION

The buyer has expressed purchase intent and the seller has entered a verified transaction.

```text
Availability
      ↓
I WANT TO BUY
      ↓
Transaction
      ↓
QR verification
      ↓
Payment
      ↓
Fulfilment
```

The UI must visually distinguish these levels.

---

# 3. GLOBAL APP STATES

Every user session can exist in:

```text
DISCOVERY
SEARCH
AVAILABILITY
TRANSACTION
SELLER
ACCOUNT
```

The app must preserve context when navigating between them.

Example:

```text
Search
→ Facility
→ Product
→ Availability
→ Back

must return to the same search context.
```

---

# 4. SCREEN REGISTRY

## BUYER

```text
B01 Map Home
B02 Search
B03 Search Constraints
B04 Search Results
B05 Facility Preview
B06 Facility Page
B07 Product Selection
B08 Availability Builder
B09 Availability Pending
B10 Availability Result
B11 Multi-Facility Comparison
B12 Purchase Intent
B13 Transaction Room
B14 Transaction QR
B15 Payment
B16 Fulfilment
B17 Completed Transaction
B18 Transaction History
B19 Saved Searches
B20 Buyer Account
```

## SELLER

```text
S01 Seller Home
S02 Facility
S03 Product List
S04 Product Editor
S05 Omni Allocated Stock
S06 Availability Requests
S07 Availability Response
S08 Orders
S09 Transaction
S10 QR Scanner
S11 Payment Confirmation
S12 Fulfilment
S13 Offers
S14 Automation
S15 Seller Account
```

## SHARED / SYSTEM

```text
X01 Facility Claim
X02 Verification
X03 Notifications
X04 Search Demand Signal
X05 Error / Recovery
```

---

# 5. B01 — MAP HOME

## Purpose

The default Omni experience.

The map is the primary canvas.

## UI

```text
Map
Search bar
Current location
Nearby controls
Optional result drawer
```

## Data

```text
user_location
visible_facilities
facility_coordinates
facility_state
```

## Actions

```text
Tap search
Tap facility
Move map
Zoom
Locate me
Open saved searches
```

## State

```text
MAP_IDLE
MAP_LOADING
MAP_READY
MAP_ERROR
```

## Rule

The map must remain usable even when the user has not created a seller profile.

---

# 6. B02 — SEARCH

## Purpose

Capture what the user is looking for.

## Input

Natural language.

Examples:

```text
"black office chair"
"mechanic near me"
"20 bags of cement"
"French tutor"
"iPhone 15 under 500k"
```

## Backend

Create/update:

```text
Search
SearchIntent
SearchConstraints
```

## States

```text
SEARCH_EMPTY
SEARCH_TYPING
SEARCH_PROCESSING
SEARCH_READY
SEARCH_ERROR
```

---

# 7. B03 — SEARCH CONSTRAINTS

Constraints may include:

```text
product
service
category
quantity
price
distance
location
brand
condition
quality
delivery
opening status
availability requirement
```

## Important distinction

Constraints are **query constraints**, not seller inventory commitments.

Example:

```text
quantity = 20
```

means:

> Find supply capable of satisfying 20.

It does not mean:

> Every facility must maintain 20 units in a database.

---

# 8. B04 — SEARCH RESULTS

## Layout

Desktop:

```text
MAP | RESULT PANEL
```

Mobile:

```text
MAP
BOTTOM RESULT CAROUSEL
```

## Result ranking

Initial ranking may consider:

```text
constraint match
distance
facility state
opening status
known availability
price
quality
verification
```

No result should be shown as definitely available if Omni only knows that the facility exists.

---

# 9. RESULT STATUS

Each result must communicate its confidence.

```text
DISCOVERED
AVAILABLE
PARTIALLY AVAILABLE
UNAVAILABLE
UNKNOWN
```

This prevents a major product failure:

> presenting existence as current availability.

---

# 10. B05 — FACILITY PREVIEW

## Purpose

Quick inspection without leaving the map.

## Visible

```text
Facility name
Category
Distance
Open/closed
Verification
Relevant product
Price when known
```

## Actions

```text
View facility
Ask availability
Close
```

## Locked

Before purchase intent:

```text
seller private contact
transaction chat
full transaction information
```

Navigation/contact may be unlocked only at the appropriate transaction stage.

---

# 11. B06 — FACILITY PAGE

## Sections

```text
Identity
State
Location
Products
Services
Offers
Content
About
Reviews
```

## Facility state

```text
ONLINE
OFFLINE
MOBILE
DISCOVERABLE
UNCLAIMED
```

A facility can be discoverable without being claimed.

---

# 12. B07 — PRODUCT SELECTION

The user can browse the facility's supply.

Example:

```text
Chair
Desk
Table
Sofa
Office chair
```

Each product may show:

```text
name
image
price
discount
known availability
```

## Multi-select

The user can select multiple products.

This is a **request basket**, not yet a purchase cart.

```text
Chair ×20
Desk ×2
Office chair ×5
```

---

# 13. B08 — AVAILABILITY BUILDER

## Request

```text
facility_id

items:
  product_id
  quantity

constraints:
  delivery?
  timing?
  notes?
```

## Action

```text
SEND REQUEST
```

## Backend

Create:

```text
availability_request
availability_request_items
```

---

# 14. B09 — AVAILABILITY PENDING

```text
REQUEST SENT

ABC Furniture

Chair       Waiting
Desk        Waiting
Office chair Waiting
```

## Important

The user can leave.

The request remains active.

Notifications return the user to the request.

---

# 15. SELLER AVAILABILITY REQUEST

Seller receives:

```text
BUYER REQUEST

Chair
Requested: 20

Desk
Requested: 2

Office chair
Requested: 5
```

Each item can be:

```text
AVAILABLE
PARTIAL
UNAVAILABLE
ALTERNATIVE
```

Seller can specify:

```text
confirmed_quantity
price
note
alternative_product
```

---

# 16. B10 — AVAILABILITY RESULT

The buyer sees the seller's actual response.

Example:

```text
Chair
20 available

Desk
2 available

Office chair
3 available / 5 requested
```

The result must display:

```text
response timestamp
response source
confidence
```

Example:

```text
Confirmed by seller
2 minutes ago
```

---

# 17. AVAILABILITY EXPIRATION

Availability is temporal.

A response must never be interpreted as eternal truth.

Therefore:

```text
availability_response
  ↓
valid_until / freshness
```

If the response becomes stale:

```text
Availability may have changed.

[ Check again ]
```

---

# 18. B11 — MULTI-FACILITY COMPARISON

For bulk requests or multiple candidate facilities:

```text
Facility
Availability
Price
Distance
Delivery
Discount
Response freshness
```

Ranking:

```text
Best match
Closest
Lowest price
Highest availability
Fastest fulfilment
```

The user chooses a facility.

---

# 19. B12 — PURCHASE INTENT

The user clicks:

> **I WANT TO BUY**

This is the most important state transition in Omni.

Before:

```text
DISCOVERY / AVAILABILITY
```

After:

```text
TRANSACTION
```

Backend atomically creates:

```text
transaction
transaction_items
coupon_instance
transaction_qr
transaction_chat
```

---

# 20. DISCOUNT RULE

The Omni transaction must contain an explicit Omni offer.

Conceptually:

```text
regular_price
-
omni_discount
=
omni_transaction_price
```

The discount is not merely decoration.

It is part of the economic mechanism that gives the buyer a reason to complete the purchase through Omni and gives Omni a reliable transaction signal.

Therefore the seller must define an Omni offer for transaction-enabled products.

If a product has no valid Omni offer:

```text
DISCOVERABLE = YES
AVAILABILITY = POSSIBLE
OMNI_TRANSACTION = NO
```

unless another explicitly supported transaction mechanism exists.

---

# 21. B13 — TRANSACTION ROOM

The transaction room is created immediately after purchase intent.

## Header

```text
Facility
Transaction ID
Status
```

## Items

```text
product
quantity
price
discount
subtotal
```

## Automatic events

```text
Purchase intent created
Transaction created
QR generated
```

## Human chat

Optional.

The buyer can ask contextual questions.

The chat exists only as part of the transaction lifecycle.

It is not a general social DM.

---

# 22. B14 — TRANSACTION QR

The QR represents the transaction.

It must not be confused with a public facility QR.

### Public facility QR

```text
DISCOVERY
```

### Transaction QR

```text
TRANSACTION ACCESS
```

Transaction QR contains an opaque server-issued token.

The client must never be trusted to define:

```text
buyer
price
discount
facility
items
transaction state
```

Those come from the server.

---

# 23. QR SHARING

Buyer can:

```text
Show QR
Share QR
Copy transaction reference
```

The QR may travel outside Omni.

Example:

```text
WhatsApp
SMS
email
physical screen
```

But scanning/opening it routes the authorized party into Omni's transaction context.

---

# 24. SELLER QR VERIFICATION

Seller scans.

Server verifies:

```text
token exists
token belongs to transaction
transaction is valid
transaction is not completed
transaction is not revoked
token is not expired
facility matches seller authorization
```

Only then:

```text
VERIFIED
```

---

# 25. VERIFIED STATE

Buyer:

```text
✓ Transaction verified

Amount to pay:
XX XXX FCFA
```

Seller:

```text
✓ Verified Omni transaction

Buyer
Items
Discount
Total
```

Only now are transaction-level seller details unlocked.

---

# 26. CONTACT / ROUTE UNLOCK

After transaction verification:

```text
seller contact
facility contact
route
transaction chat
```

become accessible.

This protects the seller from becoming merely a free lead directory.

---

# 27. B15 — PAYMENT

Omni V1 does not need to own the payment rail.

Payment methods can be:

```text
Cash
Mobile Money
Bank transfer
Other
```

Omni records the intended method.

The actual payment can occur outside Omni.

---

# 28. PAYMENT STATE MACHINE

```text
NOT_STARTED
     ↓
METHOD_SELECTED
     ↓
PAYMENT_DECLARED
     ↓
SELLER_CONFIRMED
```

Only seller confirmation can move the transaction into:

```text
PAID
```

Buyer declaration alone is not sufficient.

---

# 29. B16 — FULFILMENT

After payment confirmation:

```text
PICKUP
DELIVERY
OTHER
```

Seller can mark:

```text
PREPARING
READY
SENT
DELIVERED
```

Buyer sees the current state.

---

# 30. B17 — COMPLETED

Final state:

```text
COMPLETED
```

Then:

```text
rate seller
view transaction
view receipt/history
```

No automatic review requirement.

---

# 31. TRANSACTION TERMINAL STATES

```text
COMPLETED
CANCELLED
EXPIRED
FAILED
```

A completed transaction cannot be reopened as an active transaction.

---

# 32. B18 — TRANSACTION HISTORY

Each item:

```text
Facility
Date
Products
Amount
Status
```

Tap opens the transaction record.

---

# 33. B19 — SAVED SEARCHES

A user can save:

```text
product
constraints
location
quantity
```

Example:

```text
"Black office chairs
≤ 15,000 FCFA
within 10 km"
```

This creates a persistent demand signal.

---

# 34. B20 — BUYER ACCOUNT

```text
Transactions
Availability requests
Saved searches
Notifications
Profile
Settings

Switch to Seller
```

---

# 35. S01 — SELLER HOME

Seller's home must be operational, not analytical.

Priority:

```text
What needs my attention now?
```

Example:

```text
4 requests waiting
1 transaction awaiting payment
2 orders to fulfil
3 stock corrections
```

---

# 36. S02 — FACILITY

Seller sees:

```text
facility identity
status
location
hours
products
services
offers
```

Can change:

```text
ONLINE
OFFLINE
```

---

# 37. FACILITY TYPES

A facility can be:

```text
FIXED
MOBILE
DIGITAL
```

This classification must not limit discoverability.

---

# 38. MOBILE FACILITY

For a mobile seller:

```text
current location
last location update
discoverability
online/offline
```

V1 can support manual location update.

Live background tracking can come later.

---

# 39. DIGITAL FACILITY

Digital supply can be represented.

Example:

```text
SaaS
Consulting
Digital course
Software
Subscription
Freelance service
```

Digital does not mean:

```text
"no geography"
```

A digital provider may still have:

```text
company origin
office
team location
service region
```

Omni's data model must preserve that relationship.

---

# 40. S03 — PRODUCT LIST

Seller can create products quickly.

Required minimum:

```text
name
category
price
Omni discount
```

Optional:

```text
image
description
brand
attributes
```

Do not make a complete e-commerce catalogue mandatory.

---

# 41. S04 — PRODUCT EDITOR

```text
Product name
Category
Price
Omni discount
Allocated stock
Visibility
```

---

# 42. S05 — OMNI ALLOCATED STOCK

This is not necessarily the seller's entire real-world inventory.

It is:

> **The quantity currently allocated to Omni transactions/discovery.**

Example:

```text
Real-world stock:
unknown / 50

Omni allocated:
20
```

---

# 43. STOCK MUTATIONS

Stock may change from:

### Omni transaction

```text
20 → 17
```

### External sale

```text
17 → 12
```

### Manual correction

```text
12 → 15
```

Therefore:

```text
stock source ≠ transaction source
```

---

# 44. STOCK EVENT MODEL

Every adjustment should be represented as an event:

```text
STOCK_ALLOCATED
STOCK_DECREMENTED_OMNI
STOCK_DECREMENTED_EXTERNAL
STOCK_INCREMENTED
STOCK_CORRECTED
```

This provides an audit trail.

---

# 45. S06 — AVAILABILITY REQUESTS

Seller sees:

```text
NEW
RESPONDED
EXPIRED
CONVERTED
```

Priority by:

```text
freshness
urgency
quantity
distance
```

---

# 46. S07 — AVAILABILITY RESPONSE

Seller must be able to answer quickly.

For every product:

```text
✓ Available
~ Partial
× Unavailable
↗ Alternative
```

No complex inventory management required.

---

# 47. S08 — ORDERS

Seller sees active transactions:

```text
Awaiting payment
Paid
Preparing
Ready
Delivered
Completed
```

---

# 48. S09 — SELLER TRANSACTION

Seller sees the same canonical transaction.

Important:

Buyer and seller do not have separate transaction truths.

There is one server-side transaction.

Each side gets an authorized view.

---

# 49. S10 — QR SCANNER

The seller can:

```text
scan QR
enter transaction reference
open transaction from notification
```

All routes converge to the same transaction verification mechanism.

---

# 50. S11 — PAYMENT CONFIRMATION

Seller chooses:

```text
Payment received
Payment not received
```

If received:

```text
transaction.payment_status = CONFIRMED
```

This event is auditable.

---

# 51. S12 — FULFILMENT

Seller marks:

```text
Preparing
Ready
Sent
Delivered
```

---

# 52. S13 — OFFERS

Seller defines:

```text
regular price
Omni discount
validity
```

Example:

```text
15,000
↓
14,250
5% Omni discount
```

---

# 53. S14 — AUTOMATION

V1 supports the architecture for:

```text
MANUAL
ASSISTED
AUTOMATIC
```

But only manual/assisted workflows need to be fully operational initially.

Automatic availability can be introduced when inventory signals become sufficiently trustworthy.

---

# 54. AUTOMATION PRINCIPLE

Never build an AI agent merely because an agent is possible.

First:

```text
STRUCTURED DATA
+
RULES
+
EVENTS
```

Then:

```text
AUTOMATION
```

Then:

```text
AGENT
```

The future agent should consume the infrastructure rather than replace it.

---

# 55. S15 — SELLER ACCOUNT

```text
Facilities
Products
Requests
Orders
Inventory
Transactions
Offers
Automation
Settings

Switch to Buyer
```

---

# 56. X01 — CLAIM FACILITY

Any user can potentially encounter:

```text
Unclaimed facility
```

They can select:

```text
Claim this facility
```

Then verification.

---

# 57. UNCLAIMED FACILITY RULE

Unclaimed does NOT mean invisible.

It means:

```text
DISCOVERABLE = YES
OWNER_CONTROLS = NO
TRANSACTION = NO
```

This is essential to Omni's supply-representation mission.

---

# 58. X02 — CERTIFICATION

Certification must be separate from discoverability.

Possible state:

```text
UNVERIFIED
VERIFIED
CERTIFIED
```

Do not use verification as a prerequisite for basic geographic representation.

---

# 59. X03 — NOTIFICATIONS

Notifications are events, not generic messages.

Examples:

```text
Availability response received
Transaction verified
Payment confirmed
Product ready
Transaction completed
```

Each notification must deep-link into its source object.

---

# 60. X04 — SEARCH DEMAND SIGNAL

When no suitable supply exists:

```text
NO MATCH
```

Omni asks:

```text
Save this search?
```

This creates:

```text
DemandSignal
```

The signal can later help:

```text
supply discovery
seller acquisition
market intelligence
```

But it must not alter the user's immediate search result dishonestly.

---

# 61. ERROR PRINCIPLE

Every important action must have:

```text
loading
success
failure
retry
```

No silent failures.

---

# 62. CRITICAL ERROR STATES

## Search failure

```text
We couldn't complete this search.
[ Try again ]
```

## Availability failure

```text
The request could not be sent.
[ Try again ]
```

## Transaction creation failure

```text
We couldn't create the transaction.
No payment has been initiated.
[ Try again ]
```

## QR failure

```text
This transaction could not be verified.
[ Try again ]
```

## Payment failure

```text
Payment status could not be confirmed.
```

---

# 63. PERMISSION MODEL

## Buyer

Can:

```text
search
discover
request availability
create purchase intent
view own transaction
share own QR
```

Cannot:

```text
modify seller data
confirm seller payment
modify inventory
```

## Seller

Can only manage:

```text
facilities they own/manage
products they control
inventory they control
transactions involving their facilities
```

---

# 64. SECURITY PRINCIPLE

The frontend is never the source of truth.

Never trust:

```text
price
discount
buyer
seller
quantity
transaction state
payment state
stock
QR status
```

from client-provided values alone.

The server recomputes/validates critical values.

---

# 65. CORE TRANSACTION STATE MACHINE

```text
CREATED
   ↓
QR_GENERATED
   ↓
VERIFIED
   ↓
PAYMENT_PENDING
   ↓
PAYMENT_DECLARED
   ↓
PAID
   ↓
FULFILLMENT_PENDING
   ↓
FULFILLED
   ↓
COMPLETED
```

Alternative branches:

```text
CREATED → CANCELLED
CREATED → EXPIRED
QR_GENERATED → QR_EXPIRED
PAYMENT_PENDING → CANCELLED
```

---

# 66. CORE AVAILABILITY STATE MACHINE

```text
REQUEST_CREATED
      ↓
SENT
      ↓
VIEWED
      ↓
RESPONDED
      ↓
RESULT_AVAILABLE
      ↓
EXPIRED
```

If converted:

```text
RESULT_AVAILABLE
      ↓
PURCHASE_INTENT
```

---

# 67. FACILITY STATE MACHINE

```text
DISCOVERABLE
     ↓
CLAIMED
     ↓
VERIFIED
     ↓
CERTIFIED
```

Independent operational state:

```text
ONLINE
OFFLINE
MOBILE
```

These dimensions must not be collapsed into one boolean.

---

# 68. PRODUCT STATE MACHINE

```text
DRAFT
 ↓
PUBLISHED
 ↓
DISCOVERABLE
 ↓
OMNI_TRANSACTION_ENABLED
```

A product can be:

```text
DISCOVERABLE
```

without:

```text
TRANSACTION_ENABLED
```

---

# 69. WHY THIS MATTERS

This allows Omni to represent the world before the world is fully structured.

Example:

A street vendor can have:

```text
Facility
Location
Products
Price
```

without having:

```text
ERP
POS
warehouse
barcode scanner
e-commerce website
```

Omni must not require those things.

---

# 70. THE OMNI LADDER

Every seller should be able to start at the lowest level.

```text
LEVEL 0
DISCOVERABLE
       ↓
LEVEL 1
PRODUCTS
       ↓
LEVEL 2
AVAILABILITY
       ↓
LEVEL 3
OMNI DISCOUNTS
       ↓
LEVEL 4
TRANSACTIONS
       ↓
LEVEL 5
ALLOCATED STOCK
       ↓
LEVEL 6
AUTOMATION
       ↓
LEVEL 7
AI AGENT
```

The product becomes more powerful as the seller provides more structure.

But Omni should never punish a seller for being at Level 0.

---

# 71. THE BUYER LADDER

```text
SEARCH
 ↓
DISCOVER
 ↓
COMPARE
 ↓
CHECK AVAILABILITY
 ↓
PURCHASE INTENT
 ↓
TRANSACTION
 ↓
PAY
 ↓
FULFIL
```

A user can stop after discovery.

They do not have to transact through Omni.

But Omni makes the transaction progressively more valuable.

---

# 72. THE ECONOMIC LOOP

The strategic loop is:

```text
MORE SUPPLY
     ↓
BETTER DISCOVERY
     ↓
MORE BUYER SEARCH
     ↓
MORE AVAILABILITY REQUESTS
     ↓
MORE TRANSACTIONS
     ↓
MORE VERIFIED SUPPLY DATA
     ↓
BETTER OMNI
     ↓
MORE SUPPLY
```

The discount creates the strongest incentive for the transaction layer.

---

# 73. THE DATA FLYWHEEL

Every successful transaction creates structured information:

```text
what
where
when
quantity
price
discount
buyer intent
seller
fulfilment
```

This becomes a progressively better representation of real-world supply and demand.

That is the strategic asset.

---

# 74. WHAT OMNI MUST NOT BECOME

Do not accidentally turn V1 into:

```text
Uber Eats clone
Amazon clone
Google Maps clone
Yellow Pages
Instagram for businesses
ERP
POS
Inventory management SaaS
AI agent platform
Advertising platform
```

Omni may eventually contain capabilities related to all of these.

But its center remains:

> **The world's supply, geographically represented and queryable.**

---

# 75. V1 COMPLETION CRITERIA

Omni V1 is functionally complete when a user can:

```text
1. Open Omni
2. Search for something
3. Add constraints
4. See relevant facilities on the map
5. Open a facility
6. Discover its products
7. Select one or multiple products
8. Ask for availability
9. Receive a response
10. Compare options
11. Choose a facility
12. Express purchase intent
13. Receive transaction QR
14. Share/show QR
15. Seller verifies it
16. Buyer sees final amount
17. Buyer chooses payment method
18. Seller confirms payment
19. Product is fulfilled
20. Transaction completes
```

And a seller can:

```text
1. Create facility
2. Add product
3. Define Omni price/discount
4. Receive availability request
5. Respond
6. Receive transaction
7. Scan QR
8. Confirm payment
9. Fulfil
10. Adjust Omni stock
```

If these two loops work reliably:

> **Omni V1 exists.**

---

# 76. THE SINGLE MOST IMPORTANT TEST

Give a new user this task:

> "Find me 10 black office chairs under 15,000 FCFA within 10 km."

Do not explain Omni.

Observe.

Can they:

```text
search
understand results
identify relevant facilities
request availability
understand responses
choose one
buy
```

If yes:

**the core product works.**

If they need explanation:

**the interface is not ready.**

---

# 77. FINAL PRODUCT CONTRACT

Omni V1 is not required to know everything.

It is required to represent what it knows honestly.

Therefore:

```text
KNOWN TO EXIST
≠
KNOWN AVAILABLE
≠
AVAILABLE FOR THIS REQUEST
≠
TRANSACTION VERIFIED
≠
PAID
≠
FULFILLED
```

These distinctions must exist simultaneously in:

```text
database
backend
API
frontend
UX copy
analytics
```

This is the foundation that prevents Omni from becoming a misleading directory.

---

# 78. THE BUILD ORDER

Development should proceed in this order:

## PHASE 1 — FOUNDATION

```text
Auth
Users
Facilities
Locations
Products
Categories
Facility states
```

## PHASE 2 — DISCOVERY

```text
Map
Search
Constraints
Ranking
Facility page
Product discovery
```

## PHASE 3 — AVAILABILITY

```text
Availability request
Seller inbox
Seller response
Availability result
Multi-product request
```

## PHASE 4 — TRANSACTION

```text
Purchase intent
Transaction
Coupon
QR
Verification
Transaction chat
```

## PHASE 5 — FULFILMENT

```text
Payment declaration
Payment confirmation
Pickup/delivery
Completion
History
```

## PHASE 6 — SELLER OPERATIONS

```text
Allocated stock
Manual stock adjustments
Offers
Facility states
Mobile seller tools
```

## PHASE 7 — HARDENING

```text
permissions
security
idempotency
audit trail
notifications
error recovery
analytics
```

---

# 79. WHAT SHOULD NOT BLOCK V1

These should not become reasons to delay launch:

```text
perfect world map
3D
Street View
AI agent
automatic inventory
live mobile tracking
full payment integration
multi-facility cart
advanced ads
global marketplace
complex seller analytics
```

If necessary, they can sit behind manual operations or deferred states.

---

# 80. FINAL FOUNDER HQ DECISION

The V1 is now defined by one simple promise:

> **Find what exists around you, according to your constraints. Ask whether it can actually satisfy your need. If you choose to buy through Omni, turn that intention into a verified transaction.**

Everything else is supporting infrastructure.

The V1 does **not** need to prove the entire Omni vision.

It needs to prove this loop:

```text
WORLD
 ↓
SEARCH
 ↓
MATCH
 ↓
AVAILABILITY
 ↓
CHOICE
 ↓
TRANSACTION
 ↓
REAL-WORLD OUTCOME
```

If that loop works in Lomé with real buyers and real sellers, Omni has a foundation on which the larger vision can be built.
