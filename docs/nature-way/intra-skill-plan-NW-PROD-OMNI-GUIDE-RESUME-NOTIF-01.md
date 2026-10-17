# Intra-skill Plan — `NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01`

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02` (master) · porte `HEARTWOOD_CLOSED_BRANCHES_OPEN`
> **Local Plan ID:** `NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01`
> **Assigned gate:** Branches OPEN — durcissement/fermeture fondateur uniquement, **aucune fondation neuve**
> **Local owner:** `/nature-way`
> **Expected return:** décision fondateur sur l'ordre ; puis preuve par tranche (browser prod + garde falsifiée)

## Resource Receipt

| Status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Loaded | `docs/founder-hq/current-state.md` (porte = `HEARTWOOD_CLOSED_BRANCHES_OPEN`) |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` (ce fichier) |
| Not loaded / reason | `templates/system-dependency-map.md` — pas de nouvel acteur/dépendance ; mesure d'un écart, pas d'architecture neuve |
| Not loaded / reason | `templates/production-evidence-register.md` — sera instancié au moment de la preuve de la tranche retenue |

## Mesure (fait constaté, pas supposé) — 2026-10-15

| Claim fondateur | Vérité mesurée | Verdict |
|---|---|---|
| « guide **une seule fois** à chaque user, l'option reste ensuite » | Accueil (`WelcomeV13`, 5 étapes) montré **seulement après CRÉATION**, jamais à la connexion. Guide « Comment ça marche » **toujours** dans le menu (sans compte). Spotlight carte une fois (`omni-map-guide-seen`). **Pas de drapeau « welcome déjà vu »** → un compte créé deux fois revoit l'accueil. | **PARTIEL** |
| « guide ne doit **pas s'arrêter en route au niveau du dock** » | **BUG RÉEL.** Spotlight carte, étape 3/3 (dock) : la carte est placée `top = ring.bottom + 10` = **840px**, **sous le dock** (ring 766–836) → **4px visibles sur 128** (`cardOffscreenBottom: true`). « Terminer »/« Passer » **inaccessibles**. Les étapes 1 et 2 sont correctes. | **BUG** (mesuré 390×844) |
| « sort/revient dans la PWA sans fermer → garde où il en était » | `nav-state.ts` (BRANCH-2) persiste `{role, sheet, selectedId, selVisitId}` en `localStorage`. **Deux trous** : (a) le guide n'est **pas** une surface restaurable (`RESTORABLE_SHEETS` sans `how-it-works`/`welcome`) ; (b) **pas de reprise fine** — une recherche/flow en cours n'est pas mémorisé (seule la fiche `facility` survit, via `selectedId`). | **PARTIEL** |
| « comment se manifeste la notification ? ça sonne comment ? » | Web Push réel : `pushMessageFor` (titre+corps FR par étape de transaction) → SW `showNotification` (icône+badge). Tap → `/?notifs=1` → Inbox. **Aucun `sound`, `vibrate`, `tag`, `renotify`, `silent`** — ni dans le SW, ni côté serveur. Pas de son in-app. | **RÉPONSE : son du système OS**, défaut navigateur |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | `GR-1` guide s'arrête au dock | la dernière étape du spotlight est **visible et actionnable** (clamp viewport) | browser 390×844 + 667 : `cardVisibleHeight == cardHeight` | `done` | **Déjà corrigé par `GUIDE-1c` (`091104e`)** — `placeSpotlightCard` + clamp. **Prouvé maintenant à l'étape dock** (`prove-gr1-spotlight-dock.mjs`, 14/14) et **falsifié** contre le défaut d'origine (bulle sous l'anneau, non clampée → `visible=4` sur 128, exactement la mesure du 2026-10-15). Le script `prove-guide-1b.mjs` ne cliquait que « Passer » : **il n'atteignait jamais la 3ᵉ étape** — d'où le `ready` périmé. |
| 2 | `GR-2` reprise PWA | fermer/rouvrir → **même surface** ; la **recherche en cours** est **retenue et REJOUÉE** ; la **Room d'une transaction** rouvre sa transaction | browser : reload sur `results` → la recherche repart (`q=…`) ; reload sur `room` → la Room se rouvre (`probe:gr2-room-resume`, prod 4/4) | `partial` | **Volets RECHERCHE + ROOM livrés 2026-10-17.** Room (`ed34472`) : `room` était absent de `RESTORABLE_SHEETS` → la carte nue ; + `requireAuth({kind:'home'})` perdait la transaction sans session prête (classe AUTH-RESUME). **Restent** : reprise du **guide** (`how-it-works`) et du **flux de disponibilité en cours** — tranches séparées. |
| 3 | `GR-3` guide une fois / option ensuite | accueil montré **une seule fois** par compte, ré-ouvrable depuis le menu | flag persistant + browser 2 créations | `planned` | décision fondateur : « à chaque connexion » |
| 4 | `NT-1` manifestation notification | **réponse documentée** (son OS, contenu, tap) ; aucun réglage app tant que non décidé | doc + inventaire mesuré | `planned` | fondateur veut un son/vibration propre |
| 5 | `NR-7` « source : auto » retiré | l'acheteur ne lit plus « auto » pour une réponse **humaine** | garde falsifié + bundle servi sans la chaîne | `done` | la réponse auto existe un jour (alors la marque devient vraie) |
| 6 | `NR-4` intention → notifie le vendeur | `createPurchaseIntent` écrit un événement destiné au **vendeur** (scope membre) | preuve SQL réelle + garde producteur | `done` | le fondateur veut un autre canal |
| 7 | `NR-5` intention → chat ouvert | acheteur **et** vendeur atteignent la **même** Room au moment de l'intention | preuve navigateur 2 rôles + garde | `done` | décision : Room vs chat du flux |
| 8 | `NR-6` scan QR → ouvre la transaction | le scanner ouvre la Room de la transaction scannée | preuve navigateur + garde | `done` | le QR doit rester un simple verrou |
| 9 | `NR-8` logo Omni in-app | le centre de notifications porte le logo | garde de rendu | `done` | — |
| 10 | `NR-9` réponse auto au nom de l'entité | conditions C1–C10 tenues et prouvées (Species §95/§113, Root §6.3) | contrat + migration (`actor_kind`) + preuve | `done` | **LIVRÉE 2026-10-15** (fondateur « ok go ») : `decideAutoResponse` + `actor_kind` + producteur, **18/18** Postgres réel. **Abstention sur négociation** (deux couches, falsifiée) |
| 11 | `NR-10` « alertes » acheteur (promesse du plan sans producteur) | une recherche sauvegardée produit un **événement** quand une offre correspond | producteur + cible de tap + garde | `done` | **Fondateur « 1 ok » (2026-10-15)** → **livré**. Producteur `saved_search_match` dans la transition de publication (matcher **partagé** avec la recherche), cible `search` (in-app + push `?notifs=1&search=`), drain push, 2 gardes **falsifiées**. Aucune migration. |
| 12 | `NR-11` expliquer le plan Pro vendeur | chaque capacité Pro porte une phrase, dont **quand l'automate s'abstient** | texte + garde de complétude | `done` | **Fondateur « 2 ok » (2026-10-15)** → **livré**. `AUTO_RESPONSE_ABSTENTION` (5 motifs, dont `negotiation-open`) + une phrase par ligne Pro + bloc d'abstention ; garde **falsifiée** (retirer un motif → échec). |
| 13 | `GUIDE-SPEC` entrée & guide (accueil · guide · spotlight) | direction visuelle **acceptée** avant tout redessin | mini-maquette Species V2b + acceptation | `blocked` | **Fondateur « 3 trop génériques » (2026-10-15)**. **La maquette (74 écrans) n'a AUCUNE surface de guide** → les 3 surfaces de l'app sont des `orphaned leaves`. **Décision A/B/C demandée** (`omni-guide-onboarding-diagnostic-2026-10-15.md`) |

## Dependency-aware task tree

| ID | Parent | Phase | Objective | Depends on | Owner | Status | Acceptance / proof | Boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | — | Branches | durcir 4 écarts guide/reprise/notif | HQ gate | relais | `in_progress` | preuve par tranche | aucune fondation neuve | écart hors périmètre |
| GR-1 | G-01 | Heartwood | spotlight étape dock visible | — | relais | `done` | browser 390/667, bulle entièrement à l'écran | CSS/positionnement seul | fermé 2026-10-17 |
| GR-2 | G-01 | Trunk | reprise de surface élargie (guide + flow) | GR-1 | relais | `partial` | reload → même surface | pas de nouvelle donnée sensible | **recherche + Room livrées 2026-10-17** ; guide + flux restent |
| GR-3 | G-01 | Branch | accueil une fois par compte | décision fondateur | relais | `planned` | 2 créations → 1 accueil | flag local, pas serveur | veut à chaque connexion |
| NT-1 | G-01 | Canopy | documenter la manifestation | — | relais | `planned` | doc + inventaire | pas de son custom sans décision | — |
| NR-1 | G-01 | Branch | visibilité réponse vendeur (3 défauts) | — | relais | `done` | 3 gardes falsifiés + preuve backend | pas de badge neuf (hors maquette) | fondateur veut un badge |
| NR-2 | G-01 | Branch | drain Web Push après CHAQUE producteur de notif | — | relais | `done` | garde générique falsifié + preuve SQL 8/8 + prod `5f2366c` | pas de nouveau canal | un producteur non drainé réapparaît |
| NR-3 | G-01 | Branch | le vendeur peut RÉPONDRE (stock nommé) | — | relais | `done` | preuve A/B Postgres 6/6 + 3 gardes falsifiés | pas de migration (dérivé au read) | le stock démo reste sous la demande |
| NR-7 | G-01 | Branch | retirer « (source : auto) » mensonger | — | relais | `done` | garde falsifié + chaîne absente du bundle servi | copie seule | la réponse auto devient réelle |
| NR-4 | G-01 | Branch | l'intention NOTIFIE le vendeur | — | relais | `done` | preuve SQL réelle (événement + livraison) + garde producteur | scope membre, pas de nouveau canal | le fondateur veut un autre canal |
| NR-5 | G-01 | Branch | l'intention OUVRE le chat (2 rôles) | NR-4 | relais | `done` | preuve navigateur acheteur+vendeur, une seule surface | pas de 2ᵉ chat | décision Room vs flux |
| NR-6 | G-01 | Branch | le scan QR ouvre la transaction | NR-5 | relais | `done` | preuve navigateur : scan → Room de la bonne txn | le verrou reste (S-22) | le QR doit rester un verrou nu |
| NR-8 | G-01 | Branch | logo Omni dans le centre in-app | — | relais | `done` | garde de rendu | visuel seul | — |
| NR-9 | G-01 | Branch | réponse auto au nom de l'entité | décisions §5 | relais | `done` | contrat C1–C10 + migration `072` + preuve SQL **18/18** | **fondation neuve AUTORISÉE** (fondateur « ok go ») | — |
| NR-10 | G-01 | Branch | « alertes » acheteur (promesse du plan sans producteur) | NR-9 | relais | `done` | recherche sauvegardée → événement ; garde falsifiée | **capacité neuve AUTORISÉE** (fondateur « 1 ok ») | livré 2026-10-15 |
| NR-11 | G-01 | Branch | expliquer le plan Pro vendeur | — | relais | `done` | garde : chaque ligne Pro porte une phrase | durcissement d'honnêteté | livré 2026-10-15 |
| MB-1 | G-01 | Branch | frontière budget/prix par le helper partagé (UNI-MONEY-1) | — | relais | `done` | garde falsifié `buyer-flow-money` + 0 conversion manuelle dans le bundle servi | bug latent : champ vide → plafond 0 FCFA | — |
| MB-2 | G-01 | Branch | chaque producteur de push produit un deep-link | — | relais | `done` | garde falsifié `push-target-coverage` (2) | **risque latent** : aujourd'hui les 4 types poussés sont ciblés ; le garde empêche une régression future | — |
| IOS-PWA-1 | G-01 | Branch | session perdue sur iPhone **en PWA** (cookie tiers bloqué) | décision **B** (fondateur 2026-10-16) | relais | `done` **+ CLOS (fondateur, appareil réel 2026-10-16)** | proxy same-origin + cookie first-party prouvé serveur **ET confirmé sur iPhone PWA** | **fermé : le fondateur a vérifié sur son appareil** | — |
| GUIDE-SPEC | G-01 | Species | direction visuelle de l'entrée (accueil · guide · spotlight) | acceptation fondateur | fondateur | `blocked` | mini-maquette acceptée | **aucun redessin sans maquette** (74 écrans n'ont AUCUNE surface de guide) | décision A/B/C |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-10-15 | spotlight 3/3 à `top=840` sous dock (4/128 px visibles) | `GR-1` créé `ready` | replan | relais | après preuve GR-1 |
| 2026-10-15 | `nav-state` sans `how-it-works` ; pas de reprise de flow | `GR-2` créé `planned` | replan | relais | après GR-1 |
| 2026-10-17 | **mesuré** : reload sur `results` → feuille **vide** (faux « aucun résultat ») car la recherche vit en mémoire ; `nav-state` ne portait que la feuille | `GR-2` → `partial` (volet recherche livré) | replan | relais | décision sur le flux en cours |
| 2026-10-17 | **mesuré** : reload sur `room` → **carte nue** (`room` absent de `RESTORABLE_SHEETS`) ; et `requireAuth({kind:'home'})` **perdait la transaction** sans session prête (classe AUTH-RESUME) | `GR-2` volet **Room** livré (`ed34472`, prod 4/4) | replan | relais | reste le flux de disponibilité + le guide |
| 2026-10-15 | aucun `sound`/`vibrate` dans SW/push | `NT-1` créé `planned` (doc) | replan | fondateur | décision son |
| 2026-10-15 | backend réponse/notif sain (11/11 + inbox) ; 3 défauts de visibilité | `NR-1` créé `done` | replan | relais | fondateur veut un badge ? |
| 2026-10-15 | 2ᵉ demande → event+livraisons écrits, `web_push` resté `queued` ; routes dispo/claim/activation sans drain | `NR-2` créé `done` | replan | relais | producteur non drainé ? |
| 2026-10-15 | fondateur « seller is still unable to reply » : formulaire vide + refus de stock dit « not authorized » (demande `05853c57…`, stock 1) | `NR-3` créé `done` | replan | relais | stock démo ≥ demande ? |
| 2026-10-15 | fondateur (5 sujets) : logo notif · tap→sheet · intention→chat · QR de retrouvaille · conditions réponse auto. **Mesuré** : `createPurchaseIntent` **0 notification** (l.6584–6980) ; scanner QR **jette** les données (`TrunkAppV13:3136`) ; acheteur lit **« (source : auto) »** pour une réponse **humaine** (`BuyerFlowV13:410,426`) ; Room inatteignable depuis le flux (chat du flux tronqué `.slice(-4)`) ; centre in-app sans logo. **Routage des notifications déjà correct** (vérifié, ne pas « corriger »). | `NR-4`/`NR-7` créés `ready` ; `NR-5`/`NR-6`/`NR-8` `planned` ; `NR-9` **créé `blocked`** (capacité neuve, 3 décisions fondateur) | replan | relais | décisions fondateur §5 + ordre |

## Handoff to Founder HQ

> **Local status:** `complete` pour `NR-4…NR-11` **et `GR-1`** ; `GR-2` **partiel** (recherche + Room livrées) ; **restent** `GR-2` (guide + flux), `GR-3`, `NT-1`, `GUIDE-SPEC`
> **Gate decision:** `go` — fondateur a autorisé la capacité neuve (« 1 ok ») et l'explication du plan (« 2 ok ») ; **décision A/B/C en attente sur l'entrée/guide**
> **Closed:** `NR-1` (visibilité réponse vendeur) · `NR-2` (drain Web Push) · `NR-3` (le vendeur **peut** répondre : stock nommé, formulaire pré-rempli) · **`MB-1`/`MB-2`** (2026-10-16 : frontière budget partagée ; cible push verrouillée pour chaque producteur)
> **Open:** `GR-2` (**reprises RECHERCHE + ROOM livrées** ; guide + flux en cours restent), `GR-3` (**décision fondateur** : « à chaque connexion » contredit « une seule fois »), `NT-1` (doc), `GUIDE-SPEC` (**blocked** — décision A/B/C). **Fermés le 2026-10-15 :** `NR-4`…`NR-11` ; **fermés le 2026-10-17 :** `GR-1`, et les volets **recherche + Room** de `GR-2`.
> **Residual gap:** la **réponse auto** est construite (`actor_kind`, `decideAutoResponse`, prouvé 18/18) ; VAPID **est armé** (`push-key` `configured:true`, 4 `web_push` `delivered`). `NR-10` (« alertes » acheteur) et `NR-11` (explication du plan) sont **livrés le 2026-10-15**. Reste : **l'entrée/guide sans direction visuelle** (`GUIDE-SPEC` : la maquette, 74 écrans, n'a **aucune** surface de guide → 3 `orphaned leaves`).
> **Next smallest action:** `GR-2` suite — reprise du **flux de disponibilité en cours** ; puis reprise du guide ; `GR-3`/`GUIDE-SPEC` attendent une **décision fondateur**.
> **Re-plan trigger:** le fondateur tranche A/B/C sur l'entrée/guide, tranche « accueil à chaque connexion » (`GR-3`), ou veut un badge de notif / un son.
| 2026-10-15 | `caf18e5` : NR-4/5/6/7/8 livrés (1259→1260 tests, 7 gardes verts) | `NR-4/5/6/7/8` → `done` | exécution | relais | après push + T-07d |
| 2026-10-15 | `NR-9` livrée : migration `072` (canonique), `decideAutoResponse`, producteur, **18/18** Postgres réel · **bug R-H pré-existant** trouvé et corrigé (`price_minor` absent de la requête de nature → toute proposition refusée) | `NR-9` → `done` | exécution | relais | après push + T-07d |
| 2026-10-15 | `check:dock-search` échouait sur HEAD propre ; `--selftest` passait à tort | garde réparé (2 mutations périmées, règle poll renforcée) | correction de garde | relais | — |
| 2026-10-16 | balayage d'incohérences : `BuyerFlowV13` re-divisait à la main (champ vide → plafond 0 FCFA) ; les 4 types d'événements poussés sont ciblés (pas de bug actif) | `MB-1`/`MB-2` créés `done` | exécution | relais | — |
| 2026-10-16 | fondateur : session perdue **sur iPhone en PWA** seulement (PC/mobile/PWA-PC OK). Mesuré : l'auth vit sur un **domaine tiers** (`neonauth…neon.tech`) appelé depuis `sparkafrika.online` -> **cookie tiers** bloque par WebKit/ITP, sans exemption en PWA standalone. Ce n'est **pas** `P3` (bouclage UI) : ici la session n'est **jamais** restauree. | `IOS-PWA-1` cree `blocked` | replan | fondateur | decision A (domaine perso) / B (proxy same-origin) |
| 2026-10-16 | verifie et ecarte : service worker (ignore cross-origin), manifest PWA (correct), jeton jamais persiste (cookie `HttpOnly` = seule source) | aucun | — | relais | — |
| 2026-10-16 | fondateur tranche **B**. Livre : `src/server/auth-proxy.ts` (catch-all, pas de 13e fonction) + `auth.ts` -> `/api/v2/auth` ; allowlist stricte ; webhook exclu. Preuve serveur reelle : `sign-in` -> cookie first-party (`SameSite=Lax`, sans `Domain`/`Partitioned`) ; `/token` 200 ; `get-session` 200. Garde falsifie (1er jet = faux negatif, corrige). | `IOS-PWA-1` -> `done` (preuve serveur) | execution | relais | preuve iPhone PWA fondateur |
| 2026-10-16 | **fondateur : « iphone pwa passe maintenant »** — la session survit sur l'iPhone en PWA standalone. Le seul juge qui manquait (l'appareil réel) a tranché ; le correctif B (proxy same-origin) est **vivant**. | `IOS-PWA-1` -> **CLOS** | exécution | fondateur | — |

| 2026-10-16 | **P4 (gel prix) PROUVÉ de bout en bout** : le câblage était livré (`c455f76` + migration `074` appliquée + `075`) mais **jamais prouvé**. `scripts/prove-price-freeze.mjs` (`npm run proof:price-freeze`), code livré, branche jetable, **9/9** : l'intention fige origine+remise+prix dû ; changer prix/remise APRÈS l'intention ne change RIEN (S-26) ; snapshot append-only. **Falsifié** : remise forcée à 0 → 6 échecs. Garde `src/server/price-freeze.test.ts` (3, falsifié). Prod `16aeb02` déployée (T-07d). | `P4` -> **CLOS** | exécution | relais | — |
