# MCP Handoff — Vérification 062 + recensement canonique + prod (2026-09-28)

> **Protocole relais (permanent) :** la session HQ (sans MCP) prépare et committe ; la session
> MCP exécute le DB/Vercel, committe, rapporte, et termine par le prompt retour §7.
> Ce fichier est la source du prompt MCP — la session MCP le lit après `pull`.

## 0. Lecture obligatoire d'abord (dans l'ordre)

1. `AGENTS.md` (mémoire repo, conventions, gardes, T-07d)
2. `docs/founder-hq/current-state.md` (porte Root ouverte — lire, jamais inférer)
3. `docs/omni-constitution-2026-09-28.md` (index validé)
4. `docs/decisions/omni-decision-log.md` (DEC-V2-09/10/11 en vigueur)
5. Ce fichier (tâches T1–T4 + interdits + format de rapport + prompt retour)

## 1. Règles d'exécution (non négociables)

- Branche **`omni-v2-rebuild` uniquement**. `git pull` d'abord (HEAD attendu ≥ `93cd249`). Jamais `main`.
- **Lecture d'abord, écriture ensuite.** Chaque constat chiffré avant toute action.
- **Preuve falsifiable** : toute vérification doit pouvoir échouer (requête qui remonte le défaut
  si réintroduit, garde qui sort non-zéro).
- **Aucun secret** (tokens,DATABASE_URL, clés) dans le chat, les rapports ou les commits.
- `npm run check:state` (et `check:docs` si docs touchés) **verts avant tout commit**.
- Devises : deux familles documentées (wallet ×100 vs offres brut) — mesurer les deux avant de conclure.
- Conventions SQL apprises : caster les params entiers en CTE (`::int`) ; ne pas relire dans la
  même instruction ce qu'on vient d'écrire (snapshot) ; jamais de backtick dans un template literal ;
  pas d'agrégat sur uuid ; `json_agg` pas `array_agg(json_build_object)`.

## 2. T1 — Recensement canonique (LECTURE SEULE)

Identifier la branche canonique **par ses données** (référence attendue ≈ 206 facilités / 9 comptes
= ce que sert la prod), jamais par son nom. Mesurer et rapporter, avec requêtes + chiffres :

- `v2_facilities` : total · `unclaimed` · liées (`entity_id NOT NULL`) · avec adresse · hors zone
  (lng < 0 ou hors bbox TG) · `account_id NULL`
- `v2_entities` : total · par kind (`individu`/`organisation`)
- `v2_products` : total · publiés · par `availability_state` · avec `media=[]` · caractéristiques
  remplies (`position_kind`, `uniqueness_kind`, `handover_kind`, `price_kind`, `condition_kind`) ·
  devise (XOF vs autres) · fourchettes `price_minor`
- `v2_seller_unlocks` : lignes + valeurs `amount_minor` (compter les `10000` historiques)
- `omni_schema_migrations` : registre `044`→`064` présent + checksums (lister tout trou)
- `v2_route_requests`, `v2_buyer_credit_accounts`, `v2_ad_campaigns` : existence + volumétrie

## 3. T2 — Migration 062 (vérifier, puis appliquer SI absente — ordre fondateur inclus)

**Ordre fondateur (via ce relais) :** si `062_one_money_family.sql` n'est PAS appliquée au
canonique, l'appliquer selon la procédure prouvée. Le code au HEAD l'exige déjà (offres ×100).

1. Vérifier : entrée registre + colonnes (`discount_value` renommé, commentaires `pg_description`
   sur les 12 colonnes) + échantillons : products 20000..650000 · snapshots `net == unit × qté`
   **0 violation** · budgets 51000..572000 · pourcentages 10→30 intacts · remise fixe 10000.
2. Si absent : rejouer la preuve sur branche **jetable** (idempotence re-run + cas hostiles :
   CHECK rejette `-1`, trigger append-only ré-armé, re-run = no-op), **puis** canonique +
   registre + mêmes vérifications. Pattern snapshots FF-8 (disable→rescale→assert count→re-arm).
   Nettoyer la jetable (0 résidu vérifié).
3. Rapporter checksums, counts avant/après, trigger ré-armé. **Ne pas réécrire le sens** des lignes
   au-delà de la migration (grandfather intact).

## 4. T3 — Données bonus UM-6 (MESURER, ne pas réécrire)

- Compter les lignes `v2_seller_unlocks` à `amount_minor = 10000` (historique) vs écrites via la
  constante (`SELLER_BONUS_USD_MINOR` → conversion).
- **NE PAS réécrire de lignes d'argent.** Recommandation écrite dans le rapport (plan de
  rattrapage chiffré) — la réécriture exige un ordre séparé.
- Référence : bonus = 20 USD, DEC-V2-09 (décision fondateur 2026-09-28).

## 5. T4 — Prod/Vercel (LECTURE SEULE, aucun redeploy, aucune variable)

- `GET /v6/deployments?projectId=<P>&target=production&limit=5` : `93cd249` déployé ? `meta.githubCommitSha`.
- Hash bundle prod (`omni.sparkafrika.online`) vs build local (T-07d) — comparer les **sha**, pas les noms.
- `GET /api/v2/public/routing` anonyme : `401 AUTH_REQUIRED` (jeton arrivé) vs `PROVIDER_NOT_CONFIGURED`.
- `GET /api/v2/public/facilities` : 200 + compte (≈ 206 ?).
- Ne toucher à **aucune** variable d'environnement. Ne forcer **aucun** déploiement.

## 6. Commit + rapport (session MCP)

- Committer : rapport `docs/founder-hq/mcp-report-2026-09-28-062-census-prod.md` (+ preuves
  `docs/nature-way/` si scripts de preuve ajoutés). Message : `docs: rapport MCP 062/census/prod + preuves`.
- `check:state` (+ `check:docs` si docs) verts avant commit. Push `origin omni-v2-rebuild`.
- Le rapport suit le format §7 (preuves par tâche : requêtes, chiffres, checksums, hashs).

## 7. PROMPT RETOUR (à remplir et à rendre en fin de session MCP — verbatim)

```text
RELAY-RETOUR MCP 2026-09-28 (à coller dans la session HQ) :
1. T1 census : [chiffres clés + registre 044→064 OK/KO + anomalies]
2. T2 062 : [déjà appliquée / appliquée par moi (checksums, counts) / non appliquée + pourquoi]
3. T3 unlocks : [lignes 10000 = N,written-via-constante = M, recommandation rattrapage]
4. T4 prod : [93cd249 déployé oui/non, hash prod vs local, routing behavior, facilities count]
5. Commits poussés : [shas + messages]
6. Gaps/décisions demandées : [liste, avec criticité]
7. Prochaine tranche recommandée : [POP-1 go / bloqué par X + plus petite action]
```
