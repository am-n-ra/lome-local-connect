# Omni V1 — Réparer, auditer, simplifier

Audit exécuté sur la préversion (mobile 390px) : `/`, `/carte`, `/vendeur`, `/onboarding`, `/admin`, `/auth`.

## Constat runtime (mesuré, pas supposé)

Toutes les routes sauf `/auth` sont **cassées à l'hydratation** par une seule erreur :

```text
Uncaught TypeError: import_browser_external_node_async_hooks.AsyncLocalStorage is not a constructor
```

Conséquences observées :
- `/` et `/carte` : 0 `<canvas>`, bloqués sur « Chargement de la carte… / Localisation en cours… ».
- `/vendeur` : bloqué sur « Chargement… ».
- `/onboarding` : bloqué sur « Préparation de votre espace… ».
- `/admin` : page vide (0 caractère).
- `/auth` : seule route qui rend réellement.

Cause identifiée : `src/lib/auth-middleware.ts` n'a pas d'extension `.server`, donc il n'est pas exclu du bundle navigateur, et il importe statiquement `neon-auth.server` → `db.server` → driver Neon → `async_hooks`. Tous les modules `*.functions.ts` importent ce fichier, donc la chaîne serveur part dans le client sur chaque route. Les symptômes « MapLibre bloqué », « onboarding silencieux », « admin blanc » de l'audit précédent sont tous ce même bug, pas trois bugs distincts.

Tant que ce point n'est pas corrigé, aucun autre constat UI ou flow n'est mesurable en conditions réelles.

## Lot 0 — Déblocage (P0, avant tout le reste)

1. Sortir la chaîne serveur du bundle client : renommer `src/lib/auth-middleware.ts` en `auth-middleware.server.ts` (ou charger `neon-auth.server` dynamiquement dans les handlers), et vérifier chaque `*.functions.ts` : au niveau module, seulement imports, types et déclarations de server functions.
2. Ajouter un garde-fou permanent : vérification automatisée que le bundle client ne contient aucun module `.server` ni built-in Node.
3. Re-passer le scan des 6 routes : zéro `pageerror`, canvas carte présent, onboarding et admin qui rendent.
4. Carte : timeout + état d'erreur + bouton « Réessayer » sur le chargement MapLibre, au lieu d'un spinner infini.
5. Auth : distinguer explicitement `loading` / `signed-out` / `signed-in`. Un état de chargement ne doit jamais durer indéfiniment ; `signed-out` redirige vers `/auth`, `forbidden` affiche un écran clair sur `/admin`.

## Lot 1 — Audit complet réel (livrable écrit)

Une fois l'app rendue, parcours end-to-end scripté (mobile + desktop) sur : découverte carte, recherche, mur de compte, fiche facility, availability simple et bulk, comparaison, intention d'achat, QR, chat/timeline, clôture et avis, puis côté vendeur : onboarding, facility, produit, availability, requests, transactions, promotions, ads, balance, plan, paramètres, et enfin admin.

Rapport structuré en quatre parties, chaque ligne avec écran, preuve (capture ou log), impact et priorité P0–P3 :
1. Divergences UI (écarts avec la vision Omni V1, incohérences de composants, densité, états manquants).
2. Dettes UX / convenience / accessibilité (nombre de gestes, libellés, feedback, focus, contraste, cibles tactiles, safe-areas).
3. Défauts logiques (états morts, doublons d'intention, expirations, retries, erreurs avalées, tabs orphelines côté vendeur : balance, plan, paramètres, agent).
4. Risques financiers et intégrations (coupons, soldes, webhooks FedaPay, QR rejouable, quotas) + dettes de performance.

## Lot 2 — Simplification de l'UI et des flux (le cœur de la demande)

Principe : **un écran = une décision**. La carte reste la maison ; tout le reste est une couche qui s'ouvre, se décide, se ferme.

### Acheteur — un seul fil, cinq gestes
1. Ouvrir → carte à ma position, une barre de recherche en bas, rien d'autre.
2. Chercher → résultats en liste synchronisée avec les pins ; la card met en avant l'objet cherché (prix, distance, statut), pas le nom du commerce.
3. Ouvrir une card → fiche courte : ce que je cherche, prix, distance, confiance, un seul bouton `Vérifier la disponibilité`.
4. Réponses → un écran de comparaison, la meilleure option mise en avant, un seul bouton `Je veux acheter`.
5. Transaction → un fil unique : QR en haut, étapes en cards dans le fil, une action à la fois.

Tout ce qui n'est pas sur ce chemin (panier, wishlist, demandes, messages) est regroupé dans le menu, jamais en concurrence avec le chemin principal.

### Vendeur — deux vues, zéro tab orpheline
- Un header vendeur avec bascule `Carte / Console`, statut en ligne, solde, plan.
- Carte : mes facilities, aperçu exact de ce que voit l'acheteur, position, zones d'ads.
- Console : `Facilities`, `Catalogue`, `Requests`, `Transactions`, `Promotions`, `Ads`, `Balance & Plan`, `Paramètres` — toutes exposées, aucune section implémentée mais inaccessible.
- Chaque section : une ligne de métriques, une liste dense, actions inline. Répondre à une demande de disponibilité = un geste (`Disponible / Partiel / Indisponible` + quantité + prix).

### Onboarding — court et interrompable
- Acheteur : bienvenue → localisation → centres d'intérêt → carte. Skippable, reprise au même point.
- Vendeur : identité → facility sur la carte → catégorie → premier produit → horaires → récapitulatif « ce que voit un acheteur ».

### Langage visuel
Glassmorphism conservé mais discipliné : le verre uniquement pour ce qui flotte au-dessus de la carte ; les listes, formulaires et la console vendeur passent sur des surfaces opaques lisibles. Trois niveaux de surface (`float`, `sheet`, `page`), une échelle typographique, un jeu de badges de statut unique, des primitives partagées (sheet avec header collant et footer d'action, section header, état vide, stat card, stepper).

## Lot 3 — Certification fonctionnelle

- Tests d'intégration sur la boucle transactionnelle : intention en double, expiration, retry de paiement, QR déjà consommé, application de coupon, impact sur les soldes.
- Tests des quotas (bulk availability Free/Pro) et des limites vendeur.
- Scan automatisé des routes : zéro erreur console, zéro débordement horizontal à 360 / 768 / 1280, chaque écran atteint un état stable.
- Critères de sortie : Lot 0 vert, rapport du Lot 1 sans P0 restant, boucle transactionnelle couverte par des tests.

## Détails techniques

- Correctifs frontière serveur/client dans `src/lib/auth-middleware.ts` et les `*.functions.ts` ; aucune modification du schéma.
- Nouvelles primitives sous `src/components/omni/ui/`, sections vendeur sous `src/components/omni/vendor/console/`.
- `src/routes/vendeur.tsx` (1216 lignes) et `src/routes/carte.tsx` (978 lignes) éclatés en sections ; la machine d'états `src/lib/omni-state.ts` reste la source de vérité.
- Refonte de présentation : les server functions, migrations et règles métier existantes sont réutilisées telles quelles.

## Ordre de livraison

1. Lot 0 (déblocage) — indispensable, rien d'autre n'est vérifiable avant.
2. Lot 1 (audit réel et rapport priorisé).
3. Lot 2 (simplification acheteur, puis vendeur, puis onboarding).
4. Lot 3 (tests et certification).
