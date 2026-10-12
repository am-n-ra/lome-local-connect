# BRANCHES-SEARCH-SCOPE — « pain » ne trouvait rien parmi les offres quand la carte était ailleurs

> **Porte courante :** `HEARTWOOD_CLOSED_BRANCHES_OPEN` (Branches OPEN, 2026-10-07).
> **Classe :** durcissement d'une fonctionnalité livrée (S-11, double niveau entité/offre) —
> **pas une nouvelle fondation**. Un bug d'usage rapporté par le fondateur.
> **Commit :** `8d73dbc` · **prod** `index-CRzUr8sZ.js` === build local · **T-07d ✅**.

## Le signal fondateur (2026-10-07)

> « En cherchant « pain » **parmi les offres**, il ne trouve rien ; mais **parmi les entités**
> il dit « 6 lieux » ; et quand je remets « chercher parmi les offres », il affiche des
> établissements. »

Trois affirmations, une seule cause. Le fondateur a vu la **contradiction entre deux niveaux
de la même recherche**.

## La cause (mesurée, pas supposée)

`runSearch` (`TrunkAppV13.tsx`) appelait `listPublicFacilities(bounds ?? undefined, query, …)`
pour **les deux** niveaux — mais la requête HTTP n'emportait le **viewport** de la carte que
pour la recherche d'**offre**. La requête est servie par un prédicat serveur
(`trunk-repository.ts`, `listPublicFacilities`) qui **bornait les résultats au viewport** :

```sql
where f.longitude between ${west} and ${east}
  and f.latitude between ${south} and ${north}
  and (${namePattern}::text is null or … )
```

Conséquence : une **recherche tapée** était **scopée à ce qui est visible à l'écran**. Une
offre qui existe (la boulangerie au Marché d'Adawlato, avec « Pain de mie tranché 500 g »
publié) devenait **introuvable** dès que la carte n'était plus sur Lomé. Le **niveau entité**,
lui, interrogeait **tout le corpus** (son indice « 6 lieux connus » n'a pas de bounds) → **deux
niveaux d'une même recherche, deux portées**.

C'est la définition d'un défaut de **cohérence** : l'utilisateur ne peut pas deviner que la
réponse dépend de l'endroit où il a laissé sa carte.

### Mesure directe (prod, avant correctif)

| Requête | Résultat |
|---|---|
| `facilities?q=pain` + viewport **sur Lomé** | **4** |
| `facilities?q=pain` + viewport **loin de Lomé** | **0** |
| `entities?q=pain` (global) | 0 entités, indice → **6 lieux** |

La même chaîne de caractères, deux réponses, selon un état d'interface non annoncé.

## Le correctif

Le prédicat viewport ne s'applique plus **qu'en l'absence de requête** :

```sql
where (${namePattern}::text is not null
    or (f.longitude between ${west} and ${east}
      and f.latitude between ${south} and ${north}))
```

- **Recherche tapée = GLOBALE.** La distance s'exprime par la **contrainte de rayon**
  (`RAYON_SCOPES` : 1/5/10/25/100 km / Monde — D-CON-4 : *la distance est comptée une seule
  fois, jamais par l'écran*). Le `centerLat`/`centerLng` de la contrainte de rayon dérive
  toujours du viewport (indépendamment de la boîte), donc la recherche « rayon autour de moi »
  reste correcte.
- **Browse non filtré = borné au viewport.** La découverte carte (le chemin `loadPublic`,
  fenêtre par fenêtre) garde exactement son comportement. C'est ce que le viewport signifie.

Le client continue d'envoyer les bounds (ils portent le centre du rayon) ; le **serveur** est
l'autorité sur la portée.

## La preuve (A/B, falsifiable)

### 1. SQL réel contre la branche canonique (`br-dawn-hill-am5amy22`)

`ROOT_READ_PATH_DATABASE_URL=… npx tsx scripts/prove-root-read-paths.mjs` → **37/37 PASS**,
dont les deux assertions neuves :

```
PASS search is global :: 'pain' with far-off bounds === global (6 rows)
PASS browse is viewport-scoped :: far=0, lome=2000
```

**Falsifié** — en restaurant l'ancien prédicat :
```
FAIL search is global :: bounds scoped a typed search (global=6, far-off=0)
```
C'est exactement le bug du fondateur (`global=6` mais `far-off=0`), reproduit et éteint.

### 2. Navigateur, sur prod (`scripts/prove-search-scope-global.mjs`)

Le harnais place la **géolocalisation loin de Lomé** (la carte s'installe ailleurs), puis
cherche « pain » **parmi les offres** :

| État de prod | Résultat |
|---|---|
| **avant** déploiement (ancien bundle) | **2/5** — « Facilités proches **0** · Aucune fourniture ne correspond » |
| **après** déploiement (`8d73dbc`) | **5/5** — la boulangerie remonte, compteur ≠ 0, **0 pageerror** |

### 3. Garde statique CI (`src/server/search-scope.test.ts`)

Les tests de dépôt utilisent un `sql` **stubbé** (jamais exécuté) : une erreur de portée passe
tous les tests unitaires. Le garde statique exige que le viewport soit **conditionné à
l'absence de requête** et qu'aucune forme non conditionnelle ne revienne. **Falsifié** :
ancien prédicat → **1 failed** ; restauré → **1 passed**.

## Vérification de déploiement (T-07d)

- Push `8290764..8d73dbc` sur `origin/omni-v2-rebuild`.
- **Comportement prod changé** (seule preuve qui compte pour un correctif serveur) :
  `q=pain` + bounds lointains = **0 → 6** (observé ~120 s après le push).
- **prod `index-CRzUr8sZ.js` === build local** ; **entrée GitHub `deployments` `8d73dbc`
  (Production)** présente.

## Résidu honnête

- Le harnais navigateur **force** la géolocalisation hors de Lomé (aucune session fondateur
  requise). Le spot-check fondateur sur son propre appareil reste le dernier essai.
- Le correctif **ne convertit pas** la recherche en « autour de moi » par défaut : la portée
  par défaut d'une recherche tapée est **le corpus entier**, la distance étant un choix
  explicite (chip de rayon). C'est la règle D-CON-4 et le contrat de `api.test.ts`
  (« without viewport bounds for global search »).
