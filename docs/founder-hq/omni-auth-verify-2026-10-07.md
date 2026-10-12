# AUTH-VERIFY (option 2) — vérification d'e-mail à l'inscription + menu de compte

> **Porte :** `HEARTWOOD_CLOSED_BRANCHES_OPEN` (Branches OPEN, 2026-10-07).
> **Décision fondateur (2026-10-07) :** « **2** » = activer la vérification d'e-mail à
> l'inscription (mur OTP gratuit, S3-0 option A) — **plus** corriger le doublon de menu
> « Mon compte / Compte ».

## 1. Deux mesures (pas des suppositions)

### 1a. L'OTP existe et la config dit de ne PAS vérifier

- `src/trunk/AuthSheetV13.tsx` **fait déjà** l'OTP : `emailOtp.sendVerificationOtp` /
  `emailOtp.verifyEmail`, écran de saisie du code, renvoi différé (30 s), erreurs mappées.
- La config Neon Auth de la branche que **sert la prod** (`production` `br-bitter-math-amrlbym6`,
  endpoint `ep-purple-fog-amwsyc3j` — vérifié dans le bundle servi) : `verify_email_on_sign_up:
  false`, `verify_email_on_sign_in: false`, `require_email_verification: false`.
- **Conséquence :** Neon renvoie `{ token, user }` à la création → la session s'ouvre → l'écran
  OTP **n'apparaît jamais** à l'inscription. Ce n'est pas un mécanisme manquant : c'est un
  **réglage volontairement permissif**.

### 1b. Le doublon de menu est réel

`TrunkAppV13.tsx` (bloc `SHEETS.menu`) : l'acheteur avait **deux** entrées vers `account` —
sa ligne « **Mon compte** » (correcte, nom du maquette `menuItems`) **et** un bouton générique
« **Compte** » rendu pour **tous** les rôles. La maquette (`omni-species-v2-interactive.html`,
L754-761) ne nomme l'entrée de compte qu'**une fois** par rôle (vendeur → « Compte vendeur »).

## 2. Ce qui est livré (code)

- **`authResultHasSession(result)`** (`auth-session.ts`) : distingue « session ouverte » (présence
  d'un `token`/`session`) de « simple utilisateur renvoyé » (le cas vérification-requise).
- **`AuthSheetV13` branche création** : adopte l'utilisateur **seulement si une session est
  réellement ouverte**. Sinon → **état de confirmation** (code OTP). Avec la vérification
  **optionnelle** (état actuel), la session est déjà là → le chemin reste **fluide**.
- **Menu** : le bouton générique de compte n'est plus rendu pour l'acheteur (il a déjà
  « Mon compte ») ; vendeur → « Compte vendeur », admin/opérateur → « Mon compte » — **une** entrée.
- **Garde** `check:dock-search` `menu-02-no-dup` (falsifiée : retirer la garde → FAIL).

## 3. Ce qui reste à faire côté Neon (décision « 2 »)

Le code **rend le mur possible** ; il ne l'**active** pas seul. L'activation est un réglage de
console (aucun `NEON_API_KEY` dans l'environnement ; l'MCP lit la config mais ne l'écrit pas).

**Console :** Projet → branch `omni-v2-rebuild` (l'app lit cette branche) → **Settings → Better
Auth** → **Verify at sign-up**.

**API :**
```
curl -X PATCH 'https://console.neon.tech/api/v2/projects/wild-moon-30984513/branches/br-dawn-hill-am5amy22/auth/email_and_password' \
  -H 'Authorization: Bearer $NEON_API_KEY' -H 'Content-Type: application/json' \
  -d '{"enabled": true, "require_email_verification": true}'
```
> **Piège branch :** l'app **lit** `br-dawn-hill-am5amy22` (canonique), mais le client auth par
> défaut du bundle pointe `ep-purple-fog-amwsyc3j` = branche **production**. Régler la vérification
> sur la **mauvaise** branche ne change **rien** au comportement réel. Vérifier la branche que
> l'appel `/token` touche réellement.

## 4. Trade-off assumé

- **Gain :** e-mails vérifiés, comptes propres, alignement Neon.
- **Coût :** un **mur avant l'entrée** — friction, contredit la lettre de **S-31** (« on publie
  tôt, pas de mur avant d'utiliser Omni »). C'est un **choix fondateur explicite**, pas un défaut.

## 5. Preuve

- **1071/1071** tests (+4 : `authResultHasSession` 3 cas, gate OTP 1 cas) ; `tsc` 0 ; 8 gardes verts.
- Tests modifiés : la « création qui adopte » **exige désormais une session** (`{ token, user }`) ;
  nouveau test **« création SANS session → CODE obligatoire »** (le cas réel de la vérification).
- **À faire après activation :** prouver en prod qu'une création neuve ne renvoie plus directement
  dans l'app (compte neuf requis — preuve fondateur).
