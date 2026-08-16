# Correction de la page carte : localisation, couverture mondiale, panneaux responsives

## Constat (vérifié)

- Localisation : `src/routes/carte.tsx` fait **un seul** appel `getCurrentPosition` en haute précision (timeout 12 s, `maximumAge: 0`). Tout échec — y compris un simple timeout — bascule en `unavailable`, et une position jugée « approximative » n'est jamais utilisée comme origine : les distances et l'itinéraire retombent alors sur le centre de marché de Lomé. C'est ce qui donne l'impression d'une détection cassée.
- Couverture : la base contient **4 067 établissements `unclaimed`, tous à Lomé** (`market_code = 'TG-LOME'`). `listFacilities` filtre en dur sur un seul `market_code` et n'affiche rien tant qu'aucune recherche n'est lancée ; le bloc « découverte » se limite à 32 fiches de Lomé. Il n'existe aujourd'hui aucune donnée hors Togo. Je veux aussi Des unclaimed sur aflao . Aussi lecard des facilite doit etre responsive et redesigned comme le reste du dock de recherche est par exemple et notification devrait etre totalement deplace derriere son icone et non ouvrir le menu hamburger le switch seller buyer drevrait aussi etre visible sans le menu en tout cas sur desktop  

- Panneau « Affiner » : `PopoverContent` en `w-80` fixe, sans limite de hauteur ni marge de collision — il déborde sur les écrans étroits.

## Ce qu'on fait

### 1. Localisation fiable

- Stratégie en deux temps : première position rapide (basse précision, cache court) pour afficher immédiatement l'utilisateur, puis affinage par `watchPosition` en haute précision pendant quelques secondes, en gardant la meilleure précision obtenue.
- Distinguer clairement les cas : refus (permission), timeout, indisponible. Un timeout ne détruit plus la dernière position connue et propose « Réessayer ».
- Une position approximative devient une **origine utilisable** (distances, tri proximité, cadrage), avec badge « zone approximative ± X m » ; seul l'itinéraire piéton reste conditionné à une position précise.
- Conserver la dernière position valide en session pour éviter le retour au centre de marché à chaque rechargement.
- Recentrage : le bouton logo du dock recentre sur la position réelle même approximative.

### 2. Carte peuplée d'`unclaimed` à l'échelle mondiale

- Nouveau chargement **par cadre visible (bbox)** au lieu du filtre `market_code` figé : au déplacement/zoom de la carte, on charge les établissements du rectangle affiché, sans recherche préalable, avec plafond de résultats et regroupement (clustering) au-delà d'un certain nombre de pins.
- Couverture hors Lomé : pour un cadre sans donnée, récupération à la demande depuis OpenStreetMap (Overpass), normalisation (nom, catégorie, coordonnées), déduplication, et enregistrement en base au statut `unclaimed` — la couverture mondiale se construit ainsi progressivement au fil des zones consultées, avec cache par tuile pour ne pas refaire l'appel.
- Le marché reste utilisé pour la devise et le centrage initial, pas pour restreindre l'affichage de la carte.
- Comportement des pins `unclaimed` inchangé : infos publiques + « réclamer », pas d'achat.

### 3. Panneaux et mise en page de la page carte

- « Affiner » : largeur `min(20rem, 100vw - 1.5rem)`, hauteur max avec défilement interne, marge de collision, ancrage correct au-dessus du dock.
- Audit et correction de tous les éléments de la page à 320 / 375 / 768 / 1280 px : dock de recherche (lignes structurée, catégories, contexte, action), liste de résultats, fiche établissement, panneau d'itinéraire, panneau de disponibilité, feuille de navigation.
- Règles appliquées : `min-w-0` + `truncate` sur les textes, `shrink-0` sur les icônes, grilles à deux colonnes qui passent en `flex` à partir de `sm`, aucun débordement horizontal, zones tactiles ≥ 40 px, respect des marges sûres iOS.
- Vérification finale par captures automatisées sur chaque largeur, pour confirmer zéro débordement et des panneaux entièrement lisibles.

## Détails techniques

- `src/routes/carte.tsx` : refonte du hook de localisation (`requestLocation` + `watchPosition` + persistance), séparation `preciseUserPos` / `usableOrigin`.
- `src/components/omni/SearchDock.tsx` : correctifs responsives du popover et des lignes du dock, libellés d'état de localisation ajustés.
- `src/lib/omni.functions.ts` : nouvelle fonction serveur `listFacilitiesInBounds` (bbox + zoom + limite), sans filtre `market_code`.
- Nouveau module serveur d'import OSM à la demande (Overpass) avec cache par tuile et insertion idempotente en `unclaimed`.
- `src/components/omni/MapCanvas.tsx` : émission des changements de cadre (debounce) et regroupement des pins à faible zoom.
- Aucune modification du modèle transactionnel ni des flux vendeur.