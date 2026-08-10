# OmniView v3 — mise en conformité PRD (livraison par phases)

Livraison en 3 phases. Chaque phase est utilisable et testable avant de passer à la suivante.

---

## Phase A — Expérience carte, recherche multimodale, compte démo

### 1. Carte acheteur
- Ouverture **centrée sur la position réelle de l'utilisateur** (permission demandée au chargement, zoom 15,5), repli sur Lomé si refus.
- **Globe 3D** : activation de la projection globe de MapLibre en dessous d'un certain niveau de zoom, retour en carte plate en zoom rapproché (transition automatique).
- **Pins plus petits et plus sobres** : marqueurs réduits (~22 px), pastille pleine + halo léger, icône seulement à partir d'un certain zoom ; le pin sélectionné s'agrandit. Style distinct par statut, scooter pour `type=mobile`, marqueur dédié « présence mobile active ».

### 2. Recherche
- L'icône micro passe **dans la barre de recherche** (plus de bouton séparé).
- Micro actif → **animation d'onde audio** temps réel (niveau capté via Web Audio) dans la barre.
- **Langues locales (éwé, mina, français)** : l'audio est enregistré puis transcrit côté serveur. Le navigateur seul ne sait pas faire l'éwé.
- **Recherche par image** : bouton appareil photo dans la barre, la photo est analysée côté serveur pour en extraire des mots-clés produit, qui alimentent la recherche normale.

### 3. Fournisseur IA sans dépendance à Lovable
- Abstraction `SpeechProvider` / `VisionProvider` avec **Groq en premier choix** (`whisper-large-v3-turbo` pour l'audio, un modèle vision pour l'image) — offre gratuite généreuse et très bon marché — et repli automatique sur la passerelle IA Lovable si la clé Groq est absente ou en erreur.
- Nécessite une clé **GROQ_API_KEY** (gratuite sur console.groq.com) : je la demanderai via le formulaire sécurisé au moment de l'implémentation.

### 4. Favicon
- Contraste renforcé : effet morphisme plus lisible, **couleur extérieure vs couleur intérieure distinctes** (coque terracotta, cœur vert profond) tout en gardant peu de couleurs.

### 5. Compte démo complet
Jeu de données de démo conforme au PRD : `demo@omni.tg` / `OmniDemo2026` avec fiche `confirmed` Pro, 4 produits remisés, 1 offre, 2 coupons, 3 transactions terminées de 3 acheteurs distincts, budget pub partiellement dépensé, solde à reverser ; acheteur démo avec portefeuille non nul, centres d'intérêt et notifications ; « Électricien Kodjo » avec présence mobile active ; fiches `certified` en attente du palier canal, import catalogue de démo, soumissions de certification en attente.

---

## Phase B — Transactions et paiement in-app

- Migration des statuts vers **`unclaimed` / `certified` / `unconfirmed` / `confirmed`** (renommage des ~4 000 fiches importées, mise à jour du code, de l'admin et de l'API publique v1).
- Panier `draft` → `pending` avec `expires_at` (2 h), « Vérifier la disponibilité » en un tap, ajout au panier groupé, vérification chez 5 vendeurs max, anti-doublon par fiche.
- Transactions : `qr_token` signé serveur + `manual_code` 6 caractères, scanner vendeur, états `pending → authorized → payment_confirmed → completed`.
- Paiement **in-app** (portefeuille acheteur, recharge FedaPay derrière une interface `PaymentProvider` lue depuis `Market`), frais plateforme paramétrables, crédit du `payout_balance`, file de reversement admin manuelle. Paiement **hors app** conservé.
- Passage automatique à `confirmed` (3 transactions, 3 acheteurs distincts) avec bonus 10 000 FCFA + 2 mois Pro.
- Notifications réelles : table + centre de notifications in-app, e-mail transactionnel, bannière d'offres personnalisées à la connexion, `mobile_presence_nearby`.

---

## Phase C — Certification, communauté, catalogue, admin complet

- Certification : soumission vendeur (formelle/informelle selon `Market.informal_certification_enabled`), file de validation admin.
- **Palier canal communautaire** générique (table `CommunityChannel` par marché, jamais WhatsApp en dur) : obligatoire avant visibilité acheteur ; suivi `CommsChecklist` côté admin.
- **Import catalogue IA** (CSV/XLSX/texte collé) avec aperçu éditable et remise obligatoire par ligne.
- **Présence mobile self-service** : toggle + rayon dans le dashboard vendeur, diffusion automatique au premier plan (aussi pour `type=mobile`), vue admin en lecture seule.
- Onboarding acheteur (centres d'intérêt) et vendeur, page FAQ réelle, micro-explications contextuelles.
- Admin : certification, canal, checklist comms, seuils, payouts, litiges, wishlist agrégée, config `Market`/`CommunityChannel`, usage API.
- API `/api/v1` complète + OpenAPI mis à jour pour tous les nouveaux groupes.

---

## Détails techniques

- MapLibre : `projection: { type: 'globe' }` piloté par un handler `zoom`, marqueurs DOM allégés, `Geolocation.getCurrentPosition` au montant du composant.
- Audio : `MediaRecorder` (webm/mp4) → server function `transcribeSearch` → Groq `/openai/v1/audio/transcriptions` (`whisper-large-v3-turbo`, `language` auto pour couvrir éwé/mina) → texte injecté dans la recherche.
- Image : compression côté client puis server function `searchByImage` → modèle vision Groq → mots-clés → recherche existante.
- Nouvelles tables Phase B/C : `transaction_items`, `messages`, `comms_checklists`, `catalog_imports`, colonnes `carts.expires_at`, `products.discount_percent`.
- Base Neon inchangée (migrations SQL versionnées dans `db/migrations/`).
