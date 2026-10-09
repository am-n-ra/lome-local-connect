# Heartwood `HP-4` — cinq surfaces d'API client sans UI : traitées, pas oubliées (2026-10-07)

> **Porte :** `TRUNK_CLOSED_HEARTWOOD_OPEN` (durcissement — pas de nouvelle fondation).
> **Décision fondateur :** « allons avec les clients UI » — câbler les fonctions d'API client
> construites mais jamais appelées par le produit.

## 1. La classe

`src/trunk/client-api-surface.test.ts` (garde déjà présent) échoue si une fonction d'API
**exportée** n'a **aucun appelant produit**. Cinq étaient en liste blanche `KNOWN_DORMANT` :
`getOperatorRuns`, `importPublicFacility`, `importPublicFacilityBatch`,
`getSellerActivationQueue`, `getBuyerProRenewalStatus`.

**En les ouvrant, la mesure a montré qu'elles ne sont PAS une seule catégorie :**

| Fonction | Nature réelle | Résolution |
|---|---|---|
| `getSellerActivationQueue` | **doublon** — route legacy `reviewer=seller-activations`, alors que `AdminV13` utilise déjà `getAdminSellerActivationQueue` (`/admin/seller-activations`) | **RETIRÉE** (client + route serveur morte) |
| `getBuyerProRenewalStatus` | **doublon** — route legacy `buyer/pro/renewal-status` renvoyant **exactement** `getBuyerProStatus` (l'opt-in est déjà porté par l'entitlement) | **RETIRÉE** (client + route serveur morte) |
| `importPublicFacility` | **superseded** — un `importPublicFacilityBatch({items:[x]})` est strictement équivalent et déjà le chemin réel | **RETIRÉE** (client + route `operator-import` morte) |
| `importPublicFacilityBatch` | **capacité réelle** — l'import de lieux publics n'existait QUE par script serveur, invisible de l'app | **CÂBLÉE** |
| `getOperatorRuns` | **capacité réelle** — l'historique des runs d'opérateur n'était montré nulle part | **CÂBLÉE** |

**Livrer une UI pour un doublon aurait créé DEUX points d'entrée pour un même acte** — c'est
l'inverse du durcissement. La bonne moitié de « câbler les clients UI » est donc parfois
**retirer**, pas ajouter.

## 2. Livré — `AdminImportConsole`

Composant `src/trunk/AdminImportConsole.tsx`, monté dans `AdminV13` (espace équipe) :

- **Import batch** : collez un tableau JSON de lieux (`sourceRef`, `name`, `latitude`,
  `longitude`, `category?`, `address?`) + attribution ODbL (pré-remplie). Validation **côté
  client** (JSON, champs requis) avant tout appel ; le serveur garde ses propres gardes
  (zone pilote, quarantaine). Compte rendu : traités / créés / déjà présents + « unclaimed ».
- **Historique des runs** : liste `operation · provider · N résultats · outcome/errorClass`,
  bouton Actualiser, squelette de chargement (SK-3), états vides honnêtes.

**Honnêteté** : l'import ne crée que des lieux **non revendiqués** ; l'attribution est
**requise** ; un point hors zone pilote est **refusé** (jamais publié en silence). Rien n'est
présenté comme « vérifié ».

## 3. Nettoyage cohérent

- **Client** : `api.ts` perd 3 fonctions ; `api.test.ts` perd leurs tests exacts ; la liste
  blanche `KNOWN_DORMANT` devient **vide** (les 3 mortes retirées, les 2 vivantes câblées).
- **Serveur** : `http.ts` perd 3 branches mortes (`reviewer=seller-activations`,
  `buyer/pro/renewal-status`, `operator-import`). **Fonctions de dépôt conservées** (additives,
  jamais destructives) — seules les **routes** non consommées partent.
- **Aucun besoin de la route `operator-import`** : le chemin batch couvre le cas singulier.

## 4. Preuves

- **Rendu jsdom réel** (`AdminImportConsole.test.tsx`, 3) : historique chargé et affiché ;
  JSON invalide → **aucun appel serveur** + message ; tableau valide → la **vraie**
  `importPublicFacilityBatch` est appelée avec l'item parsé, compte rendu affiché.
- **Garde de surface** : liste blanche vide ; un ajout de fonction sans appelant fait échouer.
- **Bundles vérifiés** : console présente dans le **client** servi (`dist/assets/index-*.js`) ;
  jumeaux retirés et routes mortes **absents** du client **et** des bundles serverless
  (`api/v2/*.js`, régénérés dans le même commit).
- **Batterie** : **1004/1004** (115 fichiers), `tsc` 0, 5 gardes vertes.
- **T-07d** : à confirmer après push.

## 5. Résidu honnête

- **`getOperatorRuns` reste une liste d'observation** : pas de filtre, pas de pagination, pas
  de relance d'un run échoué (ce serait une capacité neuve). L'import **publicitaire/Osm** de
  masse reste piloté par script ; la console cible l'ajout ponctuel traçable.
- **Pas de preuve navigateur** d'import réel : exige une **session admin** réelle (sandbox sans
  DB/auth) — le contrat est prouvé à la couche composant + à la couche API.
