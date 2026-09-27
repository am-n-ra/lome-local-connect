# Root vs Seed V2 — diagnostic structurel mesuré (2026-09-27)

> **Dispatch:** Founder HQ → `/nature-way` (product phase + Root gate).
> **Déclencheur:** retour fondateur 2026-09-27 — « on a assez tourné en rond, je pense qu'on a raté
> tout le process depuis Species ; la présentation visuelle est bien mais **tout le fond et la logique
> qui doit faire de Omni Omni n'est pas là**, et il y a beaucoup d'incohérence dans ce qu'on veut
> réellement proposer ».
> **Méthode:** Nature Way, phase Root. **Aucun code modifié par ce diagnostic.**

## Resource Receipt

| Statut | Chemin exact |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/references/ecosystem-orchestration-protocol.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/ecosystem-activation-manifest.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/founder-hq-board.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/templates/skill-handoff-receipt.md` |
| Loaded | `.agents/skills/nature-way/references/prerequisite-architecture.md` |
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Template instantiated | `templates/skill-handoff-receipt.md` (voir §Retour à Founder HQ) |
| Not loaded / reason | `nature-way/references/intra-skill-execution-controller.md` + `templates/intra-skill-plan.md` — le plan local existant (`intra-skill-plan-NW-PROD-OMNI-01.md`) porte déjà le contrôleur ; étendu dans ce document plutôt que dupliqué. `technical-lead-production-review.md` — réservé à la révision qui suivra la décision fondateur. |

## 1. Le process n'est pas cassé depuis Species — il a été **réparé avant ce message**

C'est une correction de l'hypothèse du fondateur, et elle compte : sans elle, on referait un cycle.

La Master Plan (lignes 32–36) enregistre que le fondateur a **rouvert Seed puis Species le
2026-09-23**, puis que **Species V2 a été re-close `founder-confirmed` le 2026-09-25** (validation
« Validé » sur `SP-1…SP-10`). Le Seed V2 est un Intent Brief refait
(`omni-intent-brief-v2-2026-09-23.md`, 32 décisions `S-01…S-32`, `founder-confirmed`).

**Donc : Seed V2 et Species V2 sont autoritatifs et clos. La porte courante est Root — et elle est
ouverte.** Continuer à invoquer « tout est à refaire depuis Species » ferait perdre les deux étapes
les plus coûteuses, qui sont faites et acceptées.

## 2. La liste des blocages Root était **périmée dans les deux sens**

Le board (`HO-OMNI-20`) liste les inter-dits d'alignement de l'app. Mesure au `HEAD` :

| Blocage annoncé | Mesure réelle (2026-09-27) | Verdict |
|---|---|---|
| Chips figés `'Quantité 10'` / `'≤ 15 000 FCFA'` | 0 occurrence dans `src/trunk/TrunkAppV13.tsx` | **résolu** |
| Devise en dur (`OMNI_DEFAULT_LOCAL_CURRENCY`) | `src/domain/currency.ts` **interdit** l'usage direct et impose `resolveUserCurrency` ; `TrunkAppV13:161` l'appelle avec `navigator.language` | **résolu (contrat branché)** |
| Filtre budget « aveugle à la devise » | `trunk-repository.ts:2058–2071` : comparaison **même devise** + conversion **USD→local** par taux, et **exclusion** explicite d'une devise non convertible (« never silently compared ») | **résolu** |
| `public.markets` absente du canonique v2 | toujours absente — mais le repli hors-ligne `MARKETS` de `currency.ts` est **conçu pour** ce cas et les call-sites ne changeront pas | **dette connue, non bloquante** |
| 9 produits `USD` tarifés en francs | `062_one_money_family.sql` migre la famille ; le budget convertit | **traité en partie** |

**Leçon de méthode :** une liste de blocages non re-mesurée devient une **carte fausse**. Elle avait
déjà provoqué une mis-décision le 2026-09-26 (« `R-B` d'abord » alors que le code était livré depuis
la veille). Elle en provoquerait une autre si on l'acceptait ici.

## 3. Le vrai écart Root : la **logique des caractéristiques** n'existe pas

C'est « le fond qui fait d'Omni Omni », et c'est mesuré.

Le Seed V2 §« Définition du cœur » :

> « Disponible » = **UNE** notion, exprimée **par caractéristique** (un nombre pour un stock, une
> **présence** pour un objet unique, une **place libre** pour un créneau, une **position** pour un
> transport) — **une seule logique de fraîcheur**, pas quatre.
> Racine du raté précédent : l'architecture ne couvre qu'une tranche — *Facility → produit → stock
> comptable*.

**Ce qui existe (mesuré, `information_schema` + `grep`) :**

- Le **vocabulaire** est en place — `v2_products` porte `position_kind`, `uniqueness_kind`,
  `handover_kind`, `price_kind`, `condition_kind` (+ `quantity_allocated_omni`,
  `quantity_reserved_omni`).
- Ces colonnes sont **transportées** : lues, écrites, mappées vers les types, affichées.

**Ce qui manque — les valeurs sont des *déclarations*, pas des *comportements* :**

| Caractéristique | Usages de *logique* dans `trunk-repository.ts` | Ce que le cœur exige |
|---|---|---|
| `uniqueness_kind` (`renouvelable`/`piece_unique`) | **0** (les 2 occurrences sont du mapping) | « présence » pour un objet unique — pas un simple compteur |
| `price_kind` (`fixe`/`negociable`) | **0** | si `negociable`, le prix est une **demande d'ouverture** → négociation |
| `condition_kind` | **0** | filtre/matching (occasion ≠ neuf) |
| `handover_kind` | **0** | retrait vs livraison dans la disponibilité et le coût |
| `position_kind` | partiel | fixe / mobile (zone+rayon) / digital / service — variations de disponibilité |

**Conclusion mesurée :** le schéma a la **forme** universelle, mais la **logique** ne connaît qu'un
seul cas — quantité fongible avec un nombre. C'est **exactement** la dette que S-01/S-02 nomment, et
elle n'est **pas** supprimée : elle est **déguisée** en vocabulaire. Les six cas fondateur (spaghetti,
brochettes, bananes, ordinateur d'occasion, zem/taxi, appartement) restent des cas **non servis** :
seul « N unités en stock » est vrai.

## 4. Ce qui rend la maquette cohérente et l'app incohérente — la même cause

Le fondateur observe : *« j'aime bien la présentation visuelle globale actuelle mais… beaucoup
d'incohérence »*. La cause est unique : **la maquette V2 décrit le cœur complet (les 4 expressions de
disponibilité, la négociation, la localisation) ; le Root/Trunk n'en implémente qu'une.** La maquette
n'est donc pas en avance sur le produit par hasard — elle est en avance parce qu'elle a été dessinée
d'après le Seed, tandis que le Root a été construit d'après l'ancienne tranche.

Ce n'est **pas** un problème de pixels. C'est un écart Root, et il ne se corrige pas par du CSS.

## 5. Retour à Founder HQ (revue, 6 réponses)

> **1. Milestone actif ?** Pilote Lomé — rendre Omni utilisable et prouvable sur le terrain.
> **2. Porte courante ?** **Root (ouverte)**. Seed V2 + Species V2 : clos, `founder-confirmed`. Trunk/Branches/Canopy : **fermés** pour alignement.
> **3. Preuve qu'on peut avancer / qu'on doit s'arrêter ?** Avancer : Seed+Species acceptés, 4 blocages Root levés, prod saine. S'arrêter : la **logique des caractéristiques** manque — toute tranche suivante la contournerait.
> **4. Plus petite action suivante, qui ?** **Décision fondateur** ci-dessous. Propriétaire : fondateur.
> **5. Track externe qui consomme de la capacité ?** Capital (pre-YC HERLOG) + YC W27 = `watch` / `user invocation required` ; aucun contact ni soumission.
> **6. Décision/risque/dépendance à revoir ?** La dette S-01/S-02 (offre universelle) et le choix de la première caractéristique à rendre *vivante*.

## 6. Décision fondateur demandée (une seule)

Root doit trancher **quelle expression de disponibilité est rendue *vivante* en premier**, parce que
c'est elle qui définit la première tranche verticale et la première preuve terrain :

| Option | Première expression | Ce que ça débloque | Coût |
|---|---|---|---|
| **A** | **Place créneau** (service : coupe, table, cours) | nouveau marché entier, « réserver un créneau » | contrat disponibilité à généraliser |
| **B** | **Position** (transport : zem/taxi) | cas fondateur explicite, offre mobile | zone/rayon mobile + temps réel |
| **C** | **Présence** (objet unique : appart, ordinateur d'occasion) | cas fondateur, marché occasion | `uniqueness_kind` + cycle de vie |
| **D** | **Négociation** (`price_kind='negociable'`) | cas fondateur, distinctif marché Lomé | état de négociation transactionnel |

**Recommandation (à valider, réversible) :** commencer par **C (présence / objet unique)**, car
`quantity_*` est déjà en place — l'écart est le plus petit, la preuve est atteignable, et il valide
l'orientation « disponibilité par caractéristique » sans nouveau sous-système. Puis **D**, qui touche
le transactionnel déjà robuste (machine à 10 états).

**Ne pas** ouvrir Trunk/Branches pour aligner l'app avant cette décision : ce serait rebâtir sur le
moule « stock comptable » que le fondateur vient précisément de mettre en cause.

## 7. Résidu honnête

- Le Seed V2 est `founder-confirmed`, mais **S-02 (« modèle universel dès jour 1 ») est `proposé`** —
  « accord fondateur requis ». Cette décision est donc **déjà ouverte** et conditionne l'option choisie.
- Le board et la Master Plan portaient une liste de blocages Root **périmée** ; réconciliés par ce document.
- Aucune preuve navigateur n'accompagne ce diagnostic : il est **documentaire + mesuré en base**, classe
  `observed`. La preuve terrain reste l'affaire de la tranche choisie.
