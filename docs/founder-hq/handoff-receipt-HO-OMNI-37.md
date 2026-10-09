# Skill Handoff and Activation Receipt — HO-OMNI-37

> **Request ID:** `HO-OMNI-37`
> **Founder HQ timestamp:** 2026-10-08 (UTC)
> **Primary authority:** `/nature-way` (retour vers HQ)
> **Exact invocation:** `/nature-way-founder-hq /nature-way` + deux relances fondateur
> **Activation status:** `activated` — porte **Heartwood** (durcissement, pas de nouvelle fondation)

## Porte (inchangée)

Registre `TRUNK_CLOSED_HEARTWOOD_OPEN`. Trunk **CLOS** ; porte courante **Heartwood**. Terrain
(`TT-1`/`TT-2`/Gate 7) **EN DERNIER** (décision fondateur).

## Deux questions fondateur traitées

### Q1 — « mrs est trouvé par offre mais pas dans entité, c'est normal ? » → **OUI, et c'est correct**

Mesuré en base (canonique) et sur l'API prod :

| Niveau | `mrs` | Pourquoi |
|---|---|---|
| **Offre** (lieux) | **29 lignes** | 29 lieux OSM « MRS » / « Station MRS » / « Supérette MRS »… |
| **Entité** | **0 ligne** | Les 29 ont `account_id = null`, `entity_id = null`, `source_kind = public_import`, `trust_state = unclaimed` |

Règle **S-05 / E-6** : une entité existe seulement si quelqu'un l'a **revendiquée** ; un lieu nu n'a
pas d'entité. Le fix SEARCH-04 (`4d90275`) l'annonce déjà à l'écran (« aucune entité ne porte ce nom,
mais 29 lieux connus correspondent… » + route vers l'offre). **Comportement attendu, pas un bug.**

### Q2 — « la comparaison groupée fonctionne ? » → **OUI, prouvée ; un vrai défaut trouvé derrière**

- Comparer s'ouvre (4 tris, lignes + prix, carte quota « Acheteur Pro · 1 de 48 — Passez Pro »,
  quota vérifié). Fonctionnel, **réservé Pro** pour les grands ensembles (1 gratuit / 5 Pro) ; le
  « vrai groupé » = **Dispo groupée** (bulk, ouvert à tous).
- **Défaut réel trouvé :** cliquer Comparer sans être connecté ouvrait l'écran de connexion, et
  **après login l'utilisateur atterrissait sur le menu** — devait refaire sa recherche. L'intention
  était **perdue**.

## Ce qui a été livré — AUTH-RESUME (commits `dc5ef87` + `1adba8b`)

**Racine :** `requireAuth()` ouvrait l'écran de connexion **sans mémoriser** l'action ; `gateRequest()`
(le seul à mémoriser) n'était câblé **que** sur `BuyerFlowV13`. Les 39 autres sites gardés ne
reprenaient rien.

- `requireAuth(resume?)` mémorise l'action gardée avant de rediriger vers la connexion.
- `openCompare` / `openBulk` déclarent leurs intentions (`kind: 'compare' | 'bulk'`).
- **`resumePendingAction(authenticated)`** = chemin UNIQUE de reprise, partagé par l'écran de
  connexion **et** l'onboarding. Une intention d'achat garde l'onboarding complet ; les autres
  actions gardées reprennent immédiatement.
- `PendingAction` étendu (compare/bulk) + `describePendingAction` / `pendingActionResume`.
- **Bug attrapé pendant la preuve** : la 1ʳᵉ version lisait `sessionUser` dans la closure — la session
  venait d'être créée → état encore `null` → l'utilisateur retombait sur l'onboarding. Corrigé en
  passant l'état d'authentification **explicitement** (`1adba8b`).

## Preuve (règle : une preuve doit pouvoir échouer)

- **Garde source** `auth-resume-guard.test.ts` (6 cas) — **falsifié 3 fois** : retirer la mémorisation
  → 1 échec ; reforcer le `setSheet('onboard'); setSheet("menu")` → 1 échec ; lire `sessionUser` au
  lieu de `authenticated` → 1 échec. Restauré → vert.
- **Cas contrat** `ui-helpers.test.ts` : `pendingActionResume(compare/bulk)`.
- **Preuve navigateur prod** `scripts/probe-auth-resume.mjs` (viewer réel, `demo@buyer.omni`) :
  - Comparer sans session → écran de connexion (**PASS**) ;
  - après connexion → feuille **`compare`** (**PASS**) — *baseline avant le fix : `menu`* ;
  - comparaison vivante (2 lignes, 4 tris) ; **0 page error**.
- **T-07d** : prod `index-Bh4GjbYx.js`, sha256 `cd807522…42ce4b` **byte-identique** L/R ; déploiement
  GitHub `1adba8e Production`.
- **940/940 tests**, `tsc` clean, gardes `boundary/live-surface/dead-css/docs/state/coherence` vertes.

## Audit de CLASSE (question fondateur : « si ça a pu passer inaperçu, il y en a d'autres »)

Défaut signalé = instance d'une **classe**. Audit des classes sœurs, mesuré :

- **Classe A — action gardée qui perd sa destination** : **corrigée pour TOUTES les destinations**
  atteignables sans session (home / wallet / saved / tour / notifs / recovery + compare / bulk).
  Preuve prod sur **2** destinations (`compare` + `saved`) : avant → `menu`, après → reprise.
- **Classe B — capacité construite mais jamais câblée** (le motif `gateRequest`) : **8** fonctions
  d'API client exportées sans appelant produit, toutes **classées et gardées** :
  - Web Push (`subscribeWebPush`/`getWebPushStatus`/`revokeWebPush`) = **`partial /
    configuration-gated`**, déclarée honnêtement dans `docs/push-operations.md` (pas une surprise) ;
  - `importPublicFacility`/`importPublicFacilityBatch` = outil d'import admin **sans UI** (l'import se
    fait par script serveur) ;
  - `getOperatorRuns` = **surface opérateur sans UI** (le terrain est en dernier par séquencement) ;
  - `getSellerActivationQueue`, `getBuyerProRenewalStatus` = **doublons** d'API (l'UI utilise la variante
    admin/buyer).
  Nouveau garde `src/trunk/client-api-surface.test.ts` : **échoue** si une fonction d'API exportée n'a
  aucun appelant produit et n'est pas dans l'allow-list documentée. **Falsifié** (retirer
  `getOperatorRuns` → échec).
- **Classe C — handlers qui avalent le tap** : **aucun** `onClick={() => {}}` ; les chips non-encore
  actives sont `aria-disabled` + étiquetées « bientôt ».

## Install (A2HS) — le préalable honnête du Web Push (tranche 1, `10d0523`, en prod)

Décision fondateur : au lieu de retirer Web Push, **prompter les Android** et **guider l’installation
sur iOS**. Vérifié (Apple + Mozilla, 2025) : iOS Safari **ne supporte ni `beforeinstallprompt` ni le push
hors écran d’accueil** (16.4+) → on ne peut pas prompter sur iOS, on **guide**. Jamais demander la
permission avant l’installation (dans un onglet Safari, l’invite n’apparaît pas → « l’app a l’air cassée »).

- `src/trunk/pwa-install.ts` : détection plateforme (iOS/Android/desktop), état honnête
  (`installed` / `installable` / `manual-guide` / `unsupported`), étapes illustrées par plateforme
  (iPhone : Partager → « Sur l’écran d’accueil » → Ajouter ; Android : ⋮ → « Installer l’application »).
  **La vidéo/animation viendra se poser sur ces étapes** — le socle est prêt.
- `TrunkAppV13` : capture `beforeinstallprompt`/`appinstalled`, feuille `install`, **entrée de menu AVANT
  session** (on installe avant de créer un compte). Rien n’est montré si déjà installé.
- Garde `pwa-shell-guard` : la couche **reste câblée** (pas un orphelin façon `gateRequest`).
- **Preuve navigateur** `scripts/probe-pwa-install.mjs` **6/6 PASS en prod** (desktop + iPhone simulé).

## Reste

- **Décision fondateur** : prochain item Heartwood **ou** ouverture du terrain (`TT-1`/`TT-2`/Gate 7) —
  le terrain reste **en dernier** par séquencement.
- **Tranche 2 (à décider)** : le **sender Web Push** + l'UI de consentement (permission demandée
  **depuis l'app installée**, jamais avant) + VAPID + preuve de bout en bout. Gratuit (services de push
  des navigateurs = 0 $) ; iOS 16.4+ **uniquement installé**. La couche d'installation (tranche 1) est
  le préalable.
- **Dette assumée, à décider** : **Web Push** est câblé serveur mais **aucun abonnement navigateur**
  (`subscribeWebPush`/`pushManager` = **0** dans le bundle) → les notifications de transaction (FF-7) et
  le trophée de bonus ne peuvent **pas** atteindre un appareil aujourd'hui. `docs/push-operations.md` le
  dit `partial / configuration-gated` (VAPID + provider non configurés). À ouvrir **ou** à retirer.
- **Surface opérateur `getOperatorRuns`** : construite, sans UI — à ouvrir au terrain ou à retirer.
- Observé (déjà connu, non traité ici) : le bundle prod journalise des erreurs MapLibre
  (`Cannot read properties of null (reading '0')`, `Invalid LngLat`) sans `pageerror` bloquant — bruit
  worker de tuiles, à traiter séparément si le fondateur le souhaite.

## FF-7 Web Push — TRANCHE 2 LIVRÉE (2026-10-07, commit `2e70f08`, en prod)

Décision appliquée : on **ouvre** Web Push (au lieu de le retirer). La couche d'installation (tranche 1)
était le préalable ; le sender + consentement sont désormais construits et **prouvés en prod**.

- **Serveur** : `src/server/web-push.ts` (modèle `PendingPushDelivery` = un événement → compte → **N
  appareils** ; drain best-effort avec issues `delivered/retried/revoked/exhausted/skipped`, jamais
  fatal à la transaction) ; `src/server/web-push-provider.ts` isole le paquet `web-push` ;
  `trunk-repository.ts` expose `listWebPushSubscriptionStatus` + `revokeWebPush` ; `http.ts` draine au
  **changement d'état** et à la **notation**, sert `GET /api/v2/notifications/push-key`, draine
  opportunistement à la lecture des transactions + cron.
- **Client** : `src/trunk/push-subscribe.ts` (détection de support, base64url→`Uint8Array`, subscribe/
  revoke) + carte de consentement dans `TrunkAppV13` (iOS **guidé derrière l'installation**).
- **Le tap ouvre l'Inbox, jamais un rechargement nu** : `pushMessageFor().url = '/?notifs=1'`, et un effet
  au montage dans `TrunkAppV13` ouvre le centre de notifications.
- **VAPID** : `0` fuite dans le bundle client ; la route répond honnêtement `{configured:false,
  publicKey:null}` tant que les clés VAPID ne sont pas posées dans Vercel (patron `MAPBOX_ACCESS_TOKEN`).

## Bandeau d'installation proactif (demande fondateur, dans le même commit)

« Tant que c'est dans le navigateur, on peut utiliser le prompt navigateur » → livré : un **bandeau
proactif** propose l'installation **sans passer par le menu**.
- `shouldShowInstallBanner(state, dismissed)` pur. `beforeinstallprompt` capturé → **vrai bouton**
  (`.prompt()`) ; iOS → guide ; refus **mémorisé** (localStorage) ; **jamais** si déjà installé.
- `runInstall` libère la référence après consommation (un `beforeinstallprompt` ne se déclenche qu'**une
  fois** → pas de bouton mort). Monochrome, sous le rolepill (z12 < z17).

## Preuves (2026-10-07)

- **975/975 tests**, `tsc` clean, **7 gardes OK**.
- **SQL du drain et du revoke exécuté sur la canonique** `br-dawn-hill-am5amy22` (compile + sémantique ;
  file et abonnements vides — l'envoi réel attend un abonnement navigateur réel).
- **0 fuite VAPID** dans `dist/assets/*.js`. **Probe navigateur `scripts/probe-pwa-install.mjs` 11/11
  PASS**, rejoué **sur prod**. **T-07d ✅** : prod `index-Df5xmrUu.js` === build local **et** déploiement
  GitHub pour `2e70f08`.

## Reste (Heartwood)

- **Décision fondateur** : prochain item de fermeture **ou** ouverture terrain (`TT-1`/`TT-2`/Gate 7).
- **AUTH-RESUME class audit** (`Q2`) : **REJOUÉ** — la 1ʳᵉ passe avait raté **2 des 3** instances.
  Trouvées et corrigées (`8fc8088`, `eae87f2`, en prod) : (2ᵉ) « Demander la disponibilité » multi-produits
  depuis une fiche et (3ᵉ) « Revendiquer une facilité » (`startClaim`) appelaient `requireAuth()` NU →
  après connexion, destination **et** sélection vendeur perdues. Toutes déclarent désormais `kind: 'facility'`
  → la reprise rouvre la fiche. **A/B prod** : avant → `menu`, après → `facility`. Reste = mutations/loads
  (`sendBulk`, `cancel`, favori, refresh) : aucune destination à reprendre. **Leçon : un audit de classe doit
  être REJOUÉ — un seul passage ne suffit pas.**
- **VAPID ARMÉ ET PROUVÉ (2026-10-07)** : les clés sont posées en **Production** Vercel
  (`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`, sujet `mailto:contact@sparkafrika.online`).
  L'armement est **vérifié par le comportement** : `GET /api/v2/notifications/push-key` →
  `configured:true`, clé `B…` (avant : `configured:false`). Le runbook `docs/push-operations.md` avait été
  corrigé (il nommait `VITE_VAPID_PUBLIC_KEY`/`PUSH_PROVIDER`, **inexistantes**) ; garde
  `push-operations-docs.test.ts` (falsifié). **Preuve serveur de bout en bout en prod**
  (`npm run proof:web-push`, harnais neuf `scripts/prove-web-push.mjs`) : T1 arming `configured:true` ;
  T2 abonnement authentifié → `status active:1` ; T3 révocation → `status active:0` ; T4 aucune erreur
  dans la fenêtre push. **Runs vérifiés 3/3 PASS.** La tranche passe de `partial/configuration-gated` à
  **`verified` côté serveur**. **Reste = `manual` appareil** : une notification *native* rendue par un vrai
  endpoint FCM/APNs — non revendiquée (appareil requis). **Bruit carte PRÉ-EXISTANT** noté et compté à part,
  jamais masqué : `_calcMatrices` / `Invalid LngLat (0, NaN)` (MapLibre, transitions recherche/comparateur),
  indépendant du push (bundle `index-CbqTWzli.js` inchangé).
- **`vercel` et `gh` absents du sandbox** : je n'ai ni jeton Vercel ni CLI `vercel` ; l'armement a été fait
  par le fondateur dans le dashboard. La clé privée n'a **jamais** touché le dépôt (0 occurrence vérifiée).
- `getOperatorRuns` : sans UI — à ouvrir au terrain ou à retirer.

## HP-1 + HP-2 (Heartwood hardening, 2026-10-07, déployé T-07d ✅)

- **`HP-1` — le bruit carte noté ci-dessus est traité à la racine.** Les frames **internes** de
  MapLibre (`_calcMatrices` rendu, `unprojectScreenPoint` pointeur) lèvent **synchronement** sur une
  matrice dégénérée et **remontent au `window.onerror`**, échappant à `map.on('error')` → l'erreur se
  répète à **chaque frame** (le flood). Filet `window` **étroit** (`isTransformMatrixError`) : re-ancre
  (`healTransform`) + `preventDefault`, **sans avaler** une vraie erreur (lecture nulle générique,
  `r.on2`, `Failed to fetch`, `Invalid LngLat` valide). Preuve **A/B** navigateur
  (`npm run proof:map-transform-heal` : PROD FAIL sans filet → local PASS), garde source falsifié.
- **`HP-2` — un lancer de rendu ne laisse plus une page blanche.** L'app avait l'écran « Reprendre où
  j'en étais » mais **aucune frontière React** : une exception de rendu (même classe `r.on2`) démontait
  tout l'arbre → page blanche, reprise **inatteignable**. Livré `AppErrorBoundary` (Recharger/Réessayer,
  « rien n'est perdu ») monté dans `main.tsx` + filet `unhandledrejection`. Preuves : jsdom réel,
  câblage falsifié, navigateur **A/B** (`npm run proof:error-boundary`).
- **Déploiement** : prod `index-B5BW3kjI.js` === build local **et** entrée GitHub `76d9f82` (Production)
  → **T-07d ✅**. Preuves navigateur **rejouées sur prod** : PASS.
- **994/994** tests, `tsc` 0, 5 gardes vertes.

## HP-3 (délai de requête, 2026-10-07, déployé T-07d ✅)

- **Omni est mobile-first à Lomé** : sur un réseau instable, `fetchWithRecovery` ré-essayait une fois les
  5xx **mais ne bornait pas l'attente** — un `fetch` qui ne récupère jamais laissait « Chargement… »
  **indéfiniment** (ni erreur, ni reprise). Livré `request-timeout.ts` (`raceWithTimeout` →
  `RequestTimeoutError` honnête, minuteur nettoyé) appliqué aux **deux** tentatives.
- **Preuves** : unitaire fake timers (6) + **intégration réelle** `api.test.ts` (fetch qui pend → rejette
  `/réseau/i`) + garde source. **Falsifié** : délai neutralisé → le test d'intégration **expire**. Un harnais
  navigateur a été écrit puis **retiré** (fragile : état `error` partagé + pas de backend en preview →
  faux échec) — contrat prouvé **à la couche API**.
- **Déploiement** : prod `index-CbrtTHmp.js` === local + entrée GitHub `39061b6` → **T-07d ✅**. **1003/1003**.

## HP-4 (surfaces d'API client sans UI, 2026-10-07, déployé T-07d ✅)

- **Décision fondateur « allons avec les clients UI ».** La mesure a montré **deux catégories** :
  **3 doublons/superseded RETIRÉS** — `getSellerActivationQueue` (route legacy `reviewer=seller-activations`,
  `AdminV13` utilise déjà `getAdminSellerActivationQueue`), `getBuyerProRenewalStatus` (route legacy
  `buyer/pro/renewal-status`, renvoie **exactement** `getBuyerProStatus`), `importPublicFacility` (singulier,
  superseded par `importPublicFacilityBatch({items:[x]})`) — client **et** route serveur morte supprimés ;
  **2 capacités réelles CÂBLÉES** — `importPublicFacilityBatch` + `getOperatorRuns` via **`AdminImportConsole`**
  montée dans `AdminV13` (import OSM batch traçable, attribution ODbL pré-remplie, point hors zone refusé,
  historique des runs d'opérateur, états vides honnêtes, squelette).
- **Leçon** : câbler un doublon aurait créé **deux points d'entrée pour un même acte** ; la bonne moitié de
  « clients UI » était parfois **retirer**. La liste blanche `client-api-surface` est désormais **vide**.
- **Preuves** : rendu jsdom (3) + garde de surface + bundles **client et serverless** vérifiés (régénérés) ;
  **1004/1004**, `tsc` 0, 5 gardes. **Déploiement** : prod `index-DLYeXIbP.js` === local + entrée GitHub
  `6141213` → **T-07d ✅**. Dossier `omni-heartwood-hp4-client-ui-surfaces-evidence-2026-10-07.md`.
- **Résidu** : la preuve navigateur d'un import réel exige une **session admin** (sandbox sans DB/auth) ;
  `getOperatorRuns` reste une **liste d'observation** (pas de filtre/relance = capacité neuve).
