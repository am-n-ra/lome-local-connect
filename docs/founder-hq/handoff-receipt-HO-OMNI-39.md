# HO-OMNI-39 — réception de handoff (BRANCHES-1..4)

| Champ | Valeur |
|---|---|
| **Porte** | **BRANCHES** (`HEARTWOOD_CLOSED_BRANCHES_OPEN`) — Heartwood + Trunk CLOSE `founder-confirmed` 2026-10-07 |
| **Tranche** | `BRANCHES-1..4` — quatre bugs fondateur (2026-10-07) |
| **Commit code** | `3a3fdb7` (poussé) |
| **Commit docs** | `d1b8134` (poussé) |
| **Prod** | `https://omni.sparkafrika.online` — `index-BrfwYZcH.js` === build local (**T-07d ✅**) ; entrée GitHub `deployments` `3a3fdb7` + `d1b8134` |
| **Dossier** | `docs/founder-hq/omni-branches-drag-otp-filter-search-2026-10-07.md` |

## Livré

1. **Geste de fermeture des feuilles mobiles** — tirer la poignée vers le bas ferme la feuille ;
   sortie = **même cible que le bouton** (`sheetDismissTarget`) ; desktop inchangé.
2. **Confirmation e-mail par CODE (OTP)** — envoi automatique, saisie + `emailOtp.verifyEmail`,
   renvoi **après délai** (30 s).
3. **Catégories carte sur une seule ligne** — `Tout/Commerces/Particuliers/Ambulants`.
4. **Recherche gardée (D-05)** — chercher exige un compte ; la requête **survit** à
   l'authentification et reprend ; parcourir la carte / taper un pin reste libre.

## Preuve

- **Navigateur prod** `proof:branches-drag-otp-filter-search` (390) : **3/3 PASS**, 0 pageerror.
- **1045/1045 tests**, tsc 0, **9/9 gardes**.
- **4 falsifications** : geste débranché → 2 échecs ; `verifyEmail` neutralisé → 2 ; `wrap`
  restauré → 2 ; gate retiré → 1.

## Résidus honnêtes

- BRANCH-2 : preuve **unitaire (jsdom)** — l'envoi réel d'un OTP n'est pas exercé dans le sandbox
  (pas de boîte e-mail). Le contrat est prouvé ; le clic dans un vrai e-mail reste une preuve
  fondateur (session réelle).
- Le geste de fermeture est **mobile uniquement** (par conception).

## Prochaine action

HQ présente au fondateur la liste ordonnée des branches candidates (`SCOUT-01`, `MENU-01`,
capacités Seed, `COH-V2-09`) pour sélection de la **branche suivante**. **Terrain toujours EN DERNIER.**
