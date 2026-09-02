# Omni V2 — Pack maître de prompts réalistes

## Direction artistique canonique

Utiliser l’image fournie par le fondateur comme **référence visuelle absolue** pour toute la série. Le style recherché est une interface mobile premium, réaliste et immédiatement compréhensible : carte/globe géographique en relief avec frontières et noms de pays lisibles, lumière ivoire très douce, surfaces blanches flottantes avec ombres légères, typographie noire épaisse et moderne, vert Omni utilisé pour les actions principales et les confirmations, pictogrammes fins et reconnaissables.

Omni doit évoquer le **premier moteur mondial de recherche de l’offre et de la demande locale** : la carte n’est pas une illustration, elle est le produit. L’interface doit être plus désirable qu’un marketplace classique, plus utile qu’une carte classique et aussi directe qu’un moteur de recherche. Le résultat doit ressembler à une vraie application mobile haut de gamme déjà prête à être utilisée.

Conserver dans chaque image : le wordmark `Omni` en haut à gauche, l’avatar circulaire en haut à droite sur les écrans Buyer publics, la carte en arrière-plan lorsque le flow part de la découverte, les sheets blanches à grand rayon, le vert Omni cohérent, les contrôles tactiles larges, une hiérarchie très nette, des données lisibles et des textes français exacts.

Format pour chaque image : **portrait mobile 9:16, 1440 × 2560 px, interface seule sans cadre de téléphone, sans navigateur, sans watermark**. Générer chaque écran séparément. Utiliser l’image de référence du fondateur, puis la première image approuvée comme référence additionnelle pour toutes les suivantes. Ne pas modifier la direction artistique entre les écrans.

## Règles de continuité

La carte Buyer est toujours la landing. Le globe peut être mondial en état initial puis zoomer vers Lomé ou la zone de recherche. La rotation lente existe uniquement dans l’état idle et s’arrête dès qu’un utilisateur touche, recherche, ouvre une sheet ou entre dans un flow.

Le QR public d’une facilité sert uniquement à **découvrir la facilité et ses offres**. Le QR transactionnel est généré pour une intention précise et porte le coupon, la transaction, le prix et l’identité du Buyer. Ces deux objets doivent être visuellement impossibles à confondre.

Une réponse automatique n’est visible que lorsque le stock Omni est frais. Une donnée ancienne montre clairement `Donnée ancienne` et déclenche une vérification Seller/temps réel. Une disponibilité manuelle reste gratuite. Le Bulk Facility est le service facturé au Buyer Pro avec crédits consommables.

La certification manuelle et la confirmation commerciale sont séparées. Une facilité peut afficher `Certifiée Omni · Unconfirmed · 0/3`, puis `1/3`, `2/3`, et enfin `Confirmée · 3/3`. Le bonus Seller de 20 $ apparaît seulement après la troisième vente vérifiée sur **cette facilité** et sert à essayer Pro ou des services Omni éligibles.

La recherche initiale doit survivre à l’authentification et à l’onboarding : `Recherche → Auth requise → Connexion/inscription → Onboarding → Recherche reprise → Résultats`.

---

# 1. Landing, carte et première recherche

### 01 — Landing globe/carte mondiale

Créer une maquette mobile réaliste de la landing Buyer Omni. Montrer un globe/carte en relief couvrant l’Afrique du Nord, l’Afrique de l’Ouest et l’Europe du Sud, avec frontières fines, noms de pays lisibles, pins blancs et verts répartis sur la carte, un signal vert plus lumineux sur Lomé. En haut : `Omni` et avatar circulaire. En bas : grande search bar blanche `Rechercher un commerce, un produit…`, bouton vert avec loupe et bouton secondaire `Explorer`. Ajouter une sheet élégante avec `Le monde local, à portée de recherche.` et `Trouvez ce qui est disponible autour de vous.` La carte doit occuper la majorité de l’écran et donner une impression de réseau mondial réel.

### 02 — Landing idle avec carte peuplée

Même composition, globe légèrement plus éloigné, nombreuses facilités visibles mais légères, plusieurs pins neutres et trois pins verts dans la région de Lomé. Sheet réduite avec `Voir avant de bouger`, `Commencez par rechercher ce dont vous avez besoin.` La carte doit rester la vedette.

### 03 — Permission de localisation

Carte mondiale visible derrière une grande sheet blanche. Titre exact `Voir les offres proches de vous ?`, icône localisation verte, texte `La localisation est facultative. Vous pouvez continuer sans la partager.`, bouton vert `Autoriser la localisation`, bouton contour `Continuer sans localisation`. Présenter cela comme une permission respectueuse et premium.

### 04 — Localisation refusée

Carte utilisable en arrière-plan, sheet avec `La carte reste disponible`, texte `Autorisez la localisation quand vous voudrez voir les offres proches de vous.`, boutons `Autoriser la localisation` et `Continuer sans localisation`. Garder la search bar visible sous la sheet.

### 05 — Search bar active avec clavier

Carte partiellement visible dans la moitié supérieure, search bar agrandie et focus vert, texte exact `Riz parfumé 5 kg`, suggestions propres `Riz parfumé`, `Riz 5 kg`, `Produits autour de moi`. Montrer un clavier mobile discret qui ne pousse pas brutalement toute la scène vers le haut. Le dock s’ancre au-dessus du clavier.

### 06 — Suggestions et recherche vocale/scan

Carte en arrière-plan, search bar ouverte avec suggestions, petit contrôle latéral avec icônes loupe, micro et scan. Montrer les entrées `Rechercher un produit`, `Chercher une facilité`, `Scanner un QR public`. Garder une esthétique de moteur de recherche, pas de dashboard.

---

# 2. Authentification et onboarding contextuels

### 07 — Prompt auth depuis une recherche non authentifiée

Conserver la carte et le texte de recherche derrière une sheet. Titre `Votre recherche est prête`, texte `Nous gardons « Riz parfumé 5 kg » et reprenons automatiquement après une connexion rapide.`, bouton vert `Continuer avec Omni`, bouton secondaire `Explorer sans compte`. Montrer clairement que la recherche n’est pas perdue.

### 08 — Connexion

Écran auth mobile épuré, retour `Retour à la carte`, titre `Un espace, une recherche reprise.`, champ `Votre adresse e-mail`, champ `Mot de passe`, bouton `Se connecter`, bouton contour `Créer mon compte`, petit rappel `Recherche conservée : Riz parfumé 5 kg`.

### 09 — Erreur d’authentification

Même écran avec champs remplis, message doux mais lisible `Adresse e-mail ou mot de passe incorrect`, bouton `Réessayer`, lien `Mot de passe oublié ?`, recherche conservée dans un petit bandeau supérieur.

### 10 — Onboarding 1/3

Écran `Bienvenue dans Omni`, progression `1/3`, titre `Votre zone`, texte `Pour afficher les offres proches de vous.`, illustration carte minimaliste, bouton collant `Continuer`, action secondaire `Passer pour maintenant`.

### 11 — Onboarding 2/3

Progression `2/3`, titre `Votre première recherche`, texte `Nous avons conservé votre recherche.`, carte de recherche contenant `Riz parfumé 5 kg`, bouton `Continuer`, lien `Passer pour maintenant`.

### 12 — Onboarding 3/3

Progression `3/3`, titre `Votre espace`, texte `Retrouvez demandes, transactions et favoris.`, bouton vert `Lancer ma recherche`, bouton secondaire `Passer pour maintenant`.

### 13 — Recherche reprise après onboarding

Retour sur la carte zoomée vers Lomé avec la search bar remplie `Riz parfumé 5 kg`, sheet `Recherche reprise`, filtres visibles `10 unités`, `Budget 10 $`, `À proximité`, pins alignés sur les résultats.

---

# 3. Résultats, facilité, disponibilité et Bulk Facility

### 14 — Résultats sur carte

Carte de Lomé réaliste en fond, sheet `Résultats près de vous`, query `Riz parfumé 5 kg`, chips `10 unités`, `Budget 10 $`, `À proximité`. Deux cartes : `Omni Demo Seller Hub · 9,50 $ · Disponible · 10 unités · Observé il y a 2 min` et `Marché de Hanoukopé · 9,80 $ · Vérification nécessaire`. Action basse `Vérifier plusieurs facilités · Bulk Facility`.

### 15 — Résultats liste complète

Écran Buyer avec carte réduite en bandeau supérieur et une liste scrollable de facilités. Chaque carte affiche distance, prix net, quantité compatible, fraîcheur et statut. Garder une bascule élégante `Carte | Liste`.

### 16 — Aucun résultat

Carte visible, sheet `Aucun résultat exact`, query `Lait d’amande 1 L`, texte `Nous pouvons élargir la zone ou vérifier plusieurs facilités.`, boutons `Élargir la zone` et `Vérifier plusieurs facilités`. Aucun faux résultat.

### 17 — Filtres et devise

Sheet `Affiner votre recherche` avec `Quantité demandée`, `Budget maximum`, `Zone`, `Devise affichée`. Valeurs `10 unités`, `10 $`, `Autour de moi`, `USD · selon votre localisation`. Bouton `Appliquer les filtres`.

### 18 — Fiche publique de facilité

Carte locale derrière une grande sheet, titre `Omni Demo Seller Hub`, `Lomé, Togo`, badge `Certifiée Omni`, badge séparé `Unconfirmed · 2/3 ventes`, bouton partage. Section `QR public de la facilité` et sous-texte `Découvrir les offres, pas une transaction.`

### 19 — Produits de la facilité

Fiche scrollable avec `Offres Omni`. Cards : `Riz parfumé 5 kg · 9,50 $ · 10 disponibles · Donnée fraîche` et `Huile végétale 1 L · 3,20 $ · Donnée ancienne · 8 alloués`. Boutons `Vérifier la disponibilité` et `Ajouter au panier`.

### 20 — Scan QR public

Écran après scan d’un QR affiché dans une boutique. Sheet `Découvrir cette facilité`, `Omni Demo Seller Hub`, badge `Offres Omni`, texte `Explorez les produits et les prix réservés Omni chez ce vendeur.`, bouton `Voir les produits`. Bandeau très clair `QR public de la facilité — pas un QR de transaction.`

### 21 — QR public invalide/expiré

Écran de récupération avec carte floutée en arrière-plan, titre `Ce QR public n’est plus disponible`, texte `Recherchez cette facilité sur Omni ou retournez au globe.`, boutons `Rechercher sur Omni` et `Retour au globe`.

### 22 — Disponibilité manuelle gratuite

Sheet `Disponibilité manuelle · gratuite`, produit `Riz parfumé 5 kg`, champs `Quantité 10`, `Budget max 10 $`, badge `Donnée ancienne`, texte `Le vendeur confirme la quantité exacte au moment de votre demande.`, bouton `Envoyer la demande`, bouton `Ajouter au panier`.

### 23 — Réponse fraîche automatique

Écran de résultat avec badge vert `Disponible · réponse automatique`, `10 unités`, `Observé il y a 2 min`, texte `Stock Omni frais confirmé automatiquement`. Bouton `Continuer vers l’intention`.

### 24 — Réponse ancienne et vérification temps réel

Écran avec badge ambre `Donnée ancienne`, timestamp `Observé il y a 14 h`, texte `Une vérification en temps réel est nécessaire.`, bouton `Vérifier maintenant`, état d’attente `Le vendeur est sollicité`.

### 25 — Bulk Facility Pro

Sheet premium `Voir plus. Appeler moins.`, badge `Buyer Pro · service facturé`, carte `842 crédits disponibles`, `12 facilités sélectionnées`, `Riz parfumé 5 kg · 10 unités · Budget 10 $`, coût `Cette demande : 12 crédits`, bouton `Lancer la vérification`, bouton `Acheter plus de crédits`.

### 26 — Bulk réponses partielles

Carte en fond et sheet `Vérification en cours`, progression visible, `8 réponses reçues sur 12`, trois badges `Disponible`, plusieurs `À vérifier`, action `Voir les résultats partiels`, action `Annuler la demande`.

### 27 — Bulk crédits insuffisants

Sheet `Crédits insuffisants`, texte `Cette demande nécessite 12 crédits. Il vous en reste 4.`, boutons `Acheter des crédits` et `Modifier la demande`, prix du pack affiché dans la devise locale.

---

# 4. Panier, intent et transaction Buyer

### 28 — Panier multi-produit

Écran `Votre sélection`, contexte `Omni Demo Seller Hub · Lomé`, lignes `Riz parfumé 5 kg × 10 · 95,00 $` et `Huile végétale 1 L × 2 · 6,40 $`, ligne verte `Offre Omni incluse`, total `101,40 $`, alerte `Le stock Omni sera revalidé avant l’achat.`, bouton `Créer mon intention`.

### 29 — Intent créée

Écran `On vérifie pour vous.`, référence `Intention créée · #OMNI-4827`, status `Vérification en attente`, timeline `Intention créée → Vérification → Je veux acheter`, bouton `Suivre la vérification`, action `Annuler l’intention`.

### 30 — Intent disponible partiellement

Montrer `Disponibilité partielle`, quantité demandée 10, quantité confirmée 7, prix recalculé, actions `Réduire la quantité`, `Demander une autre facilité`, `Annuler`.

### 31 — Disponibilité confirmée / décision

Titre `Tout est prêt pour décider.`, badge vert `Vérifié maintenant`, facility, produit, prix `95,00 $`, question `Souhaitez-vous acheter ?`, bouton primaire exact `Je veux acheter`, bouton secondaire `Pas maintenant`, note `Votre transaction et votre QR seront créés après confirmation.`

### 32 — QR transactionnel

Écran `Votre passage est prêt.`, gros QR réaliste, label `QR de transaction`, référence `OMNI-4827`, expiration `Expire dans 28 min`, facility, total. Actions `Ouvrir le chat`, `Itinéraire`, `Contacts du vendeur`. Alerte explicite `Ce QR est lié à cette transaction et à votre coupon — pas le QR public de la facilité.`

### 33 — Chat transactionnel

Écran `Chat transactionnel · OMNI-4827`, messages système `QR vérifié`, `Transaction rattachée à Omni Demo Seller Hub`, messages Buyer/Seller, bouton pièce jointe, raccourcis `Itinéraire` et `Contacts`, rail de statut transactionnel.

### 34 — Paiement à confirmer

Titre `Paiement à confirmer.`, timeline `QR vérifié`, `Paiement`, `Retrait / livraison`, options `Mobile Money`, `Carte`, `Espèces déclarées`, bouton `Déclarer le paiement`, aide `Le vendeur confirmera le paiement dans le chat.`

### 35 — Paiement échoué / retry

Écran transactionnel avec status rouge discret `Paiement non confirmé`, texte `Le paiement n’a pas été confirmé. Vous pouvez réessayer ou contacter le vendeur.`, boutons `Réessayer`, `Ouvrir le chat`, `Annuler la transaction`.

### 36 — Fulfilment et retrait

Timeline `Paiement confirmé`, `Produit préparé`, `Prêt pour retrait`, carte facility avec itinéraire, bouton `Ouvrir l’itinéraire`, action `Contacter le vendeur`.

### 37 — Réception et avis obligatoire

Titre `Achat reçu. Merci à vous.`, badge `Transaction clôturée`, produit, prix, timeline complète, section `Votre avis est requis`, étoiles, champ `Partagez votre expérience`, bouton `Publier mon avis`.

### 38 — Transaction expirée/annulée

Écran recovery `Cette transaction a expiré`, référence, texte `Votre intention reste dans votre historique.`, boutons `Rechercher à nouveau`, `Retour au globe`, lien `Voir mes demandes`.

---

# 5. Compte Buyer, Wallet et Pro

### 39 — Menu public non authentifié

Menu minimal depuis la landing : `Se connecter`, `Créer un compte`, `Explorer le globe`, `Installer Omni`. Aucun Seller/Admin visible.

### 40 — Menu Buyer authentifié

Menu avec `Mes demandes`, `Transactions`, `Wallet & Rewards`, `Favoris`, `Devenir vendeur`, `Paramètres`. Aucun outil Seller/Admin si la capacité serveur n’existe pas.

### 41 — Wallet Buyer et crédits Bulk

Écran `Omni Wallet`, solde local, carte `Bulk crédits`, consommation récente, bouton `Recharger`, bouton `Voir Pro`. Montrer les états solde vide, recharge en attente, recharge réussie et recharge échouée.

### 42 — Buyer Pro

Comparaison Free/Pro : recherche locale, Bulk Facility, crédits mensuels, achat de crédits supplémentaires, prix `5 $ / mois` dans la devise et le contexte appropriés. CTA `Activer Buyer Pro`.

---

# 6. Seller : compte, compagnie, facilité, claim et catalogue

### 43 — Entrée Seller

Depuis le menu Buyer, écran `Devenir vendeur`, bénéfices de visibilité, offres Omni obligatoires, bouton `Commencer`. Si déjà Seller, écran `Espace Seller` avec le rôle explicitement affiché.

### 44 — Liste des compagnies

Titre `Mes compagnies`, cards `Demo Seller Group · 2 facilités · 1 certifiée · 1 confirmée` et `Kegue Services · 1 facilité · En revue`, boutons `Créer une compagnie`, `Ajouter une facilité`, note `Le Pro est propre à chaque facilité.`

### 45 — Création compagnie

Titre `Donnez un nom à votre activité.`, champs `Nom de la compagnie`, `Type d’activité`, texte `Une compagnie peut gérer plusieurs facilités.`, bouton `Créer la compagnie`, états erreur et doublon.

### 46 — Création facilité avec carte

Stepper `1 Informations · 2 Localisation · 3 Preuves · 4 Vérifier`, champs publics, carte réaliste avec pin déplaçable, bouton `Utiliser ma position`, aide `Déplacez le pin jusqu’à l’entrée réelle`, bouton collant `Continuer`.

### 47 — Revue avant publication

Résumé public/privé, nom, adresse, coordonnées, horaires, offre obligatoire, preuve privée, note `Les preuves restent privées`, boutons `Soumettre à la revue`, `Enregistrer le brouillon`.

### 48 — Claim d’une facilité non revendiquée

Fiche publique `Marché de Hanoukopé`, badge `Non revendiquée`, titre `Vous gérez cet endroit ?`, texte de bénéfice, bouton `Revendiquer cette facilité`, aucune gestion catalogue avant approbation.

### 49 — Claim en revue / preuve demandée / rejet

Écran à variantes avec timeline `Identité → Preuve privée → Revue Omni`, statuses `En revue`, `Preuve supplémentaire demandée`, `Rejeté — corriger`, `Certifié`. Boutons contextualisés.

### 50 — Certification et progression 0/3, 1/3, 2/3

Facility detail avec deux axes visuels distincts : badge `Certifiée Omni` et progression `Unconfirmed · Ventes vérifiées 2/3`. Texte `Encore 1 vente vérifiée pour débloquer 20 $`. Montrer les variantes 0/3, 1/3 et 2/3.

### 51 — Confirmation 3/3 et bonus 20 $

Même facility detail, badge vert `Confirmée · 3/3`, carte de succès `Bonus de 20 $ débloqué`, montant `20 $`, texte `Utilisez-le pour essayer Omni Pro et les services Omni éligibles`, bouton `Essayer Pro pour cette facilité`, historique Wallet/Rewards.

### 52 — Catalogue Free à la limite

Titre `Vos offres`, badge `5/5 Free`, cinq produits, boutons `Éditer`, `Ajouter un produit`, message `La limite Free est atteinte`, CTA `Passer Pro · 10 $ / facilité`. Chaque produit possède une offre Omni visible.

### 53 — Catalogue Pro illimité

Badge `Pro actif · cette facilité`, liste plus longue, action `Ajouter un produit`, édition d’une réduction en pourcentage ou montant fixe, validation du prix net et aperçu public.

### 54 — Stock Omni alloué

Titre `Stock alloué à Omni.`, produit, quantité allouée, timestamp `Observé il y a 2 min`, action `Modifier`, note `Ce stock est distinct du stock global de votre activité.`, décrémentation après transaction clôturée.

### 55 — Réponses Seller

Queue avec demande `Riz parfumé 5 kg · ×10`, status `À vérifier`, ancienneté, actions `Disponible`, `Partiel`, `Indisponible`, `Demander plus d’informations`, section Bulk Facility séparée.

### 56 — Seller transaction et scan

Écran `Vérifier puis accompagner.`, caméra encadrée `Scanner le QR Buyer`, variantes caméra refusée, QR invalide, QR expiré, transaction rattachée, boutons `Confirmer le paiement`, `Ouvrir le chat`, `Marquer comme remis`.

### 57 — Seller Pro facility-scoped

Titre `Plus de capacité pour cette facilité`, price `10 $ / mois · cette facilité`, comparaison Free/Pro, `5 produits` contre `Produits illimités`, `Réponses manuelles` contre `Réponses automatiques sur stock frais`, bonus de 20 $ comme moyen d’essai.

---

# 7. Admin, Reviewer et états système

### 58 — Menu Admin protégé

Écran visible uniquement pour un contexte Admin/Reviewer confirmé par le serveur. Badge `Admin` ou `Reviewer`, liens `Revue`, `Comptes`, `Audit`, retour vers le globe. Aucun accès équipe dans un menu Buyer ordinaire.

### 59 — Queue créations et claims

Titre `Revue Omni`, tabs `Nouvelles créations` et `Claims`, cards avec facilités, preuves, état `À examiner`, boutons `Ouvrir`. Note `Le compteur de ventes ne se modifie pas ici.`

### 60 — Dossier de certification

Titre `Décider avec des preuves.`, documents privés, historique, identité du Reviewer, boutons `Certifier la facilité`, `Demander une preuve`, `Rejeter avec motif`. Afficher la confirmation d’audit.

### 61 — Gestion des rôles

Titre `Gestion des accès`, comptes, rôles `operator`, `reviewer`, `admin`, actions `Attribuer`, `Retirer`, modal de confirmation avec motif obligatoire et texte `Chaque mutation est enregistrée.`

### 62 — États système universels

Créer une planche cohérente de quatre écrans : `Carte en cours de chargement` avec skeleton ; `Impossible de charger la carte` avec `Réessayer` ; `Donnée ancienne — vérification nécessaire` ; `Action disponible avec Pro`. Garder le style de la référence et des sorties explicites.

### 63 — Offline, session expirée et reprise

Variantes avec sheet `Vous êtes hors connexion`, `Votre session a expiré`, `Votre recherche et votre transaction sont conservées`, boutons `Réessayer`, `Se reconnecter`, `Retour au globe`.

### 64 — Responsive et clavier

Planche de référence montrant la même landing et search dock à 320, 390, 768 et 1280 px, plus état clavier ouvert. La carte garde sa présence, le dock se repositionne proprement, safe areas visibles, focus clair et aucun déplacement brutal.

## Ordre de génération recommandé

Générer d’abord `01`, puis faire valider la direction. Générer ensuite `03`, `05`, `07`, `08`, `10`, `11`, `12`, `13`, `14`, `18`, `20`, `22`, `25`, `28`, `29`, `31`, `32`, `33`, `34`, `37`. Après validation de ce tronc visuel Buyer, générer `43` à `57`, puis `58` à `64`.

## Format des fichiers

Utiliser les noms `01-buyer-globe-landing.png` jusqu’à `64-responsive-keyboard.png`. Renvoyer les images dans leur ordre numérique avec l’image de référence finale. À réception, elles seront enregistrées dans le registre Species, comparées écran par écran à cet inventaire et utilisées pour réaligner la maquette HTML sans improvisation.
