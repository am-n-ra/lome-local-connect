# Root — inventaire des finitions (`R-B`…`R-E`) + alignement app ↔ maquette

**As of :** 2026-09-25 · **Porte :** `SPECIES_CLOSED_ROOT_OPEN` · **Branche :** `omni-v2-rebuild`
**Autorité :** `/nature-way` · **Handoff :** `HO-OMNI-20`

**Pourquoi ce document.** Le fondateur a validé Species (« Validé ») **et** demandé : « et les
éléments nécessitant finition ? ». Ce document **mesure** chaque finition au lieu de la décrire.
Toute ligne porte sa **preuve**, et une ligne non mesurée le dit.

---

## 1. Ce qui est **fini et accepté**

| Objet | Mesure |
|---|---|
| Species V2 | **CLOSE `founder-confirmed` 2026-09-25** — `SP-1…SP-10` |
| Conformité Seed | `check:species-t12` → **27/27 conforme · 26 décisions rendues / 32 · `NON MESURÉ = 0`** |
| Maquette | `check:maquette` → **74 écrans, 5 niveaux**, registre honnête, 0 doublon |
| Socle entité (`D-C1`) | `058`→`061` appliqués + vérifiés live : `v2_products.facility_id` **nullable**, `v2_entities`, `entity_id` |
| Incohérences Seed↔code | **0 ouverte** (`check:coherence`) |
| Tests | **600/600** · tsc · boundary · state verts |

---

## 2. Finitions du socle (Root)

### `R-B` — caractéristiques d'offre déclarées mais **jamais écrites**

**Le plus important des quatre.** Le Seed (S-01/S-02) dit : *tout est offre, et le type est une
**caractéristique** de l'offre*. Les colonnes existent (`058`). **Aucune ligne de code ne les écrit.**

| Caractéristique | Occurrences dans `trunk-repository.ts` | Remplissage live |
|---|---|---|
| `position_kind` | **0** | 13/16 — **issu du backfill `058`, pas d'une écriture** |
| `uniqueness_kind` | **0** | **0/16** |
| `handover_kind` | **0** | **0/16** |
| `price_kind` | **0** | **0/16** |
| `condition_kind` | **0** | **0/16** |

**Preuve d'écriture absente** — l'`insert into v2_products` de `createSellerProductDraft` liste
`facility_id, entity_id, name, description, unit, price_minor, currency, discount_kind,
discount_value_minor, quantity_allocated_omni, idempotency_key, publication_state` :
**aucune caractéristique**.

**Conséquence honnête** : le **modèle** est Seed-conforme ; **l'usage** ne l'est pas. Un vendeur ne
peut pas déclarer qu'une offre est neuve/occasion, unique/reproductible, retrait/livraison,
négociable/fixe. La recherche ne peut donc pas filtrer dessus — la maquette le montre, l'app ne le
peut pas.

**Finition** : ajouter les caractéristiques au formulaire de création/publication + à l'`insert` +
les exposer dans la recherche. **Effort : tranche moyenne.** C'est le vrai « fond qui manque ».

### `R-C` — 3 offres sans entité (sur 16)

Mesuré live : `products_with_entity = 13 / 16`. Les 3 restantes n'ont pas de propriétaire au sens du
Seed. **Finition** : backfill ou rattachement explicite. **Effort : petite** (données, pas code).

### `R-D` — chemin `individu` jamais exercé

`C-6` (seuil de confiance adapté au volume : **1** pour un particulier, **3** pour un commerce) est
**corrigé en code**, mais **0 entité `individu`** existe en base. Le chemin n'a **jamais tourné sur
des données réelles** — il est prouvé unitairement, pas en situation.

**Finition** : créer une entité `individu` de bout en bout (création → offre → 1 vente → bonus).
**Effort : petite** (fixture + preuve), mais **elle vaut son coût** : c'est la promesse
« un particulier peut vendre sans structure ».

### `R-E` — R-5, découverte 2 niveaux (S-11)

Prochaine tranche planifiée du board. **Finition : tranche moyenne.**

---

## 3. Alignement app ↔ maquette — **le plus gros écart visible**

La maquette est **close et acceptée** ; **l'app ne l'a pas suivie.** Cet écart était **interdit**
tant que Species était ouverte (l'aligner = Root/Trunk). **Root est ouvert : il est débloqué.**

| Écart | Maquette (acceptée) | App (réelle) | Preuve |
|---|---|---|---|
| **Seuils réglables** | `.chip.seuil` **éditable** (`setSeuil`) | **chips figés** `'Quantité 10'`, `'≤ 15 000 FCFA'` — **0 occurrence de `seuil`** dans `src/trunk/` | `search-constraints.ts:42-43` |
| **Devise par localisation** (`D-LOC-1…5`) | devise **portée par le state** (`budgetCurrency`/`budgetSymbol`) | **`OMNI_DEFAULT_LOCAL_CURRENCY` en dur** | `TrunkAppV13.tsx:40` |
| **`public.markets`** (prérequis `D-LOC`) | table prévue (`011`) | **ABSENTE** du canonique v2 — `markets_table = 0` | live |
| **Dette devise (données)** | — | **9 produits `USD` tarifés en francs** (`price_minor < 100000` pour les 9) | live |
| **Bug serveur budget** | — | le filtre compare `price_minor <= budgetMaxMinor` **sans devise ni conversion** | code |

**Lecture honnête** : ce n'est pas de la cosmétique. Le fondateur a demandé que *« la devise dépende
de la localisation de user »* — c'est un **contrat** (`D-LOC`), et l'app **le contourne**. Le dépôt
**prévoit déjà** `convertUsdMinorToLocal(currency)` **paramétré** ; le code appelle la constante.
**Le fond était prévu, le code le contournait** — même schéma que `D-C1`.

**Finition** : brancher `markets` + passer la devise par le state + corriger le filtre budget serveur
+ réparer les 9 produits mal tarifés. **Effort : tranche moyenne à grande.**

---

## 4. Dettes hors finitions (ne pas confondre)

| # | Objet | État |
|---|---|---|
| `T-07d` | Prod `index-BUMFRcnb.js` ≠ local | **OUVERT** — ne pas pousser sans vérifier |
| `SCOUT-01` | Couverture mondiale de lieux orpheline | ouvert |
| `SCOUT-02` | `v2_purchase_intents.state` non lu par l'UI | ouvert |
| `SP-9`/`S-15` | Routage : décision **ne pas** poser `MAPBOX_ACCESS_TOKEN`, étiqueter « à vol d'oiseau » | **décidé** ; OSRM conservé (coût 0) |

---

## 5. Ordre recommandé

1. **`R-B`** — les caractéristiques d'offre : c'est le **fond** qui manque, et il touche création,
   publication **et** recherche. Le plus structurant.
2. **Alignement app ↔ maquette** — seuils réglables + devise par localisation (le plus **visible**
   pour le fondateur, et ce qu'il a explicitement demandé).
3. **`R-D`** — chemin `individu` (petit, mais c'est une promesse produit).
4. **`R-C`** — 3 offres sans entité (petit).
5. **`R-E`** — R-5 découverte 2 niveaux.

**Rien ici ne rouvre Species.** Ce sont des finitions de **socle** et d'**alignement** — la porte
courante est Root, elles y appartiennent.

---

## 6. Non mesuré (honnêteté)

- **Effort réel** de chaque finition : **non estimé en heures** — je ne mesure pas le temps.
- **Qualité visuelle** de l'alignement après coup : **non mesurée** (exige une preuve navigateur
  aux 4 largeurs, comme PRE-1).
- **Dette devise** : les **9** produits sont comptés, mais leur **prix correct** (devise visée) n'est
  **pas** déterminé — c'est une décision, pas une mesure.
