# Omni V1 terrain — refonte complète de l'interface autour du flux réel

Objectif : une version qu'un commercial peut montrer et faire utiliser aujourd'hui. Le backend existant (Neon + fonctions serveur : disponibilité, transactions, QR, coupons, notations) est conservé ; toute l'interface est reconstruite autour d'un seul récit, et quelques règles métier manquantes sont ajoutées.

## Principe directeur

La carte plein écran **est** l'application. Aucun chrome permanent : la carte, une pilule de recherche en bas, un bouton menu. Tout le reste arrive en feuilles glissantes depuis le bas. Un écran = une décision.

## 1. Découverte

- Arrivée sur `/` : demande de localisation, carte centrée sur l'utilisateur, pins de l'offre autour de lui (facilités fixes, mobiles, et mode Discovery avec un indicateur distinct).
- Clic sur un pin → feuille facilité : nom, statut de confiance, note, catégorie, produits/services avec prix préférentiel affiché.
- **Verrouillé à ce stade** : contact, itinéraire, chat, bouton acheter. Une seule action visible : « Vérifier la disponibilité ».
- Recherche : sans compte → mur d'inscription + onboarding court, puis la requête est rejouée automatiquement. Résultats triés par prix / distance / avis, filtrables par budget, quantité, distance.
- Free : résultats bornés à la ville de l'utilisateur. Pro : portée mondiale.

## 2. Disponibilité

- Feuille en 3 étapes : Quoi (produit, quantité) → Où (ce commerce / tous les résultats visibles) → Contraintes (budget, distance, délai).
- Free : vérification une facilité à la fois. Pro : vérification en bulk sur tous les résultats.
- Réponse vendeur : disponible / partiel / indisponible, avec quantité et prix.
- **Réponse automatique** uniquement si les deux conditions sont vraies : facilité `open` (horaires ou bascule manuelle) **et** `quantity_allocated_omni > 0` pour ce produit précis. Sinon, flux manuel. Le vendeur est notifié de chaque auto-réponse faite en son nom avec un bouton de correction immédiat.
- Écran de comparaison : une carte = une réponse = une décision.

## 3. Achat et transaction

- Après une réponse disponible ou partielle, le bouton « Je veux acheter » apparaît avec quantité et prix préférentiel.
- Au clic : QR + code transaction générés, liés au compte, à l'intention et au coupon de ce seul achat. **C'est ce moment qui débloque** contact, itinéraire et chat transactionnel.
- Le vendeur vérifie le code (scanner ou saisie manuelle) depuis son espace — que l'acheteur soit venu en présentiel ou ait envoyé le code hors app.
- Après vérification : options de paiement du vendeur (mobile money, cash…) → acheteur paie → « J'ai payé » → vendeur « Paiement reçu » → vendeur « Remis / livré » → acheteur « Reçu » → notation.
- Tout se déroule dans un fil unique plein écran `/transaction/$id` : événements système et messages humains dans la même timeline, un seul bloc d'action qui se transforme selon l'état.

## 4. Espace vendeur

Console structurée, pas d'onglets orphelins :

- **Demandes** — file de disponibilité, réponse en un geste (dispo / partiel / non + quantité).
- **Transactions** — vérification de code (scanner + saisie), puis actions de l'état courant.
- **Catalogue** — produits/services, réduction minimale obligatoire, stock alloué à Omni (0 par défaut), limite 5 produits en free.
- **Facilités** — création/réclamation, horaires et bascule open/closed, mode Discovery pour partager sa position en temps réel, position mobile.
- **Compte** — plan, solde, soumission de documents de certification.

Limites free : 1 facilité, 5 produits. Pro : illimité, sous contrôle de la vérification.

## 5. Confiance et admin

- Cycle facilité : `unclaimed` → `certified` → `unconfirmed` → `confirmed`, badge visible partout où la facilité apparaît.
- Réclamation ou création → soumission de documents (identité + preuve de facilité) → validation manuelle par l'équipe admin dans `/admin`. Sans certification : pas de coupons ni de prix préférentiel publiés.

## 6. Structure companies / facilités

Une personne peut avoir plusieurs compagnies, une compagnie plusieurs facilités, une facilité plusieurs produits. La certification porte sur la compagnie et son responsable.

## Détails techniques

- **Migration 035** : table `companies` + `company_id` sur `facilities` (backfill par propriétaire) ; `products.quantity_allocated_omni` (défaut 0, ≤ stock) ; `facilities.opening_hours` + `is_open_now` ; `facilities.discovery_mode` + expiry ; colonne de ville normalisée pour le gating free.
- **Serveur** : extension de `respondToDemand` avec le chemin auto-réponse (double condition) + notification de correction ; gating ville dans `listFacilitiesInBounds` / recherche ; garde-fous d'allocation dans `upsertProduct`.
- **UI** : reconstruction de `src/routes/index.tsx` (carte plein écran), suppression des surfaces fragmentées (`CartPanel`, `OrdersPanel`, `ChatPanel`, `TransactionThreadCard`, `DemandRequestPanel`, `SearchDock` actuel) au profit d'un jeu de primitives : `MapShell`, `SearchPill`, `BottomSheet`, `FacilitySheet`, `AvailabilityFlow`, `ResultsRail`, `TransactionThread`, `SellerConsole`.
- **Design** : surfaces blanches en feuilles, ombres douces, accents terracotta/vert/or réservés aux états et aux actions ; typographie et espacements unifiés ; mobile-first 320 → 1280 px.

## Ordre de livraison

1. Migration 035 + règles serveur (auto-réponse, gating ville, allocation).
2. Socle UI : carte plein écran, primitives de feuilles, pilule de recherche, menu.
3. Découverte → facilité → disponibilité 3 étapes → comparaison.
4. Achat → QR → déblocage contact/itinéraire/chat → fil transaction unique.
5. Console vendeur (demandes, vérification de code, catalogue, facilités, compte).
6. Admin certification + badges de confiance + parcours plans free/pro.
