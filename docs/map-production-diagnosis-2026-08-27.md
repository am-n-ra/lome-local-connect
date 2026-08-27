# Diagnostic production carte — 2026-08-27

URL vérifiée : https://omni.sparkafrika.online/

Observations navigateur :
- À l’ouverture, le shell affiche `Chargement de la carte…` avec un canvas MapLibre.
- Après attente prolongée, le shell affiche `Carte indisponible — La carte vectorielle est temporairement indisponible. Réessayer`.
- Aucun message console n’a été observé dans le contrôle initial.
- Le DOM contient un canvas MapLibre de 1024×1100 pixels, rendu dans une surface de 1024×880 pixels.
- Les ressources chargées incluent le style OpenFreeMap `https://tiles.openfreemap.org/styles/positron`, le TileJSON `https://tiles.openfreemap.org/planet`, les sprites et les glyphes.
- Le style OpenFreeMap répond HTTP 200 et contient 55 layers, les sources `ne2_shaded` et `openmaptiles`, ainsi qu’un fond `rgb(242,243,240)`.
- Le TileJSON `https://tiles.openfreemap.org/planet` répond HTTP 200 et fournit des tuiles vectorielles PBF sous `https://tiles.openfreemap.org/planet/20260823_080002_pt/{z}/{x}/{y}.pbf`.
- La liste de ressources observée ne montre pas de requêtes `.pbf` ni de raster `natural_earth` après le chargement du style. Les ressources `planet`, sprites et glyphes apparaissent parfois deux fois.
- Le canvas est au premier plan, transparent, sans élément blanc qui le recouvre.

Hypothèse à confirmer : le style est chargé mais aucune tuile de source ne se rend, possiblement à cause de la gestion de la source TileJSON/PMTiles, de l’initialisation MapLibre avec projection globe, ou d’un double montage/retry. Le statut d’erreur est déclenché après 20 secondes par le timer local lorsque `initialStyleReady` reste faux.

Sources externes consultées :
- https://omni.sparkafrika.online/
- https://tiles.openfreemap.org/styles/positron
- https://tiles.openfreemap.org/planet

Cette note ne conclut pas encore à un correctif ; elle conserve uniquement les observations reproductibles.
