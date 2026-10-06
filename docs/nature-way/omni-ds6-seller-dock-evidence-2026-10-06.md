# Preuve — DS-6 : dock vendeur conforme (DOCK-04)

> **Slice :** `NW-PROD-OMNI-DOCK-01` (Trunk, porte `ROOT_CLOSED_TRUNK_OPEN`).
> **As of :** 2026-10-06 (UTC). **Autorité visuelle :** `docs/maquette/omni-species-v2-interactive.html` (`dockFor`, `:346-347`).
> **Décision fondateur (DS-2) :** option **(b)** « acter l'avance de l'app, combler le fond ». DS-6 **comble le fond** (conformité du dock vendeur).

---

## A. Dérive mesurée

La maquette (`dockFor`, rôle vendeur) prescrit :
```
Mon espace (icône boutique) · Scanner le code d'un acheteur (QR, centre) · Menu
```
L'app rendait : **Recherche · Stock · Menu**. Deux écarts :
1. **Libellé du centre** — « Stock » au lieu de « Scanner le code d'un acheteur » : la promesse de **vérification QR** (geste central du vendeur) était absente du dock.
2. **Libellé de gauche** — « Recherche » au lieu de « Mon espace » : l'entrée principale du vendeur n'était pas son espace.

Le libellé du centre portait une **sémantique différente** : « Stock » mène au dashboard, « Scanner le code d'un acheteur » mène à la vérification QR.

## B. Livré

`TrunkAppV13` (bloc `dockItems`, rôle vendeur) aligné sur la maquette :
- `{ icon: 'shop', label: 'Mon espace', target: 'seller' }`
- `{ icon: 'qr', label: "Scanner le code d'un acheteur", target: 'seller-qr', center: true }`
- `{ icon: 'menu', label: 'Menu', target: 'menu' }`

Nouvelle icône `shop` (`Store` de lucide) dans `dockIcon`. **Aucun nouveau `Sheet`** : `seller-qr` existait déjà (destinations du dock) ; `handleDock` route `seller-qr` via `dockGo`.

## C. Preuves

| Type | Résultat |
|---|---|
| **Garde falsifiable** | `scripts/check-dock-search.mjs` — **9 règles** (neuve : `dock-04-seller`), `--selftest` → **9/9 falsifiées** (mutation `Scanner le code d'un acheteur` → `Scanner le code` fait tomber la règle) ; source réelle clean ; **PASS** |
| **Non-régression** | `tsc` clean · **790/790** tests · 8 gardes repo **PASS** |
| **Navigateur (acheteur, 4 largeurs)** | `scripts/prove-ds3-dock-sort.mjs` — dock acheteur + menu + kickers **PASS** (le rôle vendeur exige une session, non disponible au sandbox — voir §D) |
| **Bundles serverless** | **0 modifié** (correctif 100 % client) |
| **Prod** | `index-DLRt7PiH.js` sha256 `9ccc481d…` **=== build local (T-07d ✅)** ; déploiement GitHub `861e3ac` ; chaîne « Scanner le code d'un acheteur » présente dans le bundle servi |

## D. Limite honnête

Le **rendu** du dock vendeur (rôle `seller`) **n'est pas prouvé en navigateur** : il exige une **session vendeur réelle** (`demo@seller.omni`), non disponible au sandbox. Preuve disponible : **garde de source falsifiée** (même classe que la preuve DOCK-02/opérateur de DS-3). Preuve navigateur vendeur = **spot-check fondateur**.

## E. Reste (post-DS-6)

`DOCK-05` (Retour contextuel — item `Retour` avec retour d'historique + désactivation dans le flux verrouillé ; l'app le fait **partiellement** via `handleDock('back')` par écran) · `MENU-02` (noms buyer du menu) · `SEARCH-02` (fraîcheur état-codée — **exige une décision de modèle** : aucune colonne `availability_observed_at` n'existe ; dériver l'état du seul `availability_expires_at` est ambigu) · écrans terrain opérateur (`op-queue/op-visit/op-report/op-side`).
