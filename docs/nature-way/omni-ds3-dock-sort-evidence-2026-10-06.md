# Preuve — DS-3 : tri des résultats, dock terrain opérateur, menu vendeur

> **Slice :** `NW-PROD-OMNI-DOCK-01` (Trunk, porte `ROOT_CLOSED_TRUNK_OPEN`).
> **As of :** 2026-10-06 (UTC). **Autorité visuelle :** `docs/maquette/omni-species-v2-interactive.html`.
> **Décision fondateur (DS-2) :** option **(b)** « acter l'avance de l'app, combler le fond » → ouvre `DS-3`.
> **Réconciliation de contexte :** `M1` (apply `066`) re-confirmée ce jour — `066` était **déjà** appliquée (registre `db/migrations/066_v2_field_visits.sql`, checksum `85b37ce0…`), tables/CHECKs/index conformes, 0 résidu. `M2` (TF-6) est **déjà livré et clos** (`aa0b8b3`, spec §6). TF-6 n'est **pas** le travail ouvert ; DS-3 l'est.

---

## 1. `SEARCH-01` — le tri des résultats (absent → présent)

**Avant :** la maquette `SHEETS.results` porte un `sortbar` (Meilleur match / Plus proche / Prix le plus bas / Remise Omni). L'app **n'en avait aucun** : résultats servis dans l'ordre serveur, sans tri acheteur.

**Livré :**
- **Module pur** `src/trunk/results-sort.ts` (`RESULTS_SORTS`, `sortResults`, `metersBetween`) — sans DOM, testable.
- **Agrégats serveur réels** (`listPublicFacilities`) : `min_price_minor` (offre publiée la moins chère, **remise Omni appliquée**, `order by` prix remisé), `price_currency` (devise **de cette même ligne**), `max_discount_percent`. Exposés sur `PublicFacility`.
- **UI** (`TrunkAppV13`) : `sortbar` (4 chips) rendu dès >1 résultat ; la carte affiche **« dès 126 000 F »** (prix d'appel, devise de l'offre) ; carte + rail suivent `orderedResults`.
- **Honnêteté du tri :**
  - **« Plus proche »** demande la **position réelle** (`navigator.geolocation`) ; sans position, **ordre serveur conservé** — jamais de distance inventée.
  - **« Prix le plus bas »** : une offre **sans prix publié** est classée **en dernier** (jamais « la moins chère » par défaut) ; **deux devises différentes ne sont jamais comparées** (D-LOC-3).

## 2. `DOCK-02` — dock terrain opérateur (partagé admin → propre)

**Avant :** l'opérateur partageait le dock **admin** (« À valider » → console admin) ; le terrain n'était atteignable que par le menu.

**Livré :** l'opérateur a son **dock terrain** `Recherche / Tournée / Menu` — « Tournée » (icône `pin`) ouvre la **file terrain** (`openTour` → sheet `tour`). Un **écran de destination** pour un opérateur montre aussi « Tournée » au centre. L'`admin` garde « À valider ».

## 3. `MENU-01` — menu vendeur (mince → complété)

**Livré :** le menu vendeur gagne **« Demandes entrantes »** (icône `Inbox`) → sheet `seller-reply`, en complément de Produits & stock / Offres / Compagnies / Wallet / Plans.

## 4. `DOCK-03` — libellé de l'action centrale buyer

**Livré :** `QR` → **« Scanner une entité »** (le scanner ouvre le QR public d'un lieu/entité), conforme à `scan-entity` de la maquette.

---

## 5. Preuves

| Type | Résultat |
|---|---|
| **SQL réel (canonique `br-dawn-hill-am5amy22`, 13 744 facilités)** | `EXPLAIN` **compile** ; valeurs réelles : `Omni Demo Seller Hub` 18 000 XOF / 10 % ; `Boulangerie du Marché d'Adawlato` 25 500 XOF / 25 % ; `Épicerie Chez Afi` 126 000 XOF / 30 % |
| **Unitaire** | `src/trunk/results-sort.test.ts` **7/7** (ordre serveur, proximité sans position, prix sans prix, devises incomparables, remise, haversine) |
| **Garde falsifiable** | `scripts/check-dock-search.mjs` — **6 règles**, `--selftest` → **6/6 falsifiées**, source réelle clean ; `npm run check:dock-search` **PASS** |
| **Navigateur (Playwright, 4 largeurs 390/768/1280/1920)** | `scripts/prove-ds3-dock-sort.mjs` **28/28 PASS** — dock 3×≥44px, libellé buyer, 3 cartes, sortbar 4 chips, prix « dès 126 000 F », **« Prix le plus bas » → Hub éloigné**, **« Remise Omni » → Épicerie proche** ; familles de contraintes présentes ≥1280 |
| **Prod réelle (vraie DB, `omni.sparkafrika.online`)** | même script, sans fixture : **4 largeurs PASS** — dock « Scanner une entité », **20 résultats**, **sortbar 4 chips**, **prix réel « dès 25 500 F »** (=== l'agrégat API) ; familles de contraintes présentes ≥1280. **Hash prod `index-VHx416lL.js` sha256 `a995499e…` === build local (T-07d ✅)** ; déploiement GitHub `95f02e2` |
| **Suite** | **790/790** (79 fichiers), `tsc` clean |
| **Gardes repo** | boundary · state · docs · coherence · maquette · live-surface · dead-css · dock-search = **8/8 PASS** |
| **Bundles serverless** | **12 régénérés** dans le même commit (leçon `9c3f5d8`) — l'agrégat SEARCH-01 est présent dans `api/v2/public/facilities.js` (5 occurrences) |

**Résidu honnête :** la preuve navigateur des résultats utilise une **fixture de forme** (sandbox sans DB) ; la **forme** est prouvée contre le canonique (SQL réel) et le **rendu** par le navigateur. La preuve **prod** (vraie DB, `omni.sparkafrika.online`) est le contrôle final après push.

## 6. Reste (DS-4 / porte)

- `DOCK-01` (rolepill rôles) : **acter** (capability app).
- `DOCK-04` (dock vendeur `Mon espace / Scanner le code d'un acheteur / Menu`), `DOCK-05` (Retour contextuel), `OPT-02`/`MENU-03` (vocabulaire), `SEARCH-02` (fraîcheur) : tranches suivantes (`DS-4`).
