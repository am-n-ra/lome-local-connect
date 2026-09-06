# Intra-skill Plan — NW-PROD / Omni UI rebuild 1:1

> **Founder HQ Plan ID:** HQ-OMNI-2026-09-02
> **Local Plan ID:** NW-PROD-OMNI-01
> **Assigned gate:** G-06 — Branches/UI — « rebuild 1:1 maquette V1.3 + vrai backend, supprimer l'UI actuelle en fin de parcours »
> **Local owner:** Nature Way
> **Expected return:** UI remplaçée 1:1, chaînes backend réelles, preuves par slice, suppression contrôlée, V1 fonctionnelle ( enregistrer/chercher produits·services·facilités + admin gère comptes工.

## Resource Receipt

| Status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md`, `autonomous-delivery-gates` (via skill(, `proof-and-decision-ledger` (via skill( |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` → ce document; `system-dependency-map` (existante: `docs/nature-way/omni-system-dependency-map-2026-09-02.md`( |
| Not loaded / reason | `launch-envelope` — requis à la release V1 finale, pas par slice; `technical-lead-production-review` — pour décision d'architecture matérielle, non encore atteinte |

## Décisions fondateur ( reçues 2026-09-05( — D-R1..R4

| ID | Décision |
|---|---|
| D-R1 | Suppression de l'UI actuelle **autorisée**; rollback = **dernier commit** ( travail direct sur `omni-v2-rebuild`, commits atomiques, pas de branche éphémère( |
| D-R2 | Base = **maquette HTML exacte 1:1** ( `docs/maquette/omni-species-maquette.html`（ + **motion spec V1.3 inclus**（ |
| D-R3 | **Zéro mock** : toute donnée = vraies API (`api.ts`（; fixtures éventuelles = données de démo déjà en DB (`Omni Demo Seller Hub`（, étiquetées |
| D-R4 | « Rajoute tout le nécessaire » — cible: **première V1 fonctionnelle**（ : les gens enregistrent/cherchent produits·services·facilités; l'admin/équipe gère le nécessaire des comptes. |

## Local gate plan — G-06 Branches/UI ( rebuild 1:1(

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | V-1 Coquille + carte + motion | Coquille 1:1 pixelée depu la maquette, carte réelle MapLibre, auth réel, facilities réelles, états error/empty/recover beaux | Page load prod + auth + facilities + états capturés ( browser proof( | `ready` | Nouveau retour fondateur visuel |
| 2 | V-2 Admin/opérateur | Surfaces admin 1:1 branchées endpoints réels ( console/file/trust/rôles/audit/comptoir( | API round-trips + UI états ( 401/403 gérés( | `todo` | Décision renversée |
| 3 | V-3 Vendeur | Workspace/catalogue/produits/facilité/stock/offres/wallet branchés endpoints réels ( entitements Pro/非-Pro( | API round-trips + garde 409 | `todo` | Idem |
| 4 | V-4 Acheteur + transactions | Recherche/contraintes/facility/claim/onboard/saved/transaction room/QR/PAYMENT branchés ( loop T-08( | Browser + integrated loop réelle + 10 événements | `todo` | Idem |
| 5 | V-5 Suppression UI actuelle | Toutes les chaînes V-1..4 `verified` sur la nouvelle UI | Test suite complète + build + prod hash | `todo` | Un slice échoue |

## Canevas 1:1 — inventaire sheets maquette (extrait HTML maître(

SEARCH, RESULTS, FACILITY(buyer/unclaimed/admin(, AVAIL, BULK, PENDING, ARESULT, COMPARE, INTENT, TXN, QR, MENU, BUYERHOME, WALLET, PLANS, PAYMENT, SAVED, ACCOUNT, ONBOARD, SELLER, COMPANY, PRODUCTS, STOCKEVENT, OFFERS, ADMIN. Extensions documentées V1.3: rolepill glissant, countmark, rail pré-recherche + chips-démos, vignettes riches, onboarding 3 étapes, motion A/B/C + labels paliers ( T-12(.

## Task tree résumé

| ID | Phase | Objective | Depends | Status | Acceptance / proof |
|---|---|---|---|---|---|
| G-06 | Branches | UI 1:1 + backend réel + suppression | D-R1..4, maquette, spec | `in_progress` | Slices V-1..V-5 verified |
| V-1 | Branches/Coquille | Shell 1:1: stage, rolepill, navpill/dock, countmark, carte MapLibre, search dock → `listPublicFacilities`, états error/empty/skeleton | ui-v13.css ( commité( | `in_progress` | Page load, recherche réel rend 6 produits démo véridiques, états capturés |
| V-2 | Branches/Admin | Surfaces admin branchées endpoints réels | V-1, api.ts admin | `todo` | Round-trips + 401 géré |
| V-3 | Branches/Vendeur | Surfaces seller branchées endpoints réels | V-1, api.ts seller | `todo` | Round-trips + 409 garde |
| V-4 | Branches/Acheteur | Surfaces buyer+transaction branchées loop réelle | V-1, api.ts buyer/txn | `todo` | Browser + loop 10 événements |
| V-5 | Branches/Suppression | Supprimer l'UI actuelle ( trunk sheets legacy(, coquille seule nouvelle | V-1..V-4 | `todo` | Suite + build + prod hash |

## ⏫ RECONCILIATION V-6 (2026-09-05, ordre fondateur direct)

**Fondateur (direct)** :
1. **Développer BULK + COMPARE** (les 2 surfaces ABSENTEs du re-audit G06(→ V-6a + V-6b.
2. **Pas de clôture Gate  ​6** — l'UI doit **matcher la maquette 1:1**: le **flou** (dockmask/backdrop-blur(, **animation du dock & de la navigation** (morph, icon-in, sheet-enter(, **toutes les nouveautés** (freshbar/fraîcheur, facilité mobile, sortchips, desktop shell(.
3. **Prod = la vraie app, pas une maquette** — responsive (mobile+tablette+desktop(, données réelles (D-R3 zéro mock(, états réels (loading/empty/error/retry/cancel/locked(.

**Impact plan** : G-06 reste `in_progress` (pas de clôture(; V-6 ajouté (workstream「1:1 motion+surfaces」(: V-6a BULK (multi-facilités, `requestAvailability`×N, idempotency par facilité(— **démarré**; V-6b COMPARE (sortchips + candidates réels, tri distance/prix/remise(; V-6c flou+dock/nav animations (dockmask, morph, icon-in, sheet-enter(; V-6d facilité mobile + freshbar fraîcheur + micro-copies M; V-6e desktop shell responsive 1:1 + aria-modal; V-6f checklist finale 4 largeurs + verdict Go (décision fondateur(.
## Handoff to Founder HQ — ce pass

> **Local status:** `in_progress` ( V-1 actif（
> **Gate decision:** avancer après V-1 proof
> **Closed:** `ui-v13.css` extrait 1:1 ( base scaffold（
> **Open:** V-1..V-5 planifiés（, V-1 actif（
> **Resource Receipt:** controller + plan template instanciés; maquette/spec/register/api.ts inspectés
> **Residual gap:** backend non touché; la coquille n'existe pas encore; suppression non exécutée
> **Next smallest action:** construire V-1 shell minimal réel ( stage+rolepill+navpill+countmark+carte+search dock（ appelant `listPublicFacilities`（, puis preuve browser
> **Re-plan trigger:** retour fondateur visuel, décision renversée, slice proof échouée

## ☑️ V-6a/V-6b + V-6c+ — livrés (2026-09-05, commit  ​26eeb3d)

- **V-6a BULK multi-facilités (REAL)** : `bulk` sheet intégré in TrunkAppV13 — per-facility lazy detail + `.chk` checkbox selection par produit simplifié (, parallel `requestAvailability` (un POST par facilité) + polling `getAvailabilityResponses`, statut par ligne (`submitted/available/partial/unavailable/expired/error`), auth-guard + facilité non-revendiquée bloquée, `.pitem`/`.freshbar`/`.btnrow` vocab.
- **V-6b COMPARE (REAL)** : `compare` sheet intégré — `.sortbar`/`.sortchip` réels(match/distance/price/remise), tri réel délégué au module propre `src/trunk/v13-compare.ts` (comparateur clean-room ASCII-only), cards `.cardbox` click → `flow` (achat) si transactable sinon facilité sheet; bouton « Choisir & acheter » choisit meilleur candidat transactable.
- **V-6c+ 1:1 (maquette byte-exact)** : CSS ajouté depuis la maquette(lignes source−(: `.sortbar`/`.sortchip`(+svg/+active), `.plist`, `.freshbar`(+`.fdot`), `.chk`, `.sheet.h-mid`(max-height:62dvh), `.sheet.hidden`, `.selbar`, `.cardbox.tap`(+active), `.pitem:active`/`.menuitem:active`/`.chip:active`/`.btn:disabled`, `.navpill.morph`(+desktop none), `.icon-in`, `.dockmask`(élément monté entre carte et sheets, z10) +desktop none}, — 1169 octets appended, pure ASCII.
- **Qualité**: tsc 0 errores, tests 295/295 (47 files), build ✅ (bundle `index-…`), preview statique navegued ✅ (dockmask+atoms servis); `poll()` return-type corrigé (cascade TS).
- **Push ⚠️ BLOQUÉ**: `GITHUB_TOKEN` not authorized for l'account remote (3 tentatives: `x-access-token:`/`am-n-ra:`/token-as-user — toutes « Invalid username or token »); remote URL restauré propre(https://github.com/...); **3 commits ahead** à pousser (`4f5660e`, `8dca9ad`, `26eeb3d`) — **à fondateur: fournir un jeton GH avec accès `repo`** (puis `git push origin omni-v2-rebuild`).

## ☑️ Maquette V1.3-latest (2026-09-05, fondateur( — re-baseline 1:1

- **Référence mise à jour par le fondateur**: la maquette maître `docs/maquette/omni-species-maquette.html` est désormais la version complète V1.3-latest— **vraie carte MapLibre GL JS** (tuiles `demotiles.maplibre.org`, `new maplibregl.Map`, vrais `Marker`(,, **moteur carto avec fallback** (`initFallbackMap`: monde SVG avec surface MapLibre simulée (easeTo/flyTo/once/cameraForBounds(,, **coquille desktop** (`body.desktop` ↔ `desktopMQ` + `applyDesktopMode(matchMedia(1040px(`: rail latéral gauche, top-bar de recherche permanente, panneau contextuel unique, sheets non-SEARCH = colonne 340px; monde chrome `phone::before`● ● ●(,, **séquence de recherche cinématique** (`Recherche dans le monde…` → `Togo · Lomé` → pins révélés en vagues;`flyTo` curve + padding,, **chips démo SIM** (Normal/Aucun résultat/Réseau lent/Panne réseau(,, **onboarding minimal avec reprise automatique de la recherche**, dock contextuel avec FLIP width morph + `icon-in`, keyboard-aware `--ty` (visualViewport(,, toast, etc..
- **Décision fondateur**: « pas encore 1:1 » / « pourquoi ça ressemble à une maquette alors que ça doit être la vraie UI » — diagnostic: l'app V13 (prod `index-CBdpINvJ.js`( ( est **réel** (206 facilités réelles, API réelles, auth Neon( mais **la maquette est désormais en avance sur l'app**:la coquille desktop (`applyDesktopMode`/`body.desktop`( est **absente** du V13 (le MQ legacy T-10w est mort sans `body.desktop`(; le fallback carte du maquette (`initFallbackMap`( est absent;la séquence cinématique et les libellés (`Recherche dans le monde…`/`Togo · Lomé`( absents;les chips démo absentes;le screenshot d'accueil (« Carte indisponible » + liste + count( ressemble à une maquette en panne alors qu'elle est l'app réelle.,
- **Delta contract (V-6c+·2(: à implémenter en React 1:1 depuis la maquette**: (1( desktop chrome `body.desktop` + `applyDesktopMode` + CSS desktop (rail,, top-bar,, panneau 340px,, `phone::before`…(; (2( fallback carte `initFallbackMap`-like (surface visuelle + surface method (easeTo/flyTo/once/cameraForBounds( — fini le « Carte indisponible »(; (3( séquence cinématique copiée (`Recherche dans le monde…`/`Togo · Lomé`/reveal waves/`flyTo` curve+padding(; (4( chips démo SIM (Normal/Aucun résultat/Réseau lent/Panne réseau( pour forcer chaque scénario; (5( micro-copies exactes (facility body « Revendiquer cette facilité »/« La facilité n'est pas sur la carte ? Créer »/« Vente ambulante », boutons(;. — le tout sur données réelles (pas de hand-copied JS — l'app continue d'utiliser `api.ts`(.
- **Prochaine slice proposée**: V-6c+·2 — « Desktop + fallback carte + cinématique 1:1 » (une slice verticale: CSS desktop,, `applyDesktopMode` React,, fallback carte,, séquence copiée,, chips démo( — puis push prod + validation fondateur sur écran ≥1040px.,
