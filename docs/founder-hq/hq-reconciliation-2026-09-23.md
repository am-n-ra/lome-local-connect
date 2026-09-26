# HQ Reconciliation — « on a assez tourné en rond, le fond n'est pas là » (2026-09-23)

> **Plan ID :** `HQ-OMNI-2026-09-02` · **As of :** 2026-09-23 (UTC)
> **Porte :** `ROOT` ouverte · **Autorité :** `/nature-way-founder-hq` → `/nature-way`
> **Déclencheur fondateur (verbatim) :** « j'ai essayé de finir Omni ces dernières semaines avec
> OpenHands mais leur IA ne m'a pas arrangé, on a assez tourné en rond et je pense qu'on a raté tout
> le process depuis Species… même si j'aime bien la présentation visuelle globale actuelle, mais tout
> le fond et la logique qui doit faire de Omni *Omni* n'est pas là, et même il y a beaucoup
> d'incohérence dans ce qu'on veut réellement faire et proposer. »

---

## 1. Verdict — ce qui est vrai, ce qui est faux

La méthode interdit « tout va bien » comme « tout est à refaire ». Séparation mesurée :

| Affirmation fondateur | Mesure du 2026-09-23 | Verdict |
|---|---|---|
| **« on a assez tourné en rond »** | **VRAI, et chiffré.** Sur **120 commits**, **58 (48 %)** ne touchent **que `docs/`**. **11 971 lignes** de documentation dans `docs/nature-way/` + `docs/founder-hq/` (**90** fichiers nature-way, **9** plans intra-skill successifs). **14 commits** sont des re-audits/re-conciliations/re-verdicts. La boucle n'est pas produit — elle est **documentaire**. | **CONFIRMÉ** |
| **« on a raté tout le process depuis Species »** | **PARTIEL — c'est la synchronisation, pas le process.** Seed V2 (`S-01…S-32`) et Species V2 (74 écrans, 27/27) sont réels et validés. Ce qui a échoué : Root exécuté sous une mémoire produit périmée → chaque reprise re-diagnostiquait. | **PARTIEL** |
| **« j'aime la présentation visuelle globale »** | **VRAI.** Jetons partagés (`--ink`, `--accent`, police) identiques entre app et maquette V2. | **CONFIRMÉ** |
| **« tout le fond et la logique qui fait d'Omni Omni n'est pas là »** | **VRAI, mesuré live** (branche canonique `br-dawn-hill-am5amy22`) : sur **13 offres publiées**, `condition_kind` **0/13**, `handover_kind` **0/13**, `price_kind` **0/13**, `uniqueness_kind` **0/13**, `media` (visuel) **0/13**. Seul `position_kind` est rempli (13/13). Le cœur de S-01/S-02 — « tout est offre, le type est une caractéristique » — est **déclaré en schéma, écrit en code, et vide en données**. | **CONFIRMÉ** |
| **« beaucoup d'incohérence dans ce qu'on veut faire »** | **VRAI au niveau exécution, pas intention.** 0 incohérence Seed ↔ socle (mesuré). Mais l'app contredisait des contrats approuvés (`D-LOC`, seuils figés) — corrigé `ALIGN-1`. Restent des incohérences **de classe** (voir §3). | **CONFIRMÉ** |

**Conclusion :** le fondateur a raison sur le **fond**. La cause n'est ni « l'IA n'a rien fait », ni
« le process est mauvais » : c'est **largeur avant profondeur**, puis **mémoire produit en retard sur
le socle**. Le rond-point est **réel** et il est **documentaire**.

---

## 2. Ce qui a réellement été livré cette session (pas des documents)

| Livrable | Preuve | Prod |
|---|---|---|
| **RH-01 — refus honnête de publication** (E-03/E-04) : une offre ne peut plus être publiée sans visuel ni avantage, et le refus **nomme** le fait manquant | `scripts/prove-rh01-publication.mjs` — **13/13 PASS** sur Postgres réel, branche jetable, **rejouable, 0 résidu** ; **échoue** contre l'ancien chemin de propriété | ✅ poussé |
| **Divergence de propriété corrigée** — le contrôle lisait `facility.account_id` (2ᵉ notion de propriétaire) alors que toutes les autres opérations vendeur lisent `coalesce(product.entity_id, facility.entity_id)` → `v2_entities.account_id`. Le vrai propriétaire se voyait **refuser sa propre offre**. | Découvert **par la preuve SQL réelle**, invisible aux tests stubbés | ✅ poussé |
| **Codes de statut honnêtes** sur la route d'upload visuel — « pas connecté » **400 → 401 AUTH_REQUIRED** ; corps illisible **500 → 400** | Vérifié **en prod** : `401 AUTH_REQUIRED` et `400 INVALID_INPUT` | ✅ prod |

**Pourquoi ces trois-là comptent plus que 58 commits de docs :** chacun a été trouvé **en exerçant le
code contre la réalité** (Postgres réel, prod réelle), pas en le relisant. Les tests stubbés — **688
verts** — ne voyaient **aucun** des trois.

---

## 3. Les incohérences de classe (la vraie réponse à « ce qu'on veut faire »)

Ce ne sont pas des contradictions d'**intention**. Ce sont des **défauts de méthode** qui produisent
en boucle les mêmes symptômes :

| Classe | Manifestation | Pourquoi ça se répète |
|---|---|---|
| **A. Le `sql` stubbé ne compile rien** | 688 tests verts pendant qu'une requête que Postgres **ne peut pas compiler** part en prod (déjà arrivé : `RB-PROD-1/2/3`) | Un stub accepte n'importe quelle chaîne. Le test passe, la prod casse. |
| **B. Deux notions de la même vérité** | Propriétaire = `facility.account_id` **ou** `entity.account_id` ; devise = `OMNI_DEFAULT_LOCAL_CURRENCY` **ou** localisation | Rien n'interdit une deuxième lecture. Elle diverge en silence. |
| **C. Un code de statut pour trois causes** | « pas connecté » = 400 ; « refusé » = 409 ; « capacité absente » = 409 | Collapser les causes fait mentir le message. |
| **D. La documentation se prend pour l'état** | 48 % des commits, 11 971 lignes, 9 plans successifs | Écrire « où on en est » **remplace** mesurer « où on en est ». |

**La classe D est celle qui a produit le rond-point.** Chaque session écrivait un état ; l'état
suivant contredisait le précédent ; il fallait re-diagnostiquer. Le board porte la trace : *« cette
recommandation a été corrigée trois fois »* le 2026-09-26.

---

## 4. Ce que je propose — et ce que je refuse

**Je refuse de rouvrir Seed ou Species.** Ils sont validés (`founder-confirmed`) et cohérents
(0 incohérence mesurée). Les rouvrir serait un **quatrième** tour.

**Je propose, dans cet ordre, une seule porte à la fois :**

1. **Arrêter d'écrire de la documentation d'état.** Un seul registre de preuve, mis à jour, pas
   neuf plans. *Le rond-point mesuré est là.*
2. **Piloter chaque tranche par une preuve exécutable** (Postgres réel / prod réelle), falsifiée
   avant livraison. Classe A et B disparaissent si la preuve est exécutable.
3. **Le fond en données, pas en code.** Les 4 caractéristiques sont écrites mais **0/13 remplies**.
   Ce n'est **pas** un bug de code — c'est un **acte vendeur**. La question réelle à trancher :
   **le pilote exige-t-il que les offres soient décrites, ou accepte-t-il des offres muettes ?**
   C'est une décision fondateur, pas une tranche de code.
4. **Une seule décision ouverte à la fois.** 35 identifiants de décision (`D-*`) + 34 (`S-*`)
   traînent dans les documents. C'est plus que ce qu'un fondateur solo peut arbitrer — donc elles
   ne sont pas arbitrées, donc elles reviennent.

---

## 5. Décision demandée

| # | Décision | Effet |
|---|---|---|
| **A** | **Le pilote accepte-t-il des offres muettes** (sans caractéristiques ni visuel) ou exige-t-il qu'elles soient décrites ? | Si « exige » → le refus RH-01 est actif et il faut un chemin vendeur pour remplir. Si « accepte » → l'intégrité S-32 reste non-✓ et on l'assume. |
| **B** | **Geler la production documentaire** (hors registre de preuve unique) jusqu'à la prochaine porte ? | Supprime la classe D, donc le rond-point. |
| **C** | **Une porte à la fois**, jusqu'à `pilot-ready` sur l'app — plus d'ouverture de tranches latérales ? | Empêche la largeur avant profondeur. |

**Ce que je ne peux pas trancher à la place du fondateur :** ce qu'Omni **doit** être pour le pilote.
La méthode interdit de l'inventer. Ce document le **pose**, il ne le **répond** pas.
