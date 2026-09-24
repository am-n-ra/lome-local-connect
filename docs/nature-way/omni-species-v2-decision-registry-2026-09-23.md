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
| **S-06** | **Échelle d'existence 0→4** (Présente→Revendiquée→Offre→Dispo→Transactable) | — | **ABSENT** | **`Discoverable`/`Queryable`/`Transactable` : 0 occurrence.** Aucune surface ne montre le **niveau** d'un lieu. C'est le concept structurant le plus visible qui manque |
| **S-07** | Carte + recherche = 2 vues d'un corpus ; **carte filtrable** | `home`, `search` | **PARTIEL** | carte présente ; **filtres de carte par type/transport : absents** (`ambulant` : 0) |
| **S-08** | Itinéraire = soutien ; transport = une offre | `offer` (itinéraire), `transport` : 4 occ. | **PARTIEL** | itinéraire OK ; **offre de transport** non modélisée visuellement |
| **S-09** | Le prix compte, visible/comparable | `results`, `compare`, `offer` | **OK** | — |
| **S-10** | Offre non limitée au physique (digital, service, transport, immobilier) ; origine géo | `digital` 1, `service` 6, `transport` 4, `immobilier` **0** | **PARTIEL** | **immobilier absent** ; **origine géographique d'une offre digitale non montrée** (`origine` : 0) |
| **S-11** | **Deux niveaux** : chercher une entité OU une offre. Test de non-régression au Root | `search` (une seule entrée) | **ABSENT** | **aucune UI ne distingue** « je cherche une entité » vs « je cherche une offre » (`Queryable` : 0) |
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
| **S-32** | **Intégrité automatique + réputation par OFFRE** | — | **ABSENT** | aucun badge d'intégrité, aucune réputation liée à l'offre sur `offer`/`results` |

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
| **P1** | **S-32** | intégrité + réputation **par offre** | sinon on retombe sur « entité vérifiée = offre sûre » |
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
