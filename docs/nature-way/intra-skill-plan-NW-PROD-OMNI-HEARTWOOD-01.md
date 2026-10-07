# Plan local — Heartwood (NW-PROD-OMNI-HEARTWOOD-01)

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02` · **Local Plan ID:** `NW-PROD-OMNI-HEARTWOOD-01`
> **Porte :** Heartwood OPEN (`TRUNK_CLOSED_HEARTWOOD_OPEN`). **Autorité :** `/nature-way`.
> **As of :** 2026-10-07. **Owner :** Nature Way (relais) · **Décision fondateur :** « Ok on va clore » (clôture Trunk).
> **Objet :** durcir/fermer le tronc — **pas de nouvelles fondations**. Les 5 items mesurés le 2026-10-07.

## Resource Receipt

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/intra-skill-execution-controller.md` |
| Loaded | `docs/founder-hq/current-state.md` (§Verdict Trunk + §Fermeture — items) |
| Template instantiated | `.agents/skills/nature-way-founder-hq/templates/intra-skill-plan.md` (this file) |
| Not loaded / reason | `launch-envelope.md` / `risk-and-escalation-matrix.md` — à charger **avant S2 (argent réel)** : S2 touche le coût/paiement |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| S1 | **QR réel** | le QR acheteur est **scannable** par la caméra vendeur ; le panneau QR public est rendu | `qrcode.react` câblé + garde falsifié + preuve navigateur | **`verified`** — `OmniQr` partagé (BuyerFlow+Room), preuve décodage `jsqr` 3/3, garde falsifié, 866/866 | fait contredit |
| S2 | **Argent réel E2E** | recharge → Pro seller → Pro buyer → packs bulk → bonus **exercés en prod**, preuve | script bout-en-bout + preuve prod | `blocked` (session fondateur) | S1 fait |
| S4 | **Ambulants découvrables** | les offres `mobile` sont **découvrables** (filtre/exposition) | `facilityType` exposé + filtre + preuve | **`verified`** — `facilityType`/`rayonKm` exposés (carte+fiche), chip `Transport (mobile)` activée, puce ambre, gardes falsifiés, SQL réel 33/33. **Données 0 `mobile`** (honnête : rien déclaré) | portée |
| S3 | **Téléphone gratuit (S-16)** | un chemin téléphone (WhatsApp initié utilisateur, ~0 coût) ; SMS payant exclu | décision fournisseur + code + preuve | **`verified`** (`S3-a`, `4c2d69c`+`00c954f`) — e-mail-first + **numéro Togo DÉCLARÉ** (jamais « vérifié ») + `wa.me` gratuit, à l'inscription et dans le Compte ; migration `069` (canonique, `e3c60c62…`) ; preuve Postgres réel **6/6** ; bug réel corrigé (snapshot) ; 2 gardes falsifiés | fait contredit |
| S5 | **OSM Togo** | — | **décision close** (pas un écart) | `done` (par décision) | fait nouveau |

> **Re-séquencement 2026-10-07 :** `S3` (téléphone) est **remonté après `S2`** car il exige une
> **décision fondateur** (fournisseur SMS/WhatsApp, coût, possiblement une fondation neuve —
> interdite en Heartwood). `S4` (exposition d'une donnée déjà écrite) n'exige **aucune** décision
> et **aucune** fondation → il passe devant. « Le terrain vient en dernier », mais **une slice
> bloquée sur une décision humaine ne bloque pas les slices libres.**

## Dependency-aware task tree

| ID | Parent | Phase | Objective | Depends on | Status | Acceptance / proof | Re-plan trigger |
|---|---|---|---|---|---|---|---|
| S1-1 | — | Root | Mesurer le QR actuel : `qrStyle()` = blocs `█/▓`, pas un QR | mesure | `done` | `BuyerFlowV13.tsx:43` | fait contredit |
| S1-2 | S1-1 | Root | Câbler `qrcode.react` (`QRCodeSVG`) sur le payload réel `txn:token`, les DEUX surfaces | S1-1 | `verified` | `OmniQr.tsx` + BuyerFlow + Room ; 866/866 | lib manquante |
| S1-3 | S1-2 | Trunk (S1b) | Surface vendeur : « afficher mon QR public » (S-21) | S1-2 | `verified` | `CompanyV13` QR par entité + garde falsifié + preuve décodage réelle | portée |
| S1-4 | S1-2 | Heartwood | Garde falsifié + preuve de décodage réelle | S1-2 | `verified` | `omni-qr.test.tsx` (5, falsifié) + `prove-heartwood-qr.mjs` 3/3 | faux négatif |
| S2-1 | — | Heartwood | Script E2E argent réel (FedaPay sandbox/contrat) | S1 | `candidate` | **fondateur 2026-10-07 : FedaPay déjà prouvé par le passé** — à re-classer, pas un manque | credentials |
| S3-1 | — | Seed/Root | Extraire les exigences S-16 → contrat téléphone gratuit | décision fondateur | `verified` | contrat écrit : `omni-heartwood-s3-phone-free-contract-2026-10-07.md` (option A/B/C) | fait contredit |
| S3-0 | S3-1 | Heartwood | Méthode téléphone gratuit tranchée | S3-1 | `done` | **fondateur 2026-10-07 : « a et b » = A + B** — e-mail-first (A, en place) **+** numéro déclaré & `wa.me` gratuit (B) ; C (SMS/WA API payant) **écarté**. Implémentation `S3-a` **`verified`** (`4c2d69c`+`00c954f`) | décision rendue |
| S3-a | S3-0 | Heartwood | Numéro Togo déclaré + `wa.me` (inscription + Compte) | S3-0 | `verified` | migration `069` (canonique `e3c60c62…`) ; preuve Postgres réel **6/6** ; bug réel (snapshot) corrigé ; 2 gardes falsifiés ; prod === local | fait contredit |
| S4-1 | — | Root | Exposer `facilityType` sur `PublicFacility` + filtre ambulants | S3→débloqué par décision (S4 libre) | `verified` | SQL + UI + gardes falsifiés | portée |
| MAP-1 | — | Heartwood | Les pins de la carte : cap `limit 250` tronque 13 744 lieux | **décision fondateur `D-MAP-1`** (cap) | `verified` | option 1 (fondateur « go on ») — cap par fenêtre 2 000 ; garde `public-facilities-cap` falsifié ; prod `9c5237c` | fait contredit |
| MAP-2 | — | Heartwood | Pins carte : 2 régressions de câblage (recherche morte au globe + carte branchée sur les résultats) | MAP-1 | `verified` | correctifs + gardes `search-reveal-lock`/`map-pin-source-lock` falsifiés ; prod `e08b57e` | fait contredit |
| MAP-3 | — | Heartwood | Recentrage : le pin sélectionné doit rester VISIBLE au-dessus du sheet (clic résultat / pin / défilement grille) | MAP-2 | `verified` | helper unique `measureSheetBottomPadding` (3 chemins) ; garde `facility-recenter-lock` falsifié 2× ; A/B prod vs local (OLD pin y=−74, FIXED y=190) ; prod `c4e4d2b`+ | fait contredit |

## Non-goals (porte Heartwood)

- **Aucune nouvelle fondation** (Seed/Species/Root clos). Heartwood = durcissement/fermeture.
- **Pas de transport-logistique V2** (S-08/S-12) — S4 porte seulement sur la **découvrabilité** des vendeurs `mobile` (V1).
- **Pas de couverture mondiale OSM** — borné Togo (décision close).
- **Terrain (`TT-1`/`TT-2`/Gate 7) reste EN DERNIER** (décision fondateur 2026-10-07), jamais une slice.

## S1b — mesure de périmètre (2026-10-07, avant tout code)

**Ce que le Seed dit (S-21) :** « un client **déjà en boutique** scanne le **QR public de l'entité** →
la transaction passe par Omni → **remise appliquée**. » Le cœur est **la remise au scan**, pas le rendu.

**Ce que la maquette acceptée porte :** l'acheteur a une sheet **`scan-entity`** (caméra « Autoriser
et démarrer », bouton « Saisir le code ») qui mène à **`entity-from-qr`** (« Bienvenue… Vos avantages
Omni ici : −15 % »). **Aucune surface vendeur** « afficher/imprimer mon QR public » dans la maquette —
le QR public est supposé *affiché en boutique*, sans écran de génération.

**Ce que l'app porte :** **rien** (`scan-entity` : 0 occurrence dans `src/trunk`). Le QR public d'entité
est donc une **capacité neuve** (émission + résolution + entrée dans le flux de remise), pas une
surface cassée.

**Verdict :** S1b **n'est pas une micro-slice**. Deux chemins possibles :
- **(a)** périmètre complet (émission côté vendeur + scan acheteur + application remise) — le plus
  fidèle au Seed, mais **touche l'argent/remise** → à cadrer, pas à improviser en Heartwood ;
- **(b)** sous-slice « scanner un QR d'entité → ouvrir la page de l'entité » (sans remise encore) —
  surface acheteur seule, vérifiable, réversible.
**Décision fondateur requise sur le périmètre** (a/b) avant implémentation. En attendant, `S4` est
la slice libre qui a été livrée.

## S1b — LIVRÉ (décision fondateur : option « a », 2026-10-07)

Le fondateur a choisi **(a) — périmètre complet**, en notant que **FedaPay était déjà prouvé** et que
la **méthode téléphone est gratuite** (donc ni l'un ni l'autre n'est un manque). Livré sans nouvelle
fondation (l'avantage Omni S-19 existe) :

- **`entity-qr.ts`** — payload/décodeur partagés (rendu vendeur = scanner acheteur).
- **`entity-benefits.ts`** — « Vos avantages Omni ici » lit la **remise réelle**, **se tait** sinon.
- **`PublicQrScannerSheet`** — `target: 'facility' | 'entity'` ; dock/menu acheteur `Scanner une entité`.
- **`CompanyV13`** — QR public **par entité** (« affichez-le en boutique »).
- **`TrunkAppV13`** — page d'entité porte le bloc avantage ; menu « Scanner un QR ».

**Preuve :** `prove-heartwood-s1b` 6/6 (décodage réel `jsqr` → `parseEntityIdFromQr` → `getPublicEntity`
canonique → « Omni Demo Seller Hub », 5 offres, **−10 %** réel) ; 3 gardes falsifiés ; **881/881** tests,
7 gardes vertes. Contrat + PER : `-s1b-public-entity-qr-contract-` / `-s1b-evidence-` (2026-10-07).

## S3-a — LIVRÉ (décision fondateur : S3-0 = A + B, 2026-10-07)

Numéro Togo **DÉCLARÉ** (jamais « vérifié ») + deep link `wa.me` gratuit, **à l'inscription** (S-16,
téléphone-first) **et** dans la sheet Compte. Migration `069_v2_declared_phone.sql` appliquée à la
canonique (`e3c60c62…`). Preuve Postgres réel **6/6** (branche jetable supprimée). **Bug réel corrigé** :
l'écriture se faisait en deux sous-instructions dans la même requête — Postgres ne voit pas la ligne
qu'une sous-instruction vient d'écrire (snapshot) → `null` ; corrigé en un seul `insert … on conflict
do update … returning`. 2 gardes falsifiés (honnêteté + écriture mono-instruction). Dossier :
`docs/nature-way/omni-heartwood-s3a-declared-phone-evidence-2026-10-07.md`.

## Dossier de clôture Heartwood (2026-10-07)

Les **5 items de fermeture** sont traités (S1/S1b, S3-a, S4 livrés ; S2 re-classé ; S5 clos). Le paquet
de preuves soumis au fondateur est `docs/founder-hq/heartwood-close-dossier-2026-10-07.md`.
**La clôture reste une décision fondateur** — ce plan ne l'auto-prononce pas.

## MAP-RECENTER — LIVRÉ (régression terrain corrigée, 2026-10-07)

**Signal fondateur :** cliquer une facilité dans les résultats (et le défilement de la grille) doit
**recentrer la carte sur le pin** et le rendre **VISIBLE**. « On dirait que ce n'est plus en place. »

**Mesuré (prod, 390px) :** le recentrage *fonctionnait* (zoom 3 → 14.2) mais le pin restait au **milieu
d'écran non-paddé** (y≈422) alors que le sheet commence à **y≈304** → **caché derrière le sheet**.

**Cause racine (2 défauts) :**
1. `syncCameraPadding` n'est resynchronisé que par un `MutationObserver` en `childList` — or changer de
   sheet ne fait que basculer l'attribut **`data-sheet`** de la scène. Le padding restait donc **périmé
   (0)** au moment du recentrage.
2. L'ancien décalage `unproject(y - (pad + 64)/2)` déplaçait le pin **vers le bas** (donc derrière le
   sheet) — **mauvais signe** — et ne s'exécutait pas quand `pad = 0` (repli sur un centrage direct).

**Correctif :** mesurer la **hauteur réelle du sheet** depuis le DOM, poser le padding bas via
`bottomPaddingFor`, puis **centrer sur le pin**. MapLibre centre la caméra sur la vue **paddée**
(`centerPoint.y = (height − bottom)/2`, vérifié dans la source maplibre-gl), donc le pin atterrit au
milieu de la bande visible (0…sheetTop). Mobile uniquement (desktop = rail gauche). Si un vol caméra est
en cours (révélation de recherche), le cadrage est **rejoué au `moveend`**.

**Preuve A/B décisive** (`scripts/probe-facility-recenter-ab.mjs` + `scripts/fixed-bundle-server.mjs`,
même instrumentation, même padding 464) : **OLD** → pin à y=**−74** (hors écran haut) ; **FIXED** →
pin à y=**190** (milieu de la bande 0…304) → **visible**. 916/916 tests (+6), tsc 0, gardes vertes.
Garde de source `src/trunk/facility-recenter-lock.test.ts` (falsifié : réintroduire le décalage fautif
→ 1 échec). Dossier : `docs/nature-way/omni-heartwood-map-recenter-evidence-2026-10-07.md`.

