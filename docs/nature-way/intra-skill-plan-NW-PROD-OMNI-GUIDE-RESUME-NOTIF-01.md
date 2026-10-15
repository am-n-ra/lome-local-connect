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
| 1 | `GR-1` guide s'arrête au dock | la dernière étape du spotlight est **visible et actionnable** (clamp viewport) | browser 390×844 + 667 : `cardVisibleHeight == cardHeight` | `ready` | mesure montre un autre écran coupé |
| 2 | `GR-2` reprise PWA | fermer/rouvrir → **même surface** y compris guide ; recherche/flow en cours **retenue** | browser : reload sur guide → guide ; flow → étape | `planned` | `nav-state` déjà couvre le cas mesuré |
| 3 | `GR-3` guide une fois / option ensuite | accueil montré **une seule fois** par compte, ré-ouvrable depuis le menu | flag persistant + browser 2 créations | `planned` | décision fondateur : « à chaque connexion » |
| 4 | `NT-1` manifestation notification | **réponse documentée** (son OS, contenu, tap) ; aucun réglage app tant que non décidé | doc + inventaire mesuré | `planned` | fondateur veut un son/vibration propre |

## Dependency-aware task tree

| ID | Parent | Phase | Objective | Depends on | Owner | Status | Acceptance / proof | Boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | — | Branches | durcir 4 écarts guide/reprise/notif | HQ gate | relais | `in_progress` | preuve par tranche | aucune fondation neuve | écart hors périmètre |
| GR-1 | G-01 | Heartwood | spotlight étape dock visible | — | relais | `ready` | browser 390/667, carte entièrement à l'écran | CSS/positionnement seul | carte toujours coupée |
| GR-2 | G-01 | Trunk | reprise de surface élargie (guide + flow) | GR-1 | relais | `planned` | reload → même surface | pas de nouvelle donnée sensible | nav-state suffit |
| GR-3 | G-01 | Branch | accueil une fois par compte | décision fondateur | relais | `planned` | 2 créations → 1 accueil | flag local, pas serveur | veut à chaque connexion |
| NT-1 | G-01 | Canopy | documenter la manifestation | — | relais | `planned` | doc + inventaire | pas de son custom sans décision | — |
| NR-1 | G-01 | Branch | visibilité réponse vendeur (3 défauts) | — | relais | `done` | 3 gardes falsifiés + preuve backend | pas de badge neuf (hors maquette) | fondateur veut un badge |
| NR-2 | G-01 | Branch | drain Web Push après CHAQUE producteur de notif | — | relais | `done` | garde générique falsifié + preuve SQL 8/8 + prod `5f2366c` | pas de nouveau canal | un producteur non drainé réapparaît |
| NR-3 | G-01 | Branch | le vendeur peut RÉPONDRE (stock nommé) | — | relais | `done` | preuve A/B Postgres 6/6 + 3 gardes falsifiés | pas de migration (dérivé au read) | le stock démo reste sous la demande |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-10-15 | spotlight 3/3 à `top=840` sous dock (4/128 px visibles) | `GR-1` créé `ready` | replan | relais | après preuve GR-1 |
| 2026-10-15 | `nav-state` sans `how-it-works` ; pas de reprise de flow | `GR-2` créé `planned` | replan | relais | après GR-1 |
| 2026-10-15 | aucun `sound`/`vibrate` dans SW/push | `NT-1` créé `planned` (doc) | replan | fondateur | décision son |
| 2026-10-15 | backend réponse/notif sain (11/11 + inbox) ; 3 défauts de visibilité | `NR-1` créé `done` | replan | relais | fondateur veut un badge ? |
| 2026-10-15 | 2ᵉ demande → event+livraisons écrits, `web_push` resté `queued` ; routes dispo/claim/activation sans drain | `NR-2` créé `done` | replan | relais | producteur non drainé ? |
| 2026-10-15 | fondateur « seller is still unable to reply » : formulaire vide + refus de stock dit « not authorized » (demande `05853c57…`, stock 1) | `NR-3` créé `done` | replan | relais | stock démo ≥ demande ? |

## Handoff to Founder HQ

> **Local status:** `partial` — 1 bug mesuré prêt, 2 trous de mémoire, 1 réponse factuelle
> **Gate decision:** `pause` — attendre la **décision d'ordre** du fondateur avant de coder
> **Closed:** `NR-1` (visibilité réponse vendeur) · `NR-2` (drain Web Push) · `NR-3` (le vendeur **peut** répondre : stock nommé, formulaire pré-rempli)
> **Open:** `GR-1` (ready), `GR-2`/`GR-3`/`NT-1` (planned)
> **Residual gap:** reprise « flow en cours » exige de définir *quelle* étape on mémorise (nouveau contrat léger) ; pas de badge de notif in-app (maquette silencieuse) → décision fondateur
> **Next smallest action:** décision fondateur : **quelle tranche d'abord** (recommandation `GR-1`)
> **Re-plan trigger:** le fondateur choisit l'ordre, veut un son/vibration propre, ou un badge de notif
