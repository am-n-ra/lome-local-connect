# Audit de cohérence Omni Atlas Glass

**Date : 18 août 2026**  
**Source de vérité :** `docs/omni-master-build-prompt.md` et `docs/omni-build-acceptance-matrix.md`  
**Périmètre :** audit read-only initial, aucune mutation métier

## Constats production initiaux

### Seller `/vendeur`

La production affiche simultanément une surface d’onboarding seller (`Créez votre fiche commerce`, champs nom/catégorie/téléphone/adresse/description, bouton `Créer ma fiche et continuer`) et une Console seller déjà rendue derrière ou sous cette surface (`Facility active · vue globe`, `Catalogue`, `Demandes reçues`, `Scanner QR`, `Omni Wallet`, `Coupons`, mission et compteurs). Cette composition est incohérente : un seller en onboarding ne devrait pas voir la Console opérationnelle active en même temps. Il faut choisir explicitement l’état onboarding ou l’état console, puis ne rendre la transition qu’après sauvegarde réussie.

La Console observée contient encore un vocabulaire et une densité qui dépassent la mission V1 : `Facility active · vue globe`, `Surface seller map-first`, `Vos opérations autour de cette facility`, un bouton `Afficher les opérations`, les compteurs `Fiches/Produits/Demandes/Coupons`, ainsi que six onglets dont `Omni Wallet` et `Coupons`. Le master attend une Console plus courte, mission-first, quatre raccourcis V1 et un contexte Carte/Console plus lisible. Ces éléments ne sont pas tous incorrects métier, mais leur hiérarchie actuelle produit un dashboard plutôt qu’une console de mission.

La mission observée peut rendre `Aucune demande en direct actuellement` dans un bloc sombre qui conserve une grande structure mission. L’état vide devrait proposer une action de retour utile et une explication plus courte sans laisser croire qu’une mission est active.

### Transaction Room et reprise

Le code montre deux couches de rating : `OrdersPanel` rend une section `À confirmer` avec étoiles, puis rend aussi une `TransactionThreadCard` pour chaque commande, laquelle rend sa propre section rating lorsqu’elle est `received` ou `rating_pending`. Cette duplication peut expliquer des affichages de reprise où une même transaction apparaît dans un bloc d’action puis dans une card complète.

La `TransactionThreadCard` calcule une progression cinq étapes avec `currentStep = 4` pour `completed`, ce qui laisse la dernière étape `Réception` active alors que la transaction est terminée. La progression doit avoir un état final explicite ou afficher `Terminée` après rating, au lieu de réutiliser `Réception active`.

Les labels de la room mélangent `Paiement à choisir`, `J’ai payé`, `Paiement reçu par le vendeur`, `Je confirme la réception`, `Votre avis est la dernière étape` et `Publier l’avis et terminer`. Ils sont globalement corrects mais doivent être regroupés sous un seul bloc `MAINTENANT` avec une action courante, sans répéter la même décision dans plusieurs panneaux.

### Menu et navigation

`NavMenuSheet` reçoit encore `activeRole` et `onSwitchRole` mais ne rend pas la bascule de rôle. Il expose seulement Transactions, Messages, Recherches enregistrées et Panier. Le master attend un contexte compte avec rôle courant/bascule lorsque nécessaire, wallet et destinations réellement implémentées. Il faut soit ajouter une bascule fonctionnelle, soit supprimer les props mortes et documenter la bascule dans le chrome contextuel buyer/seller.

### Buyer mobile et overlay

Les captures précédentes à 320, 390, 768 et 1024 px montrent un dock dans la largeur, mais la bannière PWA peut apparaître juste au-dessus du dock et concurrencer visuellement la zone de recherche. Le rendu doit être vérifié sur toutes les surfaces ouvertes, notamment rail, fiche, room et menu, pas uniquement au repos.

## Hypothèses à confirmer pendant l’audit

Le chevauchement onboarding/Console peut provenir d’un état de session fixture incohérent ou d’un rendu route qui ne bloque pas le shell map-first pendant l’onboarding. Il faut vérifier le code de garde et l’état `onboarding_done` avant de modifier l’UI. Les corrections ne doivent pas toucher au canvas MapLibre, aux pins, aux clusters, à la discovery OSM ni aux contrats transactionnels.

## Confirmation seller après hydratation

Après rendu complet de `/vendeur`, l’onboarding n’est plus visible : la Console est bien la surface active. La divergence principale confirmée est donc la densité et la hiérarchie, non un double rendu permanent. La Console affiche une même demande `lait` deux fois avec les mêmes contrôles `Disponible / Partiel / Indisponible`, tandis que l’encart mission indique `Demandes 0` et la zone `Demande de disponibilité` rend malgré tout deux demandes live. Cela crée une contradiction directe entre le compteur et le contenu opérationnel.

La Console affiche simultanément six onglets (`Facility`, `Catalogue`, `Demandes reçues`, `Scanner QR`, `Omni Wallet`, `Coupons`), un grand bloc `Surface seller map-first`, une colonne `À garder sous la main`, puis la mission. Le contenu est fonctionnel mais trop chargé pour le rôle de mission prioritaire défini par le master. Le doublon de demande doit être corrigé côté chargement/déduplication ou rendu, tandis que le compteur doit partager exactement la même source que la liste affichée.
