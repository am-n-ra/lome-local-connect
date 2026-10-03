# MCP Handoff — Prod figée sur `index-DitKQXaO.js` malgré 2 pushes client (2026-10-03)

> Protocole relais : le clone a livré + poussé ; MCP diagnostique le côté plateforme,
> rapporte, ne touche au code que si la cause est une config évidente (retrigger sain ;
> sinon STOP + rapport). Pull latest d'abord.

## 0. Symptôme (mesuré relais, pas inféré)

- Prod `https://omni.sparkafrika.online/` sert **`index-DitKQXaO.js`** (vérifié no-cache,
  2026-10-03 ~08:00 UTC) — bundle qui **contient** déjà R-I (`HANDOVER_INCOHERENT` etc.).
- Depuis, poussés sur `origin/omni-v2-rebuild` (tous confirmés distants) :
  - `3c8a7c0` (2026-10-02 12:47 UTC) — **client** (`TrunkMap.tsx`, `route-voice.ts`) ;
  - `8e6dfb5` (2026-10-02 13:08 UTC) — **client** (`TrunkAppV13.tsx`, sheet tile-place) ;
  - `73f06e0`, `f84110b`, `4613a5c` — docs/gardes (ne changent pas le hash client).
- Deux changements client ≠ hash inchangé 19 h après ⇒ **aucun build Vercel récent n'a
  promu**, ou les builds échouent en silence. Classe déjà vue le 2026-09-17 (cron Hobby
  refusé qui gelait la prod sans rouge) — **ne pas présumer la même cause**.

## 1. PROMPT MCP-4 — Diagnostic déploiements (Vercel + GitHub, lecture seule d'abord)

1. Lister les déploiements Vercel du projet (cible production, ~10 derniers) : commit
   (`meta.githubCommitSha`), statut (`READY`/`ERROR`/`CANCELED`/`BUILDING`), heure.
   Chercher en particulier `3c8a7c0` et `8e6dfb5`.
2. Si builds `ERROR`/`CANCELED` : lire les logs de build, noter l'erreur exacte
   (dépendances ? mémoire ? timeout ? hook ?).
3. Vérifier l'intégration GitHub→Vercel (webhooks livrés ? intégration suspendue ?
   token expiré ?) et l'alias canonique (`GET /v4/aliases/omni.sparkafrika.online`).
4. Si la cause est un build coincé/retriggerable sainement : **un seul** retrigger, puis
   re-vérifier le hash servi. Si la cause est un échec de build lié au code : STOP,
   rapporter le log — le correctif est une tranche relais, pas un bricolage MCP.
5. Ne poser aucune variable, ne changer aucune config projet sans ordre fondateur.

## 2. Rapport attendu

```
RELAY-RETOUR MCP-4 vercel-stall :
- deployments : <liste commit/statut/heure, 10 derniers>
- alias servi : <deploymentId + commit>
- cause : <build ERROR + log exact | intégration | cron/quota | inconnue>
- action : <retrigger fait + hash servi après | rien, attente tranche>
- blocage : <rien | message exact>
```
