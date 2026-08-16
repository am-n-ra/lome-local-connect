# Inventaire documentaire Omni

## Méthode

Inventaire établi à partir des fichiers Markdown suivis par Git et des documents contenant des décisions produit, UI, backend, roadmap, tests ou rapports. Le statut indique la manière dont chaque document doit être utilisé après la création du master canonique.

## Documents de référence et décisions

| Chemin | Type | Sujet | Statut après consolidation |
|---|---|---|---|
| `docs/OMNI_MASTER_PRODUCT_INTERFACE.md` | Master produit/interface | Vision, flows, UI/UX, données, plans, IA, transaction, critères | **Normatif — source unique** |
| `docs/OMNI_MASTER.md` | Ancien master | Vision et règles historiques | Remplacé, pointeur vers le master |
| `docs/omni-product-interface-spec.md` | Spécification interface | Map-first, Search Dock, availability, transaction, plans | Source intégrée/historique |
| `docs/omni-platform-glossary-and-state-machines.md` | Glossaire/états | Terminologie et machines d’état | Normatif secondaire, à relier au master |
| `docs/omni-platform-master-roadmap.md` | Roadmap | Phases et priorités | Plan d’exécution lié au master |
| `docs/omni-build-plan-after-build-prompt.md` | Build plan | Séquencement de réalisation | Historique/proposition à aligner |
| `docs/omni-platform-product-ux-prd.md` | PRD UX | Parcours et expérience | Source intégrée à vérifier contre le master |
| `docs/omni-platform-technical-backend-database-prd.md` | PRD technique | Schéma et contrats backend | Normatif technique secondaire, sans contredire le master |
| `docs/omni-platform-product-ux-build-prompt.md` | Prompt UX | Instructions de build UI | Historique/proposition après intégration |
| `docs/omni-platform-technical-backend-database-build-prompt.md` | Prompt technique | Instructions backend/database | Historique/proposition après intégration |
| `docs/omni-platform-traceability-matrix.md` | Matrice | Conformité existante plateforme | Exécution, à relier au master |
| `docs/omni-master-traceability.md` | Matrice master | Trace master ↔ code ↔ tests | Exécution canonique nouvelle |
| `docs/decisions/omni-decision-log.md` | Journal | Arbitrages acceptés | Normatif pour l’historique des décisions |

## Plans et brainstormings historiques

| Chemin | Sujet | Statut |
|---|---|---|
| `.lovable/plan/omni-interface-produit-map-first-mise-en-conformité-2026-08-15.md` | Interface map-first | Historique/proposition |
| `.lovable/plan/omni-moteur-de-recherche-géospatial-mise-en-conformité-prd-2026-08-12.md` | Recherche géospatiale | Historique/proposition |
| `.lovable/plan/omni-périmètre-v1-ce-qu-on-construit-maintenant-2026-08-14.md` | Périmètre V1 | Historique/proposition |
| `.lovable/plan/omniview-dernière-étape-médias-navigation-responsive-2026-08-10.md` | Médias/navigation/responsive | Historique/proposition |
| `.lovable/plan/omniview-phase-c-rôles-médias-carte-intelligente-refonte-gla-2026-08-10.md` | Rôles et carte | Historique/proposition |
| `.lovable/plan/omniview-v3-mise-en-conformité-prd-livraison-par-phases-2026-08-10.md` | Livraison par phases | Historique/proposition |
| `.lovable/plan/correction-de-la-page-carte-localisation-couverture-mondiale-2026-08-16.md` | Localisation/couverture mondiale | Rapport/plan de correction |
| `.lovable/plan/omni-plan-complet-de-mise-en-production-2026-08-13.md` | Production | Plan de déploiement historique |
| `.lovable/plan/omniview-v3-finalisation-prod-design-glass-dock-de-recherche-2026-08-10.md` | Design glass/Search Dock | Historique/proposition |
| `.lovable/plan/omniview-v3-neon-migration-fedapay-and-pre-listed-facilities-2026-08-09.md` | Neon/FedaPay/facilities | Historique/proposition |

## Rapports et validations

Les fichiers `docs/*acceptance*.md`, `docs/*validation*.md`, `docs/*diagnostics*.md`, `docs/*fix-report*.md`, `docs/*refactor*.md`, `docs/omni-phase0-implementation-ledger.md` et les documents associés restent des preuves d’implémentation, pas des sources de nouvelles règles. Ils doivent référencer le master et la matrice lorsqu’ils sont mis à jour.

## Règle de classement

Les anciens documents ne sont pas supprimés automatiquement. Ils sont conservés pour la traçabilité, mais tout contenu contradictoire est résolu par le master canonique et le journal de décisions. Un déplacement vers `docs/archive/` pourra être effectué lors d’un passage de nettoyage séparé, après vérification des liens et références GitHub.
