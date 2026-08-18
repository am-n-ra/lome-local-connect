# Omni Atlas Glass — Matrice d’acceptation et certification

## Routes et surfaces

| Route/surface | Chargement | Succès | Vide | Erreur/retry | CTA dominant | Non-régression |
|---|---|---|---|---|---|---|
| `/` buyer idle | Globe/skeleton chrome | Globe animé + dock | Marché approximatif explicite | Retry localisation/couverture | Chercher | MapLibre et pins visibles |
| `/carte` recherche | Progression globe | Rail product-first | Élargir zone ou demande | Réessayer sans texte technique | Ouvrir facility | Enter et bouton identiques |
| Facility claimed | Skeleton produits | Média, confiance, produits | Aucun produit visible | Produits indisponibles avec reprise | Vérifier disponibilité | Contact/itinéraire gated |
| Facility unclaimed | Données publiques | Statut non réclamée | Sans produits | Réclamer/retry | Est-ce votre commerce ? | Aucun achat simulé |
| Disponibilité | Étape active | Étape suivante/réponses | Aucune réponse | Retry/élargir | Continuer ou Envoyer | `credit_cost=0` valide |
| Comparaison | Cards chargées | Best option visible | Réponse à confirmer | Retry | Je veux payer ici | Disponibilité avant intention |
| `/transaction/$id` | Room skeleton | QR/timeline/action | Room introuvable avec retour | Retry ou retour Mes demandes | Action MAINTENANT | Fermer ≠ annuler |
| Room QR | QR en attente | QR immédiatement présent | QR expiré | Régénérer | Présenter le QR | QR = identité transaction |
| Room paiement | Choix externe | Déclaration buyer | Aucun choix | Reprendre choix | J’ai payé le vendeur | Pas d’in-app payment |
| Room réception/rating | Timeline | Rating soumis | Rating requis | Retry soumission | Confirmer reçu / Noter | completed après rating |
| `/vendeur` Carte | Globe seller | Facility active | Aucun facility | Retry/revenir buyer | Console | Carte visible |
| `/vendeur` Console | Skeleton mission | Demande active | Aucune demande | Retry | Répondre à mission | Quatre raccourcis V1 |
| Scanner | Permission pending | Vidéo active | Saisie manuelle | Refus/unsupported + retry | Autoriser caméra | Tracks arrêtés à fermeture |
| Produit | Form skeleton | Aperçu + enregistré | Aucun produit | Erreur conservant draft | Publier produit | Coupon lié explicite |
| Coupon | Form skeleton | Économie client calculée | Aucun coupon | Erreur conservant draft | Enregistrer coupon | Type/période lisibles |
| Omni Wallet | Solde loading | Solde + allocations | Aucun solde | Retry FedaPay | Recharger | Un seul wallet |
| `/onboarding` | Skeleton | 3 étapes | Skip explicite | Retry/auth | Commencer recherche | Pas de débordement |
| `/auth` | Auth loading | Session | Non connecté | Retry | Créer compte | Restaure recherche |
| `/admin` | Permission loading | Metrics | Aucun événement | Retry | Filtrer/exporter | Accès admin séparé |

## Flows end-to-end

### Buyer

Le test commence par l’arrivée sur le globe, puis saisit un produit et soumet par bouton et par Enter. Il vérifie la progressive reveal, la présence des pins, l’ouverture d’une card facility, le statut claimed/unclaimed, l’accès au flow disponibilité et la comparaison des réponses. Il sélectionne une offre, clique `Je veux payer ici`, vérifie que transaction et QR apparaissent immédiatement, ferme la room, la reprend via le pill, retrouve le QR, choisit un paiement externe, déclare avoir payé, vérifie la confirmation seller, la livraison, la réception et l’obligation de rating avant `completed`.

### Seller

Le test ouvre le seller depuis le menu, vérifie la conservation du contexte carte, bascule en Console, observe une mission de disponibilité et répond Disponible/Partiel/Non. Il ouvre Ajouter un produit, crée un produit avec média et coupon associé, vérifie l’aperçu, ouvre Créer un coupon, ouvre Scanner un code, autorise la caméra sur HTTPS, observe la vidéo, teste la saisie manuelle, vérifie un QR, confirme paiement reçu et démarre fulfillment depuis la room ciblée.

### Navigation et reprise

Le test ouvre une room depuis une notification buyer, une notification seller, un QR deep-link et `/transaction/$id`. Il vérifie que le rôle est déterminé côté serveur, que le buyer revient à sa room au-dessus de la carte et que le seller revient à sa console/room ciblée. Il recharge la page et vérifie la reprise non destructive.

## Responsive

| Largeur | Vérifications obligatoires |
|---:|---|
| 320 px | Aucun scroll horizontal, CTA safe-area, inputs sans auto-zoom, dock lisible, cards non coupées. |
| 390 px | Dock centré, rail contrôlable, feuille corps scrollable, actions 44 px. |
| 768 px | Transition mobile/tablette stable, surfaces non latérales excessives, carte toujours visible. |
| 1024 px | Console seller deux colonnes possible, mission dominante conservée, chrome non encombré. |
| 1280 px | Globe libre, console bornée, rail centré, espaces réguliers et absence de panneau géant. |

## Accessibilité et mouvement

Chaque bouton possède un nom accessible. Les icônes seules portent un `aria-label`. Les changements de caméra, permission et transaction utilisent `aria-live` avec des messages courts. Le focus revient au trigger à la fermeture d’une sheet. Le contraste du verre est testé sur carte claire et carte sombre. Les animations non essentielles sont désactivées sous `prefers-reduced-motion`.

## Commandes de certification

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm check:client-boundary
```

Le rapport final doit joindre les captures par largeur, préciser les routes testées, les états non testés, les résultats de console navigateur et la confirmation que `.env`, credentials et artefacts temporaires ne sont pas versionnés.

## Critère de rejet global

Rejeter la livraison si le globe MapLibre est remplacé ou masqué, si les pins/discovery changent sans exigence explicite, si le paiement in-app apparaît, si le contact est visible avant intention, si une room fermée est perdue, si `completed` est accessible sans rating, si le scanner ne montre pas la vidéo après permission, si une option de menu est morte, si la console seller n’a aucune mission prioritaire, ou si un écran déborde à 320 px.
