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
| 3 | Décisions D-TXN-1…10 | fondateur tranche | message de confirmation | `done` (GO 2026-09-16) | décision rendue |
| 4 | FF-1 (correction trompeuse) | bouton renommé, code mort supprimé | tests + build + prod===local | `done` (code) — push bloqué | D-TXN-1 refusée |
| 5 | FF-2 (Transactions en cours) | endpoint + écran reprenable | tests + preuve navigateur | `done` (code) — push bloqué | D-TXN-2 refusée |
| 6 | FF-3 (expiration + intents.state) | planificateur + mutation état | tests + preuve DB | `todo` | D-TXN-3 modifiée |
| 7 | FF-4 (cancel demande dispo) | route + UI Phase A | tests | `todo` | D-TXN-4 refusée |
| 8 | FF-5 (QR ré-émission) | route + TTL paramétrable | tests | `todo` | D-TXN-3 modifiée |
| 9 | FF-6 (timer + estimation) | mini-species puis UI | tests + preuve navigateur | `done` (code) — push bloqué | D-TXN-6 refusée |
| 10 | FF-7 (notifications txn) | push sur événements | tests | `todo` | — |
| 11 | FF-8 (réservation stock) | réservation/libération/décrément | tests + preuve DB | `todo` | D-TXN-7 refusée |
| 12 | FF-9 (litige) | — | — | `deferred` | watch Gate 7 |

## Dependency-aware task tree

| ID | Parent | Structural path / phase | Objective | Depends on | Owner | Status | Acceptance / proof | Risk/debt boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | — | Root | Contrat transaction accepté | HQ décision | Founder | `in_progress` | docs + décisions | hors-V1 litige/service | décision refusée |
| W-01 | G-01 | flow/état | Phase A/B + suspendre/reprendre/expirer | G-01 | Nature Way | `done` | contrat §2 | — | — |
| W-02 | G-01 | domaine | domaine exhaustif + dettes | W-01 | Nature Way | `done` | design §1.3/§5 | — | — |
| W-03 | G-01 | correctifs | FF-1…FF-9 ordonnés | W-02 | Nature Way | `in_progress` | dette soldée + preuve | une tranche = un gate | dette nouvelle |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-09-16 | Demande fondateur : « pas d'annulation, verrouillage, sortir/revenir, timer + temps estimé par étape, pas de dette » | W-01/W-02 créés et `done`; FF-1…FF-9 planifiés | `advance` (Root) | Nature Way | à la confirmation D-TXN |
| 2026-09-16 | Fondateur « oui go » sur D-TXN-1…10 / FF-1…9 | FF-1 + FF-2 + FF-6 **codés** (commit `2408add`), 497/497 | `advance` | Nature Way | push + PRE-1 |
| 2026-09-16 | Jeton GitHub (remote `ghu_…` **et** `GITHUB_TOKEN`) rejeté par GitHub | Commit `2408add` local, ahead-1 | `pause` (push bloqué) | Founder | fournir un jeton `repo` |

## Handoff to Founder HQ

> **Local status:** `partial` (FF-1/FF-2/FF-6 codés et verts; FF-3/4/5/7/8 restants; push bloqué)
> **Gate decision:** `pause` (push prod bloqué — jeton GitHub invalide)
> **Closed:** W-01, W-02 + docs `af806a1`; FF-1 + FF-2 + FF-6 code `2408add`
> **Open or blocked:** push `2408add` (jeton `repo` requis); FF-3/FF-4/FF-5/FF-7/FF-8 `todo`; FF-9 `deferred`
> **Resource Receipt:** 2 références + 1 template chargés, 2 ressources justifiées non chargées
> **Residual gap:** aucune exécution HTTP authentifiée (sandbox); table des temps (D-TXN-3) = hypothèse à ajuster; FF-4 nécessite un statut `cancelled` de demande de dispo (migration additive)
> **Next smallest action:** fournir un jeton `repo` → pousser `2408add` → vérifier hash prod === local (T-07d); puis FF-4
> **Re-plan trigger:** jeton fourni, ajustement D-TXN-3, ou nouvelle dette découverte au code