# Omni V1 — Matrice UI, états, contrats et tests

> Cette matrice accompagne `omni-v1-ui-one-shot-build-prompt.md`. Elle ne remplace pas `OMNI_MASTER_PRODUCT_INTERFACE.md` ; elle transforme ses règles V1 en contrats de rendu et d’acceptance.

## 1. Règles de lecture

- **Server authoritative** : l’UI ne peut pas inventer l’état ou l’éligibilité.
- **Visible** : surface rendue dans la navigation V1.
- **Flagged** : surface rendue seulement si un feature flag/plan/contrat est actif.
- **Deferred** : surface absente de la navigation primaire.
- **Retry** : toute erreur récupérable doit proposer une action explicite sans effacer le contexte utilisateur.

## 2. Shell map-first

| Surface          | États obligatoires                                                                                                | Données/contrat                                 | Rendu attendu                                                                                   | Test                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Map shell buyer  | resting, location pending, precise, approximate, denied, fallback, loading, results, empty, error, reduced-motion | MapLibre, `listFacilitiesInBounds`, geolocation | carte toujours montée ; fond crème ; eau gris/noir ; terres blanches ; chrome top-right minimal | browser : ouvrir, autoriser/refuser, zoom/pan, search |
| Map shell seller | no facility, loading, active facility, multiple facilities, offline, error                                        | `getVendorShell`, facility ownership, MapCanvas | active facility ancre la carte ; aucune grille lourde par défaut                                | browser : seller fixture, switch facility             |
| Map chrome       | notification unread, menu open, unauthenticated                                                                   | auth + notifications                            | notifications et menu seulement ; pas de navbar globale                                         | DOM/a11y : aucun doublon                              |
| Map controls     | zoom, recenter exact, approximate explore, location retry                                                         | geolocation state                               | contrôles à gauche ; label truthful                                                             | responsive visual                                     |
| Facility pins    | claimed, unclaimed, unconfirmed, certified, confirmed, selected, available, low-stock                             | facility/search result                          | pins réels, source-backed, état visible sans couleur seule                                      | search fixture + OSM fixture                          |

## 3. Buyer search and discovery

| Surface          | États obligatoires                                                | Contrat                        | CTA autorisés                             | Test                                  |
| ---------------- | ----------------------------------------------------------------- | ------------------------------ | ----------------------------------------- | ------------------------------------- |
| Search input     | idle, focused, query, executing, auth pending, restored, error    | pending search/auth            | Enter et bouton appellent le même handler | unauthenticated query restore         |
| Search dock      | primary row, refine row, structured row, location row, action row | search params + viewport state | aucune row ne chevauche une autre         | 320/375/390/768/1280                  |
| Quantity/budget  | hidden optional, visible, edited, invalid, restored               | search input schema            | éditer sans changer de page               | mobile focus/no zoom                  |
| Category/refine  | closed, open, selected, scrollable                                | category/search input          | sélectionner filtre/recherche             | keyboard/touch                        |
| Discovery        | loading, loaded, partial, empty, error, retry                     | `listFacilitiesInBounds`       | retry sans perte de query                 | Resource Timing + DOM                 |
| Search auth wall | pending query, sign-in, signup, restored                          | Neon Auth                      | aucune recherche backend avant auth       | logout → query → auth → exact restore |
| Result rail      | no results, results, selected, back to results                    | facilities/products            | ouvrir facility ; conserver rail/back     | browser buyer                         |
| Request surface  | no direct result, submitting, submitted, error                    | demand request                 | remplacer action row, ne pas s’empiler    | no-result layout                      |

## 4. Facility and availability

| Surface               | États obligatoires                                                                    | Contrat                     | Rendu/permission                                                | Test                      |
| --------------------- | ------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------- | ------------------------- |
| Facility card         | claimed, unclaimed, online, offline, available, partial, unavailable, sponsored gated | search result + eligibility | produit recherché en premier ; provenance ; statut ; CTA valide | claimed/unclaimed fixture |
| Unclaimed sheet       | view, claim available, claim pending, error                                           | facility detail/claim       | view/share/claim only ; pas purchase intent                     | server rejects intent     |
| Claimed sheet         | loading, loaded, no product, product, error                                           | facility/products/coupons   | availability CTA ; intent seulement après availability          | facility detail           |
| Availability sheet    | step 1 product, step 2 facility/mode, step 3 constraints/send                         | manual/bulk functions       | step names visibles ; quota visible ; footer stable             | manual + bulk quota       |
| Availability response | available, partial, unavailable, alternative, timeout, no response, retry             | seller responses            | ranking full → partial → unavailable ; best option guidance     | response matrix           |
| Availability error    | typed server error, network error, retry                                              | typed errors                | conserver facility/query/params                                 | error/retry browser       |

## 5. Transaction state and CTA matrix

Canonical server states: `pending`, `offer_confirmed`, `qr_generated`, `seller_verified`, `payment_pending`, `paid`, `received`, `completed`, plus `cancelled`, `failed`, `expired`.

| Server state            | Label UI             | Visible step | QR                            | Buyer CTA                          | Seller CTA                          | Event attendu                             |
| ----------------------- | -------------------- | -----------: | ----------------------------- | ---------------------------------- | ----------------------------------- | ----------------------------------------- |
| `pending`               | Offre à confirmer    | Offre active | absent                        | Confirmer l’offre et générer le QR | aucun paiement                      | `intent_created`                          |
| `offer_confirmed`       | Offre confirmée      | QR à générer | absent ou génération en cours | Générer le QR                      | aucun paiement                      | `offer_confirmed`                         |
| `qr_generated` + actif  | QR actif             |           QR | visible                       | afficher/partager le QR            | Scanner QR                          | `qr_generated`                            |
| `qr_generated` + expiré | QR expiré            | QR en erreur | absent/invalide               | Régénérer le QR                    | attendre nouveau QR                 | `qr_generated` avec regeneration metadata |
| `seller_verified`       | QR vérifié           |     Paiement | QR historique                 | aucun paiement automatique         | afficher paiement pending           | `seller_verified`                         |
| `payment_pending`       | Paiement à confirmer |     Paiement | visible si utile              | J’ai payé                          | ne peut pas confirmer buyer payment | `payment_pending`                         |
| `paid`                  | Paiement confirmé    |    Réception | historique                    | Je confirme la réception           | fulfilment opérationnel             | `payment_confirmed`                       |
| `received`              | Produit reçu         |      Terminé | historique                    | aucun ou notation                  | aucun retrait                       | `product_received`                        |
| `completed`             | Transaction terminée |      Terminé | historique                    | noter/ouvrir thread                | historique                          | `completed`                               |
| `cancelled/failed`      | Annulée/échouée      |       erreur | absent                        | retry selon contrat                | retry selon contrat                 | error event                               |

### TransactionProgress

| Viewport        | Règle                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1280/768        | timeline horizontale avec labels complets sous les étapes ; largeur minimale par étape                              |
| 390/375/320     | timeline verticale ou rail horizontal scrollable ; étape active toujours nommée ; aucune étape réduite à un chiffre |
| lecteur d’écran | `aria-label` global et statut individuel `terminée/active/à venir/erreur`                                           |
| reduced motion  | pas d’animation essentielle ; état sémantique conservé                                                              |

## 6. CameraScannerSheet

| État                 | Stream                        | Video monté                     | Message                            | Actions                                          |
| -------------------- | ----------------------------- | ------------------------------- | ---------------------------------- | ------------------------------------------------ |
| `idle`               | non                           | oui dans shell                  | Prêt à scanner                     | Autoriser et démarrer la caméra, saisie manuelle |
| `permission_pending` | demandé                       | oui                             | Demande d’autorisation caméra…     | annuler/fermer, saisie manuelle                  |
| `preview_active`     | attaché et playing            | oui                             | Caméra active                      | Arrêter, saisir code, lancer détection           |
| `detecting`          | actif                         | oui                             | Recherche du QR…                   | arrêter, saisie manuelle                         |
| `code_detected`      | actif jusqu’à confirmation    | oui                             | Code lu, vérifiez avant validation | modifier, valider, annuler                       |
| `validation_pending` | actif ou stoppé explicitement | oui/shell                       | Validation…                        | disabled action                                  |
| `verified`           | stoppé après succès           | oui avec résultat ou état final | QR vérifié / Paiement pending      | fermer, voir transaction                         |
| `denied`             | non                           | oui                             | Accès refusé                       | retry navigateur, saisie manuelle                |
| `unsupported`        | non                           | oui                             | Caméra/scan auto indisponible      | saisie manuelle                                  |
| `error`              | stopped                       | oui                             | Caméra indisponible                | retry, saisie manuelle                           |
| `stopped`            | stopped                       | oui                             | Caméra arrêtée                     | redémarrer                                       |

### Invariants camera

1. `getUserMedia` ne part qu’après action explicite.
2. Le preview ne dépend pas de `BarcodeDetector`.
3. `video.srcObject` est attaché avant l’état active.
4. Le voyant caméra reste actif pendant preview/detection.
5. Un parent re-render ne coupe pas le stream.
6. Chaque track est stoppé une seule fois.
7. Détection ≠ validation ; validation est un CTA séparé.
8. Le fallback manuel reste disponible dans tous les états non vérifiés.

## 7. Seller V1 navigation

| Entrée             | Statut V1                   | Surface                | Contrat                      | Règle                           |
| ------------------ | --------------------------- | ---------------------- | ---------------------------- | ------------------------------- |
| Facility/aperçu    | Visible                     | float/sheet            | vendor shell/facilities      | active facility + buyer preview |
| Catalogue          | Visible                     | sheet                  | products/catalogue           | lazy load ; Free cap visible    |
| Demandes           | Visible                     | sheet                  | vendor requests/availability | manual responses                |
| Scanner QR         | Visible                     | sheet                  | redeem checkout              | camera + manual fallback        |
| Transactions       | Visible                     | sheet/page compact     | vendor transactions          | status/timeline                 |
| Coupons basic      | Flagged/visible if contract | nested catalogue/sheet | coupon functions             | percentage/fixed only           |
| Wallet/recharge    | Flagged                     | account sheet          | deposits/reconciliation      | no withdrawal                   |
| Agent              | Deferred/flagged            | absent by default      | feature flags                | no fake actions                 |
| Publicité avancée  | Deferred/flagged            | absent by default      | campaign contract            | no fake actions                 |
| Analytics advanced | Deferred                    | absent                 | analytics contract           | no placeholder tab              |
| Import massif      | Deferred                    | absent                 | import job contract          | no placeholder tab              |
| Subscription       | Account/flagged             | sheet                  | plan contract                | only if operational             |

## 8. Seller onboarding and forms

| Form              | Essential                                        | Advanced/collapsed                                  | Server authority                 | Acceptance                |
| ----------------- | ------------------------------------------------ | --------------------------------------------------- | -------------------------------- | ------------------------- |
| Seller onboarding | business name, type, category, location, contact | description, verification detail, plan/automation   | ownership, facility state, plan  | resume on mobile/desktop  |
| Product           | name, category/type, price, publication          | description, SKU, variant, media, facility override | product state, price, allocation | create/edit/pause/archive |
| Inventory         | total, Omni allocation, threshold                | movement reason/details                             | allocation-derived visible qty   | adjustment audit          |
| Coupon            | type, value, scope, period                       | minimum, cap, quantity bounds if supported          | eligibility/atomic redemption    | preview before publish    |
| Facility settings | online, hours, position                          | emergency shutdown, metadata                        | membership and mutation          | no route dead-end         |

## 9. Backend adapter checklist

| UI action          | Server contract               | Auth/ownership                        | Plan        | Idempotence              | Output/error                |
| ------------------ | ----------------------------- | ------------------------------------- | ----------- | ------------------------ | --------------------------- |
| viewport discovery | `listFacilitiesInBounds`      | public/auth policy                    | none        | request key/cache        | facilities or typed error   |
| facility open      | detail/products/coupons       | public for discovery                  | eligibility | read                     | facility context            |
| claim              | claim function                | authenticated claimant                | none        | claim key                | status/error                |
| availability       | demand/availability functions | buyer auth                            | bulk quota  | request id               | ranked responses/error      |
| purchase intent    | `createPurchaseIntent`        | buyer auth, claimed eligible facility | plan        | active intent uniqueness | pending intent/error        |
| offer/QR           | `createTransactionQr`         | buyer transaction owner               | none        | transaction id           | token/expiry/error          |
| expired QR         | same QR function              | owner + expired state                 | none        | same transaction         | new token + event           |
| seller redeem      | `redeemCheckout`              | seller facility membership            | none        | token idempotence        | seller verified/error       |
| buyer payment      | confirm payment               | buyer transaction owner               | none        | transaction id           | paid/already confirmed      |
| buyer receipt      | confirm received              | buyer transaction owner               | none        | transaction id           | completed/already completed |
| seller catalogue   | vendor product functions      | membership                            | Free/Pro    | mutation key             | product/error               |
| wallet top-up      | deposit/reconcile             | authenticated seller/buyer            | config      | provider/reference       | pending/approved/failed     |

## 10. Test matrix

| Test layer     | Required cases                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit           | transaction states, QR expiry, CTA eligibility, step labels, camera reducer, track cleanup, navigation flags, form schema                                  |
| Integration    | auth ownership, claimed/unclaimed purchase guard, Free cap, availability quota, QR idempotence, seller redeem, buyer payment/receipt, wallet no-withdrawal |
| Browser buyer  | map open, search, discovery, facility, availability, intent, chat, offer, QR, orders                                                                       |
| Browser seller | map shell, active facility, catalogue, requests, scanner, manual token, QR verified, recent transactions                                                   |
| Camera browser | permission pending, preview visible, play, detector absent, code detected, stop, reopen, error, fallback                                                   |
| Responsive     | 320, 375, 390, 768, 1280; no clipping, labels visible, safe area, keyboard focus                                                                           |
| Production     | build, typecheck, prettier, client boundary, routes 200, main/origin aligned, no secrets                                                                   |

## 11. Visual audit checklist

- [ ] Map remains visible behind every normal panel.
- [ ] Buyer and seller share cream/glass/quiet-map language.
- [ ] No top-left permanent brand mark on minimal map chrome.
- [ ] No global navbar duplicate.
- [ ] No dead seller tabs in V1.
- [ ] Transaction labels are readable, not number-only.
- [ ] Camera preview shows actual stream after permission.
- [ ] Camera indicator does not turn off immediately after authorization.
- [ ] Search dock rows do not overlap result rail or safe area.
- [ ] Product/coupon forms show purpose and one primary action.
- [ ] Unclaimed facility cannot purchase.
- [ ] Wallet never shows withdrawal.
- [ ] Loading, empty, error and retry states are intentional.
