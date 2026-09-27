# Demo supply — real offers at existence level 4 (2026-09-27)

> **ID :** `DEMO-OMNI-SUPPLY-2026-09-27`
> **Branche :** `omni-v2-rebuild` · **Base canonique :** `br-dawn-hill-am5amy22`
> **Commit :** `61fe6ae` · **Prod :** `omni.sparkafrika.online`
> **Décision :** ordre fondateur — « fais la démo d'abord », comptes `demo@seller.omni` / `demo@buyer.omni`.

---

## 1. Ce qui a été mesuré avant

La preuve `R-F` avait déjà chiffré l'écart : la maquette affiche « intégrité ✓ · 4,6 ★ », la
réalité était **0 ✓ / 16** et **aucune offre n'était transactable**. Mesure de départ :

| Fait | Valeur |
|---|---|
| Offres publiées du vendeur démo | 8, **toutes** au niveau **2** (`availability_state = 'a_valider'`) |
| Offres avec un visuel | **0** (`media = []` partout) |
| Offres transactables (niveau 4) | **0** |
| Produits poubelles laissés par les preuves | 3 (`Root proof demo product`, `T-08 Offer …`) |

Le socle était construit ; il n'y avait rien à vendre dedans. C'est l'écart de **données** que
le fondateur ressentait — pas un écart de code.

## 2. Ce qui a été livré

| Livrable | Fichier | Nature |
|---|---|---|
| 3 visuels d'offre réels | `public/demo/*.png` | images servies par `/demo/` (Vite `publicDir`) |
| Générateur des visuels | `scripts/make-demo-offer-images.py` | Pillow, reproductible |
| Approvisionnement de la démo | `scripts/seed-demo-supply.mjs` | pilote le **code livré** (`createTrunkRepository`) |

**Aucune migration.** `S-06`/`S-32` restent **dérivées** de faits existants (invariant I-3 du
contrat `R-F`) : rendre une offre transactable, c'est écrire les faits, pas changer le schéma.

### Ce que le script fait, par offre héros

1. archive les 3 produits poubelles des preuves (jamais de suppression — l'histoire reste vraie) ;
2. crédite le Wallet ;
3. donne visuel + description (≥ 10 caractères) + les **4 caractéristiques** (uniqueness,
   handover, price, condition) — ce que la publication exige ;
4. publie (`transitionSellerProduct`) ;
5. active l'entitlement **Pro** de la facilité (D-04) ;
6. déclare une **disponibilité vivante** (`setProductAvailability` → `en_stock`, 4 h).

Ces deux dernières étapes sont celles qui font passer **2 → 4** : le niveau 3 exige une
disponibilité vivante, et le niveau 4 un stock **réservable > 0** (`allocated − reserved`).

## 3. Preuve — chemin de lecture public en production

`GET /api/v2/facilities/20000000-0000-0000-0000-000000000101` sur `omni.sparkafrika.online` :

| Offre | existence | intégrité | visuel |
|---|---|---|---|
| **Box déjeuner togolais** | **4 Transactable** | **ok (4/4)** | `/demo/box-dejeuner.png` |
| **Jus de gingembre frais** | **4 Transactable** | **ok (4/4)** | `/demo/jus-gingembre.png` |
| **Panier fruits de saison** | **4 Transactable** | **ok (4/4)** | `/demo/panier-fruits.png` |
| Café filtre local | 2 Offre publiée | partielle — `visuel` | — |
| Recharge mobile 1 Go | 2 Offre publiée | partielle — `visuel` | — |

- **Niveau de la facilité : `existenceLevel = 4`.**
- **Recherche** : `?q=jus`, `?q=box`, `?q=panier` remontent chacune `Omni Demo Seller Hub`
  (`existenceLevel = 4`) — la supply transactable est **découvrable**.
- **Visuel servi** : `GET /demo/box-dejeuner.png` → **HTTP 200** en prod.
- Captures : `.agent_tmp` / session — fiche facilité avec les trois vignettes et le badge
  de confiance.

Avant / après, sur la même donnée : **0 offre transactable → 3** ; **0 visuel → 3**.

## 4. Honnêteté du crédit Wallet

`createWalletRecharge` **refuse** sans identifiants FedaPay (« FedaPay recharge is not
configured for this environment ») : aucun checkout réel ne peut être créé depuis ce
sandbox. Le script insère donc l'intention que le code aurait insérée, avec une référence
**`demo-seed-…`**, et la remet au **vrai** `reconcileWalletRecharge` — celui que le webhook
appelle. La ligne de ledger est écrite **par le code livré**.

**Ce n'est pas un paiement.** C'est un raccourci d'approvisionnement de démo, étiqueté comme
tel. Le chemin payant réel reste `createWalletRecharge → FedaPay → reconcile`.

## 5. ⚠️ Défaut réel découvert en regardant la démo — devise d'affichage

La fiche affiche les prix « **7,20 $** », « **3,15 $** », « **10,00 $** » alors que les offres
sont **stockées en XOF** (720, 315, 1000 FCFA). **Ce n'est pas un défaut de la démo** : c'est
un défaut **pré-existant** que la démo a rendu visible.

- `TrunkAppV13.tsx:171` : `resolveUserCurrency({ locale: navigator.language })` — **sans ligne
  marché**. Sur un navigateur en `en-US`, `marketKeyForLocale('en-US')` résout le marché `US` →
  `{ currency: 'USD', symbol: '$', decimals: 2 }`.
- `formatAmount(prixReduit, userCurrency)` interprète alors un montant **stocké en XOF** comme
  des **centimes USD** → « 720 → 7,20 $ ». **Erreur d'un facteur 500**, **sans conversion**
  (le taux n'est jamais appliqué à l'affichage).
- Un utilisateur à Lomé (locale `fr`) voit « 720 F » — correct. Le défaut ne frappe que
  l'observateur hors marché, mais il **ment sur le prix** dans ce cas.

**Ce qui manque pour corriger** : chaque prix doit porter **sa devise** jusqu'à l'affichage, et
l'affichage doit **convertir** (via `normaliseMinor`/le taux du marché) ou **montrer la devise
d'origine** au lieu de la remplacer. Ce n'est **pas** un simple changement d'affichage : c'est
la règle `D-LOC-3` (« ne jamais comparer deux devises différentes silencieusement ») appliquée
au **rendu**. **Décision fondateur requise** : afficher la devise d'origine de l'offre, ou
convertir dans la devise du marché.

## 6. Ce qui reste

- **`R-A`** — vitrine acheteur des deux niveaux de recherche (`S-11`) : le sélecteur
  « Chercher une entité / Chercher une offre » **existe** à l'écran (vérifié), la vitrine
  acheteur complète du niveau « entité » n'est pas auditée.
- **`R-B` usage** — les caractéristiques sont écrites et **relues** ; 3/16 offres les déclarent
  désormais ; les autres attendent un acte vendeur.
- **Défaut devise §5** — décision fondateur requise.
- **5 offres encore au niveau 2** (dont 3 démo sans visuel) : c'est honnête — elles montrent
  l'échelle, pas une uniformité.

**Résidu honnête :** les 3 offres héros ont des visuels **synthétiques** (générés), pas des
photos réelles de produits. Ils prouvent le contrat (`S-32` visuel) et servent la démo ; ils
ne prétendent pas représenter la marchandise.
