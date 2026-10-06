# Plan local — Cohérence UI (NW-PROD-OMNI-UI-01)

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Ordre fondateur :** « go ui » (2026-10-04).
> **Autorité :** `/nature-way` (product). **Entrée :** registre mesuré
> `docs/nature-way/omni-ui-issues-register-2026-10-04.md` + handoff `HO-OMNI-31`.
> **Définition de fini :** les dettes UI mesurées sont corrigées à la **source**
> (pas masquées), le **rendu est prouvé identique ou amélioré** au navigateur
> (4 largeurs + A/B), chaque règle neuve est **falsifiable**, hash prod === build (T-07d).

## Structural path
`product > Trunk > UI coherence > {css vocabulary, a11y/touch, honesty/dna, inline styles}`

## Périmètre
**IN :** `UI-1` (CSS mort), `UI-2` (cibles tactiles), `UI-3` (noms accessibles),
`UI-4` (caractères invisibles), `UI-7` (dérive de jetons), `UI-8` (styles inline), `UI-9` (libellé).
**OUT (décision fondateur) :** `UI-6` (libellés EN — vocabulaire produit à trancher) ;
`UI-5` (alert/confirm) traité seulement si sûr ; `UI-10` (maquette) porté dans l'autorité (voir clôture).

## Slices

| ID | Contenu | Risque | Preuve exigée |
|---|---|---|---|
| `UI-S0` | **Baseline A/B** — capture rendu (4 largeurs, parcours public) + styles calculés clés, AVANT toute modif | nul | JSON baseline + captures |
| `UI-S1` | **`UI-4`** — purger les 18 caractères invisibles (U+200B) | nul | grep 0 + tsc + suite |
| `UI-S2` | **`UI-3`** — `aria-label` sur les boutons icône-seule | nul | probe a11y = 0 sans nom |
| `UI-S3` | **`UI-7`** — aligner les jetons (`var(--accent)`, `--panel-deep`, `--warn`) | nul | grep + rendu identique |
| `UI-S4` | **`UI-2`** — cibles tactiles ≥ 44 px (dock, fiche, filtres, chips) | faible | mesure Playwright ≥ 44 |
| `UI-S5` | **`UI-1`** — décommissionner le CSS mort (3 fichiers → 1 vocabulaire) | **fait** | **A/B rendu identique** ✅ (1 338 empreintes, 0 diff) + garde `check:dead-css` |
| `UI-S6` | **`UI-8`** — migrer les styles inline vers classes (par lots) | **fait (portée)** | **A/B rendu identique** ✅ (0 couleur littérale restante) + garde `no-inline-colors.test.ts` |
| `UI-S7` | **`UI-9`** — libellé de secours du chunk aligné | nul | revue |

## Règles de la porte
- **A/B obligatoire** avant tout retrait de CSS : le rendu d'avant doit être capturé et comparé.
- Un garde qui ne peut pas échouer ne prouve rien → falsifier chaque garde neuf.
- Ne pas toucher la maquette (Species close) ni les contrats serveur (aucun ici).
- Bundles serverless inchangés (travail client pur) ; hash prod (T-07d) avant tout constat de déploiement.

## Re-plan
A/B non identique sur `UI-S5`/`UI-S6` → arrêter, isoler la règle, ne pas retirer en bloc.

---

## État au 2026-10-04

| ID | Statut | Preuve |
|---|---|---|
| `UI-S0` | **FAIT** | `scripts/prove-ui-ab.mjs` ; plancher de bruit **0** (base vs base) |
| `UI-S1` | **FAIT** | 39 caractères invisibles retirés ; garde `no-invisible-chars.test.ts` |
| `UI-S2` | **FAIT** | 6 boutons nommés ; garde `button-accessible-name.test.ts` |
| `UI-S3` | **FAIT** | replis morts retirés ; `#2E8B6F` → `var(--accent)` |
| `UI-S4` | **FERMÉ (mesuré)** | contrôles carte 44×44 ; chips/rolepill/btn.sm **sans action** — la maquette (autorité) est plus petite (21/23 px) et `design.md` les fige |
| `UI-S5` | **FAIT** | élagage règle-par-règle (méthode saine, A/B `RENDER IDENTICAL`) ; garde `check:dead-css` |
| `UI-S6` | **FAIT (portée)** | couleurs littérales inline → jetons (A/B identique) ; garde `no-inline-colors.test.ts` |
| `UI-S7` | **FERMÉ (sans action)** | le seul « Chargement… » vivant est un **statut carte** (contrainte : texte) ; le `<Suspense>` est mort (aucun `React.lazy`) |

**Commits :** `c077881` (S1..S3), `bdbfc2f` (S4), `97c377d` (UI-5).
**UI-5** fermé (4 dialogues natifs → toast + bannière inline ; garde `no-native-dialogs`).
**UI-6** fermé (lot FR appliqué ; garde `french-chrome` ; preuve navigateur avant/après).
**UI-1** (`3d44e13`) et **UI-8** (`5ce7686`) fermés — A/B `RENDER IDENTICAL` (1 338 empreintes), gardes `check:dead-css` + `no-inline-colors`. **UI-1..UI-9 fermées.**

## Clôture de porte — poussé et prouvé en prod (2026-10-06)

- **Push** `0a84596..27ffd55` puis `27ffd55..9223846` sur `origin/omni-v2-rebuild`.
- **T-07d ✅** : déploiement GitHub Production pour `27ffd55` (`2026-10-06T08:38Z`) ; prod `omni.sparkafrika.online` sert `index-CdqxKwwc.js` + `index-CDJ3y-XD.css` **byte-identiques** au build local (sha256 JS `27563d3b…`, CSS `6326f399…`). Smoke prod : HTML 200, `/api/v2/public/facilities` 200.
- **783/783 tests**, `tsc` propre, 6 gardes vertes.

## UI-10 — motif de chargement porté dans la maquette (2026-10-06)

- **Constat** : le Seed demande des états de chargement ; l'app avait le motif (`Skeleton.tsx`, 27 usages) mais la **maquette (autorité)** n'en avait aucun → l'autorité était muette sur une surface qu'elle exige. Décision : **porter dans la maquette** (garder l'autorité comme source unique) plutôt qu'acter l'écart.
- **Livré** : CSS `.skel` monochrome (`--panel`, jamais l'accent) + shimmer coupé en `prefers-reduced-motion` ; surface `state-slow` affiche 3 `hcard` + 2 `kv` avec `aria-busy`. **Aucun nouvel écran** (74 inchangés).
- **Preuve** : `scripts/prove-ui10-skeleton.mjs` **6/6** (couleur `#f7f7f7`, animation `skShimmer`, reduced-motion `none`) ; garde `check:maquette` §7 falsifié en 2 modes (retrait CSS, retrait du motif).
- **UI-1..UI-10 toutes fermées.**


