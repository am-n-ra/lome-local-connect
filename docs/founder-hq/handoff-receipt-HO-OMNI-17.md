# Handoff HO-OMNI-17 — Cycle V1 bouclé + PRE-1 4 largeurs + correctif glyphes MapLibre (2026-09-17)

## État au handoff
- HEAD `c771a13` poussé sur `omni-v2-rebuild` (2 commits : `131d23a`, `c771a13`).
- Prod sert `index-Bjl18UB3.js` + `index-HBuCpGbx.css` === dist local (**sha256 identique**, T-07d ✅).
- Working tree propre. **61 files / 518 tests**, `tsc --noEmit` exit 0, `check:boundary` clean, build exit 0.

## Ce qui a été fait

### 1. Correctif MapLibre glyphes (`131d23a`) — défaut réel en prod
- **Cause racine** : `tiles.basemaps.cartocdn.com` sert toutes les familles du style Positron **sauf `Noto Sans Bold`** ; cette plage renvoie **404 sans en-tête CORS**. MapLibre journalisait « Rendering codepoint locally instead » et la couche `omni-cluster-count` **s'affichait en chiffres non formés**.
- **Piège** : un helper `rewriteGlyphUrl` **existait déjà dans `TrunkMap.tsx` mais n'était jamais appelé** — le bundle prod n'en contenait **aucune** référence. D'où l'impression trompeuse que « c'était déjà corrigé ».
- **Second piège** : sa réécriture était **par hôte**, donc trop large — elle aurait déplacé les glyphes OpenFreeMap, que cet hôte sert **correctement**.
- **Correctif** : `createGlyphTransformRequest()` dans `src/lib/maplibre.ts`, câblé dans `new Map({ ..., transformRequest })`. Ne réécrit **que** les glyphes quittant `cartocdn.com` → `fonts.openmaptiles.org`. Tiles, sprites, style JSON et hôtes sains gardent leurs URLs déclarées.
- **Troisième piège (dans la preuve, pas dans le produit)** : mon premier matcher de preuve cherchait `/fonts/\.*.pbf` — or l'hôte de repli sert les glyphes **à la racine** (`fonts.openmaptiles.org/Noto Sans Bold/0-255.pbf`), donc **toutes** les requêtes réécrites étaient invisibles et la preuve passait **à vide** (`glyphRequests: 0`). Corrigé : on matche la **plage Unicode** (`/\d+-\d+\.pbf/`). C'est ce qui a transformé une preuve vacuous en preuve **décisive**.
- **Preuve A/B** (`scripts/proof-map-glyphs.mjs`) :
  - prod **d'avant** → échec explicite : `Access to fetch at '.../Noto%20Sans%20Bold/0-255.pbf' ... blocked by CORS policy` ;
  - build corrigé → **5 requêtes glyphes, toutes 200**, `boldServedFromWorkingHost: 1`, `requestsStillOnBrokenHost: 0`, `glyphConsoleErrors: 0` ;
  - **rejoué sur prod après déploiement → PASS.**

### 2. PRE-1 — preuve navigateur du cycle V1, 4 largeurs (`c771a13`)
- Dernier item du plan ordonné §4 de l'audit cycle V1. Exécuté **sur prod** avec un vrai navigateur.
- **20/20 PASS à 360 / 768 / 1280 / 1920 — soit 80/80**, console propre à chaque largeur.
- **Le harnais précédent rapportait 21 faux négatifs — dus à trois hypothèses fausses sur l'UI, pas à des défauts produit** :
  1. les chips de contraintes sont en **divulgation progressive** (`constraintsOpen` s'ouvre à la frappe) : les assertir sur la sheet vierge échouait **toujours** ;
  2. le libellé réel est « Itinéraire vers **ce** vendeur » ;
  3. les résultats sont des `button.hcard` dans `section[data-sheet=results]`, et **un pin de carte porte le même nom** — cliquer le pin faisait **intercepter le clic par le canvas MapLibre**.
- Requête de preuve passée de « coffee » (**0 résultat**) à **« boulangerie »** (1 facilité confirmée, 3 produits) : une recherche vide prouvait la coquille de résultats vides, pas le cycle.
- **Deux assertions d'honnêteté ajoutées** : `.chip.soon` porte bien `aria-disabled="true"` ; et l'itinéraire **sans géoloc** est étiqueté `data-state="unavailable"` (« Position indisponible… ») au lieu d'un faux tracé — **c'est le contrat, pas un échec**.
- Artefacts : `scripts/prove-v1-cycle-browser.mjs` + `docs/nature-way/pre1-proof/` (`pre1-results.json` + 8 captures).

### 3. Réconciliation Founder HQ (board + master plan) au 2026-09-17
- La board était **figée au 2026-09-13/14** et **omettait 9 tranches livrées** : audit cycle V1 + plan §4, RAC-1, COR-1a/3b/7b/7c, TEC-1, FF-1…FF-8, bugs racines E2E (D-TXN-11), bug de déploiement, correctif glyphes, PRE-1.
- Corrigé aussi : **Gate 6 était encore `ready`** dans le tableau des portes du master plan alors qu'il est **`closed`** depuis le verdict fondateur「 Go with limits 」 du 2026-09-11.

## Périmètre honnête de PRE-1
- **Prouvé** : tout ce qui est atteignable **sans session** — arrivée, carte réelle (canvas), fourniture réelle (**206 pins ouvrables**), recherche, contraintes (divulgation progressive, portée 6/6, « bientôt » désactivé), résultats, fiche facilité, état de confiance, itinéraire disponible **avant** intention, contact **non** exposé avant intention.
- **BLOCKED, attesté et jamais simulé** : le segment authentifié du cycle — intention → QR → paiement → verrouillage → avis → contact débloqué. Il exige **une session fondateur** (compte réel) ; il n'est **pas** déclaré prouvé ici.

## Suites immédiates — trois portes, au choix du fondateur
1. **V-9 — nettoyage** (dettes TEC-1 non bloquantes, **jamais un défaut produit**) : arbre de routes TanStack **mort** (`src/routes/` 14 fichiers + `router.tsx` + `routeTree.gen.ts` + `start.ts`, **0 importeur vivant**) ; **6 tests placeholder** qui n'assertent que `toBeDefined()` sur des composants **inexistants** = **fausse couverture**. **La suppression requiert une décision fondateur explicite.**
2. **Exercer le cycle authentifié en session fondateur** — seul segment encore BLOCKED.
3. **Gate 7 Venture Lifecycle** (`/nature-way-venture-lifecycle`) : preuve de demande Lomé — **65 000 F / 13 Pro sellers à vérifier** par reçus / cash book (**pas** la DB) et **CAC segmenté à mesurer**, jamais supposé.

## Règles acquises cette session (à ne pas réapprendre)
- **Un push ne prouve pas un déploiement.** Après chaque push : comparer **hash prod === build local** *et* vérifier l'entrée GitHub `deployments`. Un cron refusé par le plan Vercel **gèle la prod silencieusement**, sans aucun rouge.
- **Une preuve qui ne peut pas échouer n'est pas une preuve.** Deux pièges rencontrés ici : un matcher qui ratait précisément les URLs réécrites (`glyphRequests: 0` = verdict vacuous), et des assertions sur des libellés inexistants. Toujours vérifier qu'une preuve **échoue** sur l'état d'avant le correctif (d'où l'A/B prod vs build corrigé).
- **Un helper présent mais jamais appelé ressemble à un correctif déjà en place.** Vérifier la présence dans le **bundle servi**, pas seulement dans le source.
- Ne jamais départager un état par une clé aléatoire (cf. **D-TXN-11**) ; ne pas relire dans la même instruction ce qu'on vient d'écrire (sémantique de snapshot Postgres — 4 occurrences).
