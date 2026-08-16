# Matrice de traçabilité du master Omni

Cette matrice relie les règles du document [`OMNI_MASTER_PRODUCT_INTERFACE.md`](./OMNI_MASTER_PRODUCT_INTERFACE.md) aux zones de code, tests et validations. Elle complète la matrice de plateforme existante sans la remplacer.

| ID | Exigence normative | Code principal | Test/validation | Statut initial |
|---|---|---|---|---|
| MASTER-01 | Carte comme canvas principal, pas de landing page marketing interne | `src/routes/carte.tsx`, `src/components/omni/MapCanvas.tsx` | Ouvrir `/carte`, vérifier le shell map-first | À auditer |
| MASTER-02 | Globe au repos, rotation horizontale, progression caméra seulement après recherche | `MapCanvas`, `carte.tsx` | Test navigateur et captures desktop/mobile | Partiel |
| MASTER-03 | Contrôles carte limités à `+`, `−`, recentrage | `MapCanvas`, contrôles de carte | Vérification responsive et clavier | À auditer |
| MASTER-04 | Notifications et menu uniquement dans le chrome supérieur | `TopNav`, `NotificationsBell`, menu Omni | Test mobile hamburger et desktop | Partiel |
| MASTER-05 | Search Dock persistant, flottant et translucide | `SearchDock.tsx` | Vérifier tous les états map-first | Partiel |
| MASTER-06 | Clic sur recherche et `Enter` utilisent un même contrat idempotent | `SmartSearchBar.tsx`, `SearchDock.tsx`, `carte.tsx` | Test clic, Enter, busy, erreur et double soumission | Vérifié — clic production redirige vers auth avec `pendingSearch=1`; Enter partage le même handler |
| MASTER-07 | Catégories comme raccourcis scrollables horizontaux | `SearchDock.tsx` | Touch, clavier, flèches et 320/375 px | Partiel |
| MASTER-08 | Quantité/budget masqués par défaut et éditables lorsqu’utiles | `SearchDock.tsx`, filtres de recherche | Idle, recherche active, disponibilité | Partiel |
| MASTER-09 | Auth avant première exécution backend avec restauration exacte | `carte.tsx`, auth/pending-search helpers | Logout → recherche → login → restauration | Partiel |
| MASTER-10 | Facilities OSM unclaimed découvrables et clairement identifiées | `osm-coverage.server.ts`, `MapCanvas`, cards | Search mondial et statut unclaimed | Partiel |
| MASTER-11 | Panneaux horizontaux de facilities comme pattern officiel | résultat/facility rail, `FacilityPanel` | Test responsive et clavier | Implémenté — audit responsive à faire |
| MASTER-12 | Facility detail au-dessus de la carte, side sheet desktop/bottom sheet mobile | `FacilityPanel.tsx` | Responsive 320/375/768/1280 px | Partiel |
| MASTER-13 | Availability toujours après discovery, manual et bulk | `DemandRequestPanel.tsx`, functions availability | Single facility, bulk, quotas, ranking | Vérifié/à réauditer |
| MASTER-14 | États Available, Partial, Unavailable lisibles | `DemandRequestPanel.tsx` | Fixtures de réponses et erreurs | Vérifié/à réauditer |
| MASTER-15 | Purchase Intent comme gateway vers QR et transaction | checkout/transaction components et server functions | Intent → QR → timeline | À auditer |
| MASTER-16 | Timeline transactionnelle stateful | transaction UI/server contracts | Refresh, reprise, permissions | À auditer |
| MASTER-17 | Seller map-first, facilities propres, buyer preview | route seller et composants vendeur | Desktop/mobile role switch | Partiel |
| MASTER-18 | Catalogue, allocation, promotions, balance et plans | seller components/functions/schema | Free/Pro entitlement matrix | À auditer |
| MASTER-19 | Notifications deep-linked et menus contextuels buyer/seller | `TopNav`, notifications, menus | Ouvrir chaque type de notification | À auditer |
| MASTER-20 | Agent optionnel derrière Pro et kill switch global | agent functions/feature flags | AI OFF conserve tous les flows manuels | Planifié/guardé |
| MASTER-21 | Media-ready mais UI média désactivée en V1 | media schema/components | Vérifier absence de blocage media | Partiel |
| MASTER-22 | Validation Vercel SSR et absence de CSRF runtime failure | `vite.config.ts`, `src/start.ts` | Build + import SSR + production HTTP | Vérifié |

## Vocabulaire d’état

- **Vérifié** : preuve par test, build, navigateur ou déploiement.
- **Partiel** : une partie du comportement existe mais la cible normative n’est pas complète.
- **À auditer** : le code existe ou est supposé exister, mais la conformité n’a pas encore été vérifiée.
- **Planifié** : la cible est documentée, sans implémentation suffisante.
- **Bloqué** : dépend d’une décision, d’un contrat backend, d’une configuration externe ou d’une authentification.

## Règle de mise à jour

Toute modification du master ou du code doit mettre à jour la ligne concernée, le test de validation et le journal de décisions lorsque la règle normative change.
