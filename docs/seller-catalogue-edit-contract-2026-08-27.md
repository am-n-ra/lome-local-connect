# Seller catalogue edit contract — 2026-08-27

## Mini-seed

Un vendeur autorisé doit pouvoir corriger une offre déjà publiée sans contourner la règle de réduction obligatoire ni modifier directement une offre publique sans étape de republication. Cette tranche vise le chemin `Seller > Catalogue > offre publiée > Modifier > draft > Publier`.

## Mini-root

L’autorisation reste serveur-side : l’utilisateur doit être lié à un compte Seller non suspendu, en état `seller_ready`, et le produit doit appartenir à une facilité détenue par ce compte avec un facility slot assigné. Une offre publiée éditée revient à l’état `draft`; elle n’est donc plus présentée publiquement jusqu’à republication. La limite Free de cinq offres publiées et l’absence de réduction valide restent bloquantes.

La création, l’édition et la transition utilisent les contrats API existants. Aucun nouveau rôle, aucune migration et aucune donnée de paiement ne sont requis. Les paiements externes et le Wallet restent hors de cette tranche.

## Mini-trunk

Le Seller voit une action `Modifier` pour toute offre non archivée. L’édition met à jour le produit, le repasse en `draft`, puis le Seller peut le republier. Les erreurs de propriété, de validation et de limite restent affichées et récupérables.

## Mini-heartwood

Une offre publiée modifiée ne doit pas rester silencieusement publiée avec des prix ou réductions nouveaux. L’édition d’une offre archivée reste interdite. Les contrôles existants de réduction et de propriété sont conservés. Les tests couvrent l’autorisation et le build.

## Acceptance

La tranche est acceptée lorsque le serveur accepte uniquement les produits appartenant au Seller autorisé, transforme une offre publiée en draft lors de l’édition, que l’interface expose l’action pour les produits publiés, et que les tests et le build passent sans fuite de secret ni régression des limites Free/Pro.

## Status

Owner: Omni product delivery. Classification: bounded implementation until browser proof with an authorized Seller session. Review trigger: any future change allowing direct publication edits or introducing product validation workflows.
