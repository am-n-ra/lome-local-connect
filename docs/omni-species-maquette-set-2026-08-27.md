# Omni V2 — Species Maquette Set

**Statut :** Proposition de maquettes à valider avant Root et nouveau code.

Ce document complète `omni-species-blueprint-2026-08-27.md`. Il décrit les écrans et états nécessaires pour que la relation compte–compagnie–facilité, la certification, la confirmation commerciale et le bonus Seller ne soient pas improvisés pendant l’implémentation.

## 1. Règle de contexte

Le Seller entre d’abord dans **Mes compagnies**, sélectionne une compagnie, puis travaille dans **Mes facilités**. Un bandeau de contexte persistant doit afficher `Compagnie sélectionnée / Facilité sélectionnée`. Toute action de catalogue, stock Omni, Pro, ventes, QR public et Wallet/Rewards est bornée à cette facilité.

| Élément | Ne doit jamais signifier |
| --- | --- |
| Compte Seller | Que toutes les compagnies ou facilités sont certifiées |
| Compagnie | Que toutes ses facilités partagent le Pro, le stock ou le compteur de ventes |
| Badge `certified` | Que la facilité a déjà réalisé trois ventes |
| Badge `confirmed` | Que les autres facilités de la compagnie sont confirmées |
| QR public | Un QR de transaction ou une preuve de paiement |
| Bonus de 20 $ | Un paiement vendeur transférable ou le solde de ventes |

## 2. Écran « Mes compagnies »

L’écran présente les compagnies sous forme de cartes compactes. Chaque carte montre le nom, le nombre de facilités, les facilités certifiées/confirmées et l’action `Ouvrir`. Les actions principales sont `Créer une compagnie` et `Ajouter une facilité à une compagnie`.

L’état vide explique : « Créez votre compagnie pour gérer ses facilités, ses offres et son activité Omni. » L’état erreur propose `Réessayer` sans effacer le contexte local.

## 3. Écran « Mes facilités »

Chaque carte de facilité affiche : nom, adresse courte, pin de carte, statut public, statut de certification, compteur de ventes vérifiées et état Pro propre à la facilité.

Exemple de hiérarchie :

```text
[Nom de la facilité]                         [Ouvrir]
[Adresse courte]              [Certifiée Omni]
[Confiance commerciale]       2/3 ventes vérifiées
[Pro de cette facilité]       Actif / Free
[QR public] [Produits] [Gérer]
```

Une facilité `Non revendiquée` affiche `Revendiquer cette facilité`, et non les outils Seller complets. Une facilité appartenant au Seller affiche `Gérer la facilité`.

## 4. Créer une compagnie puis une facilité

Le parcours est guidé et sauvegardable :

1. Le Seller crée ou sélectionne une compagnie.
2. Il renseigne le nom public de la facilité, son type, son adresse et ses contacts.
3. La carte est visible dans le formulaire. La position actuelle est proposée uniquement après une action explicite ; le pin reste déplaçable.
4. Il ajoute les informations publiques et les preuves privées nécessaires à la revue.
5. Un écran récapitulatif sépare clairement ce qui sera public de ce qui sera privé.
6. La soumission crée l’état `En revue` et affiche le délai opérationnel comme attente de revue, jamais comme certification automatique.

Après soumission, la page de suivi affiche : `Brouillon`, `Soumise`, `En revue`, `Preuves supplémentaires demandées`, `Certifiée` ou `Rejetée`.

## 5. Revendiquer une facilité non revendiquée

La fiche d’une facilité publique non revendiquée porte un badge neutre `Non revendiquée`. Le CTA est `Je gère cette facilité` ou `Revendiquer cette facilité`, jamais `Certifier`.

Le Seller voit un écran de claim avec : identité de la facilité, preuve demandée, upload privé, commentaire, consentement et bouton `Envoyer pour revue`. Après envoi, la fiche devient `Claim en revue` pour ce claimant, tandis que le public continue de voir la facilité comme `En revue`.

Le refus doit comporter un motif actionnable : `Preuve illisible`, `Informations incohérentes`, `Facilité déjà attribuée` ou `Autre motif`. Le Seller peut corriger et soumettre à nouveau sans créer une seconde facilité concurrente.

## 6. Certification et confirmation commerciale

La fiche Seller sépare deux lignes :

```text
Identité et présence         [Certifiée Omni]
Confiance commerciale        [2/3 ventes vérifiées]
```

Le parcours après certification commence à `Certifiée — 0/3 ventes`. Une vente vérifiée avance le compteur uniquement après les étapes transactionnelles attendues : transaction rattachée à la bonne facilité, paiement déclaré selon le moyen choisi, confirmation Seller, fulfilment et confirmation Buyer.

Les états à montrer sont :

| État | Message principal | Action |
| --- | --- | --- |
| Certifiée — 0/3 | « Votre facilité est certifiée. Réalisez 3 ventes vérifiées pour obtenir la confirmation et le bonus de 20 $. » | `Voir comment recevoir des ventes` |
| Certifiée — 1/3 | « Encore 2 ventes vérifiées. » | `Partager le QR public` |
| Certifiée — 2/3 | « Encore 1 vente vérifiée pour débloquer 20 $. » | `Partager le QR public` |
| Confirmée — 3/3 | « Facilité confirmée. Bonus de 20 $ débloqué. » | `Ouvrir Wallet/Rewards` |

Une transaction annulée, refusée, expirée, non vérifiée ou rattachée à une autre facilité ne fait pas progresser ce compteur.

## 7. Carte de succès et bonus Seller de 20 $

Au passage à `3/3`, afficher une carte de succès non ambiguë :

> **Félicitations, votre facilité est maintenant confirmée.**
>
> **20 $ ont été ajoutés à votre Wallet/Rewards pour essayer Omni Pro sur cette facilité et d’autres services éligibles.**
>
> Ce bonus est distinct du solde de vos ventes et son utilisation dépend des règles Omni.

Les actions sont `Essayer Omni Pro`, `Voir les services éligibles` et `Plus tard`. L’activation Pro n’est jamais automatique. Le Seller peut rester en Free et conserver le bonus selon les règles Root à définir.

Le Wallet doit séparer au minimum `Solde des ventes`, `Bonus de confirmation`, `Crédits Bulk/usage` et `Abonnement Pro de la facilité`. Le bonus doit afficher sa facilité d’origine, sa date d’attribution, son statut `Disponible / Réservé / Utilisé / Expiré` et l’historique de consommation.

## 8. QR publics et QR transactionnels

Le QR public est attaché à la facilité. Il ouvre sa fiche, ses offres et son catalogue. Il peut être téléchargé, imprimé ou partagé depuis l’écran Seller.

Le QR transactionnel est créé lorsque le Buyer confirme `Je veux acheter`. Il est attaché au Buyer, à l’intent devenu transaction, aux lignes de produits, au prix, à la réduction, à la facilité et à l’expiration. Il ouvre le chat transactionnel et ne doit jamais être affiché comme le QR permanent de la boutique.

## 9. Écran Admin / Reviewer

La queue de revue affiche séparément `Nouvelle création` et `Claim de facilité existante`. Le Reviewer voit les preuves privées, l’entité compagnie/facilité ciblée, l’historique de soumissions et les mutations précédentes. Les décisions sont `Certifier`, `Demander des preuves` et `Rejeter`, avec motif obligatoire et audit.

Le compteur de ventes ne peut pas être modifié depuis une interface de revue. Une correction exceptionnelle doit être une opération Admin autorisée, auditée, motivée et distincte de la certification.

## 10. Acceptance Species

La Species sera prête pour Root lorsque le fondateur aura validé ces écrans : Mes compagnies, Mes facilités, créer une compagnie, créer une facilité avec carte, revendiquer une facilité non revendiquée, certification en revue, certification accordée à `0/3`, progression `1/3` et `2/3`, confirmation `3/3`, carte de succès du bonus de 20 $, Wallet/Rewards, partage du QR public et séparation visuelle du QR transactionnel.

Aucun écran ne doit afficher une certification ou une confirmation qui n’est pas fournie par le serveur. Aucun compteur de ventes ou bonus ne doit être déduit d’un simple état local ou d’une fixture de démonstration.

## 11. Décisions Root à prendre après validation visuelle

| Sujet | Question contractuelle |
| --- | --- |
| Compagnies | Qui peut créer, modifier, archiver et inviter un gestionnaire ? |
| Facilités | Comment empêcher les doublons de création et les claims concurrents ? |
| Certification | Quels types de preuves et quels rôles peuvent décider ? |
| Ventes | Quels événements exacts rendent une vente éligible au compteur ? |
| Bonus 20 $ | Devise d’affichage, expiration, consommation, remboursement et portée par facilité |
| Pro | Comment le bonus finance-t-il un essai sans convertir le Wallet en paiement vendeur ? |
| Audit | Quels événements et corrections doivent être journalisés ? |
| Fixtures | Comment marquer les comptes et facilités de test pour empêcher les fausses preuves ? |

**Handoff Species → Root :** la prochaine unité doit produire le schéma d’état, les invariants et les contrats API avant toute modification de l’interface existante.

## 12. Maquettes visuelles générées — proposition à valider

Un premier lot visuel a été généré dans `docs/species-mockups/`. Il constitue la proposition concrète de Species, mais ne devient pas le design verrouillé avant validation explicite du fondateur.

| Fichier | Écran |
|---|---|
| `01-seller-facility-confirmation.png` | Facilité Seller certifiée, progression 2/3 et bonus en attente |
| `02-seller-facilities-company.png` | Mes compagnies et rattachement des facilités |
| `03-facility-claim-review.png` | Fiche publique non revendiquée et claim en revue |
| `04-create-facility-map.png` | Création de facilité avec carte, pin déplaçable et permission de localisation |
| `05-buyer-search-availability.png` | Recherche Buyer, fraîcheur, vérification et Bulk Facility |
| `06-admin-review-queue.png` | Queue Admin/Reviewer séparant créations et claims |

**Gate actuelle :** proposition visuelle, en attente d’acceptation ou de corrections du fondateur. Aucun nouveau code d’interface ne doit être écrit à partir de ces images avant la revue.

## 13. Recentrage Buyer-first — nouvelle direction à valider

La correction du fondateur réouvre la direction principale : Omni est présenté comme un moteur de recherche local. Le globe/carte est la landing et le premier élément d’identité ; les surfaces Seller et Admin sont des branches contextuelles, non la navigation principale.

| Fichier | État de l’expérience |
|---|---|
| `00-buyer-globe-search-landing.png` | Landing globe/carte, recherche dominante, localisation explicite et aucune navigation de rôle |
| `07-buyer-search-active-map.png` | Recherche active sur la carte avec résultats, fraîcheur, quantité, budget et Bulk Facility |
| `08-public-qr-facility-entry.png` | Entrée par QR public d’une facilité, séparée visuellement du QR transactionnel |

La première proposition de Seller/Company reste utile comme branche secondaire, mais ne doit plus dicter la présentation d’Omni à l’ouverture. La gate Species doit d’abord valider cette séquence Buyer : **ouvrir → voir le globe → rechercher ou scanner → comparer → vérifier → décider d’acheter**.

**Statut :** nouvelle proposition visuelle, en attente de validation explicite du fondateur.
