# Intra-skill Plan — `NW-PROD` / Omni

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02` (Founder HQ Master Plan)
> **Local Plan ID:** `NW-PROD-OMNI-TXN-02`
> **Assigned gate:** `HEARTWOOD_CLOSED_BRANCHES_OPEN` — durcissement Branches (clôture de gaps transaction)
> **Local owner:** Nature Way (product delivery)
> **Expected return:** evidence, decision (D-TXN-3a/3b), residual gap, owner, next action

## Resource Receipt

| Status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/founder-hq-board.md` (via `docs/founder-hq/founder-hq-board.md`) |
| Loaded | `docs/founder-hq/current-state.md` (état de référence, porte courante) |
| Loaded | `docs/nature-way/omni-transaction-flow-state-contract-2026-09-16.md` (contrat d'autorité) |
| Loaded | `docs/nature-way/omni-transaction-domain-design-2026-09-16.md` |
| Template instantiated | `.agents/skills/nature-way-founder-hq/templates/intra-skill-plan.md` |
| Produced | `docs/nature-way/omni-transaction-gaps-register-2026-10-15.md` (registre des 9 gaps mesurés) |
| Not loaded / reason | `references/ecosystem-orchestration-protocol.md` — pas de nouveau venture ni de changement de milestone |
| Not loaded / reason | `templates/portable-starter/*` — pas de migration/handoff de workspace |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | Mesure du parcours réel | Toute affirmation appuyée sur une ligne de code | `omni-transaction-gaps-register-2026-10-15.md` | `done` | Une mesure contredit le contrat |
| 2 | Historique honnête (expirées visibles) | Une transaction expirée est atteignable et dit « rien n'a été débité » | Test + preuve prod | `ready` | Décision fondateur sur la 3ᵉ vue |
| 3 | Expiration du verrouillé | D-TXN-3a/3b tranchées, règle serveur + libération | Test SQL réel + preuve prod | `blocked` | Décision fondateur |
| 4 | Cohérence de type (`expired`) | Une seule définition `TransactionState` | tsc + garde | `ready` | — |
| 5 | Visibilité (QR, délai 15 min, notifs) | Aucun fait transactionnel invisible | Tests + preuve prod | `ready` | — |

## Dependency-aware task tree

| ID | Parent | Structural path / phase | Objective | Depends on | Owner | Status | Acceptance / proof | Risk/debt boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | — | gate Branches | Clore les gaps transaction mesurés | — | NW | `in_progress` | Registre + tranches livrées + preuve prod | Ne pas ouvrir de fondation neuve | Décision fondateur |
| W-01 | G-01 | Phase A/B — vérité | Rendre le parcours honnête de bout en bout | — | NW | `in_progress` | Registre `omni-transaction-gaps-register` | Docs only ici | — |
| T-G1 | W-01 | Phase B — sortie | Transaction expirée visible + message honnête | — | NW | `ready` | Garde falsifié + preuve prod | Aucune migration | — |
| T-G2 | W-01 | Phase B — verrou | Expiration du verrouillé | D-TXN-3a/3b | NW | `blocked` | Décision + test SQL réel | **Argent** : ne rien débiter sans décision | Décision fondateur |
| T-G3 | W-01 | Types | `expired` dans `TransactionState` domaine + validateur | — | NW | `ready` | tsc + garde de parité | Aucune donnée réécrite | — |
| T-G4 | W-01 | Phase B — QR | QR persistant dans la Room | T-G3 | NW | `ready` | Garde falsifié | Ré-émission = remplacement | — |
| T-G5 | W-01 | Notifications | Intention d'achat notifiée au vendeur | — | NW | `ready` | Preuve branche jetable | Idempotent | — |
| T-G6 | W-01 | Phase A — délai | Fenêtre 15 min visible | — | NW | `ready` | Garde + preuve navigateur | Aucun chiffre en dur | — |
| T-G7 | W-01 | Notifications | Expiration notifiée aux deux parties | T-G2 | NW | `blocked` | Preuve branche jetable | Idempotent | Décision fondateur |
| T-G8 | W-01 | Types | `failed` : écrit ou retiré | — | NW | `todo` | tsc + garde | Additif | — |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-10-15 | Mesure : 9 gaps identifiés ; GAP-1 rend le message d'honnêteté inatteignable | W-01 opened, T-G1…T-G8 created | `replan` | NW | Après décision D-TXN-3 |

## Handoff to Founder HQ

> **Local status:** `partial`
> **Gate decision:** `replan` — la porte Branches reste ouverte ; une sous-file « clôture transaction » est ouverte
> **Closed:** W-01 mesure (registre `omni-transaction-gaps-register-2026-10-15.md`)
> **Open or blocked:** T-G1/T-G3/T-G4/T-G5/T-G6/T-G8 `ready` · T-G2/T-G7 `blocked` sur **D-TXN-3a/3b**
> **Resource Receipt:** 6 ressources chargées, 1 template instancié, 2 non applicables (justifiés)
> **Residual gap:** preuve navigateur authentifiée non exécutée (sandbox sans session) ; décision fondateur requise sur l'expiration du verrouillé
> **Next smallest action:** **T-G1** (rendre une transaction expirée visible avec le message honnête) — aucune décision fondateur requise
> **Re-plan trigger:** décision D-TXN-3a/3b, ou une mesure qui contredit le contrat
