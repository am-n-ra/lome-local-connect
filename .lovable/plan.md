# Omni — Refonte UI v2 : un langage d'interface unique

Objectif : garder la coque map-first acheteur (qui fonctionne) et remonter au même niveau tout le reste — menus, onboarding, availability, transaction, vendeur, catalogue, ads, import. Une seule grammaire visuelle, livrée par lots.

## Direction retenue

- Glassmorphism **conservé mais discipliné** : le flou est réservé aux couches qui flottent au-dessus de la carte (dock de recherche, sheets, contrôles). Tout contenu dense (listes, formulaires, tableaux, catalogue) passe sur une surface quasi opaque, lisible, avec une hiérarchie typographique nette.
- Trois niveaux de surface : `float` (verre, au-dessus de la carte), `sheet` (panneau opaque translucide léger), `page` (fond plein, densité console).
- Vendeur : **hybride**, recommandé. Carte pour ce qui est spatial (facilities, zones d'ads, aperçu acheteur) ; console pour ce qui est tabulaire (catalogue, requests, transactions, balance, abonnement). Un seul header vendeur, un switch `Carte / Console`.
- Transaction : **timeline chat**. Le fil est la source de vérité ; chaque étape est une card d'événement dans le fil (intent, offre, QR, paiement, réception, clôture), avec une barre d'état compacte épinglée en haut du fil.

## Lot 1 — Socle d'interface partagé

- Tokens de surface (`--surface-float`, `--surface-sheet`, `--surface-page`), rayons, ombres et échelle typographique unifiés dans `src/styles.css`.
- Primitives partagées : `OmniSheet` (bottom sheet mobile / side sheet desktop, header sticky, contenu scrollable, footer d'action collant), `OmniSectionHeader`, `OmniEmptyState`, `OmniStatCard`, `OmniStatusBadge` (statuts facility, availability, transaction), `OmniStepper`.
- Règle mobile : tout panneau a une hauteur max, un scroll interne, un footer d'action toujours visible, et respecte les safe-areas. Fin des panneaux qui dépassent de l'écran.

## Lot 2 — Navigation et menu

- Menu remplacé par un panneau structuré : en-tête identité (avatar, plan, solde), puis groupes courts — `Activité` (recherches, disponibilités, transactions, messages), `Compte` (profil, plan, balance, notifications, paramètres), `Espace` (switch Acheteur / Vendeur), `Aide`.
- Chaque ligne porte une valeur à droite (compteur, statut, solde) au lieu d'un simple libellé.
- Notifications : panneau dédié groupé par type, avec deep-link vers l'état concerné (recherche, availability, intent, QR, paiement, transaction).
- Suppression des doublons actuels (« Produits recherchés » / « Recherches », « Vérifier la disponibilité » / « Disponibilités »).

## Lot 3 — Onboarding

- Acheteur : séquence courte plein écran — bienvenue, localisation (avec l'animation d'atterrissage carte), centres d'intérêt, puis dépôt direct sur la carte. Skippable, reprise possible.
- Vendeur : parcours en étapes avec progression persistante — identité, facility (position sur carte), catégorie, premier produit, horaires, certification. Chaque étape est une carte unique avec un seul objectif, plus un récapitulatif final « ce que voit un acheteur ».
- Un composant d'étape commun aux deux parcours.

## Lot 4 — Availability et comparaison

- Demande d'availability en 3 pas dans une seule sheet : quoi (produit/variante/quantité), où (facility unique ou bulk sur les résultats), contraintes (distance, délai ; budget privé, jamais transmis au vendeur).
- Compteur de quota bulk visible pour Buyer Free, message clair à la limite.
- Écran de comparaison des réponses : cards triables (quantité couverte, prix, distance, délai de réponse, niveau de confiance), la meilleure mise en avant, action `Créer l'intention d'achat` directe.
- Côté vendeur : réponse en un geste depuis la console et depuis la notification — `Disponible / Partiel / Indisponible` + quantité et prix.

## Lot 5 — Transaction (timeline chat)

- Une surface transaction unique : barre d'état épinglée (étape courante + montant + facility) puis fil chronologique.
- Cards d'événement typées dans le fil : intention créée, offre confirmée, QR généré (QR affiché en grand, code manuel de secours), vérification vendeur, paiement, réception, clôture, avis.
- Actions contextuelles en pied de fil, jamais plus de deux à la fois ; la confirmation reste toujours à l'utilisateur.
- Même timeline côté vendeur, avec les actions inversées.

## Lot 6 — Vendeur : carte + console

- Header vendeur avec switch `Carte / Console`, indicateur online/offline, solde et plan.
- Vue Carte : uniquement ses facilities, aperçu fidèle de la fiche acheteur, édition de position, zones d'ads.
- Vue Console : sections `Facilities`, `Catalogue`, `Availability & Requests`, `Transactions`, `Promotions`, `Ads`, `Balance & Abonnement`, `Paramètres`. Navigation latérale desktop, sélecteur compact mobile.
- Chaque section commence par une ligne de métriques puis une liste dense avec actions inline.

## Lot 7 — Catalogue, création produit, import, ads

- Création produit : formulaire en une colonne, sections repliables (essentiel visible, options repliées), aperçu live de la card acheteur à côté (desktop) ou en bas (mobile).
- Import : écran dédié — source, mapping des colonnes, prévisualisation des lignes avec erreurs signalées, import partiel accepté, rapport final.
- Promotions et ads : builder en étapes avec estimation de portée et coût, statut de campagne lisible, arrêt/reprise en un geste.
- Cards produit et facility homogènes entre acheteur, aperçu vendeur et résultats de recherche : un seul composant.

## Détails techniques

- Nouveaux composants sous `src/components/omni/ui/` (primitives) et `src/components/omni/vendor/console/` (sections vendeur).
- `src/routes/vendeur.tsx` éclaté en sections pour sortir des 1200 lignes actuelles ; `src/routes/carte.tsx` conserve la machine d'états (`src/lib/omni-state.ts`) et délègue les panneaux.
- Refonte présentation uniquement : les server functions, migrations et règles métier existantes sont réutilisées telles quelles. Les seules données nouvelles éventuelles sont des champs d'affichage déjà disponibles.
- Audit responsive final sur chaque nouvel écran : 360px, 768px, 1280px, aucun débordement horizontal, footer d'action accessible.

## Ordre de livraison

1. Lot 1 + 2 (socle, navigation)
2. Lot 4 + 5 (availability, transaction timeline)
3. Lot 6 + 7 (vendeur, catalogue, import, ads)
4. Lot 3 (onboarding, une fois le langage stabilisé)
