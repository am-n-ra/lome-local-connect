# HQ RECONCILIATION — « la même plainte, une deuxième fois » (2026-09-27)

> **Plan ID :** `HQ-OMNI-2026-09-02` · **As of :** 2026-09-27 (UTC)
> **Porte :** `ROOT` (ouverte) · Species V2 close `founder-confirmed` 2026-09-25
> **Autorité :** `/nature-way-founder-hq` → `/nature-way`
> **Déclencheur fondateur (verbatim) :**
> *« j'ai essayé de finir omni ces dernières semaines avec open hands mais leur IA ne m'a pas arrangé,
> on a assez tourné en rond et je pense qu'on a raté tout le process depuis Species ; même si j'aime bien
> la présentation visuelle globale actuelle mais tout le fond et la logique qui doit faire de omni omni
> n'est pas là et même il y a beaucoup d'incohérence dans ce qu'on veut réellement faire et proposer. »*
> **Méthode :** re-mesure du dépôt et de la base canonique. Aucune affirmation non mesurée.

---

## 0. Le fait le plus important de ce document

**Ce n'est pas une nouvelle plainte — c'est la même, formulée presque mot pour mot le 2026-09-26**
(voir `hq-reconciliation-2026-09-26.md`, déclencheur cité identiquement). Entre les deux, **une journée
entière de travail** a été livrée : `RB-PROD-1/2/3`, `ALIGN-1`, `R-B`, `R-C`, `R-D`, `R-E`, `R-F`.

Six tranches. **Aucune ne répondait à la phrase centrale** : *« le fond et la logique qui doit faire de
Omni Omni n'est pas là »*. Chacune a traité un **symptôme mesurable** (un 500, un chemin absent, une
colonne vide). Rien n'a traité **la cause**, et la cause a reproduit la plainte.

**Un fondateur qui répète la même phrase après six livraisons ne dit pas que les livraisons sont
mauvaises — il dit qu'elles ne sont pas la réponse.** Ce document prend cette lecture au sérieux.

---

## 1. La cause structurelle, nommée cette fois pour de bon

Au 2026-09-26, la cause avait été nommée « mémoire produit en retard sur le socle ». C'est **vrai mais
incomplet**. La mémoire a été re-synchronisée — et la plainte est revenue. Donc la cause est en amont :

| Ce qui se passe réellement | Preuve |
|---|---|
| **La direction produit existe et n'est jamais relue avec le fondateur.** | Seed `S-01…S-32` (32 décisions, `founder-confirmed`), `omni-founder-mission-contract-2026-09-26.md`, Intent Brief V2. **Aucun de ces trois documents n'est cité dans la plainte** — le fondateur ne les reconnaît pas comme « ce qu'on veut faire ». |
| **Le travail se dispatche en tranches techniquement correctes mais jamais reliées à l'intention.** | `R-B` est l'exemple pur : **code livré**, **0/16 → 3/16 données**, recherche **endettée par conception**. Somme des trois couches = **une capacité inutilisable**, mais trois tranches « faites ». |
| **Les incohérences d'exécution s'accumulent plus vite que la relecture.** | `OMNI_DEFAULT_LOCAL_CURRENCY` en dur vs contrat `D-LOC` ; chips figés vs `seuil` éditable ; **et aujourd'hui** : quatre familles monétaires. Chacune a été trouvée **par accident**, en exécutant une tâche sans rapport. |
| **« tourner en rond » est mesurable : la même plainte revient.** | 2026-09-23, 2026-09-26, 2026-09-27. **Trois fois en cinq jours.** Un rond-point n'est pas un sentiment, c'est une **période**. |

**Formulation à retenir :** on a traité Omni comme **un backlog de défauts** au lieu de **un produit avec
une intention**. Le backlog se vide ; l'intention, non relue, se déforme.

---

## 2. Ce que la mesure confirme — et ce qu'elle infirme

| Affirmation fondateur | Mesure du 2026-09-27 | Verdict |
|---|---|---|
| « on a tourné en rond » | **3 occurrences de la même plainte en 5 jours** ; le socle a avancé (12 intentions → 7 transactions closes) mais **l'intention n'a pas été relue** | **CONFIRMÉ, avec une cause nouvelle** |
| « on a raté tout le process depuis Species » | **Faux comme process** : Seed V2 confirmé, Species V2 validée (74 écrans, `NON MESURÉ = 0`), Root V2 exécuté (`058`→`061`). **Vrai comme synchronisation** : Root a avancé sous une Species non conforme, puis six tranches ont suivi sans relecture d'intention. | **PARTIEL** |
| « la présentation visuelle globale est bonne » | **Vrai** — `check:maquette` 74 écrans, 0 doublon | **CONFIRMÉ** |
| « le fond et la logique qui font d'Omni Omni ne sont pas là » | **Vrai, et chiffré trois fois** : caractéristiques d'offre **3/16** (une seule offre réelle décrite) ; `S-06` échelle d'existence **0 offre aux niveaux 3/4** ; intégrité **0/16**. **Le modèle existe ; l'usage est vide.** | **CONFIRMÉ** |
| « beaucoup d'incohérence dans ce qu'on veut faire et proposer » | **Vrai, et c'est le point le plus grave.** Pas d'incohérence d'*intention* (Seed cohérent, `check:coherence` vert) — des **contradictions d'exécution** que personne ne voit, découvertes par accident. **Aujourd'hui : quatre conventions monétaires** là où le schéma en annonçait une. | **CONFIRMÉ** |

**Le point 5 mérite d'être souligné.** Le fondateur dit « incohérence dans ce qu'on veut faire ». La
mesure dit : l'**intention** est cohérente ; c'est **la réalité exécutée** qui ne l'est pas, et de façon
**invisible**. Un produit qui contredit ses propres règles **en silence** produit exactement ce
sentiment-là.

---

## 3. La mesure du jour : UNI-MONEY-1 (ce n'est pas le sujet, c'en est l'illustration)

Pendant cette session, une tâche demandée (« une seule famille monétaire ») a produit une découverte
qui **dépasse la tâche** :

| Ce qui était cru | Ce qui est mesuré |
|---|---|
| « deux familles monétaires » | **quatre conventions** : wallet ×100, offres brut, budgets brut, `discount_value_minor` = **un pourcentage** |
| « c'est un bug de convention » | **c'est un bug de seed** : le client vivant (acheteur **et** vendeur) fait **déjà** ×100 — **seules les lignes d'août étaient brutes**. La base était incohérente **dans le temps**. |
| « le rescale est trivial » | le **trigger append-only** a **refusé** de rescale les snapshots — les laisser bruts aurait mis une offre à **20 000 F** face aux **200 acceptés par l'acheteur** |

**C'est la démonstration parfaite du §1.** Une tâche étroite, correctement exécutée, révèle que **le socle
contredit silencieusement ses propres règles**. Le fondateur ressent cet écart **avant** qu'il soit mesuré.
**Ce n'est pas de l'imagination — c'est de la perception.**

---

## 4. Les quatre décisions de discipline (H1–H4) — à arbitrer avant tout code

Ce ne sont **pas** des tranches produit. Ce sont des **règles de conduite** qui répondent à la cause du §1.
**Aucun Trunk / nouveau code produit tant qu'elles ne sont pas tranchées.**

| # | Règle proposée | Ce qu'elle empêche | Coût de non-application (mesuré) |
|---|---|---|---|
| **H1** | **La relecture d'intention prime sur le backlog.** Avant toute nouvelle tranche, *rejouer l'intention à voix haute* avec le fondateur, contre le Seed et le mission contract. Une tranche qui ne se rattache à aucune décision `S-xx` **ne démarre pas**. | Six tranches sans réponse à « qu'est-ce qu'on veut faire » | 3 plaintes en 5 jours ; `R-B` = 3 couches « faites », capacité inutilisable |
| **H2** | **Un audit de cohérence d'exécution périodique, pas accidentel.** Toutes les incohérences de cette session ont été trouvées **par accident**, en exécutant autre chose (`×100`, devise en dur, chips figés). Il faut les **chercher** — un harnais qui compare **chaque contrat approuvé** (`D-LOC`, `D-CON`, échelle monétaire, échelle d'existence) au **comportement réel**, pas au code écrit. | Les contradictions silencieuses du §2 point 5 | 4 familles monétaires découvertes par hasard ; dette devise ; `S-06` vide |
| **H3** | **Zéro mensonge de constante : un chiffre, une lecture.** Le bonus est l'exemple : `10 000` dans une table, `2 000` dans le ledger — **deux lectures de la même promesse**. Règle : une constante monétaire a **une seule** définition et **un test** qui échoue si une seconde apparaît. | De l'argent promis qui vaut 5× moins selon l'endroit lu | `UM-6` : le bonus vaut **20 $** ou **2 000 F** selon la ligne lue |
| **H4** | **Le seed n'est pas la production.** La majorité des incohérences viennent de **fixtures** prises pour des données réelles (offres sans propriétaire, 9 offres USD tarifées en francs, lignes brutes d'août). Règle : **toute donnée de fixture est étiquetée en base** et **exclue** de toute mesure de vérité produit. | Juger la santé du produit sur des fixtures | `SP-V2-01`, devise mélangée, `×100` d'août |

**Si le fondateur ne retient qu'une chose : H1.** Les trois autres sont des conséquences ; H1 est la cause.

---

## 5. Décisions en attente de fondateur (aucune ne peut être tranchée par l'agent)

| # | Décision | Pourquoi elle ne peut pas être prise par l'agent |
|---|---|---|
| **UM-6** | Le bonus vendeur vaut-il **20 $ (≈10 000 F)** ou **2 000 F** ? | C'est de **l'argent promis** à un vendeur. `10000/2000 = 5` : deux lectures coexistent. Inventer la réponse serait mentir sur un montant. |
| **UM-2…5** | **Ordre d'application** de `058` sur la canonique, puis push | Le code couple et la base : poussé seul, il affiche les offres **100× trop petites**. Le fondateur doit autoriser la fenêtre base+code, ou refuser. |
| **H1–H4** | Les quatre règles de discipline ci-dessus | Elles **changent la méthode**, pas le produit. C'est une décision de fondateur, pas de technicien. |
| **`SP-V2-01`** | Statut des offres orphelines (déjà **résolu** au 26/09 : retirées) | Rappel : la tranche est close ; citée pour mémoire. |
| **Verdict de maturité** | Confirmer `prototype` (pas `pilot-ready`) | Le verdict est mesuré (`omni-maturity-verdict-2026-09-25.md`) mais **seul le fondateur le prononce**. |

---

## 6. Handoff à Founder HQ

> **Milestone actif :** boucle V1/V2 pilot-ready sur Lomé — **mais la priorité n'est plus d'étendre**
> **Porte courante :** `ROOT` (Species close 2026-09-25) — **Root reste ouverte, aucune tranche nouvelle engagée**
> **Verdict de maturité :** `prototype` — **pas** `pilot-ready` (caractéristiques d'offre 3/16, intégrité 0/16, niveaux 3/4 = 0)
> **Découverte :** **la même plainte revient 3 fois en 5 jours** — la cause n'est pas le process, c'est l'**absence de relecture d'intention**
> **Livré cette session :** `UNI-MONEY-1` UM-1/UM-7 **poussés** (`6df05e3`) ; **UM-2…5 `058` + code couplé, LOCAL, non poussé** (`b5f1804`) car le code et la base doivent voyager ensemble
> **Preuve :** migration prouvée sur jetable `br-purple-poetry-amqwztv5` (reset depuis canonique) — `net == unit × qté` **0 violation**, trigger ré-armé, re-run no-op, commentaires via `pg_description` ; **580/580 tests**, tsc + 6 gardes verts
> **Décisions fondateur requises :** **UM-6** (montant du bonus) · **UM-2…5** (autoriser la fenêtre base+code) · **H1–H4** (règles de discipline) · **verdict de maturité**
> **Prochaine plus petite action :** **arbitrer H1** — une relecture d'intention d'une heure, avant toute autre tranche
> **Travail délibérément non actif :** nouvelle tranche product/Trunk, Canopy/Ring, Gate 7, Fundraising/Opportunité (`watch`), **rouvrir Seed/Species (non recommandé)**
> **Trigger de re-plan :** le fondateur rejette H1–H4 · `UM-6` change les deux valeurs · une nouvelle incohérence silencieuse est mesurée

**Resource Receipt :**

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/ecosystem-orchestration-protocol.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/founder-hq-board.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/autonomous-delivery-gates.md` (état de maturité) |
| Loaded (état de référence) | `docs/founder-hq/founder-hq-master-plan.md` · `docs/founder-hq/founder-hq-board.md` · `docs/founder-hq/hq-reconciliation-2026-09-26.md` · `docs/founder-hq/current-state.md` · `docs/nature-way/omni-seed-closure-audit-2026-09-26.md` · `docs/nature-way/omni-species-v2-decision-registry-2026-09-23.md` · `docs/nature-way/omni-founder-mission-contract-2026-09-26.md` |
| Not loaded / reason | `templates/founder-hq-master-plan.md` (plan existant, append) · `templates/intent-brief.md` / `system-dependency-map.md` (artefacts à jour) · `portability-protocol.md` / `portable-starter` (aucune migration d'espace de travail) |
