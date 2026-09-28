# Rapport MCP — POP-1c-A sous-vague 5 : **Afrique australe** — FORECAST FIGÉ (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :**
> `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-s5-australe.md` (§3 = U1). **GO fondateur :**
> DEC-V2-23 (S4 gardée DEC-V2-22). **Branche :** `omni-v2-rebuild`, HEAD au départ **`e2e5c7f`**
> (≥ attendu ✅). **Porte :** `SPECIES_CLOSED_ROOT_OPEN`. **Aucun secret. Aucun redeploy. Aucune variable.**
> Canonique identifiée **par ses données** (`br-dawn-hill-am5amy22` = **324 151** facilités = compte post-S4).

> **⏱ FORECAST — écrit AVANT tout dry-run et tout run canonique.** Méthode identique S1/S2/S3/S4 :
> extrait Geofabrik → `transform-osm-extract.py` (pré-filtre « nom vide » intégré) → classifieur
> `place-intake.ts`. **PAS de live Overpass.** Commit séparé (preuve d'ordre).

---

## 1. Extraits Geofabrik (Afrique australe)

| Pays (slug) | Taille | Last-Modified GMT |
|---|---|---|
| malawi | 155 067 899 o (147,9 Mio) | 2026-09-27 22:47 |
| mozambique | 255 398 604 o (243,6 Mio) | 2026-09-27 22:47 |
| zambia | 251 928 505 o (240,3 Mio) | 2026-09-27 22:45 |
| zimbabwe | 179 476 224 o (171,2 Mio) | 2026-09-27 22:45 |
| angola | 85 251 210 o (81,3 Mio) | 2026-09-27 22:44 |
| namibia | 54 629 581 o (52,1 Mio) | 2026-09-27 22:44 |
| botswana | 88 011 120 o (83,9 Mio) | 2026-09-28 03:05 |
| south-africa-and-lesotho | 546 223 609 o (520,9 Mio) | 2026-09-28 03:06 |
| swaziland | 30 824 957 o (29,4 Mio) | 2026-09-27 22:45 |

**Périmètre — pays INCLUS au-delà des 4 nommés par le handoff :**
malawi, mozambique, zambia, zimbabwe **+ angola, namibia, botswana, south-africa-and-lesotho,
swaziland** (`swaziland` = l'extrait Geofabrik pour l'Eswatini). Ces 5 ajoutés sont **co-géographiques
avec les 4 nommés** (même bloc australe, frontières partagées : Zambie–Angola–Namibie–Botswana–
Zimbabwe–Mozambique–Afrique du Sud–Eswatini), exactement comme S2/S3/S4 ont pris le bloc entier.
**Aucun d'eux n'a été importé par S1/S2/S3/S4** (vérifié : payloads locaux = Ouest + Centrale + Est + Nord).

**Pays EXCLUS de S5 et pourquoi :**

| Pays | Motif |
|---|---|
| **Maroc**, **Algérie**, **Sahara occidental**, **Tunisie/Égypte/Libye/Soudan** | **hors australe** (Nord, S4 — ou arbitrage séparé pour Maroc/Algérie). ⚠️ **Maroc/Algérie explicitement NON inclus ici** (arbitrage en attente). |
| **Réunion**, **Mayotte** | aucun extrait Geofabrik propre (déjà écartés S3). |
| **Saint-Hélène / Ascension / Tristan** | extrait disponible mais **îles isolées de l'Atlantique sud**, hors bloc continental australe → non inclus par défaut. Décision fondateur si on veut les ajouter. |
| **Afrique du Sud country-only** | Geofabrik n'expose que **`south-africa-and-lesotho`** (les deux ensembles) ; `swaziland` séparé = Eswatini. |

Tags identiques aux vagues précédentes (shop / amenity-subset / craft / office / tourism-hôtellerie) ;
`sourceRef = node/<id>` stable ; attribution OSM conservée. Pré-filtre « nom vide » **intégré** :
`<pays>.json` = importables només, `<pays>.json.all.json` = tous les points matchés.

## 2. Volumétrie transformée par pays

| Pays | Matchés | Importables (només) | Pré-filtrés (nom vide) | Avec adresse |
|---|---|---|---|---|
| malawi | 3 088 | 2 226 | 862 | 386 |
| mozambique | 5 363 | 3 345 | 2 018 | 618 |
| zambia | 5 467 | 4 220 | 1 247 | 870 |
| zimbabwe | 3 550 | 3 101 | 449 | 508 |
| angola | 8 713 | 7 023 | 1 690 | 4 352 |
| namibia | 4 486 | 3 987 | 499 | 826 |
| botswana | 2 256 | 1 972 | 284 | 239 |
| south-africa-and-lesotho | 39 751 | 36 048 | 3 703 | 13 893 |
| swaziland | 499 | 379 | 120 | 22 |
| **TOTAL** | **73 173** | **62 301** | **10 872** | 21 714 |

## 3. Distribution des tiers estimée (classifieur, ZÉRO écriture)

| Pays | matched | pilot | world | quarantine | raisons | worldScope admis |
|---|---|---|---|---|---|---|
| malawi | 3 088 | **0** | 2 245 | 843 | 2 226 outside-pilot + 843 nameless + 19 nameless-with-addr | 2 245 |
| mozambique | 5 363 | **0** | 3 372 | 1 991 | 3 345 outside-pilot + 1 991 nameless | 3 372 |
| zambia | 5 467 | **0** | 4 343 | 1 124 | 4 220 + 1 124 nameless | 4 343 |
| zimbabwe | 3 550 | **0** | 3 121 | 429 | 3 101 + 429 nameless | 3 121 |
| angola | 8 713 | **0** | 7 793 | 920 | 7 023 + 920 nameless | 7 793 |
| namibia | 4 486 | **0** | 3 994 | 492 | 3 987 + 492 nameless | 3 994 |
| botswana | 2 256 | **0** | 1 980 | 276 | 1 972 + 276 nameless | 1 980 |
| south-africa-and-lesotho | 39 751 | **0** | 36 253 | 3 498 | 36 048 + 3 498 nameless | 36 253 |
| swaziland | 499 | **0** | 379 | 120 | 379 + 120 nameless | 379 |
| **TOTAL** | **73 173** | **0** | **63 480** | **9 693** | — | **63 480** |

**Lecture :** `pilot = 0` partout (la boîte pilote Lomé ne déborde pas — même constat S2/S3/S4). Le
pré-filtre « nom vide » écarte **10 872** points avant batch. **Aucune catégorie `placeholder-no-address`**
⇒ 0 quarantaine dans les runs attendue (payload nommé).

## 4. Chevauchements estimés (pays-pays ET canonique)

**Intra-S5 (nœuds OSM partagés entre extraits voisins) :**

| Paire | Nœuds |
|---|---|
| namibia\|botswana | 80 |
| zambia\|zimbabwe | 58 |
| zimbabwe\|botswana | 53 |
| botswana\|south-africa-and-lesotho | 49 |
| angola\|namibia | 36 |
| namibia\|south-africa-and-lesotho | 30 |
| malawi\|mozambique | 23 |
| zambia\|namibia | 11 |
| mozambique\|zimbabwe | 8 |
| zimbabwe\|south-africa-and-lesotho | 6 |
| mozambique\|south-africa-and-lesotho | 2 |
| mozambique\|swaziland | 1 |
| zambia\|botswana | 1 |
| south-africa-and-lesotho\|swaziland | 2 |
| **Total intra-S5** | **360** (14 paires) |

→ **358 références distinctes** apparaissent dans ≥ 2 extraits (un nœud partagé par 3 extraits compte
2 paires). Chaque frontière partagée ajoute du dédup, comme prévu (leçon S1/S2/S3/S4).

**Chevauchement avec le canonique : 177 nœuds — TOUS EXPLIQUÉS (nœuds de frontière des vagues
antérieures, PAS une surprise) :**

| Pays | overlapCanonique | Origine vérifiée |
|---|---|---|
| malawi | 91 | **S3:tanzania** (nœuds partagés Tanzanie/Malawi, `source_id c698af14…`, créés 2026-09-28T13:06Z) |
| zambia | 64 | S3:tanzania 40 + **vague antérieure (S2, Zone Est)** 24 — mêmes `source_id c698af14…`, 13:06Z |
| mozambique | 15 | **S3:tanzania** |
| angola | 8 | **vague antérieure (S2/Centrale, frontière RDC/Angola)** — postes douaniers « Ponto de Controlo Aduaneiro… », 13:06Z |
| **TOTAL** | **177** | tous créés **2026-09-28T13:05–13:06Z** (S2/S3), **aucun** créé cette session (≈15:57Z) |

⚠️ **Point de méthode** : mon premier script d'origine ne reconnaissait ces nœuds que dans les
payloads **encore présents localement** (S1/S2/S3 `.json` sont nettoyés) → 32 nœuds affichés
« UNKNOWN ». **La lecture directe en base** (clé `source_id = c698af14…`, `created_at` 13:05–13:06Z,
`intake_tier='world'`) tranche : **ce sont des nœuds S2/S3**, pas des créations parasites de S5.

## 5. Volumétrie attendue des runs (canonique)

| Mesure | Valeur |
|---|---|
| Somme importables només (9 pays) | **62 301** |
| importables **distincts** | **61 943** |
| − chevauchements canoniques (S2/S3 frontière) | − **177** |
| = **créés attendus** | **61 766** |
| + existants attendus (358 intra-S5 + 177 canoniques) | **535** |
| quarantaine attendue dans les runs | **0** |
| canonique attendue après | **324 151 + 61 766 = 385 917** |

> Méthode S1/S2/S3/S4 : chaque frontière ajoute du dédup à prévoir (intra-sous-vague **et** canonique).
> Les 535 « existing » sont **prévus**, pas une surprise.
