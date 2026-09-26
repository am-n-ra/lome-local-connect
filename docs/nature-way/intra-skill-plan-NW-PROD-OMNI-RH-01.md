# Intra-skill Plan — `NW-PROD` / Omni

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02` (board `docs/founder-hq/founder-hq-board.md`)
> **Local Plan ID:** `NW-PROD-OMNI-RH-01`
> **Assigned gate:** Root System — **publication honnête** (E-03 visuel requis + E-04 avantage requis), chaîne SDM `E-01→E-02→E-03→E-04`
> **Local owner:** `/nature-way`
> **Expected return:** contrat + tranche livrée + preuve (suite/tsc/gardes/SQL réel/prod) + registre de dette + handoff HQ

## Resource Receipt

| Status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` (invoked this session) |
| Loaded | `references/intra-skill-execution-controller.md` (required for every material gate) |
| Template instantiated | `templates/intra-skill-plan.md` (this file) |
| Loaded | `docs/nature-way/omni-system-dependency-map-2026-09-23.md` §4 (names the gate: « refus serveur d'une offre sans visuel/avantage ») |
| Loaded | `docs/nature-way/omni-maturity-verdict-2026-09-25.md` (revision trigger fired — re-measured) |
| Loaded | `docs/maquette/omni-species-v2-interactive.html:1102-1118` (`seller-publish` : `1 image requise`, `Avantage Omni (requis)`) |
| Not loaded / reason | `references/prerequisite-architecture.md` — SDM already exists and is current; no new multi-actor map needed |
| Not loaded / reason | `references/technical-lead-production-review.md` — no new architecture/schema/integration decision (no migration in this slice) |
| Not loaded / reason | `references/launch-envelope.md` — Root gate, not a release (Canopy/Ring closed) |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | Visuel d'offre (E-03) — chemin d'écriture | un vendeur peut attacher un visuel à une offre, prouvé | route + repo + UI + test + SQL réel | `in_progress` | Blob infra non réutilisable → re-plan |
| 2 | Avantage Omni (E-04) — refus serveur | publier sans avantage >0 est refusé, serveur | garde repo + test négatif + SQL réel | `todo` | maquette contredit → décision |
| 3 | Visuel requis (E-03) — refus serveur | publier sans visuel est refusé, **après** que le chemin existe | garde repo + test négatif + SQL réel | `todo` | — |
| 4 | Publication honnête — preuve intégrée | les 3 moitiés prouvées ensemble | preuve E2E branche jetable | `todo` | — |

## Dependency-aware task tree

| ID | Parent | Structural path / phase | Objective | Depends on | Owner | Status | Acceptance / proof | Risk/debt boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | — | `root > publication` | **publication honnête** : impossible de publier une offre sans visuel ni avantage | SDM §4 ; maquette `:1107` | Nature Way | `in_progress` | refus serveur prouvé + chemin pour le satisfaire | gate Root ; ne pas casser le catalogue existant | infra visuel indisponible |
| W-01 | G-01 | `root > publication > media` | chemin d'écriture du visuel d'offre (E-03 moitié 1) | `G-01` | Nature Way | `in_progress` | attach → `media <> '[]'` en base | **0/16 offre n'a de visuel** — imposer sans chemin = impasse | Blob non réutilisable |
| T-01 | W-01 | `server > contract` | contrat d'API : attacher un visuel à une offre (owner-bound) | — | Nature Way | `todo` | contrat écrit avant code | pas de nouvelle table | — |
| T-02 | W-01 | `server > repository` | `attachSellerProductMedia` (owner-bound, valide URL/kind) | T-01 | Nature Way | `todo` | test seam + SQL réel | réutiliser le Blob existant, pas en créer un 2e | — |
| T-03 | W-01 | `server > http` | route `POST /api/v2/seller/products/:id/media` | T-02 | Nature Way | `todo` | 401/400/200 + validator | — | — |
| T-04 | W-01 | `client > UI` | formulaire vendeur : ajouter un visuel (réutilise `uploadFacilityEvidence` si possible) | T-03 | Nature Way | `todo` | rendu + test | — | — |
| W-02 | G-01 | `root > publication > refusal` | refus serveur E-04 (avantage) puis E-03 (visuel) | W-01 | Nature Way | `todo` | garde + test négatif + SQL réel | **ne pas briquer** les 13 offres publiées existantes | — |
| T-05 | W-02 | `server > repository` | refus d'avantage dans `transitionSellerProduct` | W-01 | Nature Way | `todo` | test négatif (publier sans avantage → refus) | grandfather les publiées | — |
| T-06 | W-02 | `server > repository` | refus de visuel dans `transitionSellerProduct` | T-05 | Nature Way | `todo` | test négatif (publier sans visuel → refus) | grandfather les publiées | — |
| T-07 | W-02 | `proof` | preuve E2E branche jetable (3 moitiés) | T-06 | Nature Way | `todo` | script + T1..Tn PASS | branche jetable | — |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-09-26 | Verdict de maturité `prototype` re-mesuré : **ses 4 conditions sont levées** (caractéristiques écrites, devise résolue, 16/16 XOF, filtre devise-aware) | trigger de révision du verdict **déclenché** | replan | Nature Way | après cette tranche |
| 2026-09-26 | **`v2_products.media` = 0/16** et **aucun chemin d'écriture de visuel d'offre** (Blob branché seulement pour la preuve de revendication) | W-01 créé **avant** W-02 | replan (ordre des dépendances) | Nature Way | si Blob non réutilisable |
| 2026-09-26 | Avantage Omni : **12/16** ont une remise >0 | E-04 est partiellement soutenu par les données | — | Nature Way | — |

## Handoff to Founder HQ

> **Local status:** `in_progress`
> **Gate decision:** `advance`
> **Closed:** —
> **Open or blocked:** W-01/T-01 (`ready`)
> **Resource Receipt:** SKILL + execution controller loaded ; plan template instantiated ; SDM/verdict/maquette loaded
> **Residual gap:** à mesurer au fil de la tranche
> **Next smallest action:** contrat d'API du visuel d'offre (T-01)
> **Re-plan trigger:** infra Blob non réutilisable, ou maquette contredisant le refus
