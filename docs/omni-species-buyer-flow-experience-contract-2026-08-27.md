# Omni Species — contrat d’expérience Buyer et transitions

## Principe directeur

Omni s’ouvre comme un moteur de recherche local. La carte/globe est la surface d’entrée, la recherche est l’action principale, et les surfaces contextuelles révèlent progressivement les résultats, la disponibilité, l’intention et la transaction. Le Buyer ne doit pas être obligé de comprendre les rôles internes d’Omni pour rechercher un produit.

## Flow principal

| Étape | État visible | Action primaire | Transition autorisée | Engagement financier |
|---|---|---|---|---|
| 1 | Globe/carte idle | Rechercher | Recherche active | Aucun |
| 2 | Recherche active | Lancer la recherche | Résultats ou aucun résultat | Aucun |
| 3 | Auth requise | Continuer avec Omni | Connexion/inscription | Aucun |
| 4 | Onboarding | Continuer ou passer | Recherche reprise | Aucun |
| 5 | Résultats | Ouvrir une facilité / élargir | Fiche facilité | Aucun |
| 6 | Fiche facilité | Vérifier ou ajouter | Disponibilité / panier | Aucun |
| 7 | Bulk Facility | Lancer la vérification | Réponses Bulk | Crédits Buyer Pro consommés |
| 8 | Panier | Créer mon intention | Intention créée | Aucun |
| 9 | Intent créée | Suivre la vérification | Stock frais, réponse ancienne ou indisponibilité | Aucun |
| 10 | Disponibilité confirmée | Je veux acheter | Transaction active | Aucun à ce clic |
| 11 | Transaction active | Afficher QR / ouvrir chat | Paiement | Coupon et transaction créés |
| 12 | Paiement | Déclarer le paiement | Confirmation Seller | Selon méthode choisie |
| 13 | Fulfilment | Retrait/livraison | Réception Buyer | Aucun nouveau débit implicite |
| 14 | Réception | Publier mon avis | Transaction clôturée | Avis requis |

## Auth et reprise de recherche

Une recherche commencée hors authentification est conservée comme contexte temporaire. Le prompt d’auth explique la valeur de la connexion sans bloquer inutilement l’exploration. Après connexion ou inscription, l’onboarding peut demander zone et préférences, mais ne doit pas supprimer la query, la quantité, le budget ou la zone déjà saisis. À la fin, l’utilisateur revient directement à la recherche reprise.

## Disponibilité hybride

Une donnée fraîche peut produire une réponse automatique et doit afficher l’âge exact de l’observation. Une donnée ancienne affiche un état de confiance inférieur et sollicite une vérification manuelle Seller ou temps réel. Une réponse automatique ne transforme jamais une donnée périmée en vérité. Une demande manuelle est gratuite ; le service Bulk Facility, qui interroge plusieurs facilités, consomme les crédits Buyer Pro.

## Intent et transaction

Le panier permet de préparer plusieurs produits d’une même facilité et crée une intention. L’intention n’est pas un paiement et ne constitue pas encore une transaction activée. Après vérification, le Buyer prend explicitement la décision `Je veux acheter`. C’est cette décision qui active la transaction et génère le QR transactionnel associé au Buyer, au Seller, à la facilité, aux produits, au prix, au coupon et à l’expiration.

Le QR public de facilité n’est jamais réutilisé comme QR transactionnel. Le QR public découvre une facilité et ses offres. Le QR transactionnel prouve un contexte d’achat précis et ouvre le chat transactionnel, l’itinéraire et les contacts du Seller.

## Paiement et clôture

Le paiement est une étape après activation de la transaction. Les moyens visibles peuvent être Mobile Money, Carte ou Espèces déclarées, selon les intégrations et la disponibilité régionale. Le Seller confirme le paiement dans le chat ou via son scan QR. Le fulfilment vient ensuite. La clôture exige la réception Buyer et l’avis obligatoire ; elle déclenche alors, si toutes les invariantes sont satisfaites, une vente vérifiée pour la facilité et la progression commerciale `0/3 → 3/3`.

## États négatifs obligatoires

Chaque écran critique doit avoir une variante loading, empty, error, retry, cancel et recovery lorsque l’action peut échouer. La recherche doit gérer localisation refusée, aucun résultat et zone élargie. Le Bulk doit gérer crédits insuffisants, réponses partielles, échec d’un Seller et annulation. L’intention doit gérer expiration, indisponibilité partielle et retour arrière. La transaction doit gérer QR invalide ou expiré, paiement échoué, session expirée, hors connexion et fulfilment annulé.

## Règles d’accessibilité et de layout

La carte conserve une présence visuelle lorsque le contexte le permet, mais ne doit pas empêcher la lecture d’une sheet. Le dock de recherche reste au-dessus du clavier et la scène ne doit pas être poussée brutalement. Les boutons primaires ont une zone tactile large et un libellé explicite. Le focus, les états de chargement, le reduced motion et les erreurs ont un rendu visible. Les textes de prix et de devise utilisent le contexte local du Buyer sans modifier la valeur canonique du serveur.

## Gate de validation

La Species Buyer est prête pour revue lorsque la série d’images corrigées couvre ce contrat, que les QR public/transactionnel sont distincts, que l’ordre intent → vérification → `Je veux acheter` → transaction → paiement est lisible, et que les états négatifs essentiels ont une sortie de récupération. L’acceptation du fondateur est requise avant toute nouvelle implémentation UI.
