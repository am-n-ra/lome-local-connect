# NW-13 — Re-spécification: l'entrée Seller et la direction de solution

Date 2026-09-10. Statut: **brouillon à valider fondateur**(. Auteur: Nature Way + fondateur. Contexte: HO-OMNI-11 + retours fondateur sur le switch seller.

##  ​1. Le problème que l'on résout

L'entrée seller est fragmentée en au moins quatre chemins qui se contredisent:



| Voie existante | Garde actuelle | Conséquence pour un compte sans facilité |
|---|---|---|---|
| Switch rôles | seller_ready = onboarding == seller_ready | Le switch cache Seller |
| Activation vendeur admin | Le candidat doit avoir une facilité unconfirmed/confirmed/certified | Le compte sans facilité n'apparaît pas |
| Seller workspace | Suppose un catalogue + selFacilityId | Pas d'état vide avec Créer / Revendiquer |
| Revendication | Vit côté buyer, sur facilité unclaimed | Pas d'entrée depuis l'espace seller |



La conséquence: un nouveau vendeur légitime ne peut **ni** voir l'espace seller **ni** créer sa facilité **ni** la revendiquer depuis le bon endroit. Chaque pièce suppose que le prérequis de l'autre est déjà satisfait.



Le vrai trou: il n'existe pas de **contrat d'entrée seller** qui définisse les états ( accès → sans facilité → avec facilité( et les transitions entre eux.



##  ​2. L'approche de solution proposée

Un **seul éventail d'entrée seller** à 3 portes, chacune avec sa suite visible dans l'espace seller:





| Porte | État | Ce que l'espace seller montre | Action |
|---|---|---|---|
| P1 | Le compte a le droit seller | Switch expose Seller | Sans facilité → P2; avec facilité → P3 |
| P2 | Sans facilité | État vide construit: Créer une facilité et Revendiquer une facilité | Créer = formulaire company/facility; Revendiquer = même ClaimSheet que côté buyer |
| P3 | Avec facilité | Espace opérationnel: catalogue, toggle ON/OFF, demandes, scanner | La routine vendeur du jour |



La règle clé: **la garde Facility before Offer** s'applique à la **publication/disponibilité** des offres( pas à l'**accès à l'espace** vendor. L'espace s'ouvre par le droit seller; la facilité se crée/revendique DEDANS; les offres ne deviennent visibles/achetables qu'après la chaîne unconfirmed → certifié( conform la maquette et le SDM.



##  ​3. Pourquoi cette approche est la meilleure

1. Elle corrige la contradiction à la racine: chaque entrée devient une étape du même éventail( au lieu de 4 îlots qui se bloquent mutuellement.
. 2. Elle préserve les contrats racine verrouillés: aucun affaiblissement de Facility before Offer; la certification reste le parent de la disponibilité( (D-01/D-03(..
 3. Elle réutilise les flows éprouvés au lieu de les dupliquer: la revendication( la certification( l'activation( — une seule source par comportement.
4. Elle donne à tout le monde la même carte mentale: accès → créer/revendiquer → opérer( — fondateur( admin( vendeur( buyer voient le même raisonnement.
5. Elle est réversible et peu coûteuse: du UI d'abord( pas de migration DB ni de changement de contrat serveur( (contrat seulement d'exposition/état(..

##  ​4. Les flows existants qui corroborent cette solution



| Flow | Où il vit en code | Comment il entre dans l'éventail |
|---|---|---|---|
| Switch rôles | TrunkAppV13 eligibleRoles | Porte P1: expose Seller si droit seller confirmé |
| Revendication | ClaimSheet + startClaim( côté buyer( | Porte P2: réutilisé depuis l'espace seller avec le draft lié au compte |
| Activation vendeur admin | Carte Activation vendeurs livrée NW-12.8 | Reste l'outil d'approbation post-certification( (D-07 rien pre-accepted( |
| Seller workspace | SellerV13 + seller-workspace | Porte P3: l'espace opérationnel( (+ état vide P2 à ajouter( |
| Certification/verification | ReviewQueue admin | Alimente la chaîne trust unconfirmed→confirmed→certified( qui débloque la disponibilité( |



##  ​5. Décisions verrouillées ( fondateur 2026-09-10(



| ID | Décision | Choix fondateur | Impact |
|---|---|---|---|
| D-A | Le droit seller( (ce qui expose Seller au switch( | **(d( Universel**: tout user peut acheter ET vendre s'il a une offre/service/entreprise/produit; le switch expose Seller à tous — pas de gate d'état ni de rôle; l'espace seller gère absence/présence de facilité et limites de plan( (docs master V1 + master plan( | P1 = néant gate; P2/P3 par facilité + plan |
| D-B | La création de facilité( (trust initial( | **recommend = (a(**: formulaire minimal company/facility, trust unconfirmed, puis parcours preuve( | P2 créer |
| D-C | La revendication depuis l'espace seller | **recommend = (a(**: même ClaimSheet, draft lié au compte courant( | P2 revendiquer |
| D-D | Quand l'espace opérationnel s'ouvre( (P3( | **recommend = (a(**: dès que le compte a facilité éligible; l'approbation admin reste requise pour la disponibilité des offres( (D-07 rien pre-accepted( | P2→P3 |



##  ​5bis. Chantier ouvert — Plans Free/Pro à revoir( fondateur 2026-09-10(



Le fondateur demande de revoir correctement ce que les plans **Free** et **Pro** offrent ou limitent, pour que les users tirent le meilleur parti de l'offre et que Omni profite monétairement. La couverture universelle vendeur( (D-A(, le vendeur **mobile** et le mode **discovery** sont cités comme des cas à couvrir. Une spec séparée `omni-nw-13b-plans-free-pro-…` sera produite depuis les docs master V1 + master plan( et l'implémentation actuelle( avant tout changement de code de plan.



##  ​6. Non-but de cette tranche

Ne pas toucher aux contrats de paiement/QR/transaction. Ne pas créer de données fixtures pour masquer le vide. Ne pas supprimer les routes existantes. Ceci est un travail d'exposition/état UI + éventuel ajustement mineur de garde d'accès après décisions D-A…D-D.



##  ​7. Définition de fait de la tranche

L'espace seller s'ouvre selon D-A; P2 affiche Créer/Revendiquer( et les deux actions aboutissent à des états réels audités; P3 reste opérationnel; les tests + build + prod===local prouvent la chaîne nouvelle. Entrée registre NW-13 ajoutée.



État: **décisions verrouillées 2026-09-10**; NW-13a en cours; NW-13b/13c planned.

##  ​8. Annexe — Découvertes code( 2026-09-10(

- **Plans actuels**: commercial_plan est une colonne par facilité( free ou pro_active(; limite actuelle observée: publication max 5 produits si non pro_active( (trunk-repository l.1722(; disponibilité peer-à-peer semble gated par pro_active( (l.1596/1746 à confirmer(.
- **Aucune route de création company/facility** en serveur actuel: le formulaire Créer sera une nouvelle root à bâtir en NW-13c( trust initial unconfirmed + parcours preuve(; la revendication( ClaimSheet existant(, reste la voie parallèle immédiate(.

- **Seller workspace serveur gated** par onboarding_state = seller_ready( c'est P3 l'opérationnel(; l'UI universelle P1 ouvre l'éventail sans changer ces gardes serveur; P2 revendication utilisable immédiatement; P3 s'ouvre quand facilité+activation( conform les contrats existants. 
- **Vendeur mobile + mode discovery**: pas de représentation actuelle(; couverture à définir dans NW-13b Plans Free/Pro( (type de facilité mobile/zone et capacité discovery(..

- **Séquence validée par le fondateur**: (1( NW-13a maintenant( réversible(: switch universel + espace seller état vide avec Revendiquer live + Créer affiché honnête(; (2( NW-13b spec Plans Free/Pro à valider(; (3( NW-13c création serveur+UI selon la spec(.

- **State de ce doc**: décisions D-A…D-D verrouillées; NW-13a in_progress; NW-13b/13c planned.
