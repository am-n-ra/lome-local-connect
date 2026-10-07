// TRUNK-X1 — end-to-end proof against a DISPOSABLE database branch.
//
// Proves the *shipped repository code* turns an expired (never-scanned) purchase
// intent into an honest terminal state instead of a zombie "in progress":
//   - create intent (lock) → it appears in listOpenTransactions
//   - sweep the intent as expired → it DISAPPEARS from the open list
//   - getTransaction reports state 'expired' (not 'intent_created')
//   - the canonical 'expired' event exists in v2_transaction_events
//   - stock reservation is released
//
// Why a real branch: the stubbed unit suite never compiles SQL, so it cannot see
// that the timeline had no 'expired' row. Same class as D-TXN-11 / FF-8.
//
// NEVER point this at the canonical branch. Run it on a throwaway branch created
// from the canonical one (with migration 067 applied), then delete the branch.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.X1_PROOF_DATABASE_URL;
if (process.env.X1_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('x1-proof: set X1_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (writes and deletes rows)');
  process.exit(2);
}
if (!dbUrl) { console.error('x1-proof: missing X1_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

console.log(`x1-proof correlationId=${correlationId} tag=${tag}`);

const buyerAuth = `x1-buyer-${tag}`;
const sellerAuth = `x1-seller-${tag}`;
let buyerAccountId; let sellerAccountId; let facilityId; let productId;

try {
  buyerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${buyerAuth}) returning id`)[0].id;
  sellerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${sellerAuth}) returning id`)[0].id;
  facilityId = (await sql`insert into v2_facilities (account_id, name, trust_state, operational_state)
    values (${sellerAccountId}::uuid, ${`X1 Facility ${tag}`}, 'confirmed', 'ouvert') returning id`)[0].id;
  productId = (await sql`insert into v2_products (facility_id, name, unit, price_minor, currency, quantity_allocated_omni, publication_state)
    values (${facilityId}::uuid, ${`X1 Product ${tag}`}, 'unit', 1000, 'XOF', 10, 'published') returning id`)[0].id;
  step('fixtures: buyer + seller + facility + published offer (allocated 10)', Boolean(buyerAccountId && facilityId && productId));

  const requestId = (await sql`insert into v2_availability_requests
    (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, status, idempotency_key, expires_at, delivery_mode)
    values (${buyerAccountId}::uuid, ${productId}::uuid, array[${facilityId}::uuid], 2, 'unlimited', 'submitted',
            ${`x1-req-${tag}`}, now() + interval '1 day', 'retrait')
    returning id`)[0].id;
  const responseId = (await sql`insert into v2_availability_responses
    (request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, observed_at)
    values (${requestId}::uuid, ${facilityId}::uuid, ${sellerAccountId}::uuid, 'available', 2, 1000, '{}'::jsonb, now())
    returning id`)[0].id;

  const intent = await repository.createPurchaseIntent({
    authUserId: buyerAuth, responseId, idempotencyKey: `x1-intent-${tag}`, correlationId,
  });

  // T1: the freshly created intent IS an open transaction.
  const openBefore = await repository.listOpenTransactions({ authUserId: buyerAuth });
  step('T1 intent appears in the open list before expiry',
    openBefore.transactions.some((t) => t.transactionId === intent.transactionId),
    `open=${openBefore.transactions.length}`);

  // T2: sweep with a clock past the 60-min window → the intent expires.
  const sweep = await repository.sweepExpiredIntents({ now: new Date(Date.now() + 3 * 3600_000).toISOString(), correlationId });
  step('T2 sweep expires the stalled pre-lock intent', sweep.expired >= 1, `expired=${sweep.expired}`);

  // T3 (core): it must DISAPPEAR from the open list — no zombie.
  const openAfter = await repository.listOpenTransactions({ authUserId: buyerAuth });
  step('T3 TRUNK-X1: expired intent is NOT "en cours" (no zombie)',
    !openAfter.transactions.some((t) => t.transactionId === intent.transactionId),
    `open=${openAfter.transactions.length}`);

  // T4: the resumed detail reports an honest terminal state.
  const detail = await repository.getTransaction({ authUserId: buyerAuth, transactionId: intent.transactionId });
  step('T4 getTransaction reports state=expired', detail?.state === 'expired', `state=${detail?.state}`);

  // T5: the canonical timeline carries the 'expired' event (the fix's material).
  const evRows = await sql`select count(*)::int as n from v2_transaction_events where transaction_id = ${intent.transactionId}::uuid and state = 'expired'`;
  step('T5 the canonical expired event exists in v2_transaction_events', Number(evRows[0].n) === 1, `rows=${evRows[0].n}`);

  // T6: the stock reservation was released (FF-8 invariant preserved).
  const stock = (await sql`select quantity_allocated_omni, quantity_reserved_omni from v2_products where id = ${productId}::uuid`)[0];
  step('T6 reservation released, declared stock intact',
    Number(stock.quantity_reserved_omni) === 0 && Number(stock.quantity_allocated_omni) === 10,
    `allocated=${stock.quantity_allocated_omni} reserved=${stock.quantity_reserved_omni}`);

  // T7: replay of the sweep is a no-op (idempotent), and still no zombie.
  const replay = await repository.sweepExpiredIntents({ now: new Date(Date.now() + 4 * 3600_000).toISOString(), correlationId });
  const openReplay = await repository.listOpenTransactions({ authUserId: buyerAuth });
  step('T7 sweep replay is a no-op and the list stays honest',
    replay.expired === 0 && !openReplay.transactions.some((t) => t.transactionId === intent.transactionId),
    `expired=${replay.expired} open=${openReplay.transactions.length}`);
} catch (error) {
  console.error(`x1-proof: ABORT ${String(error?.message ?? error).slice(0, 160)}`);
  process.exitCode = 1;
} finally {
  // Best-effort cleanup: this is a disposable branch, but keep it tidy.
  try {
    if (productId) await sql`delete from v2_availability_responses where facility_id = ${facilityId}::uuid`;
    if (productId) await sql`delete from v2_availability_requests where product_id = ${productId}::uuid`;
  } catch { /* branch is disposable */ }
  console.log(failures === 0 ? 'x1-proof: ALL PASS' : `x1-proof: ${failures} FAILURE(S)`);
}
