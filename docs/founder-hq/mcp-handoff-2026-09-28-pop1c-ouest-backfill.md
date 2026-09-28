# MCP Handoff — POP-1c-O vague Ouest : Ghana + Bénin + Burkina Faso (2026-09-28)

> **Protocole relais :** HQ a décidé (DEC-V2-13 vague 0 gardée, DEC-V2-14 Ouest GO) et committé ;
> MCP exécute le DB/Vercel, committe, rapporte, termine par le prompt retour §7. Pull latest d'abord.

## 0. Lecture obligatoire d'abord (dans l'ordre)

1. `AGENTS.md` (conventions, gardes, T-07d)
2. `docs/founder-hq/current-state.md` (porte Root — lire, jamais inférer)
3. `docs/omni-constitution-2026-09-28.md` (index validé)
4. `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-POP-01.md` (POP-1c-O `ready`)
5. `docs/nature-way/omni-pop1-intake-contract-2026-09-28.md` (§7 : scope, tiers, quarantine)
6. `docs/decisions/omni-decision-log.md` (DEC-V2-12/13/14 en vigueur)
7. `docs/founder-hq/mcp-report-2026-09-28-pop1c-togo-import.md` (précédent vague 0 : méthode éprouvée)
8. Ce fichier (tâches O1–O5 + interdits + rapport + prompt retour)

## 1. Règles (non négociables)

- Branche **`omni-v2-rebuild` uniquement**. Jamais `main`.
- **Un pays à la fois : Ghana, puis Bénin, puis Burkina Faso.** Stop-and-report GLOBAL à la fin
  des 3 (pas d'enchaînement Afrique sans rapport écrit).
- **Jetable d'abord, canonique ensuite**, par pays. Canonique identifiée **par ses données**.
- Pré-filtre « name vide » **intégré au transform AVANT batch** (le 400 batch-reject reste le
  contrat API — le pré-filtre vit dans l'outillage, compter les pré-filtrés et les rapporter).
- Scope world confirmé hors pilote (DEC-V2-14) : quarantine refusée-comptée partout.
- Preuves falsifiables ; aucun secret dans chat/commits/rapports ; aucun redeploy ; aucune variable.
- `check:state` (+ `check:docs` si docs) verts avant commit.

## 2. O0 — Re-vérification hash prod (T-07d, résiduel)

Entrée `deployments` pour le HEAD courant ; hash bundle prod === build local ; facilities count ;
routing 401. Rapporter les hashs exacts.

## 3. O1 — Extraits + transform (Geofabrik, PAS de live Overpass)

- Extraits pays : Ghana, Bénin, Burkina Faso (Geofabrik Africa). Noter tailles + versions d'extrait.
- Mêmes tags que vague 0 (shop/amenity-subset/craft/office/tourism-hôtellerie) + **pré-filtre
  name vide intégré** (compter les pré-filtrés par pays).
- `sourceRef` stable (`node/<id>`), attribution OSM conservée.
- Référence méthode : `scripts/transform-osm-extract.py` + `scripts/prove-pop1c-togo-import.mjs`
  (vague 0) — réutiliser, pas réinventer.

## 4. O2 — Dry-run par pays sur jetable (ZÉRO écriture canonique)

Par pays : distribution pilot/world/quarantine + raisons, counts pré-filtrés, perf p95, **zéro
canonique prouvé** (counts avant = après), jetable nettoyée (0 résidu vérifié).

## 5. O3 — Runs canoniques (un par pays, via `operator-import-batch?scope=world`)

- Jamais de SQL d'insertion directe. Idempotence `(source_id, source_ref)`, runs audités.
- Par pays : admis/créés/existants/quarantine vs dry-run, `intake_tier` présent, registre intact,
  claim spot-check S-18 (2 lieux, agnostique au tier).
- Rollback plan écrit par pays AVANT exécution (unclaimed de la fenêtre, jamais revendiqués) —
  **non exécuté sans ordre séparé**.
- **STOP après les 3 pays.** Pas de vague Afrique sans le rapport ci-dessous.

## 6. Interdits

- Pas d'enchaînement Afrique/monde ; pas de live Overpass pour le backfill.
- Pas de réécriture de lignes existantes hors `refreshed` prévu ; pas de promesse de stock ;
  pas de transactabilité nouvelle.

## 7. PROMPT RETOUR (à remplir et à rendre en fin de session MCP — verbatim)

```text
RELAY-RETOUR MCP POP-1c-Ouest 2026-09-28 (à coller dans la session HQ) :
1. O0 prod : [shas déployés oui/non, hash prod vs local, facilities count, routing behavior]
2. O1 extraits : [pays, taille/version, volumétrie transformée, pré-filtrés par pays]
3. O2 dry-run : [par pays : distribution pilot/world/quarantine + raisons, perf p95, zéro-canonique prouvé, jetables nettoyées]
4. O3 runs : [par pays : admis/créés/existants/quarantine vs dry-run, intake_tier présent, claim spot-check, registre OK]
5. Commits poussés : [shas + messages]
6. Gaps/décisions demandées : [liste, avec criticité]
7. Suite recommandée : [STOP conforme / vague Afrique GO (conditions) / bloqué par X + plus petite action]
```
