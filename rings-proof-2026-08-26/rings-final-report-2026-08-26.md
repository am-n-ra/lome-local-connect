# Omni V2 — Rings final report

## Objet

Cette preuve vérifie le parcours réel du **Verified Offer Network** sur l’origine canonique `https://omni.sparkafrika.online/`. Le QR public de facilité est traité comme un mécanisme de découverte uniquement. Le QR transactionnel est account-bound et relie le Buyer, l’offre choisie, le snapshot de prix et la transaction.

## Résultat observé

| Étape | Acteur | Résultat observé | Statut |
|---|---|---|---|
| Demande de disponibilité | Buyer | `Root proof demo product`, quantité 1, réponse Seller disponible | Réussi |
| Préparation de l’intention | Buyer | Transaction `dc0af849-d82e-49b3-ac3d-238d8e81c423` créée | Réussi |
| Émission du QR | Buyer | QR transactionnel frais généré et présenté | Réussi |
| Vérification du QR | Seller | Snapshot serveur chargé ; quantité 1 ; total net 200 F CFA | Réussi |
| Confirmation prématurée | Seller | Refus correct tant que le Buyer n’a pas déclaré le paiement | Réussi — garde métier |
| Déclaration du paiement externe | Buyer | Méthode Mobile money sélectionnée ; état `Paiement déclaré` | Réussi |
| Confirmation au comptoir | Seller | État `Paiement confirmé` affiché | Réussi |
| Préparation de la remise | Seller | Bouton passé à `Marquer comme remis`, puis action exécutée | Action acceptée par l’interface |

Le paiement n’a pas été traité par Omni. Le test a validé uniquement la déclaration d’un paiement externe, puis l’accusé de réception Seller et la remise.

## Garde métier importante

Lorsque le Seller a tenté de confirmer avant la déclaration Buyer, le serveur a retourné :

> Payment confirmation requires a seller member and a buyer declaration in payment-declared state.

Cette réponse confirme l’ordre métier attendu : **Buyer déclare le paiement externe, puis Seller confirme au comptoir**. Le scan du QR seul ne suffit pas à confirmer le paiement.

## Anomalies à corriger avant annonce publique

L’écran de vérification rend actuellement le produit sous l’identifiant `30000000-0000-0000-0000-000000000101` au lieu du nom `Root proof demo product`. Le mapping produit doit être corrigé dans le snapshot ou dans le rendu Seller.

Après `Marquer comme remis`, l’interface revient à l’état général du scanner et n’affiche pas de confirmation persistante de remise. Cette transition doit recevoir un état visuel explicite et idempotent, puis être vérifiée depuis la vue Buyer.

La preuve runtime Vercel filtrée par l’identifiant de transaction n’a retourné aucun log exploitable ; cela ne contredit pas les états HTTP/UI observés, mais justifie l’ajout d’un correlation ID et d’un événement d’audit transactionnel avant une campagne terrain.

## Mise à jour du slice rating — 26 août 2026

Le cycle Buyer post-réception a été complété dans le code. Après `fulfilled → received`, le Buyer voit maintenant un formulaire obligatoire avec un score de 1 à 5 et une note limitée à 500 caractères. La soumission passe par `POST /api/v2/transaction-ratings`, vérifie l’authentification et l’appartenance Buyer côté serveur, écrit dans `v2_ratings`, ajoute l’événement `rated` et produit un audit idempotent. Une relecture d’une transaction déjà notée renvoie l’avis existant au lieu de créer un doublon.

La correction d’affichage du Seller est également intégrée : le récapitulatif présente le nom du produit issu de `v2_products`, avec l’UUID conservé comme référence secondaire. Le Seller voit désormais un état persistant `Remise enregistrée` après `Marquer comme remis`.

Les validations locales sont vertes : 19 fichiers de test, 140 tests, contrôle de frontière client et build Vercel avec 12 fonctions mutualisées. Le commit `97c0898` (`feat: persist mandatory buyer ratings`) a été poussé sur `omni-v2-rebuild`; le déploiement de production `dpl_3CetZ8SQ9WYNmjPSzzy9fTACVSPD` a été créé et était encore `BUILDING` lors du dernier contrôle. La preuve live doit être rejouée après passage à `READY`.

## Décision Founder HQ

Le gate **Heartwood QR → paiement externe → confirmation Seller** est fonctionnel sur la production canonique avec comptes de test alternés. Le gate **Rings complet** reste conditionnel à deux petites durcifications : confirmation persistante de fulfilment et avis obligatoire post-transaction. Le prochain travail prioritaire n’est pas le paiement vendeur ; c’est la clôture transactionnelle lisible, la review obligatoire et le mapping correct du produit.

## Pièces associées

- `buyer-transaction-qr-root-proof.png`
- `buyer-transaction-qr-fresh.png`
- `buyer-transaction-qr-regenerated.png`
- `buyer-qr-proof.md`
- `transaction-flow-proof.md`

Les payloads QR ne doivent pas être publiés : ils constituent des informations privées de transaction.
