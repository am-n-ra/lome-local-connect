# MCP Handoff — POP-1d Togo-only prune : élaguer hors-Togo, prouver les écritures (2026-09-28)

> **Protocole relais :** HQ a décidé (DEC-V2-27, bbox pays, stop eager) ; MCP exécute le DB,
> committe, rapporte, termine par le prompt retour §7. Pull latest d'abord.
> Contexte : canonique 522 Mo logiques > 512 Mo (`free_v3`) — TOUTE écriture refusée, y compris
> un INSERT de 200 lignes sur jetable neuve. S4-bis rejouable (forecast `1765155` figé).

## 0. Lecture obligatoire d'abord (dans l'ordre)

1. `AGENTS.md` (conventions, gardes, T-07d)
2. `docs/founder-hq/current-state.md` (porte Root — lire, jamais inférer)
3. `docs/omni-constitution-2026-09-28.md` (index validé)
4. `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-POP-01.md` (POP-1d `ready`)
5. `docs/nature-way/omni-pop1-intake-contract-2026-09-28.md` (§7 : scope, tiers, quarantine)
6. `docs/decisions/omni-decision-log.md` (DEC-V2-12…27 en vigueur — V2-27 = ce pivot)
7. `docs/founder-hq/mcp-report-2026-09-28-pop1c-afrique-s4bis-maroc-algerie.md` (précédent : méthode
   jetable, rollback plans, falsification — réutiliser)
8. Ce fichier (tâches D1–D5 + interdits + rapport + prompt retour)

## 1. Règles (non négociables)

- Branche **`omni-v2-rebuild` pour les tests, canonique `br-dawn-hill-am5amy22` identifiée PAR SES
  DONNÉES pour toute écriture** (jamais par son nom). Jamais `main`.
- **Snapshot manuel AVANT toute suppression** (gratuit, 1 autorisé — le prendre).
- Preuves falsifiables ; aucun secret dans chat/commits/rapports ; aucun redeploy ; aucune variable.
- `check:state` (+ `check:docs` si docs) verts avant commit.

## 2. D0 — Les DELETE passent-ils ? (question qui tranche tout)

Sur branche **jetable** depuis le canonique : tenter la suppression de **10 lignes** unclaimed
hors-Togo. **Si refusé** (« could not extend file » ou équivalent) → STOP immédiat, rapporter, et
la décision devient **upgrade Launch obligatoire même pour élaguer** (ne pas insister, ne pas
contourner). Si accepté → poursuivre D1. Documenter le résultat exact dans tous les cas.

## 3. D1 — Census pré-suppression (lecture seule, canonique)

Par segment : facilities (total / unclaimed Togo bbox / unclaimed hors bbox / claimed-owned /
démos) · `source_refs` (liées aux hors-bbox vs Togo) · `operator_runs` (count, pas de suppression
prévue — audit conservé) · tailles logiques par table (`pg_total_relation_size`) · taille logique
de branche de départ · `max(created_at)` par table d'écriture app (dater l'arrêt des écritures :
wallets, ledger, availability, transactions — **preuve de l'outage** ou infirmation).

## 4. D2 — Prédicat de suppression (à valider par counts AVANT exécution)

Garder : `account_id NOT NULL` (revendiqués/owned) · démos/fixtures (UUID 1xxxxxxx…5exxxxxx,
comptes démo) · lignes système (wallets, ledger, users, teams, entités, produits, migrations,
registre) · unclaimed **dans** la bbox pays (lat 6,0–11,2 / lng −1,0–1,7).
Supprimer : `v2_facilities` avec `source_kind='public_import'` ET `account_id IS NULL` ET hors
bbox pays (+ leurs `source_refs` par FK CASCADE — vérifier la clause, sinon suppression explicite
d'abord). Compter EXACTEMENT ce que le prédicat attrape, le faire valider par les nombres
(attendu : ~374 000 lignes, 0 revendiquée, 0 démo), puis exécuter **par lots bornés** (ex. 10 000)
avec counts après chaque lot. **Stop à la première anomalie.**

## 5. D3 — Vérification post-suppression (la preuve que ça valait le coup)

- `VACUUM (ANALYZE)` ou attente autovacuum documentée + taille logique < **400 Mo** (marge pour
  claim/création ; si > 400 Mo, le dire et proposer la suite au lieu de forcer).
- **Probe d'écriture** : `BEGIN; INSERT test rollbacké ; ROLLBACK;` → prouve que les écritures
  re-fonctionnent, **0 résidu**.
- Claim spot-check S-18 sur 2 lieux Togo (draft → cancel → restauré).
- Prod : hash bundle === local (T-07d), facilities count, routing 401.

## 6. Interdits

- Aucune suppression hors prédicat validé ; jamais de revendiqué/owned/produit/entité/wallet/
  ledger/migration/registre ; jamais de `TRUNCATE` aveugle ; pas de suppression des runs d'audit.
- Pas de vague suivante (S4-bis replay ou autre) sans le rapport ci-dessous ET sans taille < 400 Mo.

## 7. PROMPT RETOUR (à remplir et à rendre en fin de session MCP — verbatim)

```text
RELAY-RETOUR MCP POP-1d Togo-prune 2026-09-28 (à coller dans la session HQ) :
1. D0 deletes : [passent oui/non — si non, upgrade obligatoire, stop ici]
2. D1 census : [par segment : counts + tailles + max(created_at) par table (outage daté ou infirmé)]
3. Snapshot : [id/heure, pris oui/non]
4. D2 runs : [par lot : supprimées, counts restants, revendiquées intactes, démos intactes]
5. D3 vérif : [taille logique finale, VACUUM, probe écriture PASS/FAIL, claim spot-check, prod hash]
6. Commits poussés : [shas + messages]
7. Gaps/décisions demandées : [liste, avec criticité]
8. Suite recommandée : [STOP conforme / S4-bis replay GO (conditions) / bloqué par X + plus petite action]
```
