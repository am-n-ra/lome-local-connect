# Rapport MCP — POP-1c-A sous-vague 3 : **Afrique de l'Est** — FORECAST FIGÉ (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :**
> `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-s3-est.md` (§3 = E1). **GO fondateur :** DEC-V2-19.
> **Branche :** `omni-v2-rebuild`, HEAD au départ **`032e8e4`** (≥ attendu ✅). **Porte :** `SPECIES_CLOSED_ROOT_OPEN`.
> **Aucun secret. Aucun redeploy. Aucune variable.** Canonique identifiée **par ses données**
> (`br-dawn-hill-am5amy22` = **142 471** facilités, = compte post-S2).

> **⏱ FORECAST — écrit AVANT tout dry-run et tout run canonique.** Méthode identique S1/S2 :
> extrait Geofabrik → `transform-osm-extract.py` (pré-filtre « nom vide » intégré) → classifieur
> `place-intake.ts`. **PAS de live Overpass.** Commit séparé (preuve d'ordre).

---

## 1. Extraits Geofabrik (Afrique de l'Est)

| Pays (slug) | Taille | Last-Modified GMT |
|---|---|---|
| kenya | 350 976 645 o (334,7 Mio) | 2026-09-27 |
| uganda | 371 282 069 o (354,1 Mio) | 2026-09-27 |
| tanzania | 706 089 592 o (673,4 Mio) | 2026-09-27 |
| rwanda | 67 535 059 o (64,4 Mio) | 2026-09-27 |
| burundi | 46 273 419 o (44,1 Mio) | 2026-09-27 |
| ethiopia | 139 771 181 o (133,3 Mio) | 2026-09-27 |
| somalia | 164 716 071 o (157,1 Mio) | 2026-09-27 |
| south-sudan | 138 848 546 o (132,4 Mio) | 2026-09-27 |
| eritrea | 31 554 207 o (30,1 Mio) | 2026-09-27 |
| djibouti | 7 023 150 o (6,7 Mio) | 2026-09-27 |
| madagascar | 389 441 606 o (371,4 Mio) | 2026-09-27 |
| mauritius | 9 397 271 o (9,0 Mio) | 2026-09-27 |
| comores | 3 981 919 o (3,8 Mio) | 2026-09-27 |
| seychelles | 2 758 979 o (2,6 Mio) | 2026-09-27 |

**Pays EXCLUS de S3 et pourquoi :**

| Pays | Motif |
|---|---|
| **Réunion**, **Mayotte** | **Aucun extrait Geofabrik propre** (vérifié sur le listing `africa.html`) — territoires FR, inclus dans un extrait France Europe, hors périmètre Afrique. Reportés/écartés. |
| **Soudan** (`sudan`) | Résolu par NOM mais **hors « Afrique de l'Est »** au sens du handoff (le handoff liste Soudan **du Sud**, pas Soudan). Rattaché à la sous-vague **Nord** (S4). |
| **Égypte**, **Libye**, **Tunisie** | Afrique du Nord → sous-vague **Nord** (S4). |
| **Malawi**, **Mozambique**, **Zambie**, **Zimbabwe** | Afrique **australe** → sous-vague **Australe** (S5). |
| **Kenya/Tanzanie/Ouganda** etc. | Inclus (pas exclus) — ci-dessus. |

Tags identiques aux vagues précédentes (shop / amenity-subset / craft / office / tourism-hôtellerie) ;
`sourceRef = node/<id>` stable ; attribution OSM conservée. Pré-filtre « nom vide » **intégré** :
`<pays>.json` = importables només, `<pays>.json.all.json` = tous les points matchés.

## 2. Volumétrie transformée par pays

| Pays | Matchés | Importables | Pré-filtrés (nom vide) | Avec adresse |
|---|---|---|---|---|
| kenya | 19 912 | 18 326 | 1 586 | 7 109 |
| uganda | 28 548 | 22 940 | 5 608 | 8 683 |
| tanzania | 114 232 | 70 360 | 43 872 | 41 839 |
| rwanda | 2 616 | 2 046 | 570 | 203 |
| burundi | 1 471 | 1 192 | 279 | 139 |
| ethiopia | 10 772 | 6 550 | 4 222 | 1 090 |
| somalia | 794 | 564 | 230 | 216 |
| south-sudan | 808 | 728 | 80 | 133 |
| eritrea | 440 | 384 | 56 | 180 |
| djibouti | 449 | 368 | 81 | 202 |
| madagascar | 12 585 | 8 140 | 4 445 | 968 |
| mauritius | 4 893 | 4 299 | 594 | 2 168 |
| comores | 547 | 466 | 81 | 165 |
| seychelles | 959 | 847 | 112 | 130 |
| **TOTAL** | **199 026** | **137 210** | **61 816** | 63 225 |

## 3. Distribution des tiers estimée (classifieur, ZÉRO écriture)

| Pays | matched | pilot | world | quarantine | raisons world | worldScope admis | worldScope quar |
|---|---|---|---|---|---|---|---|
| kenya | 19 912 | **0** | 18 426 | 1 486 | 18 326 outside-pilot + 100 nameless-with-addr | 18 426 | 1 486 |
| uganda | 28 548 | **0** | 24 710 | 3 838 | 22 940 outside-pilot + 1 770 nameless-with-addr | 24 710 | 3 838 |
| tanzania | 114 232 | **0** | 86 137 | 28 095 | 70 359 outside-pilot + 15 778 nameless-with-addr + 1 placeholder-no-address | 86 137 | 28 095 |
| rwanda | 2 616 | **0** | 2 051 | 565 | 2 046 outside-pilot + 5 nameless-with-addr | 2 051 | 565 |
| burundi | 1 471 | **0** | 1 214 | 257 | 1 192 outside-pilot + 22 nameless-with-addr | 1 214 | 257 |
| ethiopia | 10 772 | **0** | 6 944 | 3 828 | 6 550 outside-pilot + 394 nameless-with-addr | 6 944 | 3 828 |
| somalia | 794 | **0** | 622 | 172 | 564 outside-pilot + 58 nameless-with-addr | 622 | 172 |
| south-sudan | 808 | **0** | 731 | 77 | 728 outside-pilot + 3 nameless-with-addr | 731 | 77 |
| eritrea | 440 | **0** | 402 | 38 | 384 outside-pilot + 18 nameless-with-addr | 402 | 38 |
| djibouti | 449 | **0** | 379 | 70 | 368 outside-pilot + 11 nameless-with-addr | 379 | 70 |
| madagascar | 12 585 | **0** | 8 429 | 4 156 | 8 140 outside-pilot + 289 nameless-with-addr | 8 429 | 4 156 |
| mauritius | 4 893 | **0** | 4 391 | 502 | 4 299 outside-pilot + 92 nameless-with-addr | 4 391 | 502 |
| comores | 547 | **0** | 471 | 76 | 466 outside-pilot + 5 nameless-with-addr | 471 | 76 |
| seychelles | 959 | **0** | 853 | 106 | 847 outside-pilot + 6 nameless-with-addr | 853 | 106 |
| **TOTAL** | **199 026** | **0** | **155 760** | **43 266** | — | 155 760 | 43 266 |

**Lecture :** `pilot = 0` partout (même constat que S2 — la boîte pilote Lomé ne déborde pas).
Le pré-filtre « nom vide » écarte **61 816** points (Tanzanie = 43 872 à elle seule) ⇒ les runs
reçoivent **137 210** items només, pas 199 026.

## 4. Chevauchements estimés (pays-pays ET canonique)

**Intra-S3 (nœuds OSM partagés entre extraits voisins) :**

| Paire | Nœuds |
|---|---|
| uganda\|south-sudan | 153 |
| uganda\|rwanda | 114 |
| kenya\|tanzania | 83 |
| kenya\|uganda | 77 |
| uganda\|tanzania | 18 |
| tanzania\|rwanda | 7 |
| kenya\|ethiopia | 8 |
| ethiopia\|somalia | 4 |
| tanzania\|burundi | 3 |
| rwanda\|burundi | 2 |
| kenya\|somalia | 1 |
| ethiopia\|south-sudan | 1 |
| ethiopia\|djibouti | 1 |
| **Total intra-S3** | **472** (13 paires) |

**Chevauchement avec le canonique : 213** — **entièrement expliqué, pas une surprise** :
205 (uganda) + 8 (rwanda) sont des **nœuds déjà créés par S2**, `created_at = 2026-09-28T13:06Z`,
`source_id = c698af14…` (extraits **RDC/Congo** de S2). Ce sont des nœuds **frontaliers** présents à la
fois dans les extraits RDC/Congo (importés en S2) et dans les extraits Ouganda/Rwanda (S3). C'est
exactement la leçon S1/S2 : *chaque frontière inter-pays ajoute du dédup*. Vérifié par lecture directe
(`inspect-overlap.mjs`) : `name` = hôtels/kiosques/commerces frontaliers (« Mpondwe customs police
station », « Wilderness Bisate », « Lake View Hotel »…). **Aucun pré-existant Togo/Ouest/S1.**

**Chiffres de réconciliation :**
- somme des importables = **137 210**
- importables **distincts** = **136 740**
- chevauchements intra-S3 = **472** · chevauchement canonique = **213**
- **created attendu total = 136 740 − 213 = 136 527**

Dédup `(source_id, source_ref)` ⇒ **1 seule ligne par nœud, zéro doublon** attendu.

## 5. Perf attendue

Référence : p95 **186 ms** au canonique S2 (142 471 lignes) et p95 chaud **173–177 ms** sur jetable
pleine S2. Attendu S3 : p95 lecture Lomé plafonnée **≤ 220 ms** au pic jetable (≈ 279 000 lignes),
p95 écriture ~100 ms. **Stop si dégradation non plafonnée.**

---

**Forecast figé le 2026-09-28 AVANT tout dry-run / run canonique S3.**
