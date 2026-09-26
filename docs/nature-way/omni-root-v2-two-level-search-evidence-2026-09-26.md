# Registre de preuve — `R-E` (S-11) recherche à deux niveaux + page publique d'entité

> **As of :** 2026-09-26 · **Porte :** `SPECIES_CLOSED_ROOT_OPEN` · **Branche :** `omni-v2-rebuild`
> **Commit :** `27a1661` · **Prod :** `index-DbI_Z1Vt.js` === build local (T-07d ✅)
> **Contrat :** `omni-root-v2-two-level-search-contract-2026-09-26.md`
> **Autorité :** `/nature-way`. **Ce registre n'affirme PAS la clôture de Species** — seule la validation fondateur le fait.

---

## 1. Ce qui a été livré

Le socle venait d'être reconstruit autour de l'**entité** (`058`→`061`). La recherche ne connaissait
qu'**un** niveau : l'offre. L'acheteur ne pouvait donc pas voir le socle qu'on venait de construire.

| Couche | Livrable |
|---|---|
| Root | `searchPublicEntities(query?)`, `getPublicEntity(id)`; `toEntity(row)`; l'identité de l'entité (`entityId`, `entityName`) exposée sur les facilités publiques |
| HTTP | `GET /api/v2/public/entities` et `GET /api/v2/public/entities/:id` — **publics** (consulter sans compte, D-05) |
| Types | `PublicEntity`, `PublicEntityDetail`; `PublicFacility.entityId/entityName` |
| Client | `searchPublicEntities`, `getPublicEntity` |
| UI | bascule de niveau, placeholder conditionnel, résultats d'entités, **page publique d'entité**, « Voir la page de l'entité », retour |

---

## 2. Preuve observée — SQL réel (l'oracle que les stubs ne sont pas)

Les tests de dépôt utilisent un `sql` **stubé** : une requête que Postgres refuse passe tous les tests
unitaire (c'est la classe `RB-PROD-3`). L'oracle réel est la base :

| Preuve | Résultat |
|---|---|
| Corps SQL des deux lectures exécutés sur la branche canonique | **compilent, retournent de vraies données** |
| `scripts/prove-root-read-paths.mjs` étendu (3 chemins entité) | ajouté (nécessite `ROOT_READ_PATH_DATABASE_URL`) |

---

## 3. Invariants — chacun **falsifié** avant d'être cru

Un test qui ne peut pas échouer ne prouve rien. Chaque invariant a été **cassé volontairement** puis restauré.

| Invariant | Falsification | Résultat |
|---|---|---|
| **E-2** aucun contact avant intention | fuite de `contact_phone` dans le mapper d'entité | **2 tests échouent** ✅ |
| **E-5** le niveau entité ignore les contraintes d'offre | ajout d'un prédicat de distance | **1 test échoue** ✅ |
| **D-01** `certified` reste interne | laisser passer `certified` tel quel | **1 test échoue** ✅ |

**E-2 vérifié aussi sur l'artefact servi** : les deux requêtes d'entité du bundle serverless
(`api/v2/availability.js`) n'exposent **aucune** colonne de contact. Vérifier le **bundle servi**, pas
seulement le source, est la règle acquise (`rewriteGlyphUrl` était présente mais jamais appelée).

---

## 4. Preuve prod (comportementale, pas seulement un hash)

| Vérification | Résultat |
|---|---|
| `GET /api/v2/public/entities` (anonyme) | **200** — entités réelles avec `offerCount`/`minPriceMinor`/`currency` |
| `GET /api/v2/public/entities/:id` (anonyme) | **200** — entité + ses offres publiées, caractéristiques R-B incluses |
| **E-2 en prod** — clés de la réponse | **aucune** clé `contact*` (entité ni offre) |
| Entité inconnue | **404** |
| Identifiant malformé | **400** |
| Bascule de niveau + placeholder + note | **rendus** (navigateur, prod) |
| Recherche « boulangerie » → 1 entité | **rendu** : `Boulangerie du Marché d'Adawlato`, 3 offres |
| Page d'entité | **rendue** : badge `Confirmée`, nature, adresse, catégorie, 3 offres réelles |
| Offre d'entité → fiche de lieu | **ouvre la fiche** (`Voir la page de l'entité` présent) |
| Fiche de lieu → page d'entité | **aller-retour fonctionne** |

**Classement de preuve :** `observed` (SQL réel + navigateur prod). Aucune affirmation `production`
au sens « validée par le fondateur ».

---

## 5. Non prouvé / résidus honnêtes

- **Aucun test automatisé de l'UI** (le DOM n'est pas piloté en CI pour cette tranche) — la preuve UI
  est un passage navigateur manuel sur prod, reproductible mais non instrumenté.
- **`ROOT_READ_PATH_DATABASE_URL` absent de ce sandbox** : le script de preuve étendu n'a pas été
  lancé ici. Les deux corps SQL ont été prouvés directement sur la branche canonique, ce qui couvre
  le même risque (compilation Postgres), mais le script lui-même n'est pas exercé dans cette session.
- **Pagination / bornage** : la liste d'entités est bornée côté requête, sans pagination explicite.
- **Hors périmètre assumé** : filtres sur caractéristiques (désactivés dans la maquette acceptée),
  devise par localisation (D-LOC), offres sans propriétaire (SP-V2-01, décision fondateur).

---

## 6. Ce que ce registre ne dit pas

Il ne dit **pas** que Species est clos, ni que le Root est complet. Il dit : **S-11 est spécifié,
exigé, était absent, et est désormais livré et prouvé** sur les invariants qui portent un risque réel
(contact avant intention, filtre au mauvais niveau, fuite d'un état interne). La suite du Root
(`D-LOC`, `SP-V2-01`) reste **à décider par le fondateur**.
