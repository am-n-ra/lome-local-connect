-- Commercial Root: Seller offers and facility-scoped Pro metadata.
-- Additive only: existing products remain readable; new write paths must require an offer.

alter table v2_products
  add column if not exists discount_kind text,
  add column if not exists discount_value_minor integer,
  add column if not exists offer_valid_from timestamptz,
  add column if not exists offer_valid_until timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'v2_products_discount_kind_guard'
  ) THEN
    ALTER TABLE v2_products ADD CONSTRAINT v2_products_discount_kind_guard
      CHECK (discount_kind IS NULL OR discount_kind IN ('percentage', 'fixed'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'v2_products_discount_value_guard'
  ) THEN
    ALTER TABLE v2_products ADD CONSTRAINT v2_products_discount_value_guard
      CHECK (discount_value_minor IS NULL OR discount_value_minor > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'v2_products_offer_window_guard'
  ) THEN
    ALTER TABLE v2_products ADD CONSTRAINT v2_products_offer_window_guard
      CHECK (offer_valid_until IS NULL OR offer_valid_from IS NULL OR offer_valid_until > offer_valid_from);
  END IF;
END $$;

create index if not exists v2_products_active_offer_idx
  on v2_products(facility_id, publication_state, offer_valid_until);

alter table v2_facility_entitlements
  add column if not exists billing_currency text,
  add column if not exists price_minor integer,
  add column if not exists renewal_opt_in boolean not null default false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'v2_facility_entitlements_price_guard'
  ) THEN
    ALTER TABLE v2_facility_entitlements ADD CONSTRAINT v2_facility_entitlements_price_guard
      CHECK (price_minor IS NULL OR price_minor > 0);
  END IF;
END $$;

comment on column v2_products.discount_kind is 'Mandatory for new Seller product drafts: percentage or fixed.';
comment on column v2_products.discount_value_minor is 'Percentage points for percentage offers; minor currency units for fixed offers.';
comment on column v2_facility_entitlements.renewal_opt_in is 'Explicit Seller opt-in; Wallet renewal never happens silently.';
