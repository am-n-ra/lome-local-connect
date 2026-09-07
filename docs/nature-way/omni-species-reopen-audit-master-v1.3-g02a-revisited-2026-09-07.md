# Re-audit Species — Master V1 canonique ↔ Maquette V1.3 ↔ Code V13 (G-02a revisité, 2026-09-07)

> **ID:** `SPECIES-REAUDIT-MASTER-2026-09-07` · **Gate:** Species (G-02a revisité( / Gate  ​6 (Canopy-launch readiness(
> **Statut:** `review_founder` — audit produit, **aucun code modifié par cet audit même**. Branche `omni-v2-rebuild` HEAD de départ `8e6351c`; **le code a évolué de 18 commits pendant la passe** (`113e278`, T-16: map idle gate + deferred pins + arrival/reveal patterns etc( — aucun impact sur les verdicts: les preuves §3 s'appuient sur des fichiers non touchés ou des lignes stables (`map-pins.ts`, `SellerV13.tsx`, `BuyerFlowV13.tsx`, `PublicQrScannerSheet.tsx`(; **cet artefact docs est rebasé proprement sur `113e278`**.
> **Autorités:** (1( Master V1 canonique `docs/OMNI_MASTER_PRODUCT_INTERFACE.md` (172 sections, patched 2026-08-21: §0.5 V1 Scope Gate = build contract, §0.8.1–§0.8.4 corrections canoniques, annexes normatives A–H(; (3( Code V13 `src/trunk/*V13*` + `TrunkMap` + `map-pins` + `PublicQrScannerSheet` (HEAD `8e6351c`, 306/306 tests, tsc clean, build OK; prod push effectué (règle « push sans signal »(.
> **Question fondateur distillée:** « La maquette V1.3 couvre-t-elle le Master V1 canonique ? » — c'est la question décisive avant de clore Gate  ​6 « Go with limits ».

---

## 1. Resource Receipt

| Statut | Exact path |
|---|---|
| Chargé (master canonique( | `docs/OMNI_MASTER_PRODUCT_INTERFACE.md` — §0.5 (scope table build contract(, §0.8.1–§0.8.4 (corrections canoniques(, annexes normatives A–H, §15, §80–82, §87–91, §167–169 |
| Chargé (maquette V1.3( | `docs/maquette/omni-species-maquette.html` — sheets 319–401, coquille desktop 219–263, moteur JS 428–957 (aussi spec `docs/nature-way/omni-v1.3-ui-motion-search-onboarding-spec-2026-09-05.md` §1–§6( |
| Chargé (code V13( | `src/trunk/TrunkAppV13.tsx`, `src/trunk/BuyerFlowV13.tsx`, `src/trunk/SellerV13.tsx`, `src/trunk/TrunkMap.tsx` + `map-pins.ts` + `src/lib/boundaries/loader.ts` + `src/components/ui/PublicQrScannerSheet.tsx` |
| Chargé (audits antérieurs( | `docs/nature-way/omni-v13-reaudit-v1.3-G06-2026-09-05.md`, `docs/nature-way/omni-species-reopen-audit-G5-2026-09-05.md`, `docs/nature-way/omni-species-audit-G02a-2026-09-02.md` |
| Template instancié | `.agents/skills/nature-way-founder-hq/templates/skill-handoff-receipt.md` → `docs/founder-hq/handoff-receipt-HO-OMNI-07.md` |
| Non chargé / raison | Preuve navigateur réelle 4 largeurs sur prod (item `manual` Gate  ​5(; preuve caméra/GPS réel = exigence `partial` de la evidence boundary (§0.8.4( — sandbox sans périphériques. |

---

## 2. Verdict direct — la maquette V1.3 couvre-t-elle le Master V1 canonique ?

**NON.**  Sur la masse du build contract (§0.5.3/§0.8.4(, la maquette V1.3 couvre la vaste majorité des surfaces  ( 25 surfaces + coquille desktop + motion recherche/onboarding(, mais **10 contrats normatifs « Build now » ne sont pas représentés ou le sont partiellement** dans la maquette.  Le code V13 est aligné 1:1 sur la maquette  ( surface par surface, G06 + T-13c–f(, ce qui signifie que **le code hérite aussi de ces 10 lacunes master→maquette**, plus 2 violations propres (palette pins corail, perte du scanner seller qui existait en trunk antérieur(.

En conséquence : clore Gate  ​6 « Go with limits » **maintenant** serait basé sur une limite implicite — alors que la moitié de ces écarts sont des contrats **« Build now »** ratifiés dans la scope table (§0.5.3(, pas du scope deferred.  La recommandation est un **re-audit ciblé de delta master↔maquette** (pas un re-audit complet de toutes les maquettes(, suivi de mini-slices V-7 pour les items « Build now », puis une clôture honnête de Gate  ​6 avec dettes restantes **explicitement triggerées**.

---

## 3. Table de conformité — Master canonique → Maquette V1.3 → Code V13

Légende: ✅ conforme · ⚠️ partiel · ❌ absent/divergent · 🛠️ Build now · 📌 dette (décision fondateur: construire ou endetter avec trigger(.

| # | Contrat normatif (master canonique( | Maquette V1.3 | Code V13 | Statut master→maquette/→code | Preuve |
|---|---|---|---|---|---|
| 1 | **Seller workspace map-first** (annexe A+K, §0.8.1, §0.8.4| ❌ `#SELLER` = sheet dense (stats+compagnie+actif+boutons( | ❌ `SellerV13` = feuille h-full/tabs internes (produits/dispo/stock/nouveau(; dropper (pas de sélection par pin(; pas de dock flottant d'actions; **scanner QR perdu** (existait `SellerScannerModal`, T-07b( | 🛠️ ❌/❌ | Master l.4957–4973; HTML l.386; `SellerV13.tsx` l.137/209, grep scanner=vide |
| 2 | **Cards product-first + CATALOG_READY dédié + fallback texte libre** (§0.8.3| ❌ cards = nom facility; catalogue = liste produits **inline** dans `#FACILITY` | ❌ `cardbox` résultats = facility.name+catégorie+lat/lng+plan·produits (facility-first(; catalogue inline (pas de `Voir les produits`/`Correspond à votre recherche`/`Je ne trouve pas…`( | 🛠️ ❌/❌ | Master l.4883–4898; HTML l.322+325; `TrunkAppV13.tsx` l.825–833+985–1009 |
| 3 | **QR transactionnel auto généré à l'intention** (annexe B « généré immédiatement dans la même création d'intention »( | ⚠️ bouton `Afficher le QR de transaction` (cli( | ⚠️ bouton `Mon QR` → `issueQr()` séparé; QR non affiché à l'entrée TXN | 🛠️ ⚠️/⚠️ | Master l.4974–4985; HTML l.352; `BuyerFlowV13.tsx` l.107–123+152–164+279 |
| 4 | **QR scanner caméra prêt‑à‑scanner + fallback `Saisir le code`** (annexe C + §0.8.4| ❌ aucune surface scanner transactionnel seller; `#QR` = scan de QR **public facility** (sans bouton `Autoriser…` ni état permission ni fallback( | ❌ `SellerV13` sans scanner; `PublicQrScannerSheet` démarre `Html5Qrcode.start` immédiat (permission implicite(; échec = message seul | 🛠️ ❌/❌ | Master l.4985–4991; HTML l.355; `PublicQrScannerSheet.tsx` l.42–62; `SellerV13.tsx` grep=0 |
| 5 | **Onboarding d'accès + reprise automatique** (annexe G; spec V1.3 §4| ❌ `#ONBOARD` = 3 étapes demo (contact+OTP+soft paywall( mais non câblé au flux auth réel | ❌ sheet `auth` = formulaire simple; aucun `savePendingSearch`/`returnTo` (grep vide(; needAuth n'intervient qu'aux actions protégées | 🛠️ ❌/❌ | Master l.4992–4998; HTML l.379–382; `TrunkAppV13.tsx` grep=vide; `BuyerFlowV13.tsx` l.55–63 |
| 6 | **Palette pins multimodale** (§0.8.3 + palette verrouillée fondateur 2026-09-02| ❌ pins `.vdot`/`.cmark` monochromes encre| ❌ **violation**: `PIN_CORE_COLOR='#F08F5A'` + `PIN_RING_OWNED_COLOR='#234D40'` (legacy LiquidGlass( sur les couches circle-paint MapLibre réelles | 📌 ❌/❌ | Master l.4899–4905; HTML l.283–293; `map-pins.ts` l.23–29; `ui-v13.css` l.3 |
| 7 | **Data company admin** (annexe E| ❌ `#ADMIN` = file revue| ❌ `AdminV13` = console counts/claims/op-state/counter/audit (pas de data company( | 📌 ❌/❌ | Master l.4991–5003; HTML l.401; `AdminV13.tsx` |
| 8 | **AVAILABILITY_SETUP 4 étapes nommées** Produit/Portée/Contraintes/Réponses + portée Pro (§0.8.3| ⚠️ `#AVAIL` = panier+Retrait/Livraison+note (3 étapes informelles(; `#BULK` séparée | ⚠️ stage `avail` = quantité+budget (écran unique(; **retrait/livraison+note absents** du code | 🛠️ ⚠️/⚠️ | Master l.4897–4902; HTML l.328; `BuyerFlowV13.tsx` l.236–258 |
| 9 | **Wallet buckets + pending non dépensable** (annexe D/I| ⚠️ `#WALLET` = solde+stats+recharger (pas buckets( | ⚠️ solde+écritures+recharge+bonus+plans (pas de vue buckets ni label pending( | 📌 ⚠️/⚠️ | Master l.4985–4991; HTML l.364; `TrunkAppV13.tsx` l.606–678 |
| 10 | **Unclaimed CTA « Demander une vérification »** (§0.8.3( | ⚠️ wording `Revendiquer cette facilité` (sémantique request ✅( | ⚠️ wording `Commencer la revendication` (crée un draft ✅ request semantics( | 📌 ⚠️/⚠️ | Master l.4903–4907; HTML l.325; `TrunkAppV13.tsx` l.964–965+1248–1251 |

**Réconciliation G06 → 2026-09-07** : les ABSENT du G06 (BULK, COMPARE( sont **livrés** (T-13c; sheets `bulk`/`compare` réelles: `TrunkAppV13.tsx` l.842/903(; fallback carte livré (T-13d(; coquille desktop livrée (T-13e/f(.  Dettes G06 restantesintactes: chips démo SIM, fraîcheur visuelle du flux single-facility (le bulk/compare l'ont(, aria-modal desktop, facilité mobile — plus les 10 lignes du présent audit.

---

## 4. Décisions fondateur requises

| # | Question | Options | Mini-slice ou dette | Impact Gate  ​6 |
|---|---|---|---|---|
| D-1 | **Seller map-first** (annexe A/K, Build now( | (a( construire le shell map-first seller (‑‑ V-7a(; (b( endetter explicitement (dérogation à la scope table(; (c( accepter le tiroir droit comme « panneau latéral » (annexe A( | V-7a ou dette-trigger | bloque clôture honnête si (b/sans amendement |
| D-2 | **QR transactionnel seller + auto-génération à l'intention** (annexe B/C, Build now( | (a( mini-slice: `createPurchaseIntent` émet le QR dans la même création (backend+UI( + scanner caméra prêt‑à‑scanner avec fallback `Saisir le code` (‑‑ V-7b(; (b( endetter avec issueQr existant | V-7b ou dette-trigger | bloque clôture honnête si (b( |
| D-3 | **Onboarding d'accès + reprise auto** (annexe G + HTML ONBOARD, Build now( | (a( gating minimal: intention réelle → identité minimale + soft paywall + **reprise automatique** (‑‑ V-7c(; (b( accepter l'auth simple actuelle (décision explicite( | V-7c ou dette-trigger | bloque clôture honnête si (b( |
| D-4 | **Palette pins** (violation palette verrouillée( | fix immédiat: pins MapLibre → palette verrouillée + états §0.8.3 (‑‑ V-7d( | V-7d (mini-fix( | ne bloque pas (correctif( |
| D-5 | **Items secondaires** — cards product‑first + CATALOG_READY (Build now(, wallet buckets UI, data company admin, unclaimed wording, 4 étapes AVAILABILITY, retrait/livraison+note( | (a( mini-slices successifs (‑‑ V-7e/f(; (b( dette **explicitement triggerée** | V-7e/f ou dette-trigger | clôture possible avec dettes explicites |

**Prochaine action minimale:** fondateur répond D-1…D-5 → Nature Way exécute la combinaison choisie en tranches courtes (chacune: tsc+tests+build+preuve( → Founder HQ réconcilie plan/board → clôture Gate  ​6 « Go with limits » avec dettes **listées et triggerées** == honnête.  En l'absence de réponse, **Gate 6 reste `watch`**; Species reste `closed` pour l'album surface 1:1, mais le delta master↔maquette est enregistré ici comme dette ouverte arbitrée.



##  ​5. Retour handoff ( → Founder HQ(.



| Champ | Valeur |
|---|---|
| Gate | Species (G-02a revisité( — delta master↔maquette — `review_founder`; Gate  ​6 Canopy/launch-readiness — `watch` en attente d'arbitrage |
| Preuve | Audit ci-dessus (master§:ligne × maquette × code:ligne(; état code `8e6351c`, 306/306 tests, tsc clean, build OK (registres antérieurs(; **aucun code modifié par cet audit**( |
| Résidu | D-1…D-5 non arbitrés; spot-check humain 4 largeurs fondateur (Gate  ​5 conditional(; preuve caméra/GPS réelle (« partial » per §0.8.4 Evidence boundary( |
| Owner / prochaine action | Fondateur — D-1…D-5; puis Nature Way V-7a–f; Founder HQ réconcilie plan/board |
| Révision | `review_founder` — aucun code modifié pendant cette passe; branche poussée avec les artefacts docs seulement (règle « push sans signal »( |