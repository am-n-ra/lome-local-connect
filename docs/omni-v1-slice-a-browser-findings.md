# Slice A Browser Findings — local certification

**Environment:** local Vite app at `http://localhost:8084/`  
**Date:** 2026-08-19

## Observed success

The initial buyer scene renders a real MapLibre canvas and exposes the intended map controls: zoom in, zoom out, and approximate-market/recenter control. The top-right chrome shows notifications and menu rather than a permanent global navigation bar. The bottom search dock is visible with search input, voice affordance, search action and parameter chevron. The browser permission state is surfaced as `Autorisez votre position…`, confirming the new distinction between native permission prompt and generic location loading. The page reports `Chargement du globe MapLibre…` while the real canvas initializes, rather than presenting a decorative substitute.

## Remaining browser proof

The local observation has not yet proven a successful geolocation callback, precise-versus-approximate marker behavior, search submission, auth replay, result pins, facility close/back restoration, second-search cancellation, staged reveal completion, or the 320/375/768/1280 viewport matrix. Those remain Slice A acceptance items and must not be marked verified based on the initial screenshot.

## Search interaction findings

The local session accepted the typed `ciment` query and the visible search action changed the scene into a staged reveal, with a visible `Continent` label and the MapLibre globe enlarged toward Africa. The query remained visible in the dock and the action row changed to `Dites-nous ce que vous cherchez` with `Créer une demande`, confirming that the query was not lost and the result/request surfaces did not stack over the query field.

This browser session was already authenticated or had an existing restored transaction context: it showed `2 transactions en cours` rather than redirecting to `/auth`. Therefore this interaction proves the authenticated search/request presentation only; it does not prove the unauthenticated auth gate or replay path. The scene also showed `Localisation indisponible` with retry and approximate-market actions, which is truthful but still requires a separate permission-denied and fresh-callback certification.

## Results and facility selection findings

The staged reveal completed and showed two individual source-backed facility result cards over the map. Each card foregrounded the searched product `ciment`, displayed `Correspondance à confirmer · achat non disponible`, identified the facility as `Découverte OSM · non réclamée`, showed distance and `Disponibilité à vérifier`, and kept the buyer-facing action away from direct purchase/contact.

Opening the first card preserved the map behind a centered responsive sheet and showed the unclaimed state, no public media, no published products, no offers, and the claim action. This confirms the core trust boundary visually. However, the selected unclaimed facility did not show an availability CTA in the sheet, which is consistent with the current trust rule but means the manual availability path still needs certification on a claimed/certified fixture. The browser proof also confirmed that the result cards and sheet are readable in the current viewport, but it did not certify narrow mobile widths or authenticated replay.

## Availability handoff finding

Closing the facility sheet restored the same result cards, query and map context. Opening the result-level availability action produced a centered `Demande groupée` sheet with the query preserved, a three-step `Produit → Commerces → Contraintes` flow, and an explicit `Continuer` action. This confirms the overlay is map-backed and reversible.

The sheet currently presents `Demande groupée` before proving the buyer plan in the visible copy. The server now rejects bulk for Free and permits it for Pro, so Slice B must add a truthful plan-aware UI state rather than relying on a generic server error. This is recorded as an open Slice B UI task, not a Slice A failure.

## Post-entitlement refresh

After the entitlement UI/server commit, the local comparison sheet closed cleanly and restored the same search result rail and query. The existing comparison state was retained by the session, so a fresh entitlement message was not visible until reopening a new availability flow. This is a test-harness state detail rather than a product failure; a clean fixture is still needed to certify the Free plan branch explicitly.

## Entitlement fixture limitation

The current authenticated browser session keeps an existing comparison request in the availability panel. The visible `Nouvelle vérification` control did not reset the server-backed comparison state immediately in this read-only session, so the Free/Pro explanatory copy at step 2 could not be isolated without a clean test account or fixture. This is a certification limitation, not evidence that the server gate is absent; the unit/build proof and source contract are already recorded.

## Seller browser audit finding

The local authenticated buyer session does not authorize the seller shell. `/vendeur` renders `Espace vendeur indisponible — UNAUTHORIZED` with only `Réessayer`. This prevents a valid seller visual audit in the current browser session and confirms that seller certification requires a separate seller-role fixture or authenticated session. Do not infer seller visual readiness from static source inspection alone.

## Post-repair production observation

The deployed production route `https://omni.sparkafrika.online/` loaded the MapLibre globe and authenticated buyer surface after the application-data repair. The session shows two resumable transactions and 14 notifications; browser location is blocked in this session, so no location claim was made. This proves route/map shell availability only, not seller certification or a complete transaction E2E.

## Post-repair seller certification

After relinking the five legacy facilities to the current Neon Auth profile, the deployed `/vendeur` route loaded successfully in the authenticated browser session. It displayed `Épicerie Adidogomé Plus`, the map-first seller shell, Facility/Catalogue/Demandes reçues/Scanner QR/Omni Wallet/Coupons surfaces, five products, two demands and two coupons. This resolves the previous `UNAUTHORIZED` shell blocker for the current demo identity. Full two-session transaction and camera proof remain separate acceptance items.

## Seller catalogue and scanner surfaces

The deployed seller Catalogue tab is reachable and shows a clear product creation form with name, price, quantity, media URL, publish action and five existing products. The Scanner QR tab is reachable and presents an explicit `Autoriser et démarrer la caméra` CTA, manual 8-character fallback, a visible dark camera viewport reserved for the feed, recent transaction states and the V1 boundary that Omni does not process in-app seller payments or withdrawals. Camera permission and actual QR decoding were not triggered in this read-only certification.

## Seller wallet and coupon surfaces

The deployed Omni Wallet surface now clearly states that there is one rechargeable wallet, with allocations to Pro, Publicité and Coupons; it shows a 42,000 FCFA wallet balance, zero allocated amount and no seller withdrawal or buyer-seller in-app payment in V1. The Coupons surface is reachable with a simple code/percentage/description form and two existing offers. No recharge, allocation, coupon creation or deletion was executed.

## Certification buyer session

A distinct authenticated account is now connected. Read-only database checks show its owner identity is separate from the canonical seller, exists in Neon Auth, has onboarding complete, owns an unconfirmed facility named `Test` with no products and has three pre-existing buyer transactions. The browser session reaches the buyer MapLibre globe and shows the buyer search dock plus three resumable transactions. It is suitable as the buyer session; the unconfirmed `Test` facility must not be used as the seller fixture.

## Buyer discovery certification

The distinct buyer session entered `Lait en poudre 400 g` and submitted the search. The production globe performed the staged reveal and returned one result with a visible `Vérifier la disponibilité` action while preserving the query in the dock. The map was shown at a country/region framing during the observation; result-to-availability selection is the next buyer proof step.

## Buyer availability flow observation

The result-level `Vérifier la disponibilité` action opens the `Demande groupée` three-step sheet (`Produit → Commerces → Contraintes`) even though only one facility result is visible. No request was submitted. This is a certification finding: the intended manual single-facility availability path must be located or the CTA/label must be clarified before the buyer can safely proceed to purchase intent.

## Manual facility availability path

After closing the bulk sheet and opening the facility card, the production facility panel exposes the distinct manual CTA `Vérifier la disponibilité` under `Vérifier avant d’acheter`. It also states that contact and itinerary remain unavailable until purchase intent and shows the two active coupons. This is the correct single-facility path for the certification run; the previous result-level CTA is the ambiguous bulk entry.

## Single-facility availability progression

The facility-specific sheet opens as `Disponibilité · flow buyer`, identifies Épicerie Adidogomé Plus, starts at `1/3 Produit` and advances to an active `Continuer` action after the product is confirmed. No availability request or purchase intent was submitted during this observation.

## Availability plan-gate mismatch

At step `2/3 Commerces`, the buyer selected `Ce commerce — Épicerie Adidogomé Plus`, but pressing `Continuer` produced the toast `La vérification groupée est réservée au plan Pro. Choisissez un seul commerce.` The same sheet states that the manual request does not consume bulk quota. This is a live logic/UI divergence: the selected single-facility path is being interpreted as visible-results bulk, so no request was submitted and no transaction was created.

## Post-fix buyer search

Deployment `dpl_4Q5p55DdxnNeFz6w7Ej8RaT5PoGA` for commit `56c61ff` reached `READY` and the buyer session loaded the map, preserved the query `Lait en poudre 400 g`, and returned one result. The corrected facility-specific path is ready to be reopened for a fresh step-2 scope check.

## Post-fix facility-card access

On the corrected deployment, the result-level bulk sheet still opens as expected, and the facility card remains exposed with the hint `Épicerie Adidogomé Plus. Facility vérifiée. 5 offres.` The certification can therefore enter the manual facility path by opening that card rather than submitting the bulk sheet.

## Facility-card recovery after bulk sheet

The facility card click is intercepted while the bulk sheet is open, but closing that sheet restores the card as a direct interactive element. The corrected certification path is therefore: close bulk sheet, open the facility card, then use its manual `Vérifier la disponibilité` action.

## Manual sheet step 1 after corrected deployment

The facility-specific sheet opens with `Disponibilité · flow buyer`, `1/3`, the product prefilled as `Lait en poudre 400 g`, and the facility-specific copy. The visible footer currently reads `Nouvelle vérification` rather than `Continuer`; no Pro-gate toast is present. The sheet uses an internal scrollable region, so further inspection is required before proceeding.

## Manual sheet reset control

The initial `Nouvelle vérification` footer was a restored-state reset control. Activating it did not change the facility-specific scope; it replaced the footer with the expected enabled `Continuer` control while preserving `Lait en poudre 400 g` and the `1/3 Produit` step.

## Scope fix verified in production

On the corrected deployment, the manual flow advanced from `1/3 Produit` to `2/3 Commerces` with `Ce commerce — Épicerie Adidogomé Plus` preselected. The sheet explicitly stated `La demande manuelle ne consomme pas le quota de vérifications groupées.` Pressing `Continuer` advanced to `3/3 Contraintes` without the prior Pro-gate toast. This verifies the facility scope fix in the live buyer UI.

## Manual availability request submitted

The corrected manual request submitted successfully with a green toast `Vérification lancée sur 1 commerce(s).` The sheet now shows `Lait en poudre 400 g`, `0 réponse(s) · 1 cible(s) · demande ciblée · en cours`, and the facility response area. Navigating to `/vendeur` in the current authenticated browser reached the seller shell and displayed the new pending `Lait en poudre 400 g` demand from `Kheir Lissi`, with price/quantity inputs and `Disponible`, `Partiel`, and `Indisponible` actions.

## Seller identity boundary

The browser menu identified the current session as `kheirlissi@icloud.com`, and `/vendeur` displayed that buyer identity's unconfirmed `Test` facility. This session was signed out before seller response certification; the canonical seller identity `demo@omni.tg` must be used for the certified facility `Épicerie Adidogomé Plus`. The buyer demand remains a valid fixture and was not deleted.

## Canonical seller session restored

After signing out the buyer identity and authenticating as `demo@omni.tg`, `/vendeur` loaded the certified `Épicerie Adidogomé Plus` facility with `Vérifié`, `Pro actif`, five products, two coupons, and the pending `Lait en poudre 400 g` demand from `Kheir Lissi`. The demand is correctly matched to the catalog at `3 200 FCFA · 1 disponible(s)` and exposes `Utiliser ce produit pour répondre` plus the response actions.

## Seller response submitted

The canonical seller used the matched product, which prefilled `Prix FCFA = 3200` and `Qté dispo = 1`, then selected `Disponible`. The production dashboard showed the confirmation toast `Réponse envoyée à l'acheteur.` The demand response is now available for buyer purchase-intent certification.

## Seller session closed for buyer return

The canonical seller dashboard now showed `Vous avez déjà répondu` for the new `Lait en poudre 400 g` demand. The seller session was signed out cleanly to return to the distinct buyer identity; no seller fixture or account data was removed.

## Buyer session restored

The buyer credentials authenticated successfully even though the auth page briefly remained on `Connexion…`; navigating to `/` restored the authenticated buyer shell with `3 transactions en cours`, one notification, and the real MapLibre globe. The pending availability response can be resumed from the buyer activity surface.

## Buyer activity resume surface

The buyer’s `Mes demandes` sheet reopened successfully and showed three resumable transaction threads, but the newly answered `Lait en poudre 400 g` availability request was not directly identifiable in that transaction list. The sheet was closed to reopen the original product search and availability panel, preserving all existing transaction fixtures.

## Buyer search reopened after seller response

The buyer restored `Lait en poudre 400 g`, submitted it, and the production staged reveal completed to `1 résultat` with the certified facility result. The buyer is ready to reopen the facility panel and inspect the new answered availability response.

## Seller response notification

The buyer notification panel showed `Un vendeur a répondu — Épicerie Adidogomé Plus a répondu (disponible) à « Lait en poudre 400 g »` at `19/08/2026 11:58:22`. Activating that notification navigated to `/carte`, where the MapLibre globe loaded, but the availability response panel was not automatically restored. This is a resume-flow usability gap; the notification itself proves the seller response was recorded.

## Production notification-resume fix verified

Deployment `dpl_7ywMAeg4pViCn7q5rSDJgQE2xo3h` (`READY`, production, commit `7154b9236095df20f8c5915b54d103609856bb7b`) opened the buyer route with the certified demand and response identifiers. The panel opened directly as `Reprendre votre demande`, resolved `Épicerie Adidogomé Plus`, showed `1 réponse(s)`, highlighted the available `3 200 FCFA · 1 unité(s)` response, and exposed `Je veux payer ici` without a Pro-gate or duplicate request.

## Purchase intent and QR generated

Selecting `Je veux payer ici` created the purchase intent with toast `Intention d'achat créée. Référence d6a19213.` and opened the transaction room for `Épicerie Adidogomé Plus`, total `3 200 FCFA`. The room showed `QR en attente de scan`, timeline states `Intention créée → Offre confirmée → QR généré`, an actual QR image, fallback code `MFD6DQXE`, and validity until `14:41`.

## QR verification idempotency proof

The first live seller validation on the pre-fix deployment transitioned the transaction to `qr_verified` but left the scanner spinner pending; the authoritative database state showed two `seller_verified` events, confirming the duplicate-event defect under repeated/slow submission. After commit `eb8c4ac` deployed READY, replaying `MFD6DQXE` on the same already-verified transaction returned the existing verified room state and the seller UI showed `QR vérifié` with payment/fulfillment controls. The post-replay database check remained `qr_verified | seller_verified_events=2 | total_events=5`, proving the hardened path added no third audit event or notification.

## QR-to-payment entry gap and fix

After seller QR verification, the buyer room correctly showed `Vendeur vérifié` and the next-action label `Choisir le mode de paiement`, but the four external payment buttons were absent because `deriveTransactionUiState` only enabled `canChoosePayment` at `payment_pending`, while the server transition starts from `qr_verified`. The bounded fix enables payment choice at `qr_verified` and keeps `payment_pending` responsible for the subsequent `J’ai payé` action. Local proof: focused transaction-state tests passed `8/8`, full suite passed `64/64`, production build passed, and client-boundary checks passed.

## Payment preference and declaration verified

Deployment `dpl_3TrN69bQhyyBSFzGnEJo3SpdaTMo` (`READY`, production, commit `3cf699e50106b76908feeb9e9d601899a74413db`) restored the QR-verified buyer room and visibly exposed all four external payment options: `Cash à la livraison`, `TMoney`, `Flooz`, and `Autre paiement externe`. The buyer selected `Cash à la livraison`; the room advanced to `Paiement à confirmer`, recorded `Mode de paiement choisi`, and exposed `J’ai payé`. After declaration, the UI recorded `Paiement déclaré par le buyer`; the Neon transaction row was `payment_pending`, `payment_preference=cash_on_delivery`, `buyer_payment_declared_at` populated, and the event sequence ended with `payment_preference_selected,payment_declared`. No in-app payment was processed.

## Seller payment confirmation verified

The canonical seller dashboard reopened the transaction as `Paiement à confirmer` with `Confirmer le paiement reçu`. Selecting it produced toast `Paiement seller confirmé. Vous pouvez lancer la remise.` and changed the room to `Paiement confirmé` with `Lancer la remise ou la livraison`. The authoritative transaction row is `paid`, with `seller_payment_confirmed_at` and `paid_at` populated; the event sequence now ends with `payment_confirmed`.

## Buyer receipt confirmation verified

The buyer transaction room restored the seller-started fulfillment as `Colis en route`, with progress `Paiement terminée → Réception active` and `Je confirme la réception`. Selecting it recorded `Marchandise reçue` and `Réception confirmée` at `13:02`, then exposed the final rating surface with five rating controls, optional comment, and `Publier l’avis et terminer`.

## Rating submission defect and fix

The buyer reached the final rating surface after receipt confirmation, but the first live submission failed with `there is no unique or exclusion constraint matching the ON CONFLICT specification`. The database has a partial unique index `reviews_transaction_unique` on `transaction_id WHERE transaction_id IS NOT NULL`; the SQL upsert incorrectly omitted that predicate. The bounded fix targets the existing partial index explicitly. Local proof after the change: full suite passed `64/64`, production build passed, and client-boundary checks passed.
