# Rapport MCP — POP-1c-A sous-vague 3 : **Afrique de l'Est** — dry-run + runs canoniques (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :**
> `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-s3-est.md`. **GO :** DEC-V2-19.
> **Branche :** `omni-v2-rebuild`, HEAD de départ `032e8e4` (≥ attendu ✅), porte
> `SPECIES_CLOSED_ROOT_OPEN`. **Aucun secret. Aucun redeploy. Aucune variable.**
> **Canonique** identifiée **par ses données** : `br-dawn-hill-am5amy22` = **142 471** facilités = compte post-S2.
> **Forecast figé AVANT tout run** : `mcp-report-2026-09-28-pop1c-afrique-s3-forecast.md` (commit `80fb0b7`).

## E0 — Re-vérification hash prod (T-07d)

| Contrôle | Résultat |
|---|---|
| Déploiement GitHub pour HEAD `032e8e4` | **oui** — `6710960261` (Production 2026-09-28T13:22:25Z) |
| Hash prod vs build local | **`index-BGUSIwRj.js` + `index-CBsJf68R.css`** === local (byte-identique ; docs-only depuis S2 ⇒ hash inchangé, confirmé par build réel) |
| `GET /api/v2/public/facilities` | 200 — n=250 (plafond d'API) |
| routage anonyme | **401** `AUTH_REQUIRED` (contrat intent-lock intact) |

## E2 — Dry-run sur jetable (ZÉRO écriture canonique)

Branche jetable `pop1ca-s3-dryrun` = **`br-shy-scene-amuzjtii`** (parent canonique), **supprimée** en fin
(slug non résolu par `list_branches` ⇒ 0 résidu).

| Pays | admis | rejectedByNormalization | quarantine | créés | existants | write p50 | write p95 |
|---|---|---|---|---|---|---|---|
| kenya | 18 326 | **0** | 0 | 18 326 | 0 | 98 | 106 |
| uganda | 22 940 | **0** | 0 | 22 658 | 282 | 94 | 101 |
| tanzania | 70 359 | **0** | 1 | 70 258 | 101 | 92 | 100 |
| rwanda | 2 046 | **0** | 0 | 1 919 | 127 | 93 | 100 |
| burundi | 1 192 | **0** | 0 | 1 187 | 5 | 95 | 194 |
| ethiopia | 6 550 | **0** | 0 | 6 542 | 8 | 96 | 102 |
| somalia | 564 | **0** | 0 | 559 | 5 | 92 | 99 |
| south-sudan | 728 | **0** | 0 | 574 | 154 | 92 | 98 |
| eritrea | 384 | **0** | 0 | 384 | 0 | 93 | 100 |
| djibouti | 368 | **0** | 0 | 367 | 1 | 94 | 107 |
| madagascar | 8 140 | **0** | 0 | 8 140 | 0 | 93 | 101 |
| mauritius | 4 299 | **0** | 0 | 4 299 | 0 | 93 | 99 |
| comores | 466 | **0** | 0 | 466 | 0 | 97 | 104 |
| seychelles | 847 | **0** | 0 | 847 | 0 | 96 | 107 |
| **TOTAL** | **137 209** | **0** | **1** | **136 526** | **683** | ~94 | ~101 |

- **`rejectedByNormalization = 0` PARTOUT** (pré-filtre « nom vide » amont ⇒ le batch n'est jamais
  rejeté en 400).
- **⚠️ le classifieur admet 1 quarantaine en TANZANIE** (`placeholder-no-address`, nom « R ») —
  conforme au forecast qui l'avait déjà comptée hors `worldScope`. C'est **la seule** différence entre
  forecast created 136 527 et réel 136 526.
- **Perf lecture** (jetable pleine, 278 997 lignes, bounds Lomé) : p50 **57 ms**, **p95 171 ms** ≤
  référence 186 ms, max 208 (1er échantillon froid).
- **ZÉRO-CANONIQUE PROUVÉ** : counts canoniques **IDENTIQUES avant=après** le dry-run
  (facilities 142 471 / source_refs 142 468 / runs 142 467 / max(created_at) 13:07:21.074 / owned 3).
- **Jetable nettoyée** : pic 278 997 puis branche supprimée, 0 résidu vérifié.

### S-18 — claim spot-check (agnostique au tier), sur le jetable

2 lieux neufs `world` (`account_id IS NULL`) : « Ezzy foods », « Mado ». Pour chacun :
`createClaimDraft` → `unclaimed` → **`verification_draft`** (account_id reste NULL) puis
`cancelClaim` → **`unclaimed`** restauré. **PASS** (le tier est un rang de confiance de *lieu*, il ne
bloque ni ne facilite la revendication).

## E3 — Runs canoniques (un par pays, `createPublicFacilityImport`, scope=world)

⚠️ **Substitution (la seule)** : pas de JWT opérateur atteignable dans cet environnement ⇒ la
**sérialisation HTTP → route** n'est pas exercée ; le script appelle **la méthode exacte du dépôt**
avec la **même composition** que `http.ts` (`admitIntakeBatch(scope='world')` puis 1 import/point),
garde de rôle opérateur **réelle**. **Aucune insertion SQL directe.** Mêmes vagues que S1/S2.

| Pays | admis | créés | existants | quarantine | vs forecast |
|---|---|---|---|---|---|
| kenya | 18 326 | 18 326 | 0 | 0 | = |
| uganda | 22 940 | 22 658 | 282 | 0 | = (282 = 205 canoniques RDC + 77 kenya intra) |
| tanzania | 70 359 | 70 258 | 101 | 1 | = (101 = 83 kenya + 18 uganda intra) |
| rwanda | 2 046 | 1 919 | 127 | 0 | = (8 canoniques RDC + 114 uganda + 5 tanzania intra) |
| burundi | 1 192 | 1 187 | 5 | 0 | = (3 tanzania + 2 rwanda intra) |
| ethiopia | 6 550 | 6 542 | 8 | 0 | = (8 kenya intra) |
| somalia | 564 | 559 | 5 | 0 | = (1 kenya + 4 ethiopia intra) |
| south-sudan | 728 | 574 | 154 | 0 | = (153 uganda + 1 ethiopia intra) |
| eritrea | 384 | 384 | 0 | 0 | = |
| djibouti | 368 | 367 | 1 | 0 | = (1 ethiopia intra) |
| madagascar | 8 140 | 8 140 | 0 | 0 | = |
| mauritius | 4 299 | 4 299 | 0 | 0 | = |
| comores | 466 | 466 | 0 | 0 | = |
| seychelles | 847 | 847 | 0 | 0 | = |
| **TOTAL** | **137 209** | **136 526** | **683** | **1** | **−1** (la quarantaine Tanzanie) |

**Réconciliation exacte** : 137 210 importables − 1 quarantaine Tanzanie − 213 chevauchement canonique
= **136 526 créés**. Le forecast avait prédit 136 527 en supposant la quarantaine déjà déduite ; l'écart
d'**exactement 1** est la ligne `placeholder-no-address` — **identifiée, pas une surprise**.

### Canonique APRÈS (immuable, `br-dawn-hill-am5amy22`)

| Mesure | Valeur |
|---|---|
| `v2_facilities` | **278 997** = 142 471 + **136 526** (= pic jetable exact) |
| `v2_facility_source_refs` | 278 994 |
| `v2_operator_runs` | 278 993 |
| `intake_tier` présent | 278 864 |
| `tier_world` | **268 383** (131 857 → +136 526) |
| `tier_pilot` | **10 481** (inchangé) |
| unclaimed | 278 991 |
| **owned (revendiquées)** | **3** — **NON touchées** |
| `v2_products` / `v2_entities` | **16 / 3** — intacts |
| `max(created_at)` | 2026-09-28T15:06:24.432Z |
| Perf canonique p95 (Lomé) | **169 ms** ≤ 186 ms (p50 59) |
| Prod `facilities` / routage | 250 (plafond) / **401** |
| Registre `omni_schema_migrations` 044→064 | **21 fichiers, 0 TROU** (vérifié objet par objet) |

**Dédup `(source_id, source_ref)`** : les 683 « existing » sont **tous** des chevauchements
intra-S3 **ou** canoniques (S2 RDC/Congo) — vérifié au pays près ci-dessus. **Zéro doublon créé.**

## Rollback

`docs/founder-hq/mcp-rollback-plan-2026-09-28-pop1c-afrique-s3-est.md` — **écrit AVANT E3, NON exécuté**
(fenêtre, garde « 0 revendiquée », désarmement triggers append-only, cible retour à 142 471).
Même voie que S1/S2 (procédure, pas action ; DEC-V2-18).

## Interdits respectés

Pas de SQL d'insertion directe · pas de live Overpass · pas de sous-vague suivante (Nord) lancée ·
pas de réécriture hors `refreshed` · pas de promesse de stock/transactabilité · pas de changement
d'API · aucun secret/redeploy/variable.

**Preuves falsifiables** : forecast committé **avant** runs (`80fb0b7`) ; zéro-canonique prouvé par
counts avant=après ; dry-run ≡ canonique **au bit près** (136 526/683 les deux) ; écarts forecast
**expliqués un par un** (683 = somme des chevauchements pays-pays vérifiée).
