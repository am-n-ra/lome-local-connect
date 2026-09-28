# Intra-skill Plan — `NW-PROD` / Omni — Peuplement unclaimed (POP-1)

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02`
> **Local Plan ID:** `NW-PROD-OMNI-POP-01`
> **Assigned gate:** Root System — chemin d'écriture du peuplement (monde, unclaimed)
> **Local owner:** Nature Way
> **Expected return:** contrat données + classifieur pur prouvé + admission inchangée ; écritures canoniques reléguées au relais MCP

## Resource Receipt

| Status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way/references/prerequisite-architecture.md` |
| Loaded | `docs/nature-way/omni-system-dependency-map-2026-09-23.md` (SCOUT-01, chaîne E-01) |
| Loaded | `docs/founder-hq/current-state.md` (porte `SPECIES_CLOSED_ROOT_OPEN`) |
| Loaded | `docs/decisions/omni-decision-log.md` (DEC-V2-10/11) |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` (this file) |
| Not loaded / reason | `execution-controller.md` + `execution-plan-and-task-tree.md` — ce plan suit le template intra-skill ; le contrôleur plein s'active à POP-1b (écritures canoniques) |
| Not loaded / reason | `launch-envelope.md`, `risk-and-escalation-matrix.md` — aucune exposition, aucun paiement, aucune donnée personnelle dans POP-1a |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | Inspection de l'existant | import + périmètre + claim cartographiés, sans inférence | §ci-dessous | `done` | fait contredit |
| 2 | Contrat données POP-1a | source, schéma (0 colonne), tiers, S-18, dry-run spec écrits | `omni-pop1-intake-contract-2026-09-28.md` | `todo` | DEC-V2-10 révisée |
| 3 | Classifieur pur + tests | `pilot/world/quarantine` prouvés, falsifiés | `place-intake.ts` + tests verts | `todo` | prédicat contesté |
| 4 | Câblage metadata (admission inchangée) | tier stocké en `raw_metadata`, 0 changement de comportement | tests repo + suite verte | `todo` | test existant rouge |
| 5 | POP-1b (relais MCP) | admission monde + dry-run sur jetable + preuve canonique | handoff MCP + rapport | `planned` | accès DB indisponible |
| 6 | POP-1c (run canonique) | backfill monde prouvé, claim spot-check | rapport MCP + registre | `planned` | décision fondateur si volume |

## Dependency-aware task tree

| ID | Parent | Structural path / phase | Objective | Depends on | Owner | Status | Acceptance / proof | Risk/debt boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| POP-1a-01 | — | Root/inspect | Existant mesuré (import, périmètre, claim, schéma) | DEC-V2-10/11 | Nature Way | `done` | §1 ci-dessous | — | fait contredit |
| POP-1a-02 | POP-1a-01 | Root/contract | Contrat données écrit | POP-1a-01 | Nature Way | `done` | contrat + §7 amendement POP-1b | fetcher automatisé = POP-1b | direction changée |
| POP-1a-03 | POP-1a-02 | Root/unit | Classifieur pur + tests falsifiés | POP-1a-02 | Nature Way | `done` | 12 tests verts, rouge neutralisé + restauré | seeding monde sans claim = non | prédicat faux |
| POP-1a-04 | POP-1a-03 | Root/wire | Tier en `raw_metadata`, admission inchangée | POP-1a-03 | Nature Way | `done` | 2 tests repo falsifiés + suite 621/621 + gardes | refus Ghana inchangé (défaut connu, POP-1b) | régression |
| POP-1b-code | POP-1a-04 | Root/admit | Admission monde (?scope, quarantine comptée, QUARANTINED) | POP-1a-04 | Nature Way | `done` | 4 tests falsifiés + suite 625/625 + tsc + gardes | route non exercée (tsc+revue) | régression |
| POP-1b | POP-1b-code | Root/prove (MCP) | Dry-run jetable + preuve canonique + claim spot-check | POP-1b-code + accès DB | MCP session | `done` | rapport 453ec94 + regen 688a0ce | — | rapport reçu |
| POP-1c | POP-1b | Root/run (MCP) | Backfill monde par vagues, VOLUME décidé (DEC-V2-12) | POP-1b + accès DB | MCP session | `in_progress` | vague 0 DONE + acceptée (DEC-V2-13) ; vague Ouest GO (DEC-V2-14) | stop après chaque vague | rapport reçu |
| POP-1c-O | POP-1c | Root/run (MCP) | Vague Ouest : Ghana + Bénin + Burkina Faso, pré-filtre, stop-and-report | POP-1c vague 0 | MCP session | `done` | 28 360 créés, 0 doublon, rollback décliné (DEC-V2-15) | stop après chaque vague | rapport reçu |
| POP-1c-A | POP-1c-O | Root/run (MCP) | Vague Afrique par sous-vagues (DEC-V2-17) | POP-1c-O + accès DB | MCP session | `in_progress` | S1 Ouest-restante DONE (rapport 2026-09-28) ; acceptation + Centrale en attente | stop après chaque sous-vague | rapport reçu |
| POP-1c-A-S1 | POP-1c-A | Root/run (MCP) | S1 Ouest-restante : 11 pays, 78 124 créés, 0 doublon | handoff Afrique | MCP session | `done` | dry-run + canonique + p95 186ms + T-07d | rollback planifié non exécuté | rapport reçu |
| POP-1c-A-S2 | POP-1c-A-S1 | Root/run (MCP) | S2 Centrale : forecast avant, dry-run, runs, stop-and-report | S1 + accès DB | MCP session | `done` | forecast `5fa6341` + rapport + counts + prompt retour | enchaînement sans rapport | rapport reçu |
| POP-1c-A-S3 | POP-1c-A-S2 | Root/run (MCP) | S3 Est : forecast avant, dry-run, runs, stop-and-report | S2 + accès DB + GO fondateur | MCP session | `done` | forecast `80fb0b7` + rapport + counts + prompt retour | enchaînement sans rapport | rapport reçu |
| POP-1c-A-S4 | POP-1c-A-S3 | Root/run (MCP) | S4 Nord : forecast avant, dry-run, runs, stop-and-report | S3 + accès DB + GO fondateur | MCP session | `done` | forecast `6d139ab` + rapport + counts + prompt retour | enchaînement sans rapport | rapport reçu |
| POP-1c-A-S5 | POP-1c-A-S4 | Root/run (MCP) | S5 Australe : forecast avant, dry-run, runs, stop-and-report | S4 + accès DB + GO fondateur | MCP session | `done` | forecast `a05ad9f` + 61 766 créés (9 pays), 385 917 live, 0 doublon, p95 165ms ≤186, T-07d ✅ | enchaînement sans rapport | rapport reçu |
| POP-1c-A-S4b | POP-1c-A-S5 | Root/run (MCP) | S4-bis Maroc/Algérie : forecast avant, dry-run, runs, stop-and-report | S5 + accès DB + GO fondateur | MCP session | `suspended` | BLOQUÉ capacité PUIS pivot Togo-only (DEC-V2-27) : forecast `1765155` conservé, rejouable si direction change | reprendre sans décision | pivot Togo-only |
| POP-1d | POP-1c-A-S4b | Root/data (MCP) | Prune Togo-only : D0 deletes testés, snapshot, D1 census, D2 suppression par lots, D3 vacuum + probe écriture | POP-1c-A-S4b + accès DB | MCP session | `done` | D0 DELETE passe · 372 173 supprimées (13 744 restantes) · db 301 Mo < 400 · probe écriture PASS (50 000 rollback) · claim S-18 PASS · prod T-07d ✅ · snapshot non-root refusé (rétention 6 h) | suppression hors prédicat | rapport POP-1d + DEC-V2-28 |

> **S4 Nord exécutée 2026-09-28 (MCP, stop-and-report).** 4 extraits Geofabrik (Soudan, Égypte, Libye,
> Tunisie). **45 154 créés / 18 existants (15 canoniques S3 frontière + 3 intra-S4) / 0 doublon /
> 0 quarantaine dans les runs.** Canonique **278 997 → 324 151** ; 3 revendiquées intactes ;
> p50 55 / p95 60 ms (N=120, ≤ 186) ; registre 044→064 sans trou. Rollback écrit, non exécuté.
> **Maroc/Algérie** ne sont nommés dans aucune sous-vague → signalés (décision fondateur).
> Rapport : `docs/founder-hq/mcp-report-2026-09-28-pop1c-afrique-s4-nord.md` ; forecast `6d139ab`.

> **S5 Australe exécutée 2026-09-28 (MCP, stop-and-report).** 9 extraits Geofabrik (Malawi, Mozambique,
> Zambie, Zimbabwe **+ Angola, Namibie, Botswana, Afrique-du-Sud+Lesotho, Eswatini**). Forecast figé
> avant runs (`a05ad9f`) : 73 173 matched / 62 301 importables / 10 872 pré-filtrés ; tiers pilot 0 /
> world 63 480 / quarantine 9 693. **61 766 créés / 535 existants (358 intra-S5 + 177 canoniques
> frontière S2/S3) / 0 doublon / 0 quarantaine.** Canonique **324 151 → 385 917** ; world tier
> 313 537 → 375 303 ; 16 produits + 3 entités + 3 revendiquées intacts ; `max_created_at`
> 16:11→17:28Z. p95 165 ms ≤ 186 ms. Dry-run jetable (pic 385 917, zéro canonique prouvé) supprimée.
> S-18 spot-check PASS sur nœud S5 réel. Rollback écrit, non exécuté. **Maroc/Algérie EXCLUS**.
> Rapport : `docs/founder-hq/mcp-report-2026-09-28-pop1c-afrique-s5-australe.md`.

> **S3 Est exécutée 2026-09-28 (MCP, stop-and-report).** 14 extraits Geofabrik (Kenya, Ouganda,
> Tanzanie, Rwanda, Burundi, Éthiopie, Somalie, Soudan du Sud, Érythrée, Djibouti, Madagascar,
> Maurice, Comores, Seychelles). **136 526 créés / 683 existants / 0 doublon** ; canonique
> **142 471 → 278 997** ; 3 revendiquées intactes ; p95 169 ms ≤ 186 ms ; registre 044→064 sans trou.
> Rollback écrit, non exécuté. **Réunion/Mayotte exclus** (aucun extrait propre). **Sous-vague Nord (S4)
> NON lancée** — attend rapport accepté. Rapport :
> `docs/founder-hq/mcp-report-2026-09-28-pop1c-afrique-s3-est.md` ; forecast `80fb0b7`.

## §1. Inspection (faite, code lu — pas inférée)

- **Import vivant** : `POST /api/v2/public/facilities?action=operator-import[-batch]` (`http.ts:672/714`) —
  provider `openstreetmap` + attribution obligatoires, champs bornés, coords finies dans les plages.
- **Garde périmètre vivante** : `isInsidePilotZone` (`routing-adapter.ts:28` bbox Grand Lomé 1.0/5.85/2.45/6.5,
  testée) — hors-zone **refusé et compté** (`skippedOutOfZone`, jamais silencieux).
- **Écriture idempotente** : `createPublicFacilityImport` (`trunk-repository.ts:1356`) —
  `account_id null, source_kind='public_import', trust_state='unclaimed'`, dedupe
  `(source_id, source_ref)`, refresh si encore unclaimed, `raw_metadata` JSONB, run opérateur audité.
- **Claim vivant** : draft depuis lieu sans compte + `public_import` (S-18 preuve + arbitrage, agnostique au tier).
- **Schéma prêt** : `source_kind/name/ref` + index unique + `v2_facility_source_refs` + `raw_metadata`
  (`001`), registre terrain 006. **Aucune colonne à ajouter en POP-1a.**
- **Manquant (le parent)** : aucun fetcher vivant (Overpass/import-osm morts) ; aucune sémantique
  monde (le refus Ghana contredit DEC-V2-11 à terme) ; aucun tier enregistré.
- **Dettes connues réutilisées** : 21 hors zone (dont 17 Ghana, placeholders sans adresse), 6/206
  adresses, `position_kind` NULL sur les 3 riches (rapport MCP 471f557).

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-09-28 | DEC-V2-10/11 + Constitution validée : monde unclaimed, sans staging pilote | POP-01 créé (ce plan) | `advance` POP-1a | Nature Way | fin POP-1a |
| 2026-09-28 | POP-1a exécutée : contrat + `place-intake.ts` (8 tests) + câblage tier (2 tests) + suite 621/621 + tsc 0 + 5 gardes verts | POP-1a-02/03/04 `done` ; POP-1b `ready` (relais MCP) | `advance` POP-1b | Nature Way | dry-run jetable |
| 2026-09-28 | POP-1b code livré ici : `admitIntakeBatch` + `parseIntakeScope` (4 tests falsifiés) + câblage routes + contrat §7 ; suite 625/625, tsc 0, 5 gardes verts ; preuve DB reléguée au relais | POP-1b-code `done`, preuve DB `ready` | `advance` relais MCP | Nature Way | rapport MCP |
| 2026-09-28 | RELAY-RETOUR MCP réconcilié : prod 890e9e9 T-07d ✅ · dry-run conforme (pilot 4/world 11/quarantine 7, zéro-canonique prouvé, jetable supprimée) · claim agnostique au tier (3 lieux, S-18 intact) · census refresh (44 hors zone vraie bbox — corrige « 21 ») · bundles api/v2 RÉGÉNÉRÉS ici (dette HAUTE close) | POP-1b `done` ; POP-1c `ready` (volume + fetcher à trancher) | `advance` POP-1c | Nature Way | décision VOLUME |
| 2026-09-28 | VOLUME tranché MONDE ENTIER (DEC-V2-12) : POP-1c `ready`, vagues Togo → Ouest → Afrique → monde, stop-and-report | handoff MCP POP-1c à écrire | `advance` relais MCP | Nature Way | rapport POP-1c |
| 2026-09-28 | Blanket-go : Ouest GARDÉE (DEC-V2-15), boîte documentée (DEC-V2-16), Afrique GO par sous-vagues (DEC-V2-17) ; handoff MCP Afrique écrit | POP-1c-A `ready` | `advance` relais MCP | Nature Way | rapport Afrique |
| 2026-09-28 | Oui ×3 fondateur : vague 0 GARDÉE (rollback décliné, DEC-V2-13), vague Ouest GO Ghana+Bénin+Burkina (DEC-V2-14), batch-reject conservé + pré-filtre outillage | POP-1c-O `ready`, handoff à écrire | `advance` relais MCP | Nature Way | rapport Ouest |
| 2026-09-28 | RELAY-RETOUR Afrique-S1 réconcilié : 78 124 créés (11 pays), 0 doublon (148 intra + 63 canoniques), 117 854 live, intake_tier 117 721, claim agnostique, p95 186ms, prod T-07d ✅, forecast figé avant runs | S1 `done`, acceptation S1 + S2 Centrale en attente fondateur | `advance` décisions | Nature Way | mots fondateur |
| 2026-09-28 | RELAY-RETOUR Afrique-S2 Centrale : forecast `5fa6341` figé avant runs · 8 extraits (incl. Sao Tomé) · 24 617 créés (0 doublon, 52 existing réconciliés 50 intra + 2 canon) · canonique 117 854 → 142 471 · dry-run jetable 0 canonique · p95 chaud 173–177 ≤ 186 · claim S-18 agnostique · prod T-07d · rollback écrit non exécuté | S2 `done`, S3 Est `ready` (bloqué sur acceptation fondateur) | `advance` décisions | Nature Way | mots fondateur |
| 2026-09-28 | Oui fondateur (« oui et go ») : S1/S2 GARDÉES (rollbacks déclinés, DEC-V2-18), S3 Est GO (DEC-V2-19) ; handoff S3 activé | S3 `in_progress` (relais MCP) | `advance` relais MCP | Nature Way | rapport S3 |
| 2026-09-28 | RELAY-RETOUR S3 Est réconcilié : forecast figé avant runs (80fb0b7), 136 526 créés (14 extraits, 0 doublon, 683 existing réconciliés), 278 997 live, p95 169ms, prod T-07d ✅, Réunion+Mayotte exclues (pas d'extrait propre), Soudan/Égypte/Libye/Tunisie → Nord, Malawi/Mozambique/Zambie/Zimbabwe → Australe | S3 `done`, acceptation S3 + S4 Nord en attente fondateur | `advance` décisions | Nature Way | mots fondateur |
| 2026-09-28 | Oui fondateur (« oui et go ») : S3 GARDÉE (rollback décliné, DEC-V2-20), S4 Nord GO (DEC-V2-21) ; handoff S4 activé | S4 `in_progress` (relais MCP) | `advance` relais MCP | Nature Way | rapport S4 |
| 2026-09-28 | RELAY-RETOUR S4 Nord réconcilié : forecast figé avant runs (6d139ab), 45 154 créés (4 pays, 0 doublon, 18 existing réconciliés 15 S3 + 3 intra), 324 151 live, intake_tier 324 018, p95 60 ms, prod T-07d ✅ | S4 `done`, acceptation S4 + S5 Australe en attente fondateur | `advance` décisions | Nature Way | mots fondateur |
| 2026-09-28 | Oui fondateur (« go ») : S4 GARDÉE (rollback décliné, DEC-V2-22), S5 Australe GO (DEC-V2-23) ; handoff S5 activé | S5 `in_progress` (relais MCP) | `advance` relais MCP | Nature Way | rapport S5 |
| 2026-09-28 | RELAY-RETOUR S5 Australe réconcilié : forecast figé avant runs (a05ad9f), 61 766 créés (9 pays, 0 doublon, 535 existing 358 intra + 177 canoniques frontière S2/S3), 324 151 → 385 917 live, world tier 375 303, p95 165 ms, prod T-07d ✅, Maroc/Algérie exclus | S5 `done`, acceptation S5 + prochaine sous-vague (Sahel/Ouest-nord ou Maroc-Algérie) en attente fondateur | `advance` décisions | Nature Way | mots fondateur |
| 2026-09-28 | Oui fondateur (« go ») : S5 GARDÉE (rollback décliné, DEC-V2-24), S4-bis Maroc/Algérie GO (DEC-V2-25) ; handoff S4-bis activé | S4-bis `in_progress` (relais MCP) | `advance` relais MCP | Nature Way | rapport S4-bis |
| 2026-09-28 | Oui fondateur (« go bbox pays, stop imports, supprime ») : pivot Togo-only + lazy (DEC-V2-27) ; S4-bis suspendue (forecast conservé) ; POP-1d prune `ready`, handoff écrit | POP-1d `ready` (relais MCP) | `advance` relais MCP | Nature Way | rapport POP-1d |
| 2026-09-28 | RELAY-RETOUR S4-bis Maroc/Algérie PARTIEL : forecast figé avant runs (1765155 : Maroc 42389/34020, Algérie 43269/25288 ; Sahara occ. exclu motivé ; chev. intra 12 + canonique 72) ✅ ; **B2/B3 BLOQUÉS** — **limite disque projet Neon free_v3 = 512 Mo, canonique déjà à 522 Mo logiques** → toute écriture refusée (« could not extend file »), même 200 lignes sur jetable ; 0 ligne S4-bis écrite, canonique 385 917 intacte, jetable nettoyée | S4-bis `blocked`, **décision capacité requise** (augmenter le plan / élaguer unclaimed / scinder) | `block` capacité infra | Nature Way | décision fondateur capacité |

## Handoff to Founder HQ

- **Gate :** Root System — peuplement unclaimed (contrat + classification + admission monde + runs).
- **Statut :** `verified` POP-1a + POP-1b-code + S1 + S2 + S3 Est + S4 Nord + S5 Australe (forecast figé avant runs,
  dry-run, 61 766 créés, 0 doublon, prod T-07d). S5 acceptée ; S4-bis Maroc/Algérie GO (DEC-V2-25).
- **Preuves (2026-09-28) :** rapports MCP S1/S2/S3/S4/S5 + réconciliation HQ · suite **625/625** ·
  tsc 0 · gardes state/docs verts · canonique **385 917** (… → 278 997 → 324 151 → 385 917).
- **Écart résiduel :** preuve navigateur authentifiée (acheteur→claim) non exercée (sandbox sans
  session ; contrat claim prouvé unitairement S-18 sur la donnée S5 réelle) · rollbacks planifiés
  non exécutés (vagues saines) · Réunion/Mayotte hors extrait.
- **Owner :** Nature Way. **Prochaine action :** POP-1d **exécutée** (2026-09-28, DEC-V2-28) —
  D0 DELETE passe, census fait, **372 173 supprimées** (canonique **13 744** = 3 owned + 13 741
  Togo-unclaimed), `VACUUM` fait, db **301 Mo < 400**, **probe écriture PASS**, claim S-18 PASS,
  prod T-07d ✅. **Attendre** l'expiration de l'historique Neon (~6 h) puis **S4-bis replay**
  (forecast `1765155` conservé) **dans le périmètre bbox pays**, ou prochaine sous-vague gouvernée.
  **Ne pas relancer l'import eager monde.** **Gap à décider :** index permanent
  `v2_facility_source_refs(facility_id)` (moyen).
  **Re-plan :** fait contredit, garde rouge, ou stop fondateur.
