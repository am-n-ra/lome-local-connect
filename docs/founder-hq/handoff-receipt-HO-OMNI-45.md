# Handoff receipt — HO-OMNI-45 (Founder HQ ↔ Nature Way)

> **Objet :** livraison des **deux tranches choisies** par le fondateur (« 1 et 2 ») —
> `NR-10` (alertes de recherche sauvegardée) et `NR-11` (expliquer le plan Pro vendeur).
> Porte courante **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** (Branches OPEN).
> **Autorité :** `/nature-way`. **Terrain (`TT-1`/`TT-2`/Gate 7) reste EN DERNIER** (décision 2026-10-07).

## Dispatch Record (Founder HQ)

| Champ | Valeur |
|---|---|
| Objectif | Construire les deux tranches `ready` retenues, les prouver, puis router la suite |
| Skill primaire | **`/nature-way`** — durcissement Branches, une fonctionnalité à la fois |
| Skill secondaire | aucun |
| Reversibilité | **réversible** — `NR-11` = texte + garde ; `NR-10` = producteur additif (aucune migration, aucune colonne) |
| Gate de premier niveau | Seed (`S-16`, `S-19`, `S-26`, `S-31`) + porte `HEARTWOOD_CLOSED_BRANCHES_OPEN` ; `NR-10` = **capacité neuve autorisée** (fondateur « 1 ok ») |
| Invocation | `/nature-way-founder-hq` activé → `/nature-way` pour l'exécution |

## Activation Receipt

| Champ | Valeur |
|---|---|
| Entrée | fondateur « 1 et 2 » (les deux items `ready` de `HO-OMNI-44`) |
| Lecture de l'état | `docs/founder-hq/current-state.md` → porte **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** ; plan local `NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01` |
| Portée tenue | **Branches = durcissement/fermeture** ; la capacité neuve `NR-10` est **explicitement autorisée** ; aucune fondation hors autorisation |

## Résultat (evidence)

| Item | Statut | Preuve |
|---|---|---|
| **`NR-11`** expliquer le plan Pro vendeur | **livré** | `AUTO_RESPONSE_ABSTENTION` (5 motifs : `not-enabled`, `not-pro`, `not-fresh`, `insufficient-stock`, `negotiation-open`) + **une phrase par ligne Pro** (`SELLER_ROWS`/`BUYER_ROWS`) + **bloc d'abstention** ; garde `pro-plan-explained.test.ts` (4). **Falsifié** : retirer un motif → *« chaque motif d'abstention porte une phrase »* **échoue** (+ `TS2741` sur le `Record`). |
| **`NR-10`** alertes de recherche sauvegardée | **livré** | Producteur `saved_search_match` **dans la même instruction** que la transition de publication (`changed_offer` + `alerted`) ; **matcher partagé** avec la recherche (`buildWordBoundaryPattern`, mot entier, accents pliés) ; cible `search` **in-app** (`notification-center.ts`) **et push** (`?notifs=1&search=`) ; **drain Web Push** après la publication. **Preuve Postgres réel 8/8** (branche jetable, code livré). **2 gardes falsifiées.** |
| Non-régression | **1339/1339** | tsc clean ; **7 gardes** verts (`state`, `docs`, `coherence`, `live-surface`, `dead-css`, `boundary`, + `copy-no-emdash`) ; build OK ; 12 bundles serverless régénérés dans le **même commit**. |

### Preuve `NR-10` — `scripts/prove-nr10-saved-search-alert.mjs` (8/8, branche jetable)

`T1` une publication alerte la recherche qui correspond · `T2` la cible est **la recherche** (`entity_type=saved_search`, `entity_id=riz parfumé`) · `T3` une recherche qui ne correspond **pas** ne reçoit rien · `T4` une recherche **désactivée** ne reçoit rien · `T5` l'alerte est livrée **in_app** (file) · `T6` le **rejeu** ne re-notifie pas · `T7` une requête **sans jeton** (`!!!`) ne produit aucune alerte · `T8` une **seconde offre** alerte de nouveau la même recherche (dédup **par offre**, pas par recherche). Résidu vérifié **0** ; branche supprimée.

### Falsifications (un test qui ne peut pas échouer ne prouve rien)

| Garde | Mutation | Résultat |
|---|---|---|
| `saved-search-alert.test.ts` | `'saved_search_match'` retiré du tuple d'insertion | **1 échec** (avant durcissement, le premier jet passait à tort : le mot apparaît aussi dans la clé de dédup) |
| `pro-plan-explained.test.ts` | motif `negotiation-open` commenté | **1 échec** |

## Décisions ouvertes (fondateur)

1. **`GUIDE-SPEC`** (entrée · guide · spotlight) reste **`blocked`** — la maquette (74 écrans) n'a **aucune** surface de guide → les 3 surfaces de l'app sont des `orphaned leaves`. **Décision A/B/C attendue** (`omni-guide-onboarding-diagnostic-2026-10-15.md`).
2. **Badge de notification non-lue / son** : la maquette n'en a **aucun** (le « Centre de notifications » est atteignable, jamais signalé). L'ajouter = **fondation neuve**, hors durcissement.
3. **Terrain** (`TT-1`/`TT-2`/Gate 7) : **EN DERNIER** (décision 2026-10-07).

## Leçon de méthode (à ne pas réapprendre)

- **Un « garde » qui cherche un mot peut passer avec le producteur retiré** : `'saved_search_match'` vit aussi dans la clé de dédup. Épingler le **tuple d'insertion**, pas le mot. C'est la 3ᵉ fois qu'un contrôle textuel a raté une forme (cf. `SP-1`/`T-12`).
- **`pattern(recherche) ~ nom` n'est pas symétrique** : dériver le motif du **nom de l'offre** aurait fait manquer toute recherche de **plus d'un mot** (« riz parfumé » → exiger le mot entier « riz parfumé »). Le motif se dérive de la **requête**, la meule est le **nom**.
- **Un commentaire SQL dans un template literal ne peut pas contenir de backtick** : `` `changed_offer` `` ferme le littéral → `TS1005` sur une ligne sans rapport (piège déjà consigné, re-frappé).
