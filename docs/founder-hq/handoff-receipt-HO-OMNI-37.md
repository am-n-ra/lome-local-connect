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

## Reste

- **Décision fondateur** : prochain item Heartwood **ou** ouverture du terrain (`TT-1`/`TT-2`/Gate 7) —
  le terrain reste **en dernier** par séquencement.
- Observé (déjà connu, non traité ici) : le bundle prod journalise des erreurs MapLibre
  (`Cannot read properties of null (reading '0')`, `Invalid LngLat`) sans `pageerror` bloquant — bruit
  worker de tuiles, à traiter séparément si le fondateur le souhaite.
