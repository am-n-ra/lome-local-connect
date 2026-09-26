# Handoff receipt — `HO-OMNI-21` (Founder HQ → Nature Way)

> **As of :** 2026-09-26 · **Porte :** `SPECIES_CLOSED_ROOT_OPEN` · **Branche :** `omni-v2-rebuild`
> **HEAD :** `5d58279` (poussé) · **Prod :** `index-DbI_Z1Vt.js` === build local (T-07d ✅)

---

## 1. Déclencheur fondateur (verbatim)

> *« j'ai essayé de finir omni ces dernières semaines avec OpenHands mais leur IA ne m'a pas arrangé ;
> on a assez tourné en rond et je pense qu'on a raté tout le process depuis Species… même si j'aime
> bien la présentation visuelle globale actuelle, mais tout le fond et la logique qui doit faire de
> Omni Omni n'est pas là, et même il y a beaucoup d'incohérence dans ce qu'on veut réellement faire
> et proposer. »*

---

## 2. Dispatch Record

| Champ | Valeur |
|---|---|
| **Objectif classé** | Diagnostic de process + reprise de livraison sur un produit existant |
| **Autorité primaire** | `/nature-way` (via `/nature-way-founder-hq` comme porte d'entrée et propriétaire du plan) |
| **Activation** | `activated` — les deux skills sont présents (`.agents/skills/nature-way*/SKILL.md`) et ont piloté cette passe |
| **Handoff secondaire** | aucun (le produit reste la seule porte ouverte ; capital/opportunité restent `watch`) |
| **Réversibilité** | élevée — aucun changement de schéma, aucune donnée détruite, aucune décision produit prise à la place du fondateur |
| **Information manquante** | décision fondateur sur `SP-V2-01` ; priorité fondateur sur l'alignement app ↔ maquette |

---

## 3. Réponse mesurée — ce qui est vrai, ce qui est faux

La méthode interdit de répondre « tout va bien » **et** « tout est à refaire ». Séparation :

| Affirmation fondateur | Mesure | Verdict |
|---|---|---|
| « on a tourné en rond » | **Vrai — et la cause est nommée** : le produit n'a pas bouclé, **notre mémoire du produit** a bouclé. Le socle a été reconstruit (`058`→`061`) et les documents d'état ne l'ont pas suivi → chaque reprise repartait d'une carte périmée. **Cette session en a reproduit un cas, mesuré :** la réconciliation écrite à **01:10** recommandait « finir `R-B` en premier » ; le code de `R-B` était livré depuis **00:05** (`bfc3b7c`). **Le document qui diagnostiquait « on a perdu la carte » avait lui-même perdu la carte — d'une heure.** | **CONFIRMÉ** |
| « on a raté tout le process depuis Species » | **Partiellement faux.** Seed V2 (`S-01…S-32`) et Species V2 (74 écrans, 27/27 conforme, `NON MESURÉ = 0`) sont **réels et validés** par le fondateur (2026-09-25). Ce qui a été raté n'est pas le *process* mais sa **synchronisation** : Root a avancé sous une Species non encore conforme (incidents **2026-09-23** et **2026-09-24**, tous deux enregistrés dans `current-state.md`), puis la mémoire est restée en retard. | **PARTIEL** |
| « j'aime bien la présentation visuelle globale » | **Vrai** — `check:maquette` : 74 écrans, 5 niveaux, registre honnête, 0 doublon. La **maquette** est `pilot-ready`. | **CONFIRMÉ** |
| « le fond et la logique qui font d'Omni Omni ne sont pas là » | **Vrai, chiffré.** Les **caractéristiques d'offre** (cœur S-01/S-02 — « tout est offre, le type est une caractéristique ») : **code livré** mais **usage vide** — `condition_kind`/`handover_kind`/`price_kind`/`uniqueness_kind` = **0/16** en données. **Le formulaire vendeur n'a jamais servi.** Un particulier, un ambulant, un objet d'occasion, un digital **ne peuvent pas se décrire**. | **CONFIRMÉ** |
| « beaucoup d'incohérence dans ce qu'on veut faire » | **Vrai, et ce ne sont PAS des incohérences d'intention.** 0 incohérence Seed ↔ socle (mesuré, `check:coherence`). Ce sont des **contradictions d'exécution** : `SEARCH_CONSTRAINTS` (`TrunkAppV13.tsx:103`) porte encore `'Quantité 10'`/`'≤ 15 000 FCFA'` **figés** et `OMNI_DEFAULT_LOCAL_CURRENCY` **en dur**, alors que **D-CON-1…5** (approuvées) exigent des **seuils réglables** et **D-LOC** une devise **par localisation**. **L'app contredit des décisions approuvées.** | **CONFIRMÉ** |

**Le verdict fondateur est donc juste sur le fond.** La cause n'est pas « l'IA n'a rien fait » — c'est
qu'**on a construit en largeur avant d'avoir fini en profondeur**, puis qu'**on a perdu la carte**.

---

## 4. Livré dans cette passe

| Livrable | Preuve |
|---|---|
| **`R-E` (S-11) — recherche à deux niveaux + page publique d'entité** (`27a1661`) | La tranche que le Seed désigne comme « **test de non-régression obligatoire au Root** » ; **totalement absente** avant (0 occurrence de `searchLevel` dans `src/`). Routes publiques `GET /api/v2/public/entities` + `/:id`. |
| **3 invariants falsifiés** | `E-2` contact avant intention → **2 tests échouent** · `E-5` filtre au mauvais niveau → **1** · `D-01` `certified` interne → **1**. Restaurés ensuite. |
| **Preuve navigateur prod** | bascule de niveau, résultats d'entité, page d'entité (`Confirmée`, 3 offres réelles), **aller-retour offre ↔ entité**, `404`/`400` corrects, **aucune clé de contact** dans la réponse. |
| **Garde anti-dérive** (`scripts/check-state.mjs`) | échoue si un document présente une tranche **livrée** comme *à faire*. **Falsifiée** : restaurer la phrase périmée → **2 FAIL exit 1**. |
| **Corrections de mémoire** | `PF-08` (affirmait « 0 écriture en code », écrit **avant** `bfc3b7c`) → **partiel** ; verdict de maturité ligne Root ; board ; master plan ; `AGENTS.md` ; `PF-09` ajouté pour `R-E`. |

**Vérifications :** **70 files / 616 tests**, `tsc` clean, `state`/`docs`/`maquette`/`coherence`/`boundary` verts.

---

## 5. Ce qui n'est PAS prouvé (résidus honnêtes)

- **Aucun test automatisé de l'UI** pour `R-E` — la preuve UI est un passage navigateur prod manuel, reproductible mais non instrumenté.
- **`ROOT_READ_PATH_DATABASE_URL` absent du sandbox** → le script de preuve étendu n'a pas été lancé ici ; les deux corps SQL ont été prouvés **directement** sur la branche canonique (même risque couvert : compilation Postgres).
- **`SP-V2-01`** (2 lieux visibles portant 3 offres sans propriétaire → la demande expire en 15 min sans réponse possible, 0 crédit payé) : **décision fondateur**, pas une correction technique.
- **Verdict de maturité maintenu : `prototype`, PAS `pilot-ready`.** La **maquette** est `pilot-ready` ; **l'app** non. Confondre les deux est exactement ce que la méthode interdit.

---

## 6. Handoff à Founder HQ

> **Milestone actif :** boucle V1/V2 pilot-ready sur Lomé, **alignée sur la maquette acceptée**
> **Porte courante :** `ROOT` (Species V2 close `founder-confirmed` 2026-09-25 — **non rouverte**)
> **Verdict de maturité :** `prototype` — trigger = fin de l'alignement app
> **Corrigé et prouvé :** `R-E`/S-11 livré en prod ; garde anti-dérive falsifiée ; mémoire réconciliée (board, master plan, `AGENTS.md`, `PF-08`, verdict de maturité)
> **Décision fondateur requise :** (1) `SP-V2-01` — retirer ou rattacher les 3 offres orphelines ; (2) **confirmer l'ordre** : alignement app ↔ maquette d'abord ?
> **Prochaine plus petite action :** **aligner l'app sur les décisions déjà approuvées** (seuils `seuil` réglables + devise par localisation `D-LOC` + filtre budget devise-aware). C'est **ce que le fondateur voit**, et l'app **contredit aujourd'hui des décisions qu'il a approuvées**.
> **Travail délibérément non actif :** Canopy/Ring, Venture Lifecycle (`watch`), Fundraising/Opportunité (`watch`), rouvrir Seed/Species (**non recommandé**)
> **Trigger de re-plan :** le fondateur rejette une finition · l'alignement révèle que `public.markets` doit être écrite en base · incident prod nouveau

**Resource Receipt :**

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded (état de référence) | `docs/founder-hq/current-state.md` · `founder-hq-master-plan.md` · `founder-hq-board.md` · `hq-reconciliation-2026-09-26.md` |
| Loaded (état de référence) | `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` · `omni-proof-register-v2-2026-09-25.md` · `omni-maturity-verdict-2026-09-25.md` · `omni-search-constraints-decisions-D-CON-2026-09-25.md` |
| Loaded (contrat + preuve) | `omni-root-v2-two-level-search-contract-2026-09-26.md` · `omni-root-v2-two-level-search-evidence-2026-09-26.md` |
| Not loaded / reason | `templates/founder-hq-master-plan.md` — plan existant, append suivi (pas de réécriture) · `templates/skill-handoff-receipt.md` — format suivi de `HO-OMNI-20` · `portability-protocol.md` — aucune migration d'espace de travail |
