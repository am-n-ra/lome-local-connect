# OMNI — Prompt de build one-shot UI/UX V1

## Mission

Reconstruire l’interface V1 d’Omni en une seule architecture UI cohérente, map-first, état-first et production-ready. Ne pas continuer à empiler des correctifs visuels sur les routes actuelles. Réutiliser les contrats serveur, les migrations, les machines d’état et les fonctions métier déjà corrects ; remplacer les shells, la navigation et les compositions qui accumulent de la dette.

Omni est un moteur de recherche géospatial de l’offre et de la demande. Ce n’est pas une landing page marketing, un marketplace générique, un dashboard SaaS classique, un chatbot généraliste ni un simple site de carte.

La boucle V1 obligatoire est :

> `Search → Discover → Facility/Product → Manual Availability → Purchase Intent → Transaction Chat/QR → Seller Verification → Buyer Payment Confirmation → Fulfilment → Buyer Receipt → Completed`

La carte MapLibre réelle est le canvas permanent. Tous les panneaux sont des couches au-dessus de la carte. Les pages séparées ne doivent pas remplacer la carte pendant les flows normaux.

## Documents à lire avant toute modification

Lire intégralement, dans cet ordre :

1. `docs/OMNI_MASTER_PRODUCT_INTERFACE.md`, en commençant par §0.5 V1 Scope Gate et §0.6 Manual Operations Layer ;
2. `docs/omni-v1-ui-one-shot-refactor-plan.md` ;
3. `docs/omni-platform-product-ux-prd.md` ;
4. `docs/omni-product-interface-spec.md` ;
5. `docs/omni-platform-technical-backend-database-prd.md` ;
6. `docs/omni-platform-traceability-matrix.md` ;
7. `docs/OMNI_UI_V2_PERFORMANCE_AUDIT.md` ;
8. les contrats et composants actuels mentionnés dans la section Audit préalable.

Le master canonique est la source normative. Le V1 Scope Gate prévaut sur les sections de destination V2/V3. Toute contradiction doit être documentée, non résolue silencieusement par du code.

## Contraintes absolues

### Architecture

- Conserver React 19, TypeScript, TanStack Start/Router, Vite/Nitro, MapLibre GL et Neon Auth/PostgreSQL.
- Ne pas introduire Supabase, une deuxième authentification, une deuxième base ou une nouvelle abstraction réseau.
- Utiliser le pattern `useServerFn` et les server functions typées existantes.
- Ne pas mettre de secret, token, credential, `.env`, fixture temporaire ou artefact de build dans Git.
- Le navigateur propose des actions ; le serveur reste l’autorité pour auth, ownership, plan, argent, coupons, inventaire et transitions transactionnelles.
- Diviser la logique par domaines et composants. Aucun nouveau fichier route monolithique ne doit dépasser une taille justifiée par le domaine.

### Produit V1

- V1 : map, recherche texte, quantité/budget structurés optionnels, facilities, claimed/unclaimed, facility detail, availability manuelle, purchase intent, chat transactionnel, QR, scanner seller, paiement externe/cash enregistré, réception, coupons basiques si contrat disponible, seller facility/catalogue limité, notifications transactionnelles.
- V1-Manual : réponses availability et certaines opérations de certification peuvent rester opérées par un humain, mais les états et événements sont réels et audités.
- Deferred/flagged par défaut : Agent, media UI, visual search, import massif, publicité avancée, automatisation, offline, wallet complet, seller withdrawal, buyer in-app payment, globe choreography avancée si non certifiée.
- Toute surface deferred doit être absente de la navigation primaire ou explicitement verrouillée par plan/feature flag. Ne jamais afficher une fonctionnalité non livrée comme si elle était active.
- Le wallet est un **Omni Wallet rechargeable unique**. Il finance abonnements, crédits, publicité et services Omni. Il ne représente pas un compte de retrait seller. Aucun CTA de retrait ne doit être rendu.
- FedaPay est réservé à la recharge de l’Omni Wallet dans cette version. Le buyer ne paie pas in-app dans le flow seller V1.

## Audit préalable obligatoire

Avant d’écrire du code, produire dans la session de build un audit court des fichiers suivants et une table de décision :

- `src/routes/carte.tsx` ou `src/components/omni/CartePage.tsx` ;
- `src/components/omni/MapCanvas.tsx` ;
- `src/components/omni/SearchDock.tsx` ;
- `src/components/omni/FacilityPanel.tsx` ;
- `src/components/omni/DemandRequestPanel.tsx` ;
- `src/components/omni/TransactionThreadCard.tsx` ;
- `src/components/omni/ui/OmniPrimitives.tsx` ;
- `src/routes/vendeur.tsx` ;
- `src/components/omni/vendor/CheckoutPanel.tsx` ;
- `src/components/omni/NavMenuSheet.tsx` ;
- `src/components/omni/TopNav.tsx` ;
- `src/lib/transaction-state.ts` ;
- `src/lib/checkout.functions.ts` ;
- `src/lib/omni.functions.ts` ;
- `src/lib/vendor.functions.ts` ;
- `src/lib/payments.functions.ts` ;
- `src/styles.css` ;
- `db/schema.sql` et les migrations liées aux transactions, coupons, wallet et seller.

Pour chaque surface, classer : `réutiliser`, `refactoriser`, `remplacer`, `masquer en V1`, ou `contrat backend manquant`. Aucun refactor ne doit commencer avant cette classification.

## Architecture UI cible

Construire une hiérarchie partagée :

```text
OmniAppShell
└── OmniMapShell
    ├── OmniMapCanvas
    ├── OmniMapChrome
    │   ├── NotificationsBell
    │   └── MenuTrigger
    ├── MapControls
    ├── UserLocationState
    ├── FacilityPins/Results
    ├── FloatingResultRail
    ├── OmniSearchDock
    └── OverlayHost
        ├── FacilitySheet
        ├── AvailabilitySheet
        ├── TransactionSheet
        ├── SellerOperationSheet
        └── FocusedPageSurface
```

### Trois niveaux de surface

| Niveau  | Usage                                                           | Règles                                                                        |
| ------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `float` | recherche, facility chip, statut, contrôles, résultat compact   | verre léger, compact, ne bloque pas la carte                                  |
| `sheet` | facility, availability, transaction, scanner, catalogue, coupon | surface lisible presque opaque, scroll interne, footer d’action stable        |
| `page`  | paramètres ou console dense réellement livrée                   | lecture prioritaire, pas de faux contexte map-first, retour carte obligatoire |

Une surface ne doit pas changer de niveau uniquement parce que le viewport est petit : elle change de composition, pas de logique.

## Buyer map-first

### État initial

À l’ouverture, afficher directement la carte MapLibre/globe. Aucun hero marketing, aucune ancienne navbar globale, aucun bloc explicatif volumineux.

- Fond spatial extérieur : crème/blanc chaud.
- Globe/map : eau gris/noir doux, terres blanches, style quiet.
- Rotation de repos horizontale autour de l’axe vertical, jamais un roll de bearing comme une horloge.
- Facilities réelles et source-backed visibles en faible densité ; aucun marker fictif.
- Top-right : notifications et menu seulement.
- Gauche : zoom +, zoom −, recenter/location retry selon état.
- Bas : dock de recherche persistant, au-dessus de la safe-area.

### Localisation

Utiliser la permission native de géolocalisation dans un effet non bloquant. Distinguer strictement :

- `permission_pending` ;
- `granted_precise` avec vraie position et pin exact ;
- `granted_approximate` avec rayon d’incertitude, sans faux pin personnel ;
- `denied` ;
- `timeout` ;
- `unsupported` ;
- `market_fallback`.

Un centre de marché ne doit jamais être présenté comme la position de l’utilisateur. Le globe reste visible pendant la permission. Le retry est compact et explicite.

### Reveal et discovery

Le reveal géographique ne démarre qu’après une recherche explicite ou la restauration d’une recherche après auth. Il ne démarre pas lors d’un simple mount, zoom, pan, recenter ou ouverture de sheet.

Le reveal sémantique est :

```text
Globe → Continent → Pays → Région → Ville/quartier → Résultats
```

Chaque niveau possède une pause perceptible et une mise en évidence noire/near-black. Orange est réservé aux actions, pins et CTA. En reduced motion, réduire la durée tout en conservant les états.

La discovery appelle le viewport réel via `listFacilitiesInBounds`. Elle doit tolérer un callback initial tardif, un `idle` MapLibre, un `moveend`, une recherche sans viewport initial et une erreur récupérable. Le client ne doit pas transformer silencieusement une erreur en résultat vide sans état de retry.

### SearchDock

Le dock comporte des rangées nommées, mutuellement non chevauchantes :

1. recherche primaire ;
2. filtres/catégories et chevron `Affiner` ;
3. paramètres structurés optionnels ;
4. contexte location/coverage ;
5. résultats ou action de demande.

Règles :

- le focus de l’input ne doit pas déplacer ou zoomer bizarrement la page mobile ;
- quantity et budget sont des contrôles séparés, éditables, mais ne doivent pas être affichés comme une grosse carte par défaut quand ils ne sont pas nécessaires ;
- la recherche ne change pas de vue uniquement parce que l’utilisateur tape ;
- Enter et le bouton de recherche invoquent le même handler ;
- une recherche non authentifiée est capturée comme `pendingSearch`, non exécutée au backend, puis restaurée exactement après auth ;
- un no-result request surface remplace la ligne d’action, elle ne se superpose pas aux paramètres ;
- le copy doit être affirmatif et court. Ne pas afficher au premier plan une phrase technique comme « la découverte de cette zone est momentanément indisponible » sauf état réellement en erreur avec retry.

### Result cards et facility sheet

Une card doit rapidement communiquer :

- média si activé ; sinon composition sans image cassée ;
- nom facility ;
- produit/service recherché en premier ;
- catégorie ;
- statut unclaimed/claimed/certified/confirmed ;
- online/open/closed ;
- distance ou contexte spatial ;
- stock/availability signal ;
- prix/offer/coupon si autorisé ;
- provenance OSM si unclaimed ;
- CTA valide.

Pour unclaimed : afficher découverte, provenance et `Êtes-vous le propriétaire ? Réclamer cette fiche`. Ne jamais afficher achat, availability seller-controlled ou contact transactionnel.

Pour claimed/certified éligible : ouvrir une sheet au-dessus de la carte, afficher le contexte produit, puis `Vérifier la disponibilité`. L’intention directe depuis une card ne doit pas contourner availability.

## Availability

Créer une `AvailabilitySheet` en trois étapes, lisible et persistante :

1. produit/service et variante ;
2. facility(s), mode manuel ou bulk, quota ;
3. quantité, paramètres pertinents et envoi.

Budget reste un filtre/ranking buyer-side et ne doit pas être envoyé comme contrainte au vendeur. Les réponses sont : `Disponible`, `Partiel`, `Indisponible`, éventuellement alternative. Le classement est serveur-compatible : disponibilité complète, partielle, indisponible, puis prix/distance/qualité de confirmation.

Le meilleur choix est recommandé mais jamais acheté automatiquement. Les erreurs, timeouts, absence de réponse et retry sont conçus explicitement.

## TransactionThread cible

Remplacer le stepper horizontal compact par un composant `TransactionProgress` qui ne masque jamais les libellés.

Étapes officielles visibles :

```text
1. Intention
2. Offre
3. QR
4. Paiement
5. Réception
```

Sur desktop, une timeline horizontale avec labels sous chaque état est autorisée si chaque label conserve une largeur minimale. Sur mobile, utiliser une timeline verticale ou une rangée horizontale scrollable avec le label de l’étape active et les labels des autres étapes accessibles ; les numéros seuls sont interdits.

Chaque étape doit avoir : label, statut (`à venir`, `actif`, `terminé`, `bloqué`, `expiré`, `erreur`), description courte, événement associé et état ARIA.

Le thread contient dans le même contexte :

- résumé facility/produit/quantité/prix ;
- timeline complète ;
- QR et expiration ;
- régénération si expiré ;
- messages privés ;
- CTA buyer `J’ai payé` uniquement après seller verification ;
- CTA buyer `Je confirme la réception` uniquement après paiement confirmé ;
- état terminal et retry.

Création d’intention : `pending`, chat ouvert immédiatement, QR absent. Confirmation explicite d’offre : QR généré. QR expiré : CTA de renouvellement idempotent. Seller verification : `payment_pending`, jamais `paid`. Paiement cash/externe : buyer confirme. Réception : buyer confirme. Chaque transition vient du serveur.

## Seller map-first V1

### Shell initial

Le seller ouvre sur la carte avec sa facility active, pas sur une grille de statistiques. Afficher seulement :

- facility active, trust status et online/paused ;
- position et contexte map ;
- un résumé opérationnel très court : demandes, produits à risque, transactions ouvertes ;
- un dock unique d’actions réellement livrées.

Le shell ne charge pas toutes les surfaces métier avant interaction. Les queries lourdes sont lazy et isolées par surface.

### Navigation primaire V1

Afficher uniquement :

1. `Facility` / aperçu ;
2. `Catalogue` ;
3. `Demandes` / availability ;
4. `Scanner QR` ;
5. `Transactions`.

`Coupons` peut être une section de catalogue ou une sheet séparée si son contrat est opérationnel. `Wallet & recharge` peut être accessible par le menu compte si la recharge est fonctionnelle, mais ne doit pas concurrencer les opérations seller. `Agent`, `Publicité avancée`, `Analytics avancée`, `Import`, `Subscription` et surfaces non certifiées sont masqués par défaut ou marqués verrouillés, sans faux boutons d’action.

Le menu global ne doit pas réafficher les mêmes onglets. Le switch buyer/seller n’existe qu’une seule fois.

### Facility preview

Le seller doit pouvoir voir comment la facility apparaît au buyer, avec les mêmes `FacilityResultCard`, badges, statut et règles d’éligibilité. Le preview est une sheet, pas une deuxième page indépendante.

## Seller onboarding

Reconstruire en étapes progressives et reprenables :

1. compte/rôle ;
2. identité du commerce ;
3. type de facility ;
4. localisation ;
5. catégorie ;
6. premier produit ;
7. stock/allocation ;
8. contact ;
9. vérification/plan.

Chaque étape affiche son objectif, ses champs essentiels, son état sauvegardé et un seul CTA. Les limites Free doivent être affichées avant le blocage : une facility et cinq produits. L’onboarding mobile ne doit pas afficher une grande carte embarquée qui réduit le formulaire à une zone inutilisable ; utiliser une mini-carte contrôlée ou une sheet de position.

## Catalogue et ProductEditor

Créer un `ProductEditor` clair :

### Essentiel

- nom ;
- catégorie ;
- type produit/service ;
- prix et devise ;
- publication : brouillon/actif.

### Stock

- quantité totale ;
- quantité visible Omni ou allocation ;
- seuil faible ;
- état stock calculé côté serveur.

### Avancé, fermé par défaut

- SKU/référence ;
- variante ;
- description ;
- facility override ;
- coupon lié ;
- média si flag activé.

Ne pas préremplir une quantité ou allocation qui pourrait être interprétée comme vérité commerciale. Séparer valeur saisie, valeur calculée et limite plan. Afficher aperçu avant publication. Pour une mutation destructive, demander confirmation et fournir une raison si le contrat le requiert.

## Coupon basic

Le coupon V1 doit rester simple : pourcentage ou montant fixe, produit/facility, période, minimum d’achat, limite de redemptions si supportée. Montrer un preview du prix avant/après, un état draft/active/expired/exhausted et les erreurs d’éligibilité. Ne pas afficher buy-X-get-Y ou règles avancées si le backend ne les supporte pas.

La consommation doit être atomique côté serveur. Le buyer voit le coupon appliqué et le prix final avant l’intention.

## CameraScannerSheet — contrat impératif

Implémenter une machine d’état dédiée :

```text
idle
→ permission_pending
→ preview_active
→ detecting
→ code_detected
→ validation_pending
→ verified
```

Sorties : `denied`, `unsupported`, `error`, `stopped`, `expired`.

Comportement obligatoire :

1. le bouton `Autoriser et démarrer la caméra` est l’unique déclencheur de `getUserMedia` ;
2. le conteneur preview et `<video>` sont montés avant la résolution de permission et restent présents pendant l’autorisation ;
3. le flux est attaché au video avant `setCameraStatus('preview_active')` ;
4. utiliser `autoPlay`, `muted`, `playsInline`, `loadedmetadata` et un `play()` protégé ;
5. afficher un vrai flux caméra dès que le stream est disponible ;
6. garder le voyant caméra actif tant que le stream est actif ;
7. le changement de tab ou le re-render data ne doit pas appeler `stopScanner` ;
8. appeler `stop()` sur chaque track une seule fois lors de fermeture, validation, erreur terminale ou unmount ;
9. BarcodeDetector ne sert qu’au décodage ; son absence ne ferme pas la preview ;
10. si aucune détection automatique, conserver caméra + saisie manuelle côte à côte ;
11. après détection, préremplir le code sans valider automatiquement ;
12. le bouton `Valider` reste la transition explicite vers `validation_pending` ;
13. afficher erreur de permission, unsupported, stream absent, code invalide, token expiré et facility mismatch avec un fallback manuel ;
14. arrêter la caméra après validation réussie et afficher un état `QR vérifié` distinct de `Paiement confirmé` ;
15. ne jamais mettre le montant, l’identité acheteur ou un secret dans le QR lui-même.

La surface doit afficher un placeholder seulement dans `idle/stopped`, pas après permission réussie. Sur desktop, le preview doit rester visible dans la sheet tant que la caméra n’est pas arrêtée ; sur mobile, respecter l’orientation et la safe-area.

## Navigation et feedback

Créer un menu unique par rôle :

- Buyer : profil, plan, Omni Wallet/balance, recherches, availability, transactions, notifications, paramètres, aide, déconnexion.
- Seller V1 : facility, catalogue, demandes, transactions/scanner, balance/recharge si active, paramètres, déconnexion.

Les éléments sans backend fonctionnel ne doivent pas être cliquables comme s’ils étaient livrés. Les notifications transactionnelles sont séparées du marketing et deep-linkent vers une sheet ou un état map précis.

Tous les boutons et sheets doivent avoir :

- état loading local ;
- disabled explicite ;
- succès ;
- erreur lisible ;
- retry ;
- empty state ;
- focus visible ;
- aria-label/aria-live quand nécessaire ;
- escape/back/close pour revenir à la carte.

## Backend adapters

Avant toute UI data wiring, dresser une table `UI action → server function → auth/ownership → plan → input → output → state transition → error → invalidation`.

Adapter sans duplication :

- viewport discovery/search/restored query ;
- facility detail/claim/trust ;
- availability single/bulk/quota ;
- purchase intent/offer/QR/expired QR/timeline ;
- seller redeem QR/transactions/progress ;
- buyer payment/received ;
- seller shell/facility/catalogue/requests/coupons ;
- wallet deposit/reconciliation uniquement si activé ;
- Neon Auth and membership/entitlements.

Toute function doit définir input Zod, auth, ownership, plan gate, idempotence, transition valide, output typé et erreur affichable. Ne jamais autoriser un CTA par simple statut visuel local.

## Tests obligatoires

### Unitaires

Ajouter ou maintenir :

- transaction state machine : pending, offer confirmed, QR active, QR expired, seller verified, payment pending, paid, received, completed, cancelled/error ;
- `TransactionProgress` : labels présents à toutes les tailles et états accessibles ;
- camera reducer/state machine : permissions, stream attached, preview active, detection absent, detected code, stop idempotent, cleanup ;
- CTA eligibility : unclaimed non achetable, QR avant offre absent, seller ne confirme pas paiement, buyer seul confirme payment/receipt ;
- seller navigation visibility selon V1/plan/feature flags ;
- form validation et erreurs serveur ;
- wallet no-withdrawal invariant ;
- auth restoration exact query.

### Intégration

Tester les adaptateurs server functions et les invariants : auth, ownership, plan Free/Pro, idempotence, expired QR regeneration, coupon atomicity, transaction events, no seller withdrawal.

### Browser/E2E

Rejouer :

1. ouverture map-first et location states ;
2. resting discovery ;
3. recherche `huile` ;
4. claimed facility → availability → intent → chat ;
5. offer confirmation → QR ;
6. seller scanner manual ;
7. seller QR verified ;
8. buyer payment confirmation ;
9. buyer received confirmation ;
10. order history completed.

Pour la caméra : permission clean, preview visible, voyant actif, manual fallback, BarcodeDetector absent, close/reopen, route/tab changes et cleanup.

### Responsive/accessibilité

Certifier 320, 375, 390, 768, 1280 px. Vérifier :

- aucun panneau hors écran ;
- aucune option sous le dock ;
- labels transaction lisibles ;
- safe-area correcte ;
- input focus sans auto-zoom ;
- clavier et focus ring ;
- reduced motion ;
- caméra utilisable en portrait ;
- map toujours visible derrière les sheets.

## Ordre d’implémentation

1. Audit et matrice de contrats.
2. Tokens, surfaces et primitives communes.
3. Shell map-first et navigation unique.
4. Buyer dock, cards, sheets et transaction progress.
5. Seller shell, active facility et action dock V1.
6. CameraScannerSheet et tests de lifecycle.
7. Onboarding, catalogue, product editor, coupon basic.
8. Lazy loading et découpage data seller.
9. Tests unitaires/intégration/browser/responsive.
10. Build, typecheck, Prettier, client-boundary, probes live et rapport.

Ne pas réécrire le backend ou les migrations pendant les étapes UI sauf si l’audit révèle un contrat réellement absent ou incohérent. Dans ce cas, documenter la migration minimale et la faire valider par les tests avant de modifier le scope.

## Definition of Done

Le build n’est accepté que si :

- buyer et seller sont map-first avec la même hiérarchie visuelle ;
- aucun élément de navigation mort, doublé ou hors scope n’apparaît par défaut ;
- les étapes transactionnelles sont toujours nommées et compréhensibles ;
- le preview caméra montre effectivement le flux après permission et reste ouvert tant que le stream est actif ;
- le fallback manuel fonctionne sans BarcodeDetector ;
- les statuts QR, seller verified, payment confirmed, received et completed sont distincts ;
- les CTA viennent des droits et statuts serveur ;
- unclaimed est visible mais non achetable ;
- les formulaires sont courts, progressifs et sans valeurs commerciales trompeuses ;
- les erreurs/loading/empty/locked/retry sont conçus ;
- AI/media/V2 ne polluent pas la V1 ;
- les tests, le build et la matrice responsive passent ;
- aucun secret ou artefact temporaire n’est committé.

Produire en fin de build :

- liste des fichiers refactorisés ;
- matrice surface/état/contrat/test ;
- captures responsive ;
- résultats unitaires, intégration, browser et build ;
- limites restantes, notamment certification caméra physique HTTPS et contrats différés.
