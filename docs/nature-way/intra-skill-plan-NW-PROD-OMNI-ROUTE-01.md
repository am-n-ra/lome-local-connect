# Intra-skill Plan — `NW-PROD` / Omni — Itinéraire routier

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02`
> **Local Plan ID:** `NW-PROD-OMNI-ROUTE-01`
> **Assigned gate:** Root System — source de vérité géométrique d'itinéraire + fournisseur de routage
> **Local owner:** Nature Way
> **Expected return:** décisions D-ROUTE-1…5 tranchées, maquette réconciliée, contrat d'API écrit

## Resource Receipt

| Status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way/references/prerequisite-architecture.md` |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` (this file) |
| Not loaded / reason | `launch-envelope.md` — aucune exposition utilisateur avant choix du fournisseur |
| Not loaded / reason | `risk-and-escalation-matrix.md` — à charger à l'activation du fournisseur (dépendance externe, coût, clé) |
| Not loaded / reason | `proof-and-decision-ledger.md` — à charger au premier cycle de preuve routière |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | Diagnostic de l'existant | ligne droite vs route réelle documentée et mesurée | `omni-route-directions-contract-2026-09-17.md` | `done` | fait contredit |
| 2 | Décision fournisseur (D-ROUTE-1) | fondateur tranche hébergé / auto-hébergé / statu quo | message de confirmation | `blocked` (décision fondateur) | fournisseur retenu |
| 3 | Règle d'accès (D-ROUTE-3) | maquette réconciliée avec la règle fondateur | S11/S22/S23/S25/S33 amendés | `blocked` (décision fondateur) | règle confirmée |
| 4 | Contrat d'API itinéraire | route serveur + cache + clé hors bundle | contrat écrit + test de non-fuite | `todo` | dépend de D-ROUTE-1 |
| 5 | Rendu du tracé réel | géométrie routière + casing + 4 largeurs | preuve navigateur 360/768/1280/1920 | `todo` | dépend de 4 |
| 6 | Turn-by-turn français | étapes + noms de rues lisibles | preuve navigateur | `deferred` | dépend de 5 |
| 7 | Repli honnête | comportement si fournisseur indisponible | test négatif | `todo` | dépend de D-ROUTE-4 |
| 8 | Couverture d'adresse (2,9 %) | indépendant du fournisseur | mesure + plan données | `todo` | — |

## Dependency-aware task tree

| ID | Parent | Structural path / phase | Objective | Depends on | Owner | Status | Acceptance / proof | Risk/debt boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| RT-01 | — | Root | Diagnostic existant écrit | — | Nature Way | `done` | contrat §1/§2 | — | fait contredit |
| RT-02 | RT-01 | Root | Fournisseur tranché | D-ROUTE-1 | Founder | `blocked` | décision écrite | clé en bundle si mal fait | fournisseur choisi |
| RT-03 | RT-01 | Species | Maquette réconciliée | D-ROUTE-3 | Founder + Nature Way | `blocked` | 5 écrans amendés | contradiction laissée = régression future | règle confirmée |
| RT-04 | RT-02 | Root/API | Proxy serveur + cache | RT-02 | Nature Way | `todo` | contrat + test absence de clé client | coût non maîtrisé | — |
| RT-05 | RT-04 | Trunk/UI | Tracé routier rendu | RT-04 | Nature Way | `todo` | 80/80 aux 4 largeurs | — | — |
| RT-06 | RT-05 | Branch | Turn-by-turn FR | RT-05 | Nature Way | `deferred` | preuve navigateur | — | — |
| RT-07 | RT-05 | Heartwood | Repli indisponible | D-ROUTE-4 | Nature Way | `todo` | test négatif | fausse trace si mal fait | — |
| RT-08 | RT-01 | Root/data | Couverture d'adresse | — | Nature Way | `todo` | mesure **6/206 = 2,9 %** (vérifiée en base) → cible | dette de données | — |
| RT-09 | RT-01 | Root/data | Vérifier `lng −1,00` hors zone Lomé | — | Nature Way | `todo` | coordonnée qualifiée | point fantôme dans la supply | — |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-09-17 | Demande fondateur « itinéraires aussi parfaits que Google Maps » | RT-01 créé et `done` ; RT-02…RT-09 planifiés | `advance` jusqu'au gate Root | Nature Way | décision D-ROUTE-1…5 |
| 2026-09-17 | Mesure réelle : 4,91 km ligne droite vs 6,19 km route (+26 %) ; rues nommées de Lomé confirmées | RT-01 accepté | `advance` | Nature Way | — |
| 2026-09-17 | Le serveur OSRM de démo interdit l'usage en production | RT-02 `blocked` sur décision fournisseur | `pause` | Founder | fournisseur tranché |
| 2026-09-17 | Maquette S33 dit « route après intention », correction fondateur 2026-09-14 dit l'inverse ; le code suit le fondateur | RT-03 créé, `blocked` | `pause` | Founder | règle d'accès confirmée |

## Handoff to Founder HQ

- **Gate :** Root System — décision de source de vérité géométrique et de fournisseur.
- **Statut :** `blocked` sur **décision fondateur**, pas sur un manque de travail d'ingénierie.
- **Preuve :** diagnostic mesuré (`omni-route-directions-contract-2026-09-17.md`), réseau routier de Lomé couvert et turn-by-turn exploitable en français.
- **Écart résiduel :** aucune ligne de code d'itinéraire écrite ; latence et coût du fournisseur non mesurés ; fallback DOM incapable d'afficher un tracé.
- **Prochaine action :** trancher D-ROUTE-1…5.
- **Prochain gate :** contrat d'API itinéraire (RT-04) une fois le fournisseur retenu.