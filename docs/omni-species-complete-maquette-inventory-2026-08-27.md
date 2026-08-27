# Omni V2 — Complete Species Maquette Inventory

**Status:** Seed/Species reset — visual work before implementation
**Product frame:** Omni is a global supply-and-demand search engine for local commerce. The Buyer globe/map is the landing and primary identity.

## 1. Product hierarchy

The first-time and returning user experience follows one dominant loop: **open Omni → see the living globe/map → search or scan → compare supply → inspect freshness and price → verify availability → decide whether to buy → complete a secure transaction**. Seller and Admin are contextual workspaces, not the landing navigation.

## 2. Complete screen/state matrix

| Area | Required screens and states |
|---|---|
| Buyer landing | First load, map loading, map active, raster fallback, location unavailable, location permission prompt, location granted, location denied, idle globe rotation, map touched/rotation stopped, empty globe, network error, retry |
| Buyer search | Search idle, keyboard open, typing, suggestions, no results, results on map, list/map sheet, filters quantity/budget/distance, currency by location, stale data, fresh data, unavailable result, loading, error, retry, clear search |
| Buyer facility discovery | Public facility sheet, claimed/certified/confirmed badges, unclaimed facility, offer list, product detail, no products, product unavailable, public QR landing, invalid QR, expired link, share action |
| Bulk Facility | Pro explanation, quota/credits, facility selection, estimated credit cost by ask size, confirm spend, progress, partial responses, all responses, stale responses, no matching facilities, insufficient credits, retry/cancel, purchase more credits |
| Manual availability | Request form, quantity/budget constraints, free request confirmation, pending Seller response, fresh response, stale response requiring recheck, available, partial, unavailable, expired, notification, retry/cancel |
| Buyer cart/intent | Product detail, add line, multi-product same facility, multi-product constraints, cart review, edit quantity, remove line, price/discount summary, stock allocation warning, create intent, intent created, verification pending, Buyer decision `Je veux acheter`, blocked until verification, duplicate/retry |
| Transaction | QR generated, QR public/transaction distinction, share QR/link, Seller scans, Buyer shows QR, Seller verification success/failure, chat unlocked, itinerary, Seller contacts, payment choice, external payment pending/success/failure, Seller confirms payment, fulfilment pending, fulfilled, Buyer received, rating required, rating submitted, closed, cancelled, expired, recovery |
| Buyer Pro/Wallet | Free plan, Pro offer, plan comparison, wallet empty, recharge, checkout pending/success/failure, Bulk credits balance, credit consumption, bonus/credits history, currency display, locked action |
| Seller entry | Not a Seller, become Seller, onboarding, account suspended, capability loading, capability error/retry, role-aware menu |
| Company management | No companies, company list, company selected, create company, edit company, archive confirmation, duplicate name/error, company loading/error, invite/manage access if enabled |
| Facility management | Facility list, facility selected, create facility stepper, draggable map, explicit location permission, address search, public/private review, draft, submitted, in review, needs evidence, rejected, certified/unconfirmed, confirmed 3/3, archived, duplicate/claim conflict |
| Facility claim | Unclaimed public sheet, claim eligibility, claim draft, private evidence upload, consent, submit, claim pending, reviewer request, resubmit, rejected with actionable reason, certified handoff |
| Seller catalogue | Empty catalogue, Free five-product limit, Pro unlimited catalogue, create draft, edit draft, required discount, invalid discount, publish, archive, limit reached, loading/error/retry |
| Omni-allocated stock | Stock overview per facility/product, allocate quantity to Omni, edit allocation, zero allocation, stale observed timestamp, absolute Pro automation setting, insufficient allocation, decrement after sale, conflict warning, audit history |
| Seller availability | Queue empty, incoming manual request, Bulk response queue, fresh auto-response, stale manual verification, available/partial/unavailable response, response expired, duplicate request, notification, retry |
| Seller transaction | Intent notification, intent detail, verify Buyer QR, scan QR, correct transaction, wrong/expired QR, chat, confirm payment, fulfilment, buyer received, rating pending, closed, dispute/cancel/recovery |
| Seller Pro/Wallet | Facility-scoped Free, Pro $10/facility, activation, bonus 20 $ available after 3 verified sales, eligible services, reserve/spend bonus, expired/locked bonus, wallet ledger, recharge, checkout states |
| Admin/Reviewer | Staff-only entry, capability loading/error, review queue, creation vs claim tabs, evidence viewer, history, certify, request evidence, reject, reason required, audit confirmation, role management, operator/reviewer assignment, suspend/reinstate, unauthorized, audit log |
| Shared/system | Auth sign-in, sign-out, session expired, offline, network retry, permission prompts, camera prompt, QR camera denied, clipboard/share fallback, keyboard/safe-area states, reduced motion, responsive 320/390/768/1280 layouts |

## 3. Visual direction proposal

The modern direction is **living cartography**: a calm monochrome globe with a luminous but restrained local-supply signal, a highly polished search dock, fluid map-to-sheet transitions, and small moments of green confirmation only when the system has verified something. The interface should feel closer to a new global discovery instrument than to a conventional marketplace dashboard. White space, depth, glass-like sheets, strong typography and map motion create desire; data freshness and price remain visually legible and sober.

The product must never make the map decorative. It carries discovery, proximity, trust, and the transition from an abstract need to a real local facility. The UI should also make the difference between public facility QR and transaction QR unmistakable at a glance.

## 4. Species gate

The Species is not accepted from prose alone. Acceptance requires visual maquettes for the landing and every critical state in the matrix, with mobile-first responsive variants and clear inheritance where a state uses the same screen structure. The founder must approve the visual language and the screen set before Root contracts are revised or UI code is changed.

**Current stop condition:** generate and review the complete visual set. No additional UI implementation until acceptance.

## 5. Maquettes générées dans cette passe

La direction moderne Buyer-first a été déclinée en maquettes visuelles pour la landing globe/carte, la permission refusée, la recherche sans résultat, la fiche facilité/produits, Bulk Facility, panier/intent, intention créée, disponibilité confirmée, QR transactionnel/chat et paiement/fulfilment. Ces écrans restent des propositions Species jusqu’à validation du fondateur.

L’écran final `réception → avis obligatoire → transaction clôturée` reste à générer : la limite quotidienne de génération visuelle a été atteinte pendant cette passe. Il ne faut pas interpréter cette absence comme une validation de l’écran ; il sera produit au prochain quota ou avec un outil de maquettage déterministe si le fondateur le préfère.
