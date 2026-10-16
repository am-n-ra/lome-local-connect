# Points 1 & 3 (Room seule surface post-intention) — evidence — 2026-10-16

Porte : **BRANCHES** (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). Ordre fondateur : « fermons d'abord room 2 »
(Room point 2, livré `471021a`) puis **« ferme »** (points **1 et 3**).

## Ce que les points 1 et 3 demandaient

| # | Constat mesuré (audit 2026-10-15) | Ce qui a été livré |
|---|---|---|
| **1** | Le **chat du flux** était **tronqué à 4 messages** (`.slice(-4)`, `BuyerFlowV13:124`/`:169`) et `stage='txn'` restait en **repli** — deux surfaces de chat coexistaient. | La surface transactionnelle du flux est **supprimée** : `type Stage = 'avail' \| 'pending' \| 'result' \| 'intent'`. Le flux s'arrête à l'**intention**. |
| **3** | **Reprendre** une transaction ouverte (`resumeTransaction`) ouvrait le **suivi court du flux** (`setPendingResumeTxnId` → `setSheet('flow')`), pas la Room. | `resumeTransaction` ouvre la **Room** (`openRoom`), avec le **rôle lu** dans le snapshot (`actorRole`) — un vendeur reprend sa vente. |

## Ce qui a été retiré du flux (devenu mort)

- étapes `txn`, `qr`, `pay`, `rate` et `STEPS` transactionnels + `TXN_STAGES` ;
- états `txn/txnId/qrToken/qrExpires/messages/score/note/chatDraft/chatSending/copied` ;
- fonctions `loadTxn`, `sendChat`, `issueQr`, `reissueQr`, `revokeQr`, `verifyQr`, `transition`,
  `declarePay`, `rate`, `copyQr` ;
- imports `confirmExternalPayment`, `declareExternalPayment`, `getTransaction`,
  `getTransactionMessages`, `issueBuyerQrToken`, `qrPayload`, `revokeQrToken`,
  `sendTransactionMessage`, `submitTransactionRating`, `transitionTransaction`, `verifyQrToken`,
  `OmniQr`, `TransactionSnapshotResult`, `TransactionState`, `transaction-time`.
- props `resumeTxnId` / `onRoute` du flux (l'itinéraire vit désormais dans la Room) ;
  `pendingResumeTxnId` de `TrunkAppV13` ; le bouton « Ouvrir la Room · chat » de la liste
  « Transactions en cours » (la ligne elle-même ouvre la Room).
- CSS orphelin `.txntrack` / `.txstep` / `.sdot` (ui-v13.css + v3.css) — signalé par `check:dead-css`.

## Ce qui a été ajouté (pour ne rien perdre)

- **Honnêteté d'expiration.** Le flux affichait « Cette intention n'a pas été vérifiée à temps.
  **Rien n'a été débité**. La réservation de stock a été libérée. » — fermer sa surface l'aurait
  **perdu**. Porté dans la Room, verrouillé par le garde (falsifié).
- **RT-D2 — l'itinéraire vit dans la Room.** Le flux portait l'itinéraire après intention ; sa
  suppression l'aurait perdu. `getTransaction` expose maintenant `sellerFacilityLatitude` /
  `sellerFacilityLongitude` **uniquement dans le contexte transactionnel (membre)** — même règle que
  le contact (RAC-1) : jamais publiquement, seulement après intention. La Room rend le bloc
  « Point de remise » + « Itinéraire vers le vendeur » (prop `onRoute`), câblé dans `TrunkAppV13`.

## Preuves

- **Garde falsifiable** `src/trunk/room-only-post-intent.test.ts` (7) : le flux n'a plus les étapes
  mortes, n'importe plus les appels de transaction, n'a plus de chat tronqué, et
  `resumeTransaction` ouvre la Room avec le rôle **lu**.
  **Falsifié** : réintroduire `\| 'txn'` dans `type Stage` → **1 échec** ; restauré → **7/7**.
- **SQL réel** : la requête `getTransaction` (colonne latitude ajoutée) **compile et s'exécute** sur
  Postgres — `lat = 6.3703 | lng = 2.3912 | facility = Omni Demo Seller Hub`.
  `prove-root-read-paths.mjs` : **37/37**.
- **Suite** : **1287/1287** (157 fichiers), `tsc` 0 ; 6 gardes verts (boundary, live-surface,
  dead-css, state, docs, coherence). Build `index-CyemzV6b.js` ; bundles serverless régénérés
  (`seller_facility_latitude` présent dans `availability.js` / `facilities/[id].js` / `purchase-intents.js`).

## Résidu honnête

- **Preuve navigateur avec session réelle** non exécutée (sandbox sans DB/auth) : le rendu de la Room
  (itinéraire, fil complet) est prouvé unitairement et par le SQL ; le parcours acheteur→Room en
  navigateur reste un spot-check fondateur.
- **`seller-validate` (point 2)** est livré (`471021a`) mais son parcours visuel complet (vendeur →
  dashboard → Valider) n'a pas non plus été capturé en navigateur.
