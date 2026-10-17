# Handoff Receipt — HO-OMNI-46

**Date:** 2026-10-17
**Gate:** `HEARTWOOD_CLOSED_BRANCHES_OPEN` (Branches OPEN — durcissement)
**Authority:** `/nature-way` (product/proof) · Founder HQ orchestration
**Plan local:** `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01.md`

## Dispatch Record

| Field | Value |
|---|---|
| Objective | Reprendre le plan « entrée/guide/reprise » à son plus petit pas non bloqué |
| Primary skill | `/nature-way` — Branches (durcissement), une fonctionnalité à la fois |
| Reason | Deux items mesurés dans le plan : `GR-1` (guide) et `GR-2` (reprise) |
| First gate | Vérifier l'état réel du code **avant** de planifier (le plan peut être périmé) |
| Secondary handoff | Aucun (pas de capital / opportunité / apprentissage en jeu) |

## Résultat de la passe

### `GR-1` — fermé (il était déjà corrigé ; il manquait la preuve)

Le plan portait `GR-1` en `ready`. **Mesure : le correctif existait déjà** (`GUIDE-1c`, `091104e`).
Le `ready` survivait parce que le seul harnais navigateur (`prove-guide-1b.mjs`) cliquait
**« Passer »** — il fermait le guide **sans jamais atteindre la 3ᵉ étape** (le dock), le cas même
du défaut. Nouveau harnais `scripts/prove-gr1-spotlight-dock.mjs` qui **avance réellement** :
**14 ok / 0 fail** (bulle du dock `placement=above`, entièrement visible à `390×844` et `390×667`).
**Falsifié** en restaurant le défaut d'origine → `top=840` sur `win=844` = **4 px visibles sur 128**,
la mesure exacte du 2026-10-15.

### `GR-2` — `partial` (volet RECHERCHE livré)

**Défaut réel mesuré** : au rechargement sur la feuille résultats, la recherche vivait **en mémoire**
→ la feuille se rouvrait **VIDE** (« 0 résultat » qui n'en est pas un). **Correctif** : la requête
voyage avec la surface et est **REJOUÉE** ; une feuille `results` **sans** requête n'est **pas**
restaurée. **Preuve** : requête réseau `q=pain` rejouée après rechargement (avant : 0 requête,
`sheet=none`). **Falsifié** (requête non persistée → 0 requête).

**Restent** (tranches séparées, **non faites**) : reprise du **guide** (`how-it-works` hors
`RESTORABLE_SHEETS`) et d'un **flux en cours** (étape de transaction).

## Évidence

| Élément | Valeur |
|---|---|
| Tests | **1343/1343** (169 fichiers) |
| Typecheck | `tsc -b` exit 0 |
| Gardes | 7 verts (`live-surface`, `dead-css`, `docs`, `coherence`, `boundary`, `maquette`, `state`) |
| Migrations | **aucune** |
| Preuves | `scripts/prove-gr1-spotlight-dock.mjs` (14/14, falsifié) · `scripts/probe-gr2-resume.mjs` (avant/après) |
| Gardes unitaires | `nav-state.test.ts` (+4, falsifié) · `search-reveal-steal.test.ts` **réparé** (fenêtre 400 car. → vrai bloc) |
| Dossier | `docs/nature-way/omni-gr1-gr2-guide-resume-evidence-2026-10-17.md` |

## Residual gap / blocker

- `GR-2` guide + flux en cours : **non faits** (tranches séparées).
- `GR-3` (**décision fondateur** : « accueil à chaque connexion » contredit « une seule fois »).
- `NT-1` : manifestation de la notification — **déjà répondu** (son du système OS), à documenter.
- `GUIDE-SPEC` : **bloqué** sur décision A/B/C (la maquette, 74 écrans, n'a **aucune** surface de guide).
- **Terrain (`TT-1`/`TT-2`/Gate 7) EN DERNIER** (décision fondateur 2026-10-07).

## Owner / next action

- **Owner** : relais (exécution), fondateur pour `GR-3` et `GUIDE-SPEC`.
- **Next smallest action** : `GR-2` suite — reprise du **flux en cours** (étape de transaction).

## Review trigger

Le fondateur tranche A/B/C (`GUIDE-SPEC`) ou `GR-3`, ou demande un badge de notification / un son.
