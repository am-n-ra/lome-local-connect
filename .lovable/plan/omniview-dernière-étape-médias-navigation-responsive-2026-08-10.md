# OmniView — Dernière étape : médias, navigation, responsive

Cloudflare R2 sera configuré plus tard via les variables d'environnement Vercel. Le code sera écrit pour lire ces variables au moment de l'appel, avec un repli propre tant qu'elles sont absentes.

## 1. Médias (photos vitrine, galeries produits, vidéos)

Base de données — nouvelle migration `006_media.sql` :

- `facility_media` : `facility_id`, `kind` (image | video), `url`, `thumb_url`, `position`, `bytes`, `duration_s`.
- `product_media` : `product_id`, `url`, `position`.
- Index par `facility_id` / `product_id`, contrainte sur `kind`.
- Limites appliquées côté serveur : 6 images + 2 vidéos par fiche, 4 images par produit, vidéo ≤ 60 s.

Stockage :

- `src/lib/r2.server.ts` : signature S3 compatible, lit `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` à l'exécution.
- `src/lib/media.functions.ts` : `createMediaUploadUrl` (URL signée, validation type/poids), `registerMedia`, `deleteMedia`, `reorderMedia`.
- Si les variables R2 manquent, l'envoi renvoie un message clair « Stockage média non configuré » — aucune casse ailleurs dans l'app.
- Compression dans le navigateur avant envoi : images redimensionnées (max 1600 px, WebP ~0,8) sur canvas, miniature générée ; vidéos refusées au-delà de la durée/poids seuil avec message explicite.

Interfaces :

- `MediaManager.tsx` dans le tableau de bord vendeur : ajout, réordonnancement, choix de la vitrine, suppression.
- `MediaCarousel.tsx` sur la fiche commerce : carrousel vitrine, vidéo en sourdine, chargement différé.
- Cartes de résultats et marqueurs de liste : vignette vitrine, repli sur l'initiale colorée actuelle.
- API publique v1 : médias vitrine exposés en lecture seule dans `facilities`.

## 2. Navigation mobile-first glassmorphism

- `NavMenuSheet.tsx` : une seule icône menu en haut à droite ouvrant un panneau — bascule Acheteur/Vendeur, panier, commandes, favoris, notifications, compte, admin (staff uniquement).
- Les compteurs (panier, notifications non lues) restent visibles sur l'icône du menu.
- Barre de recherche flottante en bas conservée et harmonisée en verre dépoli (déjà en place sur la carte).
- Marque + logo à gauche dans la barre du haut.

## 3. Passage responsive complet

- Revue de toutes les pages (accueil, carte, fiche, vendeur, admin, auth, api-docs) : grilles `minmax(0,1fr)_auto`, `min-w-0` sur les blocs texte, `shrink-0` sur les icônes, feuilles plein écran sur mobile, aucun débordement horizontal.

## 4. Finitions

- Métadonnées `head()` propres et uniques sur chaque route de contenu.
- Vérification navigateur : accueil, carte (recherche + focus), fiche, vendeur (médias), admin.

## Détails techniques

- Nouveaux fichiers : `db/migrations/006_media.sql`, `src/lib/r2.server.ts`, `src/lib/media.functions.ts`, `src/lib/media-compress.ts`, `src/components/omni/MediaManager.tsx`, `src/components/omni/MediaCarousel.tsx`, `src/components/omni/NavMenuSheet.tsx`.
- Modifiés : `TopNav.tsx`, `carte.tsx`, `fiche.$id.tsx`, `vendeur.tsx`, `public-api.server.ts`, `styles.css`.
- Variables d'environnement à ajouter plus tard dans Vercel : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.
