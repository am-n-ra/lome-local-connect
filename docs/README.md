# Documentation Omni

## Source de vérité

[`OMNI_MASTER_PRODUCT_INTERFACE.md`](./OMNI_MASTER_PRODUCT_INTERFACE.md) est l’unique document normatif d’Omni. Il décrit le produit, les flows, l’interface, les règles buyer/seller, la carte, la recherche, la disponibilité, la transaction, les plans, l’IA, les données, le responsive et les critères d’acceptation.

> Toute nouvelle décision produit ou UI doit être ajoutée au master avant l’implémentation. Un brainstorming, un ticket, un rapport ou un ancien plan ne peut pas remplacer le master.

## Hiérarchie documentaire

| Document ou répertoire | Statut | Usage |
|---|---|---|
| [`OMNI_MASTER_PRODUCT_INTERFACE.md`](./OMNI_MASTER_PRODUCT_INTERFACE.md) | **Normatif** | Source de vérité unique et active. |
| [`omni-product-interface-spec.md`](./omni-product-interface-spec.md) | Source intégrée / historique | Spécification précédente conservée pour traçabilité. Les nouvelles décisions vont dans le master. |
| [`OMNI_MASTER.md`](./OMNI_MASTER.md) | Remplacé | Pointeur historique vers le master canonique. |
| [`omni-platform-traceability-matrix.md`](./omni-platform-traceability-matrix.md) | Exécution | État réel des exigences et liens vers le code/tests. |
| `decisions/` | Décisions acceptées | Arbitrages courts reliés à une section du master. |
| `reports/` | Informatif | Rapports de bugs, diagnostics et validations de déploiement. |
| `.lovable/plan/` | Historique / proposition | Plans générés ou brainstormings ; non normatifs tant qu’ils ne sont pas intégrés au master. |

## Règle de changement

Toute évolution suit ce cycle :

1. Ajouter ou modifier la règle dans le master.
2. Enregistrer l’arbitrage dans [`decisions/omni-decision-log.md`](./decisions/omni-decision-log.md).
3. Mettre à jour [`omni-master-traceability.md`](./omni-master-traceability.md) et, lorsque pertinent, la matrice de plateforme existante.
4. Implémenter le code et les tests.
5. Mettre à jour le statut de conformité dans le master et la matrice.

## Conventions de statut

- **Normatif** : doit guider toute nouvelle implémentation.
- **Accepté** : décision validée, intégrée ou liée au master.
- **Partiel** : une implémentation existe mais ne satisfait pas encore entièrement la cible.
- **Planifié** : cible décrite mais non implémentée.
- **Bloqué** : dépend d’une décision, d’une authentification, d’une API, d’une migration ou d’une configuration externe.
- **Historique** : conservé pour comprendre l’évolution, mais ne peut pas contredire le master.
- **Proposition** : idée de brainstorming, sans valeur d’instruction de build tant qu’elle n’est pas acceptée.
