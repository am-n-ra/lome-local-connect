# Omni — Rapport final d’implémentation du flux transactionnel V1

**Auteur :** Manus AI  
**Date :** 18 août 2026  
**Branche certifiée :** `main`  
**Dernier commit :** `708290d` — `feat(transaction): persist last room across navigation`

## Synthèse exécutive

Le parcours transactionnel V1 est désormais structuré autour d’une **Transaction Room persistante et reprenable**. Le flux métier est : recherche, demande de disponibilité, sélection d’une réponse, **Je veux payer ici**, création immédiate de la transaction et du QR, vérification seller, choix d’un moyen de paiement externe, déclaration buyer, confirmation seller, remise ou livraison, confirmation de réception, avis obligatoire, puis complétion.

La carte MapLibre globe reste le fond permanent de l’expérience. Les panels transactionnels, le chat, les notifications et les actions seller sont des surfaces superposées ; ils ne remplacent pas le globe ni la présentation des pins. La production a été rechargée et vérifiée : le canvas MapLibre, le globe noir et blanc, les clusters de facilities, le champ de recherche, les notifications et le pill **« N transactions en cours · Reprendre »** sont visibles [1].

## Décisions produit verrouillées

| Sujet | Décision V1 | Contrôle implémenté |
|---|---|---|
| Création de la room | Le clic buyer sur `Je veux payer ici` crée immédiatement la transaction et son QR. | `createPurchaseIntent` écrit `qr_generated`, `qr_token`, `qr_expires_at`, puis les événements d’intention, d’offre et de QR [2]. |
| Identité transactionnelle | Le QR est l’identité partageable de la transaction, pas une étape séparée de confirmation de l’offre. | La carte buyer affiche directement le QR actif ; seule la régénération d’un QR expiré reste disponible [3]. |
| Paiement buyer-vendeur | Aucun paiement buyer-vendeur in-app en V1. | Les choix sont cash à la livraison, TMoney, Flooz ou autre paiement externe ; FedaPay reste réservé à la recharge Omni Wallet [4]. |
| Accès seller | Le vendeur reçoit une notification et un lien vers la transaction ciblée. | Les liens utilisent `/vendeur?transactionId=...`; le workspace seller ouvre l’onglet transaction et met en avant la room [5]. |
| Accès buyer | Le contact et l’itinéraire ne sont visibles qu’après l’intention ; le contact à distance est fourni après vérification QR. | `deriveTransactionRoomAccess` et `getTransactionTimeline` appliquent ces seuils [6]. |
| Résumabilité | Fermer un panneau ne supprime pas la transaction. | Pill global, `Mes demandes`, liens de notifications et `sessionStorage` conservent le dernier `transactionId` et le rôle [7]. |
| Complétion | La réception ne termine plus directement la transaction. Un avis est obligatoire. | Les nouveaux états `received` et `rating_pending` sont persistés avant `completed` [8]. |

## Machine d’état et invariants SQL

La machine V1 certifiée est la suivante :

```text
pending
  -> qr_generated
  -> qr_verified
  -> payment_pending
  -> paid
  -> fulfillment
  -> received ou rating_pending
  -> rating_pending
  -> completed
```

Les transitions sont contrôlées à la fois par les contrats TypeScript et par le trigger PostgreSQL. Le passage direct `fulfillment -> rating_pending` est autorisé pour l’action buyer unique **Je confirme la réception** ; `received -> rating_pending` reste disponible pour des événements importés ou des intégrations externes. Le saut `fulfillment -> completed` est interdit pour les nouvelles transactions [8] [9].

Les contraintes SQL conservent les valeurs de paiement déclaré, paiement seller confirmé et fulfillment dans les états `received`, `rating_pending` et `completed`. Le journal transactionnel accepte désormais `received_confirmed` et `rating_submitted`. Les anciennes transactions déjà `completed` restent valides comme données legacy ; elles ne sont pas réécrites automatiquement.

## Surface buyer

`TransactionThreadCard` affiche le nom de la facility, le montant, les cinq labels de progression — **Intention, Offre, QR, Paiement, Réception** —, le QR actif, le fil d’événements et le chat transactionnel. L’action calculée par `deriveTransactionRoomAction` est rendue sous forme de prochaine étape unique : présenter le QR, choisir le paiement, déclarer le paiement, confirmer la réception ou noter la transaction [3] [6].

Après `rating_pending`, la room affiche cinq étoiles, un commentaire optionnel et le bouton **Publier l’avis et terminer**. L’avis est envoyé au serveur avant la transition vers `completed`. L’écriture du payout seller reste idempotente grâce à la clé `transaction:payout:<transactionId>` et ne se produit qu’après la complétion.

`Mes demandes` précharge les timelines, permet de reprendre les transactions actives et maintient les conversations liées à la transaction. Le pill de carte indique le nombre de transactions actives et ouvre cette même surface de reprise.

## Surface seller

Le seller reçoit la notification au moment de l’intention et au fil des transitions importantes. Les notifications de QR vérifié, paiement déclaré, paiement confirmé, fulfillment, réception et rating pointent désormais vers la transaction exacte. `CheckoutPanel` conserve la caméra prête à scanner, le fallback manuel et la liste des transactions ; un deep-link `transactionId` ajoute au-dessus du scanner une room ciblée avec le montant, le moyen de paiement et l’action seller disponible.

Le scanner reste optionnel côté navigateur grâce à `BarcodeDetector`, mais la caméra est demandée explicitement sur HTTPS et l’entrée manuelle reste toujours disponible. Le seller peut confirmer le paiement externe, puis lancer la remise ou la livraison. Aucun retrait seller n’est exposé par ce flux V1.

## Correctif disponibilité critique

La migration `030_demand_credit_cost_allow_zero.sql` a été créée et appliquée. L’audit préalable a trouvé **7 demandes, 0 valeur nulle et 0 valeur négative**, avec un minimum de `1`. La contrainte Neon vérifiée est maintenant `CHECK (credit_cost >= 0)`, ce qui rend valides les checks manuels à facility unique et les checks bulk Pro gratuits [10].

## Certification automatisée

| Vérification | Résultat |
|---|---:|
| Fichiers Vitest | 9 / 9 réussis |
| Tests unitaires | 48 / 48 réussis |
| TypeScript | `pnpm exec tsc --noEmit` réussi |
| Build Vite/Nitro | réussi |
| Client-boundary guard | 42 artefacts JS et 165 fichiers source contrôlés |
| Audit fixtures demo | 1 utilisateur auth, 3 profils, 4 facilities, 0 transaction buyer sur le compte audité, 1 demande et 2 réponses |
| Migrations Neon | 030, 031 et 032 appliquées et vérifiées |
| Smoke production | globe MapLibre, pins/clusters, recherche, notifications et pill de reprise visibles |

Les assertions ajoutées couvrent notamment `fulfillment -> received`, `fulfillment -> rating_pending`, le rejet de `fulfillment -> completed`, `rating_pending -> completed`, l’action buyer de notation et l’absence de CTA de réception après passage en rating [11] [12].

## Résultats du smoke test production

La page `https://omni.sparkafrika.online/` répond et rend le globe MapLibre. Après chargement, le globe noir et blanc et les clusters de facilities sont visibles au centre. Le bouton de recherche fonctionne : la saisie de `ciment` puis le clic sur **Lancer la recherche** déclenche l’état `Recherche de la zone…`, l’animation de recherche et l’affichage de résultats ou du CTA de demande selon la couverture disponible [1].

Le pill **2 transactions en cours · Reprendre** ouvre `Mes demandes`, conserve le globe en arrière-plan et affiche timeline, choix de paiement externe et messages transactionnels. La sandbox de test bloque la localisation GPS ; ce résultat est une limitation du navigateur de test, pas une erreur SSR observée. La production a également présenté des fixtures historiques contenant encore l’ancien libellé de régénération QR ; le code livré réserve désormais ce CTA aux QR expirés et présente le QR dès les nouveaux intents [1] [13].

## Limites et suivi recommandé

La certification backend et UI est complète pour le flux V1 décrit ci-dessus, mais un véritable test de caméra doit encore être exécuté sur un téléphone réel HTTPS avec permission accordée et un QR physique devant l’objectif. Les tests de paiement seller restent des tests de transition et de données : le paiement buyer-vendeur est volontairement externe, donc Omni ne peut pas certifier un transfert TMoney/Flooz lui-même.

Il reste également recommandé de purger ou d’annoter les fixtures historiques de démonstration afin qu’elles ne suggèrent pas un ancien parcours de génération QR après déploiement. Les statuts `completed` historiques sans avis restent conservés pour compatibilité ; un futur script d’administration pourra les identifier sans les modifier automatiquement.

## Références

[1]: https://omni.sparkafrika.online/ "Omni — production smoke test"
[2]: ../src/lib/checkout.functions.ts "Omni checkout server functions"
[3]: ../src/components/omni/TransactionThreadCard.tsx "Shared buyer transaction room card"
[4]: ../src/lib/omni-v1-contracts.ts "Canonical Omni V1 contracts"
[5]: ../src/components/omni/vendor/CheckoutPanel.tsx "Seller QR and transaction workspace"
[6]: ../src/lib/omni-v1-contracts.unit.test.ts "Contract tests for room actions and access"
[7]: ../src/components/omni/CartePage.tsx "Buyer map shell and active transaction pill"
[8]: ../db/migrations/031_transaction_rating_states.sql "Transaction rating state migration"
[9]: ../db/migrations/032_allow_direct_rating_pending.sql "Direct receipt-to-rating transition migration"
[10]: ../db/migrations/030_demand_credit_cost_allow_zero.sql "Availability credit cost compatibility migration"
[11]: ../src/lib/transaction-state.unit.test.ts "Transaction UI state tests"
[12]: ../src/lib/omni-v1-contracts.unit.test.ts "Transaction contract transition tests"
[13]: docs/production-smoke-findings-2026-08-18.md "Recorded production smoke findings"
