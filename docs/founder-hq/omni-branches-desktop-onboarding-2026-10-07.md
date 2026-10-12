# BRANCHES — desktop findability + onboarding après création (2026-10-07)

> **Porte :** `HEARTWOOD_CLOSED_BRANCHES_OPEN` (Branches OPEN, 2026-10-07).
> **Objet :** bugs signalés par le fondateur sur **desktop** (clic de carte, « demander la
> disponibilité »), plus la **décision d'onboarding** ouverte la veille
> (`omni-onboarding-gap-2026-10-07.md`). Portée tenue : **durcissement + une tranche
> fonctionnelle bornée** (l'onboarding = la fonctionnalité de la porte Branches).

## 1. Ce que la mesure a établi (avant d'écrire)

Sur **prod** (`https://omni.sparkafrika.online`), navigateur réel (Playwright/Chromium) :

- **Le chemin desktop « recherche → fiche → demande » fonctionne de bout en bout** pour un
  acheteur **connecté** et **une faculté qui a des produits** : `sheet=results` → tap carte →
  `sheet=facility` → sélection produit (`selCount=1`) → « Demander la disponibilité » →
  `sheet=flow` → `POST /api/v2/availability` → **201**, puis `GET /api/v2/availability-responses`
  → **200** (`npm run proof:branches-desktop-onboarding`, voir §5). **Le défaut n'était donc pas « la
  demande ne marche jamais »**, mais **intermittent** : il dépend de l'état (révélation en cours,
  faculté sans produit, session non connectée).

### 1.1 Cause racine n°1 — la fin de révélation volait le clic (REEL)

Sur un poste **lent** (tuiles/style MapLibre lents), la grille de résultats **apparaît pendant
que la cinématique de révélation tourne encore**. Taper une carte ouvrait bien la fiche, puis le
`finish()` du vol rappelait `handleRevealStateChange(false)` qui rejouait `setSheet('results')`
**par-dessus la fiche** — vu de l'utilisateur : « je clique, rien ne se passe ». Le filet de
sécurité **5,5 s** faisait exactement la même chose (`setSheet('results')` inconditionnel).

**Correctif (une seule vérité) :** un drapeau `openedDuringRevealRef` — un **choix explicite**
de l'acheteur (`handlePinSelect`) prend la main ; ni le `finish()`, ni le filet 5,5 s ne
**reprennent** la feuille une fois qu'il a ouvert quelque chose. Une **nouvelle recherche**
réarme le drapeau (`runSearch`). Fichiers : `src/trunk/TrunkAppV13.tsx`.

### 1.2 Cause racine n°2 — « demander la disponibilité » absent (REEL, mais honnête)

Mesure sur les résultats : beaucoup de facultés visibles ont **0 produit publié**. Le bouton
« Demander la disponibilité » est gardé par la **sélection d'un produit** (`pitem`) — sans
produit, il n'y a **rien dont Omni puisse demander la disponibilité**. Il n'y avait donc **pas**
de faux bouton (c'est le contrat), mais l'état était **muet** : l'acheteur ne comprenait pas
**pourquoi** il n'y avait pas d'action.

**Correctif (honnêteté, pas de faux geste) :**
- faculté **sans produit** : encart qui **dit** qu'il n'y a pas d'offre publiée et pourquoi on ne
  propose pas de bouton ;
- produit **non sélectionné** : le libellé sous le bouton dit **« Sélectionnez d'abord un
  produit… : le bouton s'activera »** ;
- envoi : le bouton dit **« Envoi de la demande… »** pendant l'attente (un bouton qui ne change
  pas d'état fait douter qu'il ait fonctionné).

### 1.3 Formateur aligné (`BuyerFlowV13`) — correction d'un **diagnostic**, pas d'un bug

Le relais avait consigné un « bug prix ÷100 » sur l'étage `intent` de `BuyerFlowV13`
(`(liveResponse.priceMinor / 100).toFixed(2) FCFA`). **Mesure faite avant d'agir — c'était un
mauvais diagnostic.** Depuis **`062_one_money_family.sql` (UNI-MONEY-1 / D-LOC-9, appliquée : la
colonne est au registre)**, **toute** la monnaie est stockée **×100** — y compris les offres. Preuve
live (canonique) : `Box déjeuner togolais.price_minor = 80000` = **800 F**, et prod affiche « dès
18 000 F » pour un `minPriceMinor = 180000` → **le ÷100 EST la convention**.

Le code **divisait donc correctement** ; il ne restait qu'un **défaut d'hygiène d'affichage**
(`toFixed(2)` → « 500.00 FCFA » au lieu de « 500 F CFA » groupé). Corrigé en passant par le
**formateur canonique** `formatMoney(minor, 'XOF')` — **même arithmétique (÷100)**, symbol correct,
groupement, pas de décimales forcées. Fichiers : `src/trunk/BuyerFlowV13.tsx` (étage `intent`).

**Leçon :** *un rapport de bug peut être faux.* « ÷100 » n'est un bug que si la base n'est pas ×100 —
or elle l'est (`062`). **Vérifier le modèle monétaire en base avant de « corriger » un formateur** —
sinon on introduit une erreur ×100 en croyant la retirer.

### 1.4 Zoom clavier mobile — garde rendu plus large

Le garde `@media(pointer:coarse)` (champs ≥ 16px) **exclut désormais** les cases/radios
(`input:not([type=checkbox]):not([type=radio])`) et **couvre** `[contenteditable="true"]` — la
règle portait sur « tous les `input` », ce qui gonflait inutilement des `checkbox` et laissait
un futur éditeur riche sans protection. Fichier : `src/trunk/ui-v13.css`.

### 1.5 En-tête de feuille collant — vérifié, **déjà correct**

L'en-tête (`.sheet-head`) **n'est pas un bug** : il est **correct en tant que barre statique** — la
feuille n'est pas scrollable dans les cas mesurés (menu `scrollH === clientH`), donc l'en-tête
**reste visible**. Une règle `position:sticky` compensatoire avait été écrite (marquée `BUILD`) ;
elle **n'est pas prouvée nécessaire** pour une feuille réelle et a été **retirée** (pas de
changement non prouvé dans le lot). La piste « en-tête collant » ne tenait pas.

## 2. La fonctionnalité de la porte — onboarding après CRÉATION (option A)

Décision retenue (`omni-onboarding-gap-2026-10-07.md`, option A recommandée) :

- **Une seule étape**, montrée **seulement au PREMIER compte créé** (jamais à la connexion d'un
  compte existant). `AuthSheetV13.onAuthenticated(user, created)` — `created=true` **uniquement**
  sur `signUp` / la vérification OTP d'un compte neuf.
- **Aucun choix de plan** (S-31 : on publie tôt, le Pro se paie **quand on en a besoin**). Le
  garde de test **échoue** si un mot « plan/abonnement/Pro » apparaît.
- Le **nombre de lieux affiché est RÉEL** (`listPublicFacilities().length`), jamais une constante
  décorative.
- Deux gestes : **Explorer la carte** (ferme l'accueil) · **Publier ce que je vends** (bascule
  rôle vendeur + ouvre l'espace). Fermer → menu.
- **Priors préservés** : une action gardée (`pendingAction`) **prime** — l'utilisateur reprend ce
  qu'il voulait faire (BRANCH-4), sans détour.

Fichiers : `src/trunk/WelcomeV13.tsx` (neuf), `src/trunk/AuthSheetV13.tsx` (signature),
`src/trunk/TrunkAppV13.tsx` (sheet `welcome`, `journeySheets`, callback), `src/trunk/ui-helpers.ts`
(`sheetDismissTarget`).

## 3. Preuve

- **Suite : 1067/1067 tests** (avant 1057). `tsc` 0.
- **9 gardes verts** : `check:boundary`, `check:state`, `check:live-surface`, `check:dead-css`,
  `check:docs`, `check:coherence` (+ `check:maquette`/`species-t12` non concernés ici).
- **Nouveaux tests** : `src/trunk/welcome.test.tsx` (5 — salutation par prénom, honnêteté sans
  prénom, deux gestes réels, **aucun plan**, le geste déclenche bien) ;
  `src/trunk/search-reveal-steal.test.ts` (5 — le drapeau existe, `handlePinSelect` le pose, la
  fin de révélation le respecte, le filet 5,5 s le respecte, `runSearch` le réarme).
- **Falsifications** (une preuve qui ne peut pas échouer ne prouve rien) :
  | Règle neutralisée | Attendu | Observé |
  |---|---|---|
  | garde anti-vol retiré (`handleRevealStateChange`) | tests rouges | **1 échec** |
  | (guards auth alignés sur la nouvelle signature) | rouges si signature absente | **7 échecs** avant alignement des tests, 0 après |
- **Preuve navigateur prod** (`npm run proof:branches-desktop-onboarding`, 1280×900) : `results → facility →
  flow`, `POST /api/v2/availability` **201**, `availability-responses` **200**.

## 4. Résidu honnête

- L'onboarding est **réel mais statique** dans le sandbox : créer un **compte neuf** en prod
  (preuve fondateur) exerce le chemin complet `signUp → setSheet('welcome')`. Le contrat
  (`onAuthenticated(user, true)`) est prouvé unitairement ; la **création réelle** reste une preuve
  fondateur.
- Le clic carte intermittent est **corrigé** (le vol ne reprend plus la main) ; la preuve
  déterministe du clic pendant une révélation lente reste **non capturée** (la révélation est
  rapide en prod) — la règle est prouvée par le garde de source, falsifié.
- S-16 (**téléphone-first**) reste un écart Seed **non construit** — c'est la **branche C** de
  `omni-onboarding-gap`, pas ce lot.

## 5. Script de preuve

`npm run proof:branches-desktop-onboarding` (`scripts/prove-branches-desktop-onboarding.mjs`) —
pilote le **vrai build** : connexion, recherche tapée, ouverture d'un résultat, action produit,
`WelcomeV13` présent dans le **bundle servi** et **aucun mur de plan**. **Prod : 5/5 PASS.**
