# MCP Handoff — POP-1c-A S4 Nord : forecast d'abord, sous-vague pays, stop-and-report (2026-09-28)

> **STATUT : EN ATTENTE DES MOTS FONDATEUR** (S3 gardée ? S4 Nord GO ?). Ne pas exécuter sans
> les deux. Pré-écrit pour ne pas perdre un tour.
> **Protocole relais :** HQ a réconcilié S3 ; MCP exécute le DB/Vercel, committe, rapporte,
> termine par le prompt retour §7. Pull latest d'abord.

## 0. Lecture obligatoire d'abord (dans l'ordre)

1. `AGENTS.md` (conventions, gardes, T-07d)
2. `docs/founder-hq/current-state.md` (porte Root — lire, jamais inférer)
3. `docs/omni-constitution-2026-09-28.md` (index validé)
4. `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-POP-01.md` (POP-1c-A-S4 `ready`)
5. `docs/nature-way/omni-pop1-intake-contract-2026-09-28.md` (§7 : scope, tiers, quarantine)
6. `docs/decisions/omni-decision-log.md` (DEC-V2-12…19 en vigueur)
7. `docs/founder-hq/mcp-report-2026-09-28-pop1c-afrique-s3-est.md` (précédent : forecast figé,
   transform avec pré-filtre, scripts — réutiliser, pas réinventer)
8. Ce fichier (tâches N1–N4 + interdits + rapport + prompt retour)

## 1. Règles (non négociables)

- Branche **`omni-v2-rebuild` uniquement**. Jamais `main`.
- **Forecast écrit AVANT tout run** (commit séparé) : extraits, volumétrie matched/importables/
  pré-filtrés, distribution tiers estimée, chevauchements frontaliers estimés (leçon S1/S2/S3 :
  chaque frontière ajoute du dédup à prévoir, intra-sous-vague + canonique).
- **Jetable d'abord, canonique ensuite**, par pays. Canonique identifiée **par ses données**
  (≈ 278 997 facilités au départ), jamais par son nom.
- Pré-filtre « name vide » **reste intégré** (compter les pré-filtrés ; batch-reject conservé).
- Scope world confirmé ; quarantine refusée-comptée partout. Pas de live Overpass pour le backfill.
- Preuves falsifiables ; aucun secret dans chat/commits/rapports ; aucun redeploy ; aucune variable.
- `check:state` (+ `check:docs` si docs) verts avant commit.

## 2. N0 — Re-vérification hash prod (T-07d, résiduel)

Entrée `deployments` pour le HEAD courant ; hash bundle prod === build local ; facilities count ;
routing 401. Rapporter les hashs exacts.

## 3. N1 — Extraits Afrique du Nord + FORECAST FIGÉ (Geofabrik, PAS de live Overpass)

- Périmètre : Soudan, Égypte, Libye, Tunisie (référence S3 : reportés en S4). Résoudre les noms
  exacts d'extraits ; noter explicitement tout pays EXCLU de S4 et pourquoi.
- Mêmes tags que vagues précédentes + attribution OSM + `sourceRef node/<id>` stable.
- **Commit forecast séparé AVANT tout run.** Ne pas lancer de dry-run sans forecast écrit.

## 4. N2 — Dry-run par pays sur jetable (ZÉRO écriture canonique)

Distribution pilot/world/quarantine + raisons, `rejectedByNormalization=0` attendu (pré-filtre),
perf p95 vs référence 169 ms (**stop si dégradation non plafonnée**), zéro-canonique prouvé
(counts avant = après), jetable nettoyée (0 résidu vérifié).

## 5. N3 — Runs canoniques (un par pays, via `operator-import-batch?scope=world`)

- Jamais de SQL d'insertion directe. Idempotence `(source_id, source_ref)`, runs audités.
- Par pays : admis/créés/existants/quarantine vs forecast, `intake_tier` présent, registre intact,
  claim spot-check S-18 (2 lieux, agnostique au tier).
- Rollback plan écrit par pays AVANT exécution (unclaimed de la fenêtre, jamais revendiqués) —
  **non exécuté sans ordre séparé**.
- **STOP après la sous-vague.** Pas de sous-vague suivante (Australe) sans le rapport ci-dessous.

## 6. Interdits

- Pas de sous-vague suivante sans rapport écrit ; pas de live Overpass pour le backfill.
- Pas de réécriture de lignes existantes hors `refreshed` prévu ; pas de promesse de stock ;
  pas de transactabilité nouvelle ; pas de changement du contrat d'API.

## 7. PROMPT RETOUR (à remplir et à rendre en fin de session MCP — verbatim)

```text
RELAY-RETOUR MCP POP-1c-A-S4 Nord 2026-09-28 (à coller dans la session HQ) :
1. N0 prod : [shas déployés oui/non, hash prod vs local, facilities count, routing behavior]
2. N1 forecast : [par pays : taille/version, matched/importables/pré-filtrés, tiers estimés, chevauchements estimés, pays exclus + motif, commit forecast]
3. N2 dry-run : [par pays : distribution + raisons, rejectedByNormalization=0, perf p95 vs 169 ms, zéro-canonique prouvé, jetables nettoyées]
4. N3 runs : [par pays : admis/créés/existants/quarantine vs forecast, intake_tier présent, claim spot-check, registre OK]
5. Commits poussés : [shas + messages]
6. Gaps/décisions demandées : [liste, avec criticité]
7. Suite recommandée : [STOP conforme / sous-vague Australe GO (conditions) / bloqué par X + plus petite action]
```
