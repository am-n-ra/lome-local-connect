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
| POP-1a-02 | POP-1a-01 | Root/contract | Contrat données écrit | POP-1a-01 | Nature Way | `todo` | contrat + 0 colonne | fetcher automatisé = POP-1b | direction changée |
| POP-1a-03 | POP-1a-02 | Root/unit | Classifieur pur + tests falsifiés | POP-1a-02 | Nature Way | `todo` | 11 tests verts, rouge neutralisé | seeding monde sans claim = non | prédicat faux |
| POP-1a-04 | POP-1a-03 | Root/wire | Tier en `raw_metadata`, admission inchangée | POP-1a-03 | Nature Way | `todo` | tests repo + suite + gardes verts | refus Ghana inchangé (défaut connu, POP-1b) | régression |
| POP-1b | POP-1a-04 | Root/prove (MCP) | Admission monde + dry-run jetable + preuve | POP-1a-04 + accès DB | MCP session | `planned` | handoff + rapport + prompt retour | écritures canoniques = relais seul | DB indisponible |

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

## Handoff to Founder HQ

- **Gate :** Root System — peuplement unclaimed (contrat + classification + stockage du tier).
- **Statut :** `verified` POP-1a (contrat, 10 tests neufs falsifiés, câblage additif, 0 changement d'admission).
- **Preuves (2026-09-28) :** `place-intake.test.ts` 8/8 (rouge neutralisé, vert restauré) ·
  câblage 2/2 (rouge par suppression du spread, vert restauré) · suite **621/621** (604+7+8+2) ·
  tsc 0 · gardes state/docs/boundary/live-surface(70 fichiers)/coherence verts.
- **Écart résiduel :** preuve route (http → repo) non exercée (aucun harness de route import ; tsc +
  revue couvrent le passage) · admission monde = POP-1b · run canonique = POP-1c.
- **Owner :** Nature Way. **Prochaine action :** handoff MCP POP-1b (admission monde + dry-run
  jetable + preuve). **Re-plan :** fait contredit, garde rouge, ou décision fondateur sur le volume.
