# Omni V2 — Production Walkthrough Checkpoint

**Date :** 2026-08-27
**URL :** https://omni.sparkafrika.online
**Observation :** l’alias de production est accessible et affiche le shell Omni, les actions Buyer/Seller, le compte, le champ de recherche et les contrôles de carte. Le texte visible reste toutefois `Chargement de la carte` avec `Localisation indisponible`; le canvas demeure blanc dans l’observation initiale.

**État de preuve :** observé, non résolu dans cette passe. La dernière livraison Vercel est `READY`, mais la readiness réelle de la carte n’est pas démontrée par le seul statut Vercel. Le fallback raster monochrome et son déclenchement après délai doivent être vérifiés dans une observation suivante, puis classés comme pass/fail avec capture.

**Residual gap :** walkthrough Admin/Seller/Buyer réel non terminé ; l’affichage du compteur `0/3`, du bonus Seller de 20 $ et de Wallet/Rewards après transaction reste à prouver sur l’alias de production.

## Observation après attente

Après attente du délai de fallback, la page affiche `Carte active` et le canvas peint une carte mondiale raster en niveaux de gris, avec terres blanches et océan gris. Le problème initial de canvas blanc est donc récupérable par le fallback ; le chargement n’est pas instantané dans cette observation. Capture : `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-27_20-44-20_1183.webp`.

**Résultat carte :** fallback visuel réussi après délai ; performance de première peinture à améliorer et à mesurer séparément.

## Menu authentifié observé

Le menu de compte s’ouvre et expose `Mes demandes`, `Inbox Omni`, `Se déconnecter` et `Installer Omni`. Il affiche également `Les accès d’équipe n’ont pas pu être chargés. Fermez puis rouvrez le menu.` Dans cette session, les options Seller/Admin ne sont donc pas une preuve de bon chargement du contexte d’équipe ; il faut fermer/réouvrir puis tester avec les comptes Seller et Admin dédiés.

**Résultat menu :** accès Buyer de base visible ; chargement des capacités équipe à reproduire et diagnostiquer.

## Console

La console du navigateur ne montre aucune sortie au moment de l’observation du menu. L’échec de chargement des accès d’équipe n’est donc pas expliqué par une erreur JavaScript visible dans cette session ; il reste à inspecter via la réponse réseau/API ou un rafraîchissement de session Seller/Admin.
