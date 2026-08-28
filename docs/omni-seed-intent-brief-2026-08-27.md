# Omni V2 — Intent Brief Seed (brouillon à confirmer)

**Statut :** Founder-confirmed — Seed réouvert puis réconcilié le 28 août 2026 ; la Species doit être revalidée sur une maquette complète avant toute nouvelle implémentation de production.

**Owner :** Founder + Nature Way  
**Gate suivante :** maquette Species complète et acceptée  
**Autorité :** ce document reste l’Intent Brief Seed unique pour Omni V2.

## 1. Problème à résoudre

Dans un contexte local, un acheteur ne sait pas rapidement **qui possède actuellement un produit ou service, s’il est disponible et à quel prix**, sans se déplacer de commerce en commerce. Ou contacter ceux qu'il connait lui meme ou par le bouche a oreille de son reseau. Une seconde situation existe : l’acheteur est déjà physiquement dans une facilité, voit une offre Omni et veut bénéficier de la réduction puis payer via un parcours Omni vérifiable.

Le problème n’est donc pas seulement la découverte cartographique. Il s’agit de réduire l’incertitude avant le déplacement ou l'achat(cas de commande en ligne) et de rendre mesurable, fiable et avantageuse une transaction locale déjà engagée.

## 2. Acteurs et contexte

| Acteur | Besoin principal | Frontière de confiance |
| --- | --- | --- |
| Buyer | Chercher, vérifier la disponibilité , décider, obtenir une offre et terminer une transaction | Ne doit pas voir de données privées ni des outils d’équipe |
| Seller | Être découvrable, publier des offres, répondre, confirmer une transaction, construire sa crédibilité | Ne gère que ses propres facilités et ses transactions autorisées |
| Admin/Reviewer/Operator | Certifier manuellement, inspecter les preuves, gérer les rôles et les opérations de terrain | Accès strictement réservé, auditable et non auto-attribuable |
| Omni | Fournir confiance, attribution, mesure des intentions/transactions et distribution locale | Wallet distinct des paiements externes ; QR public distinct du QR transactionnel |

## 3. Besoin versus solution proposée

**Besoin :** réduire le coût d’incertitude et de déplacement pour l’acheteur, et donner au vendeur une visibilité et une preuve de crédibilité qui augmentent avec les interactions réelles.

**Solution proposée :** une carte publique et un catalogue local reliés à un flux de disponibilité, d’intention, de chat privé, de QR transactionnel et de confirmation Seller.

**Fonctionnalités proposées :** QR public de facilité pour découvrir une fiche, QR transactionnel lié à un Buyer et à une transaction, offres obligatoires sur les produits listés, certification manuelle, plans Free/Pro facility-scoped, Wallet Omni séparé de FedaPay, notifications, PWA et Push.

## 4. Parcours critique candidat

Le parcours principal du lancement est : **Buyer cherche un produit, depuis chez lui ou n’importe où → voit une offre → demande une disponibilité → crée une intention → peut ajouter d’autres produits de la même facilité/fournisseur → échange dans le chat privé → confirme « Je veux acheter » après vérification → le QR transactionnel est présenté ou vérifié → le Seller confirme → le Buyer donne un avis**.

Le parcours physique est le second parcours : **Buyer scanne le QR public d’une facilité → ouvre sa fiche → voit ses offres et choisit un ou plusieurs produits → confirme son intention et obtient le QR transactionnel → le Seller vérifie à la caisse → le Buyer confirme l’achat et donne un avis**. Le QR public sert uniquement à la découverte ; le QR transactionnel relie la transaction, le Buyer, les produits, le prix, la réduction et le statut de confirmation.

## 5. Résultat humain attendu

L’acheteur doit pouvoir décider plus vite et éviter un déplacement inutile, ou utiliser Omni sur place pour bénéficier d’une offre vérifiable. Le vendeur doit gagner de la découvrabilité, de la crédibilité et une mesure de transactions sans devoir accepter des paiements Seller dans Omni à ce stade. L’équipe Omni doit pouvoir certifier manuellement et observer les opérations sans exposer ses outils aux utilisateurs ordinaires.

## 6. Contraintes et non-objectifs

Les paiements Seller ne sont pas traités pour cette version. Les paiements externes Buyer via FedaPay Mobile Money/Card restent distincts du Wallet Omni. Les QR publics de découverte ne valident jamais une transaction. Le Pro est attaché à une facilité et non globalement au compte. La devise affichée suit la localisation de l’utilisateur. La certification reste manuelle. OSM est une source de fond cartographique et non une preuve qu’un commerce est partenaire Omni.

## 7. Décisions Seed confirmées

1. **Priorité :** le parcours de recherche et de disponibilité à distance est l’expérience principale. Le parcours de scan en facilité est le second parcours, conçu pour l’achat sur place.

2. **Transaction :** l’intent et le QR transactionnel sont préparés dès l’intent, mais la transaction d’achat devient active lorsque le Buyer, après vérification, confirme explicitement « Je veux acheter ». Le panier transactionnel peut contenir plusieurs produits du même fournisseur/facilité, même si la recherche initiale portait sur un seul produit.

3. **Carte :** le globe peut rester peuplé de facilités non revendiquées/non certifiées afin de donner une présence géographique et de soutenir la découverte. L’interface doit distinguer clairement les facilités OSM/non revendiquées des facilités Omni revendiquées, en revue ou certifiées. La carte locale doit néanmoins être exploitable pour rechercher et placer une facilité.

4. **Périmètre confirmé :** lancement initial Lomé/Togo, devise localisée, certification manuelle, offres obligatoires, Pro par facilité, Wallet séparé de FedaPay, QR public séparé du QR transactionnel, paiements Seller hors périmètre.

5. **Décision de méthode :** avant tout code supplémentaire, produire et faire valider la Species blueprint des écrans et états critiques.

## 8. Critères de succès Seed

Le Seed est fermé sur les décisions critiques ci-dessus. Le prochain livrable est une Species blueprint complète, pas du code supplémentaire. Elle devra montrer séparément la recherche à distance, le scan public en facilité, le panier multi-produits, la confirmation « Je veux acheter », le QR transactionnel, le Seller à la caisse, l’Admin et les états de carte/recherche/permissions.

## 9. Reprise Founder HQ du 28 août 2026

La reprise ne supprime ni les données valides, ni les identités, ni les migrations déjà appliquées. Elle réouvre les décisions visuelles et d’expérience qui n’avaient pas été explicitement acceptées. Omni est d’abord un moteur de recherche local de l’offre et de la demande : le globe/carte Buyer est la landing, la recherche est le premier geste, puis les rôles Seller et Admin apparaissent comme des contextes secondaires soumis aux permissions serveur.

Le parcours critique unique à privilégier pour la prochaine Species est : **ouvrir le globe/carte → lancer une recherche sans authentification → demander l’authentification seulement lorsque le contexte l’exige → conserver la requête → onboarding minimal → reprendre automatiquement la recherche → comparer les offres et leur fraîcheur → demander une disponibilité manuelle gratuite ou un Bulk Facility Pro → créer une intention**. Les flows transactionnels, Seller et Admin restent dans la Species complète, mais ne doivent pas dégrader cette première expérience.

Les éléments suivants sont retenus comme exigences héritées à réconcilier, non comme permission de coder immédiatement : disponibilité hybride, Bulk Facility, QR public distinct du QR transactionnel, compagnie/facilité, création ou claim, certification manuelle, progression de trois ventes propres à la facilité, bonus Seller de 20 $, Pro facility-scoped, stock Omni alloué et gestion Admin auditable.

**Preuve requise pour fermer Seed :** le fondateur confirme que le problème, la hiérarchie map-first, le parcours critique et les limites ci-dessus sont exacts. La prochaine sortie doit être la maquette Species complète ; aucun Root ou Trunk additionnel ne doit commencer avant cette validation.

## 10. Échec à ne pas expédier

Omni ne doit pas expédier une interface séduisante mais incohérente, une carte blanche ou trompeuse, un menu d’équipe visible à tous, un QR public traité comme une preuve de paiement, un rôle Admin implicitement déduit de Neon Auth, un paiement FedaPay créditant le Wallet, ou une transaction marquée terminée sans confirmation Seller autorisée.

