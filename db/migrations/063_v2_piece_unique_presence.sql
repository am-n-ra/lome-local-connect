-- Omni V2 — S-01 / S-02 : une pièce unique est une PRÉSENCE, pas un stock.
--
-- Mesure canonique avant écriture (2026-09-27) :
--   uniqueness_kind = null         → 13 lignes (11 avec stock > 1, jusqu'à 40)
--   uniqueness_kind = renouvelable →  3 lignes (3 avec stock > 1, jusqu'à 24)
--   uniqueness_kind = piece_unique →  0 ligne
--
-- Conséquence : la contrainte s'applique SANS réécrire une seule ligne existante. Les offres
-- héritées (NULL) sont GRANDFATHÉRÉES explicitement — `uniqueness_kind is distinct from
-- 'piece_unique'` est vrai pour NULL, donc aucune ligne héritée n'est touchée ni refusée. C'est
-- délibéré : une migration ne réécrit pas au passage le sens d'offres qui n'ont jamais déclaré
-- leur nature. Le jour où un vendeur déclare « pièce unique », la règle s'applique.
--
-- Défense en profondeur : le serveur refuse déjà 2+ (UNIQUENESS_INCOHERENT_STOCK). Cette
-- contrainte est le filet qui survit à un appel direct à la base ou à un futur chemin de code.
--
-- Idempotente : `drop constraint if exists` avant `add constraint` (pattern 012).

alter table v2_products drop constraint if exists v2_products_piece_unique_stock_check;

alter table v2_products
  add constraint v2_products_piece_unique_stock_check
  check (
    uniqueness_kind is distinct from 'piece_unique'
    or quantity_allocated_omni in (0, 1)
  );

comment on constraint v2_products_piece_unique_stock_check on v2_products is
  'S-01 : une pièce unique se déclare 0 (retirée) ou 1 (présente) — jamais plusieurs exemplaires. NULL héritées grandfathérées.';
