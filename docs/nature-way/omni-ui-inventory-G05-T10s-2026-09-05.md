# Omni — Inventaire UI Gate 5 (Branches/UI) vs maquette V1.3 + feedback fondateur

> **Date :** 2026-09-05 — **Structure path :** `M-01 > Gate 5 (Branches/UI) > T-10s`
> **Autorité :** maquette unifiée acceptée + maquette V1.3 (dessin → spec `omni-v1.3-ui-motion-search-onboarding-spec`) + retours fondateur (HO-OMNI-05).
> **Surface inspectée :** `src/trunk/TrunkApp.tsx` (app réelle(, `src/trunk/TrunkMap.tsx`, `src/components/omni/MapCanvas.tsx` (séquence carte(, `src/trunk/v3.tsx`, `src/components/omni-clean/*` (sheets(, `src/components/ui/sheet.tsx` (variants(, `src/styles.css`.
> **Note :** `main.tsx` rend `TrunkApp` — c'est elle la surface de production ; les routes `carte.tsx`/`vendeur.tsx` sont des surfaces legacy/historiques non utilisées en prod.

## Table de gaps

| ID | Retour fondateur / spec | État actuel (`TrunkApp`) | Gap | Priorité |
|---|---|---|---|---|
| G-01 | **Rôle switch : « normalement le switch permet par défaut de passer entre buyer et seller… »** | `availableRoles` = `['buyer']` + `seller` seulement si `accountCapabilities?.roles` contient « seller » ; `admin`/`operator` selon rôles. | **Seller invisible par défaut** (compte non connecté ou buyer-only → seul « Buyer » apparaît). La maquette V1.3 montre toujours Buyer+Seller ; Admin/Operator conditionnés par les permissions (D-06 one identity + capability( | **P1** |
| G-02 | **Fiche « Compte » du menu Buyer n'a aucun sens / hors maquette** | Menu « Compte » (icône User( → `openAuth('sign-in')` (bouton de connexion, pas de fiche profil( ; « Se déconnecter » séparé. | L'entrée « Compte » est un raccourci d'auth, pas une fiche (pas d'infos profil, rôles, facilité affiliée, wallet, plans comme maquette ACCOUNT(. | **P1** |
| G-03 | **Sheets PC décalées sur le côté, non centrées comme mobile** | `sheetVariants` bottom sm+ = `sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2` (modal centré vertical+horizontal( ; `.omni-sheet` desktop = `left:50%; right:auto; translate:-50% 0; bottom:0` (bottom sheet centrée( **sans `top:auto`** → `top:50%` hérité + `bottom:0` = étirement/décalage. | Conflit Radix-sheet variant vs `.omni-sheet` : désaligné sur desktop (≥640px(. Corriger : bottom-anchored + centré horizontalement partout (mobile===desktop(, retirer top/translate-y en sm+, ajouter `top:auto`. | **P1** |
| G-04 | **La recherche doit montrer l'animation décrite (dézoom→continent→pays→région→ville→position→framing→grille APRÈS** | `MapCanvas` implémente la séquence REVEAL_STEPS + labels + reveal gating (T-10p/q/r(. `TrunkMap` passe `revealKey`. `TrunkApp` n'ouvre la grille que quand `revealActive` est faux (`LiquidResultCarousel` sous `nearbyOpen || committedQuery` — pas de condition `!revealActive` dans le code inspecté ?). | À vérifier au runtime : la grille/carousel doit apparaître uniquement APRÈS la fin du vol; vérifier que `revealActive` masque le carousel pendant l'animation; le label de vol (bandeau( doit suivre les paliers zoom. | **P1 — retest runtime** |
| G-05 | **Dock/nav animations vivantes** (dock remonte avec clavier et les éléments se réorganisent, l'app ne bouge pas ; zone flou au scroll ; transitions/morphisme dock↔sheets( | `omni-keyboard-aware` existe (bottom remonté( ; `omni-sheet-enter`, stagger, shimmer existent ; dock `omni-dock` contexte selon rôle/sheet (l.2358-2391( | Proposer **un système de mouvement** (design doc( aligné V1.3 : dock contextual morphing, fade/blur au scroll, respect `prefers-reduced-motion` — puis implémenter le core. | **P1-P2** |
| G-06 | **Onboarding : paywall tôt, auth au moment du besoin (V1.3 §3-4** | `OnboardingModal` + `redirectToAuth` ; la recherche non connectée → auth d'abord (voir `handleCategoryChange`/`handleSearchSubmit`( | Aligner conversion : identité minimale → soft paywall → reprise auto de la recherche (ordre exact V1.3 §4(. | **P2** |
| G-07 | **Micro-copies exactes M-01…M-26 (spec §6** | Quelques états/erreurs présents (voir `statusLabel` etc.( | Intégrer les libellés exacts manquants (M-02 empty grid, M-06, M-09 cancel confirm, M-10 expire…) — non-bloquant pour la clôture de cette passe, rangé en `deferred`. | **P3** |

## Décisions d'implémentation (slice choisie)

- Slice active : **G-01, G-02, G-03, G-04 (runtime**, G-05 (core motions( — le reste en `deferred`/`watch`.
- Ordre : 1) remettre les sheets **bottom-anchored centrées** (G-03( — bug visible ; 2) **role switch Buyer+Seller par défaut** (G-01( ; 3) **fiche Compte → profil réel** aligné maquette (G-02( ; 4) **vérifier/enforcer reveal gating** grille après vol (G-04( ; 5) **description + core des animations dock/clavier/blur** (G-05(.

## Résultat de la passe (2026-09-05)

| ID | Correction | Fichiers | Preuve |
|---|---|---|---|
| G-01 | Buyer+Seller toujours proposés ; Admin/Operator gated par rôles (D-06( | `src/trunk/TrunkApp.tsx` | tsc ✅ ; navigateur : switch affiche Buyer+Seller par défaut (work-host( |
| G-02 | Menu « Compte » → fiche profil `AccountProfileSheet` (connecté( ou auth (non connecté( ; retrait du raccourci auth dans le menu | `src/trunk/AccountProfileSheet.tsx` (nouveau(, `src/trunk/TrunkApp.tsx` | tsc ✅ ; navigateur : item « Créer un compte / se connecter » → auth (non connecté( |
| G-03 | Sheets bottom-anchored + centrées desktop (fix `sheetVariants` bottom sm+ + `top:auto` sur `.omni-sheet`( | `src/components/ui/sheet.tsx`, `src/styles.css` | tsc ✅ ; build ✅ |
| G-04 | Déjà conforme (T-10q4 : grille APRÈS reveal, fallback empty/error( — vérifié, aucune modif nécessaire | — | code inspecté : `handleRevealStateChange` ouvre la grille à la fin du vol ; `setRevealCompleted(false)/setNearbyOpen(false)` au commit |
| G-05 | Dock morphing (`key` fingerprint + animation `navpill-morph`( + fondu au scroll des sheets (`scroll-fade` mask( | `src/trunk/v3.css`, `src/trunk/TrunkApp.tsx`, `src/styles.css` | tsc ✅ ; build ✅ |
| G-06 | Déjà conforme (auth au moment du besoin, pas au départ ; plans accessibles tôt en soft paywall( — vérifié, aucune modif nécessaire | — | code inspecté : recherche libre sans compte ; `openAuth` seulement à la dispo/intention |

**Verdict :** `npm run lint` (tsc( ✅, `npm test` **296/296** ✅, `npm run build` ✅ (bundle `index-D5_n9PVf.js`(. Preuve navigateur sandbox : role switch Buyer+Seller ✅, menu Compte → auth (non connecté( ✅. Preuve navigateur 4 largeurs + prod dépend d'un push fondateur (guardrail T-07d(.

## Verdict — Pass de clôture Gate 5 (2026-09-05, T-10v)

- **Bundle prod vérifié** : prod sert `index-CupUr-t1.js` === build local (`npm run build` ✅; guardrail T-07d ✅).
- **Chaîne verte complète** : `npm test` **296/296 (47 fichiers)** ✅; `npm run lint` (tsc) ✅; `check:boundary` ✅.
- **Points corrigés re-vérifiés dans le bundle prod + source** :
  - **G-01** – rôle switch : `availableRoles=['buyer','seller']` par défaut; Admin/Operator gated par `accountCapabilities.roles` (D-06 ✅. Prenuve navigateur desktop : pills **Buyer+Seller** visibles ✅.
  - **G-02** – fiche Compte → `AccountProfileSheet` ; non connecté → surface auth (« Créer un compte / Se connecter », pills Acheteur / Vendeur Lomé / Opérateur ) ✅ (vérifié work-host desktop).
  - **G-03** – sheets desktop : `.omni-sheet` = `width:min(100%,560px); margin-inline:auto; inset:auto 0 0; transform:none` (bottom-anchored + centré horizontal; `top:auto` effectif — fix T-10u ✅.
  - **G-04** – reveal gating : `MapCanvas` masque les facilities pendant le vol (`setFacilitiesVisibility(false)` ; waypoints REVEAL_STEPS + labels + userPosition/marché approximatif), `finish()` → `onRevealStateChange(false)` → `setNearbyOpen(true)` ; fallback `mapState==='empty'|'error'` ouvre la grille vide/erreur — jamais pendue ✅.
  - **G-05** – motion : `navpill-morph` + `.omni-bottom-gradient` (blur 5px, z-6, variante 72px discret) + `omni-keyboard-aware` ✅ (règles présentes dans le CSS prod).
- **État d'erreur carte** : « Carte indisponible … Réessayer » = l'état conçu `mapState==='error'` (retry explicite) — observé sur le work-host à cause du proxy/geolocation sandbox (tuiles/style non chargés), non une régression du build. Le `Réessayer` déclenche `retryPublicFacilities`.
- **Résiduel (clôture conditionnelle)** : **spot-check humain 4 largeurs (360/768/1280/1920( des points G-01…G-05 sur le prod `omni.sparkafrika.online`** reste un item `manual` (owner : fondateur; le harnais navigateur de ce sandbox ne permet pas le resize multi-largeurs fiable). Le bundle lui-même est responsive et les règles responsive (sm:..., `.omni-sheet` etc.) sont vérifiées au niveau du CSS prod.

## Preuve requise (clôture Gate 5(

- `npm test` (tous verts(, `npm run build` (tsc + vite(, comparaison bundle prod `===` local (guardrail T-07d(, passe navigateur 4 largeurs (360/768/1280/1920( des 4 points corrigés.
- Note : les tests + build tournent localement (pas de DB/Auth en sandbox( ; la preuve navigateur 4 largeurs se fait sur le build local via les work-hosts. La preuve prod navigateur est dépendante d'un push fondateur.