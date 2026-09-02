# Notes de certification production V1

Date: 2026-08-17

## Buyer `/carte`

La page `https://omni.sparkafrika.online/carte` répond en production et rend un globe MapLibre clair sur fond crème/blanc, avec l’attribution OpenFreeMap/OpenStreetMap masquée derrière le contrôle dédié. Le chrome minimal affiche les notifications et le menu hamburger. Le dock de recherche est présent et propose le bouton de lancement ainsi que la recherche vocale.

Au premier chargement sans permission de localisation, l’interface affiche l’état `Localisation bloquée`, avec `Réessayer` et `Explorer le marché approximatif`. Le globe contient des regroupements de résultats visibles.

Une recherche saisie dans le champ avec la valeur `tomates` puis validée par la touche Entrée déclenche bien la recherche en production. L’interface affiche `Continent`, `1 résultat`, `Recherche de la zone…` puis une action `Vérifier la disponibilité`. Le globe zoome progressivement vers l’Afrique et la recherche ne reste pas bloquée sur l’état initial.

Point à vérifier ensuite: l’environnement navigateur de certification ne fournit pas une position GPS utilisateur exploitable, donc le pin de position précise ne peut pas être certifié dans cette session. Le rendu observé montre toutefois le parcours de refus/approximation correctement exposé.

## Availability buyer en production

Après validation de la recherche, le résultat affiche une carte facility autonome avec l’état `Découverte OSM · non réclamée`, la mention `achat non disponible`, `0 offre`, et l’action `Disponibilité à vérifier`. Aucun bouton d’achat direct n’apparaît sur cette facility non réclamée.

L’ouverture de la vérification montre le panneau `Demande groupée` avec les étapes canoniques `Produit`, `Commerces`, `Contraintes`. Le passage à l’étape 2 affiche le choix entre le commerce sélectionné et les résultats visibles, avec le nombre de commerces concernés et un bouton `Continuer`. Le rail de résultats et la carte restent visibles derrière le panneau.

## Intention d’achat et chat transactionnel

Après confirmation de l’opération de test, la réponse disponible ouvre bien une surface transactionnelle privée. L’état affiché est `Intention d’achat` avec le statut `Offre à confirmer`. La progression affiche les cinq libellés visibles à tous les viewport: `Intention`, `Offre`, `QR`, `Paiement`, `Réception`. Le bouton est correctement libellé `Confirmer l’offre et générer le QR` et le fil transactionnel contient l’événement `Intention créée`.

Le champ `Message transactionnel` est visible dans le même panneau et rappelle que les messages restent liés à la transaction. Le QR n’a pas été généré automatiquement à la création de l’intention: il est conditionné par l’action explicite de confirmation de l’offre, conformément au contrat V1.

## Offre confirmée et QR

La confirmation explicite de l’offre fait progresser le statut vers `QR en attente de scan`. Le QR est alors réellement rendu dans le panneau avec un code lisible, une expiration affichée, et les événements `Offre confirmée` puis `QR généré` dans le fil transactionnel. Avant cette action, le QR n’était pas visible; le contrat `offre_confirmée → qr_generated` est donc observé en production.

## Seller map-first et Omni Wallet

La route `/vendeur` répond en production avec une carte MapLibre visible en arrière-plan et un chrome minimal. Le dock seller expose les surfaces V1 observées: `Facility`, `Catalogue`, `Demandes reçues`, `Scanner QR`, `Omni Wallet` et `Coupons`. Les anciennes entrées Ads/Agent ne sont pas visibles.

L’onglet `Omni Wallet` affiche une seule source rechargeable, le champ de montant, l’action `Payer par carte`, le texte FedaPay mentionnant Visa/Mastercard, puis les allocations internes `Pro`, `Publicité` et `Coupons`. Il indique explicitement que les paiements clients in-app et les retraits vendeur ne sont pas disponibles en V1. Le fond cartographique reste présent et le solde n’est plus dupliqué dans l’aperçu seller.

## Scanner QR seller

La surface `Scanner QR` est accessible depuis le dock seller et reste au-dessus de la carte. Elle explique que le vendeur valide un QR ou un code de huit caractères, sans paiement client in-app ni retrait vendeur en V1. Le bouton `Autoriser et démarrer la caméra`, le champ manuel `Ex. K7QM2PDX` et l’action `Valider` sont présents ensemble.

Après déclenchement de l’autorisation dans le navigateur de certification, l’état rendu est `Scan indisponible — saisie manuelle disponible` avec le message `Caméra indisponible. Saisissez le code manuellement.` L’espace de prévisualisation reste néanmoins monté et affiche `Prêt à scanner`, au lieu de disparaître. Le fallback manuel est donc disponible même lorsque l’environnement de test ne donne pas accès à une caméra réelle. Le maintien d’un flux vidéo actif après une permission accordée doit encore être confirmé sur un appareil mobile HTTPS réel, car ce bac navigateur ne fournit pas de caméra exploitable.

## Menu seller V1

Le hamburger seller ouvert en production ne montre plus les anciennes entrées de navigation ou d’administration. Il ne contient que le contexte de navigation et la déconnexion, car aucune action buyer secondaire n’est injectée dans cette surface. Le switch Acheteur/Vendeur n’est pas dupliqué dans le menu.

## Menu buyer V1

Le hamburger buyer de production expose exactement les actions secondaires prévues: `Transactions`, `Messages`, `Recherches enregistrées` et `Panier`, puis `Déconnexion`. Les entrées Agent, Publicité, Plan avancé, Administration et le switch de rôle ne sont pas présents dans le menu. Le globe reste visible assombri derrière la sheet, ce qui conserve le contexte map-first.

## Reprise E2E seller

La reprise de la route seller confirme que la surface Scanner QR revient à l’état `Prêt à scanner` sur un nouveau chargement, avec l’aperçu réservé monté et le champ manuel disponible. La validation manuelle d’un code QR généré par le buyer reste l’étape suivante pour tester le passage seller vers paiement externe; elle n’a pas encore été soumise dans cette session afin de séparer clairement l’observation UI de la mutation transactionnelle persistante.

## Résultat de validation QR seller

Après confirmation explicite, le code `5QLK3RD9` a été soumis dans le fallback manuel. La commande passe à `Validation…`, mais après une attente et un rafraîchissement de l’état navigateur, elle reste bloquée dans ce libellé. Le statut seller reste `Non confirmé`, la progression reste `1 / 3 acheteurs distincts`, et aucune transition vers `Paiement` n’est visible. Ceci constitue une anomalie de certification production à diagnostiquer avant de déclarer l’E2E complet vert.

## QR vérifié et paiement externe

Après un délai supplémentaire, la validation s’est résolue en `QR vérifié`. La surface seller affiche `Paiement à confirmer par l’acheteur`, `Étape 4/5`, le montant de 1 250 FCFA, la commission de 25 FCFA et le payout prévu de 1 225 FCFA. Elle précise que le code est autorisé pour cette facility et qu’aucun retrait vendeur n’est disponible en V1.

La transition `seller_verified → payment_pending` est donc certifiée. La finalisation du paiement réel n’est pas exécutée dans cette session, car Omni V1 ne réalise pas de paiement acheteur in-app et le checkout FedaPay sert uniquement à recharger l’Omni Wallet.

## PWA et routes publiques

La production expose `/manifest.webmanifest` en HTTP 200 avec le type `application/manifest+json` et `/sw.js` en HTTP 200 avec le type JavaScript. Les variantes `/manifest.json` et `/service-worker.js` renvoient 404, ce qui est attendu puisque les noms actifs sont ceux de l’application. Les routes `/`, `/carte`, `/vendeur` et `/auth` renvoient toutes HTTP 200. Aucun fichier `.env`, secret ou credential n’est suivi par Git.


## Continuity Phase 10 browser checkpoint — 2026-08-18

After the latest deployment, opening `/carte` in the production browser loaded the route and all primary controls: zoom, approximate-market exploration, settings, search input, voice search, submit search and hamburger menu. At the first view and again after waiting, the rendered scene remained visually blank/cream with the text `Chargement de la carte…` and `Localisation en cours…`. No SSR 500 was visible, but the map/globe and exact-position completion were not yet confirmed in this browser checkpoint and require console/network inspection before certification can be marked green.


## Phase 10 console follow-up — 2026-08-18

The browser console had no runtime error output. A read-only DOM check showed `document.readyState = complete`, one `.maplibregl-map`, one MapLibre canvas at 1280×1100 CSS pixels, and the body state `Zone cartographiée` plus `Localisation bloquée`, `Réessayer` and `Explorer le marché approximatif`. The initial screenshot’s loading copy had resolved; MapLibre was mounted and the remaining state was the expected location-permission fallback rather than a map crash.


## Phase 10 search-button checkpoint — 2026-08-18

The buyer search control remained visible after MapLibre mounted. A first attempt to input `tomates` targeted the pre-load input index; the subsequent rendered input still showed the placeholder rather than a confirmed value, so the explicit button click produced no visible search transition. This is recorded as an inconclusive browser interaction rather than a confirmed regression: the next check must reacquire the live input index, verify the value is present, and then click the live submit button or press Enter.


## Phase 10 search-button result — 2026-08-18

After reacquiring the live input index, `tomates` was visibly present in the field. Clicking the live `Lancer la recherche` button succeeded: production displayed `Pays`, `1 résultat` and `Vérifier la disponibilité`, while MapLibre progressively revealed and zoomed the globe toward Africa. The earlier inconclusive attempt was caused by using a stale pre-load element index, not by the search button itself.


## Phase 10 availability panel result — 2026-08-18

The production result opened a centered `Demande groupée` panel above the persistent globe/map. The canonical labels `Produit`, `Commerces`, `Contraintes` were visible, and the first step showed the product `tomates`. Advancing without submission moved the panel to `2/3`, exposed the selected facility and visible-result choices, and kept the result card and map context behind the panel. The single-result quota explanation was visible and no server-side availability request had yet been submitted.


## Phase 10 seller initial checkpoint — 2026-08-18

Opening `/vendeur` after the latest deployment initially rendered only `Chargement…` on the cream background with no interactive elements detected. This is an intermediate loading state; the seller shell must be rechecked after the authenticated server payload resolves before classifying it as a production failure.


## Phase 10 seller and wallet result — 2026-08-18

After the initial seller loading state resolved, `/vendeur` rendered a MapLibre map behind the centered seller workspace. The V1 dock exposed `Facility`, `Catalogue`, `Demandes reçues`, `Scanner QR`, `Omni Wallet` and `Coupons`, with no Ads or Agent entry. The Omni Wallet tab showed one rechargeable wallet, the FedaPay card checkout control, and the internal allocation selector for Pro/Publicité/Coupons. The map remained visible behind the surface.


## Phase 10 camera result — 2026-08-18

After explicit confirmation, the production camera action returned `Scan indisponible — saisie manuelle disponible` with `Caméra indisponible. Saisissez le code manuellement.` The preview frame stayed mounted and still displayed `Prêt à scanner`; the manual code field and `Valider` action remained visible. This confirms the fail-soft camera state in the certification browser. A real mobile HTTPS device is still required to certify actual video frames after permission is granted because the sandbox browser provides no camera stream.


## Phase 10 public route result — 2026-08-18

Public production checks returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/auth`, `/transaction/qr`, `/manifest.webmanifest` and `/sw.js`. The manifest content type is `application/manifest+json` and the service worker content type is JavaScript. The local branch remains synchronized with `origin/main`; only this certification-notes file is modified for the next documentation commit, while the previously identified `.vercel/` and local audit scripts remain intentionally untracked.
