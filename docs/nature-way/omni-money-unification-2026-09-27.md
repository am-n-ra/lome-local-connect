# Unité monétaire — mesure exhaustive et unification (2026-09-27)

> **ID :** `D-LOC-9` / tranche `UNI-MONEY-1`
> **Ordre fondateur :** « go je crois on doit passer à une seule famille »
> **Branche :** `omni-v2-rebuild` · **Base canonique :** `br-dawn-hill-am5amy22`
> **Méthode :** *mesurer avant de décider* — le tableau ci-dessous sort de la base réelle, pas d'une lecture de code.

---

## 1. Le relevé — 16 colonnes, 4 conventions

Ce que la base contient **réellement** (min → max par colonne) :

| Colonne | Valeurs réelles | Facteur | Famille |
|---|---|---|---|
| `v2_wallet_recharge_intents.amount_minor` | 100 → 600 000 | **×100** | Wallet |
| `v2_wallet_ledger_entries.amount_minor` (`recharge`) | 10 000 → 600 000 | **×100** | Wallet |
| `v2_wallet_ledger_entries.amount_minor` (`facility_pro_spend`) | 500 000 | **×100** | Wallet |
| `v2_facility_entitlements.price_minor` | 500 000 | **×100** | Wallet |
| `v2_seller_unlocks.amount_minor` (défaut) | 10 000 | **×100** | Wallet |
| **`v2_products.price_minor`** | 200 → 6 500 | **×1 (brut)** | **Offre** |
| **`v2_transaction_snapshots.unit_price_minor`** | 200 → 5 720 | **×1 (brut)** | **Offre** |
| **`v2_availability_responses.price_minor`** | (réponses vendeur) | **×1 (brut)** | **Offre** |
| **`v2_availability_requests.budget_minor`** | **510 → 200 000** | **×1 (brut)** | **Demande** |
| `v2_ad_campaigns.budget_minor` / `spent_minor` | (créés depuis le wallet) | **×100** | Wallet |
| `v2_products.discount_value_minor` | `fixed` 1 · `percentage` 10 → 30 | **ce n'est pas une unité** | **% ou FCFA** |
| **`v2_wallet_ledger_entries.bonus_grant`** | **2 000** | **≠ 10 000** | **⚠️ anomalie** |

### Faits vérifiés

- **Le wallet est cohérent ×100.** Les 10 000 proviennent de `Math.round(transaction.amount * 100)` (`http.ts:1347`) : FedaPay dit **100 F** → 10 000 minor. Les 600 000 sont le crédit démo (**6 000 F**). **K = 100 partout, sans exception.**
- **Les offres sont brutes.** Un snapshot réel porte `unit_price_minor = 6500` pour **6 500 F**, et `net = unit × qté` **exactement** (12/12 lignes, écart 0).
- **`discount_value_minor` n'est pas une unité.** Pour `percentage` il contient **10 → 30** — un **pourcentage**. Pour `fixed` il contient **100**. **Le nom duplique « minor » sur une colonne qui n'en est pas une.**
- **⚠️ Anomalie réelle : le bonus.** `v2_seller_unlocks.amount_minor` porte **10 000** (glose D-H « 20 USD = 10 000 minor ») mais le ledger débité par le code (`trunk-repository.ts:3433`, `:3767`) porte **2 000**. `10000 / 2000 = 5` → **la glose interprète 10 000 comme des centimes USD (÷500 = 20 USD), le ledger comme 2 000 F.** **Deux lectures de la même constante**, dont une seule est juste.
- **⚠️ Les budgets de demande ne sont affichés par personne correctement.** `budgetMinor` chemine du formulaire acheteur (brut) jusqu'au repo, mais `money()` le divise par 100 : un budget de **200 000 F** s'affiche **« 2 000 F »**.

---

## 2. Pourquoi « deux familles » est pire que deux familles

Le vrai défaut n'est pas qu'il existe deux facteurs. C'est que :

1. **Les deux colonnes portent le même nom.** `amount_minor` / `price_minor` / `budget_minor` — rien ne dit le facteur. Le seul discriminant est **par quel paramètre le montant est entré**.
2. **Le formateur est recopié quatre fois.** `function money(...)` existe dans `TrunkAppV13` (`:83`), `SellerV13` (`:8`), `BuyerFlowV13` (`:25`), `SellerReplyV13` (`:11`) — quatre implémentations indépendantes. Deux d'entre elles **ne convertissent pas la devise** du tout.
3. **La base n'énonce aucune règle.** Aucun commentaire SQL, aucune contrainte. Un lecteur ne peut pas la déduire.

C'est ce qui a produit **quatre** erreurs ×100 cette session. **Ce n'est pas de la malchance : c'est structurel.**

---

## 3. La convention retenue

**Une seule règle : `montant_stocké = valeur × 100`, pour toutes les colonnes, pour toutes les devises** (y compris les devises à 0 décimale comme le FCFA).

Raison du choix — c'est la direction qui **touche le moins de choses** et **s'aligne sur ce qui est déjà cohérent** :

| Direction | Ce qu'il faut migrer | Verdict |
|---|---|---|
| **×100 partout** (retenu) | offres (16 lignes), budgets de demande (7 lignes) | **Le wallet reste intact** — déjà ×100 et `fedapay ×100` reste vrai ; le débit réel de 5 000 F continue de valider |
| Décimales vraies (XOF = ×1) | wallet (intents, ledger, entitlements), packs, FedaPay | **Touche le ledger monétaire** — le plus risqué, et contredit `http.ts:1347` |

**Ce qui devient vrai :** un seul formateur, un seul facteur, une comparaison de prix correcte partout, et — point décisif — **l'unité du wallet et celle de l'offre ne peuvent plus diverger**.

**Ce qui est assumé :** 500 000 signifie « 5 000 F ». C'est un modèle en **centimes** : on ne peut pas stocker une fraction de franc, ce qui est sans objet pour le FCFA.

---

## 4. Plan d'exécution (`UNI-MONEY-1`)

| Étape | Action | Risque | Preuve exigée |
|---|---|---|---|
| **UM-1** | Un **seul** formateur partagé `formatMoney(minor, currency)` dans `src/domain/` ; supprimer les **4** copies locales de `money()` | Faible | tests + gardes |
| **UM-2** | **Déclarer** la convention : commentaire SQL sur chacune des 16 colonnes + constante documentée | Faible | lecture `obj_description` |
| **UM-3** | **Renommer** `discount_value_minor` → `discount_value` (ce n'est pas une unité) | Faible | migration idempotente |
| **UM-4** | **Migrer** les offres ×100 : `price_minor`, `unit_price_minor`, `net_amount_minor`, `availability_responses.price_minor` | **Élevé** — 16 offres + 12 snapshots | **branche jetable**, aller-retour vérifié |
| **UM-5** | **Migrer** les budgets de demande ×100 | Moyen — 7 lignes | idem |
| **UM-6** | **Trancher le bonus** (2 000 vs 10 000) et aligner code + glose | Moyen — **décision fondateur** | test croisé |
| **UM-7** | **Test croisé** qui échoue si une colonne dévie de la convention (le test qui manquait) | Faible | falsification |

**UM-6 exige un arbitrage** : le bonus vaut-il **20 $ (≈ 10 000 F)** ou **2 000 F** ? Le code débite 2 000 F et la glose promet 20 $. **Je ne peux pas trancher à votre place** — c'est la même classe d'erreur que « 5 000 F », mais sur de l'argent promis à un vendeur.

### UM-6 — tranché par le fondateur (2026-09-27) : **le bonus vaut $20**

Décision fondateur : bonus = **$20**. La mesure a corrigé l'énoncé du problème.

**Le relevé exact, mesuré en base :**

| Écriture | Valeur stockée | Vaut réellement | Promet |
|---|---|---|---|
| serveur (`trunk-repository`) | `10 000` | 100 F = **0,20 $** | « 20 USD » |
| seed démo (`seed-demo-lome`) | `2 000` | 20 F = **0,04 $** | « $20 × 2 » |
| **ce que $20 exige** | **`1 000 000`** | **10 000 F = 20 $** | — |

La question « 2 000 vs 10 000 » supposait qu'un des deux valait $20 : **aucun des deux**. Sous la convention famille (stocké = valeur × 100), `10 000` vaut 100 F, pas 10 000 F — le serveur se trompait d'un facteur **100**, le seed d'un facteur **500**. La mesure FedaPay confirme la convention (`amount_minor = 10000` ⇒ 100 F).

**Correction livrée (UM-6) :**
- **Une seule source** : `SELLER_BONUS_USD_MINOR = 2000` (=$20.00) dans `src/domain/pricing.ts`, convertie par `convertUsdMinorToLocal` → `1 000 000` XOF minor. Le serveur, le seed et l'UI en **dérivent** ; plus aucun littéral de bonus nulle part.
- **La base** (`062`) : le wallet est **append-only** (garde `v2_wallet_ledger_append_only_guard`) — l'histoire financière ne se réécrit pas. La correction est une **écriture ajoutée** (`reversal`, référence `bonus-correction:…`), idempotente : le solde net devient `1 000 000` exactement. `v2_seller_unlocks` (registre, pas ledger) est ramené à `1 000 000` et son `DEFAULT` fixé.
- **L'UI** dérive le libellé (`formatUsdSticker(SELLER_BONUS_USD_MINOR)`) : les quatre « 20 USD » en dur sont remplacés.
- **Tests** : dérivent la valeur attendue de la **même source** — ils ne peuvent plus se figer sur un montant périmé, ce que les trois tests codant `10 000` avaient fait.

**Preuve :** branche jetable `money-062-proof-2026-09-27` (10/10 statements, bonus net `1 000 000` par facilité, rejeu idempotent — `2` corrections et non `4`, garde append-only ré-armée) puis **appliqué sur la canonique** `br-dawn-hill-am5amy22` (registre `c1f2dfa4…`, 11 offres + 9 snapshots rescalés, colonne renommée).

---

## 5. Ce qui est livré dans cette tranche

- **UM-1** : un seul formateur, quatre copies supprimées.
- **UM-2** : convention déclarée en base.
- **UM-7** : test croisé falsifiable.

**UM-3/4/5 sont préparés et prouvés sur branche jetable**, puis appliqués sur ordre explicite — la migration touche de l'argent stocké et **ne se défait pas** d'un `git revert`.

**Résidu honnête :** les données actuelles sont des **données de démonstration** (16 offres, 12 snapshots, 1 entitlement). **C'est précisément pourquoi c'est le bon moment** : après de vraies transactions, cette migration cesse d'être possible.
