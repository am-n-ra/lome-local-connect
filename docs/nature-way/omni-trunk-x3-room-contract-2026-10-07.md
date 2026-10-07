# TRUNK-X3 — Room de transaction : contrat + cadrage (AMENDÉ 2026-10-07 après mesure)

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** `/nature-way`. **Front door :** `/nature-way-founder-hq`.
> **Local Plan ID :** `NW-PROD-OMNI-TRUNK-02` (workstream `X3`). **Founder HQ Plan ID :** `HQ-OMNI-2026-09-02`.
> **As of :** 2026-10-07. **Owner :** Nature Way (relais) · **Décisions fondateur :** « room » = surface dédiée ; **« recommandés »** sur les 3 questions §6 (2026-10-07).
> **Rattachement Seed :** **S-27** (chat de transaction vendeur + section dédiée acheteur) · **S-26** (traçabilité) · Seed ligne 214 (chat « esquissé seulement » = gap déclaré).
> **Statut :** `contrat rédigé` — **aucun code UI** avant validation du cadrage amendé.

> ### ⚠️ Amendement 2026-10-07 — la première version de ce contrat SURESTIMAIT l'écart acheteur
> La v1 disait « manque une lecture `listTransactions` (toutes, clôturées incluses) ». **C'était faux** —
> mesuré : `listClosedTransactions` + `/api/v2/buyer/transactions/closed` + `ClosedTransactionsResult`
> + `TransactionReceiptV13` **existent déjà** ; `TrunkAppV13` rend **« En cours »** (`openTxn`) **et**
> **« Terminées »** (`closedTxn`) + la sheet `receipt`. **Écart acheteur réel = le CHAT seul** (fil
> **complet**, pas 4 messages) et son intégration dans une surface dédiée. **Écart vendeur = tout** :
> aucune surface transaction/chat vendeur. *C'est encore la classe « mémoire en retard » — j'ai écrit
> un écart avant de le mesurer.*

## 1. Ce qui existe déjà (mesuré, pas supposé)

| Couche | État réel |
|---|---|
| **Table** | `v2_transaction_messages` (migration `011`, ré-affirmée `041`) : `transaction_id`, `sender_account_id`, `body`, index thread + idempotence. **Présente.** |
| **Repo messages** | `listTransactionMessages({authUserId, transactionId})` — **membre-scopé** (acheteur **ou** vendeur, selon `v2_transaction_members`), renvoie `{transactionId, messages}` ou `null`. `createTransactionMessage(...)`. **Présents.** |
| **HTTP messages** | `GET/POST /api/v2/transaction-messages` — **membre-scopé** (pas de rôle codé en dur). |
| **Client messages** | `getTransactionMessages` / `sendTransactionMessage` (`api.ts`). |
| **UI messages** | chat **inline dans `BuyerFlowV13`** : charge `.slice(-4)`, rend ≤ 4 messages. **Pas de surface dédiée.** |
| **Liste acheteur** | `listOpenTransactions` (« En cours », non clôturées) **ET** `listClosedTransactions` (« Terminées », versions gelées) — affichées dans `TrunkAppV13`. |
| **Reçu** | `TransactionReceiptV13` rendu depuis la ligne clôturée (sheet `receipt`). **Présent.** |
| **Litige/offre signalée** | sheet `signal` (`OfferReportMotif`, TF-5) — **signaler une OFFRE**, pas un problème de transaction. |
| **Suivi** | `BuyerFlowV13` stage `txn` : timeline d'états + timer/échéance (FF-6). |
| **Vendeur — QR** | `SellerQrScannerSheet` : scan → `qr_verified`. **Seule** surface transactionnelle vendeur. |
| **Vendeur — transactions/chat/paiement/remise** | **AUCUNE.** `SellerV13` n'a que des **compteurs** analytics. Aucun call site UI pour `confirmExternalPayment` ni pour les transitions vendeur (`payment_confirmed`, `fulfilled`). |

## 2. L'écart réel (le « fond » manquant — S-27)

| # | Écart | Nature |
|---|---|---|
| E1 | **Room acheteur dédiée** : suivi + **chat fil complet** + reçu, une seule surface. Aujourd'hui : chat plafonné à **4 messages**, dispersé dans `BuyerFlowV13` ; pas de surface unique « ouvrir la transaction ». | UI (backend prêt) |
| E2 | **Surface vendeur de transaction** : liste des transactions du vendeur + ouvrir → **chat** + **confirmer le paiement** + **marquer la remise**. Aujourd'hui : **rien** (hors scan QR). | UI + **lecture nouvelle** |
| E3 | **Le chat est à SENS UNIQUE** sans E2 : l'acheteur écrit, aucun vendeur ne peut lire/répondre dans son UI. | conséquence de E2 |

> **Conséquence de cadrage (recommandation amendée) : E1 et E2 voyagent ENSEMBLE.** Livrer la Room
> acheteur seule créerait un **chat à sens unique = branche morte** (règle « no orphaned layers »).
> L'unité honnête minimale inclut donc la **surface vendeur**.

## 3. Contrat (à respecter avant d'écrire une ligne)

| # | Règle | Source |
|---|---|---|
| R1 | **Une Room = une transaction.** Ouverte depuis « En cours » ou « Terminées », elle charge `getTransaction` + **fil complet** + reçu. | maquette `SHEETS.room`, S-26 |
| R2 | **Le chat et la lecture d'une transaction restent membre-scopés.** Un non-membre reçoit `null` (déjà le cas repo). | `listTransactionMessages`, S-26 |
| R3 | **Symétrie stricte (S-27)** : deux surfaces, **acheteur** et **vendeur**, distinctes ; l'acheteur ne voit jamais le dashboard/scan vendeur, et réciproquement. | **S-27** |
| R4 | **Le reçu porte la transaction gelée** (S-26) : dérivé de la ligne clôturée ; **aucune** nouvelle écriture. | maquette `SHEETS.recu`, S-26 |
| R5 | **Le temps relance, il n'annule jamais** (wording FF-6). Pas de bouton « Annuler » après verrou (FF-1). | FF-1/FF-6 |
| R6 | **« Signaler un problème » n'ouvre pas un flux mort.** FF-9 (litige) = `watch` Gate 7 → bouton **désactivé honnête** (`aria-disabled` + libellé « bientôt »). **Décision fondateur : recommandé (a).** | règle dépôt « pas de bouton mort » |
| R7 | **Aucune écriture d'état parasite.** La Room **lit** ; les transitions passent par les routes acteur existantes (`transaction-transitions`, `confirmExternalPayment`). | D-TXN-11 |
| R8 | **Aucune migration.** Tout le socle (messages, snapshots, événements, membres) existe. | mesuré |

## 4. Structure d'exécution (task tree — détail en plan TRUNK-02)

| ID | Phase | Objectif | Dépend de | Statut | Acceptation / preuve |
|---|---|---|---|---|---|
| X3-1 | Root | **Contrat** Room amendé (ce doc) — recommandations fondateur appliquées | — | `review` | ce fichier |
| X3-2 | Root | **Lecture `listSellerTransactions`** (vendeur, membre-scopé) : repo + HTTP + client + type | X3-1 | `todo` | SQL réel jetable + non-membre refusé |
| X3-3 | Trunk | **Room acheteur** (suivi + **fil complet** + reçu) — intègre l'existant | X3-2 | `todo` | rendu jsdom |
| X3-4 | Trunk | **Surface vendeur** (liste + fil + **confirmer paiement** + **remise**) | X3-2 | `todo` | rendu jsdom |
| X3-5 | Heartwood | **Preuve SQL réelle jetable + falsification** (non-membre refusé ; fil complet ; chat à deux sens ; reçu dérivé) | X3-3,X3-4 | `todo` | `prove-v2-room.mjs` + falsification |
| X3-6 | Ring | suite + gardes + **push prod T-07d** | X3-5 | `todo` | hash === local |

> **`listTransactions` acheteur abandonné** : `listOpenTransactions` + `listClosedTransactions` couvrent déjà le besoin. **Ne pas créer une lecture en double** (règle « un source unique par sujet »).

## 5. Non-goals (explicites)

- **`listTransactions` acheteur « toutes »** — inutile (existant suffisant).
- **Notification push par message** — tranche séparée (FF-7 couvre les transitions).
- **Litige réel (FF-9)** — `watch` Gate 7.
- **Pièces jointes/photo dans le chat** — non spécifié.
- **Terrain** — décision fondateur 2026-10-07 : **en dernier**, jamais une slice Trunk.

## 6. Décisions fondateur — **RENDUES : « recommandés »** (2026-10-07)

1. **Périmètre** → *(recommandation amendée)* **buyer Room + seller surface ENSEMBLE** (E1+E2), car E1 seul = chat à sens unique.
2. **« Signaler un problème »** → **désactivé honnête** (FF-9 = watch).
3. **Liste** → `listSellerTransactions` **bornée N=50** côté serveur, **sans pagination** (2ᵉ tour = bouton « charger plus »).

> **Note au fondateur :** la recommandation (1) a **grandi** après mesure (le vendeur est un trou plus
> large que le seul chat). Si tu préfères un incrément plus petit, l'alternative est **X3a = Room acheteur
> SANS chat** (suivi + reçu), le chat attendant la surface vendeur (X3b). Mais cela **échoue** le contrat
> « Room » de la maquette, qui inclut la conversation.
