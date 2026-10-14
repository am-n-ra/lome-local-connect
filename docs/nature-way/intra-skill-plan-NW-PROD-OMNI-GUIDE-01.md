# Plan local — `BRANCHES-GUIDE-1a` : la vérité des chiffres (NW-PROD-OMNI-GUIDE-01)

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02` · **Local Plan ID:** `NW-PROD-OMNI-GUIDE-01`
> **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). **Autorité :** `/nature-way`.
> **As of :** 2026-10-14. **Owner :** Nature Way (relais).
> **Objet fondateur :** « pour les chiffres ça peut changer plus tard, allons avec 1a » —
> donc **aucun chiffre en dur : tout dérivé à la lecture**.

## Resource Receipt

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` (ce fichier) |
| Loaded | `docs/founder-hq/current-state.md` (porte + tranches) |
| Loaded | `docs/maquette/omni-species-v2-interactive.html` (`countmark` L220, `home()` L1556, `seller-dash` L1145) |
| Loaded | `src/trunk/WelcomeV13.tsx`, `TrunkAppV13.tsx`, `api.ts`, `types.ts`, `src/domain/invariants.ts`, `src/server/trunk-repository.ts`, `src/server/http.ts`, `src/server/public-stats.test.ts` |
| Loaded | base canonique `br-dawn-hill-am5amy22` (mesures) + prod `omni.sparkafrika.online` |
| Not loaded / reason | `launch-envelope.md` / `risk-and-escalation-matrix.md` — aucune exposition publique nouvelle ni paiement (UI de lecture). |

## Start-of-slice

> **Structural path:** product > Branches > number truth (Root lecture existante + Trunk UI + maquette)
> **Phase:** Branches (Root lecture mineure + Trunk UI)
> **Slice:** tout chiffre montré à l'utilisateur est **vrai, dérivé à la lecture**, et **nomme ce
> qu'il compte** — jamais un plafond présenté comme un total, jamais deux nombres pour une règle.
> **Dependencies:** `getPublicStats()` **existe déjà** (honnête, prod `13743/10`) — il est **orphelin**
> (0 appelant UI). `FREE_OFFER_LIMIT = 20` est la source unique du plafond.
> **Non-goals:** aucune table, aucune migration ; pas de refonte du compteur de carte ; pas de
> conversion de devise ; pas de guide (c'est `GUIDE-1b`).
> **Definition of done:** l'accueil lit le **vrai total** ; « 5 offres » disparaît au profit de la
> **constante partagée** ; la maquette nomme **LIEUX** ; garde falsifiable ; preuve navigateur +
> prod byte-identique (T-07d).

## Mesures (2026-10-14, avant d'écrire)

| Source | Dit | Réalité |
|---|---|---|
| Base canonique | — | **13 745 lieux** · **4 revendiqués** · **4 entités** · **17 offres** dont **10 publiées** |
| API prod `/api/v2/public/stats` | — | **`{facilities: 13743, offers: 10}`** (honnête, publiquement visible) |
| API prod `/api/v2/public/facilities` | — | renvoie **2 000** (plafond par fenêtre, D-MAP-1) |
| App `WelcomeV13` | « Lieux sur la carte : **2000** » | **plafond** présenté comme **total** → faux |
| App `TrunkAppV13:3538` | « Gratuit · **5 offres** max » | le plafond réel est **20** (`FREE_OFFER_LIMIT`, D-C4) |
| Maquette `countmark` | « **206 OFFRES** » | 206 = nombre de **LIEUX** à l'époque — mal étiqueté |
| Maquette `seller-dash` | « **17 offres** restantes avant le plafond » | calculé depuis `20` : dérive si la constante bouge |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | `GT-1` Root lecture | un seul chiffre honnête, dérivé à la lecture, sans plafond | SQL réel + route + type | `done` | chiffre en dur |
| 2 | `GT-2` Trunk UI | accueil lit le **vrai total** ; « 5 offres » → constante | rendu + preuve navigateur | `done` | 2 nombres pour 1 règle |
| 3 | `GT-3` Species | la maquette nomme **LIEUX** (et dérive le plafond) | `check:maquette` vert | `done` | mot faux |
| 4 | `GT-4` Heartwood | garde « pas de chiffre en dur » falsifiée | test qui échoue si rétabli | `done` | garde qui ne peut échouer |
| 5 | `GT-5` Ring | push + T-07d | hash prod === local | `in_progress` | déploiement |

## Dependency-aware task tree

| ID | Parent | Phase | Objective | Depends on | Status | Acceptance / proof | Risk/debt | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|
| GT-1-1 | GT-1 | Root | `getPublicStats()` compte avec la porte publique (déjà fait) | — | `done` | prod `13743/10` mesuré | lecture seule | filtre retiré |
| GT-1-2 | GT-1 | Root | exposer le compteur au client (fonction existe, **aucun appelant**) | GT-1-1 | `done` | `WelcomeV13` appelle `getPublicStats` | — | — |
| GT-2-1 | GT-2 | Trunk | `WelcomeV13` : remplacer `listPublicFacilities().length` par le **vrai total** | GT-1-2 | `done` | rendu jsdom = valeur serveur | jamais un plafond | total absent |
| GT-2-2 | GT-2 | Trunk | `TrunkAppV13:3538` : « 5 offres » → `FREE_OFFER_LIMIT` | GT-1-2 | `done` | 1 seule source | 2 nombres | constante dupliquée |
| GT-2-3 | GT-2 | Trunk | libellé honnête : « lieux connus » ≠ « offres » | GT-2-1 | `done` | mot exact | — | mot ambigu |
| GT-3-1 | GT-3 | Species | `countmark` « 206 OFFRES » → « LIEUX » | — | `done` | `check:maquette` vert | — | — |
| GT-3-2 | GT-3 | Species | `seller-dash` dérive le reste du plafond (jamais un nombre figé) | GT-3-1 | `done` | calcul depuis la constante | dérive | — |
| GT-4-1 | GT-4 | Heartwood | garde source : aucun chiffre de plafond/compteur en dur dans l'UI | GT-2 | `done` | falsifié (échec si rétabli) | faux positif | — |
| GT-4-2 | GT-4 | Heartwood | preuve navigateur : chiffres servis === base | GT-2 | `done` | `prove-number-truth.mjs` (A/B prod) | — | — |
| GT-5-1 | GT-5 | Ring | suite + gardes + push + T-07d | GT-4 | `in_progress` | hash === local | — | déploiement |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-10-14 | `getPublicStats` existe et est honnête (prod `13743/10`) mais **orphelin** (0 appelant UI) | `GT-1-2` ouvert | advance | Nature Way | après GT-2 |
| 2026-10-14 | « 5 offres max » contredit `FREE_OFFER_LIMIT = 20` (même app, 2 nombres) | `GT-2-2` ouvert | advance | Nature Way | après GT-2 |
| 2026-10-14 | maquette `countmark` étiquette « 206 OFFRES » un nombre de lieux | `GT-3-1` ouvert | advance | Nature Way | après GT-3 |

## Handoff to Founder HQ

> **Local status:** `in_progress` (livré, en attente de déploiement)
> **Gate decision:** `advance`
> **Closed:** `GT-1-1` · `GT-1-2` · `GT-2-1..3` · `GT-3-1..2` · `GT-4-1..2`
> **Open:** `GT-5-1` (push + T-07d)
> **Resource Receipt:** skills + templates + maquette + code + base + prod (voir ci-dessus)
> **Residual gap:** preuve navigateur authentifiée (session réelle) = spot-check fondateur
> **Next smallest action:** `GT-5-1` — push, vérifier hash prod === local, rejouer `proof:number-truth`
> **Re-plan trigger:** un chiffre en dur apparaît, ou le total serveur diverge de la base

### Livré (2026-10-14)

| Élément | Détail |
|---|---|
| `WelcomeV13` | lit `getPublicStats()` (total réel), plus `listPublicFacilities().length` (plafond 2 000) ; libellé « Lieux connus d'Omni » + phrase honnête |
| `TrunkAppV13` | « Gratuit · 5 offres max » → `FREE_OFFER_LIMIT` (20) ; plans acheteur 1/5 → `COMPARE_QUOTA_FREE`/`PRO` (3/10) |
| `WelcomeV13` plans | « 20 offres » / « 1 comparaison » / « 5 comparaisons » → constantes |
| Maquette | `countmark` « 206 OFFRES » → « LIEUX » ; en-tête accueil idem ; plafond gratuit **dérivé** d'une constante unique |
| Garde | `number-truth-guard.test.ts` (4 tests, **falsifié**) ; `welcome.test.tsx` asserte le vrai total ; `check-maquette-v2.mjs` exige la forme **dérivée** et interdit le littéral |
| Preuve | `scripts/prove-number-truth.mjs` (`npm run proof:number-truth`) — **A/B** : 4 FAIL sur prod d'avant, attendu ALL PASS après deploy |
| Suite | **1 191/1 191** ; tsc, 6 gardes + `check:species-t12` (32 décisions, `NON MESURÉ = 0`) verts |
