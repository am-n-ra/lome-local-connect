# Heartwood `HP-1` — le flood de transform MapLibre est reconnu, soigné et coupé (2026-10-07)

> **Porte :** `TRUNK_CLOSED_HEARTWOOD_OPEN` (durcissement/fermeture — pas de nouvelle fondation).
> **Origine :** trouvé par la preuve `WP-1` (Web Push). Un bruit de page PRÉ-EXISTANT et
> intermittent apparaissait hors de la fenêtre push : `_calcMatrices` /
> `Invalid LngLat (0, NaN)`. Le harnais le comptait à part ; `HP-1` le traite à la racine.

## 1. La panne

Quand la matrice de projection MapLibre devient **dégénérée** (globe singulier, padding qui
écrase la vue, centre non fini), MapLibre lève **depuis ses propres frames** —
`_calcMatrices` (rendu) et `unprojectScreenPoint` (pointeur) — et **synchronement**, donc
hors de nos handlers (déjà gardés par `try/catch`). Ces lancers remontent au **`window.onerror`**
et **se répètent à chaque frame** : c'est le « flood ».

`map.on('error')` (ligne ~564) appelait déjà `healTransform()` — mais il **n'attrape pas** les
frames de rendu/pointeur qui s'échappent directement au `window.onerror`. Le soin existait,
le **filet** manquait.

## 2. Le correctif (localisé)

- **`src/trunk/map-transform-error.ts`** (pur) : `isTransformMatrixError(text)` reconnaît les
  frames MapLibre (`_calcMatrices` / `unprojectScreenPoint` / `transformMat4`) ; `Invalid LngLat`
  **seulement si `NaN`** est présent (un `Invalid LngLat (1.2, 6.1)` n'est pas une matrice
  dégénérée et doit passer).
- **`src/trunk/TrunkMap.tsx`** : listener `window.addEventListener('error', handleWindowError, true)`
  qui, sur signature transform, **re-ancre la caméra** (`healTransform()`) et **`preventDefault()`**
  (coupe le log par défaut). Retiré au démontage.

**La signature est volontairement étroite.** Le cas qui compte autant que les positifs : une
lecture nulle **générique** sans frame MapLibre (`at renderRow (our-component.tsx)`) n'est **pas**
avalée — le filet ne masque aucune vraie erreur applicative.

## 3. Preuves

- **Unitaire** `src/trunk/map-transform-error.test.ts` (4) : positifs (`_calcMatrices`,
  `unprojectScreenPoint`, `Invalid LngLat … NaN`) ; **négatifs** (lecture nulle générique,
  `r.on2 is not a function`, `Failed to fetch`, `Invalid LngLat (1.2, 6.1)`, vide).
- **Garde source** `src/trunk/map-transform-lock.test.ts` (+3) : l'import, le listener en capture
  qui reconnaît + soigne + coupe, et son retrait au démontage. **Falsifié** : le
  `addEventListener` retiré → **1 échec** ; restauré → 10/10.
- **Preuve navigateur A/B** `scripts/prove-map-transform-heal.mjs` (`npm run proof:map-transform-heal`) :
  - **P1** : un `ErrorEvent` de signature transform est **intercepté** (`defaultPrevented=true`).
  - **P2** : un `ErrorEvent` générique **n'est PAS avalé** (`defaultPrevented=false`).
  - **PROD** (bundle sans filet) → **P1 FAIL** (`defaultPrevented=false`) ; **build local** (avec
    filet) → **P1 PASS, P2 PASS**. La preuve **peut échouer** : elle prouve bien le correctif, pas
    sa propre cohérence.
- **Bundle servi** : `_calcMatrices` / `unprojectScreenPoint` / `transformMat4` présents dans
  `dist/assets/index-CDprVsoE.js`.
- **Batterie** : **989/989** tests, `tsc` 0, 5 gardes vertes (`state`/`docs`/`coherence`/
  `live-surface`/`boundary`).

## 4. Résidu honnête

- La **reproduction réelle** de la panne (timing des transitions caméra) **n'a pas été obtenue**
  de façon fiable en headless (swiftshader) : la preuve porte donc sur le **mécanisme installé**,
  pas sur une occurrence naturelle capturée. C'est la même limite que `map-transform-lock`
  (contrat verrouillé à la source pour un défaut non reproductible en headless).
- Le correctif **réduit** le flood (re-ancre + coupe le log) ; il ne **supprime pas** la cause
  amont d'une matrice dégénérée — qui reste soignée par `healTransform` + `bottomPaddingFor`.
  Toute nouvelle signature de transform non couverte passerait : à surveiller au terrain.
- **`T-07d`** non franchi tant que le push est bloqué (jeton GitHub expiré en session) : prod sert
  encore le bundle **sans** le filet.
