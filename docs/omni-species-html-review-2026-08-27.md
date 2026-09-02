# Omni Species — Revue finale de la maquette HTML

**Date :** 27 août 2026  
**Périmètre :** prototype HTML isolé, sans génération d’images et sans mutation du produit de production.  
**Référence :** Omni World Layer, moteur de recherche local map-first.

## Décision de conception vérifiée

Omni s’ouvre comme un moteur de recherche local. Le globe/carte est la landing, la recherche est le premier geste et les espaces Seller/Admin apparaissent comme des contextes secondaires protégés. La maquette utilise une carte stylisée CSS et les images fournies comme références visuelles ; elle ne prétend pas simuler un fond cartographique réel ni un backend de production.

## Couverture observée

| Zone | Preuve observée | État |
|---|---|---|
| Landing | Carte Lomé, search dock, localisation facultative, navigation basse | Observé |
| Recherche non authentifiée | Query conservée, prompt auth contextuel | Observé |
| Auth/onboarding | Auth, étapes 1/3, 2/3, 3/3, reprise automatique | Observé |
| Résultats | Offre fraîche, offre à vérifier, quantité, budget, distance | Observé |
| Facility | QR public, produits, fraîcheur par produit, vérification manuelle | Observé |
| Bulk Facility | Buyer Pro, crédits, coût, réponses mixtes | Observé |
| Panier/intent | Multi-produit, remise, total estimé, intent sans engagement | Observé |
| Décision | Stock confirmé, `Je veux acheter` séparé du paiement | Observé |
| Transaction | QR transactionnel, coupon, expiration, chat, itinéraire, contacts | Observé |
| Paiement/fulfilment | Mobile Money, Carte, Espèces déclarées, retrait/livraison | Observé |
| Clôture | Réception, transaction clôturée, avis requis | Observé |
| Seller | Compagnies, facilités, progression 2/3, bonus 20 $, catalogue, stock Omni, scan QR | Observé |
| Création facility | Stepper 1/4, pin déplaçable, brouillon, preuves | Observé |
| Admin/Reviewer | Créations, claims, audit, compteur hors revue | Observé |
| Recovery | Aucun résultat, carte indisponible, permission refusée, session expirée, crédits épuisés | Observé après cache-buster |

## Invariants d’expérience

La disponibilité manuelle reste gratuite. Le Bulk Facility est le service facturé au Buyer Pro. Une donnée fraîche peut répondre automatiquement ; une donnée ancienne demande une vérification. L’intention précède la transaction. La transaction et son QR apparaissent après `Je veux acheter`. Le QR public permanent d’une facilité sert à la découverte et ne doit jamais être traité comme un QR transactionnel. Le Seller et l’Admin disposent de contextes séparés ; la revue Admin ne modifie pas le compteur commercial.

## Gaps résiduels avant Species acceptée

Le prototype reste une maquette HTML à données bornées. Les transitions Seller/Admin sont représentées mais ne constituent pas une preuve d’autorisation serveur. Le walkthrough par index visuel peut cibler un mauvais bouton lorsque l’état change ; les futurs tests doivent utiliser des sélecteurs stables. Le responsive réel, le focus clavier et les preuves sur appareils 320/390/768/1280 px restent à vérifier. Les règles d’accès, les données Neon, le paiement réel et la concurrence appartiennent au Root/Trunk et ne doivent pas être déduits de cette maquette.

## Gate fondateur

La Species peut être acceptée uniquement si le fondateur confirme que la hiérarchie map-first, l’ordre des transitions, la distinction des deux QR, la disponibilité hybride, le Bulk Facility, le cycle Seller compagnie–facilité–certification–3 ventes–bonus 20 $, et la séparation Admin/Reviewer correspondent à l’expérience souhaitée. Après cette décision, le Root pourra reprendre les contrats déjà documentés ; avant cette décision, aucune nouvelle implémentation d’interface de production ne doit être lancée.

## Preuves associées

- `docs/omni-species-html/index.html`
- `docs/omni-species-html/app.js`
- `docs/omni-species-html-walkthrough-2026-08-27.md`
- `docs/omni-species-buyer-flow-experience-contract-2026-08-27.md`
- `docs/omni-species-screen-edit-specs-2026-08-27.md`
- `docs/omni-species-complete-maquette-inventory-2026-08-27.md`
