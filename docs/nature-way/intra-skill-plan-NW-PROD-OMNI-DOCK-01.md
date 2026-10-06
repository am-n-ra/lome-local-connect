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
| `DS-2` arbitrage direction | (a) aligner / (b) acter l'avance + combler le fond / (c) geler | **Fondateur** | **verified** — **(b)** | réponse fondateur |
| `DS-3` rattrapage fond | `SEARCH-01` tri résultats · `DOCK-02` dock opérateur terrain · `MENU-01` menu vendeur · `DOCK-03` libellé buyer | Relais (fait) | **verified** | code + preuve navigateur 28/28 + garde falsifié 6/6 + T-07d |
| `DS-4` fidélité/acte | `DOCK-01`/`OPT-01` (acter) · `OPT-02`/`MENU-03` (vocabulaire) | Relais (fait) | **verified** | décision consignée + correctif token + garde |
| `DS-5` garde | `dock-search-conformance` (falsifié 2 sens) | Relais (fait) | **verified** | exit 0/1 — `scripts/check-dock-search.mjs`, selftest 8/8 |
| `DS-6` fond (dock vendeur) | `DOCK-04` dock vendeur = Mon espace / Scanner le code d'un acheteur / Menu | Relais (fait) | **verified** | code + garde falsifié 9/9 ; rendu vendeur = spot-check fondateur |
| `DS-7` fond (Retour contextuel) | `DOCK-05` Retour sur tout écran non-home, **famille compte incluse** | Relais (fait) | **verified** | code + garde falsifié 13/13 + preuve navigateur 8/8 ; rendu compte = spot-check fondateur |
| `DS-8` fidélité (menu buyer) | `MENU-02` noms/lieux du menu acheteur = maquette (8 entrées) | Relais (fait, **non poussé**) | **verified (local)** | garde falsifié 14/14 + preuve navigateur 18/18 (session stubbée au bord auth, prouve aussi DOCK-05 famille compte) ; push bloqué par jeton |
| `DS-9` fidélité (lien saved) | `SEARCH-03` lien « Recherches sauvegardées » dans l'en-tête du sheet recherche | Relais (fait, **non poussé**) | **verified (local)** | garde falsifié 16/16 + preuve navigateur 4/4 (mobile) ; push bloqué par jeton |

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

Plan `NW-PROD-OMNI-DOCK-01` · porte Trunk · `DS-1 verified` · `DS-2 verified (b)` · `DS-3 verified` (tri + dock opérateur + menu vendeur + libellé buyer) · `DS-4 verified` (acter `DOCK-01`/`OPT-01` ; vocabulaire `MENU-03`/`OPT-02` corrigé) · `DS-5 verified` (garde 8 règles, selftest 8/8) · `DS-6 verified` (dock vendeur `DOCK-04`) · `DS-7 verified` (`DOCK-05` Retour famille compte ; garde 13 règles, selftest 13/13 ; preuve navigateur 8/8) · gap résiduel = `MENU-02`/`SEARCH-02`/`SEARCH-03` + écrans terrain opérateur · owner = relais · prochaine action = prochaine tranche sur ordre (T-07d franchi : prod `index-DYPk8L3_.js` === local).
