# Rapport MCP — POP-1c-A sous-vague 2 : **Afrique centrale** — FORECAST FIGÉ (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :**
> `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-s2-centrale.md` (§3 = S2-1).
> **Branche :** `omni-v2-rebuild`, HEAD au départ **`1ce28e0`** (≥ attendu ✅). **Porte :** `SPECIES_CLOSED_ROOT_OPEN`.
> **Aucun secret. Aucun redeploy. Aucune variable.** Canonique identifiée **par ses données**
> (`br-dawn-hill-am5amy22` = **117 854** facilités au départ, exactement le compte post-S1).

> **⏱ Ce document est le FORECAST — écrit AVANT tout dry-run et tout run canonique.**
> Méthode identique vague 0 / Ouest / S1 : extrait Geofabrik → `transform-osm-extract.py`
> (pré-filtre « nom vide » intégré) → classifieur `place-intake.ts`. **PAS de live Overpass.**

---

## 1. Extraits Geofabrik (Afrique centrale)

| Pays (slug Geofabrik) | Taille | Extrait (Last-Modified GMT) |
|---|---|---|
| cameroon | 223 335 858 o (213,0 Mio) | 2026-09-27 22:46:32 |
| central-african-republic | 99 438 500 o (94,8 Mio) | 2026-09-27 22:47:20 |
| chad | 135 107 116 o (128,8 Mio) | 2026-09-27 22:44:52 |
| congo-brazzaville | 32 618 691 o (31,1 Mio) | 2026-09-27 22:44:49 |
| congo-democratic-republic | 416 094 960 o (396,8 Mio) | 2026-09-28 02:39:43 |
| equatorial-guinea | 6 533 887 o (6,2 Mio) | 2026-09-27 22:45:33 |
| gabon | 25 459 109 o (24,3 Mio) | 2026-09-27 22:44:41 |
| sao-tome-and-principe | 1 258 900 o (1,2 Mio) | 2026-09-27 22:46:23 |

**Sao Tomé** est servie par Geofabrik comme **extrait propre** (`africa/sao-tome-and-principe-latest.osm.pbf`)
→ **incluse dans S2**, pas exclue. (Le handoff laissait ce point ouvert : « + Sao Tomé si l'extrait
l'inclut — sinon le noter explicitement comme exclu ».) Elle est incluse.

Tags identiques aux vagues précédentes (shop / amenity-subset / craft / office / tourism-hôtellerie) ;
`sourceRef = node/<id>` stable ; attribution OSM conservée.

**PRÉ-FILTRE « nom vide » intégré au transform** : écrit `<pays>.json` (payloads **importables**, nom
non vide) **et** `<pays>.json.all.json` (tous les points matchés, distribution classifieur complète).
Le `400 batch-reject` reste le contrat API.

## 2. Volumétrie transformée par pays

| Pays | Points matchés | Importables (només) | **Pré-filtrés (nom vide)** | Avec adresse |
|---|---|---|---|---|
| cameroon | 25 063 | 12 572 | **12 491** | 545 |
| central-african-republic | 319 | 277 | **42** | 17 |
| chad | 1 800 | 1 428 | **372** | 324 |
| congo-brazzaville | 3 246 | 3 018 | **228** | 173 |
| congo-democratic-republic | 5 804 | 5 339 | **465** | 1 236 |
| equatorial-guinea | 446 | 336 | **110** | 116 |
| gabon | 1 838 | 1 480 | **358** | 741 |
| sao-tome-and-principe | 250 | 219 | **31** | 20 |
| **TOTAL** | **38 766** | **24 669** | **14 097** | 3 172 |

## 3. Distribution des tiers estimée (classifieur, ZÉRO écriture, `scripts/prove-pop1c-distribution.mjs`)

| Pays | matched | pilot | world | quarantine | raisons world | worldScope admis | worldScope quarantine |
|---|---|---|---|---|---|---|---|
| cameroon | 25 063 | **0** | 12 585 | 12 478 | 12 572 outside-pilot + 13 nameless-with-addr | 12 585 | 12 478 |
| central-african-republic | 319 | **0** | 279 | 40 | 277 outside-pilot + 2 nameless-with-addr | 279 | 40 |
| chad | 1 800 | **0** | 1 456 | 344 | 1 428 outside-pilot + 28 nameless-with-addr | 1 456 | 344 |
| congo-brazzaville | 3 246 | **0** | 3 024 | 222 | 3 018 outside-pilot + 6 nameless-with-addr | 3 024 | 222 |
| congo-democratic-republic | 5 804 | **0** | 5 407 | 397 | 5 339 outside-pilot + 68 nameless-with-addr | 5 407 | 397 |
| equatorial-guinea | 446 | **0** | 353 | 93 | 336 outside-pilot + 17 nameless-with-addr | 353 | 93 |
| gabon | 1 838 | **0** | 1 637 | 201 | 1 480 outside-pilot + 157 nameless-with-addr | 1 637 | 201 |
| sao-tome-and-principe | 250 | **0** | 220 | 30 | 219 outside-pilot + 1 nameless-with-addr | 220 | 30 |
| **TOTAL** | **38 766** | **0** | **24 961** | **13 805** | — | 24 961 | 13 805 |

**Lecture du forecast :**
- **`pilot = 0` partout** — cohérent : la boîte pilote (1,0–2,45 E / 5,85–6,5 N) est Lomé + franges,
  aucun point d'Afrique centrale n'y tombe. La « boîte » ne déborde pas ici (contrairement à Ouest).
- **`quarantine` dominée par les sans-nom** (13 805) ; le pré-filtre les écarte du payload importable,
  donc les runs reçoivent **24 669** items nommés (`importables`), pas 38 766.
- **Attendu canonique :** `created ≈ distinct importable − existing` (chevauchements frontaliers intra-S2
  + chevauchement canonique). **≈ 24 617** nouvelles facilités → canonique **117 854 → ≈ 142 471**.

## 4. Chevauchements frontaliers estimés (pays-pays ET canonique)

**Méthode :** ensembles de `sourceRef` importables par pays (`.json`), comparés deux à deux et au
`v2_facility_source_refs` canonique (lecture seule). Aucune écriture.

**Chevauchements intra-S2 (nœuds partagés entre deux extraits Geofabrik) :**

| Paire | Nœuds |
|---|---|
| cameroon\|chad | 25 |
| congo-brazzaville\|congo-democratic-republic | 18 |
| cameroon\|central-african-republic | 4 |
| cameroon\|congo-brazzaville | 1 |
| central-african-republic\|congo-democratic-republic | 1 |
| equatorial-guinea\|gabon | 1 |
| **Total intra-S2** | **50** |

**Chevauchement avec le canonique existant (Togo + Ouest + S1) :** **2** nœuds (tous `cameroon` ;
attendu ≈ 0 — l'Afrique centrale ne touche pas les extraits déjà importés). Détail : `cameroon` 2,
tous les autres pays **0**.

**Chiffres de réconciliation :**
- somme des importables = **24 669**
- importables **distincts** = **24 619**
- chevauchements intra-S2 = **50** · chevauchement canonique = **2**
- **created attendu total = 24 669 − 50 − 2 = 24 617**

Dédup `(source_id, source_ref)` ⇒ **1 seule ligne par nœud, zéro doublon** attendu.

## 5. Perf attendue

Référence : p95 **186 ms** au canonique S1 (117 854 lignes, requête plafonnée 250 lignes), p95
**186 ms** au pic jetable S1. Attendu S2 : **p95 ≤ 250 ms** sur lecture Lomé plafonnée, écriture
p95 ~100 ms (mêmes ordres de grandeur qu'S1). **Stop si dégradation non plafonnée.**

---

**Forecast figé le 2026-09-28 AVANT tout dry-run / run canonique S2** — ce commit est la preuve d'ordre
(même méthode que `eb56227` pour S1).
