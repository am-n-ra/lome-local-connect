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

Le projet Vercel lié `omniview` est bien connecté au dépôt `am-n-ra/lome-local-connect`, sur l’équipe `Kheir's projects` au plan Hobby. Le déploiement de production correspondant au commit `12c4d1a` est `READY`, avec la branche `omni-v2-rebuild` et l’alias de branche `omniview-git-omni-v2-rebuild-kheirs-projects.vercel.app`. Le déploiement précédent du correctif PWA `ddc5f00` est également `READY`. Cette preuve établit la publication Git→Vercel ; elle ne prouve pas encore le comportement OS sur un téléphone réel.

Ces éléments sont des preuves **observées localement**. Ils ne remplacent pas la preuve **manuelle sur appareil réel** de l’installation, du clavier, de la permission Push et du clic sur une notification.

## Incident de release observé le 27 août 2026

Le contrôle Vercel des erreurs runtime sur les dernières 24 heures a trouvé un groupe `v2_api_error` avec 13 occurrences sur 5 utilisateurs. Les routes concernées sont `/api/v2/seller/catalogue`, `/api/v2/transaction-transitions`, `/api/v2/purchase-intents`, `/api/v2/external-payment-confirmations` et `/api/v2/seller/demo-rebind`. Les symptômes observés incluent une colonne Neon absente (`p.discount_kind`), un paramètre SQL indéterminé (`$21`) et une collision d’idempotence sur `v2_purchase_intents.response_id`. Un groupe séparé contient 35 `DEP0169` de dépréciation Node sur 14 utilisateurs.

Décision Nature Way : **ne pas élargir l’exposition** et ne pas déclarer la release production prête pour cohorte utilisateur tant que le groupe `v2_api_error` n’a pas été reproduit, corrigé ou explicitement borné avec preuve négative. Le problème est potentiellement commercial et transactionnel ; il doit être traité comme un gate Heartwood/Root avant tout nouveau polish mobile. Le propriétaire technique doit auditer les migrations et requêtes des routes concernées, puis fournir une preuve de retry/idempotence et de compatibilité schéma.

## Critères de pause

La release doit être mise en pause si un rôle Buyer voit une action Seller/Admin, si une donnée de chat ou de preuve privée devient publique, si un paiement est traité comme Wallet sans webhook signé, si un QR transactionnel expiré est accepté, ou si une erreur mobile empêche le retour du dock et la récupération de la session.

## Prochaine action et propriétaire

Le prochain plus petit ring est un walkthrough mobile contrôlé sur production avec les comptes démo Buyer et Seller, incluant : recherche, intention, chat, QR transactionnel, scan Seller, confirmation, installation PWA et récupération Push. Le propriétaire produit observe et accepte ou refuse l’expansion ; l’agent conserve uniquement les preuves et les correctifs explicitement validés.

Auteur : **Manus AI**
Date : **2026-08-27**
