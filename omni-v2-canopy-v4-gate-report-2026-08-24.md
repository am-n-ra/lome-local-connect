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

## Final V4.3 release reconciliation — 2026-08-25

Le correctif V4.3 est maintenant dans le commit `2cab2d8` et le déploiement GitHub→Vercel READY `dpl_62FQ6GnjqnTMbJsMpbW1cya6sa41`, avec l’alias canonical `omni.sparkafrika.online`, source Git et exactement 12 fonctions Node. Le worker MapLibre et son module partagé sont publiés à des chemins same-origin stables; le timeout de readiness protège le chargement cold Positron sans masquer un échec durable.

Le smoke read-only canonical a confirmé `Carte active`, le globe vectoriel Positron blanc/noir/gris, les contrôles permanents et la recherche publique bornée `Marche de Hanoukope`. Après la chorégraphie et le chargement des tuiles, la vue locale Lome/Aflao a montré rues, quartiers, contours, littoral et repère natif ancré; `Voir le lieu` est resté non invoqué. Les 122 tests/18 fichiers, build, `check:boundary`, mobile `390×844` et desktop `1024×880` sont passants.

**Décision de gate:** `partial / canonical Canopy map and bounded reveal proven; Species, Canopy and Ring gates remain open`. Ne sont pas prouvés ici: l’a11y/focus complète en session authentifiée, le touch et l’input sur appareil réel, la résilience/performance distante au-delà de ce smoke, la densité mondiale, les branches Seller/Reviewer opérationnelles, la couverture OSM/Overpass mondiale et le multi-produit Root/API. Aucun utilisateur, identité, donnée historique, branche Neon ou contrat métier n’a été supprimé ou muté.

## Addendum Canopy V4.1 — 2026-08-25

Le propriétaire a clarifié la référence : il s’agit de la carte historique Omni blanc/noir/gris, avec fond blanc, océans presque noirs, continents blancs/clairs et contours noirs/gris; la carte verte précédente n’est pas la direction cible. L’implémentation V4.1 met à jour la palette distante et le fallback honnête, supprime le wash vert/sepia et le halo coloré de sélection, conserve les pins visibles dans les couches MapLibre natives et ajoute le helper d’orbite autour d’un axe vertical.

La rotation est désormais conçue pour rester active lorsque l’utilisateur écrit, ouvre Options/J5 ou navigue hors de la carte. Elle peut s’arrêter sur action de la carte ou contrôle cartographique explicite. Les boutons `Zoom arrière`, `Zoom avant` et `Utiliser ma localisation` sont rendus ensemble. La bande visuelle `Zone approximative détectée` est supprimée, tandis que l’état accessible reste non obstructif; la tentative automatique reste passive et le recentrage reste explicite.

Ce document enregistre un **checkpoint V4.1 partiellement prouvé**, pas une acceptation. Le baseline source est maintenant passé : `git diff --check`, **122 tests dans 18 fichiers**, build TypeScript/Vite, `check:boundary` propre et bundling de exactement 12 fonctions Vercel; l’avertissement de chunk supérieur à 500 kB reste non bloquant. Une preuve locale isolée `390×844` a confirmé les trois contrôles permanents, l’input mobile calculé à `16px`, `visualViewport.scale=1`, l’absence de bande visuelle de zone approximative, la présence du statut screen-reader, zéro overlay HTML `.map-pin`, la continuité de rotation pendant focus recherche/Options/compte, la bascule `2.35 globe → 3.35 mercator → 2.35 globe → 1.35 globe` et un drag tactile synthétique conservant le bearing. Une preuve locale `1024×880` a confirmé la rotation idle, le drag globe à axe vertical, la conservation du centre et la reprise idle hors carte. Les screenshots locaux montrent également le correctif de séparation de l’alerte et des trois contrôles.

Le déploiement canonique V4.1 `dpl_2A1htHsJkwkdsSXWLK92xABYLrAQ` est maintenant READY, issu du commit `792c858`, avec les aliases canoniques et le runtime Node à 12 fonctions. Le smoke check live a confirmé `globe / 1.35 / rotating` → `mercator / 4.35 / paused` → `globe / 2.35 / paused`, centre conservé, basemap `monochrome` et trois contrôles permanents.

Restent non prouvés : un appareil iOS/Android réel, la permission réelle du navigateur propriétaire, une preuve touch native non synthétique, les pins source-backed pendant un mouvement avec un résultat réel, la matrice Authenticated Buyer/Seller/Reviewer complète et la résilience remote-tile/performance. Aucun statut `verified` Species ne doit être attribué avant ces preuves.


## Addendum Canopy V4.2 — 2026-08-25

Le propriétaire a confirmé que la référence cible est le globe historique Omni visible dans le code existant : champ blanc, océans noirs, continents clairs/blancs et contours géographiques fins, avec une progression visuelle continent → pays → région/ville → contexte local. Le highlight de région très foncé et le chip littéral `Votre position` de l’image de référence sont explicitement exclus.

La correction V4.2 réutilise le provider Liberty déjà prouvé dans cette branche, conserve son raster Natural Earth comme silhouette bas niveau mais le traite en grayscale/inversion/brightness uniquement sur la projection globe, avec fond MapLibre transparent afin d’obtenir le contraste noir-océan/blanc extérieur. La projection mercator reste grayscale non inversée. Le provider Positron de `origin/main` a été testé avec le rewrite glyphes hérité, mais son style n’a pas atteint `isStyleLoaded` dans le contrôleur direct local et aucune tuile PBF n’a été demandée; il n’a donc pas été retenu pour ne pas remplacer une carte visible par un canvas blanc.

Les étapes de reveal ont été réalignées sur le comportement de référence : monde `1.05`, continent `2.15`, pays `5.35`, région `8.25`, ville/zone `11.25`, puis framing local `14.2` ou fit-bounds résultat. Les étapes franchissent donc volontairement le seuil globe/mercator `2.4` avant le contexte local. La détection de sortie de carte a été rendue coordonnée par position du pointeur afin que l’idle reprenne depuis la caméra relâchée.

Le baseline source reste vert : `git diff --check`, **122 tests dans 18 fichiers**, build avec exactement 12 fonctions Vercel et `check:boundary` propre. Les preuves locales settled `390×844` et `1024×880` montrent maintenant le globe réellement rendu, le champ blanc, l’océan presque noir, les terres claires, le marqueur utilisateur neutre sans chip, les trois contrôles permanents et l’absence de halo de sélection. Les assertions de rotation map-only, drag à axe vertical, reprise hors carte, input `16px`, projection réversible et absence d’overlay HTML de pins restent passantes.

Le gate reste toutefois `partial`. La capture locale repose sur le raster Natural Earth et montre une texture/relief plus doux que des frontières vectorielles parfaitement nettes; la preuve de streets/neighborhoods après reveal, des pins natifs sur résultat réel pendant mouvement, du device touch réel, de l’input zoom iOS/Android réel, de la permission propriétaire et de la matrice Auth/accessibility/performance complète reste ouverte. Aucun déploiement V4.2 ne doit être annoncé avant le commit et le smoke check canonique.


## Canonical V4.2 release addendum — 2026-08-25

Commit `381756d4fe2909bf95c724c35aed8caea40cee61` on `omni-v2-rebuild` reached READY as deployment `dpl_8UondDSFQHjPKmdu8dY1GZajpV2a`, with the canonical alias `omni.sparkafrika.online` and exactly 12 Node functions. The canonical arrival smoke confirms `Carte active`, white outer field, near-black globe/ocean, light land/Africa, the permanent `Zoom arrière` / `Zoom avant` / `Utiliser ma localisation` controls, and the exclusion of both the heavy selected-region highlight and literal `Votre position` chip. Canonical plus/minus reversal passed.

The read-only `Marche de Hanoukope` query reached a real result sheet with `Le monde`, `Résultats pour « Marche de Hanoukope »`, `Nouvelle recherche`, `Affiner`, `Retour à la carte`, one public result card and `Voir le lieu` left uninvoked. After the reveal settled, two successive canonical frames showed the result shell and controls still mounted but the map canvas blank white at mercator zoom `12.80`. The browser diagnostic showed public Natural Earth raster requests but no visually proven vector street/boundary detail or native facility pin movement. A direct OpenFreeMap vector-template/style-transform experiment emitted no PBF requests in this direct controller and was reverted; no unsupported provider claim is made.

**Gate decision:** `partial / deployed, not accepted`. V4.2 materially advances the Species visual reference and canonical arrival/result shell, but it does not close the full progressive local reveal. The next gate is a properly verified MapLibre wrapper/source-loading correction, followed by real-result vector streets/boundaries, native pin movement, and compact accessibility/device/performance proof. Species, Global Root and all release Rings remain open; multi-product availability remains Root/API-blocked.


## Final canonical alias verification — 2026-08-25

The evidence-only commit `1345c959ebbdc772f7ef2a79b0ec595faaa65ecd` reached READY as deployment `dpl_DXfz3X7ybMo8TaWnvUWBGrUVfHtf`, with `omni.sparkafrika.online` among its aliases and the same exact 12-Node-function boundary. A second read-only arrival check on that latest alias reproduced `Carte active`, the white-field/near-black-globe/light-land treatment and permanent minus/plus/recenter controls. The previously recorded blank final high-zoom reveal remains unresolved; the gate stays `partial` and no Species acceptance is granted.


## Addendum Canopy V4.3 — 2026-08-25

La nouvelle référence textuelle du propriétaire confirme que le target n’est pas un simple raster monochrome, mais un globe MapLibre vectoriel: champ extérieur blanc, océans charbon, continents clairs, contours fins, rotation calme et progression monde → continent → pays → région/ville → local. Le highlight de sélection lourd et le chip littéral `Votre position` restent exclus.

Le diagnostic a isolé la cause du précédent blanc Positron: le provider fonctionne dans le navigateur, mais le worker MapLibre n’était pas résolu dans le bundle Vite de l’application. V4.3 ajoute l’asset worker same-origin produit par Vite et l’enregistre avant le constructeur MapLibre. Dans le preview Omni, Positron atteint maintenant `load/idle`, charge ses glyphes/PBF, rend le globe Africa-facing et publie `Carte active`; aucune requête `/omni-local-style.json` n’est émise. La palette réutilise directement les couches vectorielles Positron, sans filtre d’inversion et sans Natural Earth raster.

La révélation sépare désormais le contexte utilisateur autorisé pour les étapes monde→ville du cadrage final des résultats. Les tests locaux et preuves responsive restent verts: 122 tests/18 fichiers, build TypeScript/Vite, `check:boundary`, exactement 12 fonctions, mobile `390×844`, desktop `1024×880`, globe/mercator réversible, zoom Plus visible, drag à axe vertical, reprise idle et dock/contrôles sans chevauchement.

**Décision de gate:** `partial / V4.3 localement prouvé, non déployé, non accepté`. Il reste à pousser puis vérifier le déploiement canonique, refaire le smoke read-only et prouver sur résultat réel les rues/quartiers et les pins natifs en mouvement. OSM/Overpass mondial, `4,067+` facilités, Seller, Reviewer, Auth complet, PWA, paiements, QR, transactions et multi-produit restent hors de ce gate.

## 2026-08-25 — Desktop rotation-resume reconciliation

**Status:** `partial / Canopy motion slice verified; parent Species gate remains open`.

**Changed:** The map-only pointer ownership path now uses the actual event target when available. Because the MapLibre canvas fills the viewport beneath the interface, the previous coordinate-only test treated the search dock and other UI overlays as if they were still on the map. The desktop proof now exits through the real search input overlay.

**Proven:** The local `1024×880` desktop proof passes idle globe motion, direct drag center change, zero-bearing vertical-axis preservation, released-camera retention and rotation restart after pointer movement to the search dock. The local `390×844` mobile proof remains green across touch, projection reversal, controls, 16px input, no visible approximate band, native canvas and non-map focus/options/account ownership. Full validation passes: **127 tests / 19 files**, Vite build, exactly 12 generated Vercel functions, client boundary and diff check. Canonical read-only smoke on `dpl_GetKcB8WL2b4A8d8iauCRJ8SKSp1` for commit `6711151` is `READY`, carries `omni.sparkafrika.online`, and reproduced the released-center hold followed by stable rotation from that position after leaving to the search overlay.

**Not proven:** This ring does not prove full Species acceptance, dense real-result pin movement across frames, real-device permission/touch behavior, complete keyboard/screen-reader traversal, remote-tile performance or all recovery states. No business CTA or write path was used.

**Preserved:** Existing map projection threshold `2.4`, monochrome vector treatment, native-rendered pin boundary, Auth/session repair, users, identities, historical data, claims, server contracts and all Root/API-paused operations remain intact.

**Deployment:** Commit `6711151` was pushed to `omni-v2-rebuild` and deployed through GitHub→Vercel as `dpl_GetKcB8WL2b4A8d8iauCRJ8SKSp1`, `READY`, source `git`, canonical alias present, 12 Node functions.

**Next gate:** Prove dense native-pin movement and the remaining real-device/accessibility/performance matrix. Keep Species and release Rings open; keep Global Root `review` and worldwide OSM/Overpass, PWA/Web Push, Seller/Reviewer operations, payment, QR, transactions and multi-product `Root/API-blocked`.

## 2026-08-25 — Native cluster and pin movement addendum

**Status:** `partial / native MapLibre movement bounded-proven; Species and Canopy acceptance remain open`.

**Changed:** No source correction was justified. The existing native GeoJSON source/layers were inspected directly in the authenticated browser session. The read-only probe used only the safe public query, map zoom/camera movement and reversible camera restoration.

**Proven:** At the canonical initial globe, the existing bounded public fixtures were rendered in native `omni-cluster-rings`, `omni-clusters` and `omni-cluster-count` layers. A small reversible camera move preserved the native cluster count, changed its projected screen position and restored the original projection. After the safe local result reveal, one native `omni-pins` feature was rendered; a small reversible camera move preserved the feature count, changed its projected screen position and restored it. Visible HTML `.map-pin` overlays remained zero. Local 390×844 and 1024×880 responsive proofs pass; 127 tests/19 files, build, boundary and 12-function generation pass. The canonical observation was on READY `dpl_Czq84yAUzdHpjur3w6ehb6ZunKwk`, alias `omni.sparkafrika.online`.

**Not proven:** This is a bounded fixture/native-layer proof, not worldwide or dense multi-pin coverage. Real-device touch/input/permission, full keyboard/screen-reader traversal, long-window remote performance, complete recovery and business operations remain unproven. No CTA or write path was used.

**Preserved:** The vector Positron worker packaging, monochrome palette, 2.4 projection and globe-label contracts, overlay-aware rotation behavior, Auth mapper, users, identities, historical data and all Root/API-paused scopes remain preserved.

**Deployment:** The application behavior is from commit `6711151` / READY `dpl_GetKcB8WL2b4A8d8iauCRJ8SKSp1`; the read-only proof ran on the documentation-aligned READY deployment `dpl_Czq84yAUzdHpjur3w6ehb6ZunKwk`, source `git`, canonical alias present and 12 Node functions.

**Next gate:** Keep the gate partial. If bounded fixtures support it, inspect more than one visible native pin at local zoom; otherwise record the density limitation and move to real-device/accessibility/performance evidence. Do not advance Species, release Rings or Root/API operations.

## 2026-08-25 — Accessibility, recovery and reduced-motion addendum

**Status:** `partial / bounded Canopy keyboard, recovery and reduced-motion proof verified; Species and Rings remain open`.

**Changed:** No product source change was needed. The canonical session was used for safe account/options/read-only recovery checks; the reduced-motion check ran against the local preview with an external temporary harness.

**Proven:** The authenticated account menu exposed an ARIA menu whose focus stayed inside: Tab reached close, then `Mes demandes`; Enter opened the read-only Buyer sheet and Escape returned to the active map without focus trapped in the removed sheet. Search options opened and closed via Escape without applying changes, retaining the dock and three map controls. Compact reduced motion kept `motion/rotation=reduced`, the map mounted and monochrome, the input 16px, three named controls, no horizontal overflow and zero visible HTML pins. Full validation passed 127 tests/19 files, build, boundary, diff check and 12-function generation.

**Not proven:** No claim of full WCAG/device-native screen-reader coverage, real-device input/permission or long-run performance is made. Dense global pins, complete operations and business mutation paths remain outside this proof.

**Preserved:** Existing map-only motion, native MapLibre source/layers, Auth, users/historical data and all paused operations remain preserved.

**Deployment:** Canonical proof ran on READY `dpl_FELsPP7PgX6UEzFHesgzwa74p5eV`, commit `9f31dc3`, source `git`, canonical alias and 12 functions.

**Next gate:** Run a bounded real-device/native input and accessibility/performance pass, retaining partial status until its evidence exists. Do not advance Species or Rings.

## 2026-08-25 — Device-native boundary addendum

**Status:** `partial / bounded permission, touch persistence and reduced-motion evidence added; Canopy and Species remain open`.

**Changed:** No source correction was justified. External temporary probes were removed after a successful local run.

**Proven:** Compact synthetic exact permission showed an accessible visible user-position marker without a visible prompt band. The integrated touch proof moved the camera, preserved the vertical axis, kept the marker and MapLibre canvas mounted and kept facility HTML pins hidden. Reduced-motion proof kept rotation reduced, the monochrome map mounted, 16px input, three named controls and no horizontal overflow. The canonical menu/options/recovery proof and existing mobile/desktop proof remain passing; 127 tests/19 files, build, boundary and 12 functions pass.

**Not proven:** Real OS permission, real location accuracy, physical-device touch/input, complete assistive technology support, long-window remote performance, dense pin coverage and operations remain unproven. No CTA or mutation was used.

**Preserved:** Map-only ownership, native layers, projection contract, Auth and all data/Root/API boundaries remain preserved.

**Deployment:** Proof ran on READY `dpl_4ZByA7G1W6KLVnwieGzgP23LQs2Y`, commit `b0b995e`, canonical alias present, source `git`, 12 functions.

**Next gate:** Run the smallest available real-device/accessibility/performance evidence; keep Species and Rings open.

## 2026-08-25 — Remote stability observation addendum

**Status:** `partial / bounded remote map stability observation verified; Canopy and Species remain open`.

**Changed:** No product correction was made. The canonical probe was temporary, read-only and removed after execution.

**Proven:** After waiting for real `Carte active` readiness, a 12-second canonical window kept the canvas mounted, monochrome globe stable and idle rotation observable. The sample recorded zero mapped-resource HTTP failures, zero console errors and zero page errors, with one worker, two sprite, two style/asset and 19 vector-PBF resources. Touch/permission and reduced-motion proofs remain bounded and passing; 127 tests/19 files, build, boundary and 12 functions pass.

**Not proven:** No claim of benchmark-grade performance, real-device behavior, long-duration reliability, dense pins or operations is made. No CTA or mutation was used.

**Preserved:** Native MapLibre, projection, motion, Auth and all data/Root/API boundaries remain preserved.

**Deployment:** Observation ran on READY `dpl_B8cpohkrT2dxr1ZaoKhVfCvLs9Wh`, commit `95137a1`, canonical alias, source `git`, 12 functions.

**Next gate:** Gather real-device/accessibility evidence and only then decide whether a longer performance window is necessary; keep Species and Rings open.

## 2026-08-25 — Accessible native-pin addendum

**Status:** `partial / bounded result-pin ARIA and safe-result focus continuation verified; Canopy and Species remain open`.

**Changed:** No source correction was made. A safe public query was used only to expose the result state.

**Proven:** One named, focusable button existed in the labeled `.map-pin-a11y` container. Programmatic focus reached it without activation; the container was clipped and the visual `.map-pin` count was zero. Tab continued to a named non-business button, not `Voir le lieu`, with the map canvas mounted. `Nouvelle recherche`, `Affiner` and `Retour à la carte` remained available.

**Not proven:** No claim of full WCAG/screen-reader/device coverage, dense pins or operational readiness is made. No CTA or mutation was used.

**Preserved:** Native layers, result-sheet exits, Auth, data boundaries and paused Root/API scope remain preserved.

**Deployment:** Read-only observation used READY `dpl_3Z4rruFzmNPkzuuo8TpmVao4uhQt`, commit `10f2da7`, canonical alias and 12 functions.

**Next gate:** Run the smallest complete result focus traversal or real assistive-technology/device proof; keep Species and Rings open.
