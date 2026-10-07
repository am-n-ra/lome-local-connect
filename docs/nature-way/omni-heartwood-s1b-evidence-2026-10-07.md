# Heartwood S1b — Preuve d'exécution (PER) : QR public d'entité (S-21)

> **Porte :** Heartwood OPEN · **Commit :** _(à remplir au push)_ · **Prod :** hash à vérifier (T-07d)
> **Contrat :** `omni-heartwood-s1b-public-entity-qr-contract-2026-10-07.md`

## 1. Ce qui a été livré

Le Seed **S-21** dit : *un client en boutique scanne le **QR public de l'entité** → la transaction
passe par Omni → **remise appliquée***. Avant S1b, l'acheteur ne pouvait scanner qu'un QR **de
facilité**, et rien n'annonçait l'avantage Omni. Livré :

| Pièce | Fichier | Rôle |
|---|---|---|
| Payload/décodeur partagés | `src/trunk/entity-qr.ts` | `entityQrPayload` (vendeur) **=** `parseEntityIdFromQr` (scanner) |
| Avantage Omni | `src/trunk/entity-benefits.ts` | meilleur `%` réel, **silence** s'il n'y en a pas |
| Scanner 2 cibles | `src/components/ui/PublicQrScannerSheet.tsx` | `target: 'facility' \| 'entity'` |
| Bouton vendeur | `src/trunk/CompanyV13.tsx` | QR public **par entité** (« affichez-le en boutique ») |
| Page acheteur | `src/trunk/TrunkAppV13.tsx` | dock/menu « Scanner une entité » → page entité + « Vos avantages Omni ici » |

**Aucune nouvelle fondation** : la remise vit déjà en base (Seed S-19 `discount_percent` + trigger
`enforce_product_discount`). S1b **expose** l'avantage et **route** vers l'offre remisée.

## 2. Preuve navigateur + serveur (`npm run proof:heartwood-s1b`)

Le composant **livré** (`OmniQr`) rendu en SVG → rasterisé dans un vrai navigateur → décodé par
`jsqr` (même famille que la caméra vendeur) → relu par le parseur **partagé** → résolu par le code
serveur **livré** (`getPublicEntity`) sur la base **canonique** :

```
ok  le QR d’entité rendu se décode :: "https://omni.sparkafrika.online/?entity=c5975d63-…"
ok  le scanner acheteur en relit le bon id d’entité :: c5975d63-…
ok  négatif : le QR d’une facilité se décode mais n’est PAS une entité
ok  l’entité scannée résout par le code serveur LIVRÉ :: Omni Demo Seller Hub
    entité « Omni Demo Seller Hub » · 5 offres · avantage : −10 % sur ses offres
ok  l’avantage affiché = la remise réelle (ou silence honnête) :: −10 % sur ses offres

HEARTWOOD-S1B OK (0 échec(s))
```

**Le contrôle négatif est porteur** : un QR `?facility=` se décode mais **n'est pas** lu comme une
entité — les deux paramètres ne se confondent pas.

## 3. Gardes unitaires — falsifiés

| Garde | Prouve | Falsification (règle cassée → échecs) |
|---|---|---|
| `entity-qr.test.ts` | payload partagé, round-trip, pas de confusion entité/facilité | `entity`→autre nom : **2 échecs** |
| `entity-benefits.test.ts` | avantage réel, **silence** sans avantage | « toujours −15 % » : **2 échecs** |
| `company-qr.test.tsx` | QR vendeur rendu, pas de faux QR sans entité | bloc retiré : **1 échec** |

## 4. Non-régression

- **881 tests / 94 fichiers** (avant S1b : 872 / 91), `tsc` 0, `build` OK (`index-BfblRaqO.js`).
- 7 gardes vertes : `check:state`, `check:boundary`, `check:live-surface`, `check:docs`,
  `check:coherence`, `check:maquette`, `check:dead-css`.

## 5. Hors périmètre (dit, pas caché)

- **Application de la remise au paiement** : vit dans le flux transactionnel (l'offre porte déjà
  `prixReduit`/`pourcentageReduction`). S1b expose l'avantage et route vers l'offre remisée.
- **QR par lieu** : non modélisé (le Seed nomme le QR **de l'entité**).
- **Impression PDF** : geste navigateur, hors app.
