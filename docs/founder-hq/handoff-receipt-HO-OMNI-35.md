# Skill Handoff and Activation Receipt — HO-OMNI-35

> **Request ID:** `HO-OMNI-35`
> **Founder HQ timestamp:** 2026-10-07 (UTC)
> **Primary authority:** `/nature-way` (retour vers HQ)
> **Exact invocation:** `/nature-way-founder-hq /nature-way`
> **Activation status:** `activated` — porte Heartwood (durcissement/fermeture, pas de nouvelle fondation)

## Clarification de porte (question fondateur « on est normalement sur trunk je crois »)

**Non — Trunk est CLOS.** Le registre (`docs/founder-hq/current-state.md`, board) porte
`TRUNK_CLOSED_HEARTWOOD_OPEN` : Trunk **CLOSE `founder-confirmed` 2026-10-07** (os complets
`DS-1…DS-14`, `X1/X2` `3d19a50`, `X3` `bda68e0`, `X4` `91bfa63`, `X5` `6ccbfd9`, `X6` `5dc5275`,
`GLOBE-REG` `43a3785`). La porte courante est **Heartwood** (durcissement/fermeture). Le **terrain**
(`TT-1`/`TT-2`/Gate 7) est repoussé **en dernier** par décision fondateur — jamais une slice Trunk.

## Handoff input (retour du spécialiste, HO-OMNI-34)

| Field | Value |
|---|---|
| User objective | Spot-check occlusion desktop — verdict mesuré ; dette `DOCK-DUP` laissée « cause à localiser en code » |
| Next proposé | (a) tranche fix `DOCK-DUP` **ou** (b) lot terrain final — décision fondateur |
| Contrainte | Heartwood = durcissement seulement ; aucune nouvelle fondation |

## Ce qui a été fait (option (a) — `DOCK-DUP` fixé, pas le terrain)

- **Cause racine trouvée en code** : la div du dock portait `key={role}`. Le dock est un **enfant
  unique non keyé** de `.omni-v13-stage` ; changer sa clé à chaque bascule de rôle fait **fuir** le
  nœud DOM au lieu de le réconcilier → jumeaux `.navpill` empilés (1 → 2 → 3), labels a11y dupliqués.
- **Preuve A/B** (`scripts/probe-dock-dup.mjs`, 1280px) : `key={role}` → `menu=2, role-buyer=3` ;
  `key` **constante** ou **absente** → 1 partout. Ce n'est pas la clé qui nuit, c'est son **changement**.
- **Correctif** : clé retirée (`src/trunk/TrunkAppV13.tsx`). **Garde** `dock-dup-guard.test.ts`
  (3 checks) **falsifié** (clé restaurée → échec ; retirée → vert).
- **Preuves** : probe **FAIL exit 1** sur build buggé / **PASS** sur build corrigé, local **et prod** ;
  suite **926/926** (103 fichiers), `tsc` 0, gardes `boundary`/`state`/`live-surface`/`dead-css`/`docs` vertes.
- **Prod (T-07d ✅)** : déploiement `0d4f909` confirmé ; prod `index-BVdehrpJ.js` **byte-identique** au
  build local (sha256) ; probe prod PASS (1 dock à chaque étape).

## Décision demandée au fondateur

1. **`DOCK-DUP` est-il clos ?** (fix + garde + preuve prod ci-dessus.)
2. **Prochaine slice** : reste-t-il un item Heartwood, ou passe-t-on au **lot terrain final**
   (`TT-1`/`TT-2`/Gate 7) ? HQ n'ouvre **rien** avant la décision.

> **Note de méthode :** livrer une tranche **ne clôt pas** une porte. Ce receipt est un paquet de
> preuves ; `check:state` exige que `current-state.md`, le board et le master plan restent d'accord
> avec `TRUNK_CLOSED_HEARTWOOD_OPEN` tant que le verdict n'est pas rendu.
