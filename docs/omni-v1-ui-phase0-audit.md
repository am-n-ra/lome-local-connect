# Omni V1 UI — Audit Phase 0 et matrice de décision

**Baseline auditée :** commit `0071ae1` sur `main`, aligné avec `origin/main`.

**Nature du document :** audit d’exécution non normatif. Le master produit/interface reste la source normative. Ce document décide ce qui sera refactorisé, remplacé, masqué ou conservé pendant le programme UI V1.

## 1. Baseline reproductible

| Contrôle          |          Résultat | Observation                                                                                            |
| ----------------- | ----------------: | ------------------------------------------------------------------------------------------------------ |
| Branche           |            `main` | alignée avec `origin/main`                                                                             |
| HEAD              |         `0071ae1` | commit documentaire du prompt one-shot et de la matrice                                                |
| Tests Vitest      |    **32/32 pass** | 6 fichiers de test                                                                                     |
| TypeScript        |          **pass** | `pnpm exec tsc --noEmit`                                                                               |
| Build             |          **pass** | Vite/Nitro + client-boundary                                                                           |
| Client boundary   |          **pass** | 38 artefacts JavaScript scannés                                                                        |
| Prettier global   | **fail baseline** | 207 fichiers déjà non conformes ; aucun formatage global automatique ne sera lancé pendant le refactor |
| Secrets/artefacts |        non suivis | `.vercel/` et scripts d’audit temporaires restent exclus du périmètre                                  |

La suite de tests actuelle protège déjà la machine transactionnelle, MapLibre, l’API publique, la finance et la normalisation viewport. Elle ne protège pas encore le rendu des libellés transactionnels, la lifecycle caméra, la visibilité des entrées seller V1 ou la composition responsive des sheets.

## 2. Classification buyer

| Surface                            | Décision                         | Raisonnement                                                                                            | Cible                                                                   |
| ---------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `CartePage.tsx`                    | **Refactoriser**                 | trop de state, discovery, location, route, overlays et wiring dans une route                            | shell mince + hooks map/search + `OverlayHost`                          |
| `MapCanvas.tsx`                    | **Réutiliser puis refactoriser** | MapLibre et viewport callback sont fonctionnels et critiques                                            | contrat stable, lifecycle reveal/location testée                        |
| `SearchDock.tsx`                   | **Remplacer progressivement**    | les rows existent mais le dock mélange structured params, coverage, request et analytics                | `OmniSearchDock` avec cinq rows mesurées et non chevauchantes           |
| rail de résultats dans `CartePage` | **Remplacer**                    | card inline volumineuse, logique de résultat dans la page, retour fragile                               | `FacilityResultCard` + `FloatingResultRail`                             |
| `FacilityPanel.tsx`                | **Remplacer**                    | mélange facility detail, favorite, claim, direct purchase intent, cart, coupons, products et contact    | `FacilitySheet` + `FacilityResultCard` ; availability-first             |
| `DemandRequestPanel.tsx`           | **Remplacer**                    | availability correcte mais ancienne stepper, densité forte, copy crédits/IA, réponses et intent couplés | `AvailabilitySheet` en trois étapes + response cards                    |
| `TransactionThreadCard.tsx`        | **Refactoriser fortement**       | thread unifié existe mais stepper masque les labels sous `sm`                                           | `TransactionThread` + `TransactionProgress` responsive                  |
| `ChatPanel.tsx`                    | **Réutiliser/refactoriser**      | wrapper transactionnel utile ; surface générale séparée                                                 | wrapper d’overlay sans posséder la machine transactionnelle             |
| `OrdersPanel.tsx`                  | **Refactoriser**                 | charge toutes les timelines et mélange cart legacy/intention                                            | historique mince ; ouverture d’un thread unique ; mutations isolées     |
| `TopNav.tsx`                       | **Réutiliser/refactoriser**      | minimal map chrome déjà proche de la cible                                                              | notifications + menu seulement, sans recherche ou brand chrome dupliqué |
| `NavMenuSheet.tsx`                 | **Remplacer**                    | menu mélange activité buyer, switch de rôle, profil et routes qui ne sont pas toutes V1                 | menu role-aware unique, entrées réellement livrées                      |
| location dans `CartePage`          | **Réutiliser/refactoriser**      | distinction position précise/fallback déjà présente                                                     | état explicite, copy truthful, marker exact seulement après succès      |
| `listFacilitiesInBounds`           | **Réutiliser**                   | discovery live réparée et certifiée                                                                     | adaptateur UI avec error/retry distinct de empty                        |
| Facility direct intent             | **Supprimer du chemin UI**       | `FacilityPanel.startProductIntent` contourne availability-first                                         | seules les réponses availability peuvent créer l’intention V1           |

### Divergences buyer critiques

1. Le produit peut encore être acheté directement depuis `FacilityPanel`, alors que le master impose `Facility/Product → Manual Availability → Purchase Intent`.
2. La même fiche rend produits, coupons, favorite, claim, itinéraire, téléphone, cart et intention ; elle doit devenir une sheet focalisée.
3. `SearchDock` affiche une surface structurée volumineuse lorsque quantity/budget sont explicites et mélange les états coverage/error/request.
4. `DemandRequestPanel` affiche `credit_cost`, `ai_summary` et `ai_recommended_facility_name` dans le flow principal alors que AI/credits doivent être flagged/deferred en strict V1.
5. Le retour de la fiche vers le rail est possible mais la route possède les détails au lieu d’un overlay host partagé.

## 3. Classification seller

| Surface                            | Décision                                   | Raisonnement                                                                                                   | Cible                                                             |
| ---------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `src/routes/vendeur.tsx`           | **Remplacer par un shell mince**           | route monolithique : auth, onboarding, map, catalogue, requests, scanner, ads, coupons, wallet, plan, settings | `SellerMapWorkspace` + sheets lazy                                |
| `getVendorShell`                   | **Réutiliser**                             | payload léger déjà disponible                                                                                  | premier chargement seller                                         |
| `getVendorDashboard`               | **Sortir du premier rendu**                | agrège produits, campaigns, coupons, requests, demand, balances et unlock                                      | conservation éventuelle pour compatibilité, non utilisée au mount |
| `getVendorProducts`                | **Réutiliser**                             | contrat lazy ownership-protected                                                                               | `SellerCatalogueSheet`                                            |
| `getVendorRequests`                | **Réutiliser**                             | contrat lazy ownership-protected                                                                               | `SellerRequestsSheet`                                             |
| `getVendorCoupons`                 | **Réutiliser sous flag/section catalogue** | contrat réel mais scope coupon à simplifier                                                                    | `CouponEditor` basic                                              |
| `getVendorCampaigns`               | **Masquer en V1 stricte**                  | publicité avancée et wallet-funded hors boucle obligatoire                                                     | pas d’onglet Ads par défaut                                       |
| `DemandPanel`                      | **Masquer ou flagger**                     | demande globale/agent ne fait pas partie du seller V1 primaire                                                 | aucun onglet mort                                                 |
| `AdsPanel`                         | **Masquer ou flagger**                     | builder dense et promesse avancée                                                                              | surface account/flag uniquement si explicitement activée          |
| `CheckoutPanel.tsx`                | **Remplacer**                              | permission, video preview, BarcodeDetector et validation trop couplés ; preview se ferme après autorisation    | `CameraScannerSheet` + `SellerTransactionValidation`              |
| `RequestsPanel.tsx`                | **Refactoriser**                           | opération seller réelle à conserver                                                                            | cards simples, response CTA explicites                            |
| `CouponsPanel.tsx`                 | **Refactoriser**                           | surface réelle mais formulaire à simplifier                                                                    | nested catalogue, basic rules only                                |
| `OmniActionDock.tsx`               | **Refactoriser/remplacer**                 | 9+ entrées seller y compris Agent, Ads, Plan, Settings                                                         | cinq actions V1, le reste account/flag/deferred                   |
| `BalanceSheet.tsx`                 | **Réutiliser sous accès account**          | copy Omni Wallet/no withdrawal déjà cohérent                                                                   | pas dans dock opérationnel initial                                |
| onboarding inline de `vendeur.tsx` | **Remplacer**                              | formulaire long et carte embarquée dans route                                                                  | `SellerOnboardingFlow` reprenable                                 |
| aperçu facility seller             | **Créer**                                  | aujourd’hui peu distinct du dashboard                                                                          | preview partagé avec buyer card/sheet                             |

### Entrées seller à masquer par défaut

`Agent Omni`, `Publicité V1` si le contrat n’est pas accepté dans le strict V1, analytics avancée, import massif, automatisation et tout CTA de retrait. Le wallet peut être accessible depuis le compte si la recharge FedaPay est active, mais aucun bucket ne doit être présenté comme un retrait vendeur.

## 4. Primitives et styles

| Surface             | Décision                | Dette observée                                         | Cible                                                           |
| ------------------- | ----------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| `OmniStepper`       | **Remplacer**           | labels `hidden sm:block`, flex comprimé                | `TransactionProgress` et `AvailabilityProgress` toujours nommés |
| `OmniStatusBadge`   | Réutiliser              | primitive cohérente                                    | étendre statuts sans couleur seule                              |
| `OmniLoadingState`  | Réutiliser              | utile                                                  | états locaux par sheet                                          |
| `OmniErrorState`    | Réutiliser/refactoriser | utile mais copy et retry doivent rester contextualisés | error + retry sans effacer contexte                             |
| `OmniDisclosure`    | Réutiliser              | bon pattern pour advanced forms                        | essential/advanced product/coupon                               |
| `OmniActionDock`    | Refactoriser            | dock seller trop large                                 | action dock par rôle et scope                                   |
| `styles.css` tokens | Refactoriser            | plusieurs surfaces locales et offsets                  | float/sheet/page + safe-area mesurée                            |
| `OmniSheet`         | Réutiliser/refactoriser | base correcte                                          | footer action fixe, scroll interne, map préservée               |

## 5. Matrice de contrats backend

| Action UI          | Contrat existant                                                      | Autorité                     | État attendu               | Décision UI                                          |
| ------------------ | --------------------------------------------------------------------- | ---------------------------- | -------------------------- | ---------------------------------------------------- |
| Discovery viewport | `listFacilitiesInBounds`                                              | server function + map bounds | loading/ready/error        | adapter et retry ; ne pas afficher error comme empty |
| Facility detail    | `getFacility`                                                         | public/auth policy           | loading/loaded/error       | FacilitySheet focalisée                              |
| Claim              | `claimFacility`                                                       | auth + claimant              | pending/unconfirmed/error  | CTA uniquement unclaimed                             |
| Availability       | `createDemandRequest`, `listMyDemandRequests`, responses              | buyer auth + quota           | 3 steps, responses         | AvailabilitySheet                                    |
| Intent             | `createPurchaseIntent`                                                | buyer + facility eligibility | `pending`                  | seulement depuis réponse availability                |
| QR initial         | `createTransactionQr`                                                 | buyer transaction owner      | `qr_generated`             | offer confirmation explicite                         |
| QR expiré          | `createTransactionQr`                                                 | same transaction + expired   | new token, event           | regeneration CTA idempotent                          |
| Timeline           | `getTransactionTimeline`                                              | buyer owner                  | events ordered             | thread unique                                        |
| Seller redeem      | `redeemCheckout`                                                      | facility owner               | `payment_pending`          | camera/manual validation                             |
| Buyer payment      | `confirmTransactionPayment`                                           | buyer owner                  | `paid`                     | seller ne peut pas confirmer                         |
| Buyer receipt      | `confirmProductReceived`                                              | buyer owner                  | `completed`                | buyer CTA only after paid                            |
| Buyer orders       | `listMyOrders`                                                        | buyer auth                   | history                    | thin launcher to thread                              |
| Seller shell       | `getVendorShell`                                                      | seller auth                  | facilities/counts/balances | first payload                                        |
| Seller products    | `getVendorProducts`, `upsertProduct`, `deleteProduct`, `confirmStock` | facility owner + plan        | product states             | lazy catalogue                                       |
| Seller requests    | `getVendorRequests`, response functions                               | facility owner               | pending/answered           | lazy demand sheet                                    |
| Seller coupons     | `getVendorCoupons`, coupon mutation                                   | facility owner               | basic states               | nested/flagged                                       |
| Seller campaigns   | `getVendorCampaigns`, campaign mutations                              | facility owner + wallet      | advanced                   | hidden in strict V1                                  |
| Wallet             | `createWalletDeposit`, `confirmWalletDeposit`                         | auth + facility              | pending/approved/failed    | account only, no withdrawal                          |
| Auth               | `requireAuth`, Neon JWKS                                              | server                       | authorized/denied          | no client-derived permission                         |

## 6. Régressions à protéger

### Métier

- `createPurchaseIntent` crée bien `pending`, jamais QR automatiquement.
- `createTransactionQr` génère le QR après offre et régénère un QR expiré sur la même transaction.
- `redeemCheckout` fait passer `qr_generated`/`qr_verified` à `payment_pending`, jamais à `paid`.
- Seul le buyer confirme payment puis receipt.
- Une facility unclaimed reste visible mais non achetable.
- Une mutation seller vérifie ownership serveur.
- Free/Pro limits restent server-enforced.
- Wallet pending n’est pas spendable et aucun retrait n’est affiché.

### UI

- Les noms d’étapes `Intention`, `Offre`, `QR`, `Paiement`, `Réception` sont visibles à 320/375/390/768/1280 px.
- Le preview caméra reste monté pendant permission et actif tant que le stream fonctionne.
- BarcodeDetector absent ne ferme pas le preview et garde le fallback manuel.
- Chaque stream track est arrêté une fois.
- Le dock n’est jamais masqué sous une sheet ou une safe-area.
- Enter et bouton de recherche appellent le même handler.
- Query et paramètres sont restaurés après auth.
- Back/close revient à la carte et conserve le contexte.

## 7. Ordre de découpage recommandé

1. Primitives et `TransactionProgress`.
2. Shell map partagé et navigation unique.
3. Buyer dock/cards/facility/availability.
4. Transaction thread et orders thin history.
5. Seller shell map-first et lazy payload.
6. CameraScannerSheet.
7. Onboarding/catalogue/coupon basic.
8. Account notifications/wallet limité.
9. Tests visuels, E2E et production.

## 8. Phase 0 — décision de sortie

La Phase 0 est considérée terminée : la baseline est reproductible, les contrats critiques sont connus, les surfaces ont été classées et les régressions à protéger sont listées. La prochaine modification de code peut commencer par les primitives visuelles et le nouveau `TransactionProgress`, dans un commit atomique séparé.
