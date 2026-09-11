# Skill Handoff and Activation Receipt

> **Request ID:** `HO-OMNI-12`
> **Founder HQ timestamp:** 2026-09-11 (UTC)
> **Primary authority:** Nature Way
> **Exact invocation:** `/nature-way`
> **Activation status:** `user invocation required` (skill present at `.agents/skills/nature-way/SKILL.md`; Founder HQ cannot invoke it dynamically in this environment — user must run `/nature-way` to take the gate)

## Handoff input

| Field | Value |
|---|---|
| User objective | Fondateur 2026-09-10/11: « /nature-way-founder-hq continu » — poursuite de orchestration. Dernier retour spécialiste = **NW-14** ( audit flows+recherche, docs-only, commit `aab6966` poussé(: 4 plaintes fondateur traduites en constats code-vérifiés + priorisation **P0 recherche** ( coeur(, **P1 entrée vendeur** ( NW-13c…j(, **P2 gouvernance admin/operator/team** — validation de l'ordre demandée au fondateur avant tout code ( NW-14 §4(. |
| Current milestone and gate | M-01 pilot-ready V1. Gates 1–5 `closed`; **Gate 6 Canopy/launch-readiness — `ready`** — V-7 COMPLET ( T1–T9 `done`(, V-8 debut ( COH(, NW-12 done, NW-13a/b spec verrouillée fondateur ( D-E…D-K résolues(, NW-14 audit brouillon en attente validation ordre P0→P1→P2. Seule décision restante pour clôture Gate  ​6 = verdict fondateur「 Go with limits 」 + validation des nouvelles tranches. |
| Structural path / venture stage | Canopy/launch-readiness — la recherche est le coeur ( P0: redresser recherche(; branche `omni-v2-rebuild`. |
| Relevant artifacts and proof | NW-14 `docs/nature-way/omni-nw-14-audit-flows-recherche-2026-09-10.md`; NW-13b `docs/nature-way/omni-nw-13b-plans-free-pro-spec-2026-09-10.md`; NW-13 `docs/nature-way/omni-nw-13-seller-entry-respec-2026-09-10.md`; NW-12 `docs/nature-way/omni-nw-12-search-intent-and-team-2026-09-10.md`; plan/board `docs/founder-hq/founder-hq-master-plan.md` + `founder-hq-board.md`; maquette unifiée `docs/maquette/omni-species-maquette.html`; branche `omni-v2-rebuild` @ `aab6966`. |
| Dependencies and constraints | Capacité: une porte, un spécialiste, tranches courtes ( M-01(; Branch rule: seulement `omni-v2-rebuild`, jamais merger vers `main`; push SANS attendre après chaque étape significative(; périmètre M-01, ne pas élargir(; **avant tout code P0/P1/P2: validation fondateur de l'ordre** ( NW-14 §4(; git push: token opérationnel désormais (`aab6966` poussé(. |
| Secondary route | None. |
| Expected specialist return | Slice P0-A ( câbler `createFallbackMap` orphelin(, P0-B ( cinématique recherche complète(, P0-C ( chips de contraintes réels( puis P1 ( NW-13c…j( pour P2 ( gouvernance team/rôles( — chacun avec gate, evidence ( tsc/tests/build/prod hash===local（, residual gap, owner, next action; registre mis à jour; clôture honnête Gate  ​6「 Go with limits 」 puis Venture Lifecycle（ Gate  ​7（ en watch. |

## Specialist resource receipt

| Resource status | Exact path or explanation |
|---|---|
| Loaded | Founder HQ orchestration only: `references/ecosystem-orchestration-protocol.md`, `references/founder-hq-board.md`, `references/intra-skill-execution-controller.md`, `references/ecosystem-activation-manifest.md`; `templates/skill-handoff-receipt.md` → ce receipt; `templates/intra-skill-plan.md` ( auditée — pas de nouveau plan local requis pour une passe de réconciliation HQ(. |
| Template instantiated | `templates/skill-handoff-receipt.md` → ce receipt ( HO-OMNI-12(. |
| Not loaded / reason | `references/portability-protocol.md` + `templates/portable-starter/*` — pas de migration/transfert/change d'outil actif ( trigger non applicable(; `templates/founder-hq-master-plan.md` — plan HQ existing(; skills spécialistes ( `nature-way/...`( — seront chargés par `/nature-way` à son activation. |

## Dispatch result

`/nature-way` prend le contrôle des **tranches P0 recherche ( coeur Omni(** à valider d'abord par le fondateur ( ordre P0→P1→P2, NW-14 §4(, et devra rendre: gate, evidence, residual gap, owner, next action, Resource Receipt, et mises à jour registre/Master Plan pour clôture honnête Gate  ​6「 Go with limits 」 puis Venture Lifecycle（ Gate  ​7（ en watch.