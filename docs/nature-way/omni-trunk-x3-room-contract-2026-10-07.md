# TRUNK-X3 — Room de transaction : contrat + cadrage

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** `/nature-way`. **Front door :** `/nature-way-founder-hq`.
> **Local Plan ID :** `NW-PROD-OMNI-TRUNK-02` (workstream `X3`). **Founder HQ Plan ID :** `HQ-OMNI-2026-09-02`.
> **As of :** 2026-10-07. **Owner :** Nature Way (relais) · **Décisions fondateur :** « room » = surface dédiée (inventory 2026-10-07 §7 Q3).
> **Rattachement Seed :** **S-27** (chat de transaction côté vendeur + section dédiée côté acheteur) · **S-26** (traçabilité) · Seed ligne 214 (chat « esquissé seulement » = gap déclaré).
> **Statut :** `contrat rédigé` — **aucun code** avant validation du cadrage.

## Resource Receipt

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way/templates/intra-skill-plan.md` (plan `NW-PROD-OMNI-TRUNK-02` §X3) |
| Loaded | `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (S-26, S-27, ligne 214) |
| Loaded | `docs/maquette/omni-species-v2-interactive.html` (`SHEETS.room`, `SHEETS.historique`, `SHEETS.recu`, `SHEETS['seller-chat']`) |
| Loaded | code : `src/server/trunk-repository.ts` (`listTransactionMessages`/`createTransactionMessage`/`getTransaction`/`listOpenTransactions`), `src/server/http.ts`, `src/trunk/api.ts`, `src/trunk/BuyerFlowV13.tsx`, `src/trunk/TrunkAppV13.tsx` |
| Loaded | `db/migrations/011_v2_transaction_messages.sql`, `041_v2_canonical_gaps.sql` |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` (this pass appended to the TRUNK-02 plan) |
| Not loaded / reason | `launch-envelope.md` / `risk-and-escalation-matrix.md` — pas d'exposition publique ni paiement dans X3 (room = lecture/chat, aucun chemin monétaire) |

## 1. Ce qui existe déjà (mesuré, pas supposé)

| Couche | État réel |
|---|---|
| **Table** | `v2_transaction_messages` (migration `011`, ré-affirmée `041`) : `transaction_id`, `sender_account_id`, `body`, index thread `(transaction_id, created_at, id)`, index idempotence. **Présente.** |
| **Repo** | `listTransactionMessages({authUserId, transactionId})` — membre-scopé, renvoie `{transactionId, messages: TransactionMessage[]}` ou `null`. `createTransactionMessage({authUserId, transactionId, body})`. **Présents.** |
| **HTTP** | routes transaction-messages câblées (catch-all `availability.js`). |
| **Client** | `getTransactionMessages` / `sendTransactionMessage` dans `api.ts`. |
| **UI actuelle** | chat **inline dans `BuyerFlowV13`** : charge `getTransactionMessages(...).slice(-4)`, rend ≤ 4 messages, envoi via `sendTransactionMessage`. **Pas de surface dédiée.** |
| **Suivi** | `BuyerFlowV13` stage `txn` : timeline d'états + timer/échéance (FF-6). |
| **Fiche** | `getTransaction` renvoie `productId`, `facilityId`, `quantity`, `unitPriceMinor`, `couponCode`, `netAmountMinor`, `sellerFacilityName`, `sellerContactPhone/Whatsapp`, `actorRole`, `state`. **Suffisant pour un reçu.** |
| **Liste** | `listOpenTransactions` = **non terminales seulement** (`current_state <> 'closed'`), affichée dans `TrunkAppV13` (ligne ~2589 « Transactions en cours »). |

## 2. L'écart à combler (le « fond » manquant — S-27)

Deux **surfaces dédiées** manquent, symétriques, alors que le backend existe :

1. **Room acheteur** (maquette `SHEETS.room`) — **une seule surface** qui réunit :
   suivi d'états (stepline QR → Scan → Paiement → Remise → Avis) + **échéance/responsable** (FF-6) +
   **conversation transactionnelle** (fil **complet**, pas 4 messages) + **reçu** +
   actions honnêtes (« Télécharger le reçu », « Signaler un problème » → `watch`, FF-9).
2. **Écran « Mes transactions » (historique)** — au-delà de `listOpenTransactions` (ouvertes) :
   les **clôturées** doivent être listables, chaque ligne ouvrant la Room (maquette `SHEETS.historique`).
   Cela **exige une lecture nouvelle** : `listTransactions` (toutes) — `listOpenTransactions` exclut les clôturées par conception.

> **Note de fidélité :** la maquette `SHEETS.room` montre une transaction **clôturée** — mais la maquette est **stylisée**, pas un état machine. Le vrai état est **dérivé** (transaction parfois clôturée). La Room lit l'**état réel** ; elle n'invente pas.

## 3. Contrat (à respecter avant d'écrire une ligne)

| # | Règle | Source |
|---|---|---|
| R1 | **Une Room = une transaction.** Ouverte depuis « Transactions en cours » **ou** « Mes transactions », elle charge `getTransaction` + fil complet + reçu. | maquette `SHEETS.room`, Seed S-26 |
| R2 | **Le chat reste transaction-scopé et membre-scopé.** Aucune fuite vers un thread global ; un non-membre reçoit `null` (déjà le cas repo). | `listTransactionMessages`, S-26 |
| R3 | **L'acheteur ne voit JAMAIS le dashboard vendeur ni l'écran « scanner le code ».** Symétrie : la Room acheteur ≠ la vue vendeur (`seller-chat`/`seller-txn`). | **S-27** (explicite) |
| R4 | **Le reçu porte la transaction gelée** (S-26) : objet, quantité, total net, vendeur, quand. Dérivé de `getTransaction` ; **aucune** nouvelle écriture. | maquette `SHEETS.recu`, S-26 |
| R5 | **Le temps relance, il n'annule jamais** (wording FF-6 conservé). Pas de bouton « Annuler » après verrou (FF-1). | FF-1/FF-6, D-TXN |
| R6 | **« Signaler un problème » n'ouvre pas un flux mort.** FF-9 (litige) = `watch` Gate 7 → le bouton est **désactivé honnêtement** (`aria-disabled`, libellé « bientôt ») OU ouvre un canal réel ; **jamais** un `alert()` mort. | règle dépôt « pas de bouton mort » |
| R7 | **Aucune écriture d'état parasite.** La Room **lit** l'état ; elle ne le mute pas (les transitions passent par les routes acteur existantes). | règle D-TXN-11 |

## 4. Structure d'exécution (task tree — détail en plan TRUNK-02)

| ID | Phase | Objectif | Dépend de | Statut | Acceptation / preuve |
|---|---|---|---|---|---|
| X3-1 | Root | **Contrat** Room (ce doc) — validé fondateur | — | `review` | ce fichier |
| X3-2 | Root | **Lecture `listTransactions`** (toutes, clôturées incluses) : repo + HTTP + client + type | X3-1 | `todo` | SQL réel jetable + filtre membre |
| X3-3 | Trunk | **Surface Room acheteur** (suivi + chat fil complet + reçu + actions honnêtes) | X3-2 | `todo` | rendu jsdom |
| X3-4 | Trunk | **Écran « Mes transactions »** (historique ouvertes+clôturées → ouvre la Room) | X3-2 | `todo` | rendu jsdom |
| X3-5 | Heartwood | **Preuve SQL réelle jetable + falsification** (non-membre refusé ; thread complet ; reçu dérivé) | X3-3,X3-4 | `todo` | `prove-v2-room.mjs` + falsification |
| X3-6 | Ring | suite + gardes + **push prod T-07d** | X3-5 | `todo` | hash === local |

## 5. Non-goals (explicites)

- **Vue vendeur dédiée** (`seller-chat`/`seller-txn`/`seller-pay-confirm`/`seller-full`) — surfaces vendeur **distinctes** ; hors X3 sauf si le fondateur veut les cadrer ensemble.
- **Notification push de message** — déjà couvert pour les transitions (FF-7) ; un fan-out par message serait une tranche séparée.
- **Litige réel (FF-9)** — `watch` Gate 7.
- **Pièces jointes/photo dans le chat** — non spécifié par la maquette.
- **Terrain** — décision fondateur 2026-10-07 : **en dernier**, jamais une slice Trunk.

## 6. Décisions fondateur requises (avant X3-2)

1. **Périmètre X3 :** acheteur seul (Room + historique) — ou **aussi la vue vendeur** (`seller-chat`), pour livrer la symétrie S-27 d'un coup ?
2. **« Signaler un problème » :** bouton **désactivé honnête** (recommandé — FF-9 = watch) ou canal réel (remonter un `v2_visit_report`/notification) ?
3. **`listTransactions` :** borné à **N=50** comme `listOpenTransactions`, ou pagination dès X3 ?
