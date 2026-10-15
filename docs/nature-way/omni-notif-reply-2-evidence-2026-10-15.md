# NOTIF-REPLY-2 — « le vendeur ne peut TOUJOURS pas répondre » (preuve)

> **Gate :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`)
> **Plan :** `NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01` · tâche `NR-3`
> **Date :** 2026-10-15 · **Branche :** `omni-v2-rebuild`
> **Priorité fondateur :** « seller is still unable to reply to availability request »

## 1. Ce que le fondateur voyait, et ce qui se passait réellement

Le fondateur dit que le vendeur **ne peut toujours pas répondre**, alors que `NR-1` (visibilité
d'une demande DÉJÀ répondue) était livré. `NR-1` traitait le cas « j'ai répondu et rien ne change ».
Ici, la réponse **échoue avant d'exister**. Deux défauts réels, reproduits sur la base canonique.

### Défaut A — le formulaire partait VIDE, donc le serveur refusait tout

`SellerReplyV13` initialisait chaque brouillon à `{ status: 'available', quantity: '', price: '' }`.
Le serveur (`respondAvailability`) exige une **quantité positive** et un **prix non négatif** :

> `An available or partial response requires a positive quantity and non-negative price.`

Un vendeur qui cliquait « Envoyer la réponse » sans re-taper la quantité et le prix (que le
formulaire ne montrait pas) recevait un refus. **Rien n'était pré-rempli.**

### Défaut B — un refus de STOCK accusait le vendeur d'AUTORISATION

`respondAvailability` construit sa requête autour d'un CTE `eligible` qui combine **autorisation**
ET **garde de stock** :

```sql
and ${input.quantityAvailable} <= greatest(p.quantity_allocated_omni - p.quantity_reserved_omni, 0)
```

Quand `eligible` est vide, l'ancien code levait **toujours** le même message :

> `The seller is not authorized for this request, facility or product.`

Donc un vendeur **légitime** qui répondait « Disponible × 3 » alors que son stock réel est **1**
s'entendait accuser d'autorisation. Le vrai motif (le stock) n'était jamais nommé.

## 2. Mesure sur la base canonique `br-dawn-hill-am5amy22`

| Fait mesuré | Valeur |
|---|---|
| Compte vendeur | « Soja zozo » `1d264990-…` (auth `a924686b-…`), `seller_ready`, non suspendu |
| Produit | « Riz au soja » `2f50b789-…`, `quantity_allocated_omni = 1` → stock offertable **1** |
| Demande vivante | `05853c57-…` **demande 3**, statut `submitted` |
| `respondAvailability(qty=3)` | **FAIL** → `AvailabilityResponsePolicyError` « not authorized » |
| `respondAvailability(qty=1)` | **OK** (réponse persistée) |

La même action (répondre) réussissait à `qty=1` et échouait à `qty=3` **sous un message
d'autorisation**. Le vendeur ne pouvait pas deviner que la limite était le stock.

## 3. Correctif

### 3.1 Le serveur nomme le vrai motif (chemin d'échec uniquement)

Quand `eligible` est vide, un **diagnostic** (`context_ok`, `available_stock`) est lu **une seule
fois**, sur le chemin d'échec. Si le contexte est légitime mais que la quantité dépasse le stock :

> `The offered quantity exceeds the available stock (1). Reduce the quantity or reply partial.`

Sinon le message d'autorisation est conservé. **Aucun impact sur le chemin de succès.**

### 3.2 La file vendeur porte le stock réel et le prix affiché

`getSellerAvailabilityQueue` expose désormais, **dérivés au read** (jamais stockés) :

- `availableStock = greatest(quantity_allocated_omni - quantity_reserved_omni, 0)` — la même
  vérité de stock que la garde serveur et que FF-8 ;
- `listedPriceMinor` — le prix affiché de l'offre.

### 3.3 Le formulaire part d'un état réellement envoyable

`defaultSellerReply` (fonction pure, `ui-helpers.ts`) : quantité = **min(demande, stock)**, statut
`available` si le stock couvre la demande sinon `partial`, prix = prix affiché. Stock nul ⇒ seule
« Indispo » est proposée. Le vendeur **ajuste** s'il veut ; il ne peut plus viser au-delà de
l'existant. La carte nomme la limite (« Stock offertable : 1, inférieur aux 3 demandés »).

### 3.4 Le client refuse localement avec le vrai motif

`submit` vérifie quantité (entier ≥ 1), plafond de stock, prix ≥ 0 **avant** l'appel réseau, avec
un message qui dit la limite réelle — au lieu de laisser le serveur répondre « not authorized ».

## 4. Preuves

| Preuve | Résultat |
|---|---|
| **Preuve A/B sur Postgres réel** (`npm run proof:notif-reply-2`, branche jetable `br-holy-mountain-am00c2fv` créée depuis la canonique puis **supprimée**) | **6/6 PASS** — T1/T1b file vendeur expose `availableStock=1` + `listedPriceMinor=100000` ; T2/T2b dépassement de stock → **« exceeds the available stock (1) »** (message d'autorisation **absent**) ; T3 réponse dans le stock persistée ; T4 étranger garde le motif d'autorisation |
| **Falsification de la preuve** | ancien code restauré → **T2 + T2b ÉCHOUENT** (`« not authorized »`) ; corrigé → 6/6 |
| Garde UI `SellerReplyV13.test.tsx` (6 tests) | pré-remplissage (stock < demande, stock ≥ demande, stock nul) + visibilité NR-1 |
| **Falsification UI** | ancien formulaire vide restauré → **3/6 ÉCHOUENT** ; restauré → 6/6 |
| Garde repo `trunk-repository.test.ts` (+2) | motif stock nommé ; motif autorisation conservé quand le contexte n'est pas détenu |
| **Falsification serveur** | diagnostic retiré → **1 ÉCHEC** ; restauré → 224/224 |
| Garde pur `ui-helpers.test.ts` (+5) | `defaultSellerReply` : borné par le stock, jamais au-delà, prix null ⇒ vide |
| Suite complète | **1245/1245** (151 fichiers) ; `tsc` 0 ; 6 gardes vertes (`state/docs/coherence/boundary/live-surface/maquette`) |
| Bundles serverless | 12 régénérés dans le **même** commit (leçon `9c3f5d8`) ; le message de stock est présent dans `api/v2/availability.js` |

**Zéro migration** : tout est dérivé au read (`S-06`/`S-32` restent dérivées, invariant I-3).
Aucune écriture sur la base canonique n'a été nécessaire ; la preuve A/B a tourné sur branche
jetable, **supprimée** après usage.

## 5. Ce qui reste honnêtement ouvert

- Le **stock réel de la démo est 1** pour « Riz au soja » : le vendeur ne peut donc répondre
  « Disponible × 3 ». Le correctif rend cette limite **visible et nommée** ; il ne crée pas de
  stock. Si le fondateur veut démontrer une réponse pleine, il faut allouer ≥ 3 à l'offre.
- La preuve est **unitaire + base réelle sur branche jetable** ; la preuve **navigateur de la
  session vendeur réelle** reste pour le prochain spot-check (sandbox sans session).
