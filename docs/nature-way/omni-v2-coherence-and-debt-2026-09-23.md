# Cohérence V2 vs app réelle — dette & risque de régression

> **As of:** 2026-09-23 (UTC) · **Propriétaire :** Nature Way
> **Objet :** comparer la maquette Species V2 et l'app réelle à `omni-v2-rebuild`, classer la dette, et **empêcher la perte** de comportements éprouvés.

## 1. Verdict court

La maquette V2 est **plus juste sur les décisions produit** (entité, avantage, intégrité, opérateur).
L'app réelle est **plus juste sur les comportements** (accessibilité, cinématique, résilience, état vivant).
**Aucune des deux n'est la vérité seule.** Poursuivre « juste avec la maquette » **perdrait** des comportements réels — c'est le risque que le fondateur a identifié.

## 2. Dette — classée

| ID | Classe | Sévérité | Constat | Preuve | Impact | Correction | Propriétaire | Disposition |
|---|---|---|---|---|---|---|---|---|
| COH-V2-01 | Documentation | **Haute** | `docs/design.md` désigne comme source de vérité l'**ancienne** maquette (`omni-species-maquette.html`, V1.1/V1.3) — pas la V2 | head `docs/design.md` | tout contributeur construit sur une vérité périmée | réconcilier `design.md` vers V2 **après acceptation** | Fondateur | `open` |
| COH-V2-02 | Visuelle/technique | **Haute** | La maquette V2 ne contient **aucun** `prefers-reduced-motion`, `safe-area`, `100svh`, `aria-*`, gestion clavier | grep 2026-09-23 : 0 occurrence | accessibilité + plein écran mobile perdus si la maquette remplace l'app | amender la maquette **ou** déclarer l'héritage depuis l'app | Nature Way | `open` |
| COH-V2-03 | Logique | **Haute** | La maquette montre l'offre rattachée à une **entité** ; l'app la rattache à une **facility** | SDM E-01 ; `v2_products` → facility | le modèle de données est la racine la plus fausse | décision Root « entité » avant tout code | Fondateur | `open` |
| COH-V2-04 | Logique | Moyenne | Maquette : **avantaged Omni obligatoire > 0** ; app : `coupon_code` optionnel | SDM E-04 | publication sans avantage possible | contrainte + refus serveur | Nature Way | `open` |
| COH-V2-05 | Logique | Moyenne | Maquette : **visuel obligatoire** ; app : aucune contrainte | SDM E-03 | offres sans image publiables | contrainte + refus serveur | Nature Way | `open` |
| COH-V2-06 | Logique | Moyenne | Maquette : **intégrité + réputation par offre** ; app : inexistant | SDM E-05 | décision d'achat sans signal | table réputation d'offre | Nature Way | `planned` |
| COH-V2-07 | Logique | Moyenne | Maquette : **opérateur terrain** distinct ; app : `operator` = capability admin | SDM E-09 | vérification terrain non modélisée | décision Root rôle opérateur | Fondateur | `open` |
| COH-V2-08 | Logique | Faible | Maquette : **Room acheteur** ; app : chat serveur seulement | SDM E-08 | asymétrie acheteur/vendeur | tranche dédiée | Nature Way | `planned` |
| COH-V2-09 | Documentation | Faible | Le registre `omni_schema_migrations` peut être en retard sur le schéma réel (053 vs 052/054/055 présents) | doc projet 2026-09-20 | faux diagnostic « migration non appliquée » | vérifier l'objet, pas le registre | Nature Way | `watch` |

## 3. Comportements de l'app à **préserver explicitement**

Ces éléments sont **prouvés en prod** et **absents de la maquette**. Ils sont versés au registre comme **à hériter**, jamais à perdre.

| Comportement | Module/preuve | Statut | Décision |
|---|---|---|---|
| Chorégraphie de recherche (monde → rue, vagues, pop-in) | `map-reveal.ts`, `T-12`, `P0-B` | `verified` | **héritage obligatoire** |
| Carte de repli réelle si MapLibre échoue | `fallback-map.ts` (8 tests), T-13d | `verified` | **héritage obligatoire** |
| Fraîcheur 4 h / 24 h | `useFreshnessTimer.ts` | `verified` | **héritage obligatoire** |
| Temps par étape, jamais d'annulation | `transaction-{steps,time,timeline}.ts` | `verified` | **héritage obligatoire** |
| Focus/`aria-modal` sur les tiroirs desktop | 3 fichiers, 9 `focus` | `real` | **héritage obligatoire** |
| `100svh` + `safe-area` mobile | 2 + 1 fichiers | `real` | **héritage obligatoire** |
| `prefers-reduced-motion` | 1 fichier | `real` | **héritage obligatoire** |
| Panier par entité persistant | `facility-cart.ts` | `verified` | **héritage obligatoire** |
| Clusters MapLibre en chiffres formés | `131d23a` | `verified` | **héritage obligatoire** |
| Coquille desktop / comparateur | `layout-contract.ts`, `v13-compare.ts` | `verified` | **héritage obligatoire** |

## 4. Décision demandée au fondateur

**Une seule décision, réversible, qui débloque tout :** *la maquette V2 est-elle la référence visuelle qui **hérite** des comportements de l'app (fusion), ou remplace-t-elle l'app (perte assumée) ?*

Recommandation Nature Way : **fusion** — la maquette gagne comme **référence visuelle et de décisions produit** ; l'app reste la **référence de comportement** ; `design.md` est réconcilié après acceptation ; aucune tranche de code ne démarre avant que le **Root « entité »** (COH-V2-03) soit tranché.
