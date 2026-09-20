# Intra-skill Plan — `NW-RT1` / Omni (Nature Way)

> **Founder HQ Plan ID:** `M-01` (pilot-ready V1 loop)
> **Local Plan ID:** `NW-RT1` (routing intent gate + cost bound)
> **Assigned gate:** activer le gate `intent` de `RT-D1` **avec** sa borne de coût
> **Local owner:** Nature Way (product/data/security/release authority)
> **Expected return:** preuve comportementale que `intent` gate réellement + quota actif, décision, gap résiduel, prochaine action

## Resource Receipt

| Status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way/references/risk-and-escalation-matrix.md` |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` (ce document) |
| Loaded | `.agents/skills/nature-way/references/proof-and-decision-ledger.md` |
| Loaded | `.agents/skills/nature-way/references/launch-envelope.md` |
| Not loaded / reason | `templates/system-dependency-map.md`, `references/prerequisite-architecture.md` — non requis : le graphe de dépendances de `M-01` est déjà établi et ce ring ne crée ni acteur ni branche nouvelle. |
| Not loaded / reason | `references/founder-intent-discovery.md` — non requis : l'intention (`RT-D1`) est déjà tranchée et datée par le fondateur. |
| Not loaded / reason | `references/technical-lead-production-review.md` — non requis : aucune nouvelle décision d'architecture ; `057` est additive et suit un contrat déjà écrit. |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | `W1` — appliquer `057` sur la branche applicative | `v2_route_requests` existe sur `br-dawn-hill-am5amy22` | `information_schema.tables` + insertion/lecture de test | `in_progress` | échec SQL ou branche applicative mal identifiée |
| 2 | `W2` — poser `ROUTING_REQUIRE_INTENT=1` | variable présente en Production sur le projet `omniview` | API Vercel env | `ready` | l'API refuse l'écriture |
| 3 | `W3` — redéployer et prouver le comportement | `reason` passe de `AUTH_REQUIRED` à `INTENT_REQUIRED` pour un acheteur connecté sans intention | appel prod authentifié + redeploy READY | `todo` | gate toujours `identity` |
| 4 | `W4` — réconcilier board, AGENTS, handoff | documents à jour, preuve classée | diff documentaire + snapshot de ring | `todo` | nouvelle découverte |

## Dependency-aware task tree

| ID | Parent | Structural path / phase | Objective | Depends on | Owner | Status | Acceptance / proof | Risk/debt boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| `G-01` | — | `product > feature > RT-D1` | `intent` actif **et** coût borné | `M-01` | NW | `in_progress` | prod renvoie `INTENT_REQUIRED` **et** quota non no-op | données : additive seulement | branche applicative change |
| `W-01` | `G-01` | `feature > root` | `W1` | `G-01` | NW | `in_progress` | table présente sur la branche applicative | `bounded` : additive, idempotente | échec SQL |
| `T-01` | `W-01` | `root > migration` | identifier la branche **réellement** utilisée par l'app | — | NW | `done` | `v2_facilities` = **206** = comptage prod | risque : branche nommée `production` ≠ branche app | fingerprint ne correspond plus |
| `T-02` | `W-01` | `root > migration` | prouver `057` sur branche **jetable** | `T-01` | NW | `done` | 1 instruction, 0 erreur, table lisible sur la jetable | `manual` : apply sur la canonique = acte fondateur | test échoue |
| `T-03` | `W-01` | `root > migration` | appliquer `057` sur la branche applicative | `T-02` | NW | `done` | table présente après apply | additive, aucune ligne supprimée | erreur SQL |
| `W-02` | `G-01` | `feature > operations` | `W2` | `W-01` | NW | `done` | `ROUTING_REQUIRE_INTENT=1` en Production | `manual` : configuration Vercel | API refuse |
| `T-04` | `W-02` | `operations` | poser la variable | `T-03` | NW | `done` | lecture API confirme la variable | `manual`, réversible (suppression) | doublon de variable |
| `W-03` | `G-01` | `feature > proof` | `W3` | `W-02` | NW | `in_progress` | `INTENT_REQUIRED` observé en prod | preuve `bounded` : acheteur de test | gate reste `identity` |
| `T-05` | `W-03` | `proof` | redéployer, puis faire porter la prod par le build | `T-04` | NW | `in_progress` | déploiement `READY` portant le sha | fenêtre d'observation | build en échec |
| `T-06` | `W-03` | `proof` | prouver le refus sans intention | `T-05` | NW | `todo` | `reason=INTENT_REQUIRED` | nécessite une session acheteur | impossible sans intention réelle |
| `T-07` | `W-03` | `proof` | prouver que le quota **n'est plus** no-op | `T-03` | NW | `todo` | ligne créée dans `v2_route_requests` après un appel réel | `bounded` | table non écrite → code non déployé |
| `W-04` | `G-01` | `feature > docs` | `W4` | `W-03` | NW | `todo` | board + AGENTS + handoff à jour | — | nouvelle découverte |

## Risk and escalation classification

| Risk area | Classification | Required condition before Go |
|---|---|---|
| Migration additive sur base de production (table vide, aucune donnée touchée) | Risque ordinaire | Preuve sur branche jetable + apply vérifié, rollback = `drop table` |
| Dépense fournisseur facturé à la requête | **Engagement financier** | Quota actif (migration appliquée) **avant** d'ouvrir les itinéraires aux acheteurs |
| Autorisation / identité acheteur | Données personnelles, autorité de compte | Gate serveur, `INTENT_REQUIRED` prouvé, aucune coordonnée stockée |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-09-20 | Prod renvoie `401 AUTH_REQUIRED` après push ; le jeton est lu | `G-01` ouvert | `advance` | NW | après `W2` |
| 2026-09-20 | `v2_route_requests` absente ; branche applicative = `br-dawn-hill-am5amy22` (206 facilités) ; branche nommée `production` n'est **pas** la base de l'app (**4** facilités / 3 comptes) | `T-01` fermé ; `T-02` prêt | `advance` | NW | après `T-02` |
| 2026-09-20 | **L'outil de migration vise la branche *par défaut*** (`br-bitter-math`, 4 facilités) : la première préparation a été **annulée** et refaite sur la bonne branche. `057` prouvée sur clone jetable (`cols=3`, `indexes=2`, idempotente, quota 60/h, purge 48 h) | `T-02` fermé | `advance` | NW | — |
| 2026-09-20 | `057` appliquée sur la branche applicative via le **runner canonique** (`scripts/apply-migration.mjs`), checksum `d3ad51ef…` enregistré ; rejeu → `already_applied` | `T-03` fermé | `advance` | NW | — |
| 2026-09-20 | `ROUTING_REQUIRE_INTENT=1` **créée** en Production sur `omniview` ; aucune autre variable `ROUTING_*` | `T-04` fermé | `advance` | NW | — |
| 2026-09-20 | **Un déploiement créé par l'API ne reprend pas l'alias canonique** : `omni.sparkafrika.online` sert encore l'auto-déploiement de 12:38, **antérieur** à la variable. La réassignation d'alias par API échoue (`not_found`). ⇒ il faut **pousser un commit** pour que l'intégration GitHub promeuve le build | `T-05` réouvert | `pause` | NW | après nouveau push |
| 2026-09-20 | **La branche `intent` de `http.ts` (ligne 316) n'a AUCUN test HTTP** — `INTENT_REQUIRED` n'apparaît que dans `types.ts` et l'UI. Le dépôt n'utilise aucun `vi.mock`, et `createTrunkRepository` est un import direct : il n'existe **aucun seam** pour tester ce refus sans base réelle | nouvelle tâche `T-08` | `advance` | NW | — |
| 2026-09-20 | **Tension produit mesurée :** `hasLivePurchaseIntent` exige `q.expires_at > now()`, or le TTL QR est de **10 minutes** (FF-5). En base : **12 jetons QR, 0 vivant**. Un acheteur qui a **déjà choisi son offre** verra « choisissez cette offre » dès que le QR expire — soit presque toujours | nouvelle tâche `T-09` ; `T-06` reste **non prouvable aujourd'hui** | `escalate` | fondateur | décision fondateur |

## Handoff to Founder HQ

> **Local status:** `partial`
> **Gate decision:** `advance`
> **Closed:** `T-01` — branche applicative identifiée par empreinte de données (`v2_facilities` = 206, identique au comptage prod).
> **Open or blocked:** `T-02`…`T-07` — voir l'arbre ; aucun bloqueur technique à ce stade.
> **Resource Receipt:** 6 ressources chargées, 1 template instancié (ce document), 3 non chargées avec motif.
> **Residual gap:** la **vraie route** (géométrie d'itinéraire) n'est pas encore prouvée : elle exige une identité acheteur et une intention vivante. L'anonyme est refusé par conception.
> **Next smallest action:** prouver `057` sur une branche jetable, puis l'appliquer sur la branche applicative.
> **Re-plan trigger:** échec SQL, refus d'écriture Vercel, ou gate qui reste `identity` après redéploiement.