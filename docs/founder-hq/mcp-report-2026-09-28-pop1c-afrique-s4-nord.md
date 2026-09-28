# Rapport MCP — POP-1c-A sous-vague 4 : **Afrique du Nord** — dry-run + runs canoniques (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :**
> `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-s4-nord.md`. **GO :** DEC-V2-21.
> **Branche :** `omni-v2-rebuild`, HEAD de départ `4dc9801` (≥ attendu ✅), porte
> `SPECIES_CLOSED_ROOT_OPEN`. **Aucun secret. Aucun redeploy. Aucune variable.**
> **Canonique** identifiée **par ses données** : `br-dawn-hill-am5amy22` = **278 997** facilités = compte post-S3.
> **Forecast figé AVANT tout run** : `mcp-report-2026-09-28-pop1c-afrique-s4-nord-forecast.md` (commit `6d139ab`, poussé avant runs).

## N0 — Re-vérification hash prod (T-07d)

| Contrôle | Résultat |
|---|---|
| Déploiement GitHub pour HEAD `4dc9801` | **oui** — `6714170507` (Production 2026-09-28T15:44:41Z) |
| Hash prod vs build local | **`index-BGUSIwRj.js` + `index-CBsJf68R.css`** === local (byte-identique) |
| `GET /api/v2/public/facilities` | 200 — n=250 (plafond d'API) |
| routage anonyme | **401** `AUTH_REQUIRED` (contrat intent-lock intact) |

## N2 — Dry-run sur jetable (ZÉRO écriture canonique)

Branche jetable `pop1ca-s4-dryrun` = **`br-green-band-amn0u0ji`** (parent canonique), **supprimée** en fin
(slug non résolu par `list_branches` ⇒ 0 résidu).

| Pays | admis | rejectedByNormalization | quarantine | créés | existants | write p50 | write p95 |
|---|---|---|---|---|---|---|---|
| sudan | 6 383 | **0** | 0 | 6 368 | 15 | 94 | 105 |
| egypt | 11 073 | **0** | 0 | 11 073 | 0 | 93 | 100 |
| libya | 15 452 | **0** | 0 | 15 450 | 2 | 98 | 106 |
| tunisia | 12 264 | **0** | 0 | 12 263 | 1 | 93 | 110 |
| **TOTAL** | **45 172** | **0** | **0** | **45 154** | **18** | ~94 | ~105 |

- **`rejectedByNormalization = 0` PARTOUT** (pré-filtre « nom vide » amont).
- **Quarantine 0 dans les runs** (aucune catégorie `placeholder-no-address` ici, contrairement à la Tanzanie S3).
- **Perf lecture** (jetable pleine, **324 151** lignes) : p50 54–55 ms, **p95 173–183 ms** ≤ 186 (3 passes).
- **ZÉRO-CANONIQUE PROUVÉ** : counts canoniques **IDENTIQUES avant=après** le dry-run
  (facilities 278 997 / source_refs 278 994 / runs 278 993 / max(created_at) 15:06:24.432Z / owned 3).
- **Jetable nettoyée** : pic **324 151** (= forecast exact) puis branche supprimée, 0 résidu vérifié.

### S-18 — claim spot-check (agnostique au tier), sur le jetable

2 lieux neufs `world` (`account_id IS NULL`) : « صيدلية عبشة », « Garage Bilel KIA ». Pour chacun :
`createClaimDraft` → `unclaimed` → **`verification_draft`** (account_id reste NULL) puis
`cancelClaim` → **`unclaimed`** restauré. **PASS**.

## N3 — Runs canoniques (un par pays, `createPublicFacilityImport`, scope=world)

⚠️ **Substitution (la seule)** : pas de JWT opérateur atteignable ⇒ la **sérialisation HTTP → route** n'est
pas exercée ; le script appelle **la méthode exacte du dépôt** avec la **même composition** que `http.ts`
(`admitIntakeBatch(scope='world')` puis 1 import/point), garde de rôle opérateur **réelle**. **Aucune
insertion SQL directe.** Mêmes vagues que S1/S2/S3.

| Pays | admis | créés | existants | quarantine | vs forecast |
|---|---|---|---|---|---|
| sudan | 6 383 | 6 368 | 15 | 0 | = (15 canoniques S3 frontière) |
| egypt | 11 073 | 11 073 | 0 | 0 | = |
| libya | 15 452 | 15 450 | 2 | 0 | = (2 intra egypt\|libya) |
| tunisia | 12 264 | 12 263 | 1 | 0 | = (1 intra libya\|tunisia) |
| **TOTAL** | **45 172** | **45 154** | **18** | **0** | **=** |

**Réconciliation exacte** : 45 172 importables − 3 intra-S4 − 15 canoniques = **45 154 créés** ;
existing 18 = 15 (canonique) + 3 (intra). **Forecast = réel, à l'unité près.**

### Canonique APRÈS (immuable, `br-dawn-hill-am5amy22`)

| Mesure | Valeur |
|---|---|
| `v2_facilities` | **324 151** = 278 997 + **45 154** (= pic jetable exact) |
| `v2_facility_source_refs` | 324 148 |
| `v2_operator_runs` | 324 147 |
| `intake_tier` présent | 324 018 |
| `tier_world` | **313 537** (268 383 → +45 154) |
| `tier_pilot` | **10 481** (inchangé) |
| unclaimed | 324 145 |
| **owned (revendiquées)** | **3** — **NON touchées** |
| `v2_products` / `v2_entities` | **16 / 3** — intacts |
| `max(created_at)` | 2026-09-28T16:11:44.959Z |
| Perf canonique p50 / p95 (N=120) | **55 ms / 60 ms** ≤ 186 (1 outlier froid 210) |
| Prod `facilities` / routage | 250 (plafond) / **401** |
| Registre `omni_schema_migrations` 044→064 | **21 fichiers, 0 TROU** |

**Dédup `(source_id, source_ref)`** : les 18 « existing » sont **tous** des chevauchements intra-S4 **ou**
canoniques S3 frontière (Soudan : Metema/Immigration/UNISFA/Moudeïna, créés 2026-09-28T15:03–15:04Z
par S3 Éthiopie/Soudan-du-Sud). **Zéro doublon créé.**

## Rollback

`docs/founder-hq/mcp-rollback-plan-2026-09-28-pop1c-afrique-s4-nord.md` — **écrit AVANT N3, NON exécuté**
(fenêtre, garde « 0 revendiquée », exclusion des 18 nœuds frontaliers pré-existants, cible retour à 278 997).
Même voie que S1/S2/S3 (procédure, pas action ; DEC-V2-18…20).

## Interdits respectés

Pas de SQL d'insertion directe · pas de live Overpass · pas de sous-vague suivante (Australe) lancée ·
pas de réécriture hors `refreshed` · pas de promesse de stock/transactabilité · pas de changement
d'API · aucun secret/redeploy/variable.

## Point ouvert (décision fondateur)

**Maroc + Algérie** ne sont nommés dans **aucune** sous-vague (le handoff S4 liste Soudan/Égypte/Libye/
Tunisie). La **Mauritanie** est déjà en S1. **Signalé, pas décidé.** À rattacher (S4-bis ? Australe ?)
ou déclarer hors périmètre.

**Preuves falsifiables** : forecast committé **avant** runs (`6d139ab`, poussé avant N2/N3) ;
zéro-canonique prouvé par counts avant=après ; dry-run ≡ canonique **au bit près** (45 154/18 les
deux) ; écarts forecast **expliqués un par un** (18 = 15 canoniques S3 + 3 intra, vérifiés).
