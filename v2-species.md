# Omni V2 — Species Design Blueprint

**Document ID:** `OMNI-V2-SPECIES-001`
**Status:** Proposed blueprint for approval before Trunk implementation
**Method:** Nature Way — Phase 1, Species
**Parent:** [`v2-seed.md`](./v2-seed.md)
**Reference asset:** [`docs/references/omni-species-reference.jpeg`](./docs/references/omni-species-reference.jpeg)

> **Design thesis:** Omni is a calm spatial instrument. The map is the application; every other surface appears above it to help the user understand a place, choose a real offer or advance a controlled handoff.

This blueprint converts the supplied visual direction into a buildable visual and interaction contract. It is not a final pixel specification. Exact values may be tuned during Canopy only when they do not change the hierarchy, state ownership or Seed invariants.

## 1. What the reference contributes

The reference establishes a mobile-first composition with a pale, quiet map scene; minimal top chrome; compact location and zoom controls; a floating search pill; a bottom sheet with a strong nearby heading; a concise facility/product card; and one high-clarity availability action.

It also suggests a restrained palette built around warm white, soft grey-green, deep forest green, mint/teal status tones and a small orange/coral accent. The map is visible around the surfaces, while the bottom sheet feels like a purposeful instrument rather than a full dashboard page.

The reference does **not** by itself decide product states, data authority, trust, availability, purchase, transaction or seller permissions. Those remain governed by the Seed, Flow and Root System. The reference is therefore the visual species, not the business contract.

## 2. Experience character

Omni should feel:

- **Spatial:** the user always knows where the search context exists.
- **Quiet:** the map and information hierarchy do not compete with ornamental chrome.
- **Trustworthy:** status labels explain what is known, sourced, confirmed or still uncertain.
- **Immediate:** the next action is visible without making the user understand the whole system first.
- **Premium but practical:** restrained glass, soft surfaces and generous spacing support utility rather than decoration.
- **Resumable:** sheets open and close over the same world; they do not make the user feel transported to an unrelated page.

Omni should not look like a generic SaaS dashboard, a dense marketplace grid, a social feed, a finance app or a dark sci-fi map.

## 3. Visual language

### 3.1 Color roles

Use semantic roles rather than component-specific colors. The exact values are initial tokens and require contrast validation before release.

| Token role | Initial direction | Use |
|---|---|---|
| `canvas` | Warm near-white | Page and sheet base |
| `map-surface` | Pale cool grey-green | Quiet map background and fallback |
| `ink` | Deep charcoal-green | Primary text and high-contrast labels |
| `brand-green` | Forest green | Primary actions, active tabs and trusted operational emphasis |
| `mint-status` | Soft mint | Available/success status backgrounds |
| `peach-status` | Soft peach | Attention, pending or neutral warning backgrounds |
| `orange-accent` | Confident orange/coral | Selected pin, key highlight and limited action emphasis |
| `glass` | Translucent warm white | Floating controls and contextual chrome |
| `hairline` | Low-contrast grey-green | Borders, separators and map-safe outlines |

Green is not a universal synonym for `confirmed`. Status copy and label semantics must distinguish `available`, `certified`, `unconfirmed`, `confirmed`, `pending` and `success`.

### 3.2 Typography

Use a highly readable modern sans-serif with two weights doing most of the work: regular for supporting context and semibold/bold for headings and actions. Avoid display typography that makes facility, product or state names difficult to scan.

The hierarchy is:

1. page/sheet title;
2. nearby or contextual section heading;
3. facility/product name;
4. trust, availability and freshness labels;
5. distance, category, price and supporting metadata;
6. helper text, recovery guidance and legal/source context.

All body and action text must remain readable at the smallest supported width. Do not use a mobile font size that causes browser zoom when the search field receives focus.

### 3.3 Shape, elevation and translucency

Use rounded surfaces with one coherent radius family. The bottom sheet is the strongest surface; the search pill and map controls are smaller floating surfaces. Use thin hairlines and restrained shadows rather than heavy elevation.

Glass is a material treatment, not a replacement for contrast. Text and controls must remain legible over the map. When translucency reduces contrast, use an opaque fallback without changing layout or state.

## 4. Permanent composition

The map scene is mounted once and remains visible through buyer and seller flows. Surfaces above the map are stateful overlays, not independent page replacements.

```text
┌──────────────────────────────────────────────────┐
│ brand / context                         alerts  ◉ │
│                                                  │
│                 permanent map scene              │
│        selected marker / pins / clusters         │
│  map controls                                     │
│                                                  │
│       ┌──────── nearby / context sheet ───────┐  │
│       │ heading, state, card, primary action  │  │
│       └───────────────────────────────────────┘  │
│             ┌──────── search pill ───────────┐   │
│             │ need                         ⌄ │   │
│             └────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### 4.1 Mobile composition

At 320–480 CSS pixels, the map fills the viewport behind safe-area insets. Top chrome stays compact. The search pill sits above the bottom sheet with its own safe gap; it must never be absorbed into or overlap the sheet. The bottom sheet owns nearby results, selected facility context, catalogue, availability steps and comparison states.

The sheet begins in a collapsed or compact nearby state so enough map remains visible to explain orientation. It can expand to a focused state when the user selects a facility or enters a multi-step flow. The sheet footer remains reachable above the device gesture area and keyboard.

The reference’s role selector may be used only for a meaningful authenticated role/context switch. It must not create a second navigation system or imply that a visitor can access seller actions without authentication and authorization.

### 4.2 Tablet and desktop composition

At 768 CSS pixels and above, the map remains dominant. The bottom sheet becomes a bounded floating surface or anchored rail depending on the state, leaving visible map around it. The search dock remains a single coherent control rather than becoming a conventional desktop navigation bar.

At 1280 CSS pixels, the layout may use a compact result rail and a bounded detail sheet simultaneously only when their ownership is unambiguous. No surface may hide map controls, attribution, the primary search action or the selected facility context.

## 5. Surface ownership

| Surface | Owns | Does not own |
|---|---|---|
| Arrival map | Public orientation, map movement, location state and public pins | Private search, availability or transaction state |
| Search pill/dock | Need input and one Options disclosure | Camera movement while typing, product mutation or transaction actions |
| Options sheet | Category, radius, open state, discount, sort, quantity, budget and location mode | Duplicate search controls or hidden business rules |
| Nearby/result sheet | Search progress, result count, cards and result restoration | Claiming, availability mutation or intent creation |
| Facility sheet | Public identity, source/trust state, hours and catalogue entry | Private contact, QR or claim-by-click |
| Catalogue sheet | Facility-scoped offers, product selection and catalogue recovery | Stock reservation or purchase intent |
| Availability flow | Product, scope, constraints, submission and responses | Silent reservation or contact unlock |
| Comparison sheet | Response differences and eligible choice | Client-authoritative price, trust or intent transition |
| Transaction room | Timeline, authorized chat, QR, payment declaration, fulfilment, receipt and rating | Public discovery or unscoped chat |
| Seller workspace | Owned facilities, catalogue, demand and scanner operations | Other sellers’ data or generic dead actions |
| Menu | Real navigation and account/context actions | Placeholder routes or future-facing controls |

Every visible action must map to a typed state and operation. If an action is manual, pending or unavailable, the surface must say so.

## 6. Core screen/state compositions

### 6.1 Arrival

Show the real map/globe immediately. The first explanation is short and spatial: what Omni helps the person find and what public information means. The search pill is discoverable but does not steal map focus. Location is explicit and cancellable; no permission prompt is triggered merely by page load.

### 6.2 Nearby results

Use a heading such as “Near you” only when the location context is known or honestly approximate. The supporting copy must explain the scope. Cards are compact and product-first when the query matches a catalogue offer. Each card shows one primary next action, usually “View facility” or “Verify availability” only when the state permits it.

A card selection selects a facility. It does not claim the facility, request availability or create an intent.

### 6.3 Facility detail

The facility sheet makes identity and status legible before action. It shows the source/trust distinction, distance, public hours, available public catalogue summary and a clear explanation of what remains protected. The selected pin is visually highlighted but the rest of the result context remains recoverable.

### 6.4 Catalogue

The matched offer appears first when there is a match. Each offer has a stable product name, authoritative media or a neutral placeholder, price/offer state, quantity eligibility and freshness where applicable. Product selection is visibly separate from availability submission.

### 6.5 Availability

Use a persistent, named progress indicator. The stages are:

```text
Product → Scope → Constraints → Responses
```

The current stage, completed stages, editable inputs, loading state, cancellation path and next action must be obvious. The buyer should never have to guess whether the action is selecting a product, asking for availability or committing to purchase.

### 6.6 Comparison

Responses are compared through consistent rows or cards: facility, availability status, quantity, price/offer, freshness, distance and seller message. Only eligible responses expose the intent action. Contact and itinerary remain locked until intent creation.

### 6.7 Transaction room

The transaction room is a focused contextual surface over the map, not a second product. It owns one canonical timeline with named stages, one scoped chat, the QR context and the actor-specific next action. The buyer can leave and return through a resume surface without losing the transaction.

### 6.8 Seller workspace

Seller surfaces use the same map and sheet language. The selected facility is the center of context. Facility-level state, catalogue limit, Pro state, trust state, bonus state and account-level Facility Slot capacity are displayed in separate groups. Product and coupon forms are guided, concise and preview their resulting published offer.

## 7. Map, pins and motion

The map is a calm background with enough contrast to support markers and labels. Public source-backed facilities use stable visual semantics. Cluster at low zoom when density requires it; expand to individual pins at useful local zoom. Do not use clusters as a substitute for a missing discovery result or invent availability from marker density.

A selected facility uses a clear orange/coral accent or halo. The buyer’s personal location marker is visually distinct and appears only for an accepted location state. Public pins and personal position must never be confused.

Idle globe rotation is gentle and observable, not theatrical. Manual pan, zoom, keyboard focus, search reveal, location, selected facility focus and active flow take priority over rotation. Reduced-motion mode disables or replaces continuous movement. Any motion must explain a change of context and must be interruptible.

## 8. Interaction and state rules

The interface uses one shared sheet primitive with these rules:

- bottom anchored on mobile and bounded/floating on desktop;
- scrollable body and reachable primary footer;
- focus ownership defined on open, close, back and Escape;
- no horizontal overflow or inaccessible card rail;
- explicit loading, ready, empty, error, retry, cancel, locked and success states where applicable;
- preserved query, viewport, selected facility, selected product and unfinished protected context;
- no camera movement caused by typing in the search field;
- no fake button, silent transition or future feature disguised as active.

The UI may show an optimistic interaction only when the server contract supports safe rollback and the pending state is visible. Trust, price, stock, money, permissions, QR validity and transaction state never become true because a client animation finished.

## 9. Responsive and accessibility contract

The species must be certified at 320, 375, 768 and 1280 CSS pixels. At every width:

- the map remains visible and usable;
- the search control, controls, attribution, result surface and primary footer have non-overlapping safe zones;
- no horizontal page overflow exists;
- touch targets are comfortably reachable;
- keyboard focus is visible and remains in the active input where expected;
- back, Escape and close have explicit ownership;
- status changes are announced without overwhelming the user;
- reduced motion disables continuous rotation and unnecessary transitions;
- contrast does not depend on translucency over an unpredictable map tile.

## 10. Species gate

The blueprint is ready for Root System and Trunk implementation only when the owner confirms:

1. the map is the permanent dominant scene on buyer and seller surfaces;
2. the mobile composition follows the reference’s calm map + search pill + contextual sheet direction;
3. the palette, typography, spacing, material and motion rules are accepted as tokens and roles;
4. surface ownership is explicit and no page or component invents a competing navigation model;
5. catalogue, availability, comparison and transaction states have a clear visual progression;
6. facility, account, trust, Pro, bonus, wallet and transaction facts remain visually distinct;
7. the 320/375/768/1280 responsive and accessibility proof matrix is part of the Trunk definition of done.

If a later feature introduces a genuinely new visual pattern, create a nested mini-species blueprint for that feature before implementation. Otherwise inherit this blueprint and record the inheritance.
