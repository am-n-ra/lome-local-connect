# OMNI — SPECIES 08

# SEARCH & DEMAND

## Founder HQ × Nature Way — V1 Seed Species

**Status:** Draft for Species Gate
**Purpose:** Define what a buyer can ask Omni, how demand is represented, which constraints are hard vs preferred, what Omni may claim, and how search transitions into availability.

---

# 0. WHY THIS SPECIES EXISTS

Omni does not primarily exist to show a list of businesses.

Omni exists to make the world's supply:

> **discoverable, geographically represented, queryable and progressively verifiable.**

The buyer should be able to express a need such as:

> "I need 20 chairs, within 10 km, under ₣100,000, available today, preferably with delivery."

The system must transform this into a structured demand representation and determine which supply can satisfy it.

The fundamental chain is:

```text
HUMAN NEED
    ↓
SEARCH / DEMAND
    ↓
STRUCTURED CONSTRAINTS
    ↓
ELIGIBILITY
    ↓
MATCHING SUPPLY
    ↓
RANKING
    ↓
AVAILABILITY
    ↓
PURCHASE INTENT
```

Search is therefore not merely a text box.

It is the first expression of **demand in Omni's model of the world**.

---

# 1. PRIME DIRECTIVE

> **Never make the buyer manually reconstruct information that Omni can structurally determine.**

If the buyer says:

> "Find me a laptop under ₣300,000 near me."

Omni should not simply return:

> 47 computer shops.

It should determine:

* what constitutes a laptop;
* which offers are geographically relevant;
* which offers satisfy the budget;
* which providers can fulfill the request;
* which supply is currently known;
* which results require confirmation.

The goal is not maximum results.

The goal is:

> **maximum useful supply coverage under the buyer's actual constraints.**

---

# 2. SEARCH IS NOT THE SAME AS AVAILABILITY

This distinction is fundamental.

### Search answers:

> **What supply appears capable of satisfying my request?**

### Availability answers:

> **Can this provider actually fulfill my request now?**

Therefore:

```text
SEARCH
  ↓
candidate supply
  ↓
AVAILABILITY
  ↓
confirmed supply
```

Omni must never pretend that search discovery alone equals real-time availability.

---

# 3. THE DEMAND OBJECT

Every explicit search should conceptually resolve into a `DemandQuery`.

Minimum structure:

```text
DemandQuery
├── query
├── quantity
├── budget
├── geography
├── time
├── fulfillment
└── preferences
```

The natural-language expression is preserved.

The structured interpretation is generated alongside it.

Example:

```text
User:
"I need 5 office chairs under 150k within 5 km,
available today, preferably delivery."

DemandQuery:

query:
  office chairs

quantity:
  5

budget:
  max = 150000

geography:
  origin = user_position
  radius = 5km

time:
  today

fulfillment:
  delivery preferred

preferences:
  delivery = preferred
```

---

# 4. NATURAL LANGUAGE MUST NOT BE REQUIRED

V1 must work without AI.

The buyer can manually specify:

```text
What:
[ office chairs ]

Quantity:
[ 5 ]

Budget:
[ ≤ ₣150,000 ]

Distance:
[ ≤ 5 km ]

Availability:
[ Today ]

Fulfillment:
[ Delivery ]
```

This is important because:

> **The Agent is an orchestration layer, not the foundation of Omni.**

Everything the Agent does must already be possible manually.

This is already a V1 non-negotiable in the existing product specification.

---

# 5. QUERY TYPES

V1 must support at least:

### PRODUCT

> "iPhone 15"

### SERVICE

> "financial consultant"

### RENTAL

> "car rental"

### GENERAL CATEGORY

> "chairs"

### MULTI-ITEM DEMAND

> "chairs and tables"

### FACILITY-BASED DISCOVERY

> "What does this facility offer?"

### LOCATION-BASED DISCOVERY

> "phone shops near me"

The last two are different from product-first search and must not be forced into the same semantic interpretation.

---

# 6. SEARCH CAN START FROM DIFFERENT INTENTS

A query may express:

### Product intent

> "Find Samsung A15"

### Facility intent

> "Find electronics stores"

### Service intent

> "Find a plumber"

### Geographic intent

> "What's available around me?"

### Supply exploration

> "What can I find here?"

### Known facility exploration

> "What does this seller have?"

The search engine must preserve the original intent rather than blindly converting everything into a product search.

---

# 7. HARD CONSTRAINTS VS PREFERENCES

This is one of the most important decisions.

Not every buyer requirement has the same meaning.

## HARD CONSTRAINT

If violated, the result should not qualify.

Examples:

```text
maximum price
minimum quantity
maximum distance
required fulfillment mode
required geographic service area
required time
```

Example:

> "Under ₣100,000"

A ₣150,000 offer does not satisfy the constraint.

---

## PREFERENCE

A preference affects ranking but does not necessarily exclude.

Examples:

```text
prefer closer
prefer cheaper
prefer certified
prefer delivery
prefer highly rated
prefer discount
```

Example:

> "Prefer delivery."

A pickup-only provider may remain a result if the buyer did not explicitly require delivery.

---

# 8. EXPLICIT LANGUAGE MUST DETERMINE CONSTRAINT TYPE

Examples:

> "under ₣100,000"

→ HARD MAX PRICE

> "around ₣100,000"

→ SOFT PRICE PREFERENCE

> "within 5 km"

→ HARD DISTANCE

> "near me"

→ DEFAULT GEOGRAPHIC PREFERENCE / CONTEXT

> "I need 20"

→ HARD MINIMUM QUANTITY

> "I'd prefer delivery"

→ PREFERENCE

> "delivery only"

→ HARD FULFILLMENT REQUIREMENT

The system must not silently convert preferences into hard exclusions.

---

# 9. DEFAULTS MUST BE VISIBLE WHEN THEY MATTER

Omni may infer useful context.

For example:

> "Find shoes"

while the user is located in Lomé.

Omni can use the user's position as the default geographic context.

But it must not falsely tell the user:

> "within 2 km"

unless the buyer actually specified that constraint.

The distinction is:

```text
CONTEXT
≠
USER CONSTRAINT
```

---

# 10. GEOGRAPHY IS FIRST-CLASS

Every local query should be interpreted through geographic context where relevant.

The query can contain:

```text
near me
within 5 km
in Lomé
in Tokoin
near this facility
near this location
```

The geographic engine must evaluate the Offer's actual fulfillment relationship, not merely the provider's postal address.

Examples:

```text
FIXED FACILITY
→ distance to facility

MOBILE PROVIDER
→ distance to current location

SERVICE AREA
→ whether buyer location lies within service area

DELIVERY
→ whether buyer lies inside delivery zone

DIGITAL
→ geographic constraint may be irrelevant
```

---

# 11. SEARCH MUST RESPECT THE FACILITY SPECIES

A result is not eligible merely because its pin is nearby.

Example:

```text
Plumber
Facility location:
20 km away

Service area:
10 km

Buyer:
5 km away
```

Eligible.

Another:

```text
Shop:
2 km away

Product:
available

Delivery:
not offered

Buyer:
requires delivery
```

Not eligible.

Therefore:

> **distance is not sufficient; fulfillment geography must be evaluated.**

---

# 12. OFFER ELIGIBILITY

For each candidate Offer:

```text
ELIGIBILITY
├── semantic match
├── geography
├── price
├── quantity
├── fulfillment
├── time
├── provider/facility state
└── other explicit hard constraints
```

Only candidates passing the required hard constraints become direct matches.

---

# 13. SEARCH RESULT CLASSES

The search engine should distinguish at least:

### DIRECT MATCH

The known offer satisfies the query's hard constraints.

### POSSIBLE MATCH

The offer appears relevant, but a required fact is unknown.

### NON-MATCH

A known hard constraint fails.

### NO MATCH

No eligible direct supply was found.

These should not be presented identically.

---

# 14. DIRECT MATCH DOES NOT NECESSARILY MEAN CONFIRMED AVAILABILITY

Example:

```text
Samsung A15
₣145,000
2.1 km
```

The Offer matches:

* product;
* price;
* geography.

But Omni may not know whether the seller still has one.

Therefore:

```text
SEARCH MATCH
      ↓
Availability state:
      ├── known available
      ├── known unavailable
      └── needs confirmation
```

---

# 15. AVAILABILITY STATES

V1 uses the existing availability model:

```text
AVAILABLE
UNAVAILABLE
ASK PROVIDER
```

Where a response has been obtained, the buyer may see:

```text
available
partial
unavailable
sla_expired
```

The current specification already defines these result states and explicitly prevents the buyer from seeing whether the answer came from a human or automated response.

---

# 16. THE SEARCH RESULT MUST TELL THE TRUTH

Omni must distinguish:

> **"This matches your request."**

from:

> **"The provider confirmed they have it."**

And:

> **"Omni knows this through allocated stock."**

from:

> **"The provider manually confirmed it."**

The buyer does not necessarily need to know the internal mechanism.

But Omni must never collapse uncertainty into false certainty.

---

# 17. SEARCH RESULT RANKING

After hard eligibility filtering:

```text
eligible candidates
       ↓
ranking
```

Potential ranking signals:

```text
constraint fit
distance
price
availability confidence
quantity fit
fulfillment fit
provider responsiveness
trust/certification
rating
freshness
Omni discount
```

But ranking must never override a hard constraint.

A ₣200,000 product cannot outrank a ₣100,000 maximum simply because it has better ratings.

---

# 18. DISCOUNT AS A RANKING + TRANSACTION SIGNAL

Omni discount is especially important because it connects:

```text
DISCOVERY
   ↓
INCENTIVE
   ↓
TRANSACTION
   ↓
TRACEABILITY
```

An offer with a valid Omni discount can therefore receive stronger transactional prominence.

But the existence of an offer in Omni's world should not necessarily depend on having a discount.

The economic rule belongs to **transaction eligibility and commercial incentives**, not to the existence of the underlying supply representation.

---

# 19. THE FACILITY RESULT

When the buyer selects a result, Omni should expose:

```text
Facility
├── identity
├── geographic context
├── offer matching query
├── other visible offers
├── current relevant availability state
└── actions
```

This is important because a buyer who searched:

> "Samsung A15"

may discover:

> another phone,

> a charger,

> a case,

> another relevant product.

The facility therefore becomes a **secondary discovery surface**.

This is not a separate search.

It is:

> **search → facility → adjacent supply discovery.**

---

# 20. MULTIPLE PRODUCTS FROM ONE FACILITY

V1 should support the user selecting several offers from the same facility and requesting their availability together.

Example:

```text
Facility:
Kossi Electronics

Selected:
☑ Samsung A15
☑ 128GB memory card
☑ Charger

[Check availability]
```

This becomes one `AvailabilityRequest` containing multiple requested items.

The seller receives one contextual request rather than three disconnected requests.

---

# 21. THIS IS NOT YET THE GLOBAL CART

Important.

V1 can support:

```text
ONE FACILITY
    ↓
MULTIPLE REQUESTED ITEMS
    ↓
ONE AVAILABILITY REQUEST
```

But:

```text
FACILITY A
+
FACILITY B
+
FACILITY C
    ↓
GLOBAL MULTI-FACILITY CART
```

is a later Species.

The distinction keeps V1 implementable.

---

# 22. BULK AVAILABILITY

Bulk availability is a different demand pattern.

Example:

> "I need 100 chairs."

Omni should not require the buyer to manually open 30 facility sheets.

The flow becomes:

```text
DemandQuery
    ↓
Search candidate facilities
    ↓
Availability requests
    ↓
Responses
    ↓
Aggregate
    ↓
Compare
    ↓
Best matches
```

This existing acceptance test already defines the expected behavior: search → candidate facilities → availability requests → responses → ranking → consolidated answer.

---

# 23. BULK DOES NOT MEAN MULTI-FACILITY CART

For V1:

> bulk availability = **find who can satisfy a large demand**

not:

> automatically purchase the demand across multiple providers.

A future version can allow:

```text
100 chairs

Facility A → 40
Facility B → 35
Facility C → 25

GLOBAL CART
= 100
```

But this is deliberately outside the V1 transaction species.

---

# 24. NO DIRECT RESULTS

If Omni cannot find direct eligible supply:

It must not simply say:

> "No results."

Instead:

```text
NO DIRECT MATCH
      ↓
"What exactly are you looking for?"
      ↓
preserve query
      ↓
request / demand signal
```

The existing UI contract already specifies that the request surface replaces the action row when no direct results exist and preserves the exact query.

This is strategically important.

---

# 25. NO RESULTS IS DEMAND DATA

A failed search is not worthless.

It means:

> Omni has observed demand that its represented supply cannot currently satisfy.

This can later feed:

```text
demand intelligence
     ↓
supply gaps
     ↓
provider acquisition
     ↓
better representation
```

Therefore:

> **Search failure is a product signal, not merely an error state.**

---

# 26. BUT DO NOT FAKE SUPPLY TO SOLVE NO-RESULTS

If Omni has no known provider:

It must not invent:

> a nearby facility,

> an availability claim,

> a price,

> a quantity.

The system may say:

> "We couldn't find a matching offer."

Then collect the demand.

Trust is more important than result count.

---

# 27. SEARCH HISTORY

Every meaningful search can become a reusable demand object.

The buyer may reopen:

> "20 office chairs under ₣100,000"

and update:

```text
quantity
budget
location
time
fulfillment
```

without recreating the query.

This also creates the future foundation for:

> Agent Mode.

The Agent can operate on a structured historical demand instead of starting from an empty conversation.

---

# 28. AGENT MODE

V1 manual:

```text
Buyer
 ↓
Search
 ↓
Filters
 ↓
Availability
```

Pro / AI:

```text
Buyer:
"I need 20 chairs under 100k delivered tomorrow."

Agent
 ↓
interprets intent
 ↓
creates DemandQuery
 ↓
runs search
 ↓
checks availability
 ↓
compares
 ↓
recommends
```

But the underlying actions remain the same.

This follows the existing Omni principle:

> **Anything the Agent can do must already exist as a manual action.**

---

# 29. SEARCH → AVAILABILITY GATE

The system should not ask every provider for availability for every search.

First:

```text
SEARCH
 ↓
ELIGIBILITY
 ↓
candidate facilities/offers
```

Then:

```text
AVAILABILITY REQUEST
```

This is essential for scalability.

Otherwise a simple query:

> "shoes"

could trigger thousands of provider requests.

---

# 30. AVAILABILITY REQUEST TARGETING

The system should prioritize candidates according to:

```text
semantic relevance
geographic relevance
constraint fit
provider state
offer quality
availability confidence
```

The buyer should experience:

> **one Omni request**

even if Omni internally communicates with multiple providers.

---

# 31. PROVIDER BURDEN IS A SEARCH-SYSTEM CONSTRAINT

Search architecture must account for provider capacity.

A provider should not receive irrelevant requests.

Therefore:

> **Only ask a provider when the request has a credible chance of being fulfilled.**

This is one of the most important reasons why search eligibility must precede availability.

---

# 32. SEARCH FRESHNESS

Search results are time-sensitive.

Relevant signals include:

```text
offer updated_at
availability updated_at
facility state
allocated stock
mobile location freshness
provider response history
```

A mobile seller whose position was last updated 45 minutes ago should not necessarily appear as though they are currently standing beside the buyer.

---

# 33. LOCATION FRESHNESS

For mobile/fixed-in-discovery facilities:

```text
current position
+
timestamp
+
accuracy
```

must be treated as a temporal fact.

The existing location contract already requires truthful accuracy handling and explicitly prevents low-accuracy network estimates from being presented as precise GPS positions.

Search must inherit that rule.

---

# 34. SEARCH RESULT → FACILITY

When a user taps a result:

```text
MAP
 ↓
Facility selected
```

The map remains visible.

The facility surface is an overlay, not a new page.

This follows Omni's stateful-interface principle:

```text
MAP
→ SEARCH
→ RESULTS
→ FACILITY
→ AVAILABILITY
→ PURCHASE INTENT
→ TRANSACTION
```

rather than isolated pages.

---

# 35. SEARCH RESULT UI CONTRACT

A result should minimally communicate:

```text
WHAT
Provider / Facility
Price
Geographic relevance
Availability status
Discount if applicable
Primary next action
```

Example:

```text
Samsung Galaxy A15

Kossi Electronics
2.4 km

₣145,000
Omni discount applied

Availability:
Ask provider

[Check availability]
```

If already confirmed:

```text
✓ Available
1 unit confirmed

[Je veux acheter]
```

Contact and itinerary remain locked until the Purchase Intent gateway as already specified.

---

# 36. SEARCH DOES NOT UNLOCK CONTACT

This remains a hard rule.

Even if a provider is:

```text
nearby
open
available
```

the buyer does not receive:

* phone number;
* direct contact;
* detailed itinerary;
* transaction chat.

until:

```text
"I want to buy"
```

creates the Purchase Intent / Transaction context.

This preserves Omni's transaction attribution and prevents discovery from becoming an uncontrolled contact directory.

---

# 37. SEARCH AND THE MAP

Search is geographically visual.

When a query executes:

```text
clean globe
 ↓
continent
 ↓
country
 ↓
region
 ↓
town / area
 ↓
actual search position
 ↓
results
```

The existing globe contract explicitly defines this staged geographic reveal and requires the final state to show the user position plus individual finding pins and result UI.

This is not decorative.

It communicates:

> **"Your search is happening in the real world."**

---

# 38. SEARCH SHOULD NOT CREATE A DASHBOARD

The result UI must remain subordinate to the geography.

On mobile:

```text
MAP
  ↓
finding pins
  ↓
horizontal result cards / bottom result surface
```

On desktop:

```text
RESULTS       MAP
```

with the map remaining the spatial source of truth.

---

# 39. QUERYABLE SUPPLY ≠ COMPLETE SUPPLY

Omni's long-term promise is to represent the world's supply.

But V1 must be honest:

> Omni represents the supply it currently knows.

Therefore:

```text
WORLD SUPPLY
      ↓
KNOWN / REPRESENTED SUPPLY
      ↓
ELIGIBLE SUPPLY
      ↓
CONFIRMED SUPPLY
```

The mission is to continuously increase the coverage of the second layer.

This prevents a dangerous V1 claim:

> "If Omni doesn't show it, it doesn't exist."

That is not yet true.

The stronger future promise is:

> **Omni becomes increasingly comprehensive.**

---

# 40. THE SEARCH ENGINE'S CORE CONTRACT

Given:

```text
DemandQuery
```

the system must:

### 1. Understand

What is being requested?

### 2. Normalize

What product/service/category does it represent?

### 3. Filter

Which supply fails explicit hard constraints?

### 4. Rank

Which remaining supply is most useful?

### 5. Determine confidence

Which facts are known vs uncertain?

### 6. Present

Show the buyer the most useful representation.

### 7. Offer verification

Where necessary, initiate availability.

---

# 41. SEARCH STATE MACHINE

```text
IDLE
 ↓
QUERY_ENTERED
 ↓
QUERY_PARSED
 ↓
SEARCHING
 ↓
RESULTS_FOUND
 │
 ├── DIRECT_MATCHES
 │
 ├── POSSIBLE_MATCHES
 │
 └── NO_DIRECT_MATCH
 │
 ▼
FACILITY_SELECTED
 ↓
AVAILABILITY_REQUEST
 ↓
AVAILABILITY_RESULTS
 ↓
PURCHASE_INTENT
```

A search can terminate at:

```text
NO_DIRECT_MATCH
```

without pretending that the product does not exist.

---

# 42. V1 SEARCH DATA MODEL — CONCEPTUAL

```text
DemandQuery
├── id
├── buyer_id
├── raw_query
├── normalized_query
├── intent_type
├── quantity
├── quantity_unit
├── budget_min
├── budget_max
├── origin_location
├── geographic_constraint
├── time_constraint
├── fulfillment_requirements
├── preferences
├── status
├── created_at
└── updated_at
```

Search results should reference the supply records that produced them rather than copying the entire supply object into the query.

---

# 43. IMPORTANT: DO NOT OVERMODEL V1

We do not yet need:

```text
AI semantic ontology
perfect global taxonomy
complex recommendation graph
real-time demand prediction
personalized ranking model
multi-facility optimization
global cart
```

Those are future layers.

V1 needs:

```text
search
+
structured constraints
+
geographic filtering
+
basic ranking
+
availability gateway
```

That is enough to prove the core proposition.

---

# 44. THE ACTUAL V1 BUYER PROMISE

After this Species, I would define Omni's buyer promise as:

> **Tell Omni what you are looking for and the constraints that matter. Omni will show you the supply it knows that can satisfy those constraints, geographically, and when current availability is uncertain, let you ask the providers who know their supply best.**

This is much more precise than:

> "Find businesses."

And much more defensible than:

> "We know everything that's in stock."

---

# 45. SPECIES 08 — NON-NEGOTIABLES

### Search

* Search is demand representation.
* Search works manually without AI.
* Natural language is optional.
* Structured quantity and budget are first-class.
* Geography is first-class.
* Hard constraints cannot be violated.
* Preferences affect ranking.
* Search does not equal availability.
* Search does not equal transaction.
* Search never fabricates missing supply.
* Search results remain map-first.

### Availability

* Availability follows discovery.
* Only credible candidates should receive requests.
* One user request may target multiple candidates internally.
* Multiple items from one facility can be requested together.
* Bulk availability is consolidated.
* Availability uncertainty must remain truthful.

### Transaction

* Search does not expose seller contact.
* Search does not expose detailed itinerary.
* `I want to buy` creates Purchase Intent.
* QR and transactional access begin at that gateway.

### Mission

* Omni should progressively increase representation of real-world supply.
* Informal, mobile, temporary, service-area and digital providers remain valid supply.
* Absence from Omni is not proof of absence from the world.

---

# 46. SPECIES GATE

Before moving to database implementation, the following must be answerable:

### Demand

**What exactly can a buyer ask Omni?**

### Constraints

**Which constraints are hard and which are preferences?**

### Geography

**How does each fulfillment model interact with location?**

### Truth

**What may Omni claim immediately and what requires provider confirmation?**

### Load

**When should Omni contact providers and when should it not?**

### Discovery

**How does a buyer move from one matching offer to other supply from the same facility?**

### Transaction

**Exactly when does discovery stop and commercial intent begin?**

If these are stable, the Search Species is ready to become an implementation contract.

---

# 47. NEXT SPECIES

The next gate should **not yet be the SQL schema**.

We now know what demand looks like.

We need to determine:

# SPECIES 09 — AVAILABILITY

This Species must reconcile all the pieces we have already discovered:

```text
ASK PROVIDER
      ↓
manual response

ALLOCATED OMNI STOCK
      ↓
automatic response

FACILITY OPEN/CLOSED
      ↓
eligibility

QUANTITY
      ↓
partial / complete fulfillment

MULTI-PRODUCT REQUEST
      ↓
one availability request

BULK REQUEST
      ↓
many facilities

PROVIDER BURDEN
      ↓
request throttling / targeting

EXTERNAL SALES
      ↓
manual Omni stock decrement

FUTURE AGENT
      ↓
automation
```

And this is where we will finally decide **the exact V1 availability state machine**, including what happens when:

* a seller says yes and then discovers the stock is gone;
* allocated stock says yes but the facility is closed;
* only 3 of 10 requested units are available;
* several products are requested together;
* multiple facilities respond;
* a seller never responds;
* the seller changes the quantity outside Omni;
* the buyer asks again immediately;
* two buyers request the same allocated stock simultaneously.

**That Species 09 is the last major conceptual gate before we should freeze the V1 domain model and begin translating the organism into database entities, server actions, state machines and UI contracts.**
