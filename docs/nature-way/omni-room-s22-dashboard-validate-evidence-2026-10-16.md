# Room — point 2 fermé : le vendeur valide depuis le dashboard (S-22), 2026-10-16

Fondateur : « **fermons d'abord room 2** ». Le point 2 était : *la surface vendeur
`seller-validate` de la maquette est absente* (`S-27` : « au clic, ça valide en auto et lui ouvre
le chat de transaction de cette demande précise »).

## Le défaut, mesuré (pas supposé)

À l'état `qr_ready` (l'intention vient d'être créée), la Room n'offrait **aucun bouton au vendeur** :

- `TransactionRoom.tsx` : `myTurn = responsible === actorRole` ; or `transactionStateResponsible('qr_ready')`
  renvoie **`buyer`** → pour le vendeur, `myTurn` était **faux** → le bloc d'actions n'était pas rendu.
- La **matrice serveur l'autorisait pourtant** : `trunk-repository.ts:4635` —
  `actorRole = 'seller' and current_state = 'qr_ready' and to = 'qr_verified'`.

**Conséquence réelle** : un vendeur **sans caméra** (ou dont l'acheteur ne montre pas son QR)
ne pouvait **jamais** verrouiller sa vente depuis son dashboard. `S-22` dit explicitement que
« valider dans le dashboard = **même verrou** que scanner » — précisément pour ce cas.

## Livré

- `TransactionRoom.tsx` : `sellerCanValidate = actorRole === 'seller' && currentState === 'qr_ready'`.
  La surface `seller-validate` de la maquette (l.1111) est rendue : titre « Cette disponibilité est
  devenue une intention d'achat », l'offre, le montant, l'avantage Omni s'il existe, le bouton
  **« Valider · ouvre le chat de transaction »**, et la phrase qui dit **ce que le clic fait**
  (« verrouille la transaction, exactement comme un scan de QR »).
- La ligne **Étape** dit désormais **la vérité** au vendeur : « vous validez (scan ou dashboard) »
  au lieu de « à l'acheteur » — sinon l'écran se contredisait lui-même.
- Le vendeur ne voit **jamais** le QR de l'acheteur (`S-24` : scan strictement côté vendeur) —
  verrouillé par un test.

**Aucune règle serveur ajoutée** : la Room **lit** la matrice existante et déclenche la transition
autorisée. C'est la même philosophie que `X3` (« la Room n'introduit aucune règle neuve »).

## Preuve — deux niveaux, dont un contre Postgres réel

**1. Rendu (jsdom, `TransactionRoom.test.tsx` → 9/9)** — 3 tests neufs :
- vendeur à `qr_ready` → « devenue une intention » + « Valider », et **pas** de QR acheteur ;
- le clic déclenche bien `transitionTransaction({ from: 'qr_ready', to: 'qr_verified', actorRole: 'seller' })` ;
- acheteur à `qr_ready` → **aucune** surface de validation vendeur.

**Falsifié** : `sellerCanValidate` neutralisé → **2 tests échouent** ; restauré → 9/9.

**2. Postgres réel (`scripts/prove-room-s22-dashboard-validate.mjs` → 6/6)**, sur branche jetable
`br-broad-pine-am94hj7q` (créée depuis la canonique, **supprimée après**) :
- **T1** le vendeur **verrouille depuis le dashboard, sans aucun scan** → `qr_verified` ;
- **T2** l'acheteur ne peut **pas** se faire passer pour le vendeur (refusé, état inchangé) ;
- **T3** un tiers non-membre est **refusé** ;
- **T4** double clic **idempotent** (un seul événement `qr_verified`) ;
- **T5** la suite du flux est **inchangée** (paiement déclaré → confirmé).

**T2/T3 sont le contrôle discriminant** : la surface est ouverte au vendeur **sans** l'ouvrir à
n'importe qui. Un bouton qui « marche » parce qu'il ne vérifie rien ne serait pas une preuve.

## Ce qui reste (points 1 et 3, non faits ici)

- **Point 1** : le chat du flux, **tronqué à 4 messages** (`BuyerFlowV13:124`/`:169`), coexiste
  toujours comme repli → à supprimer pour que la Room soit la **seule** surface.
- **Point 3** : confirmer que la Room reste la seule surface après l'intention.

## Mesure

**1280/1280 tests**, `tsc` 0, 6 gardes verts, build `index-BHMVVkf8.js`.
