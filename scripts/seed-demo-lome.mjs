#!/usr/bin/env node
// Demo facilities seed — owner request (2026-08-29): 1–2 realistic Lomé facilities on PROD
// (https://omni.sparkafrika.online) so the complete buyer→seller loop can be tested end-to-end.
//
// WHAT IT CREATES (additive only — fixed demo-namespaced UUIDs, never touches existing rows):
//   · 1 demo account (synthetic auth_user_id, never matches a real Neon Auth identity)
//   · 1 Omni Wallet (XOF) for that account
//   · 2 demo companies + 2 facilities: 1 'confirmed' / 1 'unconfirmed' (both trust badge styles)
//   · 2 facility slots (1 free + 1 wallet) so seller-side screens work for the demo account
//   · 5 published products with the mandatory v3 model (prixOriginal, prixReduit via
//     discount_kind='percentage' + discount_value_minor 1..90, stockLoueOmni > 0)
//
// Trust state: facility 1 is 'confirmed' with qualifying_sales = 3 — exactly the state the
// server itself produces after 3 qualifying Omni sales (see the qualifying-sales transition
// in src/server/trunk-repository.ts).
//
// IDEMPOTENT: every statement uses fixed UUIDs + ON CONFLICT. Re-running converges the demo
// rows back to this exact desired state (including resetting demo stock) and touches nothing
// else. Guardrails honoured: v2_facilities_company_owner_guard trigger (company account must
// match facility account), v2_facility_source_dedupe (distinct source_ref per facility),
// v2_one_free_slot_per_account (exactly one free slot), v2_products_v3_* CHECK constraints
// (migration 012), audit idempotency index (migration 004).
//
// USAGE:
//   1) Execute against a database (uses the SAME env as the deployed functions, see
//      database() in src/server/trunk-repository.ts):
//        V2_DATABASE_URL="postgres://…" npm run seed:demo
//      (or: node scripts/seed-demo-lome.mjs). Prints a verification table at the end.
//   2) Without DB access, emit the Neon-console-ready input (same flow as the historical
//      ops/neon-admin-*.json runs — paste the statements into the Neon SQL editor on the
//      PRODUCTION branch, then run the verify file):
//        npm run seed:demo:emit
//      (writes ops/neon-demo-seed-lome-target.json + ops/neon-demo-seed-lome-verify.json)

import { writeFileSync } from 'node:fs';

// ── Demo fixture identity (all demo rows live in these fixed UUID ranges; they never
//    collide with the earlier seller-proof fixture that uses …0101 ids) ──────────────
const ACCOUNT_ID = '10000000-0000-0000-0000-000000000201';
const ACCOUNT_AUTH_REF = 'omni-demo-seed-lome-2026-08-29';
const WALLET_ID = '11000000-0000-0000-0000-000000000201';
const SLOT_1_ID = '12000000-0000-0000-0000-000000000201';
const SLOT_2_ID = '12000000-0000-0000-0000-000000000202';
const COMPANY_1_ID = '15000000-0000-0000-0000-000000000201';
const COMPANY_2_ID = '15000000-0000-0000-0000-000000000202';
const FACILITY_1_ID = '20000000-0000-0000-0000-000000000201'; // confirmed
const FACILITY_2_ID = '20000000-0000-0000-0000-000000000202'; // unconfirmed
const SEED_REF = 'DEMO-SEED-LOME-2026-08-29';
const CORRELATION_ID = 'demo-seed-lome-2026-08-29';

// ── Target Neon project (same values as the historical ops/neon-admin-*.json inputs;
//    adjust branchId only if the production branch changes) ────────────────────────────
const NEON_TARGET = {
  projectId: 'wild-moon-30984513',
  branchId: 'br-dawn-hill-am5amy22',
  databaseName: 'neondb',
};

const DEMO_SEED_STATEMENTS = [
  {
    label: 'demo account',
    sql: `insert into v2_accounts (id, auth_user_id, onboarding_state)
values ('${ACCOUNT_ID}'::uuid, '${ACCOUNT_AUTH_REF}', 'complete')
on conflict (id) do nothing`,
  },
  {
    label: 'demo wallet (XOF)',
    sql: `insert into v2_wallets (id, account_id, currency)
values ('${WALLET_ID}'::uuid, '${ACCOUNT_ID}'::uuid, 'XOF')
on conflict (account_id) do nothing`,
  },
  {
    label: 'demo company 1 (Adawlato)',
    sql: `insert into v2_companies (id, account_id, name, description)
values ('${COMPANY_1_ID}'::uuid, '${ACCOUNT_ID}'::uuid,
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
values ('${COMPANY_2_ID}'::uuid, '${ACCOUNT_ID}'::uuid,
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
  '${FACILITY_1_ID}'::uuid, '${ACCOUNT_ID}'::uuid, '${COMPANY_1_ID}'::uuid,
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
    label: 'facility 2 — Épicerie Chez Afi (unconfirmed)',
    sql: `insert into v2_facilities (
  id, account_id, company_id, source_kind, source_name, source_ref,
  name, category, description, latitude, longitude, address, public_hours,
  trust_state, commercial_plan, qualifying_sales, bonus_unlocked_at
)
values (
  '${FACILITY_2_ID}'::uuid, '${ACCOUNT_ID}'::uuid, '${COMPANY_2_ID}'::uuid,
  'created', 'omni_demo_seed', '${SEED_REF}-F2',
  'Épicerie Chez Afi (Tokoin Hôpital)', 'Épicerie',
  'Facilité de démonstration Omni. Épicerie de quartier à Tokoin Hôpital : produits de première nécessité à prix réduit.',
  6.157, 1.2340,
  'Tokoin Hôpital, Lomé, Togo',
  '{}'::jsonb,
  'unconfirmed', 'free', 0, null
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
values ('${SLOT_1_ID}'::uuid, '${ACCOUNT_ID}'::uuid, 'free', 'assigned', '${FACILITY_1_ID}'::uuid, now())
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
values ('${SLOT_2_ID}'::uuid, '${ACCOUNT_ID}'::uuid, 'wallet', 'assigned', '${FACILITY_2_ID}'::uuid, now())
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
    label: 'audit trail entry (idempotent)',
    sql: `insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
values (
  null,
  'demo_seed_lome',
  'facility',
  '${FACILITY_1_ID}',
  '${CORRELATION_ID}',
  'Owner-requested demo seed: 2 Lomé facilities (1 confirmed, 1 unconfirmed), 5 published products, additive and idempotent.'
)
on conflict (correlation_id, event_type, entity_type, entity_id) do nothing`,
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
  console.log(`\nDemo seed complete. Facility ids: ${FACILITY_1_ID} (confirmed), ${FACILITY_2_ID} (unconfirmed).`);
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

export { DEMO_SEED_STATEMENTS, DEMO_VERIFY_STATEMENTS, NEON_TARGET, FACILITY_1_ID, FACILITY_2_ID };
