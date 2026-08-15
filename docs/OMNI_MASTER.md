# OMNI — MASTER

## 0. INSTRUCTION GÉNÉRALE

We are building **Omni**, a global geospatial supply-and-demand search engine.

Omni is not primarily a marketplace, social network, directory, chatbot, or map application.

**Omni is a spatial operating system for discovering, understanding and acting on the world's supply and demand.**

The core relationship is:

```text
WORLD
 ↓
FACILITIES
 ↓
PRODUCTS / SERVICES / CONTENT
 ↓
SEARCH
 ↓
DEMAND
 ↓
AI AGENT
 ↓
AVAILABILITY
 ↓
TRANSACTION
 ↓
FULFILMENT
 ↓
DATA
 ↓
BETTER DISCOVERY
```

The **map is the main interface**.

The **search engine is the main discovery mechanism**.

The **facility is the fundamental supply object**.

The **content layer provides context and discoverability**.

The **AI agent executes work**.

The **transaction layer connects intent to real-world action**.

Build the product so that these are one coherent system, not separate applications.

---

# 1. ABSOLUTE PRODUCT PRINCIPLES

### 1.1 Map first

There is **no traditional marketing landing page**.

When Omni opens, the user enters the product:

```text
WORLD / GLOBE
      ↓
LOCATION
      ↓
SEARCH
      ↓
DISCOVERY
```

The onboarding itself becomes the entry experience when necessary.

---

### 1.2 Search first, account second for first-time users

Unauthenticated users may:

- open Omni
- explore the globe/map
- move around
- enter searches
- formulate intents

But **the backend must not perform the actual search/retrieval for the first search before authentication**.

Flow:

```text
Open Omni
 ↓
Map
 ↓
User searches
 ↓
Omni understands that a search was requested
 ↓
Do NOT execute full backend search
 ↓
Ask user to create account
 ↓
Onboarding
 ↓
Account created
 ↓
Restore original query
 ↓
Execute search
 ↓
Display results
```

Never lose the original query.

Example:

> User enters: "Find black Nike shoes size 42 under 30,000 FCFA near me."

Show:

> **Create your free Omni account to see what's available around you.**

After onboarding:

```text
"Find black Nike shoes size 42 under 30,000 FCFA near me."
```

is automatically restored and processed.

---

# 2. OMNI OBJECT MODEL

The primary data hierarchy is:

```text
Company
   │
   ├── Facility
   │      ├── Products
   │      ├── Services
   │      ├── Inventory
   │      ├── Offers
   │      ├── Coupons
   │      ├── Content
   │      ├── Media
   │      └── Transactions
   │
   └── Facility
```

A company can have multiple facilities.

A facility can be physical, mobile, or digital.

---

# 3. COMPANY

A Company represents the business entity/brand.

Examples:

```text
Company
 ├── Company identity
 ├── Brand
 ├── Company content
 ├── Company catalogue
 ├── AI agent
 └── Facilities
```

A company may operate:

```text
XYZ
 ├── Lomé facility
 ├── Agoè facility
 ├── Kara facility
 └── Accra facility
```

The company and facilities must therefore be separate database entities.

---

# 4. FACILITY

A Facility represents where supply is available or where a business/product/service can be discovered.

Facility types:

```text
PHYSICAL
MOBILE
DIGITAL
HYBRID
```

Examples:

### Physical

Shop, restaurant, pharmacy, salon, workshop.

### Mobile

Street vendor, mobile technician, delivery operator, travelling service provider.

### Digital

SaaS, subscription, online course, API, digital product.

### Hybrid

Physical company + online products/services.

---

# 5. FACILITY STATES

Implement explicit facility lifecycle states.

```text
DISCOVERED
 ↓
UNCLAIMED
 ↓
CLAIM_REQUESTED
 ↓
UNCONFIRMED
 ↓
CERTIFIED
 ↓
CONFIRMED
```

The exact state must be visible internally and represented appropriately in UI.

---

## 5.1 DISCOVERED

Facility discovered from:

- OSM
- public sources
- indexed web content
- user submissions
- other legitimate data sources

Not yet sufficiently resolved.

---

## 5.2 UNCLAIMED

Omni has identified the facility.

It may appear in search.

It may have:

- location
- name
- category
- images
- public content
- indexed articles
- indexed videos
- products/services when reliably associated

But nobody controls the Omni profile yet.

Users **cannot buy from an unclaimed facility through Omni**.

Users may:

- discover it
- view content
- view information
- request/notify the business to join
- share the facility
- claim it if they are the owner

---

## 5.3 CLAIM REQUESTED

Someone has requested ownership.

Verification process begins.

---

## 5.4 UNCONFIRMED

The facility has been claimed/activated but has not yet reached Omni's confidence threshold.

It can begin operating but remains visibly unconfirmed.

---

## 5.5 CERTIFIED

The seller/business has passed the required verification process.

Certification means the identity/facility has been sufficiently verified.

---

## 5.6 CONFIRMED

A certified facility becomes **Confirmed after at least 3 completed/verified sales** through the Omni ecosystem.

The 3-sale requirement remains even if certification has already happened.

This is important.

```text
Certified
   +
3 verified sales
   ↓
Confirmed
```

Do not remove this requirement.

---

# 6. SELLER CHANNELS

After certification, Omni may optionally invite the seller to join an Omni-managed/local business channel.

Purpose:

- seller communication
- marketing
- promotion
- demand distribution
- local business support
- campaign coordination

Joining a channel is **optional**.

It must never be required for the platform to function.

This allows Omni to scale even in markets where there is no dedicated local marketing team.

---

# 7. UNCLAIMED CONTENT

Unclaimed does **not** mean invisible.

An unclaimed facility can still have:

```text
Facility
 +
indexed content
 +
images
 +
videos
 +
articles
 +
public information
```

Search can find it.

However:

```text
DISCOVERY = YES
CONTENT = YES
TRANSACTION THROUGH OMNI = NO
OWNER CONTROL = NO
```

The facility page should clearly indicate:

> **Unclaimed facility**

and provide:

> **Are you the owner? Claim this facility.**

---

# 8. CLAIMED FACILITY CONTENT

Claimed facilities can also publish content.

Content is not exclusive to unclaimed businesses.

A claimed business can publish:

- articles
- product guides
- blogs
- videos
- images
- announcements
- FAQs
- educational content
- offers
- product explanations

---

# 9. CONTENT IS A FIRST-CLASS SEARCH OBJECT

Omni must index commercial content.

Content types:

```text
Article
Blog
Product description
Service description
Image
Video
Caption
Public social content
Website content
FAQ
Announcement
Guide
```

Content must be associated, when possible, with:

```text
Content
 ↓
Product / Service
 ↓
Facility
 ↓
Company
 ↓
Location
```

---

# 10. CONTENT SEARCH

A user does not need to know the exact product name.

Example:

> "How can I make my restaurant kitchen more efficient?"

Results may include:

- articles
- videos
- services
- equipment
- consultants
- facilities

The content provides context and can lead directly to supply.

---

# 11. SEARCH BY IMAGE / VIDEO

Omni must support visual product discovery.

User can submit:

- image
- camera capture
- video frame
- visual reference

The system compares the input against indexed Omni product/media representations.

Example:

User photographs a shoe.

Omni:

```text
Image
 ↓
Visual embedding
 ↓
Product similarity
 ↓
Semantic search
 ↓
Facilities
 ↓
Availability
```

This is a major mechanism for finding products without requiring the user to know the name.

---

# 12. SEARCH MODES

The user can search through:

```text
TEXT
VOICE
IMAGE
VIDEO
MAP
AGENT
```

All modes feed the same search infrastructure.

---

# 13. SEARCH INTENT

Understand:

```text
PRODUCT
SERVICE
BUSINESS
PROBLEM
LOCATION
PRICE
QUANTITY
QUALITY
BRAND
CATEGORY
CONTENT
AVAILABILITY
PURCHASE
DIGITAL PRODUCT
SUBSCRIPTION
```

Example:

> "I need a CRM for 20 employees under $100/month."

Interpret:

```text
category = CRM
quantity = 20 users
price <= $100/month
type = subscription
intent = discovery + comparison
```

---

# 14. SEARCH IS NOT JUST KEYWORD SEARCH

Use:

```text
keyword
semantic
vector
geospatial
structured filters
AI intent extraction
visual similarity
content relevance
```

---

# 15. GEOGRAPHIC HIERARCHY

Omni must support:

```text
WORLD
 ↓
CONTINENT
 ↓
COUNTRY
 ↓
REGION
 ↓
CITY
 ↓
DISTRICT
 ↓
LOCAL AREA
 ↓
FACILITY
```

Search may dynamically change geographic scope.

Examples:

> "Restaurants"

→ current area.

> "Restaurants in Lomé"

→ Lomé.

> "Restaurants in Togo"

→ Togo.

> "Best restaurants worldwide"

→ global.

---

# 16. MAPLIBRE

Use **MapLibre** for the primary map.

Use globe projection when zoomed sufficiently out.

```text
LOCAL MAP
 ↓
CITY
 ↓
REGION
 ↓
COUNTRY
 ↓
WORLD
 ↓
GLOBE
```

The globe is not a game-like 3D Earth.

It is a spatial visualization of Omni's global supply.

---

# 17. MAP 3D DISCOVERY MODE

In addition to the normal 2D map, Omni should support a richer **3D discovery mode**.

This is not merely a decorative 3D map.

The purpose is:

> allow facilities to visually express what they want users to see while navigating the map.

A facility card can contain:

- video
- image
- product preview
- offer
- promotional media

In 3D discovery mode, moving through an area can reveal these facility visual cards spatially.

Example:

```text
User moves through neighborhood
 ↓
Facility enters visible area
 ↓
Facility media becomes visible
 ↓
Video/card preview appears
 ↓
User can inspect facility
```

The experience should remain spatial and useful rather than becoming a social-media feed.

---

# 18. MAP CLUSTERING

Never render millions of individual facility markers simultaneously.

Use spatial clustering.

```text
1000 facilities
 ↓
viewport
 ↓
cluster
 ↓
visible clusters
```

As the user zooms:

```text
cluster
 ↓
sub-cluster
 ↓
facility
```

Clusters must react to:

- viewport
- zoom
- search
- filters
- category
- geography

---

# 19. VIEWPORTING

Only retrieve/render relevant facilities for the current viewport.

Architecture:

```text
Map viewport
 ↓
bounding box
 ↓
spatial query
 ↓
candidate facilities
 ↓
search/ranking filter
 ↓
cluster
 ↓
render
```

Never load the entire world facility dataset into the browser.

---

# 20. OSM POPULATION

Finish the facility population pipeline using OSM.

```text
OSM
 ↓
Extraction
 ↓
Normalization
 ↓
Category mapping
 ↓
Geospatial normalization
 ↓
Deduplication
 ↓
Company/facility resolution
 ↓
Source attribution
 ↓
Database
 ↓
Search index
 ↓
Map
```

OSM facilities become primarily **unclaimed discovered facilities** until claimed/verified.

---

# 21. OSM DEDUPLICATION

Do not create duplicate facilities because of:

- different spelling
- duplicated OSM records
- website variants
- social references
- company branch naming

Use:

```text
location
name similarity
phone
website
category
semantic similarity
company identity
```

---

# 22. SOURCE AUTHORITY

Information should carry source provenance.

Suggested authority:

```text
Confirmed facility data
 >
Certified seller data
 >
Claimed seller data
 >
Official public source
 >
Trusted external source
 >
OSM
 >
AI inference
```

Do not overwrite stronger verified data with weaker external data.

---

# 23. SELLER FREE PLAN

**Free Seller = 1 facility maximum.**

The seller can create/list only:

```text
1 facility
+
5 products for that facility
```

The 5-product limit is enforced.

Free sellers cannot bypass this through bulk import.

If a company has several facilities, Free only permits the first facility.

Additional facility/catalogue capacity belongs to Pro or higher commercial plans.

---

# 24. SELLER PRO

Seller Pro should provide:

```text
Multiple facilities
Expanded/unlimited catalogue capacity
Bulk import
AI catalogue normalization
AI seller agent
AI content generation
AI recommendations
Inventory intelligence
Availability automation
Transaction automation
Offers
Coupons
Analytics
Demand insights
Sponsored promotion capabilities
AI credits
Ad credit
```

Pro includes a **small advertising credit allocation**.

This allows sellers to experience Omni's advertising ecosystem without immediately purchasing additional advertising space.

---

# 25. BULK IMPORT

Bulk import is a **Pro feature**.

Free users cannot bulk-import beyond their Free limits.

Pro sellers can upload:

- CSV
- spreadsheet
- catalogue
- structured files
- supported external sources

Large imports must run asynchronously.

```text
Upload
 ↓
AI reads schema
 ↓
AI maps external schema → Omni schema
 ↓
Validation
 ↓
Duplicate detection
 ↓
Preview
 ↓
Seller approval
 ↓
Import
```

---

# 26. AI SCHEMA MATCHING

The seller does not need to manually understand Omni's database schema.

Example:

```text
Seller:
product_name
unit_price
qty
image_url
type
```

AI maps:

```text
product_name → product.name
unit_price → product.price
qty → inventory.quantity
image_url → media
type → category
```

Show mapping before import.

---

# 27. AI BULK IMPORT

AI should identify:

- product names
- categories
- variants
- attributes
- prices
- inventory
- descriptions
- images
- SKUs
- duplicates

It can suggest corrections.

Seller can:

```text
Approve all
Approve selected
Reject
Edit mapping
```

---

# 28. SELLER AI AGENT

Every seller has an agent.

The agent's purpose is not conversation for its own sake.

It is an **operations agent**.

It can:

```text
SEARCH
MANAGE
RECOMMEND
CREATE
UPDATE
RESPOND
SELL
ANALYZE
```

---

# 29. SELLER AGENT KNOWLEDGE

The agent can access controlled business tools for:

```text
Company
Facilities
Products
Services
Inventory
Prices
Offers
Coupons
Orders
Availability requests
Transactions
Content
Analytics
Demand
Seller preferences
Automation rules
```

Never give the model unrestricted database access.

---

# 30. SELLER AGENT EXAMPLES

User:

> "I sold 8 of the blue shirts."

Agent:

```text
Find product
 ↓
verify seller
 ↓
update Omni inventory
 ↓
record action
```

User:

> "Create a 15% discount for the remaining blue shirts."

Agent:

```text
Check stock
 ↓
create offer
 ↓
show result
```

User:

> "Write an article about our new collection."

Agent:

```text
Inspect catalogue
 ↓
generate article
 ↓
suggest media
 ↓
draft
 ↓
publish or request approval
```

User:

> "What are people around my store searching for?"

Agent:

```text
aggregate demand
 ↓
rank
 ↓
recommend opportunities
```

---

# 31. BUYER AGENT

Buyer Agent is an execution interface.

Example:

> "I need a laptop under $800."

Agent searches.

> "Only Lenovo."

Agent modifies search.

> "Find the three best ones."

Agent compares.

> "Ask them if they have it."

Agent initiates availability.

> "Buy the cheapest."

Agent prepares the transaction.

---

# 32. BUYER AGENT TASKS

```text
Search
Research
Compare
Recommend
Check availability
Contact sellers
Monitor demand
Save searches
Create order
Apply coupon
Prepare payment
Track transaction
```

---

# 33. SELLER AGENT TASKS

```text
Manage inventory
Manage products
Manage facilities
Respond to requests
Create offers
Create coupons
Create content
Recommend content
Analyze demand
Manage orders
Recommend actions
Automate operations
```

---

# 34. AGENT MODES

Both buyer and seller agents must support three levels:

### MANUAL

Agent recommends/prepares.

Human executes.

### SEMI-AUTOMATIC

Agent executes low-risk steps.

Human confirms important actions.

### AUTOMATIC

Agent executes according to explicit user-defined rules.

---

# 35. BUYER AUTOMATION RULES

Buyer can configure:

```text
Always ask before purchase
Ask above X amount
Auto-buy below X amount
Always check availability
Preferred sellers
Preferred distance
Maximum price
Preferred brands
```

Default:

**high-value purchases require explicit confirmation.**

---

# 36. SELLER AUTOMATION RULES

Seller can configure separately:

```text
Availability:
Manual
Semi-auto
Auto

Orders:
Manual
Semi-auto
Auto

Inventory:
Manual
AI-assisted
Integrated

Content:
Draft only
Approval required
Auto-publish
```

---

# 37. AVAILABILITY

Availability is the bridge between search and transaction.

Example:

> "Find me 100 chairs."

Omni:

```text
Search
 ↓
candidate facilities
 ↓
availability requests
 ↓
seller responses
 ↓
normalize
 ↓
rank
 ↓
recommend
```

---

# 38. AVAILABILITY MANUAL MODE

Seller receives:

> New availability request.

Seller responds:

```text
Available
Partially available
Unavailable
Alternative available
```

---

# 39. AVAILABILITY SEMI-AUTO

Agent checks:

```text
inventory
price
facility
rules
```

and prepares the answer.

Seller approves.

---

# 40. AVAILABILITY AUTO

Agent checks business rules and inventory.

If conditions are satisfied:

```text
request
 ↓
agent
 ↓
availability confirmed
 ↓
buyer notified
```

---

# 41. BULK AVAILABILITY

Bulk requests must be able to query many relevant sellers.

Example:

> "I need 500 chairs."

Agent can contact a large candidate set without forcing the buyer to manually repeat requests.

Free/Pro availability quotas apply according to plan.

---

# 42. BUYER FREE

Free Buyer should allow normal discovery/search.

The limitation should apply to expensive operational capabilities rather than basic discovery.

Free users get a limited number of availability operations.

Recommended initial structure:

```text
Search: unlimited
Basic AI: limited
Availability: 3/month
Advanced agent execution: limited
```

---

# 43. BUYER PRO

Buyer Pro provides:

```text
Expanded availability
Advanced agent usage
Advanced research
Recommendations
Comparison
Large/bulk requests
Higher AI credit allocation
Priority execution
Saved monitoring
```

The exact monthly credit allowance should be configuration-driven, not hardcoded throughout the application.

---

# 44. CREDITS

Credits power expensive Omni operations.

Examples:

```text
AI research
Bulk availability
Large catalogue processing
Content generation
Agent-heavy workflows
Advanced recommendations
```

Subscription credits are:

```text
monthly
renewed each billing cycle
expirable
```

Purchased top-up credits follow separate wallet/accounting rules.

---

# 45. AD CREDIT

Seller Pro includes a small advertising credit.

This credit can be used for:

```text
Sponsored facility
Sponsored product
Sponsored offer
Sponsored content
```

The seller can consume it without separately purchasing advertising initially.

---

# 46. AGENT AS ADVERTISING SURFACE

The agent can eventually monetize recommendations.

Example:

> "Find affordable running shoes."

Agent returns relevant options.

Sponsored options can appear **only if they satisfy the user's relevance criteria**.

Sponsored results must be clearly labelled.

Never allow money to override basic relevance.

---

# 47. NOTIFICATIONS AS AD INVENTORY

Notifications are not only operational.

They can eventually become an advertising channel.

Examples:

```text
Relevant coupon
Nearby promotion
Seller offer
Demand match
Sponsored recommendation
```

Commercial notifications must be distinguishable from essential transactional notifications.

Users must have controls over promotional notifications.

---

# 48. BUY / SELL NOTIFICATION CONTROLS

Users can independently mute:

```text
BUY-side notifications
SELL-side notifications
MARKETING notifications
TRANSACTION notifications
```

For example:

```text
Mute seller notifications
while keeping buyer notifications enabled.
```

---

# 49. VOCAL COMMANDS

Mobile seller users should eventually be able to issue commands by voice.

Examples:

> "I sold ten red shirts."

> "Create an offer for the remaining stock."

> "Tell customers we are closing early."

> "How many availability requests do I have?"

The command can work:

- inside app
- from mobile notification interactions
- through supported device voice mechanisms where technically available

---

# 50. MOBILE IS NOT JUST RESPONSIVE WEB

Mobile must exploit native capabilities.

Mobile advantages:

```text
GPS
Camera
QR scanner
Push notifications
Offline storage
Background sync
Native location
Voice
Local device capabilities
```

---

# 51. MOBILE FACILITY DISCOVERY

Mobile should support a dedicated real-world discovery mode.

When a user is physically moving:

```text
GPS
 ↓
current location
 ↓
nearby facilities
 ↓
viewport update
 ↓
facility cards
```

The experience should allow users to discover what exists around them without manually searching every location.

---

# 52. MOBILE LIVE LOCALIZATION

Use native location capabilities to improve:

- nearby discovery
- facility proximity
- local availability
- map centering
- route/context awareness
- local notifications

Background location must be permission-based.

---

# 53. OFFLINE MODE

Both buyers and sellers can operate critical workflows offline.

### Buyer offline

- saved facilities
- cached map
- saved searches
- pending actions

### Seller offline

- catalogue
- allocated inventory
- transaction recording
- QR operations where possible
- queued inventory changes
- queued sales

---

# 54. OFFLINE SELLER SALE

Seller can sell offline.

Example:

```text
Customer purchases
 ↓
seller records transaction
 ↓
Omni stores locally
 ↓
connection unavailable
 ↓
transaction queued
 ↓
connection returns
 ↓
sync
 ↓
server confirmation
```

Conflict resolution must be deterministic.

---

# 55. OFFLINE BUYER

Buyer can also create certain pending actions offline.

Example:

```text
saved transaction context
 ↓
offline
 ↓
action queued
 ↓
network restored
 ↓
server validation
```

Anything requiring real-time payment/availability must not falsely appear confirmed while offline.

---

# 56. QR IS NOT ONLY A PAYMENT QR

This is critical.

The Omni QR system is a **transaction traceability mechanism**, not merely a payment mechanism.

Omni should track transactions whether:

```text
paid through Omni
OR
paid outside Omni
```

Example:

Buyer buys in physical shop and pays cash.

Seller records the sale through Omni.

Omni generates/associates a transaction QR.

The system records:

```text
WHO
BOUGHT WHAT
FROM WHOM
WHERE
WHEN
QUANTITY
PRICE
PAYMENT METHOD
TRANSACTION STATUS
```

Payment method may be:

```text
Omni
Cash
Mobile money
Card
Bank transfer
External
Other
```

---

# 57. OFF-OMNI PAYMENT TRANSACTION

Example:

```text
Buyer
 ↓
Seller
 ↓
Sale
 ↓
Seller records Omni transaction
 ↓
Payment = Cash
 ↓
QR / transaction reference
 ↓
Fulfilment
 ↓
Transaction completed
```

Omni tracks the commercial event even though Omni did not process the payment.

This creates the future transaction graph.

---

# 58. QR FLOW

Buyer:

```text
Order
 ↓
QR generated
 ↓
show QR
```

Seller:

```text
Scan QR
 ↓
Omni validates
 ↓
display transaction
 ↓
verify
 ↓
fulfil
```

QR must contain only a secure reference/token.

Sensitive information must remain server-side.

---

# 59. QR STATES

```text
CREATED
PENDING
PAID
READY
VERIFIED
FULFILLED
COMPLETED
CANCELLED
EXPIRED
REFUNDED
```

---

# 60. TRANSACTION DATA

Store:

```text
buyer
seller
company
facility
product
variant
quantity
price
discount
coupon
payment method
payment provider
transaction ID
QR token
timestamps
fulfilment state
```

---

# 61. COUPONS

Seller can create:

```text
percentage discount
fixed discount
buy X get Y
first purchase
minimum order
product-specific
facility-specific
date-bound
quantity-bound
```

Coupons must have explicit rules.

---

# 62. COUPON FLOW

```text
Seller creates coupon
 ↓
Omni validates rules
 ↓
Coupon indexed
 ↓
Buyer discovers
 ↓
Coupon applied
 ↓
Price calculated
 ↓
Order
 ↓
Payment / external payment
 ↓
QR
 ↓
Fulfilment
 ↓
Coupon consumed
```

Coupon consumption must be atomic.

---

# 63. DIGITAL PRODUCTS

A facility can sell:

```text
software
SaaS
courses
subscriptions
downloads
APIs
hosting
memberships
online services
```

No physical location is required.

---

# 64. DIGITAL SUBSCRIPTION FLOW

```text
Search
 ↓
Digital product
 ↓
Plan
 ↓
Price
 ↓
Offer
 ↓
Purchase
 ↓
Payment
 ↓
Provisioning
 ↓
Entitlement
 ↓
Subscription active
```

If the seller has an API integration:

```text
Omni
 ↓
Seller API
 ↓
account/entitlement
```

Otherwise:

```text
Omni transaction
 ↓
seller notification
 ↓
manual fulfilment
```

---

# 65. COMPANY CATALOGUE

Company-level catalogue can be shared across facilities.

Facility-specific overrides:

```text
price
inventory
availability
offers
```

Example:

```text
Company Product
 ↓
Facility A: 10,000 FCFA / stock 20
Facility B: 9,500 FCFA / stock 5
```

---

# 66. FACILITY DISCOVERY CARD

Facility card must communicate quickly:

```text
Media
Name
Verification state
Category
Distance
Open/closed
Availability
Products
Offer
CTA
```

Possible CTA:

```text
View
Ask
Check availability
Buy
Navigate
```

---

# 67. FACILITY PAGE

Structure:

```text
Hero media
 ↓
Identity
 ↓
Status
 ↓
Location
 ↓
Actions
 ↓
Products
 ↓
Services
 ↓
Offers
 ↓
Content
 ↓
Videos
 ↓
About
 ↓
Reviews/signals
```

Unclaimed facilities show:

> **Unclaimed**

with:

> Claim this facility

instead of seller management controls.

---

# 68. 3D FACILITY MEDIA

If seller adds a video to a facility card, the video can become part of the spatial discovery experience.

Example:

```text
Facility pin
 ↓
card
 ↓
video preview
 ↓
3D discovery
```

The user can visually explore businesses around them.

---

# 69. SEARCH RESULT CONTENT

A result may be:

```text
Facility
Product
Service
Article
Video
Image
Offer
Company
Digital product
Subscription
```

But wherever possible, content should resolve back to a commercial/geospatial entity.

---

# 70. CONTENT → COMMERCE

Example:

```text
Article:
"How to choose a solar system for a small shop"

 ↓

Facility:
Solar Provider X

 ↓

Products:
Solar kits

 ↓

Availability

 ↓

Purchase
```

This is a central Omni loop.

---

# 71. AI CONTENT CREATION

Seller agent can generate:

```text
Articles
Blogs
FAQs
Product descriptions
Product guides
Comparison pages
Announcements
Educational posts
Offer explanations
```

AI must use actual seller data.

No fabricated stock/pricing/claims.

---

# 72. AI CONTENT RECOMMENDATION

The seller agent analyzes search/demand patterns.

Example:

> "People in your area searched for solar panels 126 times this week."

Agent:

> "Your facility has solar products but no content answering this intent. I recommend publishing a buyer's guide."

---

# 73. SEARCH CONTENT RECOMMENDATION

Buyer agent can also use content.

Example:

> "I'm looking for a good laptop for programming."

Agent:

```text
Articles
 ↓
Videos
 ↓
Products
 ↓
Facilities
 ↓
Prices
 ↓
Recommendations
```

---

# 74. AGENT SEARCH + MAP VISUALIZATION

The AI agent must not hide the work.

When searching:

```text
Map
 ↓
candidate facilities appear
 ↓
clusters expand
 ↓
availability requests animate subtly
 ↓
responses update pins
 ↓
best matches highlighted
```

The user sees the agent's work spatially.

---

# 75. BUYER AGENT UI

Main screen:

```text
MAP
 ├── search
 ├── facility pins
 ├── clusters
 └── highlighted results

Floating Agent Panel
 ├── intent
 ├── progress
 ├── results
 ├── recommendation
 └── action
```

The agent should never become an isolated full-screen chatbot by default.

---

# 76. SELLER AGENT UI

Same principle.

Main view:

```text
FACILITY MAP
 ↓
business activity
 ↓
AI operations panel
```

Agent displays:

```text
4 new requests
2 low-stock products
1 demand opportunity
3 content recommendations
```

---

# 77. AGENT ACTION CARDS

Actions must be structured.

Example:

```text
AI Recommendation

School uniforms are being searched
83 times this week nearby.

You currently sell related clothing.

[Create offer]
[Write article]
[Ignore]
```

---

# 78. AGENT CONFIRMATION

High-risk actions require explicit confirmation unless Auto Mode is enabled.

Examples:

### No confirmation

Generate draft.

### Confirmation

Publish content.

### Confirmation

Change price.

### Confirmation

Purchase product.

### Auto allowed

Respond to availability if seller enabled Auto.

---

# 79. SEARCH → AVAILABILITY → BUY

Complete buyer flow:

```text
Search
 ↓
Results
 ↓
Product
 ↓
Facility
 ↓
Availability
 ↓
Seller responses
 ↓
Agent comparison
 ↓
Recommendation
 ↓
Buy
 ↓
Order
 ↓
Coupon
 ↓
Payment or external payment
 ↓
QR
 ↓
Fulfilment
 ↓
Transaction recorded
```

---

# 80. FIRST-TIME BUYER ONBOARDING

After initial search intent:

```text
Create account
 ↓
Name
 ↓
Phone/email
 ↓
Country
 ↓
Location permission
 ↓
Language
 ↓
Currency
 ↓
Optional preferences
```

Do not make onboarding unnecessarily long.

Then:

```text
Restore query
 ↓
Search
 ↓
Map results
```

---

# 81. SELLER ONBOARDING

Seller onboarding:

```text
Create account
 ↓
Choose Buyer/Seller role
 ↓
Business identity
 ↓
Facility type
 ↓
Facility location
 ↓
Category
 ↓
Catalogue
 ↓
Inventory
 ↓
Contact
 ↓
Verification
 ↓
Plan
 ↓
Automation preferences
```

AI should assist throughout.

---

# 82. SELLER ONBOARDING AGENT

Seller can say:

> "I sell phones and accessories."

Agent proposes:

```text
category
catalogue structure
products
variants
facility type
```

Seller confirms.

---

# 83. WEB APP

Web should contain:

```text
Map
Globe
Search
Agent
Facility
Company
Product
Content
Availability
Orders
Transactions
QR
Wallet
Subscriptions
Seller dashboard
Admin
```

---

# 84. MOBILE APP

Mobile adds:

```text
Native GPS
Camera
QR scanning
Offline mode
Push
Voice
Background sync
Live discovery
Location-aware discovery
Native share
```

---

# 85. MOBILE SELLER MODE

Seller mobile home:

```text
Facility
 ↓
Today
 ↓
Requests
 ↓
Orders
 ↓
Inventory
 ↓
Agent
 ↓
Scan QR
```

A seller should be able to run basic daily operations without a desktop.

---

# 86. MOBILE BUYER MODE

Buyer mobile home:

```text
Map
 ↓
Search
 ↓
Nearby
 ↓
Agent
 ↓
Saved
 ↓
Orders
```

---

# 87. MAP LANDING

No traditional hero landing page.

The opening visual should be:

```text
Globe / Map
+
Omni logo
+
Search
+
location
```

The product immediately communicates:

> **The world is searchable.**

---

# 88. DESIGN SYSTEM

Everything must follow the **Omni creamy glass visual language**.

Characteristics:

```text
Cream
Glass
Soft depth
Rounded geometry
Premium typography
Subtle shadows
Subtle gradients
Soft borders
Minimal visual noise
```

Avoid:

```text
Cyberpunk
Neon
Excessive dark UI
Heavy 3D
Generic SaaS dashboard appearance
```

---

# 89. MAP VISUAL STYLE

The map should be quieter than the interface.

Prioritize:

```text
Facilities
Search results
Clusters
Geography
User position
```

Do not make the map visually compete with cards.

---

# 90. FACILITY PIN STATES

Support:

```text
Normal
Unclaimed
Unconfirmed
Certified
Confirmed
Sponsored
Selected
Available
Low stock
Company
Mobile
Digital
```

Each state should have subtle visual differentiation.

---

# 91. GLASS COMPONENTS

Create reusable components:

```text
GlassCard
GlassButton
GlassInput
GlassSearchBar
GlassSheet
GlassModal
GlassBadge
GlassTab
GlassNavigation
```

---

# 92. OMNI MAP COMPONENTS

```text
FacilityPin
ClusterPin
SponsoredPin
UserLocation
SearchRadius
AvailabilityPulse
AgentHighlight
FacilityPreview
MapBottomSheet
GlobeControls
```

---

# 93. PRODUCT COMPONENTS

```text
ProductCard
ProductGrid
ProductVariant
Price
InventoryBadge
AvailabilityBadge
CouponBadge
OfferCard
SubscriptionCard
DigitalProductCard
```

---

# 94. TRANSACTION COMPONENTS

```text
OrderCard
TransactionCard
QRCodeCard
PaymentStatus
FulfilmentStatus
CouponCard
Receipt
WalletTransaction
```

---

# 95. AGENT COMPONENTS

```text
AgentPanel
AgentMessage
AgentProgress
AgentAction
AgentRecommendation
AgentConfirmation
AgentToolResult
AgentMapHighlight
```

---

# 96. SELLER DASHBOARD

```text
Overview
Facilities
Catalogue
Inventory
Requests
Orders
Transactions
Content
AI Agent
Offers
Coupons
Analytics
Advertising
Wallet
Subscription
Settings
```

---

# 97. SELLER OVERVIEW

Show:

```text
Sales
Requests
Revenue
Inventory alerts
Demand
Content performance
AI actions
Facility performance
```

---

# 98. BUYER ACCOUNT

Show:

```text
Orders
Transactions
Saved
Search history
Availability requests
Agent history
Credits
Subscription
Notifications
Settings
```

---

# 99. NOTIFICATIONS

Notification architecture:

```text
Event
 ↓
Notification service
 ↓
Push
 ↓
In-app
 ↓
Deep link
```

Events:

```text
Availability response
Order
Payment
QR
Fulfilment
Coupon
Demand match
Low stock
AI recommendation
Sponsored offer
```

---

# 100. DATABASE

Use the existing **Neon PostgreSQL database**.

Use the existing **Neon Auth**.

Do not introduce another authentication/database system unless explicitly required.

Core entities:

```text
users
profiles
companies
company_members
facilities
facility_states
facility_claims
facility_sources
facility_channels
categories
products
product_variants
services
inventory
offers
coupons
content
content_sources
media
searches
search_results
availability_requests
availability_responses
orders
order_items
transactions
transaction_events
qr_tokens
payments
wallets
wallet_transactions
credits
credit_transactions
subscriptions
ai_agents
ai_actions
ai_usage
notifications
saved_searches
demand_requests
sponsored_campaigns
ad_credits
reviews
audit_logs
osm_import_jobs
```

---

# 101. FACILITY SPATIAL DATA

Each facility needs:

```text
latitude
longitude
geometry
country
region
city
district
locality
```

Use spatial indexing.

---

# 102. SEARCH INDEX

Search index should support:

```text
Facility
Company
Product
Service
Content
Offer
Media
```

Use:

```text
keyword
semantic embeddings
geospatial filters
structured filters
visual embeddings
```

---

# 103. API

Expose modular APIs:

```text
/auth
/users
/companies
/facilities
/products
/services
/inventory
/content
/search
/availability
/orders
/transactions
/payments
/qr
/coupons
/offers
/wallet
/credits
/subscriptions
/ai
/notifications
/advertising
/admin
```

---

# 104. AGENT API

Agent architecture:

```text
User
 ↓
Agent Orchestrator
 ↓
Intent
 ↓
Tool selection
 ↓
Permission
 ↓
Business logic
 ↓
Database/API
 ↓
Result
 ↓
Agent
 ↓
UI + Map
```

The LLM must never directly mutate production database state.

---

# 105. BUYER AGENT TOOLS

```text
search
search_content
visual_search
search_facilities
compare
check_availability
request_availability
save
create_demand_request
create_order
apply_coupon
prepare_payment
pay
track_order
```

---

# 106. SELLER AGENT TOOLS

```text
get_facilities
get_products
get_inventory
update_inventory
create_product
update_product
bulk_import
create_offer
create_coupon
answer_request
create_order
update_order
generate_content
publish_content
analyze_demand
analyze_sales
manage_campaign
```

---

# 107. AI AUDIT

Every important AI action must be recorded:

```text
user
agent
action
tool
parameters
result
timestamp
authorization
```

Especially:

```text
inventory
price
orders
transactions
payments
refunds
content publication
```

Seller must be able to see:

> **What did my agent do?**

---

# 108. OFFLINE SYNC

Use a local queue:

```text
Action
 ↓
Local storage
 ↓
Pending
 ↓
Network returns
 ↓
Sync
 ↓
Server validation
 ↓
Conflict resolution
 ↓
Completed
```

Never mark a server-dependent transaction as confirmed while offline.

---

# 109. TRANSACTION LEDGER

Every commercial event must be traceable.

Even if:

```text
Omni did not process payment
```

Omni can still record:

```text
Transaction happened
```

This is fundamental to the long-term Omni data model.

---

# 110. FUTURE DATA MOAT

The long-term vision is:

```text
Today:
Omni indexes the world's content.

Tomorrow:
Omni becomes a source of truth for the world's commercial supply.
```

As transaction, inventory, demand, facility and product data accumulate, Omni increasingly becomes the authoritative commercial graph.

This future capability should influence the architecture now.

Do not hardcode the product as merely an external-content indexer.

---

# 111. FUTURE SPACE MONETIZATION

As Omni accumulates first-party:

```text
facility data
product data
inventory
demand
transactions
content
```

Omni may eventually sell access to:

```text
premium data
commercial intelligence
API access
high-value discovery
market intelligence
additional spatial visibility
```

This can be:

```text
subscription
credits
usage-based
API pricing
```

Do not implement speculative monetization before core supply/demand workflows work.

Architect for it.

---

# 112. ADVERTISING SYSTEM

Advertising inventory:

```text
Map
Search
Facility
Product
Content
Agent
Notifications
```

Campaign targets:

```text
location
category
query
product
facility
audience
time
```

---

# 113. SPONSORED RESULT RULE

Sponsored content must be:

```text
Relevant
Clearly labelled
Non-deceptive
```

Ranking:

```text
relevance threshold
 ↓
eligible sponsored inventory
 ↓
commercial ranking
```

---

# 114. PERFORMANCE

Prioritize:

```text
Map responsiveness
Search input
Viewport updates
Facility rendering
Agent responsiveness
```

Heavy jobs are asynchronous:

```text
OSM imports
Bulk imports
Content indexing
Embeddings
Video processing
AI generation
Large availability operations
Notifications
Payment reconciliation
```

---

# 115. ASYNC JOBS

Implement background job infrastructure for:

```text
OSM ingestion
OSM refresh
bulk catalogue
AI schema mapping
content extraction
embedding generation
visual indexing
article generation
large availability
agent jobs
notification dispatch
payment reconciliation
analytics aggregation
```

---

# 116. SEARCH CACHING

Cache:

```text
popular search results
geographic results
facility metadata
category data
content embeddings
```

Never treat cached availability as guaranteed live availability.

---

# 117. AVAILABILITY FRESHNESS

Availability responses must include:

```text
timestamp
source
confidence
```

For purchase-critical availability:

```text
fresh availability verification
 ↓
reservation
 ↓
transaction
```

---

# 118. STOCK RESERVATION

When buying:

```text
availability
 ↓
temporary reservation
 ↓
payment/transaction
 ↓
confirmed deduction
```

If transaction fails:

```text
reservation released
```

---

# 119. ORDER STATES

```text
DRAFT
PENDING
CONFIRMED
PAID
PREPARING
READY
FULFILLED
COMPLETED
CANCELLED
REFUNDED
```

QR verification should be represented separately from payment state.

---

# 120. DIGITAL ORDER STATES

```text
CREATED
PAID
PROVISIONING
ACTIVE
DELIVERED
COMPLETED
CANCELLED
REFUNDED
```

---

# 121. REVIEW SYSTEM

Prefer transaction-backed reviews.

```text
Completed transaction
 ↓
review eligibility
```

Unverified reviews must be distinguished.

---

# 122. ADMIN

Admin must control:

```text
Users
Companies
Facilities
Claims
Facility states
Products
Content
OSM
Search
Availability
Orders
Transactions
Payments
Coupons
Credits
Subscriptions
AI
Advertising
Channels
Reports
```

---

# 123. ADMIN OSM

Show:

```text
Import
Records discovered
Imported
Duplicates
Rejected
Updated
Errors
```

---

# 124. ADMIN SEARCH QUALITY

Admin should be able to inspect:

```text
query
intent
results
ranking
facility associations
content associations
availability
conversion
```

This is necessary to improve search quality.

---

# 125. SECURITY

Use:

```text
Neon Auth
Role-based authorization
Server-side validation
Audit logs
Secure QR tokens
Payment provider verification
Rate limiting
AI tool permissions
```

Roles:

```text
Buyer
Seller
Company Admin
Facility Manager
Content Manager
Inventory Manager
Admin
```

---

# 126. FACILITY PERMISSIONS

Company owners can assign facility roles:

```text
Facility Manager
Inventory Manager
Order Manager
Content Manager
```

---

# 127. PLAN ENFORCEMENT

Plan limits must be enforced server-side.

Do not rely only on UI.

Example:

```text
Free Seller
facility_count <= 1
product_count_per_facility <= 5
bulk_import = false
```

Pro:

```text
multiple facilities
expanded catalogue
bulk import
AI automation
etc.
```

---

# 128. PLAN UI

Never hide limits.

When Free seller reaches 5 products:

> **You've reached the 5-product Free limit.**

Show:

```text
Upgrade to Pro
```

with the exact additional capabilities.

---

# 129. AGENT UPGRADE UI

When an action requires Pro:

> **This task requires Omni Pro because it processes your catalogue automatically.**

Not:

> "Error."

The user should understand why.

---

# 130. MAP RESULT UX

Desktop:

```text
┌─────────────────────────────────────────────┐
│ Search                                      │
├────────────────┬────────────────────────────┤
│ Results        │                            │
│                │            MAP             │
│ Facility       │       ●   ●                │
│ Product        │          ●                 │
│ Content        │                            │
└────────────────┴────────────────────────────┘
```

Mobile:

```text
MAP
 ↓
floating search
 ↓
pins
 ↓
bottom sheet
```

---

# 131. AGENT MAP UX

Agent operation:

```text
"I need 100 chairs under X."

MAP
 ↓
candidate area
 ↓
candidate facilities
 ↓
availability animation
 ↓
responses
 ↓
best matches
```

Agent panel explains the result.

---

# 132. SELLER MAP UX

Seller's facility becomes the anchor.

Show:

```text
Facility
 ↓
Nearby demand
 ↓
Customers
 ↓
Requests
 ↓
Orders
 ↓
Inventory
```

The seller map is an operational surface.

---

# 133. MOBILE QR

Mobile seller:

```text
Scan QR
 ↓
camera
 ↓
transaction lookup
 ↓
validity
 ↓
buyer/order
 ↓
verify
```

---

# 134. MOBILE VOICE

Seller:

> "I sold five black shirts."

Agent executes.

Buyer:

> "Find me the cheapest laptop near me."

Agent executes.

Voice should use the same agent tools as typed commands.

---

# 135. NOTIFICATION DEEP LINKS

Every operational notification should open directly into context.

Example:

> "Seller X confirmed 100 chairs."

Tap:

```text
Availability result
 ↓
facility
 ↓
order
```

---

# 136. SEARCH HISTORY → AGENT

A previous search can be reopened.

Example:

```text
"Black shoes size 42"
```

User:

> "Search again and only show available ones."

Agent modifies it.

---

# 137. SAVED DEMAND

User can save an unmet need.

```text
Need:
100 black chairs
Location:
Lomé
Budget:
2,000,000 FCFA
```

When matching supply appears:

```text
notify user
```

---

# 138. SELLER DEMAND MATCHING

Seller agent sees:

> **New opportunity**

```text
Demand:
100 black chairs

Distance:
3.2 km

Your stock:
120

Potential value:
X
```

Actions:

```text
Respond
Create offer
Ignore
```

---

# 139. CONTENT INDEXING PIPELINE

```text
External/public source
 ↓
Fetch legally accessible content
 ↓
Parse
 ↓
Extract entities
 ↓
Generate embeddings
 ↓
Resolve facility/product
 ↓
Confidence score
 ↓
Index
```

Do not bypass access restrictions.

---

# 140. CONTENT PROVENANCE

Every external content object stores:

```text
source
source reference
retrieved_at
content type
association confidence
```

Omni must distinguish:

```text
Omni-created
Seller-created
Externally indexed
```

---

# 141. FACILITY CONTENT PRESENTATION

On an unclaimed facility:

```text
About
Products/content found
Videos
Articles
Images
```

Clearly label externally sourced content.

On claimed facility:

```text
Official Omni content
+
seller content
+
external indexed content
```

---

# 142. CONTENT DISCOVERY WITHOUT SOCIAL MEDIA

The objective is not necessarily to replace social networks.

It is to remove the need for the user to **go to social media just to discover a product/business**.

Omni should turn:

```text
search
 ↓
content
 ↓
product
 ↓
facility
 ↓
availability
```

into one continuous journey.

---

# 143. NO SOCIAL FEED

Do not build Omni as an endless social feed.

Content exists because it helps:

```text
discover
understand
compare
decide
buy
```

---

# 144. VISUAL DESIGN PROMPT — GLOBAL OMNI

> Design Omni as a premium spatial operating system for the real-world economy. The entire application opens directly into a MapLibre-based world map/globe rather than a traditional marketing landing page. Use an elegant creamy glass design system: warm cream surfaces, translucent frosted glass, soft shadows, subtle borders, premium typography, restrained gradients and sophisticated micro-interactions. The map is calm and visually secondary to the floating interface. Show elegant facility pins, clusters, unclaimed facilities, verified facilities, sponsored offers, product cards and subtle spatial animations. The interface must feel alive, premium, minimal and highly functional. Avoid neon, cyberpunk, generic SaaS dashboards and excessive 3D.

---

# 145. VISUAL DESIGN PROMPT — BUYER AGENT

> Design Omni's buyer agent as a spatial AI interface rather than a chatbot. Keep the live map as the primary visual surface. A floating creamy-glass agent panel accepts natural-language intent such as "Find me 20 office chairs under $500." As the agent searches, facilities appear and highlight on the map. Availability checks are represented through subtle spatial animations. The agent summarizes results, compares options and recommends the best match. Include structured action cards for Check Availability, Compare, Buy and Save. Premium cream glass, soft shadows, elegant typography, restrained motion.

---

# 146. VISUAL DESIGN PROMPT — SELLER AGENT

> Design Omni's seller operations interface around a facility-centered map. The facility is the visual anchor. A floating AI operations panel displays requests, inventory alerts, demand opportunities, content recommendations and orders. Include Manual, Semi-Automatic and Automatic automation controls. Show AI actions as structured cards rather than generic chat messages. Use Omni's creamy glass visual language, warm cream surfaces, subtle shadows and premium typography.

---

# 147. VISUAL DESIGN PROMPT — FACILITY

> Design an Omni facility profile using premium creamy glass UI. Show hero media, facility logo, business name, facility state, certification indicator, open status, distance, location and primary actions. Below show Products, Services, Offers, Articles, Videos and Media. Unclaimed facilities must visibly indicate that they are unclaimed and provide a Claim Facility action. Claimed facilities expose Ask AI, Check Availability and Buy. Keep geographic context visible through a subtle map layer.

---

# 148. VISUAL DESIGN PROMPT — TRANSACTION

> Design an Omni transaction screen using a warm cream glass interface. Show product, facility, seller, quantity, price, discount, coupon, payment method, order status and a large secure QR representation. The QR is presented as a transaction verification mechanism, not merely a payment QR. The screen should feel extremely trustworthy, simple and premium.

---

# 149. VISUAL DESIGN PROMPT — MOBILE DISCOVERY

> Design Omni's mobile discovery mode as a real-world spatial exploration interface. Use live device location to reveal facilities around the user as they move. Show elegant facility pins, subtle proximity animations, facility cards with images or short videos, availability indicators and offers. Keep the map dominant and allow users to switch between standard 2D map and immersive 3D discovery. Use premium creamy glass UI and restrained motion.

---

# 150. VISUAL DESIGN PROMPT — SELLER ONBOARDING

> Design a simple AI-assisted seller onboarding flow for Omni. The map should appear whenever location matters. Steps include business identity, facility creation, location, catalogue, inventory, verification, plan and AI automation. Use progressive disclosure and natural-language assistance so an informal seller can onboard without understanding technical concepts. Cream glass cards, warm cream background, soft depth, minimal forms.

---

# 151. VISUAL DESIGN PROMPT — FIRST SEARCH

> Design Omni's first-time user experience. The user enters directly into the global map/globe and sees a prominent creamy glass search bar. After entering a search while unauthenticated, do not show search results. Instead show a concise glass authentication/onboarding prompt explaining that an account is required to see available results. Preserve the exact original search. After onboarding, automatically resume the query and animate the map into the resulting facilities and content.

---

# 152. VISUAL DESIGN PROMPT — 3D FACILITY DISCOVERY

> Design Omni's immersive 3D map discovery mode where facilities can expose promotional videos or rich media directly through their spatial cards. As the user navigates through an area, nearby facilities subtly reveal visual cards representing what those facilities want to show. The experience should feel like discovering the real economy spatially, not browsing a social-media feed. Maintain Omni's warm cream glass aesthetic and restrained premium animation.

---

# 153. CORE ACCEPTANCE TEST — FIRST USER

Given:

```text
new unauthenticated user
```

When:

```text
user searches "shoes"
```

Then:

```text
NO full backend search
NO result retrieval
NO result list
```

Show account creation.

After account creation:

```text
restore "shoes"
execute search
render results
render map
```

---

# 154. CORE ACCEPTANCE TEST — FREE SELLER

Given:

```text
Free seller
```

Then:

```text
facility limit = 1
product limit = 5 for that facility
bulk import unavailable
```

Attempts beyond limits must fail server-side with upgrade guidance.

---

# 155. CORE ACCEPTANCE TEST — UNCLAIMED FACILITY

Given:

```text
OSM facility
not claimed
```

Then:

```text
searchable = true
map visible = true
content visible = true
transaction through Omni = false
claim CTA = true
```

---

# 156. CORE ACCEPTANCE TEST — CERTIFICATION

Given:

```text
facility certified
```

Then:

```text
state = CERTIFIED
```

After 3 valid completed sales:

```text
state = CONFIRMED
```

---

# 157. CORE ACCEPTANCE TEST — AVAILABILITY

Buyer:

> "Find 100 chairs."

System:

```text
search
 ↓
candidate facilities
 ↓
availability requests
 ↓
responses
 ↓
ranking
```

The user should receive a consolidated answer rather than manually messaging each seller.

---

# 158. CORE ACCEPTANCE TEST — AGENT AUTO

Seller enables:

```text
Availability = Auto
```

Agent receives availability request.

If inventory and business rules satisfy the request:

```text
agent responds
```

No manual seller intervention.

---

# 159. CORE ACCEPTANCE TEST — OFFLINE SALE

Seller loses connection.

Records:

```text
sale
quantity
price
payment method
```

The application queues the transaction.

When connectivity returns:

```text
sync
 ↓
server validation
 ↓
transaction persisted
```

---

# 160. CORE ACCEPTANCE TEST — QR

Transaction can be:

```text
Omni-paid
```

or:

```text
Cash-paid
```

Both must produce traceable transaction records.

QR is for transaction identification/verification, not only payment.

---

# 161. CORE ACCEPTANCE TEST — CONTENT SEARCH

Given a facility has:

```text
video
article
product
```

Search query can retrieve the content.

The result should resolve toward:

```text
content
 ↓
facility
 ↓
product/service
 ↓
location
```

when confidence is sufficient.

---

# 162. CORE ACCEPTANCE TEST — IMAGE SEARCH

Given an image of a product:

```text
upload/camera
 ↓
visual embedding
 ↓
similar products
 ↓
facilities
 ↓
availability
```

---

# 163. CORE ACCEPTANCE TEST — BULK IMPORT

Free seller:

```text
bulk import → denied
```

Pro seller:

```text
upload
 ↓
AI schema mapping
 ↓
preview
 ↓
approval
 ↓
async import
```

---

# 164. CORE ACCEPTANCE TEST — DIGITAL SUBSCRIPTION

User:

```text
find CRM
 ↓
select subscription
 ↓
purchase
 ↓
provisioning/API
 ↓
entitlement
```

If API unavailable:

```text
seller fulfilment workflow
```

---

# 165. CORE ACCEPTANCE TEST — MAP

At global zoom:

```text
globe
```

Zoom in:

```text
country
 ↓
region
 ↓
city
 ↓
facility
```

At every level, use viewport-aware retrieval and clustering.

---

# 166. CORE ACCEPTANCE TEST — AGENT VISUALIZATION

When agent searches:

```text
agent action
 ↓
map changes
```

When agent finds best result:

```text
best facility highlighted
```

When agent checks availability:

```text
candidate facilities visually update
```

The AI's work must feel connected to the physical world.

---

# 167. FINAL PRODUCT HIERARCHY

The implementation must preserve this hierarchy:

```text
                 OMNI
                  │
          ┌───────┴───────┐
          │               │
        WORLD           AGENT
          │               │
        MAP             ACTION
          │               │
      FACILITIES      EXECUTION
          │               │
   ┌──────┼──────┐        │
   │      │      │        │
PRODUCT SERVICE CONTENT   │
   │      │      │        │
   └──────┼──────┘        │
          │               │
       DISCOVERY ─────────┘
          │
      AVAILABILITY
          │
       DECISION
          │
      TRANSACTION
          │
       FULFILMENT
          │
      DATA / SIGNAL
          │
      BETTER OMNI
```

---

# 168. FINAL BUILD RULE

Do **not** build:

> a map with a chatbot attached.

Build:

> **a spatial supply-and-demand engine where the map, search, facilities, content, AI, availability and transactions are different views of the same underlying commercial graph.**

The user should be able to move between:

```text
"I want something."
        ↓
SEARCH
        ↓
"I found something."
        ↓
FACILITY / PRODUCT / CONTENT
        ↓
"Is it actually available?"
        ↓
AVAILABILITY
        ↓
"Which one should I choose?"
        ↓
AI RECOMMENDATION
        ↓
"I want it."
        ↓
TRANSACTION
        ↓
"Did it actually happen?"
        ↓
QR / TRANSACTION RECORD
        ↓
"Now Omni knows."
```

And the seller should be able to move between:

```text
"I have supply."
        ↓
FACILITY
        ↓
PRODUCT / SERVICE
        ↓
CONTENT
        ↓
DEMAND
        ↓
AI RECOMMENDATION
        ↓
AVAILABILITY
        ↓
ORDER
        ↓
SALE
        ↓
TRANSACTION DATA
        ↓
BETTER DISCOVERY
        ↓
MORE DEMAND
```

**That is the product to build.**

---

# 167. PRODUCT & INTERFACE SPECIFICATION ADDENDUM (2026-08-14)

# OMNI — Product & Interface Specification

## 0. Principe directeur

Omni est une plateforme de **discovery + real-time availability + transaction**. Le parcours fondamental est :

**Search → Discover → Check Availability → Compare/Recommend → Purchase Intent → QR → Transaction**

La carte est le canvas principal de l'application. L'IA n'est pas un produit séparé : elle est une couche d'orchestration au-dessus des actions manuelles existantes.

> **Tout ce que l'Agent peut faire doit déjà exister comme action manuelle dans Omni.**

## 1. Couches produit

1. **Discovery** — Map, search, categories, facilities, products/services, distance, certification/trust, promotions.
2. **Availability** — Manual availability, bulk availability, seller responses, automated seller responses, comparison.
3. **Intelligence** — Buyer Agent, Seller Agent, recommendations, intent extraction, orchestration.
4. **Transaction** — Purchase Intent, coupon, QR, seller chat, pickup/delivery choice, contact, directions, payment, confirmation, completion.

## 2. Utilisateurs, plans et configuration

### Buyer

- **Free** : utilisation manuelle.
- **Pro** : manuel + Agent si la couche IA est activée.

### Seller

- **Free** : facilities limitées selon configuration.
- **Pro** : facilities illimitées + fonctionnalités avancées, notamment Agent.

Une facility ne peut pas être publiée complètement sans passer par le processus de certification Omni.

## 3. Home buyer map-first

Il n'y a aucune landing page dans l'application. À l'ouverture, l'utilisateur arrive dans l'espace carte :

```text
┌──────────────────────────────────────────────┐
│                                    🔔   ◉   │
│                                              │
│                    MAP                       │
│                                              │
│                     📍                       │
│                                              │
│        ┌────────────────────────────┐        │
│        │ 🔍  What are you looking   │        │
│        │     for?                ˅  │        │
│        └────────────────────────────┘        │
└──────────────────────────────────────────────┘
```

Top-right : **Notifications** et **Menu** uniquement. Pas de navbar permanente.

## 4. Map et onboarding géographique

La map est une carte **Mercator / globe-light** et constitue le background principal. À la première ouverture, Omni demande la localisation. Si l'utilisateur accepte, l'animation doit progresser :

```text
Globe → Continent → Pays → Région → Zone / quartier → Localisation exacte
```

Chaque étape met visuellement en évidence le niveau géographique courant. Le pin utilisateur apparaît à la localisation finale.

## 5. Map controls

À gauche, centrés verticalement :

```text
┌────┐
│ +  │
├────┤
│ −  │
├────┤
│ ◎  │
└────┘
```

`+` zoom in, `−` zoom out, `◎` recentre sur l'utilisateur. Aucun contrôle supplémentaire n'est nécessaire sur la map principale V1.

## 6. Search bar

La Search Bar est l'élément principal de navigation produit. Elle reste en bas, flottante, arrondie, lisible, légèrement translucide et au-dessus de la map.

Le chevron ouvre une rangée horizontale de catégories scrollables : `[ All ] [ Food ] [ Health ] [ Retail ] [ Services ] [...]`. Les catégories sont des raccourcis de recherche, pas une marketplace classique.

## 7. Manual mode vs Agent mode

### Manual Mode

Disponible pour tous. L'utilisateur indique principalement ce qu'il recherche. Omni propose ensuite les paramètres applicables : produit/service, quantité, budget, localisation. Quantité et budget ne doivent pas être obligatoires lorsqu'ils ne sont pas pertinents.

### Agent Mode

Disponible uniquement pour Buyer Pro lorsque l'IA est activée. La Search Bar possède un switch `Manual / Agent`. En Agent Mode, l'utilisateur écrit en langage naturel. L'Agent extrait les paramètres puis utilise les mêmes APIs que le mode manuel.

L'Agent ne doit pas devenir un chatbot généraliste. Hors scope :

> Je peux uniquement vous aider à rechercher, vérifier la disponibilité et effectuer les actions prises en charge par Omni.

## 8. Search execution et auth

Un nouvel utilisateur peut écrire sa recherche, mais la requête n'est pas exécutée avant création/connexion du compte. La requête est conservée :

```text
Search → Authentication required → Sign up / Login → Onboarding → Restore original query → Execute search
```

L'utilisateur ne doit jamais perdre sa recherche.

## 9. Camera after search

Après chaque recherche, la caméra se repositionne automatiquement pour afficher la position utilisateur + facilities pertinentes, sans demander à l'utilisateur de dézoomer.

## 10. Search results et facility cards

Après recherche : `42 facilities found`. Les résultats apparaissent sur la carte, sans clusters dans le modèle souhaité. Une card/panel peut accompagner les résultats.

La facility card est contextualisée par la recherche : si l'utilisateur cherche `Nike Air Max`, la card met `Nike Air Max` en avant plutôt que seulement `ABC Store`.

## 11. Media

Les médias sont **hors scope UI actuel**, mais l'architecture doit rester media-ready : photos, vidéos, social content, facility media, product media, media search. État cible : **Media-ready, UI disabled**.

## 12. Facility detail

Au clic facility : fiche au-dessus de la map. Desktop : side sheet/floating panel. Mobile : bottom sheet. La map reste visible derrière.

Contenu : identity, search context, products/services pertinents, pricing, promotions, distance, availability status, CTA `Check availability`.

## 13. Availability

L'Availability est toujours postérieure à la recherche.

- Recherche : **Who can potentially satisfy my request?**
- Availability : **Who can satisfy it right now?**

Manual availability cible une facility. Bulk availability cible plusieurs facilities. Buyer Free : **3 bulk searches/month**. Buyer Pro : bulk + Agent si activé.

Le payload vendeur inclut produit/service, variante, quantité et paramètres pertinents. Le budget sert au filtrage/reclassement côté Omni et n'est pas envoyé au vendeur.

Réponses vendeur : **Available**, **Partial**, **Unavailable**.

## 14. Buyer Pro recommendation

Le Pro peut demander à l'Agent d'analyser les réponses d'availability et de recommander une option selon quantité complète, budget, distance et qualité de confirmation. L'utilisateur garde le contrôle des décisions transactionnelles critiques.

## 15. Purchase Intent et transaction

Le Purchase Intent est le point de bascule entre Discovery/Research et Transaction. Avant intent, contact direct, directions détaillées et éléments transactionnels restent masqués. Après intent, ils peuvent être débloqués.

Un Purchase Intent génère un QR transactionnel lié à buyer, seller, facility, product/service, quantity, offer, coupon et transaction/session ID.

Le chat transactionnel montre une timeline : intent created, offer confirmed, QR generated, seller verified, payment, seller confirmation, product received, completed.

Pickup est géré par Omni. Delivery est organisé entre vendeur et utilisateur dans cette version.

## 16. Transaction data model

Chaque transaction doit répondre à : **Who bought what, from whom, where, when, at what offer, with which promotion, and with what outcome?**

Données minimales : buyer, seller, facility, product/service, quantity, price, promotion, coupon, location, timestamp, purchase intent, QR, payment, completion.

## 17. Facility status, claim et certification

États : Unclaimed, Claimed, Certified, Confirmed, Online, Offline. Le statut de certification influence ce que l'utilisateur peut voir et le niveau de confiance. Une facility unclaimed peut être découverte et proposer son claim. Le processus de certification est obligatoire avant publication complète.

## 18. Seller dashboard

Le dashboard seller reste map-first. La carte du seller ne montre que ses propres facilities. Le seller peut prévisualiser exactement comment sa facility apparaît au buyer, avec actions d'administration : edit facility, products, promotions, availability, hours, online/offline.

Sections seller : Facilities, Products/Services, Availability, Requests, Transactions, Promotions, Ads, Agent, Balance, Subscription, Settings.

## 19. Product, allocation, promotions, ads, wallet

Chaque product/service porte name, category, description, price, availability, quantity, Omni allocation, promotions, status. Le Seller Agent ne peut jamais promettre plus que l'allocation Omni disponible.

La balance globale sert aux abonnements, fonctionnalités payantes, crédits, services, publicité et autres consommations Omni. L'auto-renewal vérifie le solde à expiration : solde suffisant → renouvellement automatique ; sinon downgrade.

## 20. Notifications et menu

Notifications est central et deep-linked vers le contexte : search, availability, recommendations, promotions, purchase intent, QR, seller, payment, transaction, account, subscription, certification, ads, Agent.

Menu global buyer : Profile, Plan, Balance, Searches, Availability, Transactions, Notifications, Settings, Help, Logout. Menu seller : Facilities, Catalogue, Requests, Transactions, Promotions, Ads, Agent, Balance, Subscription.

## 21. Free vs Pro

### Buyer Free

Map, search, manual parameters, discovery, details, manual availability, bulk availability limité à 3/month, purchase, QR, transaction. Pas d'Agent ni AI recommendation.

### Buyer Pro

Tout Free + bulk + Agent Mode, natural language intent, AI recommendation et automated workflow si l'IA est activée.

### Seller Free / Pro

Free : facilities limitées, certification, products, manual responses, promotions, ads selon plan. Pro : facilities illimitées, Agent, automated availability, ads.

## 22. Global AI kill switch

Admin doit avoir un contrôle `AI / Automation [ON]`. Si OFF : Agent Mode, intent orchestration, AI recommendation, Seller Agent et automated availability disparaissent. Toutes les fonctionnalités manuelles continuent.

## 23. Stateful interface rule

> **Do not build Omni as separate pages. Build it as a map-first stateful interface.**

L'expérience principale évolue par états :

```text
MAP → SEARCH ACTIVE → SEARCH RESULTS → FACILITY SELECTED → AVAILABILITY → AVAILABILITY RESULTS → PURCHASE INTENT → TRANSACTION CHAT → COMPLETED
```

Et non par pages isolées `Home → Search Page → Results Page → Facility Page → Checkout Page`.

## 24. Source of truth V1/V2-ready

Non négociables : map-first, no in-app landing page, persistent bottom search, Mercator onboarding, automatic camera framing, manual core, Agent optional, structured budget/quantity, availability after discovery, bulk availability, Free bulk limit 3/month, Pro AI recommendation, seller manual response, seller automated availability, Seller Pro unlimited facilities, certification before listing, online/offline state, promotions, Purchase Intent gateway, QR at intent, contact/directions after intent, stateful transaction chat, user controls payment confirmation, global wallet, auto-renewal, notifications, AI kill switch, media-ready disabled, transaction traceability.

---

# 168. CLEAN GLOBE AND STAGED SEARCH REVEAL CONTRACT

The globe is the first product message. Omni represents the world's supply and demand, so the opening state must be clean, sparse, calm, and legible rather than a dense dashboard of pins. At rest, show restrained geography and atmosphere only. Do not show a permanent cloud of facility pins, labels, clusters, promotional cards, or analytics. The supplied Omni mark and the persistent search remain the primary interface signals.

The resting state is a slow, continuous globe rotation and is also the research/reset state. It must pause on drag, zoom, keyboard navigation, location onboarding, search focus or submission, map control use, facility selection, sheet opening, or any meaningful interaction. It resumes only after a quiet inactivity delay and is disabled when the user prefers reduced motion. Any rotation or flight timer must be cancellable so stale searches cannot move the map after a newer search begins.

Every search must visibly unfold through geography instead of jumping directly to local results. Before camera framing settles, reset to the clean world view and briefly resume the world spin. Then highlight the relevant user/search continent, pause, zoom to the relevant country, pause, zoom to the relevant region and highlight it, pause, zoom to the town/area, pause, and finally zoom to the actual user/search position. At the final position, show the user pin and individual finding pins together with contextual result cards. If the user begins another search from a result state, quickly zoom out to the clean globe first and run the same staged reveal again.

The default choreography is:

```text
RESTING ROTATING GLOBE
  ↓ new search
QUICK RESET / WORLD VIEW
  ↓
HIGHLIGHT CONTINENT → pause
  ↓
ZOOM COUNTRY → pause
  ↓
ZOOM REGION → highlight → pause
  ↓
ZOOM TOWN / AREA → pause
  ↓
ZOOM ACTUAL USER OR SEARCH POSITION
  ↓
SHOW USER POSITION + FINDING PINS + RESULT UI
```

The geography sequence follows the search destination when the query targets another location. When user context is relevant, the final framing still includes the user's actual position. Global/world views may use scale-appropriate clustering to avoid rendering millions of facilities, while local search-result mode shows individual relevant result pins without clusters. Optional supply/demand information may briefly fly outward during an active search as one to three restrained signal arcs or small contextual callouts. These elements must be transient, sparse, and subordinate to the globe and result pins; they must never become a permanent data cloud.

This globe behavior is a product requirement and must be covered by automated state tests and browser verification for initial idle, interaction pause, delayed resume, reduced motion, search reset, continent/country/region/town highlights, final user/result framing, and second-search cancellation.

---

# 151. MAPLIBRE GLOBE PROJECTION CORRECTION

The Omni globe is the **MapLibre globe projection** rendered by the same geographic map instance that powers local search. It must not be replaced or visually masked by a decorative SVG, CSS sphere, image, Canvas 2D drawing, or other substitute. The resting experience uses MapLibre’s global projection with real geographic basemap data, sparse geographic styling, and slow camera rotation. Search transitions reuse this MapLibre instance as it moves from the globe through continent, country, region, town/area, and final-location scales.

The active map container must have an explicit full-viewport size. When the vector style is ready, MapLibre must render visible land, water, labels, and boundaries. The normal experience must keep one coherent globe-capable vector style through resting rotation, projection changes, boundary loading, and result framing; it must not silently switch to an unrelated flat raster map. If the vector provider fails before readiness, the UI may show a truthful non-blocking retry/status surface over the same MapLibre canvas, but it must never present a different basemap as if it were the Omni globe or use a decorative globe as a replacement for map data.

Acceptance requires that the idle DOM contain no decorative globe surface, that the MapLibre canvas fills the map viewport, that the active projection is `globe` at global scale, that zooming transitions to detailed geographic rendering, and that result pins, user location, boundary highlights, and contextual cards remain MapLibre-backed overlays.

---

# 169. OMNI FIRST-PAGE COMPOSITION AND SEARCH DOCK REDESIGN

The first page of Omni is the real MapLibre globe plus one deliberate control composition. The surrounding spatial field uses a warm white or cream background, while the globe itself preserves grey/black water, white or warm-white land, restrained charcoal geography, and orange only for Omni actions and facility pins. The style must be applied atomically before the globe becomes visible; the user must not see a heavy full-viewport black loading surface or a raw source-style flash between map states.

The first-page element inventory is fixed: top-right notifications and menu; left-side zoom, recenter, and location controls; the full-viewport MapLibre globe; sparse source-backed resting facility pins; attribution; a persistent bottom dock; optional category/filter rail; structured quantity and budget controls; compact location status/retry/fallback context; result count and availability action; and mutually exclusive result/request surfaces. No permanent top-left buyer-map brand mark and no large centered arrival-location card are allowed.

The bottom dock is organized into named rows: primary search, discovery/filter, structured parameters, location context, and action/request. In idle mode it remains quiet, showing the search, discovery affordance, and compact location context only. During a search, quantity and budget remain in their own stable row. When direct results exist, the action row contains result count and bulk availability. When no direct results exist, the “Dites-nous ce que vous cherchez” request surface replaces the action row and preserves the exact query; it must never stack over quantity or budget. When browser location succeeds, the exact user-position pin must be visible on the globe and later search framing; denial or market fallback must produce no user pin. A measured dock-clearance contract positions result cards and route guidance above the actual expanded dock height on every breakpoint.

Selected-facility, availability, cart, wishlist, order, chat, and navigation surfaces are stateful overlays on the map. They may replace the dock while open, but closing them returns to the same first-page state without re-requesting location or triggering staged reveal. Manual map movement remains user-controlled. Only explicit or restored search triggers the staged geographic reveal, and active boundary emphasis remains black or near-black while orange remains reserved for Omni actions and pins. If browser location is unavailable, any active-market center such as Fréau Jardin is approximate context only: the recenter control and final reveal stage must say approximate market, never exact user position.

The native geolocation prompt is permission-state aware. On landing, Omni queries the browser permission state; `prompt` invokes the native request once without blocking the globe, `granted` refreshes a real coordinate, and `denied` is explained as a browser setting with explicit retry/recovery. A stale session flag must never suppress a still-`prompt` browser state. Only a successful coordinate callback creates a user-position marker. The callback's `coords.accuracy` must be retained and exposed. Each request must use a fresh coordinate (`maximumAge: 0`) rather than accepting a cached network estimate: accuracy at or below 500 metres is labeled `Position GPS active`, while accuracy above 500 metres is labeled `Position approximative (réseau)`, shown with a translucent uncertainty radius, and must never be described as a precise GPS fix. Development diagnostics must log latitude, longitude, accuracy, accuracy band, fallback market center, and whether the callback coordinate equals the market center so that an ISP/network-center response cannot be confused with an application-supplied fallback.

Acceptance for this first-page contract covers idle, location-pending, location-fallback, active search, no-results request, search results, facility selection, availability, and navigation states at desktop, tablet, and narrow mobile widths. It also requires controlled callback tests for a precise coordinate, a low-accuracy coordinate at the market center, and a denied callback. Every state must preserve visible focus, safe-area spacing, non-overlapping controls, real MapLibre projection, truthful location semantics, source-backed facilities, and no decorative map substitute.
