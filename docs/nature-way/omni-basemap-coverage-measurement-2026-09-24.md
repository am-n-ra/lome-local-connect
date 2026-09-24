# Omni — La couverture des lieux existe-t-elle déjà dans le fond de carte ? (2026-09-24)

> **Question fondateur :** « la carte qu'on utilise n'a pas déjà les lieux dessus par défaut ? »
>
> **Réponse courte : OUI — la donnée est là, en abondance. Mais Omni choisit de ne pas la dessiner.**
> Ce document **corrige** le cadrage du scout `omni-scout-incoherences-2026-09-23.md` §1.
> **Aucun code modifié** — constat mesuré.

---

## 1. Ce que le fond de carte contient RÉELLEMENT (mesuré, pas supposé)

Tuiles CARTO `carto.streets/v1` (vectorielles), décodées et comptées sur **9 tuiles autour de Lomé
au zoom 14** (≈ le niveau de la ville) :

| Mesure | Valeur |
|---|---|
| POI au total | **7 925** |
| POI **nommés** | **5 760** |
| `shop` | 2 049 |
| `office` | 869 |
| `restaurant` | 388 |
| `school` | 376 |
| `hairdresser` | 361 |
| `clothing_store` | 316 |
| `bar` | 273 |
| `place_of_worship` | 270 |
| `bus` | 261 |
| `lodging` | 203 |

Exemples nommés réels remontés : *Eglise des Saints Martyrs de l'Uganda*, *Ambassade du Niger*,
*Institut N.D.E.*, *EPP Lomé Ouest*, *Boutchou crèche garderie*, *Empreinte BTS et immobilier*,
*Optique à Dieu la Gloire*, *Technosys Afrique*.

**Le fond de carte connaît déjà les commerces, bureaux, écoles, églises, hôtels, arrêts de bus de Lomé,
avec leurs noms.** Ce n'est pas une couverture à importer — elle est **déjà là**, servie avec la carte.

## 2. Pourquoi on ne les voit pas — la cause n'est PAS l'absence de données

Le style CARTO Positron **déclare** la donnée (`poi`, `place`, `building`, `housenumber` sont bien dans
les tuiles) mais **ne rend que deux familles de POI** :

| Couche du style | Filtre | `minzoom` |
|---|---|---|
| `poi_stadium` | `class ∈ {stadium, cemetery, attraction}` **et** `rank ≤ 3` | **15** |
| `poi_park` | `class = park` | **15** |

**Conséquence mesurée :** au zoom 11–13 (où l'on regarde une ville), **0 à 2 POI** sont dessinés —
alors que 7 925 sont présents dans les tuiles. Ils n'apparaissent qu'au zoom **14–15**, et seulement
les stades, cimetières, attractions et parcs.

Ce n'est **pas** un manque de données. C'est un **choix de style** (un fond de carte volontairement
épuré, sans publicité de commerces). **Ce choix n'est pas le nôtre — il est dans le style CARTO.**

## 3. Ce que ça change dans le diagnostic

| Affirmation du scout §1 | Statut après mesure |
|---|---|
| « Aucun back-fill OSM au niveau mondial : la carte n'affiche que ce que la base contient » | ✅ **vrai** — la carte n'affiche que les pins Omni |
| « Le clic *pin vide → rien* : là où OSM a des lieux, Omni n'en montre aucun » | ✅ **vrai, et c'est le vrai sujet** |
| « il faudrait **importer/brancher** une couverture de base » | ❌ **imprécis** — la donnée carte est déjà servie ; le vrai acte est de **la RENDRE** |

**Reformulation juste :** Omni n'a pas un problème de **source de données**, il a un problème de
**rendu**. Les lieux existent sous nos yeux dans les tuiles ; le style les cache. Trois voies s'ouvrent,
et elles n'ont pas le même coût :

| Voie | Acte | Coût | Données |
|---|---|---|---|
| **A. Dessiner le fond** | ajouter nos propres couches MapLibre sur `source-layer: poi` (filtres larges, zoom 13+) | **faible** (code de style, zéro import, zéro base) | déjà là |
| **B. Importer en base** | Overpass/OSM → `unclaimed` en base (scout §1) | **élevé** (stockage, fraîcheur, dedup, maintenance) | duplique ce que la carte a déjà |
| **C. Ne rien faire** | assumer une supply déclarative seule | nul | — |

**La voie A est l'inverse du scout** : au lieu d'importer 7 925 lieux en base pour les réafficher,
on dessine ce qui est **déjà** servi. Mais elle a une limite honnête — un POI de fond de carte **n'est pas
une offre Omni** : il n'a ni stock, ni disponibilité, ni entité, ni QR. Il relève de l'**échelle
d'existence niveau 0** (`unclaimed`, S-05) et ne peut donc pas être confondu avec une offre.

## 4. Ce qui reste vrai du scout

- L'orphelinage de `osm-coverage.server.ts` / `public-discovery.ts` reste un **fait** — mais son
  **poids décisionnel baisse** : ce n'est plus « la seule source de lieux », c'est un **mécanisme
  optionnel** (attribution `GLOBAL`, dedup, persistance).
- La question `D-COV-1` reste **ouverte** mais se **reformule** :
  - `D-COV-1a` — **dessiner le fond de carte** (voie A, faible coût, immédiat) ;
  - `D-COV-1b` — **persister** des lieux en base (voie B, coûteux) ;
  - `D-COV-1c` — ni l'un ni l'autre.

## 5. Question ouverte au fondateur

Le fond de carte connaît déjà des milliers de lieux nommés à Lomé et ne les montre pas.
**Voulez-vous qu'Omni les montre** (niveau 0 « Lieu connu — pas encore géré », S-05),
sachant qu'ils ne sont **pas** des offres et n'auront ni stock ni transaction tant que personne
ne les revendique ?

C'est une décision de **Species** (ce que la carte enseigne à l'utilisateur), pas de Root.
