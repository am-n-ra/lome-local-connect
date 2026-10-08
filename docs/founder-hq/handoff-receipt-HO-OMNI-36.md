# Skill Handoff and Activation Receipt — HO-OMNI-36

> **Request ID:** `HO-OMNI-36`
> **Founder HQ timestamp:** 2026-10-07 (UTC)
> **Primary authority:** `/nature-way` (retour vers HQ)
> **Exact invocation:** `/nature-way-founder-hq /nature-way` + rapport fondateur « deux bugs de recherche »
> **Activation status:** `activated` — porte **Heartwood** (durcissement/fermeture, pas de nouvelle fondation)

## Clarification de porte (question fondateur « on est normalement sur trunk je crois »)

**Non — Trunk est CLOS.** Le registre `TRUNK_CLOSED_HEARTWOOD_OPEN` (voir `current-state.md`).
La porte courante est **Heartwood**. Le terrain (`TT-1`/`TT-2`/Gate 7) reste **EN DERNIER** (décision
fondateur 2026-10-07, séquencement terrain).

## Objet — deux bugs de recherche signalés par le fondateur

1. **Offre — `pain` remontait `peinture`, `copain`, `American Paints`** (29 lignes prod pour ~5 vraies).
2. **Entité — un nom de lieu sans entité revendiquée (« mrs », 30 lieux connus) répondait une
   impasse nue** (« introuvable »), sans chemin vers l'offre.

**Racine commune unique** : le matcher `ilike '%q%'` littéral — **sensible aux accents** et **sans
frontière de mot**. Une seule correction sert les deux plaintes.

## Ce qui a été livré (commit `4d90275`, branche `omni-v2-rebuild`)

### SEARCH-03 — matcher frontière de mot + repli d'accents
- `buildWordBoundaryPattern(raw)` (pur, exporté) : replie les accents (`foldAccents`, **même table
  que le `translate` SQL** — une seule source), découpe sur `[^a-z0-9]+` (**aucune injection de
  métacaractère regex**), exige une frontière de mot **non consommatrice**
  (`(?<![a-z0-9])tok[sx]?(?![a-z0-9])`), tolère le **pluriel s/x** sur le mot du haystack, et **AND**
  les jetons dans l'ordre (`au.*bon.*pain`).
- **`(?<![a-z0-9])` et non `(^|[^a-z0-9])`** : une frontière **consommatrice** mange le séparateur et
  casse les requêtes multi-mots (« au bon pain »). Postgres `~` (ARE) et JS RegExp supportent les
  deux (prouvé live). Ancienne forme `...|$` : `$` en ARE **ne matche pas** en milieu de chaîne ; la
  forme lookaround est correcte partout.
- `translate(...)` du haystack est **écrit INLINE** dans les 3 sites de requête — un helper renvoyant
  une chaîne JS serait passé en **paramètre lié** et comparerait le texte littéral (bug attrapé en
  cours de tranche ; c'est ce qui faisait échouer 2/35 read-paths au premier passage).

### SEARCH-04 — l'entité n'est plus une impasse
- `runEntitySearch` repliait déjà vers le niveau offre quand **aucune** entité ne matche ; l'écran
  expose désormais un **indice honnête** : « Aucune entité ne porte ce nom, mais N lieu(x) connu(s)
  correspond(ent) : … », la règle **S-05/E-6** (« un lieu non revendiqué n'a pas d'entité »), et un
  bouton **« Chercher ce nom parmi les offres »** qui bascule au niveau offre avec la même requête.
- La branche « pas de lieu connu » dit explicitement **pourquoi** (offreur revendiqué vs lieu nu).

## Preuves

| Preuve | Résultat |
|---|---|
| `src/server/search-matcher.test.ts` (NEUF, 7 cas) | `pain` atteint la boulangerie, jamais `Copain`/`Paints`/`Peinture` (nom **réel** OSM) ; `marche`→« Marché » ; multi-mots AND ; pluriel ; **injection regex impossible** |
| `scripts/prove-root-read-paths.mjs` (SQL **réel**) | **35/35** read paths ; +2 assertions comportementales — `pain`→6 lignes 0 faux positifs ; `marche`→46 (« Marché ») |
| **Falsification A/B** | frontière neutralisée → **2 tests unitaires échouent** ET read-path **FAIL** (`pain` remonte 5 faux positifs) ; restaurée → vert. *Un test qui ne peut pas échouer ne prouve rien.* |
| `scripts/probe-search-fix.mjs` (navigateur, app **construite**) | **prod AVANT = FAIL 3** (reproduit mot pour mot les 2 plaintes) ; build corrigé = **PASS** |
| Suite complète | **104 fichiers / 933 tests** (+7) ; `tsc` clean |
| Gardes | `boundary`/`live-surface`/`dead-css`/`docs`/`state`/`coherence`/`maquette`/`species-t12` — **toutes vertes** |

## État de déploiement — **NON POUSSÉ (T-07d non franchi)**

- Commit `4d90275` **local, ahead-1** sur `omni-v2-rebuild`. Bundles client **et** serverless régénérés
  **dans le même commit** (leçon `9c3f5d8` : `api/v2/*.js` sont des artefacts suivis par git).
- **Blocage poussée** : `GITHUB_TOKEN` renvoie **401** (testé plusieurs fois, y compris espacé de 30 s ;
  `gh auth status` : « token is invalid »). L'URL de remote a été remise à jour avec le jeton courant,
  sans effet. **Action fondateur requise** : rafraîchir le secret `GITHUB_TOKEN`.
- **Interdiction de prétendre au déploiement** tant que prod n'est pas prouvée `===` build local
  (`index-qinnJ_Sk.js`, sha256) **et** que GitHub `deployments` porte une entrée pour `4d90275`.

## Décision demandée au fondateur

1. **Rafraîchir `GITHUB_TOKEN`** pour débloquer la poussée (puis re-prouver T-07d : hash prod + entrée
   de déploiement).
2. **Prochaine slice Heartwood** : reste-t-il un item de fermeture, ou applique-t-on la décision
   « terrain en dernier » ? HQ n'ouvre **rien** avant le verdict.

> **Note de méthode :** livrer une tranche **ne clôt pas** une porte. Ce receipt est un paquet de
> preuves ; le verdict reste au fondateur.
