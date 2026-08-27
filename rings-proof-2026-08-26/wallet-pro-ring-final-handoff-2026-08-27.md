# Wallet / Pro Facility-Scoped — Handoff final

**Projet :** Omni V2 · **Environnement :** production · **Date :** 2026-08-27 · **Autorité :** Nature Way / Heartwood → Rings

## Décision de ring

Le vertical slice **Wallet facility-scoped + activation Pro** est déployé et son chemin négatif principal est prouvé en production. La frontière entre le Wallet Omni, destiné aux services de plateforme, et les paiements transactionnels externes est visible dans l’interface et respectée par le flux testé. Le ring peut être accepté comme **partiellement prouvé pour une release contrôlée**, mais il ne doit pas encore être présenté comme une activation Pro réussie de bout en bout tant qu’un Wallet confirmé n’a pas permis d’observer un débit atomique et la création de l’entitlement.

> **Règle commerciale observée :** Pro coûte **10 USD par facilité et par mois**. Le débit utilise le Wallet Omni confirmé ; les paiements des ventes restent externes.

## Preuves acquises

| Gate | Preuve | Classe | Résultat |
|---|---|---|---|
| Release | Commit `25c7824`, déploiement Vercel `dpl_ABPgqHdP71gVeZV4yDsKTP7e7n9v` | Observée / externe | `READY`, cible production |
| Authentification publique | POST public `/api/v2/wallet/pro` avec UUID nul et clé d’idempotence synthétique | Observée | `401 AUTH_REQUIRED`; aucune activation publique possible |
| Seller autorisé | Session `demo@seller.omni`, espace vendeur et onglet Wallet | Observée / production | Contexte vendeur autorisé, facilité visible |
| Wallet | `Omni Demo Seller Hub` affichée en Free avec solde confirmé `$0.00` | Observée / production | `Free · 5 offres maximum`, Pro `$10.00 / mois` |
| Solde insuffisant | Clic confirmé sur `Passer en Pro` | Observée / production | POST `/api/v2/wallet/pro` → `409` |
| Message serveur | Log Vercel du même appel | Observée / externe | `WalletPolicyError: Pro activation requires an assigned facility slot and sufficient confirmed Wallet funds.` |
| État après rejet | UI après retour de la requête | Observée / production | Bouton réactivé, solde `$0.00`, plan toujours Free, message de politique affiché |
| Stabilité récente | Erreurs runtime agrégées des routes Wallet/Recharge/Pro/FedaPay sur 24 h | Observée / externe | Aucune erreur runtime agrégée trouvée; le `409` métier est attendu |
| FedaPay webhook | Probe webhook sans signature | Observée / production | `400 WEBHOOK_INVALID`; aucune réconciliation effectuée |

## Interprétation Heartwood

Le rejet `409` est cohérent avec la politique : la requête authentifiée ne peut pas débiter un Wallet confirmé insuffisant. La facilité reste en Free, ce qui prouve l’absence d’effet partiel visible. La route publique répond `401` avant toute validation métier, ce qui protège le trust boundary. La preuve ne démontre toutefois pas à elle seule la concurrence entre deux activations, l’idempotence d’une activation réussie, ni la création effective d’un entitlement après débit.

La configuration FedaPay n’a pas été engagée dans une recharge sandbox durant ce pass. Le dépôt confirme que l’adaptateur serveur attend `FEDAPAY_ENV` (`sandbox` ou `live`) et `FEDAPAY_SECRET_KEY`, mais ces valeurs ne doivent pas être imprimées ni déduites. L’interface Seller observée expose le solde et l’activation Pro, mais aucun bouton de recharge n’a été soumis pendant ce ring afin d’éviter une opération financière non préparée. Le webhook signé reste donc **protégé et non réconcilié sur un événement sandbox réel**.

## Gaps résiduels et prochaine action

| Gap | Statut | Action minimale | Owner |
|---|---|---|---|
| Activation Pro réussie | Non prouvée | Créditer le Wallet via une recharge sandbox confirmée, puis cliquer une fois sur Pro et vérifier solde, ledger, entitlement et retry idempotent | Omni / opérateur production |
| Recharge FedaPay complète | Non prouvée | Utiliser uniquement la configuration sandbox officielle et vérifier le retour signé du webhook | Omni / opérateur paiement |
| Ownership d’une autre facilité | Partiellement couvert par le contrat, non testé au navigateur | Répéter avec une facilité non assignée et confirmer le rejet sans mutation | Omni |
| Recharge UI | Partielle | Ajouter ou valider le parcours visible `Recharger`, états pending/confirmed/failed/canceled et devise locale XOF | Omni |
| Session navigateur Manus Computer | Opérationnelle dans ce pass | Conserver la pratique des comptes demo enregistrés, sans exposer de mot de passe dans les preuves | Omni |

## Handoff de release

**Milestone active :** commercialisation contrôlée du Wallet Omni et du plan Pro par facilité. **Gate actuelle :** Heartwood négatif passé; Ring positif bloqué par l’absence de fonds confirmés et de recharge sandbox observée. **Release state :** production READY, autorisable pour démonstration contrôlée du rejet et de la séparation des paiements, non encore pour annoncer une activation Pro réussie. **Rollback :** revenir au déploiement production précédent via Vercel si une régression métier est observée; aucune migration destructive n’est requise pour ce rollback. **Review trigger :** première recharge sandbox confirmée, changement de schéma Wallet/entitlement, erreur runtime sur les routes mutualisées, ou modification du prix Pro.

## Références

[1]: https://omni.sparkafrika.online/ "Omni production"
[2]: https://vercel.com/kheirs-projects/omniview/ABPgqHdP71gVeZV4yDsKTP7e7n9v "Vercel deployment for commit 25c7824"


## Mise à jour de preuve — recharge pending

Le déploiement `dpl_FitFn2HZtDd3pJ2sxYz8DSe4Q8pC` (`READY`, production) expose maintenant le parcours Seller de recharge Wallet en XOF. Avec `demo@seller.omni`, une intention de **10 000 F CFA** a été créée avec succès ; l’interface affiche l’état **pending** et un checkout FedaPay. Le solde reste `$0.00` et la facilité reste Free avant confirmation, ce qui prouve que la création du checkout ne crédite pas le Wallet et ne déclenche pas Pro. Le checkout n’a pas été payé et le webhook signé n’a pas encore été observé ; la confirmation financière reste donc non prouvée.
