# Seed V2 — audit de clôture (le Seed est-il vraiment fini ?)

> **ID :** `SEED-CLOSURE-AUDIT-2026-09-26`
> **Autorité :** `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (Seed V2)
> **Phase :** porte courante = **Root** (ouverte) · Species V2 close `founder-confirmed` 2026-09-25
> **Déclencheur :** question fondateur — « après Seed on devait aller à Root non ? mais as-tu fini Seed au moins ? »
> **Méthode :** mesure du document, du registre et de la base canonique. **Aucune ligne de code modifiée.**
> **Handoff :** `HO-OMNI-24`

---

## 1. La séquence était bien Seed → Species → Root

Vérifié dans le Master Plan (table des portes) :

| Porte | Statut | Note |
|---|---|---|
| 1 — Seed + SDM | `done` (V1 2026-09-02) → **SUPERSEDED : Seed V2 re-clos 2026-09-23** | |
| 2 — Species | `done` (V1) → **ROUVERTE 2026-09-23 → CLOSE `founder-confirmed` 2026-09-25** | validation fondateur de `SP-1…SP-10` |
| 3 — Root | `done` (V1) → **Root V2 exécuté** (`058`→`061`) | porte courante |

**Réponse : oui.** Après le Seed venait Species, puis Root — et les deux ont effectivement été faits. La mémoire du fondateur est juste. La porte courante **est** Root.

## 2. « As-tu fini Seed au moins ? » — **oui comme intention, avec deux dettes mesurées**

Le Seed V2 a reçu un « c'est ça » du fondateur (2026-09-23). Le cœur est **réellement confirmé** : `S-01`, `S-03`, `S-04`, `S-05`, `S-11`, `S-13`, `S-14`, `S-25`… et `S-02` (« modèle universel dès jour 1 ») est **confirmé définitivement** au §« Recommandations de fermeture des points ouverts » (ligne 134 du brief).

**Deux défauts mesurés subsistent** — ils ne rouvrent pas le Seed, ils le **nettoient**.

### Défaut 1 — le compte « 34 décisions `S-01…S-34` » est **faux**

`S-33` et `S-34` **n'existent nulle part** (`grep` sur `docs/` et `.agents/` : 0 occurrence). Le brief contient **`S-01…S-32`**, et le registre Species en dénombre **32**.

L'erreur est identifiable et mesurée, ligne par ligne. La table contient **34 lignes** de la forme `| **S-xx** |` :

| Bloc | Lignes |
|---|---|
| `S-01`…`S-31` | **32** lignes — mais `S-02` est écrit **deux fois** (ligne 60 « proposé », ligne 134 « **Confirmé définitivement** ») ⇒ **31 identifiants distincts** |
| `S-1`, `S-2` (points ouverts, numérotation à un chiffre) | **2** lignes |
| **Total** | **34 lignes** |

Et `S-32` n'est **pas** une ligne de table : c'est un **titre de section** (`### S-32`). Le brief porte donc **32 identifiants `S-01…S-32`** répartis sur 34 lignes de table.

Quelqu'un a lu le **nombre de lignes (34)** comme la **borne des identifiants** → « `S-01…S-34` ». La fourchette a été recopiée dans **~10 documents**.

**Un chiffre faux recopié dix fois n'est pas une source de vérité — c'est dix copies d'une erreur.** Corrigé dans tous les documents le 2026-09-26, et verrouillé par une garde `check:state` falsifiée.

### Défaut 2 — deux décisions **confirmées** n'ont **aucune** implémentation

| Décision | Statut dans le Seed | Mesuré en base / code |
|---|---|---|
| **`S-06`** — échelle d'existence 0→4 (`Discoverable ≠ Queryable ≠ Available ≠ Transactable`) | **confirmé** | **0 occurrence** (`existence_scale`/`existenceScale`/`presence_level` : 0 en serveur/schéma). `Transactable` n'apparaît que dans un **commentaire** expliquant pourquoi il est *absent* de `search-constraints.ts`. |
| **`S-32`** — intégrité **et** réputation **de l'OFFRE** | **`CONFIRMÉ (a)`** | **0 occurrence** (`integrity_kind`/`integrity_state`/`offer_reputation` : 0). Vérifié aussi la table `v2_ratings` (`001_v2_roots.sql:273`) : elle est **scopée à la transaction** (`transaction_id unique`), **pas à l'offre** — donc la réputation par offre de `S-32` n'existe pas. |

`S-06` est la **grammaire d'état** que le Seed désigne comme squelette de la découverte ; `S-32` est une décision **explicitement confirmée avec son option retenue**. **Une décision confirmée et non construite est une dette de Seed, pas une dette de Trunk** — et c'est précisément le genre d'écart que le fondateur ressent comme « le fond n'est pas là ».

### Note — un artefact de sortie manque (défaut de forme, pas de fond)

La méthode cite un **founder mission contract** parmi les sorties possibles du Seed. Il n'existe pas (`find docs -iname "*mission*"` : rien), et les PRD présents sont **antérieurs** au Seed V2. Ce n'est **pas** un blocage : le brief joue ce rôle. À écrire ou à retirer explicitement comme exigence.

## 3. Ce que cet audit ne remet PAS en cause

- Le **cœur** du Seed est confirmé et cohérent — **y compris `S-02`**.
- **Species V2** est close sur **validation fondateur explicite** (`SP-1…SP-10`).
- **Root V2** a réellement été exécuté (`058`→`061`) : entité, `facility_id` nullable, `entity_id`, Pro par entité, seuils par volume (`C-1…C-7` clos).
- `S-06`/`S-32` n'ont **jamais** été construits : ce ne sont pas des régressions.

## 4. La correction la plus petite

**Ne pas rouvrir le Seed.** Le cœur est confirmé et Species/Root ont avancé dessus. Deux actes bornés suffisent :

| # | Acte | Owner | Effort |
|---|---|---|---|
| 1 | Fourchette corrigée `S-01…S-32` partout — **FAIT 2026-09-26** + garde `check:state` falsifiée | Nature Way | ✅ |
| 2 | `S-06` et `S-32` : soit **planifiés** comme tranches Root, soit **explicitement différés** avec trigger écrit | **fondateur** | 1 décision |
| 3 | Founder mission contract : l'écrire **ou** le retirer comme exigence | fondateur + Nature Way | petit |

**Trigger de révision :** dès que la décision 2 est rendue, ce registre est clos et Root continue sans dette de Seed.

## 5. Note d'honnêteté — j'ai commis l'erreur que je documentais

La **première version de ce document** affirmait un « Défaut 1 : `S-02` reste *proposé — accord fondateur requis* ». **C'était faux.** J'avais lu la **ligne 60** (la table des décisions) **sans lire le reste du document** — où la **ligne 134** tranche : « **S-02 — Confirmé définitivement** ».

C'est exactement la faute documentée deux fois cette session : *citer une preuve sans la lire*. La table listait un statut **antérieur**, le document portait la **résolution**. Un statut dans une ligne n'est pas l'état du document.

**Leçon :** avant d'affirmer qu'un document est incohérent, le **lire en entier** — sinon l'audit devient la source d'incohérence.
