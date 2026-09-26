# Carte d'harmonisation documentaire — Omni

> **ID :** `DOC-HARMONY-OMNI-2026-09-25` · **As of :** 2026-09-25 · **Porte :** `SPECIES_CLOSED_ROOT_OPEN`
> **Autorité :** `/nature-way` · **Branche :** `omni-v2-rebuild`

**Question du fondateur :** *« la meilleure des choses n'est-ce pas d'harmoniser nos registres et docs,
de supprimer ceux qui sont non nécessaires… et eux, normalement, chacun a un doc ou des docs de gate
qui doivent être produits non ? Par exemple à quel niveau Omni est bien décrit, le master par
exemple ou autre ? »*

**Réponse courte :** oui, et la mesure est plus sévère que prévu. **Le « master » décrivait une Omni
qui n'existe plus.** Ce document **mesure** et **classe** — il ne supprime rien.

---

## 1. Mesure du corpus

| Mesure | Valeur |
|---|---|
| Documents Markdown dans `docs/` | **237** |
| Écrits à l'ère **V2** (`2026-09-23`→`25`, `nature-way` + `founder-hq`) | **22** |
| **Orphelins** — cités par **aucun** document V2 vivant | **135** (57 %) |
| Documents référencés par le **code** ou les **scripts** | **13** |
| Documents « master » concurrents | **6** (`OMNI_MASTER`, `OMNI_MASTER_PRODUCT_INTERFACE`, `omni-master-visual-prd`, `omni-master-build-prompt`, `omni-master-traceability`, `omni-master-update-stateful-globe-plan`) |
| Cartes de dépendances concurrentes | **2** (`2026-09-02` et `2026-09-23`) |

**Interprétation honnête** : ce n'est pas « du rangement ». **57 % du corpus n'est relié à rien.**
Un nouveau contributeur — ou une nouvelle session d'agent — lit au hasard et tombe, une fois sur
deux, sur un document **périmé mais bien écrit**. **C'est la cause mécanique du rond-point.**

---

## 2. Le « master » : verdict mesuré

| Fait | Preuve |
|---|---|
| `docs/README.md` le déclarait **« l'unique document normatif d'Omni »** | README, avant correction |
| Il date du **2026-08-21** | en-tête |
| Il **précède** le Seed V2 (`S-01…S-32`, `2026-09-23`) | dates |
| Il **ignore** l'entité propriétaire de l'offre (`S-25`) | **0** occurrence de `v2_entities` ; ses 4 « identité » = **Identité UI** |
| Le journal de décisions qui l'accompagne **s'arrête au 2026-08-16** | `decisions/omni-decision-log.md` : **0** décision `2026-09` |
| Sa `DEC-001` **réaffirme** « un seul master » — et c'est ce master-là | `DEC-001` |

**Verdict : il n'y a plus UN master. Omni se décrit par une CHAÎNE.**

```
Seed V2 (intention, S-01…S-32)
  └─ SDM (dépendances, architecture causale)
       └─ Contrat du socle (entité, offre)
            └─ Maquette V2 (74 écrans, acceptée)
                 └─ État + board + plan (exécution)
                      └─ Registres (cohérence, conformité, finitions)
```

**Corrigé** : `docs/README.md` déclare désormais la chaîne, et le master V1 est marqué **historique**.

---

## 3. Classification par cluster (mesurée)

| Cluster | Nb | Statut | Raison mesurée |
|---|---|---|---|
| `nature-way/` V2 (`2026-09-2x`) | 22 | **CANONIQUE** | chaîne d'autorité vivante |
| `founder-hq/` V2 | 5 | **CANONIQUE** | porte, board, plan, handoffs |
| `maquette/` V2 | 1 | **CANONIQUE** | design accepté |
| `design.md` | 1 | **CANONIQUE** | vocabulaire UI imposé |
| `docs/*` racine (V1, `2026-08`) | 101 | **HISTORIQUE** | antérieur au Seed V2 |
| `omni-v1-*` | 28 | **HISTORIQUE** | spécifications V1 |
| `omni-continuity-*` | 8 | **HISTORIQUE** | plan de continuité V1 |
| `omni-platform-*` | 9 | **HISTORIQUE** | PRD plateforme V1 |
| `omni-species-*` (V1, `08`) | 9 | **HISTORIQUE** | Species **V1**, remplacé par V2 |
| `omni-master-*` + `OMNI_MASTER*` | 6 | **HISTORIQUE — masters concurrents** | aucun n'est V2 |
| `one-shot/` | 7 | **HISTORIQUE** | prompts d'exécution passés |
| `nature-way/` V1 (`2026-09-0x`) | 17 | **HISTORIQUE** | tranches V1 (T-07, T-10, G-05/G-06) |
| `founder-hq/` V1 | 4 | **HISTORIQUE** | handoffs HO-OMNI-10/17/19 + funding `08-21` |
| `decisions/` | 1 | **HISTORIQUE** | arrêté au `2026-08-16` |

---

## 4. Le piège : 13 documents sont **référencés par le code**

Ces chemins sont lus par des scripts ou des tests. **Les déplacer casse un garde.** Ils **restent**
où ils sont :

| Chemin | Lu par |
|---|---|
| `docs/founder-hq/current-state.md` | `check-state.mjs` |
| `docs/founder-hq/founder-hq-board.md` | `check-state.mjs` |
| `docs/founder-hq/founder-hq-master-plan.md` | `check-state.mjs` |
| `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` | `check-state.mjs`, `t12-audit.mjs` |
| `docs/nature-way/omni-seed-vs-code-coherence-register-2026-09-23.md` | `check-coherence.mjs` |
| `docs/nature-way/omni-species-v2-conformance-audit-T12-2026-09-23.md` | `t12-audit.mjs`, `check-state.mjs` |
| `docs/nature-way/omni-species-v2-decision-registry-2026-09-23.md` | `t12-audit.mjs` |
| `docs/nature-way/omni-root-gate-v2-assessment-2026-09-23.md` | `check-state.mjs` |
| `docs/maquette/omni-species-v2-interactive.html` | `check-maquette-v2.mjs` |
| `docs/maquette/omni-species-maquette.html` | `check-maquette-v2.mjs` |
| `docs/maquette/omni-admin-operator-maquette.html` | `check-maquette-v2.mjs` |
| `docs/maquette/omni-artifact-design-system.html` | `check-maquette-v2.mjs` |

**Règle** : on ne déplace un document référencé **qu'en mettant à jour le script dans le même commit**.

---

## 5. Documents de gate — ce qui existe, ce qui manque

Nature Way liste des artefacts **requis**. État mesuré à l'ère V2 :

| Artefact requis | V2 ? | Où / manque |
|---|---|---|
| Intent Brief / Seed | ✅ | `omni-intent-brief-v2-2026-09-23.md` |
| Species / maquette | ✅ | `maquette/omni-species-v2-interactive.html` |
| System Dependency Map | ✅ | `omni-system-dependency-map-2026-09-23.md` |
| Contrat du socle (Root) | ✅ | `omni-root-v2-entity-layer-contract-2026-09-23.md` |
| Plan d'exécution / arbre de tâches | ✅ | `founder-hq-master-plan.md`, plans `intra-skill-*` |
| Registre de cohérence / dette | ✅ | `omni-seed-vs-code-coherence-register`, `omni-v2-coherence-and-debt` |
| **Registre de preuves** (`proof record`) | ❌ | **MANQUE** — 14 scripts `prove-*` existent mais **aucun registre** ne dit quelle preuve couvre quelle décision, ni sa **classe** (observed/reproduced/bounded/external/manual/unproven) |
| **Registre de décisions daté** (`decision log`) | ⚠️ | existe (`decisions/omni-decision-log.md`) mais **arrêté au 2026-08-16** — 0 décision V2 |
| **Enveloppe de lancement** (`launch envelope`) | ⏸️ | **non due** — appartient à **Canopy/Ring**, pas à Root. **Ne pas la produire maintenant** |
| **Registre de preuve de production / verdict de maturité** | ⚠️ | partiel : `omni-root-gate-v2-assessment` ; les verdicts de maturité vivent dans des docs de tranche V1 |
| **Registre de release** (`release record`) | ⏸️ | **non dû** — appartient à **Rings**. Les releases vivent dans `AGENTS.md` (acceptable jusqu'à une release réelle) |

**Réponse directe à « chaque gate a un doc de gate ? » : les artefacts dus pour les portes
**franchies** manquent pour l'ère V2 — mais pas tous ceux que la liste complète suggère.**

**Distinction importante** : `launch envelope` et `release record` sont des artefacts de
**Canopy/Ring**. Les réclamer pendant Root serait **du zèle hors porte**. Ce qui manque
**réellement** à Root, c'est :

| # | Artefact dû | Pourquoi il manque, et ce qu'il coûte |
|---|---|---|
| **P-1** | **Registre de preuves** | 14 scripts `prove-*`, **0 registre**. On ne sait pas **quelle** décision `S-xx` est couverte par **quelle** preuve, ni sa **classe**. ⇒ **on refait** des preuves déjà faites. **C'est le rond-point, à la racine.** |
| **P-2** | **Journal de décisions V2** | le journal existe mais **s'arrête au 2026-08-16**. Les décisions `D-C1`, `D-CON`, `D-LOC`, `D-TXN`, `RT-D1`… ne sont **pas** dans le journal — elles vivent dans des docs épars. |
| **P-3** | **Verdict de maturité scopé** | `pilot-ready` est l'objectif déclaré mais **aucun** document ne porte le verdict avec date, base de preuve, limites et trigger de révision. |

---

## 6. Proposition — ordre, sans rien supprimer

**Aucune suppression sans accord explicite du fondateur** (règle de préservation). Étapes réversibles :

| # | Action | Effet | Risque |
|---|---|---|---|
| **H-1** | `README.md` corrigé — chaîne V2 déclarée, master V1 = historique | **FAIT** | nul |
| **H-2** | **Cette carte** + classement de chaque cluster | **FAIT** | nul |
| **H-3** | Produire les **4 artefacts de gate manquants** (preuves, décisions, enveloppe, release) | ferme le rond-point à la racine | nul |
| **H-4** | Déplacer les **135 orphelins** vers `docs/archive/` (git mv, contenu intact, historique préservé) | 237 → ~100 docs actifs, `docs/` redevient lisible | faible, réversible |
| **H-5** | Trancher le **master concurrent** : garder `OMNI_MASTER_PRODUCT_INTERFACE.md` en `archive/` **ou** le réduire à un pointeur vers la chaîne | supprime 5 concurrents | faible |
| **H-6** | Trancher la **SDM concurrente** (`2026-09-02`) → archive | 2 → 1 carte | nul |
| **H-7** | Garde : un `check:docs` qui échoue si un doc se déclare « master unique » hors chaîne V2 | empêche la rechute | nul |

**Ce qui n'est PAS proposé** : supprimer. **Archiver** garde la traçabilité (la méthode l'exige :
*« Preserve by default »*).

---

## 7. Non mesuré (honnêteté)

- **Qualité intrinsèque** de chaque orphelin : classé par **date et non-référencement**, pas par
  lecture intégrale des 135. Certains peuvent être utiles — d'où **l'archive, pas la corbeille**.
- **Valeur des masters V1** : ils peuvent documenter des règles encore vraies (map-first, stateful).
  **Archiver n'affirme pas qu'ils sont faux** ; cela affirme qu'ils **ne sont plus l'autorité**.
- **Le coût** de H-3 : non estimé en heures.

---

## 8. Ce que je recommande, dans l'ordre Nature Way

1. **H-3 d'abord** — les 4 artefacts manquants. Sans registre de preuves, **on refait** le travail
   déjà fait : c'est la cause directe du rond-point, pas la documentation en général.
2. **H-7** — le garde, pour que la rechute échoue au lieu de passer.
3. **H-4/H-5/H-6** — l'archivage, **sur ton accord explicite**.

**H-3 avant l'archivage** : ranger un corpus sans avoir écrit la source de vérité des preuves,
c'est ranger le désordre. **La cause d'abord, le rangement ensuite.**
