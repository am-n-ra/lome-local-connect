# Omni — plan complet de mise en production

Base de départ : le code est ramené exactement au commit `a645ec7`. Neon Auth, Neon PostgreSQL, les migrations existantes et l'import OSM de Grand Lomé sont conservés — rien n'est remplacé, tout est étendu.

Objectif : une application web réellement utilisable de bout en bout par de vrais acheteurs et de vrais vendeurs, conforme au PRD Omni. Livraison en une grosse passe, organisée en 9 lots successifs vérifiés au fur et à mesure.

Hors périmètre (terrain préparé, pas construit) : application native, push en arrière-plan, cache offline complet, découverte d'appareils, réplication opérationnelle multi-villes. L'API et les services sont structurés pour que le mobile réutilise le même backend.

---

## Lot 0 — Fondation

**Identité et design system « Creamy Glass »**
- Le pin-œil 3D devient le logo unique : favicon carré, bouton de recherche du dock, en-têtes, auth, écrans vides, marqueur sélectionné sur la carte.
- Tokens dans `src/styles.css` : base crème quasi-blanche désaturée, accents terracotta / vert profond / or, surfaces frostées, ombres douces, rayons généreux. Aucune couleur en dur dans les composants, jamais d'allure « dashboard SaaS générique ».
- États visuels normalisés et réutilisables : chargement, vide, erreur, hors-ligne, succès, sponsorisé, disponibilité vérifiée.
- Responsive desktop / tablette / mobile traité comme une contrainte de composant, pas comme une passe finale.

**Market configuration**
- Table `markets` : code, pays, devise, langues, rail de paiement, canal communautaire, centre et zoom de carte par défaut, activation du parcours de certification informelle. `TG-LOME` devient une simple ligne.
- Plus aucun « Togo », « Lomé » ou « FCFA » codé en dur : devise, formats, libellés et cadrage carte sont lus du marché actif.

**Identité et rôles**
- Un compte unique, rôles cumulables acheteur / vendeur, profil synchronisé avec Neon Auth.
- Middleware serveur obligatoire sur toute opération sensible ou coûteuse (IA, crédits, paiement, admin, import).
- i18n FR/EN : dictionnaires, hook de traduction, messages serveur traduisibles, repli par marché.

---

## Lot 1 — Schéma de données consolidé

Migration de consolidation couvrant : `markets`, `profiles`, `user_roles`, `user_interests`, `facilities`, `facility_claims`, `facility_sources`, `facility_media`, `facility_links`, `facility_posts`, `products`, `services`, `offers`, `coupons`, `subscription_plans`, `subscriptions`, `user_credits`, `credit_ledger`, `ai_agent_configs`, `availability_requests`, `availability_targets`, `availability_responses`, `carts`, `cart_items`, `transactions`, `transaction_items`, `transaction_tokens`, `messages`, `wishlists`, `ratings`, `ad_campaigns`, `notifications`, `catalog_imports`, `import_regions`, `osm_import_jobs`, `osm_raw_places`, `analytics_events`, `acquisition_agents`, `facility_acquisition_events`.

États normalisés :
- Facility : `unclaimed` → `certified` → `confirmed` (un vendeur revendique, l'admin certifie, les 3 transactions QR de 3 acheteurs distincts confirment). Les données existantes sont converties.
- Transaction : `pending` → `authorized` → `payment_confirmed` → `completed`, plus `expired` et `cancelled`.
- Cart : `pending` / `validated` / `expired`.
- Réponse de disponibilité : `available` / `unavailable` / `partial`.

Règle intangible : une place OSM n'est pas un vendeur. `unclaimed` signifie `owner_id` nul, aucun abonnement, aucun contact privé, aucun produit, aucune confirmation possible — seulement la revendication.

---

## Lot 2 — Supply mondiale : import OSM

- Pipeline en étapes séparées et reprenables : extraction → `osm_raw_places` → normalisation → déduplication → catégorisation → validation des coordonnées → `facilities` unclaimed → indexation.
- Sources : Overpass pour les imports ciblés, extraits régionaux Geofabrik pour les gros volumes, jobs batch progressifs pilotés par `osm_import_jobs` avec reprise, quotas et journal d'erreurs.
- Mapping des tags OSM vers une taxonomie Omni hiérarchique (`fashion.shoes`, `food.restaurant`, `health.pharmacy`, `services.plumber`, `electronics`, `education.school`…), priorisant `shop`, `amenity`, `craft`, `office`, `tourism`, `healthcare`, `leisure`, `marketplace`.
- Déduplication : identifiant OSM, nom normalisé, proximité géographique, catégorie, téléphone, site web, adresse approchée.
- Progression géographique : Grand Lomé → Togo → Afrique de l'Ouest → Afrique → autres régions par pays et bbox. Le monde est en base, jamais dans le navigateur.
- Attribution ODbL affichée dans l'interface.

---

## Lot 3 — Carte, viewport et globe

- MapLibre en interface principale : `/` est la carte, plein écran, chrome minimal (aucun logo en haut à gauche, un seul bouton menu en haut à droite).
- API viewport `GET /facilities?bbox&zoom&market&category&search` : clusters aux zooms larges, points aux zooms serrés, charge utile minimale, détail complet seulement au clic.
- Projection globe au dézoom (sans univers 3D séparé), clustering, bouton « rechercher dans cette zone », recentrage automatique sur les résultats pertinents proches, pins petits et lisibles avec états distincts : normal, sélectionné, actif, confirmé, sponsorisé, disponibilité vérifiée.
- Dock bas conforme au mockup : pilule frostée `[caméra] | champ texte | [micro] [bouton logo]`, catégories repliées derrière un chevron, icône filtre discrète, compteur de résultats au-dessus de la pilule.
- Performance : clustering serveur, index géographiques, mise en cache, charges utiles compactes pour faible bande passante.

---

## Lot 4 — Recherche

- `SearchIntent` déterministe extrait de la requête : produit, service, catégorie, quantité, variante, taille, couleur, prix min/max, position, rayon, disponibilité exigée, moment souhaité, marché, langue. L'IA n'intervient qu'en complément, jamais comme unique voie.
- Pipeline : requête → intention → filtre géographique → correspondance produit/service/catégorie → pertinence de disponibilité → classement prix/distance/pertinence/confiance → résultats sponsorisés clairement marqués → résultats.
- Modes de résultats : Tout · Produits · Services · Offres · Commerces · Images · Vidéos · Articles, la carte restant l'ancre géographique partout.
- Recherche « problème → solution » par expansion sémantique quand rien ne correspond directement ; voix (français, éwé, mina) et image derrière une abstraction de fournisseur IA.
- Mur de compte : aucune recherche sans compte — un visiteur voit la carte, mais toute recherche exige une connexion pour ne pas laisser fuir les données ; la recherche d'origine est mémorisée et reprend automatiquement après inscription et onboarding.
- Zéro résultat → capture de demande, jamais un écran vide.

---

## Lot 5 — Fiche vendeur = centralisation de présence en ligne

C'est la pièce qui différencie Omni d'un annuaire.

- Fiche publique riche : en-tête (nom, catégorie, statut de confiance, note, transactions, ouvert/fermé, distance), vitrine média, catalogue produits et services avec remise, offres, avis, actions principales.
- **Agrégation de présence sans duplication** : le vendeur déclare ses liens (TikTok, YouTube, Instagram, Facebook, site, blog). Omni stocke l'URL canonique et les métadonnées (titre, vignette, date), pas une copie du média, et affiche le contenu via les lecteurs intégrés officiels. Aucun re-hébergement, aucun doublon, la source reste maîtresse.
- Onglets de la fiche : Vitrine · Catalogue · Contenus (posts sociaux intégrés) · Articles/blog · Avis · Infos pratiques.
- Médias propres à Omni (photos et vidéos téléversées) : compression côté client, vignettes, stockage R2, réordonnancement — distincts des contenus agrégés.
- Rafraîchissement périodique des métadonnées des liens, gestion des liens morts, ordre d'affichage contrôlé par le vendeur.
- **Fiche `unclaimed` vivante** : elle n'est pas un pin mort. Elle affiche les contenus publics rattachés à ce lieu (mentions, articles, vidéos, images publiques, liens sociaux détectés ou signalés), reste indexée et trouvable par la recherche, mais n'expose ni contact privé, ni catalogue achetable, ni bouton d'achat. Seules actions possibles : « Revendiquer », « Signaler une info », « Prévenez-moi quand ce commerce arrive ». Un utilisateur peut inviter le commerce à rejoindre Omni, et cette invitation est traçée comme signal d'acquisition pour l'équipe terrain.

---

## Lot 6 — Parcours vendeur

- Onboarding : rechercher une fiche existante ou en créer une → revendication → passage obligatoire par le canal communautaire du marché → soumission de certification (identité, documents, preuve d'adresse) → validation admin.
- Tableau de bord vendeur (jamais un tableau SaaS générique) : état de la fiche et prochaine étape, demandes de disponibilité entrantes, commandes, catalogue, médias et présence en ligne, statistiques, demande locale, abonnement et crédits.
- Catalogue : produits et services, remise obligatoire à la création, `omni_stock_quantity` — la part du stock allouée à Omni, distincte du stock réel du commerce, Omni n'étant pas une caisse.
- Free : 5 produits maximum, réponses manuelles. Pro : catalogue illimité, import en masse au-delà de 5, agent Omni, statistiques avancées, publicité, multi-facilités.
- Import de catalogue en masse (CSV, Excel, photos de stock, liste collée) normalisé par l'IA : détection des noms, prix, catégories, variantes, doublons, puis revue et validation en un écran avant publication.
- Présence mobile en self-service pour les vendeurs de service (avant-plan uniquement).

---

## Lot 7 — Disponibilité, crédits, transaction, chat

**Disponibilité en masse**
- Bouton unique « Vérifier la disponibilité de tous » au-dessus des résultats, distinct de la vérification individuelle depuis une fiche.
- Le fan-out cible toutes les facilités du résultat filtré — aucun plafond codé en dur, ni en nombre ni en distance ; seuls les filtres de l'acheteur déterminent l'ampleur.
- Réponses progressives : agent IA si le vendeur est Pro, réponse manuelle sinon ; regroupées dans « Mes demandes » via l'identifiant de demande.
- Résumé de l'agent IA acheteur : combien de facilités, qui a quoi en quelle quantité et à quel prix, puis une recommandation explicite. L'acheteur suit ou choisit autrement.

**Crédits et monétisation**
- Solde de crédits, pas un compteur de requêtes : le coût est proportionnel au nombre de facilités interrogées. L'allocation gratuite mensuelle couvre environ trois demandes moyennes ; une demande géante en consomme davantage, des demandes ciblées en consomment moins.
- Acheteur Free/Pro, vendeur Free/Pro, recharge à l'unité, parcours explicite en cas de crédits insuffisants.
- Trois compteurs séparés : solde réel retirable, crédits IA, crédits publicitaires promotionnels non retirables.
- Publicité clairement marquée en trois formats : classement sponsorisé, recommandation sponsorisée, carte sponsorisée sur le pin — jamais sur une requête non pertinente.

**Transaction**
- « Je veux acheter » est une étape explicite : c'est là seulement que le contact vendeur et le chat s'ouvrent.
- Panier et lignes de transaction figent quantité, prix unitaire, remise et total au moment de l'achat — l'historique ne bouge jamais si le catalogue change.
- Autorisation par QR signé, avec code de secours à six caractères, strictement séparée du paiement. Parcours en personne (scan sur place) et à distance (autorisation puis confirmation).
- Paiement in-app FedaPay ou hors-app avec confirmation croisée, puis confirmation de réception par l'acheteur avant notation 5 étoiles, puis passage en `completed` qui alimente la confiance.

**Chat transactionnel**
- Le chat n'est pas une messagerie libre : il est rattaché à une demande ou à une transaction, avec des cartes d'action structurées (proposition de quantité, prix, autorisation, paiement, confirmation).
- L'agent peut conduire les étapes pour l'acheteur, avec des points de contrôle explicites ; le niveau d'automatisation est choisi par l'acheteur, la confirmation de paiement restant la friction par défaut.

---

## Lot 9 — Omni Agent (acheteur et vendeur)

L'agent n'est pas un chatbot posé à côté du produit : c'est un second mode de pilotage de la même application. La carte reste l'écran principal ; l'agent travaille dessus, visiblement.

**Mode Agent**
- Bascule « Manuel / Agent » dans le dock. En mode Agent, l'utilisateur écrit une intention au lieu d'un mot-clé : « trouve-moi 20 sacs de ciment à moins de 4 500 la pièce à moins de 3 km », « j'ai vendu 12 unités de ce produit, mets à jour mon stock », « écris un article sur ce produit ».
- La carte reste au centre et devient la scène du travail de l'agent : les pins interrogés s'allument un par un, les réponses arrivent en direct, les candidats retenus se détachent, le recommandé pulse. Un fil d'étapes compact (« 47 commerces interrogés · 12 réponses · 3 correspondent à ton budget ») accompagne l'animation.
- Côté vendeur, même écran mais centré sur sa facilité : demandes entrantes, stock, contenus, campagnes — l'agent agit et l'on voit ce qu'il fait.
- Trois niveaux d'autonomie, choisis par l'utilisateur et modifiables à tout moment : **Manuel** (l'agent propose, l'humain fait), **Semi-auto** (l'agent exécute, points de contrôle explicites aux étapes engageantes), **Auto** (l'agent va jusqu'au bout, seul le paiement reste confirmable — délégable aussi en Pro).

**Agent acheteur**
- Comprend l'intention complète : produit, quantité, budget, délai, zone, variantes acceptables.
- Lance la recherche, puis la vérification de disponibilité en masse, sans que l'utilisateur ait à enchaîner les écrans.
- Synthétise les réponses : qui a quoi, en quelle quantité, à quel prix, à quelle distance, avec quelle fiabilité — puis une recommandation argumentée en une phrase.
- Négocie la quantité et le prix dans le chat vendeur avec des messages préréglés (les messages libres restent possibles), déclenche l'intention d'achat, génère le QR, suit la transaction jusqu'à la confirmation de réception.
- Peut surveiller une demande dans le temps : « préviens-moi quand quelqu'un a ça à ce prix ».

**Agent vendeur**
- Répond aux demandes de disponibilité à partir du stock Omni, avec proposition d'alternative ou de quantité partielle.
- Gère le stock par langage naturel (« j'ai vendu 12 unités », « rupture sur ce modèle », « baisse de 10 % cette semaine »).
- Rédige et publie du contenu : fiches produit, descriptions, articles et billets de blog qui enrichissent le contexte de la fiche et nourrissent l'index de recherche — chaque contenu généré est rattaché à la facilité, marqué comme rédigé avec l'agent, et validé par le vendeur avant publication.
- Traite l'import de catalogue en masse, propose des remises cohérentes, signale les fiches incomplètes.
- Recommande des actions commerciales : quoi mettre en avant, quelle campagne lancer, quelle demande locale est non servie.

**Publicité par l'agent**
- L'agent peut inclure une recommandation sponsorisée dans ses réponses, toujours visiblement marquée comme telle, jamais si elle ne répond pas à l'intention réelle, et jamais à la place du meilleur choix objectif — le classement honnête reste affiché à côté.
- Ciblage par zone, par intention en cours et par historique d'intention, facturé au vendeur sur ses crédits publicitaires.

**Cadre technique**
- Chaque action de l'agent passe par un outil serveur typé (rechercher, vérifier la disponibilité, créer un panier, générer un QR, mettre à jour le stock, publier un contenu, lancer une campagne) — jamais par du SQL libre.
- Les actions engageantes exigent une approbation selon le niveau d'autonomie ; tout est journalisé et rejouable, avec un historique lisible « ce que l'agent a fait pour vous ».
- Consommation de crédits par action, budget maximum par session, garde-fous de coût et de débit.
- Flux préréglés et reproductibles : les messages types couvrent le parcours standard, le message libre reste l'exception.

## Périmètre V1 vs V2

L'agent est construit dans cette architecture, mais activé progressivement : la **V1** livre la recherche, la carte mondiale, le catalogue, la vérification vendeur, la disponibilité en masse, le résumé et la recommandation, les crédits, la publicité ciblée, l'admin et le système terrain — l'agent y est présent en mode assistance et résumé. Les modes **semi-auto** et **auto** de bout en bout, ainsi que le paiement délégué, s'ouvrent en **V2**, une fois les données d'usage réelles collectées. Le code est écrit une seule fois ; ce sont des drapeaux de plan et de marché qui décident de ce qui est ouvert.

---

## Lot 10 — Menu, pages secondaires, notifications, admin


- Menu unique en feuille frostée depuis le bouton en haut à droite : profil, mes demandes, panier, commandes, listes de souhaits, messages, crédits et abonnement, espace vendeur, aide et FAQ self-service, langue, à propos, déconnexion.
- Onboarding acheteur : compte → centres d'intérêt → explication du modèle → canal communautaire optionnel → reprise de la recherche initiale.
- Notifications serveur idempotentes : une table, un émetteur unique, déduplication, lecture/non-lu, cloche en temps réel, e-mail si pertinent. Pas de doublons quand un job rejoue.
- Admin : file de certification, modération des fiches et des médias, suivi des revendications, supervision des imports OSM, audit financier et reversements semi-manuels, gestion des marchés et des plans, intelligence de la demande, analytics, attribution d'acquisition et suivi des agents terrain.
- Sécurité : jamais de confiance au frontend, validation systématique des entrées, limitation de débit, contrôle du coût IA, gardes de rôle sur chaque fonction serveur, secrets uniquement côté serveur.
- API publique `/api/public/v1` complétée (`/search`, `/facilities`, `/facilities/{id}`, `/offers`, `/stats`) avec clés et quotas, OpenAPI 3.1 et page `/api-docs` à jour, pensée pour être réutilisée par le mobile.

---

## Détails techniques

- Reset de l'arbre de travail sur `a645ec7`, puis correctif immédiat de l'erreur bloquante : `expandProblemQuery` manquante dans `src/lib/ai-search.server.ts` alors que `src/lib/search-index.server.ts` l'importe.
- Services serveur dédiés : `market`, `facility`, `osm-import`, `search`, `availability`, `ai`, `credit`, `subscription`, `transaction`, `notification`, `analytics`, `presence`. Les fichiers `*.functions.ts` restent des wrappers fins ; toute la logique vit dans les modules `*.server.ts`.
- Migrations SQL additionnelles pour les nouvelles entités, avec conversion des données existantes et index géographiques et texte adaptés.
- Fournisseur IA derrière une abstraction unique (Groq puis passerelle Lovable en repli), budget et journalisation des appels.
- Métadonnées SEO par route, audit responsive et audit d'états (chargement / vide / erreur / hors-ligne) sur chaque écran avant clôture.

## Définition de « prêt pour la production »

Le parcours acheteur complet fonctionne sur données réelles persistées : visiteur → recherche → mur de compte → inscription → onboarding → reprise de la recherche → résultats sur la carte → disponibilité en masse → crédits consommés → réponses vendeurs → résumé IA → choix → transaction → autorisation QR → paiement confirmé → terminé.

Et le parcours vendeur : trouver ou créer sa fiche → revendication → certification → catalogue et présence en ligne → demandes reçues → réponse manuelle ou IA → intention d'achat → autorisation → paiement reçu → transaction terminée → confiance qui progresse jusqu'à `confirmed`.
