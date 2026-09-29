# Rapport MCP — Preuves live 2026-09-29 (claim-by-osm-ref · read-paths · T-07d)

> **Session MCP.** Handoff : `docs/founder-hq/mcp-handoff-2026-09-29-proofs-claim-viewport-ri.md`.
> **Branche :** `omni-v2-rebuild` (HEAD d'entrée `6aaa6f7`). Canonique `br-dawn-hill-am5amy22`
> identifiée **par ses données** (`v2_facilities = 13 744`). **Aucun secret · redeploy · variable ·
> migration.** Écritures uniquement sur branche jetable (supprimée).
>
> **Résultat : MCP-1 ✅ ALL PASS · MCP-2 ✅ 32/32 — APRÈS CORRECTION D'UN BUG PROD (voir §MCP-2) ·
> MCP-3 ✅.**

---

## MCP-1 — Preuve live claim-by-osm-ref (branche jetable) ✅

1. Canonique : `select count(*) from v2_facilities` → **13 744** ✅ (ordre de grandeur attendu).
2. Branche jetable `claim-proof-20260929` (`br-polished-fog-amulqamo`) créée depuis la canonique
   (13 744 facilités copiées + `v2_public_sources` openstreetmap = 1).
3. `CLAIM_PROOF_ALLOW_DISPOSABLE_BRANCH=1 CLAIM_PROOF_DATABASE_URL=<jetable> npx tsx
   scripts/prove-v2-claim-by-osm-ref.mjs` → **`claim-proof: ALL PASS`**.

| Test | Résultat | Détail observé |
|---|---|---|
| **T1** référence inédite → matérialise + draft | **PASS** | `created=true materialized=true state=draft version=1` ; ligne `public_import/openstreetmap/node/9031884`, `trust_state=verification_draft`, `account_id=null`, 1 source_ref |
| **T1** metadata origine tuile | **PASS** | `origin=claim-on-sight`, `provider=openstreetmap`, `intake_tier=pilot` (aucun appel OSM) |
| **T2** replay même draft | **PASS** | `created=false materialized=false`, même `requestId`, `drafts=1` (pas de doublon) |
| **T3** 2ᵉ claimant refusé | **PASS** | `duplicate key … "v2_one_active_claim_per_facility"` ; `drafts=1` (aucun 2ᵉ draft) |
| **T4** importé résolu sans matérialiser | **PASS** | `resolved=true created=true materialized=false` |
| **T5** owned refusé | **PASS** | « The facility is unavailable for a claim or already claimed by another account. » |
| **T6** référence invalide rejetée | **PASS** | `osmType='planet'` rejeté avant tout SQL |

4. Résidu vérifié sur la jetable : `name like '%Preuve %'` → **0** ; `v2_accounts.auth_user_id
   like 'claim-%'` → **0**. (`v2_verification_requests` = 5 **identiques à la canonique**, datées
   2026-08-24…09-08 : copies pré-existantes, **pas** du résidu ; `source_refs=13 741` et
   `facilities=13 744` = état canonique.)
5. Branche `br-polished-fog-amulqamo` **supprimée** ; `list_branches(search=claim-proof)` → **[]**.

## MCP-2 — Harnais read-paths ✅ (32/32 APRÈS correction)

- `ROOT_READ_PATH_DATABASE_URL=<canonique> npx tsx scripts/prove-root-read-paths.mjs`.
- **PREMIER run : 31/32 — FAIL** : `transitionSellerProduct (publication gate compiles)` →
  `column "position_kind" does not exist` (erreur Postgres réelle, pas un rejet-politique).

### ⚠️ BUG DE PRODUCTION trouvé et corrigé (R-I handover `fb4f03f`)

- **Symptôme** : le harnais compte **32** chemins (pas 29 : les tranches 2cdd3c0→0e49a5a en ont
  ajouté), et le 32ᵉ échoue.
- **Cause racine** : `fb4f03f` a ajouté la branche `publication_block`
  `when (select position_kind from owned) = 'immaterielle' and … then 'HANDOVER_INCOHERENT'`
  **sans ajouter `p.position_kind` au `select` du CTE `owned`**. Postgres rejette l'instruction
  **entière** à la compilation → **CHAQUE appel `transitionSellerProduct` échoue** : **aucun
  vendeur ne peut publier ni archiver une offre**. Le test unitaire `trunk-repository.test.ts`
  passe car le `sql` y est **stubbé** (aucun SQL compilé) — c'est la classe exacte que le harnais
  réel est fait pour attraper.
- **Correctif** (`src/server/trunk-repository.ts`, CTE `owned`) : ajout de `p.position_kind,`
  (commenté, lié au harnais). `position_kind` n'est **pas** exigé (D-RH-8) mais la branche le **lit**.
- **Après correctif : `32/32 read paths answered … RESULT: PASS`** (le chemin renvoie désormais
  `FORBIDDEN_OR_LIMIT_REACHED` = preuve que l'instruction compile **et** tourne).

### Garde statique durable ajoutée

`src/server/cte-column-completeness.test.ts` — même famille que `group-by-completeness.test.ts`
(bug prod RB-PROD-3) : pour chaque CTE `with <n> as (select …)` et chaque référence
`(select <col> from <n>)`, `<col>` doit être une colonne de sortie du CTE. **Falsifié** :
omission restaurée → **FAIL** avec
`"(select position_kind from owned)" reads a column the "owned" CTE does not output` ;
correctif restauré → **PASS (2/2)**.

- Non-régression : **664/664 tests** (avant 662), `tsc` clean, `check:boundary`/`state`/`docs`
  verts, build OK, **12 bundles serverless régénérés** (commit source+bundles ensemble, leçon
  `9c3f5d8`).

## MCP-3 — T-07d déploiements (Vercel) ✅

1. **4 SHAs déployés en Production (GitHub API, `meta.githubCommitSha`)** :

| SHA | Déploiement | Créé | Statut |
|---|---|---|---|
| `ec4d2f5` (R-I condition) | `6740025900` | 2026-09-29T16:31:20Z | **success** ✅ |
| `fb4f03f` (R-I handover) | `6740160434` | 2026-09-29T16:37:24Z | **success** ✅ |
| `0e49a5a` (harnais) | `6742025384` | 2026-09-29T18:11:20Z | **success** ✅ |
| `a43a9c2` (docs) | `6740448247` | 2026-09-29T16:51:23Z | **success** ✅ |

   (Le plus récent déployé est `6aaa6f7` @ 18:23:33Z, le handoff docs.)
2. **Alias servi** : `GET /v4/aliases/omni.sparkafrika.online` **non appelable** — aucun jeton
   Vercel disponible en session (pas de `VERCEL_TOKEN`, pas de CLI). L'alias est **inféré du bundle
   servi** : `index-DitKQXaO.js` (sha256 `210fac8688cde3d0e9f4cd1d…`), qui correspond au pin T-07d
   du commit `a43a9c2`. Le bundle servi est donc celui des tranches testées.
3. **Chaînes sur le bundle servi** (`/assets/index-DitKQXaO.js`, 2 244 235 o) :
   `Mise à jour de la vue` **1** ✅ · `Retrait impossible` **1** ✅ · `HANDOVER_INCOHERENT` **1** ✅ ·
   `OCCASION_DETAIL_REQUIRED` **1** ✅ (+ phrase `Décrivez l'état de cette occasion` **1**).
   ⚠️ La chaîne littérale attendue `État de l'occasion` = **0** : elle n'existe **pas** dans le
   source — le libellé R-I réel est « **Décrivez l'état de cette occasion…** ». **La surface est
   déployée** ; c'est le libellé attendu qui était inexact (aucun gap produit).
4. **Secrets côté client** : `MAPBOX_ACCESS_TOKEN` **0** · `OSRM_BASE_URL` **0** · `access_token`
   **0** ✅ (le routage ne fuit jamais).
5. **Spot-check routes (sans session)** :
   - `POST /api/v2/facilities?action=claim-by-osm-ref` → **HTTP 401** `AUTH_REQUIRED` ✅
     (route déployée + garde).
   - `GET /api/v2/public/facilities` → **HTTP 200**, 250 lignes, `existenceLevel` présent ✅.
   - Ordre **nearest-first** (viewport `west/south/east/north`) : `?west=1.15&south=6.05&east=1.30&north=6.25`
     → **0 inversion / 249** (premières distances 0,15 · 0,15 · 0,19 · 0,19 km) ✅.
     *(Les params `bounds=` sont ignorés — le format réel est `west/south/east/north`.)*

## Rollback / sûreté

- Jetable supprimée (aucun résidu). **Aucune écriture canonique** (read-paths = lecture seule ;
  claim = jetable). Aucune migration, aucun secret, aucune variable, aucun redeploy manuel.

## Gaps / décisions demandées

1. **(HAUTE — corrigé ici)** `transitionSellerProduct` cassé en prod depuis `fb4f03f` (publication
   ET archivage vendeur impossibles). Corrigé + garde statique. **À déployer** (ce commit).
2. **(Basse)** Jeton Vercel absent → `GET /v4/aliases/…` non vérifiable ; alias inféré du hash
   servi (`index-DitKQXaO.js` = pin `a43a9c2`). Si une vérification d'alias stricte est exigée,
   fournir un jeton Vercel à portée limitée (à révoquer après usage).
3. **(Basse)** Le handoff annonçait « 29/29 » ; le harnais en compte **32** (chemins ajoutés par
   les tranches). Le rapport du harnais est la référence.
