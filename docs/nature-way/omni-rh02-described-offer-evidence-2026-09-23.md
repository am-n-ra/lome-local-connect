# RH-02 — « on exige » : preuve + dette des offres muettes

> **ID :** `RH-02-EVIDENCE-2026-09-23` · **As of :** 2026-09-23
> **Plan :** `NW-PROD-OMNI-RH-02` · **Porte :** `ROOT` · **Handoff :** `HO-OMNI-21`
> **Décision fondateur :** « **on exige** » (2026-09-23) — réponse à la question A de
> `docs/founder-hq/hq-reconciliation-2026-09-23.md`.

---

## 1. Ce qui a changé

Une offre **muette** ne se publie plus. Les **quatre caractéristiques** qui font d'une offre une
offre sont désormais une **condition de première publication**, au même titre que le visuel et
l'avantage :

| Fait | Refus prononcé |
|---|---|
| `uniqueness_kind` absent | `UNIQUENESS_REQUIRED` |
| `handover_kind` absent | `HANDOVER_REQUIRED` |
| `price_kind` absent | `PRICE_KIND_REQUIRED` |
| `condition_kind` absent | `CONDITION_REQUIRED` |

Chaque refus **nomme** le fait manquant, et le vendeur voit une phrase actionnable
(`ProductCatalogueV13.publicationMessage`) — jamais « publication refusée » sans motif.

**`position_kind` n'est PAS exigé** (`D-RH-8`) : il est satisfait partout (13/13) et dérivé par le
formulaire ; l'exiger n'ajouterait aucune garantie.

## 2. La preuve — et pourquoi elle est exécutable

`scripts/prove-rh02-described-offer.mjs` pilote le **code livré** (`createTrunkRepository`) contre un
**vrai Postgres**, sur une branche jetable créée depuis la canonique.

**Pourquoi pas un test unitaire :** la suite du dépôt **stubbe `sql`** — elle ne **compile jamais**
une instruction. Ajouter quatre colonnes au `CASE` du refus **en oubliant de les sélectionner** dans
le CTE `owned` est une erreur que Postgres rejette et qu'un stub ne peut pas voir.

### Résultat : **11/11 PASS** (branche `rh02-described-offer-proof`, 0 résidu vérifié)

| # | Preuve |
|---|---|
| T1 | **La porte S'OUVRE** — une offre décrite (visuel + avantage + 4 caractéristiques) **publie**. Sans ce cas, le refus serait une barre permanente et le catalogue impubliable. |
| T2–T5 | **La porte SE FERME** sur chacune des 4 caractéristiques, en **nommant** le fait exact |
| T6/T6b | Le refus porte sur le **fait**, pas sur une barre : restaurer le fait **publie** la même offre |
| T7/T7b | Une offre **déjà publiée** n'est **jamais** rétrogradée ; elle reste archivable |
| T8 | Un **non-propriétaire** est refusé avec la raison **de propriété** |

### Falsification (une preuve qui ne peut pas échouer n'est pas une preuve)

Refus neutralisé (`then 'X_REQUIRED'` → `then null`) → **6 échecs** (T2, T3, T4, T5, T6, T6b).
Restauré → **11/11**. La preuve **épingle** le comportement, elle ne le décrit pas.

## 3. Le défaut réel trouvé par la preuve — fuite d'information

**T8 a échoué au premier passage** : un non-propriétaire recevait `UNIQUENESS_REQUIRED` — c'est-à-dire
qu'on lui **apprenait quel fait manquait sur l'offre de quelqu'un d'autre**.

**Cause :** quand le CTE `owned` est **vide** (non-propriétaire, ou produit inconnu), toute
sous-requête scalaire renvoie `NULL`. Les tests d'égalité (`= 0`, `<= 0`) valent alors `NULL` et
**tombent** — mais un test de nullité (`is null`) vaut **VRAI** sur `NULL`. Les branches
« caractéristique manquante » se déclenchaient donc **pour un étranger**.

**Correctif :** un test de nullité **en premier** (`publication_state is null → null`), qui court-circuite
le refus. Un appelant non autorisé n'apprend **rien** sur l'offre — seulement qu'elle n'est pas la sienne.

**Invisible à la suite stubbée** (elle ne compile pas le SQL). C'est la **deuxième** fois cette session
que la preuve réelle trouve ce que 688 tests verts ne voyaient pas.

## 4. Dette enregistrée — les 13 offres publiées silencieuses

**D-RH-7 / D-RH-11 : cette tranche ne touche PAS les offres existantes.** Le refus s'applique
**uniquement** `draft → published`. Rétrograder les 13 serait un **acte serveur** sur le catalogue
pilote, non demandé ; les remettre en conformité est un **acte vendeur**.

| Fait mesuré (canonique `br-dawn-hill-am5amy22`, 2026-09-23) | Valeur |
|---|---|
| Offres **publiées** | **13** |
| `condition_kind` / `handover_kind` / `price_kind` / `uniqueness_kind` | **0/13** chacun |
| `position_kind` | 13/13 |
| `media` (visuel) | **0/13** |
| `discount_value_minor > 0` | 12/13 |
| Propriétaires | 3 vraies entités — Demo Hub (8), Boulangerie du Marché d'Adawlato (3), Épicerie Chez Afi (2) |

### Ce que la dette signifie honnêtement

- **Ce ne sont pas des fixtures de test** : les 13 appartiennent à **3 vraies entités** avec
  propriétaire et visibles acheteur. C'est le **catalogue pilote réel**.
- **Elles restent visibles et publiées** — aucune n'est cassée par cette tranche.
- **Elles sont muettes** : l'acheteur voit un nom, un prix et une remise, mais **pas** neuf/occasion,
  retrait/livraison, négociable/fixe, unique/reproductible. La ligne `carac` de la fiche facilité
  (`TrunkAppV13.tsx:1832`) reste **vide** pour elles.
- **La sortie est vendeur** : ouvrir chaque offre dans le catalogue vendeur, renseigner les 4
  caractéristiques, republier. Le formulaire les porte déjà (`SellerV13.tsx:67-71`).

| Champ | Valeur |
|---|---|
| **Propriétaire** | le vendeur (3 entités), pas Nature Way |
| **Trigger de revue** | à la première session vendeur réelle, ou avant toute démo pilote montrant la fiche |
| **Sévérité** | **Moyenne** — la donnée est visible et incomplète, pas fausse ; le fond manque à l'affichage |
| **Disposition** | `open` — acte vendeur, hors autorité IA |

## 5. Ce qui n'est pas prouvé

- **Aucune preuve navigateur** de la phrase de refus affichée au vendeur (session vendeur réelle
  requise). La **mapping** est prouvée unitairement (`publication-refusal.test.ts`), le **refus
  serveur** contre Postgres réel, mais le **rendu écran** ne l'est pas.
- **Les 13 offres n'ont pas été mises en conformité** — décision explicite (`D-RH-11`).
- **La recherche par caractéristiques reste absente** — la maquette **désactive** le chip « État »
  (endetté **par conception**, décision séparée, pas un oubli).

## 6. Définition de done — état

| Critère | État |
|---|---|
| Offre muette refusée, raison nommée | ✅ prouvé (T2–T5) |
| Offre décrite publiée | ✅ prouvé (T1) |
| Offre publiée jamais rétrogradée | ✅ prouvé (T7) |
| La preuve échoue si l'on retire le refus | ✅ falsifié (6 échecs) |
| Dette des 13 écrite, propriétaire, trigger | ✅ ce document |

**Statut de la tranche : `verified` sur le serveur, `partial` sur le rendu** (phrase de refus non
prouvée en navigateur).
