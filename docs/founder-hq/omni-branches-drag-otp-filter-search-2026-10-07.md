# BRANCHES-1..4 — quatre bugs fondateur (2026-10-07)

> Porte courante : **BRANCHES** (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). Heartwood + Trunk CLOSE
> `founder-confirmed` 2026-10-07. Terrain EN DERNIER. Commit **`3a3fdb7`**, prod
> `index-BrfwYZcH.js` === build local (**T-07d ✅**), entrée GitHub `deployments` `3a3fdb7`.

## Ce qui a été mesuré d'abord

Le fondateur a rapporté quatre défauts d'usage. Avant d'écrire, chacun a été **mesuré dans le
code et/ou au navigateur** — et les quatre partagent **une même racine** : *une intention
déclarée quelque part mais jamais exécutée*.

| # | Déclaration | Réalité mesurée |
|---|---|---|
| 1 | `.sheet` porte `transform:translateY(var(--ty,0px))` | **rien n'écrit `--ty`** → la poignée `.handle` est purement décorative |
| 2 | l'écran de confirmation dit « cliquez le lien » | Neon Auth est configuré `email_verification_method=otp` → **le lien n'arrive jamais** |
| 3 | la maquette acceptée montre 4 catégories | `.filterrail{flex-wrap:wrap;max-width:220px}` → **« Ambulants » tombe seul** sous les 3 autres |
| 4 | D-05 « search … require auth; query preserved through auth » | `handleSubmitSearch` **ne demande jamais de compte** |

## Les quatre corrections

### BRANCH-1 — retirer une feuille mobile d'un geste
- **Décision pure** `src/trunk/sheet-drag.ts` : `isSheetDrag` (seuil 6 px), `sheetDragOffset`
  (borné ≥ 0), `shouldDismissSheet` (distance ≥ **96 px** *ou* vélocité ≥ **0,6 px/ms**).
- **Câblage** `src/trunk/use-sheet-drag.ts` : délégation pointer au niveau du **stage** → **une
  seule attache couvre les 37 feuilles**, sans toucher les composants. Le déplacement est écrit
  dans `--ty` (déjà lu par `.sheet`) → suit le doigt **sans re-render**. Desktop = pas de geste.
- **Sortie unique** `ui-helpers.sheetDismissTarget` : le geste produit **la même destination que
  le bouton de fermeture** (`null` = pas de cible). Deux sorties ne doivent pas mener à deux endroits.

### BRANCH-2 — confirmation e-mail par CODE (OTP)
- **Envoi automatique** à la création quand aucune session n'est encore ouverte.
- **Saisie** du code (`#v13-auth-code`) + vérification `authClient.emailOtp.verifyEmail({ email, otp })`.
- **Renvoi différé** : « Renvoyer le code » n'est actif qu'après un **compte à rebours de 30 s**.
- Un code invalide **le dit** et laisse réessayer (jamais un cul-de-sac).

### BRANCH-3 — catégories carte sur UNE ligne
- `.filterrail{flex-wrap:nowrap;max-width:none}` + `.fchip{white-space:nowrap;flex:none}`.
- Les chips rétrécissent leur rembourrage plutôt que de passer à la ligne.

### BRANCH-4 — la recherche exige un compte (D-05)
- Sans compte : la requête (et son **niveau** offre/entité) est **retenue** dans
  `pendingAction { kind:'search', query, level }`, l'authentification s'ouvre.
- `resumePendingAction` **relance la recherche** après connexion — la requête **survit** à l'auth.
- **Parcourir la carte et taper un pin reste libre** (aucune connexion demandée).

## Preuve

- **Navigateur prod** (`scripts/prove-branches-drag-otp-filter-search.mjs`, viewport 390) :
  **3/3 PASS**, **0 pageerror** —
  - BRANCH-3 : 4 chips, **1 seule valeur de `y`** (130) → une ligne ;
  - BRANCH-1 : un drag vers le bas sur la poignée **ferme** la feuille ;
  - BRANCH-4 : recherche sans compte → feuille **`auth`** ouverte, **0** `results`.
- **1045/1045 tests** ; `tsc` 0 ; **9/9 gardes** (boundary, state, maquette, species-t12,
  coherence, docs, live-surface, dead-css, dock-search).
- **Falsifications** (une preuve qui ne peut pas échouer ne prouve rien) :
  | Règle neutralisée | Résultat attendu | Observé |
  |---|---|---|
  | geste débranché (BRANCH-1) | tests rouges | **2 échecs** |
  | `emailOtp.verifyEmail` neutralisé (BRANCH-2) | tests rouges | **2 échecs** |
  | `flex-wrap:wrap` restauré (BRANCH-3) | garde rouge | **2 échecs** |
  | gate de recherche retiré (BRANCH-4) | test rouge | **1 échec** |
- **T-07d** : prod `index-BrfwYZcH.js` === build local, chaînes vérifiées dans le **bundle servi**
  (`Confirmer mon adresse`, `Renvoyer le code dans`, `Ambulants`, `Chercher une entité`),
  **+ entrée GitHub `deployments` `3a3fdb7`**.

## Piège de preuve (à ne pas réapprendre)

Le premier harnais de drag échouait **parce qu'il glissait au-delà du bas du viewport**
(`y0 + 280 > 780`) : les événements pointer se perdent hors viewport. Ce n'était **pas** le
geste qui cassait. Un instrument qui rate la cible n'accuse pas le produit — garder le geste
**dans** la fenêtre (`y0 + 160`).

## Résidus honnêtes

- Le geste de fermeture est **mobile uniquement** (par conception — desktop = tiroirs/rails).
- La preuve BRANCH-2 est **unitaire (jsdom)** : l'envoi réel d'un OTP Neon Auth n'est pas exercé
  dans le sandbox (aucune boîte e-mail). Le contrat (`verifyEmail({email, otp})`) est prouvé ;
  le clic dans un vrai e-mail reste une preuve fondateur (session réelle).
