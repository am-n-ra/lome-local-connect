# Rapport MCP — POP-1c-A sous-vague 4 : **Afrique du Nord** — FORECAST FIGÉ (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :**
> `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-s4-nord.md` (§3 = N1). **GO fondateur :**
> DEC-V2-21 (S3 gardée DEC-V2-20). **Branche :** `omni-v2-rebuild`, HEAD au départ **`4dc9801`**
> (≥ attendu ✅). **Porte :** `SPECIES_CLOSED_ROOT_OPEN`. **Aucun secret. Aucun redeploy. Aucune variable.**
> Canonique identifiée **par ses données** (`br-dawn-hill-am5amy22` = **278 997** facilités = compte post-S3).

> **⏱ FORECAST — écrit AVANT tout dry-run et tout run canonique.** Méthode identique S1/S2/S3 :
> extrait Geofabrik → `transform-osm-extract.py` (pré-filtre « nom vide » intégré) → classifieur
> `place-intake.ts`. **PAS de live Overpass.** Commit séparé (preuve d'ordre).

---

## 1. Extraits Geofabrik (Afrique du Nord)

| Pays (slug) | Taille | Téléchargé |
|---|---|---|
| sudan | 204 318 573 o (194,9 Mio) | 2026-09-28 |
| egypt | 178 543 484 o (170,3 Mio) | 2026-09-28 |
| libya | 76 602 578 o (73,1 Mio) | 2026-09-28 |
| tunisia | 84 162 952 o (80,3 Mio) | 2026-09-28 |

**Pays EXCLUS de S4 et pourquoi :**

| Pays | Motif |
|---|---|
| **Maroc**, **Algérie**, **Sahara occidental**, **Mauritanie** | **Non listés par le handoff S4** (périmètre nommé = Soudan, Égypte, Libye, Tunisie). La **Mauritanie** a déjà été importée en **S1** (1 352 importables). Maroc/Algérie ne sont nommés dans **aucune** sous-vague — **décision fondateur requise** (les ajouter à une sous-vague, ou les déclarer hors périmètre). ⚠️ **signalés, pas décidés unilatéralement.** |
| **Soudan du Sud** | déjà fait en **S3** (le handoff S4 nomme le **Soudan**, pas le Soudan du Sud). |
| **Réunion / Mayotte** | aucun extrait Geofabrik propre (déjà écartés en S3). |
| **Malawi/Mozambique/Zambie/Zimbabwe** | Australe (S5). |

Tags identiques aux vagues précédentes (shop / amenity-subset / craft / office / tourism-hôtellerie) ;
`sourceRef = node/<id>` stable ; attribution OSM conservée. Pré-filtre « nom vide » **intégré** :
`<pays>.json` = importables només, `<pays>.json.all.json` = tous les points matchés.

## 2. Volumétrie transformée par pays

| Pays | Matchés | Importables (només) | Pré-filtrés (nom vide) | Avec adresse |
|---|---|---|---|---|
| sudan | 6 919 | 6 383 | 536 | 920 |
| egypt | 16 328 | 11 073 | 5 255 | 1 874 |
| libya | 18 364 | 15 452 | 2 912 | 4 485 |
| tunisia | 17 282 | 12 264 | 5 018 | 3 210 |
| **TOTAL** | **58 893** | **45 172** | **13 721** | 10 489 |

## 3. Distribution des tiers estimée (classifieur, ZÉRO écriture)

| Pays | matched | pilot | world | quarantine | raisons | worldScope admis |
|---|---|---|---|---|---|---|
| sudan | 6 919 | **0** | 6 427 | 492 | 6 383 outside-pilot + 492 nameless + 44 nameless-with-addr | 6 427 |
| egypt | 16 328 | **0** | 11 409 | 4 919 | 11 073 outside-pilot + 4 919 nameless + 336 nameless-with-addr | 11 409 |
| libya | 18 364 | **0** | 15 705 | 2 659 | 15 452 outside-pilot + 2 659 nameless + 253 nameless-with-addr | 15 705 |
| tunisia | 17 282 | **0** | 13 331 | 3 951 | 12 264 outside-pilot + 3 951 nameless + 1 067 nameless-with-addr | 13 331 |
| **TOTAL** | **58 893** | **0** | **56 872** | **12 021** | — | **56 872** |

**Lecture :** `pilot = 0` partout (la boîte pilote Lomé ne déborde pas — même constat S2/S3). Le pré-filtre
« nom vide » écarte **13 721** points avant batch. **Aucune catégorie `placeholder-no-address`** ici
(contrairement à la Tanzanie en S3) ⇒ on attend **0 quarantaine dans les runs** (payload nommé).

## 4. Chevauchements estimés (pays-pays ET canonique)

**Intra-S4 (nœuds OSM partagés entre extraits voisins) :**

| Paire | Nœuds |
|---|---|
| egypt\|libya | 2 |
| libya\|tunisia | 1 |
| **Total intra-S4** | **3** (2 paires) |

**Chevauchement avec le canonique : 15 nœuds, tous SUDA NAIS et ENTIÈREMENT EXPLIQUÉS.** Ce sont des
**nœuds frontaliers déjà créés par S3** (`source_id = c698af14…`, `created_at = 2026-09-28T15:03–15:04Z`)
— présents à la fois dans les extraits **Éthiopie/Soudan du Sud** (S3) et dans l'extrait **Soudan** (S4) :
postes-frontière de **Metema** (« መተማ ድንበር ፖስት », « የመተማ ጉምሩክ ቢሮ »), poste d'**Immigration**,
**UNISFA** (Abyei), **UNDP**, marché de **Moudeïna**. **Zéro pré-existant Togo/Ouest/S1/S2/Est non frontalier.**
Confirmé par croisement des refs : 2 des 15 dans l'extrait Éthiopie S3, 2 dans Soudan-du-Sud S3 (échantillon).

## 5. Volumétrie attendue des runs (canonique)

| Mesure | Valeur |
|---|---|
| Somme importables només (4 pays) | **45 172** |
| − chevauchements intra-S4 | − **3** |
| = importables **distincts** | **45 169** |
| − chevauchements canoniques (S3 frontière) | − **15** |
| = **créés attendus** | **45 154** |
| + existants attendus (canon 15 + intra 3) | **18** |
| quarantaine attendue dans les runs | **0** |
| canonique attendue après | **278 997 + 45 154 = 324 151** |

> Méthode S1/S2/S3 : chaque frontière ajoute du dédup à prévoir (intra-sous-vague **et** canonique).
> Les 18 « existing » sont **prévus**, pas une surprise.
