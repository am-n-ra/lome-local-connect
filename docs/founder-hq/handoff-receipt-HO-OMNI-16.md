# Handoff HO-OMNI-16 — Ré-audit cycle V1 + correction itinéraire (2026-09-14)

## État au handoff
- HEAD `8c2133a` poussé sur `omni-v2-rebuild`; prod sert `index-B7nhYbvV.js` === build local (T-07d ✅).
- Working tree était propre avant ce handoff (commit AGENTS.md à faire — voir §Suites immédiates).

## Ce qui a été fait
1. **Correction fondateur** : itinéraire vendeur **dispo de base sur chaque fiche facilité** (bouton « Itinéraire vers ce vendeur », carte Localisation, sans intention d'achat) + **itinéraire dans le flux transactionnel** (BuyerFlowV13, prop `onRoute`, bloc « Vendeur · Itinéraire » dans le stage `txn`). Contact reste après intention.
   - Propagation lat/lng via `setFlowFacility` depuis résultats / comparateur / fiche facilité.
2. **Audit complet cycle V1** : `docs/nature-way/omni-v1-cycle-audit-2026-09-14.md`.
   - Verdict : **16/23 FULL, 4 PARTIAL, 2 BLOCKED, 1 corrigée**.
   - **Racine bloquante : contact vendeur absent du modèle de données** (`v2_facilities` sans phone/whatsapp) → RAC-1.
   - Plan ordonné (§4) : RAC-1 → COR-0a/9d (fait) → COR-1a → COR-3b → COR-7b → COR-7c → TEC-1 → PRE-1 (preuve navigateur cycle).
   - **Aucune déclaration « V1 terminée » ni passage Gate 7 avant RAC-1 + PRE-1.**

## Preuve
- tsc clean; 57 files / **466 tests pass**; boundary clean; build `index-B7nhYbvV.js`.
- Push `b324d92..8c2133a` OK (remote URL réparée avec `${GITHUB_TOKEN}`).
- Prod : `index-B7nhYbvV.js` + `index-CXK07M8c.css` === dist local.
- Chaînes « Itinéraire vers ce vendeur » / « Itinéraire vers le vendeur » présentes dans le bundle prod.

## Suites immédiates
- Commit AGENTS.md (mise à jour déjà rédigée).
- **Décision fondateur requise** pour RAC-1 : migration contact vendeur (champs `contact_phone`/`contact_whatsapp` sur `v2_facilities`, additive) + exposition API publique/privée + UI (fiche : contact désactivé avant intention, actif après). C'est le seul blocage racine du cycle.
- Ensuite dans l'ordre du plan : COR-1a (recentrage auto initial), COR-3b (onboarding enrichi), COR-7b/7c (produit en avant / panier vendeur), TEC-1, PRE-1.

## Données de contexte utiles
- Courbe d'état transactionnelle serveur : `payment_declared` → `payment_confirmed` gated `current_state='payment_declared'` (trunk-repository.l.2569). Verrouillage non-annulation OK côté serveur ; aucune annulation UI après paiement.
- Contact : `v2_facilities` (001_v2_roots.sql l.39–53) sans champ contact; `claimant_phone` (038) = téléphone demandeur seulement.
- `BuyerProPlansModal.test.ts` = test legacy decommission → pas de dette (ne pas recréer un composant).