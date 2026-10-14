# Plan local — `BRANCHES-GUIDE-1b` : montrer les éléments cœur à la première fois (NW-PROD-OMNI-GUIDE-02)

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02` · **Local Plan ID:** `NW-PROD-OMNI-GUIDE-02`
> **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). **Autorité :** `/nature-way`.
> **As of :** 2026-10-14. **Owner :** Nature Way (relais).
> **Objet fondateur (2026-10-14) :** « on pourrait avoir un guide lors de onboarding pour la
> premiere fois pour au moins montrer les elements core… non ? » — la demande **complète** de ce
> jour ; `GUIDE-1a` (les chiffres) a été livré en premier, le guide est `1b`.

## Resource Receipt

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` (ce fichier) |
| Loaded | `docs/founder-hq/current-state.md` (porte + tranches) |
| Loaded | `docs/nature-way/omni-onboarding-gap-2026-10-07.md` (l'onboarding n'est pas une promesse acceptée ; S-31) |
| Loaded | `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (§cœur : COMPLET · VIVANT · INTERROGEABLE ; S-06) |
| Loaded | `src/trunk/WelcomeV13.tsx`, `TrunkAppV13.tsx` (welcome wiring, map-legend), `offer-existence.ts` |
| Loaded | `docs/maquette/omni-species-v2-interactive.html` (mesure : **0 écran d'onboarding**) |
| Not loaded / reason | `references/launch-envelope.md` / `risk-and-escalation-matrix.md` — aucune exposition publique nouvelle, aucun paiement, aucune donnée sensible (UI de lecture). |

## Start-of-slice

> **Structural path:** product > Branches > GUIDE-1 > 1b (guide première-fois, éléments cœur)
> **Phase:** Branches — mini-seed + mini-species (pattern visuel NEUF), puis Root/Trunk/Heartwood.
> **Slice:** à la **première fois**, montrer à l'utilisateur les **éléments cœur d'Omni** et
> **comment ça marche** — sans jamais bloquer (S-31 : publier tôt, la vérification vient après).
> **Dependencies:** `WelcomeV13` existe déjà (4 moments, création seule) ; aucune surface d'aide
> n'existe (0 occurrence) ; la maquette n'a **aucun** écran d'onboarding → **mini-species requis**.
> **Non-goals:** aucun mur (contredit S-31) ; aucune refonte du menu ; aucune nouvelle donnée ;
> pas de tutoriel-obstacle ; pas de conversion de devise ; pas de `GUIDE-1c` (récupérable) ici.
> **Definition of done:** un guide première-fois honnête, récupérable, montrant les éléments cœur
> réels (carte/recherche/pin/fiche + les 3 temps + l'échelle 0→4), avec états vides/erreur,
> preuve navigateur 4 largeurs, garde falsifiable, push + prod byte-identique (T-07d).

## Mesures (2026-10-14, avant d'écrire)

| Source | Dit | Réalité mesurée |
|---|---|---|
| `WelcomeV13` | 4 moments (compteur → rôle → premier geste → plans) | existe, **création seule**, **ne montre PAS** les éléments cœur (carte/recherche/pin/fiche, échelle 0→4, mots de confiance) |
| App | aucune surface d'aide / légende / « comment ça marche » | **0 occurrence** (grep) |
| Maquette V2 | 74 écrans | **0** écran d'inscription/onboarding/aide → pattern **neuf**, mini-species requis |
| Seed §cœur | « index COMPLET et VIVANT, interrogeable par contraintes » | les **3 temps** : Découvrir → Interroger → Vérifier & transiger |
| `offer-existence.ts` | niveaux 3/4 = « Disponibilité confirmée » / « Disponible » | le Seed verrouille **`Disponibilité vivante` / `Transactable`** → écart de vocabulaire à corriger **dans** ce guide |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | `GU-1` mini-seed | la forme du guide est choisie par le fondateur | décision fondateur | `blocked` | choix non rendu |
| 2 | `GU-2` mini-species | maquette/pattern 1:1 (le pattern n'existe pas) | écran(s) + états | `planned` | direction changée |
| 3 | `GU-3` Root/Trunk | surface réelle + contenu dérivé (0 chiffre en dur) | code + rendu | `planned` | chiffre en dur |
| 4 | `GU-4` Heartwood | jamais bloquant, récupérable, états vides/erreur | test falsifié | `planned` | mur introduit |
| 5 | `GU-5` Ring | push + T-07d | hash prod === local | `planned` | déploiement |

## Dependency-aware task tree

| ID | Parent | Phase | Objective | Depends on | Status | Acceptance / proof | Risk/debt | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|
| GU-1-1 | GU-1 | mini-seed | cadrer le guide (éléments cœur, non-bloquant, récupérable) | — | `blocked` | décision fondateur (option A/B/C) | — | choix non rendu |
| GU-2-1 | GU-2 | mini-species | choisir la forme visuelle (dans l'accueil / spotlight / surface dédiée) | GU-1-1 | `planned` | direction acceptée | — | direction changée |
| GU-2-2 | GU-2 | mini-species | vocabulaire verrouillé (`Disponibilité vivante`/`Transactable`) | GU-2-1 | `planned` | mots S-06 | écart de vocabulaire | — |
| GU-3-1 | GU-3 | Trunk | surface + contenu dérivé (chiffres, statuts, échelle) | GU-2 | `planned` | rendu réel | chiffre en dur | — |
| GU-4-1 | GU-4 | Heartwood | non-bloquant + récupérable + états vides/erreur | GU-3 | `planned` | garde falsifié | mur | — |
| GU-5-1 | GU-5 | Ring | suite + gardes + push + T-07d | GU-4 | `planned` | hash === local | — | déploiement |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| 2026-10-14 | Demande fondateur = chiffres **+** guide ; `GUIDE-1a` livré, `1b` = le guide | `GU-1-1` ouvert | `pause` (attente choix de forme) | Nature Way | décision fondateur |
| 2026-10-14 | Maquette = 0 écran d'onboarding → pattern NEUF | `GU-2` requiert mini-species | `pause` | Nature Way | direction acceptée |

## Handoff to Founder HQ

> **Local status:** `blocked` (mini-seed : choix de la forme du guide par le fondateur)
> **Gate decision:** `pause`
> **Closed:** aucun
> **Open or blocked:** `GU-1-1` — bloqué sur la décision fondateur (option A/B/C) ; débloqueur = le fondateur choisit
> **Resource Receipt:** skills + templates + Seed + maquette + code (voir ci-dessus)
> **Residual gap:** la forme du guide n'est pas décidée ; pattern visuel absent de la maquette
> **Next smallest action:** présenter les 3 formes mesurées et laisser le fondateur choisir
> **Re-plan trigger:** le fondateur choisit une forme, ou change d'objet
