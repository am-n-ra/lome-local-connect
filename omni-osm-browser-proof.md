# Omni OSM et terrain — preuve de production

**As of:** 26 août 2026. **Origine canonique:** `https://omni.sparkafrika.online/`. **Projet Vercel:** `omniview`. **Branche Neon réellement utilisée par la production:** `omni-v2-rebuild` (`br-dawn-hill-am5amy22`). Les previews Vercel hashées ne sont pas des origines d’authentification valides pour Neon Auth et ne sont donc pas utilisées pour les tests de connexion.

## État de la preuve

| Élément | Résultat observé | Classe de preuve | Référence |
|---|---|---|---|
| Authentification canonique et bearer JWT | La session HttpOnly est échangée côté client contre un JWT Neon valide à trois segments; l’endpoint protégé répond `authorized: true`. | Observed / reproduced | Commit `4e04660` |
| Autorisation opérateur | Junior est lié à l’account Omni de la branche de production et possède `operator:active`; aucune identité Neon Auth ni mot de passe n’a été modifié. | Observed / database | Account `ea00d0f2-d90f-42b8-81a5-b32fbffbf964` |
| Découverte Lomé | 100 résultats OSM réels prévisualisés et sélectionnés depuis la surface Field Pilot. | Observed / external | Commit `490522b` |
| Import Lomé | 100 créées, 0 déjà présentes, avec état public `unclaimed` et sans propriétaire. | Observed / browser + API | Déploiement suivant le correctif `280fb14` |
| Découverte Aflao | 100 résultats OSM réels prévisualisés et sélectionnés dans la fenêtre ciblée `[1.05, 5.95, 1.35, 6.30]`. | Observed / external | Commit `490522b` |
| Import Aflao | 99 créées, 1 déjà présente, affiché par l’UI après confirmation explicite. | Observed / browser | Déploiement `dpl_5yAK4CMH9aitdCTY5fLuHXhtvWdJ` |
| Réconciliation Neon après les imports | 202 runs OSM, 202 corrélations uniques, 200 références source, 200 facilités publiques non revendiquées, 153 facilités dans le corridor côtier. | Observed / read-only SQL | Branche `br-dawn-hill-am5amy22` |
| Carte globale | La production affiche la projection monochrome globe/mercator, des clusters et des pins issus de la population OSM. | Observed / browser | Origine canonique |
| Positionnement terrain manuel | La sheet « Inscrire une facilité » affiche une carte de rues, propose la position de l’appareil ou un fallback Lomé, et met à jour les coordonnées après un clic sur la carte. | Observed / browser | Commit `394d828`, déploiement `dpl_5yAK4CMH9aitdCTY5fLuHXhtvWdJ` |

## Reconciliation OSM

La requête Neon en lecture seule a retourné `osm_run_count = 202` et `unique_osm_correlation_count = 202`; l’invariant d’unicité des corrélations est donc respecté. Les `200` références OSM correspondent aux `200` facilités publiques importées et non revendiquées. Le nombre supérieur de runs reflète les relectures ou rejouements de sources déjà connues, tandis que l’identité facility/source reste dédupliquée. Les `153` facilités du corridor côtier constituent un contrôle de plausibilité géographique, pas une garantie de couverture exhaustive.

Les imports restent explicitement séparés des claims, des comptes, des catalogues, des contacts et des notifications. Aucun propriétaire n’a été attribué aux présences publiques OSM. L’attribution affichée et persistée reste `© OpenStreetMap contributors`.

## Positionnement de facilité sur le terrain

Le parcours « Inscrire une facilité » n’exige plus de connaître ou de saisir manuellement la latitude et la longitude. Une carte de contexte est rendue dans la sheet avec un pin déplaçable. À l’ouverture, le navigateur demande la position courante; si elle est exacte ou approximative, elle devient le défaut visuel. Si la permission est refusée, indisponible ou trop lente, le fallback Lomé reste éditable. Un membre peut ensuite cliquer sur la carte, faire glisser le pin ou utiliser le contrôle « Ma position » pour réinitialiser explicitement le point. Les coordonnées restent visibles en lecture secondaire et sont transmises au même endpoint serveur validé.

Le contrôle ne change ni le contrat d’autorisation ni l’état public: la session doit toujours avoir `operator:active`, la référence OSM et le nom sont requis, le serveur valide les bornes numériques, et l’écriture conserve `public_import` / `unclaimed`. Cette tranche n’introduit ni géocodage inverse, ni changement de schéma, ni appropriation automatique de la facilité.

## Résilience externe et limite restante

Overpass demeure une dépendance publique intermittente. Chaque miroir est borné à 12 secondes et la séquence de repli comprend VK Maps, l’endpoint principal et private.coffee. Une indisponibilité externe peut empêcher une nouvelle découverte sans invalider l’autorisation, les imports déjà écrits ou la carte persistée. La couverture mondiale OSM complète, une disponibilité garantie et un fournisseur de notifications Push opérationnel ne sont pas prouvés par cette preuve.

## Vérifications techniques

`pnpm test` passe avec **133/133 tests** et `pnpm build` réussit. Vite signale toujours un bundle client supérieur à 500 kB après minification; cet avertissement n’a pas bloqué le déploiement. Le commit `394d828` a été poussé sur `omni-v2-rebuild` et Vercel l’a déployé en production avec l’état `READY`.

## Gaps non fermés

La preuve reviewer/admin sur la branche Neon réellement utilisée par Vercel reste à exécuter avec la session Kheir. La preuve de bout en bout Buyer/Seller/QR, la livraison Push avec VAPID/provider et l’enforcement Free/Pro/billing demeurent des gates séparées. Le produit ne doit pas être déclaré globalement production-ready sur la seule base de cette tranche OSM/terrain.
