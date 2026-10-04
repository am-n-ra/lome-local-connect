# HO-OMNI-27 — TF-5 implémentation (start-of-slice)

> **Structural path:** product > moderation (TF-5) > report flow + acquisition objective
> **Phase:** Trunk (contrat écrit HO-OMNI-26, décisions DEC-V2-36 rendues 2026-10-04)
> **Plan local :** `NW-PROD-OMNI-TRUNK-01` (ligne TF-5, réconcilié — pas de plan concurrent)

## Slice

Un acheteur signale une offre en 3 taps depuis la fiche facilité ; l'équipe voit le
signalement en file, l'opérateur constate, reviewer/admin tranche ; depuis la
demande du marché, l'équipe crée de vrais objectifs d'acquisition suivis.

## Dependencies

- Maquette `signal` / `op-queue` / `admin-signal` (lus HO-OMNI-26) ; TF-2 `listDemandSignals` (construit `9ee67d7`)
- Migration `065` (MCP apply requis AVANT push — le code l'utilise)
- Auth existante (D-05) ; `v2_audit_events` (pattern sœurs) ; rôles reviewer/admin/operator (pattern files)

## Non-goals

Sanction auto, score vendeur public, contestation vendeur, modération d'avis,
notification vendeur avant constat (D-SIG-5), conversion devise (D-LOC-8).

## Definition of done

- `065_v2_offer_reports_acquisition.sql` appliquée canonique (MCP) + registre
- Repo + HTTP + client + UI (sheet `signal`, file équipe, objectifs) + tests falsifiés
- Suite + tsc + gardes verts, bundles régénérés, push + T-07d, preuve MCP round-trip

## Décisions liées

DEC-V2-36 (D-SIG-1…5). S-32 : flag séparé, jamais d'effet auto (spec §5).
