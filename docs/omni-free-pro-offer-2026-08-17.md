# Omni — Plans Free et Pro actuellement proposés

## Positionnement

Omni est d’abord un moteur de recherche géospatial. Le plan Free permet d’être trouvé, de gérer une offre de base et de participer à la boucle availability → QR → transaction externe. Le plan Pro amplifie la visibilité, la gestion et l’analyse ; il ne remplace jamais une vérification facility et ne fabrique aucun badge de confiance.

## Matrice des capacités

| Capacité | Free | Pro actuel | État de réalisation |
|---|---|---|---|
| Être découvert dans la recherche | Oui | Oui, visibilité/campagnes supérieures | Actif V1 |
| Revendiquer une facility | Oui, sous vérification | Oui, avec outils de gestion supérieurs | Actif / audit trail en place |
| Catalogue | 5 produits maximum | Limite supérieure selon entitlement | Actif |
| Médias facility/produit | Base selon les composants activés | Gestion enrichie | Partiel selon configuration media |
| Availability live | Oui | Oui, priorisation et suivi améliorés | Actif V1 |
| Chat transactionnel | Oui | Oui, historique et pilotage améliorés | Actif, contexte transactionnel buyer ajouté |
| QR et transaction externe/manual | Oui | Oui | Actif V1 |
| Coupons | Coupon seller basique | Ciblage, budgets et analytics avancés | Fondation offres personnalisées livrée |
| Publicité | Campagnes limitées ou indisponibles | Campagnes sponsorisées manuelles | Campagnes existantes, IA en draft uniquement |
| Analytics | Synthèse opérationnelle | Funnel et performance avancés | Instrumentation à finaliser |
| Balance FedaPay | Dépôt et solde opérationnel | Buckets et crédits dédiés | Ledger segmenté livré |
| Support IA | Non automatique | Suggestions en brouillon après validation | Ne pas présenter comme automatisé |

## Unlocker de test Pro

Après **trois transactions éligibles atteignant `completed`**, une facility Free devient éligible à un crédit de test Pro de **20 USD**. Le crédit est non monétaire, non transférable, accordé une seule fois, soumis aux contrôles anti-abus et à une date d’expiration. L’état actuel est calculé côté serveur dans `seller_unlocks` et affiché comme `En progression` ou `Éligible`.

Le crédit ne doit pas être présenté comme disponible tant que l’utilisateur n’a pas accepté l’activation et que le serveur n’a pas créé l’écriture `pro_test_credit` dans le ledger. Une transaction annulée, remboursée ou frauduleuse ne compte pas comme vente qualifiante.

## Règles commerciales

Les montants de publicité, de dépôt FedaPay, de coupon et de crédit Pro sont distincts. Un solde de wallet n’est pas automatiquement un budget publicitaire ; un crédit Pro n’est pas retirable ; une remise coupon n’est pas une réduction Omni financée sans sponsor identifié.

Le bouton Pro doit toujours afficher la limite ou le bénéfice concret concerné, le prix ou crédit applicable, la durée, la date d’expiration et les conditions. Une fonction non implémentée doit être retirée de l’action principale ou marquée clairement `Bientôt disponible`.

## Critères d’acceptation

Le dashboard seller doit afficher le plan actuel, le nombre de ventes qualifiantes, l’état de l’unlocker et les balances séparées. Les permissions serveur doivent faire foi ; masquer un bouton ne constitue pas un contrôle d’accès. Toute activation Pro doit générer une écriture d’audit et ne doit pas modifier le statut de confiance de la facility.
