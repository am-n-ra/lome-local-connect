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

> **⚠️ Amendement 2026-09-25 — ce tableau a été RÉ-VÉRIFIÉ contre le code à `HEAD`. Trois lignes
> étaient périmées.** Le registre du 2026-09-23 déclarait **7 incohérences** ; **3 sont corrigées**
> (`C-4`, `C-5`, `C-6`, livrées en `R-4`) et **4 restent ouvertes**. Un registre qui compte des
> incohérences déjà réparées **produit à son tour de l'incohérence** : il fait croire à un chantier
> plus grand qu'il n'est. Statut réel par ligne, ci-dessous.

| # | Sujet | Seed V2 dit | Code / schéma fait | Preuve | Classe | **Statut 2026-09-25** |
|---|---|---|---|---|---|---|
| **C-1** | **Modèle universel (S-01/S-02)** | tout est offre ; type = caractéristique ; comportements séquencés | `v2_products` **exige** `facility_id` + `quantity_allocated_omni` → seul le « produit fongible » entre | `001_v2_roots.sql:71` | **Racine — logique** | **OUVERT** (vérifié `HEAD`) |
| **C-2** | **Propriété de l'offre (S-25)** | l'offre appartient à l'**ENTITÉ** ; le lieu = *où* | offre liée **à la facilité**, cascade avec elle | `001_v2_roots.sql:71` | **Racine — logique** | **OUVERT** — *atténué* : `entity_id` existe et est lié à la création (R-4), mais `facility_id` reste `not null` |
| **C-3** | **Pro = par entité** (Seed §Modèle économique) | « Seller Pro par *facilité* » est une **contradiction à corriger** : Pro = par **entité** | entitlements `facility_pro` (**24** occurrences), `activateFacilityPro(facilityId)` | `invariants.ts`, `trunk-repository.ts:3788` | **Métier** | **OUVERT** (vérifié `HEAD`) |
| **C-4** | **Plafond gratuit** | **20** (configurable) — « le plafond dit la limite » | ~~**5**~~ → **`FREE_OFFER_LIMIT = 20`**, décompte **par entité** | `invariants.ts:18` | Métier | ✅ **CORRIGÉ (R-4)** — Postgres réel : 20 → 21e refusée |
| **C-5** | **Coût bulk** | « 1 besoin = 1 bulk » (Seed §Modèle éco) | ~~`ceil(N/100)`~~ → **`creditCost = 1`**, indépendant du nombre de fournisseurs | `trunk-repository.ts:5799` | Métier | ✅ **CORRIGÉ (R-4)** — 150 facilités → 1 crédit |
| **C-6** | **Seuil de confiance** | **adapté au volume** : 1 vente particulier / 3 commerce | ~~seuil **uniforme 3**~~ → `case when e.kind = 'individu' then 1 else 3 end` | `trunk-repository.ts:3004` | Métier | ✅ **CORRIGÉ (R-4)** — individu éligible à 1, organisation à 3 |
| **C-7** | **Type de lieu** | la **position** est une *caractéristique* d'offre (fixe/mobile/immatérielle) | `facility_type` (3 types) + `rayon_km` | `trunk-repository.ts:1153` | Structure — racine de C-1 | **OUVERT** — conséquence de C-1, tombe avec lui |

**Ce qui est déjà cohérent** (à ne pas « corriger ») : entité avant offre (S-03/S-04), échelle 0→4 (S-06), `trust_state` sur l'entité seule (S-30), publication sans vérification (S-31), QR lié à l'offre+utilisateur+transaction (S-23/S-26), scan strictement vendeur (S-24/S-27), avantage obligatoire (S-19), visuels (S-20), quota bulk 3/100 (quota **aligné**, seule la **formule de coût** diverge → C-5).

## 4. Pourquoi c'est la cause du « on tourne en rond »

**La maquette s'est mise à jour ; le socle ne s'est pas mis à jour.** Chaque tranche livrée depuis Species a été construite sur le schéma « facilité → produit » :

- 200 « lieux connus » importés → **3 entités réelles** (l'index du Seed n'existe pas) ;
- `facility_type` **100 % NULL** sur 206 lignes → le type de lieu n'a jamais été rempli ;
- **0 contact vendeur**, pas d'`offer_nature` → une offre n'est pas décrite comme le Seed le veut.

Donc **Construire une UI conforme au Seed au-dessus d'un schéma non conforme produit de la dette à chaque tranche.** C'est exactement ce que le fondateur perçoit comme du rond-point.

## 5. Décision requise — **elle n'appartient qu'au fondateur**

Ce n'est **pas une tâche**, c'est un **choix d'architecture avec un coût réel**. Trois options honnêtes :

| Option | Contenu | Coût | Honnêteté |
|---|---|---|---|
| **D-C1 — Reconstruire le socle au modèle Seed** (recommandée) | l'offre appartient à l'**entité** ; la **position** devient une caractéristique d'offre ; Pro par entité ; plafond 20 ; bulk = 1 besoin ; seuil par volume. Migration additive + préservation des enregistrements. | **Élevé** (Root à reprendre, tranches aval à recâbler) | ✅ supprime la racine ; chaque tranche suivante cesse de produire de la dette |
| **D-C2 — Garder le socle, adapter le Seed au code** | entériner « facilité → produit », Pro par facilité, plafond 5… | Faible | ❌ contredit S-25/S-01/S-02 que le fondateur a écrits ; **immortalise le raté** |
| **D-C3 — Reconstruire partiellement (position d'abord)** | ouvrir d'abord la **position d'offre** (S-01 carac. 3), laisser la propriété pour plus tard | Moyen | ⚠️ **réduit la douleur sans guérir la racine** ; risque de dette prolongée |

**Recommandation Nature Way : D-C1.** Décision qui *périme* : si le fondateur choisit D-C2 ou D-C3, réviser après la première offre « occasion/digital/service » réelle qui casse le schéma — c'est-à-dire bientôt.

## 6. Ce que ce diagnostic **prouve** et ne prouve pas

- **Prouvé :** les incohérences C-1…C-7, par lecture du schéma et du code (chemins et lignes cités).
- **Prouvé :** la maquette est conforme au Seed (T-12, rendu navigateur).
- **Non prouvé :** le coût exact de la migration ni son ordonnancement — cela vient **après** la décision, en Root.
- **Non modifié :** aucune ligne de code, aucune migration, aucun enregistrement Neon.

## 7. Resource Receipt

| Statut | Ressource |
|---|---|
| Chargé | `.agents/skills/nature-way-founder-hq/references/intra-skill-execution-controller.md` |
| Chargé | `.agents/skills/nature-way/references/visual-and-logic-coherence-review.md` |
| Autorité lue | `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (Seed V2, 34 décisions) |
| Preuve lue | `db/migrations/001_v2_roots.sql` · `src/domain/invariants.ts` · `src/server/trunk-repository.ts` |
| Non chargé / raison | `technical-lead-production-review.md` — **Root pas encore ouvert** (prématuré) |

## 8. Retour à Founder HQ

| Champ | Valeur |
|---|---|
| HQ plan | `HQ-OMNI-2026-09-02` · porte : **Species réouverte** · **Root parqué** |
| Plan local | `NW-PROD-OMNI-SEED2-01` · **nouvelle tâche `T-14` (diagnostic de cohérence Seed↔code)** livrée |
| Verdict | **4 incohérences restent ouvertes (C-1, C-2, C-3, C-7) — 3 sont corrigées (C-4, C-5, C-6, livrées en `R-4`).** Ré-établi 2026-09-25 par vérification contre `HEAD`, pas par mémoire. **Une seule racine subsiste : C-1/C-2.** La maquette suit le Seed ; **le socle non.** |
| Gap résiduel | Le fond n'est pas dans le code : l'index du Seed (entité-porteuse d'offres, position-caractéristique) **n'existe pas** en base |
| Décision | **D-C1 / D-C2 / D-C3** — **fondateur seul** |
| Prochaine plus petite action | Le fondateur choisit l'option ; **ensuite** Root V2 (reprise du schéma) |
| Re-plan trigger | Choix fondateur rendu, ou première offre réelle hors moule qui casse le schéma |
