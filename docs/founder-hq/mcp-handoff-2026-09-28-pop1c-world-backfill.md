# MCP Handoff — POP-1c run monde par vagues : extrait → dry-run → canonique (2026-09-28)

> **Protocole relais :** HQ a décidé (VOLUME monde entier DEC-V2-12) et committé le code ; MCP
> exécute le DB/Vercel, committe, rapporte, termine par le prompt retour §7. Pull latest d'abord.

## 0. Lecture obligatoire d'abord (dans l'ordre)

1. `AGENTS.md` (conventions, gardes, T-07d)
2. `docs/founder-hq/current-state.md` (porte Root — lire, jamais inférer)
3. `docs/omni-constitution-2026-09-28.md` (index validé)
4. `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-POP-01.md` (plan + handoff, POP-1c `ready`)
5. `docs/nature-way/omni-pop1-intake-contract-2026-09-28.md` (§7 : scope, tiers, quarantine)
6. `docs/decisions/omni-decision-log.md` (DEC-V2-10/11/12 en vigueur)
7. Ce fichier (tâches C1–C5 + interdits + rapport + prompt retour)

## 1. Règles (non négociables)

- Branche **`omni-v2-rebuild` uniquement**. Jamais `main`.
- **Jetable d'abord, canonique ensuite, vague par vague avec stop-and-report.** Aucune vague
  suivante sans counts + perf de la vague courante écrits au rapport.
- Canonique identifiée **par ses données** (≈ 206 facilités au départ), jamais par son nom.
- Preuves falsifiables ; aucun secret dans chat/commits/rapports ; aucun redeploy ; aucune variable.
- `check:state` (+ `check:docs` si docs) verts avant commit.

## 2. C0 — Re-vérification hash prod (T-07d, résiduel des pushs 7c6a925/890e9e9/688a0ce)

Entrée `deployments` pour chaque sha ; hash bundle prod === build local ; `/api/v2/public/facilities`
200 ; routing anonyme 401. Rapporter les hashs exacts. (Docs-only et rebuilds précédents déjà
couverts partiellement — clore définitivement ici.)

## 3. C1 — Extrait préparé (source : Geofabrik, PAS de live Overpass pour le backfill)

- Extraits : Togo (canari) → Afrique de l'Ouest → Afrique → monde. Un périmètre à la fois.
- Filtre tags : `shop=*` · `amenity` ⊂ {restaurant, cafe, fast_food, pharmacy, bank, atm, bar,
  fuel…} · `craft=*` · `office=*` · `tourism` ⊂ {hotel, guest_house, hostel}. Pas de pré-filtre
  qualité au-delà des tags — le classifieur (`place-intake.ts`) fait le tri (pilot/world/quarantine).
- Transform → payloads batch `{sourceRef (type/id OSM), name, category, address, latitude, longitude}`.
  `sourceRef` stable et unique par objet OSM (dedupe `(source_id, source_ref)`).
- Attribution OSM conservée de bout en bout (exigence contrat endpoint).

## 4. C2 — Dry-run par vague sur jetable (ZÉRO écriture canonique)

Par vague, sur branche **jetable** depuis le canonique : exercer le chemin
d'import contre la jetable (`operator-import-batch?scope=world`, compte opérateur) et compter :
admis (pilot/world) / `skippedOutOfZone` / `skippedQuarantine` + raisons. **Zéro ligne canonique
touchée** — prouver le zéro (counts avant = après). Sondes perf : p95 `public/facilities` avant/après
l'échantillon. Nettoyer la jetable (0 résidu vérifié). Stop-and-report : n'ouvrir la vague
canonique qu'avec les chiffres écrits.

## 5. C3 — Run canonique vague 0 (Togo), puis stop

- Vague 0 = Togo uniquement, via le batch endpoint (jamais de SQL d'insertion directe) :
  idempotence par `(source_id, source_ref)` (rejeu sûr), runs audités (`v2_operator_runs`).
- Vérifier : counts admis/quarantine conformes au dry-run (± tolérance documentée), `raw_metadata`
  porte `intake_tier`, registre migrations intact, claim spot-check sur 2–3 nouveaux unclaimed
  (S-18 agnostique au tier).
- **STOP après la vague 0.** Les vagues suivantes (Ouest → Afrique → monde) partent sur revue
  async du rapport (le fondateur peut stopper — délégation : revue non bloquante sauf stop explicite,
  mais ne pas enchaîner sans le rapport écrit).
- Rollback par run si nécessaire : supprimer les unclaimed de la fenêtre du run uniquement
  (`account_id null`, jamais les revendiqués) — plan écrit avant exécution, jamais d'UPDATE aveugle.

## 6. Interdits

- Pas de SQL d'insertion directe contournant l'endpoint (dedupe/audit/validation).
- Pas de réécriture de lignes existantes (grandfather intact) hors `refreshed` prévu par le contrat.
- Pas de promesse de stock sur l'unclaimed ; pas de transactabilité nouvelle (gates claim→entité→publication inchangés).
- Pas de live Overpass pour le backfill ; pas de counties/pays hors vague courante.

## 7. PROMPT RETOUR (à remplir et à rendre en fin de session MCP — verbatim)

```text
RELAY-RETOUR MCP POP-1c 2026-09-28 (à coller dans la session HQ) :
1. C0 prod : [shas déployés oui/non, hash prod vs local, facilities count, routing behavior]
2. C1 extrait : [source, tags, volumétrie par vague]
3. C2 dry-run : [bbox, distribution pilot/world/quarantine + raisons, perf p95, zéro-canonique prouvé, jetable nettoyée]
4. C3 vague Togo : [admis/créés/existants/quarantine vs dry-run, intake_tier présent, claim spot-check, registre OK]
5. Commits poussés : [shas + messages]
6. Gaps/décisions demandées : [liste, avec criticité]
7. Suite recommandée : [vague Ouest go (conditions) / stop — motif + plus petite action]
```
