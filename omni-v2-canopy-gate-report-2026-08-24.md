# Omni V2 — Rapport Canopy Globe & Search Reveal

**Date :** 24 août 2026
**Structural path :** produit → Species → map/search composition → Canopy
**Autorité :** Nature Way, opérée par Founder HQ
**Statut :** `partial / bounded proof recorded; Species gate open`

## Status

L’anneau Canopy a été exécuté et a matériellement avancé la carte-first d’Omni V2. Il ne ferme ni Species, ni le Root global, ni un Ring de release. Il ne constitue pas une déclaration de production readiness.

## Changed

Le composant `TrunkMap` possède désormais un ownership explicite de la caméra : globe au repos, navigation manuelle, reveal de recherche, cadrage de résultats et facility sélectionnée. La rotation idle utilise un RAF interruptible et conserve le centre courant lors d’une interaction. La recherche textuelle réinitialise correctement son cycle même lorsqu’une requête identique est resoumise, puis déclenche un reveal borné monde/contexte/résultats sans réintroduire de requête bounds en boucle.

Le mini-contrat `src/trunk/map-reveal.ts` et ses tests encadrent le centre, les bounds, le cadrage de toutes les facilités et l’intégration optionnelle d’une position utilisateur. La carte a reçu un traitement légèrement plus coloré et doux, sans highlight lourd. Le repère de position est distinct des pins publics, accessible et non interactif.

## Proven

Sur le déploiement canonique READY `dpl_B46QuQiAxUWnqymZ5HPtdmBVNBMA` issu de `bc8e730`, la session authentifiée a montré `nearby-state-loading`, puis `nearby-state-ready` pour `Marche de Hanoukope`. Le reveal a progressé avec les états `Le continent`, `Le pays`, `La région`, `La ville`, puis `Facilités trouvées`, avec zoom `1.35 → 1.85 → 2.75 → 3.80 → 5.25 → 6.20`. Le résultat est resté visible, le canvas MapLibre est resté monté et un seul pin projeté a remplacé le cluster au cadrage local.

Le zoom manuel post-reveal a progressé de `6.20` à `7.20` sans perdre la carte ni la fiche résultat. Les mesures à `1024×880` ont donné un dock `top=561,bottom=610`, une sheet `top=624,bottom=858` et un pin `top=246,bottom=284`; aucun recouvrement dock/sheet ni dock/pin n’a été mesuré. Le journal de ressources a montré une requête initiale avec bounds et une requête textuelle query-only, sans cadence bounds continue pendant le reveal.

Le globe se met en pause au survol à son centre courant. Un événement souris contrôlé sur le dock a prouvé la reprise RAF sans reset du centre; le mouvement physique vers l’overlay n’est pas isolément mesurable avec le helper de navigation utilisé, et cette limite reste documentée.

Deux runs Playwright publics à `390×844` ont passé les assertions de canvas plein écran, controls nommés et activés, zoom `1.35 → 2.35`, dock contenu et absence de débordement horizontal. Le run normal a prouvé la rotation idle (`centerLng 2.3400 → 6.8200`); le run `prefers-reduced-motion: reduce` a prouvé un centre inchangé et `data-rotation=reduced`. Un stub de géolocalisation temporaire et immédiatement restauré a prouvé le rendu du repère accessible `Votre position sur la carte`, sans demander ni stocker la vraie position.

Les tests de dépôt ont passé **116 tests sur 16 fichiers**, le build de production, le bundle de **12 fonctions Vercel**, `check:boundary` et `git diff --check`. Le warning Vite de chunk supérieur à 500 kB reste non bloquant et non résolu.

## Not proven

La matrice compacte authentifiée de la sheet de résultats et des surfaces Seller/Reviewer/Admin n’est pas certifiée. La traversée complète Tab/Shift+Tab, les focus traps, la permission de localisation réelle, les états exact/approximatif/denied/retry en conditions réelles, les états empty/error/retry/recovery, le focus facility avec Back/Escape, la reprise après interruption/session expirée, la concurrence, la résilience des tuiles distantes et le profil de performance approfondi restent ouverts.

La recherche géographique utilise une séquence visuelle honnête et bornée sur les coordonnées des résultats; elle ne prétend pas connaître des frontières administratives réelles lorsqu’elles ne sont pas dans le contrat de données. Aucun statut de stock, confiance, propriété ou permission n’est inféré par un pin public.

## Preserved

Aucune identité, utilisateur, branche Neon, ligne historique, claim, rôle, notification, réponse vendeur, facilité, donnée privée ou artefact de preuve antérieur n’a été supprimé ou modifié dans ce passage. Le claim de test privé précédent reste un artefact auditable borné, et non une certification ou une preuve de marketplace. Aucun rôle, claim, import OSM, réponse vendeur, paiement, QR, transaction ou notification n’a été créé dans cette passe.

## Deployment

Les correctifs ont été livrés par GitHub sur `am-n-ra/lome-local-connect`, branche `omni-v2-rebuild`, puis déployés par le chemin Vercel lié. Les commits Canopy sont `38d37cb`, `bf72e22`, `375e4f2`, `5bff6ef` et `bc8e730`. Le déploiement de preuve final est `dpl_B46QuQiAxUWnqymZ5HPtdmBVNBMA`, READY, avec exactement 12 fonctions Node et l’alias canonique `omni.sparkafrika.online`.

Les artefacts reproductibles de preuve sont `scripts/canopy-responsive-proof.mjs`, `canopy-proof/canopy-compact-public.json`, `canopy-proof/canopy-compact-public.png`, `canopy-proof-reduced/canopy-compact-public.json` et `canopy-proof-reduced/canopy-compact-public.png`.

## Next gate

Le prochain et unique gate est la preuve Canopy résiduelle : authentifié compact à largeur supportée, Seller/Reviewer/Admin responsive en lecture seule, clavier/focus complet, facility focus avec retour, états empty/error/retry/recovery et localisation réelle uniquement si une autorisation séparée est donnée. Founder HQ garde en pause role bootstrap, OSM, Inbox→PWA, paiement, QR, transaction et expansion du field pilot jusqu’à la décision Species.
