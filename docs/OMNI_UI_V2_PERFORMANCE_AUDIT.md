# Omni — Audit performance et UI/UX seller v2

**Date :** 17 août 2026  
**Périmètre :** seller map-first, carte MapLibre, navigation, surfaces, mobile, données et performance de rendu.

## Diagnostic

Le route seller faisait 1 217 lignes et regroupait l’authentification, le chargement du dashboard, la carte, les formulaires, la recharge FedaPay et six panneaux opérationnels. Le chargement initial remontait en une seule réponse les facilities, produits, campagnes, coupons, demandes, balances et unlocker. Cette organisation rendait le premier écran plus lourd que buyer et favorisait les re-renders globaux lors de la saisie ou d’une mutation.

La comparaison production buyer/seller confirmait un écart de hiérarchie : buyer plaçait la carte au centre avec des overlays courts, alors que seller exposait des statistiques et des opérations sous forme de grille dès l’ouverture de la surface. La carte restait techniquement visible mais perdait son rôle de contexte dominant.

## Décisions UI v2

| Niveau  | Usage                                                   | Traitement                                                       |
| ------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| `float` | Dock, chip facility, contrôles et recherche             | Verre discipliné, blur réservé aux éléments flottants            |
| `sheet` | Facility, availability, scanner, balance et formulaires | Surface quasi opaque, scroll interne, footer d’action accessible |
| `page`  | Console dense, catalogue, transactions et paramètres    | Fond plein, lisibilité maximale, densité contrôlée               |

Le seller adopte un modèle hybride : carte pour les objets spatiaux et console/sheets pour les opérations denses. Le premier écran reste carte-first ; les détails sont repliés par défaut. Le dock d’actions est unique, contrôlé par l’état actif et adapté au viewport : barre horizontale sur mobile, dock vertical sur desktop.

## Premier lot livré

Le système de tokens `--surface-float`, `--surface-sheet`, `--surface-page`, `--shadow-float` et `--shadow-sheet-raised` est disponible dans `src/styles.css`. Les primitives `OmniSheet`, `OmniSectionHeader`, `OmniEmptyState`, `OmniStatCard`, `OmniStatusBadge`, `OmniStepper`, `OmniLoadingState` et `OmniDisclosure` sont disponibles sous `src/components/omni/ui/OmniPrimitives.tsx`. Le nouveau `OmniActionDock` supprime la double navigation mobile/desktop du seller.

`MapCanvas` reçoit maintenant une liste de facilities mémorisée et un callback de position stabilisé par `useCallback`. Une frappe dans un formulaire ou un changement de surface ne recrée plus systématiquement les objets de carte. La surface principale dispose d’un scroll interne plafonné afin que les balances et opérations ne dépassent pas la fenêtre.

## Vérifications

TypeScript, les 11 tests Vitest et `npm run build` passent. Le lot a été poussé sur `main` au commit `577f813`, après le commit UI v2 `53e09c0`. La production a été vérifiée sur le domaine custom : carte MapLibre dominante, dock unique visible, détails repliés par défaut, balances et recharge accessibles après ouverture.

## Gaps restant à traiter

Le seller n’est pas encore totalement découpé en sections indépendantes : le fichier route reste monolithique et `getVendorDashboard` agrège encore les données. Le prochain lot doit séparer le shell critique des données catalogue, demandes, coupons, ads, transactions et balance, puis charger ces surfaces à la demande.

Le transactionnel doit adopter une timeline chat unique et l’availability doit afficher son parcours en trois étapes dans une sheet partagée. Le catalogue doit utiliser la même card facility/produit que buyer et proposer un aperçu live. La BalanceSheet doit être partagée buyer/seller avec permissions explicites pour les cinq buckets.

La certification physique du FPS et de la permission caméra nécessite encore un appareil réel ou un émulateur autorisé. La certification de production doit également vérifier que l’alias Vercel sert le même commit que celui validé localement.
