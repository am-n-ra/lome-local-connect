# Conception exhaustive — Domaine Transaction Omni (états, temps, types, dettes)

Date : 2026-09-16 · Branche `omni-v2-rebuild` · HEAD `3e7fe3f`
Phase Nature Way : **Root System** (contrat avant code). Suit `omni-transaction-flow-state-contract-2026-09-16.md`.
Statut : **à confirmer par le fondateur** (D-TXN-1…D-TXN-10). Aucun code tant que le contrat n'est pas accepté.

---

## 1. Vérité du domaine (sondage code, sans opinion)

### 1.1 Schéma réel (`db/migrations/001_v2_roots.sql`)

| Table | Rôle | Colonnes d'état |
|---|---|---|
| `v2_purchase_intents` | l'intention d'achat | `state ∈ {creating, active, cancelled, expired, completed, disputed}` |
| `v2_transaction_snapshots` | le montant figé (append-only) | pas d'état (immuable) |
| `v2_transaction_members` | qui participe | `role ∈ {buyer, seller}` |
| `v2_transaction_events` | le journal d'états (**append-only**, `UNIQUE(transaction_id, state)`) | `state ∈ {intent_created … closed}` (10) |
| `v2_qr_tokens` | la fenêtre QR | `expires_at`, `verified_at`, `replay_count` (`UNIQUE(transaction_id)`) |
| `v2_external_payment_declarations` | déclaration de paiement externe | `declared_at`, `seller_acknowledged_at` |
| `v2_fulfilments` | réalisation | `mode ∈ {pickup, delivery, other}`, `state ∈ {pending, in_progress, fulfilled, disputed}` |
| `v2_ratings` | avis | `score 1..5` |
| `v2_availability_requests/responses` | Phase A (dispo) | demande `cancelled`; réponse `available/partial/unavailable/stale/expired/corrected/no_response` |

### 1.2 Ce qui existe déjà et qui est **solide**

- **Machine à états transactionnelle à 10 états, sans annulation**, avec `UNIQUE(transaction_id, state)` → **exactement un événement par état** (idempotence forte, rejeu sûr).
- **Append-only réel** : `v2_transaction_snapshots` et `v2_transaction_events` ont un trigger `BEFORE UPDATE OR DELETE` (migr. 003 + 041) → le journal ne peut pas être réécrit.
- **Matrice de transitions appliquée serveur, acteur par acteur** (`trunk-repository.ts` ~l.2918) :
  | De | Acteur | Vers |
  |---|---|---|
  | `qr_ready` | **seller** | `qr_verified` (**le scan = verrou**) |
  | `qr_verified` | **buyer** | `payment_declared` |
  | `payment_declared` | **seller** | `payment_confirmed` |
  | `payment_confirmed` | **seller** | `fulfilment_pending` |
  | `fulfilment_pending` | **seller** | `fulfilled` |
  | `fulfilled` | **buyer** | `received` |
  | `received` | **buyer** | `rated` |
- **QR = 10 minutes** (`createPurchaseIntent`/`issueQrToken` : `Date.now() + 10*60*1000`), **re-émission = remplacement** (`on conflict … set expires_at = excluded.expires_at`).
- **Notation duverrou au scan est gardée** par `CREATE UNIQUE INDEX v2_qr_transaction_unique` + `replay_count`.

### 1.3 Les **dettes réelles** trouvées (voir §5 pour le registre complet)

| # | Dette | Preuve |
|---|---|---|
| **DT-1** | **Aucune réservation ni décrément de stock.** `quantity_allocated_omni` sert **seulement** de filtre de recherche ; ni l'intention ni la transaction ne la décrémente. Plusieurs acheteurs peuvent « acheter » la même unité. | `grep update v2_products` : jamais lié à une transaction |
| **DT-2** | `v2_purchase_intents.state` est **mort** : positionné `'active'` puis **jamais** muté (`cancelled/expired/completed/disputed` inutilisés). La clé étrangère d'intention ne dit rien de sa fin. | `grep "update v2_purchase_intents"` = 0 résultat |
| **DT-3** | **Aucune annulation côté acheteur pour une demande de dispo (Phase A)** — seul le *claim* a `cancelClaim`. Un acheteur ne peut pas retirer sa demande. | `grep cancelAvailability` = néant |
| **DT-4** | QR à **10 min codé en dur**, **aucune route** de ré-émission ni de révocation. | `expires_at = Date.now() + 10*60*1000` (×2 sites) |
| **DT-5** | **Aucun endpoint « mes transactions »** — seul `GET /api/v2/transactions/:id` (par id). Une transaction en cours est **irrécupérable** après fermeture de l'écran. | `grep http.ts` |
| **DT-6** | Bouton de flux **« Annuler »** (dock) qui fait en réalité « sortir vers la carte » ; branche `handleDock('cancel')` **code mort**. | `TrunkAppV13.tsx:1108` + `1152` |
| **DT-7** | **Aucun planificateur d'expiration serveur.** Rien ne fait expirer une intention ou une transaction verrouillée qui stagne. | `grep cron/schedule/expire job` = néant |
| **DT-8** | L'infra de notification existe (`v2_web_push_subscriptions`, migr. 008/041) mais **aucun événement de transaction n'émet de notification** (ni « vendeur a scanné », ni « paiement à confirmer »). | pas d'appel push depuis `trunk-repository` |
| **DT-9** | Le chemin **litige** est déclaré au schéma (`intents.disputed`, `fulfilments.disputed`) mais **aucun repo ni route**. | `grep disputed` = schéma seulement |
| **DT-10** | **Aucun minuteur / estimation affiché nulle part** — ni maquette, ni code. La notion de temps n'existe que par la fenêtre QR. | `grep timer/estimé` maquette+code = néant |

---

## 2. Le modèle de temps (nouveau — demande fondateur « timer + temps estimé par étape »)

Chaque étape porte **trois temps** et **un responsable** :

| Notion | Définition | Usage UI |
|---|---|---|
| **Estimation** | durée typique observée pour cette étape | affiché : « le vendeur répond en général sous 30 min » |
| **Échéance (deadline)** | au-delà, l'étape est *en retard* → relance puis expiration | **compte à rebours** visible |
| **Responsable** | qui doit agir (acheteur / vendeur / système) | indique sur qui on attend, et pourquoi |

### 2.1 Table des temps (valeurs proposées — à confirmer D-TXN-3)

| Étape | Responsable | Estimation | Échéance | À l'échéance |
|---|---|---|---|---|
| Demande de dispo envoyée | vendeur | 30 min | **48 h** | demande `expired`, acheteur notifié, relance automatique avant |
| Réponse dispo → intention | acheteur | 10 min | **24 h** | opportunité libérée, demande `expired` |
| Intention posée | (système) | instantané | — | — |
| **Intention → QR émis** | acheteur | immédiat | **10 min** (fenêtre QR) | QR expiré → ré-émettre (nouveau QR) |
| **QR émis → QR vérifié (scan)** | vendeur | 1–5 min | **10 min** | QR expiré → ré-émettre si intention encore active |
| QR vérifié → paiement déclaré | acheteur | 5 min | **2 h** | rappel ; sinon l'acheteur peut suspendre/reprendre |
| Paiement déclaré → confirmé | vendeur | 5 min | **24 h** | relance vendeur ; litige possible après |
| Paiement confirmé → réalisation en cours | vendeur | immédiat | — | — |
| Réalisation → `fulfilled` | vendeur | 30 min (retrait) / 24 h (livraison) | **7 j** | relance ; escalade litige |
| `fulfilled` → `received` | acheteur | immédiat | **72 h** | **auto-réception** (le système clôt la réception) |
| `received` → avis | acheteur | optionnel | **30 j** | clôture automatique sans avis |
| → `closed` | système | — | — | fin |

> Règle d'or : **le temps n'annule jamais**. Il **relance**, puis **expire** uniquement les étapes **non verrouillées**. Après `qr_verified`, une échéance dépassée **notifie + escalade**, elle ne libère pas la transaction d'elle-même (sauf la règle d'auto-réception, à confirmer).

### 2.2 Contrat du minuteur UI

- **Dans la transaction** : bandeau d'étape = `label` · `responsable` · `estimation` · **compte à rebours** sur l'échéance ; couleur neutre → accent à −20 % du délai → alerte à l'échéance.
- **Dans « Transactions en cours »** : ligne compacte = étape + **ETA restant** (ou « en retard de Xh »).
- **À l'échéance** : bouton de **reprise** (pas d'annulation) + relance notifiée au responsable.
- Le minuteur est **dérivé** (calculé depuis les `created_at` d'événements + la table de temps) — **aucune nouvelle source de vérité temporelle** ; il ne crée pas d'état.

---

## 3. Le cycle complet, par type de fourniture

Le **Trunk est unique** (mêmes 10 états). Les types ne changent que **trois choses** : la nature de la dispo (Phase A), la nature de la réalisation, et les **estimations** du timer.

| Type | Dispo (Phase A) | Verrou (Phase B) | Réalisation | Estimation typique |
|---|---|---|---|---|
| **Fixe** (boutique) | stock / à valider | scan QR au comptoir | remise | minutes |
| **Mobile** (ambulant) | position partagée + rayon | scan QR au point de rencontre | remise | 10–60 min |
| **Digital** (sans géo) | dispo en ligne | QR partagé à distance (ou clic) | accès/livraison | immédiat |
| **Service** | **créneau/date** (champ à créer) | QR au rendez-vous | exécution | heures |
| **Bien/propriété** | dispo + visite | QR à la visite | transfert | jours |

**Contrainte de non-dette** : ne jamais créer une 2e machine à états par type. Le type n'introduit que des **champs de dispo** et des **libellés de réalisation**.

---

## 4. Écran cible (spec, avant pixels)

Sheet **« Transaction en cours »** (déjà existante `BuyerFlowV13`, à enrichir) :
1. **Bandeau d'état** : étape courante + responsable + estimation + compte à rebours.
2. **Timeline** des 10 étapes (fait / en cours / à venir), horodatée, avec l'étape verrouillée mise en évidence.
3. **Carte de verrou** : « Transaction verrouillée au scan — elle ne peut pas être annulée ; elle sera menée à son terme. »
4. **Actions** : `Suspendre (quitter)` · `Reprendre` (depuis la liste) · `Ré-émettre le QR` (si expiré) · chat transactionnel. **Jamais « Annuler ».**
5. **Litige** (hors V1) : bouton discret « Signaler un problème » → opérateur (watch Gate 7).

Nouvel écran **« Transactions en cours »** (acheteur + vendeur) : liste des transactions non terminales, **reprenable**, avec ETA compact par ligne. *C'est le parent manquant de « sortir et revenir ».*

---

## 5. Registre des dettes → plan correctif ordonné

Chaque dette est traitée par une **tranche** (un gate = une tranche). Rien n'est codé avant la décision correspondante.

| Tranche | Dettes soldées | Contenu | Taille | Dépend de |
|---|---|---|---|---|
| **FF-1** | DT-6 | Renommer le bouton de flux (« Quitter ») + supprimer le code mort `handleDock('cancel')`. | S | D-TXN-1 |
| **FF-2** | DT-5 | `GET /api/v2/buyer/transactions` (+ vendeur) + repo `listMyTransactions` (lecture, non terminales) + écran « Transactions en cours » reprenable. | M | D-TXN-2 |
| **FF-3** | DT-7, DT-2 | Planificateur d'expiration + **mutation réelle de `intents.state`** (`expired`/`cancelled`/`completed`) + audit. | M | D-TXN-3 |
| **FF-4** | DT-3 | Annulation acheteur d'une **demande de dispo** (Phase A uniquement), sans effet monétaire. | S | D-TXN-4 |
| **FF-5** | DT-4 | Cycle QR : TTL paramétrable + route **ré-émission** ; révocation. | S | D-TXN-3 |
| **FF-6** | DT-10 | **Timer + estimation par étape** (table de temps + bandeau + ETA liste). | M | D-TXN-3, FF-2 |
| **FF-7** | DT-8 | Notifications de transaction (web push existant) : « à vous d'agir », « à l'échéance ». | M | FF-3 |
| **FF-8** | DT-1 | **Réservation de stock** à l'intention, libération à l'expiration, décrément à la clôture. *(décision produit forte)* | L | D-TXN-7 |
| **FF-9** | DT-9 | Chemin litige → opérateur. **Hors V1** (watch Gate 7). | L | D-TXN-9 |

**Ordre recommandé** : FF-1 → FF-2 → FF-4 → FF-3 → FF-5 → FF-6 → FF-7 → (FF-8 selon décision) → FF-9 watch.

---

## 6. Décisions à confirmer (fondateur)

| # | Décision | Recommandation |
|---|---|---|
| **D-TXN-1** | Aucune annulation unilatérale après verrou ; renommer « Annuler » → « Quitter » ; supprimer le code mort. | **OUI** |
| **D-TXN-2** | Créer « Transactions en cours » (acheteur + vendeur), reprenable. | **OUI** |
| **D-TXN-3** | Table des temps du §2.1 (48 h / 24 h / 10 min / 2 h / 24 h / 7 j / 72 h / 30 j). | À valider (modifiable) |
| **D-TXN-4** | Annulation acheteur d'une demande de dispo (Phase A). | **OUI** |
| **D-TXN-5** | Auto-réception après 72 h (`fulfilled → received` système). | **OUI** |
| **D-TXN-6** | Timer + estimation par étape (§2.2) = nouveau motif → **mini-species** avant pixels. | **OUI** |
| **D-TXN-7** | **Réservation de stock** : réserver à l'intention, libérer à l'expiration, décrémenter à la clôture. *(sans ça = survente)* | **OUI, priorité haute** |
| **D-TXN-8** | Le temps **relance/expire** seulement le non-verrouillé ; après verrou = offre/confirm, jamais libération automatique. | **OUI** |
| **D-TXN-9** | Litige (cancel mutuel) = chemin opérateur **hors V1** (watch Gate 7). | **OUI** |
| **D-TXN-10** | Dispo « service » (créneau) = champ de Phase A, tranche séparée quand un vrai vendeur service arrive. | À planifier |

---

## 7. Ce qui reste non prouvé

- Aucun cycle HTTP authentifié exécuté (sandbox sans DB/Auth) → les tranches FF-* seront livrées **code + tests unitaires**, preuve navigateur groupée dans **PRE-1**.
- La table des temps (D-TXN-3) et la réservation de stock (D-TXN-7) sont des **décisions métier**, pas des choix techniques.
- Le chemin litige (D-TXN-9) et le champ « créneau service » (D-TXN-10) restent **hors V1**.