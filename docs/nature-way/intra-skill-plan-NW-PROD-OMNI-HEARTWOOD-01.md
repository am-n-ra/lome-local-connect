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
| S3 | **Téléphone gratuit (S-16)** | un chemin téléphone (WhatsApp initié utilisateur, ~0 coût) ; SMS payant exclu | décision UI + code + preuve | `planned` | S2 fait |
| S4 | **Ambulants découvrables** | les offres `mobile` sont **découvrables** (filtre/exposition) | `facilityType` exposé + filtre + preuve | `planned` | S3 fait ou ordre fondateur |
| S5 | **OSM Togo** | — | **décision close** (pas un écart) | `done` (par décision) | fait nouveau |

## Dependency-aware task tree

| ID | Parent | Phase | Objective | Depends on | Status | Acceptance / proof | Re-plan trigger |
|---|---|---|---|---|---|---|---|
| S1-1 | — | Root | Mesurer le QR actuel : `qrStyle()` = blocs `█/▓`, pas un QR | mesure | `done` | `BuyerFlowV13.tsx:43` | fait contredit |
| S1-2 | S1-1 | Root | Câbler `qrcode.react` (`QRCodeSVG`) sur le payload réel `txn:token`, les DEUX surfaces | S1-1 | `verified` | `OmniQr.tsx` + BuyerFlow + Room ; 866/866 | lib manquante |
| S1-3 | S1-2 | Trunk (S1b) | Surface vendeur : « afficher mon QR public » (S-21) | S1-2 | `planned` | capacité NEUVE, hors S1 | portée |
| S1-4 | S1-2 | Heartwood | Garde falsifié + preuve de décodage réelle | S1-2 | `verified` | `omni-qr.test.tsx` (5, falsifié) + `prove-heartwood-qr.mjs` 3/3 | faux négatif |
| S2-1 | — | Heartwood | Script E2E argent réel (FedaPay sandbox/contrat) | S1 | `blocked` | session fondateur requise | credentials |
| S3-1 | — | Seed/Root | Extraire les exigences S-16 → contrat téléphone gratuit | S2 | `todo` | contrat | décision change |
| S4-1 | — | Root | Exposer `facilityType` sur `PublicFacility` + filtre ambulants | S3 | `todo` | SQL + UI | portée |

## Non-goals (porte Heartwood)

- **Aucune nouvelle fondation** (Seed/Species/Root clos). Heartwood = durcissement/fermeture.
- **Pas de transport-logistique V2** (S-08/S-12) — S4 porte seulement sur la **découvrabilité** des vendeurs `mobile` (V1).
- **Pas de couverture mondiale OSM** — borné Togo (décision close).
- **Terrain (`TT-1`/`TT-2`/Gate 7) reste EN DERNIER** (décision fondateur 2026-10-07), jamais une slice.
