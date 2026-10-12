# BRANCHES-AUTH-LOOP — boucle d'authentification + zoom clavier mobile (2026-10-07)

> Porte courante : **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** (Heartwood + Trunk CLOSE
> `founder-confirmed` 2026-10-07). Branche de **durcissement** (pas de nouvelle fondation).
> Rattachement : **S-16** (auth, méthode gratuite), **D-05** (frontière auth).
> Handoff amont : `HO-OMNI-39` (commit `3a3fdb7`).

## 1. Le défaut rapporté

Le fondateur signale une **boucle d'authentification** : après création de compte, l'écran
demande un **code OTP** ; l'utilisateur saisit le code, arrive sur **« Se connecter »**,
clique, et **retombe sur l'écran OTP** — indéfiniment. C'est un **résidu** du lot
`BRANCHES-1..4` : le lot a livré la confirmation par code (BRANCH-2), mais le chemin restait
fragile dès que le serveur ne pouvait pas confirmer la session.

## 2. Cause racine (mesurée, pas supposée)

- La configuration Neon Auth du pilote est **`require_email_verification: false`** et
  **`verify_email_on_sign_up: false`** → **l'écran OTP ne devrait jamais apparaître** à la
  création. S'il apparaît, c'est que l'app **n'a pas reconnu** une session pourtant ouverte.
- `sign-up`/`sign-in` renvoient **`{ token, user }`** — l'utilisateur est **déjà là**. Or le
  code **ignorait** ce `user` et appelait **`getSession()`** ; quand `/get-session` renvoie
  `null` (cookie de session non confirmé : cross-site, tiers, ou panne d'auth passagère),
  `sessionUserFromAuthResult` → `null` → l'app croyait « pas de session » → **état de
  confirmation** → boucle.
- **Reproduction décisive** : avec `/get-session` forcé à `null`, le parcours réel est
  `signup → OTP → (code) → connexion → OTP`. `getSession` compté **2 fois**.

## 3. Correctif

Fichiers : `src/trunk/AuthSheetV13.tsx`, `src/trunk/auth-session.ts`.

1. **Adopter l'utilisateur porté par le succès** — `sessionUserFromAuthResult` lit désormais
   `data.user` en priorité (le corps `{ token, user }` du succès de création/connexion). On
   **ne re-fetch plus** `get-session` quand le succès porte déjà l'utilisateur. Un
   `get-session` vide ne peut donc plus transformer un succès en boucle.
2. **Plus d'impasse** : `verifyCode` adopte l'utilisateur renvoyé par `verifyEmail` ; à
   défaut, il **ouvre la session par le mot de passe encore présent** (`signIn.email`) ; en
   dernier recours seulement, un message clair — jamais un formulaire qui reboucle.
3. **Erreurs mappées finement** (`authErrorOf`) : **compte déjà existant** → bascule vers la
   connexion et le **dit** (« Cet e-mail a déjà un compte ») ; **non confirmé** → OTP ;
   **mauvais mot de passe** → identifiants ; **réseau** → « réessayez », jamais « identifiants ».
4. **Zoom clavier mobile** (même famille : le champ casse l'usage) : sur un appareil tactile,
   tout champ de saisie **< 16px** déclenche le zoom automatique du navigateur. Garde
   `@media(pointer:coarse){ input,.field,.field.lg,.input,textarea,select{font-size:16px!important} }`
   dans `ui-v13.css` ; la classe `.input` (utilisée par `SellerV13`, ~12 champs) **n'avait
   aucune règle** → ajoutée.

## 4. Preuve

| Preuve | Résultat |
|---|---|
| `proof:branches-auth-loop` **local** (390, `/get-session` forcé `null`) | **4/4 PASS** — création ET connexion atterrissent au **menu**, jamais l'OTP ; `getSession=1` (pas de re-fetch) ; **0 pageerror** |
| `proof:branches-auth-loop` **prod** (même harnais, code actuel) | **1/4 — FALSIFIÉ** — OTP affiché, `getSession=2`. La preuve **peut échouer**, et elle échoue sur l'ancien code |
| `proof:branches-input-zoom` | **4/4 PASS** — tactile : min **16px** ; desktop : pointeur fin, rendu dense préservé |
| Tests unitaires | **1056/1056** (1045 + 11) ; 3 tests de boucle + 1 garde CSS, **falsifiés** (3 et 2 échecs) |
| Gardes | `tsc` 0 · boundary · state · docs · coherence · dead-css · live-surface — verts |

**Falsification (règle : une preuve qui ne peut pas échouer ne prouve rien)** :
- retirer l'adoption de l'utilisateur direct → **3 tests de boucle échouent** ;
- retirer le bloc `@media(pointer:coarse)` → **2 tests CSS échouent** ; retirer la règle
  `.input` → **1 échec** ;
- rejouer le harnais contre la **prod** (ancien code) → **3/4 échecs** (OTP, `getSession=2`).

## 5. Portée honnête

- Ce lot est **durcissement**, conforme à la porte Branches (une fonctionnalité à la fois).
  **Aucune nouvelle fondation.**
- Le correctif rend l'app **robuste à un `/get-session` vide** — la cause exacte du symptôme
  fondateur. Il **ne prouve pas** le comportement d'un navigateur réel avec cookies tiers
  bloqués (le harnais **force** la condition). L'essai navigateur réel reste un spot-check.
- `BRANCHES-LEGAL` reste **en attente de décision fondateur** (validation des textes par un
  conseil qualifié ; suppression de compte automatisée avec rétention — FK `ON DELETE RESTRICT`).
