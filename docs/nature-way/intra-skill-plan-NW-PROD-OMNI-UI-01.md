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
`UI-5` (alert/confirm) traité seulement si sûr ; `UI-10` (maquette) = Species.

## Slices

| ID | Contenu | Risque | Preuve exigée |
|---|---|---|---|
| `UI-S0` | **Baseline A/B** — capture rendu (4 largeurs, parcours public) + styles calculés clés, AVANT toute modif | nul | JSON baseline + captures |
| `UI-S1` | **`UI-4`** — purger les 18 caractères invisibles (U+200B) | nul | grep 0 + tsc + suite |
| `UI-S2` | **`UI-3`** — `aria-label` sur les boutons icône-seule | nul | probe a11y = 0 sans nom |
| `UI-S3` | **`UI-7`** — aligner les jetons (`var(--accent)`, `--panel-deep`, `--warn`) | nul | grep + rendu identique |
| `UI-S4` | **`UI-2`** — cibles tactiles ≥ 44 px (dock, fiche, filtres, chips) | faible | mesure Playwright ≥ 44 |
| `UI-S5` | **`UI-1`** — décommissionner le CSS mort (3 fichiers → 1 vocabulaire) | **élevé** | **A/B rendu identique** (styles calculés + pixels) |
| `UI-S6` | **`UI-8`** — migrer les styles inline vers classes (par lots) | élevé | diff visuel nul par lot |
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
| `UI-S4` | **PARTIEL** | contrôles carte 44×44 (vérifié) ; chips/rolepill/btn.sm **à décider** |
| `UI-S5` | **RE-PLANIFIÉ** | détecteur « mort » non fiable (faux morts `active`/`sk-line`) ; exige mesure runtime sur **toutes** les feuilles → **déferré** |
| `UI-S6` | **NON FAIT** | dépend de `UI-S5` |
| `UI-S7` | **NON FAIT** | — |

**Commits :** `c077881` (S1..S3), `bdbfc2f` (S4), `97c377d` (UI-5). A/B pré/post = **`RENDER IDENTICAL`**.
**UI-5** fermé (4 dialogues natifs → toast + bannière inline ; garde `no-native-dialogs`).
**UI-6** mesuré : la maquette utilise **déjà le FR** (`Acheteur/Vendeur/Opérateur`) ; l'app diverge. Correctif prouvable mais **visible** → 1 lot à valider (hors règle RENDER IDENTICAL).


