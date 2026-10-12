# Handoff receipt — HO-OMNI-41 (Founder HQ ↔ Nature Way)

> **Objet :** ONBOARDING-GAP — « pourquoi l'utilisateur arrive-t-il directement dans l'app
> après l'auth ? ». Porte courante **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** (Branches OPEN,
> 2026-10-07). **Aucun code écrit** — une décision fondateur est requise.

## Dispatch Record (Founder HQ)

| Champ | Valeur |
|---|---|
| Objectif | Répondre à une question produit (comportement post-auth) et nommer la décision |
| Skill primaire | **`/nature-way`** — diagnostic de phase, autorité, preuve |
| Skill secondaire | aucun (pas de capital/opportunité/légal) |
| Reversibilité | **n/a — aucune modification de code** ; le livrable est un constat + une décision |
| Gate de premier niveau | Autorité (Seed/maquette) + code réel ; **Root avant pixels** |
| Invocation | `/nature-way-founder-hq` puis `/nature-way` — activés |

## Activation Receipt

| Champ | Valeur |
|---|---|
| Skill primaire | **`/nature-way`** — **`activated`** |
| Ressources | `current-state.md` lu (porte + §Branches) ; Seed V2 (`S-16`, `S-28`, `S-31`) ; maquette V2 ; `AuthSheetV13.tsx`, `TrunkAppV13.tsx` ; git `6ccbfd9` (avant retrait), `a86e891` (retrait) |
| Autorité/gate | Branches (durcissement) ; **S-16** (inscription), **S-31** (publier tôt), **S-28** (entité) |
| Retour attendu | Constat mesuré + options + décision nommée |

## Constat (mesuré, pas supposé)

1. **Aucune étape après l'auth.** `onAuthenticated` (`TrunkAppV13.tsx`) fait
   `if (pendingAction) resumePendingAction(true); else setSheet('menu')`. L'utilisateur atterrit
   au **menu** (ou reprend son action gardée). **Il n'existe aucun onboarding post-inscription.**
2. **Ce n'est pas une régression.** `OnboardV13` (identifiants → étape éducative → **choix de
   plan**) a été **retiré** à `a86e891` avec le motif exact « surface morte… seul un chemin jamais
   appelé l'atteignait ». **Vérifié dans `git show 6ccbfd9`** : le seul appelant
   `setSheet('onboard')` était dans la branche `!authenticated` **inatteignable** (elle se
   terminait par `setSheet('auth'); return;`). Le retrait était **correct** — c'était du code mort.
3. **Le geste significatif existe déjà** : la création demande **Prénom (requis)**,
   **consentement (requis)**, e-mail/mot de passe, téléphone (déclaré). « Créer un compte » n'est
   pas un simple login.
4. **L'onboarding n'est PAS spécifié** : Seed V2 ne demande aucun mur post-inscription ;
   **S-31** dit « publier tôt, gagner la confiance ensuite » (pas d'onboarding bloquant) ;
   **S-28** dit l'entité créée « en une étape quasi invisible » ; la maquette V2 (74 écrans) n'a
   **aucun** écran d'auth/onboarding. → `OnboardV13` était un **`orphaned leaf`** construit en X5.
5. **Écart Seed réel trouvé** : **S-16** promet une inscription **téléphone-OU-email**
   (vérification WhatsApp initiée). L'app exige **l'e-mail** ; le téléphone est **déclaré,
   optionnel**. C'est **la seule promesse acceptée réellement manquante**.

## Resource Receipt

- **Loaded** : `docs/founder-hq/current-state.md` · `docs/founder-hq/founder-hq-board.md` ·
  `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (S-16/S-28/S-31) ·
  `docs/maquette/omni-species-v2-interactive.html` (inventaire `SHEETS`) ·
  `src/trunk/AuthSheetV13.tsx`, `TrunkAppV13.tsx` · git `6ccbfd9`, `a86e891`.
- **Template instancié** : `templates/skill-handoff-receipt.md` → ce fichier.
- **Not loaded / raison** : `references/intra-skill-execution-controller.md` (chemin non résolu
  dans le sandbox, cf. HO-OMNI-40) — le plan local est tenu dans le task tracker + le dossier.

## Décision fondateur requise

**« Onboarding, oui — mais lequel ? »** — dossier `omni-onboarding-gap-2026-10-07.md` :

- **A — activation minimale (recommandée)** : après la **création**, une étape honnête
  (« Bienvenue · N lieux » réel + *Explorer la carte* / *Publier ce que je vends*), **sans choix
  de plan forcé** (cohérent S-31). Petite.
- **B — reprendre `OnboardV13`** : éducatif + preuve sociale + choix de plan, chemin rendu vivant.
  Moyenne ; **tension** avec S-31 (proposer un plan avant tout usage).
- **C — S-16 téléphone-first** : inscription téléphone-OU-email + vérification WhatsApp.
  **Grande** — la seule **promesse Seed** manquante ; branche d'auth, pas un écran.

## Next smallest action

1. **Fondateur** : choisir **A / B / C** (ou une combinaison), et confirmer que **S-16**
   téléphone-first reste la cible (ou est explicitement reporté).
2. **Nature Way** : sur décision, ouvrir la branche « onboarding » (maquette avant pixels si B/C)
   sous la porte Branches.
