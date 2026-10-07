# X4 — Desktop, PWA, onboarding : mesure (2026-10-07)

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** `/nature-way`.
> **Déclencheur fondateur :** « 1 ok · assure-toi que la disposition desktop est aussi parfaite
> que le mobile (des éléments passent encore derrière le rôle switch, par exemple) · que tout le
> PWA est en place · et que l'onboarding est aussi bon que ce qui se fait de mieux au monde. »
> **Méthode :** mesure navigateur réelle (Playwright) + lecture du code + probe prod — pas d'inférence.

## 1. Desktop — « des éléments derrière le rôle switch »

### Défaut réel trouvé et corrigé (`f92c82c`)

Mesure `scripts/measure-x4-desktop-occlusion.mjs` aux largeurs 1040 / 1280 / 1920 (plus 390/768
pour contrôle mobile) : **la légende de carte peignait SUR le rail de filtres**.

| | mobile 390/768 | desktop 1040/1280/1920 (avant) |
|---|---|---|
| `.map-legend` (légende / alerte carte) | `top:0` | `top:52` |
| `.filterrail` (chips Tout / Commerces / Particuliers) | `top:50` | `top:50` |
| superposition | non (0 < 50) | **oui — même ligne que le rail, `z-index:6` des deux côtés** |

L'override desktop (`ui-v13.css`) forçait `top:52` sur la légende — exactement la ligne du rail.
Conséquence mesurée : la légende (« La découverte publique est temporairement indisponible »)
recouvrait les 3 chips filtres et **avalait leurs clics** (`elementFromPoint` au centre des chips
renvoyait la légende). **Mobile était correct** : seul l'override desktop collisionnait.

**Correctif :** légende desktop `top:14` (ligne du haut), rail à `50` — même empilement que mobile.
**Après : 0 occlusion d'overlay** aux 3 largeurs desktop ; mobile inchangé (`top:0`).

**Garde** `src/trunk/desktop-layout-guard.test.ts` : exige `légende.top < filterrail.top` dans le
bloc desktop. **Falsifié** (re-forcer `top:52` → 1 FAIL ; restauré → 2 PASS).

### Ce qui n'est PAS occlus (mesuré)

- Le **sélecteur de rôle** est en **haut à droite** (`right:14`) sur desktop, en **haut-centre** sur
  mobile (`left:50%`) — **rien d'autre ne partage sa ligne** (zone de recherche réservée, bord droit
  de la barre permanently search réservé). **Aucune occlusion du rôle switch** sur les surfaces
  publiques mesurées (home, search, results, menu, account).
- Le rail dock est permanent à gauche (`left:14`) ; la carte démarre à `left:64`.

### Résidu honnête (non mesurable dans le sandbox)

Les surfaces **authentifiées** (vendeur, admin, opérateur, tiroirs ouverts) n'ont **pas de session**
dans le sandbox → l'occlusion n'y est **pas** mesurée. Le fondateur a cité « derrière le rôle switch » ;
le défaut trouvé était la légende/rail. **Un spot-check desktop connecté reste dû** (session requise) —
à faire sur les 4 largeurs, drawer ouvert + panneau gauche ouvert. C'est un **acte fondateur**.

## 2. PWA — déjà largement en place

**En place (mesuré) :**

| Élément | État | Preuve |
|---|---|---|
| `manifest.webmanifest` | name/short_name/lang/start_url/scope/display standalone/theme/description | fichier |
| icônes | `192×192`, `512×512`, + **`maskable` 512×512** — tailles **réelles** vérifiées (dimensions PNG exactes) | `python` struct |
| meta iOS | `apple-mobile-web-app-capable`, `status-bar-style`, `apple-touch-icon`, `theme-color` | `index.html` |
| `viewport-fit=cover` + safe-areas | `viewport-fit=cover`, `--safe-top` | `index.html`, CSS |
| Service worker | précache shell + `/offline.html`, réseau-d'abord navigation, cache-first `/assets/*`, **`/api/*` réseau seul SANS repli** (échec honnête), purge des versions | `public/sw.js` |
| offline | `/offline.html` servi aux navigations hors réseau (jamais page blanche) | `sw.js` + probe |
| push | handlers `push` + `notificationclick` | `sw.js` |
| enregistrement SW | `main.tsx` (`navigator.serviceWorker.register('/sw.js')`) | code |
| garde | `pwa-shell-guard.test.ts` (offline précaché, `/api` réseau seul, icônes existantes aux tailles annoncées, dock 44px) | test |
| **probe prod** | **5/5 PASS** sur `omni.sparkafrika.online` (`probe-pwa-rsp.mjs`) : tactiles ≥44px, tablette, polices, offline, API offline honnête | exécuté ce jour |

**Gaps PWA (petits, à statuer) :**

1. `apple-touch-icon` = `omni-logo-compact.png` (512, logo compact) — **non dédié** ; idéalement un
   carré plein 180×180 (iOS ne masque pas). Impact esthétique à l'ajout à l'écran d'accueil iOS.
2. `favicon.png` = **1254×1254** (fichier 1,5 Mo) ; le favicon réel est `omni-logo-compact.png`.
   Le gros fichier est du poids mort (nettoie le poids, pas la fonction).
3. **Safe-area de la maskable non vérifiée** — la rule « contenu dans le disque sûr ~80 % » n'est pas
   mesurée. À vérifier sur un appareil réel (ou par inspection).
4. **Installabilité sur appareil réel non testée** (sandbox headless) — à faire au spot-check fondateur.

→ **Verdict PWA : le socle PWA est en place ; il reste du polissage, pas un chantier.**

## 3. Onboarding — défaut réel de cohérence + écart de conversion

### Défaut réel (`coherence`, le plus grave)

`OnboardV13` est un **parcours d'aperçu** : l'**OTP est simulé** (`sendCode`/`verifyCode` = `setTimeout`,
aucun code envoyé, 4 chiffres quelconques passent). Or il est **atteignable par un vrai utilisateur** :

- une action gardée → `gateRequest` → `setSheet('auth')` (**vrai login Neon email/mot de passe**) ;
- après connexion réussie → `if (pendingAction) setSheet('onboard')` → l'utilisateur voit
  **« Entrez le code à 4 chiffres »** sur un écran qui **ne vérifie rien**.

**C'est un mensonge de sécurité** : l'utilisateur croit à une vérification. **Mobile et desktop.**
Contredit la règle du repo « un écran de vérification qui ne vérifie pas est un mensonge ». **À
corriger quelle que soit la décision esthétique.**

### Écart de conversion (par rapport à « ce qui se fait de mieux »)

Onboarding actuel = **4 écrans** : (1) éducatif « boucle V1 », (2) contact + prénom, (3) OTP (faux),
(4) plans. Benchmark mondial (patterns éprouvés) : **value-first, progressive disclosure, social proof,
zéro friction, reprise de contexte explicite, un seul CTA par écran, rassurance avant demande de contact**.
Écarts mesurés :

| Écart | Actuel | Best practice |
|---|---|---|
| Valeur avant friction | étape éducative avant le contact — **bien** | ✓ proche |
| **Preuve sociale** | **aucune** | chiffre réel (« 200 lieux, X offres ») — mesurable |
| **Reprise de contexte** | texte « nous reprendrons … » — **bien** | ✓ |
| **Vérification réelle** | **fausse** | OTP réel ou suppression de l'étape (l'email est déjà vérifié par Neon) |
| CTA | « Recevoir le code » | un CTA par écran ✓ |
| Rassurance | « aucun mot de passe » ✓ | ✓ |
| Personnalisation | prénom optionnel ✓ | ✓ |

→ **La structure est saine ; elle est desservie par (a) la fausse vérification, (b) l'absence de preuve
sociale, (c) la longueur relative.** Le gain « mondial » est surtout de **supprimer le mensonge** et
d'ajouter une preuve chiffrée — pas une refonte.

## Décisions à rendre (fondateur)

1. **Onboarding — fusion (recommandé, option A)** : l'entrée compte = **vrai login Neon** (déjà l'email
   vérifié) → **on supprime l'étape OTP simulée**, on garde l'étape éducative + prénom + plans, on
   **ajoute une preuve sociale chiffrée réelle** (σ lieux/offres mesurés). **Ou** option B : OTP Neon
   **réel** (coût + cohérence téléphone-first S-16). **Recommandé : A** (zéro friction + honnête).
2. **Onboarding — preuve sociale** : je tire les chiffres **réels** de la base (facilités visibles,
   offres publiées) et je les affiche — **jamais** un chiffre inventé.
3. **Desktop** : cette tranche couvre la mesure + le correctif mesurable ; le **spot-check desktop
   connecté** (surfaces authentifiées) reste un **acte fondateur** — je ne peux pas simuler une session.
4. **PWA** : je propose un **mini-slice PWA** (icône apple dédiée + favicon nettoyé + safe-area maskable
   vérifiée) **ou** on laisse tel quel et on note les 3 petits gaps.

## Non-goals

- Refonte visuelle de la maquette (Species reste la référence).
- OTP téléphone réel (S-16) tant que la décision 1 n'est pas rendue.
- Terrain (TT-1/TT-2/Gate 7) — **en dernier**, décision fondateur.
