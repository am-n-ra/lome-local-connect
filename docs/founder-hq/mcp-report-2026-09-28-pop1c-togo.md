# Rapport MCP — POP-1c vague 0 (Togo) : extrait → dry-run jetable → canonique (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :** `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-world-backfill.md`.
> **Branche :** `omni-v2-rebuild`, HEAD au départ **`40948a0`** (attendu ≥ `40948a0` ✅).
> **Porte lue :** `SPECIES_CLOSED_ROOT_OPEN` (`current-state.md`, jamais inférée). **Aucun secret. Aucun redeploy. Aucune variable.**
> **Canonique identifiée par ses DONNÉES :** `br-dawn-hill-am5amy22` = **206 facilités** au départ.

---

## 0. C0 — Re-vérification hash prod (T-07d, clos définitivement)

| sha | Entrée `deployments` prod | Heure |
|---|---|---|
| `7c6a925` | ✅ `6706842243` | 2026-09-28T09:38:25Z |
| `890e9e9` | ✅ `6707166629` | 2026-09-28T09:56:49Z |
| `453ec94` | ✅ `6707367190` | 2026-09-28T10:08:14Z |
| `688a0ce` | ✅ `6707491029` | 2026-09-28T10:15:23Z |
| `40948a0` | ✅ `6707720365` | 2026-09-28T10:28:53Z |

- **Hash prod === build local** : `index-BGUSIwRj.js` + `index-CBsJf68R.css` (byte-identiques).
- `/api/v2/public/facilities` → **200**, **206** facilités (avant import).
- Routing anonyme → **401 `AUTH_REQUIRED`** ; `operator-import-batch?scope=world` anonyme → **401**.
- **La dette HAUTE « bundles `api/v2/*.js` périmés » de POP-1b est close** par `688a0ce` (régénération committée par HQ).

---

## 1. C1 — Extrait préparé (Geofabrik, PAS de live Overpass)

- **Source :** `download.geofabrik.de/africa/togo-latest.osm.pbf` (62,3 Mo, résolu `togo-260927`), ODbL.
- **Filtre tags :** `shop=*` · `amenity ∈ {restaurant, cafe, fast_food, pharmacy, bank, atm, bar, fuel}` ·
  `craft=*` · `office=*` · `tourism ∈ {hotel, guest_house, hostel}`. Sans pré-filtre qualité (le classifieur trie).
- **Transform :** `scripts/transform-osm-extract.py` (pyosmium, nœuds uniquement) →
  `{sourceRef: "node/<id>", name, category, address, latitude, longitude}`. Attribution conservée
  (le harnais envoie `© OpenStreetMap contributors (ODbL)`).

**Volumétrie Togo :** **16 900** points — **11 183 nommés**, **5 717 sans nom**, **448 avec adresse**.

**Distribution classifiée (classifieur réel, zéro écriture) :**

| Tier | Nombre | Raison |
|---|---|---|
| `quarantine` | **5 670** | `nameless` |
| `world` | **4 146** | `outside-pilot-zone` **4 099** + `nameless-with-address` **47** |
| `pilot` | **7 084** | — |

Scope `world` : admis **11 230** (7 084 pilot + 4 146 world), `skippedQuarantine` **5 670**, `skippedOutOfZone` 0.

---

## 2. C2 — Dry-run sur JETABLE (zéro canonique prouvé)

**Branche jetable :** `pop1c-togo-dryrun` = `br-fragrant-scene-amqvegt9` (depuis canonique),
**supprimée en fin de session** (0 résidu).

**DÉCOUVERTE MAJEURE (C2) — un lot contenant un seul item sans nom est REJETÉ EN BLOC par la route.**
`http.ts` normalise **tout le lot** (`items.map`) **avant** toute écriture : un `name` vide lève
`ApiInputError` → **400 `INVALID_INPUT`**, **zéro** ligne écrite. Or **5 717/16 900 points Togo sont
sans nom**. Conséquence : l'opérateur **doit pré-filtrer les items sans nom AVANT d'appeler la route** —
sinon tout le lot échoue (mais proprement, sans écriture partielle). Le harnais reproduit désormais
cette normalisation à l'identique (`rejectedByNormalization`). **Le `name` non vide est une exigence
de normalisation HTTP, pas seulement du classifieur** : la branche `nameless-with-address → world` est
**inatteignable via la route** (les 47 points concernés sont rejetés avant classification).

**Run complet sur la jetable (16 900 points, scope `world`, concurrence 12) :**

| Mesure | Valeur |
|---|---|
| `rejectedByNormalization` | 5 717 |
| admis | 11 183 |
| `created` | **11 087** |
| `existing` | 96 (77 = smoke-test préalable + 19 = overlap canonique) |
| distinct `sourceRef` / runIds | 11 183 / 11 183 |

**Idempotence prouvée :** rejeu du même lot → `created 0 / existing 77` (dédup `(source_id, source_ref)`).

**Zéro canonique prouvé** (counts canoniques avant = après le run jetable) : 206/203/16/3/202, tier 0.

**Perf `listPublicFacilities` (bounds Lomé, 30 échantillons) :**

| Branche | facilities | p50 | p95 | max | lignes renvoyées |
|---|---|---|---|---|---|
| canonique (baseline) | 206 | 35 ms | **129 ms** | 172 ms | 206 |
| jetable pleine | 11 370 | 50 ms | **171 ms** | 188 ms | **250 (plafond de requête)** |

→ +42 ms de p95 à 11 370 facilités ; la requête est **plafonnée à 250 lignes** (le résultat ne grossit
pas indéfiniment). **Écriture :** p95 **99 ms**/import, run complet 11 183 imports en **89 s** (concurrence 12).

**Arithmétique réconciliée (preuve, pas confiance) :** jetable finale 11 370 = 206 (canonique) + 77
(smoke) + 11 087 (run). `tier_rows` jetable 11 183 ; `tier_world` 4 099 = 4 146 classifiés − **47**
nameless-with-address (rejetés à la normalisation, jamais importés).

---

## 3. C3 — Run canonique vague 0 (Togo)

**Exécution :** via **le chemin d'import livré** (`createTrunkRepository().createPublicFacilityImport`),
composé **exactement comme `http.ts`** (`admitIntakeBatch(scope='world')` puis un import par point admis),
avec le **vrai compte opérateur** (`a82873a0-…`). ⚠️ **Substitution honnête documentée :** aucun JWT
opérateur n'est atteignable dans cet environnement et **un secret ne doit jamais être collé dans le chat**.
Le harnais exerce donc la méthode de dépôt que la route appelle (dedupe/audit/validation **réels**,
garde de rôle opérateur **réelle**), en reproduisant la normalisation d'entrée de la route. **Non exercé
en revanche :** l'authentification JWT, la sérialisation du corps HTTP et le mapping de statut de la
route. C'est la seule substitution de la session.

**Baseline canonique avant (capturée) :** facilities 206 · source_refs 203 · runs 202 ·
`max(created_at)=2026-08-29T16:00:00.413Z` · node_refs 100.

**Résultat (concurrence 12, 90 s) :**

| Mesure | Rapportée |
|---|---|
| admis | 11 183 |
| **created** | **11 164** |
| **existing** | **19** (l'overlap canonique, prédit et mesuré) |
| distinct sourceRef / runIds | 11 183 / 11 183 |
| p95 écriture | 99 ms |

**Vérifications canoniques après :**

| Contrôle | Valeur |
|---|---|
| facilities | **11 370** (206 + 11 164) |
| source_refs | **11 367** (203 + 11 164) |
| produits | **16** (intacts) |
| entités | **3** (intacts) |
| `operator_runs` | 11 366 (202 + 11 164) |
| `raw_metadata.intake_tier` présent | **11 183** (`world` 4 099 · `pilot` 7 084) |
| `unclaimed` / `owned` | 11 364 / **3** (revendiquées non touchées) |
| `account_id is null` | 11 367 |
| registre migrations `044→064` | **0 trou** |
| perf p95 (bounds Lomé) | **153 ms** (avant 129) |
| **prod** `/api/v2/public/facilities` | **250** (= plafond ; ≥250 contre 206 avant) → **reflète l'import** |

**Clause `refreshed` vérifiée (les 19 existants) :** les 19 overlap sont tous `unclaimed` +
`account_id null` + `source_kind='public_import'` → **rafraîchis légitimement** (`updated_at` → 2026-09-28,
`created_at` **inchangé** 2026-08-26). Aucune ligne revendiquée/détenue touchée. **Conforme au contrat.**

**Claim spot-check S-18 :** les nouveaux comme les anciens unclaimed restent
`reachable_by_createClaimDraft` (`account_id null` + `trust_state unclaimed`). **4 099** facilités `world`
sont claimables. Le tier ne donne aucun droit (S-18 intact).

**Échantillon de nouveautés (preuve de réalité) :** de vrais lieux à travers le Togo — ex.
`(GIPATO) Groupement Interprofessionnel des artisans du Togo` (office, lat 7.53), `Bureau association
islamique des jeunes pour la culture` (office, lat 6.92), bars/boutiques jusqu'à lat 9.56.

---

## 4. Findings (constatés en exécutant, pas en lisant)

1. **[HAUTE — opérationnel] Un item sans nom fait échouer TOUT le lot (400) sans rien écrire.**
   L'opérateur doit **pré-filtrer les `name` vides** (5 717/16 900 au Togo). Le lot échoue proprement
   (zéro écriture partielle) mais **bloque le progrès** si le pré-filtre manque. Recommandation : soit
   documenter le pré-filtre dans l'outillage d'import, soit faire ignorer-comptées les items sans nom
   au lieu de rejeter le lot (décision produit, hors périmètre MCP).
2. **[MOYENNE — périmètre] Le scope `world` admet tout nom non vide non-placeholder, à n'importe
   quelle distance du pilote** (Togo entier, lat 6.9→9.6). Conforme à DEC-V2-12 « monde entier »,
   mais le prochain opérateur doit le savoir : la seule exclusion géographique reste la **garde de
   zone pilote au scope `pilot`** (défaut). En `world`, aucune garde géographique.
3. **[BASSE — données] Noms dégénérés admis en `world`** (« 1 », « 112 », « 3F »…). Pas de pré-filtre
   qualité par contrat ; ce sont des noms OSM réels mais pauvres. Dette de données, non bloquante.
4. **[BASSE] 47 points `nameless-with-address`** restent non importables via la route (finding 1).
5. **[INFO] 77 refs canoniques `node/<id>` ne sont PAS dans l'extrait Geofabrik actuel** (query Overpass
   historique plus large) : intacts, **aucun refresh** (conforme au contrat). Les refs legacy `osm-<id>`
   (Overpass) coexistent avec `node/<id>` : **deux conventions** en base.

---

## 5. Rollback (plan écrit, NON exécuté — la vague est saine)

Si rollback de la vague 0 nécessaire : supprimer les `v2_facilities` **créées** par la fenêtre du run
(`created_at > 2026-08-29T16:00:00.413Z` **ET** `account_id is null` **ET** `source_kind='public_import'`
**ET** `trust_state='unclaimed'`), jamais les revendiquées. Ne PAS toucher les 19 rafraîchies (elles
préexistaient). Les `v2_operator_runs` correspondants (fenêtre) seraient supprimés de même.
**Aucune suppression exécutée sans autorisation fondateur.**

---

## 6. Gardes & commits

- `npm run check:state` → **STATE CONSISTENT** ; `npm run check:docs` → **DOCS OK** (avant commit).
- Commit : `scripts/transform-osm-extract.py`, `scripts/prove-pop1c-togo-import.mjs`,
  `scripts/prove-pop1c-perf.mjs`, ce rapport.

---

## 7. STOP après la vague 0

Le handoff impose **l'arrêt après Togo** : les vagues Ouest → Afrique → monde partent sur revue async.
La vague 0 est **saine** (counts conformes au dry-run, zéro revendiqué touché, registre intact, prod
reflète l'import). Prompt retour §7 rempli ci-dessous pour décider la vague Ouest.
