# Contrat d'itinéraire Omni — diagnostic et options

> **Date :** 2026-09-17
> **Owner :** Nature Way (`/nature-way`)
> **Déclencheur :** demande fondateur « notre façon de faire les itinéraires doit être aussi parfaite que ce que Google Maps propose et tout »
> **Statut :** **Root System — décision fondateur requise avant toute implémentation**
> **Plan local :** `NW-PROD-OMNI-ROUTE-01`
> **Handoff Founder HQ :** `HO-OMNI-18`
> **Preuve données (vérifiée en base) :** `omni-route-supply-data-evidence-2026-09-17.md`

## Resource Receipt

| Statut | Chemin exact ou explication |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way/references/prerequisite-architecture.md` |
| Template instantié | `.agents/skills/nature-way/templates/intra-skill-plan.md` → `intra-skill-plan-NW-PROD-OMNI-ROUTE-01.md` |
| Not loaded / reason | `launch-envelope.md` — aucune exposition utilisateur tant que la décision fournisseur n'est pas prise |
| Not loaded / reason | `risk-and-escalation-matrix.md` — à charger à l'activation du fournisseur (dépendance externe + coût) |

## 1. Ce qui existe réellement aujourd'hui (vérifié, pas supposé)

L'itinéraire actuel n'est pas un itinéraire. C'est **une ligne droite entre deux points**.

| Constat | Preuve |
|---|---|
| Géométrie = 2 coordonnées, aucune route | `TrunkMap.tsx:120` — `routeFeatureCollection` construit une `LineString` `[origin, target]` |
| Distance = vol d'oiseau (haversine) | `TrunkMap.tsx:132` — `routeDistanceLabel`, rayon terrestre 6371 km |
| Aucun moteur de routage | aucune dépendance `osrm`, `valhalla`, `graphhopper`, `mapbox-directions` dans `package.json` |
| L'UI est **honnête** sur sa limite | libellé `(tracé direct)` dans `TrunkMap.tsx:1303` |
| Le rendu est soigné | couche casing 6px + ligne 3.5px pointillée, couleur `#234D40` (`ROUTE_COLOR`) |
| Pas de trace en fallback | `fallback-map-surface.ts:227` — `addSource`/`addLayer` sont des no-op |

**Point important, à crédit du travail existant :** l'interface annonce `(tracé direct)` et le chip passe en `data-state="unavailable"` avec « Position indisponible… » quand la géolocalisation manque. Elle ne ment pas. Le travail à faire est un **remplacement de la source de vérité géométrique**, pas une correction de mensonge.

## 2. Écart mesuré entre la ligne droite et la route réelle

Requête réelle sur le réseau routier de Lomé (OSRM, démo publique) :

| Trajet | Ligne droite (actuel) | Route réelle | Écart |
|---|---|---|---|
| Marché d'Adawlato → nord de Lomé | 4,91 km | **6,19 km** | **+26 %** |

La distance actuelle n'est donc pas seulement moins précise : elle **sous-estime systématiquement** la distance à parcourir, ce qui fausse aussi toute estimation de temps ou de coût de déplacement.

La route réelle remonte des **rues nommées et existantes** de Lomé — vérifié, 12 étapes :

```
départ      → Rue de L'Avenir
tourner     → Rue Khra
tourner     → Rue Kamé
continu     → Rue Slt Gnémégnah
gauche      → Avenue Maman N'Danida
rond-point  → Boulevard de la Paix
```

Le réseau OpenStreetMap couvre donc bien Lomé, et le turn-by-turn est exploitable en français.

## 3. Contrainte de production à trancher (le vrai nœud)

Le serveur de démonstration OSRM **n'est pas utilisable en production** — sa politique d'usage l'interdit explicitement, et une application où chaque utilisateur appelle le service est classée « usage très lourd ».

Options réelles :

| Option | Ce que ça donne | Coût / plafond | Verdict |
|---|---|---|---|
| **A. Garder la ligne droite** | comportement actuel, honnête | 0 | acceptable, mais ne répond pas à la demande |
| **B. Fournisseur hébergé avec clé** (OpenRouteService / GraphHopper / Mapbox) | vraie route + turn-by-turn, couverture mondiale maintenue | palier gratuit puis facturation à la requête ; nécessite une clé et un proxy serveur | **voie recommandée pour V1** |
| **C. OSRM auto-hébergé pour le Togo** | pas de coût par requête, souveraineté des données | nécessite un extract OSM Togo + préprocessing + un hôte ; charge opérationnelle réelle | pertinent plus tard, à l'échelle |

Dans tous les cas il faut **un proxy côté serveur**, pas un appel direct depuis le navigateur : la clé ne doit jamais partir dans le bundle client, et il faut un cache pour ne pas payer deux fois le même trajet (voir §5).

## 4. Contradiction de spec à résoudre (bloquante)

Deux sources de vérité se contredisent sur **qui a le droit à l'itinéraire** :

| Source | Règle |
|---|---|
| Maquette Species, écrans S11/S22/S23/S25/S33 | itinéraire **verrouillé jusqu'à l'intention d'achat** confirmée serveur (« Route is available only after server-confirmed intent ») |
| Correction fondateur 2026-09-14 (`HO-OMNI-16`) | itinéraire **disponible de base sur chaque fiche facilité**, sans intention d'achat, + dans le flux transactionnel |
| Code livré (`TrunkAppV13.tsx:1601`) | suit la correction fondateur : « Itinéraire vers ce vendeur » sur la fiche, hors intention |

Le code suit la décision fondateur la plus récente — c'est cohérent. Mais **la maquette n'a jamais été réconciliée**, donc S11/S22/S23/S25/S33 restent fausses dans le document de référence. Tant que ce n'est pas tranché, un futur contributeur peut « corriger » le code vers un comportement verrouillé en croyant bien faire.

**Décision requise :** confirmer que la règle fondateur (itinéraire ouvert sur la fiche) **remplace** la règle de la maquette, puis amender les écrans concernés. Le contact vendeur, lui, reste bien après intention — c'est un invariant distinct, à ne pas confondre.

## 5. Ce que « aussi parfait que Google Maps » implique réellement

Il faut distinguer ce qui est atteignable de ce qui ne l'est pas, sinon on promet et on échoue.

**Atteignable et mesurable :**
- vraie géométrie routière au lieu d'une ligne droite ;
- distance et durée **routières**, pas haversine ;
- turn-by-turn en français avec noms de rues ;
- tracé épuré : casing + ligne, lisible aux 4 largeurs déjà prouvées par PRE-1 ;
- recalcul si l'utilisateur bouge, cache côté serveur, dégradation honnête si le fournisseur tombe ;
- état `unavailable` conservé — jamais de fausse trace.

**Non atteignable avec un fournisseur open data, à assumer explicitement :**
- trafic temps réel et reroutage dynamique (Google l'achète) ;
- qualité de géocodage d'adresse équivalente (**2,9 % de facilités avec adresse** — 6 sur 206, vérifié en base ; c'est un problème de données Omni, pas de fournisseur) ;
- Street View, horaires de transport, adresses de particuliers.

**Recommandation de cadrage :** cible = « itinéraire routier fiable et honnête à Lomé », pas « Google Maps ». Viser l'égalité littérale mènerait à un cycle sans fin et à une promesse intenable.

## 6. Points ouverts qui ne dépendent pas du fournisseur

1. **Couverture d'adresse à 2,9 %** (6/206 facilités, vérifié en base). Même avec le meilleur moteur de routage, une facilité mal géocodée produit un mauvais itinéraire. À traiter côté données.
2. **17 facilités hors zone, vérifié en base** (branche canonique `br-dawn-hill-am5amy22`) : **17 sur 206 sont à longitude négative** (`lng −1,0013 → −0,0041`) — donc **à l'ouest de Greenwich, au Ghana**, pas à Lomé. Toutes en `source_kind = 'public_import'`, **aucune n'a d'adresse**, et **8 sont nommées par un placeholder** (« Unnamed public place »). Extrêmes réels de la supply : lat **5,9172–6,4282** / lng **−1,0013–2,3912**. Un itinéraire vers ces points serait géographiquement absurde pour un utilisateur à Lomé — **à nettoyer avant de juger la qualité du routage** (sinon on imputera au fournisseur un défaut de données).
3. **Dégradation si le fournisseur est indisponible** : la ligne droite doit-elle rester le repli visible, ou l'état `unavailable` doit-il primer ? Décision produit.

## 7. Décisions demandées au fondateur

| # | Décision | Options | Recommandation |
|---|---|---|---|
| D-ROUTE-1 | Fournisseur de routage | A ligne droite / B hébergé avec clé / C OSRM auto-hébergé | **B** pour V1, C à l'échelle |
| D-ROUTE-2 | Qui paie l'appel | navigatrice seule / jamais de repli payant | proxy serveur + cache obligatoires |
| D-ROUTE-3 | Règle d'accès | maquette (verrouillé) vs fondateur (ouvert sur fiche) | **règle fondateur**, amender S11/S22/S23/S25/S33 |
| D-ROUTE-4 | Repli si fournisseur indisponible | ligne droite visible / `unavailable` seul | à trancher |
| D-ROUTE-5 | Périmètre honnête | « routier fiable à Lomé » vs « égalité Google » | **routier fiable**, assumé |

## 8. Ce qui n'est pas prouvé à ce stade

- Aucune mesure de latence ou de coût réel du fournisseur retenu.
- Aucun test sur le réseau routier de Lomé **via le code Omni** (seulement par requête directe OSRM).
- Aucune validation de la qualité du tracé aux 4 largeurs avec une vraie géométrie routière.
- Aucune vérification que le fallback DOM sait afficher un tracé (aujourd'hui non : no-op).

Aucune ligne de code d'itinéraire n'a été écrite. Le gate est un **choix de fournisseur et de périmètre**, pas un travail d'implémentation.