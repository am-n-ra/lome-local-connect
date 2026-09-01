# OMNI — MODÈLE COMMERCIAL & GRILLE TARIFAIRE V1

**Document ID :** `OMNI-DOCS-BUSINESS-MODEL-001`  
**Statut :** Spécification Contractuelle V1  
**Méthodologie :** Nature Way (Architecture à 2 niveaux & économie de plateforme)  
**Date de révision :** 31 Août 2026  

---

## 1. Philosophie & Principes Fondamentaux du Modèle Commercial

Omni transforme la manière dont l'offre commerciale du monde réel est découverte, vérifiée et achetée. Contrairement aux places de marché traditionnelles (qui prélèvent des commissions lourdes sur les paniers et imposent des contraintes d'inventaire disproportionnées aux commerçants), Omni repose sur une **économie à deux niveaux (*Two-Layer Economy*)** fluide, pragmatique et incitative :

```text
                     ┌──────────────────────────────────────────────┐
                     │          MODÈLE ÉCONOMIQUE OMNI             │
                     └──────────────────────┬───────────────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
  ┌─────────────────────────┐                               ┌─────────────────────────┐
  │ 1. ÉCONOMIE INTERNE     │                               │ 2. TRANSACTION EXTERNE  │
  │    (Omni Platform)      │                               │    (Règlement direct)   │
  ├─────────────────────────┤                               ├─────────────────────────┤
  │ • Portefeuille Omni     │                               │ • Espèces / Cash        │
  │ • Abonnements Pro       │                               │ • Mobile Money Direct   │
  │ • Slots d'établissements│                               │ • 0% commission panier  │
  │ • Packs de crédits      │                               │ • Remise Omni appliquée │
  └─────────────────────────┘                               └─────────────────────────┘
```

### Les 4 Lois Inaliénables du Modèle :
1. **La confiance ne s'achète pas :** Le statut convoité **`confirmed`** (badge de confiance vert) ne peut être obtenu par un paiement. Il s'acquiert uniquement après **3 transactions réelles et vérifiées** sur la plateforme.
2. **La remise Omni obligatoire :** Pour qu'un produit ou service soit transactionnable sur Omni, le vendeur doit impérativement définir un avantage tarifaire exclusif (la *Remise Omni*).
3. **Zéro friction sur la trésorerie des commerçants :** Omni ne s'interpose pas comme banque ou intermédiaire de paiement obligatoire pour les marchandises en V1. L'acheteur règle directement le commerçant (en espèces ou Mobile Money local) lors de la remise.
4. **Découverte universelle gratuite :** L'accès à la carte, la recherche géospatiale et la vérification unitaire de disponibilité restent entièrement gratuits pour tous.

---

## 2. Le Mécanisme de Réduction Omni (*Omni Discount*)

### 2.1. Rôle Structurel du Coupon
La réduction Omni n'est pas un simple outil promotionnel ou marketing : **c'est le pivot de traçabilité et le catalyseur transactionnel d'Omni**.

```text
    PRIX PUBLIC DU COMMERÇANT (ex: 15 000 FCFA)
                         -
         REMISE EXCLUSIVE OMNI (ex: 5% = 750 FCFA)
                         =
     PRIX NET TRANSACTIONNEL OMNI (14 250 FCFA)
```

### 2.2. Pourquoi ce mécanisme est indispensable ?
- **Pour l'Acheteur :** Il bénéficie d'une incitation financière concrète à utiliser Omni plutôt qu'un appel téléphonique ou une visite informelle non tracée.
- **Pour le Vendeur :** Il attire un trafic physique ultra-qualifié prêt à acheter sans frais fixes de prospection publicitaire.
- **Pour Omni :** Le coupon est lié de manière atomique et cryptographique au **QR code transactionnel** émis par le serveur. Lorsque le commerçant scanne le QR code, il valide l'application de la remise et authentifie la transaction dans le grand livre Omni (*Transaction Ledger*).

---

## 3. Gestion & Limites des Stocks : Le Stock Alloué Omni (`quantity_allocated_omni`)

Pour éviter d'imposer aux petits commerces, artisans ou vendeurs informels la contrainte irréaliste de maintenir un ERP/POS connecté, Omni dissocie le **stock physique total** du **stock alloué Omni**.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      STOCK PHYSIQUE TOTAL DU MAGASIN                  │
│                     (Non géré par Omni / Inconnu)                      │
│                                                                        │
│         ┌────────────────────────────────────────────────────┐         │
│         │            STOCK ALLOUÉ OMNI (ex: 10 unités)       │         │
│         │ • Réservé aux réponses automatiques instantanées   │         │
│         │ • Décrémenté lors d'une transaction Omni (-3)      │         │
│         │ • Ajustable manuellement en cas de vente externe   │         │
│         └────────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────────────┘
```

### Règles de fonctionnement :
1. **Zéro fardeau d'inventaire :** Le vendeur alloue la quantité de son choix (ex: 5 chaises, 2 téléphones).
2. **Réponse automatique instantanée :** Si l'établissement est ouvert et que `quantity_allocated_omni > 0`, Omni confirme immédiatement la disponibilité à l'acheteur.
3. **Décrémentation automatique :** À la finalisation d'une transaction vérifiée par scan QR, le stock alloué est automatiquement réduit de la quantité achetée.
4. **Ajustement en 1 clic pour ventes hors-Omni :** Si le commerçant vend un article au comptoir en dehors d'Omni, il peut réduire son allocation en un seul tap sur son smartphone.

---

## 4. Matrice des Offres : Acheteurs (*Buyers*)

Omni permet à tout utilisateur d'explorer la ville et de faire valoir son intention d'achat sans frais cachés.

| Fonctionnalité | **Acheteur Gratuit (Free)** | **Acheteur Pro** (2 500 XOF / mois ou 5 $/mois) |
| :--- | :--- | :--- |
| **Exploration Cartographique** | Illimitée, temps réel, accès à tous les commerces référencés. | Illimitée avec filtres géospatiaux avancés et favoris persistants. |
| **Vérification Unitaire de Disponibilité** | **Gratuite & Illimitée** (interrogation d'un commerce à la fois). | **Gratuite & Illimitée**. |
| **Demandes Groupées (*Bulk Availability*)** | Quota découverte : **3 opérations groupées / mois** (jusqu'à 5 commerces ciblés simultanément). | **Illimité via le pack mensuel de crédits inclus**, permettant d'interroger tout un quartier/rayon en 1 clic. |
| **Comparateur de Réponses** | 1 comparaison active en direct. | Jusqu'à **5 comparaisons simultanées multi-critères** (prix, distance, délai). |
| **Espace de Transaction & QR** | Accès complet : génération de QR, messagerie transactionnelle, déverrouillage de contact. | Espace complet + support prioritaire et offres exclusives Pro. |
| **Recommandations Intelligentes** | Manuel (l'acheteur filtre lui-même ses résultats). | Suggestion automatisée du meilleur compromis itinéraire / prix / fiabilité. |

---

## 5. Matrice des Offres : Vendeurs & Commerçants (*Sellers*)

Le modèle vendeur sépare la **capacité du compte** (nombre d'établissements physiques ou ambulants gérés) de la **puissance de chaque établissement** (*Facility*).

| Fonctionnalité | **Vendeur Standard (Free)** | **Vendeur Pro** (5 000 XOF / 10 $ par établissement / mois) |
| :--- | :--- | :--- |
| **Établissements Inclus** | **1 établissement actif** (fixe, mobile/ambulant ou digital). | Possibilité d'activer l'abonnement Pro indépendamment par établissement. |
| **Slots d'Établissements Additionnels** | Facturés à l'unité (achat de slot permanent via Wallet). | Facturés à l'unité ou inclus dans les offres réseau multi-boutiques. |
| **Taille du Catalogue** | **Jusqu'à 5 produits / services publiés** avec remise Omni. | **Produits et services illimités** pour l'établissement. |
| **Traitement des Disponibilités** | Réponse manuelle en 3 clics (*Disponible, Partiel, Non disponible, Alternative*). | **Réponse automatique instantanée** basée sur le stock alloué Omni (`quantity_allocated_omni`). |
| **Vitrine & QR Boutique** | Fiche vitrine publique + QR code d'établissement (carte de visite vivante). | Fiche enrichie avec mise en avant sur la carte et outils d'édition rapide. |
| **Scanner de Caisse** | Scanner caméra web/PWA intégré pour valider les QR clients. | Scanner haute cadence avec journal détaillé et audit des transactions vérifiées. |
| **Visibilité & Statistiques** | Indicateurs basiques (demandes reçues). | Tableau de bord analytique complet : taux de conversion, provenance des scans. |

---

## 6. Monétisation Additionnelle & Portefeuille Omni (*Omni Wallet*)

En complément des abonnements récurrents, les utilisateurs peuvent alimenter leur compte via les passerelles locales (FedaPay, Mobile Money MTN/Moov/Orange) pour des achats à la carte :

1. **Slots d'Établissements Additionnels (*Facility Slots*) :**
   * Destiné aux commerçants possédant plusieurs succursales ou plusieurs étals de marché sous une même identité de compte.
2. **Packs de Crédits de Volume (*Bulk Query Packs*) :**
   * Recharges consommables pour les acheteurs ou professionnels effectuant des requêtes massives de stock sur de très larges secteurs.
3. **Bonus de Traction & Déblocage de Confiance (20 $) :**
   * Pour encourager l'adoption et la première complétion du cycle transactionnel, un crédit de 20 $ est provisionné à l'enregistrement d'une facilité.
   * **Règle stricte :** Ce montant reste verrouillé (badge d'encouragement) et ne se débloque qu'après la validation de **3 ventes réelles vérifiées par QR code**, finançant ainsi les premières options Pro ou slots additionnels.

---

## 7. Synthèse Visuelle des Flux Économiques

```text
    ACHETEUR (Buyer)                         COMMERÇANT (Seller)
  ┌────────────────────┐                    ┌────────────────────┐
  │ • Recherche libre  │                    │ • Vitrine active   │
  │ • Remise garantie  │                    │ • Trafic physique  │
  │ • Zéro commission  │                    │ • Réponse en 3 clics│
  └─────────┬──────────┘                    └─────────┬──────────┘
            │                                         │
            │          ACCORD TRANSACTIONNEL          │
            └───────────────────►◄────────────────────┘
                                 │
                   Validation par Scan QR Omni
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
       Règlement Direct Marchand      Traçabilité Omni (0%)
        (Cash ou Mobile Money)        (+1 transaction vérifiée)
```

Ce modèle garantit un alignement d'intérêts total : Omni ne taxe pas l'économie réelle au pourcentage mais fournit l'infrastructure logicielle qui la rend visible et instantanément accessible.
