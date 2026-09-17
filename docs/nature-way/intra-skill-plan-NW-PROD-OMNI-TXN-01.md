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
| 6 | FF-3 (expiration + intents.state) | planificateur + mutation état | tests + preuve DB | `done` (code, poussé) | D-TXN-3 modifiée |
| 7 | FF-4 (cancel demande dispo) | route + UI Phase A | tests | `done` (code, poussé) | D-TXN-4 refusée |
| 8 | FF-5 (QR ré-émission) | route + TTL paramétrable | tests | `done` (code, poussé) | D-TXN-3 modifiée |
| 9 | FF-6 (timer + estimation) | mini-species puis UI | tests + preuve navigateur | `done` (code, poussé) | D-TXN-6 refusée |
| 10 | FF-7 (notifications txn) | push sur événements | tests | `done` (code, poussé) | — |
| 11 | FF-8 (réservation stock) | réserver au verrou / libérer à l'expiration / décrémenter à la clôture | tests + preuve DB live (T1–T6) + prod===local | `done` (code, poussé, migration appliquée) | — |
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
| 2026-09-17 | Jeton GitHub rétabli ; FF-3/FF-4/FF-5/FF-7 codés et poussés (`bb906a3`→`f46330f`) | FF-3/FF-4/FF-5/FF-7 `todo`→`done` | `advance` | Nature Way | FF-8 |
| 2026-09-17 | Bug prod `r.on2 is not a function` : SQL collé `s.transaction_idand m.role` (join invalide) | Correctif `cf1d07d`, scan glue=0 | `advance` | Nature Way | surveiller la console prod |
| 2026-09-17 | Retour fondateur : « switcher sur Seller doit amener au bon endroit pour revendiquer ou créer une facilité/offre, pas aux éléments que voit quelqu'un qui en a déjà un » — **bug confirmé** : catalogue sans facilité = objet truthy → `SellerV13` affichait la coquille installée | entrée sur `hasFacility` + liste claimable directe + creation directe depuis la fiche + tests jsdom cassant la garde | `advance` | Nature Way | NW-13 (suite entrée vendeur) / verdict fondateur |
| 2026-09-17 | Preuve E2E du cycle transactionnel (`scripts/prove-v2-transaction-lifecycle.mjs`) pilote le code livré à travers tout le flux verrouillé : T1–T9 PASS ; **découvre un vrai bug** — l'état courant était départagé sur l'uuid aléatoire de l'événement alors que deux états écrits dans la même instruction partagent leur `created_at` → non déterministe (le flux verrouillé pouvait être rouvert) | migration 056 (`state_rank` généré) + 11 lectures corrigées `2b33433`, registre `660b5a9f…`, poussé, prod === local | `advance` | Nature Way | FF-9 (watch Gate 7) / verdict fondateur |
| 2026-09-17 | Preuve E2E FF-8 (`scripts/prove-v2-stock-reservation.mjs`) pilote le code livré sur branche jetable : T1–T6 PASS ; **découvre un vrai bug** — `submitTransactionRating` relisait `v2_ratings` dans la même instruction (snapshot Postgres) → 1er appel de notation échouait tout en persistant | correctif `rating_present` (RETURNING) `65d81cb`, poussé, prod === local | `advance` | Nature Way | FF-9 (watch Gate 7) / verdict fondateur |
| 2026-09-17 | FF-8 codé et poussé (`b2ce397`) ; migration 055 appliquée sur la branche canonique `br-dawn-hill-am5amy22` (colonne + CHECK + index partiel, 16/16 produits à 0) et enregistrée au registre (`75640c2d…`) ; preuves live T1–T6 | FF-8 `todo`→`done` | `advance` | Nature Way | FF-9 (watch Gate 7) / verdict fondateur |

## Handoff to Founder HQ

> **Local status:** `partial` (FF-1…FF-8 codés et poussés; FF-9 `deferred` — plan FF soldé hors litige)
> **Gate decision:** `advance` (plan FF soldé ; FF-9 = watch Gate 7)
> **Closed:** W-01, W-02 + docs `af806a1`; FF-1/FF-2/FF-6 `2408add`; FF-4 `12de520`; glue fix `cf1d07d`; FF-3/FF-5/FF-7 jusqu'à `f46330f`; correctif cron déploiement `8f5258b`; FF-8 `b2ce397`→`65d81cb`; preuve cycle `e4948a5`; `state_rank` `2b33433`
> **Open or blocked:** FF-9 `deferred` (watch Gate 7 — litige hors-V1)
> **Resource Receipt:** 2 références + 1 template chargés, 2 ressources justifiées non chargées
> **Residual gap:** aucune exécution HTTP authentifiée (sandbox) ; table des temps (D-TXN-3) = hypothèse à ajuster ; cycle verrouillé prouvé E2E par le code livré sur branche jetable (`proof:transaction-lifecycle` T1–T9) mais pas par un parcours navigateur complet
> **Next smallest action:** verdict fondateur sur le plan FF soldé, ou FF-9 si Gate 7 s'ouvre
> **Re-plan trigger:** jeton fourni, ajustement D-TXN-3, ou nouvelle dette découverte au code