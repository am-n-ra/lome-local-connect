# Omni Atlas Glass — PRD visuel maître

## Résumé exécutif

Omni doit être perçu comme une interface de recherche mondiale incarnée par une carte, pas comme un dashboard couvert de cartes UI. Le produit combine la découverte géospatial, les facilities OSM, la disponibilité, les offres, le QR transactionnel et la gestion seller. Le design maître associe le dock glass clair de la référence buyer au poste de décision seller de la référence Console.

## Problème à résoudre

La reconstruction incrémentale de l’interface actuelle a produit des qualités fonctionnelles mais une perception visuelle trop accumulative : trop de surfaces de même poids, trop de contrôles visibles en même temps, des flows qui changent de contenant et une console seller qui peut sembler générique. Le nouveau PRD impose une base unique de perception et de navigation.

## Principes produit/UI

| Principe | Exigence produit | Exigence visuelle |
|---|---|---|
| Découverte | Toute recherche part du dock et retourne à la carte. | Le globe est le héros ; les surfaces restent compactes. |
| Confiance | Claimed/unclaimed, média, disponibilité et fraîcheur sont explicites. | Badges courts, couleur réservée, détails secondaires repliés. |
| Disponibilité-first | Aucun achat direct sans réponse de disponibilité. | Facility → disponibilité est une transition évidente. |
| Transaction persistante | QR, room, reprise et notifications partagent le même objet. | Une room canonique avec bloc MAINTENANT. |
| Paiement V1 | External cash/mobile money/pay-on-delivery. | Choix externes présentés, pas de faux checkout in-app. |
| Seller mission | Le vendeur répond d’abord à la demande ou transaction urgente. | Card dominante sombre, réponses grandes et immédiates. |
| Wallet | Un seul wallet rechargeable et allocations internes. | Solde visible, lignes d’allocation lisibles, pas de retrait. |
| Accessibilité | Safe-area, clavier, caméra, focus, reduced motion. | CTA tactiles, contraste glass et états explicites. |

## Ton et perception

Omni doit être calme, sûr, local et mondial à la fois. Les textes sont directs : `Chercher`, `Vérifier la disponibilité`, `Je veux payer ici`, `Présenter le QR`, `Confirmer le paiement reçu`, `Confirmer la réception`, `Noter cette transaction`. Évite les formulations techniques ou les descriptions longues avant l’action.

Le contraste entre fond crème et surface sombre signale les moments de décision. L’orange signale l’action. Le vert signale la confiance et le succès. L’ambre signale l’incertitude ou le partiel. Le rouge ne sert jamais de décoration.

## Écrans cibles

### Buyer map-first

L’écran buyer idle est une composition respirante. Le globe est centré et animé ; le chrome supérieur ne montre pas de barre globale. Le dock est la seule commande persistante. Lorsqu’une recherche existe, le rail de résultats se pose au-dessus du dock sans couvrir le centre du globe.

### Résultats et facility

Les cards rendent le produit recherché prioritaire, puis donnent assez de contexte pour décider si l’utilisateur ouvre la fiche. La fiche expose média et confiance avant les produits. Le CTA disponibilité est immédiatement repérable et les contacts restent gated.

### Disponibilité

Le flow fait progresser la confiance. La réponse d’un vendeur est une décision, pas un paragraphe : disponibilité, prix, quantité, remise et CTA. L’acheteur doit toujours savoir s’il est encore en train de rechercher, de demander ou d’acheter.

### Transaction Room

La room doit être visuellement la même lorsqu’elle est ouverte depuis le résultat, la notification, le QR ou la reprise. Seul le bloc courant change. Le QR est héroïque au début, le montant net devient héroïque après vérification, puis l’action de réception et enfin le rating.

### Seller console

La console seller est une version opérationnelle d’Omni, pas un espace administratif déconnecté de la carte. Elle commence par ce que le vendeur doit traiter maintenant. Le catalogue, coupon, scanner et parcours sont des outils courts, visibles dans une grille secondaire.

## Modèle d’information

Les informations importantes suivent cette priorité : sujet, statut, montant/quantité, preuve ou média, prochaine action, détails secondaires. Les cartes ne doivent pas présenter une liste de labels avant le sujet. Les montants doivent utiliser le format local existant et distinguer catalogue, réduction et net.

## Modèle de mouvement

Les surfaces entrent par translateY court plus opacity ; les cards de résultat entrent avec un stagger de 30–60 ms ; les tabs changent instantanément ou avec une transition courte ; la carte ne se déplace que lorsqu’un vrai événement de recherche le justifie. Les interactions clavier sont instantanées. `prefers-reduced-motion` supprime les apparitions non essentielles.

## Contenu non négociable

Le produit doit toujours rappeler, au moment opportun, que la localisation peut être précise, approximative ou refusée ; qu’une facility OSM peut être non réclamée ; qu’un paiement seller n’est pas encaissé dans Omni V1 ; qu’Omni Wallet est rechargeable et distinct du paiement transactionnel ; que fermer une room n’annule pas la transaction.

## Définitions de fini

Un écran est fini lorsqu’il a un sujet dominant, une action dominante, des états d’entrée et de sortie, une réponse clavier/mobile, une hiérarchie cohérente avec Atlas Glass et un retour vers la carte ou la room sans perte de contexte. Une surface n’est pas finie si elle dépend d’un texte de debug, d’un loader sans action, d’une option morte ou d’un débordement mobile.
