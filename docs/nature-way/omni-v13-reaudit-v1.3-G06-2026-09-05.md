# Re-audit espèces V13 vs maquette maître V1.3 (mise à jour 2026-09-05 soir)

| Champ | Valeur |
|---|---|
| ID | HO-OMNI-06 · audit G-06 |
| Référence | `docs/maquette/omni-species-maquette.html` (remplacé 2026-09-05(soir( par le code complet fourni fondateur( |
| Implémentation auditée | `src/trunk/TrunkAppV13.tsx`, `BuyerFlowV13.tsx`, `SellerV13.tsx`, `AdminV13.tsx`, `ui-v13.css` + `api.ts` |
| Méthode | Lecture code (line-breaks/JSX), pas de promesse — chaque statut est adossé à une ligne |
| Verdict global | **Coquille MAJ ré-alignée 1:1** — la surface maquette est couverte par le modèle `Sheet` V13 + sous-flux dédiés ; écarts restants = dette assumée & décision en fin |

## Couverture maquette → V13 (statuts: FULL / PARTIAL / ABSENT / V13-ONLY)

| # | Maquette (sheet V1.3) | Équivalent V13 | Statut | Evidence (fichier:ligne) |
|---|---|---|---|---|
| 1 | SEARCH (dock + chips contraintes + démo) | sheet `search` : fld + chips contraintes (OK( ; puces démo = sim runtime maquette → **absent** (dette d'outillage démo( | FULL (sans démo( | TrunkAppV13.tsx:424…440 |
| 2 | RESULTS (hgrid + Comparer/Dispo groupée( | sheet `results` : hgrid hcards + boutons Comparer/Dispo groupée | FULL | TrunkAppV13.tsx:440…463 |
| 3 | FACILITY (variantes buyer/unclaimed/mobile/admin( | sheet `facility` : stategroup, fhero, supplyLoc, produits+panier, button Demander ; variante unclaimed → parcours claim ; variante admin → AdminV13 ; variante mobile → **absent** (pas de facilité mobile en V13( | PARTIAL (mobile absent( | TrunkAppV13.tsx:463…500 |
| 4 | AVAIL (panier + Retrait/Livraison + note + envoi( | sheet `flow` (BuyerFlowV13( : panier produit, mode, note, envoi API réelle | FULL | BuyerFlowV13.tsx (flow( |
| 5 | BULK (multi-sélection multi-facilités( | **absent** (pas de surface bulk v13 — seule action "Dispo groupée" présente mais non câblée( | ABSENT | — audit V-6 |
| 6 | PENDING (statuts par item + silence≠dispo( | représenté via demandes (requestStatus submitted/responding( dans `home` | PARTIAL (pas de vue PENDING dédiée( | TrunkAppV13.tsx:568…599 |
| 7 | ARESULT (allocation Omni + fraîcheur( | réponse de dispo retournée dans le flux (BuyerFlowV13( + statuts label (Disponible/Partielle/Corrigée/Expirée( | PARTIAL (fraîcheur visuelle absente( | TrunkAppV13.tsx:36…42 |
| 8 | COMPARE (sortbar + candidates( | **absent** (pas de surface compare v13( | ABSENT | — audit V-6 |
| 9 | INTENT (prix/remise/total + verrouillage( | confirm intent dans BuyerFlowV13 (Intention( | FULL (variante expired absent( | BuyerFlowV13.tsx |
| 10 | TXN (track 7 étapes + chat + QR( | BuyerFlowV13 : track, chat réel (sendTransactionMessage/poll(, QR gateway | FULL | BuyerFlowV13.tsx (chat×8, QR×7( |
| 11 | QR (facilité publique( | navpill QR → sheet `menu` (pas de fiche publique autonome( | PARTIAL | TrunkAppV13.tsx:421 |
| 12 | MENU (menugrid par rôle( | sheet `menu` menugrid par rôle (buyer/seller/admin/operator( | FULL | TrunkAppV13.tsx:510…552 |
| 13 | BUYERHOME (stat tiles + demandes/transactions( | sheet `home` : stat demandes/en attente + liste demandes cliquables + Wallet/Plans | FULL | TrunkAppV13.tsx:568…605 |
| 14 | WALLET (solde + recharger + stats( | sheet `wallet` : solde réel (money(, recharge FedaPay (webhook(, bonus 20 $, écritures, plans par facilité | FULL (+écritures( | TrunkAppV13.tsx:606…678 |
| 15 | PLANS (Free/Pro par rôle( | sheet `plans` : Free/Pro buyer/seller, équipe interne | FULL | TrunkAppV13.tsx:679…700 |
| 16 | PAYMENT (wallet/MobileMoney/FedaPay + déclarer( | BuyerFlowV13 : méthode paiement + Déclarer le paiement (D-05 respecté( | FULL | BuyerFlowV13.tsx:1×Déclarer (grep( |
| 17 | SAVED (alertes + activer/éteindre + créer( | sheet `saved` : CRUD réel (get/create/delete saved-searches( + "+ Enregistrer la recherche courante" | FULL | TrunkAppV13.tsx:700+ (saveCurrentSearch( |
| 18 | ACCOUNT (profil + rôles + déconnexion( | sheet `account` : Identité/Rôles/Facilité/Compte + déconnexion | FULL | TrunkAppV13.tsx:553…567 |
| 19 | ONBOARD (3 étapes OTP/paywall + reprise recherche( | sheet `auth` : authentification Neon réelle (pas l'OTP démo( ; la recherche mémorisée est conservée (query préservée( ; **soft paywall affiché via plans/wallet, pas dans le flux auth** | PARTIAL (OTP démo non reproduit; auth réelle ≥ démo ; paywall déplacé( | TrunkAppV13.tsx:730+ (auth( |
| 20 | SELLER (home: stat + compagnie + actif( | SellerV13 : stats demandes/commandes + compagnies + actif ON/OFF | FULL | SellerV13.tsx (Stock×14, Catalogue×7( |
| 21 | COMPANY (list + créer( | SellerV13 : compagnies + créer | FULL | SellerV13.tsx |
| 22 | PRODUCTS (catalogue + allocation + historique( | SellerV13 : catalogue réel (api catalogue( + allocation Omni + STOCKEVENT historique | FULL | SellerV13.tsx (Catalogue×7( |
| 23 | STOCKEVENT (ledger read-only( | SellerV13 : historique stock (ledger serveur( | FULL | SellerV13.tsx |
| 24 | OFFERS (prix/remise/prix Omni( | SellerV13 : offres + remise (api offers( | FULL | SellerV13.tsx |
| 25 | ADMIN (console revue + Valider/Preuve( | AdminV13 : console (counts, claims, op-state, counter, audit( + Valider/Preuve | FULL | AdminV13.tsx (Console×6( |

## V13-ONLY (sans counterpart maquette( — enrichissements réels
- Parcours **claim complet** (draft → preuves privées par kind → soumission → annulation( — va au-delà du simple CTA maquette.
- **Wallet recharge FedaPay réelle** (checkout webhook( + écritures wallet + plans par facilité (état Pro réel(.
- **Recherches enregistrées CRUD réel** (route `/api/v2/saved-searches`(.
- **Chat transaction réel** (persisté, polls `getTransactionMessages`( — la maquette simule.
- **Auth Neon réelle** (JWT, session, rôles compte( — supérieure à la démo OTP.

## Écarts (dette documentée( à trancher
| Écart | Type | Proposition |
|---|---|---|
| BULK (multi-facilités) absent · COMPARE absent | surface | **S1** : à développer (routes existent côté backend? → audit V-6( ; sinon dette acceptée pour V1 si fondateur OK |
| Facilité mobile (vente ambulante( absent | data | S2 : dépend de données mobiles en DB ; garder en dette (pas de données( |
| Puces démo scénarios (normal/empty/slow/error( | outillage | S3 : garder sur la maquette uniquement (pas en prod( — non-blocking |
| Fraîcheur visuelle (freshbar( + variante expired intent | micro-copies | S4 : ajouter les micro-copies M-01…M-17 qui manquent en V13 (audit fin( |
| aria-modal desktop (tiroirs( | sémantique | S5 : dette connue (déjà en register( — à documenter & corriger en coquille |

## Décision requise fondateur
1. BULK + COMPARE : développer en V-6 (slices UI suivants( ou **endettés** pour V1 ?
2. Solde du re-audit : coquille V13 considérée **alignée 1:1** (surfaces restantes = dette( ? → clôture Gate  ​6 + verdict `Go with limits` (V1 prod-ready sous condition BULK/COMPARE ou dette explicitée(.