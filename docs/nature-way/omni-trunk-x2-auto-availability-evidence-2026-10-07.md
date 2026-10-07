# TRUNK-X2 — Automatisation vendeur (disponibilité auto depuis le stock alloué) : preuve

> **Porte :** Trunk OPEN. **Autorité :** `/nature-way`. **Décision fondateur :** « construire ».
> **Contrat :** `omni-trunk-x2-auto-availability-contract-2026-10-07.md`. **As of :** 2026-10-07.

## Livré

| Couche | Détail |
|---|---|
| Migration `068_v2_auto_availability.sql` | `v2_products.auto_availability boolean not null default false` + `v2_reconcile_auto_availability()`. Additive, idempotente. |
| Repo | `setProductAutoAvailability({authUserId, productId, enabled})` (Pro, réconcilie à l'activation) ; `refreshProductAvailability({authUserId, productId})` (Pro + auto). |
| HTTP | `POST /api/v2/seller/catalogue/:id/auto-availability` (body `{enabled}`) ; `POST /api/v2/seller/catalogue/:id/availability/refresh`. |
| Client/types | `setProductAutoAvailability` / `refreshProductAvailability` + `AutoAvailabilityResult` / `AutoAvailabilityRefreshResult` ; `SellerCatalogueProduct.autoAvailability`. |
| UI (`SellerV13`) | Carte **« Automatisation · disponibilité (Pro) »** — bascule ON/OFF par offre, « Actualiser » (met à jour depuis le stock). Libellé honnête : bientôt manuel, vérifié = confiance. |
| Réconciliation opportuniste | appelée en tête de `listSellerCatalogue`, à parité avec la fraîcheur D-03. |

## Règles honorées (le contrat)

1. **Dérivé du stock** : `allocated − reserved > 0` → `en_stock`, sinon `a_valider`.
2. **`bientôt` reste MANUEL** — jamais écrasé (un état humain ne se déduit pas du stock).
3. **`verifie` n'est jamais écrit par l'auto** (palier de confiance S-06, pas un état de stock).
4. **`piece_unique`** : capacité 1 (R-G) — dispo si `allocated ≥ 1 et reserved < 1`.
5. **Fenêtre de fraîcheur unique** : `availability_expires_at = now() + 24 h` (D-03).
6. **Garde Pro (D-04 / R-4b)** : entitlement **vivant** (`state='active' and ends_at > now()`), lieu **ou** entité.
7. **Traçabilité** : chaque transition écrit `v2_product_stock_events` (`source='auto'`, `reason='auto_from_stock'`).

## Preuve sur branche jetable (SQL réel)

`scripts/prove-v2-auto-availability.mjs` — branch `br-jolly-waterfall-am7y8kph` (jetable, supprimée).
**9/9 PASS** : fixtures + T1 (stock → en_stock, expiry 24 h, tracé) + T2 (réservé → a_valider) +
T3 (`bientôt` préservé) + T4 (pièce unique) + T5 (sans Pro → aucun auto) + T6 (rejeu no-op) +
T7 (seam repo = activation + réconciliation).

**Falsification genuine** : fonction mutée (garde `bientôt` retirée + règle pièce unique retirée)
→ **1 FAIL** (T3 `bientôt` devient `en_stock`). Restaurée → 9/9. La règle est load-bearing.

## Appliqué en canonique

`br-dawn-hill-am5amy22` : colonne + fonction présentes, registre `omni_schema_migrations` inscrit
(checksum `da5b2e63…25dd28`), **0 offre optée** (`auto_availability = true` → 0) — aucune réécriture silencieuse.

## Suite

**843/843 tests** (85 fichiers, +7 X2), `tsc` clean, **8 gardes** verts, 12 bundles serverless régénérés.

## Résidu honnête

- Pas de planificateur async : réconciliation **opportuniste** (à parité fraîcheur D-03). Un cron
  dédié serait un ajout séparé si le fondateur veut une cadence garantie.
- « Décompte sur vente » n'est **pas** une boucle séparée : le décompte suit FF-8 (réservation/clôture) ;
  l'auto **relit** le stock, elle ne le duplique pas. La maquette montre les deux comme Pro ; le contrat
  les unifie — à re-valider fondateur si un écran « décompte » dédié est souhaité.
- Preuve navigateur de la carte (session vendeur réelle) non exécutée (sandbox).
