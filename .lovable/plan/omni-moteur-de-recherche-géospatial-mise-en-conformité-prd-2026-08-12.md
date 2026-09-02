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
- Carte de résultat : badge d'état, note, nombre de transactions, prix min, remise, disponibilité, ouvert/fermé, vitrine(contenu...).
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
  
  
Je voudrais aussi faire un ajout au modèle économique. Pour les utilisateurs free, d'accord, ils peuvent faire les recherches et tout ça, d'accord? Et ils peuvent avoir trois demandes gratuites de disponibilité en gros par mois, d'accord? Maintenant, la vérification de disponibilité sur les facilités d'un résultat de recherche ne doit pas être limitée à un nombre précis. C'est sur toutes les facilités trouvées. On vérifie la disponibilité en bulk. Ça fait que les vendeurs qui sont en pro ne vont pas sentir le spaming de ça. Mais ceux qui sont en free, bon, voilà, ils vont devoir reprendre assez beaucoup, d'accord? Donc si les vendeurs sont en pro, leur agent IA répond. Maintenant, pour l'utilisateur qui est en free, il a droit de sept demandes, en fait. Ou, quand il envoie la demande de disponibilité, c'est automatique chez tous les vendeurs, en fait. Et maintenant, quand la réponse vient, son agent IA, en fait, lui fait le sommaire de, voilà quoi, du résultat en fait. Il n'a pas besoin de venir lire. Par exemple, 700 facilités, il n'a pas besoin de venir lire un à un, tout ça, tout ça. Son agent IA lui dit OK, tu as tel nombre de facilités trouvées, tout ça, cela, cela, ont, celui-ci a cette quantité, tout ça, tout ça. Donc, la meilleure recommandation pour toi serait ici actuellement. Et à partir de là, l'utilisateur peut juste faire sa décision d'achat ou bien d'annulation. Donc, il peut dire OK, on va payer chez tel truc-là, donc je veux acheter chez truc-là. Et c'est là que le paiement de la transaction est généré quoi, tu vois. Donc, ça enlève encore un poids sur l'utilisateur. Donc, l'utilisateur free a accès à ce modèle-là, ils ont trois gratuitement chaque mois. Maintenant, s'ils veulent utiliser plus, ils doivent être en plan pro aussi. Donc, nos utilisateurs aussi peuvent avoir un plan. Donc, le plan là peut être à un ou deux dollars le mois. Et il y a un nombre limité de crédits que leur plan leur offre. Maintenant, si jamais ils finissent leur crédit que leur plan leur alloue, bon, il suffit qu'ils rechargent leur solde en ligne qu'ils en achètent quoi. Et là, ça veut dire qu'on facture la demande de disponibilité. En fait. Donc, notre modèle économique est bouclé des deux côtés. Donc en resume le flow serait je fais ma recherche avec les contrainte de quantite et de budget les resltats sortent et au niveau du nombre de resultat je peux avoir une option verify disponibility qui differe de si je cliquais sur chaque facilite individuellement. Cette option donne acces a la verification de disponibilite en bulk chez toutes ces facilites ensuite il y a la reponse de soit lagent ia du vendeur sil est en pro ou de lui meme sil est en free et de la mon agent ia me fait le rapport dans la section requests ou ailleurs avec sa recommendation et je peux dire exactement ce que je fais si je suis sa recommandation ou non et la le qr est gen et le flow achat dans le chat.. peut etre meme on peut laisser lagent poursuivre le reste de la transaction pour luser dans le chat il y a juste des points de controle pour luser et la encore il peut choisir le niveau dautomatisation donc oui non je veux acheter ici telle quantite et pour.. par exemple et peut etre la confirmation de paiement ce seront les seules friction encore lusr peut decider de laisser lagent sen charger pour nos users pros...