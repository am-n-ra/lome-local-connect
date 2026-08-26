# Omni v2 — Passe « UI vivante et responsive »

Objectif : rendre l'interface v2 fluide et vivante sur mobile, sans toucher à la logique métier (recherche, transactions, backend restent identiques). Uniquement présentation, animation et états d'interface.

## 1. Stabilité mobile (clavier, viewport, safe areas)

- Ajouter un hook `useViewportInsets` (visualViewport) qui expose la hauteur réelle et la hauteur du clavier dans des variables CSS `--omni-vvh` / `--omni-keyboard`.
- Remplacer `min-h-[100dvh]` de la scène carte par la hauteur visualViewport : la carte ne se décale plus quand le clavier s'ouvre.
- Le dock de recherche et les feuilles basses se posent au-dessus du clavier (`translateY` piloté par `--omni-keyboard`) au lieu de faire remonter toute la page.
- Empêcher le scroll du body quand une feuille/overlay est ouverte, et respecter `env(safe-area-inset-*)` partout (dock, fiche sélectionnée, boutons flottants).

## 2. Pins de facilités vivants

- Pins actuels : purement statiques. Ajouter :
  - apparition en cascade (fade + léger « pop ») quand de nouveaux résultats arrivent ;
  - halo pulsé discret sur le pin sélectionné et sur les offres avec remise ;
  - retour tactile au survol/appui (scale léger), pin sélectionné surélevé ;
  - marqueur de position utilisateur avec anneau de précision animé en respiration lente.
- Toutes les animations en CSS transform/opacity uniquement (pas de reflow), désactivées sous `prefers-reduced-motion`.

## 3. États de chargement réels

- Squelettes cohérents (paper + shimmer doux) pour : cartes de résultats, fiche facilité, catalogue produit, workspace vendeur, portefeuille, listes admin.
- États vides et états d'erreur avec action de reprise, au lieu d'un espace blanc.
- Boutons d'action : état « en cours » avec spinner intégré et libellé stable, désactivation anti double-clic.
- Overlay de révélation carte : barre de progression au lieu du simple texte.

## 4. Onboarding

- Passage en parcours par étapes animées (transition latérale douce, indicateur de progression, bouton principal collant en bas au-dessus du clavier).
- Validation par étape avec messages inline, focus automatique sur le premier champ, transitions entrée/sortie.

## 5. Micro-interactions générales

- Ouverture/fermeture des feuilles basses avec ressort court et geste de fermeture par glissement (poignée déjà présente).
- Transitions de route douces (fondu court) et conservation du scroll.
- États focus visibles au clavier partout, cibles tactiles ≥ 44 px.
- Toasts positionnés au-dessus du dock sur mobile.

## Détails techniques

- Nouveau `src/hooks/use-viewport-insets.ts` + variables CSS dans `src/styles.css`.
- Nouvelles classes utilitaires d'animation dans `src/styles.css` (`omni-pin-*`, `omni-skeleton`, `omni-sheet-*`), toutes neutralisées dans le bloc `prefers-reduced-motion` existant.
- Styles de marqueurs appliqués dans `src/components/omni/MapCanvas.tsx` via classes sur les éléments marqueurs (pas de changement de la logique de données).
- Écrans touchés : `CleanBuyerMapStage`, `CleanBuyerSearchDock`, feuilles `omni-clean/*`, `routes/onboarding.tsx`, `routes/vendeur.tsx`, `routes/admin.tsx`.
- Vérification : captures Playwright à 320 / 390 / 768 / 1280 px, plus un test clavier ouvert sur mobile.

## Hors périmètre

Aucune modification du schéma, des server functions, des règles de transaction ou du contenu textuel produit.
