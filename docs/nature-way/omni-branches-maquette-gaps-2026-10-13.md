# Registre d'écarts maquette ↔ app — tranche `BRANCHES-PRICE-DISPLAY` (2026-10-13)

> **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). **Plan :** `NW-PROD-OMNI-PRICE-01`.
> **Objet fondateur :** « si jamais on a d'autres écarts de maquette ce serait temps de les identifier aussi ».
> **Méthode :** comparaison **par contenu**, pas par nom — la leçon documentée (`SP-1`/`T-12`) est
> qu'un `grep` de nom produit des **faux négatifs** : l'app nomme souvent ses surfaces autrement que
> la maquette (ex. `SHEETS['op-visit']` ↔ `TrunkAppV13` + `OperatorEntitySideV13`). Chaque ligne
> ci-dessous a été **lue à l'écran ou dans le code**, jamais déduite d'un nom.

## Méthode et périmètre

- Maquette de référence : `docs/maquette/omni-species-v2-interactive.html` — **49 écrans `SHEETS`**.
- App : **39 feuilles** `data-sheet` + composants (`SellerV13`, `CompanyV13`, `AdminV13`,
  `OperatorEntitySideV13`, `NotificationCenterV13`, `TransactionRoom`, …).
- **Périmètre honnête :** ce pass a **re-vérifié par contenu** les écrans acheteur/opérateur liés à
  la tranche et ceux que le fondateur a cités. Les écrans vendeur/admin **déjà livrés** (NW-13c…j,
  NW-15) sont **recensés présents** mais **non re-audités un par un** dans ce pass — ne pas lire ce
  registre comme une preuve d'absence sur eux.

## A. Écart de cette tranche — `remise` des prix (CLOS)

| Écart | Maquette | App (avant) | Statut |
|---|---|---|---|
| Prix sans ET avec remise | `.pr` réduit + `.old` barré + pastille `−N % Omni` (L149/L158/L577) | réduit seul, aucune origine, aucun `%` | **CLOS** (`ada8844`) |

**Preuve :** `src/trunk/price-display.ts` (règle unique) + `price-display.test.ts` (5) +
`price-display-surface.test.ts` (3) falsifiés ; preuve navigateur
`scripts/prove-branches-price-display.mjs` — **3/6 avant déploiement, 8/8 après** ; prod
`index-BCJO-oHg.js` byte-identique (T-07d).

## B. Écarts réels restants (mesurés)

| # | Écran maquette | Maquette dit | App fait | Verdict | Sévérité |
|---|---|---|---|---|---|
| G-1 | `results-empty` | « Aucune offre ne correspond… » + **Élargir les contraintes** + **Demander en groupé** | « Aucune fourniture ne correspond… » + **Élargir les contraintes** + **Sauvegarder cette recherche** | **PARTIEL** — le 2ᵉ geste diverge (sauvegarde au lieu de demande groupée) | basse |
| G-2 | `facility-apex` | tap sur un pin → **aperçu** (badge · N ventes · distance · ouvert · « Offres N · dès X −N % » · « Ouvrir la page de l'entité » · « Itinéraire · après intention ») | tap sur un pin → **fiche facilité complète** directement | **ÉCART** — l'étape d'aperçu n'existe pas (l'information existe, sur la fiche) | moyenne |
| G-3 | `remise` (salle de transaction) | « Qui remet · Qui reçoit · Preuve de remise » explicites | retrait/livraison + « Confirmer la réception » | **PARTIEL** — la nuance de remise est résumée, pas détaillée | basse |
| G-4 | `produit-multi` | « Un panier par entité · **une seule demande de disponibilité** » | panier par vendeur (session) + « Demander la disponibilité (N) » | **OK** (libellé différent, comportement identique) | — |

## C. Écrans maquette **vérifiés présents** dans l'app (pas d'écart)

| Écran maquette | Surface app (contenu confirmé) |
|---|---|
| `fraicheur` | `SellerFreshnessV13.tsx` (« Seuil frais », « Reconfirmer maintenant », badge À confirmer) |
| `lieu-connaitre` | `TrunkAppV13` (lieu Niv.0, « Géré par aucune entité », gestes claim/create) |
| `entity-empty` | `TrunkAppV13` (recherche entité vide + « Revendiquer un lieu connu ») |
| `entite-publique` | `TrunkAppV13` « Entité · page publique » + « Ses offres » |
| `op-queue` / `op-visit` / `op-report` / `op-side` | `AdminV13` (tournée) + `OperatorEntitySideV13` + `TrunkAppV13` (constat) |
| `signal` / `admin-signal` | signalement d'offre (`TransactionRoom`/`TrunkAppV13`) + contrôle `AdminV13` |
| `notif-centre` | `NotificationCenterV13.tsx` |
| `txn-proof` / `txn-track` | `TransactionRoom.tsx` + `BuyerFlowV13.tsx` (QR, verrou, suivi) |
| `scan-entity` / `entity-from-qr` | `TrunkAppV13` (QR entité → page publique) |
| `results-empty` | `TrunkAppV13` (voir G-1 : 2ᵉ geste diverge) |
| `state-error` / `state-slow` | `AppErrorBoundary` + états de chargement (squelettes `NW-PROD-OMNI-SKELETON-01`) |
| `seller-*` (22 écrans) / `admin-*` (7) | `SellerV13` / `CompanyV13` / `OffersV13` / `StockV13` / `AdminV13` — **recensés, non re-audités un par un** |

## D. Lecture

- **Aucun écart n'est un mensonge** : `G-1`/`G-2`/`G-3` sont des **divergences de parcours ou de
  niveau de détail**, pas des affirmations fausses à l'écran. Aucun n'empêche un achat.
- **`G-2` est le plus visible** (l'aperçu de pin change le premier contact avec une offre) mais il
  est **documenté comme décision** (`T-10p` : « pin → fiche directement ») — à **re-confirmer par le
  fondateur**, pas à « corriger » seul.
- **Rien ici n'ouvre une fondation neuve.** Les trois écarts sont des **durcissements de Branches**
  possibles, à ordonner par le fondateur après cette tranche.
