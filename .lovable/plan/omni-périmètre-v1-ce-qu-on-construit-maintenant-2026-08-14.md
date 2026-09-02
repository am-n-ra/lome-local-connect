# Omni — périmètre V1 (ce qu'on construit maintenant)

Ce plan remplace le plan précédent. Le document master (moteur de recherche géospatial complet, agent autonome, KYC hybride, recherche de contenu) reste la vision V3+ : il n'est pas le brief de cette phase. On construit ici le V1 tel que défini par la règle de tri — prouver la confiance par transaction, faire tourner les processus terrain, fermer les boucles de revenu déjà testées.

Base de code : `a645ec7`, Neon Auth + Neon PostgreSQL conservés, migrations et import OSM existants conservés.

---

## Lot 0 — Débloquer le build(the next commit should focus on fixing this and returning to the specified code base)

Quatre erreurs bloquent actuellement la compilation. Elles passent avant tout le reste.

- `expandProblemQuery` manquante dans `src/lib/ai-search.server.ts` alors que `src/lib/search-index.server.ts` l'importe.
- `min_price` et `max_discount_percent` absents du type `MapFacility` dans `src/components/omni/MapCanvas.tsx`.
- `online` possiblement `undefined` passé à `LiveStatus` dans `src/routes/carte.tsx`.

Build vert avant d'ouvrir le lot suivant.

---

## Lot 1 — Fondation et marché

- Logo pin-œil unique partout : favicon carré, bouton du dock, en-têtes, auth, écrans vides, marqueur sélectionné.
- Design system « Creamy Glass » : base crème désaturée, accents terracotta / vert profond / or, surfaces frostées, aucune couleur en dur, jamais une allure de tableau de bord SaaS générique.
- États normalisés et réutilisables : chargement, vide, erreur, hors-ligne, succès, sponsorisé, disponibilité vérifiée.
- Table `markets` : devise, rail de paiement, langues, canal communautaire, centre/zoom par défaut, activation de la certification informelle. Plus aucun « Togo », « Lomé » ou « FCFA » codé en dur. `TG-LOME` devient une ligne.
- i18n FR/EN, responsive traité au niveau des composants.

---

## Lot 2 — Carte et supply

- `/` est la carte plein écran, chrome minimal : aucun logo en haut à gauche, un seul bouton menu en haut à droite.
- API viewport `bbox + zoom` : clusters au dézoom, points au zoom serré, charge utile minimale, détail au clic. Projection globe au dézoom, mercator au zoom — pas d'univers 3D.
- Pins petits et lisibles, états distincts : normal, sélectionné, actif, confirmé, sponsorisé, disponibilité vérifiée.
- Import OSM des fiches `unclaimed` : pipeline en étapes reprenables (extraction → brut → normalisation → dédoublonnage simple → catégorisation → facilities), jobs progressifs par bbox, attribution ODbL affichée. Progression Grand Lomé → Togo → région, pilotée depuis l'admin.
- Une fiche `unclaimed` n'est pas un vendeur : pas de propriétaire, pas d'abonnement, pas de catalogue achetable, pas de contact privé. Actions possibles : revendiquer, signaler, « prévenez-moi ».

---

## Lot 3 — Recherche

- Dock bas conforme au mockup : pilule frostée `[caméra] | champ texte | [micro] [bouton logo]`, catégories repliées derrière un chevron, icône filtre, compteur de résultats au-dessus.
- Intention déterministe extraite de la requête : produit, catégorie, quantité, prix min/max, position, rayon, disponibilité exigée, marché. L'IA complète, elle ne remplace pas.
- Classement : pertinence, distance, prix, disponibilité, confiance, sponsorisé clairement marqué.
- Voix et image restent branchées telles quelles, derrière l'abstraction de fournisseur IA. Ce n'est pas un chantier de cette phase.
- Mur de compte : aucune recherche sans compte, la recherche d'origine est mémorisée et reprise après inscription et onboarding.
- Zéro résultat → capture de demande, jamais un écran vide.

Hors V1 : recherche de contenu (articles, vidéos, indexation sémantique du web), reconnaissance visuelle de produit comme pilier.

---

## Lot 4 — Fiche vendeur et cycle de vie

- Quatre statuts : `unclaimed` → `certified` → `unconfirmed` → `confirmed`. Palier canal communautaire obligatoire avant `unconfirmed`. Seuil de 3 transactions QR vérifiées, d'acheteurs distincts, avant `confirmed`.
- Certification = processus humain simple : soumission (identité, document, référence) → revue admin → approbation. Pas d'OCR, pas de scoring, pas de KYC séparé.
- Fiche publique : en-tête (nom, catégorie, statut, note, transactions, ouvert/fermé, distance), vitrine média, catalogue avec remise, offres, avis, infos pratiques.
- Liens de présence en ligne déclarés par le vendeur : URL canonique + métadonnées + lecteur intégré officiel, jamais de re-hébergement ni de copie.
- Médias Omni téléversés : compression client, vignettes, stockage R2, réordonnancement.
- Un vendeur = une fiche. Pas de séparation Company / Facility / Owner / Manager, pas de transfert de propriété auditable.

---

## Lot 5 — Parcours vendeur

- Onboarding : trouver ou créer sa fiche → revendication → canal communautaire du marché → soumission de certification → validation admin.
- Tableau de bord : état de la fiche et prochaine étape, demandes de disponibilité, commandes, catalogue, médias et présence, statistiques, demande locale, abonnement et crédits.
- Catalogue : remise obligatoire à la création, `omni_stock_quantity` — allocation partielle du stock à Omni, jamais un ERP.
- Free : 5 produits, réponses manuelles. Pro ($10/mois) : catalogue illimité, import en masse, agent niveaux 1 et 2, statistiques avancées, publicité.
- Import en masse au-delà de 5 : fichier CSV/Excel, mapping IA simple colonne → schéma, aperçu et validation avant publication, traitement asynchrone. Pas de pipeline de déduplication avancé.
- Présence mobile en self-service (avant-plan) pour les vendeurs de service et les fiches `type=mobile`.
- Bonus $20 conservé tel qu'implémenté : débloqué après ventes prouvées, jamais à l'inscription.

---

## Lot 6 — Disponibilité, crédits, transaction

- Bouton « Vérifier la disponibilité de tous » au-dessus des résultats, distinct de la vérification individuelle. Fan-out sur tout le résultat filtré, aucun plafond de distance ni de nombre codé en dur.
- Crédits IA proportionnels au nombre de fiches interrogées, pas un compteur fixe de requêtes. Acheteur Free/Pro ($1-2/mois), recharge à l'unité, parcours explicite en cas de solde insuffisant.
- Agent vendeur niveau 1 (propose une réponse) et niveau 2 (répond automatiquement à la disponibilité depuis le stock Omni), activés explicitement. Le niveau 3 (commande automatique) est V2.
- Résumé acheteur : qui a quoi, en quelle quantité, à quel prix, à quelle distance, puis une recommandation explicite.
- « Je veux acheter » est une étape explicite : c'est là que le contact et le chat s'ouvrent.
- Panier et lignes de transaction figent quantité, prix, remise et total au moment de l'achat.
- Autorisation par QR signé avant paiement, avec code de secours manuel à six caractères. Parcours en personne et à distance.
- Paiement FedaPay in-app ou hors-app avec confirmation croisée, puis confirmation de réception, note 5 étoiles, passage en `completed` qui alimente la confiance.
- Chat structuré rattaché à une demande ou une transaction, avec cartes d'action et points de contrôle explicites. Pas d'agent en intention libre exécutant tout de bout en bout.

---

## Lot 7 — Monétisation et publicité

- Plans : acheteur Free/Pro, vendeur Free/Pro, crédits IA, crédits publicitaires promotionnels non retirables, solde retirable distinct.
- Trois formats publicitaires, tous clairement marqués : classement sponsorisé, carte recommandée, pin sponsorisé. Pas de quatrième surface via l'agent.
- Notifications : push à l'ouverture pour tous, e-mail et message direct réservés au Pro vendeur. Émetteur unique, table unique, déduplication, lecture/non-lu, cloche temps réel.

---

## Lot 8 — Menu, admin, API

- Menu unique en feuille frostée : profil, mes demandes, panier, commandes, listes de souhaits, messages, crédits et abonnement, espace vendeur, aide et FAQ, langue, à propos, déconnexion.
- Onboarding acheteur : compte → centres d'intérêt → explication du modèle → canal communautaire optionnel → reprise de la recherche initiale.
- Admin : file de certification, modération des fiches et médias, suivi des revendications, supervision des imports OSM, audit financier et reversements semi-manuels, gestion des marchés et des plans, intelligence de la demande, attribution d'acquisition et suivi des agents terrain.
- Sécurité : aucune confiance au frontend, validation systématique, limitation de débit, garde de rôle sur chaque fonction serveur, contrôle du coût IA, secrets uniquement côté serveur.
- API publique `/api/public/v1` (`/search`, `/facilities`, `/facilities/{id}`, `/offers`, `/stats`) avec clés et quotas, OpenAPI 3.1 et `/api-docs` à jour — pensée pour être réutilisée par le mobile financé par la levée.

---

## Hors périmètre V1 (assumé, structure préparée)

Company / Facility / Owner / Manager séparés et transfert de propriété auditable · KYC hybride avec OCR et scoring · recherche par contenu et génération d'articles IA · recherche visuelle comme pilier · découverte 3D et cartes vidéo animées · orchestration API d'abonnements tiers · mesh offline · agent en intention libre de bout en bout · publicité comme 4e surface via l'agent · agent vendeur niveau 3.

Mobile natif (push réels, géoloc arrière-plan pour `type=mobile`, cache lecture hors ligne, scanner QR natif) : financé par la levée, hors de ce chantier web. L'API et les services sont structurés pour qu'il réutilise le même backend.

---

## Détails techniques

- Services serveur dédiés : `market`, `facility`, `osm-import`, `search`, `availability`, `ai`, `credit`, `subscription`, `transaction`, `notification`, `analytics`, `presence`. Les `*.functions.ts` restent des wrappers fins, la logique vit dans les `*.server.ts`.
- Migrations additionnelles pour les nouvelles entités, avec conversion des données existantes et index géographiques et texte.
- Fournisseur IA derrière une abstraction unique (Groq puis passerelle Lovable en repli), budget et journalisation des appels.
- Métadonnées SEO par route, audit responsive et audit d'états sur chaque écran avant clôture.

## Définition de « prêt »

Acheteur : visiteur → recherche → mur de compte → inscription → onboarding → reprise de la recherche → résultats sur la carte → disponibilité en masse → crédits consommés → réponses vendeurs → résumé → choix → autorisation QR → paiement → terminé.

Vendeur : trouver ou créer sa fiche → revendication → canal communautaire → certification → catalogue et présence → demandes reçues → réponse manuelle ou agent niveau 2 → intention d'achat → autorisation → paiement reçu → transaction terminée → confiance jusqu'à `confirmed`.