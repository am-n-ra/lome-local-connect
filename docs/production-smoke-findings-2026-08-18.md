# Production smoke test — 2026-08-18

La production `https://omni.sparkafrika.online/` répond et rend le canvas MapLibre globe. Après attente du chargement, le globe noir/blanc est visible au centre avec des clusters de facilities/pins (notamment Afrique de l’Ouest et Europe), sans remplacement par une carte plate.

Le chrome buyer expose le pill persistant **« 2 transactions en cours · Reprendre »**, l’icône notifications avec badge, le menu, le champ de recherche et les contrôles de recentrage/zoom. La page affiche actuellement **« Localisation bloquée »** dans ce contexte de navigateur sandbox ; cela correspond au refus de permission de cet environnement et ne constitue pas une erreur SSR.

Le smoke test confirme aussi que la première réponse peut rester temporairement sur « Chargement du globe MapLibre… », puis se stabilise correctement au rendu MapLibre.

Le test du champ `ciment` confirme que le bouton **Lancer la recherche** déclenche bien la recherche en production : l’interface affiche `Recherche de la zone…`, `Continent` et `0 résultats` pendant le chargement, avec le globe toujours visible et animé. Dans cet environnement, la localisation est bloquée et la requête OSM peut donc ne produire aucun résultat local ; le CTA de repli **Créer une demande** apparaît correctement.

Le clic sur le pill ouvre bien **Mes demandes** au-dessus de la carte, et la room affiche timeline, choix de paiement externe et messages transactionnels. La production testée contient des fixtures existantes et expose encore plusieurs boutons **« Générer un nouveau QR »** sur des transactions historiques ; cela correspond à des QR expirés/anciens ou à un déploiement antérieur, tandis que le code local courant réserve ce CTA aux QR expirés et affiche le QR immédiatement pour les nouveaux intents. La carte/globe reste visible en arrière-plan et le panneau est centré.

Après un refresh supplémentaire, la version de production se stabilise correctement : canvas MapLibre présent, globe noir/blanc visible, pins/clusters visibles, pill **« 2 transactions en cours · Reprendre »**, recherche et notifications disponibles. La localisation reste bloquée uniquement parce que le navigateur sandbox refuse la permission ; aucune erreur 500/SSR n’est apparue.
