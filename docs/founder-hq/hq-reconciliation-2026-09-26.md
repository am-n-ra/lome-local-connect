# HQ RECONCILIATION — « on a raté le process depuis Species » (2026-09-26)

> **Plan ID:** `HQ-OMNI-2026-09-02` · **As of:** 2026-09-26 (UTC)
> **Porte:** `SPECIES_CLOSED_ROOT_OPEN` (Species V2 close `founder-confirmed` 2026-09-25)
> **Autorité de dispatch:** `/nature-way-founder-hq` → `/nature-way`
> **Déclencheur:** verdict fondateur — *« leur IA ne m'a pas arrangé, on a assez tourné en rond, je pense qu'on a raté tout le process depuis Species ; j'aime bien la présentation visuelle globale actuelle mais tout le fond et la logique qui doit faire de Omni omni n'est pas là, et il y a beaucoup d'incohérence dans ce qu'on veut réellement faire et proposer »*

---

## 1. Ce que le fondateur a raison de dire — et ce qui est faux

La méthode interdit de répondre « tout va bien » ou « tout est à refaire ». Il faut **séparer** :

| Affirmation fondateur | Mesure | Verdict |
|---|---|---|
| « on a tourné en rond » | **Vrai, et la cause est nommée** : le produit n'a pas bouclé — **notre mémoire du produit** a bouclé. Le socle a été reconstruit (`058`→`061`) mais les documents d'état ne l'ont pas suivi. Chaque reprise repartait d'une carte périmée → nouveau diagnostic, nouveau sous-ensemble, nouvelle tranche. | **CONFIRMÉ** |
| « on a raté tout le process depuis Species » | **Partiellement faux.** Seed V2 (`S-01…S-34`) et Species V2 (74 écrans, 27/27 conforme, `NON MESURÉ = 0`) sont **réels et validés**. Ce qui a été raté n'est pas le *process*, c'est sa **synchronisation** : Root a été exécuté **sous** une Species non conforme (incidents 2026-09-23 et 2026-09-24, tous deux enregistrés), puis la mémoire est restée en retard. | **PARTIEL** |
| « la présentation visuelle globale est bonne » | **Vrai** — `check:maquette` : 74 écrans, 5 niveaux, registre honnête, 0 doublon. | **CONFIRMÉ** |
| « le fond et la logique qui font d'Omni Omni ne sont pas là » | **Vrai, et c'est maintenant chiffré** : les **caractéristiques d'offre** (le cœur de S-01/S-02 — « tout est offre, le type est une caractéristique ») sont **déclarées en schéma, jamais écrites en code** : `uniqueness_kind`/`handover_kind`/`price_kind`/`condition_kind` = **0/16** offres. Un vendeur **ne peut pas** dire neuf/occasion, unique/reproductible, retrait/livraison, négociable/fixe. La recherche ne peut donc pas filtrer dessus : **la maquette le montre, l'app ne le peut pas.** | **CONFIRMÉ** |
| « beaucoup d'incohérence dans ce qu'on veut faire et proposer » | **Vrai.** 0 incohérence *Seed ↔ socle* (mesuré, `check:coherence`), **mais** l'app **contredit** des décisions approuvées : chips de contraintes **figés** vs `seuil` éditable, `OMNI_DEFAULT_LOCAL_CURRENCY` **en dur** vs contrat `D-LOC` (devise par localisation). | **CONFIRMÉ** |

**Le verdic fondateur est donc juste sur le fond, et la cause n'est pas « l'IA n'a rien fait »** — c'est qu'**on a construit en largeur avant d'avoir fini en profondeur**, puis qu'on a perdu la carte.

---

## 2. Ce qui a réellement été corrigé dans cette session (mesuré, en prod)

Trois défauts **bloquants en production** ont été trouvés, corrigés et **vérifiés en prod** — pas seulement en local.

| ID | Ce qui était cassé | Correctif | Preuve prod |
|---|---|---|---|
| `RB-PROD-3` | **La carte acheteur renvoyait HTTP 500 pour TOUT appel.** `listPublicFacilities` sélectionnait `e.commercial_plan` en ne groupant que sur `(f.id, e.trust_state)` → Postgres rejette l'instruction. | Grouper aussi sur `e.id` (clé primaire ⇒ dépendance fonctionnelle). | **500 → 200, 206 facilités.** Déploiement GitHub `85c1669` confirmé. |
| `RB-PROD-1` | **Aucun vendeur ne pouvait créer de facilité** (CTE `inserted` déclaré deux fois → l'instruction entière rejetée). | Un seul CTE. | `inserted` = **0 occurrence** dans le bundle vendeur servi. |
| `RB-PROD-2` | **Aucune offre ne pouvait être créée** (`ON CONFLICT` sans le prédicat de l'index partiel). | Prédicat répété. | Prédicat **présent** dans le bundle catalogue servi. |
| `T-07d` | Prod ≠ build local (garde-fou ouvert, « ne pas pousser »). | Poussé + vérifié. | Prod `index-D48HqbeO.js` **=== build local**. |

**Et surtout — pourquoi 607 tests verts ne l'ont PAS vu.** Les tests du dépôt utilisent un `sql` **stubbé** : ils n'exécutent **jamais** SQL. Une requête que Postgres ne peut même pas **compiler** passe donc tous les tests unitaires. C'est un **angle mort de méthode**, pas une négligence de développeur.

**Deux gardes ajoutées, toutes deux falsifiées** (une garde qui ne peut pas échouer n'est pas une garde) :

1. `scripts/prove-root-read-paths.mjs` — **27 chemins de lecture réels** contre une vraie base. *Falsifié* : en rétablissant le bug → **FAIL exit 1** avec le message exact de Postgres (`column "e.commercial_plan" must appear in the GROUP BY clause`).
2. `src/server/group-by-completeness.test.ts` — analyse statique du dépôt, règle **par colonne**, sensible à la **clé primaire**. *Falsifié* : sur le code cassé, il remonte **exactement une** violation, **sans faux positif**.

**609 tests** au total, `tsc`/`boundary`/`state`/`docs`/`coherence`/`maquette` verts.

---

## 3. Découverte nouvelle : l'impasse de l'offre sans propriétaire (`SP-V2-01`)

En auditant le « fond », un défaut **de classe produit** a été mesuré — il touche le **cœur du Seed**.

**Mesuré live** : sur **206** lieux, **203** n'ont **aucun compte** (fond de carte `public_import`). **200** sont `unclaimed` **sans offre** → **conformes** à S-05 (« Lieu connu — pas encore géré », *sans promesse de stock*).

**Mais 2 lieux sont une impasse** : `Atelier Kegue` et `Pharmacie du Port` n'ont **pas de propriétaire**, sont **visibles à l'acheteur** (`certified`/`unconfirmed`) **et portent une offre publiée** (3 offres au total).

Or :
- le chemin d'écriture (`createAvailabilityRequest`) valide `publication_state` + la confiance, **jamais la propriété** — l'acheteur **peut donc demander** la disponibilité ;
- le chemin de lecture vendeur (`getSellerAvailabilityQueue`) joint `f.account_id = <sellerAccountId>` — un lieu sans compte **n'apparaît dans aucune file vendeur**.

**Conséquence, mesurable** : la demande **expire en 15 minutes sans qu'aucune réponse soit possible**, et l'acheteur a **payé 0 crédit** pour un **aller simple**. C'est exactement le mensonge que le Seed interdit en premier (« mentir sur la disponibilité »).

**Cause racine : dette de données, pas de code.** Les 3 offres sont des fixtures `public_import` du **2026-08-22**, antérieures à R-B. Elles n'ont jamais eu de propriétaire et **aucun code ne les a jamais liées**.

**Ce n'est pas à moi de trancher** : inventer un propriétaire serait un mensonge (S-04 dit « pas d'offre orpheline »). Deux issues, décision fondateur :
- **(a)** retirer les 3 offres orphelines (elles ne sont pas des offres réelles — cohérent avec la nature de fixture) ;
- **(b)** les rattacher à une entité réelle **si** un vrai vendeur les revendique.

---

## 4. La dépense structurelle : « largeur avant profondeur »

Ce qui a réellement produit le sentiment de rond-point :

| Symptôme | Cause structurelle |
|---|---|
| On repart d'un diagnostic à chaque reprise | Les **documents d'état** avaient divergé du **socle réel** (`058`→`061` exécuté pendant qu'un registre annonçait encore la racine « ouverte »). Le rond-point était **documentaire**. |
| L'app ne ressemble pas à la maquette | La maquette a été **close et acceptée**, puis l'app **n'a pas suivi** — et c'était **interdit** tant que Species était ouverte. L'écart est maintenant débloqué (Root est ouvert). |
| « le fond n'est pas là » | Les caractéristiques d'offre (S-01/S-02) sont **0/16 écrites**. Le modèle existe, **l'usage non**. |
| Des incohérences « dans ce qu'on veut faire » | Ce ne sont pas des incohérences *d'intention* — le Seed est cohérent. Ce sont des **contradictions d'exécution** : l'app contourne des contrats approuvés (`D-LOC`, `seuil` éditable). |
| Root a avancé sous Species non conforme | Incident **enregistré deux fois** (2026-09-23, 2026-09-24). La règle existe ; elle a été violée puis **renforcée**. |

---

## 5. Ce qu'il faut faire maintenant — une seule porte, une seule décision

**La porte courante est `ROOT`, ouverte.** Species est close par décision fondateur — je ne la rouvre pas.

L'inventaire des finitions (`omni-root-finishing-inventory-2026-09-25.md`) donne l'ordre, et il **répond directement** à la plainte :

| # | Finition | Pourquoi c'est le « fond qui manque » |
|---|---|---|
| 1 | **`R-B` — caractéristiques d'offre** (écriture + lecture + recherche) | C'est **le cœur S-01/S-02**. Sans ça, « tout est offre » reste un slogan : un particulier, un ambulant, un objet d'occasion, un digital **ne peuvent pas se décrire**. **Le plus structurant.** |
| 2 | **Alignement app ↔ maquette** (seuils réglables + devise par localisation + filtre budget devise-aware) | C'est ce que le fondateur a **explicitement demandé**, et l'app le **contourne**. Le plus **visible**. |
| 3 | **`R-D` — chemin `individu`** | Promesse produit : « un particulier vend sans structure ». Chemin **jamais exercé en données** (0 entité `individu`). |
| 4 | **`R-C` / `SP-V2-01` — offres sans entité** | Décision fondateur (retirer ou rattacher). Petit, mais bloque la vérité de l'index. |
| 5 | **`R-E` — découverte 2 niveaux** (S-11) | **Test de non-régression obligatoire** du Seed : entité **et** offre. |

**Ma recommandation, en une ligne** : **finir `R-B` en premier** — c'est la tranche qui transforme « une carte avec des produits » en « un index d'offres décrites ». Puis l'alignement, qui est ce que vous voyez.

**Ce que je ne recommande pas** : élargir (nouveaux acteurs, nouvelles tranches) ou rouvrir Seed/Species. Le Seed est cohérent ; le problème est l'**exécution du socle**, pas la direction.

---

## 6. Réponse honnête à « est-ce que l'IA n'a pas arrangé les choses ? »

**Sur le fond : non, le travail est réel** — Seed confirmé, Species validée à 27/27, socle entité exécuté, cycle transactionnel prouvé, 609 tests, gardes falsifiés.

**Sur la méthode : oui, il y a eu un défaut réel, et il est nommé.** Trois mécanismes l'ont produit, tous corrigés ou renforcés :

1. **Deux portes avancées en parallèle** (Root pendant Species non conforme) — corrigé par règle écrite + incident consigné.
2. **L'audit se mesurait lui-même** (`COH-V2-18` : dénominateur choisi par l'audit → « conformité par omission ») — corrigé : le harnais **lit le Seed** et classe **chaque** décision ; `NON MESURÉ = 0`.
3. **Des tests qui n'exécutent jamais SQL** → une requête non compilable passait 607 tests. C'est ce qui a laissé la prod en 500. **Corrigé** par les deux gardes ci-dessus.

**Ce que ça change pour la suite** : la mesure prévaut sur la mémoire, et **une preuve qui ne peut pas échouer n'est pas une preuve**.

---

## 7. Handoff à Founder HQ

> **Milestone actif :** boucle V1/V2 pilot-ready sur Lomé — alignée sur la maquette acceptée
> **Porte courante :** `ROOT` (Species close 2026-09-25)
> **Verdict de maturité :** `prototype` — **pas** `pilot-ready` (`omni-maturity-verdict-2026-09-25.md`), trigger = fin de `R-B` + alignement app
> **Corrigé et prouvé en prod :** `RB-PROD-1`, `RB-PROD-2`, `RB-PROD-3` (500→200), `T-07d` fermé
> **Garde ajoutée :** preuve SQL réelle (27/27, falsifiée) + garde statique GROUP BY (falsifiée)
> **Découverte :** `SP-V2-01` — impasse de l'offre sans propriétaire (2 lieux visibles, 3 offres, aucune réponse possible) → **décision fondateur**
> **Décision fondateur requise :** (1) `SP-V2-01` — retirer ou rattacher les offres orphelines ; (2) ordre des finitions — je recommande **`R-B` d'abord**
> **Prochaine plus petite action :** trancher `SP-V2-01` + lancer `R-B` (caractéristiques d'offre, écriture → lecture → recherche)
> **Travail délibérément non actif :** Canopy/Ring, Venture Lifecycle (`watch`), Fundraising/Opportunité (`watch`), rouvrir Seed/Species (**non recommandé**)
> **Trigger de re-plan :** le fondateur rejette une finition · `R-B` prouve que le schéma d'offre ne couvre pas un cas réel · un incident prod nouveau

**Resource Receipt :**
| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/ecosystem-orchestration-protocol.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/ecosystem-activation-manifest.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/founder-hq-board.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/templates/skill-handoff-receipt.md` |
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded (état de référence) | `docs/founder-hq/current-state.md` · `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` · `docs/nature-way/omni-root-finishing-inventory-2026-09-25.md` · `docs/nature-way/omni-maturity-verdict-2026-09-25.md` |
| Not loaded / reason | `templates/founder-hq-master-plan.md` — plan existant, append suivi (pas de réécriture) · `portability-protocol.md` / `portable-starter` — aucune migration d'espace de travail |
