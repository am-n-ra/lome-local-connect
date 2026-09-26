# Registre de preuves — Omni V2

> **ID :** `PROOF-OMNI-V2-2026-09-25` · **As of :** 2026-09-25 · **Porte :** `SPECIES_CLOSED_ROOT_OPEN`
> **Autorité :** `/nature-way` · **Branche :** `omni-v2-rebuild`

**Pourquoi ce document existe.** Le dépôt porte **14 scripts `prove-*`** et **aucun registre** disant
**quelle preuve couvre quelle décision**, ni sa **classe**. Résultat mesuré : les preuves sont
**refaites**. C'est la cause directe du rond-point — pas un manque de travail, un manque de **carte
du travail**.

**Classe de preuve** (vocabulaire Nature Way) :
`observed` (vu, non rejoué) · `reproduced` (rejoué par un script) · `bounded` (fixture délimitée) ·
`external` (dépend d'un tiers) · `manual` (humain requis) · `unproven` (non prouvé).

**Règle** : une preuve `bounded` **ne devient jamais** une affirmation de production. Une capture
d'écran **n'est pas** une preuve d'autorisation serveur.

---

## 1. Preuves de socle (Root)

| # | Preuve | Script | Classe | Base de données | Décision couverte |
|---|---|---|---|---|---|
| `PF-01` | Cycle transactionnel complet : intention → QR → scan → paiement → mise en œuvre → réception → notation → `closed` | `prove-v2-transaction-lifecycle.mjs` | **reproduced** | **branche jetable** | machine à 10 états · `D-TXN-1…10` |
| `PF-02` | Réservation de stock : réserve au verrou, libère à l'expiration, décrémente à la clôture, anti-survente | `prove-v2-stock-reservation.mjs` | **reproduced** | **branche jetable** | `D-TXN-7` (FF-8) |
| `PF-03` | Boucle intégrée offre → dispo → intention → QR → paiement → fulfillment → notation → `closed` | `prove-v2-integrated.mjs` | **reproduced** | prod-connectée | T-08 |
| `PF-04` | Routage réel : Mapbox/OSRM via proxy serveur, 400 sans coordonnées, `OUT_OF_ZONE`, `PROVIDER_NOT_CONFIGURED` | `prove-*routing*` (voir `omni-route-directions-contract`) | **external** | prod | `RT-D1` (Mapbox) · `SP-9`/`S-15` |
| `PF-05` | Glyphes de carte : « Noto Sans Bold » rerouté, 5 requêtes 200, 0 erreur CORS | `proof-map-glyphs.mjs` | **external** | prod | rendu carte |

**Preuves de socle non rejouables sans humain** :

| # | Preuve | Classe | Pourquoi |
|---|---|---|---|
| `PF-06` | Entité propriétaire de l'offre (`S-25`) : 2ᵉ lieu d'une même entité sans entitlement propre → ancienne porte refuse, nouvelle accorde | **reproduced** (A/B sur Postgres) | prouvée au commit `6b88907` |
| `PF-07` | Chemins **Pro** et **`individu`** en données réelles | **unproven** | **0** entité `commercial_plan <> 'free'` · **0** entité `individu` → **jamais exercés** |
| `PF-08` | Caractéristiques d'offre écrites à la création | **partiel** — **code livré**, **usage non exercé** | *Corrigé 2026-09-26 :* le chemin d'écriture **existe** (`createSellerProductDraft` reçoit les 5 caractéristiques, `SellerV13.tsx:173` ; relecture `trunk-repository.ts:505-508`) — livré au commit `bfc3b7c`, **après** la rédaction de cette ligne. Ce qui reste **unproven** est l'**usage** : `condition_kind`/`handover_kind`/`price_kind`/`uniqueness_kind` = **0/16** (13/16 `position_kind` viennent d'un backfill) → **le formulaire n'a jamais servi**. Le filtrage en recherche est **endetté par conception** (maquette : `chip('État / condition', false, true)`). |
| `PF-09` | **Découverte à deux niveaux** (`S-11`) : entité **et** offre sur un même corpus ; page publique d'entité ; offre ↔ entité en un tap | `entity-search.test.ts` (3 invariants falsifiés) + navigateur prod | **observed** | prod (`27a1661`) | `E-2` contact avant intention · `E-5` filtre au mauvais niveau · `D-01` `certified` interne. Registre : `omni-root-v2-two-level-search-evidence-2026-09-26.md` |

---

## 2. Preuves de tranches V1 (historique, mais **encore valides** comme couverture)

| # | Preuve | Script | Classe | Couvre |
|---|---|---|---|---|
| `PF-10` | Cycle V1 navigateur, 4 largeurs — **80/80** | `prove-v1-cycle-browser.mjs` | **reproduced** | PRE-1 |
| `PF-11` | Admin : console, état opérationnel, audit, compteur — 9/9 | `prove-v2-admin.mjs` | **manual** (session requise) | T-07a |
| `PF-12` | Seller : catalogue, garde 409 non-Pro, file, wallet — 8/8 | `prove-v2-seller.mjs` | **manual** (session requise) | T-07b |
| `PF-13` | Buyer : saved-searches, dispo — 8/8 | `prove-v2-buyer.mjs` | **manual** (session requise) | T-07c |
| `PF-14` | Campagnes sponsorisées — 7/7 | `prove-nw13j-campaigns.mjs` | **manual** (session réelle) | NW-13j |
| `PF-15` | Contraintes D-CON : seuils éditables, fiche lisant la contrainte, distance unique — T1–T6 | `prove-constraints-dcon.mjs` | **reproduced** | `D-CON-1…5` · `D-LOC-1…5` |

---

## 3. Preuves de conformité (garde automatisés)

Ce sont les preuves **les plus fortes** du dépôt : elles **échouent** quand la conformité casse.

| # | Garde | Commande | Ce qu'il prouve | Falsifié ? |
|---|---|---|---|---|
| `PF-20` | Conformité maquette ↔ Seed | `npm run check:species-t12` | **27/27 conforme · 26 rendues / 32 · `NON MESURÉ = 0`** | ✅ `S-17` et `S-28` falsifiés (exit 1) |
| `PF-21` | Maquette V2 | `npm run check:maquette` | 74 écrans, 5 niveaux, registre honnête, 0 doublon | — |
| `PF-22` | Cohérence Seed ↔ code | `npm run check:coherence` | 0 incohérence ouverte, migrations réelles | ✅ **4 falsifications** attrapées |
| `PF-23` | État de référence | `npm run check:state` | tous les artefacts d'état s'accordent | ✅ verdict périmé → exit 1 |
| `PF-24` | Frontière client | `npm run check:boundary` | aucun secret serveur dans le bundle client | — |
| `PF-25` | Suite de tests | `npm test` | **600/600** | — |

---

## 4. Ce qui n'est **pas** prouvé (honnêteté)

| Objet | Classe | Raison |
|---|---|---|
| Alignement app ↔ maquette (seuils réglables, devise par localisation) | **unproven** | **non implémenté** — l'app a des chips figés |
| `public.markets` / devise par localisation en base | **unproven** | table **absente** du canonique (`markets_table = 0`) |
| Filtre budget serveur multi-devise | **unproven** | bug identifié : compare sans devise ni conversion |
| 9 produits `USD` tarifés en francs | **unproven** | dette de données mesurée |
| 3 offres sans entité | **unproven** | mesuré |
| `T-07d` prod === local | **unproven** | prod sert `index-BUMFRcnb.js` ≠ local |
| Qualité visuelle après alignement | **unproven** | exige preuve navigateur 4 largeurs |

---

## 5. Non mesuré

- **Latence / coût** du fournisseur d'itinéraire retenu : non mesurés.
- **`SCOUT-01`/`SCOUT-02`** : ouverts, non couverts par une preuve.
- Ce registre **ne rejoue rien** : il **recense**. Chaque ligne pointe le script qui, lui, rejoue.

---

## 6. Règle de tenue

**Toute nouvelle preuve s'ajoute ici dans le même commit que le script.** Une preuve qui n'est pas
au registre est une preuve qui sera **refaite** — et refaire une preuve coûte plus cher que
l'enregistrer.
