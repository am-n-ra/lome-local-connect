# DS-8 — MENU-02 Menu buyer (2026-10-06)

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** maquette Species V2 (74 écrans, CLOSE).
> **Objet :** `MENU-02` du registre `omni-dock-search-conformance-register-2026-10-06.md` — noms & lieux du **menu acheteur**.

## A. Constat (mesuré)

L'autorité (`omni-species-v2-interactive.html` ligne 756, branche « Acheteur » de `menuItems`) définit **8 entrées** :

`Accueil · Mes demandes · Historique des transactions · Favoris · Recherches sauvegardées · Notifications · Portefeuille & Plans · Mon compte`

L'app portait des noms **inventés** : `Mon espace` (au lieu d'`Accueil`), `Transactions en cours`, `Reprendre où j'en étais`, `Recherches enregistrées` (au lieu de `Recherches sauvegardées`), `Wallet` (au lieu de `Portefeuille & Plans`), et un item `Plans` séparé. Le `Mon espace` **vendeur** de la maquette est, lui, **correct** — seul le buyer divergeait.

## B. Correctif

Menu buyer réécrit aux **noms de la maquette** (`Accueil` → carte, `Mes demandes` → espace, `Historique des transactions` → espace (section Terminées), `Favoris`, `Recherches sauvegardées`, `Notifications`, `Portefeuille & Plans` → wallet (le Pro reste atteignable via « Passer Pro » / « Voir les plans » déjà présents), `Mon compte` → compte).

**Extra app préservé, jamais supprimé en silence :** `Reprendre où j'étais` (absent des 8 entrées maquette) est **relocalisé** dans le sheet **Accueil**, et son retour (`handleDock`) pointe désormais vers `home`. Sa fonction survit à la disparition de son entrée de menu.

## C. Preuves

| Type | Résultat |
|---|---|
| **Garde falsifiable** | `scripts/check-dock-search.mjs` — **14 règles** (neuve : `menu-02-buyer`) ; `--selftest` → **14/14 falsifiées** ; source réelle **PASS** |
| **Navigateur (session stubbée au bord auth)** | `scripts/prove-menu02-buyer.mjs` — **18/18** : les 8 noms présents, les anciens absents, **et** le Retour de la famille compte (DOCK-05) — `Mon compte` ouvre le sheet, le dock porte `Retour`, Retour revient au menu |
| **Non-régression** | `tsc` clean · **796/796** tests · `boundary`/`live-surface`/`state`/`docs` **PASS** |
| **Bundles serverless** | **0 modifié** (correctif 100 % client) |

**Méthode de preuve.** Le menu n'apparaît qu'avec une session. La connexion Neon réelle est indisponible au harnais ; comme la preuve DS-3 stubbe `/api/v2/public/facilities`, ce harnais stubbe **uniquement** les deux endpoints d'auth (`…/auth/get-session`, `…/auth/token`) — le bord du système, jamais la logique de l'app. L'app, le rendu du menu et le dock sont réels.

## D. Upgrade de la limite DOCK-05

Le même harnais **prouve en navigateur** ce que DOCK-05 ne prouvait que par garde de source : la **famille compte** offre bien `Retour`. La limite honnête de `omni-ds7-dock05-back-evidence-2026-10-06.md` §D est donc **levée pour le chemin compte** (session stubbée au bord auth). Reste `wallet`/`plans`/`saved` (même prédicat `destination`, prouvé par garde) = spot-check fondateur optionnel.

## E. Reste (post-DS-8)

`SEARCH-02` (fraîcheur état-codée — **décision de modèle requise**) · `SEARCH-03` (lien « Recherches sauvegardées » dans l'en-tête du sheet recherche) · écrans terrain opérateur (`op-queue/op-visit/op-report/op-side`, owner fondateur TT-1).

## F. État de livraison

Commit `341e65f` **local, NON poussé** — `GITHUB_TOKEN` **expiré** (401 sur `api.github.com/user`, les deux formes d'auth). **T-07d non franchi** : la prod sert encore `index-B1zF4Ouo.js` (DOCK-05), pas `index-CxSuY0YS.js` (MENU-02). À pousser dès un jeton `repo` valide, puis vérifier hash prod === local + entrée de déploiement GitHub.
