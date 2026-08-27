
## Walkthrough HTML — passe sans génération d’images

La maquette révisée est servie localement sur `http://127.0.0.1:4173/?v=species-clean`. La landing map-first s’affiche avec le globe/carte, le wordmark Omni, la search dock et les surfaces blanches premium. Après saisie de `Riz parfumé 5 kg` puis lancement, le prompt d’authentification conserve correctement la recherche et affiche `Nous gardons « Riz parfumé 5 kg » et reprenons automatiquement après une connexion rapide.`

Le prototype reste une maquette HTML isolée. La carte est une représentation CSS bornée, sans nouvelle génération d’image ni appel backend. Le walkthrough suivant doit couvrir auth/onboarding, reprise des résultats, Bulk, intent, transaction et les branches Seller/Admin.

Le prompt auth mène bien à l’écran `Continuer votre recherche`, puis le clic de démonstration ouvre l’onboarding `Bienvenue dans Omni · 1/3 · Votre zone`. La recherche reste conservée dans l’état JavaScript du prototype et l’étape indique que la localisation est facultative. Les boutons `Continuer` et `Passer pour maintenant` sont visibles comme actions de progression.

Les étapes 2/3 et 3/3 s’affichent correctement. L’étape 2 confirme explicitement que `Riz parfumé 5 kg` sera relancé après l’onboarding. L’étape 3 affiche `Votre espace`, les demandes/transactions/favoris et le CTA final `Lancer ma recherche`. La progression visuelle est cohérente avec les trois étapes.

Le CTA `Lancer ma recherche` renvoie directement aux résultats avec `Riz parfumé 5 kg`, les chips `10 unités`, `Budget 10 $`, `À proximité`, la carte Lomé, et les deux facilités avec statuts `Disponible` et `À vérifier`. Le contexte de recherche est donc conservé de bout en bout dans la maquette.
