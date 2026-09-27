# R-G — la disponibilité par PRÉSENCE (pièce unique) — Root, 2026-09-27

> **Tranche :** `R-G` (Root). **Décision fondateur :** « ne me fais pas réfléchir inutilement, tu
> connais la finalité de la v1, fais le nécessaire » → option **C** retenue (présence / objet
> unique), la plus petite qui rend vraie la promesse « offres particulières » du S-07.
> **Diagnostic amont :** `omni-root-vs-seed-v2-diagnosis-2026-09-27.md`.
> **Artefact maquette (Species, clos) :** diffusion du S-07 « Tout / Commerces / Particuliers / Transport ».

## Resource Receipt

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md`, `nature-way/references/prerequisite-architecture.md` |
| Loaded | `nature-way-founder-hq/references/{ecosystem-orchestration-protocol,ecosystem-activation-manifest,founder-hq-board}.md`, `templates/skill-handoff-receipt.md` |
| Template instantiated | `templates/skill-handoff-receipt.md` (voir §Retour HQ) |
| Not loaded / reason | `intra-skill-execution-controller.md` — le plan local `NW-PROD-OMNI-01` porte déjà le contrôleur, étendu ici. |

> **Note d'étiquette :** un `R-F` **existe déjà** (`ecdb398`, `S-06`/`S-32` — échelle
> d'existence et intégrité de l'offre). Ma tranche porte donc **`R-G`** pour ne pas écraser un
> identifiant livré. Le fond manquant était bien la suite directe de `R-F` : `R-F` a *rendu* le
> niveau d'existence ; `R-G` rend **vraie** la caractéristique qui le gouverne.

## 1. Le défaut mesuré (rappel exact, pas une impression)

Les quatre caractéristiques d'offre (`uniqueness_kind`, `price_kind`, `condition_kind`,
`handover_kind`) existaient en **colonnes**, étaient **transportées** (lues, écrites, affichées),
et avaient **0 usage de logique**. Une offre `piece_unique` portait donc un stock de N, était
annoncée « en stock », et son niveau 4 (S-06 « Transactable ») se déduisait d'un décompte qui n'a
aucun sens pour un objet unique. Les six cas fondateur (ordinateur d'occasion, appartement) n'étaient
servis par **aucune** logique.

## 2. Ce qui est livré

### a. Une seule règle, partagée (`src/trunk/offer-uniqueness.ts`)

Module pur, importé par le serveur **et** l'interface — impossible qu'ils divergent.

- `capacityForUniqueness` : une pièce unique a une capacité de **1** ; une offre renouvelable est
  illimitée.
- `normalizeStockForUniqueness` : une pièce unique écrite avec N exemplaires est ramenée à **1**
  (la présence). Une offre renouvelable est inchangée. **`null` (héritage) est inchangé** — une
  migration ne réécrit pas une offre qui n'a jamais déclaré sa nature.
- `uniquenessStockRejection` : refuse « 3 pièces uniques identiques ». La contradiction est
  **refusée**, jamais corrigée en silence.
- `isReservable` : la réservabilité se lit **par caractéristique** — présence pour une pièce
  unique, décompte pour le reste.

### b. La présence gouverne le niveau 4 (`offer-existence.ts`)

`computeExistenceLevel` lit désormais la caractéristique : une pièce unique **présente** (1, non
engagée) est transactable ; **vendue** (1 réservé) ou **retirée** (0) ne l'est pas. Une offre
renouvelable garde son comportement historique (FF-8, décompte net de réservations).

### c. Le serveur applique l'invariant (`trunk-repository.ts`)

- `createSellerProductDraft` et `updateSellerProductDraft` refusent une pièce unique en plusieurs
  exemplaires (`UNIQUENESS_INCOHERENT_STOCK`) et normalisent à 1 avant d'écrire.
- **Édition partielle corrigée** — bug réel trouvé pendant la tranche : l'`UPDATE` écrasait **les
  cinq** caractéristiques à `null`/`''`. Modifier une offre la rendait donc **muette** et faisait
  perdre sa nature. Désormais l'édition **préserve par défaut** (`coalesce` sur la valeur
  existante) et l'invariant lit la nature **existante** quand elle n'est pas fournie — sinon un
  simple PATCH l'aurait contourné.

### d. La surface vendeur (`SellerV13.tsx`)

Quand le vendeur choisit « Pièce unique », le champ « Quantité » devient **« Présence »** :
*Présente (1)* / *Retirée (0)*. Le nombre n'a plus de sens, donc il disparaît — plutôt qu'un champ
qu'on aurait laissé mentir. Note honnête : « elle se vend une fois, puis disparaît de la recherche ».
Le refus serveur est traduit dans `ProductCatalogueV13.publicationMessage`.

### e. La base (`063_v2_piece_unique_presence.sql`)

CHECK `uniqueness_kind is distinct from 'piece_unique' or quantity_allocated_omni in (0, 1)`.
Défense en profondeur : le filet qui survit à un appel direct à la base ou à un futur chemin de code.

## 3. Preuve

### Tests — `596/596` (49 fichiers), tsc + 6 gardes vertes

- `offer-uniqueness.test.ts` (6 tests) : refus, non-bridage du renouvelable, normalisation,
  capacité, réservabilité, **et le niveau 4 par présence**.
- `trunk-repository.test.ts` (+2) : le repo **refuse** une pièce unique à 3 exemplaires ; le repo
  **normalise** à 1 avant écriture.

### Falsification — la preuve peut échouer (fait, pas promis)

Refus neutralisé **et** retour au décompte naïf → **2 échecs** attendus. C'est cette passe qui a
trouvé un **vrai bug dans ma propre formule** : `isReservable` utilisait `max(1, allocated)`, ce qui
rendait une pièce **retirée** (`allocated = 0`) *réservable* — donc annoncée transactable alors
qu'elle n'est plus là. Corrigé en `allocated >= 1 && reserved < 1`, et le cas (0,0) est désormais
épinglé par test. **Trouvé par falsification, pas par relecture.**

### Migration — branche jetable puis canonique

- **Branche jetable `br-winter-boat-amangwe5`** : contrainte posée ; insert `piece_unique` + 40
  → **refusé** (`check_violation`) ; `NULL` + 40 et `renouvelable` + 40 et `piece_unique` + 1
  → **acceptés** ; probes nettoyées, `0` trace. **Branche supprimée.**
- **Canonique `br-dawn-hill-am5amy22`** : appliquée + registre `063_v2_piece_unique_presence.sql`
  checksum `fce55080…`. Vérifié après : **16 produits, 13 NULL intactes** (dont **11 avec stock > 1**,
  grandfatherisées), **0 réécriture**, contrainte présente.

**Pourquoi personne n'est réécrit :** mesure avant migration — `piece_unique = 0 ligne`, `null = 13`,
`renouvelable = 3`. La contrainte n'a donc **rien** à corriger ; elle n'engage que les écritures
futures. Une migration ne réécrit pas au passage le sens d'offres qui n'ont jamais déclaré leur nature.

## 4. Vérification que je n'écrase pas du travail livré (2026-09-27)

La mesure a buté sur un fait qui méritait d'être tranché avant de continuer : le board citait un
`R-F` livré (`ecdb398`, `S-06`/`S-32`) à **664 tests**, alors que la suite en compte **596**.

- **Le board n'était pas périmé :** `ecdb398`, `c6e973b`, `0423fea`, `27a1661`, `85c1669` existent et
  sont **tous ancêtres de HEAD**. `R-C`, `R-D`, `R-E`, `R-F` et l'alignement app↔maquette sont bien
  livrés. Ce que ma session précédente avait lu comme « board périmé » était ma propre non-lecture.
- **L'écart 664 → 596 est expliqué :** le commit **`fed06b0` (V-9')** a supprimé **29 fichiers de
  tests** (code mort v1 : `src/lib/*.unit.test.ts`, `src/routes/*`, `src/components/omni/*`, les **6
  tests factices** `toBeDefined()` sur des composants inexistants) et en a ajouté 5. **Perte nette
  attendue, pas une régression silencieuse.**
- **La capacité a survécu, elle a été déplacée :** les tests supprimés `transaction-steps` /
  `transaction-timeline` couvraient des modules v1 également supprimés. Le stepper de confirmation
  vit désormais dans `BuyerFlowV13.tsx` (les étapes, `:319`) et `transaction-time.ts` (échéance et
  responsable par étape, FF-6, `:3`). **Le cœur transactionnel n'a pas perdu son rendu.**
- **Ce qui n'est PAS couvert** : le mapping « état → étapes du stepper » n'a plus de test unitaire
  propre après V-9' (il est exercé indirectement par la preuve E2E transactionnelle
  `prove-v2-transaction-lifecycle.mjs`, pas au niveau du stepper). Dette mineure, nommée ici.

## 5. Ce qui n'est PAS fait (résidu honnête)

- **Les 13 offres NULL ne sont pas classées.** Les convertir demanderait une décision par offre
  (un « sac de riz » est-il renouvelable ou une pièce unique ?) — ce n'est pas une migration, c'est
  un acte vendeur. Elles restent grandfatherisées et honnêtes : leur niveau d'existence se lit
  toujours par décompte, comme avant.
- **`price_kind`, `condition_kind`, `handover_kind` restent des déclarations** (0 logique). La
  tranche les nomme ; elle n'en a rendu qu'**une** vivante, conformément à « un vrai à la fois »
  (S-02). La **négociation** (`price_kind='negociable'`) est la candidate suivante : elle touche la
  machine transactionnelle à 10 états, déjà robuste.
- **Pas de preuve navigateur** de la surface vendeur (sandbox sans DB/Auth) : la logique est prouvée
  unitairement et la migration par SQL direct. La preuve visuelle « Pièce unique → Présence »
  appartient au prochain spot-check fondateur.
- **Aucune offre `piece_unique` n'existe encore** en base (0) : la contrainte est armée mais n'a
  encore rien eu à protéger. Sa preuve est le refus provoqué, pas un cas réel.
