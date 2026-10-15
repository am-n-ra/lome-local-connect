# BRANCHES-SELLER-MENU — une destination par concept (2026-10-07)

**Gate :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`).
**Branche :** `omni-v2-rebuild`. **Commit :** `bfa0718`. **Prod :** `assets/index-DIyj5aoy.js` (T-07d ✅).

## Le défaut (mesuré, pas supposé)

Le fondateur : « dans les menus seller ce n'est pas trop complexe ? offres qui ne sont pas
dans offres mais dans catalog… et beaucoup d'autres surfaces différentes qui mélangent ou
séparent les choses… »

Comparaison **menu vendeur réel** ↔ **maquette (autorité)**
(`docs/maquette/omni-species-v2-interactive.html`, l.762) :

| Maquette (une liste propre) | App avant (mesuré, `TrunkAppV13`) |
|---|---|
| *Mes offres · catalogue & prix* — **un** concept | « Produits & stock » **et** « Offres » (deux entrées) |
| *(cet écran est titré « Catalogue »)* | `OffersV13` = cul-de-sac : **premier** produit seulement, bouton **désactivé** |
| — | « Mon espace » **et** « Transactions » → **même** écran `seller` |
| *Portefeuille & Plans* — **un** concept | « Portefeuille » **et** « Plans » (deux entrées) |
| *Fiche de l'entité* | « Compagnies » (nom divergent) |

Défaut connexe trouvé en lisant `CompanyV13` : un bouton **« Dispo auto »** y ouvrait en
réalité la feuille `offers` (« Prix & remise ») — **libellé qui ment** sur l'action.

## Ce qui a été fait (consolidation, pas de fondation neuve)

1. « Produits & stock » + « Offres » → **une** entrée **« Mes offres · catalogue & prix »**
   (l'entrée ouvre `products`, comme la maquette). L'écran mort `OffersV13` **supprimé**
   (fichier + cas `ui-helpers` + membre de l'union `Sheet` + import + rendu).
2. « Portefeuille » + « Plans » → **une** entrée **« Portefeuille & Plans »**.
   (`plans` reste atteignable : lien « Voir les plans » dans le menu **et** « Passer Pro »
   dans la feuille Portefeuille — pas d'écran orphelin.)
3. « Mon espace » / « Transactions » → **une** entrée (même écran `seller`).
4. « Compagnies » → **« Fiche de l'entité »** (aligné maquette) ; bouton menteur
   « Dispo auto » retiré de `CompanyV13` (+ prop `onOffers` morte supprimée).

**Périmètre respecté :** réorganiser + supprimer les doublons. Les écrans **absents**
(*Commandes*, *Stock alloué*, *Automatisation*) **n'ont pas été construits** — ce serait des
fondations neuves, hors gate.

## Garde falsifiable

`src/trunk/seller-menu-coherence.test.ts` (6 tests) verrouille : une entrée catalogue, une
entrée portefeuille, une entrée espace vendeur, « Fiche de l'entité » (jamais « Compagnies »),
et l'absence de toute trace de `offers`/`OffersV13`/`onOffers`/« Dispo auto ».

**Falsifié :** on réintroduit une entrée « Plans » dupliquée → **1 FAIL** ; restauré → 6 PASS.

## Preuves

- **Suite :** **1221/1221** (148 fichiers), `tsc` 0, 5 gardes verts
  (`check:state/docs/coherence/boundary/live-surface`).
- **Build :** `index-DIyj5aoy.js` — chaînes vérifiées **dans le bundle servi** :
  `Mes offres`=2, `catalogue & prix`=1, `Fiche de l'entité`=2, `Portefeuille & Plans`=1,
  `Dispo auto`=**0**, `Compagnies`=**0**, `Prix & remise`=**0**.
- **Déploiement (T-07d) :** prod est passée de `index-BZIyZROG.js` à **`index-DIyj5aoy.js`**.
- **Preuve navigateur prod, vendeur réel `demo@seller.omni` :**
  `npm run proof:branches-seller-menu` → **10/10 PASS** — plus d'« Offres » séparée, plus de
  « Produits & stock », « Mes offres · catalogue & prix » présent, « Portefeuille & Plans »
  fusionné, plus de « Compagnies », « Transactions » ne duplique plus, « Mes offres » ouvre
  `data-sheet=products`, fiche entité sans « Dispo auto », **0 erreur console**.

## Résidus honnêtes

- Le menu vendeur reste **plus court** que la maquette (13 entrées) : les écrans manquants
  (*Commandes*, *Stock alloué*, *Automatisation*, *Pro · renouvellement* dédié) restent des
  tranches **aval**, non demandées par cet ordre.
- « Transactions » a été **retiré** comme doublon ; il reste accessible via **Mon espace**
  (« demandes & transactions »). Si le fondateur veut une entrée dédiée à terme, c'est une
  décision, pas un correctif.
