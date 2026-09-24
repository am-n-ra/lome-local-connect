# Root V2 — Couche « entité » : contrat et plan de migration

> **Statut :** décision **D-C1 rendue par le fondateur (2026-09-23)** — Root **ouvert**. Contrat à valider.
> **Porte :** Root System · **Périmètre :** schéma + contrat. **Aucune migration appliquée en production.**
> **Autorité :** Seed V2 `S-01/S-02/S-13/S-25/S-28/S-30` · SDM V2 edges `E-02/E-03/E-04`
> **Branche :** `omni-v2-rebuild` · **Méthode :** `prerequisite-architecture.md`, `proof-and-decision-ledger.md`

## 1. Le problème, en une phrase

`v2_products.facility_id not null` fait **appartenir l'offre à un lieu**. Le Seed dit l'inverse (S-25) :
l'offre appartient à l'**entité** ; le lieu n'est que *où*. Comme S-01/S-02 exigent un modèle universel,
le lieu ne peut pas être le pivot.

## 2. Décision structurante — quelle table est l'« entité » ?

Deux candidats existent déjà :

| Candidat | Nature réelle | Verdict |
|---|---|---|
| `v2_facilities` | mélange **deux** choses : l'entité (nom, confiance, plan, compte) **et** le lieu (lat/lng, adresse, horaires) | **à scinder** |
| `v2_companies` | coquille historique | insuffisant |

**Décision de conception :** créer **`v2_entities`** comme l'**offreur** (individu **ou** organisation — même objet, S-13),
et **réduire `v2_facilities` au lieu**. Une entité a **0..n** lieux. Un particulier (S-28) a une entité **sans lieu fixe**
(position immatérielle portée par l'offre).

C'est la structure que le Seed appelle de ses vœux :

```
v2_entities  ──(account_id)──► v2_accounts
     │ 1..n
     ▼
v2_facilities (lieu : lat/lng/address/hours)
     ▲ 0..n (lieu d'une offre — optionnel si immatérielle)
v2_products (OFFRE) ── owner: entity_id (obligatoire) + facility_id (nullable = lieu de disponibilité)
     │
     └── caractéristiques : position(fixe|mobile|immatérielle), unicité, temporalité, retrait/livraison, état, prix
```

## 3. Cible de schéma (additif, préservation par défaut)

### 3.1 `v2_entities` (nouvelle)

| Colonne | Type | Règle |
|---|---|---|
| `id` | uuid pk | — |
| `account_id` | uuid → `v2_accounts(id)` | **compte responsable** (S-17) |
| `kind` | text | check `individu` / `organisation` (même objet, S-13) |
| `display_name` | text not null | — |
| `trust_state` | text not null default `unconfirmed` | **S-30 : la confiance vit ici** |
| `qualifying_sales` | integer not null default 0 | seuil **par volume** (S-14) |
| `commercial_plan` | text not null default `free` | **Pro par entité** (Seed §éco) |
| `created_at` / `updated_at` | timestamptz | — |

### 3.2 `v2_products` (modifiée — additive puis bascule)

| Colonne | Règle |
|---|---|
| `entity_id` uuid → `v2_entities(id)` | **NOUVEAU · propriétaire de l'offre (S-25)** |
| `facility_id` | **devient nullable** = *où* l'offre est disponible (jamais *à qui*) |
| `position_kind` text | **NOUVEAU** check `fixe`/`mobile`/`immatérielle` (S-01 carac. 3) |
| `uniqueness_kind` text | **NOUVEAU** check `renouvelable`/`piece_unique` (carac. 2) |
| `handover_kind` text | **NOUVEAU** check `retrait`/`livraison`/`immatériel` (carac. 5) |
| `price_kind` text | **NOUVEAU** check `fixe`/`negociable` (carac. 7) |
| `condition_kind` text | **NOUVEAU** `neuf`/`occasion` (carac. 6) |

**Séquence de bascule (3 temps, jamais un seul `not null` brutal) :**
1. **M1 — additive :** créer `v2_entities`, ajouter `entity_id` **nullable** + colonnes de caractéristiques **nullable**, backfill, index. **Rien ne casse.**
2. **M2 — contrainte :** vérifier `entity_id` non nul partout, puis `set not null` sur `entity_id` ; `facility_id` → **drop not null**.
3. **M3 — nettoyage :** déplacer `trust_state`/`qualifying_sales`/`commercial_plan` vers `v2_entities` (lecture, puis écriture, puis dépréciation des colonnes de `v2_facilities`).

### 3.3 Backfill (mesuré : 206 facilités, 3 réelles, 16 offres)

- **203 imports publics** (`account_id` NULL) → **aucune entité** (ce ne sont pas des offreurs, ce sont des **lieux de carte**, S-05 `unclaimed`). Ils **restent des `v2_facilities` sans entité** — honnête.
- **3 facilités réelles** avec `account_id` → **1 entité chacune** (`kind='organisation'`, `display_name` = nom du lieu, `trust_state`/`commercial_plan` recopiés).
- **16 offres** → `entity_id` = entité de leur facilité. Les **13** sur entités réelles sont propres ; les **3** sur import restent `entity_id NULL` **temporairement** (dette explicite, voir §5).

## 4. Preuve exigée avant application (aucune confiance sans preuve)

1. Migration **M1** exécutée **sur branche jetable** créée depuis la canonique.
2. **Invariant S-11 (non-régression)** : une requête « entité » **et** une requête « offre » fonctionnent sur le même index.
3. **Invariant S-25** : une offre peut exister **sans lieu** (`facility_id` null) — cas du particulier immatériel.
4. **Zéro perte** : comptes, offres, snapshots, wallets **inchangés** (comptés avant/après).
5. Branche jetable **supprimée** ; **aucune écriture sur la canonique** sans votre ordre.

## 5. Dettes explicites (à ne pas cacher)

| Dette | Contenu | Trigger |
|---|---|---|
| `D-ENT-1` | 3 offres sur imports publics gardent `entity_id NULL` après M1 | à résorber avant `set not null` (M2) |
| `D-ENT-2` | `trust_state` dupliqué temporaire (entité **et** facilité) entre M1 et M3 | M3 |
| `D-ENT-3` | Les 203 imports n'ont **pas** d'entité — c'est correct (S-05), mais toute requête les traitant comme offreurs serait fausse | contrôle de lecture |
| `D-ENT-4` | Pro/plafond/seuil (C-3/C-4/C-6) ne sont **pas** dans ce slice — ils dépendent de l'entité (slice suivant) | après M2 |

## 6. Séquencement (une seule tranche active à la fois)

| Slice | Contenu | Dépend de | Statut |
|---|---|---|---|
| **R-1** (celle-ci) | `v2_entities` + `v2_products.entity_id` + caractéristiques (M1 additive) | décision D-C1 | **contrat écrit — à prouver** |
| **R-2** | contraintes (M2) + `position_kind` alimenté par l'UI | R-1 prouvé | `planned` |
| **R-3** | confiance sur l'entité (M3) | R-2 | `planned` |
| **R-4** | Pro **par entité** + plafond **20** + bulk **1 besoin** + seuil par volume (C-3/C-4/C-5/C-6) | R-3 | `planned` |
| **R-5** | UI : découverte 2 niveaux (S-11) branchée sur entité+offre | R-2 | `planned` |

## 8. Preuve R-1 (exécutée sur branche jetable `root-entity-proof`, supprimée après)

**Statut de la preuve : `reproduced`** — M1 exécutée deux fois (dont une ré-exécution) sur une branche créée
depuis la canonique `br-dawn-hill-am5amy22`, puis branche **supprimée**. **La canonique n'a jamais été écrite.**

| Invariant | Attendu | Observé |
|---|---|---|
| **S-25 — offre sans lieu** | une offre peut exister avec `entity_id` **et** `facility_id NULL` | ✅ `Service à distance (aucun lieu)` inséré, `facility_id = null`, `position_kind = immaterielle` |
| **S-11 — deux niveaux** | recherche « entité » **et** « offre » sur le même index | ✅ entité `Boulangerie…` (3 offres) **et** offres `Pain de mie`, `Service à distance` |
| **Backfill mesuré** | 13 offres sur entités réelles reçoivent `entity_id` | ✅ `with_entity = 13` puis `14` (après l'offre de preuve) ; `without_entity = 3` (imports, dette `D-ENT-1`) |
| **Zéro perte** | comptes / offres / snapshots / facilités inchangés | ✅ `accounts 9`, `products 16`, `snapshots 12`, `facilities 206` |
| **Idempotence** | re-exécution sans doublon ni erreur | ✅ re-run **0 erreur**, `entities_total = 4`, `boulangerie_rows = 1` (aucun doublon) |
| **Preuve négative — FK** | `entity_id` inexistant refusé | ✅ `violates foreign key constraint "v2_products_entity_id_fkey"` |
| **Preuve négative — caractéristique** | `position_kind='volante'` refusé | ✅ `violates check constraint "v2_products_position_kind_check"` |

**Falsification :** la FK et le CHECK ont été exercés jusqu'à l'échec réel — un test qui ne peut pas échouer ne prouve rien.

**Piège rencontré (déjà connu, à ne pas réapprendre) :** un CTE qui écrit n'est **pas visible** du `SELECT` de la
même instruction — le premier comptage affichait `products_with_entity = 0` alors que les 13 mises à jour avaient eu lieu.
Comptage refait par requête séparée : `13`. C'est de la **sémantique Postgres**, pas un bug.

## 10. Découverte mesurée (2026-09-23) — R-1 est **sûr mais inerte** sans R-2

En vérifiant si M1 pouvait casser la prod (rendre `facility_id` nullable), j'ai trouvé un fait décisif :
**le tronc ne tolère aucune offre sans lieu.**

| Mesure | Valeur |
|---|---|
| Jointures **internes** `v2_products → v2_facilities` | **5** |
| Jointures **gauches** (tolérantes) | **0** |

Les 5 lectures concernées (`src/server/trunk-repository.ts`) :

| Ligne | Lecture | Effet d'une offre sans lieu |
|---|---|---|
| 1917 | `getFacilityDetail` | invisible |
| 2072 | `listSellerCatalogue` | **absente du catalogue du vendeur lui-même** |
| 2186 | `transitionSellerProduct` | publication impossible |
| 2210 | `setProductAvailability` | disponibilité impossible |
| 2246 | `listProductStockEvents` | historique invisible |

**Conséquence, en trois points :**

1. **Appliquer M1 est sûr** : les 16 offres existantes ont toutes un `facility_id`. Aucune lecture ne casse aujourd'hui. Zéro perte prouvée.
2. **Mais M1 seul ne tient pas la promesse du Seed.** Une offre portée par une entité **sans lieu** (particulier immatériel, S-25/S-28) serait acceptée en base puis **silencieusement masquée** par le tronc. Le schéma dirait vrai, le produit mentirait.
3. **Donc R-2 n'est pas « poser les contraintes »** — c'est **rendre les chemins de lecture/écriture conscients de l'entité**. Tant que ce n'est pas fait, la couche entité est une fondation **invisible**.

**Recommandation de séquence corrigée :** R-1 (appliquée) → **R-2 = chemins entité-aware** → R-3 (confiance) → **R-4 (Pro par entité, plafond 20, bulk, seuil)**. Faire R-4 avant R-2 reviendrait à tarifer des *lieux* au lieu d'*entités* — la contradiction se reproduirait.

## 11. Resource Receipt

| Statut | Ressource |
|---|---|
| Chargé | `references/prerequisite-architecture.md` · `references/proof-and-decision-ledger.md` · `references/risk-and-escalation-matrix.md` |
| Lu (autorité) | `omni-intent-brief-v2-2026-09-23.md` (S-01/S-02/S-13/S-25/S-28/S-30) · SDM V2 (`E-02/E-03/E-04`) |
| Lu (à corriger) | `db/migrations/001_v2_roots.sql` · `omni-seed-vs-code-coherence-register-2026-09-23.md` |
| Mesuré (Neon, lecture) | branche canonique `br-dawn-hill-am5amy22` : 206 facilités / 3 réelles / 16 offres / 12 snapshots |
| Non chargé / raison | `technical-lead-production-review.md` — sera chargé **avant** application de M2 (changement de contrainte) |
