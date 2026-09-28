# MCP Handoff — POP-1b preuve monde : dry-run jetable + canonique + prod (2026-09-28)

> **Protocole relais :** HQ a préparé et committé le code ; MCP exécute le DB/Vercel, committe,
> rapporte, et termine par le prompt retour §6. Pull latest d'abord (HEAD attendu ≥ commit POP-1b).

## 0. Lecture obligatoire d'abord (dans l'ordre)

1. `AGENTS.md` (conventions, gardes, T-07d)
2. `docs/founder-hq/current-state.md` (porte Root — lire, jamais inférer)
3. `docs/omni-constitution-2026-09-28.md` (index validé)
4. `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-POP-01.md` (plan + handoff, gate plan à jour)
5. `docs/nature-way/omni-pop1-intake-contract-2026-09-28.md` (§7 amendement POP-1b : scope, tiers)
6. Ce fichier (tâches P1–P4 + interdits + rapport + prompt retour)

## 1. Règles (non négociables)

- Branche **`omni-v2-rebuild` uniquement**. Jamais `main`.
- **Jetable d'abord, canonique ensuite.** Aucune écriture canonique sans preuve jetable préalable.
- Canonique identifiée **par ses données** (≈ 206 facilités), jamais par son nom.
- Preuves falsifiables ; aucun secret dans chat/commits/rapports ; aucun redeploy ; aucune variable.
- `check:state` (+ `check:docs` si docs) verts avant commit.

## 2. P1 — Re-vérification hash prod du push POP-1b (T-07d)

Le push POP-1b (code serveur : scope + quarantine) auto-déploie. Vérifier : entrée `deployments`
pour le sha, hash bundle prod === build local, `/api/v2/public/facilities` 200 (≈ 206),
routing anonyme toujours 401. Rapporter les hashs exacts.

## 3. P2 — Dry-run distribution des tiers sur jetable (ZÉRO écriture canonique)

Sur branche **jetable** depuis le canonique, avec un échantillon borné (bbox Lomé + échantillon
Ghana) : exercer le chemin d'import **sans persister** (transaction rollback ouraison en lecture
+ simulation du classifieur sur les lignes candidates) et compter pilot/world/quarantine avec
raisons. Attendu qualitatif : majority pilot sur Lomé, world sur Ghana nommé-adressé, quarantine
sur (0,0)/sans-nom-sans-adresse/placeholders. **Zéro ligne canonique touchée** — prouver le
zéro (counts avant = après). Nettoyer la jetable (0 résidu vérifié).

## 4. P3 — Claim spot-check sur existant (lecture seule)

Sur 2–3 lieux `unclaimed` existants du canonique : vérifier que le chemin claim (draft → preuve →
arbitrage, S-18) est joignable et agnostique au tier (aucune écriture, lecture du modèle + file).
Rapporter les IDs lus et le verdict par lieu.

## 5. P4 — Recensement éclair canonique (lecture seule)

Refresh des chiffres du 2026-09-28 : facilities total/unclaimed/liées/adresses/hors-zone,
entities par kind, products publiés/états/caractéristiques, unlocks, registre 044→064 (trous ?),
`raw_metadata` portant `intake_tier` (attendu : 0 — aucun import depuis POP-1a/b, à confirmer).

## 6. PROMPT RETOUR (à remplir et à rendre en fin de session MCP — verbatim)

```text
RELAY-RETOUR MCP POP-1b 2026-09-28 (à coller dans la session HQ) :
1. P1 prod : [sha déployé oui/non, hash prod vs local, facilities count, routing behavior]
2. P2 dry-run : [bbox, counts pilot/world/quarantine + raisons, zéro-canonique prouvé, jetable nettoyée]
3. P3 claim : [IDs lus, verdict par lieu]
4. P4 census : [chiffres refresh + écarts vs 2026-09-28]
5. Commits poussés : [shas + messages]
6. Gaps/décisions demandées : [liste, avec criticité]
7. Prochaine tranche recommandée : [POP-1c go (conditions) / bloqué par X + plus petite action]
```
