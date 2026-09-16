# TEC-1 — Audit technique transversal (dettes restantes)

Date : 2026-09-16 · Branche : `omni-v2-rebuild` · HEAD : `87c5216`
Méthode : Nature Way Founder HQ → Nature Way, Gate 6 CLOSED.
Portée : passage du code pour lister les dettes **interface / technique / logique / métier** restantes, sans modifier de comportement métier.

## 0. Ce qui a été sondé (code-vérité, pas d'opinion)

`npm test` (487/487), `npx tsc --noEmit` (clean), `npm run check:boundary` (clean), `npm run build` (`index-Coa4DsCu.js`), plus inspection ciblée des imports, tests, TODOs, mocks.

## 1. Dette d'interface (UI)

| # | Constat | Évidence | Sévérité |
|---|---------|----------|----------|
| I-1 | Aucune fuite dark-mode trouvée dans le CSS (`styles.css`/`v3.css`/`ui-v13.css` : pas de `prefers-color-scheme`, pas de fond sombre racine). Le shell de preview sombre observé est le fond **par défaut du navigateur avant** application du CSS, pas une régression | grep CSS | Résolu |
| I-2 | `onboard.test.tsx` et plusieurs tests unitaires ne sont pas des preuves navigateur réelles | sandbox sans DB/Auth | Faible (assumé) |
| I-3 | `.status.ink` réutilisé pour « Produit recherché » — sémantique mêlée à l'encre neutre | `TrunkAppV13.tsx` COR-7b | Faible |

## 2. Dette technique

| # | Constat | Évidence | Sévérité |
|---|---------|----------|----------|
| T-1 | **Arbre de routes TanStack mort** : `src/routes/` (14 fichiers), `src/router.tsx`, `src/routeTree.gen.ts`, `src/start.ts` — **0 importeur** dans le code vivant (`main.tsx` monte directement `TrunkAppV13`) | `grep` live importers = 0 | Moyenne |
| T-2 | **6 tests placeholder** qui n'assertent que `toBeDefined()` sur des composants **inexistants** : `BuyerProPlansModal`, `CompanyFacilityOnboardingModal`, `DirectInStoreScanSheet`, `OmniWalletModal`, `OnboardingModal`, `SellerScannerModal` | aucune contrepartie `.tsx` | Moyenne |
| T-3 | Répertoires legacy partiellement morts : `src/core` (0 importeur), `src/integrations` (0 importeur), `src/routes` (0) | `grep` live importers | Faible |
| T-4 | Bundle unique 2,2 Mo (587 ko gzip) — pas de code-splitting | build | Faible |
| T-5 | `src/domain` encore importé (5) mais mélange v0/v2 | grep | Faible |

## 3. Dette logique

| # | Constat | Évidence | Sévérité |
|---|---------|----------|----------|
| L-1 | Le bug historique `r.on2 is not a function` n'est **pas** reproductible au HEAD courant ; aucun pattern d'appel `.on`/`on2` fautif trouvé dans le code vivant | grep | Résolu |
| L-2 | Les simulations de panne réseau (`simMode`) sont des helpers de démo explicites, pas du code mort | `TrunkAppV13.tsx` | Assumé |
| L-3 | `arrivalTargetFor` couvre les cas dégénérés (null/NaN/(0,0)) — couvert par tests | COR-1a | OK |

## 4. Dette métier

| # | Constat | Évidence | Sévérité |
|---|---------|----------|----------|
| M-1 | `seller_unlocks` legacy Supabase non branché au trunk v2 (objet propre v2 utilisé) | NW-13e | Faible (assumé) |
| M-2 | Job asynchrone de rappel/renouvellement Pro = hors scope P1, watch Gate 7 | NW-13g | Watch |
| M-3 | Fixture de démonstration vendeur (`demo@seller.omni`) toujours référencée par le repo | `trunk-repository.ts` | Assumé (fixture proof) |

## 5. Verdict TEC-1

Aucune dette **bloquante** pour la preuve navigateur (PRE-1). Les dettes T-1/T-2 sont les plus visibles : **arbre de routes mort** (confusion de lecture, poids de repo) et **tests placeholder** (fausse couverture). Recommandation : les traiter en **V-9 nettoyage** *après* PRE-1, avec un commit dédié, sinon il ne reste que des résidus assumés documentés.

**Ordre proposé :** PRE-1 (preuve navigateur cycle 4 largeurs) → V-9 (nettoyage routes mortes + tests placeholder) → Gate 7 (terrain).