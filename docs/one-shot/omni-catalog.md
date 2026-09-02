# Omni Catalog — Locked Product, UI and Flow Decisions

> **Purpose.** This is the navigational catalog of what Omni is, what each level owns, and how every route, page, sheet, card and transaction state must behave. The canonical master remains the normative source; this catalog is its screen-by-screen index and audit map.
>
> **Working status.** The codebase and documents are in a bounded implementation state. A decision can be locked while its proof or implementation remains partial. `Implemented` means present in the active code path; `Manual` means the user-facing capability exists but a human or external process completes part of it; `Deferred` means it must not be added to the current slice.

## 1. Omni identity

Omni is a **global geospatial supply-and-demand search engine** whose primary interface is a live MapLibre globe/map. It is not primarily a marketplace grid, social network, directory, generic chat application or decorative globe. Its distinctive loop is **search → discover source-backed facilities → inspect facility and catalogue → verify availability → compare real responses → create purchase intent → use the authorized transaction room and QR → record external payment and fulfilment → confirm receipt → rate → improve discovery data**.

The facility is the core supply object. The product/service catalogue is the bridge between a spatial facility and a buyer request. The map is always the scene; sheets and cards are temporary stateful surfaces above it. Every sensitive transition has a named server-authoritative unlock.

## 2. Scope levels

| Level | Locked decision | Current status |
|---|---|---|
| Product identity | Map-first geospatial search, not conventional ecommerce | Implemented/locked |
| Map engine | MapLibre GL v5 globe projection and the same map instance through local discovery | Implemented/locked |
| Buyer core | Search, facility discovery, catalogue-first selection, availability, comparison, intent | Implemented in bounded slices; end-to-end proof partial |
| Transaction | Intent, QR, authorized room/timeline, external payment declaration, fulfilment, receipt, rating | Implemented in pieces; canonical convergence slice required |
| Certification | Claim request and evidence never change status; audited outcome does | Implemented/locked; admin/device proof partial |
| Seller V1 | Map-first facility workspace, onboarding, requests, catalogue/coupon, scanner, operational transaction states | Partially implemented; convergence required |
| Wallet | One rechargeable Omni Wallet; FedaPay recharge only; spend on Omni subscriptions/features/ads/credits; no withdrawal | Locked; implementation/proof must be reconciled with the master scope gate |
| AI | Agent is an orchestration layer over already-working manual actions | Deferred until manual loop is proven, except existing manual adapter seams |
| Native mobile | Web/PWA is the immediate mobile product; native app is deferred | PWA/build-manual |
| Global coverage | Viewport-bounded public OSM/Overpass backfill, not instant world prepopulation | Implemented/locked; coverage observability partial |

## 3. Global trust and authority

| Fact | Authoritative actor/system | Allowed transition or payload |
|---|---|---|
| Public facility location/name/category | Public source or server discovery adapter | May appear on map/card; does not prove supply |
| Facility status | Audited server mutation | `unclaimed` remains public; only review can produce `certified` or `unconfirmed`; completed sales can later produce `confirmed` |
| Product identity/price/stock | Facility catalogue and server validation | Catalogue `productId` is preserved; client text is not authority |
| Availability answer | Seller/manual/approved auto-response server path | `available`, `partial`, `unavailable`; check does not reserve allocation |
| Purchase intent | Buyer action through idempotent server function | Creates one transaction context and authorized unlocks |
| QR validity | Server-generated token, expiry and replay state | Buyer presents; seller verifies through camera/manual path |
| Payment | Buyer/seller external method and explicit declarations | Omni records state; Omni does not process buyer-seller money in V1 |
| Fulfilment/receipt | Seller action plus buyer confirmation | Transaction advances only through authorized actor/action |
| Rating | Buyer after receipt/completion | Appends outcome; cannot unlock earlier private data |
| Wallet balance | Server-confirmed ledger/FedaPay deposit | Spendable only after confirmed; no seller withdrawal |
| Analytics | Consent-aware event pipeline | Minimized, pseudonymous and separated from private chat/payment secrets |

## 4. Navigation and composition

The application is a stateful map interface, not a chain of disconnected pages. The active map canvas remains mounted while dock, result cards, facility detail, catalogue, availability, comparison, intent and transaction sheets open. Top-right chrome contains notifications and the hamburger menu only. The menu is a typed action registry with no dead placeholders. A role switch snapshots supported context and restores it when the destination route can represent it.

The surface hierarchy is `MAP → CHROME → DOCK → RESULT CARD/RAIL → FACILITY SHEET → CATALOGUE SHEET → AVAILABILITY SHEET → COMPARISON → TRANSACTION ROOM`. A sheet has explicit loading, ready, empty, error, retry, cancellation and close/back behavior. All sheets use the shared Omni primitive: bottom anchored on mobile, bounded floating/centered on desktop, scrollable body and reachable footer action.

## 5. Map and globe decisions

| Feature | Locked behavior |
|---|---|
| Resting globe | Real MapLibre globe, sparse geography, slow horizontal rotation; no decorative substitute or flat fallback |
| Camera priority | `manual interaction > selected facility focus > active search reveal > result framing > idle rotation` |
| Arrival | No automatic search zoom. Location prompt may appear without blocking the globe; exact/approximate/fallback are distinct |
| Search reveal | Explicit search/category/restored search/retry may trigger cancellable continent/country/region/town/result choreography |
| Pins | Source-backed only. At global/low zoom use clusters; at local result zoom show relevant individual pins. Never fabricate a pin |
| Selection | Selected pin/card opens facility detail and preserves viewport/context |
| Highlight | Black/near-black boundary highlight only when the matching asset and geographic level exist; no false highlight |
| Location marker | Blue personal marker only from fresh browser fix with acceptable accuracy; approximate network context is neutral and not called exact |
| Coverage | Visible MapLibre bbox to server; Free/Pro scope, antimeridian and OSM backfill server-authoritative |
| Interaction | Drag/zoom/recenter/keyboard/search focus pauses rotation and cancels active reveal ownership |

## 6. Buyer screen catalog

### `/` and `/carte` — map-first buyer

**Purpose:** Let a visitor understand Omni immediately and search without a marketing landing page. The globe is the background, the dock is the main input, and the top-right menu/notifications are minimal.

**Locked surfaces:** MapLibre scene, left map controls, one bottom dock, optional result rail, facility overlays, location context and transaction resume bar. No legacy global navbar, large centered location card, or stacked quantity/budget controls.

**States:** `idle_globe`, `locating`, `location_exact`, `location_approximate`, `fallback_market`, `search_reveal`, `results_visible`, `empty_results`, `facility_selected`, `availability_open`, `transaction_resume`.

### Buyer dock

The dock has one search row and one **Options** chevron. Categories, open-now, radius, discounts, sort, quantity, budget, location mode and retries are inside that one surface. Quantity and budget are silent until relevant, editable, and budget may be unlimited. Typing does not change the map view. Search Enter and the search button share one guarded submit path.

### Result card/rail

A result card is contextual to the query. It shows matched product first, media when available, facility identity, public trust/status, distance, price/offer, product count and one next action. Clicking selects the facility only. It does not claim, request availability or create intent.

### Facility detail sheet

A selected facility opens a public detail surface above the map. It shows facility identity, media, search context, status/trust, address, public hours/open state, matched product and product count. `Voir les produits` opens the dedicated catalogue. `Vérifier la disponibilité` is a separate action. Unclaimed facilities show public content plus `Demander une vérification`; they cannot expose private contact, itinerary, chat, QR or purchase actions.

### Catalogue sheet

The catalogue loads real active products from the selected facility, places the matched product first and provides explicit selected state. It shows name, photo, price, discount/offer state and quantity eligibility. Empty, sold-out, error and retry states are explicit. Selecting a product returns a typed `ProductSelection` to availability; it does not create a demand by itself.

### Availability sheet

The availability surface has named stages: `Produit → Portée → Contraintes → Réponses`. Product selection is catalogue-first; fallback text is allowed only when no catalogue product is selected. Free manual mode targets one eligible facility; Pro bulk targets bounded visible facilities under server entitlement. Quantity and private budget remain editable and camera-inert. A check does not reserve stock.

### Comparison

Responses are ordered `available → partial → unavailable`, then price. Each response shows facility, product, freshness, quantity, price, offer and seller message. The best eligible response may be highlighted. Only eligible responses show the intent CTA. Comparison does not unlock contact.

## 7. Verification and seller onboarding catalog

### Seller entry/onboarding

The seller is taught the facility lifecycle before being asked to enrich data. A user may select a public unclaimed facility or create a new facility. The click creates a **verification request**, not a claim and not a status transition. The seller supplies identity, facility/company/product evidence. Drafts persist; submission is idempotent.

### Facility states

`unclaimed → verification_requested → evidence_draft → evidence_submitted → admin_review → certified | unconfirmed | rejected → confirmed after eligible completed sales`. Only audited server review creates `certified` or `unconfirmed`. A rejected request keeps the facility unclaimed or returns it to the appropriate pending state; it does not silently become operational.

### Admin review

Admin sees a pending evidence queue, claimant/facility context, evidence stages and audit history. Review outcomes are explicit `certified`, `unconfirmed` or `rejected`, with reason and actor. Generic direct status mutation cannot bypass review authority.

## 8. Seller workspace catalog

The seller workspace remains map-first and facility-first. The map shows seller-owned facilities and operational state. The primary operational surfaces are facility, products/catalogue, received demands, scanner QR, coupons and advertising when functional. Secondary account surfaces include wallet, subscription and settings only when real callbacks exist.

Product creation must be clear and catalogue-oriented. Every published product satisfies the discount constraint and displays an honest offer state: active coupon/offer or `Aucune remise active`. A product may create a coupon in the same guided form, but a client cannot fabricate discount/redemption state. Quantity allocated to Omni cannot exceed real stock.

## 9. Transaction room and chat catalog

The transaction room is the only authorized transaction surface. It is not a generic inbox. It is scoped to one demand/offer/transaction and shows product, facility, quantity, gross price, Omni discount/coupon snapshot, net amount, QR reference, next action and event timeline.

The canonical timeline is:

`Intention créée → Offre confirmée → Coupon appliqué (if applicable) → QR généré → Vendeur vérifié → Mode de paiement choisi → Paiement déclaré → Paiement reçu → Fulfilment → Réception confirmée → Avis publié → Transaction terminée`.

Buyer and seller see different primary actions according to actor and persisted state. Contact, itinerary, private chat and seller-sensitive transaction information unlock only after a successful purchase intent. The transaction room can be closed and resumed from notifications, menu, orders or context snapshots without losing state. A chat message is allowed only when the participant is authorized for that transaction/demand. System messages are generated from server events; client text cannot advance the transaction.

## 10. QR, external payment and fulfilment

The buyer QR is generated at the approved intent/transaction point, has an expiry and is replay-safe. The seller verifies it by camera when permission and `BarcodeDetector` are available, or by manual code fallback. Verification is idempotent; replay, expired, malformed and wrong-transaction codes have explicit rejection states.

Omni does not process buyer-seller payment inside V1. The buyer chooses cash on delivery, TMoney, Flooz or another external method. The buyer declares payment; the seller confirms receipt. Pickup is represented by Omni; delivery is coordinated between buyer and seller. After fulfilment the buyer confirms receipt, then rates. No payout/withdrawal is exposed to sellers.

## 11. Wallet and plan catalog

There is one rechargeable **Omni Wallet**. FedaPay is for wallet recharge only. The wallet can fund subscriptions, Pro access, advertising, coupon/ad credit and other platform consumption according to server-confirmed buckets/ledger rules. It is not the buyer-seller payment rail and sellers cannot withdraw from it in V1. Balance displays distinguish available, pending and platform-restricted credits. No client can display a deposit as spendable before server confirmation.

Free/Pro is an entitlement surface, not a trust shortcut. Pro may unlock bulk availability, scope, limits, analytics or automation where explicitly active; it cannot manufacture facility certification. The $20 seller credit is a non-cash platform bonus tied to the confirmed/eligible sales rule and is unavailable until the server unlocks it.

## 12. Notifications, auth, PWA and data

Notifications are transactional and deep-link to a valid context: availability, response, intent, QR, payment, fulfilment, certification or account. Auth redirects preserve query, category, filters, quantity, budget, selected facility, selected product, request and return route. Sign-out clears private context.

The web app is the immediate PWA mobile product. It uses dynamic viewport and safe-area spacing, network-first private transaction data and non-disruptive install prompts. Offline discovery context may be cached; real-time availability, wallet, payment, QR and transaction completion require visible connectivity.

Analytics are consent-aware and minimized. Omni may collect pseudonymous search, facility/product open, availability, chat/intent, QR, payment, fulfilment, rating, coupon and wallet events at appropriate geographic precision. Raw GPS, private chat contents, QR tokens and payment secrets are not generic analytics payloads.

## 13. Page ownership map

| Route/surface | Owns | Must not own |
|---|---|---|
| `/`, `/carte` | Buyer map, dock, result rail, facility selection, catalog/availability overlays | Seller operations, generic chat, private contact before intent |
| `/auth` | Sign-in/up and restoration intent | Dropping search/product/transaction context |
| `/onboarding` | Progressive buyer/seller education and required identity/context | Claim/status mutation or unrelated dashboard density |
| `/vendeur` | Seller map-first workspace, facilities, requests, products, scanner, coupons and valid account surfaces | Buyer map discovery or dead placeholder menu actions |
| `/admin` | Evidence review, audit and controlled outcomes | Direct generic status bypass |
| `/transaction/$id` | Authorized transaction room/timeline/chat and actor action | Public messages or unscoped conversation |
| `/transaction/qr` | QR verification entry and camera/manual fallback | In-app payment or arbitrary QR decoding |

## 14. Proof catalog

| Proof class | What it can prove | What it cannot prove |
|---|---|---|
| Unit tests | Pure state, ordering, idempotency helper and boundary logic | Real MapLibre paint, camera, GPS, camera permission or production data |
| Type/build/client boundary | Compile/build and trust-boundary hygiene | Authenticated behavior or real device UX |
| Public smoke | Route availability and status codes | Buyer/seller transaction authorization |
| Authenticated browser | Real route/session click-through and context restore | Physical camera optics unless browser is camera-capable |
| Real mobile/camera | Permission, preview, QR decode and replay | Production database outcome unless connected to production-safe fixture |
| Production E2E | Real transaction loop and audit records | Future deferred scope |

## 15. Explicit non-goals for the current catalog

Omni does not become a generic social chat, a seller withdrawal/payment processor, a marketing landing page, an unrestricted global data dump, a decorative globe, a generic ecommerce cart checkout, an AI chatbot before manual proof, or a page full of disabled promises. Any such feature requires a master patch and its own one-shot package.
