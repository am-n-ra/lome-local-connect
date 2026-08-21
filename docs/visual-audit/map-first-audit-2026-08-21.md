# Map-first visual audit — 2026-08-21

## Brainstorm conclusion

Oui, il y avait un vrai décalage, et la carte paraissait absente pour une raison technique réelle. Omni V2 montait bien un canvas MapLibre, mais le parent généré `.maplibregl-canvas-container` avait une hauteur calculée de **0 px**. Le canvas mesurait donc **1280 × 300 px** dans une scène de **1280 × 900 px**. La scène chaude restait visible derrière, donnant l’impression que le globe/map n’existait pas.

Il y avait aussi un second décalage produit : le style local est un globe cartographique volontairement minimal, avec terre/eau/côtes mais sans labels, routes ou frontières. Même après la correction du canvas, il reste donc une décision séparée à prendre pour enrichir le fond cartographique sans compromettre le mode fail-soft et l’isolation V2.

## Corrections implémentées

| Correction | Résultat |
|---|---|
| Géométrie MapLibre forcée en `position:absolute; inset:0; width:100%; height:100%` | Le canvas remplit maintenant toute la scène |
| `ResizeObserver` + `map.resize()` au chargement | Le canvas suit les dimensions réelles desktop/mobile |
| Projection globe conservée dans le style local, sans reset runtime fragile | Le globe est visible et stable |
| Contrôles déplacés en bas à gauche | Ils ne sont plus confondus avec le dock et suivent le contrat map-first |
| Dock et sheet rendus plus compacts et séparés sur mobile | La carte conserve son rôle de scène principale |
| CSS MapLibre chargé au niveau root | Les contrôles possèdent une géométrie prévisible |

## Certification finale locale

Le parcours S1/S2 passe sur les quatre largeurs verrouillées :

| Viewport | Canvas MapLibre | Résultat | Produit | Débordement horizontal |
|---|---:|---|---|---:|
| 1280 × 900 | 1 | Marché central | Maïs en sac | Non |
| 768 × 900 | 1 | Marché central | Maïs en sac | Non |
| 375 × 812 | 1 | Marché central | Maïs en sac | Non |
| 320 × 720 | 1 | Marché central | Maïs en sac | Non |

## Reste à traiter avant de déclarer la carte parfaite

Le canvas réel est désormais présent. En revanche, le fond reste une représentation locale simplifiée. Pour obtenir une vraie carte géographique lisible, la prochaine décision doit être explicitement verrouillée : soit enrichir la base locale avec un dataset géographique détaillé et des couches de labels locales, soit adopter un fournisseur de tuiles vectorielles public avec fallback local. Cette décision appartient à la prochaine tranche cartographique et ne doit pas être masquée par du simple polish CSS.
