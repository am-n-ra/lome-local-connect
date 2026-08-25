# Omni V2 — Rapport de gate Nature Way
## Réentrée Species/Canopy V4 — 2026-08-24

### Statut

**Canopy V4 est implémentée et matériellement prouvée, mais le gate Species reste ouvert.** Cette réentrée ne ferme ni Species, ni Global Root, ni un Ring de release. Elle reste limitée à l’expérience map-first Buyer et à ses contrats visuels/interactifs partagés.

### Décision produit

Le signal propriétaire a été traité comme une continuation de la même Canopy, conformément au Founder HQ unique. L’amendement V4 établit une caméra continue : le globe est utilisé sous le seuil local, la carte normale au-delà, et le retour au globe se fait automatiquement lors du dézoom. Les facilités visibles appartiennent au rendu MapLibre lui-même; elles ne sont plus des boutons HTML positionnés séparément puis réinjectés après `moveend`.

Le choix de localisation reste privacy-aware : l’arrivée peut tenter la permission dans une session, mais ne recentre pas automatiquement la carte mobile. Le repère, lorsqu’il est accepté, reste un contexte séparé; le bouton explicite conserve le droit de recentrer volontairement. Le dock et les sheets mobiles gardent une taille de texte de `16px` afin d’éviter le zoom automatique du navigateur lors de la saisie.

### Changé

| Surface | Changement V4 | Contrat préservé |
|---|---|---|
| Caméra | Bascule automatique globe↔mercator à `zoom 2.4`; le cadrage final d’un résultat peut atteindre une échelle locale jusqu’à `12.8`, avec un maximum de `14.5`. | Aucun reset silencieux; la caméra manuelle garde son centre et son bearing. |
| Geste globe | Drag gauche libre à faible zoom, pivot droit MapLibre conservé, drag/pan local laissé au moteur natif au-delà du globe. | Rotation idle lente, interrompable et reprise depuis la position relâchée. |
| Facilités | Clusters en anneaux et pins rendus par les couches GeoJSON MapLibre; le fallback HTML est uniquement clavier et visuellement caché. | Les pins publics n’impliquent ni stock, ni confiance, ni propriété, ni permission. |
| Palette | Océan sombre, terres claires et contours frontières plus contrastés; texture et filtre CSS fortement réduits. | Le style vectoriel OpenFreeMap existant est réutilisé; aucun import OSM ni changement de source métier. |
| Mobile | Suppression du recentrage automatique de l’auto-tentative location; champs de saisie à `16px`. | Le contrôle explicite de localisation reste disponible et annulable. |
| Fermeture | `Retour à la carte` et fermeture du contexte effacent `selectedFacility`, le produit sélectionné, le halo de focus et le focus DOM. | Retour réversible vers le dock map-first. |
| Multi-produit | Aucun batch ni panier n’est ajouté; la note de planification reste honnête dans l’étape Produit. | Contrat availability mono-produit et idempotence inchangés. |

### Prouvé

Le commit `6399b68` a été poussé sur `omni-v2-rebuild` et déployé par le chemin GitHub→Vercel dans le deployment READY `dpl_7gg9Rxv5mR9whTgUw42WHCVaMVaQ`. Les métadonnées indiquent le runtime Node attendu et la branche conserve exactement 12 fonctions Vercel.

La preuve wide production à `1024×880` a enregistré un état initial `centerLng=1.2200`, `bearing=0.00`, `zoom=1.35`, `projection=globe`. Le drag gauche a changé le centre en `-51.9800` et le bearing en `34.20`. Le pivot droit a conservé le centre et modifié le bearing à `-85.80`. Après sortie vers la topbar et attente, l’état est redevenu `resting_globe/idle` depuis la même caméra relâchée, sans retour au centre initial.

La preuve de zoom production a enregistré `globe` à `1.35`, `mercator` à `3.35`, puis `globe` à `2.35`. Le centre a été conservé entre ces transitions et le canvas MapLibre est resté unique. Le résultat de recherche réel `Marche de Hanoukope` a atteint `mercator`, `zoom=12.80`, avec la sheet et les actions `Nouvelle recherche`, `Affiner` et `Retour à la carte`.

La fermeture `Retour à la carte` a supprimé la sheet de résultats et le panneau de facilité, conservé le dock avec la requête disponible, quitté le mode `selected_facility` et remis la caméra en `manual_navigation`. La preuve mobile a confirmé un canvas plein écran `390×844`, une saisie calculée à `16px`, zéro overlay HTML `.map-pin` visible et aucun débordement horizontal.

Les tests de source passent avec **119 tests dans 17 fichiers**, le build TypeScript/Vite passe, `check:boundary` est propre et le bundling produit exactement 12 fonctions. L’avertissement de chunk Vite supérieur à 500 kB reste non bloquant et non traité dans cette Canopy.

### Non prouvé ou encore ouvert

La preuve de permission réelle dans le navigateur du propriétaire n’a pas été capturée directement; seules les branches persistantes denied/timeout et les contextes synthétiques temporaires ont été utilisées. La preuve touch complète, la traversal clavier/lecteur d’écran, la densité multi-cluster, l’inspection visuelle de chaque pin pendant un mouvement et la fiabilité/performance complète des tuiles distantes restent ouvertes. Le résultat Playwright compact a validé la taille d’entrée et la géométrie, mais sa séquence réduite n’a pas franchi seule le seuil de projection; il s’agit donc d’une preuve partielle V4 mobile.

Le support de plusieurs produits n’est pas terminé. Le contrat serveur actuel accepte un seul produit par demande. Une vraie évolution exige une décision Root/API sur l’identité du set de produits, les quantités et budgets par produit, l’idempotence batch, les succès partiels, l’expiration, le resume/retry, la propriété des réponses et les permissions. Aucun faux batch n’a été envoyé.

### Préservé

Les utilisateurs existants, identités Auth, données historiques, branches Neon et claim de test borné ont été préservés. Aucune migration destructive, suppression Auth, reset, changement de rôle, claim, réponse Seller, décision Reviewer, notification, transaction, QR, paiement, import OSM, PWA ou écriture availability multi-produit n’a été effectué dans cette réentrée. Les bundles générés `api/v2/*.js` et les artefacts browser temporaires restent exclus des commits.

### Déploiement

- **Release V4 caméra/pins :** `6399b68`
- **Release V4.1 monochrome/motion :** `792c858`
- **Deployment READY V4.1 :** `dpl_2A1htHsJkwkdsSXWLK92xABYLrAQ`
- **Domaine canonique :** [omni.sparkafrika.online](https://omni.sparkafrika.online/)
- **Branche :** `omni-v2-rebuild`
- **Fonctions :** exactement 12, runtime Node attendu

### Prochain gate

Rester dans Species/Canopy. Le prochain plus petit gate doit produire la preuve authentifiée compacte Buyer/Seller/Reviewer, la traversal clavier/focus et touch, le retour facility-focus/back/Escape, la matrice empty/error/retry, l’inspection native des pins sur densité et mouvement, ainsi qu’une revue remote-tile/performance. Ensuite seulement, le Founder HQ pourra décider si le Ring Canopy est acceptable.

La sélection réelle de plusieurs produits doit rester derrière un mini-Root/API approuvé; elle ne doit pas être traitée comme une simple extension CSS. Les branches rôle, OSM, PWA/Web Push, paiements, QR, transactions et terrain restent en pause. **Species n’est pas accepté et Global Root reste `review`.**

## Addendum Canopy V4.1 — 2026-08-25

Le propriétaire a clarifié la référence : il s’agit de la carte historique Omni blanc/noir/gris, avec fond blanc, océans presque noirs, continents blancs/clairs et contours noirs/gris; la carte verte précédente n’est pas la direction cible. L’implémentation V4.1 met à jour la palette distante et le fallback honnête, supprime le wash vert/sepia et le halo coloré de sélection, conserve les pins visibles dans les couches MapLibre natives et ajoute le helper d’orbite autour d’un axe vertical.

La rotation est désormais conçue pour rester active lorsque l’utilisateur écrit, ouvre Options/J5 ou navigue hors de la carte. Elle peut s’arrêter sur action de la carte ou contrôle cartographique explicite. Les boutons `Zoom arrière`, `Zoom avant` et `Utiliser ma localisation` sont rendus ensemble. La bande visuelle `Zone approximative détectée` est supprimée, tandis que l’état accessible reste non obstructif; la tentative automatique reste passive et le recentrage reste explicite.

Ce document enregistre un **checkpoint V4.1 partiellement prouvé**, pas une acceptation. Le baseline source est maintenant passé : `git diff --check`, **122 tests dans 18 fichiers**, build TypeScript/Vite, `check:boundary` propre et bundling de exactement 12 fonctions Vercel; l’avertissement de chunk supérieur à 500 kB reste non bloquant. Une preuve locale isolée `390×844` a confirmé les trois contrôles permanents, l’input mobile calculé à `16px`, `visualViewport.scale=1`, l’absence de bande visuelle de zone approximative, la présence du statut screen-reader, zéro overlay HTML `.map-pin`, la continuité de rotation pendant focus recherche/Options/compte, la bascule `2.35 globe → 3.35 mercator → 2.35 globe → 1.35 globe` et un drag tactile synthétique conservant le bearing. Une preuve locale `1024×880` a confirmé la rotation idle, le drag globe à axe vertical, la conservation du centre et la reprise idle hors carte. Les screenshots locaux montrent également le correctif de séparation de l’alerte et des trois contrôles.

Le déploiement canonique V4.1 `dpl_2A1htHsJkwkdsSXWLK92xABYLrAQ` est maintenant READY, issu du commit `792c858`, avec les aliases canoniques et le runtime Node à 12 fonctions. Le smoke check live a confirmé `globe / 1.35 / rotating` → `mercator / 4.35 / paused` → `globe / 2.35 / paused`, centre conservé, basemap `monochrome` et trois contrôles permanents.

Restent non prouvés : un appareil iOS/Android réel, la permission réelle du navigateur propriétaire, une preuve touch native non synthétique, les pins source-backed pendant un mouvement avec un résultat réel, la matrice Authenticated Buyer/Seller/Reviewer complète et la résilience remote-tile/performance. Aucun statut `verified` Species ne doit être attribué avant ces preuves.
