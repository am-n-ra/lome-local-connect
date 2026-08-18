# Omni Continuity V1 — Rapport final de livraison et certification

**Auteur :** Manus AI  
**Date :** 18 août 2026  
**Dépôt :** `am-n-ra/lome-local-connect`  
**Branche publiée :** `main`  
**Dernier commit :** `368ce5c` — `docs(release): record continuity V1 rollout`

## 1. Résumé exécutif

La continuité V1 a été implémentée en conservant les choix fondamentaux déjà validés pour Omni : **globe MapLibre**, découverte géospatiale OSM/Overpass, interface map-first, surfaces centrées au-dessus de la carte et séparation stricte entre paiement externe buyer-vendeur et recharge FedaPay de l’Omni Wallet. Les documents joints ont été interprétés comme une spécification de flows, de contrats et de durcissement, sans appliquer leur exclusion du globe ou du moteur OSM. Cette décision est consignée dans la source de vérité de continuité [1].

Le parcours central est maintenant cohérent entre buyer et seller : recherche → résultat facility → disponibilité → intention → chat transactionnel → confirmation explicite de l’offre → QR → vérification seller → choix ou déclaration du paiement externe → confirmation seller → fulfillment → réception buyer. Le QR n’est jamais généré automatiquement à la création de l’intention, et Omni ne prétend pas traiter le paiement buyer-vendeur dans l’application [2].

Le dépôt `main` est synchronisé avec `origin/main`. Les migrations transactionnelles 028 et 029 ont été appliquées à la base `neondb` vérifiée, puis contrôlées. La validation locale finale reste verte avec **9 fichiers de test et 45 tests réussis**, TypeScript, build Vite/Nitro et garde client/server validés [3].

> **Décision V1 structurante :** Omni possède un seul Omni Wallet rechargeable. Pro, Publicité et Coupons sont des allocations internes non retirables. FedaPay sert uniquement à recharger ce wallet ; aucun paiement buyer-vendeur in-app et aucun retrait seller ne sont activés en V1.

## 2. Périmètre réalisé par phase

| Phase | Réalisation | Résultat |
|---|---|---|
| 0 — Continuité et audit | Source de vérité, gap matrix, arbitrage globe/OSM/backend réel | Périmètre verrouillé sans régression de la direction produit |
| 1 — Contrats | Contrats UI-safe availability, transaction, QR, paiement, wallet et onboarding ; transitions canoniques et garde client-boundary | Les composants UI ne dépendent pas directement des modules server-only |
| 2 — Primitives | Panels centrés, Sheet centered, OverlayHost centered et primitive `OmniCenteredPanel` | Les opérations apparaissent au-dessus du globe sans remplacer la scène |
| 3 — Shell | Workspace seller centré et map-first, rails et surfaces buyer harmonisés | Buyer et seller partagent la même composition visuelle |
| 4 — Availability | Limite bulk de 12 cibles, mode single distinct, budget buyer non exposé au seller, réponses seller immuables et cards produit-first | Disponibilité privée, availability-first et protection contre les réponses concurrentes |
| 5 — Transaction | Chat partagé, timeline, choix de paiement externe, déclaration buyer, QR partageable, deep link account-bound, actions seller payment/fulfillment | Flow transactionnel continu et séquencé |
| 6 — Seller | Notification transactionnelle vers seller, sélection automatique de l’onglet scanner, résumé V1 sans statistique Campagnes | Les surfaces Ads/Agent ne sont pas réintroduites dans le V1 visible |
| 7 — Wallet | `transferWalletAllocation`, ownership seller, rate limit, idempotence, allocation wallet → Pro/Publicité/Coupons et contrôle de solde SQL | Un seul wallet rechargeable et allocations internes explicites |
| 8 — Auth et frontières | Replay pending search, onboarding buyer/seller, notifications, deep links transactionnels, frontière `requireStaff` | Reprise post-auth et admin server-gated |
| 9 — Base et invariants | Migration 029, contraintes timestamps, unicité QR, trigger transitions, schema snapshot synchronisé | Les chemins SQL accidentels ne peuvent pas sauter arbitrairement les étapes |
| 10 — Certification | Browser buyer/seller, globe, recherche, availability panel, wallet, scanner, routes PWA et HTTP | Production observée après le déploiement |
| 11 — Rollout | Commits atomiques publiés, migrations appliquées, vérification de rollback | `main` et `origin/main` synchronisés |

## 3. Contrats transactionnels et paiement

La machine de statut supporte les étapes `pending`, `qr_generated`, `qr_verified`, `payment_pending`, `paid`, `fulfillment` et `completed`, avec les chemins terminaux `expired`, `cancelled`, `failed`, `disputed` et `refunded`. Les labels visibles restent : **Intention**, **Offre**, **QR**, **Paiement**, **Réception**. Les tests vérifient notamment que l’intention ne peut pas sauter directement vers le paiement et que le QR actif n’est pas régénéré inutilement [4].

Le buyer peut sélectionner `cash_on_delivery`, `tmoney`, `flooz` ou `external_other`. Pour les méthodes distantes, le seller contact n’est exposé qu’après vérification QR. La déclaration buyer n’est pas assimilée à un paiement Omni : elle sert à signaler le paiement externe, puis le seller confirme l’encaissement depuis son workspace. Le seller peut ensuite lancer le fulfillment, et le buyer ne peut confirmer la réception qu’après cette transition.

La migration 028 a été appliquée avec le checksum suivant : `d0fbd42e82d9b2543123d41669916ad78201ba7c02fc64fab6f96383cbfdb8c2`. La migration 029 a été appliquée avec le checksum `d7eaeca5b30a28c3649fb78d8be8f6b1c9b253df1953f37a408cdce3700d8432`. Les quatre checks transactionnels, le trigger `transactions_validate_transition`, l’index QR unique et la registry de migrations ont été retrouvés en base [5].

## 4. Wallet et FedaPay

La surface seller affiche maintenant explicitement **Un seul portefeuille pour toute la plateforme**. Le contrôle FedaPay ouvre un checkout hébergé pour la recharge ; le callback et le webhook créditent le bucket `wallet` de façon idempotente. La nouvelle action d’allocation transfère ensuite une somme du bucket `wallet` vers `pro_credit`, `ad_credit` ou `coupon_credit` via la fonction SQL ledger, avec ownership facility, rate limiting et idempotency key.

La certification ledger post-migration a confirmé la parité entre les montants legacy et les snapshots projetés : wallet legacy `72000` = wallet projeté `72000`, payout legacy `33690` = payout projeté `33690`. Les cinq buckets existent par compte et les fonctions SQL ledger attendues sont présentes [6]. Aucun retrait seller n’est présenté ou activé.

## 5. Certification production

Les routes publiques suivantes ont répondu HTTP 200 après le déploiement : `/`, `/carte`, `/vendeur`, `/auth`, `/transaction/qr`, `/manifest.webmanifest` et `/sw.js`. Le manifest est servi avec `application/manifest+json`, et le service worker avec un type JavaScript. Le journal détaillé des observations browser est disponible dans les notes de certification [7].

| Surface | Observation | Statut |
|---|---|---|
| Buyer map | MapLibre monté, globe visible, contrôles zoom/recentrage/settings/search présents, fond crème et cartes map-first | Certifié dans le navigateur sandbox |
| Recherche | `tomates` saisie dans le champ live puis clic sur le bouton explicite ; `Pays`, `1 résultat` et `Vérifier la disponibilité` apparaissent avec révélation globe vers l’Afrique | Certifié |
| Résultat facility | Card produit-first, facility OSM non réclamée, achat direct absent, CTA disponibilité visible | Certifié |
| Availability | Panel centered au-dessus de la carte ; labels Produit/Commerces/Contraintes ; passage à l’étape Commerces sans soumission | Certifié pour l’UI et les transitions locales |
| Seller shell | Carte MapLibre persistante, facility, Catalogue, Demandes reçues, Scanner QR, Omni Wallet et Coupons | Certifié |
| Omni Wallet | Recharge FedaPay, texte de source unique, allocations Pro/Publicité/Coupons, aucun retrait | Certifié pour le rendu et le contrat |
| Scanner QR | Preview monté, état Prêt à scanner, autorisation explicite et fallback code manuel | Certifié en fail-soft sandbox |
| Caméra réelle | Le sandbox retourne Caméra indisponible mais garde l’espace de preview et le fallback | Partiel : test appareil HTTPS requis |
| PWA/routes | Routes et actifs PWA HTTP 200 | Certifié |
| Paiement externe réel | Aucun paiement buyer-vendeur in-app exécuté volontairement ; le flux exige déclaration buyer puis confirmation seller | Conforme au scope V1, non automatisé |

Le premier affichage de `/carte` a montré un état intermédiaire `Chargement de la carte…` et `Localisation en cours…`. Après résolution, le DOM contenait un `.maplibregl-map`, un canvas 1280×1100 et l’état attendu `Zone cartographiée` / `Localisation bloquée`. La console ne rapportait aucune erreur runtime ; l’environnement de certification ne fournit simplement pas de position GPS exploitable.

## 6. Tests et artefacts

La dernière exécution de `pnpm test` a produit **9 fichiers de test verts et 45 tests réussis**. Le build `pnpm build` a réussi avec génération Vite/Nitro et le garde client-boundary a scanné 42 artefacts JavaScript et 165 fichiers source sans violation. `git diff --check` est également vert.

Les principaux commits de livraison sont les suivants :

| Commit | Contenu |
|---|---|
| `15ea248` | Contrats de continuité Omni V1 |
| `06e9ed5` | Panels map-first centrés |
| `1daf5ab` | Convergence des overlays globe |
| `5a015ad` | Privacy et états availability |
| `4c510d3` | Thread transactionnel, QR et paiement-choice |
| `043621a` | Seller transaction workspace |
| `6d827f6` | Allocations internes Omni Wallet |
| `2c632b1` | Invariants DB et schema snapshot |
| `368ce5c` | Rollout notes publiées |

La branche Git est propre du point de vue des fichiers suivis et synchronisée avec `origin/main`. Les répertoires `.vercel/` et les scripts d’audit locaux `scripts/audit-demo-flows.mjs`, `scripts/create-demo-flow-fixture.mjs`, `scripts/extract-carte-page.mjs` et `scripts/refactor-orders-thread.mjs` restent volontairement non suivis et hors périmètre de release.

## 7. Limites explicites et frontière V2

La certification caméra réelle n’est pas déclarée verte à partir du sandbox : un appareil mobile HTTPS doit confirmer que la permission accordée laisse bien le flux vidéo actif et que `BarcodeDetector`, lorsqu’il est disponible, remplit le code. Le fallback manuel est déjà certifié et reste obligatoire lorsque le navigateur ne sait pas décoder un QR.

La V1 ne comprend pas de paiement buyer-vendeur dans l’application. Les méthodes TMoney, Flooz, cash-on-delivery et autre paiement externe sont enregistrées comme préférence ou déclaration, puis confirmées par le seller. FedaPay n’est pas utilisé pour encaisser un achat seller et aucun payout/retrait n’est exposé.

Les surfaces suivantes restent V2 ou hors périmètre de cette livraison : campagnes Ads et automatisation publicitaire complète, Agent conversationnel avancé, moteur de personnalisation coupon par utilisateur, abonnement Pro entièrement automatisé, dashboard admin enrichi, métriques data-company complètes, arbitrage de litiges et remboursements, notification push native, SLA d’Overpass multi-région et application mobile native. Les surfaces ne sont pas supprimées du backend historique lorsqu’elles sont nécessaires à la compatibilité, mais elles ne sont pas présentées comme fonctionnalités V1 actives.

Le prochain lot recommandé est une certification sur appareil mobile réel et un test externe supervisé du cycle seller `payment_pending → paid → fulfillment → completed`, sans jamais contourner la règle selon laquelle Omni ne traite pas le paiement buyer-vendeur en V1.

## Références

[1]: ./omni-continuity-v1-source-of-truth.md "Omni continuity V1 source of truth"
[2]: ./omni-continuity-v1-phase5-notes.md "Omni continuity V1 Phase 5 notes"
[3]: ./omni-v1-ui-phase0-audit.md "Omni V1 Phase 0 audit"
[4]: ../src/lib/omni-v1-contracts.ts "Omni V1 canonical contracts"
[5]: ../db/migrations/028_transaction_payment_and_fulfillment.sql "Transaction payment and fulfillment migration"
[6]: ../scripts/verify-ledger-integration.mjs "Wallet ledger integration verification"
[7]: ./omni-v1-production-certification-notes.md "Omni V1 production certification notes"
