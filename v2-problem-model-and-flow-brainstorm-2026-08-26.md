# Omni V2 — Deux problèmes, deux parcours et un même réseau de confiance

**Date :** 2026-08-26  
**Statut :** Brainstorm Seed/Species à valider avant Root  
**Auteur :** Manus AI

## 1. Décision de cadrage

Omni ne résout pas un seul problème générique appelé « acheter un produit ». Il résout deux situations différentes qui utilisent le même réseau de facilités, de produits et de vendeurs, mais qui ne doivent pas partager les mêmes états métier.

> **Problème A — Découvrir avant de se déplacer :** « Je cherche un produit maintenant. Qui l’a réellement, dans quelle quantité, à quel prix ou dans quelle fourchette, et est-ce que cela vaut le déplacement ? »
>
> **Problème B — Activer un avantage Omni sur place :** « Je suis déjà dans une facilité. Je veux ouvrir son offre Omni, sélectionner ce que j’achète et obtenir le prix ou l’avantage Omni sans refaire une vérification de disponibilité. »

La recommandation est de conserver **deux parcours nommés**, reliés par une transaction commune seulement lorsqu’un achat est réellement engagé :

| Situation | Nom de produit recommandé | Ce que le système doit faire | Ce qu’il ne doit pas faire |
|---|---|---|---|
| À domicile ou à distance | **Trouver avant de se déplacer** / Bulk Availability | Rechercher, filtrer, interroger plusieurs facilités, comparer et décider si le déplacement vaut la peine | Ne pas réserver le stock, ne pas exposer le budget privé au Seller, ne pas prétendre qu’un paiement a eu lieu |
| Déjà dans la facilité | **Activer l’avantage Omni** / On-site Offer | Ouvrir la facilité par QR, afficher le catalogue et les offres actives, sélectionner un produit, figer un prix/une réduction et obtenir un QR de handoff | Ne pas lancer une disponibilité inutile, ne pas utiliser le QR de facilité comme preuve de transaction, ne pas appeler cela « paiement Omni » tant qu’Omni ne règle pas le Seller |

Le mot **« payer avec Omni »** doit être réservé à une future vraie piste de règlement où Omni encaisse ou autorise les fonds et où un modèle de reversement marchand existe. Pour la V1, le libellé honnête est **« Activer l’offre Omni »**, **« Profiter du prix Omni »** ou **« Valider l’avantage chez le vendeur »**. Le Buyer paie encore le Seller en dehors d’Omni ; Omni enregistre seulement la déclaration et le handoff.

## 2. Parcours A — Trouver avant de se déplacer

### A.1 Découverte gratuite

Le Buyer ouvre Omni depuis chez lui ou depuis un autre endroit. Il recherche un produit, par exemple « banane ». La recherche, les filtres et la demande simple auprès d’une seule facilité restent gratuits. Le résultat n’est pas une promesse de stock : il s’agit d’un contexte public de découverte composé de facilités et d’offres indexées, avec fraîcheur et statut clairement visibles.

Le Buyer peut préciser quantité, zone et contraintes de prix. Le budget peut servir à filtrer les résultats ou à guider sa propre comparaison. Par défaut, le montant maximal privé n’est pas envoyé au Seller. Une facilité n’entre dans la sélection que si elle est éligible selon le catalogue, la zone, le produit et les règles de visibilité.

### A.2 Bulk Availability

Si dix facilités ou sept cents facilités sont éligibles, le Buyer ne répète pas dix fois la même demande. Il sélectionne les facilités — individuellement, par proximité, par résultat ou par « toutes les facilités éligibles » — puis ouvre le compositeur Bulk.

Le compositeur demande la quantité et les contraintes utiles une seule fois. Le serveur calcule un coût en **availability credits** à partir du nombre de cibles et d’un poids de traitement versionné. Avant confirmation, l’interface montre le nombre de facilités ciblées, le coût estimé, le crédit disponible, la source de l’allocation Free/Pro/Wallet et le résultat attendu.

```text
recherche gratuite
→ résultats éligibles
→ sélection de plusieurs facilités
→ quantité et contraintes
→ aperçu du coût en crédits
→ confirmation idempotente
→ réponses par facilité
→ comparaison
```

Le système ne doit pas débiter un nombre envoyé par le client. Une opération Bulk est créée avec un coût calculé côté serveur, un identifiant d’estimateur et un état par facilité. Les réponses possibles sont `available`, `partial` et `unavailable`, accompagnées seulement des champs autorisés par le contrat Seller.

### A.3 Comparaison et décision

Le Buyer reçoit une grille de comparaison avec disponibilité, quantité proposée, fraîcheur, prix ou offre, distance et message Seller lorsque ces champs sont autorisés. Une réponse lente ou en échec ne doit pas faire disparaître les réponses déjà reçues. Le Buyer peut choisir une réponse éligible et créer un **intent**.

L’intent crée une transaction immutable snapshot : facilité, produit, quantité, prix brut, réduction autorisée, prix net, fraîcheur, contexte d’offre et état de fulfilment. La disponibilité ne réserve pas le stock ; le Seller doit encore confirmer les états prévus par le contrat de transaction.

### A.4 Après l’intent

Dès que le serveur confirme l’intent, le Buyer et le Seller autorisés deviennent membres de la transaction. Le Buyer peut alors voir le chat transactionnel, l’itinéraire autorisé, le contact Seller permis par la politique et un QR Buyer transaction-bound. Le Seller reçoit un événement Inbox et, si la configuration Push est réellement active et prouvée, une notification Push.

Le Buyer peut se rendre physiquement sur place. Le Seller ouvre la section Scanner et scanne le QR Buyer. Le serveur vérifie la signature ou le hash, l’expiration, la transaction, la membership du Seller et l’absence de replay. Un lien externe de secours peut être partagé au Seller : il doit être un deep link sécurisé vers la transaction, non un token QR brut. Après connexion, il ouvre directement le côté Seller du transaction room.

```text
intent éligible
→ transaction snapshot
→ chat + itinéraire + contact autorisé
→ QR Buyer
→ scan Seller au handoff
→ vérification serveur
→ paiement Seller externe déclaré
→ acknowledgement Seller
→ fulfilment
→ receipt/rating selon l’état
```

### A.5 Si le Seller ne répond pas

L’absence de réponse ne doit pas transformer automatiquement la demande en « disponible ». Le Buyer peut relancer dans Omni, consulter l’état de fraîcheur, choisir une autre réponse ou partager une invitation sécurisée. Le lien externe ouvre une page minimale qui explique la transaction, demande l’authentification du destinataire et ne révèle aucun contact ou montant non autorisé avant que le serveur ait confirmé sa membership.

## 3. Parcours B — Activer l’avantage Omni sur place

### B.1 QR de facilité : un objet différent

Le Seller dispose d’un **QR public de facilité** affiché au restaurant, au comptoir ou sur un support imprimé. Ce QR ne représente pas une transaction, ne contient pas de secret exploitable et peut rester stable tant que la facilité existe. Il contient seulement une référence publique/deep link vers la facilité et, si nécessaire, une version de campagne.

Il ne faut pas réutiliser le QR Buyer transaction-bound pour ce rôle. Omni doit distinguer au minimum :

| QR | Émis par | Scanné par | Fonction |
|---|---|---|---|
| QR public de facilité | Seller/Omni | Buyer | Ouvrir la facilité et son catalogue public |
| QR Buyer transactionnel | Omni après intent et liaison du coupon/offre au compte Buyer | Seller | Retrouver et vérifier une transaction précise, son coupon et son snapshot |
| Lien externe sécurisé | Omni | Buyer/Seller | Reprendre une transaction après authentification |

### B.2 Ouverture et catalogue

Le Buyer scanne le QR public de la facilité. Omni ouvre un deep link tel que `facility/:facilityId?source=onsite`, restaure éventuellement la position sur la carte et affiche la fiche de la facilité, son statut, ses horaires, son catalogue et les offres actives. Le contexte « sur place » est visible mais ne doit pas être traité comme une preuve GPS ou comme une réservation.

Le Buyer choisit le produit et la quantité. Omni ne lance pas de Bulk Availability, car le Buyer est déjà devant la facilité et demande l’application d’une offre disponible à cet endroit. Si le produit n’est pas listé ou si l’offre est expirée, Omni doit afficher honnêtement l’indisponibilité et proposer soit un autre produit, soit le Parcours A de recherche/disponibilité ; il ne doit pas fabriquer une réduction.

### B.3 Création de l’offre sur place

Une fois le produit sélectionné, le serveur vérifie l’offre active, les règles de réduction, les dates, les limites par utilisateur et la capacité déclarée par le Seller. Il crée un **on-site offer intent** ou une transaction de type `onsite_offer`, distincte d’une `availability_request`.

Le snapshot doit contenir au minimum : compte Buyer, facilité, Seller, produit, quantité, prix catalogue, règle de réduction, coupon attribué/consommé ou réservé, montant de réduction, prix net, devise, sponsor de l’offre, lieu/contexte, période d’expiration, horodatage et version de la règle. Le prix, la réduction et l’identité du coupon ne sont plus recalculés depuis des données client lors du handoff. Le QR transactionnel ne transporte qu’une référence vérifiable côté serveur ; il ne devient jamais le coupon lui-même.

```text
scan QR public de facilité
→ fiche/catalogue de la facilité
→ sélection produit + quantité
→ validation de l’offre active
→ snapshot prix/réduction
→ QR Buyer de transaction
→ scan Seller
→ validation de l’avantage
→ paiement Seller externe
→ acknowledgement/fulfilment
```

### B.4 Handoff au comptoir

Le Buyer présente le QR généré. Le Seller ouvre Scanner et le vérifie. Le serveur résout la référence vers le compte Buyer autorisé, le coupon/offre lié et le snapshot transactionnel. Le résultat doit indiquer clairement : transaction trouvée, produit, quantité, prix brut, réduction, prix net, devise, expiration et action suivante, sans révéler de secret réutilisable. La vérification ne doit pas transférer d’argent. Le Seller confirme ensuite que la vente physique a été réalisée et que le prix Omni a été appliqué, puis le Buyer paie le montant net par le moyen accepté par le Seller.

Si le Seller refuse, si le produit n’est plus disponible ou si le QR est expiré, la transaction passe dans un état récupérable et l’avantage n’est pas marqué comme consommé. Une réussite de scanner seule ne doit pas être comptée comme une vente accomplie.

### B.5 Pourquoi ce parcours est important

Le parcours sur place crée une boucle d’usage différente : découverte de la facilité par QR, consultation réelle du catalogue, activation d’une offre, vérification au comptoir et mesure de conversion. Il permet à Omni de savoir quelles offres sont effectivement vues et utilisées, sans prétendre gérer le paiement marchand. Il peut aussi transformer un utilisateur de passage en utilisateur récurrent du Parcours A.

## 4. Points de jonction entre les deux parcours

Les deux parcours peuvent aboutir à une transaction room commune, mais leur origine doit rester persistée : `discovery_availability`, `onsite_facility_qr`, `seller_shared_link` ou autre source autorisée. Cette provenance est utile pour la reprise, les métriques et l’analyse des échecs.

| Élément partagé | Parcours A | Parcours B |
|---|---|---|
| Facility et produit | Découverts puis comparés | Ouverts directement par QR de facilité |
| Disponibilité | Interrogée avant déplacement | Non interrogée ; l’offre active est vérifiée sur place |
| Prix | Réponse Seller puis snapshot à l’intent | Offre active puis snapshot immédiat |
| QR final | Buyer QR après intent | Buyer QR après on-site offer intent |
| Vérification | Seller au handoff ou reprise transactionnelle | Seller au comptoir |
| Chat/itinéraire | Débloqués après intent | Chat minimal possible après création de l’offre ; itinéraire généralement inutile si le contexte sur place est explicite |
| Paiement V1 | Externe au Seller | Externe au Seller |
| Wallet Omni | Plans, crédits et fonctionnalités Omni uniquement | Plans, crédits et fonctionnalités Omni uniquement |

Le Buyer doit pouvoir passer proprement de B vers A. Par exemple, si un produit n’est pas dans le catalogue de la facilité, le bouton **« Chercher ce produit autour de moi »** ouvre la recherche globale sans perdre la facilité d’origine. Inversement, depuis A, le Buyer qui arrive sur la facilité peut ouvrir son QR public ou reprendre la transaction existante sans recréer un intent.

## 5. États et règles de sécurité à retenir

Le QR de facilité est public et découvrable ; le QR Buyer est privé, expirant, account-bound et transaction-scoped. Le coupon/avantage lié au compte et le snapshot de prix vivent côté serveur ; le QR n’en est qu’une référence vérifiable. Les deux QR ne doivent pas être confondus par leur apparence, leur route ou leurs permissions. Un QR public ne peut jamais ouvrir le chat, l’itinéraire, le contact privé ou la transaction d’un autre utilisateur.

Le Seller reçoit une notification d’intent, mais l’Inbox et le Push ne sont pas la seule preuve d’autorité. Le serveur dérive toujours la membership, la facilité, la transaction et l’état courant. Le deep link de secours doit résister au partage accidentel : pas de token brut dans l’URL, pas de contact privé avant connexion et pas de changement d’acteur au moyen d’un payload client.

L’activation d’une réduction n’est pas équivalente au paiement. Pour la V1, les événements doivent distinguer `offer_viewed`, `onsite_intent_created`, `seller_qr_verified`, `discount_acknowledged`, `external_payment_declared`, `fulfilment_completed` et `receipt_confirmed`. Cela évite de présenter un scan ou une déclaration comme un revenu, une vente ou un règlement Omni.

## 6. Recommandation de séquencement Nature Way

Le Seed doit maintenant porter les deux problèmes et interdire leur fusion conceptuelle. La Species doit produire quatre maquettes minimales : le Bulk composer, la fiche/catalogue ouverte par QR de facilité, le transaction room partagé et le Seller Scanner avec ses états de récupération. Le Root doit ensuite ajouter une distinction d’origine et de type d’intent, puis spécifier les permissions, snapshots, ledger d’offres, chat et QR.

Le premier Trunk fonctionnel ne doit pas tenter de construire toute la monétisation et tout le Seller workspace en parallèle. La plus petite tranche démontrable est :

1. QR public de facilité → fiche/catalogue public ;
2. sélection d’un produit actif et d’une quantité ;
3. validation serveur de l’offre et snapshot de réduction ;
4. création d’un on-site offer intent ;
5. Buyer QR transactionnel ;
6. Seller Scanner manuel d’abord, caméra ensuite ;
7. vérification serveur et état récupérable ;
8. déclaration explicite du paiement externe et fulfilment séparé.

Le Parcours A Bulk Availability vient en tranche sœur, avec son coût en crédits, son aperçu avant débit et sa comparaison multi-facilités. Il ne faut pas affirmer que ces deux parcours sont déjà opérationnels dans la branche V2 : les contrats et les preuves existants couvrent seulement une partie du mini-cycle Buyer/Seller/QR borné.

## 7. Boucle de distribution vendeur et flow de caisse

La proposition de valeur côté Seller ne consiste pas uniquement à répondre aux demandes envoyées par les Buyers. Chaque facilité qui veut être listée comme offre Omni doit accepter un **contrat de présence Omni** : maintenir un catalogue exploitable, publier au moins une offre ou réduction active sur les services/produits proposés via Omni, et exposer dans la facilité un QR ou un lien Omni fourni par la plateforme.

Cette obligation crée une boucle d’acquisition à deux entrées :

```text
facilité visible sur la carte
→ découverte organique du Seller
→ scan du QR public de la facilité
→ installation ou ouverture Omni
→ catalogue et offres Omni
→ intent sur place
→ QR Buyer à la caisse
→ validation Seller
→ chat transactionnel / confirmation
```

ou :

```text
client déjà dans la boutique
→ voit le QR/lien Omni affiché par le Seller
→ installe ou ouvre Omni
→ arrive directement sur la facilité
→ recherche/sélectionne un produit
→ voit le prix ou l’avantage Omni
→ crée un intent sur place
→ présente son QR Buyer au comptoir
```

Le QR public ou lien affiché par le Seller doit être imprimable, stable, compréhensible et mesurable par campagne/facilité. Il ne doit pas contenir de secret, de session ou de transaction. Il peut ouvrir l’installation PWA si le navigateur le permet, puis reprendre la même destination après authentification. Si l’utilisateur a déjà Omni, le lien ouvre directement la fiche de la facilité. Si l’utilisateur ne l’a pas, la page d’arrivée doit expliquer Omni, proposer l’installation ou continuer sur le web, puis préserver `facilityId`, la source et le produit éventuellement partagé.

### Flow recommandé au comptoir

Le Buyer peut dire « je paie avec Omni » dans le langage commercial, mais l’interface et les états serveur doivent préciser ce que cela signifie en V1 : **Omni valide le prix/avantage et la transaction ; le Seller encaisse par son moyen accepté ; Omni ne transfère pas l’argent au Seller**. Le produit peut afficher `Payer avec l’avantage Omni` ou `Valider mon achat Omni` si le copywriting explique cette frontière sans créer une fausse promesse de règlement.

Le flow est :

1. Le Buyer scanne le QR public de la facilité, ouvre la fiche et sélectionne un produit actif, ou recherche un produit dans le catalogue de cette facilité.
2. Le serveur vérifie que le produit, le prix, la devise, la quantité déclarée et l’offre Seller sont encore valides. Il fige le prix brut, la réduction, le prix net, l’expiration et l’identifiant de campagne dans un snapshot.
3. Omni crée un intent de type `onsite_offer`, affiche le résumé au Buyer et génère un QR Buyer transactionnel.
4. À la caisse, le Seller ouvre **Scanner Omni**, scanne le QR Buyer et obtient une carte de vérification avec facilité, produit, quantité, prix brut, réduction, prix net, expiration et prochaine action.
5. Le Seller accepte ou refuse l’avantage. L’acceptation rend l’offre utilisable, mais ne marque pas encore la vente comme payée. Une vérification abandonnée, refusée ou expirée doit rester récupérable.
6. Le Buyer paie le montant net au Seller par le moyen accepté sur place. L’application peut afficher `Paiement externe au Seller` ; elle ne demande jamais la carte du Buyer à Omni et ne retire jamais le montant du Wallet Omni dans ce parcours.
7. Le Seller clique **Paiement reçu / Finaliser la vente**. Le serveur enregistre une déclaration d’encaissement Seller, l’événement de fulfilment et la consommation de l’offre seulement selon la politique validée. Le Buyer reçoit le reçu d’usage Omni et peut ensuite noter l’expérience.

Le chat transactionnel s’ouvre dès la création de l’intent si la politique le confirme, mais il ne doit pas devenir une preuve de paiement. Il sert à clarifier le produit, la quantité, l’offre ou la remise. La caisse utilise le Scanner pour la vérification ; elle ne dépend pas de la présence d’un message dans le chat.

### Récupération et cas limites

Si le client scanne un QR de facilité mais ne se connecte pas, la destination publique reste accessible et la facilité est conservée dans le contexte de navigation. Si le catalogue est vide, si le produit n’est pas éligible ou si la remise a expiré, Omni explique la raison et ne génère pas de QR transactionnel. Si le Seller ne retrouve pas la notification, le Buyer peut partager un lien sécurisé ou montrer son QR ; ces deux chemins convergent vers la même transaction après authentification.

Si le scan Seller réussit mais que le Seller refuse l’offre, aucun paiement n’est déclaré. Si le Buyer paie mais que le Seller oublie de finaliser, la transaction reste dans un état `payment_declared_pending_ack` ou équivalent récupérable, jamais dans un état de succès inventé. Si le QR est rejoué, expiré ou destiné à une autre facilité, le serveur refuse l’opération et propose une reprise sûre.

### Ce que le Seller doit fournir à Omni

La liste d’une facilité doit être conditionnée à un parcours Seller explicite : claim ou création vérifiée, catalogue, prix, au moins une offre active, QR/lien public affichable, personne responsable de la caisse et accès à Scanner Omni. Le Seller doit pouvoir mettre l’offre en pause, modifier son prix ou sa quantité, et voir les transactions en attente. Une facilité sans offre active peut rester visible comme présence publique si la politique l’autorise, mais elle ne doit pas apparaître comme **partenaire d’offre Omni** et son QR ne doit pas promettre un avantage inexistant.

Cette règle apporte une proposition claire au vendeur : Omni lui apporte de la visibilité sur la carte et un canal d’acquisition dans sa boutique ; en échange, il rend une offre vérifiable et affiche la porte d’entrée Omni. La certification, le Pro et la visibilité ne remplacent pas cette obligation opérationnelle.

## 8. Proposition de valeur tripartite et recommandation

Le modèle est utile aux trois parties seulement si chacune obtient une valeur immédiate et vérifiable.

| Partie | Problème actuel | Valeur Omni | Preuve de valeur attendue |
|---|---|---|---|
| Buyer à distance | Se déplacer, appeler plusieurs vendeurs et découvrir trop tard que le produit manque ou que le prix ne convient pas | Découverte géographique, comparaison et disponibilité en une demande ; réduction des déplacements inutiles et des incertitudes | Réponses fraîches, comparaison compréhensible, intent repris jusqu’au handoff |
| Buyer déjà sur place | Ne pas savoir si une offre Omni existe ni comment l’utiliser au comptoir | Accès immédiat au catalogue, prix/avantage visible, procédure simple à présenter au Seller | QR facilité scanné, offre activée, vérification caisse, reçu d’usage |
| Seller | Être difficile à découvrir, attirer du trafic sans outil de conversion et devoir répondre manuellement à des demandes dispersées | Visibilité sur la carte, acquisition physique par QR, catalogue et offres contrôlables, demandes mieux structurées et mesure des conversions | QR affiché, scans, offres vues, transactions vérifiées, ventes finalisées |
| Omni | Construire une audience sans valeur durable pour les partenaires et sans signal d’usage réel | Réseau de facilités, distribution décentralisée, données d’intention et de conversion, revenus de services Omni plutôt que commission immédiate | Facilités actives, offres vérifiables, rétention Buyer/Seller, crédits/Pro consommés et événements auditables |

### Pourquoi le Seller accepte

Le Seller ne reçoit pas simplement un badge ou une fiche gratuite. Il reçoit une mini-infrastructure de distribution : une présence découvrable sur la carte, un QR qu’il peut exposer dans son commerce, une page catalogue, des offres contrôlées et un outil de validation à la caisse. En retour, il doit fournir une information exploitable : produits publiés, prix, offre/réduction active, disponibilité déclarée et personne capable d’utiliser Scanner Omni.

Cette relation doit rester volontaire et lisible. Une facilité importée d’OSM ou visible publiquement ne doit pas être présentée comme partenaire d’offre tant que son propriétaire n’a pas revendiqué la facilité, configuré son catalogue et accepté les conditions d’offre. La visibilité publique peut rester gratuite ; l’étiquette **Offre Omni active** est réservée aux facilités opérationnelles.

### Pourquoi le Buyer scanne

Le scan doit donner un bénéfice immédiat, pas seulement demander l’installation d’une application. Après scan, le Buyer doit voir la facilité correcte, ses offres réellement actives, le prix normal, l’avantage Omni, la période de validité et la prochaine étape à la caisse. Si le scan mène à une simple page d’inscription sans catalogue ni bénéfice visible, l’incitation est trop faible et le modèle échoue.

L’affiche recommandée est donc explicite : **« Scannez — voyez les offres Omni de cette facilité — présentez votre QR à la caisse — payez le prix indiqué au Seller »**. Le texte peut utiliser « Payer avec Omni » comme langage de campagne seulement si une ligne explique que, dans la V1, le paiement est encaissé par le Seller et qu’Omni valide l’avantage et la transaction.

### Modèle recommandé pour la V1

Je recommande un modèle **Omni Verified Offer Network** :

1. Omni référence les facilités publiques, mais distingue clairement `listed`, `claimed`, `offer_active` et `verified/confirmed`.
2. Le Seller qui veut le statut `offer_active` doit avoir un claim ou une création approuvée, un catalogue, une offre/réduction attachée à chaque produit/service publié sur Omni, un QR/lien affichable et un accès Scanner.
3. Le Buyer peut entrer par la carte ou par le QR physique. L’entrée QR ouvre directement la facilité et n’impose pas une recherche globale.
4. Le Buyer active l’offre et reçoit un QR transactionnel. Le Seller le vérifie à la caisse, accepte l’avantage, puis confirme séparément la réception du paiement externe et le fulfilment.
5. Omni monétise ses propres services — Pro, Facility Slots, Bulk Availability credits et autres capacités approuvées — sans commission ni règlement Seller en V1.

Cette approche est préférable à deux alternatives moins solides : un simple annuaire avec QR, qui ne crée aucune boucle transactionnelle vérifiable, ou un vrai paiement Omni dès maintenant, qui introduirait immédiatement settlement, conformité, remboursements, disputes et payout vendeur avant que le réseau de facilités ne soit éprouvé.

### Flow complet A — Buyer hors facilité

```text
recherche produit/service
→ résultats de facilités et offres
→ filtres quantité/zone/prix
→ disponibilité simple gratuite ou Bulk Availability créditée
→ réponses fraîches et comparaison
→ intent éligible
→ snapshot offre/prix/réduction
→ chat + contact + itinéraire + QR Buyer
→ scan Seller
→ paiement externe au Seller
→ Seller confirme paiement et fulfilment
→ reçu/rating et métriques de conversion
```

Ce parcours existe pour réduire l’incertitude avant le déplacement. Chaque étape répond à une question : **où ?**, **qui peut fournir ?**, **à quelle condition ?**, **est-ce encore valable ?**, **que dois-je faire maintenant ?** La disponibilité n’est jamais une réservation et le scan n’est jamais une preuve de paiement.

### Flow complet B — Buyer déjà dans la facilité

```text
affiche QR/lien Omni du Seller
→ scan par le Buyer
→ installation ou ouverture Omni
→ arrivée directe sur la facilité
→ catalogue et offres actives
→ recherche dans la facilité ou sélection du produit
→ prix brut + avantage + prix net
→ intent onsite_offer
→ QR Buyer transactionnel
→ scan Seller à la caisse
→ acceptation/refus de l’avantage
→ paiement du prix net au Seller
→ Seller clique Paiement reçu / Finaliser
→ fulfilment, reçu et mesure de l’usage
```

Ce parcours existe parce que le Buyer est déjà devant le produit. Lui demander une disponibilité auprès de plusieurs Sellers serait inutile et créerait de la friction. Le QR public sert de porte d’entrée et de publicité ; l’intent onsite sert à figer l’offre ; le QR Buyer sert à empêcher la fraude ou la confusion à la caisse ; la confirmation Seller sépare l’avantage validé de la vente réellement finalisée.

### Ce qu’Omni gagne sans exploiter abusivement les utilisateurs

Omni obtient une distribution physique financée par les partenaires, une acquisition mesurable et des signaux utiles : facilités découvertes, scans, installations, produits consultés, offres activées, vérifications, paiements déclarés et fulfilments confirmés. Ces signaux doivent être minimisés, pseudonymisés lorsque possible et utilisés pour améliorer la recherche, la fiabilité des offres et l’expérience, pas pour exposer des données privées au Seller ou inventer des revenus.

Le modèle économique initial peut donc rester aligné : l’utilisateur paie les capacités Omni — Pro, crédits Bulk, slots et autres services explicitement définis — tandis que le Seller investit dans une meilleure offre, une meilleure visibilité et une meilleure conversion sur place. La commission sur transaction et le paiement intégré pourront être étudiés plus tard à partir de données réelles, mais ils ne doivent pas être cachés dans le flow V1.

## 9. Décisions nécessaires avant Root final

| Décision | Recommandation |
|---|---|
| Nom du Parcours B | « Activer l’offre Omni » ou « Profiter du prix Omni », pas « Payer avec Omni » en V1 |
| QR de facilité | Statique/public, deep link vers la facilité, sans secret ni transaction |
| QR final | Toujours Buyer-owned et transaction-bound, vérifié côté Seller |
| Stock sur place | Offre active et quantité déclarée vérifiées ; pas de promesse de réservation avant fulfilment |
| Réduction | Seller-funded en V1, validée et figée dans le snapshot |
| Paiement | Paiement externe au Seller ; Omni ne fait ni settlement ni payout vendeur |
| Chat | Obligatoire pour le Parcours A après intent ; optionnel ou minimal pour B sauf besoin de coordination |
| Itinéraire | Obligatoire/utile pour A ; non nécessaire par défaut pour B |
| Transition B → A | Si produit absent/expiré, conserver la facilité et proposer une recherche globale |
| Mesure de succès | Séparer conversion découverte→intent et scan facilité→offre activée→fulfilment |

## Conclusion

La bonne architecture n’est pas un parcours Buyer unique avec quelques boutons supplémentaires. Omni doit devenir un **réseau à deux portes** : une porte de découverte qui réduit les déplacements inutiles et une porte de facilitation sur place qui rend un avantage Omni vérifiable au comptoir. Les deux portes partagent l’identité de la facilité, le catalogue, les règles d’offre, le transaction room et le Seller Scanner, mais elles ont des intentions, des états, des métriques et des risques différents.

Cette séparation permet de rester honnête dès le lancement : Omni peut aider à décider avant le déplacement et à activer une réduction sur place, tout en reportant le vrai paiement marchand à une phase ultérieure qui nécessitera un modèle de règlement, de conformité et de reversement explicitement accepté.
