# Intra-skill Plan — `NW-PROD` / Omni

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02`
> **Local Plan ID:** `NW-PROD-OMNI-TXN-01`
> **Assigned gate:** Root System — contrat de flux/états transaction, temps par étape, registre des dettes
> **Local owner:** Nature Way
> **Expected return:** contrat accepté, tranches FF-1…FF-9 ordonnées, décisions D-TXN-1…10, prochaine action

## Resource Receipt

| Status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way/references/prerequisite-architecture.md` |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` (this file) |
| Not loaded / reason | `production-evidence-register.md` — pas de release à ce stade (Root seulement) |
| Not loaded / reason | `launch-envelope.md` — pas d'exposition utilisateur dans cette tranche |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | Contrat de flux/états | contrat écrit, contradiction UI↔serveur documentée | `omni-transaction-flow-state-contract-2026-09-16.md` | `done` | fondateur refuse une décision |
| 2 | Conception domaine exhaustive | états + temps + types + dettes + plan | `omni-transaction-domain-design-2026-09-16.md` | `done` | nouvelle dette découverte |
| 3 | Décisions D-TXN-1…10 | fondateur tranche | message de confirmation | `blocked` | décision rendue |
| 4 | FF-1 (correction trompeuse) | bouton renommé, code mort supprimé | tests + build + prod===local | `todo` | D-TXN-1 refusée |
| 5 | FF-2 (Transactions en cours) | endpoint + écran reprenable | tests + preuve navigateur | `todo` | D-TXN-2 refusée |
| 6 | FF-3 (expiration + intents.state) | planificateur + mutation état | tests + preuve DB | `todo` | D-TXN-3 modifiée |
| 7 | FF-4 (cancel demande dispo) | route + UI Phase A | tests | `todo` | D-TXN-4 refusée |
| 8 | FF-5 (QR ré-émission) | route + TTL paramétrable | tests | `todo` | D-TXN-3 modifiée |
| 9 | FF-6 (timer + estimation) | mini-species puis UI | tests + preuve navigateur | `todo` | D-TXN-6 refusée |
| 10 | FF-7 (notifications txn) | push sur événements | tests | `todo` | — |
| 11 | FF-8 (réservation stock) | réservation/libération/décrément | tests + preuve DB | `todo` | D-TXN-7 refusée |
| 12 | FF-9 (litige) | — | — | `deferred` | watch Gate 7 |

## Dependency-aware task tree

| ID | Parent | Structural path / phase | Objective | Depends on | Owner | Status | Acceptance / proof | Risk/debt boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | — | Root | Contrat transaction accepté | HQ décision | Founder | `in_progress` | docs + décisions | hors-V1 litige/service | décision refusée |
| W-01 | G-01 | flow/état | Phase A/B + suspendre/reprendre/expirer | G-01 | Nature Way | `done` | contrat §2 | — | — |
| W-02 | G-01 | domaine | domaine exhaustif + dettes | W-01 | Nature Way | `done` | design §1.3/§5 | — | — |
| W-03 | G-01 | correctifs | FF-1…FF-9 ordonnés | W-02 | Nature Way | `todo` | dette soldée + preuve | une tranche = un gate | dette nouvelle |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-09-16 | Demande fondateur : « pas d'annulation, verrouillage, sortir/revenir, timer + temps estimé par étape, pas de dette » | W-01/W-02 créés et `done`; FF-1…FF-9 planifiés | `advance` (Root) | Nature Way | à la confirmation D-TXN |

## Handoff to Founder HQ

> **Local status:** `partial` (contrat livré, code non démarré — attend décisions)
> **Gate decision:** `pause` (arrêt volontaire au gate Root, conforme au protocole)
> **Closed:** W-01, W-02 + docs `af806a1`
> **Open or blocked:** G-01 (décisions D-TXN-1…10); FF-1…FF-9 `todo`; FF-9 `deferred`
> **Resource Receipt:** 2 références + 1 template chargés, 2 ressources justifiées non chargées
> **Residual gap:** aucune exécution HTTP authentifiée; table des temps et réservation de stock = décisions métier
> **Next smallest action:** FF-1 (renommer le bouton trompeur + supprimer le code mort) dès `go`
> **Re-plan trigger:** décision fondateur sur D-TXN-1…10, ou nouvelle dette découverte au code