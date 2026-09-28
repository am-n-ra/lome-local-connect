# Rapport MCP — POP-1c-A sous-vague 2 : **Afrique centrale** (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :**
> `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-s2-centrale.md`.
> **Branche :** `omni-v2-rebuild`, HEAD au départ **`1ce28e0`** (≥ attendu ✅). **Porte :** `SPECIES_CLOSED_ROOT_OPEN`.
> **Aucun secret. Aucun redeploy. Aucune variable.** Canonique identifiée **par ses données**
> (`br-dawn-hill-am5amy22` = **117 854** facilités au départ, exactement le compte post-S1).
> **Forecast figé AVANT runs :** commit `5fa6341` (**poussé avant tout run**).

---

## S2-0 — Re-vérification hash prod (T-07d)

- Entrée `deployments` pour `1ce28e0` : **`6710084245`** (Production, 2026-09-28T12:39:15Z) ;
  antérieurs `0981a2b 6709962178` (12:33Z), `eb56227 6709440008` (12:06Z).
- **Hash prod === build local** : `index-BGUSIwRj.js` + `index-CBsJf68R.css` (commits S1 **docs-only**
  ⇒ hash inchangé, **normal** — vérifié par build local réel, pas supposé).
- `/api/v2/public/facilities` → **200** (250 = plafond de requête). Route batch réelle
  `POST /api/v2/public/facilities?action=operator-import-batch&scope=world` → **401**.
- Routage anonyme → **401 AUTH_REQUIRED** (paramètres `from_lat/from_lng/to_lat/to_lng` requis ;
  `fromLat` = **400 INVALID_INPUT**, contrat inchangé).

## S2-1 — Extraits + FORECAST (figé AVANT tout run, commit `5fa6341`)

**8 extraits Geofabrik** (Afrique centrale, tous Last-Modified 2026-09-27/28) : cameroon 213,0 Mio ·
central-african-republic 94,8 Mio · chad 128,8 Mio · congo-brazzaville 31,1 Mio ·
congo-democratic-republic 396,8 Mio · equatorial-guinea 6,2 Mio · gabon 24,3 Mio ·
**sao-tome-and-principe 1,2 Mio** (*extrait Geofabrik propre → **incluse** dans S2, pas exclue*).

| Pays | matchés | importables | pré-filtrés (nom vide) | avec adresse | pilot | world | quarantine |
|---|---|---|---|---|---|---|---|
| cameroon | 25 063 | 12 572 | 12 491 | 545 | 0 | 12 585 | 12 478 |
| central-african-republic | 319 | 277 | 42 | 17 | 0 | 279 | 40 |
| chad | 1 800 | 1 428 | 372 | 324 | 0 | 1 456 | 344 |
| congo-brazzaville | 3 246 | 3 018 | 228 | 173 | 0 | 3 024 | 222 |
| congo-democratic-republic | 5 804 | 5 339 | 465 | 1 236 | 0 | 5 407 | 397 |
| equatorial-guinea | 446 | 336 | 110 | 116 | 0 | 353 | 93 |
| gabon | 1 838 | 1 480 | 358 | 741 | 0 | 1 637 | 201 |
| sao-tome-and-principe | 250 | 219 | 31 | 20 | 0 | 220 | 30 |
| **TOTAL** | **38 766** | **24 669** | **14 097** | 3 172 | **0** | **24 961** | **13 805** |

**Chevauchements estimés :** intra-S2 **50** (cameroon∧chad 25 · congo-brazzaville∧RDC 18 ·
cameroon∧CAR 4 · cameroon∧congo-brazzaville 1 · CAR∧RDC 1 · equatorial-guinea∧gabon 1) +
canonique **2** (cameroon) → **created attendu = 24 669 − 50 − 2 = 24 617**.
`pilot = 0` partout (la boîte Lomé ne déborde pas sur l'Afrique centrale, contrairement à Ouest).

## S2-2 — Dry-run sur JETABLE (ZÉRO écriture canonique)

**Jetable :** `pop1ca-s2-dryrun` = `br-wild-bird-amxou9af` (depuis canonique), **supprimée** en fin de
session (**0 résidu vérifié** : `list_branches` → vide après suppression).

| Pays | input | rejNorm | admis | quarantine | created | existing | p95 écriture |
|---|---|---|---|---|---|---|---|
| cameroon | 12 572 | **0** | 12 572 | 0 | 12 570 | 2 | 105 ms |
| central-african-republic | 277 | **0** | 277 | 0 | 273 | 4 | 116 ms |
| chad | 1 428 | **0** | 1 428 | 0 | 1 403 | 25 | 95 ms |
| congo-brazzaville | 3 018 | **0** | 3 018 | 0 | 3 017 | 1 | 106 ms |
| congo-democratic-republic | 5 339 | **0** | 5 339 | 0 | 5 320 | 19 | 99 ms |
| equatorial-guinea | 336 | **0** | 336 | 0 | 336 | 0 | 102 ms |
| gabon | 1 480 | **0** | 1 480 | 0 | 1 479 | 1 | 99 ms |
| sao-tome-and-principe | 219 | **0** | 219 | 0 | 219 | 0 | 1165 ms* |
| **TOTAL** | **24 669** | **0** | **24 669** | **0** | **24 617** | **52** | — |

`rejectedByNormalization = 0` partout ⇒ **le pré-filtre « name vide » fonctionne** (aucun item sans
nom n'atteint la route). (*) Sao Tomé p95 écriture = un pic unique `max 1574 ms` sur le dernier item
(2ᵉ connexion froide) ; p50 = 92 ms — **non significatif** (échantillon 219).

**`existing = 52` réconcilié (preuve, pas confiance) :** 50 chevauchements intra-S2 + 2 canoniques =
**52 exact** — forecast confirmé au pays près (cameroon 2, chad 25, CAR 4, congo-brazzaville 1, RDC 19,
gabon 1, eq-guinea 0, sao-tome 0). Dédup `(source_id, source_ref)` ⇒ **1 seule ligne, ZÉRO doublon**.

**ZÉRO-CANONIQUE PROUVÉ :** counts canoniques 117 854 / 117 851 / 117 850 / `max_created_at`
12:27:29.966 **identiques avant = après** les 8 dry-runs.

**Jetable au pic :** facilities **142 471** (= 117 854 + 24 617, pic canonique attendu exact),
source_refs 142 468, unclaimed 142 465, owned 3.

**Perf `listPublicFacilities` (bounds Lomé, 30 éch.) :** jetable pleine **142 471** → 1ᵉʳ échantillon
froid 316 ms, puis **p50 57–62 / p95 173–177 ms** sur 3 passes chaudes — **≤ référence 186 ms**
(requête plafonnée 250 lignes). Canonique chaud mesuré **p95 181 ms** au même moment. ⇒ **pas de
dégradation** (la mesure chaude est le régime réel ; le pic froid est un démarrage de compute).

**Claim spot-check S-18 (agnostique au tier, sur jetable) :** 2 lieux neufs `world`
(`Cafe Khatibe` lat 0.34 lng 6.74 ; `Djadja la table solidaire` lat 0.34 lng 6.74)
→ `createClaimDraft` **crée** un brouillon (`trust_state` passe `unclaimed` → `verification_draft`,
`account_id` reste `null`), puis `cancelClaim` **restaure** `unclaimed`. Le tier ne donne aucun droit
(S-18 intact). **142 465** lieux claimables.

## S2-3 — Runs canoniques (un par pays, chemin d'import livré)

**Méthode :** `createTrunkRepository().createPublicFacilityImport`, composition identique à `http.ts`
(`admitIntakeBatch(scope='world')` puis un import par point), **garde de rôle opérateur RÉELLE**
(compte `ea00d0f2-…` / auth `a82873a0-…`). ⚠️ **Substitution honnête** (mêmes vagues 0/Ouest/S1) :
aucun JWT opérateur atteignable et un secret ne se colle jamais dans le chat → **l'authentification
JWT / sérialisation HTTP / mapping de statut de la route ne sont PAS exercés**. Seule substitution.

**Baseline canonique avant :** facilities 117 854 · source_refs 117 851 · runs 117 850 ·
`max(created_at)=2026-09-28T12:27:29.966Z` · produits 16 · entités 3.

**Résultats (IDENTIQUES au dry-run, pays par pays) :** created **24 617**, existing **52**, admis 24 669.

**Counts canoniques après :**

| Contrôle | Valeur |
|---|---|
| facilities | **142 471** = 117 854 + 24 617 ✅ (= pic jetable exact) |
| source_refs | **142 468** |
| produits / entités | **16 / 3** (intacts) |
| `operator_runs` | 142 467 |
| `unclaimed` / `owned` | 142 465 / **3** (revendiquées NON touchées) |
| `intake_tier` présent | **142 338** |
| `tier world` / `tier pilot` | **131 857** / **10 481** (pilot inchangé) |
| registre migrations `044→064` | **0 trou** (21 fichiers présents) |
| perf p95 canonique | **178 ms** (plafond 250 lignes) |
| prod `/api/v2/public/facilities` | **250** (plafond) → reflète l'import ; routing **401** |

**Rollback plan** écrit **avant** les runs : `mcp-rollback-plan-2026-09-28-pop1c-afrique-s2-centrale.md`
(fenêtre `created_at > 2026-09-28T12:27:29.966Z`, `unclaimed` + `public_import` uniquement, jamais les
3 revendiquées). **NON exécuté** — aucun ordre séparé.

---

## Findings (constatés en exécutant)

1. **[INFO] Pré-filtre « nom vide » très élevé au Cameroun** — 12 491/25 063 (49,8 % sans nom).
   Cohérent avec la volumétrie OSM très inégale déjà observée à Ouest/S1 (Nigeria 78 %).
2. **[INFO] `existing = 52` entièrement réconcilié** (50 frontières intra-S2 + 2 canoniques
   `cameroon`) — forecast exact au pays près, aucun doublon, dedup `(source_id, source_ref)` vérifiée.
3. **[INFO] `pilot = 0`** sur toute la sous-vague — la boîte pilote Lomé (1,0–2,45 E / 5,85–6,5 N)
   ne déborde pas sur l'Afrique centrale (aucun point de la région n'y tombe).
4. **[BASSE] Perf : pas de dégradation.** Jetable pleine 142 471 → p95 chaud 173–177 ms ≤ référence
   186 ms ; canonique après import p95 178 ms. Le 1ᵉʳ échantillon froid (316 ms) est un démarrage de
   compute, pas une régression de requête (confirmé par 3 passes chaudes + canonique au même instant).

## Gardes & commits

- `check:state` + `check:docs` verts avant commit du forecast.
- `5fa6341` — **forecast S2 figé AVANT runs** (méthode + preuve d'ordre), poussé avant tout run.
- `(ce commit)` — rapport S2 S2-2/S2-3 + rollback plan + réconciliation plan POP-01.

## STOP — fin de sous-vague 2

Conforme au handoff : **arrêt après « Afrique centrale »**, pas de sous-vague Est sans ce rapport écrit.
Totalité S2 : **24 617 lieux créés**, canonique 117 854 → **142 471**, 0 revendiqué touché, registre
intact, prod reflète l'import. Sous-vagues restantes (Est → Nord → Australe) : **non lancées**.
