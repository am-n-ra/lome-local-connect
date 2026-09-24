# Omni — Registre Species V2 : décisions `S-xx` → surface maquette → tranche

> **Tâche :** `T-11` (plan `NW-PROD-OMNI-SEED2-01`) · **Phase :** Species (réouverte)
> **As of :** 2026-09-23 · **Auteur :** Nature Way · **Owner décisions :** fondateur
> **Référence unique :** `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (34 décisions,
> `founder-confirmed`) · **Maquette :** `docs/maquette/omni-species-v2-interactive.html` (72 écrans)
> **Source d'état :** `docs/founder-hq/current-state.md`
> **Méthode :** mesure **code-vérifiée** de la maquette (grep + inventaire `SHEETS`), pas d'opinion.

**Statuts de surface :** `OK` (surface présente et conforme) · `PARTIEL` (surface présente, décision
non pleinement portée) · `ABSENT` (aucune surface) · `CODE` (la décision vit dans le code, pas dans
la maquette → rien à dessiner).

---

## 1. Décisions de racine du modèle (les « load-bearing parents »)

| ID | Décision | Surface maquette | Statut | Écart / ce qui manque |
|---|---|---|---|---|
| **S-01** | Tout est offre ; différences = caractéristiques | `search`, `results`, `entite-publique`, `offer` | **PARTIEL** | aucun écran ne **montre** les caractéristiques d'une offre (voir S-bloc §2) |
| **S-02** | Modèle universel jour 1 ; comportements séquencés | — (règle d'ingénierie) | **CODE** | rien à dessiner ; contrainte de modèle |
| **S-03** | L'entité mère liste son offre | `seller-publish`, `seller-offers`, `entite-publique` | **OK** | — |
| **S-04** | Toute offre existe via une entité | `seller-publish`, `seller-entry` | **OK** | — |
| **S-05** | Amorçage à froid : `unclaimed` niveau 0, « Lieu connu — pas encore géré », *Revendiquer* | `results`, `facility-apex`, `seller-claim` | **OK** | libellé « Lieu connu » : 2 occurrences ✓ |
| **S-06** | **Échelle d'existence 0→4** (Présente→Revendiquée→Offre→Dispo→Transactable) | `offer` (`levelLine` + niveau), `results` (badge `Niv. n`), `search` chip | **OK (SP-2)** | ⚠️ **Correction :** `Transactable` **existe** comme **chip de filtre** (`Discoverable`/`Queryable` : 0). Mais **aucune surface ne montre le NIVEAU d'un lieu** — le chip filtre, il n'enseigne pas l'échelle |
| **S-07** | Carte + recherche = 2 vues d'un corpus ; **carte filtrable** | `search` (`Tout` / `Commerces` / `Particuliers` / `Transport`) | **OK (corrigé)** | ⚠️ **Correction :** les filtres de carte **existent** (`Tout / Commerces / Particuliers / Transport`). Ma mesure « absents » était fausse — je cherchais `ambulant`, jamais le libellé réel |
| **S-08** | Itinéraire = soutien ; transport = une offre | `offer` (itinéraire), `transport` : 4 occ. | **PARTIEL** | itinéraire OK ; **offre de transport** non modélisée visuellement |
| **S-09** | Le prix compte, visible/comparable | `results`, `compare`, `offer` | **OK** | — |
| **S-10** | Offre non limitée au physique (digital, service, transport, immobilier) ; origine géo | `digital` 1, `service` 6, `transport` 4, `immobilier` **0** | **PARTIEL** | **immobilier absent** ; **origine géographique d'une offre digitale non montrée** (`origine` : 0) |
| **S-11** | **Deux niveaux** : chercher une entité OU une offre. Test de non-régression au Root | `search` (sélecteur « Chercher une entité / une offre »), `entity-empty`, `entite-publique`, `scripts/check-maquette-v2.mjs` | **OK (SP-3)** | sélecteur de niveau + 2 états vides + page publique entité + **garde automatisé sans dépendance** |
| **S-12** | Transport : fondation jour 1, affichage V1, requête A→B = `V1+` | `transport` : 4 | **PARTIEL** | pas d'écran d'offre mobile/transport (normal : `V1+`), mais la **fondation** doit se voir |
| **S-13** | « Entité » = tout offreur (commerce, organisation, personne seule) même objet | `seller-entry`, `seller-entity` | **OK** | — |
| **S-25** | **L'offre appartient à l'ENTITÉ** ; le lieu = *où*, pas *à qui* | `entite-publique`, `offer`, `seller-offers` | **PARTIEL** | `entite-publique` existe ✓ mais l'ownership entité n'est pas **explicite** dans la fiche offre |
| **S-28** | Toujours créer une entité, même particulier à objet unique | `seller-entry`, `seller-entity` | **OK** | — |
| **S-29** | Espace vendeur **progressif** (outils débloqués avec l'entité) | `seller-entry`, `seller-dash` | **OK** | — |

## 2. Caractéristiques de l'offre — **le plus grand écart**

L'Intent Brief définit **7 caractéristiques obligatoires du modèle jour 1**. Mesure :

| # | Caractéristique | Maquette | Statut |
|---|---|---|---|
| 1 | Quantité / déplétion | `produit-multi`, `seller-stock` | **PARTIEL** — quantité présente, **déplétion non montrée** |
| 2 | Unicité (occasion → disparaît après vente) | `occasion` : 1 | **PARTIEL** — pas de comportement « unique » |
| 3 | Position **fixe / mobile / immatérielle** | `mobile` 5, `ambulant` 0 | **PARTIEL** — valeur modélisée en code (`S-25`), **pas montrée** |
| 4 | Temporalité (fenêtre / créneau / durée) | `créneau` 2, `durée` 0 | **PARTIEL** |
| 5 | Retrait / livraison / immatériel | `retrait` 11, `livraison` 6 | **OK** |
| 6 | État neuf / occasion | `occasion` 1 | **PARTIEL** |
| 7 | Prix fixe / à négocier | `négoc` : **0** | **ABSENT** |

**Constat :** la maquette **ne présente aucune surface de caractéristiques d'offre** (`caractéristique` : 0).
Or `S-01` dit que **tout est offre et que les différences sont des caractéristiques**. Sans surface,
la décision la plus structurante du modèle n'est **pas démontrée** au fondateur.

**→ Tranche proposée `SP-1` : écran/panneau « Caractéristiques de l'offre » (7 champs + badge
« unique » + position + temporalité + négociable).** Si cette surface n'existe pas, la maquette ne
démontre pas `S-01` — et c'est exactement le grief fondateur « le fond qui fait d'Omni omni ».

## 3. Confiance, publication, revendication

| ID | Décision | Surface | Statut | Écart |
|---|---|---|---|---|
| **S-14** | Confiance = identité + preuve, **seuil par volume** (1 particulier / 3 commerce) | `seller-verif`, `code` | **PARTIEL** | seuil par volume non montré |
| **S-17** | Paliers 0/1 Joignable → 2 Vérifié opérateur → 3 Prouvé par usage | `Non vérifié` 6, `Vérifié` 15, `ventes` 4 | **OK** | « On publie tôt » présent |
| **S-18** | **Revendication ≠ création** ; **preuve de contrôle + arbitrage opérateur AVANT transfert** | `seller-claim`, `admin-claim` | **OK** | `preuve` : 15 occ. ✓ |
| **S-19** | **Avantage promotionnel obligatoire** (remise > 0) | `seller-publish`, `remise` 16 | **OK** | — |
| **S-20** | **Toute offre porte des visuels** (≥ 1 image) | `Visuel` 6, `image` 3, `photo` 2 | **OK** | — |
| **S-30** | La confiance porte sur l'**entité**, jamais sur l'offre | `seller-verif`, `entite-publique` | **OK** | — |
| **S-31** | Publier **ne requiert pas** la vérification | `seller-publish` | **OK** | — |
| **S-32** | **Intégrité automatique + réputation par OFFRE** | `offer` (`Intégrité de l'offre` ×1, `Réputation de l'offre` ×2) | **PARTIEL (corrigé)** | ⚠️ **Correction de mesure :** ma mesure initiale « ABSENT » était **fausse** — elle cherchait `badge`/`intégrité` et **ratait** les libellés réels `Intégrité de l'offre` / `Réputation de l'offre`, présents sur la **fiche offre**. En outre `results` **énonce** « chaque offre porte un visuel, un avantage Omni et une réputation propre (S-32) ». Reste partiel : pas de **badge par carte** sur `results` → l'acheteur ne voit pas la réputation **au moment de choisir** |

## 4. QR, transaction, canaux

| ID | Décision | Surface | Statut | Écart |
|---|---|---|---|---|
| **S-21** | Scan in-store = moteur d'acquisition (QR public en boutique → remise) | `scan-entity`, `entity-from-qr` | **OK** | — |
| **S-22** | QR circule par 3 canaux : acheteur, **partage hors Omni**, **validation dashboard vendeur** | `qr`, `seller-validate`, `seller-chat` | **PARTIEL** | **« partage hors Omni » (WhatsApp/SMS) absent** ; validation dashboard ✓ |
| **S-23** | QR lié à offre + user + transaction ; avantage appliqué par l'offre | `qr`, `txn-proof` | **CODE** | vérifié en base (`v2_qr_tokens` → snapshot) |
| **S-24** | Scan du code acheteur **strictement vendeur** ; acheteur a une icône scan | `seller-scan`, `scan-entity`, `menu` | **OK** | asymétrie respectée ✓ |
| **S-26** | Chaque transaction = **version de l'offre** (prix+coupon gelés) | `txn-proof`, `recu` | **CODE** | vérifié (`v2_transaction_snapshots`) |
| **S-27** | Dashboard vendeur + scan = strictement vendeur ; acheteur voit « Code validé » | `seller-validate`, `txn-track`, `room` | **OK** | — |

## 5. Identité, entrée, coût

| ID | Décision | Surface | Statut | Écart |
|---|---|---|---|---|
| **S-15** | **Coût marginal fondateur = 0** (contrainte 1er ordre) | — (règle) | **CODE** | `S-15-exception` routage : OSRM par défaut — **décision à acter** |
| **S-16** | Inscription **téléphone-first** ; email OTP ; numéro via **WhatsApp** ; SMS payant exclu | `auth`, `WhatsApp` 3, `OTP` 2, `numéro` 2 | **OK** | — |

## 6. Modèle économique (boucle F) — la maquette est **en avance** sur le code

| Élément | Surface | Statut | Écart |
|---|---|---|---|
| **Plafond 20 offres** (gratuit) | `plafond` : 1 | **PARTIEL** | la maquette doit **dire** 20 (`20 offres` : 0) |
| **Pro = par entité** (pas par facility) | `seller-pro`, `wallet` (`Pro` 77) | **OK** | — |
| **Sponsorisé étiqueté** (amplifie, ne remplace pas) | `sponsoris` 2 | **OK** | — |
| **Bonus 20 USD → seuil par volume** | `seller-pro` | **PARTIEL** | seuil volume non montré |
| **Bulk / comparateur / favoris / alertes** | `bulk` 7, `comparateur` 2, `Favoris` 5, `alerte` 5 | **OK** | `recherche sauvegardée` : 0 → à préciser |

---

## 7. Synthèse — ce que la maquette ne démontre **pas**

| Priorité | Décision | Manque | Pourquoi c'est bloquant |
|---|---|---|---|
| **P0** | **S-01 + caractéristiques** | surface des 7 caractéristiques (dont **négociable** : 0, **durée** : 0, **unicité**, **déplétion**) | **c'est le modèle** — sans lui, « tout est offre » n'est pas démontré |
| **P0** | **S-06** | échelle 0→4 (0 occurrence) | concept de niveau d'existence = cœur de la lecture d'un lieu |
| **P0** | **S-11** | double niveau entité / offre | décision explicite du fondateur + test de non-régression au Root |
| **P1** | **S-32** | intégrité + réputation **visibles au choix** (déjà sur la fiche) | sinon l'acheteur ne les voit qu'**après** avoir ouvert l'offre |
| **P1** | **S-07** | filtres de carte (type/transport) | sinon la carte sature |
| **P1** | **S-10** | immobilier + **origine géo du digital** | promesse « d'où ça vient » |
| **P2** | **S-22** | partage hors Omni (WhatsApp/SMS) | canal d'acquisition |
| **P2** | **S-25** | ownership entité explicite dans la fiche offre | sinon on retombe sur la facility |
| **P2** | Économie | plafond 20 affiché, seuil bonus par volume | honnêteté du plan |

## 8. Tranches proposées (Species V2) — **aucun code**

| Tranche | Contenu | Ferme |
|---|---|---|
| **SP-1** | **Panneau « Caractéristiques de l'offre »** (7 champs + unique + position + temporalité + négociable + déplétion) | S-01, modèle jour 1 |
| **SP-2** | **Badge/stepper « Niveau d'existence 0→4 »** sur résultat + fiche | S-06 |
| **SP-3** | **Sélecteur de niveau de recherche** (entité / offre) + état vide de chaque | S-11 |
| **SP-4** | **Intégrité automatique + réputation par offre** (badge sur hôte et résultat) | S-32 |
| **SP-5** | **Filtres de carte** (tout / transport / type d'entité) | S-07, S-10 |
| **SP-6** | **Compléments** : partage hors Omni, ownership entité, plafond 20, seuil bonus | S-22, S-25, économie |

**Ordre :** SP-1 → SP-2 → SP-3 (le fond) → SP-4/SP-5 → SP-6.
Chaque tranche = mini-species (surface), puis T-12 vérifiera la cohérence.

## 8bis. Corrections de mesure (T-11b — vérification navigateur)

> **Leçon :** mesurer par `grep` **seul** produit des faux négatifs. Le premier registre sous-estimait
> **S-07**, **S-32** et **S-06** parce qu'il cherchait mes **termes**, pas les **libellés réels** de la
> maquette. La vérification dans le navigateur a démenti trois lignes. Corrigé ; **la méthode est
> désormais : grep → ouvrir l'écran → lire le libellé**.

| Ligne | Mesure initiale | Réalité vérifiée | Leçon |
|---|---|---|---|
| **S-07** | « filtres carte absents » | filtres `Tout / Commerces / Particuliers / Transport` **présents** | je cherchais `ambulant`, pas le libellé |
| **S-32** | « ABSENT » | `Intégrité de l'offre` + `Réputation de l'offre` **sur la fiche**, + énoncé sur `results` | je cherchais `badge`/`intégrité` sans accent/pluriel |
| **S-06** | « ABSENT » | chip `Transactable` **présent** (filtre) | le mot existait, en filtre |

## 8ter. SP-1 — LIVRÉ (2026-09-23), preuve navigateur

**Tranche `SP-1` : panneau « Caractéristiques de l'offre »** sur la fiche offre — les 7 caractéristiques du modèle jour 1.

| Caractéristique | Commerce (Kodjo) | Particulier (Awa T.) |
|---|---|---|
| Quantité | 24 disponibles | 1 exemplaire |
| Déplétion | Décompte à chaque vente | Disparaît après la vente |
| **Unicité** | Offre renouvelable | **Pièce unique** |
| Position | Fixe · sur place | Fixe · domicile |
| Temporalité | Ouvert · mar–dim 8h–20h | Toujours à vendre (pas de créneau) |
| État | Neuf | Occasion · très bon état |
| **Prix / négociable** | Fixe · négociable ? **non** | Fixe · négociable ? **oui** |

**Preuve :** maquette rechargée → fiche offre ouverte → panneau rendu avec les 7 champs, **les deux
profils** (commerce renouvelable vs pièce unique) ; JS `node --check` **OK**, **72 écrans** intacts, 0 doublon.

**Bug réel trouvé et corrigé en livrant SP-1 :** `openOffer()` réaffectait `S.product` **sans** le champ
`carac` → la fiche offre aurait **planté** (`Cannot read properties of undefined`). La version commerce
passait par chance (objet initial complet) ; la version **particulier** aurait cassé. Corrigé : les deux
profils portent leurs caractéristiques. **Un champ ajouté à un objet partagé doit être ajouté à TOUS
ses producteurs, pas seulement à l'initialiseur.**

**Reste :** `S-01` passe de **PARTIEL** à **OK** sur la fiche ; la démonstration **au niveau `results`**
(badge par carte) reste `SP-4`.

## 8quater. SP-2 — LIVRÉ (2026-09-23), preuve navigateur

**Tranche `SP-2` : échelle d'existence 0→4**, enseignée et affichée.

| Niveau | Libellé | Signification |
|---|---|---|
| 0 | **Présente** | sur la carte, pas encore gérée |
| 1 | **Revendiquée** | une entité en a pris la responsabilité |
| 2 | **Offre publiée** | stock déclaré, non confirmé |
| 3 | **Disponibilité vivante** | confirmée récemment |
| 4 | **Transactable** | transaction Omni possible maintenant |

**Surfaces :** (a) **fiche offre** — bloc « Niveau d'existence » avec les 5 segments (`levelLine`), le **numéro**, le **libellé** et la **preuve** qui date le niveau ; (b) **cartes de résultat** — badge `Niv. n · libellé` sur chaque offre.

**Preuve mesurée (navigateur) :**

| Offre | Carte résultat | Fiche (niveau + preuve) |
|---|---|---|
| Spaghetti (Kodjo) | `En stock` · `Niv. 4 · Transactable` | **Niveau 4 · Transactable** — confirmée il y a 2 h |
| Ordinateur (Awa T.) | `Niv. 2 · À confirmer` | **Niveau 2 · Offre publiée** — déclarée, pas encore confirmée |
| Épicerie du Port | `Niv. 0 · Non revendiquée` | (écran non-gérée) |

**Deux bugs réels trouvés et corrigés en livrant SP-2 :**

1. **Décalage de numérotation** — `LEVELS` était indexé en **base 1** alors que `level` est un **numéro en base 0** : la fiche affichait « **Niveau 5** » (hors échelle 0→4) puis « Niveau 2 · **Revendiquée** » au lieu d'« Offre publiée ». **Le modèle d'indexation est le même que celui où j'avais déjà glissé.** Corrigé : `level` = numéro, barres allumées = `level + 1`, libellé = `LEVELS[level]`.
2. **Incohérence préexistante révélée** — le statut d'en-tête de la fiche était **hardcodé « À confirmer »**, donc la même offre était « **En stock** » dans les résultats et « **À confirmer** » sur sa fiche. Corrigé : le statut est **dérivé du niveau** (`level >= 3` → En stock). **Ajouter une dimension (le niveau) révèle les contradictions qu'un champ hardcodé masquait.**

**Preuve technique :** JS `node --check` **OK**, **72 écrans** intacts, 0 doublon défini ; rendu vérifié en navigateur sur les **3 surfaces × 2 profils**.

## 8quinquies. SP-3 — LIVRÉ (2026-09-23), preuve navigateur + garde auto

**Tranche `SP-3` : double niveau entité / offre (S-11).**

- **Sélecteur de niveau** sur la recherche : `Chercher une entité` / `Chercher une offre`. Le **placeholder**, la **phrase** et le **bouton principal** changent ; en mode entité les **contraintes d'offre** (distance, budget, quantité, …) sont **masquées** (prouvé par style calculé : `OBLOCK_DISPLAY=none,none`).
- **Deux états vides distincts** : `results-empty` (offre) et **`entity-empty`** (entité) — ce dernier propose si le lieu est **reconnu** de le **revendiquer**.
- **Page publique de l'entité** (`entite-publique`) enrichie : **Nature** (« commerce · même objet qu'une personne seule », S-13/S-17), **Niveau de l'entité** (S-14), et **Ses offres** avec leur niveau. La phrase assume la règle : **la confiance porte sur l'entité ; la réputation, sur chaque offre** (S-12).
- **Bandeau de rattachement** sur les résultats : « vous êtes au niveau **offre** — les entités derrière ces offres sont accessibles en un tap ».

**Test de non-régression (exigé par S-11) — `scripts/check-maquette-v2.mjs`**
Zéro dépendance (pas de `node_modules`, pas de réseau), câblé en `npm run check:maquette`. Il garde les **deux défauts réels** rencontrés en livrant les tranches :

| Garde | Défaut qu'il empêche |
|---|---|
| inventaire des `SHEET` **sans doublon** et **non réduit** | perte silencieuse d'un écran (`entity-empty` était bien **absent** d'un premier jet) |
| `LEVELS[lv]` **et jamais** `LEVELS[lv - 1]` | le **décalage base 0 / base 1** qui a produit « Niveau 5 » hors échelle |
| échelle = **exactement 5 niveaux** | échelle tronquée |
| parité **`carac` équivaut `level`** sur tous les producteurs | le crash `undefined` de SP-1 (champ ajouté à un producteur, pas aux autres) |

**Preuve falsifiable :** en réintroduisant `LEVELS[lv - 1]` → **FAIL exit 1** ; en retirant `entity-empty` → **FAIL (2)** « inventaire réduit » + « état vide entité absent ». **Un test qui ne peut pas échouer ne prouve rien** — les deux modes d'échec ont été **vérifiés**.

**Preuve navigateur :** `entity-search` (état entité actif, contraintes masquées) · `entity-empty` (état vide + revendication) · `entite-publique` (nature + niveau + ses offres).
**Preuve technique :** JS `node --check` **OK**, **73 écrans**, **0 doublon**, `check:maquette` vert.

## 9. Resource Receipt

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way/references/visual-and-logic-coherence-review.md` (déclenché par T-11/T-12) |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Loaded | `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (source : 34 décisions) |
| Loaded | `docs/maquette/omni-species-v2-interactive.html` (mesure : 72 `SHEETS`) |
| Loaded | `docs/founder-hq/current-state.md` (source d'état) |
| Not loaded / reason | `technical-lead-production-review.md` — phase Root non active |

## 10. Retour à Founder HQ

| Champ | Valeur |
|---|---|
| HQ plan | `HQ-OMNI-2026-09-02` · **porte courante : Seed/Species réouverte** |
| Plan local | `NW-PROD-OMNI-SEED2-01` · **T-11 `done`** |
| Décision demandée | **valider SP-1…SP-6 et l'ordre** (SP-1 → SP-2 → SP-3 en premier) |
| Preuve | ce registre (34 décisions cartographiées, 0 orpheline) |
| Gap résiduel | la maquette **ne démontre pas** S-01/S-06/S-11/S-32 → Species **non close** |
| Prochaine action | **fondateur valide SP-1…SP-3** → je produis les surfaces → T-12 audit de conformité |
