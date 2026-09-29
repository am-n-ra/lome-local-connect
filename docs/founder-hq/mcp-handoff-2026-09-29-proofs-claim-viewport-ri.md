# MCP Handoff — Preuves live des tranches 2cdd3c0 → fb4f03f + T-07d (2026-09-29)

> **Protocole relais :** le clone a livré le code + preuves stub (commits `2cdd3c0`, `6c6aba7`,
> `a6ff641`, `7f1d6d5`, `f014254`, `ec4d2f5`, `fb4f03f`, `0e49a5a`, `a43a9c2`, tous poussés sur
> `origin/omni-v2-rebuild`). MCP exécute le DB/Vercel, rapporte, termine par le prompt retour §4.
> Pull latest d'abord (`git pull origin omni-v2-rebuild`).

## 0. Règles (non négociables)

- **Canonique identifiée PAR SES DONNÉES** (`select count(*) from v2_facilities` ≈ 13 741+,
  attendue `br-dawn-hill-am5amy22`), jamais par son nom. Jamais `main`.
- **Écritures UNIQUEMENT sur branche jetable.** La preuve claim écrit + supprime.
  `prove-root-read-paths` est read-only (safe canonique).
- Preuves falsifiables ; aucun secret dans chat/commits/rapports ; aucune migration à
  appliquer (aucune DDL dans ces tranches) ; aucune variable d'env à poser.
- Tout échec = STOP, rapporter le message exact, ne pas contourner.

## 1. PROMPT MCP-1 — Preuve live claim-by-osm-ref (branche jetable, ~5 min)

**But :** exécuter `scripts/prove-v2-claim-by-osm-ref.mjs` (T1–T6) contre Postgres réel.

1. Compter `v2_facilities` sur la canonique (attendu ≈ 13 741+). Si l'ordre de grandeur
   diffère, STOP + rapporter (mauvaise base).
2. Créer une branche jetable depuis la canonique, ex. `claim-proof-20260929`. Noter son URL.
3. Exécuter (depuis le clone, branche `omni-v2-rebuild` à jour) :
   `CLAIM_PROOF_ALLOW_DISPOSABLE_BRANCH=1 CLAIM_PROOF_DATABASE_URL=<url-jetable> npx tsx scripts/prove-v2-claim-by-osm-ref.mjs`
4. Attendu : `claim-proof: ALL PASS` (T1 matérialise + metadata `claim-on-sight` ; T2 replay
   même draft ; T3 2e claimant refusé ; T4 importé résolu sans matérialiser ; T5 owned
   refusé ; T6 invalide rejeté).
5. Vérifier 0 résidu : `select count(*) from v2_facilities where name like 'Preuve %'`
   et `where name like '%Preuve %'` → 0 ; `v2_accounts` : `auth_user_id like 'claim-%'` → 0.
6. Supprimer la branche jetable. Confirmer la suppression.

**Rapport :** T1–T6 PASS/FAIL un par un + résidu (0 exigé) + branche supprimée (oui/non).

## 2. PROMPT MCP-2 — Harnais read-paths, 29 chemins (read-only, ~3 min)

**But :** compiler le SQL livré contre Postgres réel, dont les 2 chemins ajoutés au commit
`0e49a5a` (ORDER BY viewport + porte de publication R-I).

1. Exécuter : `ROOT_READ_PATH_DATABASE_URL=<canonique-ou-jetable> npx tsx scripts/prove-root-read-paths.mjs`
   (read-only safe : la porte `transitionSellerProduct` tourne sur UUID inexistant —
   `owned` vide → UPDATE zéro ligne, vérifié par lecture).
2. Attendu : `29/29 read paths answered` (27 historiques + `+ bounds` + `publication gate`).
   Les rejets-politique (`FORBIDDEN_OR_LIMIT_REACHED`, 403/409) comptent PASS : ils prouvent
   que l'instruction a compilé ET tourné. Seule une erreur Postgres = FAIL.

**Rapport :** `x/29` + liste des FAIL avec message exact le cas échéant.

## 3. PROMPT MCP-3 — T-07d déploiements (Vercel, ~5 min)

**But :** prouver que la prod sert le code poussé (un push ne prouve pas un déploiement).

1. Lister les déploiements production : une entrée `READY` pour chacun de `ec4d2f5`
   (R-I condition), `fb4f03f` (R-I handover), `0e49a5a` (harnais), `a43a9c2` (docs).
   Rappel : Vercel déploie le COMMIT POUSSÉ — comparer `meta.githubCommitSha`, jamais le
   HEAD local. Un cron refusé ou un alias non promu gèle la prod sans rouge.
2. Lire l'alias canonique (`GET /v4/aliases/omni.sparkafrika.online`) : noter le
   `deploymentId` réellement servi, pas le dernier `READY`.
3. Sur le bundle client servi : présence de `Mise à jour de la vue`, `Retrait impossible`,
   `État de l'occasion`, `HANDOVER_INCOHERENT` ; absence de `MAPBOX_ACCESS_TOKEN`,
   `OSRM_BASE_URL`, `access_token` (0 occurrence — le routage ne fuit jamais côté client).
4. Spot-check routes (sans session) : `POST /api/v2/facilities?action=claim-by-osm-ref`
   → **401** `AUTH_REQUIRED` (route déployée + garde) ; `GET /api/v2/public/facilities`
   → **200** avec `existenceLevel` et ordre distance (Togo).

**Rapport :** 4 SHAs déployés (oui/non + dates) + alias servi + 4 chaînes présentes +
0 secret + 401/200 vérifiés.

## 4. Prompt retour (verbatim, à la fin du rapport MCP)

```
RELAY-RETOUR MCP preuves 2026-09-29 :
- MCP-1 claim-proof : T1..T6 <PASS/FAIL chacun>, résidu <0 autre>, branche <supprimée oui/non>
- MCP-2 read-paths : <x/29>, FAIL : <messages exacts ou "aucun">
- MCP-3 T-07d : SHAs <4 oui/non>, alias <deploymentId>, chaînes <4/4>, secrets <0>, 401/200 <oui/non>
- Blocage : <rien | message exact + ce qui a été tenté>
```
