# Omni — Observations E2E read-only production

**Source :** https://omni.sparkafrika.online/  
**Date d’observation :** 18 août 2026

La landing production affiche le canvas MapLibre et la projection globe, les contrôles de zoom/recentrage, le dock de recherche, les notifications, le menu et la pill `2 transactions en cours — Reprendre depuis Mes demandes`.

Une recherche publique de contrôle a précédemment rendu l’état `Recherche de la zone…`, puis `3 résultats` et le CTA `Vérifier la disponibilité`, sans erreur console bloquante.

L’ouverture de la pill de reprise a rendu la sheet `Mes demandes` sans mutation métier. La sheet contient plusieurs transactions existantes et expose leurs états lisibles : `QR en attente de scan`, `Paiement à confirmer`, `Transaction terminée`, les événements `Intention créée`, `Offre confirmée`, `QR généré`, `Vendeur vérifié`, `Paiement à choisir`, `Paiement reçu par le vendeur`, `Marchandise reçue` et `Transaction terminée`.

La transaction active observée affiche un CTA `J’ai payé` et un champ de message transactionnel. Les transactions terminées affichent le fil complet et la zone de rating. Aucun bouton de mutation n’a été déclenché pendant cette observation; aucun paiement, scan, rating ou nouveau QR n’a été soumis.

**Limite :** cette observation confirme la reprise et la représentation des états existants, mais ne constitue pas un E2E neuf et reproductible avec création d’intention, concurrence, caméra réelle ou paiement FedaPay sandbox.

## Mesure headless landing — 320 et 390 px

Les captures `landing-320x800.png` et `landing-390x844.png` ont été produites depuis la production. À 320 px, le dock reste dans la largeur de la fenêtre, le bouton de recherche et le champ restent visibles, et les contrôles de localisation ne passent pas sous le dock. À 390 px, le dock reste lisible et la bannière PWA apparaît au-dessus de la zone de recherche; aucun débordement horizontal évident n’est visible.

Le runner Chromium headless a toutefois été interrompu avant de produire la capture 1280 px; les captures 768 px et 1024 px restent disponibles dans `.artifacts/mobile-cert/`. Ces captures sont des preuves visuelles de smoke, pas un test caméra réel ni une mesure DOM complète.

Les captures 768×1024 et 1024×900 montrent un dock pleine largeur borné avec marges, les contrôles de localisation au-dessus, le bouton de menu en haut à droite et la bannière PWA séparée. Aucun débordement horizontal évident n’est visible dans ces deux vues; la carte était encore dans son état de chargement headless au moment des captures, donc la preuve porte principalement sur la composition des overlays et non sur la disponibilité du canvas.

## Certification statique caméra/mobile

Le script `scripts/e2e/static-mobile-cert.mjs` a validé 10 garanties : `viewport-fit=cover`, safe-area du dock, ResizeObserver de clearance, `text-base` pour éviter le zoom mobile, caméra arrière `environment`, fallback secure-context, surface vidéo dédiée, lecture inline, arrêt des tracks et saisie manuelle en cas de refus/unsupported. Les tests caméra et progression transactionnelle restent verts dans la suite de 59 tests.

Cette certification de code ne remplace pas l’essai sur un téléphone HTTPS avec autorisation caméra, caméra arrière, QR illisible, refus, suspension/reprise de l’onglet et fermeture du scanner.
