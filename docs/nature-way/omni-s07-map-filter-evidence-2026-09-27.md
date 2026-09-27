# S-07 — Rail de filtres de la carte : écart mesuré, porté, prouvé (2026-09-27)

> **ID :** `S07-EVIDENCE-2026-09-27` · **Commit :** `2365581` (branche `omni-v2-rebuild`)
> **Source :** `S-07` (Intent Brief V2, confirmé) + maquette acceptée `omni-species-v2-interactive.html` (`filterrail`)
> **Déclencheur :** fondateur — *« tout ce que je sais c'est ce que j'ai décrit à Species ; le reste n'est pas à moi »* → l'écart a été **dérivé** de la description, pas demandé.

---

## 1. L'écart mesuré

| Lieu | Contenu |
|---|---|
| **Maquette acceptée** (lignes 59, 195, 210, 393) | `filterrail` → `Tout / Commerces / Particuliers / Transport` (`Transport` = `soon`) |
| **Registre Species** (`omni-species-v2-decision-registry`, S-07) | statut **« OK (corrigé) — les filtres de carte existent »** |
| **App** (`TrunkMap.tsx`, `fallback-map.ts`, `ui-v13.css`) | **0 occurrence** de `fchip`/`filterrail` |

**Le registre mesurait la maquette, pas l'app.** La ligne S-07 « les filtres existent » était **vraie pour
le HTML accepté** et **fausse pour le produit**. C'est le motif déjà rencontré trois fois cette semaine
(`R-B` code/données, `facility_type` colonne/octobre-août, `×100` schéma/seed) : **la maquette est en
avance sur l'app, et la mémoire confond les deux.**

**Pourquoi c'est le bon acte, et pas mon goût technique :** le fondateur a décrit ce filtre, il est dans
la maquette acceptée, et c'est **la** façon dont « la carte ne sature pas » (S-07). Il rend découvrable
le cas fondateur 4 — *« un particulier vend son ordinateur d'occasion »* — **par l'entité qui publie**
(S-13 : un particulier EST une entité), sans exiger un filtre neuf/occasion que la maquette désactive.

---

## 2. Ce qui a été porté

| Fichier | Changement |
|---|---|
| `src/trunk/map-filters.ts` (neuf) | module pur : `MAP_FILTERS` (4 chips, `Transport` `soon` + raison) · `facilityMatchesFilter` · `filterFacilities` |
| `src/trunk/TrunkAppV13.tsx` | état `mapFilter` · `visibleFacilities` (mémo) · rail rendu dans `mapbase` · **état vide honnête** |
| `src/trunk/ui-v13.css` | `.filterrail` + `.fchip` portés **1:1** de la maquette (lignes 59–63) + décalage desktop |
| `src/trunk/map-filters.test.ts` (neuf) | 6 tests |

### Règles verrouillées

1. **Le filtre porte sur l'ENTITÉ** (S-13), jamais sur un attribut produit.
2. **`Transport` est désactivé** (`soon`, tooltip « Transport — bientôt (V1+) ») — V1+ explicite (S-08/S-12). Une chip qui ne peut rien filtrer ne doit pas le cacher.
3. **Un lieu `unclaimed` (fond de carte `public_import`) n'est ni un commerce ni un particulier** — il est masqué par `Commerces`/`Particuliers`, visible sous `Tout`. Le montrer serait précisément ce que S-05 interdit (promettre une entité là où il n'y a qu'un lieu connu).
4. **Le vide parle** : un filtre qui ne trouve rien affiche « Aucun *x* dans cette zone — élargissez ou revenez à « Tout » » (S-05 : jamais de vide illisible).

---

## 3. Preuve

| Élément | Résultat |
|---|---|
| Tests | **586/586** (48 fichiers) — **+6** |
| **Falsification** | `Commerces` renvoyé `true` → **3 tests ÉCHOUENT** (classification, honnêteté S-05, aliasing) ; restauré → 6/6 ✅ |
| `lint` (tsc) | ✅ |
| `check:boundary` | ✅ |
| `check:maquette` | ✅ |
| `check:coherence` | ✅ |
| `check:state` | ✅ |
| `check:docs` | ✅ |
| Build | `index-DjzvvrNP.js` + `index-CBsJf68R.css` |
| **Présence dans les artefacts servis** | `filterrail` dans le **CSS servi** ✅ ; `Particuliers` + `filterrail` dans le **JS servi** ✅ (pas seulement dans le source — la leçon `rewriteGlyphUrl`) |
| Navigateur (preview local) | les 4 chips rendues et cliquables ; `Transport` désactivé ; l'absence de DB affiche **l'erreur réelle**, pas un faux état vide (comportement honnête) |

**Non prouvé :** le comportement du filtre **sur des données réelles** (preview sandbox sans DB ; le
`Particuliers` ne peut rien montrer tant que **0 particulier** n'existe). C'est exactement l'acte 2 :
**peupler un quartier réel** — il faut un vrai vendeur.

---

## 4. État & prochain acte

- **Poussé ? NON.** 6 commits en avance sur `origin/omni-v2-rebuild`, **délibérément** : `058` (monétaire) est **couplé base+code** (voir `hq-reconciliation-2026-09-27.md`). Pousser maintenant exposerait `058` sans sa migration → offres **100× trop petites**. **Code et base voyagent ensemble ou pas du tout.**
- **Acte 1 (ce commit) :** rail de filtres — **fait**.
- **Acte 2 :** peupler un quartier de Lomé — ≥1 commerce réel + ≥1 **particulier réel** + 1 acheteur hors équipe. **Humain.** C'est le test que le fondateur a lui-même nommé (H1 « Vivant »).
- **Décisions fondateur encore requises (les seules non dérivables) :** **UM-6** (bonus : 20 $ ou 2 000 F — argent promis) · **UM-2…5** (autoriser la fenêtre base+code pour appliquer `058`) · confirmer **H1–H4**.
