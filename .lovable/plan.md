# OmniView v3 — Finalisation prod : design glass, dock de recherche, flux panier & pièces manquantes du PRD

Objectif : aligner l'app existante sur le PRD v3 final. Beaucoup est déjà en place (markets, facilities 4 statuts, produits, offres, coupons, abonnements, campagnes, présence mobile, paniers, transactions QR + FedaPay, certifications, wishlist, notifications, admin, API publique v1, médias R2). Ce plan couvre l'écart restant, en 5 lots.

---

## Lot 1 — Système de design « verre sur carte pastel » (toutes les pages)

- Fond de carte pastel personnalisé : routes blanc cassé, parcs vert sauge doux, eau bleu pastel, bâtiments beige pâle (remplace le style CARTO brut).
- Jeton de surface unique `omni-glass` : blanc semi-transparent, flou d'arrière-plan, ombre douce, liseré interne, grands rayons (pilule pour barres/boutons, arrondi généreux pour cartes/panneaux).
- Application à toutes les surfaces : dashboard vendeur, dashboard admin, auth, FAQ, centre de notifications, modales, feuilles.
- Icônes en trait gris neutre par défaut ; terracotta réservé aux actions primaires, badges de statut et chiffres mis en avant.

## Lot 2 — Dock de recherche bas + carrousel de catégories + filtres

Barre pilule ancrée en bas (référence fournie) :

```text
[ 📷 ]  Que cherchez-vous ?            [ 🎤 ]  ( ◉ logo )
 ───────────  poignée de glisse  ───────────
[ Alimentation ] [ Mode ] [ Électronique ]      ( › )
```

- Caméra à gauche (recherche par image), micro à droite avec **signal sonore court** + pulsation à l'écoute, bouton rond accentué à l'extrême droite portant l'icône OmniView (localiser / lancer la recherche).
- Poignée fine dessous : glisser vers le haut ouvre la même feuille (résultats, détails fiche, tri).
- **Rangée de catégories** : 3 catégories visibles, bouton « suivant » dans le coin pour faire défiler horizontalement ; au doigt, balayage libre sur mobile (même liste, défilement natif).
- **Filtres** à côté des catégories : proximité, prix (min/max), remise, ouvert maintenant, tri (Pro/Sponsorisé d'abord, puis distance).
- Un seul autre élément persistant sur la carte : le bouton carré verre en haut à droite (menu).

## Lot 3 — Panier & vérification de disponibilité à faible friction

- `carts.status` : `draft | pending | confirmed | partially_confirmed | declined | expired` + `expires_at` (2 h).
- `cart_items` : `confirmed_available`, `confirmed_quantity`.
- « Vérifier la disponibilité » sur chaque carte produit → crée/réutilise un panier, envoie immédiatement.
- « Ajouter au panier » → accumule en `draft`, un seul « Envoyer la demande ».
- « Vérifier chez plusieurs vendeurs » → jusqu'à 5 fiches, un panier par fiche, envoi groupé.
- Garde anti-spam : une seule demande `pending` par acheteur et par fiche.
- Réponse vendeur ligne par ligne (dispo / quantité) → `confirmed` ou `partially_confirmed`, puis passage en transaction QR existante.

## Lot 4 — Pièces PRD manquantes

- **Remise obligatoire** : `discount_percent > 0` imposé à la création produit (min 5 %), génère une `Offer` `source=auto_product`.
- **Import catalogue en masse** : CSV / XLSX / texte collé → mapping IA → aperçu éditable → validation ; table `catalog_imports` ; plafond 5 produits en gratuit conservé.
- **CommsChecklist** : table + suivi dans le dashboard admin, progression visible côté vendeur.
- **Présence mobile automatique** : diffusion de position au premier plan (présence mobile *et* fiches `type=mobile`), plus de bouton manuel ; marqueur visuellement distinct ; vue admin en lecture seule.
- **Onboarding acheteur par centres d'intérêt** (skippable) + parcours vendeur guidé 3-4 écrans.
- **Page FAQ réelle** + micro-explications contextuelles (palier canal, remise obligatoire, premier paiement in-app).
- **Bannière d'offres personnalisées** à la connexion (proximité + intérêts + wishlist + historique).
- **Canal communautaire** : lecture depuis la config marché, invitation acheteur optionnelle.

## Lot 5 — Admin, API, données de démo

- Admin : file de certification, tracker canal + comms, seuil « X/3 », file de payouts (marquer payé), litiges, wishlist agrégée, présences mobiles (lecture seule), config Market + CommunityChannel, usage API.
- API v1 : endpoints ajoutés pour panier (draft/envoi/multi-vendeurs), import catalogue, présence mobile, centres d'intérêt ; OpenAPI mis à jour.
- Données de démo : compte `demo@omni.tg` confirmé/pro avec 3 transactions de 3 acheteurs distincts, acheteur avec wallet et intérêts, « Électricien Kodjo » avec présence mobile active, fiches `certified` en attente du palier, import catalogue de démo, soumissions de certification en attente.

---

## Détails techniques

- Migration `007_prd_final.sql` : `catalog_imports`, `comms_checklists`, `transaction_items`, `messages`, colonnes panier (`expires_at`, statuts élargis, `confirmed_*`), `mobile_presence.broadcast_radius_km`, `offers.source`/`product_id`, contrainte remise > 0 sur nouveaux produits, table `community_channels` par `market_code` (migration depuis les colonnes actuelles de `markets`). GRANTs inclus.
- Logique serveur uniquement via `createServerFn` (`src/lib/*.functions.ts`) ; les routes `src/routes/api/public/v1/*` restent la surface REST documentée.
- Nouveaux composants : `SearchDock` (barre + catégories défilantes + filtres), `MapSheet` (feuille glissante unifiée), `CatalogImportPanel`, `CommsChecklistCard`, `InterestOnboarding`, page `/faq`.
- Style de carte pastel défini en JSON local dans `src/lib/maplibre.ts` (pas de dépendance à un fournisseur payant).
- Diffusion de position : hook `useForegroundBroadcast` (visibilitychange + watchPosition, arrêt immédiat au désactivage), strictement premier plan.

## Hors périmètre

Push natif en arrière-plan, géolocalisation continue en arrière-plan, automatisation complète des reversements, dashboards analytiques poussés.
