# Rapport MCP — POP-1c-O vague Ouest : Ghana + Bénin + Burkina Faso (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :** `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-ouest-backfill.md`.
> **Branche :** `omni-v2-rebuild`, HEAD au départ **`353c7f7`** (≥ attendu ✅). **Porte :** `SPECIES_CLOSED_ROOT_OPEN`.
> **Aucun secret. Aucun redeploy. Aucune variable.** Canonique identifiée **par ses données** (`br-dawn-hill-am5amy22` = **11 370** facilités au départ).

---

## 0. O0 — Re-vérification hash prod (T-07d)

- Entrée `deployments` pour `353c7f7` : **`6708265779`** (Production, 2026-09-28T11:01:14Z). Anterieurs : `2d793e4 6708067832` (10:49Z), `40948a0 6707720365` (10:28Z).
- **Hash prod === build local** : `index-BGUSIwRj.js` + `index-CBsJf68R.css` (commits docs-only ⇒ hash inchangé, **normal**).
- `/api/v2/public/facilities` → **200** (250 = plafond de requête ; canonique 11 370).
- Routing anonyme → **401 AUTH_REQUIRED**. Route batch réelle : `POST /api/v2/public/facilities?action=operator-import-batch&scope=world` → **401**.
  ⚠️ **Le handoff la nomme `operator-import-batch`** ; la route réelle est `public/facilities?action=operator-import-batch` (vérifié `src/server/http.ts:673`). Un appel au chemin littéral `operator-import-batch` donne **404**.

---

## 1. O1 — Extraits + transform (Geofabrik, PAS de live Overpass)

| Pays | Fichier | Taille | Extrait (Last-Modified) |
|---|---|---|---|
| Ghana | `africa/ghana-latest.osm.pbf` | 110,5 Mo | 2026-09-27 |
| Bénin | `africa/benin-latest.osm.pbf` | 46,0 Mo | 2026-09-27 |
| Burkina Faso | `africa/burkina-faso-latest.osm.pbf` | 80,8 Mo | 2026-09-27 |

Tags identiques à la vague 0 (shop/amenity-subset/craft/office/tourism-hôtellerie) ; `sourceRef = node/<id>` stable ; attribution OSM conservée.

**PRÉ-FILTRE name vide intégré au transform** (`scripts/transform-osm-extract.py`) : il écrit
`<country>.json` (payloads **importables**, nom non vide) **et** `<country>.json.all.json` (tous les
points matchés, pour la distribution classifieur complète). Le `400 batch-reject` reste le contrat API.

| Pays | Points matchés | Importables (només) | **Pré-filtrés (nom vide)** | Avec adresse |
|---|---|---|---|---|
| Ghana | 22 331 | 15 836 | **6 495** | 4 038 |
| Bénin | 10 212 | 8 760 | **1 452** | 469 |
| Burkina Faso | 4 958 | 3 883 | **1 075** | 236 |
| **Total** | **37 501** | **28 479** | **9 022** | 4 743 |

---

## 2. O2 — Dry-run par pays sur JETABLE (zéro canonique prouvé)

**Jetables :** `pop1co-dryrun` = `br-shiny-water-am4o0hrp` (depuis canonique), **supprimée** en fin de session (0 résidu).

**Distribution classifieur (zéro écriture, `scripts/prove-pop1c-distribution.mjs`) :**

| Pays | matched | pilot | world | quarantine (nameless) | raisons world | worldScope admis |
|---|---|---|---|---|---|---|
| Ghana | 22 331 | **175** | 18 764 | 3 392 | 15 661 outside-pilot + 3 103 nameless-with-addr | 18 939 |
| Bénin | 10 212 | **3 237** | 5 554 | 1 421 | 5 523 outside-pilot + 31 nameless-with-addr | 8 791 |
| Burkina Faso | 4 958 | **0** | 3 888 | 1 070 | 3 883 outside-pilot + 5 nameless-with-addr | 3 888 |

**Runs d'import dry-run (payloads importables, scope world) :**

| Pays | input | rejNorm | admis | quarantine | created | existing | p95 | wall |
|---|---|---|---|---|---|---|---|---|
| Ghana | 15 836 | **0** | 15 836 | 0 | 15 750 | 86 | 102 ms | 130 s |
| Bénin | 8 760 | **0** | 8 760 | 0 | 8 742 | 18 | 105 ms | 74 s |
| Burkina | 3 883 | **0** | 3 883 | 0 | 3 868 | 15 | 101 ms | 31 s |

`rejectedByNormalization = 0` **prouve que le pré-filtre fonctionne** : plus aucun item sans nom n'atteint la route.

**ZÉRO-CANONIQUE PROUVÉ :** counts canoniques 11 370 / 11 367 / 11 366 / tier 11 183 **avant = après** les 3 dry-runs.

**Perf `listPublicFacilities` (bounds Lomé, 30 éch.) :** canonique 11 370 → p50 35 / **p95 166 ms** ;
jetable pleine **39 730** → p50 53 / **p95 186 ms** (+20 ms à la charge maximale ; requête plafonnée 250 lignes).

---

## 3. O3 — Runs canoniques (un par pays, chemin d'import livré)

**Méthode :** `createTrunkRepository().createPublicFacilityImport`, composition identique à `http.ts`
(`admitIntakeBatch(scope='world')` puis un import par point), **garde de rôle opérateur RÉELLE**,
compte `a82873a0-…`. ⚠️ **Substitution honnête** (identique à la vague 0) : aucun JWT opérateur
atteignable et un secret ne se colle jamais dans le chat → **l'authentification JWT / sérialisation HTTP /
mapping de statut de la route ne sont PAS exercés**. Seule substitution de la session.

**Baseline canonique avant :** facilities 11 370 · source_refs 11 367 · runs 11 366 ·
`max(created_at)=2026-09-28T10:45:05.202Z`.

| Pays | admis | **created** | existing | p95 | wall |
|---|---|---|---|---|---|
| Ghana | 15 836 | **15 750** | 86 | 98 ms | 125 s |
| Bénin | 8 760 | **8 742** | 18 | 100 ms | 71 s |
| Burkina Faso | 3 883 | **3 868** | 15 | 98 ms | 31 s |
| **Total** | 28 479 | **28 360** | **119** | — | 227 s |

**Counts canoniques après (vs dry-run — identiques) :**

| Contrôle | Valeur |
|---|---|
| facilities | **39 730** = 11 370 + 28 360 ✅ |
| source_refs | **39 727** |
| produits | **16** (intacts) |
| entités | **3** (intacts) |
| `operator_runs` | 39 726 |
| `unclaimed` / `owned` | 39 724 / **3** (revendiquées non touchées) |
| `intake_tier` présent | **39 597** (= 11 183 Togo + **28 414** Ouest) |
| `tier world` / `tier pilot` | **29 116** / **10 481** |
| registre migrations `044→064` | **0 trou** |
| perf p95 | **166 ms** |
| prod `/api/v2/public/facilities` | **250** (plafond) → reflète l'import |

**`existing = 119` réconcilié (preuve, pas confiance) :** à l'échelle inter-pays, un même `node/<id>`
frontière apparaît dans **deux** extraits Geofabrik → dédup `(source_id, source_ref)` ⇒ **une seule
ligne, zéro doublon**. Détail : 54 chevauchements canon-Togo↔Ghana + 65 nœuds frontaliers intra-Ouest
(Ghana/Bénin/Burkina). Vérifié : 15 750 + 8 742 + 3 868 = 28 360 = Δfacilities exact.

**Claim spot-check S-18 :** 2 lieux neufs `world` (`Fig Design & Branding House` Ghana/Sunyani lat 6.69
lng −1.61 ; `Don de Dieu` Bénin lat 6.47 lng 2.66) = `account_id null` + `unclaimed` → joignables par
`createClaimDraft`. **39 724** claimables. Le tier ne donne aucun droit (S-18 intact).

---

## 4. Findings (constatés en exécutant)

1. **[MOYENNE] La « zone pilote » est une BOÎTE géométrique qui déborde sur les pays voisins.**
   `PILOT_ZONE_BOUNDS = {west 1.0, south 5.85, east 2.45, north 6.5}`. Résultat : **175** points
   **Ghana** (lng 1.00–1.20, l'Est du pays) et **3 237** points **Bénin** (lng 1.64–2.45 = axe
   Ouidah/Cotonou) sont classés `pilot`. Le tier ne donne **aucun droit** (S-05/S-18/S-30 intacts),
   c'est un label, donc **non bloquant** — mais DEC-V2-14 doit en avoir conscience : « pilot » ≠ « Lomé
   uniquement ». Décision : renommer/documenter la boîte, ou restreindre au pilote réel.
2. **[BASSE] 9 022 items pré-filtrés (nom vide)** au total Ouest ; **3 979** d'entre eux ont une adresse
   (`nameless-with-address`) et sont donc classés `world` par le classifieur, mais **non importables via
   la route** (le pré-filtre les écarte). Dette de données connue depuis la vague 0, sans changement.
3. **[BASSE] Noms dégénérés** dans les extraits (numéros, abréviations) — pas de pré-filtre qualité par
   contrat. Dette de données, non bloquante.
4. **[INFO] 46 refs canoniques `node/` ne sont dans aucun des 3 extraits Ouest** (Overpass historique
   plus large) : intactes, aucun refresh. Coexistence `node/<id>` et legacy `osm-<id>` maintenue.
5. **[INFO — doc] Le handoff cite `mcp-report-2026-09-28-pop1c-togo-import.md`** ; le fichier réel est
   `mcp-report-2026-09-28-pop1c-togo.md` (coquille de nom, sans effet).

---

## 5. Rollback (plan écrit par pays, NON exécuté — les 3 vagues sont saines)

Supprimer les `v2_facilities` **créées** dans la fenêtre Ouest par pays
(`created_at > 2026-09-28T10:45:05.202Z` **ET** `account_id is null` **ET** `source_kind='public_import'`
**ET** `trust_state='unclaimed'`) ; ne PAS toucher les 119 rafraîchies (elles préexistaient). Supprimer de
même les `v2_operator_runs` de la fenêtre. **Aucune suppression exécutée sans ordre séparé.**

---

## 6. Gardes & commits

- `check:state` (+ `check:docs`) verts avant commit.
- Commit : `scripts/transform-osm-extract.py` (pré-filtre), `scripts/prove-pop1c-distribution.mjs` (nouveau),
  `scripts/prove-pop1c-togo-import.mjs` (opt-in canonique + label), ce rapport.

---

## 7. STOP après les 3 pays

Conforme au handoff : **arrêt après Ghana+Bénin+Burkina**, pas de vague Afrique sans ce rapport écrit.
Totalité Ouest : **28 360 lieux créés**, canonique 11 370 → **39 730**, zéro revendiqué touché, registre
intact, prod reflète l'import. Prompt retour §7 rempli ci-dessous.
