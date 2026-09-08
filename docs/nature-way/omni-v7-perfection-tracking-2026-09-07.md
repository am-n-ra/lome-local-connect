# V-7 — Perfection de l'existant V13 — registre de tranches

> Programme issu du re-audit Species（G-02a revisité, HO-OMNI-07（ et de l'ordre fondateur「 ce n'est pas tout même ce qu'on a déjà implémenté n'est pas encore parfait 」。
> Gate​​6 Canopy/launch-readiness — `active` jusqu'à preuve fondateur + dettes triggerées explicitement.

## Tranches

| # | Tranche | Périmètre | Statut | Preuve |
|---|---|---|---|---|
| T1 | **V-7d — palette pins verrouillée** | `map-pins.ts`: core corail legacy `#F08F5A` → encre `#1F1F1F`( maquette V1.3 dots encre（; anneau owned evergreen `#234D40` → accent unique vert verrouillé `#2e8b6f`; third-party reste paper `#F9F7F2`; test `map-pins.test.ts` aligné | `done` | tsc clean; tests 306/306（48 fichiers）; build prod `index-C7W9opd2.js` ✅; push `898e88f` |
| T2a | **V-6g — compteur contraintes actives** | spec V1.3 §5.1: compteur discret `role="status"` au-dessus du champ quand ≥1 chip active（ `${n} contrainte(s) active(s)`（ | `done` | idem |
| T2b | **V-6h — aria-modal honnête** | Sheets V13 non modales（ sans focus trap（: `TrunkAppV13` qr/auth, `BuyerFlowV13` flow, `PublicQrScannerSheet` — `aria-modal="true"` → `"false"`（ | `done` | idem |
| T3 | **V-6i — micro-copies M-01/M-02** | M-02 exact dans RESULTS vide + bouton「 Élargir les contraintes 」（ spec §5 RESULTS vide（;bandeau chargement「 Recherche en cours dans votre zone… 」（ M-01 erreur réseau reste via bandeau existant（ | `done` | idem |
| T4 | **V-7e — formulaire retrait/livraison + note**（ spec §4.3（ | `requestAvailability` n'a pas les champs mode/note → tranche **contrat API+serveur+UI**, non incluse ici | `planned` | — |
| T5 | **V-7a — seller map-first** | Nécessite une mini-species de découpage（ | `planned — prochaine tranche` | — |
| T6 | **V-7b — QR auto + scanner caméra** | Scanner natif（ | `planned` | — |
| T7 | **V-7c — onboarding gating** | ( | `planned` | — |
| T8 | **V-6 restant — sim scénarios + fraîcheur visuelle** | Simulations normal/empty/slow/error;rafraîchir visuels（ | `planned` | — |



## Preuves（ 898e88f（
- `npx tsc --noEmit` ✅
- `npm test` — Test Files **48 passed**（306 tests（ ✅
- `npm run build` — `dist/assets/index-C7W9opd2.js` ✅
- Push `898e88f` sur `origin/omni-v2-rebuild` ✅


## Dette explicitement triggerée（ restante（
- V-7e formulaire retrait/livraison + note（ contrat API `requestAvailability` a étendre（ servéur `POST /api/v2/availability`（ + migration（ + UI（ — triggeré périmètre M-01?— à valider fondateur（
- V-7a seller map-first（ mini-species requise（
- V-7b/7c scanners/onboarding;V-6 restant sim/fraîcheur（