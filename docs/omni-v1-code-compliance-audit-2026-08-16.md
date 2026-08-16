# Audit initial de conformité du code Omni — V1

**Date :** 2026-08-16  
**Source normative :** [`OMNI_MASTER_PRODUCT_INTERFACE.md`](./OMNI_MASTER_PRODUCT_INTERFACE.md), en particulier §0.5 V1 Scope Gate, §0.6 Manual Operations Layer et les contrats d’interface renumérotés §§169–172.

## Diagnostic exécutif

Le master décrit correctement la destination et, grâce au Scope Gate V1, distingue désormais le noyau à rendre production-ready de la vision différée. Le code actuel possède déjà une base fonctionnelle solide pour la carte, la couverture par viewport, les facilities OSM/unclaimed, la disponibilité manuelle et les overlays buyer/seller. Le premier blocage utilisateur confirmé est le bouton de recherche : `Enter` appelle `onSubmit`, mais le Search Dock ne rend pas de bouton de soumission distinct. Le contrôle trailing actuel est la marque Omni et son `onBrandClick`, ce qui explique pourquoi l’affordance visuelle de recherche ne déclenche pas la requête.

Le principal écart produit est donc moins l’absence totale de fonctionnalités que le mélange entre des états déjà implémentés, des états partiels et des ambitions V2. Le V1 doit être traité comme une boucle commerciale courte et observable :

```text
Search → Discover → Facility/Product → Check Availability (manual) → Purchase Intent → Contact/QR → Transaction recorded
```

## Matrice des écarts prioritaires

| Priorité | Exigence master | Preuve code actuelle | État | Action |
|---|---|---|---|---|
| P0 | Clic recherche et `Enter` partagent un contrat unique | `SmartSearchBar` gère `Enter`, mais son trailing est la marque Omni et non un submit | Bloqué | Ajouter un bouton de recherche explicite, callback commun, busy/anti-double-soumission, labels ARIA. |
| P0 | Search Dock reste le point d’entrée map-first | `SearchDock` est persistant et branché à `carte.tsx` | Partiel/conforme | Préserver la structure et corriger uniquement l’affordance et les états de soumission. |
| P0 | V1 manual search → discovery → facility | `handleSearchSubmit`, viewport retrieval et facilities sont présents | Partiel | Vérifier auth, requête restaurée, résultats, caméra et carte visible dans un smoke test. |
| P0 | Availability manuelle après discovery | `FacilityPanel` et `DemandRequestPanel` existent avec manual/bulk | Partiel/conforme | Vérifier que la facility unclaimed ne devient pas transactionnable et que le CTA reste contextuel. |
| P1 | Panneaux de facilities horizontaux | Pattern déjà retenu dans les plans et composants de résultats | Partiel | Formaliser l’état, le focus clavier, le touch, le safe-area et l’absence de recouvrement du dock. |
| P1 | Quantité/budget secondaires et masqués par défaut | `SearchDock` contient le chevron et les contrôles structurés | Partiel/conforme | Vérifier les états idle/search/no-result/availability et corriger toute collision. |
| P1 | Location truthful et fallback | `carte.tsx` distingue `userPos`, `locationStatus`, précision et fallback | Partiel | Vérifier que le fallback ne crée jamais de pin utilisateur et que la précision reste lisible sans jargon. |
| P1 | Carte globale et facilities source-backed | `listFacilitiesInBounds` et coverage OSM existent | Partiel/conforme | Garder la couverture mondiale active ; ne pas appliquer la suggestion de la pièce jointe de supprimer OSM, car elle contredit l’exigence globale validée par l’utilisateur. |
| P1 | Seller map-first | Route et composants seller existent | Partiel | Auditer contre les sections seller V1, surtout facility ownership, catalogue, requests et buyer preview. |
| P2 | Purchase Intent → QR → transaction | Des composants et fonctions existent, mais le flow complet reste à auditer | Partiel | Prioriser persistance, permissions, timeline et reprise après refresh. |
| Deferred | Agent, image/video search, wallet avancé, offline, 3D, bulk automation | Présents à plusieurs endroits dans le master mais non nécessaires au V1 | Hors V1 | Ne pas élargir le sprint avant la boucle manuelle transactionnelle. |

## Brainstorming et arbitrages recommandés

La suggestion de transformer le globe, la révélation staged et la couverture OSM en fonctionnalités différées est utile pour clarifier la priorité, mais elle ne doit pas supprimer la couverture mondiale déjà explicitement demandée et déjà implémentée par viewport/OSM. La meilleure décision est de distinguer : **couverture et facilities source-backed = V1 discovery**, tandis que **globe sophistiqué, révélation continent/pays/région et géolocalisation accuracy-banded avancée = polish progressif après la boucle commerciale**.

Le panneau horizontal de facilities est une bonne décision UX car il conserve la carte comme canvas, permet de comparer rapidement plusieurs établissements et fonctionne naturellement sur mobile. Il faut le stabiliser comme composant de résultats, et non le remplacer par une liste verticale ou une page séparée. Sa qualité production dépend surtout de son ancrage, de son focus clavier, de son compteur, de ses états loading/empty/error, du safe area et de sa coordination avec le Search Dock.

Le bon choix pour la recherche est de séparer visuellement trois responsabilités : le champ, le bouton de recherche et la marque. Le bouton de marque ne doit plus être le seul contrôle trailing ; la marque peut rester dans le chrome ou être conservée comme élément non-actionnel, tandis que le bouton submit doit être immédiatement identifiable et accessible. La voix pourra continuer à injecter un terme puis appeler le même contrat ; l’UI image reste désactivée selon le Scope Gate.

Le manuel opérationnel doit rester le muscle du V1 : le buyer envoie une demande réelle, l’opérateur ou le vendeur répond Available/Partial/Unavailable, puis Omni enregistre intent, QR et transaction même si le paiement est externe. L’interface doit représenter cet état honnêtement et collecter les données nécessaires à l’automatisation future.

## Ordre de réalisation approuvé

1. Réparer le contrat de soumission de recherche et le tester.
2. Auditer le flux map-first non authentifié et la restauration de requête.
3. Stabiliser le rail horizontal de facilities et ses états responsive/accessibles.
4. Vérifier la disponibilité manuelle et les restrictions unclaimed.
5. Compléter Purchase Intent, QR et timeline transactionnelle du V1.
6. Auditer seller map-first et les limites Free/Pro réellement appliquées.
7. Seulement après preuve de la boucle V1, reprendre le polish globe/reveal et les fonctionnalités Deferred.

## Règle de non-régression

Aucune modification V1 ne doit réintroduire une landing page séparée, une navbar globale permanente, un marché hardcodé, une fausse position utilisateur, une facility unclaimed présentée comme vendeur actif, une disponibilité accessible avant discovery, ni des contrôles quantité/budget visibles par défaut lorsqu’ils ne sont pas pertinents.

## Preuve de la première tranche

Le commit `ff89b7b` a été poussé sur `main` et la production a répondu `HTTP 200` sur `/`, `/carte`, `/auth` et `/vendeur`. Sur `/carte`, le nouveau bouton accessible **« Lancer la recherche »** est visible. Avec la requête `pharmacie`, son clic a déclenché le parcours d’authentification attendu vers `/auth?redirectTo=%2Fcarte%3FpendingSearch%3D1`, ce qui confirme que le bouton appelle le même contrat que la soumission clavier et préserve la requête avant authentification.

Le smoke test a également confirmé que MapLibre est bien présent dans le DOM de production. La couche de fond géographique a affiché une indisponibilité de données cartographiques pendant le test, mais l’application est restée utilisable avec son contrôle de réessai ; cette dépendance de style/tiles doit faire partie de l’audit de résilience réseau de la prochaine tranche.
