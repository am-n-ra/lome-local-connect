# Handoff receipt — HO-OMNI-31

> **Objet :** enregistrer l'**audit UI mesuré** (nouveau fait) et **dispatcher** la suite.
> **Skill primaire :** `/nature-way` (product authority — Trunk/UI). **Founder HQ ne
> fait pas le travail du spécialiste.**
> **As of :** 2026-10-04 (UTC). **Plan local :** `NW-PROD-OMNI-TRUNK-01` (Trunk, ouvert).

## Entrée (fait nouveau)

Le fondateur a demandé « identifie tous les problèmes de notre UI ». Audit **mesuré**
(scan statique + Playwright 4 largeurs, parcours public) → registre
`docs/nature-way/omni-ui-issues-register-2026-10-04.md` (commit `14c4fe9`, local).

**Mesuré propre :** 0 `pageerror`, 0 débordement, 0 échec de contraste, a11y de base
(noms, focus, `lang=fr`, « Bientôt » honnêtes), 27 squelettes + garde active, 0 TODO.

**10 dettes mesurées** — la plus lourde **`UI-1` : ~75 % du CSS de production est mort**
(`styles.css` 311/346 classes inutilisées ; `v3.css` 169/224) avec **3 vocabulaires
concurrents** alors que `design.md` n'en autorise qu'un. Puis cibles tactiles < 40 px,
12 boutons icône sans nom, 18 caractères invisibles, `alert/confirm` natifs, chrome en
anglais, dérive de jetons, 506 styles inline.

## Écart avec l'état de référence

Le **checkpoint fondateur** et la ligne de log du master plan datent du **2026-09-17**
(« 518 tests, prod `index-Bjl18UB3.js` ») alors que la vérité du dépôt est **2026-10-04**
(756/756, TF-6 clos, PWA Phase C). **Défaut de synchronisation HQ** — à corriger dans la
même passe (voir log master plan).

## Décision HQ

`advance` — dispatcher `/nature-way` pour **une tranche Trunk « cohérence UI »**
(ordre fondateur requis avant d'écrire du code). **Candidat le plus rentable :**
`UI-1` + `UI-8` (un seul chantier : tuer le CSS mort → un vocabulaire → migrer les
styles inline). Puis lot a11y/tactile (`UI-2`/`UI-3`/`UI-4`), puis honnêteté/ADN
(`UI-5`/`UI-6`/`UI-7`), puis finitions (`UI-9`/`UI-10`).

## Statut d'activation

| Champ | Valeur |
|---|---|
| Skill primaire | `/nature-way` |
| Activation | `user invocation required` — Founder HQ **ne simule pas** le spécialiste |
| Autorité / porte | Trunk (`ROOT_CLOSED_TRUNK_OPEN`) — UI/conformité |
| Ressource spécialiste requise | `references/visual-and-logic-coherence-review.md`, `references/anti-slop-and-debt-review.md`, `references/autonomous-delivery-gates.md` |
| Retour attendu | Plan local `NW-PROD-OMNI-UI-01` ; slices `UI-*` avec preuve navigateur + garde falsifié + hash prod (T-07d) |

## Gap résiduel / prochaine action

- **Décision fondateur :** ordonner la tranche UI (ou décliner) — c'est un **changement
  visuel**, donc non auto-démarré.
- **Écarté du code Trunk :** `TT-1`/`TT-2` (terrain, owner fondateur) restent ouverts ;
  ne pas les confondre avec la dette UI.
- **Prochain plus petit pas :** le fondateur dit « go UI » → `/nature-way` ouvre
  `NW-PROD-OMNI-UI-01` sur `UI-1`+`UI-8`.
