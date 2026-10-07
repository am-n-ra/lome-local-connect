# TRUNK-X2 — Automatisation vendeur : la disponibilité répond depuis le stock alloué (Pro)

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** `/nature-way`.
> **Plan local :** `NW-PROD-OMNI-TRUNK-02`. **As of :** 2026-10-07.
> **Décision fondateur :** inventaire §7 n°2 — **« construire »**.

## Le manque (mesuré)

La maquette V2 porte deux écrans Pro **sans aucun modèle de données** :
`SHEETS['seller-automation']` (« Disponibilité automatique / Décompte sur vente /
Confirmation de fraîcheur auto — OFF · Pro ») et `fraicheur` (« le badge vieillit :
mis à jour par le vendeur **ou automatiquement, entité Pro** »). Le Seed le fonde :
« sait si l'offre est **disponible maintenant** (réponse vendeur, **ou auto depuis le
stock alloué**) dans une **fenêtre de fraîcheur** » (A-3, « non testé »).

L'app : `availability_state` n'est mis à jour que **manuellement**
(`setProductAvailability`, D-04 Pro) ou **expiré** vers `a_valider`
(`v2_expire_stale_availability`, D-03). **Aucun chemin n'écrit une disponibilité
« vivante » depuis le stock.** Une capacité Pro promise à l'écran, jamais construite.

## Le modèle retenu (R-6, décision fondateur)

**La disponibilité automatique dérive le badge de l'offre depuis le stock alloué** —
jamais un jugement de l'acheteur.

1. **Ce qui est automatique :** *offre transactable → `en_stock`*, *offre publiée sans
   stock disponible → `a_valider`*. Un seul état dérive du stock : `en_stock`.
2. **Ce qui reste manuel (jamais écrasé) :** `bientot` (arrivage annoncé) — un état
   **humain** qui ne se déduit pas du stock. Le reconciler ne touche **pas** `bientot`.
3. **`verifie` n'est pas un état de stock** : c'est un palier de **confiance** (S-06).
   L'auto écrit `en_stock`, jamais `verifie`.
4. **Source unique de quantité :** `greatest(allocated − reserved, 0)` (FF-8). Une
   `piece_unique` a une capacité de 1 (R-G) : disponible si `allocated ≥ 1 et reserved < 1`.
5. **Fenêtre de fraîcheur unique :** la réconciliation pose
   `availability_expires_at = now() + 24h` (D-03 : 4 h frais / 24 h expiré). Le décompte
   sur vente suit l'événement de stock ; la confirmation de fraîcheur est le balayage.
6. **Garde Pro (D-04) :** auto = Pro. La capacité se juge sur l'**entitlement vivant**
   (`state='active' and ends_at > now()`, lieu **ou** entité — R-4b), jamais sur la
   colonne `commercial_plan`.
7. **Traçabilité :** chaque transition écrit un `v2_product_stock_events`
   (`source='auto'`, `reason='auto_from_stock'`) — même journal que la fraîcheur.

## Contrat (Root)

| Objet | Détail |
|---|---|
| Colonne | `v2_products.auto_availability boolean not null default false` (additive) |
| Fonction | `v2_reconcile_auto_availability()` — réconcilie les offres `auto_availability` d'entitlements vivants ; appelée opportuniste comme la fraîcheur |
| Repo | `setProductAutoAvailability({authUserId, productId, enabled})` (Pro) ; `refreshProductAvailability({authUserId, productId})` (Pro + auto) |
| HTTP | `POST /api/v2/seller/catalogue/:id/auto-availability` (body `{enabled}`) ; `POST /api/v2/seller/catalogue/:id/availability/refresh` |
| Client | `setProductAutoAvailability` / `refreshProductAvailability` + type `AutoAvailabilityResult` |
| UI | carte **Automatisation** dans l'espace vendeur : bascule ON/OFF par offre (Pro), « mettre à jour maintenant », libellé honnête |

## Non-goals

- Pas de « décompte sur vente » séparé : le décompte suit FF-8 (réservation) et l'événement
  de clôture — l'auto relit le stock, elle ne duplique pas le décompte.
- Pas de planificateur async : réconciliation **opportuniste** (comme la fraîcheur D-03).
- Pas de `verifie` automatique, pas de `bientot` automatique.
