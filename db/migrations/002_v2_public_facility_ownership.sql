-- Omni V2 Roots correction
-- Public-imported and unclaimed facilities exist before any seller account claims them.
-- Keep the owner nullable until certification/claiming is completed.

alter table v2_facilities
  alter column account_id drop not null;
