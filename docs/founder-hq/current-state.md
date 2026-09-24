# Omni — ÉTAT DE RÉFÉRENCE (current state of record)

> **Single source of truth for "where are we now".** Every other artifact
> (board, master plan, AGENTS.md, specialist plan) must agree with this file.
> If they diverge, run `npm run check:state` — it fails on divergence.
>
> **Read this file first, before any gate claim.** 2026-09-23 incident: the
> assistant asserted the gate from memory twice and was wrong twice. The state
> must be read, never inferred.

---

## Gate (current)

| Field | Value |
|---|---|
| **Gate** | `SEED_CLOSED_SPECIES_REOPENED` |
| **As of** | 2026-09-23 |
| **Decided by** | Fondateur |
| **Seed** | **CLOS `founder-confirmed`** — `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (34 décisions `S-01…S-34`) |
| **Species** | **RÉOUVERTE** — maquette `docs/maquette/omni-species-v2-interactive.html` (72 écrans) |
| **Next** | **validation fondateur de `SP-1…SP-6`** (les surfaces existent, leur ensemble n'est pas accepté) → puis clôture Species V2 → ensuite seulement Root |
| **Downstream gates** | **Aucune active** — Root/Trunk/Branches/Canopy interdits pendant cette porte |

### ⚠️ Correction d'exécution — 2026-09-23 (incident, à ne pas réapprendre)

**Deux étapes ont été sautées dans la même session, et le fondateur l'a relevé.**

| # | Ce qui a été fait à tort | La règle violée |
|---|---|---|
| 1 | « **Species V2 est close** » a été affirmé après la livraison de `SP-1…SP-6` | Le plan (`T-13`) dit : **`SP-1…SP-6` bloqués sur validation fondateur**. Livrer ≠ faire accepter. La clôture est une **décision fondateur**, pas une conséquence de la livraison. |
| 2 | Un **audit de porte Root** (`R-1`/`R-2`/`R-3`) a été produit et poussé | La board dit : **« Un seul gate actif. Ne pas empiler Root/Trunk/Canopy au-dessus d'une Species non conforme. »** Species n'est pas conforme tant que `SP-1…SP-6` ne sont pas validés. |

**Statut de l'audit Root poussé (`omni-root-gate-v2-assessment-2026-09-23.md`, commit `6a9b7fc`)** :
**PRÉMATURÉ — parqué, pas une porte.** Les **mesures** faites en base sont réelles et gardées comme *renseignement* ; la **demande de décision Root est retirée** jusqu'à clôture de Species. Le fichier porte désormais une bannière le disant.

**Règle ajoutée :** *livrer une tranche ne clôt pas une porte ; une porte se clôt par une décision fondateur enregistrée. Ne jamais ouvrir une porte aval « pour préparer ».*

### `T-12` — contradiction **résolue par le fondateur** (2026-09-23)

Le fondateur a tranché : **« l'audit est à refaire »**. Le refait est **livré**.

- **Cause du refait :** l'audit mesurait le **source HTML** (grep), pas l'**écran rendu**. Preuve immédiate : il déclarait la caractéristique « Retrait / livraison » **conforme** en citant une chaîne de données (`remise:`) qui **n'apparaissait jamais à l'écran**.
- **Méthode refaite :** rendu navigateur réel (Playwright) ; prédicat sur le **texte visible** ; falsifié.
- **Résultat : 16/16 conforme.** **1 écart réel trouvé et corrigé** — la fiche offre affirmait « **sept** caractéristiques » en n'en montrant que **six** (Retrait/livraison absent, Quantité/Déplétion scindée). Corrigé : sept lignes, sept caractéristiques.
- **Harnais :** `npm run check:species-t12` · **Rapport :** `docs/nature-way/omni-species-v2-conformance-audit-T12-2026-09-23.md`.

**`T-12` = `done`.** Ce qui reste n'est **pas** un travail, c'est **une décision :** `SP-VALIDATION`.

### `T-14` — diagnostic de cohérence Seed V2 ↔ code (2026-09-23)

Le fondateur a signalé **« beaucoup d'incohérence dans ce qu'on veut faire et proposer »**. Diagnostic livré
(`docs/nature-way/omni-seed-vs-code-coherence-register-2026-09-23.md`) : **7 incohérences mesurées** derrière
**une seule racine**.

- **Racine :** `v2_products.facility_id not null references v2_facilities` (`db/migrations/001_v2_roots.sql:82`)
  contredit **S-25** (« il n'y a pas de produit appartenant à une facilité ») et **S-01/S-02** (modèle universel).
  C'est *exactement* la racine que le Seed nomme.
- **Autres :** Pro par **facilité** (code) vs Pro par **entité** (Seed) · plafond **5** (code) vs **20** (Seed) ·
  bulk `ceil(N/100)` (code) vs « 1 besoin = 1 bulk » (Seed) · seuil de confiance **3 uniforme** vs **adapté au volume**.
- **Verdict :** la **maquette suit le Seed ; le socle ne suit pas.** Construire une UI conforme au-dessus d'un
  schéma non conforme **produit de la dette à chaque tranche** — c'est le rond-point perçu.

**Décision requise (fondateur seul) :** **D-C1** reconstruire le socle au modèle Seed (recommandé) ·
**D-C2** adapter le Seed au code (déconseillé) · **D-C3** position d'abord (réduit sans guérir).

## Founder decisions applied

| ID | Decision | Status |
|---|---|---|
| `D-1a` | Fusion maquette V2 + comportements app | appliqué |
| `D-2a` | **L'offre appartient à l'ENTITÉ** (pas au facility) | appliqué |

## Superseded (not current)

| Historical state | Superseded by |
|---|---|
| Gates 1–3 `done` (2026-09-02) | Réouverture Seed/Species 2026-09-23 |
| Gate 6「 Go with limits 」(2026-09-11) | Idem — reste vrai pour la V1, non courant |
| `omni-intent-brief-2026-09-02.md` | `omni-intent-brief-v2-2026-09-23.md` |

## Known open defects (must not be silently closed)

| ID | Severity | Defect |
|---|---|---|
| `COH-V2-18` | **Haute** | L'audit Species V2 a été mesuré contre l'ancien registre MV1, pas le Seed V2 → il ne prouve pas la conformité V2 |
| `SCOUT-01` | Haute | Couverture mondiale de lieux orpheline (`public-discovery`, `osm-coverage`) |
| `SCOUT-02` | Haute | Impasse d'expiration des intentions (`v2_purchase_intents.state` non lu par l'UI) |
| `T-07d` | — | Prod `index-BUMFRcnb.js` ≠ local → **OUVERT** (ne pas pousser) |
| `SP-VALIDATION` | **Haute** | `SP-1…SP-6` livrés mais **non validés par le fondateur** → Species V2 **non close**, et aucune porte aval autorisée |
| `T12-RESOLVED` | — | `T-12` refait par rendu navigateur (16/16) après décision fondateur « l'audit est à refaire ». **Clos.** |

## Rule (added 2026-09-23 — do not relearn)

1. **Lire l'état, ne jamais l'inférer.** Une porte se lit dans cet artefact, pas de mémoire.
2. **Une seule source par sujet.** Si un document contredit celui-ci, corriger le document.
3. **Contrôle automatique.** `npm run check:state` doit passer avant toute affirmation de porte.
4. **Préserver par défaut** : ne jamais clore une porte ni supprimer une couche sans décision explicite.
