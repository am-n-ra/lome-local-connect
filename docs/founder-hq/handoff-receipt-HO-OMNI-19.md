# Handoff receipt — HO-OMNI-19

> **To:** Founder HQ (`HQ-OMNI-2026-09-02`) · **From:** Nature Way (`NW-PROD-OMNI-SEED2-01`)
> **Date:** 2026-09-23 · **Branche:** `omni-v2-rebuild`
> **Nature:** diagnostic de cohérence Seed ↔ maquette ↔ code + audit Species refait. **Aucun code produit modifié.**

## Activation receipt

| Champ | Valeur |
|---|---|
| Skill primaire | `/nature-way` — **activé** via Founder HQ (dispatch conforme) |
| Autorité | Nature Way (produit, données, preuve) |
| Porte | **Species (réouverte)** — Root **parqué** |
| Ressources spécialistes | `.agents/skills/nature-way/references/visual-and-logic-coherence-review.md` chargé ; `technical-lead-production-review.md` **non chargé** (Root pas ouvert) |

## Deux livrables, une cause

**1. `T-12` — audit de conformité Species V2, REFait** (`docs/nature-way/omni-species-v2-conformance-audit-T12-2026-09-23.md`).

L'ancien audit mesurait le **source HTML** ; il validait donc des chaînes **jamais rendues**. Preuve : il déclarait
la caractéristique « Retrait / livraison » (`S-01`) **conforme** en citant `remise:` — absent de l'écran, tandis que
le panneau affirmait « **sept** caractéristiques » en n'en montrant que **six**.
Refait par **rendu navigateur réel** : **16/16 conforme**, écart **corrigé**, audit **falsifié** (3 modes).
Harnais `npm run check:species-t12`.

**2. `T-14` — diagnostic de cohérence Seed V2 ↔ code** (`docs/nature-way/omni-seed-vs-code-coherence-register-2026-09-23.md`).

Le fondateur : *« tout le fond et la logique n'est pas là… beaucoup d'incohérence »*. Mesuré : **7 incohérences,
une seule racine**.

| # | Seed dit | Code fait | Preuve |
|---|---|---|---|
| **C-1/C-2** (racine) | l'offre appartient à l'**ENTITÉ** ; le lieu = *où* (**S-25**) ; modèle universel (**S-01/S-02**) | `v2_products.facility_id not null` → l'offre appartient à la **facilité** ; `quantity_allocated_omni` → seul le fongible entre | `001_v2_roots.sql:82` |
| C-3 | Pro **par entité** | `facility_pro` par **facilité** | `invariants.ts:13` |
| C-4 | plafond **20** | **5** | `invariants.ts:13` |
| C-5 | « 1 besoin = 1 bulk » | `ceil(N/100)` | `trunk-repository.ts:5570` |
| C-6 | seuil **par volume** (1 particulier / 3 commerce) | **3 uniforme** | `CONFIRMED_SALES_THRESHOLD` |
| C-7 | position = **caractéristique** d'offre | `facility_type` (3 types) | champs produit |

**Verdict : la maquette suit le Seed ; le socle ne suit pas.** C'est la cause du rond-point : chaque tranche
construite au-dessus d'un socle non conforme produit de la dette.

## Décision requise (fondateur seul)

**D-C1** reconstruire le socle au modèle Seed *(recommandé — supprime la racine)* ·
**D-C2** adapter le Seed au code *(déconseillé — contredit S-01/S-02/S-25)* ·
**D-C3** position d'abord *(réduit la douleur, ne guérit pas)*.

## État

| Champ | Valeur |
|---|---|
| Porte | Species (réouverte) · Root parqué · aval inactif |
| Preuve | `16/16 conforme` (T-12) + 7 incohérences mesurées (T-14) |
| Gap résiduel | L'index du Seed (entité porteuse d'offres, position-caractéristique) **n'existe pas en base** |
| Préservé | Aucune migration, aucun enregistrement Neon, aucun code produit touché |
| Prochaine plus petite action | **Le fondateur rend D-C1/C2/C3** ; ensuite Root V2 |
| Re-plan trigger | Décision rendue · `SP-VALIDATION` tranchée · offre réelle hors moule qui casse le schéma |
| Garde | `npm run check:state` = `STATE CONSISTENT` (épingle la décision de cohérence) |
