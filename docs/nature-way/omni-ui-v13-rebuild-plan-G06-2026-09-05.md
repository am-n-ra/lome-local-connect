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

## Handoff to Founder HQ — ce pass

> **Local status:** `in_progress` ( V-1 actif（
> **Gate decision:** avancer après V-1 proof
> **Closed:** `ui-v13.css` extrait 1:1 ( base scaffold（
> **Open:** V-1..V-5 planifiés（, V-1 actif（
> **Resource Receipt:** controller + plan template instanciés; maquette/spec/register/api.ts inspectés
> **Residual gap:** backend non touché; la coquille n'existe pas encore; suppression non exécutée
> **Next smallest action:** construire V-1 shell minimal réel ( stage+rolepill+navpill+countmark+carte+search dock（ appelant `listPublicFacilities`（, puis preuve browser
> **Re-plan trigger:** retour fondateur visuel, décision renversée, slice proof échouée