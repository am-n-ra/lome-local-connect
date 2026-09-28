# MCP Handoff — POP-1c-A S3 Est : forecast d'abord, sous-vagues pays, stop-and-report (2026-09-28)

> **STATUT : GO FONDATEUR REÇU 2026-09-28** (« oui et go » — S1/S2 gardées, S3 Est GO, DEC-V2-18/19).
> Exécutable immédiatement.
> relayés par HQ (avec l'acceptation S1/S2). Pré-écrit pour ne pas perdre un tour.
> **Protocole relais :** HQ a préparé ; MCP exécute le DB/Vercel, committe, rapporte, termine
> par le prompt retour §7. Pull latest d'abord.

## 0. Lecture obligatoire d'abord (dans l'ordre)

1. `AGENTS.md` (conventions, gardes, T-07d)
2. `docs/founder-hq/current-state.md` (porte Root — lire, jamais inférer)
3. `docs/omni-constitution-2026-09-28.md` (index validé)
4. `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-POP-01.md` (POP-1c-A-S3 `ready`)
5. `docs/nature-way/omni-pop1-intake-contract-2026-09-28.md` (§7 : scope, tiers, quarantine)
6. `docs/decisions/omni-decision-log.md` (DEC-V2-12…17 en vigueur)
7. `docs/founder-hq/mcp-report-2026-09-28-pop1c-afrique-s2-centrale.md` + `mcp-report-2026-09-28-pop1c-afrique-s1-ouest-reste.md` (précédents : transform avec pré-filtre, scripts `transform-osm-extract.py` + `prove-*.mjs` — réutiliser, pas réinventer)
8. Ce fichier (tâches E1–E4 + interdits + rapport + prompt retour)

## 1. Règles (non négociables)

- Branche **`omni-v2-rebuild` uniquement**. Jamais `main`.
- **Forecast écrit AVANT tout run** (commit séparé) : extraits, volumétrie matched/importables/
  pré-filtrés, distribution tiers estimée, chevauchements frontaliers estimés (leçon S1/S2 :
  chaque frontière inter-pays ajoute du dédup à prévoir).
- **Jetable d'abord, canonique ensuite**, par pays ou groupe de pays. Canonique identifiée
  **par ses données** (≈ 142 471 facilités au départ), jamais par son nom.
- Pré-filtre « name vide » **reste intégré** (compter les pré-filtrés ; batch-reject conservé).
- Scope world confirmé ; quarantine refusée-comptée partout. Pas de live Overpass pour le backfill.
- Preuves falsifiables ; aucun secret dans chat/commits/rapports ; aucun redeploy ; aucune variable.
- `check:state` (+ `check:docs` si docs) verts avant commit.

## 2. E0 — Re-vérification hash prod (T-07d, résiduel)

Entrée `deployments` pour le HEAD courant ; hash bundle prod === build local ; facilities count ;
routing 401. Rapporter les hashs exacts.

## 3. E1 — Extraits Afrique de l'Est + FORECAST FIGÉ (Geofabrik, PAS de live Overpass)

- Périmètre : résoudre les noms exacts d'extraits Geofabrik (Kenya, Ouganda, Tanzanie, Rwanda,
  Burundi, Éthiopie, Somalie, Soudan du Sud, Érythrée, Djibouti, + îles si extrait propre).
  Noter explicitement tout pays EXCLU de S3 et pourquoi (reporté en S4+ ou hors périmètre).
- Mêmes tags que vagues précédentes + attribution OSM + `sourceRef node/<id>` stable.
- **Commit forecast séparé AVANT tout run.** Ne pas lancer de dry-run sans forecast écrit.

## 4. E2 — Dry-run par pays sur jetable (ZÉRO écriture canonique)

Distribution pilot/world/quarantine + raisons, `rejectedByNormalization=0` attendu (pré-filtre),
perf p95 vs référence 186 ms (**stop si dégradation non plafonnée**), zéro-canonique prouvé
(counts avant = après), jetable nettoyée (0 résidu vérifié).

## 5. E3 — Runs canoniques (un par pays, via `operator-import-batch?scope=world`)

- Jamais de SQL d'insertion directe. Idempotence `(source_id, source_ref)`, runs audités.
- Par pays : admis/créés/existants/quarantine vs forecast, `intake_tier` présent, registre intact,
  claim spot-check S-18 (2 lieux, agnostique au tier).
- Rollback plan écrit par pays AVANT exécution (unclaimed de la fenêtre, jamais revendiqués) —
  **non exécuté sans ordre séparé**.
- **STOP après la sous-vague.** Pas de sous-vague suivante (Nord) sans le rapport ci-dessous.

## 6. Interdits

- Pas de sous-vague suivante sans rapport écrit ; pas de live Overpass pour le backfill.
- Pas de réécriture de lignes existantes hors `refreshed` prévu ; pas de promesse de stock ;
  pas de transactabilité nouvelle ; pas de changement du contrat d'API.

## 7. PROMPT RETOUR (à remplir et à rendre en fin de session MCP — verbatim)

```text
RELAY-RETOUR MCP POP-1c-A-S3 Est 2026-09-28 (à coller dans la session HQ) :
1. E0 prod : [shas déployés oui/non, hash prod vs local, facilities count, routing behavior]
2. E1 forecast : [par pays : taille/version, matched/importables/pré-filtrés, tiers estimés, chevauchements estimés, pays exclus + motif, commit forecast]
3. E2 dry-run : [par pays : distribution + raisons, rejectedByNormalization=0, perf p95 vs 186 ms, zéro-canonique prouvé, jetables nettoyées]
4. E3 runs : [par pays : admis/créés/existants/quarantine vs forecast, intake_tier présent, claim spot-check, registre OK]
5. Commits poussés : [shas + messages]
6. Gaps/décisions demandées : [liste, avec criticité]
7. Suite recommandée : [STOP conforme / sous-vague Nord GO (conditions) / bloqué par X + plus petite action]
```
