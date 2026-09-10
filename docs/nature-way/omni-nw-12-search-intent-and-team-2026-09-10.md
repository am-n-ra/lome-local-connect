# NW-12 — « La recherche est le cœur : l'intention derrière » ( 2026-09-10(

> **Handoff:** `HO-OMNI-11` ( fondateur 2026-09-10(: « l'animation de recherche ne se produit toujours pas … la recherche est le coeur de omni … même les contraintes des filtres … leur ui ne permet pas vraiment de faire l'intention derriere … ces elements doivent etre severement revus: les flows admins operators seller buyer et leur exposition dans l'ui … par exemple les interfaces pour qu'un admin puisse faire d'un user operator ou team … on a besoin de nature way pour bien faire les choses a partir de maintenant »(
> **Gate:** Gate 6 — Canopy/launch-readiness ( slice dette explicite déclenché par le fondateur (
> **Maturité cible:** tranches courtes codées + preuves tsc/tests/build/push ( branch rule: push après chaque étape significative (, résidu honnête.

## Diagnostic code-vérité ( cause racines nommées, fichiers:lignes(

| # | Gap fondateur | Cause racine | Preuve |
|---|---|---|---|
| G1 | L'animation de recherche ne se produit toujours pas | `mapStatus` reste `loading` quand le style vectoriel ( `tiles.openfreemap.org` + fonts( plante ou stalle — **aucun `map.on('error')` handler** ni **watchdog de déblocage** dans `TrunkMap.tsx`; l'effet reveal gated sur `mapStatus === 'ready'` ( l.986( ne démarre jamais ( | `TrunkMap.tsx` l.218, 966–987, 1282–1292; vérifié: aucun `on('error'` dans fichier |
| G2 | La recherche ne répond pas à l'intention ( les pins de la carte restent les anciennes facilités( | `runSearch` ne passe **aucune contrainte** au serveur ( chips = décoration pure (; il ne met **jamais à jour `facilities`** avec les résultats → la carte vole vers les ancinnes pins, pas vers la requête ( | `TrunkAppV13.tsx` l.291–313 ( runSearch(, l.838–840 ( submit(, l.904–918 ( chips; `api.ts` l.84 ( SearchOptions série limitée; serveur http l.626–633 ( seuls budget/quantité/rayon parsés( |
| G3 | Expositions admin/operator/team incomplètes | « Rôles 」( maquette MENU_admin( n'a **aucune UI**: la route serveur `role-management` GET/POST existe ( `listRoleManagementAccounts`/`setManagedStaffRole`( sans surface; `AdminV13.tsx` bouton Compteur = disabled ( | `AdminV13.tsx` l.103–166; `api/v2/…` l.3444–3480; `src/server/trunk-repository.ts` l.363–434 ( role management( |
| G4 | Chips contraintes trompeuses | 5/6 des chips buyer n'ont aucun effet serveur ( `Livraison`, `Transactable`, `Ouvert` ( ( et toutes les chips seller/admin/operator non plus ( — l'UI promet une intention non exécutée | `TrunkAppV13.tsx` l.78–98 ( labels(; `http.ts` l.626–633 ( paramètres parsés( |

## Décisions du slice ( borné, honnête (

| Décision | Choix | Justification |
|---|---|---|---|
| D-12.1 | Chips → `SearchOptions` **réelles** ( Quantité 10 / ≤ 15 000 FCFA / ≤ 10 km / Ouvert (; les non-câblées ( Livraison, Transactable, chips seller/admin/operator( = **`bientôt`** désactivées avec tooltip | L'intention doit être vraie ou explicitement différée — jamais décorative |
| D-12.2 | Après recherche, les **pins de la carte deviennent les résultats** ( `setFacilities(result.data(` ) | R-03: la carte est le cœur; le reveal doit cadrer la VRAIE réponse, pas l'état précédent |
| D-12.3 | `operational_state` ajouté au filtre public serveur ( `Ouvert` (: `and (f.operational_state = 'ouvert' or f.operational_state is null)` | D-01: état opérationnel séparé; filtre minimal additif |
| D-12.4 | Fallback carto raster (`/omni-local-style.json`, déjà commité(line `error` handler + watchdog 7 s + bouton Réessayer force le fallback | L'animation doit jouer même si le style vectoriel/tuiles plantent ( le raster = mêmes tuiles basemap CARTO light_all, sans dépendance fonts/vector( |
| D-12.5 | Nouvelle surface `admin-roles` ( « Équipe · Rôles »(: liste comptes + grant/revoke `operator`/`reviewer` avec motif + écho audit | Mauvaise interface serveur déjà prête ( maquette MENU_admin「 Rôles 」 actualisé(; team = operator/reviewer roles |

## Arbre tâches

| ID | Objectif | Acceptation | Statut |
|---|---|---|---|
| NW-12.1 | Helpers `search-constraints.ts` ( purs( + tests | tsc + tests | `done` |
| NW-12.2 | `SearchOptions.operationalState` + api + http + repo ( filtre Ouvert ( | tests api + repo | `done` |
| NW-12.3 | `TrunkAppV13`: submit → opts; réussite → pins = résultats; chips `bientôt` honnêtes | tsc + tests + build | `done` |
| NW-12.4 | `TrunkMap`: fallback raster + watchdog + retry | build + inspect | `done` |
| NW-12.5 | `AdminRolesSheet` + mount + bouton AdminV13 | tsc + tests + build | `done` |
| NW-12.6 | Registre + plan + board + AGENTS.md MAJ | docs | `done` |

## Preuve locale ( accumulation(

| Date | Evidence |
|---|---|
| 2026-09-10 | NW-12.1/12.2/12.3: chips câblées ( Quantité 10, ≤ 15 000 FCFA, ≤ 10 km, Ouvert ) et `bientôt` pour Livraison/Transactable; runSearch passe chipsToSearchOptions(activeConstraints) et setFacilities(result.data) après réussite |
| 2026-09-10 | NW-12.4: map-style-fallback + TrunkMap handler erreur + watchdog 7 s + bouton Réessayer + MapBasemap ( local/raster ) base CARTO light_all, 3 tests unitaires |
| 2026-09-10 | NW-12.5: contrat serveur role-management GET/POST prouvé par 4 nouveaux tests; UI Équipe · Rôles intégrée dans AdminV13 ( liste comptes + grant/revoke operator/reviewer avec motif audité |
| 2026-09-10 | Preuves globales: tsc clean, 344/344 tests, 55 fichiers, build index-2zqnh1PG.js, check boundary clean |

## Résidu honnête

- `Livraison` / `Transactable` ( buyer( et chips seller/admin/operator = **`bientôt`** — leur sémantique demande mini-species ( comment un filtre transactable se calcule côté serveur? est-ce un join availability_state? etc(, triggerée explicitement, pas escamotée.
- Le fallback raster perd les paliers vectoriels si le style vectoriel reste bloqué ( les `boundary`/highlight travaillent sur raster via geojson overlay ( — vérification humaine prod ( COH-18( requise.
- Caméra/GPS réelle reste item `manual`/`partial` per §0.8.4.