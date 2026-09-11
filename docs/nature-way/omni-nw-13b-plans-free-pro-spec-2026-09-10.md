# NW-13b — Plans Free/Pro: re-spécification et réponse à la question fondateur

Date 2026-09-10; **amendé 2026-09-11 (fondateur(**. Statut: **VERROUILLÉE fondateur 2026-09-11**. Contexte: HO-OMNI-11, NW-13 D-A universel,et la question: « qu'est-ce qui empêche un user de créer une seule facilité, d'y lister tous ses produits, et d'avoir un seul plan pro? Et qu'est-ce qui justifie notre plan actuel? »



##  ​0. Réponse directe à la question fondateur

**Rien ne l'empêche — et c'est le modèle il ne doit pas l'empêcher.** La matrice verrouillée ( business_model.md( dit: **Vendeur Free = 1 établissement actif** ( fixe, mobile/ambulant ou digital(, de son choix(; **5 produits publiés**; **dispo manuelle 3 clics**; **vitrine + QR**; **bonus verrouillé** après 3 ventes QR(.( Le contrat derrière: **« 1 établissement actif »** désigne la capacité de **compte**, pas une limitation artificielle par catégorie ou par nom de facilité.



Un user qui choisit **une seule facilité et y met tous ses produits** exerce exactement son droit Free(, ou son droit Pro pour CETTE facilité(. Le code sert déjà ce contrat: `v2_facility_slots` offre **1 free slot par compte** avant tout achat;, `setProductPublication` plafonne le catalogue publié à **5 par facilité** en Free(, et le débloque en `pro_active` pour cette facilité unique(.(



**Ce qui justifie le plan actuel, et comment Omni profite monétairement:** le plan ne vend pas le droit d'exister;il vend la **profondeur** de l'établissement ( Pro = 10 produits + packs surplus + dispo auto + analytics + visibilité(, la **largeur** du compte ( slots additionnels à l'unité pour multi-boutiques(, la **fréquence** d'intention acheteur ( packs bulk + Acheteur Pro(, la **visibilité** ( publicité sponsorisée(, et l'**intelligence** ( analytics Pro(.( Un user à une seule facilité n'est pas un contournement: c'est la couverture universelle assumée — le Free prouve la confiance via  ​3 QR, le Pro rend l'établissement opérationnel(, et Omni monétise la puissance vendue, pas l'entrée.

**Plusieurs facilités non liées sont le cas naturel** visé par les **facility slots**: on veut être découvert **dans la zone où l'on fournit le service**; si tout est au même endroit, on peut tout mettre sous une seule facilité(, mais si les marchés/zones sont distincts, on ouvre des facilités supplémentaires ≠ des entités liées artificiellement, chacune avec son slot, son plan(, et ses produits(, mesurés par la recherche géospatiale(.



##  ​1. Sources autoritaires

- `docs/business_model.md` — matrice acheteur/vendeur + monétisation additionnelle(.
- `docs/omni-free-pro-offer-2026-08-17.md` — positionnement + unlocker de test Pro 20 USD(.
- `docs/OMNI_MASTER.md` + `docs/OMNI_MASTER_PRODUCT_INTERFACE.md` — couverture universelle vendeur + mobile/discovery(.



##  ​2. Matrice Acheteur Free/Pro et état code

| Capacité | Acheteur Free | Acheteur Pro ( 2 500 XOF/mois( | État code actuel |
|---|---|---|---|---|
| Exploration cartographique | Illimitée temps réel | + filtres géospatiaux avancés + favoris persistants | Recherche + filtres rayon existants; favoris persistants? saved-searches partiel |
| Vérification unitaire | Gratuite illimitée | Gratuite illimitée | Routée availability, en place |
| Bulk availability |​ 3 opérations groupées / mois( crédits( | **Crédits bulk Pro: pack mensuel généreux**(à fixer, recommandé 25–30/mois consumer(, chaque demande à plusieurs facilités consomme une quantité | **Quota absent** — aucune route de comptage bulk |
| Comparateur |1 comparaison active | Jusqu'à 5 comparaisons multi-critères | Compare existant ( surface `compare`(; quotas absents |
| Espace transaction + QR | Accès complet | + support prioritaire + offres exclusives | En place ( flow + chat( |
| Recommandations | Manuel | Automatisées meilleur compromis | **Absent** — suggestions non implémentées |



#### 3. Matrice Vendeur Free/Pro et état code

| Capacité | Vendeur Free | Vendeur Pro ( 5 000 XOF/établissement/mois( | État code actuel |
|---|---|---|---|---|
| Établissements inclus |**1 établissement actif** ( fixe/mobile/ambulant/digital( | Pro indépendant par établissement |**1 free slot par compte** implémenté ( `v2_facility_slots` + `roots-operations`(; 3 types dernièrement libres |
| Slots additionnels | Facturés à l'unité ( propos prod: 1 000 XOF( | Facturés à l'unité ou inclus réseaux multi-boutiques | Règle achat slot en place ( 250 unités test(; prix prod 1 000 XOF à confirmer |
| Taille catalogue |Jusqu'à 5 produits/services publiés | **Catalogue ILLIMITÉ pour l’établissement Pro actif**; les produits au-delà des 5 de base ne sont **visibles dans Omni que quand Pro actif** | **5 max en place** ( l.1722(; déblocage visibilité Pro = nouvelle cible |
| Traitement dispo | Manuel 3 clics | Auto instantanée stock alloué | **Partiel**: réponse seller manuelle en place; auto `availability_pro_eligible` couplée à la garde pro en racine ( D-04( |
| Vitrine + QR | Fiche publique + QR | Enrichie + mise en avant + édition rapide | Fiche + QR en place; mise en avant Pro à confirmer |
| Scanner caisse | Scanner web/PWA | Haute cadence + journal + audit | Scanner QR seller en place; journal/audit Pro absent |
| Visibilité/statistiques | Indicateurs basiques | Tableau complet: conversion, provenance scans | Demandes reçues en place; analytics avancés absents |



##  ​4. Trois types de facilité — entrée pour NW-13c création

Le modèle reconnaît **fixe, mobile/ambulant, digital** comme types d'établissement éligibles de la même façon. La table actuelle n'a qu'une colonne `category` libre; la création de facilité ( NW-13c( devra introduire un **type contraint**: `facility_type in ('fixe','mobile','digital')` + `category` description libre. Un **vendeur mobile** a une zone floue ou un rayon plutôt que des coordonnées exactes; le formulaire devra permettre ( a( position au point promis à un instant donné(, ( b( position "quartier/zone" avec multi-points par jour(, et ( c( annonce digitale/leurre online sans point physique( — chacun avec un trust_state initial `unconfirmed` et le même parcours de preuve.



### 5. Mode discovery et visibilité

- **Discovery** = être découvert dans la recherche géospatiale et dans les listes. En Free, la facilité est trouvable, avec un catalogue publié limité à 5. En Pro, la vitrine est mise en avant sur la carte et les produits Pro ( 10 + surplus( apparaissent en priorité ( visibilité supérieure, campagnes sponsorisées en route séparée(.
- Le mode discovery ( « mettre les choses en discovery » que le fondateur cite( n'est pas un plan séparé: c'est la capacité de **tout catalogue publié** à être trouvé par la recherche(, bornée par les quotas Free/Pro de publication(,( et amplifiée par la visibilité Pro(/.

##  ​6. Monétisation multi-couches ( le modèle de revenus(

| Couche | Vend | Client | État code |
|---|---|---|---|---|
| Abonnement Pro vendeur | Profondeur de l'établissement: 10 produits, dispo auto, analytics, visibilité + packs produits surplus | Vendeur par facilité | Backend en place( 30 j, wallet spend, entitlement(; UI + packs à compléter |
| Slots additionnels | Facturés à l'unité ( propos prod: 1 000 XOF( | Facturés à l'unité ou inclus réseaux multi-boutiques | Règle achat slot en place ( 250 unités test(; prix prod 1 000 XOF à confirmer |
| Packs bulk + Acheteur Pro | Fréquence d'intention: requêtes groupées, comparateur, recommandations | Acheteur | **Quotas absents**; recommandations absentes |
| Publicité sponsorisée | Visibilité: campagnes, mise en avant | Vendeur | Campagnes existantes mentionnées( doc(; IA draft uniquement |
| Bonus confiance 20 USD verrouillé | Traction: 3 ventes QR débloquent le crédit | Vendeur nouveau | **Info en doc**; seller_unlocks/pro_test_credit **absents** en prod |
| FedaPay/Mobile Money | Achats à la carte: slots, packs, dépôts | Tous | FedaPay en place ( wallet ledger(; Mobile Money MTN/Moov/Orange absent |



### 7. Gaps code vs spec, priorisés

| Priorité | Gap | Bloque | Tranche proposée |
|---|---|---|---|---|
| P1 | Quotas bulk acheteur( 3 crédits/mois Free,, crédits Pro via pack mensuel généreux( à fixer(, consommables par demande multi-facilités( | Honnéteté des promesses acheteur| NW-13d comptage serveur de crédits + packs |
| P1 | seller_unlocks + pro_test_credit ( 20 USD verrouillé( | Le bonus 20$ promis n'existe pas en prod | NW-13e bonus confiance |
| P2 | Types de facilité contraints ( fixe/mobile/digital( | La création ( NW-13c( ne peut pas exprimer le mobile/discovery | NW-13c création |
| P2 | Analytique vendeur Pro | La promesse Pro analytics n'existe pas | NW-13f analytics |
| P2 | Abonnement récurrent automatisé ( renewal_opt_in false( | Le Pro expire sans renouvellement automatique ni rappel | NW-13g renouvellement |
| P3 | Acheteur Pro + recommandations + favoris persistants | Promesses acheteur Pro non livrées | NW-13h acheteur Pro |
| P3 | Mobile Money MTN/Moov/Orange | Monétisation mobile money du doc | NW-13i payements |
| P3 | Publicité sponsorisée IA | Campagnes manuelles seulement | NW-13j publicité |



##  ​8b. Décisions verrouillées ( fondateur 2026-09-10(

| ID | Décision verrouillée | Choix fondateur |
|---|---|---|---|
| D-E |  ​1 seule facilité tous produits = 1 établissement actif légitime; multi-facilités = slots payés, découverte par zone de service | **Validé** |
| D-F |Types de facilité: fixe/mobile/digital + zone/rayon pour mobile |**(a(: 3 types strictes** |
| D-G |Quotas bulk = crédits de volume: 3 crédits/mois Free; **Pro = pack mensuel de crédits généreux**(à fixer, ne pas négliger le besoin mensuel(; chaque demande à N facilités consomme une quantité |**(a(: 3 crédits Free/mois** + **Pro pack mensuel généreux, consommables** + surplus rachetable en packs |
| D-H |Bonus confiance:  ​20 USD verrouillé,, débloqué après **3 ventes transactions Omni avec users distincts** |**(a(: seller_unlocks + pro_test_credit,, users distincts exigé** |
| D-I |Abonnement Pro: **auto-renouvellement recommandé** via wallet,, opt-out possible pour l'user |**(a(: auto + wallet + opt-out** |
| D-J |Prix prod: **facility slot 1 000 XOF à confirmer**; Pro vendeur 5 000 XOF/mois; packs produits/bulk à fixer |**Slot  ​1 000 XOF à confirmer** |
| D-K |**Acheteur Pro lancé maintenant**( favoris+comparateur(; recommandations ensuite |**(b(: maintenant** |


#####  ​9. Définition de fait de NW-13b

Spec validée fondateur 2026-09-10, **amendée fondateur 2026-09-11**; décisions D-E…D-K **verrouillées**; le modèle de revenus est **figé**: profondeur/largeur/fréquence/visibilité/intelligence; Free​ 5 produits; **catalogue vendeur ILLIMITÉ en Pro actif** ( autres produits visibles Omni que quand Pro actif(; 3 types de facilité; **bulk = crédits de volume: 3 crédits/mois Free, pack mensuel Pro généreux à fixer, consommables par demande multi-facilités**; bonus​ 20 USD verrouillé après 3 ventes QR à users distincts; abonnement auto+opt-out;; slot​ 1 000 XOF à confirmer; acheteur Pro lancé maintenant.


##  ​8c. Ordre des tranches planifiées( après validation NW-13b(

| Ordre | Tranche | Contenu | Bloque |
|---|---|---|---|---|
| 1 | NW-13c | Création de facilité serveur+UI: formulaire minimal,, trust unconfirmed,, puis parcours preuve; 3 types( fixe/mobile/digital(,, zone/rayon mobile(,, digital sans point | D-B,, D-F,, D-J partiel |
| 2 | NW-13d | Crédits bulk serveur: 3 crédits/mois Free,, **pack mensuel Pro généreux**(à fixer(,, comptage par demande multi-facilités + packs surplus | D-G |
| 3 | NW-13e | Bonus confiance: seller_unlocks + pro_test_credit,,  ​3 ventes à users distincts | D-H |
| 4 | NW-13g | Renouvellement Pro auto via wallet + opt-out + rappel | D-I |
|  ​5 | NW-13h | Acheteur Pro: favoris persistants + comparateur multi-critères + quotas | D-K |
|  ​6 | NW-13f | Analytics vendeur Pro: conversion,, provenance scans | Promesse analytics |
|  ​7 | NW-13i | Mobile Money MTN/Moov/Orange | Monétisation mobile |
|  ​8 | NW-13j | Publicité sponsorisée + IA | Promesse publicité |

**Note:** la prochaine action après validation = **NW-13c** création de facilité(,, car elle débloque P2Créer du switch universel( et permet les types mobile/digital( (D-F(,( et amorce la monétisation par slot/plan.