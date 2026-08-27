# Omni V2 — Audit performance, vitesse, UI et UX

**Date :** 27 août 2026  
**Ring :** Performance initiale et chargement différé des surfaces secondaires.

## Mesure de départ

Avant le ring, le build Vite produisait un chunk JavaScript initial de **1,790.91 kB** et un CSS initial de **138.06 kB**. Le build signalait un chunk supérieur à 500 kB.

## Corrections livrées

La librairie `qrcode` est maintenant chargée uniquement lorsqu’un QR public Seller ou un QR transactionnel doit être généré. La carte MapLibre principale est chargée derrière `Suspense`, avec un fallback accessible, au lieu d’être bloquante dans le chargement initial. La carte terrain `FieldPilotLocationMap`, réservée aux surfaces opérateur Seller/Admin, est également chargée à la demande.

Ces changements ne modifient ni le payload des QR, ni les contrats de transaction, ni les permissions, ni le rail Wallet/FedaPay.

## Mesure après le ring

Le build produit maintenant un chunk applicatif initial de **779.94 kB** et un chunk MapLibre séparé de **962.49 kB**. Le CSS initial est réduit à **55.20 kB**, tandis que le CSS MapLibre est séparé à **82.86 kB**. Le chunk QR est séparé à environ **23.47 kB**. Le gain mesuré sur le chunk applicatif initial est d’environ **56.4 %** ; le CSS initial baisse d’environ **60.0 %**.

## Validation

La suite reste à **151/151 tests**, le contrôle de frontière client est propre et le build génère toujours les **12 fonctions Vercel**. Le fallback de chargement de carte expose un état `role=status`, et le chargement différé est annulable côté QR pour éviter une mise à jour après démontage.

## Limites et prochaine mesure

Le découpage réduit le coût de démarrage, mais MapLibre reste un gros chunk lorsqu’une carte est réellement ouverte. Il faudra mesurer sur téléphone réel le temps jusqu’au premier écran utile, le temps jusqu’à la carte interactive, le coût réseau et l’effet de la récupération PWA. Le prochain ring ne doit pas sacrifier le rendu de la carte ni introduire une attente opaque.

## Décision Nature Way

Le ring est acceptable comme amélioration Canopy/performance : il est réversible, ne change pas les contrats racine et dispose d’une preuve de build. La publication production et le walkthrough mobile doivent encore être effectués avant de déclarer un gain utilisateur réel.
