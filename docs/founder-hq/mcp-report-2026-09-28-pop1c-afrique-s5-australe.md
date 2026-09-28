# Rapport MCP final — POP-1c-A sous-vague 5 : **Afrique australe** (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :**
> `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-s5-australe.md`. **GO :** DEC-V2-23.
> **Branche :** `omni-v2-rebuild`. **Porte :** `SPECIES_CLOSED_ROOT_OPEN`.
> **Aucun secret · aucun redeploy · aucune variable · aucune migration.**
> Canonique `br-dawn-hill-am5amy22` identifiée **par ses données** (324 151 = post-S4).

---

## U0 — Re-vérification prod (T-07d)

| Contrôle | Résultat |
|---|---|
| HEAD local | `e2e5c7f` (≥ attendu `e2e5c7f` ✅) |
| Déploiement GitHub pour HEAD | `6715254218` @ `2026-09-28T16:36:26Z` ✅ |
| `sha256(index-BGUSIwRj.js)` prod | `dd1a1c7f39f3f2b7…` |
| `sha256(dist local)` | `dd1a1c7f39f3f2b7…` → **=== local (T-07d ✅)** |
| `GET /api/v2/public/facilities` | **HTTP 200**, 250 lignes |
| `GET /api/v2/public/routing` | **HTTP 401 AUTH_REQUIRED** (inchangé) |

## U1 — FORECAST (figé avant tout run, commit `a05ad9f`)

9 extraits Geofabrik australe (**4 nommés + Angola, Namibie, Botswana, Afrique-du-Sud+Lesotho,
Eswatini**) : **73 173 matched / 62 301 importables / 10 872 pré-filtrés (nom vide)**.
Tiers **pilot 0 / world 63 480 / quarantine 9 693**. Chevauchements **360 intra-S5 (14 paires,
namibia|botswana 80 en tête)** + **177 canoniques** (malawi 91 s3:tanzania, zambia 64, mozambique 15,
angola 8 — tous **nœuds de frontière S2/S3** créés 13:05–13:06Z, `source_id c698af14…`, vérifiés en base).
Maroc/Algérie **EXCLUS** (arbitrage séparé). Détail : `mcp-report-2026-09-28-pop1c-afrique-s5-forecast.md`.

## U2 — Dry-run sur branche jetable (`br-gentle-waterfall-am5xtzy3`, depuis la canonique)

| Pays | admis | rejNorm | quarantine | créés | existants |
|---|---|---|---|---|---|
| malawi | 2 226 | 0 | 0 | 2 135 | 91 |
| mozambique | 3 345 | 0 | 0 | 3 308 | 37 |
| zambia | 4 220 | 0 | 0 | 4 156 | 64 |
| zimbabwe | 3 101 | 0 | 0 | 3 035 | 66 |
| angola | 7 023 | 0 | 0 | 7 015 | 8 |
| namibia | 3 987 | 0 | 0 | 3 940 | 47 |
| botswana | 1 972 | 0 | 0 | 1 839 | 133 |
| south-africa-and-lesotho | 36 048 | 0 | 0 | 35 962 | 86 |
| swaziland | 379 | 0 | 0 | 376 | 3 |
| **TOTAL** | **62 301** | **0** | **0** | **61 766** | **535** |

- **Créés 61 766 = forecast exact.** Existants **535 = 358 intra-S5 + 177 canoniques**, prévus.
- **Zéro rejet de normalisation, zéro quarantaine** (payload nommé).
- **Perf (N=40, bounds Lomé)** : p50 54 ms, **p95 165 ms**, max 335 ms (1 outlier froid) — **sous le
  plafond 186 ms** (S4 : p95 60 ms). Le volume de 385 k lignes n'aggrave pas la latence géo bornée.
- **Pic jetable 385 917** = 324 151 + 61 766 (forecast exact).
- **Zéro canonique PROUVÉ pendant le dry-run** : canonique restait **324 151**, `max_created_at`
  **16:11:44.959Z inchangé** (aucune écriture canonique).
- **S-18 spot-check** (tier-agnostique) sur la jetable : draft → `verification_draft/account_id null`,
  cancel → `unclaimed/account_id null`. **PASS**.
- **Jetables nettoyées** : `br-gentle-waterfall-am5xtzy3` **supprimée**, 0 résidu (vérifié).

## U3 — Runs canoniques (un par pays, `scope=world` via la composition de route réelle)

`scripts/prove-pop1c-togo-import.mjs` (admission `admitIntakeBatch(scope='world')` — **pas de SQL direct**),
opérateur `a82873a0…`, label `s5-<pays>`, concurrency 12.

| Pays | admis | rejNorm | quarantine | créés | existants |
|---|---|---|---|---|---|
| malawi | 2 226 | 0 | 0 | 2 135 | 91 |
| mozambique | 3 345 | 0 | 0 | 3 308 | 37 |
| zambia | 4 220 | 0 | 0 | 4 156 | 64 |
| zimbabwe | 3 101 | 0 | 0 | 3 035 | 66 |
| angola | 7 023 | 0 | 0 | 7 015 | 8 |
| namibia | 3 987 | 0 | 0 | 3 940 | 47 |
| botswana | 1 972 | 0 | 0 | 1 839 | 133 |
| south-africa-and-lesotho | 36 048 | 0 | 0 | 35 962 | 86 |
| swaziland | 379 | 0 | 0 | 376 | 3 |
| **TOTAL** | **62 301** | **0** | **0** | **61 766** | **535** |

**Canonique après (mesuré en base) :**

| Mesure | Avant | Après | Δ |
|---|---|---|---|
| `v2_facilities` | 324 151 | **385 917** | **+61 766** ✅ (= forecast) |
| `v2_facility_source_refs` | 324 148 | 385 914 | +61 766 |
| `v2_operator_runs` | 324 147 | 385 913 | +61 766 |
| `v2_facilities.account_id is null` | — | 385 914 | — |
| `intake_tier='world'` | 313 537 | **375 303** | +61 766 ✅ |
| `intake_tier='pilot'` | 10 481 | 10 481 | **0** (pilot intouché ✅) |
| `v2_products` | 16 | **16** | **0** ✅ |
| `v2_entities` | 3 | **3** | **0** ✅ |
| `max_created_at` | 16:11:44.959Z | **17:28:09.774Z** | (S5) |

- **`intake_tier` PRÉSENT sur les 61 766** (world ; aucun pilot).
- **S-18 claim spot-check sur données S5 réelles** (branche jetable `br-proud-surf-amhoyn9y`) :
  nœud Eswatini `05ff7848…` draft → `verification_draft`, cancel → `unclaimed`, `account_id null` ;
  **PASS**. Branche supprimée, 0 résidu.
- **Registre** `omni_schema_migrations` : **32 entrées**, aucune migration requise (import = lignes).

## Prod/API après runs

- `GET /api/v2/public/facilities` → **HTTP 200** ; la page publique sert **28 facilités australe**
  (lat −8…−30, lng 20…40) parmi 250 = **la supply S5 monde est visible** (S-05 unclaimed).
- `GET /api/v2/public/routing` → **HTTP 401** (inchangé).
- **Aucun redeploy** : le bundle client est inchangé (import = données serveur).

## Preuves falsifiées / limites

- **Comptes exacts = forecast** (61 766 créés, 535 existants) : la méthode de dédup tient sur 9 pays.
- **Falsification de l'origine des 177 overlaps** : mon 1er script lisait des payloads locaux nettoyés
  → 32 « UNKNOWN » affichés ; **la lecture en base** (`source_id c698af14…`, 13:05–13:06Z) a montré
  des **nœuds S2/S3**, pas des créations S5. Corrigé, documenté.
- **Limite honnête** : la preuve navigateur authentifiée (acheteur → claim) sur un nœud S5 n'est pas
  exécutée (sandbox sans session) — le contrat claim est prouvé **unitairement** (S-18) sur la vraie
  donnée S5.

## Rollback

`docs/founder-hq/mcp-rollback-plan-2026-09-28-pop1c-afrique-s5-australe.md` — **écrit, NON exécuté**.
Cible = fenêtre S5 `created_at >= t0 ∧ account_id null ∧ unclaimed` ; **ne touche jamais** les 3
facilités revendiquées ni les 535 nœuds frontaliers pré-existants.
