# NW-PROD-OMNI-SKELETON-01 — Squelettes de chargement (Trunk, gate `ROOT_CLOSED_TRUNK_OPEN`)

**HQ plan parent :** `HO-OMNI-30` · **Skill :** `/nature-way` · **Phase :** Trunk (UI) · **Gate :** Trunk OUVERTE
**Slobjectif :** un **loading skeleton** là où l'attente masque du **contenu** ; jamais pour une action d'envoi.
**Rattachement Seed (H1) :** Seed V2, inventaire 2026-09-23 — « états vides / erreur / **chargement** » listés **absents** ; harm #5 « afficher du faux ou du vide illisible ».

## Resource Receipt
- **Loaded :** `references/intra-skill-execution-controller.md`, `references/visual-and-logic-coherence-review.md`, `references/anti-slop-and-debt-review.md`, `references/autonomous-delivery-gates.md`.
- **Template :** `templates/intra-skill-plan.md` (ce fichier).
- **Not loaded :** `system-dependency-map.md` (pas d'acteur/socle neuf), `launch-envelope.md` (pas de release).

## Mini-seed / mini-species / mini-root / mini-trunk / mini-heartwood
- **mini-seed :** l'utilisateur attend une **forme de contenu**, pas un mot. Remplacer « Chargement… » par un squelette qui **épouse** le contenu réel.
- **mini-species (héritage ADN obligatoire) :** monochrome (jamais `--accent`), tokens existants (`--panel`/`--panel-deep`), Inter, **`prefers-reduced-motion` ⇒ pas de shimmer**, tailles 1:1 avec les composants (`.hcard`, `.pitem`, `.kv`, `.cardbox`, `.stat`).
- **mini-root :** aucun contrat serveur. Primitive client pure `Skeleton` + classe CSS `.skeleton`.
- **mini-trunk :** primitive rendue + convertie sur les surfaces de contenu.
- **mini-heartwood :** `role="status"` + `aria-busy` conservés (a11y honnête) ; boutons d'action inchangés ; reduced-motion.

## Task tree

| ID | Objectif | Dépend | Statut | Critère d'acceptation | Preuve |
|---|---|---|---|---|---|
| `SK-0` | Inventaire des sites de chargement | — | `verified` | ~26 sites recensés, distinguer contenu vs action | grep (mesuré) |
| `SK-1` | Primitive `Skeleton` + CSS `.skeleton`/`.sk`/`.sk-shimmer` | — | `verified` | monochrome, reduced-motion, formes `line/card/hcard/pitem/kv/stat` | test unitaire rendu (6/6) + navigateur |
| `SK-2` | Convertir surfaces **contenu** (liste, fiche, wallet, activité, historique, demandes, favoris, admin, tournée, vendeur, catalogue, stock, bulk, offres, recovery, compagnie, entités, lieu) | SK-1 | `verified` | squelette 1:1, `role="status"` conservé | navigateur (squelette `sk-shimmer sk-pitem` rendu, 0 erreur) |
| `SK-3` | Laisser les **actions** (submit/publier/upload/claim) et le statut carte en libellé | SK-1 | `verified` | aucune régression action | revue + garde SK-4 |
| `SK-4` | Garde anti-régression : pas de « Chargement… » brut sur surface contenu | SK-2 | `verified` | test source | falsifié (retrait → FAIL) |

## Preuve (Heartwood, 2026-10-04)
- **Unitaire :** `Skeleton.test.tsx` 6/6 (role=status/aria-busy, formes, parité ADN, reduced-motion) ; `skeleton-coverage.test.ts` 2/2 (zéro `<p>Chargement…`, garde auto-falsifié).
- **Suite :** 773/773 (72 fichiers), `tsc` 0, 6 gardes PASS.
- **Navigateur (preview, viewport 390) :** recherche **entité** avec API throttlée → `.skeleton.sk-shimmer.sk-pitem` **rendu**, 0 `pageerror` ; contexte `reducedMotion: 'reduce'` → shimmer `animation: none; display: none`.
- **Falsification :** réintroduire `<p>Chargement…</p>` → garde SK-4 **FAIL** ; restauré → PASS.
- **Build :** `index-BwIkS1e-.js`.

## Risque / dette / re-plan
- **Risque :** sur-charger l'UI (squelettes trop voyants) → garder discret, monochrome, court.
- **Re-plan trigger :** le fondateur juge le squelette trop visible / pas assez ; un site de contenu manqué.
