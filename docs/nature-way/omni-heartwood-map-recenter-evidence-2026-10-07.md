# Heartwood — MAP-RECENTER (pin visible au-dessus du sheet) — preuve 2026-10-07

**Porte :** Heartwood (durcissement/clôture — **aucune nouvelle fondation**).
**Signal fondateur :** « quand je clique une facilité dans les résultats, la carte doit se recentrer sur
son pin (pin mis en avant + caméra qui vole dessus pour qu'il soit visible) ; idem en défilant la liste —
**on dirait que ce n'est plus en place** ».

## 1. Ce qui marchait déjà (mesuré, pas supposé)

Sur **prod** (`omni.sparkafrika.online`, viewport 390×844), le recentrage *avait lieu* :

| Étape | `data-zoom` | `data-center-lng` |
|---|---|---|
| après révélation recherche | 3.00 | 1.2145 |
| clic carte résultat +1.8s | **14.20** | 1.2068 |
| scroll grille ×1 | 11.50 | 1.2225 |

La caméra **volait bien** sur la facilité (zoom 3 → 14.2) et le **scroll de la grille** recentrait aussi.
Donc « le recentrage n'est plus en place » n'était pas littéral — c'est le **pin** qui n'était pas visible.

## 2. Le vrai défaut (mesuré)

Après clic, `data-center-lng` = **1.2068** = la longitude de la facilité (1.20681) → le pin était au
**milieu d'écran non-paddé** (y ≈ **422**). Or le sheet de la fiche commence à **y ≈ 304**. Le pin était
donc **caché derrière le sheet**.

**Cause racine — deux défauts distincts :**

1. **Le padding n'était jamais resynchronisé au changement de sheet.** `syncCameraPadding` (TrunkMap)
   dérive le padding bas de la hauteur du sheet, mais n'est réveillé que par un `MutationObserver` en
   **`childList`** (et `ResizeObserver`). Changer de sheet ne fait que basculer l'**attribut**
   `data-sheet` de `.omni-v13-stage` → aucune mutation `childList` → **le padding restait périmé (0)**
   au moment du recentrage. Mesuré : `pad = 0` dans l'ancien code.
2. **Le décalage avait le mauvais signe.** L'ancien code faisait
   `unproject([pt.x, pt.y - (bottomPad + 64)/2])` : cela place le **centre** de la caméra *sous* le pin
   → le pin remonte… puis, comme le padding était 0, la branche `if (bottomPad > 0)` était **sautée** et
   un simple `center: pin` s'appliquait (pin pile au milieu, derrière le sheet). Le commentaire du code
   annonçait « décalé vers le HAUT » alors que le signe faisait l'inverse.

## 3. Le correctif

MapLibre centre la caméra sur la vue **paddée** : `centerPoint.y = (height − bottom)/2`
(**vérifié dans la source** `maplibre-gl/dist/maplibre-gl-dev.mjs`, `EdgeInsets.getCenter`). Le bon geste
n'est donc pas un décalage pixel fragile, mais :

1. mesurer la **hauteur réelle du sheet** depuis le DOM (`getBoundingClientRect().top`), **au moment du
   recentrage** — indépendant du padding périmé ;
2. poser le padding bas via `bottomPaddingFor(sheetHeight, viewportHeight)` (le clamp existant protège
   la matrice du globe) ;
3. **centrer sur le pin** (`easeTo({ center: [facility.lng, facility.lat] })`) : le pin atterrit alors au
   milieu de la bande visible (0 … sheetTop).

**Mobile uniquement** (`window.innerWidth < 1040`) : sur desktop le sheet est un **rail gauche**, pas un
sheet bas — poser un padding bas y serait faux (le rail est pleine hauteur). Mirroir exact de
`syncCameraPadding`.

**Vol en cours** : si `map.isMoving()` (ex. la révélation de recherche), l'effet **rejoue le cadrage au
`moveend`** au lieu de l'abandonner — le pin n'est jamais laissé caché.

## 4. Preuve A/B décisive

`scripts/probe-facility-recenter-ab.mjs` charge deux bundles identiques **sauf** la formule de
recentrage (via `scripts/fixed-bundle-server.mjs`, qui sert un build local et proxifie `/api/*` vers
prod — mêmes données réelles). Il calcule la position écran du pin : `visH/2 + (mercY(center) −
mercY(pin))`, avec `visH = 844 − padding`.

| Bundle | padding | centre lat | pin lat | position pin (y) | sheetTop | visible au-dessus du sheet |
|---|---|---|---|---|---|---|
| **OLD** (formule d'origine) | 464 | 6.1417 | 6.1319 | **−74** (hors écran) | 304 | **non** |
| **FIXED** (centrage paddé) | 464 | 6.1319 | 6.1319 | **190** (milieu de bande) | 304 | **oui** |

Même padding dans les deux cas (donc la comparaison isole bien la formule) : l'ancienne place le pin
**hors écran haut**, la nouvelle le place **au milieu de la bande visible**.

## 5. Gardes et non-régression

- `src/trunk/map-camera.test.ts` — contrat : pour **chaque** taille de sheet réelle (h-low 44 %, h-mid
  52 %, h-auto 60 %, h-full 64 %), le milieu paddé reste **au-dessus** du sheetTop.
- `src/trunk/facility-recenter-lock.test.ts` (garde de source) — l'effet doit mesurer le sheet depuis le
  DOM, poser le padding via `bottomPaddingFor`, centrer sur le pin, rejouer au `moveend` ; et **ne pas**
  réintroduire le décalage fautif. **Falsifié** : réinjecter `bottomPad + 64` → **1 échec** ; restauré →
  4/4.
- **916/916** tests (101 fichiers, +6), `tsc` 0, `check:state` / `check:live-surface` / `check:boundary`
  / `check:coherence` / `check:docs` / `check:dead-css` verts.

## 6. Résidus honnêtes

- Le **fallback carte** (tuiles indisponibles) a un `getPadding()` figé à 0 : le correctif n'y déplace pas
  la caméra, mais le repli ne dessine pas de pins réels au même endroit — dette préexistante, hors
  périmètre de cette régression.
- Preuve navigateur **avec session authentifiée** non exécutée (sandbox sans DB/Auth) : la preuve ici est
  **anonyme** (recherche publique → fiche facilité), ce qui est exactement le chemin signalé.
- Diagnostic exposé par deux attributs de mesure sur `.map-stage` (`data-center-lat`, `data-pad-bottom`),
  cohérents avec le `data-center-lng` existant.
