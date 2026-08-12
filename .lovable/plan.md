# Omni — moteur de recherche géospatial : mise en conformité PRD

Objectif : aligner l'app sur le PRD « Omni — Geospatial Supply & Demand Search Engine » : la carte devient l'écran d'accueil, la recherche devient un vrai moteur indexé (texte / voix / image / problème), le cycle de vie des facilities passe à 5 états avec deux vérifications distinctes, et les parcours acheteur / vendeur / transaction sont complétés.

## 1. Identité et écran d'accueil

- Nouveau logo/icône : le pin-œil fourni devient le favicon, l'icône d'app et le bouton de recherche du dock.
- `/` n'est plus une landing : redirection vers l'expérience carte (la page marketing actuelle est conservée sur `/a-propos`).
- Chrome minimal conforme au mockup : aucune barre de navigation, **aucun logo en haut à gauche**, un seul bouton menu (hamburger) en haut à droite, la carte occupe tout l'écran.
- Dock bas repensé : pilule frostée `[caméra] | champ texte | [micro] [bouton logo = rechercher]`.
- Catégories **masquées par défaut** : un petit chevron au-dessus de la pilule déplie le rail de catégories + l'icône filtre (pas de texte « Filtres »).
- Compteur discret « 37 résultats » juste au-dessus de la pilule après une recherche.

## 2. Moteur de recherche et indexation

- Nouvelle table d'index `search_documents` (une ligne par facility, produit, service, offre, contenu média/article) avec vecteur texte Postgres (`tsvector` FR + trigram), catégorie, prix, remise, géolocalisation, statut de facility, signaux de qualité. Alimentée par des triggers sur `facilities`, `products`, `offers`, `facility_media`.
- Server function `omniSearch` unique : parse la requête (texte, ou terme issu de la voix / de l'image), interroge l'index, et retourne des résultats typés.
- **Modes de résultats** : Tout · Produits · Services · Offres · Commerces · Images · Vidéos · Articles. La carte reste l'ancre géographique dans tous les modes.
- **Recherche problème → solution** : quand la requête ne matche pas directement, expansion sémantique par IA (« mon PC chauffe » → pâte thermique, réparateur, ventilateur) puis re-recherche sur l'index.
- **Ranking** combiné : pertinence, disponibilité, proximité, prix, remise, note vendeur, historique de transactions, sponsoring (jamais sur une requête non pertinente).
- Géographie : tous les résultats pertinents restent affichés, la carte se recentre automatiquement sur les plus pertinents proches.
- Zéro résultat → capture de demande (« Dites-nous ce que vous cherchez ») au lieu d'un message vide.
- Voix et image restent branchées sur la couche IA existante, derrière une abstraction fournisseur.

## 3. Cartes de résultats et états de facility

- Cycle de vie corrigé à 5 états : `unclaimed → uncertified → certified → unconfirmed → confirmed` (migration + backfill des données existantes).
- Deux vérifications distinctes et affichées séparément sur la fiche et la carte de résultat :
  - **Certification** — vérifiée par Omni (documents, identité, preuve d'adresse) via un workflow admin de soumission/validation.
  - **Confirmation** — méritée : 3 transactions QR réussies auprès de 3 acheteurs distincts (logique déjà en base, à raccorder au nouvel état).
- Carte de résultat : badge d'état, note, nombre de transactions, prix min, remise, disponibilité, ouvert/fermé, vitrine.
- Facilities inchangées côté source : on garde le stock d'unclaimed déjà importé, aucun nouveau pipeline.
- Sponsorisé : panneau promotionnel compact sur le pin (image produit, prix barré, remise).

## 4. Parcours

- **Onboarding acheteur** : compte → centres d'intérêt → explication du modèle de recherche → canal communautaire optionnel.
- **Onboarding vendeur** : réclamer ou créer une facility → canal vendeur **obligatoire** → soumission de certification → limite 5 produits gratuits → remise obligatoire à la création d'un produit.
- **Transaction** : machine à états complète `pending → qr_generated → qr_verified → payment_pending → paid → fulfillment → user_confirmed → completed` (+ cancelled / failed / disputed / expired / refunded), lignes de transaction avec quantité, prix unitaire, remise, total.
- Contact vendeur et chat révélés uniquement après « Je veux acheter ».
- Paiement : choix in-app (wallet) ou hors-app (« J'ai payé » + confirmation vendeur).
- Wallet éclaté en trois compteurs : solde Omni, crédits IA, crédits publicitaires (crédits inclus expirant au renouvellement).

## 5. Couche API

- Extension de l'API publique `/api/public/v1` : `/search` (mêmes modes et filtres), `/facilities`, `/facilities/{id}`, `/offers`, `/stats`, avec clés d'API et quotas.
- Mise à jour de l'OpenAPI 3.1 et de la page `/api-docs`.

## Détails techniques

- Migration `009_omni_search.sql` : `search_documents` + index GIN/GiST, triggers de synchronisation, extension de `facilities_status_check` à 5 valeurs, table `certification_submissions`, tables de crédits (`credit_accounts`, `credit_ledger`), extension des états de `transactions` et de `transaction_items`.
- Nouveaux modules : `src/lib/search-index.server.ts`, `src/lib/search.functions.ts` (étendu), `src/lib/certification.functions.ts`, `src/lib/credits.functions.ts`.
- UI : refonte de `SearchDock` (chevron catégories, icône filtre, compteur), nouveau `ResultsSheet`, `OnboardingFlow`, mise à jour de `MapCanvas` (panneaux sponsorisés) et `admin.tsx` (file de certification).

## Ordre de livraison

1. Identité + écran d'accueil carte + dock conforme au mockup
2. Index de recherche + `omniSearch` + modes + compteur + zéro-résultat
3. États de facility à 5 niveaux + certification admin + cartes de résultat
4. Onboarding acheteur/vendeur + machine à états de transaction + crédits
5. API `/search` + OpenAPI + docs
