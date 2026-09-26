# Root — contrat `R-E` : recherche à deux niveaux (S-11) + page publique d'entité

> **As of :** 2026-09-26 · **Porte :** `SPECIES_CLOSED_ROOT_OPEN` · **Branche :** `omni-v2-rebuild`
> **Autorité :** `/nature-way` · **Décision Seed :** **S-11** (`founder-confirmed`) · **Maquette :** `omni-species-v2-interactive.html` (`SHEETS.search`, `SHEETS['entite-publique']`)
> **Statut :** contrat écrit **avant** le code (règle « contract before code »).

---

## 1. Pourquoi cette tranche — et pourquoi elle passe avant le reste

Le socle vient d'être reconstruit autour de l'**entité** (`058`→`061`) : l'offre appartient à une entité,
le lieu n'est que « où ». Or **la seule façon dont l'acheteur voit ce socle est la recherche** — et
aujourd'hui la recherche ne connaît **qu'un niveau** : l'offre.

| Mesure | Constat |
|---|---|
| `searchLevel` / `entite-publique` / « Chercher une entité » dans `src/` | **0 occurrence** |
| Maquette acceptée | **entièrement spécifiée** : bascule de niveau, placeholder conditionnel, page publique d'entité, état vide dédié |
| Seed `S-11` | « Deux niveaux cohabitent… **test de non-régression obligatoire au Root** » |

**Le niveau entité est donc :** spécifié (Species close), exigé (S-11), **absent** (code), et **débloqué**
(Root ouvert). C'est la tranche qui rend **visible** le socle qu'on vient de construire.

**Correction de recommandation, faite en la vérifiant.** J'avais recommandé `R-B` « en premier » en
m'appuyant sur l'inventaire du 2026-09-25. **Mesure faite : `R-B` est déjà livré** (`bfc3b7c` — les 5
caractéristiques sont **écrites** `trunk-repository.ts:2274/2317`, **relues** (`:481-485`, `:2218-2222`)
et le formulaire vendeur existe `SellerV13.tsx:174`). Le seul reste de `R-B` était « exposer dans la
recherche » — et **la maquette acceptée elle-même marque ces filtres désactivés** (`chip('État / condition',
false, true)` = `disabled`). Ce reste est donc **endetté par conception**, pas manquant. **`R-B` n'est
plus la priorité ; `R-E` l'est.**

---

## 2. Ce que la maquette acceptée impose (extraits, pas paraphrase)

| Élément | Source maquette | Contrat |
|---|---|---|
| Bascule de niveau | `SHEETS.search` | deux chips : « Chercher une entité » / « Chercher une offre » |
| Placeholder | idem | entité : « Nom d'un commerce, d'une organisation ou d'une personne… » · offre : « Produit, service, propriété immobilière, compétence… » |
| Contraintes masquées | `style="display:none"` si `searchLevel === 'entity'` | au niveau entité, **les contraintes d'offre (distance/budget/quantité) ne s'appliquent pas** |
| Note de niveau | idem | « Le niveau entité cherche un **offreur** par son identité. Les contraintes d'offre ne s'appliquent qu'au niveau offre. » |
| Page publique d'entité | `SHEETS['entite-publique']` | badge · nature (`individu`/`organisation`, « même objet ») · adresse · horaires · catégorie de lieu · **niveau d'existence (échelle 0→4)** · ses offres |
| Aperçu de lieu → entité | `SHEETS.facility-apex` | « Ouvrir la page de l'entité » — la page complète est **à un tap** |
| Résultats d'offres | `SHEETS.results` | « les entités **derrière** ces offres sont accessibles en un tap » |
| **Contact / itinéraire** | `SHEETS.produit` | **« Le contact du vendeur ET l'itinéraire routier apparaissent APRÈS une intention d'achat — jamais avant. »** |
| État vide | `SHEETS['entity-empty']` | « Aucune entité » (état dédié, distinct de « aucun résultat d'offre ») |

---

## 3. Invariants (le code doit les faire respecter)

| # | Invariant | Pourquoi |
|---|---|---|
| `E-1` | **Deux niveaux, un corpus.** Entité et offre sont **deux objets reliés** d'un seul index — pas deux systèmes, pas deux tables de recherche. | S-11 explicite |
| `E-2` | **Aucun contact avant intention.** La page publique d'entité ne porte **jamais** `contact_phone`/`contact_whatsapp`. | Seed : « Exposer le contact d'un vendeur avant une intention réelle » = **harm to avoid** |
| `E-3` | **Aucune promesse de stock.** Le compteur d'offres publiées est un **fait**, pas une disponibilité. La disponibilité reste un acte séparé. | S-05 + « ne jamais mentir sur la disponibilité » |
| `E-4` | **La confiance publique se lit entité d'abord**, repli lieu. Les états internes ne sont jamais exposés — `certified` (D-01) se publie comme `unconfirmed`. | R-3a, `PUBLIC_TRUST_STATES` |
| `E-5` | **Le niveau entité ne filtre pas** par distance/budget/quantité. | maquette + S-11 |
| `E-6` | **Un lieu `unclaimed` sans entité n'est pas une entité** : il reste un lieu de carte (S-05), cherchable au niveau **offre** seulement. | S-05 |

---

## 4. Contrat d'interface

### `GET /api/v2/public/entities?q=<texte>`

Public (aucune authentification — consulter sans compte est autorisé, D-05).

| Champ | Type | Note |
|---|---|---|
| `id` | uuid | identité de l'entité |
| `name` | string | `display_name` |
| `kind` | `individu` \| `organisation` | « même objet » (S-13) |
| `trust` | `unclaimed` \| `unconfirmed` \| `confirmed` | **public uniquement.** `certified` est un jalon **interne** (D-01) : il est ramené à `unconfirmed` avant publication, exactement comme `toFacility` le fait déjà. |
| `category` | string \| null | catégorie du lieu principal |
| `address` | string \| null | |
| `latitude` / `longitude` | number \| null | `null` = entité sans lieu (digital) |
| `offerCount` | integer | **offres publiées** (fait, pas disponibilité) |
| `minPriceMinor` / `currency` | integer \| null | « dès X F » |

`q` vide ⇒ liste bornée (découverte) ; `q` non vide ⇒ `ILIKE %q%` sur `display_name`.

### `GET /api/v2/public/entities/:id`

Renvoie l'entité + **ses offres publiées** (mêmes champs que `PublicProduct`, y compris les
caractéristiques `*_kind` de R-B) + son lieu principal. **Jamais de contact.**

### Réponse d'erreur
`404 NOT_FOUND` si l'entité n'existe pas ou n'est pas publique.

---

## 5. Preuve attendue (aucune affirmation sans elle)

| Preuve | Méthode | Falsification exigée |
|---|---|---|
| Les chemins de lecture **compilent** sur une vraie base | `scripts/prove-root-read-paths.mjs` étendu (SQL réel, pas stubé) | remettre une erreur → FAIL exit 1 |
| `E-2` — **aucun contact** dans la réponse publique | assertion sur les clés sérialisées + garde de frontière client | ajouter `contact_phone` au SELECT → FAIL |
| `E-5` — le niveau entité **ignore** les contraintes | test : même résultat avec/sans `rayon_km` | appliquer le filtre → FAIL |
| `E-1` — un même corpus | l'entité d'une offre est atteignable depuis l'offre | — |
| Navigateur | bascule de niveau + page entité | — |

**Classement de preuve :** `observed` (SQL réel) + `bounded` (fixtures) — jamais `production`.

---

## 6. Hors périmètre (explicite)

- Filtres de recherche sur les **caractéristiques** (`État / condition`, `Créneau`) : **désactivés dans la
  maquette acceptée** → **endettés**, tranche ultérieure si le fondateur les active.
- Devise par localisation (`D-LOC`) : tranche **séparée** (source de vérité pays/`markets` à écrire).
- `SP-V2-01` (offres sans propriétaire) : **décision fondateur**, tranche séparée.
- Itinéraire après intention : **déjà livré** (`routeTarget`) — non rouvert ici.
