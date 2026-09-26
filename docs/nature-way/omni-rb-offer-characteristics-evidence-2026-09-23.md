# R-B — les caractéristiques de l'offre (S-01) + deux bugs de production bloquants

Date : 2026-09-23
Branche : `omni-v2-rebuild`
Objet : tâche **R-B** — écrire les 7 caractéristiques de l'offre et construire l'UI de création d'offre.
Statut : **livré, non clôturé** — la clôture de R-B et de Species exige la validation du fondateur.

---

## 1. Ce que R-B devait corriger

Le Seed dit « tout est offre » : une offre se décrit par ses **caractéristiques**, pas par un « type ».
La base portait bien les cinq colonnes `position_kind`, `uniqueness_kind`, `handover_kind`,
`price_kind`, `condition_kind` — **mais aucune écriture ne les renseignait**. Mesure sur la base
canonique `br-dawn-hill-am5amy22` avant R-B, sur 16 produits :

| Colonne | Renseignée |
|---|---|
| `position_kind` | 13 |
| `uniqueness_kind` | 0 |
| `handover_kind` | 0 |
| `price_kind` | 0 |
| `condition_kind` | 0 |

Le défaut n'était donc **pas** le schéma (aucune migration nécessaire) : c'était l'INSERT qui les
omettait, et l'absence totale de formulaire de création d'offre dans l'application
(`createSellerProductDraft` était du code mort — écrit, jamais appelé par aucune UI).

## 2. Ce qui a été livré

- **Types** (`src/trunk/types.ts`) : `OfferPositionKind`, `OfferUniquenessKind`, `OfferHandoverKind`,
  `OfferPriceKind`, `OfferConditionKind` ; champs ajoutés à `SellerCatalogueProduct` **et**
  `PublicProduct`.
- **Dépôt** (`src/server/trunk-repository.ts`) : constantes `OFFER_*_KINDS` +
  `normalizeOfferCharacteristics()` ; `createSellerProductDraft` écrit les cinq colonnes ;
  `updateSellerProductDraft` et les deux chemins de lecture (catalogue vendeur, fiche facilité
  acheteur) les relisent.
- **HTTP** (`src/server/http.ts`) : `POST /api/v2/seller/catalogue` valide les cinq champs.
- **Client** (`src/trunk/api.ts`) : `createSellerProductDraft` accepte et envoie les caractéristiques.
- **UI vendeur** (`src/trunk/SellerV13.tsx`) : formulaire « Ajouter une offre » — nom, prix,
  avantage Omni, quantité, unité, et les cinq caractéristiques en sélecteurs. L'offre naît en
  brouillon, conformément à la maquette `seller-publish`.
- **UI acheteur** (`src/trunk/TrunkAppV13.tsx` + `ui-helpers.ts`) : `offerCharacteristics()` rend
  les caractéristiques déclarées sur chaque ligne d'offre de la fiche facilité. **Une
  caractéristique non déclarée est omise — on n'invente jamais une valeur.**

## 3. Deux bugs de production bloquants trouvés par la preuve

La preuve live a buté sur deux défauts **réels et déjà déployés** (`a04be74d`, en production sur
`omni.sparkafrika.online`). Aucun des deux n'était détectable par la suite de tests : les tests du
dépôt utilisent un `sql` bouchonné, qui **n'exécute jamais de SQL**.

### BUG-1 — `createSellerFacility` déclarait le CTE `inserted` deux fois

`WITH query name "inserted" specified more than once` → Postgres rejette **l'instruction entière**.
Introduit par R-2 (`019d97f`) : le CTE `inserted` d'origine n'a pas été retiré quand le second a été
ajouté pour porter `entity_id`.

**Conséquence : aucun vendeur ne pouvait créer de facilité.** L'entrée vendeur (créer/revendiquer),
livrée en NW-13c, était morte en production.

### BUG-2 — l'`ON CONFLICT` du brouillon d'offre ne correspondait à aucun index

`there is no unique or exclusion constraint matching the ON CONFLICT specification`.
L'index réel est **partiel** :
`v2_products_facility_idempotency_idx ... (facility_id, idempotency_key) WHERE idempotency_key IS NOT NULL`.
Postgres n'accepte un index partiel comme cible d'`ON CONFLICT` que si l'instruction **répète le
prédicat**. Le dépôt le faisait correctement ailleurs
(`on conflict (responder_account_id, idempotency_key) where idempotency_key is not null`) — pas ici.

**Conséquence : aucune offre ne pouvait être créée.** C'est exactement le chemin que R-B devait
ouvrir : le formulaire aurait échoué à chaque envoi.

### Correctifs

| Fichier | Correctif |
|---|---|
| `src/server/trunk-repository.ts` | CTE `inserted` dupliqué retiré de `createSellerFacility` |
| `src/server/trunk-repository.ts` | `on conflict (facility_id, idempotency_key) where idempotency_key is not null` |

## 4. Preuves

### 4.1 Preuve live, code livré, branche jetable — 7/7 PASS

`scripts/prove-rb-offer-characteristics.mjs` pilote le **code réellement livré**
(`createTrunkRepository`) sur une branche jetable créée depuis la canonique, avec des fixtures
réelles (compte `seller_ready`, facilité + entité créées par le code livré). Correlation
`dd9775e9-3297-4ad7-9794-af74f21946d7` :

| Étape | Résultat |
|---|---|
| fixtures — compte + facilité + entité via le code livré | PASS |
| T1 — offre créée avec ses caractéristiques | PASS |
| T2 — caractéristiques **réellement en base** | PASS |
| T3 — catalogue vendeur les relit | PASS |
| T4 — fiche facilité (côté acheteur) les relit | PASS |
| T5 — caractéristique invalide refusée, **aucune ligne écrite** | PASS |
| T6 — offre sans caractéristique acceptée, reste `null` | PASS |

Nettoyage vérifié : **zéro trace** du run courant en base.

### 4.2 Falsifications — les tests échouent vraiment sans le correctif

Un test qui ne peut pas échouer ne prouve rien. Les deux chemins ont été neutralisés un à un :

| Falsification | Résultat |
|---|---|
| retirer les cinq colonnes de l'INSERT du brouillon | `× writes the offer characteristics into the draft insert` — **1 échec** |
| forcer la lecture à `null` | `× reads the offer characteristics back on the public offer` — **1 échec** |

### 4.3 Portée des bugs en production

`git show a04be74d:src/server/trunk-repository.ts` (le commit **déployé**, confirmé par
`api.github.com/.../deployments`) contient bien les deux défauts ; l'artefact serverless déployé
aussi. La route répond `401` en anonyme (garde d'authentification) : le défaut est **derrière**
l'authentification, donc invisible à un sondage anonyme — il ne se révélait qu'avec une session
vendeur réelle.

### 4.4 État des gardes

- `tsc --noEmit` : exit 0
- suite complète : **68 fichiers / 607 tests**, tous verts
- `check:docs`, `check:state`, `check:coherence`, `check:maquette`, `check:boundary` : exit 0
- `npm run build` : OK ; `build:vercel-functions` : 12 fonctions, le correctif est bien dans l'artefact

## 5. Reste à faire — et ce qui exige le fondateur

- **Pousser vers la production** (les deux bugs bloquants y sont toujours actifs) — **ordre
  fondateur explicite requis** (garde-fou T-07d), puis comparer hash prod === build local.
- **Backfill des 3 produits** sans `position_kind` (« Natural shea butter », « Kente tote bag »,
  « First-aid kit ») : décision fondateur — une valeur inventée serait un mensonge.
- **Validation fondateur** avant toute clôture de R-B ou de Species.
- R-B **bloque** R-5 (découverte 2 niveaux) et R-4b (Pro par entité) — débloqués par cette livraison,
  mais à confirmer après la preuve navigateur.

## 6. Leçon à ne pas réapprendre

**Une suite de tests avec un `sql` bouchonné ne prouve jamais que le SQL est valide.** Ces deux
défauts sont des erreurs de *compilation* Postgres : elles échouent à la première exécution, à
100 % du temps, et 607 tests verts ne les ont pas vues — parce qu'aucun d'eux n'exécute de SQL.
Seule une preuve qui pilote le code livré contre une vraie base les révèle. C'est le même motif que
les bugs de sémantique de snapshot (`65d81cb`, `e4948a5`, `2b33433`) : la base est le seul oracle.
