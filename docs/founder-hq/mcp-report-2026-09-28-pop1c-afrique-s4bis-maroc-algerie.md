# Rapport MCP — POP-1c-A S4-bis Maroc/Algérie (2026-09-28) — **B3 BLOQUÉ (capacité disque)**

> **Session MCP.** Handoff : `docs/founder-hq/mcp-handoff-2026-09-28-pop1c-afrique-s4bis-maroc-algerie.md`.
> **GO :** DEC-V2-25. **Branche :** `omni-v2-rebuild`. **Aucun secret · redeploy · variable · migration.**
> **Résultat : B0 ✅ · B1 ✅ (forecast figé+poussé) · B2 ❌ BLOQUÉ · B3 ❌ BLOQUÉ.**
> **Cause : le projet Neon (free_v3) a une limite de taille de branche de 512 Mo, DÉJÀ dépassée.**

---

## B0 — Prod / déploiement (T-07d) ✅

| Contrôle | Résultat |
|---|---|
| HEAD local | `6153383` (= attendu ✅) |
| Déploiement GitHub pour HEAD | `6716712075` @ `2026-09-28T17:49:08Z` ✅ |
| `sha256(index-BGUSIwRj.js)` prod | `dd1a1c7f39f3f2b7…` |
| `sha256(dist local)` | `dd1a1c7f39f3f2b7…` → **=== local (T-07d ✅)** |
| `GET /api/v2/public/facilities` | **HTTP 200**, 250 lignes |
| `GET /api/v2/public/routing` | **HTTP 401 AUTH_REQUIRED** (inchangé) |

## B1 — Forecast figé AVANT runs ✅ (`1765155`, poussé)

Détail complet : `docs/founder-hq/mcp-report-2026-09-28-pop1c-afrique-s4bis-forecast.md`.

| Pays | extrait | matched | importables | pré-filtrés | tiers (world/quarantine) |
|---|---|---|---|---|---|
| Maroc | `morocco-260927` 243,6 Mo | 42 389 | 34 020 | 8 369 | 35 055 / 7 334 |
| Algérie | `algeria-260927` 300,4 Mo | 43 269 | 25 288 | 17 981 | 27 865 / 15 404 |

- **Sahara occidental EXCLU MOTIVE** : aucun extrait Geofabrik propre (`western-sahara`/`sahara`
  redirigent vers la racine — pas de `.osm.pbf`) ; le territoire est **inclus dans `morocco-latest`**
  (min lat 21,33) → **filtre bbox** lat<27,67 ∧ lng<−8,6 (520 importables retirés).
- Chevauchements : **intra 12** ; **canonique Maroc 0 / Algérie 72** (16 `s4:tunisia`, 1 `s4:libya`,
  55 vague antérieure `c698af14`, **tous unclaimed, 0 revendiqué**).
- **Attendus** : 59 224 créés / 84 existants ; canonique 385 917 → **445 141**.

## B2 — Dry-run ❌ BLOQUÉ

- Branche jetable `pop1ca-s4bis-dryrun` (`br-morning-waterfall-ams1sjkv`) créée depuis la canonique.
- **Les 2 dry-runs ont échoué au premier INSERT** :
  `NeonDbError: could not extend file because project size limit (512 MB) has been exceeded`.
- **Test minimal falsifié** : 200 lignes seulement → **même erreur**. **Aucune écriture (même 200
  lignes) n'est possible**, même sur une branche jetable fraîchement dérivée.
- **Zéro-canonique** : trivialement prouvé (0 ligne écrite partout, y compris la jetable).
- **Jetable nettoyée** : `br-morning-waterfall-ams1sjkv` **supprimée**, résidus `pop1ca*` = 0.

## B3 — Runs canoniques ❌ BLOQUÉ (non exécutés)

Non lancés : la même limite s'applique à la canonique (elle en est déjà au-delà). **Aucune ligne
S4-bis n'a été écrite.** Canonique intacte : **385 917** facilités (inchangée).

## Cause racine (mesurée)

| Mesure | Valeur |
|---|---|
| Plan projet | **`free_v3`** (`juniorkheir@gmail.com`, org `org-curly-sea-14935988`) |
| **`branch_logical_size_limit`** | **512 Mo** |
| Canonique `br-dawn-hill-am5amy22` **logical_size** | **522 Mo** (déjà **+10 Mo AU-DESSUS**) |
| Canonique `pg_database_size` | **476 Mo** |
| Taille tables (top) | `v2_facility_source_refs` 120 Mo · `v2_facilities` 77 Mo · `v2_operator_runs` 76 Mo |
| `synthetic_storage_size` projet | **530 Mo** |
| Autres branches non archivées | `production` 58 Mo · `r3a-entity-trust-proof` 45 Mo · la jetable 530 Mo |

**Lecture :** les imports S1→S5 (324 k lieux) ont porté la branche canonique à **522 Mo logiques**,
soit **10 Mo au-dessus du plafond de 512 Mo**. Le projet a donc basculé dans un état où **toute
écriture est refusée** (« could not extend file »). **Ce n'est pas un défaut de code ni de données :
c'est un plafond d'infrastructure.** Le forecast S4-bis (~+60 Mo pour 59 k lignes) rendait le
dépassement certain même si on avait disposé de la marge résiduelle.

**Aggravant :** même une branche **jetable** hérite de la taille de sa parente → aucune preuve dry-run
n'est possible tant que la canonique est au-delà du plafond. Les branches non archivées
(`production` 58 Mo, `r3a-entity-trust-proof` 45 Mo, `pop1ca-s4bis-dryrun` 530 Mo — cette dernière
nous appartient et est **supprimée**) ne libèrent pas la canonique : la limite est **par branche**
(512 Mo), pas par projet ; archiver les autres branches ne débloque pas la canonique.

## Preuves falsifiées / limites

- **Falsification de capacité** : 2 dry-runs complet **+** un test 200 lignes → **tous** refusés par
  la limite ; l'hypothèse « il reste de la marge » est **démentie** empiriquement.
- **Falsification du périmètre** : le filtre Sahara occidental a ramené le chevauchement Maroc de 5 → 0
  (les 5 étaient dans la bbox exclue) — mesuré, pas supposé.
- **Limite honnête** : aucune donnée S4-bis importée ; le forecast (B1) reste la seule preuve produite.
  Rollback par pays **écrit** (procédure), **non exécuté** (rien à annuler).

## Rollback

`docs/founder-hq/mcp-rollback-plan-2026-09-28-pop1c-afrique-s4bis-maroc-algerie.md` — **écrit, NON
exécuté**. Cible éventuelle = fenêtre S4-bis (unclaimed, `account_id null`) ; jamais les revendiqués.

## Action requise (hors autorité MCP)

**Débloquer la capacité Neon** — décision/capacité **fondateur/plateforme**, hors autorité OpenHands :
soit **augmenter** le plan/limite, soit **réduire** les données (élaguer les `public_import`
`unclaimed` les moins utiles), soit **scinder** en plusieurs branches/projets. Sans cela, toute vague
suivante (Sahel/Ouest-nord, etc.) **échouera de la même façon**. Prochaine action la plus petite :
décision fondateur sur la capacité, puis **re-jouer S4-bis tel quel** (forecast déjà figé à `1765155`).
