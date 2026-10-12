# Onboarding — pourquoi l'utilisateur arrive directement dans l'app après l'auth

> **Porte :** `HEARTWOOD_CLOSED_BRANCHES_OPEN` (Branches OPEN, 2026-10-07).
> **Question fondateur (2026-10-07) :** « on a besoin de l'onboarding ; pourquoi l'utilisateur
> arrive-t-il directement dans l'app après l'auth ? »
> **Verdict (mesuré, pas supposé) :** ce n'est **pas** une régression. C'est l'**absence d'une
> branche d'onboarding** dans la spec acceptée. Le geste significatif (créer un compte, Prénom,
> consentement) **a lieu** ; ce qui n'existe pas, c'est une **étape après l'auth**.
> **Aucune ligne de code écrite** — une décision fondateur est requise (Root avant pixels).

## 1. Ce qui se passe réellement (lu dans le code, `HEAD`)

`AuthSheetV13.tsx` — à la création, l'utilisateur donne :

| Champ | Requis | Écrit à la création |
|---|---|---|
| **Prénom** | **oui** (bloque le bouton) | `name` du compte |
| E-mail | oui | Neon Auth |
| Mot de passe | oui | Neon Auth |
| **Consentement** | **oui** (bloque le bouton) | traçabilité BRANCHES-LEGAL |
| Téléphone (déclaré) | non | `phone_declared` (best-effort, S-16) |

Donc **« Créer un compte » n'est pas un simple login** : il crée le **compte réel** avec les
gestes d'activation. Puis, dans `TrunkAppV13.tsx` (`onAuthenticated`) :

```
await adoptSession(user);
if (pendingAction) { await resumePendingAction(true); }   // reprend l'action gardée
else { setSheet('menu'); }                                 // sinon → le menu
```

**Il n'y a aucune étape après l'auth.** L'utilisateur atterrit sur le **menu** (ou reprend
l'action qu'il voulait faire). C'est la réponse à la question.

## 2. Pourquoi — la cause exacte

La surface d'onboarding qui **existait** (`OnboardV13` : identifiants → étape éducative →
**choix de plan** → preuve sociale) a été **retirée** au commit `a86e891` (**BRANCHES-LEGAL**,
2026-10-07), avec ce motif consigné :

> « surface morte `OnboardV13` retirée (seul un chemin jamais appelé l'atteignait) ».

**Vérifié dans le code d'avant le retrait** (`git show 6ccbfd9:src/trunk/TrunkAppV13.tsx`) :
le seul appelant de `setSheet('onboard')` était `if (pendingAction) setSheet('onboard')` **dans
la branche jamais atteinte** — celle qui suivait `resumePendingAction(false)`, et
`resumePendingAction` faisait `if (!authenticated) { setSheet('auth'); return; }` **avant**.
Le chemin `auth → onboard` était donc **inatteignable** : la transition
« création réelle → étape 3 (plans) » ne se produisait **jamais**.

**Le retrait était donc correct** : c'était du code mort. Mais il a **révélé** qu'aucune
onboarding n'était en fait en place.

## 3. Est-ce que l'onboarding est spécifié ? (autorité)

**Non — pas dans la spec acceptée.** Seed V2 (`omni-intent-brief-v2-2026-09-23.md`) :

- **S-16** : « Inscription **téléphone-first** (au Togo le numéro est plus courant que l'e-mail) :
  **email ou numéro** ; vérification numéro = **WhatsApp initié par l'utilisateur** ; **SMS payant
  exclu**. » → l'inscription acceptée est **téléphone-OU-email**. L'app exige aujourd'hui
  **l'e-mail** (le téléphone est **déclaré**, optionnel). **Écart réel, non construit.**
- **S-28** : « Toujours créer une entité… l'entité se crée en **une étape quasi invisible** — pas
  de second chemin. » → l'entité se crée **à la demande** (côté vendeur), pas à l'inscription.
- **S-31 / S-17** : « Publier NE requiert PAS la vérification… on publie tôt, on gagne la
  confiance ensuite. » → **pas de mur d'onboarding** avant d'utiliser Omni. C'est une décision.

La maquette Species V2 (74 écrans) ne contient **aucun** écran d'inscription / onboarding /
OTP / bienvenue (mesuré : 0 entrée `SHEETS` correspondante). L'auth et l'onboarding n'ont
**jamais** été maquettés.

**Conclusion :** un onboarding post-inscription n'est **pas** une promesse acceptée.
`OnboardV13` était une **construction Thunk (X5)** sur un chemin **jamais exécuté** — un
`orphaned leaf`, retiré à juste titre. Le fondateur demande **l'onboarding lui-même** ; ce
n'est pas une régression à réparer mais une **décision à prendre**.

## 4. Décision fondateur requise — « Onboarding, oui — mais lequel ? »

| # | Option | Contenu | Effort | Honnêteté |
|---|---|---|---|---|
| **A** | **Activation minimale** (recommandée) | Après la **création** (pas la connexion), une seule étape : **« Bienvenue · Nombre de lieux sur la carte (réel) » + deux gestes honnêtes : *Explorer la carte* / *Publier ce que je vends*.** Aucun choix de plan forcé (le Pro se paie **quand on en a besoin**, pas avant — S-31). | petite | élevée — elle **oriente vers un vrai geste** (explorer / publier), sans promesse. |
| **B** | **Reprendre `OnboardV13`** | Réintroduire l'étape éducative + la preuve sociale + le choix de plan, **mais rendre le chemin vivant** (`obStep` → destination réelle). | moyenne | **moyenne** — demander un plan à un nouvel acheteur avant qu'il ait cherché quoi que ce soit contredit S-31 (« on publie tôt »). |
| **C** | **Écart S-16 (téléphone-first)** | Construire l'inscription **téléphone-OU-email** (vérification WhatsApp initiée). | **grande** | élevée — c'est **la seule promesse acceptée réellement manquante**. Mais c'est un travail d'auth + vérification, pas un écran d'onboarding. |

**Recommandation** : **A** maintenant (une étape d'activation honnête, petite, qui ne bloque
rien), et **C** comme branche séparée (c'est la promesse Seed non tenue). **Ne pas** faire **B**
sans décider explicitement que le plan Pro se propose à l'entrée — ce serait contraire à S-31.

## 5. Ce que la question du fondateur a réellement trouvé

Il a **raison de demander** : il n'y a **aucun** accueil après la création. Mais la cause n'est
pas un bug : c'est **une décision jamais prise** (l'onboarding n'a jamais été specifié), **plus
un écart Seed réel** (S-16 téléphone-first non construit). Le retrait d'`OnboardV13` n'a rien
cassé — il a **mis au jour** que l'onboarding n'existait pas.

## 6. Résidu honnête

- Le **parcours authentifié réel** (création → destination) n'est pas exerçable au sandbox
  (acte fondateur). Cette analyse est **statique + autorités**, pas une preuve navigateur.
- Vérifier la **destination post-connexion** au spot-check fondateur : le fondateur dit atterrir
  dans l'app — cohérent avec « `setSheet('menu')` » et « reprendre l'action gardée ».
