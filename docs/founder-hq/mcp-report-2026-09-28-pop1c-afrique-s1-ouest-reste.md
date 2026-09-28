# Rapport MCP — POP-1c-A sous-vague 1 : **Ouest restante** (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :** `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-backfill.md`.
> **Branche :** `omni-v2-rebuild`, HEAD au départ **`bad3dca`**. **Porte :** `SPECIES_CLOSED_ROOT_OPEN`.
> **Aucun secret. Aucun redeploy. Aucune variable.** Canonique identifiée **par ses données** (`br-dawn-hill-am5amy22`).

---

## A0 — Re-vérification hash prod (T-07d)

- Entrée `deployments` pour `bad3dca` : **`6708913238`** (Production, 2026-09-28T11:37:36Z) ; antérieurs `fd12e1c 6708741924` (11:28Z), `866aef4 6708619999` (11:21Z).
- **Hash prod === build local** : `index-BGUSIwRj.js` + `index-CBsJf68R.css`.
- `/api/v2/public/facilities` → **200** (250 = plafond). Routing anonyme → **401 AUTH_REQUIRED**. Route batch `POST /api/v2/public/facilities?action=operator-import-batch&scope=world` → **401**.

## A1 — FORECAST (écrit AVANT tout run canonique)

**Sous-vague 1 = « Ouest restante »** (11 extraits Geofabrik, tous Last-Modified 2026-09-27) :
Nigeria · Sénégal+Gambie · Mali · Guinée · Côte d'Ivoire · Sierra Leone · Liberia · Guinée-Bissau · Cap-Vert · Mauritanie · Niger.

| Pays | matched | importable | pré-filtrés (nom vide) | pilot | world | quarantine |
|---|---|---|---|---|---|---|
| nigeria | 30 121 | 6 536 | 23 585 | 0 | 6 605 | 23 516 |
| senegal-and-gambia | 14 825 | 10 305 | 4 520 | 0 | 10 396 | 4 429 |
| mali | 12 102 | 10 013 | 2 089 | 0 | 10 246 | 1 856 |
| guinea | 5 233 | 4 592 | 641 | 0 | 4 706 | 527 |
| ivory-coast | 46 204 | 34 666 | 11 538 | 0 | 34 711 | 11 493 |
| sierra-leone | 2 036 | 1 633 | 403 | 0 | 1 850 | 186 |
| liberia | 5 543 | 3 127 | 2 416 | 0 | 5 448 | 95 |
| guinea-bissau | 374 | 275 | 99 | 0 | 277 | 97 |
| cape-verde | 2 320 | 1 945 | 375 | 0 | 1 948 | 372 |
| mauritania | 2 903 | 1 352 | 1 551 | 0 | 1 473 | 1 430 |
| niger | 4 909 | 3 891 | 1 018 | 0 | 3 921 | 988 |
| **TOTAL** | **126 570** | **78 335** | **48 235** | **0** | **81 581** | **44 989** |

**Lecture du forecast :** ~78 335 lieux **importables** (nom non vide), **2,75×** la vague Ouest (28 479).
`pilot = 0` partout (aucun point dans la boîte 1.0–2.45 E / 5.85–6.5 N — cohérent). Quarantine dominée par
les **sans-nom** ; le pré-filtre du transform les écarte du payload (le 400 batch-reject reste le contrat API).
**Attendu canonique :** `created ≈ importable − existing`, soit **~78 000** nouvelles facilités → canonique
39 730 → **~118 000**. Perf attendue : p95 ~100 ms en écriture, lecture plafonnée 250 lignes (réf. 166 ms).

**Forecast figé le 2026-09-28 avant A2/A3** (ce commit est la preuve qu'il précède les runs).

---

## A2 — Dry-run par sous-vague sur JETABLE (ZÉRO écriture canonique)

**Jetable :** `pop1ca-s1-dryrun` = `br-wispy-heart-amjv116k` (depuis canonique), **supprimée** en fin de session (0 résidu vérifié, cf. A2 fin).

| Pays | input | rejNorm | admis | quarantine | created | existing | p95 |
|---|---|---|---|---|---|---|---|
| nigeria | 6 536 | 0 | 6 536 | 0 | 6 526 | 10 | — |
| senegal-and-gambia | 10 305 | 0 | 10 305 | 0 | 10 305 | 0 | — |
| mali | 10 013 | 0 | 10 013 | 0 | 10 009 | 4 | — |
| guinea | 4 592 | 0 | 4 592 | 0 | 4 588 | 4 | — |
| ivory-coast | 34 666 | 0 | 34 666 | 0 | 34 614 | 52 | — |
| sierra-leone | 1 633 | 0 | 1 633 | 0 | 1 626 | 7 | — |
| liberia | 3 127 | 0 | 3 127 | 0 | 3 053 | 74 | — |
| guinea-bissau | 275 | 0 | 275 | 0 | 275 | 0 | — |
| cape-verde | 1 945 | 0 | 1 945 | 0 | 1 945 | 0 | — |
| mauritania | 1 352 | 0 | 1 352 | 0 | 1 303 | 49 | — |
| niger | 3 891 | 0 | 3 891 | 0 | 3 880 | 11 | — |
| **TOTAL** | **78 335** | **0** | **78 335** | **0** | **78 124** | **211** | ~100 ms écriture |

`rejectedByNormalization = 0` partout ⇒ **le pré-filtre « name vide » fonctionne** (aucun item sans nom n'atteint la route).

**ZÉRO-CANONIQUE PROUVÉ :** counts canoniques 39 730 / 39 727 / 39 726 / `max_created_at` 11:18:47 **identiques avant = après** les 11 dry-runs.

**Jetable au pic :** facilities **117 854** (= pic canonique attendu), source_refs 117 851, unclaimed 117 848, owned 3.

**Perf `listPublicFacilities` (bounds Lomé, 30 éch.) :** jetable pleine **117 854** → p50 55 / **p95 177 ms** (réf. 166 ms = +6,6 %, plafond 250 lignes ⇒ **pas de dégradation significative non plafonnée**).

**A2 fin :** jetable `br-wispy-heart-amjv116k` **supprimée** (§4 du présent rapport — preuve de suppression via `list_branches` en fin de session).

---

## A3 — Runs canoniques (un par sous-vague, chemin d'import livré)

**Méthode :** `createTrunkRepository().createPublicFacilityImport`, composition identique à `http.ts`
(`admitIntakeBatch(scope='world')` puis un import par point), **garde de rôle opérateur RÉELLE**
(compte `a82873a0-…`). ⚠️ **Substitution honnête** (mêmes vagues 0/Ouest) : aucun JWT opérateur atteignable
et un secret ne se colle jamais dans le chat → **l'authentification JWT / sérialisation HTTP / mapping de
statut de la route ne sont PAS exercés**. Seule substitution de la session.

**Baseline canonique avant :** facilities 39 730 · source_refs 39 727 · runs 39 726 · `max(created_at)=2026-09-28T11:18:47.416Z`.

**Résultats (IDENTIQUES au dry-run, pays par pays) :** created **78 124**, existing **211**, admis 78 335.

**Counts canoniques après :**

| Contrôle | Valeur |
|---|---|
| facilities | **117 854** = 39 730 + 78 124 ✅ (= pic jetable exact) |
| source_refs | **117 851** |
| produits / entités | **16 / 3** (intacts) |
| `operator_runs` | 117 850 |
| `unclaimed` / `owned` | 117 848 / **3** (revendiquées NON touchées) |
| `intake_tier` présent | **117 721** (world **107 240** / pilot **10 481** inchangé) |
| registre migrations `044→064` | **0 trou** |
| perf p95 | **186 ms** (plafond 250 lignes) |
| prod `/api/v2/public/facilities` | **250** (plafond) → reflète l'import |

**`existing = 211` réconcilié (preuve, pas confiance) :** 148 chevauchements **intra-S1** (nœuds de frontière
présents dans 2 extraits, ex. senegal∧mauritania 46, guinea∧liberia 40, sierra-leone∧liberia 28,
nigeria∧niger 7…) **+ 63** nœuds déjà au canonique via Togo/Ouest (importables Ouest ∩ S1 = 63).
148 + 63 = **211** exact. Dédup `(source_id, source_ref)` ⇒ **1 seule ligne, ZÉRO doublon**.

**Claim spot-check S-18 :** 2 lieux neufs `world` (`Quincaillerie` Mali lat 14.45 lng −11.44 ;
`Salon de coiffure` Côte d'Ivoire lat 5.79 lng −6.58) = `account_id null` + `unclaimed` → joignables par
`createClaimDraft`. **117 848** claimables. Le tier ne donne aucun droit (S-18 intact).

---

## Rollback plan — sous-vague 1 Ouest restante (écrit, NON exécuté)

Par **pays**, supprimer les `v2_facilities` **créées** dans la fenêtre S1 :
`created_at > '2026-09-28T11:18:47.416Z'` **ET** `account_id is null` **ET** `source_kind='public_import'`
**ET** `trust_state='unclaimed'` ; **ne PAS toucher** les 211 rafraîchies (elles préexistaient) ni les 3
revendiquées. Supprimer de même les `v2_operator_runs` de la fenêtre. **Aucune suppression exécutée sans
ordre séparé.** (Écrit en fin de session, après A3 — la contrainte « forecast avant run » d'A1 est, elle,
prouvée par le commit `eb56227` ; le plan de rollback est une procédure, pas une action.)

---

## Findings (constatés en exécutant)

1. **[INFO] Nigeria et Mauritanie : pré-filtrage »nom vide« très élevé** — Nigeria 23 585/30 121
   (78 % sans nom), Mauritanie 1 551/2 903 (53 %). Côte d'Ivoire pèse à lui seul 34 666 importables
   (44 % de la sous-vague). Aucune anomalie, mais la volumétrie OSM est très inégale par pays.
2. **[BASSE] `pilot = 0` sur toute la sous-vague** — cohérent (aucun point dans la boîte 1.0–2.45 E /
   5.85–6.5 N), confirme que la boîte est bien « Lomé + franges », pas une zone Afrique.
3. **[INFO] 211 « existing » entièrement réconciliés** (148 frontières intra-S1 + 63 chevauchement
   Togo/Ouest) — aucun doublon, dedup `(source_id, source_ref)` du canal livré vérifié à l'échelle.
4. **[INFO] Perf : 117 854 lignes, p95 186 ms** (+12 % vs référence 166 ms) mais **plafonnée 250 lignes**
   ⇒ pas de dégradation non plafonnée ; la borne `limit 250` est le vrai garde-fou.

---

## Gardes & commits

- `check:state` + `check:docs` verts avant commit.
- `eb56227` — forecast S1 figé AVANT runs (méthode + preuve d'ordre).
- `(ce commit)` — rapport S1 A2/A3 + rollout.

## STOP — fin de sous-vague 1

Conforme au handoff : **arrêt après « Ouest restante »**, pas de sous-vague Centrale sans ce rapport écrit.
Totalité S1 : **78 124 lieux créés**, canonique 39 730 → **117 854**, 0 revendiqué touché, registre intact,
prod reflète l'import. Sous-vagues restantes (Centrale → Est → Nord → Australe) : **non lancées**.


