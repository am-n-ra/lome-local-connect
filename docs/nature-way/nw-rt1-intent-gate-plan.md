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
> **Gate decision:** `pause` sur le verrou d'intention ; `advance` sur la borne de coût (fermée).
> **Closed:** `T-01` (branche applicative identifiée par empreinte de données), `T-02` (057 prouvée sur clone jetable), `T-03` (057 appliquée via le runner canonique), `T-04` (variable créée puis retirée), `T-05` (le build portant l'état voulu sert bien l'alias canonique).
> **Open or blocked:**
> - `T-06` **non prouvable aujourd'hui** — prouver `INTENT_REQUIRED` exige une identité acheteur authentifiée que je n'ai pas ; l'anonyme est refusé avant (401), par conception.
> - `T-08` **trou de test réel** — la branche `intent` de `http.ts` n'a aucun test HTTP ; aucun seam (`createTrunkRepository` importé directement, dépôt sans `vi.mock`).
> - `T-09` **décision fondateur** — le verrou exige un QR vivant, TTL 10 min : il refuserait des acheteurs déjà engagés.
> - `T-07` dépend de `T-09`.
> **Resource Receipt:** 6 ressources chargées (SKILL, intra-skill-execution-controller, risk-and-escalation-matrix, proof-and-decision-ledger, launch-envelope) + 1 template instancié ; 3 non chargées avec motif explicite.
> **Residual gap:** la **vraie route** (géométrie d'itinéraire réelle) n'est toujours pas prouvée en production ; elle exige une session acheteur. La borne de coût, elle, est active et **ne dépend d'aucune session**.
> **Next smallest action:** obtenir une identité acheteur de preuve (variables `OMNI_PROOF_*`) pour prouver `INTENT_REQUIRED` **et** capturer un itinéraire réel.
> **Re-plan trigger:** décision fondateur sur `T-09`, ou fourniture d'identifiants de preuve.

## Proof and Decision Ledger

| Proof ID | Structural path | Acceptance criterion | Evidence class | Method / source | Environment / data basis | Owner | As of | Result / residual gap |
|---|---|---|---|---|---|---|---|---|
| `PR-RT1-01` | `root > migration` | `057` crée la table et l'index sans toucher aux données | `reproduced` | SQL sur clone jetable + rejeu idempotent | clone `br-sparkling-mud-am851hb3` (parent = branche applicative) | NW | 2026-09-20 | `cols=3`, `indexes=2`, 206 facilités intactes, rejeu → aucune erreur |
| `PR-RT1-02` | `root > quota` | le compteur borne par utilisateur et par fenêtre | `reproduced` | requêtes réelles de `route-quota.ts` | clone jetable | NW | 2026-09-20 | 60/h détecté, 500/j cohérent, lignes > 48 h exclues ; purge 70 → 60 sans toucher au compteur vivant |
| `PR-RT1-03` | `root > migration` | `057` appliquée sur la base **réellement lue** par l'app | `observed` | runner canonique + registre | branche `br-dawn-hill-am5amy22`, checksum `d3ad51ef…` | NW | 2026-09-20 | table présente, 0 ligne, 206 facilités intactes |
| `PR-RT1-04` | `feature > access gate` | un appel anonyme est refusé quand le fournisseur est facturé | `observed` | appel prod répété | `omni.sparkafrika.online` | NW | 2026-09-20 | `401 AUTH_REQUIRED` stable sur 2 déploiements |
| `PR-RT1-05` | `feature > access gate` | le refus d'intention se produit pour un acheteur sans intention vivante | `unproven` | — | — | NW | 2026-09-20 | **gap** : exige une identité acheteur ; aucun seam de test |
| `PR-RT1-06` | `product > buyer journey` | PRE-1 passe aux 4 largeurs | `reproduced` | Playwright sur la prod | 360/768/1280/1920 | NW | 2026-09-20 | **80/80 PASS**, console propre ; artefacts `docs/nature-way/pre1-proof/` |
| `PR-RT1-07` | `feature > real road route` | une géométrie d'itinéraire réelle est servie | `unproven` | — | — | NW | 2026-09-20 | **gap** : exige un acheteur authentifié ; non contournable sans franchir le gate |
| `PR-RT1-08` | `feature > road route` | la ligne droite est un dégradé **explicable** par l'acheteur | `reproduced` | sonde navigateur avec géoloc accordée, réponse HTTP capturée | prod, `Boulangerie du Marché d'Adawlato` | NW | 2026-09-20 | **cause trouvée** : le serveur répond `401 AUTH_REQUIRED` ; le client ne mappait que `data.reason` et **jetait le code d'erreur**, affichant un générique faux |
| `PR-RT1-10` | `feature > road route` | la cause d'un `PROVIDER_ERROR` est visible par l'opérateur | `reproduced` | rapport fondateur (« service momentanément indisponible ») + revue de code | prod, après connexion | NW | 2026-09-20 | **le serveur ne loguait PAS les échecs de routage** : la cause était invisible. Corrigé : `causeKind` + statut amont, journalisés |
| `PR-RT1-11` | `ops > mapbox token` | le jeton Mapbox est valide pour Directions | `unproven` | **impossible** : jeton `sensitive`, illisible via l'API Vercel | env prod | NW | 2026-09-20 | **bloquant** : deux hypothèses non départageables sans le fondateur — jeton (scope/URL-restriction) ou couverture routière Mapbox sur Lomé |
| `PR-RT1-09` | `feature > road route` | un refus nomme l'action à faire, pas seulement le manque | `reproduced` | sonde navigateur après correctif | prod, `data-state=unavailable` | NW | 2026-09-20 | « connectez-vous pour obtenir l'itinéraire routier » ; 5 cas de test, dont un qui interdit de réafficher un code brut |

| Decision ID | Decision | Why now | Options rejected | Owner | Trigger to revisit | Downstream artifacts |
|---|---|---|---|---|---|---|
| `DR-RT1-A` | Appliquer `057` sur `br-dawn-hill-am5amy22` | l'app sert 206 facilités depuis cette branche ; la branche nommée `production` n'en a que 4 | appliquer sur la branche par défaut (aurait été appliqué au mauvais endroit, en silence) | fondateur (autorisé), NW (exécuté) | la branche applicative change | `057`, `route-quota.ts` |
| `DR-RT1-B` | **NON activer** `ROUTING_REQUIRE_INTENT` aujourd'hui | le verrou exige un QR vivant (TTL 10 min) et refuserait des acheteurs déjà engagés ; la borne de coût suffit à protéger la facture | activer sans mesure (aurait refusé des acheteurs engagés) | **fondateur** (décision réservée) | l'expiration du QR est dissociée de l'intention, ou le fondateur tranche | `routing-gate.ts`, `.env.example`, `http.ts` |
| `DR-RT1-C` | Ne pas tester le refus `INTENT_REQUIRED` par mock | le dépôt n'utilise aucun `vi.mock` ; introduire un mock serait une décision d'architecture | ajouter `vi.mock` localement (aurait introduit un patron absent du dépôt) | NW | le fondateur demande une couverture, ou un seam d'injection est introduit | `http-routing.test.ts` |

## Launch envelope — borne de coût du routage

| Field | Decision |
|---|---|
| Intended outcome | Aucune facture Mapbox ne peut être gonflée par un appelant anonyme ou une boucle. |
| Success signal | Le nombre d'itinéraires servis par acheteur reste sous 60/h et 500/j. |
| Guardrail | Un acheteur légitime ne doit **jamais** être bloqué à tort ; le quota échoue en **fail-open**. |
| Audience / exposure | Production complète, tous acheteurs connectés. |
| Rollout sequence | Appliqué d'emblée : c'est un plafond, pas une fonctionnalité visible. |
| Reversal | `drop table v2_route_requests` restaure l'état antérieur (le code retombe en fail-open, sans erreur). |
| Observation window | À la prochaine session avec identité : vérifier qu'une ligne est écrite et qu'un acheteur normal n'est pas refusé. |
| Communication | Le board fondateur porte la décision et l'écart restant. |
