# Vérification des flows production — 2026-08-16

URL vérifiée : https://omni.sparkafrika.online

Le compte Neon Auth de démonstration `demo@omni.tg` correspond à l’identifiant `a8c23f6a-84a9-452c-8be6-f0278060e436`. L’audit read-only a montré que quatre anciennes facilities appartenaient à un profil dupliqué différent, ce qui expliquait l’ouverture de l’onboarding seller.

Après confirmation de l’utilisateur, un fixture isolé a été créé pour ce compte :

| Élément | Valeur |
|---|---|
| Facility | `526d1732-4cca-48a8-9bf0-ba567fc8bcca` |
| Facility name | `Omni QA — Fixture Seller` |
| Product | `429e1298-48f2-42ed-b023-bfb683904fb8` |
| Product name | `Omni QA Produit test` |
| Price | 1250 |
| Discount | 1% — required by the production trigger |
| Quantity | 12 |
| Owner | `a8c23f6a-84a9-452c-8be6-f0278060e436` |
| Source ref | `omni-qa-demo-flow-20260816` |

Aucun paiement réel ne doit être exécuté. Les états payment external doivent être vérifiés uniquement via les contrôles de test de l’application.

## Observations browser — phase initiale

Le workspace seller déployé ouvre correctement pour le compte Auth actuel après fixture. Il affiche `Omni QA — Fixture Seller`, les onglets `Catalogue & inventaire`, `Demandes reçues`, `Scanner QR`, `Solde`, `Abonnement`, `Coupons`, `Demande locale` et `Publicité`. Les demandes reçues sont actuellement à zéro, ce qui est attendu avant la création d’une demande buyer. Le catalogue affiche un produit.

Sur `/carte`, une recherche globale au niveau globe avec `Omni QA Produit test` affiche zéro résultat car la vue mondiale ne cadre pas encore la zone de Lomé. La demande buyer est néanmoins disponible dans l’interface. La fiche directe `/fiche/526d1732-4cca-48a8-9bf0-ba567fc8bcca` est utilisée pour continuer le test sans dépendre du cadrage initial du globe.

## Buyer — purchase intent

La fiche directe du fixture affiche le produit `Omni QA Produit test`, 1 250 FCFA, Disponible, quantité 1, puis le CTA `Je veux acheter`. Le clic a créé une intention d’achat sans paiement réel et a affiché `Intention d'achat créée. Référence ab600ebd.`. Après création, les actions `Itinéraire`, `Contacter` et `Je cherche ce produit` sont déverrouillées. Le buyer atteint donc correctement l’état `purchase_intent`.

## Buyer/Seller — boucle transactionnelle complète vérifiée

Le correctif `cee267a` a été poussé sur `origin/main` après compilation et lint ciblé réussis. Il déplace les demandes availability live dans l’onglet seller `Demandes reçues`, conserve les demandes panier historiques dans le même espace et limite `Demande locale` aux tendances de recherche.

| Étape | Résultat de production | Preuve |
|---|---|---|
| Seller — demande reçue | Réussie | `Demandes en direct`, `Omni QA Produit test`, correspondance catalogue, 1 250 FCFA, 12 disponibles |
| Seller — réponse | Réussie | `Disponible`, prix 1 250, quantité 12 ; toast `Réponse envoyée à l’acheteur.` |
| Buyer — disponibilité | Réussie | `1 réponse(s)`, recommandation `Omni QA — Fixture Seller`, badge `Meilleure option Disponible` |
| Buyer — intention | Réussie | Référence `ab600ebd` / transaction `ab600ebd-fbb3-4755-9bd2-583a94c90a15` |
| Buyer — QR | Réussie | Code de retrait `9DGNQHHX`, événements `offer_confirmed` et `qr_generated` |
| Seller — scan | Réussie | Validation du code ; états `seller_verified` puis `payment_pending` |
| Buyer — paiement externe simulé | Réussie | Bouton `Je confirme le paiement`, événement `payment_confirmed`, état `paid` |
| Buyer — réception | Réussie | Bouton `Je confirme la réception`, événements `product_received` et `completed` |
| Final | Réussie | Transaction `completed`, montant 1 250 FCFA, paiement externe sans paiement réel |

La timeline buyer affichée en production contient les huit événements suivants : `Intention créée`, `Offre confirmée`, `QR généré`, `Vendeur vérifié`, `Paiement à confirmer`, `Paiement confirmé`, `Produit reçu`, `Transaction terminée`. L’état final a été confirmé par lecture read-only de la base Neon : `status = completed`, `paid_at = 2026-08-16T17:21:23.727Z`, `completed_at = 2026-08-16T17:21:33.867Z`.

## Conformité et réserve

La boucle fonctionnelle V1 est donc vérifiée de bout en bout en production. Le paiement reste volontairement manuel/externe, conformément au périmètre V1 ; aucune transaction financière réelle n’a été exécutée. Le test browser a été réalisé sur la largeur desktop du navigateur disponible. Un audit séparé des captures aux largeurs 320, 375, 768 et 1280 px reste recommandé avant la clôture finale de la phase responsive.

## Audit responsive final — 2026-08-16

Le commit `dd427c3` a été poussé sur `origin/main` après succès du lint ciblé et du build de production. La validation production après propagation confirme que le workspace seller continue de se charger, que les onglets `Demandes reçues` et `Scanner QR` restent accessibles et que la surface opérationnelle conserve son rendu glass.

| Surface | 320–375 px — règle vérifiée | 768 px | 1280 px — observation production |
|---|---|---|---|
| Cartes de résultats buyer | Largeur contrainte à `min(19rem, 100vw - 1.5rem)` ; texte avec `break-words` ; les quatre métriques restent en grille 2 colonnes | La carte conserve son gabarit compact | Aucun débordement horizontal observé |
| Dock de recherche | Grille mono-colonne pour quantité/budget ; boutons et champs en largeur disponible | Passage progressif vers deux colonnes | Dock centré et contenu dans la largeur utile |
| Panneau seller availability | Champs prix et quantité désormais `w-full` sur mobile puis tailles compactes à partir de `sm` | Les contrôles reviennent en ligne avec `flex-wrap` | Rendu inchangé et réponse Available opérationnelle |
| Scanner QR seller | Champ et bouton empilés sur mobile ; bouton pleine largeur | Retour en ligne à partir de `sm` | Scan et rafraîchissement des transactions conservés |
| Panneau buyer Orders/QR | Sheet pleine largeur sous `sm`, boutons pleine largeur, timeline avec texte compact | Sheet limitée à `md` | Timeline et QR vérifiés dans le parcours complet |
| Navigation seller | Grille de raccourcis mobile 2 colonnes ; onglets secondaires avec défilement horizontal intentionnel | Raccourcis 4 colonnes | Aucun élément hors écran observé à `1280px` |

Le contrôle runtime à `1280px` a confirmé `document.scrollWidth = document.clientWidth` et aucun élément visible ne dépassait les limites horizontales du viewport. Les règles mobile sont désormais explicites sur les formulaires seller les plus sensibles. Une capture automatisée avec viewport matériel 320/375 px reste recommandée si un appareil physique ou un runner mobile est disponible ; aucun runner Playwright/Puppeteer n’était présent dans l’environnement de vérification actuel.
