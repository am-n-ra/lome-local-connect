-- Bounded, explicitly authorized Root proof fixture.
-- Persistent V2 only. Never run against production/default.
-- No Auth row is created, deleted or modified; one existing unlinked demo-like Auth identity is bound.

insert into public.v2_accounts (id, auth_user_id, onboarding_state)
select
  '10000000-0000-0000-0000-000000000101'::uuid,
  u.id::text,
  'seller_ready'
from neon_auth."user" u
where (lower(u.name) like '%demo%' or lower(u.email) like '%demo%')
  and not (lower(u.name) like '%buyer%' or lower(u.email) like '%buyer%')
  and not exists (
    select 1 from public.v2_accounts a where a.auth_user_id = u.id::text
  )
  and not exists (
    select 1 from public.v2_accounts a where a.id = '10000000-0000-0000-0000-000000000101'::uuid
  )
order by
  case when lower(u.name) like '%seller%' or lower(u.email) like '%seller%' then 0 else 1 end,
  u."createdAt",
  u.id
limit 1
on conflict (id) do nothing;

insert into public.v2_wallets (id, account_id, currency)
values (
  '11000000-0000-0000-0000-000000000101'::uuid,
  '10000000-0000-0000-0000-000000000101'::uuid,
  'USD'
)
on conflict (account_id) do nothing;

insert into public.v2_facilities (
  id, account_id, source_kind, source_name, source_ref, name, category,
  description, latitude, longitude, address, public_hours, trust_state,
  commercial_plan, qualifying_sales
)
values (
  '20000000-0000-0000-0000-000000000101'::uuid,
  '10000000-0000-0000-0000-000000000101'::uuid,
  'created',
  'omni_root_demo',
  'D-V2-DEMO-FACILITY',
  'Omni Demo Seller Hub',
  'Local supply',
  'Bounded Root proof facility; not a real business claim.',
  6.3703,
  2.3912,
  'Cotonou — Root proof fixture',
  '{}'::jsonb,
  'unconfirmed',
  'free',
  0
)
on conflict (id) do nothing;

insert into public.v2_facility_slots (id, account_id, source, status, facility_id, assigned_at)
values (
  '12000000-0000-0000-0000-000000000101'::uuid,
  '10000000-0000-0000-0000-000000000101'::uuid,
  'free',
  'assigned',
  '20000000-0000-0000-0000-000000000101'::uuid,
  now()
)
on conflict (id) do nothing;

insert into public.v2_products (
  id, facility_id, name, description, category, media, unit, price_minor,
  currency, actual_stock, quantity_allocated_omni, publication_state
)
values (
  '30000000-0000-0000-0000-000000000101'::uuid,
  '20000000-0000-0000-0000-000000000101'::uuid,
  'Root proof demo product',
  'Bounded product fixture for transaction-path proof; not real inventory.',
  'Root proof',
  '[]'::jsonb,
  'unit',
  1500,
  'USD',
  5,
  5,
  'published'
)
on conflict (id) do nothing;
