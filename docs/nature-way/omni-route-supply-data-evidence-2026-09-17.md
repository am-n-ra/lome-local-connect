# Preuve données — état de la supply Omni au regard du routage

> **Date :** 2026-09-17
> **Owner :** Nature Way (`/nature-way`)
> **Objet :** vérifier en base les hypothèses du contrat d'itinéraire `omni-route-directions-contract-2026-09-17.md` §6
> **Branche interrogée :** canonique `br-dawn-hill-am5amy22` (projet Neon `wild-moon-30984513`)
> **Statut :** `measured` — lecture seule, aucune écriture

## Requête

```sql
select
  count(*) as total,
  count(*) filter (where nullif(btrim(coalesce(address,'')),'') is not null) as with_address,
  round(100.0 * count(*) filter (where nullif(btrim(coalesce(address,'')),'') is not null) / count(*), 1) as pct_address,
  count(*) filter (where latitude is not null and longitude is not null) as with_coords,
  min(latitude) as lat_min, max(latitude) as lat_max,
  min(longitude) as lng_min, max(longitude) as lng_max
from v2_facilities;
```

## Résultat

| Mesure | Valeur |
|---|---|
| Facilités | **206** |
| Avec coordonnées | **206** (100 %) |
| **Avec adresse** | **6** → **2,9 %** |
| Latitude | 5,9172341 → 6,4282133 |
| Longitude | **−1,0013403** → 2,3912 |

**Croisement** : le total de 206 correspond exactement au nombre de « 206 pins ouvrables » constaté par PRE-1 sur la prod (`docs/nature-way/pre1-proof/pre1-results.json`). Les deux sources concordent.

## Constat n°1 — couverture d'adresse à 2,9 %

**6 facilités sur 206** ont une adresse renseignée. La colonne existe (`v2_facilities.address`, `text` nullable), donc ce n'est pas un problème de schéma : **c'est de la donnée non collectée**.

Conséquence pour le routage : un moteur de routage a besoin de **coordonnées correctes**. Or une facilité sans adresse, dont le point a été posé par approximation, produit un itinéraire qui mène au mauvais endroit. Le fournisseur le plus performant ne corrige pas cela.

## Constat n°2 — 17 facilités sont au Ghana, hors zone Lomé

`select name, category, latitude, longitude, source_kind, address from v2_facilities where longitude < 0 order by longitude;`

**17 facilités sur 206** ont une **longitude négative** — elles sont donc **à l'ouest de Greenwich, au Ghana**, et non à Lomé :

| Nom | Latitude | Longitude |
|---|---|---|
| Total | 6,3418223 | **−1,0013403** |
| Unnamed public place | 6,3473453 | −0,9980101 |
| Goil | 6,0923585 | −0,8399508 |
| Union Oil | 6,092936 | −0,8397924 |
| Unnamed public place | 6,104677 | −0,8364343 |
| Unnamed public place | 6,0337847 | −0,7879328 |
| Unnamed public place | 6,3820685 | −0,5497699 |
| Frontier | 6,3815802 | −0,5497388 |
| Goil | 6,3779822 | −0,5467391 |
| So | 6,374227 | −0,5403159 |
| Unnamed public place | 6,0400357 | −0,4499765 |
| Unnamed public place | 5,9385054 | −0,1158995 |
| Goil | 6,0786749 | −0,0194481 |
| SAMA | 6,1071298 | −0,0122554 |
| Total | 6,1074564 | −0,0120248 |
| Agapet | 6,1108038 | −0,0080408 |
| Galaxy Oil | 6,1165795 | −0,0041448 |

**Caractéristiques communes aux 17 :**
- `source_kind = 'public_import'` — **toutes** ;
- `address = null` — **toutes** ;
- **8 sur 17** portent le placeholder « Unnamed public place » ;
- dominante de catégorie : carburant (`fuel`), cohérent avec des stations-service le long d'un axe routier.

**Lecture :** ces points sont des importations publiques (OSM) le long du corridor Ghana–Togo, pas de la supply Lomé. Ils sont **physiquement plausibles** (ce sont de vraies stations) mais **hors du périmètre du pilote**.

## Pourquoi ce constat compte pour la demande fondateur

Le fondateur demande des itinéraires « aussi parfaits que Google Maps ». **Avant d'acheter un fournisseur, il faut nettoyer les données** — sinon :

1. un utilisateur choisit une facilité au Ghana sans le savoir (l'UI ne signale pas la frontière) ;
2. l'itinéraire calculé est **correct géométriquement mais absurde produit** ;
3. le défaut sera imputé au **fournisseur de routage** alors que la cause est une **importation non filtrée**.

**Ces deux constats ne dépendent d'aucun choix de fournisseur, d'aucune clé, d'aucun budget.** Ils peuvent être traités immédiatement.

## Ce que cette preuve ne dit pas

- Elle ne dit rien de la **qualité géométrique** des 206 points (précision au mètre) — seul un échantillonnage contre OSM le dirait.
- Elle ne juge pas si les 17 points doivent être **supprimés, filtrés ou marqués hors-zone** — c'est une décision produit.
- Elle n'a pas vérifié les branches non canoniques (`br-bitter-math-amrlbym6` en portait 4, toutes avec adresse — échantillon trop petit pour conclure).

## Suite proposée (aucune n'est engagée)

| # | Action | Dépendance |
|---|---|---|
| 1 | Décider du sort des 17 points hors-zone (supprimer / marquer / filtrer à l'affichage) | décision fondateur |
| 2 | Poser une garde de périmètre à l'import public (bbox Lomé) | aucune |
| 3 | Collecter les adresses manquantes sur les 200 facilités | opérations terrain |
| 4 | Échantillonner la précision des coordonnées contre OSM | aucune |