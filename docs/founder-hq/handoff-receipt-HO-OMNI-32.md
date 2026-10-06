# Handoff receipt — HO-OMNI-32

> **Objet :** revue **mesurée** du dock de recherche + ce qui le compose (sheets par rôle, écrans, barre de recherche, options), puis dispatch de la tranche de rattrapage.
> **Skill primaire :** `/nature-way` (autorité produit — Trunk/UI). **Founder HQ ne fait pas le travail du spécialiste.**
> **As of :** 2026-10-06 (UTC). **HEAD :** `d336597`. **Plan local :** `NW-PROD-OMNI-DOCK-01` (Trunk, ouvert).

## Entrée (fait nouveau)

Ordre fondateur : « passer en revue tous les éléments du dock de recherche et tout ce qui le compose… tous les écrans… la barre de recherche acheteur et les options de paramétrage… tout ».

## Retour du spécialiste (`/nature-way`)

- **Plan :** `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-DOCK-01.md`
- **Registre :** `docs/nature-way/omni-dock-search-conformance-register-2026-10-06.md`
- **Preuve :** mesure code + Playwright 4 largeurs (buyer public) ; rôles authentifiés comparés code↔maquette (sandbox sans session).
- **Mesuré PROPRE :** dock ≥ 44 px, 3 familles de contraintes + 6 portées, rail desktop colonne, `sr-only` correct, 0 erreur console.
- **Écarts :** `SEARCH-01` tri résultats absent (Haute) · `DOCK-02` l'opérateur partage le dock admin, pas de dock terrain (Haute) · `MENU-01` menu vendeur mince (Haute) · `DOCK-03` libellé QR · `SEARCH-02` fraîcheur non état-codée · `OPT-01/02`, `MENU-02/03`.
- **Écrans :** app 33 sheets vs maquette 74 ; les vraies absences = le lot **opérateur terrain** (`op-queue/op-visit/op-report/op-side`) ; le reste est fusionné dans le `flow`/`home` app.
- **Gap résiduel :** arbitrage de direction — **une décision fondateur** ouvre la tranche.

## Décision HQ

`advance` → **bloqué sur une décision fondateur** (`DS-2`) : **(a)** aligner l'app sur la maquette, **(b)** acter l'avance de l'app + combler le fond, **(c)** geler. **Recommandation (hypothèse réversible) : (b)** — le tri et le dock opérateur sont des manques de fond ; le reste est de la fidélité.

## Statut d'activation

| Champ | Valeur |
|---|---|
| Skill primaire | `/nature-way` |
| Activation | `activated` (a exécuté `DS-1`) |
| Autorité / porte | Trunk (`ROOT_CLOSED_TRUNK_OPEN`) — UI/conformité |
| Ressource spécialiste | `references/visual-and-logic-coherence-review.md`, `references/anti-slop-and-debt-review.md` (chargées) |
| Retour attendu | `DS-1 verified` ; `DS-2` décision ; puis `DS-3` (tri + dock opérateur + menu vendeur) + garde falsifié + T-07d |

## Gap résiduel / prochaine action

- **Décision fondateur :** choisir (a)/(b)/(c) → ouvre `DS-3`.
- **Déplacé :** `TT-1`/`TT-2` (terrain, owner fondateur) restent ouverts ; cette revue les **nomme** sans les absorber.
- **Prochain plus petit pas :** le fondateur dit « go (b) » → `/nature-way` ouvre `DS-3` (tri des résultats + dock opérateur terrain + menu vendeur complet), garde `dock-search-conformance` falsifié.
