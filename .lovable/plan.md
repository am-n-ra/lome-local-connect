# Omni — finition complète de l’interface éco-moderniste

## Objectif

Achever l’harmonisation de toute l’application Omni avec la direction retenue : **map-first, éco-moderniste, tactile, mobile-first**, en français, avec les accents terracotta, jaune chaud et vert profond déjà présents.

**Structural path:** Omni > système UI > parcours acheteur / vendeur / transaction / accès / administration > états et interactions

**Phase Nature Way:** Canopy sur les parcours existants, avec Heartwood pour l’accessibilité et les états d’interface.

## Périmètre

### 1. Consolider le système visuel partagé
- Réconcilier les familles de styles `omni-clean`, `omni-atlas` et les composants standards autour d’un seul jeu de tokens sémantiques.
- Uniformiser typographie, surfaces, bordures, ombres, badges, champs, boutons, feuilles et transitions.
- Conserver la palette et la personnalité déjà validées ; aucun nouveau concept visuel.
- Ajouter des comportements cohérents pour focus visible, clavier, mouvement réduit, touch targets et zones sûres mobiles.

### 2. Finaliser le parcours acheteur map-first
- Préserver la carte comme écran principal sur `/` et `/carte`.
- Corriger la hiérarchie responsive de la recherche, des catégories, des résultats et des commandes de localisation.
- Transformer les détails commerce/catalogue/panier en feuilles tactiles cohérentes sans rupture vers l’ancien thème.
- Harmoniser `FacilityPanel`, `FacilitySheet`, `CartPanel`, la fiche commerce et les cartes produit.
- Rendre la feuille de disponibilité accessible : focus capturé, fermeture clavier, titres annoncés, retour de focus et états attente/vide/erreur/réussite.
- Clarifier les états carte : localisation bloquée, couverture en chargement, aucun résultat, recherche active et reprise d’activité.

### 3. Finaliser le workspace vendeur
- Conserver son architecture map-first et son parcours métier existant.
- Harmoniser aperçu, produits, demandes, coupons, scanner, wallet et formulaires avec les mêmes primitives tactiles.
- Stabiliser la navigation basse sur petits écrans et le panneau d’exploitation sur desktop.
- Vérifier lisibilité, débordements, formulaires, confirmations et états indisponibles sans modifier les règles métier.

### 4. Unifier le parcours transactionnel
- Refaire la présentation du fil transactionnel dans le langage `omni-clean`.
- Donner une hiérarchie nette à la progression : intention, offre, QR, paiement, réception et avis.
- Harmoniser QR, chat, choix de paiement, actions vendeur/acheteur, états bloqués/expirés/erreur et reprise.
- Préserver exactement l’ordre métier déjà implémenté et les mentions « Mode démo » là où elles existent.

### 5. Harmoniser accès et onboarding
- Aligner connexion, inscription, récupération et onboarding vendeur sur la même identité visuelle.
- Remplacer les derniers tokens et composants hérités, sans modifier l’authentification.
- Soigner les états validation, chargement, erreur, succès, liens de retour et ergonomie clavier/mobile.
- Retirer l’exposition visuelle d’identifiants de démonstration sur l’écran de connexion tout en conservant les mécanismes de test internes.

### 6. Harmoniser l’administration
- Transformer la console en véritable espace opérationnel responsive, plus dense que l’interface grand public mais issu du même système.
- Uniformiser navigation, filtres, tableaux/listes, statistiques, vérifications, compagnies, opérations et journal d’audit.
- Prévoir des variantes mobiles lisibles et des états vides/chargement/erreur cohérents.
- Ne modifier ni les permissions ni la logique de contrôle d’accès.

### 7. Validation et preuve
- Vérifier les routes publiques et protégées sans contourner l’authentification.
- Contrôler l’absence d’erreurs de compilation et les erreurs runtime pertinentes.
- Tester visuellement au minimum à **390 × 844** et **1280 × 1800** : carte, détail commerce, disponibilité, panier, auth, onboarding, vendeur, transaction et admin accessible.
- Vérifier absence de chevauchement, texte tronqué, contrôle inaccessible, focus perdu ou panneau hors écran.
- Contrôler contraste, noms accessibles, navigation clavier, zones tactiles et `prefers-reduced-motion`.

## Contraintes

- Aucun changement de schéma, paiement, permissions, recherche ou règle transactionnelle sauf correction strictement nécessaire au rendu d’un état existant.
- Pas de tableau de bord acheteur séparé : l’expérience acheteur reste la carte.
- Le sélecteur Acheter/Vendre reste visible dans le chrome principal.
- Pas de nouvelles pages marketing, de fausses données ou de fonctionnalités décoratives.
- Préserver les utilisateurs, données et comportements existants.

## Ordre d’exécution

1. Tokens et primitives partagées.
2. Acheteur : carte, résultats, fiche, catalogue, disponibilité, panier.
3. Transaction : progression, QR, chat, paiement et réception.
4. Vendeur : workspace et sous-panneaux.
5. Auth et onboarding.
6. Admin.
7. Vérification responsive, accessibilité, runtime et compilation.

## Définition de terminé

L’ensemble des surfaces Omni utilise une identité visuelle unique et reconnaissable ; chaque parcours conserve sa logique réelle, fonctionne sur mobile et desktop, expose clairement ses états, reste navigable au clavier et ne présente plus de rupture visible entre composants `clean`, hérités et standards.
