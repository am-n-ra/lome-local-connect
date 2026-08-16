# OMNI — Product & Interface Specification (source intégrée)

> **STATUT : SOURCE INTÉGRÉE / RÉFÉRENCE HISTORIQUE**
>
> La source de vérité normative est désormais [`OMNI_MASTER_PRODUCT_INTERFACE.md`](./OMNI_MASTER_PRODUCT_INTERFACE.md). Les règles de ce document ont été intégrées au master canonique ; toute nouvelle décision doit être ajoutée au master, au journal de décisions et à la matrice de traçabilité.

## 0. Principe directeur
Omni est une plateforme de **discovery + real-time availability + transaction**. Le parcours fondamental est :

**Search → Discover → Check Availability → Compare/Recommend → Purchase Intent → QR → Transaction**

La carte est le canvas principal de l'application. L'IA n'est pas un produit séparé : elle est une couche d'orchestration au-dessus des actions manuelles existantes.

> **Tout ce que l'Agent peut faire doit déjà exister comme action manuelle dans Omni.**

## 1. Couches produit
1. **Discovery** — Map, search, categories, facilities, products/services, distance, certification/trust, promotions.
2. **Availability** — Manual availability, bulk availability, seller responses, automated seller responses, comparison.
3. **Intelligence** — Buyer Agent, Seller Agent, recommendations, intent extraction, orchestration.
4. **Transaction** — Purchase Intent, coupon, QR, seller chat, pickup/delivery choice, contact, directions, payment, confirmation, completion.

## 2. Utilisateurs, plans et configuration
### Buyer
- **Free** : utilisation manuelle.
- **Pro** : manuel + Agent si la couche IA est activée.

### Seller
- **Free** : facilities limitées selon configuration.
- **Pro** : facilities illimitées + fonctionnalités avancées, notamment Agent.

Une facility ne peut pas être publiée complètement sans passer par le processus de certification Omni.

## 3. Home buyer map-first
Il n'y a aucune landing page dans l'application. À l'ouverture, l'utilisateur arrive dans l'espace carte :

```text
┌──────────────────────────────────────────────┐
│                                    🔔   ◉   │
│                                              │
│                    MAP                       │
│                                              │
│                     📍                       │
│                                              │
│        ┌────────────────────────────┐        │
│        │ 🔍  What are you looking   │        │
│        │     for?                ˅  │        │
│        └────────────────────────────┘        │
└──────────────────────────────────────────────┘
```

Top-right : **Notifications** et **Menu** uniquement. Pas de navbar permanente.

## 4. Map et onboarding géographique
La map est une carte **Mercator / globe-light** et constitue le background principal. À la première ouverture, Omni demande la localisation. Si l'utilisateur accepte, l'animation doit progresser :

```text
Globe → Continent → Pays → Région → Zone / quartier → Localisation exacte
```

Chaque étape met visuellement en évidence le niveau géographique courant. Le pin utilisateur apparaît à la localisation finale.

## 5. Map controls
À gauche, centrés verticalement :

```text
┌────┐
│ +  │
├────┤
│ −  │
├────┤
│ ◎  │
└────┘
```

`+` zoom in, `−` zoom out, `◎` recentre sur l'utilisateur. Aucun contrôle supplémentaire n'est nécessaire sur la map principale V1.

## 6. Search bar
La Search Bar est l'élément principal de navigation produit. Elle reste en bas, flottante, arrondie, lisible, légèrement translucide et au-dessus de la map.

Le chevron ouvre une rangée horizontale de catégories scrollables : `[ All ] [ Food ] [ Health ] [ Retail ] [ Services ] [...]`. Les catégories sont des raccourcis de recherche, pas une marketplace classique.

## 7. Manual mode vs Agent mode
### Manual Mode
Disponible pour tous. L'utilisateur indique principalement ce qu'il recherche. Omni propose ensuite les paramètres applicables : produit/service, quantité, budget, localisation. Quantité et budget ne doivent pas être obligatoires lorsqu'ils ne sont pas pertinents.

### Agent Mode
Disponible uniquement pour Buyer Pro lorsque l'IA est activée. La Search Bar possède un switch `Manual / Agent`. En Agent Mode, l'utilisateur écrit en langage naturel. L'Agent extrait les paramètres puis utilise les mêmes APIs que le mode manuel.

L'Agent ne doit pas devenir un chatbot généraliste. Hors scope :

> Je peux uniquement vous aider à rechercher, vérifier la disponibilité et effectuer les actions prises en charge par Omni.

## 8. Search execution et auth
Un nouvel utilisateur peut écrire sa recherche, mais la requête n'est pas exécutée avant création/connexion du compte. La requête est conservée :

```text
Search → Authentication required → Sign up / Login → Onboarding → Restore original query → Execute search
```

L'utilisateur ne doit jamais perdre sa recherche.

## 9. Camera after search
Après chaque recherche, la caméra se repositionne automatiquement pour afficher la position utilisateur + facilities pertinentes, sans demander à l'utilisateur de dézoomer.

## 10. Search results et facility cards
Après recherche : `42 facilities found`. Les résultats apparaissent sur la carte, sans clusters dans le modèle souhaité. Une card/panel peut accompagner les résultats.

La facility card est contextualisée par la recherche : si l'utilisateur cherche `Nike Air Max`, la card met `Nike Air Max` en avant plutôt que seulement `ABC Store`.

## 11. Media
Les médias sont **hors scope UI actuel**, mais l'architecture doit rester media-ready : photos, vidéos, social content, facility media, product media, media search. État cible : **Media-ready, UI disabled**.

## 12. Facility detail
Au clic facility : fiche au-dessus de la map. Desktop : side sheet/floating panel. Mobile : bottom sheet. La map reste visible derrière.

Contenu : identity, search context, products/services pertinents, pricing, promotions, distance, availability status, CTA `Check availability`.

## 13. Availability
L'Availability est toujours postérieure à la recherche.

- Recherche : **Who can potentially satisfy my request?**
- Availability : **Who can satisfy it right now?**

Manual availability cible une facility. Bulk availability cible plusieurs facilities. Buyer Free : **3 bulk searches/month**. Buyer Pro : bulk + Agent si activé.

Le payload vendeur inclut produit/service, variante, quantité et paramètres pertinents. Le budget sert au filtrage/reclassement côté Omni et n'est pas envoyé au vendeur.

Réponses vendeur : **Available**, **Partial**, **Unavailable**.

## 14. Buyer Pro recommendation
Le Pro peut demander à l'Agent d'analyser les réponses d'availability et de recommander une option selon quantité complète, budget, distance et qualité de confirmation. L'utilisateur garde le contrôle des décisions transactionnelles critiques.

## 15. Purchase Intent et transaction
Le Purchase Intent est le point de bascule entre Discovery/Research et Transaction. Avant intent, contact direct, directions détaillées et éléments transactionnels restent masqués. Après intent, ils peuvent être débloqués.

Un Purchase Intent génère un QR transactionnel lié à buyer, seller, facility, product/service, quantity, offer, coupon et transaction/session ID.

Le chat transactionnel montre une timeline : intent created, offer confirmed, QR generated, seller verified, payment, seller confirmation, product received, completed.

Pickup est géré par Omni. Delivery est organisé entre vendeur et utilisateur dans cette version.

## 16. Transaction data model
Chaque transaction doit répondre à : **Who bought what, from whom, where, when, at what offer, with which promotion, and with what outcome?**

Données minimales : buyer, seller, facility, product/service, quantity, price, promotion, coupon, location, timestamp, purchase intent, QR, payment, completion.

## 17. Facility status, claim et certification
États : Unclaimed, Claimed, Certified, Confirmed, Online, Offline. Le statut de certification influence ce que l'utilisateur peut voir et le niveau de confiance. Une facility unclaimed peut être découverte et proposer son claim. Le processus de certification est obligatoire avant publication complète.

## 18. Seller dashboard
Le dashboard seller reste map-first. La carte du seller ne montre que ses propres facilities. Le seller peut prévisualiser exactement comment sa facility apparaît au buyer, avec actions d'administration : edit facility, products, promotions, availability, hours, online/offline.

Sections seller : Facilities, Products/Services, Availability, Requests, Transactions, Promotions, Ads, Agent, Balance, Subscription, Settings.

## 19. Product, allocation, promotions, ads, wallet
Chaque product/service porte name, category, description, price, availability, quantity, Omni allocation, promotions, status. Le Seller Agent ne peut jamais promettre plus que l'allocation Omni disponible.

La balance globale sert aux abonnements, fonctionnalités payantes, crédits, services, publicité et autres consommations Omni. L'auto-renewal vérifie le solde à expiration : solde suffisant → renouvellement automatique ; sinon downgrade.

## 20. Notifications et menu
Notifications est central et deep-linked vers le contexte : search, availability, recommendations, promotions, purchase intent, QR, seller, payment, transaction, account, subscription, certification, ads, Agent.

Menu global buyer : Profile, Plan, Balance, Searches, Availability, Transactions, Notifications, Settings, Help, Logout. Menu seller : Facilities, Catalogue, Requests, Transactions, Promotions, Ads, Agent, Balance, Subscription.

## 21. Free vs Pro
### Buyer Free
Map, search, manual parameters, discovery, details, manual availability, bulk availability limité à 3/month, purchase, QR, transaction. Pas d'Agent ni AI recommendation.

### Buyer Pro
Tout Free + bulk + Agent Mode, natural language intent, AI recommendation et automated workflow si l'IA est activée.

### Seller Free / Pro
Free : facilities limitées, certification, products, manual responses, promotions, ads selon plan. Pro : facilities illimitées, Agent, automated availability, ads.

## 22. Global AI kill switch
Admin doit avoir un contrôle `AI / Automation [ON]`. Si OFF : Agent Mode, intent orchestration, AI recommendation, Seller Agent et automated availability disparaissent. Toutes les fonctionnalités manuelles continuent.

## 23. Stateful interface rule
> **Do not build Omni as separate pages. Build it as a map-first stateful interface.**

L'expérience principale évolue par états :

```text
MAP → SEARCH ACTIVE → SEARCH RESULTS → FACILITY SELECTED → AVAILABILITY → AVAILABILITY RESULTS → PURCHASE INTENT → TRANSACTION CHAT → COMPLETED
```

Et non par pages isolées `Home → Search Page → Results Page → Facility Page → Checkout Page`.

## 24. Source of truth V1/V2-ready
Non négociables : map-first, no in-app landing page, persistent bottom search, Mercator onboarding, automatic camera framing, manual core, Agent optional, structured budget/quantity, availability after discovery, bulk availability, Free bulk limit 3/month, Pro AI recommendation, seller manual response, seller automated availability, Seller Pro unlimited facilities, certification before listing, online/offline state, promotions, Purchase Intent gateway, QR at intent, contact/directions after intent, stateful transaction chat, user controls payment confirmation, global wallet, auto-renewal, notifications, AI kill switch, media-ready disabled, transaction traceability.
