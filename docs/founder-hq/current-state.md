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
| **Next** | `T-11` réétalonner le plan sur `S-01…S-34` → `T-12` audit de **conformité** Species V2 |
| **Downstream gates** | **Aucune active** — Root/Trunk/Branches/Canopy interdits pendant cette porte |

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

## Rule (added 2026-09-23 — do not relearn)

1. **Lire l'état, ne jamais l'inférer.** Une porte se lit dans cet artefact, pas de mémoire.
2. **Une seule source par sujet.** Si un document contredit celui-ci, corriger le document.
3. **Contrôle automatique.** `npm run check:state` doit passer avant toute affirmation de porte.
4. **Préserver par défaut** : ne jamais clore une porte ni supprimer une couche sans décision explicite.
