# Plan intra-skill — NW-PROD-OMNI-SEED2-01

> **HQ plan ID :** `HQ-OMNI-2026-09-02`
> **Plan local ID :** `NW-PROD-OMNI-SEED2-01`
> **As of :** 2026-09-23 (UTC)
> **Gate actif :** Seed reconciliation + Species reconciliation (réouverts par le fondateur)
> **Objectif :** rétablir une direction unique et cohérente pour Omni **sans perdre** les comportements éprouvés de l'app réelle.
> **Owner :** Nature Way (product authority) · décisions : fondateur
> **Contrainte de capacité :** une tranche active à la fois (fondateur solo + IA)
> **Déclencheur de re-plan :** refus de la fusion · choix de modèle entité différent · contradiction de la maquette avec une décision S-xx

## Graphe de travail

| ID | Parent | Chemin structurel | Phase | Objectif | Dépendance | Owner | Statut | Critère d'acceptation | Preuve attendue | Risque/dette | Ressource | Re-plan |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| T-01 | — | product > direction | Seed | Rouvrir le Seed et rétablir une intention unique | — | Fondateur | `done` | dirigeant confirme la fusion maquette+app | **D-1a (fusion) — 2026-09-23** | COH-V2-01/02 | `founder-intent-discovery.md` | refus |
| T-02 | T-01 | product > direction | Seed | Trancher le **modèle entité** (E-01) : offre → entité, pas facility | T-01 | Fondateur | `done` | décision Root « entité » écrite | **D-2a (offre appartient à l'ENTITÉ) — 2026-09-23** | COH-V2-03 (haute) | `prerequisite-architecture.md` | modèle alternatif |
| **T-09** | T-01 | product > couverture | **Root** | **Trancher la couverture de base mondiale des lieux** (SCOUT-01) : OSM back-fill borné, dedup `unclaimed`, market `GLOBAL` — ou non | T-01 | **Fondateur** | `review` | **D-COV-1/D-COV-2 écrites** | décision écrite + SDM couverture | SCOUT-01 (haute) | `prerequisite-architecture.md` | refus (c) |
| **T-10** | T-01 | product > transaction | **Root** | **Trancher le cycle d'expiration honnête** (SCOUT-02/03) : « En cours » actionnable, section Expirées + Relancer, notif, délais par étape | T-01 | **Fondateur** | `review` | **D-EXP-1…4 écrites** | décision écrite | SCOUT-02 (haute) | `risk-and-escalation-matrix.md` | — |
| T-03 | T-02 | product > contrat | Root | Contrat : visuel obligatoire (E-03) + avantage >0 (E-04) | T-02 | Nature Way | `planned` | refus serveur écrit + migration additive | migration + test | COH-V2-04/05 | `technical-lead-production-review.md` | — |
| T-04 | T-02 | product > confiance | Root | Trancher **opérateur terrain** distinct (E-09) | T-02 | Fondateur | `planned` | décision rôle écrite | SDM E-09 | COH-V2-07 | `risk-and-escalation-matrix.md` | — |
| T-05 | T-03 | product > confiance | Root | **Réputation + intégrité par offre** (E-05) | T-03 | Nature Way | `planned` | table + recalcul + affichage | preuve bornée | COH-V2-06 | `proof-and-decision-ledger.md` | — |
| T-06 | T-03 | product > transaction | Trunk | **Room acheteur** (E-08) symétrique vendeur | T-03 | Nature Way | `planned` | suivi+chat+reçu, serveur | test + navigateur | COH-V2-08 | `autonomous-delivery-gates.md` | — |
| T-07 | T-01 | product > design | Species | **Hériter** les comportements app dans la maquette V2 | T-01 | Nature Way | `done` | reduced-motion/safe-area/focus/100svh déclarés ou intégrés | **audit 10 écrans, 13 comportements récupérés, commits `0e8c78e`→`4247bf4`** | COH-V2-02/10…17 | `visual-and-logic-coherence-review.md` | — |
| T-08 | T-01 | product > design | Species | Réconcilier `docs/design.md` vers V2 | T-07 | Nature Way | `done` | design.md pointe la bonne vérité | **`design.md` réconcilié, push `220c949`** | COH-V2-01 | — | — |

## Séquence

1. ~~**T-01 + T-02** (décisions fondateur — Seed)~~ — **tranchés** : D-1a (fusion) + D-2a (entité).
2. ~~**T-07/T-08** (Species réconcilié, héritage comportemental)~~ — **faits** (audit 10 écrans).
3. **T-09 + T-10 (décisions Root fondateur) — BLOQUANT, en `review`.** Le scout a révélé
   deux incohérences de **racine** que l'audit visuel ne pouvait pas voir : la couverture
   mondiale de lieux orpheline (SCOUT-01) et l'impasse d'expiration (SCOUT-02).
4. Puis **T-03** (Root contrat) → **T-04**, **T-05**, **T-06** (dépendants).
5. Aucun code produit avant **T-09 et T-10**.

## Mise à jour 2026-09-23 (passe scout) — Resource Receipt

| Statut | Chemin exact |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` (invocation complète) |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way/references/prerequisite-architecture.md` |
| Loaded | `.agents/skills/nature-way/templates/system-dependency-map.md` |
| Loaded | `.agents/skills/nature-way/templates/intra-skill-plan.md` |
| Not loaded / reason | `founder-intent-discovery.md` — Seed T-01/T-02 déjà tranchés, trigger absent |
| Not loaded / reason | `technical-lead-production-review.md`, `risk-and-escalation-matrix.md`, `autonomous-delivery-gates.md`, `proof-and-decision-ledger.md`, `visual-and-logic-coherence-review.md` — **se déclencheront** sur T-03/T-05/T-06/T-09/T-10 (Root/Trunk), pas encore actifs |
| Not loaded / reason | `execution-plan-and-task-tree.md`, `production-evidence-register.md`, `launch-envelope.md` — phases Trunk/Canopy non actives |

## Découverte de méthode (passe scout, à ne pas réapprendre)

**L'audit visuel ne peut pas voir les incohérences de racine.** L'audit (A) a refermé la
cohérence *maquette ↔ app*. Le scout a révélé une **classe de défaut différente** :
la reconstruction (`TrunkAppV13`) a recréé l'UI **sans rebrancher la couche de données**.
Deux occurrences : OSRM (itinéraire), puis la couverture OSM des lieux.

→ **Règle ajoutée au protocole local :** après tout refactor de coquille, lancer le contrôle
anti-orphelin (`grep` importeurs) **avant** de conclure qu'une capacité n'existe pas.

## Resource Receipt

| Statut | Chemin exact |
|---|---|
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way/references/prerequisite-architecture.md` |
| Loaded | `.agents/skills/nature-way/templates/system-dependency-map.md` |
| Loaded | `.agents/skills/nature-way/templates/intra-skill-plan.md` (structure appliquée) |
| Loaded | `.agents/skills/nature-way/` inventory (12 references, 5 templates) |
| Not loaded / reason | `founder-intent-discovery.md`, `technical-lead-production-review.md`, `autonomous-delivery-gates.md`, `visual-and-logic-coherence-review.md`, `proof-and-decision-ledger.md`, `risk-and-escalation-matrix.md` — **non déclenchés** avant la décision T-01/T-02 qui ouvre leur phase |
| Not loaded / reason | `execution-plan-and-task-tree.md`, `production-evidence-register.md`, `launch-envelope.md` — phases Trunk/Canopy non actives |

## Correction d'état 2026-09-23 (protocole — lecture de l'état réel)

**Erreur corrigée :** j'ai affirmé à deux reprises que « Seed/Species sont clôturés » puis
« nous sommes au Root System ». **Faux.** L'état réel est écrit dans
`docs/founder-hq/founder-hq-master-plan.md` §« HQ RECONCILIATION — 2026-09-23 » :

- **Declencheur fondateur :** « on a assez tourne en rond… je pense qu'on a rate tout le
  process depuis Species » + « j'ai moi-même assez oublié tout ce que je veux qu'Omni fasse. »
- **Porte actuelle :** **Seed reconciliation + Species reconciliation (reouverte)** — pas Root.
- **`docs/nature-way/omni-intent-brief-v2-2026-09-23.md`** : **Seed CLOS,
  `founder-confirmed` 2026-09-23**, 34 décisions **S-01…S-34**, « c'est ça » (fondateur).
- **Prochain explicitement écrit :** réconciliation masters → SDM V2 →
  **Species V2** (maquette montrée au fondateur dans le navigateur), ordre
  **acheteur → offreur → échelle d'existence**.
- La ligne G-01/G-02 `done` du Master Plan est l'état **V1 du 2026-09-02**, **superseded**
  par la réouverture du 2026-09-23 — pas l'état courant.

**Conséquence sur le plan :** le tableau T-01…T-10 ci-dessus décrit un état où
T-01/T-02 étaient « en review ». → **T-01 et T-02 sont `done`** (D-1a fusion, D-2a entité).
Les décisions **S-xx V2** n'étaient pas dans ce tableau : **le plan doit être réétalonné
sur les S-xx** (tâche T-11 ci-dessous).

| ID | Parent | Chemin structurel | Phase | Objectif | Dépendance | Owner | Statut | Critère d'acceptation | Preuve attendue | Risque/dette | Re-plan |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **T-11** | T-01 | product > species | **Species** | **Réétalonner le plan V2 sur les 34 décisions S-01…S-34** : cartographier chaque S-xx → surface maquette (présente/partielle/absente) → tranche | T-01, Intent Brief V2 | Nature Way | `done` | table S-xx → surface → tranche, zéro décision orpheline | table dans un registre Species V2 | COH-V2-18 (audit mesuré contre MV1) | audit clos à tort |
| **T-12** | T-11 | product > species | **Species** | **Audit de conformité Species V2** — **LIVRÉ (refait) 2026-09-23** par **rendu navigateur réel** (Playwright), pas par grep. 16/16 conforme ; 1 écart réel trouvé **et corrigé** (S-01 : la fiche affirmait « sept caractéristiques » sans rendre Retrait/livraison). Falsifié (3 modes + 2 faiblesses de l'audit corrigées). Harnais `npm run check:species-t12`. | T-11 | Nature Way | `done` | verdict par décision : conforme / partielle / absente, par texte **rendu** | `docs/nature-way/omni-species-v2-conformance-audit-T12-2026-09-23.md` | audit source-grep trompeur | fondateur rouvre une décision |

| **T-14** | T-12 | product > seed-coherence | **Seed** | **Diagnostic de cohérence Seed V2 ↔ maquette ↔ code** — livré : **7 incohérences mesurées** (C-1…C-7) derrière **une seule racine** — `v2_products.facility_id not null` contredit **S-25** (« il n'y a pas de produit appartenant à une facilité ») et **S-01/S-02** (modèle universel) ; Pro par facilité contredit « Pro = par entité » ; plafond 5 vs **20** ; bulk `ceil(N/100)` vs « 1 besoin = 1 bulk » ; seuil 3 uniforme vs seuil par volume. La maquette **suit** le Seed ; **le socle ne suit pas**. | T-12 | Nature Way | `review` | décision fondateur **D-C1/C2/C3** rendue et écrite | `docs/nature-way/omni-seed-vs-code-coherence-register-2026-09-23.md` | le fond soupçonné ≠ fond prouvé (chemins cités) | contredit S-01/S-02/S-25/S-14/S-19 éco | décision fondateur, ou offre réelle hors moule qui casse le schéma |
| **T-13** | T-11 | product > species | **Species** | **Produire les tranches SP-1…SP-6** (`SP-1` + `SP-2` + `SP-3` **livrés** 2026-09-23) (SP-1 caractéristiques d'offre → SP-2 échelle 0→4 → SP-3 double niveau → SP-4 intégrité/réputation d'offre → SP-5 filtres carte → SP-6 compléments) | T-11, **validation fondateur** | Nature Way | `in_progress` | surfaces dessinées dans la maquette V2, cohérentes avec `design.md` | diff maquette + capture | S-01/S-06/S-11/S-32 non démontrés | `visual-and-logic-coherence-review.md` | fondateur refuse SP |

**T-11 rendu :** registre `docs/nature-way/omni-species-v2-decision-registry-2026-09-23.md` —
34 décisions cartographiées, **0 orpheline**. **Species n'est PAS close** : la maquette ne démontre
pas **S-01** (caractéristiques d'offre : 0 surface), **S-06** (échelle 0→4 : 0 occurrence),
**S-11** (double niveau : 0), **S-32** (intégrité/réputation d'offre : absent).
**T-13 = le vrai travail Species restant ; bloqué sur validation fondateur de SP-1…SP-6.**
**État 2026-09-23 (fin de session) :** `SP-1…SP-6` sont **livrés** (chacun prouvé à l'écran + garde
falsifié, 5 modes pour SP-6). **Ils ne sont pas validés.** La clôture de Species V2 est une
**décision fondateur**, pas une conséquence de la livraison — *incident du 2026-09-23 : Species a
été close à tort après la livraison, et une porte Root a été ouverte à tort « pour préparer ».
Voir `docs/founder-hq/current-state.md` §Correction d'exécution.*

**Clarification :** la maquette V2 contient **déjà** des surfaces des décisions S-xx
(`Lieu connu`/`Non revendiquée`/`Revendiquer` pour S-05/S-18 ; `WhatsApp`/`numéro` pour S-16 ;
`transport` pour S-10). Mais plusieurs **décisions structurantes n'ont aucune surface** :
**S-06 échelle 0→4** (`Discoverable/Queryable/Available/Transactable` : 0 occurrence),
**S-11 double niveau** (`Queryable` : 0), **S-13 filtres carte** (`ambulant` : 0),
**S-32 intégrité/réputation d'offre** (badge absent). → **T-11/T-12 sont le vrai travail Species.**
