# Notifications · intention → chat · QR de retrouvaille · réponse auto — audit mesuré

> **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). **Autorité :** `/nature-way`.
> **Plan local :** `NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01` (tâches `NR-4…NR-8`).
> **As of :** 2026-10-15 · **Branche :** `omni-v2-rebuild` · **HEAD :** `53c91a0`.
> **Déclencheur fondateur :** « notification doit porter le logo omni ensuite au clic ça doit ouvrir la
> bonne sheet de l'event… quand user confirme intention d'achat il (buyer) doit voir le chat
> transactionnel s'ouvrir et le seller doit recevoir notification et pouvoir accéder au chat
> transactionnel depuis son dashboard… le qr c'est dans le cas où ils sont en face à face… il scan pour
> accéder plus vite à son chat transactionnel… selon notre model quand est-ce que seller peut accéder
> à la réponse auto selon quelles conditions ? »

## 0. Verdict en une ligne

**Quatre des cinq déclarations fondateur sont des défauts réels mesurés** — dont **un mensonge
affiché à l'acheteur** (« source : auto » alors que le vendeur a confirmé à la main). **Le modèle de
réponse auto existe** (TRUNK-X2) mais **ne répond à aucune demande** : c'est une propriété d'**offre**
(badge), pas un producteur de **réponse**. La réponse à la question 5 est en §5.

## 1. Mesure — les 5 déclarations, confrontées au code

| # | Déclaration fondateur | Vérité mesurée | Verdict |
|---|---|---|---|
| 1 | La notification doit porter le **logo Omni** | Le service worker sert `icon: '/omni-logo-compact.png'` + `badge` (même fichier, **512×512**). **C'est le seul canal qui a un visuel** : le **centre in-app** (`NotificationCenterV13`) n'a **aucun logo** — juste `<span class="chk">` (puce de non-lu) + libellé. La maquette (`SHEETS.notifications`, l.807) n'a pas non plus d'avatar : des lignes `.kv`. | **PARTIEL** — logo présent côté OS, absent côté in-app |
| 2 | Au clic → **la bonne sheet de l'event** | `notificationTarget()` route **correctement** : `transaction_turn` → `flow` (transaction), `availability_response_created` → suivi de demande, `availability_request_created` → file vendeur, `claim_reviewed` → dossier, `claim_submitted` → revue, `seller_account_*` → espace vendeur. **Mais** : (a) aucun type ne mène à la **Room** ; (b) l'acheteur n'a **pas** de producteur `transaction_turn` au moment de l'intention (voir #3) donc **aucune notification n'existe** pour l'ouverture du chat. | **PARTIEL** — routage bon, **événement manquant** |
| 3 | Intention → l'**acheteur voit le chat s'ouvrir** | `createPurchaseIntent` ouvre `stage='qr'` **si** un jeton QR est émis, sinon `stage='txn'`. Le chat **existe** dans `stage='txn'` — mais **tronqué à 4 messages** (`.slice(-4)`, l.119) et **mélangé** au suivi/QR/paiement dans le même écran. La **Room dédiée** (`TransactionRoom`, fil **complet**) n'est atteignable **que** depuis les listes (« Transactions en cours » / « Terminées »), **jamais** depuis l'intention. **Deux surfaces de chat coexistent**, l'acheteur ne voit pas la vraie. | **DÉFAUT RÉEL** |
| 4 | Intention → le **vendeur est notifié** + accède au chat depuis son dashboard | **`createPurchaseIntent` n'écrit AUCUNE notification.** Mesure : `grep "v2_notification_events"` sur la fonction (l.6584–6980) → **0 occurrence**. Le premier événement que le vendeur reçoit est `transaction_turn` à la **transition** `qr_ready → qr_verified` — c'est-à-dire **après** que l'acheteur a montré son QR. Entre l'intention et le scan, **le vendeur ne sait rien**. Il *peut* accéder à la Room (liste `Transactions`, `SellerV13`) **s'il ouvre l'app de lui-même** — mais **rien ne l'avertit**. | **DÉFAUT RÉEL** |
| 5 | Le **QR** sert à **retrouver vite** la bonne transaction en face-à-face | Modèle **correct** : `v2_qr_tokens.transaction_id` (S-23) → une transaction. Le scanner vendeur (`SellerQrScannerSheet`) vérifie le QR et renvoie `{facilityId, productId, productName, quantity, unitPriceMinor, couponCode, netAmountMinor}` — **toutes les données pour ouvrir la bonne Room**. Or le call-site (`TrunkAppV13:3136`) fait `onVerified={(accepted) => { if (accepted) maybePromptPush('seller-qr'); }}` : il **jette** les données renvoyées et **retombe sur la liste** (`setSheet('seller')`). **Le QR ne fait pas ce que le fondateur décrit** : il verrouille, mais n'ouvre pas la transaction. | **DÉFAUT RÉEL** |

**Le mensonge (§ à part) :** `BuyerFlowV13:410` et `:426` affichent en dur
`{product.name} ×{quantityValue} (source : auto)`. **Aucune réponse automatique n'existe** (mesure §5) :
la donnée vient de `liveResponse` = la réponse **du vendeur**. L'acheteur lit donc **« auto » pour un
geste humain** — l'inverse exact de la règle fondatrice (« ne jamais transformer le silence en
disponible »). **Chaîne littérale, aucune donnée ne la soutient.**

## 2. Ce que le modèle dit (Seed V2, autorité)

| Réf | Règle | Où |
|---|---|---|
| `S-27` | « dans sa partie dédiée, il voit que **la demande de dispo est maintenant une intention d'achat** ; **au clic, ça valide en auto et lui ouvre le chat de transaction de cette demande précise** » | Seed V2 |
| `S-22` | « Valider dans le dashboard = **même verrou** que scanner » (sinon un vendeur sans caméra ne peut jamais verrouiller) | Seed V2 |
| `S-23` | « La transaction est **retrouvable par défaut** dans le dashboard vendeur (scope membre) » | Seed V2 |
| `S-24` | « Le scan du code acheteur est **strictement côté vendeur** » | Seed V2 |
| `S-02`/`A-3` | La dispo peut venir « **réponse vendeur, ou auto depuis le stock alloué**, dans une **fenêtre de fraîcheur** » — **non testé** | Seed V2 |

La maquette porte **exactement** ce que le fondateur décrit, et l'app ne l'a pas :
- `SHEETS['seller-validate']` (l.1111) : « Cette dispo est devenue une intention d'achat » + bouton
  **« Valider · ouvre le chat de transaction »** — **surface absente de l'app** (0 occurrence de
  « devenue une intention » dans `src/`).
- `SHEETS['seller-chat']` (l.1165) : chat scopé transaction + actions (paiement, remise) + échéance.
- `SHEETS['txn-track']` (l.681) : suivi + **« Ouvrir la Room de transaction »** (l.697) — l'app a la
  Room mais **ne l'ouvre pas depuis le flux**.

## 3. Défauts réels, classés

| ID | Défaut | Classe | Preuve | Impact |
|---|---|---|---|---|
| `NR-4` | `createPurchaseIntent` **ne notifie pas le vendeur** | logique/serveur | `grep v2_notification_events` sur l.6584–6980 → 0 | Le vendeur ignore qu'une intention existe ; S-27 non tenu |
| `NR-5` | L'acheteur ne voit **pas le chat s'ouvrir** à l'intention (Room inatteignable depuis le flux ; chat du flux tronqué à 4) | logique/UI | `BuyerFlowV13:119` `.slice(-4)` ; `openRoom` appelé seulement depuis les listes | Deux surfaces de chat ; S-27 non tenu |
| `NR-6` | Le **scanner QR n'ouvre pas la transaction** (données jetées) | logique/UI | `TrunkAppV13:3136` → `maybePromptPush` seul | Le QR ne sert pas à « retrouver vite » (déclaration 5) |
| `NR-7` | « **(source : auto)** » en dur pour une réponse **humaine** | **mensonge affiché** | `BuyerFlowV13:410,426` | Contredit la règle centrale : on ne prétend pas une dispo auto |
| `NR-8` | Le centre de notifications **in-app n'a pas de logo** | visuel | `NotificationCenterV13` : aucune image | Demande fondateur 1, moitié in-app |

## 4. Le piège — « réponse auto » ≠ ce que le code fait

**Mesure :** `v2_reconcile_auto_availability()` (migration `068`) écrit **`availability_state`** de
l'**offre** (`en_stock`/`a_valider`) depuis `greatest(allocated − reserved, 0)`. Elle **n'écrit jamais
`v2_availability_responses`** (0 occurrence dans la fonction ; la seule écriture de réponses est
`respondAvailability`, chemin **vendeur**). La colonne `auto_availability` est **`false` pour les 16
offres** du canonique (preuve X2).

**Conséquence :** le mot « auto » recouvre **deux choses différentes**, et **le modèle les distinguait déjà** :

1. **Disponibilité auto du badge** (TRUNK-X2, existe) — *l'offre dit si elle a du stock*, sans vendeur.
2. **Réponse auto à une demande** (n'existe pas) — *le système répond à la place du vendeur*, au nom de
   l'entité, **avec un acteur `automation` traçable** (Root §6.3).

L'app **affiche le n°1 comme s'il s'agissait du n°2**. Ce n'est pas un mot vague : **c'est un acteur
modélisé dans Root, jamais construit, et remplacé à l'écran par une chaîne en dur.**

## 5. ⚠️ CORRECTION — le modèle AVAIT spécifié la réponse automatique

> **Le fondateur a raison, et mon §5 initial était faux.** J'avais présenté des « conditions minimales
> dérivées » et posé **3 décisions**, comme si le modèle était muet. **Il ne l'était pas.** Species
> (2026-08-27) puis Root (`v2-roots.md`) avaient modélisé la **réponse automatique comme un ACTEUR**.
> J'ai lu le *résumé* du Seed (« réponse vendeur, ou auto depuis le stock alloué ») au lieu de lire les
> **artefacts d'autorité**. C'est la faute de méthode que le fondateur vient de nommer.

### 5.1 Ce que le modèle dit — textes exacts

| Source | Texte | Ce que ça tranche |
|---|---|---|
| **Species blueprint** §95 | « Le Seller Pro dispose d'un réglage explicite **« Répondre automatiquement depuis le stock Omni »**, avec quantité allouée, quantité disponible, dernière mise à jour, fraîcheur et bouton désactiver » | L'auto-réponse est un **réglage vendeur**, pas une déduction silencieuse |
| **Species blueprint** §113 | « La réponse automatique Pro ne doit pas afficher seulement « disponible ». Elle affiche la **quantité Omni, le prix, la réduction, l'âge de la dernière observation et un niveau de confiance**. Une donnée fraîche peut répondre **immédiatement** ; une donnée ancienne affiche « **vérification requise** » et déclenche le Seller ; une **quantité insuffisante est exclue** des résultats compatibles avec la recherche. La transaction **revalide toujours la quantité**, même après une réponse automatique » | Répond à mes questions 1 et 3 |
| **Species buyer flow** « Disponibilité hybride » | « Une donnée fraîche peut produire une réponse automatique et doit afficher l'âge exact de l'observation. Une donnée ancienne affiche un état de confiance inférieur et sollicite une vérification manuelle Seller. **Une réponse automatique ne transforme jamais une donnée périmée en vérité** » | L'auto est **liée à la fraîcheur** |
| **Species prompt pack** | « Une réponse automatique **n'est visible que lorsque le stock Omni est frais** » | Idem |
| **Root** §4 (faits autoritatifs) | « Current availability = **Seller action or explicitly bounded approved automation**, with timestamp » | L'automation est un **acteur autorisé**, borné |
| **Root** §6.3 | `availability_responses` : « request, **seller/automation actor**, status, quantity, price/offer snapshot, freshness, correction metadata and audit linkage » | L'acteur auto est **modélisé dans la table** |
| **Root** §7 (opérations) | `respondAvailability(requestId)` → « Required authority: **Authorized seller or approved automation** » | L'auto passe par **la même opération** |
| **v1 mockup** SCREEN 34 | « La spécification prévoit déjà cette **déduction sur transaction complétée lorsqu'une auto-réponse a été utilisée** » | L'auto consomme le **stock alloué** |
| **Maquette V2** `seller-automation` | « La disponibilité automatique **répond au nom de l'entité**, jamais l'acheteur à sa place » | Le mot « répond » est **littéral** : c'est une réponse |
| **Maquette V2** `fraicheur` | « Le badge vieillit : mis à jour par le vendeur (**ou automatiquement, entité Pro**) » | Les deux voies coexistent |

### 5.2 Les 3 questions que j'avais posées — le modèle y répond

| Ma question | Réponse du modèle | Reste ouverte ? |
|---|---|---|
| **Auto partielle ?** | **NON** — « une quantité insuffisante est **exclue** des résultats compatibles avec la recherche ». L'auto répond quand le stock **suffit** ; sinon elle ne répond pas. | **TRANCHÉ** — pas de réponse partielle automatique |
| **Délai de courtoisie ?** | **NON** — « Une donnée fraîche peut répondre **immédiatement** ». Le modèle n'a aucun délai. | **TRANCHÉ** — réponse immédiate |
| **Offre négociable ?** | **Le modèle Species n'a jamais traité la négociation** (0 occurrence de « négoci » dans le blueprint, le contrat buyer, `v2-roots.md`, le lifecycle). `price_kind` est arrivé **plus tard** (`R-H`, Root). L'auto Species cite « le prix » et « la réduction », pas un prix négocié. | **VRAIMENT OUVERTE** — intersection **Root**, pas un oubli de Species |

### 5.3 Le vrai défaut de racine — le schéma ne peut PAS distinguer auto et humain

**Root disait** `availability_responses` : « seller/**automation actor** ». **Mesure du schéma :**

```
v2_availability_responses (
  responder_account_id uuid references v2_accounts(id) on delete set null,   -- nullable
  ... aucune colonne actor_kind / source_kind
)
```

`grep "actor_kind\|'automation'" db/migrations/*.sql` → **seule occurrence : le commentaire de `068`**.
`grep "responder_account_id is null" src/ db/` → **vide** : le `NULL` n'est **jamais** interprété.

**Conséquence, et c'est l'explication du mensonge `NR-7` :** le schéma **ne peut pas** dire si une
réponse vient d'un vendeur ou de l'automation. L'app a donc **inventé** la marque « (source : auto) »
en dur — elle ne pouvait pas la **lire**. **Un modèle Root non implémenté force l'interface à mentir.**

### 5.4 Ce que TRUNK-X2 a construit — et ce qu'il a laissé

Le contrat X2 dit explicitement : « Ce qui est automatique : offre transactable → `en_stock` … Un seul
état dérive du stock : `en_stock` ». **X2 a construit le BADGE** (l'état de l'**offre**).

Le modèle Species demandait **deux choses distinctes** — et la maquette porte **les deux** :
1. **Disponibilité automatique** = l'**état/badge** de l'offre → **construit par X2** ✔
2. **« Répondre automatiquement depuis le stock Omni »** = produire une **`availability_response`** au
   nom de l'entité → **jamais construit** ✘

**X2 a donc implémenté une partie du modèle Species, pas une erreur.** Le défaut est que l'app
**présente la partie 1 comme si c'était la partie 2** (`NR-7`), et que le schéma ne permet pas de
distinguer les deux (§5.3).

### 5.5 Conditions d'éligibilité — reformulées depuis le modèle (pas inventées)

Le modèle ne nomme pas de liste, mais **chaque condition est adossée à un texte** :

| # | Condition | Texte d'autorité |
|---|---|---|
| C1 | **Entitlement Pro vivant** (lieu ou entité) | Species blueprint §95 « Seller **Pro** dispose d'un réglage » ; lifecycle §7 « sous réserve d'une **entitlement active** » ; X2 §6 |
| C2 | **Réglage explicite activé** (« Répondre automatiquement depuis le stock Omni ») | Species blueprint §95 |
| C3 | **Stock Omni frais** (fenêtre D-03 : 4 h frais / 24 h expiré) | Species buyer flow « Une réponse automatique **n'est visible que lorsque le stock Omni est frais** » |
| C4 | **Quantité suffisante** — sinon **exclue**, jamais « partielle » | Species blueprint §113 |
| C5 | **Ne transforme jamais une donnée périmée en vérité** → données anciennes ⇒ « vérification requise » ⇒ **humain** | Species buyer flow + blueprint §113 |
| C6 | **Affiche** quantité Omni, prix, réduction, **âge de l'observation**, **niveau de confiance** | Species blueprint §113 |
| C7 | **La transaction revalide la quantité** (et le Buyer **ne paie pas** un nouveau crédit pour cette revalidation) | Species blueprint §113/§115 |
| C8 | **Déduit le stock alloué** à la transaction complétée | v1 mockup SCREEN 34 |
| C9 | **Trace l'acteur `automation`** (distinct d'un vendeur) | Root §6.3 « seller/**automation actor** » — **à construire** |
| C10 | **Répond au nom de l'entité, jamais à la place de l'acheteur** | Maquette V2 `seller-automation` |

**Ce qui reste à trancher (une seule vraie question, Root-era) :** sur une offre
`price_kind='negociable'`, l'auto répond-elle **au prix affiché** (donc refuse de négocier) ou
**s'abstient-elle** pour laisser le vendeur négocier ? Le modèle Species n'a pas connu la négociation ;
`R-H` l'a ajoutée après. **Intersection à trancher.**

## 6. Ce qui n'est PAS un défaut (vérifié, pour ne pas « corriger » l'inverse)

- **Le routage des notifications** est **correct** et honnête : cible inconnue → `none` (jamais un
  lien mort). Les 8 producteurs écrivent des cibles valides.
- **Le logo côté OS** est **déjà** le bon fichier (`omni-logo-compact.png`, 512×512, précaché par le SW).
- **La liste « Transactions » vendeur** est **déjà** membre-scopée (`listOpenTransactions`) — S-23 est
  tenu : la transaction **est** retrouvable par défaut. Ce qui manque est **l'avis** (NR-4) et **l'accès
  direct depuis le scan** (NR-6).
- **La Room** est **complète** (fil entier, transitions acteur, reçu dérivé) — elle existe, elle n'est
  simplement **pas branchée sur le moment qui la déclenche**.
- **`/api/v2/notifications/push-key` répond `configured: true` en prod** (clé VAPID posée) — le push
  réel est **armé** ; ce n'est pas la cause des défauts ci-dessus.

## 7. Ordre recommandé (dépendances)

| Ordre | Tranche | Pourquoi cet ordre |
|---|---|---|
| 1 | `NR-7` (retirer « source : auto ») | **Mensonge affiché** — coût minimal, honnêteté immédiate, aucune dépendance. **Ne PAS remplacer par une autre marque** tant que `NR-9` n'existe pas : le schéma ne peut pas distinguer (§5.3) |
| 2 | `NR-4` (notifier le vendeur à l'intention) | **Racine** : sans l'événement, le vendeur ne sait pas ; débloque `NR-5` et `NR-6` |
| 3 | `NR-5` (ouvrir le chat à l'intention, acheteur **et** vendeur) | S-27 ; dépend de `NR-4` pour le côté vendeur |
| 4 | `NR-6` (le scan QR ouvre la transaction) | S-22/S-23/S-24 ; dépend de `NR-5` (une seule surface de chat) |
| 5 | `NR-8` (logo in-app) | Visuel, indépendant |
| 6 | `NR-9` (réponse auto) | **Capacité modélisée mais jamais construite** (Species §95/§113 + Root §6.3). Le modèle tranche **2 des 3** questions (§5.2) ; il reste **l'intersection `price_kind='negociable'`** et **la colonne `actor_kind`** à ajouter (§5.3). Reste une **fondation** : à décider explicitement |

## 8. Décisions fondateur demandées

1. **Réponse auto (`NR-9`)** — **le modèle répond déjà** : pas de partielle (§5.2), pas de délai
   (§5.2), acteur `automation` à tracer (§5.3). **Reste UNE question** : sur une offre
   `price_kind='negociable'`, l'auto répond-elle **au prix affiché** (refuse de négocier) ou
   **s'abstient-elle** ?
2. **Ordre** — confirmer `NR-7 → NR-4 → NR-5 → NR-6 → NR-8`, puis `NR-9` (fondation).
3. **Chat à l'intention** — ouvrir la **Room dédiée** (recommandé, une seule surface, fil complet)
   ou garder le chat **dans le flux** et le compléter ? La maquette dit `txn-track` + bouton
   « Ouvrir la Room » — donc **deux temps**, pas deux implémentations.

## 9. Leçon de méthode (à ne pas réapprendre)

**J'ai lu le résumé du Seed au lieu des artefacts d'autorité.** Le Seed dit en une ligne « réponse
vendeur, ou auto depuis le stock alloué » — **un résumé**. Les **artefacts** qui font autorité
(Species blueprint §95/§113, contrat buyer Species, Root `v2-roots.md` §4/§6.3/§7, maquette V2
`seller-automation`) disaient **beaucoup plus** : un **réglage vendeur explicite**, une **règle de
fraîcheur**, un **acteur `automation` dans la table**, et jusqu'à la **déduction sur transaction**.

**Règle : quand une décision produit est en cause, lire la chaîne d'autorité complète
(Seed → Species → Root → maquette), pas le seul Intent Brief.** Le brief **résume** ; les artefacts
**spécifient**. Conclure « le modèle est muet » depuis un résumé m'a fait poser **3 questions déjà
tranchées** — le fondateur a dû me corriger. C'est la même classe que `T-12`/`SP-1` : *mesurer au
mauvais endroit et déclarer absent ce qui est écrit ailleurs.*
