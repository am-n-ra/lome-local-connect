# OMNI V1

# COMPLETE PRODUCT MOCKUP

## Founder HQ × Nature Way

### From Problem → Intent → Species → Interface → Implementation

**Status:** V1 Product Definition
**Purpose:** Define the complete buyer/provider experience and the visible states that the V1 implementation must reproduce.

---

# 0. THE PRODUCT IN ONE SENTENCE

> **Omni is a geographical discovery engine for the world's supply: tell it what you need and the constraints that matter, discover the supply that can potentially satisfy you, verify availability when necessary, and transact through Omni when you choose to buy.**

Omni is not fundamentally:

* a delivery app;
* an e-commerce catalogue;
* a business directory;
* a POS;
* a payment processor;
* a social network.

Those can become capabilities around the core.

The core is:

```text
WORLD
  ↓
SUPPLY
  ↓
GEOGRAPHICAL REPRESENTATION
  ↓
SEARCH
  ↓
CONSTRAINT MATCHING
  ↓
AVAILABILITY
  ↓
PURCHASE INTENT
  ↓
TRANSACTION
```

---

# 1. THE OMNI PRODUCT LOOP

The entire V1 is one stateful product.

```text
                    ┌──────────────┐
                    │     WORLD    │
                    │     MAP      │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │    SEARCH    │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │   RESULTS    │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │   FACILITY   │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ AVAILABILITY │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │    BUY       │
                    │   INTENT     │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ TRANSACTION  │
                    │     CHAT     │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │  COMPLETED   │
                    └──────────────┘
```

This is not a collection of unrelated screens.

**The map remains the spatial foundation throughout discovery.**

The existing V1 specification explicitly establishes this stateful model rather than separate Home → Search → Results → Facility → Checkout pages.

---

# 2. GLOBAL VISUAL LANGUAGE

## 2.1 Product character

Omni should feel:

* geographical;
* calm;
* intelligent;
* premium;
* simple;
* human;
* trustworthy;
* spatial.

It should NOT feel like:

* a conventional dashboard;
* an Amazon clone;
* a delivery marketplace;
* a social feed;
* a banking application.

---

# 3. SCREEN 00 — WORLD / RESTING STATE

## Purpose

The first thing the user sees is **the world**.

There is no marketing landing page.

The user enters Omni directly.

The current specification explicitly defines the clean globe as the first product message and rejects a permanent cloud of pins or dashboard-like density.

### Desktop

```text
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                       OMNI                               │
│                                                          │
│                  [     GLOBE     ]                       │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                         ┌─────────────┐                  │
│                         │ Search...   │                  │
│                         └─────────────┘                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Mobile

```text
┌─────────────────────────┐
│                         │
│        OMNI             │
│                         │
│       WORLD             │
│       GLOBE             │
│                         │
│                         │
│                         │
│  ┌───────────────────┐  │
│  │ What are you      │  │
│  │ looking for?      │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

No result cards.

No advertisements.

No dense POIs.

No dashboard.

---

# 4. MAP BEHAVIOR

The globe/map is not decoration.

It is the geographical representation of Omni's supply.

At rest:

* restrained geography;
* minimal visual noise;
* subtle movement if enabled;
* no permanent supply cloud.

On interaction:

* drag pauses rotation;
* zoom works;
* location can be requested;
* search can begin;
* camera responds to the query.

Every search should visually communicate:

```text
WORLD
 ↓
COUNTRY
 ↓
REGION
 ↓
CITY
 ↓
SEARCH AREA
 ↓
SUPPLY
```

The existing map contract explicitly requires staged geographical reveal and automatic camera framing after search.

---

# 5. SCREEN 01 — SEARCH ACTIVE

When the user taps the search bar:

```text
┌─────────────────────────┐
│ ←  🔎 What do you need? │
├─────────────────────────┤
│                         │
│ Search a product        │
│ Search a service        │
│ Search a facility       │
│                         │
│ ─────────────────────── │
│                         │
│ Recent                  │
│ "office chairs"         │
│ "Samsung A15"           │
│                         │
└─────────────────────────┘
```

The map remains visible behind/around the search surface.

---

# 6. SEARCH INPUT MODES

The same demand infrastructure receives:

```text
TEXT
VOICE
IMAGE
VIDEO
MAP
```

The architecture should keep Agent as another interface into the same system.

The prior specification already defines text, voice, image, video, map and agent as search modes feeding the same search infrastructure.

For V1 implementation priority:

```text
TEXT        REQUIRED
MAP         REQUIRED
VOICE       OPTIONAL / if already available
IMAGE       ARCHITECTURE READY
VIDEO       DEFERRED
AGENT       DEFERRED
```

---

# 7. SCREEN 02 — SEARCH PARAMETERS

The buyer can refine the search.

Example:

```text
┌────────────────────────────┐
│ Search                     │
│                            │
│ Samsung Galaxy A15         │
│                            │
│ Quantity                   │
│ [ 1 ]                      │
│                            │
│ Budget                     │
│ [ ≤ ₣150,000 ]             │
│                            │
│ Distance                   │
│ [ ≤ 5 km ]                 │
│                            │
│ Availability               │
│ [ Today ]                  │
│                            │
│ Fulfillment                │
│ [ Pickup ] [ Delivery ]    │
│                            │
│          [ Search ]        │
└────────────────────────────┘
```

Not every parameter must be displayed immediately.

Use progressive disclosure.

---

# 8. HARD CONSTRAINTS

A hard constraint excludes a result.

Examples:

```text
Price ≤ ₣150,000
Quantity ≥ 5
Distance ≤ 5 km
Delivery required
Available today
```

If a result violates one:

> it is not an eligible match.

---

# 9. PREFERENCES

Preferences influence ranking.

Examples:

```text
Prefer closer
Prefer cheaper
Prefer delivery
Prefer highly rated
Prefer larger quantity
Prefer higher confidence
```

A preference must never accidentally become a hard filter.

---

# 10. AUTHENTICATION GATE

First-time unauthenticated users may:

* open Omni;
* explore the map;
* enter a search.

But the actual backend search does not execute until account creation/login.

The query must be preserved exactly.

Flow:

```text
SEARCH
 ↓
AUTH REQUIRED
 ↓
SIGN UP / LOGIN
 ↓
ONBOARDING
 ↓
RESTORE QUERY
 ↓
EXECUTE
```

This behavior is already explicitly defined in the existing V1 contract.

---

# 11. SCREEN 03 — AUTHENTICATION PROMPT

```text
┌────────────────────────────┐
│                            │
│   See what's available     │
│   around you               │
│                            │
│ Create your free Omni      │
│ account to continue.       │
│                            │
│ [ Continue with phone ]    │
│ [ Continue with email ]    │
│                            │
│ Already have an account?   │
│ Log in                     │
│                            │
└────────────────────────────┘
```

Original query remains visible or recoverable.

Never make the user retype it.

---

# 12. SCREEN 04 — BUYER ONBOARDING

Minimum:

```text
Name
Location permission
Basic account
```

Optional:

```text
Interest categories
```

The user can skip optional interests.

The existing product model already treats buyer interests as optional and reusable for demand/notification/ad targeting.

---

# 13. SEARCH RESUMES AUTOMATICALLY

After onboarding:

```text
"Samsung A15 under ₣150k near me"
```

is restored.

The map moves automatically.

The camera frames:

```text
USER
+
RELEVANT SUPPLY
```

The user should not manually zoom out.

---

# 14. SCREEN 05 — SEARCH RESULTS

This is the core discovery state.

### Desktop

```text
┌─────────────────────┬──────────────────────────┐
│                     │                          │
│ SEARCH              │                          │
│ Samsung A15         │          MAP             │
│                     │                          │
│ Filters             │     •       •            │
│                     │                          │
│ 42 facilities found │          •               │
│                     │   •              •       │
│ ┌─────────────────┐ │                          │
│ │ Facility result │ │                          │
│ │ Samsung A15     │ │                          │
│ │ ₣145,000        │ │                          │
│ │ 2.1 km          │ │                          │
│ └─────────────────┘ │                          │
│                     │                          │
└─────────────────────┴──────────────────────────┘
```

### Mobile

The map dominates.

Results appear as a bottom horizontal surface:

```text
┌─────────────────────────┐
│                         │
│          MAP            │
│                         │
│      •        •         │
│            •            │
│                         │
│                         │
├─────────────────────────┤
│  42 results             │
│                         │
│ ┌─────────────────────┐ │
│ │ Samsung A15         │ │
│ │ Kossi Electronics   │ │
│ │ ₣145,000            │ │
│ │ 2.1 km              │ │
│ │ ✓ Omni discount     │ │
│ │                     │ │
│ │ [Check availability]│ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

This preserves the map-first nature while giving the user a highly scannable horizontal result experience.

---

# 15. RESULT CARD

A result card is contextual.

If the user searched:

> Nike Air Max

the card should lead with:

> Nike Air Max

not merely:

> ABC Store.

The existing specification explicitly requires search-contextualized facility cards.

Minimum:

```text
Offer
Provider / Facility
Price
Distance / geography
Availability confidence
Omni discount
Primary CTA
```

---

# 16. RESULT STATES

Every result must clearly communicate one of:

```text
MATCH
POSSIBLE MATCH
AVAILABILITY NEEDED
UNAVAILABLE
```

Never imply certainty when Omni does not possess it.

---

# 17. NO RESULTS

Do not show a dead-end empty screen.

```text
┌─────────────────────────┐
│ No direct match yet.    │
│                         │
│ We couldn't find supply │
│ matching all your       │
│ constraints.            │
│                         │
│ [ Request availability  │
│   from relevant sellers]│
│                         │
│ [Modify constraints]    │
└─────────────────────────┘
```

The exact demand remains preserved.

A failed search becomes:

> **demand data**

rather than being discarded.

---

# 18. SCREEN 06 — FACILITY SELECTED

Clicking a result opens a floating facility surface.

### Desktop

```text
┌───────────────────────┐
│ Facility               │
│                       │
│ Kossi Electronics     │
│ ✓ Certified           │
│                       │
│ 2.1 km                │
│ Open                  │
│                       │
│ Samsung A15           │
│ ₣145,000              │
│                       │
│ ✓ Omni discount       │
│                       │
│ [Check availability]  │
│                       │
│ Other offers          │
│ • Charger             │
│ • Memory card         │
│ • Samsung A25         │
│                       │
└───────────────────────┘
```

### Mobile

Bottom sheet over the map.

The map never disappears.

This matches the established FacilitySheet behavior.

---

# 19. FACILITY = SECONDARY DISCOVERY SURFACE

This is where your recent insight is incorporated.

A buyer searches:

> Samsung A15.

They open a facility.

They see:

> Samsung A15
> Charger
> Memory card
> Earphones
> Samsung A25

The user may discover another product and select it.

Therefore:

> **Facility discovery must expose relevant adjacent supply.**

---

# 20. MULTI-PRODUCT SELECTION

The user can select several products from the same facility.

```text
Kossi Electronics

☑ Samsung A15
☑ 128GB Memory Card
☑ USB-C Charger

Selected: 3 items

[ Check availability ]
```

This creates:

```text
ONE AvailabilityRequest
MULTIPLE requested items
ONE Facility
```

Not three independent requests.

---

# 21. SCREEN 07 — AVAILABILITY REQUEST

For one facility:

```text
┌────────────────────────────┐
│ Check availability         │
│                            │
│ Kossi Electronics          │
│                            │
│ Samsung A15                │
│ Quantity: 1               │
│                            │
│ 128GB Memory Card          │
│ Quantity: 1               │
│                            │
│ USB-C Charger              │
│ Quantity: 1               │
│                            │
│ Optional note              │
│ [____________________]     │
│                            │
│ [ Send request ]           │
└────────────────────────────┘
```

---

# 22. BULK AVAILABILITY

The buyer can instead ask several facilities.

Example:

> Need 100 chairs.

```text
Search
 ↓
Candidate facilities
 ↓
Select / target facilities
 ↓
Bulk availability
 ↓
Responses
```

V1 should keep this bounded.

Existing specifications use up to five facility targets and define the Free quota as three bulk operations/month, with Pro removing/increasing the restriction.

---

# 23. BULK AVAILABILITY REQUEST

```text
┌────────────────────────────┐
│ Find availability          │
│                            │
│ Office chairs              │
│                            │
│ Quantity                   │
│ [ 100 ]                    │
│                            │
│ Variant / specification    │
│ [ optional ]               │
│                            │
│ Maximum budget             │
│ [ ₣________ ]              │
│                            │
│ Note                       │
│ [____________________]     │
│                            │
│ 5 facilities selected      │
│                            │
│ [ Send availability ]      │
└────────────────────────────┘
```

The buyer's budget is used internally for filtering/ranking and is not necessarily sent to providers; the existing contract explicitly establishes this distinction.

---

# 24. SCREEN 08 — AVAILABILITY WAITING

```text
┌────────────────────────────┐
│ Checking availability      │
│                            │
│ Samsung A15                │
│                            │
│ ● Kossi Electronics        │
│   Checking...              │
│                            │
│ ● ABC Mobile               │
│   Checking...              │
│                            │
│ ● XYZ Store                │
│   Checking...              │
│                            │
│ You can leave this screen. │
└────────────────────────────┘
```

The UI should not tell the buyer:

> human response

versus:

> automated response.

The existing contract explicitly forbids exposing the response mechanism to buyers.

---

# 25. AVAILABILITY FAST PATH

The system automatically determines whether it can answer immediately.

Auto-response only when:

```text
facility.state == OPEN
AND
product.quantity_allocated_omni > 0
```

Otherwise:

```text
manual availability path
```

This is one availability system with a fast path, not two different products.

---

# 26. SCREEN 09 — AVAILABILITY RESULT

### Available

```text
┌────────────────────────────┐
│ ✓ Available                │
│                            │
│ Samsung A15                │
│ Quantity confirmed: 1     │
│                            │
│ ₣145,000                   │
│ Omni discount included     │
│                            │
│ [ Je veux acheter ]        │
└────────────────────────────┘
```

---

# 27. PARTIAL

```text
┌────────────────────────────┐
│ ◐ Partially available      │
│                            │
│ Requested: 10              │
│ Available: 6               │
│                            │
│ ₣145,000 / unit            │
│                            │
│ [ Acheter les 6 ]          │
└────────────────────────────┘
```

The established response model explicitly defines Available, Partial and Unavailable states.

---

# 28. UNAVAILABLE

```text
┌────────────────────────────┐
│ — Unavailable              │
│                            │
│ Samsung A15                │
│                            │
│ This provider cannot       │
│ fulfill your request.      │
└────────────────────────────┘
```

No purchase CTA.

---

# 29. NO RESPONSE

```text
┌────────────────────────────┐
│ No confirmation received   │
│                            │
│ The provider didn't       │
│ respond in time.           │
│                            │
│ [ Try another facility ]   │
└────────────────────────────┘
```

---

# 30. CONTACT AND ITINERARY REMAIN LOCKED

This is an extremely important rule.

Even after:

> Available.

The buyer does **not** yet receive:

* phone number;
* detailed itinerary;
* transaction chat.

Only:

> **Je veux acheter**

unlocks the transaction context.

This rule is explicitly defined and should be enforced server-side, not merely visually hidden.

---

# 31. SCREEN 10 — BULK AVAILABILITY RESULTS

```text
┌────────────────────────────────────┐
│ Your request                       │
│ 100 office chairs                  │
│                                    │
│ BEST MATCH                         │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Kossi Furniture                │ │
│ │ 100 / 100 confirmed            │ │
│ │ ₣95,000                        │ │
│ │ 4.2 km                         │ │
│ │ ✓ Omni discount                │ │
│ │                                │ │
│ │ [ Je veux acheter ]            │ │
│ └────────────────────────────────┘ │
│                                    │
│ Other matches                      │
│                                    │
│ 70/100   ABC Furniture             │
│ 40/100   XYZ Office                │
└────────────────────────────────────┘
```

The buyer can:

* rank by best match;
* quantity;
* price;
* distance;
* confidence;
* discount.

The existing specification defines a comparison surface containing seller, confirmed quantity, price, distance and discount.

---

# 32. SCREEN 11 — REQUESTS / MY DEMANDS

The buyer can later see:

```text
Mes demandes

● 100 office chairs
  4 responses
  2 complete matches

● Samsung A15
  3 responses
  1 available

● Laptop
  Waiting for response
```

A request can be:

```text
OPEN
RESPONDED
PARTIAL
EXPIRED
CLOSED
CONVERTED
```

Unconverted demand remains useful to Omni.

---

# 33. THE PURCHASE GATE

The moment the buyer presses:

> **Je veux acheter**

the product changes species.

We leave:

> Discovery / Research

and enter:

> Transaction.

There should be **no separate intermediate purchase-intent screen**.

The current authoritative model explicitly removed that separation: the tap atomically generates the transaction, coupon and QR and unlocks the transaction context.

---

# 34. SCREEN 12 — TRANSACTION GENERATION

Perceived flow:

```text
[ Je veux acheter ]
       ↓
very short loading
       ↓
Transaction created
QR generated
Coupon bound
Contact unlocked
Itinerary unlocked
Chat unlocked
       ↓
Transaction screen
```

This must be atomic server-side.

---

# 35. SCREEN 13 — TRANSACTION SCREEN

This is not a generic chat screen.

It is a:

> **Transaction workspace with contextual chat.**

### Mobile

```text
┌─────────────────────────┐
│ ← Transaction           │
│                         │
│ Samsung A15             │
│ Kossi Electronics       │
│                         │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │       QR CODE       │ │
│ │                     │ │
│ └─────────────────────┘ │
│                         │
│ Transaction active      │
│ Waiting for verification│
│                         │
│ ─────────────────────── │
│                         │
│ System                  │
│ Transaction created     │
│                         │
│ System                  │
│ QR generated            │
│                         │
│ [ Write a message... ]  │
└─────────────────────────┘
```

---

# 36. THE TRANSACTION QR

The QR is not merely:

> payment QR.

It is:

> **transaction authorization / coupon redemption mechanism.**

It is bound to:

```text buyer
seller
facility
product/service
quantity
offer
coupon instance
transaction
```

The existing transaction specification explicitly requires this one-to-one relationship.

---

# 37. TWO QR DELIVERY PATHS

The buyer can:

### Inside Omni

Send the QR through the transaction chat.

### Outside Omni

Share it through:

* WhatsApp;
* SMS;
* image;
* showing it physically.

Both paths converge on the same Omni validator.

```text
             QR
            /  \
           /    \
       Omni      Outside Omni
          \       /
           \     /
            ↓
       Omni Validator
```

The seller must always verify through Omni.

---

# 38. THE QR IS DIFFERENT FROM THE PUBLIC FACILITY QR

This distinction must be explicit in the implementation.

### Public Facility QR

Identifies/discovers a facility.

```text
FACILITY
```

### Transaction QR

Authorizes/identifies:

```text
THIS BUYER
+
THIS OFFER
+
THIS COUPON
+
THIS TRANSACTION
```

They must never be treated as interchangeable.

---

# 39. SCREEN 14 — SELLER VERIFICATION

Seller opens Omni.

They see:

```text
Transaction request

Samsung A15
Buyer: Kossi
Quantity: 1

[ Scan QR ]

or

[ Enter transaction code ]
```

The seller scans.

Omni validates.

---

# 40. QR VALIDATION SUCCESS

Buyer:

```text
✓ Transaction confirmed

You have ₣145,000 left to pay.

Choose payment method:
```

The exact net amount is revealed at this point.

The existing contract explicitly states that the net amount is shown after verification and equals price minus coupon reduction.

---

# 41. PAYMENT METHOD

V1:

```text
○ Cash
○ Mobile Money
○ Payer à la livraison
```

Potential future:

```text
○ Card
○ Bank transfer
○ Omni payment
```

The current V1 keeps payment external; Omni records the transactional state but does not need to become the payment rail.

---

# 42. PAYMENT INFORMATION

After selecting:

> Mobile Money

show the seller's configured payment information.

Example:

```text
Pay ₣145,000

Send to:
+228 XX XX XX XX

Name:
Kossi Electronics

[ J'ai payé ]
```

The buyer's declaration is **not proof of payment**.

---

# 43. SCREEN 15 — PAYMENT DECLARED

```text
Payment

₣145,000

You marked this payment as sent.

Waiting for the provider to confirm
receipt.

● Payment declared
○ Payment confirmed
○ Fulfillment
○ Completed
```

The buyer cannot advance the transaction beyond this point.

The seller remains the source of truth for actual receipt.

---

# 44. SELLER SIDE — PAYMENT RECEIVED

Seller:

```text
Transaction

Samsung A15
₣145,000

Buyer says payment sent.

[ Payment received ]
[ Payment not received ]
```

Seller confirms.

Then:

```text
PAYMENT_CONFIRMED
```

---

# 45. FULFILLMENT

Buyer may have selected:

```text
Pickup
Delivery
```

### Pickup

Omni can provide the relevant facility navigation information.

### Delivery

V1 does not need to become a delivery network.

The seller and buyer coordinate fulfillment.

The existing scope explicitly keeps delivery organization between seller and buyer while Omni manages pickup context.

---

# 46. SCREEN 16 — PRODUCT HANDED / SENT

Seller:

```text
Payment received ✓

Fulfillment

[ Product handed to buyer ]
[ Product sent ]
```

Buyer sees:

```text
Seller confirmed payment.

Your order is being fulfilled.
```

---

# 47. SCREEN 17 — BUYER RECEIVES PRODUCT

Buyer:

```text
Did you receive your order?

Samsung A15

[ Yes, I received it ]
```

After confirmation:

```text
COMPLETED
```

---

# 48. SCREEN 18 — COMPLETED

```text
✓ Transaction completed

Samsung A15
Kossi Electronics

₣145,000

[ Rate provider ]

[ Done ]
```

Rating is optional and non-blocking.

The completed transaction increments the facility's completed-sale count and can eventually move a certified facility toward `confirmed`.

---

# 49. QR ERROR STATES

The QR validator must explicitly handle:

### Expired

```text
This QR code has expired.

[ Generate new QR ]
```

The same transaction/coupon remains.

A new transaction must NOT be silently created.

### Replay

```text
This QR code has already been used.

No action required.
```

These error states are explicitly specified.

---

# 50. TRANSACTION CHAT

The chat is contextual.

It exists because:

> the transaction exists.

It is not:

> Omni Messenger.

System messages:

```text
Transaction created
QR generated
QR verified
Payment method selected
Payment declared
Payment confirmed
Product sent
Product received
Transaction completed
```

Human messages can appear between them.

---

# 51. THE CHAT RULE

The buyer may ask:

> "Can I pick this up at 17h?"

or:

> "Is there parking?"

or:

> "Can you deliver it?"

These messages belong to the transaction context.

The chat should not become an indefinite social conversation.

When the transaction completes:

> the active transactional session ends.

Historical context can remain available without requiring Omni to operate as a permanent messenger.

---

# 52. PROVIDER SIDE — ENTRY POINT

A provider needs a radically simpler experience than a conventional merchant dashboard.

Main provider navigation:

```text
Facilities
Offers
Availability Requests
Transactions
Profile
```

Future:

```text
Promotions
Ads
Agent
Analytics
```

The existing specification already separates provider navigation from buyer navigation and reserves Agent/Ads/automation capabilities for later or paid layers.

---

# 53. SCREEN 19 — PROVIDER HOME

```text
┌────────────────────────────┐
│ Omni                       │
│                            │
│ Your supply                │
│                            │
│ ● 1 facility               │
│ ● 4 offers                 │
│ ● 2 requests               │
│ ● 1 transaction            │
│                            │
│ [+ Add offer]              │
│                            │
│ Requests                   │
│ Samsung A15 ×1             │
│ Office chairs ×20          │
│                            │
└────────────────────────────┘
```

No intimidating enterprise dashboard.

---

# 54. SCREEN 20 — ADD OFFER

The provider is asked:

> **What are you offering?**

```text
[ Product ]
[ Service ]
[ Rental ]
[ Digital ]
[ Other ]
```

Then:

> **What is it?**

```text
Samsung Galaxy A15
```

Omni can classify it automatically.

---

# 55. OFFER CREATION

Minimum:

```text
Name
Category
Price / pricing model
Presence
Availability mode
Fulfillment
Omni discount
```

The provider should not be forced to create a complete e-commerce catalogue.

---

# 56. DISCOUNT GATE

This is now a core commercial rule.

For an offer to participate in Omni's transactional supply:

> it must have an Omni preferential price/discount.

The existing master explicitly establishes the minimum discount as mandatory at listing and creates a transaction-bound coupon instance at purchase.

UI:

```text
Omni discount

Give buyers a better price when
they complete the purchase through Omni.

Discount:
[ 5 % ]

Omni price:
₣142,500

[ Publish offer ]
```

The seller understands the reason:

> buyers have an incentive to use Omni.

---

# 57. PROVIDER PRESENCE

Ask:

> **Where can people find you?**

```text
At a fixed place
I move around
I'm usually fixed but want to broadcast my current location
I go to customers
Online
Temporary location
```

This accommodates:

* stores;
* stalls;
* roadside sellers;
* professionals;
* mobile vendors;
* home sellers;
* service providers;
* digital providers.

---

# 58. FIXED PRESENCE

```text
Facility location
[ Select on map ]

Name:
Kossi Electronics

Exact location:
[ map ]

Location visibility:
Public / Approximate / Private
```

The exact navigation target may later include:

```text building
floor
unit
stall
entrance
```

where known.

---

# 59. MOBILE PRESENCE

```text
Mobile facility

Current location:
● Live

[ Broadcast my location ]

Location visibility:
Approximate / Exact
```

The live position must carry freshness.

Omni should never imply:

> "This seller is here now"

if the last position is stale.

---

# 60. FIXED-IN-DISCOVERY

This is the special mode.

A normally fixed provider can temporarily broadcast their current position.

Example:

> financial engineer normally based at office, currently moving around Lomé.

UI:

```text
Discovery mode

Your normal location remains saved.

Current location:
● Broadcasting

[ Stop broadcasting ]
```

The existing model explicitly distinguishes fixed, mobile and `fixed-in-discovery`; the fixed location is preserved while temporary discovery mode is active.

---

# 61. SERVICE AREA

Example:

> Plumber.

Instead of an address:

```text
I go to customers.

Service area:
[ Lomé ]

Radius:
[ 10 km ]
```

The map displays the service area.

Search evaluates whether the buyer falls within it.

---

# 62. DIGITAL PRESENCE

Example:

> SaaS.

```text
Digital offer

Fulfillment:
Online

Physical origin:
Optional

Service geography:
Global / Selected regions
```

The physical origin can exist without being the fulfillment location.

---

# 63. OFFER AVAILABILITY

Provider sees:

```text
Samsung A15

Availability
○ Ask me
○ Available
○ Unavailable

Omni allocated quantity:
[ 5 ]
```

The provider is not required to enter their entire inventory.

---

# 64. OMNI ALLOCATED STOCK

This is **not POS inventory**.

If the seller has:

```text Real stock = 50
```

they may allocate:

```text Omni stock = 10
```

Omni only operates against the allocated portion.

The existing product definition explicitly distinguishes `quantity_allocated_omni` from the seller's total/real inventory.

---

# 65. EXTERNAL SALE

Suppose:

```text Omni allocated = 10
```

Seller sells 3 elsewhere.

Seller updates:

```text Omni allocated
10 → 7
```

They do NOT reconcile their entire warehouse.

This is the fundamental burden reduction.

---

# 66. AUTOMATIC AVAILABILITY

If:

```text facility OPEN
AND
omni_allocated_quantity > 0
```

Omni can answer immediately.

Otherwise:

```text request → provider/manual response
```

This gives the seller automation without requiring:

> catalogue synchronization,

> POS integration,

> constant stock monitoring.

---

# 67. PROVIDER REQUEST SCREEN

```text
Availability request

Buyer needs:

Samsung A15
Quantity: 2

[ Available ]
[ Partial ]
[ Unavailable ]
```

The seller can respond in seconds.

---

# 68. MULTI-PRODUCT REQUEST

```text
Buyer request

Samsung A15 × 1
Charger × 1
Memory card × 1

[ Respond ]
```

The seller can answer each item.

Result returns as one consolidated availability response.

---

# 69. TRANSACTION INBOX

```text
Transactions

● Waiting for verification
  Samsung A15

● Payment declared
  Office chair × 20

● Ready to fulfill
  Laptop

✓ Completed
  Charger
```

Opening one takes the seller directly into the transaction context.

---

# 70. PROVIDER TRANSACTION SCREEN

```text
Transaction

Buyer
Kossi

Offer
Samsung A15 ×1

Price
₣145,000

Coupon
Omni discount

QR
[ Scan / Verify ]

Status
Waiting for verification
```

The seller's actions evolve according to transaction state.

---

# 71. PROVIDER VERIFICATION

```text
[ Verify QR ]

✓ Valid Omni transaction

Buyer:
Kossi

Offer:
Samsung A15

Quantity:
1

Omni price:
₣145,000
```

Only after validation does the buyer's transaction become confirmed.

---

# 72. PROVIDER PAYMENT

```text
Payment

Buyer marked payment as sent.

[ Payment received ]
[ Not received ]
```

Only:

> Payment received

advances the state.

---

# 73. PROVIDER FULFILLMENT

```text
Payment confirmed ✓

Fulfillment

[ Product handed ]
[ Product sent ]
```

---

# 74. FACILITY LIFECYCLE

For V1, authoritative operational states should be:

```text
UNCLAIMED
    ↓
CERTIFIED
    ↓
UNCONFIRMED
    ↓
CONFIRMED
```

Where:

```text
CERTIFIED
+
3 completed Omni sales
=
CONFIRMED
```

The corrected authoritative lifecycle and 3-sale confidence rule are already defined in the master.

---

# 75. UNCLAIMED FACILITY

An unclaimed facility can still appear in search.

It can have:

* location;
* name;
* category;
* public information;
* associated content.

But:

```text
DISCOVERY = YES
TRANSACTION = NO
OWNER CONTROL = NO
```

The user sees:

> **Unclaimed facility**

and:

> **Are you the owner? Claim this facility.**

This behavior is explicitly specified.

---

# 76. CERTIFIED FACILITY

Once verified:

```text
✓ Certified
```

The provider can:

* publish offers;
* respond to availability;
* receive transactions;
* manage their presence.

---

# 77. CONFIRMED FACILITY

After:

> 3 completed/verified Omni sales.

Display:

```text
✓ Confirmed
```

This is not merely a paid badge.

It represents demonstrated transactional trust.

---

# 78. PUBLIC FACILITY DISCOVERY

A facility can exist in Omni before its owner participates.

This is extremely important for Omni's mission.

Example:

```text
Marché X

12 known facilities
4 claimed
8 unclaimed
```

The world does not wait for every seller to download the app.

---

# 79. CLAIM FLOW

```text
Facility
 ↓
Are you the owner?
 ↓
Claim
 ↓
Verification
 ↓
Certified
```

The claim request enters the admin certification workflow.

---

# 80. PROVIDER OFFLINE / ONLINE

A provider can turn a facility:

```text
ON
OFF
```

If OFF:

* it remains represented;
* it can remain in the provider account;
* it can return later;
* it should not appear as currently actionable supply.

This avoids destroying the representation simply because the seller is not operating today.

---

# 81. SEARCH WITH CLOSED FACILITY

If:

```text facility = closed
```

then:

> current fulfillment is not available.

But the facility can still be discoverable depending on the search context.

Example:

> "electronics shops in this area"

can still show it.

Example:

> "electronics available right now"

should not rank it as currently actionable.

---

# 82. BUYER NAVIGATION

Buyer menu:

```text
Profile
Searches
Availability
Transactions
Notifications
Settings
Help
```

The existing product definition already identifies these buyer-level surfaces.

---

# 83. PROVIDER NAVIGATION

Provider menu:

```text
Facilities
Offers
Requests
Transactions
Profile
```

Future capability areas:

```text Promotions
Ads
Agent
Analytics
Subscription
```

These should not dominate V1.

---

# 84. NOTIFICATIONS

Notifications are contextual.

Examples:

```text
Your availability request was answered.

Your transaction QR was verified.

Payment was confirmed.

Your product was marked as delivered.

Your facility was certified.

Your offer is receiving demand.
```

Clicking a notification should deep-link to its context.

The existing model explicitly treats notifications as contextual and deep-linked.

---

# 85. BUYER FREE VS PRO

V1 should preserve the principle:

> **The basic discovery product is free.**

Buyer Free:

```text
Map
Search
Constraints
Discovery
Facility details
Manual availability
Purchase
QR
Transaction
```

Existing planning defines Free bulk availability as limited to 3/month.

Pro can later add:

```text
larger bulk usage
global geographic search
Agent
AI recommendations
automation
```

But the exact pricing gate must remain configurable server-side.

---

# 86. PROVIDER FREE VS PRO

Free should be genuinely usable.

Potential Free:

```text
1 facility
5 offers
manual availability
basic transaction
basic presence
```

The existing V1 acceptance test defines the current Free limits as one facility and five products for that facility.

Pro can later provide:

```text
more facilities
larger catalogue
bulk import
automation
Agent
advanced analytics
```

---

# 87. THE MOST IMPORTANT ECONOMIC PRINCIPLE

Omni should not monetize:

> **permission to exist.**

A roadside seller should be able to exist.

A professional should be able to exist.

A home seller should be able to exist.

A small shop should be able to exist.

A digital provider should be able to exist.

Paid capabilities should primarily provide:

> **more scale, automation, intelligence and operational capacity.**

---

# 88. MEDIA

V1 architecture remains media-ready.

Possible future:

```text
facility photos
product photos
video
promotional content
social content
facility walkthroughs
```

But the current UI should not become a media feed.

The existing scope explicitly keeps media architecture-ready while the UI remains disabled for now.

---

# 89. THE FUTURE SPATIAL LAYER

The original Omni vision of exploring supply spatially is preserved architecturally.

Eventually:

```text WORLD
 ↓
CITY
 ↓
STREET
 ↓
BUILDING
 ↓
FACILITY
 ↓
STALL / OFFICE / SHOP
 ↓
OFFER
```

could become:

* 3D;
* immersive;
* AR;
* street-level;
* indoor navigation;
* spatial media.

But:

> **V1 does not need VR.**

The seed is the geographic data model.

---

# 90. THE COMPLETE BUYER STATE MACHINE

```text
MAP
 │
 ▼
SEARCH_ACTIVE
 │
 ▼
QUERY_DEFINED
 │
 ├── AUTH_REQUIRED
 │       ↓
 │    ONBOARDING
 │       ↓
 │    QUERY_RESTORED
 │
 ▼
SEARCHING
 │
 ▼
RESULTS
 │
 ├── NO_MATCH
 │      ↓
 │   DEMAND_CAPTURE
 │
 └── MATCHES
       ↓
FACILITY_SELECTED
       ↓
OFFER_SELECTED
       ↓
AVAILABILITY_REQUEST
       ↓
 ┌───────────────┬────────────────┐
 │               │                │
AUTO            MANUAL          BULK
 │               │                │
 └───────────────┴────────────────┘
                 ↓
       AVAILABILITY_RESULT
                 │
        ┌────────┼─────────┐
        │        │         │
    AVAILABLE  PARTIAL  UNAVAILABLE
        │        │
        └────────┘
             ↓
       JE VEUX ACHETER
             ↓
     PURCHASE_GENERATING
             ↓
      TRANSACTION_ACTIVE
             ↓
       QR_VERIFICATION
             ↓
       CODE_VERIFIED
             ↓
      PAYMENT_DECLARED
             ↓
      PAYMENT_CONFIRMED
             ↓
        FULFILLMENT
             ↓
        PRODUCT_RECEIVED
             ↓
          COMPLETED
```

---

# 91. THE COMPLETE PROVIDER STATE MACHINE

```text
DISCOVERED
   ↓
UNCLAIMED
   ↓
CERTIFIED
   ↓
UNCONFIRMED
   ↓
CONFIRMED
```

Operationally:

```text
FACILITY
   │
   ├── ON
   └── OFF

OFFER
   │
   ├── DRAFT
   ├── DISCOVERABLE
   ├── TEMPORARILY_UNAVAILABLE
   └── ARCHIVED

AVAILABILITY
   │
   ├── ASK_PROVIDER
   ├── ALLOCATED_STOCK
   └── MANUAL_RESPONSE
```

---

# 92. THE DATA TRUTH HIERARCHY

This is perhaps the most important backend rule.

Omni must distinguish:

```text
WORLD REALITY
      ↓
PROVIDER DECLARATION
      ↓
OMNI ALLOCATED STOCK
      ↓
OMNI TRANSACTION RECORD
      ↓
CONFIRMED TRANSACTION OUTCOME
```

Omni does not magically know the world's inventory.

It progressively increases confidence.

---

# 93. AVAILABILITY TRUTH

The system may know:

```text
Provider says available.
```

or:

```text
Omni allocated stock suggests available.
```

or:

```text
Provider says unavailable.
```

But the buyer-facing abstraction remains:

```text
Available
Partial
Unavailable
Needs confirmation
```

The internal mechanism should not pollute the buyer experience.

---

# 94. THE OMNI STOCK LOOP

```text
Seller allocates
10 units to Omni
       ↓
Omni can auto-answer
       ↓
Buyer purchases 3
       ↓
Transaction completed
       ↓
Omni allocation
10 → 7
```

External sale:

```text
Seller sells 2 outside Omni
       ↓
Seller manually adjusts
7 → 5
```

Future:

```text
POS / integration / Agent
       ↓
automatic adjustment
```

This is the evolutionary path.

---

# 95. THE AGENT IS NOT REQUIRED FOR THE CORE PRODUCT

V1 works:

```text
WITHOUT AI
```

The Agent later automates:

```text
search interpretation
availability orchestration
seller responses
recommendations
order preparation
```

But all critical underlying operations already exist manually.

That is what makes the system robust.

---

# 96. THE PRODUCT'S REAL FLYWHEEL

```text
MORE SUPPLY REPRESENTED
        ↓
BETTER SEARCH
        ↓
MORE BUYER VALUE
        ↓
MORE BUYERS
        ↓
MORE AVAILABILITY REQUESTS
        ↓
MORE TRANSACTIONS
        ↓
MORE PROVIDER VALUE
        ↓
MORE PROVIDERS
        ↓
MORE SUPPLY
```

Then:

```text
TRANSACTIONS
 ↓
DEMAND DATA
 ↓
SUPPLY GAPS
 ↓
PROVIDER ACQUISITION
 ↓
BETTER COVERAGE
```

This is the actual venture-scale loop.

---

# 97. WHAT V1 MUST PROVE

We are not trying to prove:

> Omni has digitized the entire world's economy.

We are proving:

### Hypothesis 1

People naturally use Omni to search for products/services geographically.

Your interviews already give strong directional evidence: users went directly to search during the mock and asked for additional products when they couldn't find what they wanted.

### Hypothesis 2

Users value seeing supply according to constraints.

### Hypothesis 3

Users are willing to request availability rather than call/message every seller themselves.

### Hypothesis 4

Providers can participate without maintaining a full digital inventory.

### Hypothesis 5

The Omni discount creates a strong enough reason to complete the transaction through Omni.

### Hypothesis 6

The transaction QR provides traceability even though Omni does not need to process the payment itself.

---

# 98. THE V1 PRODUCT BOUNDARY

## MUST SHIP

```text
Map
Search
Location
Structured constraints
Results
Facility representation
Offer representation
Facility detail
Multi-product same-facility availability
Manual availability
Allocated-stock fast path
Bulk availability
Availability comparison
Purchase Intent
Transaction QR
QR verification
Contact unlock
Itinerary unlock
Transactional chat
External payment declaration
Seller payment confirmation
Fulfillment
Completion
Basic provider onboarding
Facility ON/OFF
Basic mobile/discovery presence
Omni allocated stock
Free/Pro foundations
Notifications
```

---

# 99. SHOULD NOT BLOCK V1

```text
3D world
VR
AR
full inventory synchronization
POS integrations
AI seller agent
global multi-facility cart
automated delivery network
advanced ads
social feed
full media ecosystem
complex recommendation engine
perfect global taxonomy
```

These remain architectural possibilities, not V1 blockers.

---

# 100. THE ONE FUTURE FEATURE WE MUST NOT ACCIDENTALLY BUILD INTO V1

### Global Multi-Facility Cart

Do NOT turn:

```text
Facility A
Facility B
Facility C
```

into one automatic order in V1.

V1 can compare them.

The buyer chooses one.

Future Omni can support:

```text
Global cart

Facility A → 3 items
Facility B → 2 items
Facility C → 1 item
```

But that introduces:

* multiple transactions;
* multiple fulfillment;
* split payment;
* partial failures;
* multiple sellers;
* settlement;
* cancellation complexity.

It deserves its own Species.

---

# 101. THE FINAL V1 EXPERIENCE

A user opens Omni.

They see:

> **the world.**

They search:

> **"I need 5 office chairs under ₣100,000 near me."**

Omni:

```text
understands demand
↓
finds geographical supply
↓
filters constraints
↓
shows facilities
↓
shows relevant offers
```

The buyer opens one facility.

They see:

> chairs
> desks
> shelves
> accessories.

They select:

> 5 chairs + 2 desks.

They ask:

> **Check availability.**

Omni contacts the appropriate supply.

The provider confirms.

The buyer compares.

They choose:

> **Je veux acheter.**

Omni atomically creates:

```text
transaction
coupon
QR
```

and unlocks:

```text
seller contact
directions
transaction chat
```

The seller verifies the QR.

The buyer sees the final amount.

The buyer chooses:

> Mobile Money.

The buyer pays externally.

The buyer taps:

> **J'ai payé.**

The seller confirms:

> **Paiement reçu.**

The seller fulfills.

The buyer confirms:

> **J'ai reçu.**

The transaction becomes:

> **Completed.**

And Omni now knows:

```text who
bought what
from whom
where
when
at what offer
with which discount
and with what outcome
```

That is the V1.

---

# 102. FINAL ARCHITECTURAL STATEMENT

At this point, Omni should no longer be designed as:

> a set of pages.

It should be implemented as:

> **a stateful geographic supply system with buyer and provider capabilities.**

The UI is simply the visible projection of those states.

```text
                   OMNI
                     │
          ┌──────────┴──────────┐
          │                     │
       DEMAND                 SUPPLY
          │                     │
       SEARCH                 PROVIDER
          │                     │
     CONSTRAINTS             PRESENCE
          │                     │
      ELIGIBILITY              OFFER
          │                     │
       RESULTS              AVAILABILITY
          │                     │
          └──────────┬──────────┘
                     │
                PURCHASE
                  INTENT
                     │
                TRANSACTION
                     │
                  OUTCOME
                     │
                DATA / TRUST
```

---

# 103. THE DEVELOPMENT GATE

After this document, we should **stop adding conceptual product features** unless a real contradiction is discovered.

The next engineering document should translate this exact product into:

```text
1. DOMAIN ENTITIES
2. DATABASE RELATIONSHIPS
3. ENUMS
4. STATE MACHINES
5. SERVER ACTIONS
6. API CONTRACTS
7. PERMISSION MATRIX
8. UI COMPONENT TREE
9. SCREEN STATES
10. ERROR STATES
11. ACCEPTANCE TESTS
12. SEED DATA
13. V1 IMPLEMENTATION ORDER
```

And then:

> **build.**

The important thing is that the database should now be derived from the organism above — **not the other way around**.
