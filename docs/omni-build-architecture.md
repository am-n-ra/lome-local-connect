# Omni Atlas Glass — Architecture des écrans et flows

## Shell global

Tous les écrans publics et métier utilisent un shell qui garde la carte comme contexte lorsque le rôle et le parcours le permettent. Le shell comporte un canvas MapLibre vivant, un chrome supérieur minimal, un accès notification, un menu compte, une barre de reprise transactionnelle lorsqu’elle existe et une région de surface active. Sur mobile, aucune feuille ne doit pousser le document de manière imprévisible ; elle doit utiliser la safe-area et un corps scrollable avec pied d’action fixe.

| Écran | Surface dominante | Carte visible | Action principale |
|---|---|---:|---|
| `/` ou `/carte` idle | Dock buyer | Oui, globe libre | chercher |
| `/carte` résultats | Rail + dock | Oui, pins/repères | ouvrir une facility |
| Fiche facility | Sheet | Oui | vérifier disponibilité |
| Disponibilité | Flow sheet | Oui | envoyer/vérifier |
| Comparaison | Sheet/rail | Oui | sélectionner une offre |
| `/transaction/$id` | Room sheet/page | Oui | action courante |
| `/vendeur` Carte | Facility sheet | Oui | passer en Console |
| `/vendeur` Console | Console flottante | Oui ou contexte conservé | traiter la demande active |
| Scanner | Sheet spécialisée | Oui | autoriser/démarrer caméra |
| Wallet | Sheet | Oui | recharger Omni Wallet |
| Produit/coupon | Sheet | Oui ou Console | enregistrer |
| Onboarding | Flow plein écran | Non requis | commencer à rechercher |

## Flow buyer — découverte jusqu’à transaction

### 1. Arrivée

Le globe commence dans son état de repos animé horizontalement, lentement et de gauche à droite. Le globe est propre, sans labels superflus ajoutés par l’interface. Le chrome montre seulement Omni, notification, menu et contexte de zone. Le dock n’affiche qu’une commande de recherche, avec un bouton de localisation/recentrage séparé et un accès Affiner discret.

Si aucune session authentifiée n’existe, l’interface explique clairement qu’un compte est nécessaire pour accéder à Omni et faire une recherche persistante. Le CTA mène à l’auth avec restauration du contexte initial.

### 2. Recherche

La recherche accepte produit, service, commerce ou besoin. Le bouton visible et Enter déclenchent le même handler. Avant les résultats, le globe exécute une révélation progressive : continent, pays, région, ville/zone, puis position et résultats. Chaque pause est courte, lisible et non obligatoire pour l’utilisateur expert.

Pendant la recherche, la quantité et le budget restent masqués par défaut. Le bouton Affiner ouvre quantité, budget illimité/manuel, rayon, ouvert maintenant, remise et tri. Les contraintes sont conservées sans réinitialiser le texte ou le centre de la carte.

### 3. Résultats

Le rail affiche d’abord le produit recherché et le degré de correspondance. Une card contient média, nom facility, statut claimed/unclaimed, confiance, disponibilité connue ou à vérifier, prix ou prix minimum, quantité, distance, remise éventuelle et CTA. Les cards sont entièrement visibles dans le viewport horizontal autorisé ; elles ne se coupent pas sous le chrome.

Un état vide doit expliquer ce qui a été recherché et proposer soit une demande de disponibilité, soit un élargissement de zone. Un état erreur doit proposer Réessayer sans exposer un message technique de backend.

### 4. Facility

La fiche comporte un hero média, nom, catégorie, adresse/distance, statut de confiance et description. Une facility unclaimed expose l’information publique et la possibilité de réclamer ; elle n’expose pas une fausse disponibilité ou un contact comme s’il était vérifié.

Pour une facility claimed/confirmed, le CTA dominant est **Vérifier la disponibilité**. Le contact et l’itinéraire restent cachés avant l’intention d’achat, conformément au contrat. La fiche présente les produits et médias, mais ne devient pas un catalogue complet avant la décision de disponibilité.

### 5. Disponibilité

La disponibilité suit trois étapes visuelles : **Quoi ?** terme, unité, quantité ; **Où ?** facility manuelle ou marché/zone ; **Contraintes** budget et options. Chaque étape possède un titre, une phrase d’explication, un corps simple et un pied fixe avec Retour/Continuer ou Envoyer.

Les réponses sont comparées dans un ordre disponible, partiel, indisponible, puis prix. La meilleure option est mise en avant sans cacher les autres. Les réponses OSM non réclamées doivent être clairement marquées comme à confirmer.

### 6. Intention d’achat et room

Le CTA **Je veux payer ici** crée immédiatement la transaction et le QR, puis ouvre `/transaction/$id`. La room affiche le QR comme identité, le résumé montant catalogue/réduction Omni/net à payer, la progression Intention → Offre → QR → Paiement → Réception, le bloc MAINTENANT et le fil d’événements.

Le vendeur reçoit l’intention et peut ouvrir la room ciblée ou son workspace ciblé. Il vérifie le QR. Après QR vérifié, l’acheteur peut accéder aux informations seller nécessaires : contact et itinéraire selon le mode de paiement et les règles de distance.

### 7. Paiement externe et livraison

La room affiche cash, TMoney, Flooz et pay-on-delivery comme choix externes. Omni ne débite pas le buyer et ne promet aucun paiement seller in-app. Le buyer déclare le paiement ; le seller confirme la réception ; le seller démarre la remise/livraison ; le buyer confirme la réception ; l’interface demande une note et un commentaire ; la transaction devient completed après rating.

Fermer la room ne l’annule jamais. Une barre de reprise affiche nombre, facility et étape courante. Toute notification buyer/seller et tout deep-link QR doit retrouver cette room ou le workspace seller ciblé.

## Flow seller — mission prioritaire et gestion

### Vue Carte

La vue Carte reprend la grammaire buyer : carte visible, facility active, statut online/offline, aperçu tel que vu par l’acheteur et accès Console. Elle ne doit pas devenir une page blanche ou un dashboard isolé.

### Vue Console

Le segment Carte/Console est visible et stable. La Console commence par trois compteurs : fiches, catalogue et demandes, avec plan ou capacité. Ensuite vient la **mission active** : une demande de disponibilité ou une transaction urgente. La card mission porte produit, quantité, facility, réponse récente et trois choix Disponibilité/Partiel/Non ou l’action transactionnelle courante.

Sous la mission, quatre raccourcis V1 sont prioritaires : Ajouter un produit, Créer un coupon, Scanner un code et Parcours vendeur. Wallet est visible dans le chrome et depuis une card secondaire ; Agent et fonctions futures ne sont pas présentés comme actifs.

### Produit

Le formulaire produit demande d’abord nom, unité/prix, quantité et média. Les options avancées contiennent visibilité, allocation interne et coupon lié. L’aperçu montre exactement ce que le buyer verra : produit, prix, disponibilité et remise. Un seul bouton Enregistrer/Publicer est primaire.

### Coupon

Le formulaire coupon demande code, type de remise, valeur, période et produit/facility concernés. Une carte de prévisualisation calcule l’économie client. Le système explique que le coupon seller et la personnalisation d’offre Omni sont deux couches différentes ; aucun solde de coupon n’est présenté comme un portefeuille retirable.

### Scanner

Le scanner s’ouvre dans une surface dédiée. La permission caméra est demandée sur HTTPS avec `facingMode: environment` lorsque possible. La vidéo est visible dans un cadre large immédiatement après autorisation. BarcodeDetector est optionnel ; la saisie manuelle est toujours présente. À la fermeture, tous les tracks sont arrêtés. Après scan, la room transactionnelle ciblée présente les actions QR vérifié, paiement reçu et fulfillment.

### Omni Wallet

Le wallet affiche un seul solde rechargeable et une action FedaPay Recharge. Les allocations internes Pro, Publicité, Coupons et crédits de recherche sont en lecture claire, sans inventer plusieurs portefeuilles ni un retrait seller V1. Le wallet est le même concept buyer/seller ; seules les autorisations et usages varient.

## Flow compte et onboarding

L’onboarding explique la promesse en trois moments : chercher, comprendre une facility, agir avec disponibilité/QR/transaction. Le choix Acheteur/Vendeur est une préférence de départ, pas une duplication de compte. La localisation est optionnelle, son état est honnête et le marché approximatif reste possible.

Le menu compte expose identité, rôle actif et bascule, puis seulement les destinations implémentées : transactions, messages, recherches enregistrées, panier si actif, wallet et déconnexion. Il ne doit exister aucune option morte ou qui mène à un écran non disponible.

## États obligatoires

Chaque écran doit définir loading, success, empty, error, unauthorized, disabled, pending et retry lorsqu’ils sont pertinents. Les messages sont orientés décision et non techniques. Les skeletons respectent la géométrie finale. Les erreurs conservent la carte et proposent une sortie claire.

## Responsive

À 320 et 390 px, aucun élément ne doit produire un scroll horizontal non intentionnel, une feuille doit garder son CTA au-dessus de la safe-area, les inputs numériques doivent utiliser une taille de texte qui évite le zoom automatique, les cards doivent rester entièrement lisibles et le dock ne doit pas recouvrir le recentrage. À 768 px, les surfaces peuvent gagner en largeur sans devenir des panneaux latéraux. À 1024 et 1280 px, les consoles peuvent utiliser deux colonnes, mais le globe reste visible et la hiérarchie de l’action reste unique.
