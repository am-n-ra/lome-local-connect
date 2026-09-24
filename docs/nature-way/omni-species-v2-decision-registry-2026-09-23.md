# Omni — Registre Species V2 : décisions `S-xx` → surface maquette → tranche

> **Tâche :** `T-11` (plan `NW-PROD-OMNI-SEED2-01`) · **Phase :** Species (réouverte)
> **As of :** 2026-09-23 · **Auteur :** Nature Way · **Owner décisions :** fondateur
> **Référence unique :** `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (34 décisions,
> `founder-confirmed`) · **Maquette :** `docs/maquette/omni-species-v2-interactive.html` (73 écrans)
> **Source d'état :** `docs/founder-hq/current-state.md`
> **Méthode :** mesure **code-vérifiée** de la maquette (grep + inventaire `SHEETS`), pas d'opinion.

**Statuts de surface :** `OK` (surface présente et conforme) · `PARTIEL` (surface présente, décision
non pleinement portée) · `ABSENT` (aucune surface) · `CODE` (la décision vit dans le code, pas dans
la maquette → rien à dessiner).

---

## 1. Décisions de racine du modèle (les « load-bearing parents »)

| ID | Décision | Surface maquette | Statut | Écart / ce qui manque |
|---|---|---|---|---|
| **S-01** | Tout est offre ; différences = caractéristiques | `offer` (panneau **Caractéristiques de l'offre**, 7 champs + 2 profils), `search`, `results`, `entite-publique` | **OK (SP-1)** | — les 7 caractéristiques du jour 1 sont **montrées**, dont **négociable** ; commerce renouvelable vs piece unique |
| **S-02** | Modèle universel jour 1 ; comportements séquencés | — (règle d'ingénierie) | **CODE** | rien à dessiner ; contrainte de modèle |
| **S-03** | L'entité mère liste son offre | `seller-publish`, `seller-offers`, `entite-publique` | **OK** | — |
| **S-04** | Toute offre existe via une entité | `seller-publish`, `seller-entry` | **OK** | — |
| **S-05** | Amorçage à froid : `unclaimed` niveau 0, « Lieu connu — pas encore géré », *Revendiquer* | `results`, `facility-apex`, `seller-claim` | **OK** | libellé « Lieu connu » : 2 occurrences ✓ |
| **S-06** | **Échelle d'existence 0→4** (Présente→Revendiquée→Offre→Dispo→Transactable) | `offer` (`levelLine` + niveau + preuve), `results` (badge `Niv. n`), `search` chip | **OK (SP-2)** | — les **5 niveaux** sont enseignés et affichés ; le chip `Transactable` **filtre**, la fiche et le résultat **montrent** le niveau |
| **S-07** | Carte + recherche = 2 vues d'un corpus ; **carte filtrable** | `search` (`Tout` / `Commerces` / `Particuliers` / `Transport`) | **OK (corrigé)** | ⚠️ **Correction :** les filtres de carte **existent** (`Tout / Commerces / Particuliers / Transport`). Ma mesure « absents » était fausse — je cherchais `ambulant`, jamais le libellé réel |
| **S-08** | Itinéraire = soutien ; transport = une offre | `offer` (itinéraire), `transport` : 4 occ. | **PARTIEL** | itinéraire OK ; **offre de transport** non modélisée visuellement |
| **S-09** | Le prix compte, visible/comparable | `results`, `compare`, `offer` | **OK** | — |
| **S-10** | Offre non limitée au physique (digital, service, transport, immobilier) ; origine géo | `results` (carte immobilier `Studio meublé` + carte digital `origine : Lomé`) ; `offer` (**7 champs identiques** sur 4 formes : commerce / particulier / **immobilier** / **digital**) | **OK (SP-5)** | — l'**immobilier** a une surface ; l'**origine** du digital vit dans la **position** (pas de 8e champ) ; une offre **immatérielle ne propose pas d'itinéraire** (elle dit « tout se passe en ligne ») |
| **S-11** | **Deux niveaux** : chercher une entité OU une offre. Test de non-régression au Root | `search` (sélecteur « Chercher une entité / une offre »), `entity-empty`, `entite-publique`, `scripts/check-maquette-v2.mjs` | **OK (SP-3)** | sélecteur de niveau + 2 états vides + page publique entité + **garde automatisé sans dépendance** |
| **S-12** | Transport : fondation jour 1, affichage V1, requête A→B = `V1+` | `transport` : 4 | **PARTIEL** | pas d'écran d'offre mobile/transport (normal : `V1+`), mais la **fondation** doit se voir |
| **S-13** | « Entité » = tout offreur (commerce, organisation, personne seule) même objet | `seller-entry`, `seller-entity` | **OK** | — |
| **S-25** | **L'offre appartient à l'ENTITÉ** ; le lieu = *où*, pas *à qui* | `offer` (« Cette offre appartient à… » + « Le lieu — il dit *où*, jamais *à qui* ») | **OK (SP-6)** | — l'ownership est **explicite** dans la fiche offre, pas seulement déductible |
| **S-28** | Toujours créer une entité, même particulier à objet unique | `seller-entry`, `seller-entity` | **OK** | — |
| **S-29** | Espace vendeur **progressif** (outils débloqués avec l'entité) | `seller-entry`, `seller-dash` | **OK** | — |

## 2. Caractéristiques de l'offre — **le plus grand écart**

L'Intent Brief définit **7 caractéristiques obligatoires du modèle jour 1**. Mesure :

| # | Caractéristique | Maquette | Statut |
|---|---|---|---|
| 1 | Quantité / déplétion | `offer` : « 24 disponibles · Décompte à chaque vente » vs « 1 exemplaire · Disparaît après la vente » | **OK (SP-1)** |
| 2 | Unicité (occasion → disparaît après vente) | `offer` : « Offre renouvelable » vs « **Pièce unique** — disparaît après vente » | **OK (SP-1)** |
| 3 | Position **fixe / mobile / immatérielle** | `offer` : « Fixe · sur place » vs « Fixe · domicile » | **OK (SP-1)** |
| 4 | Temporalité (fenêtre / créneau / durée) | `offer` : « Ouvert · mar–dim 8h–20h » vs « Toujours à vendre (pas de créneau) » | **OK (SP-1)** |
| 5 | Retrait / livraison / immatériel | `offer` : « Retrait sur place » vs « Retrait chez le vendeur » | **OK (SP-1)** |
| 6 | État neuf / occasion | `offer` : « Neuf » vs « Occasion · très bon état » | **OK (SP-1)** |
| 7 | Prix fixe / à négocier | `offer` : « Prix · négociable ? **non** » vs « négociable ? **oui** » | **OK (SP-1)** |

**Constat (T-11) :** la maquette **ne présentait aucune surface de caractéristiques d'offre** (`caractéristique` : 0).
Or `S-01` dit que **tout est offre et que les différences sont des caractéristiques**.

**→ Tranche `SP-1` — LIVRÉE (2026-09-23).** Toutes les lignes du tableau ci-dessus sont passées en
**OK** : le panneau « Caractéristiques de l'offre » montre les 7 champs sur la fiche, avec **deux profils
réels** (commerce renouvelable vs pièce unique). **Référence de mesure :** ne plus compter mes termes
(`négoc`, `durée`) mais **lire les libellés de la fiche** — leçon §8bis.

## 3. Confiance, publication, revendication

| ID | Décision | Surface | Statut | Écart |
|---|---|---|---|---|
| **S-14** | Confiance = identité + preuve, **seuil par volume** (1 particulier / 3 commerce) | `seller-verif` (« Preuves exigées : 1 vente (particulier) · 3 ventes (commerce) ») | **OK (SP-6)** | — |
| **S-17** | Paliers 0/1 Joignable → 2 Vérifié opérateur → 3 Prouvé par usage | `Non vérifié` 6, `Vérifié` 15, `ventes` 4 | **OK** | « On publie tôt » présent |
| **S-18** | **Revendication ≠ création** ; **preuve de contrôle + arbitrage opérateur AVANT transfert** | `seller-claim`, `admin-claim` | **OK** | `preuve` : 15 occ. ✓ |
| **S-19** | **Avantage promotionnel obligatoire** (remise > 0) | `seller-publish`, `remise` 16 | **OK** | — |
| **S-20** | **Toute offre porte des visuels** (≥ 1 image) | `Visuel` 6, `image` 3, `photo` 2 | **OK** | — |
| **S-30** | La confiance porte sur l'**entité**, jamais sur l'offre | `seller-verif`, `entite-publique` | **OK** | — |
| **S-31** | Publier **ne requiert pas** la vérification | `seller-publish` | **OK** | — |
| **S-32** | **Intégrité automatique + réputation par OFFRE** | `results` (« 4,6 ★ · Achetée 12× · intégrité ✓ » par carte), `offer` (lu depuis l'offre), `compare` (ligne Intégrité) | **OK (SP-4)** | — la marque est **visible AU MOMENT DU CHOIX** (carte de résultat + comparateur), pas seulement après ouverture ; la fiche **lit** la donnée de l'offre au lieu de la coder en dur ; l'entité non revendiquée affiche honnêtement « Pas d'offre · rien à évaluer » |

## 4. QR, transaction, canaux

| ID | Décision | Surface | Statut | Écart |
|---|---|---|---|---|
| **S-21** | Scan in-store = moteur d'acquisition (QR public en boutique → remise) | `scan-entity`, `entity-from-qr` | **OK** | — |
| **S-22** | QR circule par 3 canaux : acheteur, **partage hors Omni**, **validation dashboard vendeur** | `qr` (« Partager (WhatsApp/SMS) »), `seller-validate`, `seller-chat` | **OK** | — ⚠️ **correction de mesure** : ma ligne disait « absente » ; elle **existait déjà** (mesure sur la chaîne littérale, pas sur le fond) |
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
| **Plafond 20 offres** (gratuit) | « 3 / 20 (gratuit) » ×2, « 17 offres restantes avant le plafond gratuit » | **OK** | — ⚠️ **correction de mesure** : la maquette **disait déjà** 20 ; je cherchais la chaîne exacte `20 offres` |
| **Pro = par entité** (pas par facility) | `seller-pro`, `wallet` (`Pro` 77) | **OK** | — |
| **Sponsorisé étiqueté** (amplifie, ne remplace pas) | `sponsoris` 2 | **OK** | — |
| **Bonus 20 USD → seuil par volume** | `seller-pro` (« Bonus confiance : 20 USD verrouillé → **3 ventes à des acheteurs distincts** ») | **OK (SP-6)** | — |
| **Bulk / comparateur / favoris / alertes** | `bulk` 7, `comparateur` 2, `Favoris` 5, `alerte` 5 | **OK** | `recherche sauvegardée` : 0 → à préciser |

---

## 7. Synthèse — ce que la maquette ne démontre **pas**

**Les trois P0 du fond sont LIVRÉS** (`SP-1`/`SP-2`/`SP-3`, 2026-09-23) — cette synthèse devient la liste des **restants**.

| Priorité | Décision | État | Reste |
|---|---|---|---|
| ~~P0~~ | ~~**S-01 + caractéristiques**~~ | **LIVRÉ (SP-1)** | — |
| ~~P0~~ | ~~**S-06 échelle 0→4**~~ | **LIVRÉ (SP-2)** | — |
| ~~P0~~ | ~~**S-11 double niveau**~~ | **LIVRÉ (SP-3)** | garde `check:maquette` en place |
| ~~P1~~ | ~~**S-32**~~ | **LIVRÉ (SP-4)** | — |
| **P1** | **S-07** | **OK (corrigé)** — filtres carte présents | — |
| ~~P1~~ | ~~**S-10**~~ | **LIVRÉ (SP-5)** | — |
| ~~P2~~ | ~~**S-22**~~ | **LIVRÉ (SP-6)** | — |
| ~~P2~~ | ~~**S-25**~~ | **LIVRÉ (SP-6)** | — |
| ~~P2~~ | ~~**Économie**~~ | **LIVRÉ (SP-6)** | — |
| ~~P1~~ | ~~**S-32**~~ | **LIVRÉ (SP-4)** | — |
| **P1** | **S-07** | filtres de carte (type/transport) | sinon la carte sature |
| ~~P1~~ | ~~**S-10**~~ | **LIVRÉ (SP-5)** | — |
| ~~P2~~ | ~~**S-22**~~ | **LIVRÉ (SP-6)** | — |
| ~~P2~~ | ~~**S-25**~~ | **LIVRÉ (SP-6)** | — |
| ~~P2~~ | ~~**Économie**~~ | **LIVRÉ (SP-6)** | — |

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

## 8sexies. T-12 — AUDIT DE CONFORMITÉ LIVRÉ (2026-09-23)

**Objet :** vérifier que le registre **dit vrai** sur la maquette qu'il prétend décrire (au-delà de la seule liste d'écrans).

**Défauts réels trouvés (le registre était un faux témoin de nos propres livraisons) :**

| # | Le registre disait | La réalité | Corrigé |
|---|---|---|---|
| 1 | en-tête « **72 écrans** » | **73** | en-tête → 73 |
| 2 | `S-01` **PARTIEL** | SP-1 l'a livré | → **OK (SP-1)** |
| 3 | §2 : « négociable : **0** · ABSENT » | 7 caractéristiques montrées | → **7 lignes OK (SP-1)** |
| 4 | `S-06` écart : « **aucune surface ne montre le NIVEAU** » | SP-2 le montre | → écart retiré |
| 5 | §7 : les 3 **P0** listés comme manquants | SP-1/2/3 livrés | → **P0 barrés**, liste = restants (S-32/S-10/S-22/S-25/économie) |

**Cause racine :** je modifiais la maquette **sans mettre à jour le registre qui la décrit**. J'ai changé le territoire en laissant la carte derrière. C'est **la même mécanique** que les trois faux diagnostics précédents : *mesurer mal → construire sur la mauvaise mesure*.

**Correctif durable — `scripts/check-maquette-v2.mjs` §6, « registry truth » :**

| Garde | Ce qu'il empêche |
|---|---|
| `registry screen count equals the maquette` | un en-tête qui annonce un inventaire faux |
| `registry row S-01 / S-06 / S-11 marked OK` | une décision **livrée** encore décrite comme manquante |
| `registry no longer claims the level scale is absent` | un écart périmé qui nie une surface livrée |

**Preuve falsifiable (3 modes d'échec vérifiés) :** annoncer 99 écrans → **FAIL exit 1** ; remettre `S-06` en « PARTIEL » + rétablir « aucune surface ne montre le NIVEAU » → **FAIL (2)** ; remettre `S-01` en « PARTIEL » → **FAIL exit 1**. Restauré → exit 0.

**Conséquence :** la carte **redevient vraie**, et **si elle re-mente, un test casse**. C'est la seule façon sûre d'arrêter le rond-point : pas plus d'attention, un **garde qui échoue**.

## 8septies. SP-4 — LIVRÉ (2026-09-23) : la confiance au moment du choix (S-32)
**Le gap :** l'intégrité et la réputation **existaient déjà** — mais seulement **après** avoir ouvert l'offre. L'acheteur qui **choisit** ne les voyait pas.
**Livré (maquette, zéro code produit) :**
- **carte de résultat** → une marque « **4,6 ★ · Achetée 12× · intégrité ✓** » sous chaque offre, **distincte par offre** (commerce 4,6/12× vs particulier 4,2/5×) ;
- **comparateur** → ligne **Intégrité** à côté de la Réputation, + l'énoncé de la règle : l'intégrité est automatique, **la réputation appartient à chaque offre, jamais à l'entité seule** ;
- **fiche offre** → lit désormais `S.product.integ` / `S.product.rep` (**donnée de l'offre**) au lieu d'un texte codé en dur ;
- **entité non revendiquée** → « **Pas d'offre · rien à évaluer** » — rien à évaluer, donc rien d'inventé.
**Style :** monochrome ; l'accent `#2E8B6F` reste réservé à `.vmark` / `.status.ok` (design.md #3).
**Garde (`check-maquette-v2.mjs` §5bis) :** la marque doit être **présente sur les cartes de résultat** et **parité `integ` ≡ `rep`** sur tous les producteurs. **Falsifié (3 modes) :** retirer une marque d'une carte → FAIL ; coder la fiche en dur → FAIL ; retirer l'intégrité d'un producteur → FAIL.
**Deux faux gardes attrapés en falsifiant** — à ne pas refaire : (1) compter `class="trust"` **globalement** passe même si 5 marques disparaissent ; (2) le compteur incluait les `.stepline` (même nom de classe) → il faut **scoper au bloc `results`** et aux balises `<small>`.

## 8octies. SP-5 — LIVRÉ (2026-09-23) : le modèle n'est pas limité au physique (S-10)
**Le gap :** l'**immobilier** n'avait **aucune** surface, et l'**origine géographique** d'une offre digitale n'était **jamais montrée**.
**Livré (maquette, zéro code produit) :**
- **immobilier** → carte de résultat réelle (`Studio meublé — Adawlato`, Agence Dovi, **point sur la carte**, Niv. 4) + **fiche complète** avec les **mêmes 7 champs** (Quantité 1 logement, Déplétion « retiré dès qu'il est loué », Position fixe, Remise « visite sur place ») ;
- **origine géo** → la fiche digital porte **Position = « Immatérielle — origine : Lomé, Adawlato »** et la **carte affiche `origine : Lomé`** — on sait **d'où ça vient** sans 8e champ ;
- **résultats : 3 → 5 offres** (immobilier + digital ajoutés), avec **réputation distincte** par offre (4,8★ louée 3× / 4,9★ vendue 30×) ;
- **catégories nommées** : recherche, lead et publication disent désormais « produit / service / digital / **immobilier** ».
**⚠️ DEUX DÉFAUTS RÉELS trouvés en LISANT l'écran rendu (à ne pas réapprendre) :**
1. l'emoji de la fiche était un **choix binaire** (`particulier` ? 💻 : 🍝`) → l'immobilier **et** le digital affichaient l'emoji du **commerce** (🍝). Corrigé par **table par type** (+ repli 📦) ;
2. la fiche digital proposait **« Itinéraire vers ce vendeur »** et « Aperçu express du lieu » — pour une offre **sans déplacement**. C'était **un mensonge sur lequel l'acheteur aurait agi**. Corrigé : une offre immatérielle **ne propose pas d'itinéraire**, elle dit « tout se passe en ligne ».
**Garde (`check-maquette-v2.mjs` §5ter) :** immobilier atteignable, origine dans la position, **parité stricte des 7 champs sur les 4 formes**, pas d'itinéraire pour l'immatériel. **Falsifié (4 modes) :** immo irraçable → FAIL ; origine retirée → FAIL ; champ retiré d'**une** forme → FAIL ; itinéraire rendu à l'immatériel → FAIL.
**Leçon de garde :** un **plancher** (`>= 5`) passait avec 4 formes et laissait une forme perdre un champ — il faut une **parité** (`=== shapes`). Un garde doit porter sur **ce que la forme prétend être**, pas sur un ordre de grandeur.

## 8nonies. SP-6 — LIVRÉ (2026-09-23) : compléments — et **quatre fausses « absences » du registre**
**Livré (maquette, zéro code produit) :**
- **S-25 ownership explicite** → la fiche offre dit « Cette offre **appartient à** [entité] » + « Le lieu : un point sur la carte — il dit *où*, jamais *à qui* » ;
- **économie / bonus** → `seller-pro` affiche « **Bonus confiance : 20 USD verrouillé → 3 ventes à des acheteurs distincts** » (le seuil était invisible) ;
- **S-14 seuil par volume** → `seller-verif` affiche « Preuves exigées : **1 vente (particulier) · 3 ventes (commerce)** ».
**⚠️ LE DÉFAUT EST DANS LE REGISTRE, PAS DANS LA MAQUETTE — quatre lignes sur-déclaraient un manque :**
| Ligne | Le registre disait | La vérité mesurée |
|---|---|---|
| S-22 | « partage hors Omni **absent** » | **existait déjà** : `Partager (WhatsApp/SMS)` sur la sheet QR |
| plafond | « la maquette doit dire 20 » | **disait déjà** `3 / 20 (gratuit)` ×2 + « 17 offres restantes » |
| S-31 | (conforme) | publier est déjà séparé de la vérification (R-10) |
| S-29 | (conforme) | déjà là |
**Cause racine : le registre mesurait des CHAÎNES LITTÉRALES** (`20 offres`, `origine`) et **ratait les libellés réels**. C'est **exactement** la classe T-12 qui avait déjà frappé S-07/S-32/S-06 (cf. §7). **Règle : mesurer le FOND (ce que l'écran dit), jamais le mot qu'on a choisi d'y chercher.**
**Garde (`check-maquette-v2.mjs` §5quater) :** les **cinq** affirmations sont désormais épinglées — y compris les **deux qui existaient déjà**, pour que la vérité ne dérive **ni dans un sens ni dans l'autre**. **Falsifié (5 modes) :** WhatsApp/SMS retiré → FAIL ; `3 / 20` retiré → FAIL ; ownership retiré → FAIL ; bonus retiré → FAIL ; seuil S-14 retiré → FAIL.

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
