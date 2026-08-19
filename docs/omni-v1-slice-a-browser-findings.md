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
