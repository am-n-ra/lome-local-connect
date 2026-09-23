# Audit d'écrans — Species V2 (prototype interactif) vs registre MV1

**Date :** 2026-09-23 · **Artefact :** `docs/maquette/omni-species-v2-interactive.html` (52 écrans)
**Référence :** `docs/omni-v1-screen-and-state-specification.md` §4 — registre officiel
**Statuts :** PRESENT · PARTIEL · ABSENT

---

## 1. ACHETEUR (B01–B20)

| # | Écran MV1 | Statut | Écran prototype | Manque |
|---|---|---|---|---|
| B01 | Map Home | **PARTIEL** | carte toujours visible | pas d'état « accueil » dédié (carte + compteur au repos) |
| B02 | Search | **PRESENT** | `search` | — |
| B03 | Search Constraints | **PRESENT** | chips `search` | — |
| B04 | Search Results | **PRESENT** | `results` + `results-empty` + `state-slow` + `state-error` | tri/raffinement fin |
| B05 | Facility Preview | **PARTIEL** | `entite-publique` | pas d'aperçu *au survol/depuis la carte* |
| B06 | Facility Page | **PRESENT** | `entite-publique` | — |
| B07 | Product Selection | **PRESENT** | `produit-multi` | — |
| B08 | Availability Builder | **PRESENT** | `avail` | — |
| B09 | Availability Pending | **PRESENT** | `pending` | — |
| B10 | Availability Result | **PRESENT** | `reply` | réponse multi-produits ligne à ligne |
| B11 | Multi-Facility Comparison | **PRESENT** | `compare` + `bulk` | — |
| B12 | Purchase Intent | **PRESENT** | `intent` | — |
| B13 | Transaction Room | **PARTIEL** | `txn-track` | **pas de ROOM acheteur unifiée (suivi + chat + actions au même endroit)** — le chat n'existe que côté vendeur |
| B14 | Transaction QR | **PRESENT** | `qr` | — |
| B15 | Payment | **PRESENT** | `pay` + `txn-proof` | — |
| B16 | Fulfilment | **PRESENT** | `remise` | — |
| B17 | Completed Transaction | **PARTIEL** | `rate` clôture | pas d'écran « transaction terminée » / reçu |
| B18 | Transaction History | **ABSENT** | — | **historique des transactions clôturées** |
| B19 | Saved Searches | **PRESENT** | `saved` | — |
| B20 | Buyer Account | **PRESENT** | `account` | — |

**Bilan acheteur : 15 PRESENT · 4 PARTIEL · 1 ABSENT**

---

## 2. VENDEUR (S01–S15)

| # | Écran MV1 | Statut | Écran prototype | Manque |
|---|---|---|---|---|
| S01 | Seller Home | **PRESENT** | `seller-dash` | — |
| S02 | Facility | **ABSENT** | — | **fiche/édition de l'entité côté vendeur** (nom, adresse, horaires, type, contact) |
| S03 | Product List | **PRESENT** | `seller-offers` | — |
| S04 | Product Editor | **PARTIEL** | `seller-publish` | édition d'une offre **existante** (pas seulement création) |
| S05 | Omni Allocated Stock | **ABSENT** | — | **stock alloué Omni** (réservé / disponible) |
| S06 | Availability Requests | **PARTIEL** | `seller-validate` | **liste de TOUTES les demandes** (pas une seule) |
| S07 | Availability Response | **ABSENT** | — | **composeur de réponse** (disponible/non/quantité/prix/message) |
| S08 | Orders | **ABSENT** | — | **commandes** (commandes à honorer) |
| S09 | Transaction | **PARTIEL** | `seller-chat` | vue transaction complète + liste |
| S10 | QR Scanner | **PRESENT** | `seller-scan` | — |
| S11 | Payment Confirmation | **PARTIEL** | action dans `seller-chat` | écran dédié |
| S12 | Fulfilment | **PARTIEL** | action dans `seller-chat` | écran dédié |
| S13 | Offers | **PRESENT** | `seller-offers` | — |
| S14 | Automation | **ABSENT** | — | **automatisation** (dispo auto Pro, règles de fraîcheur) |
| S15 | Seller Account | **PARTIEL** | `account` (partagé) | paramètres spécifiques entité |

**Bilan vendeur : 5 PRESENT · 5 PARTIEL · 5 ABSENT**

---

## 3. PARTAGÉ / SYSTÈME (X01–X05)

| # | Écran MV1 | Statut | Écran prototype | Manque |
|---|---|---|---|---|
| X01 | Facility Claim | **PRESENT** | `seller-claim` | flux de preuve complet |
| X02 | Verification | **PARTIEL** | `admin-verify` + `op-visit` | état côté vendeur (« où en est ma vérification ») |
| X03 | Notifications | **PARTIEL** | `notifications` | lecture seule — pas de centre complet ni de réglages |
| X04 | Search Demand Signal | **ABSENT** | — | **signal de demande** (ce que les gens cherchent et ne trouvent pas) |
| X05 | Error / Recovery | **PARTIEL** | `state-error` | reprise/reconnexion étendue |

**Bilan partagé : 1 PRESENT · 3 PARTIEL · 1 ABSENT**

---

## 4. ADMIN / OPÉRATEUR (hors MV1 — ajoutés par le Seed V2, D-01/origine Admin-first)

| Surface | Statut | Écran |
|---|---|---|
| Console équipe | **PRESENT** | `admin-console` |
| File de revue | **PRESENT** | `admin-review` |
| Vérifier une entité | **PRESENT** | `admin-verify` |
| Arbitrer une revendication | **PRESENT** | `admin-claim` |
| Rôles & équipe | **PRESENT** | `admin-roles` |
| Journal d'audit | **PRESENT** | `admin-audit` |
| Opérateur · tournée | **PRESENT** | `op-queue` |
| Opérateur · visite terrain | **PRESENT** | `op-visit` |
| Opérateur · compte rendu | **PRESENT** | `op-report` |
| Opérateur · aperçu entité | **PRESENT** | `op-side` |

**Bilan admin/opérateur : 10 PRESENT** (dette connue : détail entité admin, correction compteur, sorties opérateur & push)

---

## 5. TRANSVERSES (Seed V2 — hors registres MV1)

| Surface | Statut | Écran |
|---|---|---|
| Menu contextuel par rôle | **PRESENT** | `menu` |
| Auth (téléphone-first / OTP) | **PRESENT** | `auth` |
| Portefeuille & Plans Pro | **PRESENT** | `wallet` |
| Fraîcheur de la disponibilité | **PRESENT** | `fraicheur` |
| Signalement d'offre | **PRESENT** | `signal` |
| Entrée par QR d'entité | **PRESENT** | `entity-from-qr` |
| Favoris | **PRESENT** | `favorites` |
| États vides / lent / erreur | **PRESENT** | `results-empty`, `state-slow`, `state-error` |
| Desktop (rail + tiroirs) | **PRESENT** | MQ ≥ 1040px |

---

## 6. SYNTHÈSE

| Bloc | PRESENT | PARTIEL | ABSENT |
|---|---|---|---|
| Acheteur (20) | 15 | 4 | 1 |
| Vendeur (15) | 5 | 5 | 5 |
| Partagé (5) | 1 | 3 | 1 |
| Admin/Opérateur (10) | 10 | — | — |
| Transverses (9) | 9 | — | — |
| **TOTAL** | **40** | **12** | **7** |

### Les 7 ABSENTS, par priorité

1. **B18 Historique des transactions** (acheteur) — sans lui, on ne retrouve pas ses achats passés.
2. **B13 Transaction Room acheteur** (partiel fort) — le chat n'existe que côté vendeur ; le parcours acheteur est asymétrique.
3. **S06 Liste des demandes entrantes** + **S07 Composeur de réponse** — le vendeur ne peut pas traiter un flux de demandes.
4. **S02 Fiche/édition de l'entité** — le vendeur ne peut pas corriger son adresse/horaires.
5. **S05 Stock alloué Omni** — le cœur « disponibilité réelle » côté vendeur.
6. **S08 Orders** — commandes à honorer.
7. **S14 Automation** (dispo auto Pro) + **X04 Search Demand Signal**.

### Conclusion

Le **côté acheteur est quasi complet (15/20 présent)**, le **côté admin/opérateur est neuf**, le **côté vendeur est le maillon faible (5 absents)** — c'est là que l'écart est réel, et c'est cohérent avec la reconstruction (le vendeur a été traité après l'acheteur).

**Prochaine tranche recommandée :** combler les **5 absents vendeur** (S02, S05, S06, S07, S08/S14) + **B18 `Historique`** + **B13 `Room acheteur`**. C'est là que le prototype cesse d'être une belle démo et devient une spec exploitable.
