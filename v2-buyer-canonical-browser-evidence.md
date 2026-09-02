# Buyer Trunk — Canonical Browser Evidence

**Date:** 2026-08-23
**Environment:** canonical Omni deployment
**Mode:** read-only browser inspection; no new protected mutation submitted

## Observed

The canonical deployment loaded the map-first Omni surface with the map mounted, a calm pale map treatment, the upper-left `Acheter / Vendre` switch, the compact upper-right account orb, right-side map controls, the bottom search dock, the `Proche de vous` result sheet and source-backed facility cards. The map reported its explicit fallback state when external map tiles did not complete; it did not fabricate geography.

An already authenticated account session was visible through the compact account orb. Opening the account surface showed the account-owned menu over the preserved map and did not introduce a separate hamburger or dashboard rail.

Opening the labeled demo facility showed public facility context, an explicit certified/unconfirmed trust label, a facility-scoped catalogue offer and the private-contact/itinerary lock. The availability flow then presented the four approved stages: `Produit`, `Portée`, `Contraintes`, `Réponses`. Product selection used the existing catalogue identity; scope explained that availability is not reservation; constraints showed quantity/budget controls and the private-data lock.

The final `Vérifier maintenant` action was intentionally not clicked in the first read-only pass. A later explicitly confirmed single submission created the demo request on the canonical deployment. The request write succeeded and the UI entered `Demande envoyée / En attente de la disponibilité`.

The first comparison read returned a generic recoverable service error. A redacted server-side schema check identified the cause: the new comparison query attempted to read `product_id` from `v2_availability_responses`, while the production schema stores that product on the request table. The query was corrected to join the product through the request’s `product_id`. A marker-only query against the persistent V2 branch then returned `query-ok` with one request row.

## Current interpretation

The deployed Buyer surface reaches the protected availability boundary and renders the approved pre-submit composition on the canonical URL. One real buyer request was created through the official Auth session. The comparison route fix is validated against the current schema locally, but the corrected code still requires a new deployment and one read-only browser retry before the Buyer slice can be considered verified end-to-end. This record makes no claim that the global Root gate is closed.

## Corrected deployment check

After the join fix was deployed, a second explicitly confirmed single demo request was submitted on the canonical URL. The response-read operation now completed successfully: the sheet showed `En attente des vendeurs`, an `Actualiser` control and the request expiry, rather than the previous service error. No seller response exists yet, so no comparison card or private contact/itinerary action was exposed. The Buyer read path is therefore verified for the real pending state; seller response and cross-flow Root proof remain outstanding.
