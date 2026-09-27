# H1-bis — Dérivation depuis Species : je réponds aux six questions (2026-09-27)

> **ID :** `H1BIS-OMNI-2026-09-27` · **Plan :** `NW-PROD-OMNI-H1-01`
> **Déclencheur fondateur :** *« tout ce que je sais c'est ce que j'ai décrit à l'étape Species ; le reste je ne suis pas un pro dev ; le but de Nature Way c'est de s'occuper de tout à partir de là. »*
> **Correction acceptée :** les questions 2–5 du document H1 étaient **mal adressées** — elles demandaient au fondateur d'arbitrer des choix **techniques** que la méthode doit **dériver**. Ce document les **répond** à partir du matériel Species (`omni-species-v2-decision-registry`, `omni-intent-brief-v2`, maquette `omni-species-v2-interactive.html`).
> **Aucun code écrit.** Les réponses sont des **dérivations**, pas des inventions : chaque ligne cite sa source.

---

## 1. La règle de méthode, respectée cette fois

> Nature Way : *« Un fondateur n'a pas besoin de connaître la liste technique à l'avance ; Nature Way doit créer et expliquer le travail. »*

Ce document **applique** cette règle. Les seules questions qui remontent au fondateur sont celles
auxquelles **aucun document ne peut répondre** : ce qui engage de l'argent déjà promis, ou ce qui
change une décision qu'il a lui-même signée.

---

## 2. Les six questions — réponses dérivées

### Q1 — Le cœur est-il toujours « c'est ça » ?

**RÉPONSE : OUI — aucune action requise.** Le cœur est défini et confirmé
(`omni-intent-brief-v2`, section « Définition du cœur », confirmée 2026-09-23) :
*« un index COMPLET et VIVANT de l'offre, interrogeable par les contraintes du chercheur. »*
Rien dans la description Species ne le contredit. **Ce n'est pas une question à poser : c'est un fait
acquis.** Le fondateur n'a rien à trancher ici.

### Q2 — Quelle contrainte de recherche d'abord ?

**RÉPONSE : elle est déjà décrite — et ce n'est pas celle que je croyais.**

La maquette que le fondateur a décrite (et qui est **acceptée**) porte un **rail de filtres de carte**,
littéralement :

```
const f = document.getElementById('filterrail');
f.innerHTML = ['Tout', 'Commerces', 'Particuliers', 'Transport'].map(...)
```

Avec **`Transport` marqué `soon`** (V1+, conforme `S-08`/`S-12`).

**Donc : la contrainte de découverte première est le TYPE D'ENTITÉ — pas un attribut de produit.**
`Tout / Commerces / Particuliers / Transport`. Le fondateur a décrit ce filtre à Species ; ce n'est pas
à lui de redire « en fait je veux filtrer par neuf/occasion ».

**Écart mesuré :** ce rail de filtres **n'existe pas dans l'app**
(`grep 'fchip|filterrail'` sur `TrunkMap.tsx`, `fallback-map.ts`, `ui-v13.css` → **0 occurrence**).
La maquette l'a ; l'app ne l'a pas.

### Q3 — « occasion » doit-il être filtrable ?

**RÉPONSE : la question était mal posée. Voici la bonne.**

Le fondateur n'a **jamais** demandé un filtre « neuf/occasion ». Il a décrit un filtre **« Particuliers »**.
Or `S-13`/`S-28` disent qu'**un particulier EST une entité** (même objet qu'un commerce) et `S-01` dit
que « l'occasion » est une **caractéristique d'offre**.

**Conséquence, dérivée sans arbitrage :** filtrer la carte sur **`Particuliers`** sert le cas 4 fondateur
(ordinateur d'occasion) **par l'entité qui publie** — sans avoir besoin d'un filtre d'attribut
« neuf/occasion ». Les deux ne s'excluent pas, mais **le filtre d'entité est celui que le fondateur a
décrit**, et il est **absent de l'app**.

**Ce qui reste (petit) :** la **recherche** par état (`condition_kind`) reste non filtrante — mais elle
n'est **pas réclamée par la maquette acceptée** (`chip('État / condition', false, true)` = désactivée) et
**pas décrite par le fondateur**. → **Ce n'est pas un défaut à corriger maintenant. C'est un raffinement
ultérieur, à ne pas confondre avec un manque du cœur.** Ma conclusion de H1 était donc **trop sévère** :
j'ai appelé « défaut réel » ce que le fondateur n'a jamais demandé.

### Q4 — Compléter le modèle ou peupler ?

**RÉPONSE : ni l'un ni l'autre tel que posé. D'ABORD : rendre visible ce qui existe déjà.**

Dérivation : le modèle porte les cas (H1 §2.1). Les données sont quasi vides (10 offres, 0 particulier).
Le filtre de découverte décrit par le fondateur est **absent de l'app**. Donc :

- **« Compléter le modèle »** → non : il n'y a **aucune** dette de modèle mesurée (S-01/S-02 ont bien
  supprimé la dette nommée).
- **« Peupler un quartier »** → **c'est le vrai besoin** (`omni-intent-brief-v2` : *« un quartier de Lomé
  (plus petit = plus prouvable) »*), **mais** peupler maintenant, avec un rail de filtres absent, ne
  servirait à rien : l'acheteur ne pourrait pas filtrer « Particuliers ».
- **Ordre correct, dérivé :** **1.** rendre la carte filtrable (`Tout / Commerces / Particuliers`, `Transport` en `soon`) — c'est **petit** et c'est **déjà décrit** ; **2.** puis peupler un quartier réel.

### Q5 — Qu'est-ce qui est hors cœur pour le pilote ?

**RÉPONSE : dérivable sans le fondateur — le Seed dit déjà V1+.**

`omni-intent-brief-v2`, « Non-goals (V1) » + registre Species, tranches `V1+` :

| Construit | Statut dérivé |
|---|---|
| Crédits bulk / packs | **garder** (boucle F confirmée) mais **non requis** pour le 1er vendeur réel |
| Pro vendeur ($10) | confirmé, affiché ; **non requis** pour peupler |
| Pro acheteur ($5) | confirmé ; **non requis** pour peupler |
| Campagnes sponsorisées | confirmé ; **non requis** pour le 1er vendeur |
| Analytics vendeur | confirmé ; **non requis** |
| Équipes / zones | gouvernance ; **non requis** |
| Routage Mapbox | **`S-15-exception` — déjà tranché par le fondateur (SP-9)** : ne PAS poser le jeton, étiqueter honnêtement, OSRM conservé (coût 0) |
| Transport A→B | **`V1+` explicite** (S-12) |

**Conclusion :** la question « qu'est-ce qui est hors cœur » **n'a pas besoin du fondateur** — le Seed
la tranche déjà. Aucun de ces éléments ne sert le **premier vrai vendeur** ; aucun n'est à démolir (ils
sont livrés et prouvés), ils sont simplement **hors du chemin critique du pilote**.

### Q6 — « Si Omni l'avait demain, tu dirais : là, c'est Omni. »

**RÉPONSE : déjà décrite, mot pour mot, par le fondateur à Species.**

`omni-intent-brief-v2`, « Première preuve » (confirmée) :

> **Trajet de première preuve :** un **commerce réel** à Lomé (offres + disponibilité tenue fraîche)
> **et** un **particulier réel** (offre unique, son propre objet) → un **acheteur réel hors équipe**
> cherche par contraintes → trouve **plusieurs** offres (pas seulement son commerce connu) → voit le
> « maintenant » → transige en **QR tracé** → l'**événement de stock** bouge.
>
> **Périmètre géographique :** **un quartier de Lomé** (plus petit = plus prouvable).

**Et l'hypothèse-test que le fondateur a lui-même nommée :**
> **H1 — Vivant** : un vendeur réel tient-il sa disponibilité fraîche ? *Si non : le « maintenant » meurt,
> Omni = Google Maps.*
> **H2 — Contact absorbé** : l'acheteur cherche-t-il au lieu d'appeler ? *Si non : la valeur du cœur disparaît.*

**Donc : la phrase que je « ne pouvais pas deviner » était écrite depuis le 2026-09-23.** Je ne l'avais
pas relue. **C'est exactement la faute que H1 doit empêcher — et je l'ai commise en écrivant H1.**

---

## 3. Auto-correction : ce que H1 a mal fait

| Faute dans H1 | Correction |
|---|---|
| J'ai posé 4 questions **techniques** au fondateur | La méthode les **dérive** ; je les ai dérivées ici (§2) |
| J'ai appelé « défaut réel » l'absence de filtre `condition_kind` | Le fondateur **n'a jamais demandé** ce filtre ; la maquette acceptée le **désactive**. C'était **mon** goût technique, présenté comme un manque produit |
| J'ai dit que je ne pouvais pas deviner Q6 | Elle était **écrite** dans le brief confirmé. Je ne l'avais pas relu. |
| J'ai proposé un acte (« peupler » **ou** « filtre) | L'ordre correct est **dérivé** : d'abord la carte filtrable (déjà décrite), ensuite peupler |

**Ce défaut est le même que ceux que H1 dénonce — mémoire non relue, goût technique substitué à
l'intention.** Il est consigné, pas corrigé en silence.

---

## 4. Le défaut réel, enfin correctement nommé

**Trouvé en lisant la maquette décrite par le fondateur :**

> **S-07 — « Carte et recherche = deux vues d'un seul corpus ; la carte est filtrable »**
> Maquette : rail `Tout / Commerces / Particuliers / Transport` (`Transport` = `soon`).
> **App : 0 occurrence.** Le rail n'existe pas.

Le registre Species marque S-07 **« OK (corrigé) — les filtres de carte existent »** : **cette ligne
mesure la MAQUETTE, pas l'app.** Le filtre existe dans le HTML accepté ; il **n'a jamais été porté dans
l'app**. Comme `R-B` (code livré / donnée vide), comme `facility_type` (colonne neuve / données d'août) :
**la maquette est en avance sur l'app, et la mémoire confond les deux.**

**Et ce filtre est exactement celui dont la première preuve a besoin** : filtrer `Particuliers` est ce qui
rend le cas « particulier vend son ordi d'occasion » **découvrable**. Sans lui, peupler un quartier avec
des particuliers **ne les rendrait pas trouvables**.

---

## 5. Un seul acte, dérivé — pas six questions

| # | Acte | Source (pas mon goût) | Taille |
|---|---|---|---|
| **1** | **Porter le rail de filtres carte** `Tout / Commerces / Particuliers / Transport` (`Transport` = `soon`, tooltip honnête) dans l'app | **S-07** + maquette acceptée (`filterrail`) + `S-13`/`S-28` (entité) | petit : un filtre client sur `facilityType`/`entityKind` |
| **2** | **Peupler un quartier de Lomé** : ≥1 commerce réel + ≥1 particulier réel + 1 acheteur réel | `omni-intent-brief-v2` « Première preuve » | humain — **le fondateur ou un agent terrain** |

**Acte 1 est du code ; acte 2 est du terrain.** L'acte 1 **ne dépend d'aucune décision fondateur** (il est
décrit à Species). L'acte 2 dépend du fondateur (il faut un vrai vendeur).

**Recommandation, en une ligne :** exécuter **l'acte 1** (petit, dérivé, non ambigu), puis **l'acte 2**
avec un vrai vendeur d'un quartier de Lomé.

---

## 6. Handoff à Founder HQ

> **Porte courante :** `ROOT` (ouverte)
> **Correction :** les questions techniques de H1 sont **retirées** — elles ont été **dérivées** depuis Species
> **Défaut réel (nouveau, mesuré) :** **le rail de filtres carte `Tout / Commerces / Particuliers / Transport` (S-07), décrit et accepté à Species, est ABSENT de l'app** (0 occurrence) — le registre Species le déclarait « OK » parce qu'il mesurait la **maquette**, pas l'app
> **Ce défaut bloquait la première preuve** : sans filtre `Particuliers`, le cas « particulier vend son ordi d'occasion » n'est pas découvrable
> **Actes dérivés :** (1) porter le rail de filtres — **code, aucune décision fondateur requise** ; (2) peupler un quartier réel — **humain, requiert un vrai vendeur**
> **Décisions fondateur réellement requises (les seules) :** **UM-6** (bonus : 20 $ ou 2 000 F — argent promis) · **UM-2…5** (autoriser la fenêtre base+code pour `058`) · confirmer H1–H4 comme règles de discipline
> **Prochaine plus petite action :** l'acte 1 (rail de filtres carte), sur ordre

**Resource Receipt :**

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded (état de référence) | `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` · `docs/nature-way/omni-species-v2-decision-registry-2026-09-23.md` · `docs/maquette/omni-species-v2-interactive.html` (`filterrail`) · `docs/nature-way/omni-founder-mission-contract-2026-09-26.md` · `docs/nature-way/omni-h1-intention-relecture-2026-09-27.md` |
| Not loaded / reason | `templates/intent-brief.md` (brief V2 confirmé — pas de réécriture) |

**Mesuré (lecture seule) :** `grep 'fchip|filterrail'` sur `TrunkMap.tsx` + `fallback-map.ts` + `ui-v13.css` → **0** ; maquette `filterrail` → `Tout / Commerces / Particuliers / Transport` présents.
