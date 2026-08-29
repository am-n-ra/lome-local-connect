-- PR 3 ─ Omni v3 product model (name, stock_loué_omni, prix_original, prix_réduit, %réduction).
--
-- v2_products keeps its physical storage columns (price_minor, discount_kind,
-- discount_value_minor, quantity_allocated_omni) but the v3 model enforces the
-- invariants through CHECK constraints:
--   * every product carries a NON-NULL mandatory percentage reduction (1..90);
--   * every product has a non-negative Omni-rented stock (quantity_allocated_omni);
--   * the discounted price (prix_réduit) is always strictly below prix_original.
--
-- The repository layer maps these columns to the v3 PublicProduct fields
-- (prixOriginal / prixReduit / pourcentageReduction / stockLoueOmni) and the
-- search layer honours quantity_allocated_omni when filtering availability.

-- Drop the legacy free-form discount kind: v3 uses one mandatory percentage form.
alter table v2_products drop constraint if exists v2_products_discount_kind_check;
alter table v2_products drop constraint if exists v2_products_discount_value_minor_check;
alter table v2_products drop constraint if exists v2_products_quantity_allocated_omni_check;

alter table v2_products
  add constraint v2_products_amount_nonnegative_check
    check (price_minor >= 0);

-- Mandatory percentage reduction: every product must be discounted 1..90%.
alter table v2_products
  add constraint v2_products_v3_discount_check
    check (discount_kind = 'percentage' and discount_value_minor is not null and discount_value_minor between 1 and 90);

-- Mandatory Omni-rented stock (stock_loué_omni), non-negative.
alter table v2_products
  add constraint v2_products_v3_stock_check
    check (quantity_allocated_omni is not null and quantity_allocated_omni >= 0);

-- The discounted price must always be strictly below the original price.
alter table v2_products
  add constraint v2_products_v3_discount_below_price_check
    check (price_minor - floor(price_minor * discount_value_minor / 100.0) < price_minor);
