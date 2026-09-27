# Devise d'affichage des offres — la localisation, tenue honnêtement (2026-09-27)

> **ID :** `D-LOC-RENDER-2026-09-27`
> **Ordre fondateur :** « go pour la devise, on montre à l'user la devise selon sa localisation. »
> **Branche :** `omni-v2-rebuild` · **Base canonique :** `br-dawn-hill-am5amy22`

---

## 1. Le défaut, mesuré

`TrunkAppV13.tsx:171` résout la devise du **visiteur** :

```ts
resolveUserCurrency({ locale: navigator.language })   // sans ligne marché
```

Sur un navigateur `en-US`, `marketKeyForLocale('en-US')` résout le marché **US**
(`currency: 'USD', decimals: 2, symbol: '$'`). Puis une offre dont le prix vaut **720
unités mineures XOF** — c'est-à-dire **720 FCFA** — était rendue avec cette devise :

```ts
formatAmount(product.prixReduit, userCurrency)   // 720 → « 7,20 $ »
```

Le montant n'était **jamais converti** : il était **relabellisé**. L'erreur est égale au
rapport entre les deux devises.

| Observateur | Avant | Attendu |
|---|---|---|
| `fr` (Lomé) | « 720 F » ✅ | « 720 F » |
| `en-US` | « 7,20 $ » ❌ | « 720 F » |

## 2. La règle appliquée — et pourquoi ce n'est PAS celle du plan

L'énoncé initial de la tâche disait : « les prix produits sont en XOF (ligne 16 de types.ts) ».
**C'est faux** : la ligne 16 dit « ISO code of the currency `budgetMaxMinor` is expressed in ».
Le vrai fait est que **`PublicProduct` porte déjà sa devise** (`types.ts:66`,
`currency: string`), peuplée depuis `p.currency` par la requête (`trunk-repository.ts:2117`).
Les prix démo sont d'ailleurs **stockés en XOF brut** : les transactions réelles le prouvent
(`v2_transaction_snapshots.unit_price_minor = 6500` pour un produit à **6 500 F**).

**Conséquence :** il n'y a **rien à convertir**. Il faut lire la devise de l'offre et **ne pas**
la remplacer par celle du visiteur. C'est exactement la règle `D-LOC-3` (« ne jamais comparer
deux devises différentes silencieusement ») appliquée au **rendu**.

### Livré

`src/domain/currency.ts` — nouvelle fonction pure :

```ts
currencyFor(fact?: string | null): ResolvedCurrency
```

- lit le code que **l'offre** porte ; `source: 'offer'` ;
- code absent → repli pilote (`XOF`), **jamais** un marché inventé ;
- code inconnu → affiché **tel quel** (jamais échangé en silence contre une devise connue) ;
- **ne convertit pas** — la limite est délibérée et documentée dans le code.

`src/trunk/TrunkAppV13.tsx` — les **trois** sites d'affichage d'offre passent désormais par
`currencyFor(...)` : la liste bulk (`dès …`), la fiche facilité, les offres d'entité. La liste
bulk prend maintenant le produit le moins cher avec **sa** devise (avant : `Math.min` sur des
montants mêlés, affichés dans la devise du visiteur).

### Deux défauts de la même classe, trouvés en vérifiant

| Fichier | Défaut | Correctif |
|---|---|---|
| `OffersV13.tsx:26` | **division par 100** (`prixReduit / 100`) **et** remise appliquée **deux fois** (`prixReduit × (1 − pct/100)`) | affiche `prixOriginal` et `prixReduit` formatés, sans re-remise |
| `ProductCatalogueV13.tsx:127` | **division par 100** (`(prixReduit / 100).toFixed(2)`) | `formatAmount(prixReduit, currencyFor(currency))` |

Les deux fichiers sont **vivants** (`check:live-surface` confirme 65 fichiers de production
atteignables). Donc un prix de 6 500 F s'affichait « 65.00 XOF » chez le vendeur.

## 3. Preuve

**Tests** (`src/domain/currency.test.ts`, +3) : **561/561** (avant : 558), tsc clean, 6 gardes PASS.

**Falsification — les tests échouent-ils si l'on remet le bug ?** Oui. En forçant `currencyFor`
à rendre la résolution du visiteur `en-US` (le comportement d'origine), **2 tests échouent** :

```
× renders a XOF-stored offer as XOF even for a US-locale viewer
× falls back to the pilot currency rather than inventing a market
Tests  2 failed | 11 passed
```

Le contrat est donc réellement capturé, pas décoré. (Code restauré après la falsification.)

## 4. ⚠️ Ce qui n'est PAS fait — et qui touche l'argent réellement débité

Cette tranche corrige **l'affichage**. Une **seconde** incohérence existe, plus grave, et
**n'est pas** dans son périmètre :

**Le prix Pro facturé est incohérent avec le prix Pro annoncé.**

- `src/domain/pricing.ts` : `sellerPro: 1000` USD-minor ; `convertUsdMinorToLocal(1000, 'XOF')`
  → **500 000** ; la dérivation documentée dit « $10 → **5 000 F** → 500 000 minor ».
- `formatAmount(500000, XOF)` (decimals 0) → « **500 000 F** ».
- Le helper `money()` d'`TrunkAppV13` divise par 100 → « **5 000 F** ».
- **Deux formateurs, deux montants** pour la même valeur, dans le même écran.
- En base, l'entitlement démo porte `price_minor = 500000` et le ledger un débit
  `facility_pro_spend = 500000` : le wallet a bien été **débité de 500 000 minor**.

La même ambiguïté affecte le wallet : recharges et packs sont stockés ×100
(`amount_minor = 600000` pour **6 000 F**), tandis que les offres sont stockées en **FCFA brut**
(`price_minor = 6500` pour **6 500 F**). **Deux conventions d'unité coexistent.**

**Ce n'est pas une correction d'affichage : c'est une clarification de convention monétaire et
une vérification de ce qui est débité.** Elle exige une décision fondateur (voir ci-dessous),
donc **aucun code n'a été écrit** dessus.

## 5. Décisions fondateur requises

| # | Question |
|---|---|
| **D-LOC-6** | L'unité mineure est-elle **canonique** (« amount_minor = montant × 100 partout », y compris XOF) ou **par famille** (wallet/plans ×100, offres en FCFA brut) ? Une seule réponse doit valoir pour tout le trunk. |
| **D-LOC-7** | Le prix Pro doit-il être affiché à **5 000 F** (`money()`) ou **500 000 F** (`formatAmount`) ? Et le montant **réellement débité** doit-il valider cette valeur ? |
| **D-LOC-8** | À terme, faut-il **convertir** dans la devise du marché (afficher `720 F` comme `≈ 1,44 $`), ou **montrer la devise d'origine** ? Aujourd'hui : devise d'origine (honnête, zéro invention). La conversion exige une source FX — `normaliseMinor` est le point d'accroche. |

**Résidu honnête :** la preuve de rendu a été faite par le **contrat** (tests) et par la lecture
du code réellement servi ; le **visuel navigateur** de la fiche à devise non-Lomé n'a pas été
recapturé après ce correctif (le sandbox résout `fr`). À confirmer au prochain spot-check.
