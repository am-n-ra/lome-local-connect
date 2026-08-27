
## Walkthrough HTML — passe sans génération d’images

La maquette révisée est servie localement sur `http://127.0.0.1:4173/?v=species-clean`. La landing map-first s’affiche avec le globe/carte, le wordmark Omni, la search dock et les surfaces blanches premium. Après saisie de `Riz parfumé 5 kg` puis lancement, le prompt d’authentification conserve correctement la recherche et affiche `Nous gardons « Riz parfumé 5 kg » et reprenons automatiquement après une connexion rapide.`

Le prototype reste une maquette HTML isolée. La carte est une représentation CSS bornée, sans nouvelle génération d’image ni appel backend. Le walkthrough suivant doit couvrir auth/onboarding, reprise des résultats, Bulk, intent, transaction et les branches Seller/Admin.

Le prompt auth mène bien à l’écran `Continuer votre recherche`, puis le clic de démonstration ouvre l’onboarding `Bienvenue dans Omni · 1/3 · Votre zone`. La recherche reste conservée dans l’état JavaScript du prototype et l’étape indique que la localisation est facultative. Les boutons `Continuer` et `Passer pour maintenant` sont visibles comme actions de progression.

Les étapes 2/3 et 3/3 s’affichent correctement. L’étape 2 confirme explicitement que `Riz parfumé 5 kg` sera relancé après l’onboarding. L’étape 3 affiche `Votre espace`, les demandes/transactions/favoris et le CTA final `Lancer ma recherche`. La progression visuelle est cohérente avec les trois étapes.

Le CTA `Lancer ma recherche` renvoie directement aux résultats avec `Riz parfumé 5 kg`, les chips `10 unités`, `Budget 10 $`, `À proximité`, la carte Lomé, et les deux facilités avec statuts `Disponible` et `À vérifier`. Le contexte de recherche est donc conservé de bout en bout dans la maquette.

Lors du walkthrough, une sélection d’élément a ouvert directement l’écran `Votre passage est prêt` au lieu de la fiche facility attendue ; l’état transactionnel lui-même affiche bien QR, chat, itinéraire, contacts et paiement, mais l’index d’élément était devenu instable après plusieurs transitions. Le retour vers la landing fonctionne. Ce point est classé comme preuve de prototype à durcir : les tests doivent sélectionner des éléments par identifiants stables plutôt que par index visuel.

Une seconde reproduction confirme un défaut de navigation dans le prototype : depuis une liste fraîche, l’élément visible `Voir l’offre` ouvre l’écran `Votre passage est prêt` / QR transactionnel au lieu de `Fiche découverte` / facility. Le problème doit être traité avant validation Species ; la séparation visuelle existe, mais la transition HTML est incohérente.

Le diagnostic console montre que l’écran Results expose bien `Voir l’offre` avec `onclick="go('facility')"` et le Bulk avec `onclick="go('bulk')"`. L’appel direct `window.go('results')` confirme `state.screen='results'`. L’incohérence précédente vient donc du ciblage par index visuel pendant le walkthrough, et non de la route définie dans le prototype. Les tests de validation devront privilégier des sélecteurs stables.

La transition directe vers `facility` est correcte. La fiche affiche `Omni Demo Seller Hub`, `Certifiée Omni`, le bloc `QR public de la facilité — Découvrir les offres, pas une transaction`, puis `Riz parfumé 5 kg · Donnée fraîche · 10 disponibles · 9,50 $` et `Huile végétale 1 L · Donnée ancienne · 8 alloués · 3,20 $`. La séparation fraîche/ancienne est visible et les actions sont distinctes.

Les états suivants sont confirmés dans la maquette : `Disponibilité manuelle · gratuite`, avec quantité 10, budget maximum 10 $, vendeur sollicité si la donnée est ancienne ; et `Buyer Pro · service facturé`, avec 842 crédits Bulk, 12 facilités sélectionnées, coût 12 crédits, réponses mixtes et vérification temps réel des offres anciennes. Le prototype respecte donc la distinction disponibilité manuelle gratuite / Bulk Facility facturé.

Le panier affiche deux produits de la même facilité, les quantités, prix, offre Omni et total estimé `101,40 $`, avec la revalidation du stock avant achat. L’écran `Intent créée · #OMNI-4827` affiche la timeline `Intention créée → Vérification → Je veux acheter` et précise que le Buyer décide sans engagement avant cette étape. La séparation panier/intention/transaction est lisible.

La décision affiche `Disponibilité confirmée`, `Vérifié maintenant`, le stock Omni confirmé, puis `Souhaitez-vous acheter ?`. Le texte précise que la transaction et le QR seront créés après confirmation. L’écran suivant affiche `QR de transaction`, `OMNI-4827`, expiration 28 minutes, coupon, facility, total, chat, itinéraire, contacts et la différence avec le QR public permanent. L’ordre métier est correctement représenté.

L’écran paiement affiche `QR vérifié`, `Paiement à confirmer`, `Retrait / livraison`, ainsi que Mobile Money, Carte et Espèces déclarées. L’écran final affiche `Achat reçu`, `Transaction clôturée`, `Produit remis · Paiement confirmé` et `Votre avis est requis`. Le parcours Buyer complet est donc cohérent jusqu’à la clôture et l’avis.

La branche Seller affiche deux facilités, le statut `2/3 ventes`, le rappel du bonus de 20 $, les produits Free, le Pro propre à la facilité, le stock Omni, les demandes de disponibilité et le scan QR transactionnel. La branche Admin/Reviewer affiche une zone protégée, les créations, claims, dossiers de revue, et rappelle que le compteur de ventes ne se modifie pas dans la revue et que chaque décision est auditée.

La branche Seller est navigable et expose `Gérer mes compagnies`, `Gérer les produits`, `Demandes de disponibilité`, `Scanner un QR transaction` et `Stock Omni`. La page `Mes compagnies` montre `Demo Seller Group · 2 facilités · 1 certifiée · 1 confirmée` et `Kegue Services · 1 facilité · en revue`, avec `Créer une compagnie` et `Ajouter une facilité`. Le contexte multi-compagnie/multi-facilité est donc visible.

La création de facilité Seller affiche le stepper `1/4`, les types de facilité, la promesse de position par défaut et le pin déplaçable, ainsi que `Continuer vers la localisation` et `Enregistrer le brouillon`. La branche Admin/Reviewer affiche `Espace protégé`, `Nouvelles créations`, `Claims`, le dossier de revue et les règles d’audit ; elle précise que le compteur de ventes ne se modifie pas dans cette zone.

Après rechargement avec cache-buster, les routes de récupération sont servies correctement : `noResults` affiche aucun résultat avec élargissement/Bulk, `mapError` affiche réessayer/voir les résultats, `permissionDenied` offre de continuer sans localisation, `sessionExpired` conserve la recherche et propose de se reconnecter, et `creditsEmpty` propose l’achat de crédits ou la modification de la demande. Le premier diagnostic avant rechargement était donc un cache du script, pas une erreur de syntaxe.
