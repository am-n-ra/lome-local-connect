-- Omni V2 — FF-8 / D-TXN-7 : réservation de stock.
-- Décision fondateur (2026-09-16) : « réserver à l'intention, libérer à
-- l'expiration, décrémenter à la clôture » — sans cela = survente.
--
-- `quantity_allocated_omni` reste le stock déclaré par le vendeur ; la
-- disponibilité réelle devient `quantity_allocated_omni - quantity_reserved_omni`.
-- Le compteur `quantity_reserved_omni` est un compteur de réservations vivantes
-- (intentions actives non expirées, transactions non clôturées).
--
-- Pas de CHECK `reserved <= allocated` : un vendeur peut légitimement réduire son
-- stock déclaré sous le niveau déjà réservé ; la disponibilité devient alors 0
-- sans invalider les réservations tenues. Additive + idempotente.

alter table v2_products
  add column if not exists quantity_reserved_omni integer not null default 0
    check (quantity_reserved_omni >= 0);

comment on column v2_products.quantity_reserved_omni is
  'Unités tenues par des transactions vivantes (FF-8/D-TXN-7). Disponibilité réelle = quantity_allocated_omni - quantity_reserved_omni.';

create index if not exists v2_products_reserved_idx
  on v2_products (facility_id)
  where quantity_reserved_omni > 0;
