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
| COH-V2-13 | Visuelle/logique | Moyenne | **Résultats** pauvres : aucun **tri** (app : Meilleur match / Plus proche / Prix / Remise), aucune **barre de fraîcheur** (app : vert/vieilli/expiré), **sponsorisé** réduit à une ligne de texte, **produit recherché** absent du DOM | grep : sort=0, freshbar=0 dans la maquette ; app 25 hits tri + 192 .freshbar | l'écran de résultats ne permettait pas de décider | tri + fraîcheur + badges hérités de l'app, testés navigateur | Nature Way | **résolu** |
| COH-V2-14 | Visuelle/logique | Moyenne | **Fiche d'offre** : pas de **panier** (app COR-7c), itinéraire libellé sans honnêteté | grep : panier app 7 / maquette 5 ; tracé direct app | panier et itinéraire incohérents avec l'app | « Ajouter au panier » + « Dans votre panier · vider » + libellé « (tracé direct) » | Nature Way | **résolu** |
| COH-V2-15 | Visuelle | Faible | **Résolus** : `entite-publique`/`facility-apex` (itinéraire honnête), `room`/`seller-chat` (timer par étape FF-6), `produit-multi` (panier par entité conforme) | audit 2026-09-23 | — | fait | Nature Way | **résolu** |
| COH-V2-16 | Logique | Moyenne | **Clé `seller-chat` définie DEUX FOIS** dans `SHEETS` → le 1er bloc (pauvre) était **silencieusement écrasé** par le 2e | `grep -c "SHEETS['seller-chat'] ="` = 2 | code mort trompeur + risque de divergence | 1er bloc supprimé, le bloc riche conservé | Nature Way | **résolu** |
| COH-V2-17 | Logique | Moyenne | **Timer par étape (FF-6) absent** — l'app porte « qui agit + échéance + le temps relance n'annule jamais » ; la maquette n'avait qu'un TTL QR de 10 min | `transaction-time.ts` (deadlines 10 min→30 j) | le cœur temporel de la transaction n'était pas représenté | Étape + Échéance + timer portés sur `seller-chat`/`room` | Nature Way | **résolu** |

| COH-V2-18 | Documentation/logique | **Haute** | L'audit Species V2 (`omni-species-v2-screen-audit-2026-09-23.md`) a été mesuré contre l'**ANCIEN registre MV1**, pas contre le Seed V2 (34 décisions S-01…S-34). Il a conclu « 40/40 PRESENT » alors que **plusieurs décisions structurantes n'ont AUCUNE surface** : S-06 échelle 0→4 (0 occurrence), S-11 double niveau (0), S-13 filtres carte (0), S-32 intégrité/réputation d'offre (absent) | grep : 0 citation `S-xx` dans l'audit ; 0 `Queryable`/`Discoverable`/`Échelle d'existence` dans la maquette | l'audit a pu clore Species à tort — risque de rejouer « on a raté le process depuis Species » | bannière de correction + T-11 réétalonnage S-xx + T-12 audit de conformité V2 | Nature Way | **ouvert** |
| COH-V2-10 | Logique | Moyenne | `S.constraints` **déclaré mais jamais utilisé** dans la maquette → les chips de recherche étaient **codés en dur** (pas une requête) | grep 2026-09-23 : 0 usage de `S.constraints` | une recherche qui ne reflétait pas les contraintes affichées | chips pilotées par l'état (`setRayon`/`toggleC`), testé | Nature Way | **résolu** |
| COH-V2-11 | Visuelle/logique | Moyenne | **Retour absent du dock** sur les sheets imbriquées (l'app en a un) | parité app `handleDock('back')` | impossible de revenir sans fermer | item Retour ajouté à tous les rôles, **désactivé uniquement en flux verrouillé** (D-TXN) | Nature Way | **résolu** |
| COH-V2-12 | Visuelle | Moyenne | Sheet de recherche **incohérente avec tout ce qu'Omni offre** : « Créneau/Livraison bientôt » sans l'univers complet, pas de hiérarchie distance-d'abord | SDM §1 (univers d'offres), Seed S-xx | l'écran le plus important ne disait pas ce qu'Omni indexe | recherche restructurée : univers complet, **Distance d'abord** (quartier→monde), puis budget/quantité/état/créneau/livraison/transactable, lien recherches sauvegardées, note « requête pas engagement » | Nature Way | **résolu** |
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

## 3bis. DÉCOUVERTE 2026-09-23 — la maquette V2 hérite **déjà** du langage visuel

Vérifié par comparaison de jetons (pas par impression) :

| Jeton | App (`src/trunk/ui-v13.css`) | Maquette V2 | Verdict |
|---|---|---|---|
| `--ink` | `#0f0f0f` | `#0f0f0f` | **identique** |
| `--panel` | `#f7f7f7` | `#f7f7f7` | **identique** |
| `--accent` | `#2e8b6f` | `#2e8b6f` | **identique** |
| `--accent-soft` | `#eef4f1` | `#eef4f1` | **identique** |
| `--ink-soft` | `#6b6b6b` | `#6b6b6b` | **identique** |
| Police | `Inter, ui-sans-serif…` | `Inter, ui-sans-serif…` | **identique** |

**Conséquence :** la maquette V2 **n'est pas une divergence visuelle**. Elle partage déjà l'ADN de l'app. Ce qui manque n'est **pas** le visuel — ce sont les **comportements** (§3) et les **décisions produit** (§2). **La fusion est donc quasi gratuite visuellement** : elle ne coûte que le portage des comportements et la réconciliation de `docs/design.md`.

**COH-V2-02 s'allège :** sévérité Haute → **Moyenne** (le portage comportemental est borné, pas une réécriture visuelle).

## 4. Décision demandée au fondateur

**Une seule décision, réversible, qui débloque tout :** *la maquette V2 est-elle la référence visuelle qui **hérite** des comportements de l'app (fusion), ou remplace-t-elle l'app (perte assumée) ?*

Recommandation Nature Way : **fusion** — la maquette gagne comme **référence visuelle et de décisions produit** ; l'app reste la **référence de comportement** ; `design.md` est réconcilié après acceptation ; aucune tranche de code ne démarre avant que le **Root « entité »** (COH-V2-03) soit tranché.
