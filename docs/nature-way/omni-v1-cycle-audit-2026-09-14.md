# Audit complet V1 — cycle utilisateur vs code (2026-09-14)

> **Demande fondateur :** « refaire un audit complet de tout ce qui va mal et faire un plan concret de ce qu'on va devoir faire à partir de maintenant avant de déclarer la V1 terminée. Sans ça, on ne peut pas passer au Gate 7 (attaque terrain). »
> **Branche auditée :** `omni-v2-rebuild` @ `cea8809` (HEAD avant correction itinéraire). Build `index-BwnpSj7_.js` + correction itinéraire `index-BVwhTZ9r.js` (voir §2.1).
> **Méthode :** code-vérifié — chaque segment classé **FULL / PARTIAL / ABSENT** avec référence de fichier/ligne.
> **Statut Gate 6 :** CLOSED (« Go with limits » 2026-09-11) — **ce re-audit rouvre la question de la complétude V1 avant Gate 7.**

---

## 1. Le cycle utilisateur (vision fondateur)

Flux complet décrit par le fondateur (18 étapes) :
1. Arrivée → carte se recentre auto sur l'utilisateur, pins facilités visibles, navigation libre (**Discovery**).
2. Clic sur barre de recherche → taper une recherche → envoyer.
3. Configuration des contraintes (quantité, distance, budget…) → envoyer la requête.
4. Non authentifié → l'authentification amène vers **l'onboarding**.
5. Onboarding multi-pages qui explique le fonctionnement d'Omni, engage selon les stats de conversion (best practices), demande email + éventuellement nom.
6. **La recherche initiale gardée en mémoire** → au retour, la recherche est envoyée automatiquement.
7. Résultats : pins sur la carte + **rail latéral (desktop) OU sheet bottom (mobile)** — affichage contextuel map/sheets.
8. Option : **demande bulk** à toutes ou à certaines facilités → nombre de crédits → requête de vérification envoyée → contrôle visuel de qui répond, avec quoi, en quelle quantité.
9. Alternative : dès l'arrivée, clic sur un **pin de facilité** (sans recherche) → fiche facilité → voir les produits.
10. Alternative après recherche : choisir visuellement une facilité → sheet **contextuel au produit recherché**, produit mis en avant.
11. Ajout d'autres produits au **panier avec ce vendeur** → envoyer la demande de dispo pour tous ces produits.
12. Attendre le retour de confirmation du vendeur.
13. En fonction : **intention d'achat** — soit acheter là-bas, soit acheter le partiellement disponible, soit annuler carrément (partir ailleurs).
14. L'intention (avec contraintes de quantité) génère le **QR transactionnel** + **chat transactionnel** + **accès au contact et à l'itinéraire** vers le vendeur.
15. Le vendeur reçoit une notification, confirme la transaction → flux transactionnel.
16. Dès que l'utilisateur finit de payer (options de paiement choisies avec le système Omni) : **la transaction ne peut plus être annulée** (aussi pour le paiement en physique via la livraison).
17. Le chat transactionnel gère le déroulé.
18. Les **avis** à la fin.

+ **Correction demandée :** l'**itinéraire vers le vendeur doit être disponible de base sur chaque fiche de facilité** (aller à destination, voir la localisation) **sans** intention d'achat. Le **contact** (et le reste des informations) reste après intention.

+ **Plans Pro** acheteur + vendeur (crédits, facilités, slots) et **flow vendeur complémentaire** complet (créer facilité / réclamer / documents / vérification / certifié → confirmed → bonus 20 $) + **équipe** (enregistrer & tracker) + **admin** (vue globale).

---

## 2. Classement segment par segment (code-vérifié)

### 2.0 Corrections explicites demandées

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 0a | Itinéraire vendeur dispo **de base** sur chaque fiche facilité, sans intention | **ABSENT** → corrigé dans cette passe | `TrunkMap.tsx` a `routeTarget` + tracé Evergreen (l.84–131, 1287–1323) mais `TrunkAppV13` **ne passait jamais** `routeTarget` (vérifié : aucun `routeTarget=` avant la correction). **Correction ajoutée** : état `routeTarget` + bouton « Itinéraire vers ce vendeur » sur la fiche facilité (localisation lat/lng), `setSheet('none')` pour voir la carte. | **DONE (correction à revue)** |
| 0b | Contact vendeur **après** intention uniquement | **ABSENT source** | Aucun champ `contact`/`phone`/`whatsapp` sur `v2_facilities` (001_v2_roots.sql l.39–53). `claimant_phone` existe seulement sur `claim_requests` (038 l.103) = téléphone du **demandeur**, pas contact public vendeur. `BuyerFlowV13.tsx` n'expose **aucun** `tel:`. | **BLOCKED — dette métier racine** : il manque le modèle de données du contact vendeur (champ + exposition après intention). Rien à câbler tant que la donnée n'existe pas. |

### 2.1 Discovery (début)

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 1a | Carte se recentre auto sur l'utilisateur | PARTIAL | `TrunkMap.tsx` : `userPosition` l.254, `followTarget` l.258, géoloc `position.coords` l.386. Mais le recentrage auto initial n'est pas garanti (dépend de la géoloc + pas de "flyTo au chargement"). | PARTIAL — à vérifier : au premier chargement sans mouvement utilisateur, la carte doit se recentrer sur l'utilisateur. |
| 1b | Pins des facilités visibles | FULL | `TrunkMap.tsx` l.996 `pinFeatureCollection` + cluster. | FULL |
| 1c | Bouger la carte à liberté | FULL | `manual_navigation` mode (l.324–357). | FULL |

### 2.2 Recherche

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 2a | Barre de recherche → taper → envoyer | FULL | `TrunkAppV13` `LiquidSearchDock` + `beginSearch`. | FULL |
| 2b | Configurer les contraintes (quantité, distance, budget) | FULL | `search-constraints.ts` + chips (NW-12). | FULL |
| 2c | Requête envoyée | FULL | `runSearch` → `chipsToSearchOptions` → `setFacilities`. | FULL |

### 2.3 Auth → Onboarding

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 3a | Non authentifié → authentication mène à l'onboarding | FULL | `gateRequest`/`requireAuth` (TrunkAppV13 l.489–500) + `PendingAction`. | FULL |
| 3b | Onboarding multi-pages expliquant Omni + engagement best-practices stats | PARTIAL | `OnboardV13.tsx` : 3 étapes (1–3). Contenu éducatif limité ; pas de "stats de conversion" (multi-étapes engageantes au-delà de 3 ?) | PARTIAL — l'onboarding est fonctionnel mais minimal ; le « selon les stats sur les onboarding » (meilleure conversion : multi-pages, pourquoi, email, nom) n'est qu'à 3 étapes dont 1 formulaire. |
| 3c | Demande email + éventuel nom | PARTIAL | `OnboardV13` étape ? : vérifier champs exacts. | à vérifier |

### 2.4 Reprise de recherche après auth

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 4a | Recherche gardée en mémoire → auto-envoyée au retour | FULL | `pendingSearch` + `pendingActionResume` (ui-helpers) + `PendingAction` (TrunkAppV13 l.163–164). | FULL |

### 2.5 Résultats + contextualité map/sheets

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 5a | Pins résultats + rail latéral (desktop) OU sheet bottom (mobile) | FULL | `results` sheet + rail `omni-results-surface` desktop / sheet mobile (T-13f). | FULL |

### 2.6 Demande bulk

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 6a | Bulk à toutes ou à certaines facilités | FULL | sheet `bulk` + `requestBulkAvailability` (NW-13d-2). Sélection cases + tout/aucune. | FULL |
| 6b | Nombre de crédits | FULL | coût `ceil(N/100)` (NW-13d-2). | FULL |
| 6c | Envoyer requête à toutes les facilités | FULL | `createBulkAvailabilityRequest`. | FULL |
| 6d | Contrôle visuel qui répond / quoi / quantité | FULL | `getAvailabilityResponses` + poll groupé bulk (NW-13d-2). | FULL |

### 2.7 Choix facilité / produits / panier

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 7a | Clic pin → fiche facilité → produits | FULL | `handlePinSelect` (l.458) + fiche facilité produits `sortProductsStockFirst` + pitem. | FULL |
| 7b | Sheet contextuel au produit recherché (produit mis en avant) | PARTIAL | Après recherche, clic sur un pin → fiche facilité générique (pas de mise en avant du produit recherché sauf volume). | PARTIAL — le produit recherché n'est pas « mis en avant » dans la fiche ; à confirmer. |
| 7c | Autres produits → panier avec ce vendeur → demande dispo pour tous | PARTIAL | fiche facilité : sélection multiple produits `facProductSel` + « Demander la disponibilité (N) » → envoie N requêtes (une par produit) ou bulk si >1. Ce n'est pas un « panier » persistant mais une sélection de demande par facilité. | PARTIAL — panier multi-produits par vendeur existe en sélection ; pas de concept de panier persistant/ICV avec ce vendeur. |

### 2.8 Retour confirmation vendeur → intention

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 8a | Attendre le retour de confirmation du vendeur | FULL | `pending` stage + `getAvailabilityResponses` + SellerReplyV13. | FULL |
| 8b | Intention : acheter là-bas / partiellement / annuler | FULL | `BuyerFlowV13` stages : `result` (comparer / je veux acheter / annuler) + quantité. | FULL |

### 2.9 Intention → QR + chat + contact + itinéraire

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 9a | QR transactionnel généré à l'intention | FULL | `createPurchaseIntent` retourne `qrToken` + `issueBuyerQrToken` (BuyerFlowV13 l.187–193). | FULL |
| 9b | Chat transactionnel généré | FULL | `sendTransactionMessage` + timeline chat (BuyerFlowV13 l.113). | FULL |
| 9c | Accès contact vendeur à l'intention | **ABSENT** | aucun champ contact, aucun `tel:` (voir 0b). | **BLOCKED** |
| 9d | Accès itinéraire vendeur à l'intention | FULL | `routeTarget` (maintenant câblé) mais sur fiche ; dans BuyerFlowV13 il faut l'ajouter. | PARTIAL — à ajouter dans le flow après intention. |

### 2.10 Vendeur confirme → flux transactionnel, verrouillage

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 10a | Vendeur reçoit notification → confirme | FULL | `SellerReplyV13` + `confirmExternalPayment` + `seller_acknowledged_at` (trunk-repository l.2575+). | FULL |
| 10b | Flux transactionnel (état) | FULL | timeline intent→rating (BuyerFlowV13) + transitions serveur. | FULL |
| 10c | Après paiement → plus annulable (y c. physique/livraison) | FULL | serveur : `payment_declared` → `payment_confirmed` gated par `current_state = 'payment_declared'` (l.2569). | FULL (serveur) |
| 10d | Paiement physique via livraison | FULL | `deliveryMode` retrait/livraison + `declareExternalPayment` (BuyerFlowV13 l.235–244). | FULL |

### 2.11 Avis

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 11a | Avis à la fin | FULL | `submitTransactionRating` + `rated`/`closed` (BuyerFlowV13 + trunk-repository l.2743–2820). | FULL |

### 2.12 Plans Pro (acheteur + vendeur)

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 12a | Plans Pro acheteur (crédits/facilités/slots) | FULL | `activateBuyerPro`, `renewBuyerPro`, `setBuyerProRenewalOptIn`, `buyerProStatus` (TrunkAppV13 l.850–891, 1809–1827). Quota compare 5. | FULL |
| 12b | Plans Pro vendeur (crédits/facilités/slots) | FULL | `activateFacilityPro` + renewal (NW-13g) + slot free (NW-13c). | FULL |

### 2.13 Flow vendeur complémentaire + équipe + admin

| # | Exigence | Statut | Référence code | Verdict |
|---|---|---|---|---|
| 13a | Vendeur crée sa facilité | FULL | `createSellerFacility` + formulaire 3 types (NW-13c). | FULL |
| 13b | Vendeur réclame une facilité (documents) | FULL/PARTIAL | `createFacilityClaimDraft` + parcours preuve + documents (`claim_requests`). | FULL-PARTIAL — vérifier l'envoi réel de documents. |
| 13c | Vérification → certifié → onconfirmed/confirmed | FULL | trust_state machine (`verification_submitted` → `admin_review` → `certified`). | FULL |
| 13d | Bonus 20 $ confirmed sur wallet | FULL | `unlockFacilityBonus` + `v2_seller_unlocks` (NW-13e). | FULL |
| 13e | Team enregistre & track | FULL | teams/members/invites/zone (NW-15 P2). | FULL |
| 13f | Admin vue globale | FULL | `AdminV13` (console, review queue, roles, zones). | FULL |

---

## 3. Synthèse et dettes

### Segment FULL (16) — déjà là
Discovery (1b, 1c), recherche (2a, 2b, 2c), auth (3a), reprise (4a), résultats (5a), bulk (6a-6d), choix fac (7a), confirmation (8a-8b), QR+chat (9a-9b), vendeur+verrouillage (10a-10d), avis (11a), plans pro (12a-12b), flow vendeur+team+admin (13a-13f). → **La quasi-totalité du cycle est implémentée.**

### Segment PARTIAL (4) — à corriger
- **1a** : recentrage auto initial sur l'utilisateur pas garanti.
- **3b/3c** : onboarding multi-pages minimal (3 étapes), pas de best-practices stats/email+nom explicites.
- **7b** : produit recherché pas mis en avant dans la fiche après recherche.
- **7c** : « panier avec ce vendeur » = sélection non persistante, pas un vrai panier multi-vendeur.

### Segment BLOCKED / ABSENT (2) — dettes racines
- **0b/9c** : **contact vendeur n'existe pas dans le modèle de données** (v2_facilities sans phone/whatsapp). Impossible d'exposer le contact après intention tant que la donnée n'existe pas.
- **9d** : itinéraire dans le flux après intention à ajouter (correction 0a faite sur la fiche ; reste à faire dans BuyerFlowV13).

### Segment corrigé dans cette passe (1)
- **0a** : itinéraire vendeur sur fiche facilité (bouton + `routeTarget` câblé + `setSheet('none')`). Testé 466/466, build OK.

---

## 4. Plan concret ordonné (avant déclaration V1 terminée)

> Ordre proposé : d'abord les **dettes racines (données)**, puis les **corrections logiques (PARTIAL)**, puis **l'intégration**, puis la preuve.

| # | ID | Élément | Priorité | Effort | Bloque | Verdict attendu |
|---|---|---|---|---|---|---|
| 1 | RAC-1 | **Contact vendeur** : migration `v2_facilities.contact_phone` + `contact_whatsapp` (ou JSONB channels) + exposition API (public) ; UI : fiche facilité « Contact » désactivée avant intention, active après (BuyerFlowV13). | Haute | M | V1 complète | FULL |
| 2 | COR-0a | Itinéraire fiche facilité (déjà fait) → **revue + test UI navigateur** + ajout itinéraire dans BuyerFlowV13 après intention | Haute | S | — | FULL |
| 3 | COR-1a | Recentrage auto initial sur l'utilisateur au chargement (si géoloc OK) | Moyenne | S | — | FULL |
| 4 | COR-3b | Onboarding enrichi : multi-pages éducatif (pourquoi Omni, comment ça marche, confiance, engagement), collecte email + nom, reprise recherche auto après | Moyenne | M | — | PARTIAL→FULL |
| 5 | COR-7b | Mise en avant du produit recherché dans la fiche facilité (badge « produit recherché », tri, highlight) | Moyenne | S | — | FULL |
| 6 | COR-7c | Panier avec ce vendeur : clarifier/implémenter un vrai panier multi-produits par facilité (persistant dans la session), bouton unique « Demander la dispo pour N produits » | Moyenne | M | — | FULL |
| 7 | TEC-1 | **Audit technique transversal** (les dettes listées par le fondateur) : passage du code pour identifier les dettes interface/technique/logique/métier restantes (par ex. `BuyerProPlansModal.test.ts` = legacy test, pas de composant) | Haute | M | — | Listing |
| 8 | PRE-1 | **Preuve navigateur complète du cycle** (4 largeurs) : arrivée → recherche → auth → onboarding → reprise → résultats → bulk → fiche → intention → QR → chat → contact → itinéraire → vendeur confirme → paiement → verrouillage → avis | Haute | L | V1 terminée | Proof navigateur |

---

## 5. Verdict

**La V1 n'est PAS « terminée » au sens du cycle complet décrit par le fondateur. 16/23 exigences sont FULL, 4 PARTIAL, 2 BLOCKED (dette racine contact), 1 corrigée (itinéraire fiche).**

Le **blocage racine** est le **contact vendeur absent du modèle de données** — il faut une migration + API + UI avant de pouvoir dire que le cycle est complet.

**Route vers V1 terminée :** RAC-1 (contact) → COR-0a/9d (itinéraire) → COR-1a/3b/7b/7c → TEC-1 → PRE-1 (preuve navigateur cycle) → **alors seulement Gate 7 (terrain).**

**Aucune déclaration de V1 « terminée » ni de passage au Gate 7 avant ces points.**