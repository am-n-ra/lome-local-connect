# Contraintes de recherche — Arbitrage D-CON-1…5 (recommandations à valider)

**Date :** 2026-09-25 · **Branche :** `omni-v2-rebuild` · **Statut :** **à trancher par le fondateur**
**Déclencheur :** signal fondateur — « Budget ≤ 2 000 F doit être plus personnalisable non ? »

## 1. La question réelle n'est pas la valeur, c'est la nature

Dans la même rangée de chips, la maquette et l'app mélangent **deux types d'objet** qui se ressemblent visuellement :

| Type | Exemple | Sémantique | Rendu correct |
|---|---|---|---|
| **Interrupteur** | « Ouvert maintenant » | oui / non | pastille allumée/éteinte |
| **Seuil** | « ≤ 2 000 F », « ≥ 10 » | **une valeur** que l'acheteur règle | **valeur visible + éditable**, la pastille n'est que l'activation |

Un interrupteur se **coche**. Un seuil se **règle**. Aujourd'hui les deux sont des `.chip` identiques → l'acheteur ne peut pas savoir lequel est réglable, et un seuil figé est **un mensonge produit** (Omni décide à sa place sans le dire).

## 2. La maquette se contredit déjà (mesuré)

- Chip : **« Quantité ≥ 10 »** → fiche, juste après : **« Quantité souhaitée : 2 »**.
- Ailleurs dans la même maquette : `Quantité 10`, `Quantité 24`, `Quantité 2` (4 valeurs, aucun lien).
- Chip : **« Budget ≤ 2 000 F »** — l'app, elle, dit **« ≤ 15 000 FCFA »**.
- **Distance comptée deux fois** : bloc « Distance *d’abord* » (Quartier 1 km / Ville 5-10-25 / Région 100 / Monde) **et** chip « ≤ 10 km ». L'app a **6** portées (1/5/10/25/100/Monde), la maquette en regroupe **4**.

## 3. Découvertes en vérifiant (2026-09-25)

**(a) Le budget sur 2 000 F est un no-op déguisé.** Sur la branche canonique `br-dawn-hill-am5amy22` : **16 produits publiés, tous ≤ 2 000** (médiane 1 000, max 6 500). Donc « ≤ 2 000 F » **ne filtre rien** — il semble fonctionner à vide. Preuve qu'il *devrait* mordre (6 produits à 2 500–6 500 F **oui** publiés) : le plafond actuel est **mal calibré** pour le catalogue réel.

**(b) BUG : le catalogue de démo mélange les devises.** 9 produits sont estampillés `USD` mais **tarifés en francs** (200 « USD », 900 « USD », 1 800 « USD ») ; 7 sont en `XOF`. La colonne devise du seed est **fausse**, pas juste incohérente.

**(c) BUG : le filtre budget ignore la devise ET ne convertit pas.** `trunk-repository.ts` compare `bpp.price_minor <= budgetMaxMinor` **sans condition de devise ni conversion**. Conséquence : un produit réellement à 50 USD serait traité comme « moins cher que 15 000 F » — vrai par accident ici, faux dès qu'un vrai prix USD apparaît. **À corriger quelle que soit la décision D-CON.**

**(d) Le modèle d'existence tranche la personnalisation.** Une offre porte **un prix** ; une *demande* (intention) porte **quantité + budget optionnel** (`createAvailabilityRequest` reçoit déjà `quantity`, `budgetMode`, `budgetMinor`). Donc : le prix se **découvre**, la quantité et le budget se **négocient**. Un plafond de budget est un **input de demande**, pas un filtre de catalogue.

**(e) Ce qui n'existe pas encore côté schéma** (jetons honnêtes) :
- **État / condition** (neuf/occasion) : **aucune colonne** dans `v2_products` → vrai « bientôt », pas un mensonge.
- **Créneau** : `public_hours jsonb` / `opening_hours jsonb` existent, mais **aucun filtre serveur** → partiel.
- **Livraison** : existe **côté demande** (`v2_availability_requests.delivery_mode` 043), **pas** comme attribut d'offre → donc pas filtrable sur le catalogue.
- **Transactable** : concept de niveau confiance, pas un prédicat de recherche.

## 4. Recommandations (à valider / amender)

### D-CON-1 — Budget : **seuil réglable**, pas pastille figée
**Recommandé :** un champ « Budget max » éditable (saisie libre + suggestions selon le catalogue local), **non allumé par défaut**. La pastille sert à **activer** la contrainte ; la valeur est **visible**.

*Pourquoi :* le modèle d'existence (d) fait du budget un **input de demande**. Un prix catalogue est **un** nombre ; un budget est **une intention**. Les figer ensemble contredit le « constraint-based search » qui est la thèse d'Omni.

*Alternative si tu tiens aux presets :* garder des paliers **mais dérivés du catalogue** (ex. 1 000 / 2 500 / 6 500 F), jamais un chiffre rond inventé.

### D-CON-2 — Quantité : **même traitement**, avec défaut = 1
**Recommandé :** champ « Au moins ___ » (défaut **1**, réellement éditable). Corriger la fiche démo « Quantité souhaitée : 2 » pour qu'elle **lise la contrainte active** au lieu d'une constante en dur.

*Pourquoi :* la fiche doit être la **vérité** de la requête. Aujourd'hui chip=10 / fiche=2 est une incohérence qu'un utilisateur remarquera immédiatement.

### D-CON-3 — Valeur par défaut : **2 500 F** (source unique)
**Recommandé :** un **seul** endroit (module de domaine) qui définit le défaut, et **la maquette ET l'app le lisent**. Valeur pilote : **2 500 F** — c'est le **p90 réel** du catalogue Lomé, donc elle mord vraiment sans exclure la masse.

*Pourquoi :* **2 000** et **15 000** sont tous deux **inventés**, et 2 000 ne filtre rien (3a). Corriger aussi : **une devise de référence par zone de service**, et **rejeter/convertir** les produits dont la devise diffère (3b/3c) — sinon le budget reste un filtre aveugle.

### D-CON-4 — Distance : **garder les 6 portées, supprimer le chip en double**
**Recommandé :** **un seul** contrôle de distance : les **6 portées** de l'app (1 / 5 / 10 / 25 / 100 / Monde), présentées dans le bloc « Distance *d’abord* ». **Supprimer** le chip « ≤ 10 km » de la rangée suivante.

*Pourquoi :* deux contrôles pour une contrainte, c'est deux sources de vérité. Le Seed dit « distance d'abord » — elle mérite son bloc, pas un doublon.

### D-CON-5 — Étiquettes : nommer la vérité, séparer les 3 familles
**Recommandé :** fin de la rangée unique. Trois groupes explicites :
1. **Disponibilité** (interrupteurs, câblés) — « Ouvert maintenant ».
2. **Votre besoin** (seuils éditables, câblés) — Budget, Quantité.
3. **Attributs d'offre** — « État / condition » (**bientôt**, aucune colonne — honnête), « Livraison » (**à déplacer** : c'est un mode de demande, pas un attribut), « Créneau » (**partiel** : horaires existent, filtre à construire), « Transactable » (**à retirer** du niveau recherche : c'est un palier de confiance, pas un filtre).

*Pourquoi :* « bientôt » sur une capacité non modélisée est **honnête** ; le même mot sur une capacité qui existe déjà ailleurs (livraison) **égare**.

## 5. Ce que je ne peux pas trancher à ta place

- Le **modèle de saisie** du seuil (champ libre vs paliers dérivés).
- La **valeur par défaut** (2 500 proposé) et la **devise de référence** par zone.
- Le **sort de « Transactable » / « Livraison »** dans la rangée recherche.
- L'**ordre d'exécution** : veux-tu que je réaligne **d'abord la maquette** (Species) puis l'app, ou l'inverse ? — rappel : Root reste **bloqué** tant que Species n'est pas close.

## 6. Clause honnête

**Aucune ligne de code de contrainte n'a été écrite** dans cette session : le livrable est un **arbitrage**. Les 3 bugs de rendu (icône de recherche, dock PC ×2) sont, eux, **corrigés, mesurés et gardés**. Tant que D-CON-1…5 ne sont pas rendues, **SP-VALIDATION ne peut pas être close honnêtement** — valider ces écrans reviendrait à valider la contradiction chip/fiche.
