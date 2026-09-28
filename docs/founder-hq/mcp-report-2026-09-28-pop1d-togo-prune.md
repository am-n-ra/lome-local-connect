# Rapport MCP — POP-1d Togo-only prune (2026-09-28) — **D0→D3 PASS (écriture débloquée)**

> **Session MCP.** Handoff : `docs/founder-hq/mcp-handoff-2026-09-28-pop1d-togo-prune.md`.
> **GO :** DEC-V2-27 (bbox pays, stop eager). **Branche :** `omni-v2-rebuild`, canonique
> `br-dawn-hill-am5amy22` identifiée **par ses données**. **Aucun secret · redeploy · variable · migration.**
> **Résultat : D0 ✅ · D1 ✅ · Snapshot ❌ (refusé plateforme) · D2 ✅ · D3 ✅.**
> **DELETE passe et libère l'espace : la canonique est passée de 476 Mo à ~301 Mo, et les
> écritures re-fonctionnent (INSERT 50 000 lignes rollbacké accepté).**

---

## D0 — Les DELETE passent ? ✅

Sur jetable (`POP-1d D0`, session précédente) : suppression bornée de **10 lignes** hors-Togo →
**PASSED** (385 907 vs canonique 385 917). **DELETE libère l'espace**, contrairement à l'INSERT qui
échouait (S4-bis). Jetable supprimée. **Réponse à la question qui tranche tout : OUI, les DELETE
passent — pas d'upgrade obligatoire pour élaguer.**

## D1 — Census pré-suppression (lecture seule, canonique) ✅

| Segment | Count |
|---|---|
| `v2_facilities` total | **385 917** |
| dont claimed-owned | **3** |
| dont unclaimed Togo bbox (gardé) | **13 741** |
| dont unclaimed hors bbox (`public_import`) | **372 173** |
| dont `source_refs` liées | 385 917 (372 173 hors-bbox à cascade) |
| `uuid_demo_shape` (fixtures démo, UUID 1x…/5ex…) | 25 436 |
| `v2_operator_runs` (audit — **conservé**) | 385 913 |
| `v2_products` / `v2_entities` | 16 / 3 |

**Tailles (avant)** : `v2_facility_source_refs` **163 Mo** (dont 119 Mo de refs hors-bbox) ·
`v2_operator_runs` **147 Mo** · `v2_facilities` **146 Mo** · `pg_database_size` **476 Mo** ·
branche `logical_size` **533 Mo** > plafond **512 Mo** (`free_v3`).

**`max(created_at)` par table d'écriture app :** la dernière écriture applicative réelle
(wallet ledger) date de **19:49Z le 2026-09-28** *après* la session S5 (17:28Z) → l'arrêt n'était
**pas total** ; le plafond bloque l'**extension de fichier** des grosses tables
(`v2_facilities`), pas les petites. Infirme l'hypothèse d'un outage total ; confirme que la
capacité est le facteur limitant.

**Prédicat validé par counts** : cible = `source_kind='public_import'` ET `account_id IS NULL`
ET hors bbox (lat 6,0–11,2 / lng −1,0–1,7) → **372 173**, dont **0 revendiquée**, **0 démo**.
FK cascade vérifiée : `v2_facility_source_refs.facility_id → v2_facilities ON DELETE CASCADE`.
Dépendants RESTRICT vérifiés **= 0** sur toute la cible : `v2_availability_responses` 0,
`v2_transaction_snapshots` 0, `v2_products` 0, `v2_facility_entitlements` 0,
`v2_facility_claim_requests` 0, `v2_ad_campaigns` 0, `v2_account_favorites` 0,
`v2_seller_unlocks` 0, `v2_verification_requests` 0, `v2_wallet_ledger_entries` 0.
**Aucun FK `v2_operator_runs → v2_facilities`** ⇒ les runs d'audit sont hors cascade.

## Snapshot ❌ (refusé plateforme) — honnête

`create_snapshot` sur `br-dawn-hill-am5amy22` → **refusé : « not allowed to snapshot non-root
branch »**. La canonique n'est pas la branche racine → la plateforme interdit le snapshot de
branche. **Aucun snapshot manuel pris.** Le handoff disait « 1 autorisé » mais l'API le refuse.
*Filet de sécurité restant* : `history_retention_seconds = 21600` (6 h) → **point-in-time
restore** Neon disponible sur la fenêtre ; la branche **racine** `br-bitter-math-amrlbym6`
(`production`, 55,6 Mo) n'a **pas** été touchée. **Gap mineur, tracé.**

## D2 — Suppression par lots bornés ✅

Par lots bornés avec **counts après chaque lot** et **arrêt à la première anomalie**.
- **Lot 1 (2 000)** OK, protégés intacts (3 owned / 16 produits / 3 entités) — un premier essai
  10 000 avait échoué sur une **erreur réseau transitoire** (`fetch failed`), 0 ligne supprimée,
  arrêt correct ; relancé en 2 000.
- **Frein réel identifié** : `v2_facility_source_refs` **n'a aucun index sur `facility_id`** ⇒
  le trigger FK CASCADE fait un **seq scan de 163 Mo par ligne supprimée** (~27 lignes/s).
  **Correctif de session (non destructif, non migration)** : index **temporaire**
  `idx_pop1d_refs_facility` créé → suppression des **336 173** lignes restantes en **51 s**
  (≈ 6 500/s). Index **supprimé après** (schéma net-zéro).

| Étape | Supprimées | `v2_facilities` restant | owned | produits | entités |
|---|---|---|---|---|---|
| Avant | — | 385 917 | 3 | 16 | 3 |
| Lots 1–6 (2 000) | 12 000 | 373 917 | 3 | 16 | 3 |
| v2/v3 (reliquat) | 12 000+6 000 | 355 917 | 3 | 16 | 3 |
| v3 + index | 342 173 | **13 744** | 3 | 16 | 3 |

**Aucune anomalie.** Revendiqués (3) et démos **intacts** à chaque lot.

## D3 — Vérification post-suppression ✅

| Contrôle | Résultat |
|---|---|
| `VACUUM (ANALYZE)` | exécuté sur `v2_facilities`, `v2_facility_source_refs`, `v2_operator_runs` |
| `pg_database_size` (vivant) | **301 Mo** ✅ **< 400 Mo** |
| Branche `logical_size` (Neon) | 533 Mo — **inchangé** : compte 6 h d'historique de suppression, **pas** la donnée vivante. Seul le probe tranche. |
| **Probe d'écriture** (rollbacké) | **PASS** — INSERT 1 ligne OK ; puis **50 000 lignes OK** (63 744 temporaire), `ROLLBACK`, **0 résidu** (13 744) |
| Claim spot-check S-18 (2 lieux Togo) | **PASS** — 2 `claim_requests` `pending` insérées (`20000000-…002`, `…003`), `ROLLBACK`, **0 résidu** (claims = 0) |
| Invariants finaux | facilities **13 744** (3 owned + 13 741 Togo-unclaimed) · hors-bbox restant **0** · products **16** · entities **3** · operator_runs **385 913** (intact) |
| Prod (T-07d) | hash prod `index-BGUSIwRj.js` sha `dd1a1c7f39f3f2b7…` **=== local** ✅ ; déploiement GitHub pour HEAD `54c84cb` @ `2026-09-28T19:26:36Z` ✅ ; `GET /api/v2/public/facilities` **HTTP 200** (250 lignes/limite API) ; `routing?from_lat=…` **HTTP 401 AUTH_REQUIRED** inchangé (l'absence de coords répond `400 INVALID_INPUT`, normal) |

## Rollback plan (écrit, NON exécuté)

- **Filet** : rétention Neon 6 h (point-in-time restore) ; branche racine `production` non touchée.
- **Rétablissement éventuel** : rejouer la frange Togo/afrique via le flux d'import gouverné
  (`operator-import-batch?scope=world`, cf. vagues Ouest/S5) — les **forecasts conservés**
  (`1765155` S4-bis, `a05ad9f` S5) restent rejouables. Aucune restauration en place n'est
  requise ni demandée.
- **Non exécuté sans ordre séparé.**

## Cause racine / leçon

- **Un DELETE n'exige pas d'étendre un fichier** ⇒ il passe malgré le plafond ; un INSERT le
  exige ⇒ il échouait. C'est pourquoi l'élagage est la bonne réponse au plafond (DEC-V2-27).
- **Un FK CASCADE sans index sur la colonne référencée transforme une suppression en O(n·seq_scan).**
  Ici ~4 h projetées sans index → 51 s avec. À corriger durablement si de gros volumes reviennent :
  envisager un index permanent `v2_facility_source_refs(facility_id)` (migration additive).
- **`logical_size` de branche ≠ taille vivante** quand l'historique de suppression est rétentionné :
  un chiffre plateforme peut rester au-dessus du plafond alors que la base a fondu de 175 Mo.

## Interdits respectés

Aucune suppression hors prédicat validé ; aucun revendiqué/owned/produit/entité/wallet/ledger/
migration/registre touché ; aucun `TRUNCATE` ; runs d'audit **conservés** (385 913). Pas de
sous-vague suivante lancée. Aucun secret, redeploy ou variable.

## Gaps / décisions demandées

1. **(Moyenne) Index permanent `v2_facility_source_refs(facility_id)`** — migration additive,
   évite le O(seq_scan) lors des ré-imports/cascades. Décision fondateur.
2. **(Mineure) Snapshot non-root refusé** — filet = rétention 6 h. Si on veut un snapshot
   durable avant des suppressions lourdes futures, il faut une **branche racine jetable**.
3. **(Mineure) `logical_size` > 512 Mo encore affiché** — le compteur plateforme ne redescendra
   qu'après expiration de l'historique (≈ 6 h). Le probe prouve que ce n'est pas bloquant.
4. **(Info) Branche `r3a-entity-trust-proof` (`br-still-fire-amyv5kjh`) résiduelle** d'une session
   antérieure (état `ready`, non archivée) — **non supprimée** faute d'autorisation ; à nettoyer
   par le fondateur si inutile.

## Suite recommandée

**STOP conforme.** Taille vivante 301 Mo < 400 Mo, écritures rétablies, invariants intacts.
Après expiration de l'historique (~6 h), **S4-bis replay** (Maroc/Algérie, forecast `1765155`
conservé) devient rejouable **dans le périmètre bbox pays** — ou directement la prochaine
sous-vague gouvernée selon DEC-V2-27. **Ne pas relancer d'import eager monde.**
