# Root Contract — `S-06` (échelle d'existence) + `S-32` (intégrité & réputation de l'offre)

> **ID :** `ROOT-CONTRACT-S06-S32-2026-09-26`
> **Tranche :** `R-F` — Root (founder decision 2026-09-26 : « oui on en fait une tranche root »)
> **Autorité :** Seed V2 `S-06`, `S-32`, `S-30`, `S-31`, `S-26` (`omni-intent-brief-v2-2026-09-23.md`)
> **Maquette de référence :** `docs/maquette/omni-species-v2-interactive.html` (lignes 222-235 échelle, 154-162 intégrité, 515-518 cartes)
> **Phase :** Root System — **contrat avant code**. Aucune UI, aucun serveur écrit avant ce document.
> **Branche :** `omni-v2-rebuild`

---

## 1. Pourquoi cette tranche existe

`S-06` et `S-32` sont **confirmées par le fondateur et n'ont jamais été construites** (`0 occurrence` en code et en schéma, mesuré le 2026-09-26). Elles ne sont pas des décisions maquette : la maquette **les dessine déjà** — l'app ne les **calcule** pas.

C'est la définition exacte d'une tranche **Root** : la Species est faite, les contrats invisibles manquent. Ce document est ce contrat.

## 2. Ce que la maquette exige déjà (extraits réels, pas paraphrase)

**Échelle 0→4** (`omni-species-v2-interactive.html:222-233`) :

| Niveau | Libellé maquette | Sens |
|---|---|---|
| 0 | `Présente` | « sur la carte, pas encore gérée » |
| 1 | `Revendiquée` | « une entité en a pris la responsabilité » |
| 2 | `Offre publiée` | « stock déclaré, non confirmé » |
| 3 | `Disponibilité vivante` | « confirmée récemment » |
| 4 | `Transactable` | « transaction Omni possible maintenant » |

La maquette nomme l'invariant : **`Discoverable ≠ Queryable ≠ Available ≠ Transactable`**. Quatre mots pour quatre **capacités distinctes** — c'est la règle que le calcul doit respecter, pas une décoration.

**Intégrité / réputation** (`:154-162`, `:515-518`, `:862`) :
- intégrité **automatique** : « visuel + prix cohérent » ;
- réputation **par offre** : « 4,6 ★ · Achetée 12× · intégrité ✓ » ;
- **la confiance porte sur l'entité** (`S-30`) ; **la réputation, sur chaque offre** (`S-32`) ;
- `muted` = « rien à évaluer (honnête) ».

## 3. Mesure canonique avant contrat (2026-09-26, `br-dawn-hill-am5amy22`)

| Mesure | Valeur | Conséquence de conception |
|---|---|---|
| offres totales | **16** | |
| publiées | **13** | 3 non publiées → niveau ≤ 1 |
| `availability_state` = `a_valider` | **16 / 16** | **aucune** disponibilité vivante aujourd'hui |
| transactions | **12** | réputation **dérivable**, pas inventée |
| notations | **8** | tracées sur `v2_transaction_snapshots.product_id` |
| offres avec **visuel** (`media`) | **0 / 16** | ⚠️ l'intégrité sera **non-✓** partout — voir §7 |
| offres avec description | 16 / 16 | |
| offres avec entité | 13 / 16 | 3 offres sans entité → niveau 0/1 |

**Le fait décisif : `0/16` offres ont un visuel.** La maquette affiche « intégrité ✓ » sur **chaque** carte — c'est une maquette, elle **mente par construction**. Le code, lui, doit dire la vérité. Cette tranche va donc produire, pour la première fois, un écart visible **maquette ↔ réalité** — et **c'est le résultat attendu** : c'est précisément le « fond qui manque » que le fondateur ressent.

## 4. Contrat `S-06` — échelle d'existence

### 4.1 Nature : dérivée, jamais stockée

L'échelle est **calculée** à partir de faits existants. **Aucune colonne `existence_level`.** Raison : une colonne stockée peut mentir (vieillir, désynchroniser) ; une dérivation ne le peut pas. `S-06` décrit un **état du monde**, pas une saisie.

### 4.2 Règle de calcul (par **offre**)

| Niveau | Condition |
|---|---|
| **0 Présente** | l'offre existe, rattachée à un **lieu** non revendiqué (`facility.entity_id is null`) — ou lieu sans entité |
| **1 Revendiquée** | le lieu a une **entité** (`facility.entity_id is not null`) — mais l'offre n'est pas publiée |
| **2 Offre publiée** | `publication_state = 'published'` (stock déclaré, non confirmé) |
| **3 Disponibilité vivante** | niveau 2 **et** `availability_state in ('en_stock','verifie')` **et** non expirée (`availability_expires_at is null or > now()`) |
| **4 Transactable** | niveau 3 **et** disponibilité réelle > 0 : `greatest(quantity_allocated_omni - quantity_reserved_omni, 0) > 0` |

**Les quatre distinctions du Seed sont respectées :**
- `Discoverable` = niveau 0 (sur la carte) ;
- `Queryable` = niveau 2 (trouvable en recherche) ;
- `Available` = niveau 3 (disponibilité confirmée récemment) ;
- `Transactable` = niveau 4 (transaction **possible maintenant** — stock réservable réel).

**Un niveau 4 sans stock réservable est un mensonge** : c'est pourquoi le niveau 4 exige le stock **net des réservations** (déjà introduit par FF-8, `quantity_reserved_omni`). L'échelle réutilise la vérité existante au lieu d'en créer une seconde.

### 4.3 Niveau du **lieu** = max des offres publiées

La maquette affiche un niveau **par offre** (cartes) et une `levelLine()` **par lieu**. Le lieu affiche le **maximum** de ses offres publiées ; sans offre publiée, il affiche son niveau structurel (0 ou 1). C'est une **projection**, pas un second calcul.

### 4.4 Non-goals explicites

- **Pas** de colonne stockée, **pas** d'événement d'échelle (l'échelle est une lecture).
- **Pas** de nouvelle transition : les niveaux 2→3→4 dépendent de mécanismes **existants** (publication, `availability_state`, réservation).
- **Pas** de niveau 5 ni d'échelle par entité (le Seed s'arrête à 4, par offre).

## 5. Contrat `S-32` — intégrité (automatique)

### 5.1 Nature : dérivée, automatique, explicable

L'intégrité est **calculée** à chaque lecture, jamais saisie. Elle expose **un état** *et* **les raisons** — un ✗ sans raison est inutilisable et incroyable.

### 5.2 Les quatre contrôles (ceux du Seed, mesurables)

| Contrôle | Règle | Source |
|---|---|---|
| `visuel` | `media` non vide | `v2_products.media` |
| `prix` | `price_minor > 0` | `v2_products.price_minor` |
| `description` | description non vide (`length(btrim) >= 10`) | `v2_products.description` |
| `doublon` | pas d'autre offre **publiée**, **même entité**, **même nom normalisé** | dérivation |

### 5.3 États et honnêteté

| État | Condition | Rendu |
|---|---|---|
| `ok` | 4/4 contrôles passent | « intégrité ✓ » |
| `partielle` | 2–3 passent | « intégrité partielle » + raisons |
| `insuffisante` | 0–1 passe | « intégrité insuffisante » + raisons |

**Conséquence mesurée et assumée :** avec `0/16` visuels, **aucune** offre ne peut être `ok` aujourd'hui. La maquette montre ✓ partout ; l'app montrera `partielle`/`insuffisante` **avec la raison « visuel manquant »**. C'est **voulu** : c'est la vérité, et c'est un **acte vendeur** (comme `R-B`), pas un bug.

### 5.4 `prix cohérent` — trade-off documenté

`price_minor >= 0` est **vacuous** (contrainte de schéma). Le contrat retient `price_minor > 0`. **Trade-off :** une offre réellement gratuite serait signalée. Accepté au pilote — aucune offre à 0 n'existe (16/16 > 0), et le signalement est **explicable** (`prix à 0`), donc corrigeable. Si un jour le gratuit est légitime, on ajoute un marqueur `price_kind='gratuit'` (déjà au schéma) et le contrôle le respecte. **Trigger de révision : première offre gratuite légitime.**

## 6. Contrat `S-32` — réputation **par offre**

### 6.1 Source : les transactions tracées (`S-26`)

`v2_transaction_snapshots` porte **`product_id`** → les notations (`v2_ratings`, rattachées à `transaction_id`) sont **déjà** rattachables à une offre précise. **Aucune nouvelle table.**

| Champ | Règle |
|---|---|
| `reputation_count` | nombre de notations sur des transactions de **cette offre** |
| `reputation_score` | moyenne (`1 décimale`), **`null` si `count = 0`** |

### 6.2 Séparation `S-30` : entité ≠ offre

- `trust_state` reste sur l'**entité** (inchangé) ;
- la réputation est **par offre** ;
- l'UI **n'attribue jamais** la réputation de l'offre à l'entité ni l'inverse.

### 6.3 `muted` honnête

`count = 0` → l'UI affiche `muted` (« pas encore d'avis »), **jamais** « 0 ★ » (qui se lirait comme une mauvaise note).

## 7. Contrat d'interface (avant l'implémentation)

### 7.1 Types

```ts
// S-06 — dérivé, jamais stocké
export type ExistenceLevel = 0 | 1 | 2 | 3 | 4;
export interface OfferExistence {
  level: ExistenceLevel;
  label: string;            // 'Présente' | 'Revendiquée' | 'Offre publiée' | 'Disponibilité vivante' | 'Transactable'
  hint: string;             // le sens maquette
}

// S-32 — intégrité dérivée
export type OfferIntegrityState = 'ok' | 'partielle' | 'insuffisante';
export type OfferIntegrityCheck = 'visuel' | 'prix' | 'description' | 'doublon';
export interface OfferIntegrity {
  state: OfferIntegrityState;
  passed: number;           // 0..4
  total: 4;
  failed: OfferIntegrityCheck[];   // explicable
}

// S-32 — réputation par offre
export interface OfferReputation {
  count: number;
  score: number | null;     // null si count = 0 → UI muted
}
```

### 7.2 Extension de `PublicProduct` / `SellerCatalogueProduct`

Ajouter `existence: OfferExistence`, `integrity: OfferIntegrity`, `reputation: OfferReputation`. Le **lieu** (`PublicFacility`) expose `existenceLevel: ExistenceLevel` (max des offres publiées).

### 7.3 Rendu (aligné maquette, `design.md`)

- `levelLine()` : barres `0→4`, monochrome (`--ink`), **l'accent `#2E8B6F` réservé** aux `.vmark`/`.status.ok` — l'intégrité ✓ est de la **confiance**, donc l'accent y est permis **uniquement** pour `ok` ;
- intégrité `partielle`/`insuffisante` : `.status.dash`/`.status.warn` (jamais l'accent) ;
- réputation `null` : `.trust.muted` italique.

## 8. Invariants (testables)

| # | Invariant |
|---|---|
| I-1 | Le niveau 4 exige un **stock net réservable > 0** — jamais seulement « publié ». |
| I-2 | Le niveau 3 exige `en_stock`/`verifie` **et** non expiré. |
| I-3 | Aucune colonne `existence_level` ni `integrity_state` stockée (dérivation pure). |
| I-4 | `integrity.failed` **nomme** chaque contrôle échoué ; `ok` ⇔ `failed = []`. |
| I-5 | `reputation.score` est `null` **si et seulement si** `count = 0`. |
| I-6 | La réputation est **par offre** (`product_id`) ; la confiance reste **par entité**. |
| I-7 | Une offre non publiée ne peut pas dépasser le niveau 1. |
| I-8 | L'échelle ne crée **aucun** nouvel événement ni transition. |

## 9. Preuve attendue

- **Unitaire** : chaque niveau 0→4 sur fixtures réelles ; `failed` nommé ; `score=null ⇔ count=0` ; offre non publiée plafonnée à 1.
- **Négatif** : offre publiée **sans** stock net → **niveau 3, pas 4** (le mensonge exact à empêcher) ; `integrity ok` impossible sans visuel.
- **Live canonique** : les 16 offres → distribution réelle des niveaux + intégrités (attendu : 0 `ok`, majorité `partielle`/`insuffisante` par visuel manquant) ; réputation dérivée des 8 notations.
- **Navigateur** : `levelLine` + intégrité + réputation rendues, 4 largeurs.

## 10. Risque et réversibilité

| Risque | Mitigation |
|---|---|
| La vérité (0 ✓) déçoit visuellement | **C'est le but** : montrer le fond réel. L'écart devient un acte vendeur chiffré, pas un défaut caché. |
| `prix > 0` signale une offre gratuite légitime | Trade-off documenté §5.4 + trigger de révision. |
| Coût de la dérivation sur 206 lieux | Dérivation en **SQL**, une requête, index existants ; mesurer avant/après. |

**Réversible** : lecture pure — aucun retrait de donnée, aucune migration destructive. Retirer l'affichage suffit à revenir.

## 11. Décision demandée

**Aucune.** Le fondateur a tranché : « **oui on en fait une tranche root** ». Ce contrat exécute cette décision. Il est **reversible** et **sans destruction**.

**Trigger de re-plan** : si la mesure live montre que l'échelle ou l'intégrité **ne discriminent rien** (toutes les offres au même niveau), la tranche est revue avant l'UI.
