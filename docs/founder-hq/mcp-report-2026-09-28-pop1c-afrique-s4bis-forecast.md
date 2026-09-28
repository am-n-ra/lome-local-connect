# FORECAST POP-1c-A S4-bis — Maroc / Algérie (figé AVANT tout run, 2026-09-28)

> **Règle** : ce forecast est **écrit et commité avant le premier dry-run et le premier run canonique**
> (handoff S4-bis §3). Toute divergence sera rapportée, jamais réécrite.
> **Périmètre (DEC-V2-25)** : Maroc, Algérie. **Sahara occidental : EXCLU MOTIVÉ** (voir §4).
> **Branche** : `omni-v2-rebuild`. **Canonique** identifiée par ses données : **385 917** facilités
> (post-S5, DEC-V2-24).

## 1. Extraits Geofabrik

| Pays | Fichier | Version | Taille |
|---|---|---|---|
| Maroc | `africa/morocco-latest.osm.pbf` | `morocco-260927.osm.pbf` | 243 590 597 o |
| Algérie | `africa/algeria-latest.osm.pbf` | `algeria-260927.osm.pbf` | 300 378 049 o |

Téléchargement vérifié par `Content-Length` (octets identiques). Attribution OSM + `sourceRef` stable
(`node/<id>`). Mêmes tags que S1–S5. Pas de live Overpass.

## 2. Volumétrie (transform, pré-filtre « nom vide » intégré)

| Pays | matched (tous) | importables (nommés = entrée du run) | pré-filtrés (nom vide) | avec adresse |
|---|---|---|---|---|
| Maroc | 42 389 | **34 020** | 8 369 | 17 835 |
| Algérie | 43 269 | **25 288** | 17 981 | 11 296 |
| **Total** | **85 658** | **59 308** | **26 350** | 29 131 |

## 3. Distribution des tiers estimée (classifieur sur l'ensemble *matched*)

| Pays | pilot | world | quarantine | raisons principales |
|---|---|---|---|---|
| Maroc | 0 | 35 055 | 7 334 | outside-pilot-zone 34 020 · nameless 7 334 · nameless-with-address 1 035 |
| Algérie | 0 | 27 865 | 15 404 | outside-pilot-zone 25 288 · nameless 15 404 · nameless-with-address 2 577 |

Lecture : `world` du classifieur inclut les *nameless-with-address* (placeholders géocodés) que le
**payload nommé n'importe pas** — c'est le pré-filtre qui opère, pas une divergence. **L'entrée réelle
du run = les `importables` (nommés)** (§2). Quarantine toujours refusée-comptée.

## 4. Sahara occidental — EXCLU, motif explicite

- **Aucun extrait Geofabrik propre et stable** : `africa/western-sahara-latest.osm.pbf` et
  `africa/sahara-latest.osm.pbf` **redirigent vers la racine** du site (302 `Location: /`, page HTML
  9 609 o) — il n'existe pas de `.osm.pbf` dédié. Même règle que **Réunion/Mayotte** (S3).
- **Le territoire est néanmoins présent DANS l'extrait `morocco-latest.osm.pbf`** (Geofabrik le
  rattache au Maroc) : min lat **21,33** (le Maroc métropolitain commence ~27,7), **520** importables
  nommés dans la bbox Sahara occidental (lat<27,67 ∧ lng<−8,6) = **1,5 %**.
- **Décision appliquée** : **exclure par filtre bbox** (lat<27,67 ∧ lng<−8,6) — 520 importables + 756
  points *all* retirés du run Maroc. Le littoral marocain légitime le plus au sud (« Tarfaya », lat
  ~27,9) est **conservé**. Les points OSM **à l'intérieur du Maroc métropolitain** (ex. Laâyoune rev.
  marocaine) sont conservés ; seuls l'extrême-sud contesté est écarté. Exclusion **motivée, mesurée,
  réversible** (filtre, pas suppression).

## 5. Chevauchements frontaliers estimés (dédup à prévoir)

- **Intra-sous-vague (Maroc|Algérie)** : **12** `source_ref` identiques (frontière commune).
- **Canonique (croisement avec les 385 917 existants)** : **Maroc 0**, **Algérie 72**.
  - Les 72 algériens sont des **nœuds de frontière** : **16** recouvrent `s4:tunisia` (frontière
    ouest tunisienne), **1** `s4:libya`, **55** d'une vague antérieure de la même journée
    (`source_id c698af14…`, créés ~12:27Z). **Tous `unclaimed`, 0 revendiqué** (vérifié en base) —
    réconciliables comme « existants », aucun conflit d'identité.
  - Les 5 « marocains » du premier passage ont disparu après filtrage Sahara occidental (ils étaient
    dans la bbox exclue) → **Maroc 0**.

## 6. Attendus des runs (sur la base des `importables` nommés)

| Pays | entrée | chev. canonique | chev. intra | **créés attendus** | **existants attendus** |
|---|---|---|---|---|---|
| Maroc (1er) | 34 020 | 0 | 12 (avec Algérie) | **34 020** | 0 |
| Algérie (2e) | 25 288 | 72 | 12 (avec Maroc) | **25 204** | 84 (72+12) |
| **Total** | 59 308 | 72 | — | **59 224** | **84** |

Distinct importables **59 296** = 34 020 + 25 288 − 12. Créés distincts **59 224** = 59 296 − 72.

**Canonique attendue : 385 917 → 445 141** (`facilities`, `source_refs`, `runs` +59 224).
`intake_tier` : world +59 224 ; **pilot intouché (10 481)** ; `products` 16 et `entities` 3 intacts.

## 7. Perf attendue

Référence S5 : p95 **165 ms** ; plafond **186 ms**. S4-bis n'ajoute que ~59 k lignes → **aucune
dégradation attendue**. **Stop si p95 > 186 ms non plafonné.**
