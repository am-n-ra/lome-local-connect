# QR de transaction et verrou du prix — sémantique exacte (2026-10-16)

> **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). **Autorité :** `/nature-way`.
> **Déclencheur fondateur :** « clarifie ce que le QR encode et quand la remise/le prix est figé » (point 7).
> **Méthode :** mesuré dans le code servi, pas supposé.

## 1. Ce que le QR encode — DEUX QR distincts, à ne pas confondre

Il y a **deux** QR dans Omni. Ils n'encodent **pas** la même chose et ne servent **pas** le même but.

| | **QR de transaction** (acheteur ↔ vendeur, en face à face) | **QR public d'entité** (vitrine, S-21) |
|---|---|---|
| **Qui le montre** | L'**acheteur** (`OmniQr` dans la Room, `TransactionRoom.tsx`) | Le **vendeur** (`CompanyV13`, « affichez-le en boutique ») |
| **Qui le scanne** | Le **vendeur** (S-24 : strictement côté vendeur) | Un **client** de passage (`PublicQrScannerSheet`) |
| **Payload** | `transactionId:token` (UUID `:` jeton opaque) — `qrPayload()`, `api.ts:697` | `<origin>/?entity=<uuid>` — `entityQrPayload()`, `entity-qr.ts` |
| **Ce qu'il désigne** | **Une transaction précise** (S-23) | **Une entité** (un offreur), pas un lieu |
| **Effet d'un scan accepté** | Verrou `qr_ready → qr_verified` (S-22 : le même verrou que « Valider » au dashboard) | Ouvre la page de l'entité (ses offres + l'avantage Omni, S-21) |
| **Forme acceptée au scan** | `uuid:token` **ou** URL `…?txn=<uuid>&qr=<token>` | uuid brut, `?entity=<uuid>`, ou URL |
| **Producteur du rendu** | `OmniQr` (QRCodeSVG, sombre sur blanc — Heartwood S1) | `OmniQr` (même composant) |
| **Décodeur** | `extractTransactionPayload` (`SellerQrScannerSheet`) | `parseEntityIdFromQr` (`entity-qr.ts`) |

**Règle d'or (deux fois vécue) :** le **payload est défini une seule fois** et partagé entre le
rendu et le décodeur. Si le producteur et le lecteur divergeaient, un QR *scannable cesserait de
résoudre* sans que rien ne casse dans les tests unitaires par forme (leçon Heartwood S1 : mesurer un
QR par **sa lisibilité par un décodeur**, jamais par sa forme).

**Ce que le QR de transaction ne contient PAS** (et ne doit pas contenir) : ni prix, ni remise, ni
quantité. **Le QR ne transporte aucune donnée d'argent** — il désigne une transaction déjà créée et
déjà gelée côté serveur. Le vendeur qui scanne obtient l'identité de la transaction ; le **serveur**
répond ensuite avec l'état réel (prix, remise, moyens de paiement). Un QR ne peut donc pas « mentir
sur un prix » : il n'en porte aucun.

## 2. Quand le prix / la remise est FIGÉ — le gel est à l'INTENTION, pas à la validation

C'est le point qui prête à confusion et la mesure est sans ambiguïté.

| Moment | Ce qui se passe sur le prix | Source |
|---|---|---|
| **Annonce** (fiche, file, flux) | La remise Omni est **affichée** (`priceDisplay` : prix Omni + original barré + `−N %`). Rien n'est figé. | `price-display.ts`, partagé par toutes les surfaces |
| **Intention d'achat** (`createPurchaseIntent`) | **LE GEL A LIEU.** Une ligne `v2_transaction_snapshots` est **écrite une seule fois** : `unit_price_minor` (prix dû, après remise), `list_price_minor` (prix affiché avant remise), `discount_minor` (remise unitaire), `net_amount_minor` (total). | `trunk-repository.ts` (INSERT du snapshot dans le CTE de l'intention) |
| **Après l'intention** | Le snapshot est **APPEND-ONLY** (trigger `v2_transaction_snapshots_append_only_guard`, migration `003`) : **plus aucune écriture** ne peut le modifier. Si le vendeur change sa remise plus tard, **la transaction garde la sienne** (S-26, version gelée). | trigger + S-26 |
| **Validation vendeur** (`qr_ready → qr_verified`, scan OU clic dashboard) | **Le prix ne bouge pas.** `transitionTransaction` n'écrit **jamais** de prix — il ajoute un **événement** d'état. Le mot « cimenté » (option B fondateur) veut dire « désormais **irrévocable par le geste du vendeur** », pas « calculé à ce moment-là ». | `transitionTransaction` (vérifié : aucune écriture de prix) |

**Formule honnête à retenir :**

> **Remise annoncée avant · prix GELÉ à l'intention · verrou CIMENTÉ à la validation.**

**Pourquoi ce n'est pas « figé à la validation » :** figer au moment de la validation laisserait une
fenêtre où le prix affiché pourrait changer entre l'intention et le scan — exactement le mensonge
qu'on veut éviter. Le gel à l'intention garantit que **ce que l'acheteur a vu en appuyant sur
« Acheter » est ce qu'il paiera**, quoi qu'il arrive ensuite.

**Colonne dérivée, jamais stockée :** `cemented` (affiché « Total (prix validé) ») est **dérivé** de
l'événement `qr_verified`, **pas** d'une colonne du snapshot. Une colonne « ciment » avait été
ajoutée par erreur (`072`) puis **retirée** (`075`) : sur une table append-only elle serait restée
`NULL` à vie (un mensonge dormant). L'événement est la seule source de vérité du ciment.

## 3. Ce que l'acheteur et le vendeur voient (Room, après gel)

- **Les deux prix** : le total Omni (`net_amount_minor`) **et** l'original barré
  (`list_price_minor × quantité`), plus la remise Omni `−N` — dès qu'il y a une **vraie** remise.
  La règle est **une seule** (`priceDisplay`), partagée par la fiche, la fiche offre, la file et la
  Room : elles ne peuvent pas se contredire.
- **La mention « prix validé »** apparaît dès que le vendeur a cimenté (scan ou clic dashboard).
- **La remise est celle de l'OFFRE** (S-19 : `v2_products.discount_kind` / `discount_value`),
  appliquée par unité au prix demandé par le vendeur.

## 4. Moyens de paiement (point 6) — déclarés par le vendeur AU POINT DE REMISE

- Le vendeur déclare ce qu'il accepte (`v2_facilities.accepted_payment_methods` : `cash`,
  `mobile_money`) depuis sa fiche de lieu (`SellerV13`, « Moyens de paiement acceptés au point de
  remise »).
- **`NULL` = non déclaré** ⇒ l'acheteur voit **les deux** moyens (repli honnête, `TransactionRoom`) —
  jamais un mensonge sur ce qui est accepté.
- Le **lieu** dit *où* l'on paie ; l'**entité** dit *qui* vend (S-25). Le paiement se fait à la
  remise : la déclaration vit donc sur le **lieu**.

## 5. Invariants (ce qui ne doit jamais dériver)

1. Le QR de transaction désigne **une transaction** (`uuid:token`), **jamais** un prix.
2. Le QR d'entité désigne **une entité** (`?entity=<uuid>`), distinct du QR de lieu (`?facility=`).
3. Le payload est **défini une seule fois** par usage (rendu ≡ décodeur).
4. Le prix est **gelé à l'intention** ; le snapshot est **append-only** ; le ciment est **dérivé**.
5. Le QR d'entité n'est pas le QR de lieu : un décodeur d'entité **rejette** `?facility=` (contrôle
   négatif prouvé, Heartwood S1b).
6. Les moyens de paiement `NULL` ⇒ les deux (repli honnête), jamais « aucun ».
