# Omni Locked Decisions Inventory — 2026-08-21

> This register answers: **what is locked, where it appears, who owns the truth, what the screen must look like, and what evidence remains**. The canonical master owns the decisions; this is the index.

## A. Product and scope decisions

| Decision | Locked rule | Source/authority | Affected surfaces | Status |
|---|---|---|---|---|
| Omni identity | Global map-first supply/demand search engine | Master §0, §0.8.4 | All routes | Frozen |
| Core loop | Search → facility/product → availability → intent → authorized room/QR → external payment → fulfilment → rating | Master §0.5.2, §0.8.4 | Buyer/seller transaction | Frozen |
| Statefulness | One MapLibre scene with overlays, not isolated page chain | Master §0.8.1–§0.8.4 | `/`, `/carte`, `/vendeur` | Frozen |
| AI | Agent orchestrates proven manual actions; not general chatbot | Master §0.5, §0.7 | Buyer Pro/seller future | Deferred |
| Payment rail | No buyer-seller in-app payment; external/manual only | User decisions, master §0.7.5/§0.8.4 | Transaction room | Frozen |
| Wallet | One rechargeable Omni Wallet; FedaPay recharge only; no seller withdrawal | User decisions, master §0.8.4 | Wallet/account surfaces | Frozen |
| Release honesty | Partial until authenticated/device/production proof is admissible | AI delivery method | Handoff/ledger | Frozen |

## B. Navigation and common chrome

| Surface | What it must show | What it must not show | Authority | Evidence |
|---|---|---|---|---|
| Top chrome | Notifications + hamburger, role/context aware | Legacy global navbar, dead placeholders | Route action registry | Public + responsive |
| Menu | Functional actions only, one role switch, context preservation | Placeholder Profile/Plan/Balance/etc. without callback | `OmniMenuAction` registry | Unit + browser |
| Map controls | Zoom, recenter and location group, not covered by dock/menu | Overlapping chevron/control | Map controller | Responsive |
| Sheets | Shared OmniSheet: bottom mobile, bounded desktop, scrollable body, reachable footer | Right-side or competing sheet variants | UI system/master | Responsive |
| PWA shell | Dynamic viewport, safe-area, optional install prompt | Blocking install or private offline cache | PWA contract | Mobile browser |

## C. Map/globe

| Feature | Locked decision | Code/authority | Affected state |
|---|---|---|---|
| Projection | MapLibre GL v5 globe/mercator, same instance | `MapCanvas`, `maplibre.ts` | All map states |
| Idle | Slow horizontal rotation, sparse geography, reduced-motion aware | Map camera state | `idle_globe` |
| Camera priority | Manual > selected facility > reveal > framing > idle rotation | `map-globe-state.ts` | Reveal/selection |
| Arrival zoom | No automatic discovery zoom on arrival | `MapCanvas`/master §0.8.2 | Idle/location |
| Reveal | Explicit submitted/restored search/category/retry only; cancellable tokens | `MapCanvas` | Search reveal |
| Pins | Source-backed; clusters at global/low zoom, individual relevant local results | Map data adapter | Results |
| Highlight | Black/near-black only with matching boundary asset | Boundary loader | Reveal |
| Location | Exact marker only from fresh accepted GPS; approximate/fallback neutral | Location functions | Location states |
| Coverage | Server bbox/scope, OSM bounded backfill, no fabricated global dataset | `listFacilitiesInBounds` | Discovery |

## D. Buyer discovery and availability

| Screen | Locked decision | Primary action | Sensitive data rule |
|---|---|---|---|
| Buyer dock | One search row + one Options chevron; quantity/budget quiet until relevant | Submit search / open Options | No private data |
| Result rail/card | Matched product first, facility context, status, media, price/offer, distance | Select facility | No contact/intent |
| Facility detail | Public identity/status/media/hours + matched product + catalogue entry | `Voir les produits` or `Vérifier la disponibilité` | Unclaimed remains public-only |
| Catalogue | Real products, matched first, selectable product, empty/sold-out/error/retry | Select product | No private seller fields |
| Availability | `Produit → Portée → Contraintes → Réponses`; catalog-first product ID | Submit request | No contact/QR/chat |
| Comparison | Available → partial → unavailable then price; best eligible highlight | Intent eligible response | No contact until intent |
| Intent confirmation | Product, facility, quantity, server amount, offer/coupon snapshot | Confirm purchase intent | Server recalculates |
| Auth return | Query, filters, quantity, budget, facility, product and request restored | Resume | Session TTL and privacy-safe |

## E. Facility verification and onboarding

| State | Meaning | Can publish? | Authority |
|---|---|---|---|
| `unclaimed` | Public source or new facility not reviewed | No controlled listing/availability/intent | Server/public data |
| `verification_requested` | Request exists; no status promotion | No | Idempotent request helper |
| `evidence_draft/submitted` | Claimant evidence workflow | No until outcome | Claimant + server |
| `admin_review` | Staff evaluates evidence | No | Staff review queue |
| `certified` | Evidence passes threshold | Limited V1 operation as contract allows | Audited review |
| `unconfirmed` | Evidence reviewed, limited operation | Limited listing/operation | Audited review |
| `confirmed` | Approved completed-sales rule met | Confirmed features | Server sales rule |
| `rejected` | Evidence rejected; reason recorded | No | Audited review |

A claim click never directly changes a facility status. A Pro payment never creates trust. Every outcome stores actor, timestamp, reason and evidence reference.

## F. Transaction room/chat

| Timeline state | Buyer primary action | Seller primary action | Chat/contact |
|---|---|---|---|
| Intent created | Review room/QR | Open request/room | Authorized room opens; contact unlocks per intent |
| QR generated | Present/share QR | Scan/enter code | Scoped system/user messages |
| QR verified | Choose external payment | Await/deal with payment | Contact/itinerary available |
| Payment pending | Declare external payment | Review/confirm/reject | Scoped |
| Paid | Follow fulfilment | Start fulfilment | Scoped |
| Fulfilment | Confirm receipt | Update delivery/pickup | Scoped |
| Received | Rate | Read outcome | Scoped until terminal policy |
| Completed | Read-only timeline | Read-only timeline | No new action |

Transaction chat is never a generic inbox. System timeline events are server-generated. QR, contact, itinerary and payment fields are omitted before authorization.

## G. QR and camera

The scanner has camera permission, visible live preview, detection, verification pending, success, expired, replay, wrong transaction, malformed, denied/no camera and manual fallback states. Camera and manual code call the same server verifier. A successful browser permission grant without a visible preview is not accepted as camera proof.

## H. Seller workspace

The seller map shows seller-owned facilities and operational state. The main V1 actions are facility, products/catalogue, incoming requests, scanner QR, coupons and advertising only where functional. Product forms are simple and catalog-oriented; stock allocated to Omni cannot exceed real stock; discount/offer state is honest. Seller views do not expose buyer private data outside authorized transactions.

## I. Wallet and plan

The one Omni Wallet has `pending deposit`, `available balance`, `platform credit` and `transaction amount` as separate concepts. FedaPay recharges only the wallet. Platform spend may include Pro, ads, coupon/ad credit and enabled Omni features. No seller withdrawal. Pro is capability/entitlement, never trust status.

## J. Data/analytics

Events include onboarding, search, results/facility/product views, availability request/response, intent, chat/message, QR generated/verified, payment declaration/confirmation, fulfilment, receipt, rating, coupon and wallet deposit. Consent, minimization, retention, deletion/export and audit apply. Raw GPS, chat content, QR tokens and payment secrets are not generic analytics.

## K. Proof status

| Evidence | Required for full clearance | Current class |
|---|---|---|
| Unit/state tests | Pure transitions, ordering, replay/idempotency helpers | Local |
| Build/boundary | Type/build/client server separation | Local |
| Public smoke | Route availability | Public |
| Authenticated flow | Buyer/seller role and context restoration | External session |
| Responsive matrix | 320/390/768/1024/1280 | External browser |
| Camera/QR | Real permission, preview, decode, replay | Real device/browser |
| Transaction E2E | Intent → QR → external payment → receipt → rating | Authenticated production-safe fixture |
| Location consent | Exact/approximate/fallback + discovery city | Production session |

## L. Deferral list

Seller withdrawals, buyer-seller in-app payments, generic social chat, AI agents before manual proof, native mobile, offline real-time transaction completion, unrestricted world prepopulation, 3D/media discovery and future advertising automation remain deferred unless the master scope gate is explicitly patched.
