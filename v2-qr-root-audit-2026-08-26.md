# Omni V2 — Root audit QR public, coupon et transaction

**Date :** 2026-08-26  
**Statut :** Audit vérifié ; aucune modification de code dans cet audit  
**Source :** `src/server/trunk-repository.ts`, `src/server/http.ts`, `src/trunk/api.ts`, `src/trunk/types.ts`

## Décision produit

Omni possède deux QR distincts.

| Objet | But | Contenu/autorité | Lecteur |
|---|---|---|---|
| **QR public de facilité** | Faire découvrir une facilité, ouvrir sa fiche, son catalogue et ses offres publiques | Référence publique de facilité et campagne/source facultative ; aucune transaction, aucun Buyer, aucun coupon privé | Buyer |
| **QR transactionnel Buyer** | Relier une transaction précise au Buyer, au coupon/avantage et au snapshot de vente | Référence expirable et replay-safe résolue côté serveur vers Buyer, Seller, facilité, produit, quantité, prix, réduction, lieu, temps et état de consommation | Seller |

Le QR transactionnel n’est pas le coupon. Le coupon/avantage est lié au compte Buyer et conservé côté serveur. Le QR ne transporte qu’une référence vérifiable ; le serveur ne doit jamais faire confiance à un prix, une réduction, une identité ou un état envoyés dans le payload client.

## État vérifié du code V2

### Émission actuelle

`trunk-repository.ts:1806–1864` expose `issueQrToken`.

L’émetteur actuel :

- génère un token aléatoire et son hash ;
- fixe une expiration de dix minutes ;
- exige un compte dont `onboarding_state` est `seller_ready` ou `complete` ;
- exige que l’acteur soit membre Seller de la transaction ;
- exige l’état `intent_created` ;
- insère dans `v2_qr_tokens` et avance l’événement vers `qr_ready` ;
- écrit un audit `qr_issued` avec la raison `seller_issued`.

**Décalage :** l’émetteur actuel est Seller-owned. Le contrat confirmé exige que le Buyer obtienne/présente le QR après liaison de l’offre/coupon à son compte. L’actuel endpoint `/api/v2/qr-issuances` est donc une primitive du mini-cycle précédent, pas le contrat final du Buyer handoff.

### Vérification actuelle

`trunk-repository.ts:1972–2043` expose `verifyQrToken`.

Le vérificateur actuel :

- exige l’authentification du Seller membre de la transaction ;
- exige `transactionId`, `tokenHash`, token non vérifié, `replay_count = 0` et expiration future ;
- exige l’état courant `qr_ready` ;
- verrouille le token, marque `verified_at`, incrémente `replay_count` et écrit `qr_verified` ;
- refuse le rejeu ou les tokens invalides/expirés.

**Ce qui est bon :** autorisation Seller côté serveur, expiration, verrouillage, anti-replay et audit sont déjà présents.

**Ce qui manque :** le résultat est essentiellement `accepted`, `transactionId`, `verifiedAt` et `nextReplayCount`. Le contrat final doit résoudre et retourner, selon la politique de confidentialité, le snapshot nécessaire à la caisse : facilité, produit, quantité, prix brut, réduction/coupon applicable, prix net, devise, expiration et prochaine action. La résolution doit venir de la transaction persistée, pas du QR.

### Création d’intent actuelle

`trunk-repository.ts:1866–1970` expose `createPurchaseIntent` pour une réponse de disponibilité.

Le snapshot actuel insère notamment `buyer_account_id`, `facility_id`, `product_id`, quantité, prix unitaire, `coupon_code`, montant net calculé et observation. Cette voie ne constitue pas encore le nouveau type `onsite_offer` et le coupon n’est pas encore modélisé comme une liaison account-bound complète avec état de consommation et snapshot de réduction.

## Contrat Root requis

### Types d’origine

Le serveur doit distinguer au minimum :

- `discovery_availability` : recherche/disponibilité avant déplacement ;
- `onsite_facility_qr` : entrée publique par QR de facilité ;
- `onsite_offer` : intent créé après sélection d’un produit et validation d’une offre sur place ;
- `seller_shared_link` : reprise authentifiée depuis un lien sûr.

### Entités et relations

Le Root devra relier :

```text
public_facility_qr
  → public facility/catalogue context

buyer_account
  → eligible_offer/coupon_binding
  → transaction_snapshot
  → buyer_transaction_qr_reference
  → seller_verification
  → external_payment_declaration
  → seller_payment_acknowledged
  → fulfilment_completed
  → eligible_review
```

### Invariants

1. Un QR public de facilité ne peut jamais ouvrir un chat, un itinéraire, un contact privé ou une transaction.
2. Un QR transactionnel ne peut être émis qu’après un intent autorisé et un snapshot persistant.
3. Le coupon/avantage est lié au compte Buyer et à la transaction ; il ne peut pas être réutilisé, transféré ou appliqué à un autre Buyer.
4. Le QR transactionnel est expirable, transaction-bound, replay-safe et sans données privées réutilisables.
5. Le Seller ne peut vérifier qu’une transaction dont il est membre et pour une facilité qu’il est autorisé à opérer.
6. `qr_verified`, `discount_acknowledged`, `external_payment_declared`, `seller_payment_acknowledged` et `fulfilment_completed` sont des événements distincts.
7. Une vérification QR ne consomme pas automatiquement le coupon si la politique exige encore l’acceptation du Seller ou la confirmation de paiement.
8. Un avis et une transaction crédibilisante ne peuvent être créés qu’après un fulfilment éligible.

## Séquencement Nature Way

**Seed :** deux QR, deux jobs utilisateur, aucune fusion.  
**Species :** fiche publique facility versus carte privée de transaction/caisse.  
**Root :** migration du Seller issuer actuel vers Buyer transaction QR, liaison coupon account-bound, snapshot de prix et résultat de vérification autorisé.  
**Trunk :** un parcours sur place complet de l’entrée publique jusqu’au fulfilment.  
**Heartwood :** tests de mauvais Buyer, mauvais Seller, mauvais facility, expiration, rejeu, changement de prix, coupon réutilisé, double confirmation et abandon.  
**Rings :** preuve production distinguant découverte, offre activée, QR vérifié, paiement externe déclaré et vente finalisée.

## Conclusion

Le code actuel ne mélange pas directement les deux QR puisqu’il ne possède pas encore le QR public de facilité dans ce routeur, mais son modèle d’émission est inversé par rapport au contrat confirmé : il émet le QR depuis la surface Seller et ne porte pas encore explicitement la liaison coupon/account-bound du Buyer. Il faut donc corriger le Root avant d’ajouter l’UI caméra ou de présenter le flow comme finalisé.
