// TRUNK-X2 auto-availability — end-to-end proof against a DISPOSABLE database branch.
//
// Drives the shipped reconcile function + repository seams against a real Postgres
// branch with real fixtures to prove the honoured contract:
//   * derived from stock: available>0 → en_stock, else a_valider ;
//   * a full reservation (available 0) flips en_stock → a_valider ;
//   * bientot stays MANUAL (never overwritten) ;
//   * piece_unique capacity is 1 (R-G) ;
//   * the Pro gate is the LIVE entitlement (D-04 / R-4b) — no Pro, no auto ;
//   * replay is a no-op and every transition is traced (source='auto').
//
// NEVER point this at the canonical branch: it writes rows. Run it on a throwaway
// branch created from the canonical one, then delete the branch.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.X2_PROOF_DATABASE_URL;
if (process.env.X2_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('x2-proof: set X2_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes rows)');
  process.exit(2);
}
if (!dbUrl) { console.error('x2-proof: missing X2_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}
function abort(reason) { console.error(`x2-proof: ABORT ${reason}`); process.exit(1); }

console.log(`x2-proof correlationId=${correlationId} tag=${tag}`);

const sellerAuth = `x2-seller-${tag}`;

async function stateOf(productId) {
  const rows = await sql`select availability_state, availability_expires_at, quantity_allocated_omni, quantity_reserved_omni from v2_products where id = ${productId}::uuid`;
  return rows[0];
}
async function reconcile() {
  const r = await sql`select v2_reconcile_auto_availability() as n`;
  return Number(r[0].n);
}

let sellerAccountId; let entityId; let facilityId; let grantId;
let product; let piece;

try {
  sellerAccountId = (await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${sellerAuth}, 'seller_ready') returning id`)[0].id;
  entityId = (await sql`insert into v2_entities (account_id, kind, display_name) values (${sellerAccountId}::uuid, 'organisation', ${`X2 Entity ${tag}`}) returning id`)[0].id;
  facilityId = (await sql`insert into v2_facilities (account_id, entity_id, name, trust_state, operational_state)
    values (${sellerAccountId}::uuid, ${entityId}::uuid, ${`X2 Facility ${tag}`}, 'confirmed', 'ouvert') returning id`)[0].id;
  // A Pro entitlement on the entity (R-4b) — the LIVE capability.
  grantId = (await sql`insert into v2_facility_entitlements (facility_id, entity_id, entitlement_kind, state, ends_at, source)
    values (${facilityId}::uuid, ${entityId}::uuid, 'facility_pro', 'active', now() + interval '30 days', 'manual') returning id`)[0].id;
  product = (await sql`insert into v2_products (facility_id, entity_id, name, unit, price_minor, currency, quantity_allocated_omni, quantity_reserved_omni, publication_state, availability_state, auto_availability)
    values (${facilityId}::uuid, ${entityId}::uuid, ${`X2 Product ${tag}`}, 'unit', 1000, 'XOF', 10, 0, 'published', 'a_valider', true) returning id`)[0].id;
  piece = (await sql`insert into v2_products (facility_id, entity_id, name, unit, price_minor, currency, quantity_allocated_omni, quantity_reserved_omni, publication_state, availability_state, auto_availability, uniqueness_kind)
    values (${facilityId}::uuid, ${entityId}::uuid, ${`X2 Piece ${tag}`}, 'unit', 5000, 'XOF', 1, 0, 'published', 'a_valider', true, 'piece_unique') returning id`)[0].id;
  step('fixtures: seller + entity + facility + Pro entitlement + published offers', Boolean(product && piece));
} catch (error) { abort(`fixtures failed: ${error.message}`); }

// T1 — available 10 > 0 → en_stock, expiry ≈ +24h, traced auto_from_stock.
{
  const n = await reconcile();
  const p = await stateOf(product);
  const traced = await sql`select count(*)::int as c from v2_product_stock_events where product_id = ${product}::uuid and source = 'auto' and reason = 'auto_from_stock'`;
  const hours = p.availability_expires_at ? (new Date(p.availability_expires_at).getTime() - Date.now()) / 3.6e6 : null;
  step('T1 stock available → en_stock', p.availability_state === 'en_stock' && n >= 1, `state=${p.availability_state} changed=${n}`);
  step('T1b expiry ≈ 24 h and transition traced (auto)', hours !== null && hours > 23 && hours < 25 && Number(traced[0].c) >= 1, `hours=${hours?.toFixed(1)} traced=${traced[0].c}`);
}

// T2 — full reservation (available 0) → a_valider.
{
  await sql`update v2_products set quantity_reserved_omni = 10 where id = ${product}::uuid`;
  await reconcile();
  const p = await stateOf(product);
  step('T2 fully reserved (available 0) → a_valider', p.availability_state === 'a_valider', `state=${p.availability_state}`);
  await sql`update v2_products set quantity_reserved_omni = 0 where id = ${product}::uuid`;
  await reconcile();
}

// T3 — bientot is MANUAL: never overwritten by auto.
{
  await sql`update v2_products set availability_state = 'bientot' where id = ${product}::uuid`;
  await reconcile();
  const p = await stateOf(product);
  step('T3 « bientôt » (manuel) reste bientôt', p.availability_state === 'bientot', `state=${p.availability_state}`);
  await sql`update v2_products set availability_state = 'a_valider' where id = ${product}::uuid`;
}

// T4 — piece_unique capacity is 1 (R-G).
{
  await reconcile();
  const a = await stateOf(piece);
  await sql`update v2_products set quantity_reserved_omni = 1 where id = ${piece}::uuid`;
  await reconcile();
  const b = await stateOf(piece);
  step('T4 pièce unique : dispo(1) → en_stock, réservée → a_valider', a.availability_state === 'en_stock' && b.availability_state === 'a_valider', `before=${a.availability_state} after=${b.availability_state}`);
}

// T5 — Pro gate: revoke the entitlement → no auto (stays a_valider despite stock).
{
  await sql`update v2_products set availability_state = 'a_valider' where id = ${product}::uuid`;
  await sql`update v2_facility_entitlements set state = 'revoked' where id = ${grantId}::uuid`;
  await reconcile();
  const p = await stateOf(product);
  step('T5 sans Pro vivant → aucun auto (reste a_valider)', p.availability_state === 'a_valider', `state=${p.availability_state}`);
  await sql`update v2_facility_entitlements set state = 'active' where id = ${grantId}::uuid`;
}

// T6 — replay is a no-op once the state is correct.
{
  await reconcile();
  const n = await reconcile();
  step('T6 rejeu = no-op une fois l’état correct', n === 0, `changed=${n}`);
}

// T7 — shipped repo seam: setProductAutoAvailability under the LIVE entitlement.
{
  await sql`update v2_products set auto_availability = false, availability_state = 'a_valider' where id = ${product}::uuid`;
  const result = await repository.setProductAutoAvailability({ authUserId: sellerAuth, productId: String(product), enabled: true });
  const p = await stateOf(product);
  step('T7 repo : setProductAutoAvailability(true) active + réconcilie', result.autoAvailability === true && p.availability_state === 'en_stock', `state=${p.availability_state}`);
}

console.log(`x2-proof: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
