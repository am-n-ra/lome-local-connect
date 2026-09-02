# OMNI V1 — ROADMAP DE DÉVELOPPEMENT & BACKLOG D'EXÉCUTION

**Document ID :** `OMNI-V1-ROADMAP-001`  
**Méthodologie :** Nature Way (Tranches Verticales UI / Server Authority / Invariants de Données)  
**Approche Design :** Mobile-First, Map-Centric, Design Épuré, Zéro Faux Sentiment de Certitude.  
**Date :** 31 Août 2026  

---

## 1. Principes Directeurs & Cadre de Design

### 1.1. Philosophie Graphique & Ergonomique (Mobile-First & Épuré)
- **Map-Centric Canvas :** La carte interactive est le réceptacle permanent et la source de vérité spatiale. Les interfaces (recherche, fiches, formulaires) sont des feuilles superposées (*bottom sheets*, tiroirs horizontaux ou panneaux latéraux sur desktop) qui ne masquent jamais entièrement la réalité géographique.
- **Règle Anti-Slop & Clarté Visuelle :**
  - Neutres sophistiqués (fonds clairs équilibrés, contraste WCAG AA ≥ 4.5:1).
  - Typographie hiérarchisée et calculs optiques stricts (labels monocignes, boutons dimensionnés proportionnellement aux textes).
  - Aucune complexité superficielle : pas de badges superflus, pas de dashboards inutiles pour des requêtes simples.
- **Cibles Tactiles :** Zone tactile minimum de 44×44px sur mobile avec retour haptique/visuel immédiat.

### 1.2. Les 3 Niveaux de Vérité
1. **Niveau 1 — Découverte / Existence :** Omni sait que l'offre existe chez le commerçant.
2. **Niveau 2 — Disponibilité :** Preuve temps réel (stock alloué Omni ou confirmation directe du vendeur).
3. **Niveau 3 — Transaction :** Intention d'achat verrouillée, code QR opaque généré, coupon Omni appliqué.

---

## 2. Parcours Acheteur (Buyer Trunk — B01 à B20)

### 📌 Phase B.1 — Carte, Découverte & Recherche (B01 – B04)
- [ ] **B01 : Map Home & Spatial Canvas**
  - [ ] Intégration du canvas cartographique fluide avec géolocalisation haute précision de l'acheteur.
  - [ ] Affichage des épingles de commerces contextuels (clusters intelligents, statuts d'ouverture).
  - [ ] Barre de recherche dockée en bas d'écran (*search dock* accessible au pouce).
- [ ] **B02 : Activation de la Recherche & DemandQuery**
  - [ ] Saisie textuelle libre ou guidée (sans obligation d'utiliser l'IA).
  - [ ] Maintien de la carte en arrière-plan avec voile d'atténuation.
  - [ ] Suggestions récentes et recherches enregistrées réutilisables.
- [ ] **B03 : Extraction & Paramétrage des Contraintes**
  - [ ] Définition explicite des contraintes dures (*Hard Constraints* : Budget max, Quantité min, Distance max, Mode de livraison requis).
  - [ ] Configuration des préférences souples (*Preferences* : Tri par proximité, remise Omni, confiance).
  - [ ] Gestion des unités et délais souhaités (immédiat / aujourd'hui / différé).
- [ ] **B04 : Résultats de Recherche & Fiches Horizontales**
  - [ ] Affichage en carrousel horizontal bas sur mobile / panneau scindé sur desktop.
  - [ ] Mise en évidence de l'avantage commercial (Remise Omni négociée).
  - [ ] État visuel de la disponibilité (Confirmé / À demander au commerçant).

---

### 📌 Phase B.2 — Fiche Établissement, Catalogue & Panier de Disponibilité (B05 – B07)
- [ ] **B05 : Prévisualisation Rapide d'Établissement**
  - [ ] Feuille de consultation rapide : identité, distance réelle, horaires, aperçu de l'offre.
  - [ ] Verrouillage strict des coordonnées directes et de l'itinéraire détaillé avant intention d'achat.
- [ ] **B06 : Page Complète Établissement (Spatial Overlay)**
  - [ ] Structure ordonnée : Identité → Statut/Horaires → Localisation → Catalogue → Services & Offres.
  - [ ] Badge de certification et statut de revendication du commerce.
- [ ] **B07 : Sélection Multi-Produits (Availability Basket)**
  - [ ] Sélection de plusieurs articles au sein d'un même établissement pour demande groupée.
  - [ ] Distinction claire : ce n'est pas un checkout e-commerce classique mais un panier de vérification de disponibilité.

---

### 📌 Phase B.3 — Disponibilité & Comparaison Multi-Établissements (B08 – B11)
- [ ] **B08 : Constructeur de Demande de Disponibilité**
  - [ ] Formulation de la requête structurée vers le commerçant avec quantité et contrainte horaire.
  - [ ] Prise en charge des demandes en volume (*Bulk Availability*).
- [ ] **B09 : État d'Attente & Gestion de la Fraîcheur**
  - [ ] Vue non-bloquante avec minuteur SLA et support des notifications push/in-app.
  - [ ] Gestion des réponses automatiques via stock alloué Omni vs réponses manuelles du commerçant.
- [ ] **B10 : Résultat de Disponibilité Unitaire**
  - [ ] Affichage de l'état certifié : *Disponible*, *Partiel*, *Indisponible*, ou *Alternative proposée*.
  - [ ] Horodatage précis de la réponse pour garantir la vérité temporelle.
- [ ] **B11 : Tableau de Comparaison Multi-Établissements**
  - [ ] Matrice de comparaison des réponses reçues lors d'une demande groupée ou de volume.
  - [ ] Classement neutre par adéquation aux contraintes, distance, prix total et délai.

---

### 📌 Phase B.4 — Intention d'Achat, Transaction & QR Code (B12 – B17)
- [ ] **B12 : Passerelle d'Intention d'Achat ("Je veux acheter")**
  - [ ] Déclenchement atomique côté serveur : création de la transaction et réservation du stock alloué.
  - [ ] Déverrouillage des coordonnées du commerçant et de l'itinéraire GPS.
- [ ] **B13 : Espace de Transaction Dédié (*Transaction Room*)**
  - [ ] Récapitulatif immuable des articles, calcul automatique de la remise Omni.
  - [ ] Messagerie transactionnelle contextuelle liée à la commande.
- [ ] **B14 : Génération du QR Code Transactionnel Opaque**
  - [ ] Émission du jeton d'autorisation serveur sécurisé (non falsifiable).
  - [ ] Mode d'utilisation clair (présentation en magasin physique ou à la livraison).
- [ ] **B15 : Choix & Déclaration du Mode de Paiement Externe**
  - [ ] Sélection du canal de paiement réel (Espèces au retrait, Mobile Money direct commerçant, Paiement à la livraison).
  - [ ] Notification d'envoi du paiement par l'acheteur.
- [ ] **B16 : Suivi de l'Exécution & Remise**
  - [ ] Coordination du retrait en magasin ou du coursier/livreur tiers.
- [ ] **B17 : Clôture de la Transaction & Évaluation**
  - [ ] Reçu numérique final et archivage.
  - [ ] Évaluation optionnelle et non-bloquante de l'expérience d'achat.

---

### 📌 Phase B.5 — Historique, Demandes Sauvegardées & Compte (B18 – B20)
- [ ] **B18 : Historique des Transactions & Liens Profonds**
  - [ ] Journal complet des transactions passées avec accès permanent aux salles de transaction archivées.
- [ ] **B19 : Gestionnaire des Demandes & Recherches Sauvegardées**
  - [ ] Réactivation en 1 clic d'une recherche de besoin avec actualisation des prix et disponibilités.
- [ ] **B20 : Espace Compte Acheteur & Portefeuille**
  - [ ] Gestion du profil, crédits éventuels, préférences et bascule fluide vers le rôle Vendeur/Commerçant.

---

## 3. Cockpit & Opérations Vendeur (Seller Trunk — S01 à S15)

### 📌 Phase S.1 — Cockpit Opérationnel & Établissement (S01 – S02)
- [ ] **S01 : Tableau de Bord Mobile-First du Vendeur**
  - [ ] Vue synthétique des demandes du jour, commandes en cours et alertes de stock.
  - [ ] Bouton d'action rapide de premier plan : **Scanner un QR Code Acheteur**.
- [ ] **S02 : Gestion de l'Établissement & Mode Marchand Ambulant**
  - [ ] Configuration des horaires d'ouverture et bascule En ligne / Hors ligne.
  - [ ] Mode vendeur mobile avec rafraîchissement GPS et cercle de précision véridique.

---

### 📌 Phase S.2 — Gestion du Catalogue & Stock Alloué Omni (S03 – S05)
- [ ] **S03 : Catalogue Produits & Services**
  - [ ] Liste claire des articles (gestion des quotas : 5 produits en formule Standard, illimité en Pro).
- [ ] **S04 : Éditeur d'Article & Avantage Omni**
  - [ ] Saisie simplifiée du titre, photos, prix public et remise exclusive Omni.
- [ ] **S05 : Moteur de Stock Alloué Omni (`quantity_allocated_omni`)**
  - [ ] Définition d'un stock réservé aux acheteurs Omni pour réponses automatiques instantanées, sans exiger une synchronisation d'inventaire complète avec le magasin physique.

---

### 📌 Phase S.3 — Traitement des Demandes & Commandes (S06 – S09)
- [ ] **S06 : File d'Attente des Demandes Entrantes**
  - [ ] Tri par fraîcheur, quantité demandée et proximité de l'acheteur.
- [ ] **S07 : Réponse Rapide en 3 Clics**
  - [ ] Boutons d'action instantanés : *Disponible*, *Quantité partielle*, *Indisponible*, *Proposition de remplacement*.
- [ ] **S08 : Suivi du Cycle de Vie des Commandes**
  - [ ] États : *En attente de retrait/livraison*, *Paiement déclaré*, *Finalisé*.
- [ ] **S09 : Salle de Transaction Vendeur**
  - [ ] Vue synchronisée en temps réel avec la salle acheteur.

---

### 📌 Phase S.4 — Validation QR, Paiement & Automatisation (S10 – S15)
- [ ] **S10 : Scanner QR Code Intégré & Saisie Manuelle de Secours**
  - [ ] Scan vidéo fluide haute vitesse avec validation cryptographique côté serveur.
  - [ ] Saisie manuelle du code à 6 caractères en cas de caméra indisponible.
- [ ] **S11 : Validation Authoritative du Paiement Externe**
  - [ ] Action vendeur irréversible : "Paiement bien reçu" débloquant la remise de marchandise.
- [ ] **S12 : Suivi de la Livraison / Remise en Main Propre**
- [ ] **S13 : Configuration des Offres Promotionnelles & Remises**
- [ ] **S14 : Règles d'Automatisation des Réponses**
  - [ ] Modes : *Manuel*, *Semi-assisté*, ou *Automatique sur stock alloué*.
- [ ] **S15 : Compte Vendeur, Facturation & Formule Pro**
  - [ ] Gestion de l'abonnement Pro, recharges de crédits de visibilité et bascule de compte.

---

## 4. Administration, Données & Surveillance Système (Admin Trunk — X01 à X05)

### 📌 Phase X.1 — Revendication, Vérification & Certification (X01 – X02)
- [ ] **X01 : Pipeline de Revendication d'Établissement (*Facility Claim*)**
  - [ ] Processus de vérification d'identité pour les commerces déjà référencés sur la carte.
  - [ ] Validation par code SMS, appel vocal ou justificatif de propriété.
- [ ] **X02 : Module de Certification & Audit de Confiance**
  - [ ] Interface d'attribution du statut *Commerce Certifié Omni*.
  - [ ] Historique de fiabilité et taux de réponse aux disponibilités.

---

### 📌 Phase X.2 — Intelligence de la Demande & Capture des Échecs (X04)
- [ ] **X04 : Moteur de Signaux de Demande (*Demand Signals*)**
  - [ ] Capture anonymisée et structurée des recherches sans résultat immédiat (*No Match*).
  - [ ] Cartographie des zones de tension et des manques d'approvisionnement pour guider le référencement de nouveaux commerçants.

---

### 📌 Phase X.3 — Notifications, Résilience & Sécurité (X03, X05)
- [ ] **X03 : Hub de Notifications Contextuelles & PWA**
  - [ ] Envoi de notifications push web fiables avec routage par liens profonds vers la transaction concernée.
- [ ] **X05 : Gestion des Erreurs, Idempotence & Récupération Hors-Ligne**
  - [ ] Garantie d'idempotence sur toutes les mutations critiques (transactions, validations QR).
  - [ ] Gestion gracieuse des déconnexions réseau avec cache spatial local.

---

## 5. Matrice d'Avancement & Priorisation

| Tranche Fonctionnelle | Périmètre Clé | Priorité V1 | Statut |
| :--- | :--- | :--- | :--- |
| **Trunk Acheteur B01–B04** | Carte, Barre de recherche, Contraintes, Résultats | **P0 (Critique)** | 🟡 Prêt à l'implémentation |
| **Trunk Acheteur B05–B07** | Fiche Magasin, Catalogue, Panier de demande | **P0 (Critique)** | 🟡 Prêt à l'implémentation |
| **Trunk Disponibilité B08–B11** | Demande structurée, Minuteur SLA, Réponses | **P0 (Critique)** | 🟡 Prêt à l'implémentation |
| **Trunk Transaction B12–B17** | Intention d'achat, QR Code, Validation | **P0 (Critique)** | 🟡 Prêt à l'implémentation |
| **Cockpit Vendeur S01, S06–S11** | Scan QR, Réponse en 3 clics, Validation paiement | **P0 (Critique)** | 🟡 Prêt à l'implémentation |
| **Stock Alloué Vendeur S04–S05**| Gestion `quantity_allocated_omni` | **P0 (Critique)** | 🟡 Prêt à l'implémentation |
| **Admin & Confiance X01–X02** | Revendication commerce, Certification | **P1 (Important)**| ⚪ Spécifié |
| **Signaux de Demande X04** | Enregistrement des recherches infructueuses | **P1 (Important)**| ⚪ Spécifié |
| **Abonnements & Pro S15** | Formules Pro, Portefeuille de crédits | **P2 (Secondaire)**| ⚪ Spécifié |
