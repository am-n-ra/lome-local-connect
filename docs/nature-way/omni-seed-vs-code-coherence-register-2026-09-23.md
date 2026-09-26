# Omni — Registre de cohérence Seed V2 ↔ maquette ↔ code

> **Statut :** **diagnostic livré — décision fondateur requise** (2026-09-23)
> **Phase :** Species (réouverte) · porte active · **Root non ouvert**
> **Autorité :** `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (Seed V2, `founder-confirmed`)
> **Méthode :** revue de cohérence — comparer Intent → maquette → état client → contrat → serveur/données
> **Périmètre :** **aucune ligne de code produit modifiée** par ce document

---

## 1. Ce que le fondateur a dit, et ce que ça demande

> « on a assez tourné en rond et je pense qu'on a raté tout le process depuis species… **tout le fond et la logique qui doit faire de omni omni n'est pas là** et même il y a **beaucoup d'incohérence dans ce qu'on veut réellement faire et proposer**. »

Deux affirmations distinctes :

1. **« Le fond et la logique n'est pas là. »** → mesurable : le **modèle** du Seed existe-t-il hors de la maquette ?
2. **« Beaucoup d'incohérence. »** → mesurable : où Seed, maquette et code **disent des choses différentes** ?

Ce registre répond aux deux par des faits, pas par une impression.

## 2. Résultat — une seule racine derrière la plupart des incohérences

Le Seed V2 est **cohérent et riche**. La maquette V2 lui est **conforme** (T-12 : 16/16, audit refait par rendu rendu). **Ce qui diverge, c'est le code et le schéma restés sur le modèle d'avant.**

Le Seed nomme cette racine à la lettre :

> **« Racine du raté précédent :** l'architecture actuelle ne couvre qu'une tranche — *Facility → produit → stock comptable* — donc "commerce fixe, produit fongible avec un nombre". Toute offre hors de ce moule (occasion, appart, coupe, zem, digital) casse le schéma. »

**Cette racine est toujours en place, inchangée.** Preuve dans le schéma — la colonne
`v2_products.facility_id` est le point exact :

```sql
-- db/migrations/001_v2_roots.sql:82
create table if not exists v2_products (
  facility_id uuid not null references v2_facilities(id) on delete cascade,  -- ← l'offre APPARTIENT à une facilité
  ...
  quantity_allocated_omni integer not null default 0,                        -- ← stock comptable
```

Or **S-25** dit l'inverse : *« Il n'y a pas de "produit appartenant à une facilité" dans le modèle V2. »* Le code porte `facility_id not null` — **la contradiction est structurelle, pas cosmétique.**

## 3. Incohérences mesurées (Seed = autorité)

> **⚠️ Amendement 2026-09-25 — ce tableau a été RÉ-VÉRIFIÉ contre le code ET la base canonique. Le registre
> était faux dans les DEUX sens, y compris après ma première correction du matin.**
>
> **Première passe (2026-09-23)** : 7 incohérences annoncées, racine `C-1`/`C-2` « toujours en place ».
> **Deuxième passe (2026-09-25, matin)** : j'ai vérifié le code et conclu « 4 ouvertes » — `C-1`/`C-2`
> **toujours** ouvertes, citant `001_v2_roots.sql:71` comme preuve de `facility_id not null`.
>
> **Cette citation était fausse** : la ligne 71 de `001` est `v2_facility_entitlements.facility_id`, **pas**
> `v2_products`. Et surtout : **`058_v2_entity_layer_r1.sql` — titrée « décision fondateur D-C1 » — fait
> `alter table v2_products alter column facility_id drop not null`**, ajoute `v2_entities`, `entity_id`,
> et les caractéristiques d'offre. `059`/`060`/`061` complètent (lien lieu→entité, confiance, Pro par entité).
>
> **Vérifié live sur la canonique `br-dawn-hill-am5amy22`** : `v2_products.facility_id` → `is_nullable = YES` ;
> `v2_entities` existe (**3** lignes) ; `entity_id` présent sur offres / lieux / entitlements ;
> **13/16** offres liées ; **3/206** lieux liés.
>
> **Conclusion : `D-C1` a été exécuté, pas « en attente ».** La racine n'est plus une décision ouverte —
> c'est un **résidu d'exécution**.
>
> **Et la faute est de ma classe préférée** : j'ai cité un **numéro de ligne** sans relire la **ligne**.
> Troisième variante du même défaut en une journée — *mesurer la donnée au lieu du pixel*, *un sous-ensemble
> pour le tout*, **et maintenant citer une preuve sans la lire**. **Un document de diagnostic n'est pas
> une preuve : il est périmé dès qu'un commit passe.**

| # | Sujet | Seed V2 dit | Code / schéma fait | Preuve | Classe | **Statut 2026-09-25** |
|---|---|---|---|---|---|---|
| **C-1** | **Modèle universel (S-01/S-02)** | tout est offre ; type = caractéristique ; comportements séquencés | ~~`v2_products` **exige** `facility_id`~~ → **`058` a fait `facility_id` NULLABLE** ; caractéristiques d'offre ajoutées (`position_kind`…) | `058_v2_entity_layer_r1.sql:33` · **vérifié live** : `is_nullable = YES` | **Racine — logique** | ✅ **STRUCTURELLEMENT CLOS** (D-C1 exécuté). *Résidu* : 3/16 offres sans entité, caractéristiques **déclarées mais non remplies** (`uniqueness_kind`/`handover_kind`/`price_kind`/`condition_kind` = **0/16**) |
| **C-2** | **Propriété de l'offre (S-25)** | l'offre appartient à l'**ENTITÉ** ; le lieu = *où* | ~~offre liée **à la facilité**, cascade~~ → **`entity_id`** sur offres (13/16 liées), lieux (3/206) et entitlements ; le code lit `coalesce(p.entity_id, f.entity_id)` | `058:32` · `059` · **vérifié live** | **Racine — logique** | ✅ **CLOS** (D-C1/D-2a). *Résidu* : 203 lieux sans entité — mais **tous** ont `account_id = null` = les lieux `public_import` (fond de carte), **pas** des vendeurs réels |
| **C-3** | **Pro = par entité** (Seed §Modèle économique) | « Seller Pro par *facilité* » est une **contradiction à corriger** : Pro = par **entité** | ~~écritures sur `facility_id`~~ → **`061` + `R-4b` (`6b88907`)** : `v2_facility_entitlements.entity_id` + FK + backfill ; activation/renouvellement écrivent `entity_id` ; lectures couvrent **lieu OU entité** ; **3 bugs réels** trouvés en le faisant (colonne jamais écrite, `ends_at` non testé, affichage jamais remis à `free`) | `061` · `R-4b` | **Métier** | ✅ **CLOS (`R-4b`)** — preuve A/B : 2e lieu même entité sans entitlement propre → ancienne porte **refuse**, nouvelle **accorde**. *Résidu* : **0** entité `commercial_plan <> 'free'` → non exercé en données |
| **C-4** | **Plafond gratuit** | **20** (configurable) — « le plafond dit la limite » | ~~**5**~~ → **`FREE_OFFER_LIMIT = 20`**, décompte **par entité** | `invariants.ts:18` | Métier | ✅ **CORRIGÉ (R-4)** — Postgres réel : 20 → 21e refusée |
| **C-5** | **Coût bulk** | « 1 besoin = 1 bulk » (Seed §Modèle éco) | ~~`ceil(N/100)`~~ → **`creditCost = 1`**, indépendant du nombre de fournisseurs | `trunk-repository.ts:5799` | Métier | ✅ **CORRIGÉ (R-4)** — 150 facilités → 1 crédit |
| **C-6** | **Seuil de confiance** | **adapté au volume** : 1 vente particulier / 3 commerce | ~~seuil **uniforme 3**~~ → `case when e.kind = 'individu' then 1 else 3 end` | `trunk-repository.ts:3004` | Métier | ✅ **CORRIGÉ (R-4)** — individu éligible à 1, organisation à 3. *Résidu* : **0 entité `individu` en base** → chemin non prouvé en données |
| **C-7** | **Type de lieu** | la **position** est une *caractéristique* d'offre (fixe/mobile/immatérielle) | `facility_type` (3 types) + `rayon_km` **et** `v2_products.position_kind` (13/16 rempli) | `trunk-repository.ts:1153` · `058:36` | Structure — racine de C-1 | ✅ **CLOS** — `position_kind` **est** la caractéristique d'offre que le Seed demandait |

**Ce qui est déjà cohérent** (à ne pas « corriger ») : entité avant offre (S-03/S-04), échelle 0→4 (S-06), `trust_state` sur l'entité seule (S-30), publication sans vérification (S-31), QR lié à l'offre+utilisateur+transaction (S-23/S-26), scan strictement vendeur (S-24/S-27), avantage obligatoire (S-19), visuels (S-20), quota bulk 3/100 (quota **aligné**, seule la **formule de coût** diverge → C-5).

## 4. Pourquoi le rond-point — **version corrigée**

**La version du 2026-09-23 disait : « la maquette s'est mise à jour ; le socle ne s'est pas mis à jour. »**
**C'était faux.** `058`→`061` ont mis le socle à jour, **sur décision fondateur `D-C1`**. Ce qui n'a pas
suivi, c'est **la conscience qu'on en avait** — le registre, la board, l'état de référence, et moi-même
ce matin.

**La vraie cause du rond-point est donc plus précise, et plus gênante :**

- Le socle a été **reconstruit** (couche entité) — mais **le travail n'est pas terminé** : `C-3` (Pro)
  est **partiel**, et les **caractéristiques d'offre sont déclarées mais non remplies** (0/16 sur
  `uniqueness_kind`, `handover_kind`, `price_kind`, `condition_kind`).
- **Les documents d'état n'ont pas suivi le code.** Le registre annonçait une racine « ouverte » que
  `058` avait déjà fermée. La board citait `16/16`. `current-state` citait une porte sur 6 tranches
  quand 10 étaient livrées.
- **Chaque reprise repartait donc d'une carte périmée**, refaisait un diagnostic, re-découvrait un
  sous-ensemble, et livrait une tranche — d'où l'impression de tourner en rond. **Ce n'est pas le
  produit qui tournait en rond : c'est notre mémoire du produit.**

**Chiffres corrigés** (les chiffres du 2026-09-23 étaient trompeurs) :

| Constat 2026-09-23 | Réalité vérifiée 2026-09-25 |
|---|---|
| « 200 lieux connus → **3 entités** : l'index n'existe pas » | **3 entités** est le chiffre **correct** — mais les **203 lieux non liés ont tous `account_id = null`** : ce sont les lieux `public_import` (fond de carte), **pas des vendeurs**. **0 vendeur réel n'est sans entité.** |
| « `facility_type` 100 % NULL » | vrai pour le type de **lieu** — mais `v2_products.position_kind` (la caractéristique d'**offre** que le Seed demandait) est rempli sur **13/16** |
| « l'index du Seed n'existe pas en base » | **faux** : `v2_entities`, `entity_id` (offres/lieux/entitlements), caractéristiques d'offre **existent** |

## 5. Décision — **elle a déjà été prise et exécutée**

Le registre du 2026-09-23 proposait `D-C1` / `D-C2` / `D-C3`. **Le fondateur a tranché `D-C1` le
2026-09-23** — et `058`/`059`/`060`/`061` l'ont exécuté. **Il ne reste donc pas un choix d'architecture,
mais un résidu d'exécution.** Proposer à nouveau les trois options serait rejouer le rond-point :
redemander une décision déjà rendue.

**Résidu réel, à finir (Root — après clôture Species) :**

| # | Résidu | Preuve | Effort |
|---|---|---|---|
| **R-A** | **Basculer le chemin d'écriture Pro** sur `entity_id` (la cible existe, `061` l'a backfillée ; les écritures écrivent encore sur `facility_id`) — `C-3` | `061` · 0 entité `commercial_plan <> 'free'` | Moyen |
| **R-B** | **Remplir les caractéristiques d'offre** à la création/publication (`uniqueness_kind`, `handover_kind`, `price_kind`, `condition_kind`) — déclarées, **0/16 remplies** | live | Moyen |
| **R-C** | **3/16 offres sans entité** — les lier ou les classer | live | Faible |
| **R-D** | **Prouver le chemin `individu`** (seuil 1) : 0 entité `individu` en base | live | Faible |

**Recommandation : aucune des trois options du 2026-09-23.** La décision utile est **déjà prise** ; la
prochaine action utile est de **finir le résidu en Root**, et surtout de **garder les documents d'état
synchronisés avec le code** — la seule chose qui a réellement produit le rond-point.

## 6. Ce que ce diagnostic **prouve** et ne prouve pas

- **Prouvé (vérifié live sur `br-dawn-hill-am5amy22`)** : `facility_id` nullable, `v2_entities` présente,
  `entity_id` sur offres/lieux/entitlements, 13/16 offres liées, 3/206 lieux liés, caractéristiques
  d'offre déclarées et **non remplies**, 0 entité `individu`, 0 entité `commercial_plan <> 'free'`.
- **Prouvé :** la maquette est conforme au Seed (T-12, rendu navigateur, 26 décisions).
- **Non prouvé :** le coût exact de R-A…R-D — cela vient **après** la clôture Species, en Root.
- **Non modifié :** aucune ligne de code, aucune migration, aucun enregistrement Neon (lectures seules).

## 7. Resource Receipt

| Statut | Ressource |
|---|---|
| Chargé | `.agents/skills/nature-way-founder-hq/references/intra-skill-execution-controller.md` |
| Chargé | `.agents/skills/nature-way/references/visual-and-logic-coherence-review.md` |
| Autorité lue | `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (Seed V2, 32 décisions) |
| Preuve lue | `db/migrations/001_v2_roots.sql` · `src/domain/invariants.ts` · `src/server/trunk-repository.ts` |
| Non chargé / raison | `technical-lead-production-review.md` — **Root pas encore ouvert** (prématuré) |

## 8. Retour à Founder HQ

| Champ | Valeur |
|---|---|
| HQ plan | `HQ-OMNI-2026-09-02` · porte : **Species réouverte** · **Root parqué** |
| Plan local | `NW-PROD-OMNI-SEED2-01` · **nouvelle tâche `T-14` (diagnostic de cohérence Seed↔code)** livrée |
| Verdict | **0 incohérence ouverte.** `C-1`/`C-2`/`C-3`/`C-7` **CLOSES** (`058`→`061`, `R-4b` — vérifié live) ; `C-4`/`C-5`/`C-6` **CORRIGÉES** (`R-4a`). Il ne reste **pas un choix** mais un **résidu d'exécution** (`R-B`…`R-E`). **La vraie cause du rond-point : les documents d'état n'ont pas suivi le code** — pas le produit. |
| Gap résiduel | **Le fond EST dans le code** (`v2_entities`, `entity_id`, `position_kind`). Gap = **caractéristiques d'offre 0/16 remplies**, **3** offres sans entité, chemins **Pro/`individu` non exercés en données** — et **documents périmés**. |
| Décision | ~~**D-C1 / D-C2 / D-C3**~~ — **déjà tranchée `D-C1`, déjà exécutée.** Redemander = rejouer le rond-point |
| Prochaine plus petite action | **`SP-VALIDATION`** (clôture Species, fondateur) → puis **Root : `R-B`…`R-E`** |
| Re-plan trigger | Choix fondateur rendu, ou première offre réelle hors moule qui casse le schéma |
