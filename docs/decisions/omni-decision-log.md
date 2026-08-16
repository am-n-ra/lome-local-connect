# Journal des décisions Omni

Ce journal accompagne [`../OMNI_MASTER_PRODUCT_INTERFACE.md`](../OMNI_MASTER_PRODUCT_INTERFACE.md). Une décision devient normative lorsqu’elle est intégrée au master et référencée ici.

| ID | Date | Décision | Alternatives rejetées | Impact |
|---|---|---|---|---|
| DEC-001 | 2026-08-16 | `OMNI_MASTER_PRODUCT_INTERFACE.md` est l’unique source de vérité normative. | Maintenir plusieurs masters concurrents. | Toute nouvelle règle produit/UI doit être ajoutée au master. |
| DEC-002 | 2026-08-16 | `OMNI_MASTER.md` est historique et pointe vers le master canonique. | Continuer à l’utiliser comme seconde référence active. | Les références de code et de documentation migrent vers le master canonique. |
| DEC-003 | 2026-08-16 | `omni-product-interface-spec.md` est conservée comme source intégrée/historique. | Supprimer la spécification et perdre la traçabilité. | Les nouvelles règles sont écrites dans le master. |
| DEC-004 | 2026-08-16 | Les panneaux horizontaux défilables des facilities sont un pattern officiel de découverte. | Remplacer les résultats par une liste verticale ou une page de résultats séparée. | Le pattern doit être documenté, accessible, responsive et ancré au canvas carte. |
| DEC-005 | 2026-08-16 | Omni reste map-first et stateful ; la carte ne doit pas être remplacée par des pages isolées. | Home → Search → Results → Facility → Checkout comme parcours séparé. | Les nouveaux flows doivent évoluer par états sur la carte. |
| DEC-006 | 2026-08-16 | Le bouton de recherche doit être une affordance distincte et partager le même contrat que `Enter`. | Utiliser le bouton de marque comme soumission implicite. | `SmartSearchBar`, `SearchDock` et `carte.tsx` doivent partager une soumission idempotente. |
| DEC-007 | 2026-08-16 | Quantité et budget restent masqués par défaut et éditables manuellement lorsqu’ils sont pertinents. | Afficher par défaut « Quantité 1 » et « Budget illimité ». | Le dock reste léger et les paramètres secondaires ne surchargent pas la découverte. |
| DEC-008 | 2026-08-16 | Les facilities unclaimed issues d’OSM sont découvrables, mais ne sont pas présentées comme possédées ni directement transactionnables. | Les traiter comme des vendeurs Omni actifs. | Les cards indiquent le statut et proposent le claim lorsque pertinent. |

## Format obligatoire des nouvelles décisions

Toute nouvelle entrée doit indiquer :

- l’identifiant et la date ;
- la règle retenue, formulée de manière testable ;
- les alternatives rejetées ;
- la section du master concernée ;
- l’impact UI, backend, base de données, auth, plan et tests ;
- la matrice de traçabilité à mettre à jour.
