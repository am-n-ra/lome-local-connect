#!/usr/bin/env node
// Demo facilities seed — owner request (2026-08-29): 2 realistic Lomé facilities on PROD
// (https://omni.sparkafrika.online) so the complete buyer→seller loop can be tested end-to-end.
//
// HOW TO RE-RUN (idempotent — safe to paste/execute any number of times, converges to this
// exact state, never touches non-demo rows):
//   1) With a connection string (same env as the deployed functions, see database() in
//      src/server/trunk-repository.ts):
//        V2_DATABASE_URL="postgres://…" npm run seed:demo
//      Prints verification tables at the end.
//   2) Without DB access (agent machines have no connection string): regenerate the
//      Neon-console input and paste it into the Neon console SQL editor on the PRODUCTION
//      branch (project wild-moon-30984513, branch br-dawn-hill-am5amy22, db neondb), then
//      run the verify file:
//        npm run seed:demo:emit
//      → writes ops/neon-demo-seed-lome-target.json (paste this one)
//        and     ops/neon-demo-seed-lome-verify.json (run after the target).
//
// WHAT IT CREATES (additive only — fixed demo-namespaced UUIDs; ranges 1xxxxxxx…5exxxxxx
// are reserved for this seed and never collide with real rows):
//   · 1 demo seller account (synthetic auth_user_id, never matches a real Neon Auth identity)
//   · 1 Omni Wallet (XOF) for that account
//   · 3 demo buyer accounts (distinct profiles for the proven-sales history)
//   · 2 demo companies + 2 facilities in central Lomé, BOTH trust 'confirmed'
//     (qualifying_sales = 3, bonus_unlocked_at set):
//       - Boulangerie du Marché d'Adawlato  (…0201) — 3 published products
//       - Épicerie Chez Afi (Tokoin Hôpital) (…0202) — 2 published products
//   · 2 facility slots (1 free + 1 wallet) so seller-side screens work for the demo account
//   · 5 published products with the mandatory v3 model (prixOriginal, prixReduit via
//     discount_kind='percentage' + discount_value_minor 1..90, stockLoueOmni > 0)
//   · THE PROVEN-SALES HISTORY that justifies 'confirmed' (3 sales per facility, each from a
//     distinct buyer profile, each QR-tracking-linked): availability request → seller
//     response → purchase intent → transaction snapshot (+ buyer/seller members) → the full
//     9-state transaction event chain (intent_created … closed) → QR token (verified) →
//     external payment declaration (cash / mobile money only, never in-app) → fulfilment
//     (pickup) → buyer rating → the $20 facility bonus ledger entry (kind 'bonus_grant',
//     reference 'facility-bonus:<facility_id>') — exactly the rows the server itself writes
//     along the same path (see recordQualifyingSale in src/server/trunk-repository.ts).
//     Sales are spread over the last ~2 weeks; re-running refreshes their timestamps.
//
// IDEMPOTENT: every statement uses fixed UUIDs + ON CONFLICT. Re-running converges the demo
// rows back to this exact desired state (including resetting demo stock) and touches nothing
// else. Guardrails honoured: v2_facilities_company_owner_guard trigger (company account must
// match facility account), v2_facility_source_dedupe (distinct source_ref per facility),
// v2_one_free_slot_per_account (exactly one free slot), v2_products_v3_* CHECK constraints
// (migration 012), unique event state per transaction (004/005), one QR token per
// transaction (005), audit idempotency index (004), wallet bonus conflict target identical
// to the server's.

import { writeFileSync } from 'node:fs';

// ── Demo fixture identity (all demo rows live in these fixed UUID ranges) ────────────
const SELLER_ACCOUNT_ID = '10000000-0000-0000-0000-000000000201';
const SELLER_AUTH_REF = 'omni-demo-seed-lome-2026-08-29';
const WALLET_ID = '11000000-0000-0000-0000-000000000201';
const SLOT_1_ID = '12000000-0000-0000-0000-000000000201';
const SLOT_2_ID = '12000000-0000-0000-0000-000000000202';
const COMPANY_1_ID = '15000000-0000-0000-0000-000000000201';
const COMPANY_2_ID = '15000000-0000-0000-0000-000000000202';
const FACILITY_1_ID = '20000000-0000-0000-0000-000000000201'; // Boulangerie du Marché d'Adawlato
const FACILITY_2_ID = '20000000-0000-0000-0000-000000000202'; // Épicerie Chez Afi (Tokoin Hôpital)
const SEED_REF = 'DEMO-SEED-LOME-2026-08-29';
const CORRELATION_ID = 'demo-seed-lome-2026-08-29';

// Demo buyer profiles — synthetic auth_user_id values (text, never valid Neon Auth subjects,
// which are UUIDs), so no real identity can ever bind to these accounts.
const BUYERS = [
  { id: '40000000-0000-0000-0000-000000000201', authRef: 'omni-demo-buyer-1-2026-08-29' },
  { id: '40000000-0000-0000-0000-000000000202', authRef: 'omni-demo-buyer-2-2026-08-29' },
  { id: '40000000-0000-0000-0000-000000000203', authRef: 'omni-demo-buyer-3-2026-08-29' },
];

// Product reference used by the proven-sales chain (unit price = prix réduit, in XOF minor).
const PRODUCT_REFS = {
  P201: { id: '30000000-0000-0000-0000-000000000201', facilityId: FACILITY_1_ID, name: 'Baguette tradition', unitPriceMinor: 255, discountPercent: 15 },
  P202: { id: '30000000-0000-0000-0000-000000000202', facilityId: FACILITY_1_ID, name: 'Pain de mie tranché 500 g', unitPriceMinor: 900, discountPercent: 25 },
  P203: { id: '30000000-0000-0000-0000-000000000203', facilityId: FACILITY_1_ID, name: 'Gâteaux assortis (plat de 6)', unitPriceMinor: 2000, discountPercent: 20 },
  P204: { id: '30000000-0000-0000-0000-000000000204', facilityId: FACILITY_2_ID, name: 'Riz parfumé local 5 kg', unitPriceMinor: 5720, discountPercent: 12 },
  P205: { id: '30000000-0000-0000-0000-000000000205', facilityId: FACILITY_2_ID, name: 'Huile rouge Zomi 1 L', unitPriceMinor: 1260, discountPercent: 30 },
};

// One qualifying sale per (facility, distinct buyer): the 3-sales-by-3-distinct-profiles
// rule that produces trust_state='confirmed'. daysAgo spreads them historically.
const SALES = [
  { f: 1, b: 0, product: 'P201', qty: 2, score: 5, note: 'Pain excellent, vendeur très accueillant.', method: 'cash', daysAgo: 11 },
  { f: 1, b: 1, product: 'P202', qty: 1, score: 4, note: 'Bon produit, remise bien appliquée.', method: 'cash', daysAgo: 9 },
  { f: 1, b: 2, product: 'P203', qty: 1, score: 5, note: 'Service rapide, je recommande.', method: 'mobile_money', daysAgo: 7 },
  { f: 2, b: 0, product: 'P204', qty: 1, score: 5, note: 'Riz de bonne qualité, prix réduit honnête.', method: 'mobile_money', daysAgo: 6 },
  { f: 2, b: 1, product: 'P205', qty: 2, score: 4, note: 'Huile authentique, emballage soigné.', method: 'cash', daysAgo: 4 },
  { f: 2, b: 2, product: 'P204', qty: 1, score: 5, note: 'Accueil chaleureux, stock bien géré.', method: 'mobile_money', daysAgo: 2 },
];

const facilityIdOf = (f) => (f === 1 ? FACILITY_1_ID : FACILITY_2_ID);
// Deterministic demo-namespaced UUID: 50000000-0000-0000-0000-0000000002<f><b>
const saleUuid = (prefix, f, b) => `${prefix}-0000-0000-0000-0000000002${f}${b + 1}`;
const saleDay = (s) => `now() - interval '${s.daysAgo} days'`;
const saleTime = (s, minutes) => `now() - interval '${s.daysAgo} days' + interval '${minutes} minutes'`;
// Synthetic but valid-hex token hash (64 chars) — never matches a real coupon scan.
const qrHash = (f, b) => `d${f}b${b + 1}`.repeat(22).slice(0, 64);

const SALES_ENRICHED = SALES.map((s) => ({
  ...s,
  product: PRODUCT_REFS[s.product],
  buyer: BUYERS[s.b],
  net: PRODUCT_REFS[s.product].unitPriceMinor * s.qty,
  reqId: saleUuid('50000000', s.f, s.b),
  respId: saleUuid('52000000', s.f, s.b),
  intentId: saleUuid('54000000', s.f, s.b),
  txId: saleUuid('56000000', s.f, s.b),
  qrId: saleUuid('58000000', s.f, s.b),
  payId: saleUuid('5a000000', s.f, s.b),
  fulfilId: saleUuid('5c000000', s.f, s.b),
  ratingId: saleUuid('5e000000', s.f, s.b),
  coupon: `OMNI-DEMO-F${s.f}-B${s.b + 1}`,
}));

// ── Target Neon project (same values as the historical ops/neon-admin-*.json inputs;
//    adjust branchId only if the production branch changes) ────────────────────────────
const NEON_TARGET = {
  projectId: 'wild-moon-30984513',
  branchId: 'br-dawn-hill-am5amy22',
  databaseName: 'neondb',
};

const DEMO_SEED_STATEMENTS = [
  {
    label: 'demo seller account',
    sql: `insert into v2_accounts (id, auth_user_id, onboarding_state)
values ('${SELLER_ACCOUNT_ID}'::uuid, '${SELLER_AUTH_REF}', 'complete')
on conflict (id) do nothing`,
  },
  {
    label: 'demo buyer accounts (3 distinct profiles)',
    sql: `insert into v2_accounts (id, auth_user_id, onboarding_state)
values
${BUYERS.map((b) => `  ('${b.id}'::uuid, '${b.authRef}', 'complete')`).join(',\n')}
on conflict (id) do update set
  auth_user_id = excluded.auth_user_id,
  onboarding_state = excluded.onboarding_state,
  suspended_at = null,
  updated_at = now()`,
  },
  {
    label: 'demo wallet (XOF)',
    sql: `insert into v2_wallets (id, account_id, currency)
values ('${WALLET_ID}'::uuid, '${SELLER_ACCOUNT_ID}'::uuid, 'XOF')
on conflict (account_id) do nothing`,
  },
  {
    label: 'demo company 1 (Adawlato)',
    sql: `insert into v2_companies (id, account_id, name, description)
values ('${COMPANY_1_ID}'::uuid, '${SELLER_ACCOUNT_ID}'::uuid,
  'Démo Omni — Groupe Adawlato',
  'Compagnie de démonstration Omni (données de test, aucun commerce réel).')
on conflict (id) do update set
  account_id = excluded.account_id,
  name = excluded.name,
  description = excluded.description,
  updated_at = now()`,
  },
  {
    label: 'demo company 2 (Tokoin)',
    sql: `insert into v2_companies (id, account_id, name, description)
values ('${COMPANY_2_ID}'::uuid, '${SELLER_ACCOUNT_ID}'::uuid,
  'Démo Omni — Tokoin',
  'Compagnie de démonstration Omni (données de test, aucun commerce réel).')
on conflict (id) do update set
  account_id = excluded.account_id,
  name = excluded.name,
  description = excluded.description,
  updated_at = now()`,
  },
  {
    label: 'facility 1 — Boulangerie du Marché d\'Adawlato (confirmed)',
    sql: `insert into v2_facilities (
  id, account_id, company_id, source_kind, source_name, source_ref,
  name, category, description, latitude, longitude, address, public_hours,
  trust_state, commercial_plan, qualifying_sales, bonus_unlocked_at
)
values (
  '${FACILITY_1_ID}'::uuid, '${SELLER_ACCOUNT_ID}'::uuid, '${COMPANY_1_ID}'::uuid,
  'created', 'omni_demo_seed', '${SEED_REF}-F1',
  'Boulangerie du Marché d''Adawlato', 'Boulangerie',
  'Facilité de démonstration Omni. Boulangerie du marché d''Adawlato : pain cuit chaque matin, viennoiseries et snacks à prix réduit.',
  6.1319, 1.2225,
  'Marché d''Adawlato, Lomé, Togo',
  '{}'::jsonb,
  'confirmed', 'free', 3, now()
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  address = excluded.address,
  trust_state = excluded.trust_state,
  commercial_plan = excluded.commercial_plan,
  qualifying_sales = excluded.qualifying_sales,
  bonus_unlocked_at = excluded.bonus_unlocked_at,
  source_name = excluded.source_name,
  source_ref = excluded.source_ref,
  updated_at = now()`,
  },
  {
    label: 'facility 2 — Épicerie Chez Afi (confirmed)',
    sql: `insert into v2_facilities (
  id, account_id, company_id, source_kind, source_name, source_ref,
  name, category, description, latitude, longitude, address, public_hours,
  trust_state, commercial_plan, qualifying_sales, bonus_unlocked_at
)
values (
  '${FACILITY_2_ID}'::uuid, '${SELLER_ACCOUNT_ID}'::uuid, '${COMPANY_2_ID}'::uuid,
  'created', 'omni_demo_seed', '${SEED_REF}-F2',
  'Épicerie Chez Afi (Tokoin Hôpital)', 'Épicerie',
  'Facilité de démonstration Omni. Épicerie de quartier à Tokoin Hôpital : produits de première nécessité à prix réduit.',
  6.157, 1.2340,
  'Tokoin Hôpital, Lomé, Togo',
  '{}'::jsonb,
  'confirmed', 'free', 3, now()
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  address = excluded.address,
  trust_state = excluded.trust_state,
  commercial_plan = excluded.commercial_plan,
  qualifying_sales = excluded.qualifying_sales,
  bonus_unlocked_at = excluded.bonus_unlocked_at,
  source_name = excluded.source_name,
  source_ref = excluded.source_ref,
  updated_at = now()`,
  },
  {
    label: 'facility slot 1 (free → facility 1)',
    sql: `insert into v2_facility_slots (id, account_id, source, status, facility_id, assigned_at)
values ('${SLOT_1_ID}'::uuid, '${SELLER_ACCOUNT_ID}'::uuid, 'free', 'assigned', '${FACILITY_1_ID}'::uuid, now())
on conflict (id) do update set
  account_id = excluded.account_id,
  source = excluded.source,
  status = excluded.status,
  facility_id = excluded.facility_id,
  assigned_at = now(),
  revoked_at = null`,
  },
  {
    label: 'facility slot 2 (wallet → facility 2)',
    sql: `insert into v2_facility_slots (id, account_id, source, status, facility_id, assigned_at)
values ('${SLOT_2_ID}'::uuid, '${SELLER_ACCOUNT_ID}'::uuid, 'wallet', 'assigned', '${FACILITY_2_ID}'::uuid, now())
on conflict (id) do update set
  account_id = excluded.account_id,
  source = excluded.source,
  status = excluded.status,
  facility_id = excluded.facility_id,
  assigned_at = now(),
  revoked_at = null`,
  },
  {
    label: 'product 1 — Baguette tradition (facility 1)',
    sql: `insert into v2_products (
  id, facility_id, name, description, category, media, unit,
  price_minor, currency, discount_kind, discount_value_minor,
  quantity_allocated_omni, actual_stock, publication_state
)
values (
  '30000000-0000-0000-0000-000000000201'::uuid, '${FACILITY_1_ID}'::uuid,
  'Baguette tradition', 'Baguette cuite le matin même, croûte fine.', 'Boulangerie',
  '[]'::jsonb, 'pièce',
  300, 'XOF', 'percentage', 15,
  40, 40, 'published'
)
on conflict (id) do update set
  facility_id = excluded.facility_id,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  unit = excluded.unit,
  price_minor = excluded.price_minor,
  currency = excluded.currency,
  discount_kind = 'percentage',
  discount_value_minor = excluded.discount_value_minor,
  quantity_allocated_omni = excluded.quantity_allocated_omni,
  actual_stock = excluded.actual_stock,
  publication_state = excluded.publication_state,
  updated_at = now()`,
  },
  {
    label: 'product 2 — Pain de mie tranché 500 g (facility 1)',
    sql: `insert into v2_products (
  id, facility_id, name, description, category, media, unit,
  price_minor, currency, discount_kind, discount_value_minor,
  quantity_allocated_omni, actual_stock, publication_state
)
values (
  '30000000-0000-0000-0000-000000000202'::uuid, '${FACILITY_1_ID}'::uuid,
  'Pain de mie tranché 500 g', 'Pain de mie moelleux, sachet de 500 g.', 'Boulangerie',
  '[]'::jsonb, 'paquet',
  1200, 'XOF', 'percentage', 25,
  15, 15, 'published'
)
on conflict (id) do update set
  facility_id = excluded.facility_id,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  unit = excluded.unit,
  price_minor = excluded.price_minor,
  currency = excluded.currency,
  discount_kind = 'percentage',
  discount_value_minor = excluded.discount_value_minor,
  quantity_allocated_omni = excluded.quantity_allocated_omni,
  actual_stock = excluded.actual_stock,
  publication_state = excluded.publication_state,
  updated_at = now()`,
  },
  {
    label: 'product 3 — Gâteaux assortis (facility 1)',
    sql: `insert into v2_products (
  id, facility_id, name, description, category, media, unit,
  price_minor, currency, discount_kind, discount_value_minor,
  quantity_allocated_omni, actual_stock, publication_state
)
values (
  '30000000-0000-0000-0000-000000000203'::uuid, '${FACILITY_1_ID}'::uuid,
  'Gâteaux assortis (plat de 6)', 'Assortiment du jour : six pâtisseries locales.', 'Boulangerie',
  '[]'::jsonb, 'plat',
  2500, 'XOF', 'percentage', 20,
  8, 8, 'published'
)
on conflict (id) do update set
  facility_id = excluded.facility_id,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  unit = excluded.unit,
  price_minor = excluded.price_minor,
  currency = excluded.currency,
  discount_kind = 'percentage',
  discount_value_minor = excluded.discount_value_minor,
  quantity_allocated_omni = excluded.quantity_allocated_omni,
  actual_stock = excluded.actual_stock,
  publication_state = excluded.publication_state,
  updated_at = now()`,
  },
  {
    label: 'product 4 — Riz parfumé local 5 kg (facility 2)',
    sql: `insert into v2_products (
  id, facility_id, name, description, category, media, unit,
  price_minor, currency, discount_kind, discount_value_minor,
  quantity_allocated_omni, actual_stock, publication_state
)
values (
  '30000000-0000-0000-0000-000000000204'::uuid, '${FACILITY_2_ID}'::uuid,
  'Riz parfumé local 5 kg', 'Sac de riz parfumé de la vallée de l''Oti.', 'Épicerie',
  '[]'::jsonb, 'sac',
  6500, 'XOF', 'percentage', 12,
  10, 10, 'published'
)
on conflict (id) do update set
  facility_id = excluded.facility_id,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  unit = excluded.unit,
  price_minor = excluded.price_minor,
  currency = excluded.currency,
  discount_kind = 'percentage',
  discount_value_minor = excluded.discount_value_minor,
  quantity_allocated_omni = excluded.quantity_allocated_omni,
  actual_stock = excluded.actual_stock,
  publication_state = excluded.publication_state,
  updated_at = now()`,
  },
  {
    label: 'product 5 — Huile rouge Zomi 1 L (facility 2)',
    sql: `insert into v2_products (
  id, facility_id, name, description, category, media, unit,
  price_minor, currency, discount_kind, discount_value_minor,
  quantity_allocated_omni, actual_stock, publication_state
)
values (
  '30000000-0000-0000-0000-000000000205'::uuid, '${FACILITY_2_ID}'::uuid,
  'Huile rouge Zomi 1 L', 'Huile de palme rouge Zomi, bouteille d''un litre.', 'Épicerie',
  '[]'::jsonb, 'bouteille',
  1800, 'XOF', 'percentage', 30,
  6, 6, 'published'
)
on conflict (id) do update set
  facility_id = excluded.facility_id,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  unit = excluded.unit,
  price_minor = excluded.price_minor,
  currency = excluded.currency,
  discount_kind = 'percentage',
  discount_value_minor = excluded.discount_value_minor,
  quantity_allocated_omni = excluded.quantity_allocated_omni,
  actual_stock = excluded.actual_stock,
  publication_state = excluded.publication_state,
  updated_at = now()`,
  },
  {
    label: 'proven-sale availability requests (6)',
    sql: `insert into v2_availability_requests (
  id, buyer_account_id, product_id, facility_scope, requested_quantity,
  budget_mode, budget_minor, status, idempotency_key, expires_at, created_at
)
values
${SALES_ENRICHED.map((s) => `  (
    '${s.reqId}'::uuid, '${s.buyer.id}'::uuid, '${s.product.id}'::uuid,
    array['${facilityIdOf(s.f)}']::uuid[], ${s.qty},
    'maximum', ${s.net}, 'available', '${SEED_REF}-REQ-F${s.f}B${s.b + 1}',
    ${saleTime(s, 120)}, ${saleDay(s)}
  )`).join(',\n')}
on conflict (id) do update set
  requested_quantity = excluded.requested_quantity,
  budget_minor = excluded.budget_minor,
  status = excluded.status,
  idempotency_key = excluded.idempotency_key,
  expires_at = excluded.expires_at,
  created_at = excluded.created_at`,
  },
  {
    label: 'proven-sale availability responses (6, seller-answered)',
    sql: `insert into v2_availability_responses (
  id, request_id, facility_id, responder_account_id, status, quantity_available,
  price_minor, offer_snapshot, seller_message, idempotency_key, observed_at
)
values
${SALES_ENRICHED.map((s) => `  (
    '${s.respId}'::uuid, '${s.reqId}'::uuid, '${facilityIdOf(s.f)}'::uuid, '${SELLER_ACCOUNT_ID}'::uuid,
    'available', ${s.qty}, ${s.product.unitPriceMinor},
    jsonb_build_object(
      'product_id', '${s.product.id}',
      'product_name', '${s.product.name}',
      'unit_price_minor', ${s.product.unitPriceMinor},
      'discount_percent', ${s.product.discountPercent},
      'currency', 'XOF'
    ),
    'Disponible, vous pouvez venir chercher votre commande.',
    '${SEED_REF}-RESP-F${s.f}B${s.b + 1}',
    ${saleTime(s, 3)}
  )`).join(',\n')}
on conflict (id) do update set
  status = excluded.status,
  quantity_available = excluded.quantity_available,
  price_minor = excluded.price_minor,
  offer_snapshot = excluded.offer_snapshot,
  seller_message = excluded.seller_message,
  idempotency_key = excluded.idempotency_key,
  observed_at = excluded.observed_at`,
  },
  {
    label: 'proven-sale purchase intents (6, completed)',
    sql: `insert into v2_purchase_intents (
  id, buyer_account_id, response_id, transaction_id, idempotency_key, state, created_at
)
values
${SALES_ENRICHED.map((s) => `  (
    '${s.intentId}'::uuid, '${s.buyer.id}'::uuid, '${s.respId}'::uuid, '${s.txId}'::uuid,
    '${SEED_REF}-INTENT-F${s.f}B${s.b + 1}', 'completed', ${saleTime(s, 4)}
  )`).join(',\n')}
on conflict (id) do update set
  response_id = excluded.response_id,
  transaction_id = excluded.transaction_id,
  idempotency_key = excluded.idempotency_key,
  state = excluded.state,
  created_at = excluded.created_at`,
  },
  {
    label: 'proven-sale transaction snapshots (6)',
    sql: `insert into v2_transaction_snapshots (
  transaction_id, intent_id, buyer_account_id, facility_id, product_id, quantity,
  unit_price_minor, coupon_code, net_amount_minor, response_observed_at, created_at
)
values
${SALES_ENRICHED.map((s) => `  (
    '${s.txId}'::uuid, '${s.intentId}'::uuid, '${s.buyer.id}'::uuid, '${facilityIdOf(s.f)}'::uuid,
    '${s.product.id}'::uuid, ${s.qty}, ${s.product.unitPriceMinor}, '${s.coupon}',
    ${s.net}, ${saleTime(s, 3)}, ${saleTime(s, 4)}
  )`).join(',\n')}
on conflict (transaction_id) do update set
  intent_id = excluded.intent_id,
  buyer_account_id = excluded.buyer_account_id,
  facility_id = excluded.facility_id,
  product_id = excluded.product_id,
  quantity = excluded.quantity,
  unit_price_minor = excluded.unit_price_minor,
  coupon_code = excluded.coupon_code,
  net_amount_minor = excluded.net_amount_minor,
  response_observed_at = excluded.response_observed_at,
  created_at = excluded.created_at`,
  },
  {
    label: 'proven-sale transaction members (buyer + seller per sale)',
    sql: `insert into v2_transaction_members (transaction_id, account_id, role)
values
${SALES_ENRICHED.flatMap((s) => [
    `  ('${s.txId}'::uuid, '${s.buyer.id}'::uuid, 'buyer')`,
    `  ('${s.txId}'::uuid, '${SELLER_ACCOUNT_ID}'::uuid, 'seller')`,
  ]).join(',\n')}
on conflict (transaction_id, account_id, role) do nothing`,
  },
  {
    label: 'proven-sale transaction event chains (9 states per sale)',
    sql: `insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
values
${SALES_ENRICHED.flatMap((s) => {
    const events = [
      ['intent_created', 4, `jsonb_build_object('intent_id', '${s.intentId}')`],
      ['qr_ready', 5, `jsonb_build_object('qr_token_id', '${s.qrId}')`],
      ['qr_verified', 6, `jsonb_build_object('qr_token_id', '${s.qrId}', 'verified_in_store', true)`],
      ['payment_declared', 8, `jsonb_build_object('method', '${s.method}')`],
      ['payment_confirmed', 10, `jsonb_build_object('method', '${s.method}')`],
      ['fulfilled', 15, `jsonb_build_object('mode', 'pickup')`],
      ['received', 20, `jsonb_build_object('note', 'Achat récupéré en boutique.')`],
      ['rated', 25, `jsonb_build_object('score', ${s.score})`],
      ['closed', 26, `jsonb_build_object('reason', 'buyer_rating_completed')`],
    ];
    return events.map(([state, minutes, metadata]) =>
      `  ('${s.txId}'::uuid, '${s.buyer.id}'::uuid, '${state}', ${metadata}, ${saleTime(s, minutes)})`,
    );
  }).join(',\n')}
on conflict (transaction_id, state) do update set
  metadata = excluded.metadata,
  created_at = excluded.created_at`,
  },
  {
    label: 'proven-sale QR tokens (6, verified in store)',
    sql: `insert into v2_qr_tokens (id, transaction_id, token_hash, expires_at, verified_at, replay_count, created_at)
values
${SALES_ENRICHED.map((s) => `  (
    '${s.qrId}'::uuid, '${s.txId}'::uuid, '${qrHash(s.f, s.b)}',
    ${saleTime(s, 24 * 60)}, ${saleTime(s, 6)}, 1, ${saleTime(s, 5)}
  )`).join(',\n')}
on conflict (id) do update set
  transaction_id = excluded.transaction_id,
  token_hash = excluded.token_hash,
  expires_at = excluded.expires_at,
  verified_at = excluded.verified_at,
  replay_count = excluded.replay_count,
  created_at = excluded.created_at`,
  },
  {
    label: 'proven-sale payment declarations (cash / mobile money only)',
    sql: `insert into v2_external_payment_declarations (
  id, transaction_id, buyer_account_id, method, declared_at, seller_acknowledged_at
)
values
${SALES_ENRICHED.map((s) => `  (
    '${s.payId}'::uuid, '${s.txId}'::uuid, '${s.buyer.id}'::uuid, '${s.method}',
    ${saleTime(s, 8)}, ${saleTime(s, 10)}
  )`).join(',\n')}
on conflict (transaction_id) do update set
  buyer_account_id = excluded.buyer_account_id,
  method = excluded.method,
  declared_at = excluded.declared_at,
  seller_acknowledged_at = excluded.seller_acknowledged_at`,
  },
  {
    label: 'proven-sale fulfilments (pickup, fulfilled)',
    sql: `insert into v2_fulfilments (id, transaction_id, mode, state, updated_at)
values
${SALES_ENRICHED.map((s) => `  (
    '${s.fulfilId}'::uuid, '${s.txId}'::uuid, 'pickup', 'fulfilled', ${saleTime(s, 15)}
  )`).join(',\n')}
on conflict (transaction_id) do update set
  mode = excluded.mode,
  state = excluded.state,
  updated_at = excluded.updated_at`,
  },
  {
    label: 'proven-sale buyer ratings (6)',
    sql: `insert into v2_ratings (id, transaction_id, buyer_account_id, score, note, created_at)
values
${SALES_ENRICHED.map((s) => `  (
    '${s.ratingId}'::uuid, '${s.txId}'::uuid, '${s.buyer.id}'::uuid, ${s.score}, '${s.note}', ${saleTime(s, 25)}
  )`).join(',\n')}
on conflict (transaction_id) do update set
  buyer_account_id = excluded.buyer_account_id,
  score = excluded.score,
  note = excluded.note,
  created_at = excluded.created_at`,
  },
  {
    label: 'facility bonus grants ($20 × 2, unlocked at confirmed)',
    sql: `insert into v2_wallet_ledger_entries (
  wallet_id, kind, amount_minor, status, reference, facility_id, created_at, confirmed_at
)
values
  ('${WALLET_ID}'::uuid, 'bonus_grant', 2000, 'confirmed', 'facility-bonus:${FACILITY_1_ID}', '${FACILITY_1_ID}'::uuid, ${`now() - interval '7 days'`}, ${`now() - interval '7 days'`}),
  ('${WALLET_ID}'::uuid, 'bonus_grant', 2000, 'confirmed', 'facility-bonus:${FACILITY_2_ID}', '${FACILITY_2_ID}'::uuid, ${`now() - interval '2 days'`}, ${`now() - interval '2 days'`})
on conflict (wallet_id, kind, reference) do nothing`,
  },
  {
    label: 'audit trail entry (idempotent)',
    sql: `insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
values (
  null,
  'demo_seed_lome',
  'facility',
  '${FACILITY_1_ID}',
  '${CORRELATION_ID}',
  'Owner-requested demo seed: 2 Lomé facilities (both confirmed, 3 proven Omni sales each by 3 distinct buyer profiles, QR-tracking-linked), 5 published products, additive and idempotent.'
)
on conflict (correlation_id, event_type, entity_type, entity_id) do update set
  reason = excluded.reason`,
  },
];

const DEMO_VERIFY_STATEMENTS = [
  {
    label: 'facilities (map + fiche + trust)',
    sql: `select f.id, f.name, f.trust_state, f.qualifying_sales, f.latitude, f.longitude,
  count(p.id) filter (where p.publication_state = 'published') as published_products
from v2_facilities f
left join v2_products p on p.facility_id = f.id
where f.id in ('${FACILITY_1_ID}'::uuid, '${FACILITY_2_ID}'::uuid)
group by f.id
order by f.name`,
  },
  {
    label: 'products (v3 model fields)',
    sql: `select id, facility_id, name, unit, price_minor, currency,
  discount_kind, discount_value_minor, quantity_allocated_omni, publication_state
from v2_products
where facility_id in ('${FACILITY_1_ID}'::uuid, '${FACILITY_2_ID}'::uuid)
order by name`,
  },
  {
    label: 'proven sales per facility (distinct buyers, full chain, ratings)',
    sql: `select f.id, f.name, f.trust_state,
  count(distinct s.transaction_id) as omni_sales,
  count(distinct s.buyer_account_id) as distinct_buyers,
  count(distinct t.id) as verified_qr_tokens,
  count(distinct e.transaction_id) filter (where e.state = 'closed') as closed_sales,
  count(distinct r.transaction_id) as rated_sales
from v2_facilities f
left join v2_transaction_snapshots s on s.facility_id = f.id
left join v2_qr_tokens t on t.transaction_id = s.transaction_id and t.verified_at is not null
left join v2_transaction_events e on e.transaction_id = s.transaction_id
left join v2_ratings r on r.transaction_id = s.transaction_id
where f.id in ('${FACILITY_1_ID}'::uuid, '${FACILITY_2_ID}'::uuid)
group by f.id
order by f.name`,
  },
];

const DEMO_SEED_FILE = 'ops/neon-demo-seed-lome-target.json';
const DEMO_VERIFY_FILE = 'ops/neon-demo-seed-lome-verify.json';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function emitConsoleFiles() {
  writeFileSync(DEMO_SEED_FILE, JSON.stringify(
    { ...NEON_TARGET, sqlStatements: DEMO_SEED_STATEMENTS.map((s) => `${s.sql};`) },
    null,
    2,
  ));
  writeFileSync(DEMO_VERIFY_FILE, JSON.stringify(
    { ...NEON_TARGET, sql: DEMO_VERIFY_STATEMENTS.map((s) => s.sql).join(';\n\n') },
    null,
    2,
  ));
  console.log(`Wrote ${DEMO_SEED_FILE} (${DEMO_SEED_STATEMENTS.length} statements)`);
  console.log(`Wrote ${DEMO_VERIFY_FILE}`);
  console.log('Apply via the Neon console SQL editor on the PRODUCTION branch, then run the verify file.');
}

async function runWithRetry(operation, { attempts = 3 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt) await sleep(1000 * attempt);
    try {
      return await operation();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function executeSeed() {
  const url = process.env.V2_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error('V2_DATABASE_URL (or DATABASE_URL) is not set — cannot connect to the Omni Neon database.');
    console.error('Two ways forward:');
    console.error('  1. Export the same connection string the deployed Vercel functions use, then re-run: V2_DATABASE_URL="postgres://…" npm run seed:demo');
    console.error('  2. Or apply without any connection string: npm run seed:demo:emit, then paste the generated');
    console.error(`     ${DEMO_SEED_FILE} statements into the Neon console SQL editor (PRODUCTION branch)`);
    console.error(`     and run ${DEMO_VERIFY_FILE} afterwards.`);
    process.exit(1);
  }
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(url);
  for (const statement of DEMO_SEED_STATEMENTS) {
    try {
      await runWithRetry(() => sql(statement.sql));
      console.log(`✓ ${statement.label}`);
    } catch (error) {
      console.error(`✗ ${statement.label}\n  ${error?.message ?? error}`);
      process.exit(1);
    }
  }
  console.log('\n— Verification —');
  for (const statement of DEMO_VERIFY_STATEMENTS) {
    try {
      const rows = await runWithRetry(() => sql(statement.sql));
      console.log(`\n[${statement.label}]`);
      console.table(rows);
    } catch (error) {
      console.error(`✗ verify: ${statement.label}\n  ${error?.message ?? error}`);
      process.exit(1);
    }
  }
  console.log(`\nDemo seed complete. Facility ids: ${FACILITY_1_ID} (confirmed), ${FACILITY_2_ID} (confirmed).`);
}

const mode = process.argv[2] ?? '';
if (mode === '--emit-json') {
  emitConsoleFiles();
} else if (mode === '' || mode === '--execute') {
  await executeSeed();
} else {
  console.error('Usage: node scripts/seed-demo-lome.mjs [--emit-json | --execute]');
  process.exit(2);
}

export {
  DEMO_SEED_STATEMENTS,
  DEMO_VERIFY_STATEMENTS,
  NEON_TARGET,
  FACILITY_1_ID,
  FACILITY_2_ID,
  SELLER_ACCOUNT_ID,
  BUYERS,
  SALES_ENRICHED,
};
