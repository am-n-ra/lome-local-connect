# Registre de conformité — Dock · Recherche · Options · Menus × rôles (app ↔ maquette)

> **Slice :** `NW-PROD-OMNI-DOCK-01` (Trunk, porte `ROOT_CLOSED_TRUNK_OPEN`).
> **As of :** 2026-10-06 (UTC). **HEAD :** `48225a2`. **Autorité visuelle :** `docs/maquette/omni-species-v2-interactive.html` (74 écrans, Species CLOSE `founder-confirmed`).
> **Méthode :** mesure code + navigateur (Playwright 4 largeurs), **pas d'inférence**. Le sandbox n'a **pas** de session → parcours **public (buyer)** mesuré au rendu ; rôles authentifiés (seller/admin/operator) comparés **code ↔ maquette** (dock `dockFor`, menus).

---

## 0. Ce qui est mesuré PROPRE (à ne pas « corriger »)

| Fait | Preuve |
|---|---|
| Cibles tactiles du dock **≥ 44 px** | mesuré : `44×44`, centre `46×46` (4 largeurs) — `UI-2` est **résolu pour le dock** |
| Icônes dimensionnées (18/20 px), jamais surdimensionnées | mesuré |
| `sr-only` réellement appliqué (label non peint) | mesuré `srOnly: true` |
| Contraintes : **3 familles explicites** + 6 portées de rayon | mesuré : `Disponibilité / Votre besoin / Attributs d'offre / Portée de recherche` (≥1280) |
| Rail desktop **colonne** (dock latéral), bottom-sheet mobile | mesuré : `flexDirection row@390 → column@1280`, `left:14 top:64 h:822` |
| `aria-modal`, `role`, noms accessibles, focus | mesuré, 0 erreur console |

---

## 1. Écarts mesurés (par élément)

| ID | Élément | App (mesuré) | Maquette (autorité) | Sévérité | Source à corriger |
|---|---|---|---|---|---|
| `DOCK-02` | **Dock opérateur** | partage le dock **admin** (« À valider » → console admin) ; le terrain n'est que dans le menu | `op-queue` (Dossier terrain) + `op-side` (Aperçu côté entité, centre) | **Haute** | `dockFor` app (`TrunkAppV13` `dockItems`) — l'opérateur n'a pas son dock |
| `DOCK-01` | **Rolepill = rôles** | n'affiche **que** les rôles possédés (`eligibleRoles`, capability serveur) | affiche **les 4** toujours (démo) | Moyenne | **Décision** : capability (app, honnête) vs démo (maquette). Probablement l'app a raison — à acter |
| `DOCK-03` | **Action centrale buyer** | `QR` → `PublicQrScannerSheet` (scanner le **QR public d'un lieu**) | `scan-entity` → **scanner le QR d'une entité** | Moyenne | libellé + cible (`TrunkAppV13` dock buyer) |
| `DOCK-04` | **Dock vendeur** | `Recherche / Stock / Menu` | `Mon espace / Scanner le code d'un acheteur / Menu` | Basse | `dockFor` seller |
| `DOCK-05` | **Retour contextuel** | pas de « Retour » explicite (sauf états `destination`) | `backItem` sur **tout** écran non-home | Basse | `dockFor` |
| `SEARCH-01` | **Tri des résultats** | **absent** (pas de `sortbar` sur `results`) | `sortbar` : Pertinence / Prix / Distance (`setSort`) | **Haute** | `results` sheet app |
| `SEARCH-02` | **Fraîcheur** | texte fixe dans `bulk` (« reflète l'allocation Omni ») | `freshbar` **état-codé** (frais / `stale` / `expired`) | Moyenne | composant fraîcheur (D-03) |
| `SEARCH-03` | **Sheet recherche** | niveau entité/offre + contraintes ; pas de lien « Recherches sauvegardées » | + lien `saved` dans l'en-tête | Basse | `search` sheet |
| `OPT-01` | **Portées de rayon** | **6** : 1/5/10/25/100/Monde | **4** groupées : `Quartier·1 km` / `Ville·5-25 km` / `Région·100 km` / `Monde` | Basse | app plus fin (D-CON-4) — arbitrer |
| `OPT-02` | **Libellés de famille** | classe `.label` | classe `.eyebrow` | Basse | **vocabulaire** `design.md` (drift) |
| `MENU-01` | **Menu vendeur** | **7** entrées (espace, notifs, produits&stock, offres, compagnies, wallet, plans) | **13** : Mes offres · Demandes entrantes · Commandes · Transactions · Stock alloué · Fiche entité · Vérification · Automatisation · Fraîcheur · Pro renouvellement · Wallet · Compte | **Haute** | `menu` sheet app (seller) |
| `MENU-02` | **Menu buyer** | Mon espace · Transactions en cours · Reprendre · Notifications · Recherches · Favoris · Wallet · Plans (8) | Accueil · Mes demandes · Historique · Favoris · Recherches · Notifications · Wallet&Plans · Compte (8) | Moyenne | noms/lieux diffèrent (ex. « Mon espace » vs « Accueil ») |
| `MENU-03` | **En-tête de menu** | `Espace` + h1 `Espace acheteur/vendeur/équipe` | `Menu · <Rôle>` + h1 `Tout Omni, depuis ici` | Basse | `menu` header |

---

## 2. Écrans de la maquette **sans équivalent app** (delta d'annexe Trunk confirmé)

Mesuré : maquette **74 écrans**, app **33 sheets**. Les absents sont surtout **terrain/opérateur** :

`op-queue`, `op-visit`, `op-report`, `op-side` (4 écrans opérateur) · `seller-scan`, `seller-txn`, `seller-chat`, `seller-fulfil`, `seller-pay-confirm`, `seller-entity`, `seller-entity-fiche`, `seller-automation`, `seller-account`, `fraicheur`, `remise`, `historique`, `demandes`, `recu`, `room`, `notif-centre`, `produit-multi`, `scan-entity`, `admin-verify`, `admin-claim`, `facility-apex`, `entity-from-qr`, `intent`, `pending`, `rate`, `pay`, `reply`, `state-slow`, `state-error`, `results-empty`, `entity-empty`.

**Lecture :** plusieurs sont **fusionnés** dans un sheet app (ex. `avail/pending/reply/intent/qr/pay/txn-track/rate` = stages du `flow` app ; `demandes`/`historique` = `home` app) — **pas tous des manques**. Les **réellement absents** : `op-queue/op-visit/op-report/op-side` (opérateur terrain), `seller-automation`, `fraicheur` (état), `remise` (état), `room`.

---

## 3. Classification de dette (Nature Way)

| Classe | Écarts |
|---|---|
| **Logique** | `DOCK-02` (l'opérateur n'a pas le dock terrain que la maquette prescrit) |
| **Visuelle** | `OPT-02`, `MENU-03`, `DOCK-05` |
| **Données/état** | `SEARCH-01` (tri), `SEARCH-02` (fraîcheur état-codée) |
| **Documentation/arbitrage** | `DOCK-01`, `OPT-01` (app plus riche/fin — à acter, pas forcément un défaut) |

**Aucun écart de sécurité.** Aucune régression : l'app reste **en avance** sur beaucoup de surfaces (transaction, bulk, favoris, Pro, team).

---

## 4. Décision requise (une seule)

**Le fondateur choisit la direction de rattrapage**, puis une tranche est ouverte :

- **(a) Aligner l'app sur la maquette** — ajouter le **tri** (SEARCH-01), le **dock opérateur terrain** (DOCK-02), les **menus vendeur complets** (MENU-01). Le plus fidèle à l'autorité Species.
- **(b) Acter les écarts app-en-avance** (DOCK-01 capability, OPT-01 6 portées) et ne corriger que ce qui **manque au fond** (tri, dock opérateur, menus).
- **(c) Geler** — les écarts sont cosmétiques sauf `SEARCH-01`/`DOCK-02`/`MENU-01`.

**Recommandation (hypothèse réversible, à confirmer) :** **(b)**. Le tri et le dock opérateur sont des **manques de fond** ; le reste est de la fidélité.

---

## 5. Garde falsifiable (à écrire avec la tranche)

Un garde `dock-search-conformance` vérifiera que : (1) `results` expose un `sortbar` ; (2) l'opérateur a un dock terrain distinct de l'admin ; (3) le menu vendeur contient les entrées maquette ; (4) les 3 familles de contraintes sont rendues. **Falsifié** dans les deux sens avant clôture.
