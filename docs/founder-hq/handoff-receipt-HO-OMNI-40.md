# Handoff receipt — HO-OMNI-40 (Founder HQ ↔ Nature Way)

> **Objet :** BRANCHES-AUTH-LOOP — boucle d'authentification (résidu OTP) + zoom clavier
> mobile. Porte courante **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** (Branches OPEN, 2026-10-07).
> Durcissement (pas de nouvelle fondation).

## Dispatch Record (Founder HQ)

| Champ | Valeur |
|---|---|
| Objectif | Corriger des **bugs d'usage** rapportés par le fondateur sous la porte **Branches** |
| Skill primaire | **`/nature-way`** — livraison produit, diagnostic de phase, preuve |
| Skill secondaire | aucun (pas de changement de capital/opportunité/légal) |
| Reversibilité | **facile** (changement d'app limité à l'auth + CSS ; un commit) |
| Gate de premier niveau | Preuve navigateur + T-07d (prod === build local) |
| Invocation | `/nature-way-founder-hq` puis `/nature-way` — **activés** dans l'environnement |

## Activation Receipt

| Champ | Valeur |
|---|---|
| Skill primaire | **`/nature-way`** — **`activated`** |
| Ressources du spécialiste | maquette/état de référence lus ; `current-state.md` **lu** (jamais inféré) ; `npm run check:state` vert |
| Autorité/gate | Branches — durcissement ; **S-16** (auth), **D-05** (frontière auth) |
| Retour attendu | Fix + preuve + bundle prod vérifié + état de référence à jour |

## Diagnostic (mesuré, pas supposé)

- **Symptôme fondateur** : après création de compte → écran **OTP** → « Se connecter » →
  **retour à l'OTP** (boucle).
- **Config Neon Auth du pilote** (lue via `get_neon_auth_config`) : `require_email_verification:
  false`, `verify_email_on_sign_up: false`, `email_verification_method: otp` →
  **l'écran OTP ne devrait jamais apparaître** à la création. Son apparition prouve que l'app
  **n'a pas reconnu** une session pourtant ouverte.
- **Cause** : `sign-up`/`sign-in` renvoient `{ token, user }` ; le code **ignorait** ce `user`
  et appelait `getSession()` ; quand `/get-session` → `null` (cookie non confirmé :
  cross-site/tiers/panne), l'app croyait « pas de session » → **boucle**.
- **Reproduction décisive** : `/get-session` forcé `null` → `signup → OTP → (code) →
  connexion → OTP`, `getSession=2`.

## Correctif livré

`src/trunk/AuthSheetV13.tsx`, `src/trunk/auth-session.ts`, `src/trunk/ui-v13.css`.

1. **Adopter l'utilisateur porté par le succès** (`sessionUserFromAuthResult` lit `data.user`)
   **sans re-fetch** → un `get-session` vide ne transforme plus un succès en boucle.
2. `verifyCode` adopte l'utilisateur de `verifyEmail` ; sinon **ouvre la session par le mot de
   passe encore présent** ; sinon un message clair (jamais un formulaire qui reboucle).
3. Erreurs mappées (`authErrorOf`) : compte existant → bascule connexion ; non confirmé → OTP ;
   mauvais mot de passe → identifiants ; réseau ≠ identifiants.
4. **Zoom clavier mobile** : `@media(pointer:coarse){ input,.field,.field.lg,.input,textarea,select{
   font-size:16px!important} }` + règle `.input` manquante (SellerV13).

## Resource Receipt

- **Loaded** : `docs/founder-hq/current-state.md` (état de référence, §Gate + §Branches OPEN) ·
  `docs/founder-hq/founder-hq-board.md` · `AGENTS.md` (mémoire repo) · `package.json` (scripts de
  garde) · `src/trunk/AuthSheetV13.tsx`, `auth-session.ts`, `ui-v13.css` · config Neon Auth
  (via `get_neon_auth_config`).
- **Template instantié** : `templates/skill-handoff-receipt.md` → **ce fichier**.
- **Not loaded / raison** : `references/intra-skill-execution-controller.md` et
  `templates/intra-skill-plan.md` (chemin sous `.agents/skills/nature-way-founder-hq/…` non résolu
  dans le sandbox) — le plan local vivant est tenu dans le **task tracker** et le dossier
  `omni-branches-auth-loop-2026-10-07.md`, qui en portent le rôle.

## Preuve (A/B décisive)

| Preuve | Résultat |
|---|---|
| `proof:branches-auth-loop` **local** (390, `/get-session` forcé `null`) | **4/4 PASS** — création ET connexion → **menu** ; `getSession=1` ; 0 pageerror |
| `proof:branches-auth-loop` **prod avant déploiement** | **1/4 — FALSIFIÉ** — OTP, `getSession=2` |
| `proof:branches-auth-loop` **prod après déploiement** | **4/4 PASS** — le correctif est **vivant** |
| `proof:branches-input-zoom` | **4/4** — tactile min **16px**, desktop dense |
| Suite | **1056/1056** ; `tsc` 0 ; 6 gardes verts |

**Falsifications** : retirer l'adoption du `user` direct → **3 tests échouent** ; retirer le bloc
`@media(pointer:coarse)` → **2** ; retirer la règle `.input` → **1** ; rejouer sur prod (ancien
code) → **3/4 échecs**.

## T-07d (push ≠ déploiement)

- Commit **`3a861ae`** poussé sur `origin/omni-v2-rebuild`.
- **prod `index-CRzUr8sZ.js` === build local ✅** ; **entrée GitHub `deployments` `3a861ae`
  (Production)** présente.
- Doc-only commit **`2de0830`** (état de référence) poussé ; bundle inchangé, T-07d re-vérifié.

## Résidu honnête / gap

- Le correctif **rend l'app robuste à un `/get-session` vide** — la cause exacte du symptôme.
  Il **ne prouve pas** le comportement d'un navigateur réel avec cookies tiers bloqués : le
  harnais **force** la condition. Spot-check navigateur réel = prochain essai fondateur.
- **`BRANCHES-LEGAL`** reste en attente de **décision fondateur** (validation des textes par un
  conseil qualifié Togo ; suppression de compte automatisée + rétention — FK `ON DELETE RESTRICT`).
- Aucune autre branche ne démarre sans **sélection fondateur** (Branches = décision fondateur).

## Next smallest action

1. Fondateur : rejouer la création de compte sur son appareil (spot-check navigateur réel).
2. HQ : présenter la **liste ordonnée des branches candidates** au fondateur pour sélection de la
   branche suivante (aucune branche ne démarre avant ce choix).

---

## Suite — `BRANCHES-SEARCH-SCOPE` (2026-10-07, commit `8d73dbc`)

**Signal fondateur :** « chercher « pain » parmi les offres → rien ; parmi les entités → « 6
lieux » ; puis « parmi les offres » affiche des établissements. »

**Cause (mesurée) :** la recherche d'**offre** passait le **viewport** de la carte à
`listPublicFacilities` ; le prédicat serveur bornait donc les résultats au visible. Une offre
qui existe devenait introuvable dès que la carte était ailleurs, tandis que le **niveau entité**
interrogeait tout le corpus → deux niveaux, deux portées. Mesure prod : `q=pain` + viewport sur
Lomé = **4**, + viewport loin = **0**, `entities?q=pain` (global) → indice **6 lieux**.

**Correctif :** le prédicat viewport ne s'applique plus **qu'en l'absence de requête** ; une
**recherche tapée est GLOBALE** (la distance s'exprime par la chip de rayon, D-CON-4) ; le
**browse** non filtré reste borné au viewport.

**Preuve (falsifiable) :** `prove-root-read-paths` **37/37** (SQL réel canonique) —
`search is global :: 'pain' far-off === global (6)` et `browse is viewport-scoped :: far=0,
lome=2000` ; **falsifié** (ancien prédicat → `FAIL global=6, far-off=0`) · `proof:search-scope-global`
(navigateur, géoloc hors Lomé) **prod avant 2/5 → après 5/5** · garde statique
`search-scope.test.ts` **falsifiée** · **1057/1057** · tsc 0 · 6 gardes verts.

**T-07d ✅ :** prod `index-CRzUr8sZ.js` === build local ; entrée GitHub `deployments` `8d73dbc` ;
**comportement prod changé** (0 → 6). Dossier `omni-branches-search-scope-2026-10-07.md`.
