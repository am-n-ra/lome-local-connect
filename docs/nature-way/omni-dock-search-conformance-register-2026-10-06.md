# Registre de conformité — Dock · Recherche · Options · Menus × rôles (app ↔ maquette)

> **Slice :** `NW-PROD-OMNI-DOCK-01` (Trunk, porte `ROOT_CLOSED_TRUNK_OPEN`).
> **As of :** 2026-10-06 (UTC). **HEAD :** `4148a91`. **Autorité visuelle :** `docs/maquette/omni-species-v2-interactive.html` (74 écrans, Species CLOSE `founder-confirmed`).
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
| `DOCK-02` | **Dock opérateur** | partage le dock **admin** (« À valider » → console admin) ; le terrain n'est que dans le menu | `op-queue` (Dossier terrain) + `op-side` (Aperçu côté entité, centre) | **Haute** | **LIVRÉ (DS-3 + TF-6 + DS-13)** : dock opérateur `Tournée` → sheet `tour` (`op-queue` + `op-visit` + `op-report` : prise, constat photo+position, transmission, reprogrammation). **`op-side`** (aperçu côté entité, lecture seule) livré : entrée « Voir ce que voit l'entité » sur le dossier → sheet `op-side` (badge · offres publiées · demandes en attente), lecture seule (aucune écriture de badge) |
| `DOCK-01` | **Rolepill = rôles** | n'affiche **que** les rôles possédés (`eligibleRoles`, capability serveur) | affiche **les 4** toujours (démo) | Moyenne | **ACTÉ (DS-4)** : capability (app, honnête) **retenu** vs démo — décision consignée |
| `DOCK-03` | **Action centrale buyer** | `QR` → `PublicQrScannerSheet` (scanner le **QR public d'un lieu**) | `scan-entity` → **scanner le QR d'une entité** | Moyenne | **LIVRÉ (DS-3)** : libellé buyer → « Scanner une entité » |
| `DOCK-04` | **Dock vendeur** | `Recherche / Stock / Menu` | `Mon espace / Scanner le code d'un acheteur / Menu` | Basse | **LIVRÉ (DS-6)** : `Mon espace / Scanner le code d'un acheteur / Menu` |
| `DOCK-05` | **Retour contextuel** | pas de « Retour » explicite (sauf états `destination`) | `backItem` sur **tout** écran non-home | Basse | **LIVRÉ (DS-7)** : Retour sur tout écran non-home, **famille compte incluse** |
| `SEARCH-01` | **Tri des résultats** | **absent** (pas de `sortbar` sur `results`) | `sortbar` : Pertinence / Prix / Distance (`setSort`) | **Haute** | **LIVRÉ (DS-3)** : `sortbar` (4 chips Meilleur match / Plus proche / Prix le plus bas / Remise Omni) + ordre carte/rail |
| `SEARCH-02` | **Fraîcheur** | texte fixe dans `bulk` (« reflète l'allocation Omni ») | `freshbar` **état-codé** (frais / `stale` / `expired`) | Moyenne | **LIVRÉ (2026-10-06, D-03)** — `src/trunk/offer-freshness.ts` dérive l'état de `availability_expires_at` (fenêtre 4 h/24 h déjà en base, `038`), jamais stocké ; `freshbar` rendu dans `results` (vivante / vieillissante / non confirmée). Projection SQL de la fenêtre du lieu dans `listPublicFacilities` + `getFacilityDetail`. **+ `DS-12` : la moitié VENDEUR est livrée et vérifiée en prod** (`aecfe47`, prod `index-Ck9ht1wn.js` === local, T-07d ✅, preuve navigateur vs prod 11/11) — sheet `freshness` (`SellerFreshnessV13`) qui **re-confirme** la dispo via `setProductAvailability` (D-04 Pro-gated) ; auparavant cette route n'avait **aucun appelant UI** (0/16 offres transactables). Reste `fraicheur` côté **entité** (état auto Pro) = tranche ultérieure |
| `SEARCH-03` | **Sheet recherche** | niveau entité/offre + contraintes ; pas de lien « Recherches sauvegardées » | + lien `saved` dans l'en-tête | Basse | **LIVRÉ (DS-9)** : lien `.linkbtn` dans l'en-tête, prouvé navigateur (prod) |
| `OPT-01` | **Portées de rayon** | **6** : 1/5/10/25/100/Monde | **4** groupées : `Quartier·1 km` / `Ville·5-25 km` / `Région·100 km` / `Monde` | Basse | **ACTÉ (DS-4)** : app plus fine, **retenue** (D-CON-4) |
| `OPT-02` | **Libellés de famille** | classe `.label` | classe `.eyebrow` | Basse | **LIVRÉ (DS-4)** : familles + portée utilisent `.eyebrow` (vérifié `eyebrow">{group.label}`) |
| `MENU-01` | **Menu vendeur** | **7** entrées (espace, notifs, produits&stock, offres, compagnies, wallet, plans) | **13** : Mes offres · Demandes entrantes · Commandes · Transactions · Stock alloué · Fiche entité · Vérification · Automatisation · Fraîcheur · Pro renouvellement · Wallet · Compte | **Haute** | **ACTÉ (DS-3, direction (b))** : les 7 entrées atteignables sont **conservées** ; **8 destinations maquette restent sans écran app** (`seller-orders/txn/stock/entity-fiche/verif/automation/pro/account`) → les afficher serait **8 boutons morts**. **`Fraîcheur de la dispo` LIVRÉE (DS-12)** → sheet `freshness`. Construire les 8 écrans restants = tranche dédiée (non ouverte) |
| `MENU-02` | **Menu buyer** | Mon espace · Transactions en cours · Reprendre · Notifications · Recherches · Favoris · Wallet · Plans (8) | Accueil · Mes demandes · Historique · Favoris · Recherches · Notifications · Wallet&Plans · Compte (8) | Moyenne | **LIVRÉ (DS-8)** : noms maquette, « Reprendre » relocalisé dans Accueil |
| `MENU-03` | **En-tête de menu** | `Espace` + h1 `Espace acheteur/vendeur/équipe` | `Menu · <Rôle>` + h1 `Tout Omni, depuis ici` | Basse | **LIVRÉ (DS-4)** : `Menu · <Rôle>` + `Tout Omni, depuis ici` (vérifié code) |

---

## 2. Écrans de la maquette **sans équivalent app** (delta d'annexe Trunk confirmé)

Mesuré : maquette **74 écrans**, app **33 sheets**. Les absents sont surtout **terrain/opérateur** :

`op-queue`, `op-visit`, `op-report`, `op-side` (4 écrans opérateur) · `seller-scan`, `seller-txn`, `seller-chat`, `seller-fulfil`, `seller-pay-confirm`, `seller-entity`, `seller-entity-fiche`, `seller-automation`, `seller-account`, `fraicheur`, `remise`, `historique`, `demandes`, `recu`, `room`, `notif-centre`, `produit-multi`, `scan-entity`, `admin-verify`, `admin-claim`, `facility-apex`, `entity-from-qr`, `intent`, `pending`, `rate`, `pay`, `reply`, `state-slow`, `state-error`, `results-empty`, `entity-empty`.

**Lecture :** plusieurs sont **fusionnés** dans un sheet app (ex. `avail/pending/reply/intent/qr/pay/txn-track/rate` = stages du `flow` app ; `demandes`/`historique` = `home` app). **TF-6 (2026-10-04, déjà en prod)** a construit `op-queue`+`op-visit`+`op-report` dans le sheet `tour` (dock opérateur `Tournée`). **`fraicheur` (2026-10-06, DS-12)** est construite côté **vendeur/entité** dans le sheet `freshness` (`SellerFreshnessV13`) — c'est la moitié **écriture** de SEARCH-02/D-03. Les **réellement absents** restants : **`op-side`** (aperçu côté entité, lecture seule) · **`seller-automation`** (bascule dispo auto, sans modèle) · **`room`**. Le menu vendeur (`MENU-01`) reste **acté** (direction (b)) : ses **8** destinations sans écran ne sont pas affichées pour ne pas créer de boutons morts.

---

## 3. Classification de dette (Nature Way)

**Réconcilié 2026-10-06 (post DS-3…DS-9 + DS-12 + TF-6 + SEARCH-02/D-03).** Ne restent ouverts que :

| Classe | Écarts restants |
|---|---|
| **Données/état** | — (aucun) |
| **Fidélité (écrans non construits)** | `MENU-01` (8 destinations vendeur sans écran) · `op-side` · `seller-automation` · `room` |

**Résolus/actés :** `SEARCH-01` (tri, DS-3) · `SEARCH-02` (fraîcheur dérivée **+ moitié vendeur**, D-03/DS-12) · `fraicheur` (DS-12) · `DOCK-02` (dock opérateur, DS-3+TF-6) · `DOCK-03` (DS-3) · `DOCK-04` (DS-6) · `DOCK-05` (DS-7) · `MENU-02` (DS-8) · `SEARCH-03` (DS-9) · `OPT-02`+`MENU-03` (DS-4) · `DOCK-01`+`OPT-01` (actés DS-4).

**Aucun écart de sécurité.** Aucune régression : l'app reste **en avance** sur beaucoup de surfaces (transaction, bulk, favoris, Pro, team).

---

## 4. Décision — RENDUE

**Direction (b) retenue par le fondateur** (`DS-2`, `HO-OMNI-32`) : **acter les écarts app-en-avance** (DOCK-01 capability, OPT-01 6 portées) et **combler ce qui manque au fond** (tri, dock opérateur). Exécutée par `DS-3` (tri + dock opérateur + libellé buyer) et `DS-4` (actes + vocabulaire). **Clos.**

---

## 5. Garde falsifiable — LIVRÉ

`scripts/check-dock-search.mjs` (`npm run check:dock-search`) — **16 règles**, `--selftest` **16/16 fired** : `sortbar` présent · dock opérateur terrain distinct · menu vendeur `seller-reply` · en-tête menu · familles `.eyebrow` · docks vendeur/buyer/Retour · lien `saved` · classes `.linkbtn`/`.textbtn` définies. **Falsifié dans les deux sens** (chaque mutation fait tomber sa règle).
