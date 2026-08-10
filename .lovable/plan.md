# OmniView — Phase C+ : rôles, médias, carte intelligente, refonte glassmorphism

Ce plan complète les phases déjà livrées (A : carte/recherche multimodale, B : statuts anglais + QR/transactions). Il ajoute 5 chantiers.

## 1. Contrôle admin adossé à Neon Auth

Aujourd'hui le serveur vérifie déjà le jeton Neon Auth puis lit `user_roles`, mais l'interface ne sait pas si l'utilisateur est staff : la page admin se contente d'attendre une erreur.

- Nouvelle fonction serveur `getMyIdentity` : vérifie le JWT Neon Auth, renvoie `{ userId, email, roles[] }`.
- Le contexte d'authentification côté client expose `roles`, `isStaff`, `isAdmin`.
- La page `/admin` redirige vers `/auth` si non connecté, affiche un refus propre si non staff.
- Le lien « Admin » n'apparaît dans la navigation que pour le staff.
- Toutes les fonctions admin gardent la vérification serveur (source de vérité) — aucune décision côté navigateur.
- Script `scripts/grant-role.ts` : attribution du rôle via l'identifiant Neon Auth (email → user_id).

## 2. Recherche : recentrage automatique sur les résultats les plus proches

- Après une recherche (texte, voix ou image), les résultats sont triés par distance réelle à la position de l'utilisateur.
- La carte cadre automatiquement l'utilisateur + les 5 résultats les plus proches (ajustement animé, zoom plafonné).
- Si la géolocalisation est refusée : cadrage sur l'ensemble des résultats.
- Aucun résultat proche (> 15 km) : message « Aucun commerce à proximité », proposition d'élargir.
- Le premier résultat proche est mis en avant dans la liste, sans ouvrir la fiche de force.

## 3. Médias : vitrine, photos produits, vidéos

Modèle de données (migration `006_media.sql`) :

- `facility_media` : `facility_id`, `kind` (image | video), `url`, `thumb_url`, `position`, `bytes`, `duration_s`.
- `products.photo_url` conservé + `product_media` pour les galeries.
- Limites : 6 images + 2 vidéos par fiche, 4 images par produit ; vidéo ≤ 60 s.

Stockage et compression :

- Stockage sur Cloudflare R2 via un connecteur/identifiants dédiés ; les fichiers ne transitent pas par la base.
- Envoi direct navigateur → R2 par URL signée générée côté serveur (`createMediaUploadUrl`), validation type/poids côté serveur avant signature.
- Compression **avant l'envoi**, côté navigateur : images redimensionnées (max 1600 px, WebP, qualité ~0,8) sur canvas ; vidéos limitées en durée et refusées au-delà d'un poids seuil avec message clair (transcodage serveur hors périmètre du Worker).
- Miniatures générées à l'envoi pour l'affichage carte/liste.
- Suppression = retrait de la ligne + suppression de l'objet R2.

Interfaces :

- Tableau de bord vendeur : gestionnaire de médias (glisser-déposer, réordonner, définir la vitrine).
- Fiche commerce : carrousel vitrine, lecture vidéo en sourdine, chargement différé.
- Cartes de résultats : image vitrine en vignette, repli sur l'initiale colorée actuelle.

## 4. Identité visuelle : logo et glassmorphism

- Le logo fourni (pin + œil, verre dépoli) devient le logo officiel : favicon, en-tête, page d'accueil, écran d'authentification.
- Jetons de design ajoutés dans `src/styles.css` : `--glass-surface`, `--glass-border`, `--glass-shadow`, utilitaire `omni-glass` (fond translucide + flou d'arrière-plan + bordure claire).
- Application progressive aux panneaux flottants de la carte, à la barre de recherche et aux feuilles mobiles — pas d'aplat de verre sur les zones denses en texte, pour garder le contraste.

## 5. Refonte navigation mobile-first

- **Barre de recherche flottante centrée en bas** (verre dépoli), avec micro, appareil photo et texte — c'est l'élément principal sur mobile comme sur ordinateur.
- **Une seule icône en haut** (marque à gauche, bouton menu à droite) ouvrant un panneau : bascule Acheteur/Vendeur, panier, demandes, favoris, notifications, compte, admin (si staff).
- Les compteurs (panier, notifications non lues) restent visibles sur l'icône du menu.
- Passage en revue responsive de toutes les pages : grilles `minmax(0,1fr)_auto`, `min-w-0` sur les blocs de texte, `shrink-0` sur les icônes, feuilles plein écran sur mobile.

## Détails techniques

- Migration `db/migrations/006_media.sql` : tables médias, index par `facility_id`, contraintes de type.
- Nouveau `src/lib/media.functions.ts` (URL signée, enregistrement, suppression, réordonnancement) + `src/lib/r2.server.ts` (signature S3 compatible).
- Nouveau `src/lib/identity.functions.ts` pour `getMyIdentity`.
- Nouveaux composants : `MediaManager.tsx` (vendeur), `MediaCarousel.tsx` (fiche), `BottomSearchDock.tsx`, `NavMenuSheet.tsx`.
- `src/lib/omni.ts` : utilitaires de tri par distance et de cadrage.
- API publique v1 : les médias vitrine sont exposés en lecture seule dans la réponse `facilities`.

## Ordre de livraison

1. Rôles Neon Auth + garde admin (rapide, débloque les outils internes)
2. Recentrage carte sur résultats proches
3. Refonte navigation glassmorphism + logo (mobile-first)
4. Médias images (R2 + compression navigateur)
5. Médias vidéo + galeries produits
