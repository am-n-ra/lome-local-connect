# Notes de certification production V1

Date: 2026-08-17

## Buyer `/carte`

La page `https://omni.sparkafrika.online/carte` répond en production et rend un globe MapLibre clair sur fond crème/blanc, avec l’attribution OpenFreeMap/OpenStreetMap masquée derrière le contrôle dédié. Le chrome minimal affiche les notifications et le menu hamburger. Le dock de recherche est présent et propose le bouton de lancement ainsi que la recherche vocale.

Au premier chargement sans permission de localisation, l’interface affiche l’état `Localisation bloquée`, avec `Réessayer` et `Explorer le marché approximatif`. Le globe contient des regroupements de résultats visibles.

Une recherche saisie dans le champ avec la valeur `tomates` puis validée par la touche Entrée déclenche bien la recherche en production. L’interface affiche `Continent`, `1 résultat`, `Recherche de la zone…` puis une action `Vérifier la disponibilité`. Le globe zoome progressivement vers l’Afrique et la recherche ne reste pas bloquée sur l’état initial.

Point à vérifier ensuite: l’environnement navigateur de certification ne fournit pas une position GPS utilisateur exploitable, donc le pin de position précise ne peut pas être certifié dans cette session. Le rendu observé montre toutefois le parcours de refus/approximation correctement exposé.

## Availability buyer en production

Après validation de la recherche, le résultat affiche une carte facility autonome avec l’état `Découverte OSM · non réclamée`, la mention `achat non disponible`, `0 offre`, et l’action `Disponibilité à vérifier`. Aucun bouton d’achat direct n’apparaît sur cette facility non réclamée.

L’ouverture de la vérification montre le panneau `Demande groupée` avec les étapes canoniques `Produit`, `Commerces`, `Contraintes`. Le passage à l’étape 2 affiche le choix entre le commerce sélectionné et les résultats visibles, avec le nombre de commerces concernés et un bouton `Continuer`. Le rail de résultats et la carte restent visibles derrière le panneau.

## Intention d’achat et chat transactionnel

Après confirmation de l’opération de test, la réponse disponible ouvre bien une surface transactionnelle privée. L’état affiché est `Intention d’achat` avec le statut `Offre à confirmer`. La progression affiche les cinq libellés visibles à tous les viewport: `Intention`, `Offre`, `QR`, `Paiement`, `Réception`. Le bouton est correctement libellé `Confirmer l’offre et générer le QR` et le fil transactionnel contient l’événement `Intention créée`.

Le champ `Message transactionnel` est visible dans le même panneau et rappelle que les messages restent liés à la transaction. Le QR n’a pas été généré automatiquement à la création de l’intention: il est conditionné par l’action explicite de confirmation de l’offre, conformément au contrat V1.

## Offre confirmée et QR

La confirmation explicite de l’offre fait progresser le statut vers `QR en attente de scan`. Le QR est alors réellement rendu dans le panneau avec un code lisible, une expiration affichée, et les événements `Offre confirmée` puis `QR généré` dans le fil transactionnel. Avant cette action, le QR n’était pas visible; le contrat `offre_confirmée → qr_generated` est donc observé en production.

## Seller map-first et Omni Wallet

La route `/vendeur` répond en production avec une carte MapLibre visible en arrière-plan et un chrome minimal. Le dock seller expose les surfaces V1 observées: `Facility`, `Catalogue`, `Demandes reçues`, `Scanner QR`, `Omni Wallet` et `Coupons`. Les anciennes entrées Ads/Agent ne sont pas visibles.

L’onglet `Omni Wallet` affiche une seule source rechargeable, le champ de montant, l’action `Payer par carte`, le texte FedaPay mentionnant Visa/Mastercard, puis les allocations internes `Pro`, `Publicité` et `Coupons`. Il indique explicitement que les paiements clients in-app et les retraits vendeur ne sont pas disponibles en V1. Le fond cartographique reste présent et le solde n’est plus dupliqué dans l’aperçu seller.

## Scanner QR seller

La surface `Scanner QR` est accessible depuis le dock seller et reste au-dessus de la carte. Elle explique que le vendeur valide un QR ou un code de huit caractères, sans paiement client in-app ni retrait vendeur en V1. Le bouton `Autoriser et démarrer la caméra`, le champ manuel `Ex. K7QM2PDX` et l’action `Valider` sont présents ensemble.

Après déclenchement de l’autorisation dans le navigateur de certification, l’état rendu est `Scan indisponible — saisie manuelle disponible` avec le message `Caméra indisponible. Saisissez le code manuellement.` L’espace de prévisualisation reste néanmoins monté et affiche `Prêt à scanner`, au lieu de disparaître. Le fallback manuel est donc disponible même lorsque l’environnement de test ne donne pas accès à une caméra réelle. Le maintien d’un flux vidéo actif après une permission accordée doit encore être confirmé sur un appareil mobile HTTPS réel, car ce bac navigateur ne fournit pas de caméra exploitable.

## Menu seller V1

Le hamburger seller ouvert en production ne montre plus les anciennes entrées de navigation ou d’administration. Il ne contient que le contexte de navigation et la déconnexion, car aucune action buyer secondaire n’est injectée dans cette surface. Le switch Acheteur/Vendeur n’est pas dupliqué dans le menu.

## Menu buyer V1

Le hamburger buyer de production expose exactement les actions secondaires prévues: `Transactions`, `Messages`, `Recherches enregistrées` et `Panier`, puis `Déconnexion`. Les entrées Agent, Publicité, Plan avancé, Administration et le switch de rôle ne sont pas présents dans le menu. Le globe reste visible assombri derrière la sheet, ce qui conserve le contexte map-first.
