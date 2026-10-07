# Heartwood — Diagnostic : « les 19 000+ pins ne s'affichent toujours pas » (2026-10-07)

> **Signal fondateur :** *« les pins les 19000+ ne s'affichent toujours pas ».*
> **Statut :** défaut **mesuré**, cause racine identifiée, correctif cadré. **Aucun code modifié.**
> **Porte :** Heartwood OPEN · **Local Plan :** `NW-PROD-OMNI-HEARTWOOD-01`.

## 1. Le fait, mesuré (pas supposé)

| Mesure (canonique `br-dawn-hill-am5amy22`, 2026-10-07) | Résultat |
|---|---|
| `v2_facilities` total | **13 744** — **toutes géolocalisées** (0 sans lat/lng) |
| Confiance | 13 738 `unclaimed` · 6 revendiquées/confirmées |
| Réponse API prod (monde) | **250** |
| Réponse API prod (Lomé `west=1.1 south=6.1 east=1.3 north=6.25`) | **250** |
| **Lieux réels dans cette fenêtre Lomé** | **5 992** |
| Fenêtre réellement couverte par les 250 renvoyés | **0,019° × 0,018°** ≈ 2×2 km autour du centre |

**Traduction :** dans une vue de ville, la carte ne montre que **250 pins serrés au centre** (2×2 km)
alors que **5 992** lieux existent dans la fenêtre — soit **4 %**. Le reste de la ville paraît vide.
Au zoom monde, ce sont les **250 plus proches de Lomé** qui sont dessinés, quel que soit le lieu visé.

## 2. Cause racine : `limit 250` + `order by distance au centre`

`trunk-repository.ts` → `listPublicFacilities` (dernière ligne) :

```sql
order by (count(camp.id) > 0)::int desc, <distance au centre>, <unclaimed>, f.name
limit 250
```

Deux effets se combinent :

1. **le plafond dur `limit 250`** tronque toute fenêtre à 250 lignes, quelle qu'elle soit ;
2. **le tri par distance au centre de la fenêtre** fait que ces 250 sont **les plus proches du
   centre** → un « pâté » au milieu, des trous autour.

Ce n'est **ni un bug de rendu, ni un bug de clustering, ni un manque de données** — c'est le
**plafond de la requête**. Le clustering MapLibre est correct et n'a jamais vu que 250 points.

## 3. Le plafond n'est pas une nécessité de performance — mesuré

| Fenêtre (sans cap) | Lignes | Temps |
|---|---|---|
| Monde | **13 744** | **624 ms** |
| Lomé | **5 992** | **392 ms** |
| Togo | **12 021** | **343 ms** |

Au cap actuel : ~100–270 ms pour 250 lignes. **La base encaisse la charge entière en < 1 s.** Le vrai
frein n'est **pas** la base, c'est **la taille de la charge utile** : un enregistrement complet pèse
**~473 octets** → **~6,5 Mo** JSON monde (≈ **1 Mo gzip**) et **~2,8 Mo** Lomé.

## 4. Ce qui a été envisagé et écarté

- **Voie A (décision fondateur 2026-09-24, `omni-coverage-model-decision-A`)** : *la carte dessine les
  lieux (fond de carte), la base garde entités + offres.* **Mesure** : le style Positron ne rend **que
  les parcs/stades** (`minzoom 15`) — il **cache les commerces** (mesuré `omni-basemap-coverage-measurement`).
  Donc dessiner le fond de carte **ne** produit pas les « 19 000 pins ». Et il ne s'agit **pas** de
  POI de fond ici : les **13 744** sont **notre base** (`source_kind = public_import`, 13 741 lignes).
  → la voie A reste une **décision de Species** (l'acte « dessiner le fond » = `SP-7`, non construit).
- **`SP-7` / « lieu dessiné »** : jamais implémenté côté app (0 couche `source-layer: poi`).
- **La carte n'est donc pas cassée — elle est tronquée.** Le correctif est le **plafond**, pas le rendu.

## 5. Options de correctif (décision fondateur — `D-MAP-1`)

| Option | Acte | Effet | Coût |
|---|---|---|---|
| **1. Lever le cap par fenêtre (recommandé)** | plafond haut (ex. 2 000–5 000) au lieu de 250, tri par distance conservé | à zoom ville : **tous** les lieux de la fenêtre ; à zoom monde : les N plus proches du centre | léger (payload borné par la fenêtre) |
| **2. Plein corpus (voie A côté base)** | aucun cap | **13 744** dessinés, cluster partout | ~6,5 Mo monde / ~2,8 Mo ville |
| **3. Garder 250** | rien | reste un pâté au centre | — |
| **4. Rendu serveur par grille** | agrégat de comptage par cellule, dessiné sans points individuels | carte dense sans payload | **fondation neuve** (interdit en Heartwood) |

**Recommandation : option 1.** Elle respecte la **voie A du fondateur** (« la carte sera peuplée »)
sans fondation neuve, et borne le coût **par fenêtre** — petit payload au zoom ville (où 5 992 →
on peut plafonner plus haut, ex. 5 000), petit payload au zoom monde.

**Points à trancher (Souveraineté Seed/Species) :** le bon **plafond** (expérience ↔ charge) et si,
au zoom **monde**, on accepte de ne montrer que les N plus proches du centre (option 1) ou tout
(option 2).

## 6. Résidu honnête

- Le chiffre « 19 000 » du fondateur est proche des **13 744** réels (base) — il n'y a **pas** 19 000
  en base. Si « 19 000 » désigne les POI du fond de carte (~7 925 à Lomé mesurés), c'est **`SP-7`**,
  une **décision de Species**, distincte de ce défaut-ci.
- Le correctif ne **crée pas** de lieux : il **affiche ceux qui existent**.
