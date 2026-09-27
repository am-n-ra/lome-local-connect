# H1 — Relecture d'intention : « est-ce toujours ça, Omni ? » (2026-09-27)

> **ID :** `H1-OMNI-2026-09-27` · **Plan :** `NW-PROD-OMNI-H1-01`
> **Déclencheur :** fondateur — *« go »* sur la proposition H1 (*la relecture d'intention prime sur le backlog*)
> **Porte :** `ROOT` (ouverte) · Species V2 close 2026-09-25
> **Méthode :** lire l'intention **confirmée**, la mesurer contre la **base canonique** et le **code réel**, ne rien réinventer.
> **Aucun code écrit.** Cette relecture **décide** ce qui mérite du code.

---

## 1. L'intention, telle qu'elle a été confirmée (pas réinventée)

> **`omni-intent-brief-v2-2026-09-23.md`, « Définition du cœur », confirmée par le fondateur :**
>
> **Omni = un index COMPLET et VIVANT de l'offre, interrogeable par les contraintes du chercheur
> — pour supprimer la recherche, le contact et la comparaison à la main.**
> - **COMPLET** : « qui a ça ? » — toute l'offre, toutes entités.
> - **VIVANT** : « qui l'a maintenant ? » — état connu à l'instant T, fenêtre de fraîcheur unique.
> - **INTERROGEABLE** : « près de moi, maintenant, tel prix, telle quantité, **tel état** — sans appels. »

**Et la racine du raté précédent, écrite noir sur blanc :** *« l'architecture actuelle ne couvre qu'une
tranche — Facility → produit → stock comptable. Toute offre hors de ce moule (occasion, appart, coupe,
zem, digital) casse le schéma. C'est la dette de base que S-01/S-02 suppriment. »*

**Ce que je dois donc vérifier :** est-ce que la dette nommée est **vraiment** supprimée — et le cœur
**vraiment** servi ? Pas « le code existe » : est-ce que **ça marche pour un acheteur réel**.

---

## 2. Mesure — le cœur, mot par mot, contre la base canonique (`br-dawn-hill-am5amy22`, 2026-09-27)

### 2.1 « COMPLET » — le modèle, puis l'usage

| Question du cœur | Modèle | Code | Réalité live |
|---|---|---|---|
| Une offre peut-elle être un **objet unique** (ordi d'occasion) ? | ✅ `uniqueness_kind = piece_unique` | ✅ écrit, lu (`toProduct`), affiché (« Pièce unique — disparaît après vente ») | **0 offre** |
| Une offre peut-elle être **d'occasion** ? | ✅ `condition_kind = occasion` | ✅ écrit, lu, affiché | **0 offre** (`neuf` ×3) |
| Une offre peut-elle être **mobile / digitale** ? | ✅ `facility_type = mobile/digital` | ✅ formulaire + écriture (migration 044) | **0/206 facilités** (colonne `null`) |
| Une **personne seule** peut-elle offrir sans structure ? | ✅ `entity.kind = individu` | ✅ chemin livré (R-D, prouvé E2E) | **0 entité** `individu` |
| **Verdict `COMPLET`** | **✅ le modèle EST Omni** (la dette de base est bien supprimée) | **✅ les chemins existent** | **❌ l'usage est quasi nul** — 10 offres publiées, toutes « renouvelable / fixe / commerce » |

**Lecture honnête :** S-01/S-02 n'étaient **pas** des slogans — le modèle porte réellement les cas qui
cassaient l'ancienne architecture. Mais **rien de réel ne l'exerce encore** : la seule façon dont le
modèle « complet » est démontré, c'est **3 offres créées par une preuve automatisée** (R-D).

### 2.2 « VIVANT » — l'état maintenant

| Mesure (10 offres publiées) | Valeur |
|---|---|
| fenêtre de fraîcheur **vivante** (`expires_at > now`) | **3** |
| expirée | 0 |
| **sans fenêtre du tout** (`expires_at IS NULL`) | **7** |
| `en_stock` / `a_valider` | 3 / **7** |

**Lecture honnête :** **7 offres sur 10 ne prétendent rien sur le « maintenant »** (`a_valider`) — ce qui
est **conforme** (« aucune promesse de stock »). Mais cela signifie que **le cœur « VIVANT » n'est
démontré que sur 3 offres**, toutes issues de preuves automatisées.

### 2.3 « INTERROGEABLE PAR CONTRAINTES » — **c'est ici qu'est le défaut réel**

Contraintes que la recherche **sait** filtrer : `texte · catégorie · quantité · budget (devise-aware) · rayon · ouvert`.

Contraintes que le Seed nomme et que la recherche **ne sait pas** filtrer :

| Contrainte du cœur | Colonne existe ? | Valeur portée par des offres ? | **Filtrable en recherche ?** |
|---|---|---|---|
| **« tel état »** (`occasion` vs `neuf`) | ✅ `condition_kind` | ✅ 3 offres | **❌ NON** |
| `uniqueness_kind` (pièce unique) | ✅ | ✅ 3 offres | **❌ NON** |
| `price_kind` (négociable) | ✅ | ✅ 3 offres | **❌ NON** |
| `handover_kind` (retrait/livraison) | ✅ | ✅ 3 offres | **❌ NON** |

**C'est le défaut le plus lourd de cette relecture.** Le cas fondateur **4 (ordinateur d'occasion)** —
que le Seed classe **« plein »** — est **impossible à servir** aujourd'hui : un acheteur **ne peut pas
chercher « occasion »**. Il peut taper « ordinateur » (texte) et **espérer** tomber sur une occasion parmi
des neuves. La contrainte la plus **définissante** d'Omni (l'offre qui n'est pas un produit de rayon) est
**invisible à la recherche**.

**Nuance qui compte :** la maquette acceptée **désactive** les chips `'État / condition'` et `'Créneau'`
(`chip('État / condition', false, true)`). Le registre Species classe donc cette absence comme
**« endettée par conception »**, pas comme un oubli. **Mais la maquette n'est pas le Seed** : le Seed
dit « tel état » dans la définition du cœur. **Il y a là une contradiction réelle entre la maquette
acceptée et l'intention confirmée — et c'est exactement ce que le fondateur appelle « incohérence dans
ce qu'on veut faire ».**

---

## 3. Le schéma qui se répète — trois fois en une relecture

Chaque ligne de la mesure 2.1 porte **le même motif** : *modèle ✅ · code ✅ · données ❌*, et la donnée
manque **pour une raison de seed/fixture**, jamais de capacité :

| Constat | Cause mesurée |
|---|---|
| **0/206 facilités ont un type** | la colonne `facility_type` date du **13 sept** (migration 044) ; les **3** facilités `created` datent du **23–29 août** → **antérieures**. Les 203 autres sont des `public_import` **sans propriétaire**. |
| **0 entité `individu`** | le chemin a été livré le **26 sept** (R-D) ; aucun vrai vendeur particulier ne s'est déclaré depuis (constat R-D, assumé et honnête). |
| **0 offre `occasion` / `piece_unique`** | idem — aucune offre réelle créée par un vendeur depuis que les colonnes existent. |
| **`×100` d'août, devise mélangée, offres orphelines** | même famille : **des fixtures prises pour des données réelles**. |

**Conclusion structurelle n°1 :** Omni n'a pas un problème de **modèle** — il a un problème de
**peuplement**. Ce qui existe en base est un **échafaudage d'août** (imports, démo, seeds) auquel on a
**ensuite** ajouté le modèle V2. **Le modèle est en avance sur les données de plusieurs semaines.**

**Conclusion structurelle n°2 :** le seul défaut **de code** de toute cette relecture est la **recherche
par état** — et il est **petit** (le schéma et les données sont prêts ; il manque le filtre).

---

## 4. Ce que ça change dans l'ordre des tranches

La liste des « finitions » (inventaire du 2026-09-25) et la mesure du jour **ne disent pas la même
chose** :

| Source | Ce qu'elle recommande | Problème |
|---|---|---|
| Inventaire `omni-root-finishing-inventory-2026-09-25.md` | finir `R-B` → `R-E`, puis aligner l'app | **`R-B`/`R-E` sont livrés** ; l'alignement est livré ; recommande de « finir » du déjà fini |
| Mesure du 2026-09-27 (ce document) | **2 actes seulement** : (1) **filtre de recherche par état** (`condition_kind` d'abord) ; (2) **peupler pour de vrai** (vrais vendeurs, pas de fixtures) | — |

**Ce n'est pas un hasard si l'inventaire est faux :** il compte des **tranches**, la mesure compte un
**cœur servi**. Une tranche « faite » (code écrit) et un cœur « servi » (un acheteur peut filtrer
« occasion ») sont **deux choses différentes** — et c'est précisément le glissement que H1 corrige.

---

## 5. Les six questions — la relecture proprement dite

> Répondre **oui** / **non** / **« non, c'est pas ça »**. Ne pas chercher la bonne réponse : dire la vraie.

**Q1 — Le cœur est-il toujours « c'est ça » ?**
*« Un index complet et vivant de l'offre, interrogeable par les contraintes du chercheur. »* —
Oui / Non / à amender (quoi ?).

**Q2 — La contrainte que TU cherches en premier, c'est laquelle ?**
distance · disponibilité maintenant · **état (neuf/occasion)** · prix · quantité · autre.
*(Pourquoi ça compte : la recherche ne sait filtrer que 4 des 6. Savoir laquelle est la première
décide ce qu'on répare d'abord.)*

**Q3 — « occasion » doit-il être filtrable ?**
Le cas 4 fondateur (ordinateur d'occasion) est **impossible à servir** aujourd'hui : on ne peut pas
chercher « occasion ». La maquette acceptée **désactive** cette chip.
→ **On construit le filtre, ou on assume que « occasion » n'est pas une contrainte de recherche ?**
*(C'est LA contradiction maquette ↔ Seed de cette relecture.)*

**Q4 — Compléter ou peupler ?**
Le modèle est en avance sur les données de plusieurs semaines. → **On continue le modèle (Root/Trunk),
ou on arrête tout et on peuple un quartier de Lomé avec ~20 vrais vendeurs ?**
*(Le Seed lui-même dit : « Vivant : un vendeur réel tient-il sa disponibilité fraîche ? *Si non : le
"maintenant" meurt, Omni = Google Maps.* »)*

**Q5 — Qu'est-ce qui est HORS cœur pour le pilote ?**
On a construit : wallet/FedaPay, crédits bulk, Pro vendeur, Pro acheteur, campagnes publicitaires,
analytics, équipes/zones, routage Mapbox. **Lesquels ne servent PAS le premier vrai vendeur ?**
*(À déclarer explicitement hors périmètre pour le pilote, plutôt que de les maintenir.)*

**Q6 — La phrase que je ne peux pas deviner.**
**Si Omni l'avait demain, tu dirais « là, c'est Omni ». Quoi ?**
*(C'est la seule question dont la réponse n'est dans aucun document.)*

---

## 6. Handoff à Founder HQ

> **Porte courante :** `ROOT` (ouverte) — **aucun code produit tant que Q1–Q6 ne sont pas rendues**
> **Mesure décisive :** `COMPLET` = modèle ✅ / usage quasi nul · `VIVANT` = 3/10 · `INTERROGEABLE` = **état non filtrable**
> **Défaut de code réel (le seul) :** la recherche **ne filtre pas `condition_kind`** — le cas fondateur 4 (« ordinateur d'occasion », classé **plein** par le Seed) **ne peut pas être servi**
> **Contradiction mesurée :** la maquette acceptée **désactive** la chip « État / condition » ; le Seed la met dans la **définition du cœur** → arbitrage fondateur (**Q3**)
> **Cause commune des 5 écarts :** le schéma V2 est **postérieur de plusieurs semaines** aux données d'août (fixtures/imports pris pour du réel) → **ce n'est pas un problème de modèle, c'est un problème de peuplement**
> **Prochaine plus petite action :** les **six questions** ci-dessus → puis **un seul** acte : soit le **filtre `condition_kind`**, soit **peupler un quartier réel**
> **Travail délibérément non actif :** toute tranche Root/Trunk nouvelle · Canopy/Ring · Gate 7 · Fundraising/Opportunité (`watch`)

**Resource Receipt :**

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded (état de référence) | `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` · `docs/nature-way/omni-founder-mission-contract-2026-09-26.md` · `docs/founder-hq/current-state.md` · `docs/nature-way/omni-root-finishing-inventory-2026-09-25.md` |
| Not loaded / reason | `templates/intent-brief.md` (le brief V2 existe et est confirmé — pas de réécriture) · `templates/system-dependency-map.md` (SDM V2 à jour) |

**Mesuré sur (canonique, lecture seule) :** `br-dawn-hill-am5amy22` — 10 offres publiées, 3 vivantes, 0 occasion, 0 `piece_unique`, 0/206 `facility_type`, 0 entité `individu`, 3/16 offres à caractéristiques complètes.
