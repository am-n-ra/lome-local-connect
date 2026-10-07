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
| `DS-8` fidélité (menu buyer) | `MENU-02` noms/lieux du menu acheteur = maquette (8 entrées) | Relais (fait, **poussé** `b772042`) | **verified (prod)** | garde falsifié 14/14 + preuve navigateur 18/18 (session stubbée au bord auth, prouve aussi DOCK-05 famille compte) ; prod `index-BgD2DAcG.js` === local (T-07d ✅) |
| `DS-9` fidélité (lien saved) | `SEARCH-03` lien « Recherches sauvegardées » dans l'en-tête du sheet recherche | Relais (fait, **poussé** `b772042`) | **verified (prod)** | garde falsifié 16/16 + preuve navigateur 4/4 (mobile) ; `.linkbtn` dans le CSS prod (T-07d ✅) |
| `DS-10` fond (fraîcheur/D-03) | `SEARCH-02` fraîcheur **dérivée** de `availability_expires_at` (jamais stockée) ; `freshbar` rendue dans `results` ; projection SQL de la fenêtre du lieu | Relais (fait) | **verified** | module pur `offer-freshness.ts` (15 tests, **falsifié 3/3**) ; SQL exécuté sur la canonique ; garde `search-02-*` (selftest 18/18) ; 811/811 ; tsc + 6 gardes ; T-07d |
| `DS-11` correctif desktop | **Défaut fondateur** : sur PC, budget/quantité passaient *sur* le sélecteur de rôle. Cause mesurée : la barre de recherche était un **panneau de 346px** alors que la maquette (L238) la veut **pleine largeur** ; le contenu débordait jusqu'à `x=541` et recouvrait la pastille centrée (`x=485`). Corrigé 1:1 maquette : barre pleine largeur + **rolepill en haut à droite** + rangée de contraintes **clippée/défilable** (ne peut plus atteindre la pastille) ; `countmark` reposé sous la barre | Relais (fait) | **verified** | preuve navigateur `prove-desktop-search-layout.mjs` (1040/1280/1920 : rolepill dans la barre, **cliquable**, chevauchement visible 0) — **falsifiée** sur l'ancienne mise en page (`rolepillClickable=false`) ; garde `search-desktop-*` (selftest **20/20**) ; mobile 390 **inchangé** ; 811/811 ; tsc + 8 gardes |
| `DS-12` fond (fraîcheur vendeur) | **`SEARCH-02`/D-03 moitié VENDEUR + `MENU-01` « Fraîcheur de la dispo »** : l'écran maquette `fraicheur` (S-15/D-03) — dernière confirmation, seuil 4 h/24 h, badge affiché, « Reconfirmer maintenant ». **Route `setProductAvailability` (D-04 Pro-gated) existait sans AUCUN appelant UI** → un vendeur ne pouvait pas déclarer de dispo (0/16 transactables mesuré). Livré : sheet `freshness` (`SellerFreshnessV13`), entrée menu vendeur, fenêtre 4/12/24 h, badge **dérivé** (`badgeFor`), « Reconfirmer » par offre + tout ; réutilise `offer-freshness.ts` (déjà vivant côté acheteur) | Relais (fait, **poussé** `aecfe47`) | **verified (prod)** | **5 tests de contrat** `badgeFor` (frais/`stale`/expiré/`a_valider`/brouillon) + **1 smoke de montage** (sans session → état vide honnête, jamais « En stock ») ; garde `menu-01-freshness` + `search-02-seller-write` (selftest **23/23**) ; **817/817** ; tsc + 8 gardes |
| `DS-13` fond (`DOCK-02` reste) | **`op-side`** (maquette `op-side`, « Aperçu côté entité », lecture seule) — le dernier morceau de `DOCK-02`. Le dossier de tournée (`op-queue`) ouvre désormais « Voir ce que voit l'entité » → sheet `op-side` : **badge · offres publiées · demandes en attente** (les faits que l'entité voit), sans jamais écrire un badge (D-OPS-3). Repo `getOperatorEntitySide` (une requête, scope zone respecté, résolution `claim/verification` → lieu / `offer_report` → produit) + route `GET /api/v2/public/facilities?reviewer=op-side&visit=<id>` + `OperatorEntitySideV13` | Relais (fait, **poussé** `fd003cb`) | **verified (prod)** | **SQL réel exécuté sur branche jetable** (fixtures réelles, `verification` + `offer_report`, 0 résidu) ; **preuve navigateur 12/12** (dock `Tournée` → dossier → `op-side`, vrai GET observé) **falsifiée** (bouton retiré → 9 FAIL) ; garde `op-side-guard` (4 tests) **falsifié** (écriture injectée → FAIL) ; **821/821** ; tsc + 8 gardes |
| `DS-14` fond (`MENU-01` destination) | **`seller-verif`** (maquette « État de votre vérification ») — la surface **côté vendeur** de l'état de vérification de son entité. **Les données existaient déjà** (`v2_facilities/entities.trust_state`, `v2_verification_requests`, `v2_field_visits`) → **aucune migration**. Livré : repo `getSellerVerification` (une lecture owner-scopée, seuil par nature `::int`, visite vivante) + route `GET …/verification` + type client + module **pur** `verification-status.ts` (badge public dérivé — `certified` = palier INTERNE S-31 → « confirmée » ; étape dérivée) + sheet `SellerVerificationV13` + entrée menu vendeur « Vérification ». **Lecture seule (D-OPS-5)** : jamais contact acheteur ni message | Relais (fait) | **verified** | **SQL réel sur branche jetable** (owner résolu, non-owner 0 ligne, draft+visite reflétés, 0 résidu) ; **11 tests** module + garde de source (écriture injectée → FAIL) ; **3 tests de rendu** jsdom (`certified`→Confirmée, erreur non masquée) ; garde `menu-01-verification`+`seller-verif-derived` (selftest **25/25**) ; **835/835** ; tsc + 8 gardes |

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

Plan `NW-PROD-OMNI-DOCK-01` · porte Trunk · `DS-1 verified` · `DS-2 verified (b)` · `DS-3 verified` (tri + dock opérateur + menu vendeur + libellé buyer) · `DS-4 verified` (acter `DOCK-01`/`OPT-01` ; vocabulaire `MENU-03`/`OPT-02` corrigé) · `DS-5 verified` (garde 8 règles, selftest 8/8) · `DS-6 verified` (dock vendeur `DOCK-04`) · `DS-7 verified` (`DOCK-05` Retour famille compte ; garde 13 règles, selftest 13/13 ; preuve navigateur 8/8) · `DS-10 verified` (fraîcheur dérivée acheteur, D-03) · `DS-11 verified` (correctif desktop) · `DS-12 verified` (fraîcheur **vendeur** + `MENU-01` destination ; garde 22 règles, selftest 23/23) · `DS-13 verified` (`DOCK-02` reste — `op-side` aperçu entité lecture seule ; SQL réel + preuve navigateur 12/12 falsifiée + garde falsifié ; **poussé `fd003cb`, T-07d ✅**) · `DS-14 verified` (`MENU-01` destination **Vérification** — `SellerVerificationV13`, badge/étape dérivés, lecture seule ; SQL réel sur branche jetable + 11 tests module + 3 tests rendu + garde falsifié 25/25 ; **835/835**) · gap résiduel = `MENU-01` (destinations vendeur restantes sans écran) + `seller-automation` (sans modèle → décision) + `room` · owner = relais · prochaine action = prochaine tranche sur ordre.
