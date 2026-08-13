# Omni — plan de mise en production (base : commit a645ec7)

Point de départ : le code est ramené exactement à `a645ec7` (les commits d'harmonisation visuelle et l'index de recherche WIP qui suivent sont abandonnés). La base de données Neon, Neon Auth, les migrations 001→010 et l'import OSM (~4 000 facilities) sont conservés tels quels.

Objectif : une application web complète, réellement fonctionnelle de bout en bout, conforme au PRD v3, livrée en une seule grosse passe. Les phases 7 et 8 du PRD (app native, push arrière-plan, offline, découverte d'appareils, réplication multi-villes) restent hors périmètre : on prépare le terrain (API documentée, configuration marché, analytics) sans les construire.

---

## 1. Fondations et identité

- Nouveau logo pin-œil 3D appliqué partout : favicon carré, bouton de recherche du dock, en-têtes, pages d'auth, écrans de chargement.
- Design system unifié dans `src/styles.css` : palette quasi-blanche désaturée, accents terracotta / vert profond / or, surfaces frostées (glassmorphism), ombres douces, tokens uniquement — aucune couleur en dur dans les composants.
- Entité **Market** : devise, rail de paiement, canal communautaire, activation du parcours de certification informelle, langue par défaut. `TG-LOME` est une ligne de configuration, jamais une valeur codée en dur. Tous les montants s'affichent dans la devise du marché.
- Rôles propres : un compte unique peut être acheteur, vendeur ou les deux. Garde serveur obligatoire sur toute opération coûteuse (IA, crédits, paiement, admin).

## 2. Accueil = la carte

- `/` devient directement l'expérience carte (la page marketing reste sur `/a-propos`).
- Chrome minimal : pas de barre de navigation, pas de logo en haut à gauche, un seul bouton menu en haut à droite, carte plein écran.
- Dock bas conforme au mockup : pilule frostée `[caméra] | champ texte | [micro] [bouton logo]`, catégories masquées derrière un chevron, icône filtre discrète, compteur de résultats au-dessus de la pilule.
- Carte : style pastel minimal, pins petits et lisibles, états visuels distincts (normal, sélectionné, actif, confirmé, sponsorisé, disponibilité vérifiée), zoom initial sur la position de l'utilisateur, globe 3D au dézoom, clustering pour tenir la charge.
- Visiteur non connecté : il peut chercher et voir la carte ; le mur de compte apparaît au moment d'agir (demande de disponibilité, achat), et la recherche d'origine reprend automatiquement après inscription.

## 3. Moteur de recherche

- Index unifié `search_documents` (facilities, produits, services, offres, médias) déjà en base : reconstruction complète et triggers de synchronisation vérifiés.
- Server function `omniSearch` unique, avec modes Tout · Produits · Services · Offres · Commerces · Images · Vidéos · Articles, la carte restant l'ancre géographique dans tous les modes.
- Intention de recherche : contraintes de quantité et de budget comprises depuis la requête ; recherche « problème → solution » par expansion IA quand rien ne matche directement.
- Ranking combiné : pertinence, disponibilité, proximité, prix, remise, note, historique de transactions, sponsoring (jamais sur une requête non pertinente).
- Recherche vocale (français, éwé, mina) et par image branchées sur la couche IA existante, derrière une abstraction fournisseur.
- Zéro résultat → capture de demande, jamais un écran vide.

## 4. Cycle de vie des fiches et vendeurs

- Statuts alignés sur le PRD : `unclaimed` → `certified` → `unconfirmed` → `confirmed`, avec les deux chemins prévus (growth path par 3 transactions prouvées, fast path par abonnement Pro sans bonus).
- Réclamation de fiche ou création si absente, file de certification côté admin (documents, identité, preuve d'adresse), passage au canal communautaire obligatoire pour devenir visible.
- Catalogue vendeur : produits et services, remise obligatoire à la création, stock Omni (`omni_stock_quantity`) distinct du stock réel, 5 produits max en gratuit, import de catalogue en masse assisté par IA.
- Agent IA vendeur (Pro, consomme des crédits) avec ses 3 niveaux : assistance, réponse automatique de disponibilité, commande automatique.
- Présence mobile en self-service pour tout vendeur de service, en avant-plan uniquement.

## 5. Disponibilité, transaction, chat

- Vérification individuelle depuis une fiche, et **« Vérifier la disponibilité de tous »** au-dessus de la liste de résultats : fan-out sur toutes les facilités du résultat filtré, sans plafond codé en dur.
- Crédits proportionnels au nombre de facilités interrogées, pas au nombre de demandes. Allocation mensuelle gratuite calibrée sur ~3 demandes moyennes ; palier Pro acheteur avec recharge à l'unité.
- Réponses : agent IA si le vendeur est Pro, réponse manuelle sinon. Elles arrivent groupées dans **Mes demandes** via `bulk_request_id`.
- Rapport de l'agent IA acheteur : synthèse (qui a quoi, en quelle quantité, à quel prix) et recommandation explicite ; l'acheteur suit ou choisit autre chose.
- « Je veux acheter » comme étape explicite : c'est seulement là que le contact vendeur et le chat s'ouvrent, que le QR est généré et que l'achat se poursuit dans le chat, avec des points de contrôle et un niveau d'automatisation choisi par l'acheteur.
- Machine à états complète des transactions, QR d'autorisation, parcours en personne et à distance, paiement in-app FedaPay ou hors-app confirmé, confirmation de réception avant notation, notation 5 étoiles.

## 6. Monétisation et administration

- Acheteur Free / Pro, vendeur Free / Pro, abonnements, crédits IA, trois compteurs distincts (solde retirable, crédits IA, crédits publicitaires promotionnels non retirables).
- Trois formats publicitaires distincts : ranking sponsorisé, recommandation sponsorisée, carte sponsorisée sur le pin.
- Admin : file de certification, modération, audit financier, reversement semi-manuel, intelligence de la demande, analytics et attribution d'acquisition.

## 7. API et finition production

- API publique `/api/public/v1` complétée : `/search`, `/facilities`, `/facilities/{id}`, `/offers`, `/stats`, avec clés d'API et quotas ; OpenAPI 3.1 et page `/api-docs` à jour.
- Contrôle du coût IA, limitation de débit serveur, états d'erreur explicites partout, i18n prête (français par défaut), performance carte et recherche, audit responsive mobile-first, métadonnées SEO par route.

---

## Détails techniques

- Retour de l'arbre de travail à `a645ec7` ; migrations SQL additionnelles pour Market, stock Omni, `bulk_request_id`, crédits proportionnels, certification et publicité (les tables `search_documents`, `user_plans`, `credit_accounts`, `credit_ledger`, `transaction_items` existent déjà).
- Correctif bloquant immédiat : `expandProblemQuery` manquante dans `src/lib/ai-search.server.ts`, importée par `src/lib/search-index.server.ts` — le build échoue tant qu'elle n'existe pas.
- Nouveaux modules : `src/lib/market.server.ts`, `src/lib/agent.server.ts` (agents IA vendeur/acheteur), extension de `search.functions.ts`, `demand.functions.ts`, `payments.functions.ts`, `admin.functions.ts`.
- UI : refonte de `SearchDock`, nouveau panneau de résultats, onboarding acheteur et vendeur, mise à jour de `MapCanvas`, `FacilityPanel`, `ChatPanel`, `admin.tsx`.
- Toutes les fonctions serveur restent des wrappers fins (`createServerFn`), la logique vit dans les modules `.server.ts`.

## Ordre d'exécution

1. Reset sur `a645ec7`, build vert, identité et design system
2. Accueil carte + dock + chrome minimal
3. Moteur de recherche complet et modes de résultats
4. Statuts de fiches, certification, onboarding vendeur, catalogue
5. Disponibilité en masse, crédits, agents IA, rapport et recommandation
6. Transaction QR, chat transactionnel, paiement
7. Monétisation, publicité, admin, analytics
8. API, OpenAPI, durcissement et audit responsive
