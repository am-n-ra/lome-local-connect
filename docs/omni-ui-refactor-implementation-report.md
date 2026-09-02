# Omni UI Refactor — Rapport d’implémentation

**Date :** 18 août 2026  
**Branche :** `main`  
**Dernier commit :** `3a05266`

## Résumé

La baseline runtime est saine et la refonte a été livrée en conservant MapLibre GL v5, la projection globe, les pins, les clusters, la découverte OSM et les contrats transactionnels V1. Les surfaces buyer et seller utilisent désormais une grammaire commune : éléments flottants sur la carte, feuilles mobile/desktop bornées et pages longues à grille responsive.

Le correctif de `@tanstack/start-storage-context` est maintenant déclaré dans `package.json` via `patchedDependencies` et reste cohérent avec le patch présent dans `pnpm-workspace.yaml` et le lockfile pnpm. Le patch fournit une implémentation navigateur sans `node:async_hooks`, tout en conservant le contexte serveur dans le package original.

## Changements livrés

| Domaine | Résultat |
|---|---|
| Système UI | `docs/omni-ui-system.md` est la source de vérité ; `OmniSheet`, `OmniFlowSheet`, `OmniActionBlock`, `OmniResumeBar`, `OmniActionFooter`, états skeleton/error et tokens de surface sont disponibles. |
| Feuilles | Les usages buyer principaux de Cart, Chat, Demandes, Menu, Orders et Wishlist ne sont plus latéraux ; ils montent depuis le bas sur mobile et sont centrés et bornés sur desktop. |
| Carte fiche | `OmniCenteredPanel` a été supprimé ; la fiche utilise `OmniSheetSurface`. Le globe et les pins n’ont pas été remplacés. |
| Disponibilité | `DemandRequestPanel` utilise `OmniFlowSheet`, progression 1/3–3/3 et pied d’action safe-area. Le bouton d’intention conserve la génération QR immédiate côté serveur. |
| Transaction | `src/routes/transaction.$id.tsx` reconstruit la room depuis un `transactionId`, conserve la carte comme contexte et redirige déterministiquement un vendeur vers `/vendeur?transactionId=...`. |
| Deep-links | Les notifications buyer QR vérifié, paiement reçu et fulfillment ouvrent `/transaction/$id`. Les notifications seller restent ciblées sur le workspace seller. L’entrée QR converge sur la route transactionnelle. |
| Room | `TransactionThreadCard` rend le QR comme identité de la room et affiche le bloc « maintenant » via `OmniActionBlock`, avec libellés réception/rating. |
| Reprise | La carte utilise `OmniResumeBar`, la console seller expose une barre de reprise et les deux shells conservent le dernier transactionId en session. |
| Rôle | La feuille de menu affiche le rôle courant et une bascule Acheteur/Vendeur explicite. Le smoke test production a validé les deux sens. |
| Seller | La console map-first a une largeur desktop étendue, une grille deux colonnes avec raccourcis persistants, wallet/compteurs, scanner et actions seller. |
| Onboarding | Loader borné par skeleton, `overflow-x-hidden`, largeur mobile sûre, grille deux colonnes repoussée à `xl`, CTA tactiles et safe-area. |
| CSS | `overflow-x` global borné, focus rings, cibles tactiles protégées, `prefers-reduced-motion` et largeur de feuille desktop cohérente. |

## Validation code

Les commandes suivantes ont réussi après le dernier lot :

```text
pnpm test                       48 tests / 9 fichiers réussis
pnpm exec tsc --noEmit          réussi
pnpm build                      réussi
pnpm check:client-boundary      réussi — 44 artefacts JS, 166 fichiers source
pnpm diff --check               réussi
```

Aucun `.env`, secret ou fichier de credentials n’a été ajouté au commit. Les artefacts `.vercel/` et les scripts d’audit temporaires restent non suivis et ne sont pas publiés.

## Smoke production

Les routes suivantes ont été ouvertes après le déploiement du commit `3a05266` : `/`, `/onboarding`, `/vendeur`, `/transaction/00000000-0000-0000-0000-000000000000` et `/carte`.

Les vérifications positives sont : canvas MapLibre présent, globe visible, chrome de carte rendu, dock de recherche présent, barre « transactions en cours » visible lorsqu’une session possède des transactions, onboarding interactif, seller map-first rendu sans loader infini, route transactionnelle sans crash SSR, et bascule production Acheteur → Vendeur → Acheteur réussie.

Le test production a également confirmé que le menu expose une seule bascule de rôle explicite, que la notification conserve son icône séparée et que le scanner, le catalogue, les demandes, le wallet et les coupons sont accessibles depuis le workspace seller.

## Limites connues

La caméra QR reste à certifier sur un téléphone réel sous HTTPS avec permission accordée. L’environnement headless confirme les contrôles et les états de permission, mais ne suffit pas à prouver la qualité du flux vidéo, le choix caméra arrière ou l’arrêt matériel du stream.

La certification visuelle automatisée exacte à 320, 390, 768, 1024 et 1280 px nécessite encore une matrice de captures dédiée. Le smoke navigateur utilisé ici confirme le rendu de production et les surfaces clés, mais ne remplace pas un passage manuel sur appareil mobile réel.

Les anciens composants `OrdersPanel` et `ChatPanel` restent des points d’entrée compatibles ; la route `/transaction/$id` est la destination canonique. Une future passe pourra réduire davantage leurs aperçus pour éviter toute duplication visuelle, sans changer les transitions serveur.

## Commits

| Commit | Contenu |
|---|---|
| `a9aa5b4` | Système UI maître, surfaces responsive et première route transactionnelle. |
| `c9a6ca3` | Enregistrement de la route transactionnelle dans `routeTree.gen.ts`. |
| `07ff58d` | Barre de reprise, rôle, console seller et deep-links buyer/seller. |
| `3a05266` | `OmniFlowSheet`, onboarding borné et états d’entrée finalisés. |
