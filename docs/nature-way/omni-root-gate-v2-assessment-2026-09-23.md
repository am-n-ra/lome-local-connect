# Gate Root V2 — évaluation avant implémentation (Omni, 2026-09-23)

> ## ⛔ PRÉMATURÉ — PARQUÉ (pas une porte, 2026-09-23)
>
> **Ce document a été produit alors que la porte Species était encore ouverte.** La règle de
> contrôle est explicite : *« Un seul gate actif. Ne pas empiler Root/Trunk/Canopy au-dessus
> d'une Species non conforme. »* `SP-1…SP-6` ne sont **pas validés par le fondateur** → Species
> n'est pas conforme → **cette analyse n'avait pas à être ouverte comme porte.**
>
> **Ce qui est retenu :** les **mesures** ci-dessous sont réelles (lues sur la canonique) et
> gardées comme **renseignement** pour informer la future porte Root.
> **Ce qui est retiré :** la **demande de décision `R-1`/`R-2`/`R-3`** — elle n'est **pas
> ouverte**. Ne pas y répondre maintenant.
>
> **Condition de réouverture :** clôture de Species V2 par décision fondateur.

> **Statut : EN ATTENTE DE DÉCISION FONDATEUR.** Aucun code produit n'a été modifié.
> Le document de réconciliation exige la preuve Root **avant** d'ouvrir l'implémentation.
> Ceci est cette preuve — et elle **échoue**.

## Resource Receipt
- **Projet Neon** : `Omni` (`wild-moon-30984513`), branche canonique **prouvée par ses données** : `br-dawn-hill-am5amy22` (`omni-v2-rebuild`) = **206 facilités**, identique à ce que sert la prod.
- **Méthode** : lecture `information_schema` + comptages SQL sur la canonique. Aucune écriture.
- **Artefact de référence** : `docs/nature-way/omni-master-reconciliation-and-sdm-v2-2026-09-23.md`.

## 1. Ce que le gate demande

Le document de réconciliation fixe le gate suivant, noir sur blanc :

> **Gate pour débloquer la suite :** preuve Root que le schéma porte **objet unique** + **commerce à stock** + **service** sans casse, + test de non-régression **S-11**.
> **« Un écran rendu n'est pas une preuve que le système parent existe. »**

## 2. Résultat : le gate échoue sur trois points prouvés

### R-1 — Le schéma ne porte **pas la nature de l'offre**
`v2_products` décrit une offre comme **un produit avec du stock** :

| Colonne | Ce qu'elle impose |
|---|---|
| `unit` (`'unit'` par défaut) | l'offre se compte en **unités** |
| `actual_stock` (nullable, jamais alimentée : 14/16 ont une valeur, mais c'est **l'autre** colonne qui sert) | un stock physique |
| `quantity_allocated_omni` (+ `quantity_reserved_omni`) | le stock **alloué** et **réservé** |

Or le **service**, le **créneau**, le **digital** et l'**immobilier** ne s'expriment **pas** en unités allouées.
**Il n'existe aucune colonne de nature** (bien durable / service / créneau / immatériel / logement).

**Conséquence prouvée dans le code** (`src/server/trunk-repository.ts:1874`) : la recherche filtre
`greatest(quantity_allocated_omni - quantity_reserved_omni, 0) >= quantité`.
Un **service** (stock 0) est donc **filtré hors résultats** et affiché **« rupture »** — le moule « commerce à stock » **casse** exactement là où le modèle promet qu'il ne casse pas.
**Le « sans casse » demandé par le gate est réfuté par le code lui-même.**

### R-2 — Le compteur d'écran ment : « 206 offres » pour **3 entités réelles**
Sur **206 facilités** de la canonique, répartition réelle par confiance et provenance :

| Confiance | Provenance | Nombre |
|---|---|---|
| `unclaimed` | `public_import` | **200** |
| `confirmed` | `created` | 2 |
| `certified` | `public_import` | 1 |
| `verification_submitted` | `public_import` | 1 |
| `unconfirmed` | `created` | 1 |
| `unconfirmed` | `public_import` | 1 |

Autres mesures : `facility_type` renseigné **0 / 206** · contact (tél. ou WhatsApp) **0 / 206**.

**Ce qui est légitime :** importer des **lieux connus** (200, `unclaimed`) est un **choix produit valide** — ce sont des entités **à revendiquer**, pas une erreur. Le modèle Species le prévoit (« Lieu connu mais non revendiqué — non interrogeable »).

**Ce qui ment :** l'écran affiche **« 206 OFFRES »**. En vérité il y a **3 entités réellement gérées**, **3 en parcours de vérification**, et **200 lieux sans offre ni gestionnaire**.
**Un lieu à revendiquer n'est pas une offre.** Les compter ensemble transforme un décor en apparence de marché — et c'est précisément ce qui fait qu'on croit avoir de la supply alors qu'on a une liste.
Ce n'est pas un défaut de données, c'est un **défaut de comptage et de libellé**.

### R-3 — La devise de l'offre est incohérente
`v2_products.currency` contient **`USD` et `XOF`** selon les lignes, alors que le pilote est **Lomé** et que le wallet/ledger sont **XOF-only** (FedaPay).
Deux offres du même marché s'affichent donc dans deux devises. Le champ est renseigné **librement**, sans règle.

## 3. Ce que cela veut dire pour la question du fondateur

> « tout le fond et la logique qui doit faire de omni omni n'est pas la »

**C'est exact, et voici la mesure.** La maquette V2 promet « une seule offre, sept caractéristiques, aucun type séparé » — et elle a **raison** : c'est le bon modèle.
Mais **la base ne le porte pas** :
- une offre **est** un produit à stock (R-1) ;
- l'entité **n'a pas de nature** (R-2) ;
- la devise **n'est pas tenue** (R-3).

Autrement dit : **Species V2 décrit le bon objet, le schéma en décrit un autre.** L'écart n'est pas une question de finition ; c'est **le moule**.
C'est pourquoi « on a tourné en rond » : chaque tranche produit rajoutait des pixels par-dessus un schéma qui contredisait le modèle.

## 4. Le levier (racine, anti-dette)

La chaîne déjà identifiée par le SDM V2 est la bonne, et elle est **bloquée par R-1** :

```
E-02/E-03 (entité unifiée, y compris personne)
  → E-04 (offre universelle + caractéristiques de nature)   ← R-1
  → E-05 (disponibilité vivante)
  → E-07 (découverte 2 niveaux)
```

**Pourquoi d'abord :** tant que R-1 n'est pas fermé, toute surface hérite du moule « commerce + stock » et **casse sur le service, le créneau, le digital et l'immobilier** — les quatre cas que la maquette promet de porter.

## 5. Décisions demandées (fondateur) — ⛔ RETIRÉES POUR L'INSTANT (voir bannière)

> Ces trois arbitrages sont **exacts** et seront nécessaires **le jour où Root s'ouvre**.
> Ils **ne sont pas ouverts aujourd'hui** : Species n'est pas close. Conservés pour mémoire.

| # | Décision | Options |
|---|---|---|
| **R-1** | **Nature de l'offre dans le schéma** | (a) colonne `offer_nature` (`bien` / `service` / `creneau` / `immatériel` / `logement`) + rendre le filtre de stock **conditionnel à la nature** ; (b) une table `v2_offers` séparée de `v2_products` ; (c) statu quo (⇒ le modèle reste faux) |
| **R-2** | **Le compteur : lieux vs offres** | (a) **séparer les deux compteurs** à l'écran (« 3 entités · 200 lieux à revendiquer ») — *n'efface rien, dit la vérité* ; (b) convertir les imports en entités revendicables actives ; (c) les retirer du jeu pilote |
| **R-3** | **Devise** | (a) **XOF unique** pour le pilote (wallet/ledger le sont déjà) ; (b) devise par entité |

**R-2 est le plus visible** : c'est lui qui fait dire « 206 offres » quand il y en a 3.

## 6. Ce qui n'est pas fait, volontairement

- **Aucun code produit**, **aucune migration** — le gate exige l'accord avant implémentation.
- **Pas de nettoyage des imports** avant ta décision : supprimer de la donnée est destructif et demande une décision confirmée (règle de branche).
