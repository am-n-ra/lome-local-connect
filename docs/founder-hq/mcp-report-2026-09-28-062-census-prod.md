# Rapport MCP — 062 / recensement canonique / prod (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff source :** `docs/founder-hq/mcp-handoff-2026-09-28-062-census-prod.md`.
> **Branche :** `omni-v2-rebuild` — HEAD au départ **`7c91625`** (`git pull` fait, attendu ≥ `7c91625` ✅).
> **Porte lue :** `SPECIES_CLOSED_ROOT_OPEN` (`docs/founder-hq/current-state.md` — lu, jamais inféré).
> **Aucun secret** dans ce rapport, les commits ou le chat. **Aucun redeploy. Aucune variable touchée.**

---

## 0. Identification de la branche canonique — par ses DONNÉES, pas son nom

| Candidate | Nom | `v2_facilities` | `v2_accounts` | `v2_products` | Verdict |
|---|---|---|---|---|---|
| `br-dawn-hill-am5amy22` | `omni-v2-rebuild` | **206** | **9** | **16** | **CANONIQUE** (correspond à la prod) |
| `br-bitter-math-amrlbym6` | `production` (default) | 4 | 3 | 7 | **PAS l'app** — le nom ment, comme documenté |

**Falsification :** la branche **nommée** `production` porte 4 facilités alors que la prod en sert 206 ;
l'identification par le nom aurait appliqué la migration au mauvais endroit **en silence**. Confirmé par
`GET /api/v2/public/facilities` → **206** (mesure T4). **Tout T1–T3 porte sur `br-dawn-hill-am5amy22`.**

---

## 1. T1 — Recensement canonique (LECTURE SEULE)

### 1.1 `v2_facilities` (206)

| Mesure | Valeur |
|---|---|
| total | **206** |
| `account_id IS NULL` | **203** |
| liées à une entité (`entity_id NOT NULL`) | **3** |
| avec adresse (non vide) | **6** (2,9 %) |
| hors zone TG (bbox lat 6,0–11,2 / lng 0–1,7) | **21** |
| `longitude < 0` (Ghana, ouest de Greenwich) | **17** |
| `trust_state = 'unclaimed'` | **200** |
| `trust_state IS NULL` | 0 |

### 1.2 `v2_entities` (3)

| Mesure | Valeur |
|---|---|
| total | **3** |
| `kind = 'organisation'` | **3** |
| `kind = 'individu'` | **0** |
| `kind IS NULL` | 0 |

### 1.3 `v2_products` (16)

| Mesure | Valeur |
|---|---|
| total | **16** |
| publiés (`publication_state = 'published'`) | **10** |
| `availability_state = 'a_valider'` | **13** |
| `availability_state = 'en_stock'` | **3** |
| `media` vide (`null` ou `[]`) | **13** (donc **3 avec visuel**) |
| devise `XOF` | **16** / autres : **0** |
| fourchette `price_minor` | **20 000 → 650 000** |
| `position_kind` NOT NULL | **13** (toutes `'fixe'`) — **les 3 offres à 5 caractéristiques ont `position_kind` NULL** |
| `uniqueness_kind` NOT NULL | **3** (3 hors `'stock'` = pièce unique) |
| `handover_kind` NOT NULL | **3** |
| `price_kind` NOT NULL | **3** (dont `'negociable'` : **0**) |
| `condition_kind` NOT NULL | **3** |

**Lecture honnête :** les « 3 offres qui déclarent une caractéristique » sont **les mêmes 3** (celles de
la preuve DEMO SUPPLY, niveau 4) — elles portent `uniqueness/handover/price/condition` mais **pas**
`position_kind`, tandis que les 13 autres portent **seulement** `position_kind='fixe'`. Le « 3/16 » de la
mesure board du 2026-09-27 est **confirmé et précisé**.

### 1.4 Tableaux annexes

| Table | Volumétrie |
|---|---|
| `v2_seller_unlocks` | **0** |
| `v2_seller_unlock_progress` | **0** |
| `v2_route_requests` | **0** |
| `v2_buyer_credit_accounts` | **1** |
| `v2_ad_campaigns` | **0** |

### 1.5 Registre `omni_schema_migrations` (`044` → `064`)

**21/21 présentes, AUCUN trou** (`generate_series(44,64)` ⊄ registre = vide), checksums :

`044` 454c66b5 · `045` f8917577 · `046` 3c6b08bb · `047` 7d021a17 · `048` 1055b32c · `049` 1819973a ·
`050` 2a33e4f7 · `051` 4df27a30 · `052` 45994f6c · `053` 6793fa83 · `054` d6e4f7a1 · `055` 75640c2d ·
`056` 660b5a9f · `057` d3ad51ef · `058` r1-entit · `059` r2a-faci · `060` e7c41b90 · `061` 53e3347b ·
`062` c1f2dfa4 · `063` fce55080 · `064` 1bd7c051

> **Piège attrapé :** une première requête filtrée `filename ~ '^044'` a remonté **0 ligne** pour `044`,
> car les entrées anciennes sont préfixées `db/migrations/` et les récentes non. **Le registre peut
> mentir par son format** — la requête tolérante au préfixe (`regexp_replace`) remonte bien les 21.

---

## 2. T2 — Migration `062` : **DÉJÀ APPLIQUÉE** — aucune action

**Statut : appliquée au canonique** (registre `062_one_money_family.sql`, checksum `c1f2dfa4`,
appliquée 2026-09-27). Vérifié par **le contenu**, pas par le registre :

| Vérification | Résultat |
|---|---|
| colonne `discount_value` (renommée, plus de `discount_value_minor`) | ✅ présente (`v2_products`, int) |
| commentaires `pg_description` « Omni money convention (D-LOC-9) » | ✅ **14 commentaires** (dont `discount_value` = « NOT a money amount: a percentage ») |
| snapshots : `net_amount_minor = unit_price_minor × quantity` | ✅ **0 violation / 12 snapshots** (unit 20 000→572 000, net 20 000→572 000) |
| budgets `v2_availability_requests.budget_minor` | ✅ 7 lignes, **51 000 → 572 000** |
| pourcentages 10→30 intacts | ✅ 11 remises `percentage`, **0 hors plage** |
| remise fixe `discount_value = 10000` | ✅ 1 ligne |
| `discount_kind` | `fixed, percentage` |

**Les deux familles monétaires, mesurées séparément (exigence handoff) :**

- **Offres (brut)** : 16/16 `XOF`, `price_minor` 20 000→650 000.
- **Wallet (×100)** : ledger 9 lignes, **0 valeur brute < 100** ; fourchette 2 000→998 000.

**Conclusion T2 :** rien à appliquer. La procédure « jetable d'abord » **n'a pas été déclenchée** (062
présente) — aucun trigger append-only à désarmer, aucune branche jetable créée, donc **0 résidu**.

---

## 3. T3 — Lignes bonus UM-6 : **MESURER, ne pas réécrire**

| Mesure | Valeur | Valeur correcte attendue (DEC-V2-09) |
|---|---|---|
| `v2_seller_unlocks` lignes | **0** | — |
| `v2_seller_unlocks` à `amount_minor = 10000` | **0** | (table vide) |
| ledger `bonus_grant` lignes | **2** | — |
| dont `amount_minor = 2000` (USD cents écrits bruts en XOF) | **2** | **1 000 000** XOF-minor (`convertUsdMinorToLocal(2000,'XOF')`) |
| dont `amount_minor = 1 000 000` (correct) | **0** | — |

**Détail des 2 lignes (`bonus_grant`, portefeuilles XOF, références facility-scoped, dates d'août) :**

| Référence | Montant | Date |
|---|---|---|
| `facility-bonus:…201` | 2 000 | 2026-08-22 |
| `facility-bonus:…202` | 2 000 | 2026-08-27 |

**Mais le rattrapage est DÉJÀ FAIT — en écritures compensatoires, sans réécriture :**

| Référence | Montant | Date |
|---|---|---|
| `bonus-correction:…201` | 998 000 (`reversal`) | 2026-09-27 |
| `bonus-correction:…202` | 998 000 (`reversal`) | 2026-09-27 |

→ Pour chacun des 2 portefeuilles : **2 000 + 998 000 = 1 000 000 XOF-minor = $20** (solde dérivé
mesuré : **2 000 000** pour le portefeuille portant les deux références). **La promesse fondateur
($20, DEC-V2-09) est tenue.** Les lignes historiques restent **intactes** — le ledger append-only a été
respecté, exactement comme prescrit (grandfather intact, « ne pas réécrire le sens »).

**Recommandation écrite (aucune réécriture — exige un ordre séparé) :**
1. **Ne rien réécrire.** Le solde est correct par construction (compensation explicite, auditable,
   horodatée). Réécrire les 2 lignes d'août effacerait la trace de la correction — régression.
2. **Traçabilité** : les 2 paires `bonus_grant`/`bonus-correction` sont un précédent de rattrapage à
   conserver comme exemple dans le prochain registre d'argent.
3. **Contrôle à garder** : un test/une requête de garde qui **échoue** si un `bonus_grant` apparaît à
   `amount_minor ≠ convertUsdMinorToLocal(SELLER_BONUS_USD_MINOR, wallet.currency)`. La constante est
   unique (`SELLER_BONUS_USD_MINOR = 2000`, USD cents) — c'est la bonne source, mais **aucun garde ne
   protège encore le ledger d'une écriture brute future**. C'est le résidu réel, pas les lignes d'août.

---

## 4. T4 — Prod / Vercel (LECTURE SEULE)

> **Vercel MCP n'est pas exposé dans le jeu d'outils de cette session.** Le contrôle de déploiement a
> été fait via l'**API GitHub `deployments`** (le fallback documenté) — même conclusion, lecture seule.

| Contrôle | Résultat |
|---|---|
| `93cd249` déployé ? | **OUI** — déploiement Production `6705498578`, 2026-09-28T08:20:18Z |
| dernier déploiement prod | **`7c91625`** — `6705668835`, 2026-09-28T08:30:37Z (docs-only ; inclut `93cd249`) |
| hash prod | `index-BGUSIwRj.js` + `index-CBsJf68R.css` |
| hash build local | `index-BGUSIwRj.js` + `index-CBsJf68R.css` → **prod === local (T-07d ✅)** |
| `GET /api/v2/public/routing` anonyme | **401 `AUTH_REQUIRED`** — « Sign in to get a road itinerary » |
| `GET /api/v2/public/facilities` | **200**, **206** facilités |

**Interprétation routing :** `AUTH_REQUIRED` est la **signature exacte** prédite par le dépôt quand un
**fournisseur facturé (Mapbox) est configuré** → le jeton est arrivé et le gate d'identité est actif.
Ce n'est **plus** `PROVIDER_NOT_CONFIGURED` (état du 2026-09-20). Cohérent avec DEC-V2-11.

**Aucun redeploy forcé, aucune variable d'environnement lue ni modifiée.**

---

## 5. Vérifications de fin de session

| Garde | Résultat |
|---|---|
| `npm run check:state` | (voir §6 — exécuté avant commit) |
| `npm run check:docs` | (voir §6) |

---

## 6. Commit

Rapport + ce fichier. Message : `docs: rapport MCP 062/census/prod`. Push `origin omni-v2-rebuild`.
