# Room après intention d'achat — état exact (2026-10-16)

Fondateur : « où on était en train de corriger comment la room doit se comporter **après intention
d'achat** ».

## Où on en était : le sujet était **ouvert**, en partie livré, en partie **pas tranché**

L'audit du 2026-10-15 (`omni-notif-logo-intent-chat-qr-audit-2026-10-15.md`) a mesuré **5 constats**.
Deux concernaient la Room **après l'intention**. Trois décisions fondateur étaient attendues ; **une
seule a été tranchée** (« 1 ok » sur les alertes ne portait pas sur ce point).

### Ce qui a été LIVRÉ (`NR-5`, `68de053`, prod-vérifié)

- **L'intention ouvre la Room** côté acheteur : `BuyerFlowV13:247` → `if (onRoom) onRoom(txnId)` ;
  `TrunkAppV13:3183` branche `onRoom` → `openRoom({ actorRole: 'buyer' })` → `setSheet('room')`.
- La **Room** (`TransactionRoom.tsx`) porte : suivi par étapes, **fil complet** (pas tronqué),
  chat, **le QR acheteur** (`OmniQr`), les transitions acteur, le reçu, l'échéance.
- Le **vendeur** atteint la même Room (même composant, `actorRole: 'seller'`).

### Ce qui RESTE ouvert (non tranché)

| # | Question | État mesuré |
|---|---|---|
| 1 | **Deux surfaces de chat coexistent** : le chat du flux est **tronqué à 4 messages** (`BuyerFlowV13:124` et `:169`, `.slice(-4)`) et reste dans `stage='txn'` en **repli** si `onRoom` n'est pas branché. | **FERMÉ 2026-10-16** — la surface `txn/qr/pay/rate` du flux est **supprimée** : le flux s'arrête à l'**intention** (`type Stage = 'avail' \| 'pending' \| 'result' \| 'intent'`). Le chat tronqué, le QR, le paiement et l'avis du flux n'existent plus ; **la Room est la SEULE surface post-intention**. Garde `room-only-post-intent.test.ts` (6) falsifié. |
| 2 | **Le vendeur n'est pas notifié à l'intention** : `createPurchaseIntent` écrit l'événement (`NR-4`, livré) — mais le **premier message utile** arrive au scan. Entre intention et scan, la notification existe désormais. | **Livré** (`NR-4`) ; reste à prouver en navigateur |
| 3 | **« Valider · ouvre le chat de transaction »** (maquette `seller-validate`, l.1111) : surface **absente de l'app** (0 occurrence de « devenue une intention »). `S-27` dit « au clic, ça valide en auto et lui ouvre le chat de cette demande précise ». | **FERMÉ 2026-10-16** - `TransactionRoom.tsx` rend la surface à `qr_ready` ; **preuve 6/6 Postgres réel** (`prove-room-s22-dashboard-validate.mjs`) + rendu 9/9. Dossier `omni-room-s22-dashboard-validate-evidence-2026-10-16.md` |
| 4 | **Le scan QR ouvre-t-il la Room ?** `NR-6` livré : le scan **ne jette plus** la transaction → « Ouvrir la transaction validée ». | **Livré** ; vérifier le comportement exact après validation |
| 5 | **Chat à l'intention = Room dédiée ou chat du flux complété ?** | **TRANCHÉ 2026-10-16** — **Room dédiée**. Le chat du flux n'existe plus : la Room porte le fil complet. La **reprise** d'une transaction (`resumeTransaction`, point 3) ouvre la Room, plus le flux ; le rôle est **lu** dans le snapshot (`actorRole`), jamais supposé (un vendeur reprend sa vente). |

## La question de fond, telle qu'elle se pose

`S-27` est précis : après l'intention, l'acheteur **et** le vendeur doivent se retrouver dans
**le chat de transaction de cette demande précise** — pas un chat générique, pas une liste.

Aujourd'hui :
- l'acheteur y arrive **si** `onRoom` est branché (il l'est) — donc **oui** en pratique ;
- mais le **repli tronqué existe toujours**, donc le comportement **n'est pas unique** ;
- le **vendeur** a la surface de la Room, mais **pas** la surface `seller-validate` que la
  maquette décrit (« cette dispo est devenue une intention d'achat » → « Valider · ouvre le chat »).

## Ce qu'il faut trancher (fondateur)

1. **Supprimer le repli tronqué** du flux (une seule surface de chat : la Room) — recommandé.
2. **Construire `seller-validate`** : la surface vendeur qui annonce « devenue une intention
   d'achat » et ouvre le chat de **cette** demande (maquette l.1111, `S-27`).
3. **Confirmer** que la Room reste la **seule** surface après l'intention (pas de retour au chat
   court).

Aucun code écrit ici : **état mesuré + questions**. Sur votre « go », je ferme les 3 points.
