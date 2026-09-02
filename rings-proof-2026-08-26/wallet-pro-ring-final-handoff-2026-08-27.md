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


## Mise à jour de preuve — échec contrôlé du checkout sandbox

L’intention pending existante de 10 000 F CFA a été reprise sans duplication. Le checkout FedaPay sandbox a affiché **« Transaction échouée. Veuillez réessayer »** après la saisie du moyen de paiement de test. Aucun webhook d’approbation n’a été observé ; le Wallet est resté inchangé et Pro n’a pas été activé. Le numéro de téléphone et le token checkout ne sont pas conservés. Le comportement d’échec est prouvé ; le chemin positif `approved → webhook signé → crédit confirmé → Pro` reste le gate suivant.


## Mise à jour — numéro sandbox officiel non reconnu

Un nouvel essai a utilisé le scénario de succès documenté par FedaPay pour MTN Bénin. Le checkout a été atteint et la soumission traitée, mais FedaPay a répondu que le numéro de compte Mobile Money était introuvable. Aucun webhook d’approbation, crédit Wallet ou activation Pro n’a suivi. Le chemin positif reste bloqué par la configuration ou l’identité de test reconnue par l’environnement provider ; aucune réussite financière n’est revendiquée.


## Vérification de configuration et observabilité — 2026-08-27

Le code attend les variables serveur `FEDAPAY_ENV`, `FEDAPAY_SECRET_KEY` et `FEDAPAY_WEBHOOK_SECRET`; aucune valeur n’a été extraite ni exposée. Les métadonnées Vercel disponibles ne fournissent pas de lecture non secrète de ces valeurs. Les logs runtime de production sur les deux dernières heures ne contiennent aucune trace textuelle FedaPay, donc ils ne permettent pas de confirmer le mode Test ou Live.

La vue d’erreurs Vercel sur 24 heures montre deux groupes : une `DeprecationWarning` Node `url.parse()` sur des routes Seller/facilities et des `v2_api_error` historiques couvrant plusieurs routes, dont une ancienne erreur de colonne `p.discount_kind` et une violation de corrélation opérateur. Ces éléments ne sont pas attribués au flux FedaPay dans la preuve actuelle et doivent rester des résidus séparés, à traiter dans un ring technique ultérieur si leur récurrence est confirmée.

**Décision de gate :** ne pas retenter le paiement positif ni modifier les secrets depuis ce pass. Le propriétaire doit confirmer dans Vercel/FedaPay que `FEDAPAY_ENV` cible le serveur sandbox et que les clés test et le secret webhook appartiennent au même compte/environnement. Après cette vérification, reprendre avec un identifiant sandbox officiellement reconnu.


## Reclassification du test sandbox — 2026-08-27

Le propriétaire a confirmé que `FEDAPAY_ENV` était déjà réglé sur `sandbox` dans Vercel avant le dernier essai. Le déploiement `99e8c67` utilise donc la paire dédiée `FEDAPAY_SANDBOX_SECRET_KEY` / `FEDAPAY_SANDBOX_WEBHOOK_SECRET` selon le correctif `99e8c67`. Le checkout FedaPay a été créé puis soumis avec l’identité sandbox documentée ; le provider a toutefois répondu que le compte Mobile Money était introuvable. Cette preuve est classée **sandbox atteint, provider test non reconnu**. Elle ne constitue pas une preuve de crédit Wallet ni d’activation Pro positive.

Le Wallet Seller vérifié après le retour affiche toujours `$0.00`, et `Omni Demo Seller Hub` reste Free. Aucun effet de bord n’est observé. Le prochain test doit utiliser une identité sandbox officiellement activée pour ce compte FedaPay, ou une autre méthode de paiement de test proposée dans le même environnement ; il ne faut pas modifier les variables live ni simuler le webhook.
