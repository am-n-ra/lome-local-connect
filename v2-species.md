# Omni V2 — Species Design Blueprint

**Document ID:** `OMNI-V2-SPECIES-002`
**Status:** Owner-approved for Buyer Trunk inheritance; Seller and post-intent extensions remain subject to their own mini-species and ring decisions
**Method:** Nature Way — Phase 1, Species
**Parent:** [`v2-seed.md`](./v2-seed.md)
**Reference asset:** [`docs/references/omni-species-reference.jpeg`](./docs/references/omni-species-reference.jpeg)
**Complete maquette:** [`docs/maquette/omni-species-maquette.html`](./docs/maquette/omni-species-maquette.html)
**Maquette contract:** [`docs/maquette/omni-species-maquette.md`](./docs/maquette/omni-species-maquette.md)

> **Species decision:** The supplied Canva image is not a loose mood board. It is the visual reference frame for Omni’s first buyer surface. The implementation must reproduce its composition, hierarchy, proportions and restraint before adding responsive extensions or business-state surfaces.

This blueprint corrects the previous Species abstraction. The previous version captured “map-first” in general terms but introduced competing patterns such as desktop rails, left controls, extra chrome and an overly generic sheet. Those are not part of the reference-faithful first species.

## 1. Reference frame

The supplied image presents a centered mobile application viewport inside a rounded device frame on a quiet warm-white presentation canvas. The application viewport contains a pale spatial map, minimal top controls, a small facility marker and label, a floating search pill, and a white bottom sheet that begins below the search pill.

The app’s visible composition is, from top to bottom:

```text
┌──────────────────────────────────────┐
│  Acheter  Vendre                 J5  │
│                                      │
│                    +                 │
│                    ◎                 │
│                                      │
│              ◉                       │
│        BOULANGERIE BIO               │
│                                      │
│     ┌ rechercher un commerce... ┐    │
│     └────────────────────────────┘    │
│  ┌────────────────────────────────┐  │
│  │              ━                 │  │
│  │  Proche de vous         Voir tout│  │
│  │  ┌──────── card ───────┐ ┌card┐ │  │
│  │  │ icon  DISPONIBLE    │ │ …  │ │  │
│  │  │ Le Fournil D'Or     │ │    │ │  │
│  │  │ Boulangerie...       │ │    │ │  │
│  │  │ Vérifier disponibilité│ │   │ │  │
│  │  └──────────────────────┘ └────┘ │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

The phone frame in the presentation image is a communication device, not a product requirement. In the application, the viewport itself fills the available screen and retains the same internal composition.

## 2. What is now locked

The following visual decisions are locked for the first buyer species:

1. The map occupies the entire application viewport behind the surfaces.
2. The initial mobile top row contains a compact `Acheter / Vendre` segmented switch at the upper left and a small circular account/credit indicator at the upper right.
3. The initial map controls are a compact vertical group on the right side, with `+` above the location/recenter control. They are not a left rail.
4. A single facility marker and a small uppercase place/category label may sit in the quiet central map field.
5. The search control is a single bottom dock. In the map-only state it rests inside the bottom safe area. When the nearby result grid/sheet is visible, it moves into a separate dock band above that surface with a measured gap; it never overlaps the grid, cards, sheet or map controls.
6. The dock contains the search field, one separately discoverable Options/chevron control and a clearly right-aligned dark-green search action. The search action is the submit affordance; the chevron opens parameters and never replaces the search action.
7. The bottom result sheet is white, rounded at the top corners, full-width on mobile and visually heavier than the dock.
8. The sheet starts with a centered grab handle, the heading `Proche de vous`, a small `Voir tout` action and a horizontal card rail.
9. The first card is a compact facility/product card with an icon, a status pill, facility name, category/distance metadata and one dark-green `Vérifier la disponibilité` action.
10. A partial next card remains visible at the right edge to communicate horizontal continuation without adding a carousel toolbar.
11. The visual language is warm white, pale grey, muted green, deep forest green, small mint status accents and a restrained orange/coral map-marker accent.
12. The initial state is quiet and sparse. It does not show a dashboard sidebar, an overlapping dock/grid, a large explanatory caption, multiple floating chips, a visible filter grid or a collection of unrelated actions.

These are Species rules. Seed product invariants, Flow state transitions and Root System authority remain unchanged.

## 3. Visual anatomy and proportions

Use normalized proportions so the reference remains stable across supported phone sizes. Values are targets, not arbitrary suggestions.

| Element | Reference-faithful target | Constraint |
|---|---|---|
| Top safe row | 7–13% of viewport height | Never competes with the map marker or sheet |
| Role switch | 7–31% viewport width, upper-left safe area | Compact segmented pill; `Acheter` active in buyer arrival |
| Account/credit indicator | 84–94% viewport width, upper-right safe area | Small circular indicator; no large profile panel |
| Map controls | 84–94% viewport width, around 18–34% viewport height | Right-aligned, vertically stacked, compact and reachable |
| Facility marker/label | Around 35–65% viewport width and 28–43% viewport height | Quietly centered; never behind search or sheet |
| Bottom dock | 7–93% viewport width; inside bottom safe area when map-only | One row, search field plus distinct options and right submit button |
| Dock with sheet | Same width; 8–16px above sheet/grid | Dedicated band; never overlaps the sheet, cards or controls |
| Sheet top | 59–63% viewport height in arrival | Full-width with 28–32px top corner radius; dock occupies its own band above it |
| Sheet handle | Centered, 40–56px wide, 3–5px high | Visible but subtle |
| Nearby heading row | 7–93% viewport width, 6–14% below sheet top | Heading left, `Voir tout` right |
| Card rail | 7–100% viewport width, below heading | First card fully readable; next card partially visible |
| Primary CTA | Inside first card, full available card width | One clear action; no competing secondary CTA |

For a 320px viewport, preserve the first card’s readable width and let the next card clip safely. Do not shrink text until the card becomes illegible. For 375px, allow a little more of the next card to appear. At 768px and 1280px, preserve the same visual anatomy inside a bounded centered bottom sheet rather than converting the experience into a side dashboard.

## 4. Map treatment

The map is real geographic context, but the initial frame uses a quiet visual treatment. Use a very pale grey/grey-green basemap with low-contrast roads and labels, softened saturation and a subtle dot-grid or spatial texture layer inspired by the reference. The texture must never be used as fake geography or replace a functioning map provider.

The first buyer view should be locally legible without feeling like a dense navigation application. The resting globe may exist as the underlying map state, but when the interface presents `Proche de vous`, the camera may settle into an appropriate local context. Camera movement, visible bounds and source-backed pins remain governed by the Root System and Flow.

Public pins remain source-backed and stable. Use a small warm marker/halo for the selected or featured facility, with a compact uppercase label such as `BOULANGERIE BIO`. Do not add availability badges to arbitrary pins. Clustering is allowed at densities where it improves legibility, but the initial reference frame must remain visually sparse and calm.

The map must never become a flat decorative panel. If external tiles fail, show an honest, graceful fallback with the same spatial composition; do not fabricate roads, facilities or availability.

## 5. Map modes and map-owned surfaces

The map is not a decorative background behind the sheets. It is a first-class Species surface and must be represented by distinct maquettes before implementation.

| State | Map presentation | Visible facilities | Allowed transition |
|---|---|---|---|
| `idle_globe` | Full viewport, sparse globe/world context, slow interruptible idle rotation | Source-backed pins or clusters at global/low zoom | Manual explore, explicit location, search, J5 account |
| `local_map` | Full viewport local geographic context, stable camera after explicit reveal | Public source-backed pins and density-appropriate clusters | Select cluster, select pin, search, back to globe |
| `cluster_selected` | Local map with selected cluster emphasis and camera framing | Cluster count/members, no invented availability | Expand/zoom to local map or choose a member facility |
| `facility_focus` | Local map with one restrained selected-pin highlight and label | Selected facility plus nearby context | Open public detail or return to prior map context |
| `trust_markers` | Same map with a visible legend or readable status treatment | Neutral unclaimed, explicit certified/unconfirmed and confirmed markers | Select facility; never directly unlock private actions |
| `route_visible` | Local map with an honest route/itinerary layer to the permitted facility | Selected facility and route endpoint | Open transaction room, close route to transaction context |
| `map_recovery` | Prior map camera restored with concise recovery copy | Previously visible source-backed context | Retry, resume or return to the safe prior state |

The supplied Canva frame remains the visual reference for the surface material, top controls, quiet map field and dock/sheet relationship. These map modes extend its language rather than replacing it. In `idle_globe`, the visual field is intentionally sparse and the map may rotate slowly only when no active interaction owns the camera. In `local_map`, the map fills the viewport and the camera changes only through explicit location, manual exploration or a permitted search reveal. Sheets remain contextual overlays with their own reserved bands.

Clusters communicate density and zoom affordance, never supply. A cluster may show a count or expand into its members; it must not show a fake availability number. A public pin communicates geographic presence only. Marker treatment may distinguish `unclaimed`, `certified/unconfirmed` and `confirmed` only when the status is authoritative and a legend or accessible label makes the meaning clear. It must never imply inventory, price, trust beyond the status, or seller permission. The selected marker can receive a warm halo and label while the prior camera and result context remain recoverable.

The route/itinerary layer is a protected post-intent surface. It appears only after `intent_created` is confirmed by the server and the buyer is authorized to access the seller’s permitted location. It is not shown on a public facility, on an availability response or during intent review. Closing it returns to the transaction room without revoking the intent.

Every map state has a reversible owner. Back, Escape, close and sheet dismissal restore the previous camera mode, center, zoom, query, filters, selected facility, selected product and active request/intent/transaction IDs. No transition silently jumps to precise personal location or discards unfinished work.

## 6. Top controls

### 6.1 Buyer/seller switch

The initial role/context control is a single segmented pill at the upper left. It visually resembles the reference: the active segment is deep forest green with light text, and the inactive segment is warm white or translucent with dark text. In the buyer species, `Acheter` is active and `Vendre` is available only when the authenticated account is authorized for seller context.

This switch changes role context; it does not bypass Auth, facility ownership or permissions. For a visitor, tapping `Vendre` opens the explicit account/authorization gate while preserving the public map.

### 6.2 Account or credit indicator

The upper-right circular indicator is intentionally small. It may show an account state, compact credit/entitlement indicator such as `J5`, or a notification state when that state is real. It must not become an unexplained wallet claim or a decorative badge. Tapping it opens a real account/context surface.

### 6.3 Map controls

The reference places map controls on the right, not the left. The initial visible group contains a circular `+` control and a circular location/recenter control with consistent size, spacing, translucency and shadow. Zoom-out remains available through a safe expanded control or direct gesture without adding a third crowded button to the initial frame unless the approved design extension explicitly requires it.

Controls pause idle movement and never overlap the search pill, facility label or sheet. They remain accessible at 320px.

## 7. Search dock

The arrival search is one bottom dock. Its placeholder follows the reference: `Rechercher un commerce, un produit…`. The dock includes a search icon, one coherent input row, a distinct Options/chevron affordance and a clearly right-aligned `Rechercher` action.

In the map-only state, the dock is anchored to the bottom safe area. When the nearby result grid/sheet appears, the dock is repositioned into a dedicated band above it with a visible 8–16px gap. The dock and grid are separate siblings in the layout; neither is allowed to cover the other. Options open upward from the dock into the map field or another reserved safe region, never inside the result grid.

The closed state does not display a second search bar, filter chips, a large explanatory caption or a desktop-only dock. Search focus does not pan or zoom the map. Pressing Enter and activating the right-side `Rechercher` button use the same guarded path. The chevron only opens or closes parameters and is never the submit action.

## 8. Bottom sheet and card rail

The sheet is the reference’s primary contextual surface. It has a white or nearly opaque warm-white base, soft shadow, 28–32px top radii and a centered grab handle. Its initial height is approximately 38–42% of a phone viewport.

The first heading row reads `Proche de vous` on the left and `Voir tout` on the right. `Voir tout` is a real action that expands the nearby result state; it is not an ornamental label.

The card rail is horizontally scrollable but intentionally shows one complete card and a partial next card. The first card must contain:

- a compact circular or rounded facility/product icon;
- a small mint status pill such as `DISPONIBLE` only when backed by the relevant state;
- a facility/product name such as `Le Fournil D’Or`;
- category and distance metadata such as `Boulangerie & Pâtisserie · 450m`;
- one dark-green primary action: `Vérifier la disponibilité`.

The CTA opens the catalogue/product selection and availability path only when the Flow state permits it. It cannot create an availability request from an unselected product, reserve stock, create an intent or unlock private contact.

The rail must restore its scroll position and selected facility context after opening detail and returning. On desktop, keep the rail inside the bounded sheet; do not replace it with a dense data table.

## 9. State compositions

### 9.1 Arrival state

The exact first frame is sparse: map, role switch, small account/credit indicator, right controls, one quiet marker/label, search pill and the `Proche de vous` sheet. No permission prompt appears automatically. Location is explicit and cancellable.

### 9.2 Search expanded state

The search pill grows only enough to show the active input and its one Options affordance. The sheet may compress or scroll, but the map remains visible. Options are presented as a single attached contextual state, not a second dashboard.

### 9.3 Nearby/results state

`Voir tout` expands the rail or sheet to show result cards. The original search pill remains the anchor. Cards preserve the same card anatomy and use status/source labels that distinguish public presence, catalogue match and availability evidence.

### 9.4 Facility state

Selecting the first card or a pin highlights the facility and opens a detail sheet using the same white surface and handle. The result rail remains recoverable. Public identity, source, trust state, public hours and catalogue entry are visible; contact, itinerary, chat and QR remain locked.

### 9.5 Catalogue and availability states

The facility sheet transitions into a catalogue surface without abandoning the map composition. Product selection appears before the availability steps. The visible progress language is `Produit → Portée → Contraintes → Réponses`. Each state retains the same sheet material, heading rhythm, footer reachability and one primary next action.

### 9.6 Seller state

When `Vendre` is authorized, the same map-first species remains. The selected owned facility occupies the spatial center. Seller operations appear in contextual sheets and cards, not a generic left-hand admin dashboard. Product and coupon forms use the same card density and one primary action as the buyer card.

### 9.7 Account-owned navigation and account states

The compact J5/account icon is the **only** navigation entry in the Species. There is no separate hamburger menu. Pressing J5 opens one account/navigation sheet while the map remains mounted behind it. The sheet contents vary by visitor/authenticated state, pending context and authorized role.

- **Guest Account Sheet:** explains that public exploration is available, while catalogue search, availability and private actions require an account. It offers `Créer votre compte`, `Se connecter` and `Continuer sur la carte`.
- **Authenticated Account Sheet:** shows the account identity, the one Omni Wallet summary, active requests/transactions, preferences/security and an authorized `Passer en mode Vendre` action.
- **Account Navigation Sheet:** contains only real destinations: Rechercher, Mes demandes, Transactions, role context and Compte. It must not list unavailable dashboard features.
- **Context Resume Sheet:** when a request or transaction is pending, J5 exposes the facility/product context, current state and next action. It reuses the original operation and never recreates it.

Opening J5 pauses map motion, preserves viewport/query/selection, traps focus within the sheet only while open, and restores focus to the triggering control on close. `Escape`, back and the close action have the same safe return result. Every row has a destination or typed operation; no dead row is allowed. Guest, authenticated and seller-authorized account sheets are separate states.

### 9.8 Post-availability and purchase surfaces

The availability request is not the end of the buyer journey and must not be represented as a single generic screen. The Species must show the sequence below as distinct surfaces:

1. **Comparison:** eligible seller responses are compared while contact, itinerary, chat and QR remain visibly locked.
2. **Intent review:** the buyer reviews the selected facility, catalogue product, quantity, authoritative price, applicable Omni coupon/offer, freshness and fulfilment context. A locked contact/itinerary note explains that these unlock only after intent creation.
3. **Intent created:** the server-confirmed purchase intent becomes the transition into the transaction room. The immutable snapshot and next step are visible.
4. **Contact and itinerary unlocked:** the transaction sheet reveals only now the seller’s permitted contact details, itinerary/action and transaction context. These actions are never available on public facility cards or before intent.
5. **Transaction room:** a single contextual sheet owns the timeline, scoped chat, QR action, external payment choice/declaration and actor-specific next action. The map stays mounted, and the buyer can leave and return through J5.
6. **Completion/recovery:** payment declaration, seller confirmation, fulfilment, buyer receipt, rating, expiry, cancellation and recovery each have explicit visual states.

The contact/itinerary transition requires an explicit `intent_created` server state; a client click, availability response or visual selection cannot unlock it. Each surface reserves independent space for the map, top controls, account navigation, dock, sheet header, body and footer. The sheet may grow or scroll, but it may not cover the J5 control or right-side map controls without an explicit, dimmed ownership state.

## 10. Material, color and typography tokens

| Token | Initial direction | Reference use |
|---|---|---|
| `species-canvas` | Warm white | Presentation and opaque fallback |
| `species-map` | Very pale cool grey-green | Map treatment |
| `species-sheet` | Near-white, high-opacity | Bottom sheet |
| `species-ink` | Deep charcoal/green | Text |
| `species-forest` | Deep forest green | Active segment, primary CTA |
| `species-mint` | Soft mint | `DISPONIBLE` and positive status background |
| `species-peach` | Soft peach | Pending/attention support |
| `species-coral` | Warm orange/coral | Featured marker and small accent |
| `species-hairline` | Light grey-green | Borders and separators |

Use one readable sans-serif family, medium/semibold headings and regular supporting metadata. The heading is compact and assertive; the supporting text is quiet. Avoid all-caps except for small status pills and map labels.

## 11. Motion

The first frame is calm. Idle globe/map movement is slow and interruptible. It must stop when the user touches the map, focuses search, opens the sheet, selects a facility, requests location or enters any active flow. Reduced-motion mode disables continuous movement and unnecessary sheet animation.

Cards and the sheet may use a short ease-in transition to explain emergence, but do not animate every label, marker or status. Motion must never hide a state transition, delay an action or imply that data has become authoritative.

## 12. Responsive rules

| Viewport | Required composition |
|---|---|
| 320px | Full map; compact top switch; right controls; search pill above full-width sheet; one readable card plus safe partial next card |
| 375px | Same composition with more breathing room and slightly more next-card visibility |
| 768px | Full map remains dominant; centered bounded sheet/rail preserves mobile anatomy; no left dashboard rail |
| 1280px | Full map remains dominant; bounded centered sheet or compact bottom surface preserves the reference hierarchy; detail may be bounded, never a dashboard replacement |

At every width, preserve independent safe areas for top controls, menu action, account indicator, right controls, marker label, search dock, Options surface and sheet. No horizontal page overflow is allowed. The sheet footer, if present, remains above the device gesture area and keyboard. Menu and account sheets must never cover the role switch or the right-side map controls unless the state explicitly owns and visually dims them.

## 13. Accessibility and interaction contract

The role switch, account indicator, plus control, location control, search input, Options affordance, `Voir tout`, card rail and primary CTA have accessible names and visible focus. The active role is announced. Sheet opening moves focus intentionally; close, back and Escape restore the prior owner.

Touch targets remain comfortably reachable. The card rail supports keyboard scrolling and does not trap focus. Status changes announce loading, empty, error, locked, permission, success and recovery states. Contrast must remain valid over both the live map and the fallback treatment; translucency is never the only contrast mechanism.

## 14. Complete maquette gate

The written Species rules are not sufficient on their own. The complete maquette must be reviewed as the visual reference DNA for the Trunk and Branches. It includes the exact buyer arrival frame plus dock states, search, options, map modes, pins/clusters, facility trust markers, route/itinerary, facility/catalogue, availability, Auth, account-owned navigation, guest Account, authenticated Account, context Resume, comparison, intent review, intent created, contact/itinerary unlock, transaction, seller and recovery compositions. The companion contract enumerates S00–S34 and the required loading, ready, empty, error, locked, success, pending and recovery states.

No implementation may introduce an alternative layout because a state is technically more complex. It must inherit the arrival species or receive an explicitly approved mini-species.

## 15. Species gate

The Species is ready for Root System/Trunk implementation only when the owner confirms:

1. the supplied Canva composition is the first buyer reference frame, not merely a mood reference;
2. the complete maquette and S00–S34 state inventory, including map modes, pin/cluster semantics, trust markers, account-owned navigation, Account intermediate surfaces and post-availability purchase surfaces, are approved as the visual reference DNA;
3. the role switch is upper-left, the compact map controls are right-aligned, the map-only search is a bottom dock and the result-state dock occupies a separate band above the sheet/grid;
4. the dock has a right-aligned search action and a distinct Options/chevron control that never replaces submit;
5. the nearby heading, `Voir tout`, one complete card and partial next card are retained as the initial result anatomy;
6. the map remains real geographic context with a quiet pale treatment and no fabricated data;
7. seller and buyer use the same spatial language without introducing a generic dashboard;
8. globe, local map, clusters, facility focus, trust markers, search, catalogue, availability, account-owned navigation, Account, comparison, intent, contact/itinerary, route and transaction states extend the same species instead of creating unrelated screens;
9. 320, 375, 768 and 1280 proof includes measured safe zones, focus, keyboard, reduced motion and no overlap;
10. every visible account/navigation action has a real destination or typed operation and a safe return path;
11. contact and itinerary are visibly locked before intent and visibly unlocked only from the server-confirmed transaction state;
12. map transitions, pin/cluster semantics, trust markers, route visibility and Back/Escape restoration are represented in the maquette and do not invent supply truth.

If a feature introduces a genuinely new visual pattern, create a nested mini-species blueprint at the depth that feature requires. Otherwise inherit this blueprint and record the inheritance explicitly.
