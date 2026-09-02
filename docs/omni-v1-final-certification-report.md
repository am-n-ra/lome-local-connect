# Omni V1 — Rapport final de refactor UI et certification

**Auteur :** Manus AI  
**Date de certification :** 18 août 2026  
**Branche certifiée :** `main`  
**Dernier commit publié :** `4c4b5fa` — `docs(ui): complete seller E2E certification notes`

## 1. Conclusion exécutive

Le refactor UI V1 demandé est désormais implémenté et publié sur `main`. Omni présente une expérience **map-first** partagée entre l’acheteur et le vendeur : le globe MapLibre reste le contexte visuel principal, tandis que les docks, sheets et surfaces opérationnelles flottent au-dessus de la carte. Les surfaces V1 seller ont été réduites à l’essentiel, le wallet unique a été clarifié, le menu hamburger a été débarrassé des entrées non disponibles et les flows buyer availability → intention → offre → QR ainsi que seller QR → paiement externe ont été observés en production.

La certification est **verte pour les contrats UI et les transitions V1 observables**. Elle n’est pas déclarée comme une certification de paiement réel de bout en bout : Omni V1 ne réalise pas de paiement acheteur in-app et le checkout FedaPay est réservé à la recharge de l’Omni Wallet. La caméra réelle n’a pas pu être fournie par l’environnement de navigateur utilisé pour la certification ; le fallback manuel a toutefois été exercé avec succès jusqu’à `QR vérifié`, et l’espace de prévisualisation est resté monté.

## 2. Livrables publiés

Les phases du refactor ont été publiées atomiquement sur `origin/main`. L’historique ci-dessous constitue la séquence de livraison certifiée.

| Phase | Commit | Résultat |
|---|---|---|
| Audit | `358a09b` | Classification complète des surfaces buyer/seller, contrats backend et régressions dans `docs/omni-v1-ui-phase0-audit.md`. |
| Primitives | `ba77a82` | `TransactionProgress`, primitives glass/sheet/page/footer et labels canoniques de progression. |
| Shell | `5422dbd` | `OmniMapShell`, `OmniMapChrome`, `OverlayHost` et placement floating/inline du dock. |
| Buyer | `4220fc1` | `FacilityResultCard`, `ResultRail`, disponibilité-first, retry de couverture et suppression de l’achat direct sur facility non réclamée. |
| Seller workspace | `5eaad91` | Shell map-first seller, chargement shell léger, dock V1 et retrait des surfaces Ads/Agent au montage. |
| Scanner | `ddac0ad` | Cycle caméra corrigé, aperçu toujours monté, états caméra partagés et fallback manuel. |
| Catalogue | `8e6d70d` | `SellerProductForm` avec champs essentiels, options avancées et création produit + coupon. |
| Onboarding | `c66cabe` | `SellerOnboardingFlow` en trois sections avec position sur carte. |
| Wallet | `742b51d` | BalanceSheet complet déplacé dans l’onglet Omni Wallet avec recharge FedaPay. |
| Navigation | `968c553` | Menu hamburger V1 limité aux actions réellement disponibles. |
| Nettoyage | `b2d948f` | Suppression des imports et helpers morts dans la route vendeur. |
| Certification | `3f2604f`, `4c4b5fa` | Notes de certification production buyer, seller, QR, wallet, PWA et HTTP. |

Le dépôt est synchronisé avec `origin/main` au dernier commit. Les répertoires `.vercel/` et plusieurs scripts d’audit restent non suivis localement ; ils n’ont pas été ajoutés à la release et ne contiennent aucun secret publié.

## 3. Conformité UI V1

Le buyer conserve le globe et ses résultats visibles comme contexte permanent. La recherche `tomates` saisie puis validée avec Entrée a déclenché en production la révélation progressive de la zone, l’affichage du résultat et l’action de disponibilité. Le résultat OSM non réclamé affichait explicitement `achat non disponible`, sans bouton d’achat direct ; la disponibilité était l’entrée principale du parcours.

Le panneau de disponibilité affiche les trois étapes `Produit`, `Commerces`, `Contraintes`. La progression est visible et les contraintes quantité/budget sont exposées seulement dans l’étape dédiée. Le budget reste optionnel et le champ accepte l’absence de limite. Les réponses disponibles et partielles affichent une meilleure option lorsque celle-ci existe.

La création d’intention ne génère pas le QR automatiquement. Le flow certifié est `Intention créée`, puis `Offre à confirmer`, puis confirmation explicite de l’offre, puis `QR généré`. Le chat transactionnel s’ouvre avec le champ de message privé rattaché à la transaction. Les cinq labels canoniques restent visibles : `Intention`, `Offre`, `QR`, `Paiement`, `Réception`.

| Surface | État V1 certifié |
|---|---|
| Carte buyer | Globe MapLibre visible, dock de recherche, résultat OSM, rail facility et disponibilité. |
| Facility non réclamée | Découverte OSM, média indisponible signalé, achat direct absent, disponibilité disponible. |
| Availability | Produit → Commerces → Contraintes, réponses triées et action d’intention sur une offre. |
| Chat transactionnel | Fil privé ouvert après l’intention, offre à confirmer avant QR. |
| Navigation buyer | Transactions, Messages, Recherches enregistrées, Panier et Déconnexion. |
| Seller shell | Carte en arrière-plan, chrome minimal, dock d’opérations flottant dans le même langage visuel. |
| Seller catalogue | Création produit claire, disponibilité, stock, allocation Omni et coupon de base. |
| Seller onboarding | Identité, Localisation avec carte, Présentation, puis création de la facility. |
| Omni Wallet | Une source rechargeable, allocations Pro/Publicité/Coupons, sans retrait vendeur. |
| Scanner QR | Autorisation explicite, prévisualisation persistante, fallback code manuel. |
| Navigation seller | Aucun Agent, Ads, Administration ou switch de rôle dans le hamburger. |

## 4. Certification production

Les routes publiques principales ont répondu HTTP 200 pendant la vérification : `/`, `/carte`, `/vendeur` et `/auth`. La carte buyer de production a rendu le globe MapLibre sur fond clair, avec les contrôles de zoom, recentrage/approximation, attribution repliée, notifications et menu. Lorsque la position n’était pas disponible dans le navigateur de certification, l’interface affichait `Localisation bloquée`, `Réessayer` et `Explorer le marché approximatif` au lieu de prétendre connaître une position précise. [1]

La recherche buyer a été testée avec Entrée et non seulement avec le bouton. Elle a produit une facility OSM non réclamée et le panneau availability. La sélection d’une réponse disponible a ouvert l’intention transactionnelle, puis la confirmation explicite a produit un QR expirant avec les événements correspondants dans le fil. [1]

La route seller a rendu la carte persistante et les six entrées opérationnelles V1 : Facility, Catalogue, Demandes reçues, Scanner QR, Omni Wallet et Coupons. L’onglet Omni Wallet affiche le montant, la recharge `Payer par carte`, la mention des moyens FedaPay activés, les allocations internes et l’interdiction explicite des paiements client in-app et retraits vendeur V1. [2]

Le scanner seller a été ouvert, puis le code de démonstration `5QLK3RD9` a été saisi dans le fallback manuel et validé après confirmation. La transaction est passée à `QR vérifié`, puis `Paiement à confirmer par l’acheteur`, avec montant, commission et payout informatif. Le délai de réponse initial affichait `Validation…` avant de se résoudre ; ce délai doit être surveillé dans les logs de production, mais il ne s’est pas soldé par une erreur 500 ou une perte d’état. [2]

La PWA expose `/manifest.webmanifest` et `/sw.js` en HTTP 200. Les variantes `/manifest.json` et `/service-worker.js` renvoient 404, ce qui correspond aux noms effectivement utilisés par l’application. Aucun fichier `.env`, secret ou credential n’est suivi par Git.

## 5. Validation locale

La suite locale a été relancée après les dernières modifications. Les 8 fichiers de tests Vitest sont verts, soit 37 tests réussis. Le contrôle TypeScript `tsc --noEmit`, Prettier, `git diff --check`, le build Vite/Nitro et le contrôle de frontière client ont également réussi.

| Contrôle | Résultat |
|---|---:|
| Tests Vitest | **37/37** |
| Fichiers de test | **8/8** |
| TypeScript `tsc --noEmit` | **Réussi** |
| Build Vite/Nitro | **Réussi** |
| Client-boundary guard | **37 artefacts analysés, réussi** |
| Routes HTTP production | **4/4 en 200** |
| PWA manifest/service worker | **2/2 actifs en 200** |
| Secrets suivis par Git | **Aucun** |

## 6. Limites explicitement conservées en V1

Le paiement acheteur n’est pas un paiement intégré Omni. Après le scan QR, le vendeur voit l’étape `Paiement à confirmer par l’acheteur`; la finalisation dépend du parcours de paiement externe ou de la confirmation serveur prévue par le contrat. Le payout affiché est informatif et aucun retrait vendeur n’est proposé.

La caméra réelle n’a pas pu être certifiée avec une image vidéo dans l’environnement de navigateur sandbox. Le bouton d’autorisation et la surface de preview sont présents, le flux de permission refusée est propre et le fallback manuel fonctionne. La certification finale sur un iOS/Android réel en HTTPS reste nécessaire pour confirmer `getUserMedia`, le maintien de la piste vidéo après permission et la lecture BarcodeDetector.

La position GPS exacte n’a pas pu être comparée à une position physique réelle dans le navigateur de certification. L’état refus/approximation est cohérent, mais une validation mobile avec permission accordée reste nécessaire pour certifier le pin de position utilisateur et l’affinage `watchPosition`.

Les médias facilities provenant d’OSM peuvent rester absents lorsqu’aucune image source n’existe. L’UI signale alors `Aperçu média indisponible` au lieu de laisser une carte vide ambiguë. L’ingestion et la couverture mondiale restent fail-soft et dépendent des zones réellement interrogées.

## 7. Surfaces à réserver à V2

Les campagnes publicitaires avancées, l’Agent IA vendeur, les plans commerciaux complexes, les retraits et payouts effectifs, le paiement buyer in-app, la personnalisation coupon pilotée par IA, les dashboards data company complets et les outils d’administration doivent rester derrière des routes ou feature flags V2. Ils ne doivent pas revenir dans le menu V1 tant que leurs contrats backend et leurs états d’erreur ne sont pas certifiés.

Les prochains travaux prioritaires ne sont donc pas une nouvelle refonte globale. Ils sont ciblés : test mobile réel de caméra et géolocalisation, surveillance du délai `Validation…`, instrumentation des événements de funnel, tests de paiement externe sandbox, puis ouverture progressive des surfaces V2 lorsque les contrats financiers et les permissions seront finalisés.

## 8. Références

[1]: https://omni.sparkafrika.online/carte "Omni production — carte buyer"
[2]: https://omni.sparkafrika.online/vendeur "Omni production — espace seller"
[3]: https://github.com/am-n-ra/lome-local-connect/commits/main "Omni repository — main commits"
[4]: https://github.com/am-n-ra/lome-local-connect/blob/main/docs/omni-v1-ui-one-shot-build-prompt.md "Omni V1 UI one-shot build prompt"
