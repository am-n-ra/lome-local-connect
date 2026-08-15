# Omni — Interface produit map-first : mise en conformité

Objectif : faire converger l'app existante vers la spécification "Search → Discover → Check Availability → Compare → Purchase Intent → QR → Transaction", avec une seule interface à états au lieu de pages séparées.

## Ce qui existe déjà et est réutilisé
- Carte MapLibre avec pins, recadrage sur les résultats, dock de recherche en bas (`SearchDock`), panneau facility.
- Recherche unifiée avec index, mur de compte et restauration de la requête.
- Transactions avec QR (`qr_token`, `qr_authorised_at`), chat, avis, crédits et plans (`user_plans`), demandes groupées (`demand_requests` / `demand_responses`).
- Dashboard vendeur, admin, marché (devise, centre carte) configurable.

## Lot A — Coque map-first à états
- Une machine d'états unique sur `/` : `MAP → SEARCH ACTIVE → SEARCH RESULTS → FACILITY SELECTED → AVAILABILITY → AVAILABILITY RESULTS → PURCHASE INTENT → TRANSACTION CHAT → COMPLETED`. Les panneaux deviennent des couches au-dessus de la carte (bottom sheet mobile, side sheet desktop), la carte reste visible et vivante.
- Chrome réduit : en haut à droite uniquement Notifications et Menu. Aucune barre de navigation permanente, aucune landing page.
- Contrôles carte à gauche, centrés verticalement : `+`, `−`, recentrage utilisateur. Suppression des autres contrôles.
- Barre de recherche flottante en bas, translucide ; le chevron ouvre la rangée de catégories scrollables (All, Food, Health, Retail, Services…) utilisées comme raccourcis de recherche.

## Lot B — Onboarding géographique Mercator
- À la première ouverture, demande de localisation puis animation par paliers : Globe → Continent → Pays → Région → Quartier → Position exacte, chaque palier mis en évidence visuellement, pin utilisateur à l'arrivée.
- Refus de géolocalisation : atterrissage sur le centre du marché actif, sans blocage.
- Après chaque recherche, recadrage automatique sur l'utilisateur + facilities pertinentes.

## Lot C — Résultats et fiche contextualisés
- Compteur `N facilities found`, pins sans clustering, liste synchronisée avec la carte.
- La card met en avant l'objet recherché (produit/service) avant le nom de la facility, avec prix, promotion, distance, statut de disponibilité, badge de confiance.
- Fiche facility : identité, contexte de recherche, produits pertinents, pricing, promotions, distance, statut, CTA `Vérifier la disponibilité`. Contact direct et itinéraire détaillé restent masqués avant Purchase Intent.

## Lot D — Couche Availability
- Nouvelle table `availability_requests` (+ `availability_responses`) : buyer, facility, produit/service, variante, quantité, paramètres ; le budget n'est jamais transmis au vendeur, il sert au filtrage/reclassement côté Omni.
- Availability manuelle (une facility) et bulk (plusieurs facilities) déclenchées seulement après une recherche.
- Quotas : Buyer Free 3 bulk/mois (compteur visible et message de limite), Buyer Pro illimité.
- Réponses vendeur : `available`, `partial`, `unavailable` (+ quantité et prix confirmés), depuis le dashboard vendeur et les notifications.
- Écran de comparaison des réponses : quantité couverte, prix, distance, qualité de confirmation, délai de réponse.

## Lot E — Purchase Intent, QR, transaction
- Purchase Intent comme point de bascule : création depuis une réponse d'availability ou une fiche ; débloque contact, itinéraire et éléments transactionnels.
- QR généré à l'intent, lié à buyer, seller, facility, produit, quantité, offre, coupon, session ; code manuel de secours.
- Chat transactionnel en timeline : intent created → offer confirmed → QR generated → seller verified → payment → seller confirmation → product received → completed. L'utilisateur garde le contrôle de la confirmation de paiement.
- Pickup géré par Omni, delivery négociée vendeur/acheteur.
- Traçabilité complète : qui a acheté quoi, à qui, où, quand, à quelle offre, avec quelle promotion, pour quel résultat.

## Lot F — Vendeur, catalogue et wallet
- Dashboard vendeur map-first : la carte n'affiche que ses facilities, prévisualisation exacte de la vue acheteur, actions d'édition (facility, produits, promotions, availability, horaires, online/offline).
- Sections : Facilities, Products/Services, Availability, Requests, Transactions, Promotions, Ads, Agent, Balance, Subscription, Settings.
- Produits : name, catégorie, description, prix, disponibilité, quantité, allocation Omni, promotions, statut. Aucune promesse au-delà de l'allocation Omni.
- Balance globale unique pour abonnements, crédits, publicité ; auto-renouvellement avec downgrade si solde insuffisant.
- Certification obligatoire avant publication complète ; statuts Unclaimed, Claimed, Certified, Confirmed, Online, Offline visibles côté acheteur.

## Lot G — Intelligence optionnelle et kill switch
- Switch `Manual / Agent` dans la barre de recherche, visible uniquement pour Buyer Pro quand l'IA est activée. L'Agent extrait les paramètres puis appelle exactement les mêmes APIs que le mode manuel.
- Garde-fou hors périmètre : « Je peux uniquement vous aider à rechercher, vérifier la disponibilité et effectuer les actions prises en charge par Omni. »
- Recommandation Pro sur les réponses d'availability (quantité complète, budget, distance, qualité de confirmation) ; les décisions transactionnelles restent à l'utilisateur.
- Seller Agent : réponses automatisées d'availability, bornées par l'allocation.
- Kill switch admin `AI / Automation` : OFF masque Agent Mode, orchestration, recommandations et réponses automatisées ; tout le manuel continue de fonctionner.

## Lot H — Notifications, menu, plans
- Notifications deep-linkées vers l'état concerné (search, availability, recommandation, promotion, intent, QR, paiement, transaction, compte, abonnement, certification, ads, agent).
- Menu acheteur : Profile, Plan, Balance, Searches, Availability, Transactions, Notifications, Settings, Help, Logout. Menu vendeur : Facilities, Catalogue, Requests, Transactions, Promotions, Ads, Agent, Balance, Subscription.
- Application des limites Free/Pro côté serveur (bulk 3/mois, facilities vendeur, agent).

## Détails techniques
- Machine d'états dans un contexte client (`src/lib/omni-state.tsx`), consommée par `src/routes/carte.tsx` et les panneaux ; pas de nouvelles routes de page pour les états.
- Nouvelles migrations : `availability_requests`, `availability_responses`, compteur mensuel de bulk, drapeau global `ai_automation_enabled` dans la configuration admin.
- Nouveaux server functions dans `src/lib/availability.functions.ts` et extension de `checkout.functions.ts` pour l'intent ; quotas et statuts validés côté serveur.
- Médias : schéma et endpoints conservés, UI désactivée derrière `OMNI_CONFIG.mediaUiEnabled`.

## Ordre de livraison proposé
1. Lot A + B (coque à états, chrome, onboarding carte)
2. Lot C + D (résultats contextualisés, availability manuelle et bulk)
3. Lot E (intent, QR, timeline)
4. Lot F (vendeur, catalogue, wallet)
5. Lot G + H (agent, kill switch, notifications, plans)
