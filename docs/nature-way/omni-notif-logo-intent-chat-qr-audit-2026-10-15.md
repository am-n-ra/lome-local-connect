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

## 4. Le piège à ne pas manquer — « réponse auto » ≠ ce que le code fait

**Mesure :** `v2_reconcile_auto_availability()` (migration `068`) écrit **`availability_state`** de
l'**offre** (`en_stock`/`a_valider`) depuis `greatest(allocated − reserved, 0)`. Elle **n'écrit jamais
`v2_availability_responses`** (0 occurrence dans la fonction ; la seule écriture de réponses est
`respondAvailability`, chemin **vendeur**). La colonne `auto_availability` est **`false` pour les 16
offres** du canonique (preuve X2).

**Conséquence :** le mot « auto » recouvre **deux choses différentes** :
1. **Disponibilité auto du badge** (TRUNK-X2, existe) — *l'offre dit si elle a du stock*, sans vendeur.
2. **Réponse auto à une demande** (n'existe pas) — *le système répond à la place du vendeur*.

L'app **affiche le n°1 comme s'il s'agissait du n°2**. C'est exactement la dette que `S-02` nomme, et
elle est **déguisée en vocabulaire** — pas supprimée.

## 5. Réponse à la question fondateur — conditions d'accès du vendeur à la « réponse auto »

Le modèle Seed dit « réponse vendeur, **ou** auto depuis le stock alloué, dans une fenêtre de
fraîcheur ». **Il ne définit pas les conditions d'éligibilité.** Voici les **conditions minimales,
dérivées de décisions déjà verrouillées** (aucune invention) :

| # | Condition | Source (déjà décidée) | Pourquoi elle est nécessaire |
|---|---|---|---|
| C1 | **Entitlement `facility_pro` vivant** (`state='active'` **et** `ends_at > now()`, lieu **ou** entité) | `D-04` + `R-4b` + contrat X2 §6 | L'auto est une capacité **Pro** ; juger sur la colonne `commercial_plan` est un bug déjà corrigé (`R-4b`) |
| C2 | **Offre `published`** | `RH-02` + X2 §1 | Une offre non publiée n'a pas de demande à servir |
| C3 | **`auto_availability = true`** sur l'offre (opt-in explicite du vendeur) | `068` colonne + contrat X2 | Le vendeur **choisit** de déléguer ; l'auto ne s'active pas toute seule |
| C4 | **Stock disponible ≥ quantité demandée** : `greatest(allocated − reserved, 0) ≥ requested` | `FF-8` (même vérité que `respondAvailability`) | Sinon l'auto **mentirait** sur une quantité qu'elle ne peut pas servir — exactement le refus de stock de `NR-3` |
| C5 | **Dans la fenêtre de fraîcheur** (`availability_expires_at > now()`, 4 h frais / 24 h expiré) | `D-03` + X2 §5 | Le Seed lie l'auto à la fenêtre ; hors fenêtre la dispo n'est plus une vérité |
| C6 | **`availability_state` ∈ (`en_stock`, `verifie`)** — jamais `bientot` (manuel), jamais `verifie` **écrit** par l'auto | X2 §2/§3 | `bientot` est un état **humain** qui ne se déduit pas du stock ; `verifie` est un palier de **confiance** (S-06) |
| C7 | **Aucune réponse déjà écrite** pour cette demande/ce lieu (idempotence) | `NR-3` (`on conflict`) | Un rejeu ne doit pas créer une 2ᵉ réponse ni re-notifier |
| C8 | **Le prix auto est le prix affiché**, jamais un prix négocié | `R-H` (`offer-price.ts`) | L'auto ne **négocie** pas : négocier est un acte **humain** ; sur `price_kind='negociable'`, l'auto répond au prix affiché **sans** absorber une proposition |
| C9 | **Traçabilité** : la réponse auto est marquée `source='auto'` (jamais confondue avec un vendeur) | `S-06` (honnêteté) + `R-F` (intégrité nomme ses faits) | L'acheteur doit pouvoir **distinguer** une réponse auto d'une réponse humaine |
| C10 | **Notification au vendeur** qu'une réponse auto a été émise en son nom | `S-16`/`S-21` (notification) + `S-27` | Un vendeur doit **savoir** ce que le système a répondu pour lui — sinon c'est un mandat silencieux |

**Ce que cela implique (et que je ne tranche pas seul) :**
- **C4 est le point dur** : une auto-réponse **partielle** (stock < demande) serait-elle permise ? Le
  modèle `respondAvailability` accepte `partial` — mais une auto qui dit « partiel » **à la place** du
  vendeur engage sa parole. **Décision fondateur requise.**
- **C8 sur offre négociable** : l'auto répond-elle **au prix affiché** (refus de négocier) ou
  **s'abstient-elle** (laisse le vendeur négocier) ? **Décision fondateur requise.**
- **Le délai** : l'auto répond-elle **immédiatement** à la création de la demande, ou après un
  **délai de courtoisie** (ex. 15 min) laissant au vendeur la main ? `S-02` ne le dit pas.
  **Décision fondateur requise.**

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
| 1 | `NR-7` (retirer « source : auto ») | **Mensonge affiché** — coût minimal, honnêteté immédiate, aucune dépendance |
| 2 | `NR-4` (notifier le vendeur à l'intention) | **Racine** : sans l'événement, le vendeur ne sait pas ; débloque `NR-5` et `NR-6` |
| 3 | `NR-5` (ouvrir le chat à l'intention, acheteur **et** vendeur) | S-27 ; dépend de `NR-4` pour le côté vendeur |
| 4 | `NR-6` (le scan QR ouvre la transaction) | S-22/S-23/S-24 ; dépend de `NR-5` (une seule surface de chat) |
| 5 | `NR-8` (logo in-app) | Visuel, indépendant |
| 6 | `NR-9` (réponse auto) | **Bloqué** sur les 3 décisions du §5 — c'est une capacité **neuve** (fondation), interdite sur Branches sans décision |

## 8. Décisions fondateur demandées

1. **Réponse auto** — les 3 points du §5 (partielle permise ? offre négociable ? délai de courtoisie ?).
2. **Ordre** — confirmer `NR-7 → NR-4 → NR-5 → NR-6 → NR-8`, `NR-9` après décision.
3. **Chat à l'intention** — ouvrir la **Room dédiée** (recommandé, une seule surface, fil complet)
   ou garder le chat **dans le flux** et le compléter ? La maquette dit `txn-track` + bouton
   « Ouvrir la Room » — donc **deux temps**, pas deux implémentations.
