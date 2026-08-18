# Omni UI V2 — Audit visuel et fonctionnel de référence

**Date :** 18 août 2026  
**Source :** production `https://omni.sparkafrika.online`  
**Références observées :** `/`, `/vendeur`, `/carte`, onboarding et room transactionnelle déjà certifiées lors de la passe précédente.

## Synthèse

L’application est fonctionnelle et le globe MapLibre reste bien le héros visuel. La prochaine amélioration ne doit donc pas remplacer la carte, les pins ou la couverture OSM ; elle doit réduire la concurrence entre surfaces et établir une hiérarchie plus éditoriale. Les défauts les plus visibles sont une densité de commandes encore trop uniforme, un dock qui porte simultanément recherche, statut de zone, PWA et contraintes, et une console seller qui ressemble davantage à une grande surface de gestion qu’à une mission priorisée.

## Observations production

| Surface | Ce qui fonctionne | Écart visuel ou fonctionnel | Priorité |
|---|---|---|---|
| Landing `/` | Canvas MapLibre présent, globe centré, attribution discrète, recherche accessible, localisation et approximation explicitement séparées, pill de transactions visible. | La zone centrale est visuellement très vide autour du globe ; le dock bas porte trop de micro-actions concurrentes. Le prompt de recherche, le PWA install banner et les états de zone ne forment pas encore un seul système de commande. | Gênant |
| Chrome carte | Zoom, recentrage, notifications et menu séparés ; la carte reste manipulable. | Les contrôles carte sont très petits et éloignés du langage visuel des cards. Le menu et la notification pourraient être regroupés dans un chrome supérieur plus silencieux. | Finition |
| Pill transaction | Reprise persistante claire et reliée à Mes demandes. | Le pill devrait afficher, lorsque possible, l’étape courante et la facility sans devenir plus haut que le dock. | Gênant |
| Seller `/vendeur` | Carte toujours visible, statut online, tabs Facility/Catalogue/Demandes/Scanner/Wallet/Coupons, compteur et raccourcis présents. | La grille seller reste dense et peu séquencée : l’utilisateur ne sait pas immédiatement quelle demande traiter, quelle action est la plus urgente ni quelle information est secondaire. La console devrait afficher une mission active et une synthèse courte plutôt qu’un inventaire de tabs. | Bloquant UX |
| Seller carte | La facility et sa position restent visibles. | Le contenu seller couvre une grande surface verticale et détourne le regard de la carte ; la hiérarchie de la console devrait se faire par colonne et par priorité, pas par accumulation de cards. | Gênant |
| Onboarding | Les trois étapes, le choix de rôle, localisation optionnelle et consentement sont compréhensibles. | À densité mobile élevée, les options secondaires peuvent rivaliser avec le CTA final. La prochaine passe doit garder une seule question dominante par étape. | Gênant |
| Room transactionnelle | QR, progression, bloc d’action et reprise persistante sont présents. | Le résumé net/réduction et la prochaine action doivent être encore plus immédiatement lisibles que le fil et le chat. Le chat doit rester secondaire. | Gênant |

## Écarts de hiérarchie

L’interface utilise déjà les bons composants conceptuels, mais plusieurs niveaux visuels ont presque le même poids : titre, statut, tabs, cards de synthèse, CTA et textes explicatifs. L’amélioration principale sera donc une réduction contrôlée : un écran, un élément dominant, une action principale, un niveau secondaire repliable.

La landing doit être traitée comme un **stage** : le globe au centre, le chrome en haut, le dock en bas et une seule notification de reprise entre les deux. Les informations techniques MapLibre restent en attribution. Les états de couverture ou de localisation doivent être présentés comme une micro-card contextuelle, non comme un second panneau de commande.

La console seller doit être traitée comme un **poste de contrôle** : colonne opérationnelle pour la demande ou transaction active, colonne de synthèse pour wallet, statut, compteurs et raccourcis. Les tabs deviennent des destinations secondaires ; la première vue doit proposer une décision directe.

## Matrice des prochains composants

| Composant | Surface V2 | Action principale | Refactor attendu |
|---|---|---|---|
| `CartePage` | Stage map-first | lancer/reprendre une recherche | séparer dock commande, contraintes et micro-états |
| `SearchDock` | FLOAT | rechercher | réduire les controls visibles, ajouter états focus/submit sans déplacer le globe |
| `ResultRail` | FLOAT/SHEET hybride | ouvrir une fiche | cartes product-first, médias et statut en niveaux |
| `FacilityPanel` | SHEET | vérifier disponibilité | header média + trust + CTA unique |
| `DemandRequestPanel` | SHEET | continuer/envoyer | une question dominante par étape, pied fixe |
| `TransactionThreadCard` | SHEET | action courante | résumé net + bloc maintenant + fil secondaire |
| `vendeur.tsx` | PAGE/FLOAT | traiter la demande active | deux colonnes, mission active et synthèse |
| `CheckoutPanel` | SHEET | scanner/vérifier | grande zone vidéo, état permission, saisie manuelle |
| `SellerProductForm` | SHEET | enregistrer produit | étapes visibles, aperçu et coupon associé |
| `CouponsPanel` | SHEET | enregistrer coupon | réduction calculée, période lisible, CTA unique |
| `NavMenuSheet` | SHEET | basculer de rôle ou ouvrir activité | compte prioritaire, destinations implémentées uniquement |

## Critères de réussite V2

La passe sera considérée réussie lorsque la carte reste visible et libre autour du globe, que le dock ne présente pas un formulaire de contraintes par défaut, que le rail ne dépasse pas le viewport, que la fiche conduit à une disponibilité en trois étapes sans perte de recherche, que la room met en avant le net et l’action courante, que le seller voit une mission prioritaire avant les métriques secondaires, et que tous les états loading/empty/error/unauthorized/success restent explicites.

La caméra QR devra encore être vérifiée sur appareil réel HTTPS. Les captures observées ici proviennent de la production et ne remplacent pas la certification exhaustive 320/390/768/1024/1280 px.

## Smoke visuel après Atlas Premium

Après le déploiement du commit `2079761`, `/` affiche toujours le globe MapLibre central, le pill de reprise, les contrôles de carte, la recherche et les états de localisation sans erreur SSR. Le dock est plus compact et le bouton de paramètres reste séparé de la commande principale.

`/vendeur` conserve la carte en arrière-plan, le statut online, les tabs Facility/Catalogue/Demandes/Scanner/Wallet/Coupons et les raccourcis. La surface reste à poursuivre vers une hiérarchie de mission active plus forte, mais aucune régression fonctionnelle visible n’a été introduite par la passe scanner.

## Rebuild Atlas Glass — smoke production du checkpoint `74e306b`

Le shell buyer de production conserve le globe MapLibre centré, les clusters/pins et les contrôles de carte. Le pill de reprise `2 transactions en cours` reste visible. Le dock est flottant au bas de la carte avec paramètres, état de localisation, fallback et recherche.

Le shell seller conserve la carte derrière la surface, le header facility/status, les tabs métier, les compteurs, les raccourcis Voir les demandes/Ouvrir le scanner et le segment map-first. La réponse serveur affichée reste stable ; aucun crash SSR ou erreur de route n’a été observé.

Le rendu de production montre encore un placeholder buyer historique (`Que cherchez-vous dans le monde ?`) et la console seller n’expose une mission dominante que lorsque les demandes live sont chargées. Ces deux points doivent être revalidés après invalidation du cache/deployment et font partie de la passe suivante, sans modifier MapLibre.
