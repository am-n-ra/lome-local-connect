# Omni V2 — Positionnement terrain d’une facilité

**Structural path:** product > OSM/terrain > inscription manuelle > positionnement.

**Mini-seed.** Sur le terrain, un membre autorisé de l’équipe Omni doit pouvoir inscrire une présence publique sans connaître sa latitude et sa longitude. La carte doit proposer la position courante comme point de départ, puis permettre de déplacer le pin pour corriger le point observé.

**Mini-species.** La surface hérite de la sheet Ring A existante : carte monochrome claire avec routes lisibles, pin central déplaçable, contrôle « Utiliser ma position », état de permission discret et coordonnées techniques affichées en lecture secondaire. Le formulaire reste utilisable sur mobile avec safe area et sur desktop avec une zone de carte suffisamment grande pour voir le contexte immédiat.

**Mini-root.** Le serveur reste l’autorité : `latitude` et `longitude` sont envoyées comme nombres validés par l’API existante, dans le corridor public autorisé par le rôle opérateur. Le navigateur ne fournit qu’un défaut et une aide visuelle. Si la permission est refusée, indisponible ou lente, le formulaire conserve un fallback Lomé éditable; aucun import n’est exécuté sans coordonnées valides. La référence OSM, le nom et l’attribution restent inchangés.

**Mini-trunk.** Ouvrir « Inscrire une facilité », demander la localisation une fois, centrer la carte sur la position obtenue, déplacer le pin par glisser-déposer ou en cliquant la carte, puis soumettre les coordonnées visibles au même endpoint `public_import`.

**Mini-heartwood.** Les états `requesting`, `exact`, `approximate`, `denied`, `unavailable` et `timeout` sont explicites. Le déplacement manuel ne redemande pas la permission. Le bouton de position recentre sans écraser une correction manuelle sauf action explicite. Les coordonnées sont arrondies uniquement pour l’affichage, pas pour l’envoi; un rechargement ou une double soumission n’introduit pas de nouvelle règle serveur.

**Mini-canopy.** La carte doit être tactile, avec un pin accessible et une alternative « cliquer sur la carte », sans saisie lat/lon obligatoire dans le parcours principal. Le fallback et l’erreur restent visibles, le bouton de soumission est désactivé tant que la position n’est pas numérique et les labels restent accessibles.

**Définition de done.** Le composant est branché au formulaire réel, `pnpm test` et `pnpm build` passent, le diff ne touche pas les identités ni les imports OSM existants, et un contrôle browser ou une preuve manuelle documente au moins le rendu de la carte, le fallback et la mise à jour de coordonnées par interaction.

**Non-objectifs.** Cette tranche ne modifie pas le schéma, les rôles, les imports régionaux, la revendication, la géocodification inverse ni le provider cartographique global.
