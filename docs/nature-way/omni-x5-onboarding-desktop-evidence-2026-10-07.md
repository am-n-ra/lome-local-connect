# X5 — Onboarding honnête (décision fondateur « 1 ») + desktop (décision « 3 »)

Date : 2026-10-07 · Branche : `omni-v2-rebuild` · Gate : `ROOT_CLOSED_TRUNK_OPEN`
Périmètre approuvé : **1** (onboarding, option A) et **3** (prompt de spot-check desktop).

## 1 — Décision « 1 » : l'étape OTP simulée remplacée par un vrai compte

**Défaut de cohérence (le plus grave, corrigé).** `OnboardV13` était un *aperçu* : l'étape
« Entrez le code à 4 chiffres » était **simulée** (`setTimeout`, aucun code envoyé, n'importe
quels 4 chiffres passaient). Or elle était **atteignable par un vrai utilisateur** : une action
gardée → `setSheet('auth')` (**vrai login Neon**) → succès → `if (pendingAction)
setSheet('onboard')` → l'utilisateur voyait un écran de sécurité qui **ne vérifiait rien**. Un
mensonge de sécurité, mobile **et** desktop.

**Livré (option A).**
- L'étape identifiants fait désormais un **vrai** `authClient.signUp.email` / `signIn.email`
  (Neon Auth / Better Auth), puis `getSession()` → la session est adoptée **en place** via
  `onAuthenticated` (mêmes capacités que l'écran Auth : rôles, espace vendeur, favoris, Pro).
- **Aucune session ⇒ l'étape identifiants est obligatoire** (on ne franchit pas l'étape sans
  session réelle). Si Better Auth exige une confirmation par email, on le **dit** et on bascule
  sur « se connecter » — jamais un faux succès.
- **Session existante ⇒ l'onboarding saute l'étape identifiants** (`hasSession`), et va
  directement au choix de plan.
- **Preuve sociale honnête** : lecture **publique** `getPublicStats`
  (`GET /api/v2/public/stats`) → « Lieux sur la carte », « Offres publiées ». Le compteur
  réutilise **exactement** la porte de visibilité publique de la carte (états de confiance
  publics, `publication_state = 'published'`), donc il affiche **ce que la carte montre**,
  jamais un total interne flatteur. Il ne s'affiche que si > 0 (sinon on se tait, R-F).
- Étape 3 : prix Pro **devise-aware** (`planPriceLabel`/`localPlanPriceLabel`), même vocabulaire
  de classes que l'écran Plans (`.cardbox`/`.row`/`.status`), aucun nouveau motif.

**Vérifications.**
- `src/trunk/onboard.test.tsx` : 4 tests — éducatif d'abord ; reprise de recherche + prénom ;
  **plus de « code à 4 chiffres »**, champs email + mot de passe présents ; **session existante
  ⇒ pas d'étape identifiants**.
- `src/server/public-stats.test.ts` : 3 tests — `getPublicStats` existe, compte avec la porte de
  visibilité publique (+ `published` seulement), route publique exposée.
- **Falsification** : réintroduire « Recevoir le code » **et** neutraliser la porte de
  visibilité → **2 tests échouent** ; restauré → **7/7 passent**. *Un garde qui ne peut pas
  échouer ne prouve rien.*

## 2 — Décision « 3 » : prompt de spot-check desktop (session hors sandbox)

Le résidu honnête de X4 : les surfaces **authentifiées** (tiroirs vendeur/admin, top fixe desktop
+ drawers) ne sont pas mesurables au sandbox (pas de session). Prompt fourni au fondateur
(voir `docs/nature-way/omni-x5-desktop-spotcheck-prompt.md`).

## 3 — Contrat serveur (pas de 13ᵉ fonction Vercel)

`GET /api/v2/public/stats` est servi par le **catch-all** (`/api/v2/:path*` →
`api/v2/availability?__path=…`), comme `buyer/pro-status` : **12 fonctions maintenues** (plafond
Hobby). Les bundles serverless committés sont régénérés dans le même commit.

## Preuves
- **856/856 tests** (88 fichiers), `tsc -b` propre, 5 gardes vertes
  (state/boundary/live-surface/docs/coherence), build ok.
- Prod : voir le hash dans le commit (T-07d).

## Résidus honnêtes
- Le parcours **authentifié réel** (création de compte → reprise de la recherche) n'est pas
  exerçable au sandbox : prouvé **unitairement** (structure + absence de faux OTP + adoption de
  session) et **en prod** par la route publique ; la création réelle de compte = acte fondateur.
- La preuve sociale affiche des **nombres réels** ; c'est un **compte** (lieux visibles), pas une
  promesse qualitative (« +10 000 acheteurs ») — volontairement, pour rester vérifiable.
