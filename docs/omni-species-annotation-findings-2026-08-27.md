# Observations annotations Species — passe en cours

## Écran 10 — buyer no results recovery

La référence montre une carte Lomé/Afrique de l’Ouest en arrière-plan, un panneau blanc arrondi et une recherche `Lait d’amande 1 L`. L’état est `Aucun résultat exact`, avec deux actions de récupération : `Élargir la zone` et `Vérifier plusieurs facilités`. L’annotation 1 porte sur la zone du premier choix/action et doit être appliquée à cet écran uniquement.

## Écran 11 — facility product sheet

La référence montre une carte locale de Lomé, la facilité `Omni Demo Seller Hub`, badge `Certifiée Omni`, adresse `Lomé, Togo`, et un bloc QR clairement libellé `QR public de la facilité`. La note de séparation indique `QR public de la facilité — pas un QR de transaction`. Deux produits sont visibles avec image, prix, quantité, actions `Vérifier la disponibilité` et `Ajouter au panier`, ainsi qu’un état `Donnée fraîche` sur le riz. L’annotation 2 porte sur la zone du second produit et doit rester localisée à cet écran.

## Direction commune observée

Les écrans utilisent une carte géographique réaliste, une UI blanche très lumineuse, des sheets avec grand rayon, des boutons verts à icône, des photos produit réalistes, une typographie noire épaisse et des statuts colorés. Cette direction est la référence visuelle à conserver pour les autres écrans Buyer.

## Écran 12 — Bulk Facility

La référence montre une sheet blanche sur carte Lomé, titre `Vérifier plusieurs facilités`, badge Buyer Pro avec `842 crédits disponibles`, sélection `12 facilités sélectionnées`, demande `Riz parfumé 5 kg · 10 unités · Budget 10 $`, coût `12 crédits`, texte expliquant la vérification des réponses, puis CTA `Lancer la vérification` et bouton `Modifier la sélection`. L’annotation 3 porte sur le bloc explicatif des réponses et doit rester localisée.

## Écran 13 — panier/intention

La référence montre `Votre sélection`, facility `Omni Demo Seller Hub · Lomé`, deux produits avec photos et quantités, `Offre Omni incluse`, total `101,40 $`, une information de revalidation du stock, CTA vert `Créer mon intention`, bouton `Modifier la sélection`, et la note de sécurité `Vous ne serez engagé qu’après vérification et « Je veux acheter »`. L’annotation 4 porte sur le CTA de création d’intention ; ce bouton ne doit pas être présenté comme un paiement ou une transaction activée.

## Écran 14 — intention créée

La référence est une sheet Buyer avec carte Lomé en bandeau, titre `Intention créée`, status vert pâle `Vérification en attente`, explication de la confirmation Seller, facility et produits avec quantités/prix, total estimé `101,40 $`, timeline `Intention → Vérification → Je veux acheter → Transaction`, CTA `Suivre la vérification` et secondaire `Annuler l’intention`. L’annotation 5 porte sur l’étape active de vérification dans la timeline.

## Écran 15 — disponibilité confirmée / décision

La référence montre une carte locale en haut, icône de pin validé, titre `Disponibilité confirmée`, texte `Le stock Omni a été vérifié et est prêt pour vous.`, facility, produit `Riz parfumé 5 kg × 10`, badge `Vérifié maintenant`, prix `95,00 $`, question `Souhaitez-vous acheter ?`, CTA vert `Je veux acheter`, secondaire `Pas maintenant`, et note `Aucun paiement n’est requis pour l’instant. Vous confirmez simplement votre intention d’achat.` L’annotation 6 porte sur le CTA `Je veux acheter`, qui doit rester distinct du paiement.

## Écran 16 — QR transactionnel et chat

La référence affiche `Transaction Omni`, un QR de transaction, référence `OMNI-4827`, expiration `28 min`, facility et total `95,00 $`. Les actions sont `Ouvrir le chat`, `Itinéraire`, `Contacts du vendeur`. Une alerte précise que ce QR est lié à la transaction et au coupon, et ne doit pas être confondu avec le QR public de la facilité. L’annotation 7 porte sur la zone de navigation/itinéraire, qui doit rester dans le contexte transactionnel.

## Écran 17 — paiement et fulfilment

La référence affiche `Transaction Omni · OMNI-4827`, facility et total, timeline `QR vérifié`, `Paiement à confirmer · En cours`, `Retrait / livraison · En attente`, puis les méthodes `Mobile Money`, `Carte`, `Espèces déclarées`. Le CTA est `Déclarer le paiement`, avec l’aide `Le vendeur confirmera le paiement dans le chat` et l’action `Contacter le vendeur`. L’annotation 10 porte sur le titre `Méthode de paiement`; le paiement reste avant le fulfilment et ne clôture pas encore la transaction.
