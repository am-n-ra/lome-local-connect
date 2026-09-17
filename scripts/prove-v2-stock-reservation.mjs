// FF-8 stock reservation — end-to-end proof against a DISPOSABLE database branch.
//
// Drives the real shipped repository code (createTrunkRepository) against a real
// Postgres branch, with real fixtures, to prove the full reservation lifecycle:
//   reserve at lock → replay does not double-reserve → oversell is refused →
//   release at expiry → decrement at close → replay of close is idempotent.
//
// This closes the honest residual gap of FF-8: SQL-level probes prove the set
// operations, this proves the *shipped code path* end to end.
//
// NEVER point this at the canonical branch: it writes and deletes rows. Run it on
// a throwaway branch created from the canonical one, then delete the branch.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.FF8_PROOF_DATABASE_URL;
if (process.env.FF8_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('ff8-proof: set FF8_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes and deletes rows)');
  process.exit(2);
}
if (!dbUrl) { console.error('ff8-proof: missing FF8_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}
function abort(reason) { console.error(`ff8-proof: ABORT ${reason}`); process.exit(1); }

console.log(`ff8-proof correlationId=${correlationId} tag=${tag}`);

const buyerAuth = `ff8-buyer-${tag}`;
const sellerAuth = `ff8-seller-${tag}`;

async function available(productId) {
  const rows = await sql`select quantity_allocated_omni, quantity_reserved_omni,
    greatest(quantity_allocated_omni - quantity_reserved_omni, 0) as available
    from v2_products where id = ${productId}::uuid`;
  const r = rows[0];
  return { allocated: Number(r.quantity_allocated_omni), reserved: Number(r.quantity_reserved_omni), available: Number(r.available) };
}

let buyerAccountId; let sellerAccountId; let facilityId; let productId;
const requestIds = []; const responseIds = [];

try {
  // ---- Fixtures: two accounts, one facility, one published offer (allocated 10).
  buyerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${buyerAuth}) returning id`)[0].id;
  sellerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${sellerAuth}) returning id`)[0].id;
  facilityId = (await sql`insert into v2_facilities (account_id, name, trust_state, operational_state)
    values (${sellerAccountId}::uuid, ${`FF-8 Facility ${tag}`}, 'confirmed', 'ouvert') returning id`)[0].id;
  productId = (await sql`insert into v2_products (facility_id, name, unit, price_minor, currency, quantity_allocated_omni, publication_state)
    values (${facilityId}::uuid, ${`FF-8 Product ${tag}`}, 'unit', 1000, 'XOF', 10, 'published') returning id`)[0].id;
  step('fixtures: buyer + seller + facility + published offer (allocated 10)', Boolean(buyerAccountId && facilityId && productId));

  // Helper: a submitted request answered with `qty` available, ready to lock.
  async function eligibleResponse(qty) {
    const requestId = (await sql`insert into v2_availability_requests
      (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, status, idempotency_key, expires_at, delivery_mode)
      values (${buyerAccountId}::uuid, ${productId}::uuid, array[${facilityId}::uuid], ${qty}, 'unlimited', 'submitted',
              ${`ff8-req-${tag}-${randomUUID()}`}, now() + interval '1 day', 'retrait')
      returning id`)[0].id;
    requestIds.push(requestId);
    const responseId = (await sql`insert into v2_availability_responses
      (request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, observed_at)
      values (${requestId}::uuid, ${facilityId}::uuid, ${sellerAccountId}::uuid, 'available', ${qty}, 1000, '{}'::jsonb, now())
      returning id`)[0].id;
    responseIds.push(responseId);
    return responseId;
  }

  // ---- T1: reserve at lock. Offer 10, buyer locks 2 → 8 available, 2 held.
  const response1 = await eligibleResponse(2);
  const intent1 = await repository.createPurchaseIntent({
    authUserId: buyerAuth, responseId: response1, idempotencyKey: `ff8-intent-${tag}-1`, correlationId,
  });
  let stock = await available(productId);
  step('T1 reserve at lock', stock.reserved === 2 && stock.available === 8 && stock.allocated === 10,
    `allocated=${stock.allocated} reserved=${stock.reserved} available=${stock.available} intent=${intent1.intentId}`);

  // ---- T2: replay of the same idempotency key returns the same intent and does NOT double-reserve.
  const replay = await repository.createPurchaseIntent({
    authUserId: buyerAuth, responseId: response1, idempotencyKey: `ff8-intent-${tag}-1`, correlationId,
  });
  stock = await available(productId);
  step('T2 replay is idempotent (no double reserve)', replay.intentId === intent1.intentId && stock.reserved === 2,
    `sameIntent=${replay.intentId === intent1.intentId} reserved=${stock.reserved}`);

  // ---- T3: oversell is refused. 8 available, buyer asks 9 → no intent, stock untouched.
  const response2 = await eligibleResponse(9);
  let refused = false; let refuseDetail = '';
  try {
    await repository.createPurchaseIntent({
      authUserId: buyerAuth, responseId: response2, idempotencyKey: `ff8-intent-${tag}-2`, correlationId,
    });
  } catch (error) { refused = true; refuseDetail = String(error?.message ?? error).slice(0, 90); }
  stock = await available(productId);
  step('T3 oversell refused (9 > 8 available)', refused && stock.reserved === 2, `reserved=${stock.reserved} msg=${refuseDetail}`);

  // ---- T4: decrement at close. Drive transaction 1 to 'received', then rate it.
  await sql`insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
    values (${intent1.transactionId}::uuid, ${buyerAccountId}::uuid, 'received', '{}'::jsonb, now() + interval '1 hour')
    on conflict (transaction_id, state) do nothing`;
  const rating = await repository.submitTransactionRating({
    authUserId: buyerAuth, transactionId: intent1.transactionId, score: 5, note: null,
    correlationId, now: new Date().toISOString(),
  });
  stock = await available(productId);
  step('T4 decrement at close', stock.allocated === 8 && stock.reserved === 0 && stock.available === 8,
    `allocated=${stock.allocated} reserved=${stock.reserved} state=${rating.state}`);

  // ---- T5: replay of close is idempotent (closed_event already exists → no second decrement).
  await repository.submitTransactionRating({
    authUserId: buyerAuth, transactionId: intent1.transactionId, score: 5, note: null,
    correlationId, now: new Date().toISOString(),
  }).catch(() => undefined);
  stock = await available(productId);
  step('T5 replay of close is idempotent', stock.allocated === 8 && stock.reserved === 0,
    `allocated=${stock.allocated} reserved=${stock.reserved}`);

  // ---- T6: release at expiry. Lock 3 more, then sweep with a clock past the window.
  const response3 = await eligibleResponse(3);
  const intent3 = await repository.createPurchaseIntent({
    authUserId: buyerAuth, responseId: response3, idempotencyKey: `ff8-intent-${tag}-3`, correlationId,
  });
  const held = await available(productId);
  // Snapshots are append-only (guard trigger), so the age is driven from the
  // sweep's own clock: a `now` past the window makes the fresh intent stale.
  const sweep = await repository.sweepExpiredIntents({ now: new Date(Date.now() + 3 * 3600_000).toISOString(), correlationId });
  const released = await available(productId);
  const expiredState = (await sql`select state from v2_purchase_intents where id = ${intent3.intentId}::uuid`)[0].state;
  step('T6 release at expiry', held.reserved === 3 && held.allocated === 8 && sweep.expired >= 1 && released.reserved === 0 && released.allocated === 8 && expiredState === 'expired',
    `held=${held.reserved} expired=${sweep.expired} released=${released.reserved} allocated=${released.allocated} state=${expiredState}`);
} catch (error) {
  console.error('ff8-proof: UNEXPECTED', String(error?.stack ?? error));
  failures += 1;
  process.exitCode = 1;
} finally {
  // Snapshots/events/intents are append-only guarded or FK-bound: this harness is
  // meant for a DISPOSABLE branch, deleted afterwards. Cleanup is best-effort.
  const attempts = [
    productId && sql`delete from v2_products where id = ${productId}::uuid`,
    facilityId && sql`delete from v2_facilities where id = ${facilityId}::uuid`,
    buyerAccountId && sql`delete from v2_accounts where id = ${buyerAccountId}::uuid`,
    sellerAccountId && sql`delete from v2_accounts where id = ${sellerAccountId}::uuid`,
  ].filter(Boolean);
  for (const attempt of attempts) {
    try { await attempt; } catch { /* FK/append-only rows remain — branch is disposable */ }
  }
  console.log('ff8-proof: cleanup attempted (append-only rows remain — delete the disposable branch)');
}

console.log(failures === 0 ? 'ff8-proof: ALL PASS' : `ff8-proof: ${failures} FAILURE(S)`);
