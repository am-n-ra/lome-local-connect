# Omni V2 — Species Blueprint

**Statut :** Proposition à valider — aucun nouveau code avant acceptation visuelle du fondateur.

## 1. Direction héritée du logo

Le logo fourni devient la référence visuelle : **repère de localisation blanc, œil central, halo orange/corail, matière douce et lumineuse**. Omni doit exprimer « voir avant de bouger » : la confiance vient de la visibilité, de la clarté du statut et de la preuve, non d’un décor cartographique spectaculaire.

La direction recommandée est une interface claire, chaude et tactile : fond ivoire, surfaces blanches légèrement translucides, corail comme action et énergie, vert forêt pour les états de confiance, texte presque noir, et carte monochrome afin que les offres et statuts ressortent. Le globe est une introduction de découverte ; la carte locale est l’outil de décision.

## 2. Design system verrouillé proposé

| Élément | Règle |
| --- | --- |
| Fond | Ivoire très clair, jamais blanc vide sans état explicite |
| Action principale | Corail/orange du logo, contrasté et réservé à l’action décisive |
| Confiance/validé | Vert forêt et menthe pâle |
| Attention | Ambre doux |
| Erreur/refus | Rouge terre lisible, avec explication et récupération |
| Carte | Monochrome clair : terres ivoire/blanc, eau gris ardoise ou corcoal noir ; les pins portent la couleur métier |
| Typographie | Sans-serif nette, titres courts et denses, texte d’aide plus doux |
| Formes | Rayons 14–20 px pour cartes et feuilles ; pilules pour statuts et actions secondaires |
| Ombres | Douces, courtes, jamais utilisées pour simuler une hiérarchie absente |
| Mouvement | Globe lent uniquement en état de repos vectoriel ; aucune rotation pendant interaction, permission, erreur ou fallback |
| Mobile | Stage plein écran, safe-area respectée, dock ancré au bas, feuille qui monte sans déplacer la scène au clavier |
| Accessibilité | Noms accessibles, focus visible, contraste, reduced motion, états annoncés |

## 3. Architecture d’expérience

Omni comporte trois surfaces d’acteur, mais un seul langage visuel : **Buyer**, **Seller** et **Admin**. Le menu ne montre que les actions autorisées par le contexte de compte ; un chargement de session ou une erreur doit être visible comme état, jamais comme absence silencieuse.

Le premier écran est l’espace Buyer. Il montre la carte/globe, la recherche et une invitation claire à rechercher un produit. Le globe peut afficher des facilités non revendiquées, mais chaque fiche porte un statut distinct : « Lieu public », « Non revendiqué », « En revue », « Certifié Omni ». Une facilité certifiée ne doit jamais être visuellement confondue avec une donnée OSM importée.

## 4. Cycle de vie compagnie et facilité

Omni doit distinguer clairement le **compte utilisateur**, la **compagnie** et chaque **facilité** gérée par cette compagnie. Un compte peut gérer plusieurs compagnies ; une compagnie peut avoir plusieurs facilités ; les plans Pro Seller, les produits, le stock Omni, les ventes et les statuts de confiance sont attachés à la facilité concernée, jamais globalement au compte.

| Entrée | Parcours | Statut visible |
| --- | --- | --- |
| Facilité déjà présente mais non revendiquée | L’utilisateur ouvre la fiche, choisit « Revendiquer cette facilité », fournit les preuves privées et attend la revue Omni | Non revendiquée → Claim en revue → Certifiée ou Rejetée / preuves demandées |
| Nouvelle présence terrain | L’utilisateur choisit « Créer une facilité », place le pin sur la carte, renseigne l’adresse, la compagnie et les informations publiques, puis soumet les preuves | Brouillon → Soumise → En revue → Certifiée ou Rejetée / preuves demandées |
| Facilité certifiée sans historique suffisant | La facilité peut être publiée selon ses limites, mais son niveau de confiance commercial reste non confirmé | Certifiée, **non confirmée** |
| Facilité ayant réalisé trois ventes vérifiées | Les trois ventes doivent être distinctes, liées à cette facilité et clôturées avec les preuves requises | **Confirmée pour cette facilité** |

La certification est une décision manuelle de l’équipe Omni : elle ne doit jamais être déduite d’un claim, d’un rôle Admin, d’un plan Pro ou d’une vente. Le statut **certified** signifie que l’identité/localisation/activité de la facilité a été examinée. Le statut **confirmed** signifie qu’elle a ensuite produit trois transactions vérifiées et clôturées ; il s’agit d’un niveau de confiance propre à cette facilité, pas au compte ni à toute la compagnie.

Le Seller doit voir une progression persistante : `Non revendiquée`, `Claim en revue`, `Certifiée — 0/3 ventes`, `Certifiée — 1/3`, `Certifiée — 2/3`, puis `Confirmée — 3/3`. Une vente annulée, refusée, non vérifiée ou rattachée à une autre facilité ne compte pas. Les trois ventes ne doivent pas être simulées par le simple ajout d’un produit ou par un fixture de démonstration.

À l’atteinte de `Confirmée — 3/3`, Omni crédite au Seller un **bonus de 20 $** dans son espace Wallet/Rewards. Le bonus est rattaché à la facilité qui a généré les trois ventes, son origine et sa date d’attribution sont visibles, et il sert à permettre au Seller d’essayer **Omni Pro** pour cette facilité ainsi que d’autres services Omni éligibles. Il ne doit pas être confondu avec le solde de ventes, un paiement dû au Seller ou un revenu transférable ; les règles exactes de durée, d’utilisation, de devise locale et de conversion seront verrouillées au Root. Le compteur doit montrer le bénéfice à venir (`Encore 1 vente vérifiée pour débloquer 20 $`) puis le bénéfice débloqué (`20 $ disponibles`).

## 5. Maquette fonctionnelle à produire (Je rajoute que pour moi Omni est un moteur de recherche et doit etre construit comme tel le moteur de recherche de l'offre et potentiellement de la demande avec toute la data qu'on va gather et les feature de ad qu'on proposera a nos vendeurs)

### A. Buyer — recherche à distance, parcours principal

1. **Accueil repos :** carte/globe visible immédiatement, statut de carte, recherche en dock bas, accès compte ; les pins utilisateur n’apparaissent qu’après position obtenue.

1. **Recherche active :** clavier ouvre un dock stable ; la scène ne remonte pas brutalement ; résultats groupés par facilité et produit, avec prix, offre, distance, disponibilité et statut de confiance.

1. **Fiche facilité :** photo/nom/statut, adresse et itinéraire, offres disponibles, produits groupables du même fournisseur, QR public de découverte, avis et historique de confiance.

1. **Demande de disponibilité :** produit initial prérempli, quantité, budget, contraintes de recherche, note facultative, ajout d’autres produits de la même facilité ; la demande manuelle ciblée est gratuite. L’interface distingue une réponse instantanée issue d’un stock Omni frais d’une vérification en cours. États : envoyé, réponse automatique fraîche, vérification Seller requise, disponible, partielle, indisponible, donnée périmée, expiration et retry.

1. **Intent :** récapitulatif multi-produits, prix avant/après offre, devise locale, validité, seller ciblé ; QR transactionnel préparé mais explicitement étiqueté « à vérifier par le vendeur ».

1. **Confirmation d’achat(c'est quand luser dit je veux acheter que le qr transactionnel est genere ensuite c'est le chat transactionnel le liue ou le qr peuvent etre emvoyes en dehors d'omni mais renvoyes a ce chat transactyionnel donc premiere des choses le vendeur clic dessus et omni verifie ou il sacan et c'est fait et ca ouvre le chat transactionnel et le reste s'en suit l'user choisi le mode de paiement .... le paiement detail apparait il selectionne loption pour dire le paiement est effectue ... le vendeur confirme et dis aussi produit livre user confirm.. bref tout ca permet a omni d'avoir la data sur qui prend quoi ou a quel prix quand..?) :** après vérification, bouton principal « Je veux acheter » ; cette action active la transaction. Le QR ne devient pas un QR public : il reste lié au Buyer, à la transaction, aux produits, aux prix, à la réduction et à l’expiration.

1. **Transaction :** chat privé, itinéraire, contacts du Seller, statut de transaction, QR transactionnel, paiement externe séparé si choisi, revalidation bloquante de la quantité Omni, confirmation Seller et avis obligatoire à la clôture.

### B. Buyer — parcours physique par QR public

1. Le Buyer scanne le **QR public de la facilité**, jamais un QR transactionnel.

1. Omni ouvre la fiche de la facilité, indique son statut et affiche ses offres.

1. Le Buyer choisit ou cherche un ou plusieurs produits, voit les réductions et confirme son intent.

1. Omni prépare le QR transactionnel et la conversation transactionnelle.

1. À la caisse, le Seller scanne ou ouvre la transaction, vérifie les produits et le prix, puis le Buyer confirme « Je veux acheter ».

1. Le Seller confirme la remise/fulfilment ; le Buyer reçoit le reçu de statut et laisse un avis.Il ne faut pas aussi oublier le bulk availability qui enleve le poid de verifier manuellement chez toutes les facilites d'un resultat de recherche et qui est facture aux buyers donc le pro a un credit like amount de bulk availability ask qui depend de la taoille.. et ils peuvent payer plus de ces credits a volonte tout du long du mois ou ils sont sous pro.. 5$ pour buyer pro et 10$ pour facility seller proJe dirai que ce second parcours permet aux acheteur de profiter de l'ecosysteme omni sans la boucle recherche et recherche de disponibilite a terme cette partie sera une sorte de alipay like ou on peut juste payer via omni en temps reel et si tout se passe bien et qu'omni est bien adopte tout le monde utilisera plus son wallet omni et plus besoin de carry du cash... ca donnera donc une certaine liberte aux acheteurs et aux vendeurs

### C. Seller

1. **Accueil Seller :** tableau clair des demandes, transactions à vérifier, catalogue, facilités et Wallet/Pro.

1. **Compagnies et facilités :** espace « Mes compagnies » puis « Mes facilités », avec changement de contexte explicite. Le Seller peut créer une nouvelle compagnie ou rattacher une facilité à une compagnie existante, sans mélanger les catalogues, stocks, plans Pro ou compteurs de ventes.

1. **Créer une facilité :** carte de placement visible dans le formulaire, position actuelle proposée seulement après action/permission, pin déplaçable, adresse et coordonnées lisibles, validation avant publication. Le parcours affiche clairement le statut `Brouillon → En revue → Certifiée → Confirmée 0/3`.

1. **Revendiquer une facilité non revendiquée :** action séparée de la création ; preuves privées, état en revue, décision manuelle Omni, résultat certifié/rejeté/plus de preuves, notification Inbox et affichage du compteur `0/3 ventes` après certification.

1. **Certification, confiance et récompense :** le statut `certified` est accordé par l’équipe Omni après revue des preuves ; le statut `confirmed` arrive uniquement après trois ventes vérifiées sur cette facilité. Les deux badges, leur définition et le compteur de ventes doivent être visibles séparément sur la fiche publique et le tableau Seller. Au passage à `3/3`, une carte de succès explique le déblocage du **bonus de 20 $**, ouvre le Wallet/Rewards et propose « Essayer Omni Pro pour cette facilité » ; l’activation Pro reste une action explicite du Seller.

1. **Catalogue :** onglets produits/offres, création et édition, réduction obligatoire, limites Free, Pro attaché à la facilité, états draft/published/paused/error. Le Seller Pro dispose d’un réglage explicite **« Répondre automatiquement depuis le stock Omni »**, avec quantité allouée, quantité disponible, dernière mise à jour, fraîcheur et bouton désactiver. Le Wallet/Rewards affiche séparément le bonus de 20 $ débloqué par les trois ventes et les éventuels crédits d’usage Pro ; le Seller peut choisir d’utiliser le bonus ou de rester en Free.

1. **Transaction :** notification d’intent, ouverture directe du chat, scan caméra demandé au moment où Seller choisit « Scanner un QR », vérification de la quantité Omni au moment critique, confirmation et reprise après interruption.

1. **Profil public :** statut de certification, offres, avis, transactions terminées et QR public de facilité à afficher/télécharger.

### D. Admin / Reviewer / Operator

1. **Admin Root :** menu visible uniquement après contexte Admin actif ; gestion des rôles dans une surface clairement distincte.

1. **Reviewer :** queue, preuves privées, décision certifié/rejeté/plus de preuves, motif obligatoire, notification claimant.

1. **Operator :** outils de terrain séparés de la revue, avec journal d’action.

1. Toute mutation affiche loading, succès, erreur, retry et correlation/audit côté serveur ; impossible de s’auto-attribuer Admin depuis l’interface.

## 5. États de disponibilité et confiance

La réponse automatique Pro ne doit pas afficher seulement « disponible ». Elle affiche la quantité Omni, le prix, la réduction, l’âge de la dernière observation et un niveau de confiance. Une donnée fraîche peut répondre immédiatement ; une donnée ancienne affiche « vérification requise » et déclenche le Seller ou l’agent futur ; une quantité insuffisante est exclue des résultats compatibles avec la recherche. La transaction revalide toujours la quantité, même après une réponse automatique.

Le Buyer ne paie pas un nouveau crédit pour cette revalidation technique. Une demande manuelle reste gratuite ; seul le Bulk Facility multi-facilités consomme les facility-asks. Le Seller Pro gagne la vitesse d’une réponse automatique, mais conserve la responsabilité de maintenir son stock alloué à Omni jusqu’à l’automatisation future.

## 6. Permissions et états obligatoires

La caméra ne doit jamais être demandée au chargement global. Elle est demandée quand le Seller choisit explicitement « Scanner un QR », avec un écran de permission, refus, retry et saisie alternative. La localisation est demandée lorsqu’elle apporte une valeur visible : « Utiliser ma position pour centrer la carte » ou « Utiliser ma position comme point de départ de la facilité ». Un refus ne bloque ni la découverte ni le placement manuel.

Le bouton de recentrage doit être contextualisé : il ne doit apparaître que si une position connue existe, et son libellé doit expliquer l’action. Si aucune position n’est connue, l’action doit être « Utiliser ma position », pas « Recentrer ».

## 7. Validation Species

La Species sera acceptée quand le fondateur aura validé : la palette et la carte monochrome, la hiérarchie de l’accueil Buyer, la séparation des deux QR, les états de confirmation « Je veux acheter », le panier, le Bulk Facility et ses crédits, les quatre surfaces Seller, le cycle compagnie/facilité, la séparation claim/création, les badges `certified` et `confirmed`, le compteur `0/3 → 3/3` des ventes vérifiées, le déblocage et l’affichage du bonus Seller de 20 $, le menu Admin conditionnel, le placement de facilité, et le comportement clavier/permission. Les écrans devront être montrés sous forme de maquettes ou de spécifications visuelles suffisamment précises pour qu’un développeur ne puisse pas improviser la hiérarchie.

## 8. Décisions encore ouvertes avant Root

| Décision | Proposition recommandée |
| --- | --- |
| Globe au repos | Oui, mais seulement comme état de découverte ; la carte locale prend le relais dès recherche/placement |
| Style carte | Monochrome, pins et statuts colorés |
| Transaction | Intent préparé dès l’intent ; transaction activée par « Je veux acheter » après vérification |
| Multi-produits | Autorisé dans la même facilité/fournisseur ; pas de panier multi-facilités dans le premier trunk |
| Caméra | Permission contextuelle au scan Seller |
| Localisation | Permission contextuelle ; placement manuel toujours disponible |
| Admin | Menu entièrement piloté par capacités serveur |
| Offre | Réduction obligatoire pour publier un produit |
| Auto-réponse Seller Pro | Activation explicite ; stock Omni frais pour réponse immédiate, vérification requise si périmé |
| Stock Omni | Quantité allouée et disponible visibles ; stock global du vendeur jamais affirmé |
| Revalidation | Toujours bloquante avant transaction ; aucune promesse ferme depuis une donnée périmée |
| Bonus Seller | 20 $ crédités après 3 ventes vérifiées et clôturées sur la même facilité ; usage Pro/services éligibles, règles de wallet à définir au Root |
| Portée du bonus | Attachée à la facilité confirmée, pas au compte ni à toutes les compagnies du Seller |
| Activation Pro | Le bonus peut financer un essai Pro, mais l’activation reste volontaire et explicite |

