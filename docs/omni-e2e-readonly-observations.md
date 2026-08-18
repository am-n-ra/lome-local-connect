# Omni — Observations E2E read-only production

**Source :** https://omni.sparkafrika.online/  
**Date d’observation :** 18 août 2026

La landing production affiche le canvas MapLibre et la projection globe, les contrôles de zoom/recentrage, le dock de recherche, les notifications, le menu et la pill `2 transactions en cours — Reprendre depuis Mes demandes`.

Une recherche publique de contrôle a précédemment rendu l’état `Recherche de la zone…`, puis `3 résultats` et le CTA `Vérifier la disponibilité`, sans erreur console bloquante.

L’ouverture de la pill de reprise a rendu la sheet `Mes demandes` sans mutation métier. La sheet contient plusieurs transactions existantes et expose leurs états lisibles : `QR en attente de scan`, `Paiement à confirmer`, `Transaction terminée`, les événements `Intention créée`, `Offre confirmée`, `QR généré`, `Vendeur vérifié`, `Paiement à choisir`, `Paiement reçu par le vendeur`, `Marchandise reçue` et `Transaction terminée`.

La transaction active observée affiche un CTA `J’ai payé` et un champ de message transactionnel. Les transactions terminées affichent le fil complet et la zone de rating. Aucun bouton de mutation n’a été déclenché pendant cette observation; aucun paiement, scan, rating ou nouveau QR n’a été soumis.

**Limite :** cette observation confirme la reprise et la représentation des états existants, mais ne constitue pas un E2E neuf et reproductible avec création d’intention, concurrence, caméra réelle ou paiement FedaPay sandbox.
