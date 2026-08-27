# Omni Species — fiches d’édition écran par écran

## Statut de la passe

Cette fiche transforme les annotations du fondateur en instructions d’édition déterministes. Chaque sortie doit être générée comme une image indépendante à partir de son écran source, sans collage de plusieurs écrans. Les cadres pointillés, numéros noirs et repères d’annotation ne doivent jamais apparaître dans la sortie finale.

La direction visuelle est héritée des références fournies : carte réaliste de Lomé ou de l’Afrique de l’Ouest, fond ivoire/gris très clair, carte en relief discret, labels géographiques fins, pins verts et ivoire, sheets blanches avec grands rayons, ombres douces, wordmark Omni noir, typographie moderne noire, vert réservé aux actions et confirmations.

## 10 — Aucun résultat exact

**Rôle.** État de récupération après une recherche sans correspondance exacte.

**Conserver.** La carte régionale, la recherche `Lait d’amande 1 L`, le titre `Aucun résultat exact`, le texte explicatif et la seconde action `Vérifier plusieurs facilités`.

**Modifier.** Raffiner uniquement la première carte `Élargir la zone`. Elle doit comporter une icône verte d’expansion/localisation, un titre noir lisible, le sous-texte `Rechercher dans une zone plus grande`, une flèche de navigation à droite, un grand rayon, une ombre très légère et une surface tactile évidente. Retirer l’annotation 1.

**Règle.** Cette action élargit la géographie de recherche ; elle ne lance pas une disponibilité Bulk et ne modifie pas la quantité ou le budget.

## 11 — Fiche facilité et produits

**Rôle.** Découverte d’une facilité publique et de ses offres Omni.

**Conserver.** `Omni Demo Seller Hub`, `Certifiée Omni`, `Lomé, Togo`, le QR public et la phrase `QR public de la facilité — pas un QR de transaction`, ainsi que le produit riz avec `Donnée fraîche`.

**Modifier.** Raffiner uniquement la carte du second produit `Huile végétale 1 L`. Conserver le prix `3,20 $`, la quantité disponible et les deux actions. Aligner l’image, le nom, le prix, le statut et les boutons avec le premier produit. Ajouter un statut de fraîcheur cohérent si présent dans la source ; ne pas inventer une confirmation temps réel. Retirer l’annotation 2.

**Règle.** Le QR public ouvre la fiche de découverte. Il ne crée ni intention ni transaction.

## 12 — Bulk Facility

**Rôle.** Prévisualisation d’une vérification de plusieurs facilités réservée au Buyer Pro et consommant des crédits.

**Conserver.** `Buyer Pro`, `842 crédits disponibles`, `12 facilités sélectionnées`, `Riz parfumé 5 kg · 10 unités · Budget 10 $`, `Cette demande : 12 crédits`, `Lancer la vérification` et `Modifier la sélection`.

**Modifier.** Raffiner uniquement le bloc explicatif marqué 3. Le texte doit rester lisible et séparé en deux idées : Omni vérifie les réponses sans appeler chaque vendeur ; les données anciennes déclenchent une réponse temps réel. Utiliser une icône étincelle pour l’automatisation et une horloge pour la fraîcheur. Ne pas présenter le Bulk comme une garantie de stock ni comme une transaction. Retirer l’annotation 3.

## 13 — Panier et création d’intention

**Rôle.** Revue d’une sélection multi-produit avant création d’une intention.

**Conserver.** La facilité unique, les deux produits, quantités, prix, `Offre Omni incluse`, total `101,40 $`, revalidation du stock et la note indiquant que l’engagement intervient après vérification et `Je veux acheter`.

**Modifier.** Raffiner uniquement le CTA marqué 4. Le bouton doit afficher clairement `Créer mon intention`, avec icône flèche, couleur verte Omni, contraste élevé et grande zone tactile. Ajouter visuellement une distinction nette entre la création d’intention et le paiement. Retirer l’annotation 4.

**Règle.** Ce CTA crée une intention uniquement. Il ne débite pas le Buyer et n’active pas la transaction.

## 14 — Intention créée

**Rôle.** Suivi d’une intention créée, en attente de vérification de disponibilité.

**Conserver.** `Intention créée`, `Vérification en attente`, la facility, les produits, le total estimé `101,40 $`, la timeline et les actions de suivi/annulation.

**Modifier.** Raffiner uniquement l’étape de timeline marquée 5. Elle doit être l’étape active, avec une horloge ou un indicateur de vérification en vert, un libellé noir `Vérification`, un connecteur animé ou visuellement en progression vers `Je veux acheter`, et les autres étapes clairement inactives. Retirer l’annotation 5.

**Règle.** Tant que cette étape n’est pas confirmée, le Buyer ne voit pas le CTA de transaction active.

## 15 — Disponibilité confirmée

**Rôle.** Décision explicite du Buyer après vérification de disponibilité.

**Conserver.** `Disponibilité confirmée`, `Vérifié maintenant`, la facility, le produit, la quantité, le prix, `Pas maintenant` et la note indiquant qu’aucun paiement n’est requis.

**Modifier.** Raffiner uniquement le CTA marqué 6. Le texte exact doit rester `Je veux acheter`. Le bouton doit être visuellement dominant, avec icône panier ou flèche, mais ne doit pas ressembler à un bouton de paiement. Retirer l’annotation 6.

**Règle.** Ce clic active la transaction et génère le QR transactionnel ; le paiement reste une étape ultérieure.

## 16 — QR transactionnel et chat

**Rôle.** Transaction active, partageable au Seller et utilisable par scan Seller.

**Conserver.** `Transaction Omni`, QR, `QR de transaction`, `OMNI-4827`, expiration `28 min`, facility, total, chat, itinéraire, contacts et l’avertissement distinguant le QR transactionnel du QR public.

**Modifier.** Raffiner uniquement la ligne marquée 7 autour de `Itinéraire`. Elle doit être une action transactionnelle claire avec icône navigation, libellé noir, chevron à droite et alignement identique à `Contacts du vendeur`. Retirer l’annotation 7.

**Règle.** Le QR contient le contexte de transaction et coupon. Il ne sert pas à découvrir la facility publiquement.

## 17 — Paiement et fulfilment

**Rôle.** Suite de la transaction après vérification du QR.

**Conserver.** `Transaction Omni · OMNI-4827`, facility, total, timeline `QR vérifié → Paiement à confirmer → Retrait / livraison`, méthodes `Mobile Money`, `Carte`, `Espèces déclarées`, CTA `Déclarer le paiement` et aide Seller.

**Modifier.** Raffiner uniquement le titre marqué 10. Le libellé `Méthode de paiement` doit avoir une hiérarchie forte, un espacement supérieur régulier et être clairement séparé de la timeline. Retirer l’annotation 10.

**Règle.** Le paiement est déclaré puis confirmé dans le chat par le Seller. Le fulfilment vient ensuite. La réception et l’avis obligatoire viennent avant la clôture commerciale.

## Checklist de sortie pour chaque image

Chaque image doit rester en portrait mobile et conserver le contenu métier de sa source. Elle doit avoir une seule action primaire identifiable, des actions secondaires cohérentes, des textes lisibles, aucune annotation, aucun repère de génération et aucune nouvelle règle métier. Les états doivent rester distingués : recherche, intention, disponibilité, décision, transaction, paiement et fulfilment.

## Ordre de validation

Valider d’abord les écrans 10 à 13 pour la découverte et la création d’intention. Valider ensuite 14 et 15 pour la transition intention → décision. Valider enfin 16 et 17 pour la transaction et le paiement. Après validation de cette série Buyer, produire les maquettes Seller/Admin et seulement ensuite fermer Species.
