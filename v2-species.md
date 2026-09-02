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
11. The visual language is white/black/gray for the map: white map field/background, near-black oceans, white/light continents and charcoal/gray boundaries; shared sheets may retain their existing Species material, while map markers remain restrained and neutral.
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

The map is real geographic context, and the initial frame uses the established Omni monochrome treatment: a white map field/background, near-black oceans, white/light land and clearly readable charcoal/gray continent and country edges. Do not apply a green/sepia tint, heavy grey highlight wash or decorative map-wide effect. Roads and labels remain neutral and restrained, and any texture must never be used as fake geography or replace a functioning map provider.

The first buyer view should be locally legible without feeling like a dense navigation application. The resting globe may exist as the underlying map state, but when the interface presents `Proche de vous`, the camera may settle into an appropriate local context. The V4.1 treatment remains monochrome at every projection: the remote style is recolored toward white/black/gray where layers exist, and the honest fallback follows the same direction. Camera movement, visible bounds and source-backed pins remain governed by the Root System and Flow.

Public pins remain source-backed and stable. Use a small neutral marker for a selected or featured facility, with a compact uppercase label such as `BOULANGERIE BIO`; do not add a colored glow or decorative selection halo. Do not add availability badges to arbitrary pins. Clustering is allowed at densities where it improves legibility, but the initial reference frame must remain visually sparse and calm.

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

The reference places map controls on the right, not the left. The initial visible group contains `Zoom arrière`, `Zoom avant` and a circular location/recenter control together, with consistent size, spacing, translucency and safe-area placement. The three controls remain visible after every zoom action and do not shift position.

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

The exact first frame is sparse: map, role switch, small account/credit indicator, right controls, one quiet marker/label, search pill and the `Proche de vous` sheet. Canopy V3 adds one non-blocking, permission-aware arrival attempt: when browser permission is prompt or already granted, the browser may request location once per session; denied, unavailable and timeout states remain cancellable with a visible retry. Canopy V4 makes the first mobile frame non-centered: an accepted position may render the distinct user marker, but the map does not recenter until the user explicitly activates `Utiliser ma localisation` or a permitted reveal requires a target. The map and public discovery remain usable without location.

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

The first frame is calm. Idle globe/map movement is slow and interruptible. Under the V4.2 amendment, it may stop only for direct map interaction, a native facility/cluster action or an explicit map control such as location/recenter; focusing search, opening Options or a sheet, opening J5/account, typing or entering a non-map flow must not stop it. Reduced-motion mode disables continuous movement and unnecessary sheet animation.

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

## 16. Canopy V3 amendment — owner re-entry, 2026-08-24

The owner’s re-entry feedback is now a bounded Species amendment, not an alternative product layout. The map remains the dominant full-viewport surface, but its treatment is darker and cleaner so geographic edges read without decorative highlight. Public clusters inherit the density-only rule and use calm concentric discovery rings with the count as secondary accessible text; rings never imply stock, trust, ownership or permission. Facility pins retain the approved pin-with-inner-circle language and may carry a restrained outer location ring.

Manual camera ownership is explicit: native MapLibre drag/pan/rotate/zoom pauses Omni idle motion, preserves the released center/zoom/bearing and never resets to the initial globe. When the pointer leaves the map/context and no surface owns the camera, a delayed resting rotation can resume from the current camera. Search results keep the dock mounted and expose `Nouvelle recherche`, `Affiner` and `Retour à la carte` in a separate result toolbar. Desktop uses a wider bounded bottom sheet and dock breathing room while retaining the mobile hierarchy and prohibiting a side dashboard rail.

Availability remains a single-product server contract in this ring. The UI explains that grouped comparison is planned, but no multi-product request is enabled until a Root/API decision covers grouping, idempotency, expiry, response ownership and recovery. The V3 amendment therefore extends Species without claiming a multi-product write path.


## 17. Canopy V4 amendment — continuous map ownership, 2026-08-24

Canopy V4 tightens the map contract without creating a new layout language. The live camera uses a bidirectional threshold: below `zoom 2.4` it uses `globe`; at or above `zoom 2.4` it uses normal `mercator`. The switch occurs on live zoom events, preserves center/bearing/pitch, and may use a small guard band so repeated wheel events do not thrash the projection. A subsequent zoom-out must return to globe from the current camera rather than reset to the initial world view.

Facility presence belongs to the map’s coordinate system. The preferred visible renderer is a MapLibre-native GeoJSON source/layer path so facilities and clusters are reprojected in the same render cycle as the basemap. If an accessible projected overlay remains during migration, it must track the live `move` event without being hidden and without waiting for `moveend`; a pin that visually disappears while the map is moving is not accepted. This does not change public trust semantics: pins remain source-backed presence, and cluster rings remain density only.

The mobile arrival does not center on the user automatically. Permission-aware location may still produce the distinct marker in bounded in-memory state, but only the explicit location control or an approved search reveal may move the camera to that position. The mobile search input and every text-like field use a platform-safe minimum effective size of `16px` so tapping or focusing text does not trigger viewport zoom. Search focus must not mutate map center, zoom or projection.

The palette is now defined by geographic contrast rather than a global grey wash: dark ocean, lighter land, clear continent/country edges, restrained roads and labels, and no heavy highlight overlay. When a selected facility’s grid or nearby result sheet is closed, selection is cleared and the map returns to its previous non-selected mode. A closed grid must never leave a stale selected pin highlighted on the next map-only state.

## 18. Canopy V4.1 amendment — monochrome reference and map-only motion, 2026-08-25

The owner clarified that the intended map is the established Omni **white/black/gray reference**, not the green-toned Canopy treatment: the map field/background is white, oceans are near-black, continents are white or near-white, and country/continent boundaries are charcoal or restrained gray. Roads and labels remain neutral where the vector style exposes them. Green/sepia tint, heavy gray wash and decorative colored selected-facility halos are not part of the Species map. Any cluster density rings inherit neutral grayscale semantics.

Idle globe motion belongs exclusively to the map interaction surface. Search typing/focus, Options, J5/account and non-map navigation do not stop the globe. Direct map touch/pointer/wheel/pinch/rotate, native facility/cluster actions and explicit map controls may stop it. Primary left-drag orbits around a stable vertical axis: horizontal movement changes longitude responsively, vertical movement changes latitude within a bounded range, pitch remains zero and ordinary left drag does not create unintended bearing drift. Minus, plus and explicit recenter remain visible together in stable order.

The approximate-zone banner is not part of the compact visual Species. Permission-aware location may still render a distinct in-memory marker and accessible status, but automatic arrival does not recenter and must not cover useful mobile map space. Only explicit recenter moves the camera.


## 19. Canopy V4.2 amendment — Africa-globe reference, 2026-08-25

The owner confirmed that the visual reference is the existing Omni globe showing Africa in a black-ocean/white-land composition, with fine charcoal geographic boundaries and a quiet white field outside the globe. The reference is authoritative for the map’s visual composition and zoom behavior. Its heavy dark selected-region highlight and the literal `Votre position` chip are explicitly excluded.

The inherited camera choreography is continent → country → region/city → local facilities. At globe scale the world should remain legible and sparse; as the camera crosses into local mercator scale, streets, neighborhoods and boundaries should become progressively readable. Public facility features remain native MapLibre source/layers and geographically anchored during every camera transform. The user-position treatment is a small neutral in-map marker with accessible semantics, not a permanent visual label.

This amendment supersedes only the prior map visual details that were too washed out or too green. It does not change role, Auth, trust, availability, claim, seller, reviewer, Inbox or Root/API contracts. The Species gate remains open until the reference-matched frames and progressive reveal are proven at compact and desktop widths with no overlap and no fabricated geography.


## 20. Canopy V4.3 amendment — vector globe reference and truthful provider lifecycle, 2026-08-25

The owner’s latest reference text sharpens the Africa-globe direction into a vector-map requirement. The Buyer arrival should use a MapLibre-native vector style in a native globe projection, with a quiet white field outside the globe, dark charcoal water, light continents and fine country/continent contours. Map labels and roads should emerge progressively with the world → continent → country → region/city → local camera choreography. Omni still excludes the reference’s heavy selected-region treatment and literal `Votre position` chip.

The map controller must resolve its MapLibre worker to a stable same-origin build asset before map construction. `style.load` is an intermediate event, not sufficient proof that the vector source is usable; the user-visible active state requires the subsequent loaded/idle path with the vector source available. If the provider does not become usable, Omni shows an honest retry state and does not silently substitute the synthetic raster fallback. This corrects the prior implementation shortcut without changing Root, Auth, trust, availability, Seller, Reviewer or transaction contracts.

The V4.3 Canopy proof remains partial until real result framing visibly exposes local streets/neighborhoods and source-backed native facility features during camera movement at compact and desktop widths. OSM/Overpass enrichment and worldwide coverage claims remain separately gated operations work. Automatic location stays in-memory and non-recentering; direct map interaction alone owns idle-motion pause; permanent minus/plus/recenter controls, mobile input sizing, selection clearing and all privacy boundaries remain inherited.

## 21. Species amendment — Bulk Availability, Wallet and transaction handoff, 2026-08-26

The Buyer value proposition is not “pay to ask one Seller whether a product exists.” Search remains open and free. The new visual focus is the **Bulk Availability composer** that appears contextually after a product search has produced multiple eligible facilities.

### Buyer Bulk states

| State | Primary surface | Required visual behavior |
|---|---|---|
| Search ready | Existing map and search dock | Search remains calm, free and unchanged; no quota language interrupts discovery. |
| Multi-result selection | Result grid or bounded result sheet | Select all/none and individual facilities; show why a facility is eligible; preserve map and query. |
| Bulk constraints | Bottom sheet on mobile, bounded floating panel on desktop | Quantity is prominent; budget/filter context is explicit; private maximum budget is not shown to Sellers by default. |
| Cost preview | Sticky action footer | Show target facility count, estimated availability-credit cost, allowance remaining and the exact effect before confirmation. |
| Running | Progress sheet with per-facility aggregate state | Show queued/responded/partial/failed counts; one failing facility does not erase successful responses. |
| Comparison | Existing response grid extended | Compare availability, quantity, freshness, price/offer and Seller message; eligible intent remains the only private-room transition. |
| Insufficient credit | Recovery sheet | Preserve search, selected facilities and constraints; offer Pro/Wallet path without pretending a charge succeeded. |

A single-facility check uses the existing lightweight form and remains free. The Bulk action must not look like a hidden paywall: its cost is revealed before confirmation, and Free/Pro allowances are explained in plain language.

### Seller states

The Seller sees one incoming demand context per eligible facility, with product, quantity and response controls. The Buyer’s private maximum budget is not displayed by default. The Seller workspace keeps its professional hierarchy: facility context, demand queue, catalogue status, transaction room and scanner entry. A Seller response can be `available`, `partial` or `unavailable`; it must not imply payment, reservation or guaranteed fulfilment.

### Wallet states

The Wallet is a single account-level surface with a currency badge, available balance, platform-credit allocations and a clear “funds Omni capabilities only” explanation. Recharge, pending, confirmed, failed, expired, insufficient-funds and renewal-failed states are designed before a checkout CTA is exposed. Auto-renewal is an explicit toggle with a next renewal amount and currency; when the balance is insufficient, the UI explains expiry and recovery without moving the user into a hidden card flow.

The display currency follows fresh supported location context. The UI must never show a silent conversion or combine XOF, GHS and EUR in one arithmetic balance without an approved conversion policy. If location is unavailable or unsupported, the user sees the fallback currency and can review the policy before recharging.

### Transaction room and QR

After intent creation the transaction room is the canonical surface for both members. The Buyer sees the immutable offer snapshot, scoped chat, approved Seller contact, itinerary and a transaction-bound QR. The Seller sees the same transaction context with Seller actions and receives an Inbox event; optional Push is only shown as enabled when device permission/configuration and delivery proof exist.

The Seller’s scanner is an explicit action inside the Seller workspace. Its states are scanner-ready, permission explanation, camera preview, QR detected, verifying, verified/routed, expired, replayed, mismatch, malformed, denied and manual fallback. A safe authenticated transaction invitation is a second recovery path for a missed notification; it never contains a raw token.

The approved direction is operationally symmetrical but privacy-scoped: both members can resume the room, neither public facility cards nor pre-intent comparison cards expose private contact, chat, route or QR, and chat never advances the transaction state. Seller payout, Buyer-to-Seller in-app settlement and card auto-charge remain outside V1.

### Species gate

This amendment is a new interaction pattern and therefore requires an approved maquette set for the Bulk composer, Wallet surface, transaction room and scanner states before those branches are coded. The existing monochrome globe/map Species remains inherited; this amendment does not authorize a dashboard replacement or a visual-only implementation without Root contracts.

## 22. Species amendment — Seller-distributed facility entry and counter handoff, 2026-08-26

The Seller surface has a second responsibility beyond answering remote requests: it must make Omni discoverable inside the facility. An active Omni offer partner therefore receives a printable facility QR/link surface, offer display guidance and a cashier-oriented verification entry.

### Public facility entry

The facility QR is a calm, printable invitation: `Scannez pour voir les offres Omni ici`. It is displayed at the entrance, on the counter or beside the relevant products. It opens a public facility/catalogue context and preserves the facility, campaign/source and optional product context through install, authentication and return. It is not a transaction QR and never opens private chat, contact or route data by itself.

The landing experience is deliberately short. On mobile it presents the facility identity, the visible Omni offer, the active catalogue and a clear action such as `Voir les offres Omni`. If Omni is not installed, the same link may offer install or web continuation without losing the destination. A user already in Omni goes directly to the facility rather than back through global discovery.

### On-site Buyer surface

The on-site Buyer surface uses the existing map as context but moves the product decision into a focused facility sheet. It shows facility name/status, offer badge, product search within that facility, product cards, quantity, gross price, discount and net price. It does not show Bulk Availability controls because the Buyer is already at the facility and is not asking remote Sellers for evidence.

The primary action is `Activer l’offre Omni`. After server validation, a compact confirmation state shows the immutable offer snapshot and `Présenter à la caisse`. The transaction QR is then shown with the facility, product, quantity, net price, expiry and a short instruction: `Le vendeur scanne ce code dans Omni.`

### Seller cashier surface

The Seller workspace has a persistent `Scanner Omni` action, reachable without opening the public catalogue. The scanner surface is designed as a focused operational flow: ready → permission explanation → camera preview → QR detected → verifying → verified. The verified card emphasizes what the cashier must act on: facility, product, quantity, gross price, discount, net price and expiry. It includes `Accepter l’avantage`, `Refuser` and, after physical payment, `Paiement reçu / Finaliser la vente`.

The visual copy must distinguish validation from payment. A verified QR means that the transaction and offer are valid; it does not mean Omni transferred funds. The Buyer pays the Seller through the Seller’s accepted method. The Seller’s final action records acknowledgement and fulfilment in Omni. Expired, replayed, mismatched, malformed, denied-camera and manual-fallback states are explicit and non-destructive.

### Seller activation contract in the Species

A facility cannot be presented as an active Omni offer partner unless it has an owner/manager context, at least one active offer and a catalogue state that can be read by Buyers. Omni generates a facility QR/link for every eligible facility, but display, printing or social sharing by the Seller is voluntary. The Seller workspace must expose offer pause/edit, catalogue/product edit, QR/link sharing and cashier scanner entry as first-class actions. A public facility may remain map-visible without these capabilities only under a clearly different `listed / no active offer` state.

After a fulfilled transaction, the Buyer enters a required post-transaction review step before the receipt/rating flow is considered complete, subject to an accessible skip/report path for abuse, privacy or inability to review. Reviews must be attached only to eligible transaction outcomes and must not be purchasable or generated from scans alone. Verified reviews, transaction count and offer activity strengthen the Seller credibility surface; failed, cancelled or unfulfilled attempts do not create a positive review.

This amendment adds a distribution loop, not a dashboard. The map remains the discovery surface, the facility QR is the bridge from physical presence to Omni when the Seller chooses to distribute it, the Buyer offer sheet is the purchase decision surface and the Seller scanner is the counter handoff surface. Each surface inherits the Species spacing, monochrome map, safe-area behavior and restrained motion rules.
