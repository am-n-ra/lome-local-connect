# Devise & localisation — contrat (amendement fondateur 2026-09-25)

**Date :** 2026-09-25 · **Branche :** `omni-v2-rebuild` · **Statut :** **amendement fondateur reçu, à acter**
**Déclencheur :** fondateur — « ok sans oublier que la devise dépend de localization de user donc… »

Cet amendement **corrige** ma recommandation D-CON-3. J'avais proposé « 2 500 F » comme défaut
universel. **C'est faux dès qu'on sort de Lomé** : 2 500 F n'a aucun sens pour un utilisateur au
Ghana, au Nigeria ou en Europe. La devise est **une propriété de l'utilisateur**, pas une constante.

## 1. Ce que dit déjà le dépôt (vérifié, pas supposé)

La brique existe **déjà** — elle n'est simplement **pas branchée** :

| Élément | État réel |
|---|---|
| `public.markets` (`007`+`011`+`017`) | `market_code`, `country_name`, `currency_code`, `currency_symbol`, `currency_decimals`, `languages[]`, `payment_provider`, `active` — **conçu pour ça** |
| `OMNI_DEFAULT_LOCAL_CURRENCY = 'XOF'` | **constante figée**, utilisée partout dans `TrunkAppV13` |
| `convertUsdMinorToLocal(usdMinor, currency)` | **déjà paramétré par devise** — mais appelé avec la constante, jamais avec la devise du user |
| `LOCAL_RATE_PER_USD_MINOR` | **un seul taux** (`XOF: 500`) |
| `formatMarketAmount(value, navigator.language)` | présent dans `src/components/omni-clean/*` — **code orphelin** (hors du tronc monté) |
| Base canonique `br-dawn-hill-am5amy22` | `public.markets` **n'existe pas** (migration `011` non appliquée en v2) |

**Donc : le fond est déjà prévu, il est simplement figé sur XOF.** C'est exactement le motif du
2026-09-23 (« la maquette suit le Seed ; le socle ne suit pas ») — ici, **le socle prévoit la
localisation et le code la contourne par une constante**.

## 2. Le vrai bug que ça révèle

Le filtre budget serveur compare `price_minor <= budgetMaxMinor` — **sans devise, sans conversion**
(`trunk-repository.ts`). Combiné au catalogue de démo qui **mélange XOF et USD** (9 produits estampillés
`USD` tarifés en francs), cela signifie :

> Un plafond « 2 500 F » peut être comparé à un prix libellé en dollars, **sans conversion**.
> Aujourd'hui c'est « vrai par accident » ; avec un vrai prix USD, c'est **faux en silence**.

**La devise n'est pas un détail d'affichage : c'est une unité de mesure.** Un filtre de budget sur un
corpus multi-devises sans conversion est un **filtre aveugle**.

## 3. Amendement — décisions proposées

### D-LOC-1 — La devise de référence est celle de la **localisation de l'utilisateur**
Source : le `market` de la zone de l'utilisateur (`public.markets`), pas une constante.
Repli si inconnue : `OMNI_DEFAULT_LOCAL_CURRENCY` (Lomé pilote) — **le repli reste, il cesse d'être la règle**.

### D-LOC-2 — **Une** fonction de résolution, un **seul** point d'entrée
`resolveUserCurrency(locale/market) → { currency, symbol, decimals, ratePerUsdMinor }`.
`convertUsdMinorToLocal` la consomme au lieu de la table à une entrée. **Interdiction d'appeler
`OMNI_DEFAULT_LOCAL_CURRENCY` directement dans un composant** (c'est ce qui a figé le système).

### D-LOC-3 — Le budget est **dans la devise de l'utilisateur**, et **comparé après conversion**
Le seuil saisi (« ≤ 2 500 F ») vit en devise locale. Le filtre serveur doit **convertir** le prix de
l'offre vers la devise de la requête (ou comparer des prix normalisés) — jamais comparer deux
`price_minor` de devises différentes.

### D-LOC-4 — **Afficher la devise, jamais la supposer**
Tout montant visible porte sa devise (« 2 500 F », « $5 »). Une offre dont la devise diffère de celle
de l'utilisateur affiche **les deux** (« 12 $ ≈ 6 000 F ») ou est **exclue explicitement**, jamais
silencieusement mélangée.

### D-LOC-5 — Le pilote Lomé reste en XOF, mais **par localisation, pas par constant**
Le pilote ne change pas de comportement. Ce qui change : le jour où un utilisateur hors zone Lomé
arrive, **il voit sa devise** au lieu de voir des francs.

## 4. Ce que ça change pour D-CON-3

| Avant (ma reco) | Après (amendement fondateur) |
|---|---|
| « Défaut = **2 500 F** » | « Défaut = **un montant local dérivé**, exprimé dans la devise de l'utilisateur » |
| 2 500 F comme constante | 2 500 F comme **valeur pilote XOF**, calculée depuis une base USD (`$5` ≈ 2 500 F) |

Le **p90 réel du catalogue Lomé** (2 500 F) reste le bon calibrage **pour Lomé** — mais il devient un
**paramètre de marché**, pas une constante globale.

## 5. Dette de données à traiter (indépendante)

- **9 produits `USD` tarifés en francs** dans le catalogue de démo → colonne devise **fausse**.
- `public.markets` **absente** de la branche canonique v2 → la résolution de devise n'a **pas encore**
  de source de vérité en base.

Ces deux points sont **prérequis** à D-LOC-2/D-LOC-3 : sans eux, la conversion n'a rien à lire.

## 6. Clause honnête

Cet amendement **ne code rien** : il **corrige une recommandation que j'avais donnée trop vite**.
Ma proposition « 2 500 F universel » était juste pour Lomé et **fausse comme règle** — le fondateur
l'a vue avant moi. La leçon est consignée : **un défaut monétaire n'est pas une constante, c'est une
localisation.** Tant que D-LOC-1…5 ne sont pas actées, le budget reste un filtre aveugle sur un
corpus multi-devises.
