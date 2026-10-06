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

## D. Limite honnête

Le rendu de la **famille compte** (Compte/Wallet/Plans/Recherches sauvegardées) exige une **session acheteur réelle**, non disponible au sandbox. Preuve disponible : **garde de source falsifiée** (même classe que DOCK-02/opérateur de DS-3 et DOCK-04/vendeur de DS-6). Preuve navigateur compte = **spot-check fondateur**.

## E. Reste (post-DS-7)

`MENU-02` (noms buyer du menu) · `SEARCH-02` (fraîcheur état-codée — **décision de modèle requise**) · `SEARCH-03` (lien « Recherches sauvegardées ») · écrans terrain opérateur (`op-queue/op-visit/op-report/op-side`, owner fondateur TT-1).
