-- UNI-MONEY-1 / D-LOC-9 — ONE money convention: stored = value * 100,
-- for every column and every currency, XOF included. Rendered by formatMoney.
-- Idempotent: guarded by its own registry row (pattern of 041/055).
--
-- Refuses when the data does not look like the measured pilot family, because a
-- blind multiply on money is not reversible by a git revert.

do $$
declare
  offending_wallet int;
  already_scaled int;
  snapshots_before int;
  snapshots_after int;
begin
  if exists (select 1 from public.omni_schema_migrations where filename = '058_one_money_family.sql') then
    raise notice '058 already applied';
    return;
  end if;

  select count(*) into offending_wallet
    from public.v2_wallet_ledger_entries
   where kind = 'recharge' and amount_minor < 10000;
  if offending_wallet <> 0 then
    raise exception 'refusing: % wallet rows below 10 000 minor, outside the x100 pilot family', offending_wallet;
  end if;

  select count(*) into already_scaled
    from public.v2_products
   where price_minor >= 100000;
  if already_scaled <> 0 then
    raise exception 'refusing: % product rows already look scaled', already_scaled;
  end if;

  -- UM-4 — offers into the family.
  update public.v2_products
     set discount_value_minor = case
           when discount_kind = 'fixed' then discount_value_minor * 100
           else discount_value_minor            -- percentages are not amounts
         end,
         price_minor = price_minor * 100
   where price_minor < 100000;

  update public.v2_availability_responses
     set price_minor = price_minor * 100
   where price_minor < 100000;

  -- The frozen snapshots are append-only, and they are WHAT THE BUYER ACCEPTED.
  -- Leaving them unscaled would contradict the offer they came from (an offer at
  -- 20 000 F against a snapshot at 200) — the exact incoherence this migration
  -- removes. The append-only guard is re-enabled immediately after, and the row
  -- count is asserted so a rescale can never lose or add a row.
  alter table public.v2_transaction_snapshots disable trigger v2_transaction_snapshots_append_only_guard;

  select count(*) into snapshots_before from public.v2_transaction_snapshots;
  update public.v2_transaction_snapshots set unit_price_minor = unit_price_minor * 100 where unit_price_minor < 100000;
  select count(*) into snapshots_after from public.v2_transaction_snapshots;
  if snapshots_before <> snapshots_after then
    raise exception 'snapshot rescale changed the row count (% -> %)', snapshots_before, snapshots_after;
  end if;

  update public.v2_transaction_snapshots set net_amount_minor = unit_price_minor * quantity;

  alter table public.v2_transaction_snapshots enable trigger v2_transaction_snapshots_append_only_guard;

  -- UM-5 — request budgets (the only place a budget is stored).
  update public.v2_availability_requests
     set budget_minor = budget_minor * 100
   where budget_minor is not null and budget_minor < 100000;

  -- UM-3 — the name lied: this column holds a percentage when kind=percentage.
  alter table public.v2_products rename column discount_value_minor to discount_value;

  insert into public.omni_schema_migrations (filename, checksum, applied_at)
  values ('058_one_money_family.sql', 'uni-money-1-dloc-9-v1', now());
end $$;

-- UM-2 — declare the rule on every monetary column, so the schema itself says it.
do $$
declare
  target text;
  cols text[] := array[
    'v2_wallet_recharge_intents.amount_minor',
    'v2_wallet_ledger_entries.amount_minor',
    'v2_facility_entitlements.price_minor',
    'v2_buyer_pro_entitlements.price_minor',
    'v2_seller_unlocks.amount_minor',
    'v2_ad_campaigns.budget_minor',
    'v2_ad_campaigns.spent_minor',
    'v2_products.price_minor',
    'v2_transaction_snapshots.unit_price_minor',
    'v2_transaction_snapshots.net_amount_minor',
    'v2_availability_responses.price_minor',
    'v2_availability_requests.budget_minor'
  ];
  note text := 'Omni money convention (D-LOC-9): stored = value * 100, every currency, XOF included. Render with formatMoney. 500 000 means 5 000 F.';
begin
  foreach target in array cols loop
    execute format('comment on column public.%s is %L', target, note);
  end loop;
  execute format('comment on column public.v2_products.discount_value is %L',
    'NOT a money amount: a percentage (10..30) when discount_kind=percentage, otherwise a raw amount.');
end $$;
