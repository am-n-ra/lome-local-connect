# Preuve — DS-4 : fidélité / acte (DOCK-01, OPT-01, OPT-02, MENU-03)

> **Slice :** `NW-PROD-OMNI-DOCK-01` (Trunk, porte `ROOT_CLOSED_TRUNK_OPEN`).
> **As of :** 2026-10-06 (UTC). **Autorité visuelle :** `docs/maquette/omni-species-v2-interactive.html`.
> **Décision fondateur (DS-2) :** option **(b)** « acter l'avance de l'app, combler le fond ». `DS-4` = **acter** ce que l'app fait mieux, **corriger** le vocabulaire qui a dérivé.

---

## A. Acté (décision, aucun code) — l'app est **volontairement en avance**

### `DOCK-01` — rolepill = rôles possédés, jamais les 4 d'office
**Acté : l'app a raison.** La maquette affiche les 4 rôles « pour la démo ». L'app n'affiche que les rôles **réellement possédés** (`eligibleRoles`, capability serveur — D-06 : une identité + un basculement de capacité). Afficher un rôle non possédé serait un **mensonge** : il mènerait à un espace vide. **Aucune correction** ; l'écart est une **simplification de démo**, pas un défaut produit.

### `OPT-01` — 6 portées de rayon (l'app) vs 4 groupées (maquette)
**Acté : l'app a raison** (`D-CON-4`). L'app expose **6 portées** : `1 km (quartier) / 5 / 10 / 25 km (ville) / 100 km (région) / Monde entier` (`RAYON_SCOPE_LABELS`), câblées sur `rayon_km` réel. La maquette groupe en 4. La granularité fine **sert l'acheteur** et reste **une seule** commande de distance (pas de doublon). **Aucune correction.**

---

## B. Corrigé (vocabulaire qui avait dérivé)

### `OPT-02` — les kickers de famille passent de `.label` à `.eyebrow`
**Dérive mesurée :** les en-têtes de famille (`CONSTRAINT_GROUPS` : Disponibilité / Votre besoin / Attributs d'offre) et `Portée de recherche` / `Filtres actifs` étaient rendus en **`.label`** (8,5px, casse normale, 700) alors que `design.md` §38 réserve **`.eyebrow`** (8px, majuscules, tracking 1,1px) aux « small caps kicker above sheet titles » — et la maquette les rend en `.eyebrow` (`omni-species-v2-interactive.html:484/491`).

**Corrigé :** `TrunkAppV13` rend ces kickers en `className="eyebrow"`. La règle CSS scopée devenue morte (`.sheet[data-sheet="search"] .constraint-zone .label`) est **retirée** (sinon `check:dead-css` rougirait — un correctif de vocabulaire ne doit pas laisser un token orphelin).

### `MENU-03` — en-tête de menu aligné sur la maquette
**Dérive mesurée :** app = eyebrow `Espace` + h1 `Espace acheteur/vendeur/équipe` ; maquette (`:763-764`) = eyebrow `Menu · <Rôle>` + h1 `Tout Omni, depuis ici`.

**Corrigé :** eyebrow **`Menu · Acheteur | Vendeur | Équipe`** + h1 **`Tout Omni, depuis ici`**. Le chip de rôle à droite (`.status`) est conservé — redondance utile, pas un défaut.

---

## C. Preuves

| Type | Résultat |
|---|---|
| **Garde falsifiable** | `scripts/check-dock-search.mjs` — **8 règles** (2 neuves : `menu-03-header`, `opt-02-kicker`), `--selftest` → **8/8 falsifiées**, source réelle clean ; `npm run check:dock-search` **PASS** |
| **Navigateur (Playwright, 4 largeurs)** | `scripts/prove-ds3-dock-sort.mjs` — dock + tri **PASS** ; en-tête menu `Menu · Acheteur` / `Tout Omni, depuis ici` **4/4** ; kickers contraintes **4 eyebrow / 0 label** (≥1280, gated) |
| **Prod réelle (`omni.sparkafrika.online`, vraie DB)** | même script : **4 largeurs PASS** — en-tête menu conforme, kickers `4 eyebrow / 0 label`, 20 résultats, sortbar, « dès 25 500 F ». **Hash prod `index-DYPk8L3_.js` sha256 `0352a635…` === build local (T-07d ✅)** ; déploiement GitHub `8c4e163` |
| **Suite** | **790/790**, `tsc` clean |
| **Gardes repo** | boundary · state · docs · coherence · maquette · live-surface · dead-css · dock-search = **8/8 PASS** |
| **Bundles serverless** | **0 modifié** (correctif 100 % client) — cohérent |

## D. Reste (post-DS-4)

`DOCK-04` (dock vendeur `Mon espace / Scanner le code d'un acheteur / Menu`), `DOCK-05` (Retour contextuel), `MENU-02` (noms buyer), `SEARCH-02` (fraîcheur état-codée, D-03), `SEARCH-03` (lien saved) — tranches suivantes ; **écrans terrain opérateur** (`op-queue/op-visit/op-report/op-side`) et `seller-automation` restent les **réels absents** (registre §2).
