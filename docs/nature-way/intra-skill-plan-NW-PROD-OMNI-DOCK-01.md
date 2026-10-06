# Plan local — Dock · Recherche · Options · Menus (NW-PROD-OMNI-DOCK-01)

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** `/nature-way` (dispatché par Founder HQ, `HO-OMNI-31`).
> **As of :** 2026-10-06. **HEAD :** `48225a2`. **Autorité visuelle :** maquette Species V2 (74 écrans, CLOSE).
> **Objet :** revue **mesurée** de tout le dock de recherche et de ce qui le compose (sheets par rôle, écrans, barre de recherche, options de paramétrage), puis **une** tranche de rattrapage.

## Diagnostic de phase

- Le fond (Seed/Species/Root) est **acquis** ; nous sommes en **Trunk / Heartwood-Canopy** (cohérence app ↔ maquette).
- L'app n'est **pas** un prototype à remplacer : c'est la **banque de comportements éprouvés** (SDM §3). La maquette est la **banque de décisions produit**. On **réconcilie**.

## Slices

| ID | Contenu | Owner | Statut | Preuve exigée |
|---|---|---|---|---|
| `DS-1` inventaire mesuré | dock/rolepill/recherche/options/menus × 4 largeurs + diff écrans | Relais (fait) | **verified** | registre `omni-dock-search-conformance-register-2026-10-06.md` + `/tmp` captures |
| `DS-2` arbitrage direction | (a) aligner / (b) acter l'avance + combler le fond / (c) geler | **Fondateur** | **blocked** (décision) | réponse fondateur |
| `DS-3` rattrapage fond | `SEARCH-01` tri résultats · `DOCK-02` dock opérateur terrain · `MENU-01` menu vendeur | Relais (après DS-2) | **planned** | code + preuve navigateur + garde falsifié + T-07d |
| `DS-4` fidélité/acte | `DOCK-01`/`OPT-01` (acter) · `OPT-02`/`MENU-03` (vocabulaire) | Relais | **planned** | décision consignée, ou correctif token |
| `DS-5` garde | `dock-search-conformance` (falsifié 2 sens) | Relais | **planned** | exit 0/1 |

## Définition de fini

Dock, recherche, options et menus **conformes à l'autorité** (ou écart **acté par décision**) ; tri et dock opérateur **présents** ; garde vert ; hash prod === build (T-07d) ; verdict fondateur.

## Règles

- **H1 debout :** sans rattachement `S-xx`/décision, pas de code. `DS-3` exige `DS-2`.
- **Falsification obligatoire** sur chaque règle neuve ; garde falsifié 2 sens.
- Ne pas « corriger » ce qui est mesuré **propre** (§0 du registre) ni la densité 8–10px (design.md §2).
- Bundles serverless régénérés avec le source ; hash prod === build avant tout constat.

## Re-plan

Décision fondateur (DS-2), fait contredit, garde rouge, ou stop.

## Retour à Founder HQ

Plan `NW-PROD-OMNI-DOCK-01` · porte Trunk · `DS-1 verified` · `DS-2 blocked (décision)` · preuve registre + mesures · gap résiduel = arbitrage direction · owner = fondateur · prochaine action = choisir (a)/(b)/(c).
