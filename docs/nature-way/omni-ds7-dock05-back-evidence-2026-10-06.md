# DS-7 — DOCK-05 Retour contextuel (2026-10-06)

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** maquette Species V2 (74 écrans, CLOSE).
> **Objet :** `DOCK-05` du registre `omni-dock-search-conformance-register-2026-10-06.md` — item **Retour** contextuel.

## A. Constat (mesuré)

La maquette (`omni-species-v2-interactive.html`) définit `backItem()` : un item **Retour** sur **tout écran non-home**, désactivé uniquement dans le flux verrouillé (`lockedFlow()`).

L'app (`TrunkAppV13` `dockItems`) n'offrait **Retour** que sur les sheets « destination » — la famille **compte** (`account`/`wallet`/`plans`/`saved`) en était **exclue** → l'autorité n'était pas tenue là. Écart **Basse**, fidélité.

## B. Correctif

Prédicat `destination` élargi : `account`/`wallet`/`plans`/`saved` n'en sont plus exclus → **Retour** présent. Inchangés : écrans de repos (carte, recherche, menu, home buyer, onboarding) = **aucun** Retour (une flèche y pointerait nulle part) ; flux verrouillé = dock propre `Quitter` (FF-1, sort vers la carte, n'annule jamais).

## C. Preuves

| Type | Résultat |
|---|---|
| **Garde falsifiable** | `scripts/check-dock-search.mjs` — **13 règles** (neuve : `dock-05-back`) ; `--selftest` → **13/13 falsifiées** ; source réelle **PASS** |
| **Navigateur** | `scripts/prove-dock05-back.mjs` — **8/8** @ 390/1280 : repos **sans** Retour · fiche facilité **avec** Retour · Retour **revient aux résultats** |
| **Non-régression** | `tsc` clean · **796/796** tests · `boundary`/`live-surface`/`state` **PASS** |
| **Bundles serverless** | **0 modifié** (correctif 100 % client) |
| **Prod** | `index-B1zF4Ouo.js` sha256 `deff34de…` **=== build local (T-07d ✅)** ; déploiement GitHub `283ebe5` Production `2026-10-06T16:15:11Z` ; preuve navigateur **8/8 rejouée sur prod** (vraie DB) |

## D. Limite honnête

Le rendu de la **famille compte** (Compte/Wallet/Plans/Recherches sauvegardées) exige une **session acheteur réelle**, non disponible au sandbox. Preuve disponible : **garde de source falsifiée** (même classe que DOCK-02/opérateur de DS-3 et DOCK-04/vendeur de DS-6).

**Levé partiellement (DS-8) :** `scripts/prove-menu02-buyer.mjs` (session stubbée au **bord auth**) prouve **en navigateur** que `Mon compte` ouvre le sheet, que le dock porte `Retour`, et que Retour revient au menu. `wallet`/`plans`/`saved` (même prédicat) restent prouvés par garde. Preuve navigateur compte = **faite pour `account`** ; spot-check fondateur optionnel pour le reste.

## E. Reste (post-DS-7)

`MENU-02` (noms buyer du menu) · `SEARCH-02` (fraîcheur état-codée — **décision de modèle requise**) · `SEARCH-03` (lien « Recherches sauvegardées ») · écrans terrain opérateur (`op-queue/op-visit/op-report/op-side`, owner fondateur TT-1).
