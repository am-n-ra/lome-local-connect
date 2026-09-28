# MCP Handoff — POP-1c-Afrique : sous-vagues avec stop-and-report (2026-09-28)

> **Protocole relais :** HQ a décidé (DEC-V2-15 Ouest gardée, DEC-V2-16 boîte documentée,
> DEC-V2-17 Afrique GO) et committé ; MCP exécute le DB/Vercel, committe, rapporte, termine
> par le prompt retour §7. Pull latest d'abord.

## 0. Lecture obligatoire d'abord (dans l'ordre)

1. `AGENTS.md` (conventions, gardes, T-07d)
2. `docs/founder-hq/current-state.md` (porte Root — lire, jamais inférer)
3. `docs/omni-constitution-2026-09-28.md` (index validé)
4. `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-POP-01.md` (POP-1c `in_progress`)
5. `docs/nature-way/omni-pop1-intake-contract-2026-09-28.md` (§7 : scope, tiers, quarantine)
6. `docs/decisions/omni-decision-log.md` (DEC-V2-12…17 en vigueur)
7. `docs/founder-hq/mcp-report-2026-09-28-pop1c-ouest.md` (précédent : méthode éprouvée, transform
   avec pré-filtre — réutiliser, pas réinventer)
8. Ce fichier (tâches A1–A5 + interdits + rapport + prompt retour)

## 1. Règles (non négociables)

- Branche **`omni-v2-rebuild` uniquement**. Jamais `main`.
- **Sous-vagues séquentielles : Ouest restante → Centrale → Est → Nord → Australe.**
  Stop-and-report GLOBAL à la fin de **chaque** sous-vague (pas d'enchaînement sans rapport écrit).
- **Jetable d'abord, canonique ensuite**, par sous-vague. Canonique identifiée **par ses données**.
- Pré-filtre « name vide » **reste intégré** au transform (compter les pré-filtrés par sous-vague).
- Scope world confirmé ; quarantine refusée-comptée partout ; batch-reject conservé (contrat API).
- Preuves falsifiables ; aucun secret dans chat/commits/rapports ; aucun redeploy ; aucune variable.
- `check:state` (+ `check:docs` si docs) verts avant commit.

## 2. A0 — Re-vérification hash prod (T-07d, résiduel)

Entrée `deployments` pour le HEAD courant ; hash bundle prod === build local ; facilities count ;
routing 401. Rapporter les hashs exacts.

## 3. A1 — Extraits + volumétrie forecast AVANT tout (Geofabrik, PAS de live Overpass)

Par sous-vague, **d'abord** : taille/version d'extrait, volumétrie transformée estimée
(matched/importables/pré-filtrés par la méthode Ouest), distribution tiers estimée. **Ne lancer
aucun run canonique dont le forecast n'est pas écrit.** Référence d'échelle : Ouest = 37 501
matchés → 28 479 importables → 28 360 créés ; p95 166 ms au plafond 250 lignes.

## 4. A2 — Dry-run par sous-vague sur jetable (ZÉRO écriture canonique)

Distribution pilot/world/quarantine + raisons, perf p95 vs référence 166 ms (**stop si dégradation
significative non plafonnée**), zéro-canonique prouvé (counts avant = après), jetable nettoyée
(0 résidu vérifié).

## 5. A3 — Runs canoniques (un par sous-vague, via `operator-import-batch?scope=world`)

- Jamais de SQL d'insertion directe. Idempotence `(source_id, source_ref)`, runs audités.
- Par sous-vague : admis/créés/existants/quarantine vs dry-run, `intake_tier` présent, registre
  intact, claim spot-check S-18 (2 lieux, agnostique au tier).
- Rollback plan écrit par sous-vague AVANT exécution (unclaimed de la fenêtre, jamais revendiqués)
  — **non exécuté sans ordre séparé**.
- **STOP après chaque sous-vague.** Pas de sous-vague suivante sans le rapport ci-dessous.

## 6. Interdits

- Pas de sous-vague suivante sans rapport écrit ; pas de live Overpass pour le backfill.
- Pas de réécriture de lignes existantes hors `refreshed` prévu ; pas de promesse de stock ;
  pas de transactabilité nouvelle ; pas de changement du contrat d'API.

## 7. PROMPT RETOUR (à remplir et à rendre en fin de session MCP — verbatim)

```text
RELAY-RETOUR MCP POP-1c-Afrique 2026-09-28 (à coller dans la session HQ) :
1. A0 prod : [shas déployés oui/non, hash prod vs local, facilities count, routing behavior]
2. A1 extraits : [par sous-vague : taille/version, volumétrie forecast, pré-filtrés]
3. A2 dry-run : [par sous-vague : distribution + raisons, perf p95 vs 166 ms, zéro-canonique prouvé, jetables nettoyées]
4. A3 runs : [par sous-vague : admis/créés/existants/quarantine vs dry-run, intake_tier présent, claim spot-check, registre OK]
5. Commits poussés : [shas + messages]
6. Gaps/décisions demandées : [liste, avec criticité]
7. Suite recommandée : [STOP conforme / sous-vague suivante GO (conditions) / bloqué par X + plus petite action]
```
