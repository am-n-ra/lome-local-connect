# Omni V2 — Enveloppe de release contrôlée

## Décision actuelle

Omni V2 peut avancer vers une **exposition contrôlée**, mais ne doit pas encore être présenté comme une preuve complète de comportement mobile réel. Les contrats commerciaux, le Wallet, FedaPay Live, les QR et le parcours transactionnel restent hors de ce ring.

| Champ | Décision |
|---|---|
| Résultat attendu | Permettre à un petit groupe de découvrir une facilité, vérifier une disponibilité, créer une intention, échanger dans le chat et finaliser la remise via QR transactionnel. |
| Signal de succès | Walkthrough complet réussi par un Buyer et un Seller de test sur production, puis confirmation manuelle par le propriétaire produit. |
| Garde-fou | Aucun accès Seller/Admin ne doit apparaître à un rôle non autorisé ; aucune notification ou action mobile ne doit exposer de données privées ; aucune mutation Wallet ne doit être déclenchée par un paiement externe non confirmé par webhook signé. |
| Audience | D’abord comptes démo et utilisateurs explicitement invités ; pas encore une campagne publique générale. |
| Séquence | 1) production walkthrough ; 2) test mobile réel ; 3) cohorte limitée ; 4) élargissement seulement après revue des erreurs et retours. |
| Réversibilité | Revenir au commit précédent ou désactiver l’exposition de la fonctionnalité concernée ; ne pas supprimer les données historiques ni réutiliser un QR transactionnel expiré. |
| Fenêtre d’observation | Première session de production et 24 heures de suivi des erreurs, notifications, paiements et retours support. |
| Communication | Le propriétaire produit valide l’ouverture de la cohorte et reçoit tout incident d’authentification, de rôle, de paiement ou de transaction. |

## Preuves connues au 27 août 2026

La suite locale est verte avec **151 tests sur 151** et le build produit les **12 fonctions Vercel** prévues. Les commits récents couvrent les messages d’outcome de certification, la fixation du stage mobile pendant le clavier et la récupération du cache/service worker PWA.

Ces éléments sont des preuves **observées localement**. Ils ne remplacent pas la preuve **manuelle sur appareil réel** de l’installation, du clavier, de la permission Push et du clic sur une notification.

## Critères de pause

La release doit être mise en pause si un rôle Buyer voit une action Seller/Admin, si une donnée de chat ou de preuve privée devient publique, si un paiement est traité comme Wallet sans webhook signé, si un QR transactionnel expiré est accepté, ou si une erreur mobile empêche le retour du dock et la récupération de la session.

## Prochaine action et propriétaire

Le prochain plus petit ring est un walkthrough mobile contrôlé sur production avec les comptes démo Buyer et Seller, incluant : recherche, intention, chat, QR transactionnel, scan Seller, confirmation, installation PWA et récupération Push. Le propriétaire produit observe et accepte ou refuse l’expansion ; l’agent conserve uniquement les preuves et les correctifs explicitement validés.

Auteur : **Manus AI**
Date : **2026-08-27**
