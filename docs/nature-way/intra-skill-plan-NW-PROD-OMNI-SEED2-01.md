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
| T-01 | — | product > direction | Seed | Rouvrir le Seed et rétablir une intention unique | — | Fondateur | `review` | dirigeant confirme la fusion maquette+app | décision écrite | COH-V2-01/02 | `founder-intent-discovery.md` | refus |
| T-02 | T-01 | product > direction | Seed | Trancher le **modèle entité** (E-01) : offre → entité, pas facility | — | Fondateur | `review` | décision Root « entité » écrite | SDM E-01 mis à jour | COH-V2-03 (haute) | `prerequisite-architecture.md` | modèle alternatif |
| T-03 | T-02 | product > contrat | Root | Contrat : visuel obligatoire (E-03) + avantage >0 (E-04) | T-02 | Nature Way | `planned` | refus serveur écrit + migration additive | migration + test | COH-V2-04/05 | `technical-lead-production-review.md` | — |
| T-04 | T-02 | product > confiance | Root | Trancher **opérateur terrain** distinct (E-09) | T-02 | Fondateur | `planned` | décision rôle écrite | SDM E-09 | COH-V2-07 | `risk-and-escalation-matrix.md` | — |
| T-05 | T-03 | product > confiance | Root | **Réputation + intégrité par offre** (E-05) | T-03 | Nature Way | `planned` | table + recalcul + affichage | preuve bornée | COH-V2-06 | `proof-and-decision-ledger.md` | — |
| T-06 | T-03 | product > transaction | Trunk | **Room acheteur** (E-08) symétrique vendeur | T-03 | Nature Way | `planned` | suivi+chat+reçu, serveur | test + navigateur | COH-V2-08 | `autonomous-delivery-gates.md` | — |
| T-07 | T-01 | product > design | Species | **Hériter** les comportements app dans la maquette V2 | T-01 | Nature Way | `planned` | reduced-motion/safe-area/focus/100svh déclarés ou intégrés | diff maquette | COH-V2-02 (haute) | `visual-and-logic-coherence-review.md` | — |
| T-08 | T-01 | product > design | Species | Réconcilier `docs/design.md` vers V2 | T-07 | Nature Way | `planned` | design.md pointe la bonne vérité | head design.md | COH-V2-01 | — | — |

## Séquence

1. **T-01 + T-02** (décisions fondateur — Seed) — **bloquant**, en `review`.
2. Puis **T-07/T-08** (Species réconcilié, héritage comportemental).
3. Puis **T-03** (Root contrat) → **T-04**, **T-05**, **T-06** (dépendants).
4. Aucun code produit avant **T-01 et T-02**.

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
