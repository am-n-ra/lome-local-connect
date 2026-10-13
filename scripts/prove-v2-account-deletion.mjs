// BRANCHES-DELETE — end-to-end proof against a DISPOSABLE database branch.
//
// Proves the account-deletion path that had NO user-facing route before this tranche:
//   * a seller with NO open transaction is deleted → facilities detach to
//     « Non revendiquée » (niveau 0), offers are unpublished, the account is anonymised;
//   * a seller WITH an open transaction is REFUSED, and NOTHING is touched;
//   * once the transaction closes, the same account deletes;
//   * a deleted account cannot re-enter (account context is gone);
//   * re-deleting is refused (no double effect).
//
// Why a disposable branch: it writes and deletes rows. Never point it at the canonical
// branch. Create a throwaway branch from the canonical one, run, then delete it.
//
//   BD_PROOF_ALLOW_DISPOSABLE_BRANCH=1 BD_PROOF_DATABASE_URL=<branch> \
//     npx tsx scripts/prove-v2-account-deletion.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository, AccountDeletionPolicyError } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.BD_PROOF_DATABASE_URL;
if (process.env.BD_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('bd-proof: set BD_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes and deletes rows)');
  process.exit(2);
}
if (!dbUrl) { console.error('bd-proof: missing BD_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

console.log(`bd-proof correlationId=${correlationId} tag=${tag}`);

const sellerAuth = `bd-seller-${tag}`;
const buyerAuth = `bd-buyer-${tag}`;

let sellerAccountId; let buyerAccountId; let facilityId; let productId;

async function facilityRow() {
  return (await sql`select account_id, entity_id, trust_state, commercial_plan, contact_phone from v2_facilities where id = ${facilityId}::uuid`)[0];
}
async function productRow() {
  return (await sql`select publication_state from v2_products where id = ${productId}::uuid`)[0];
}
async function accountRow(auth) {
  return (await sql`select id, deleted_at, phone_declared from v2_accounts where auth_user_id = ${auth}`)[0];
}

async function openTransaction() {
  const requestId = (await sql`insert into v2_availability_requests
    (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, status, idempotency_key, expires_at, delivery_mode)
    values (${buyerAccountId}::uuid, ${productId}::uuid, array[${facilityId}::uuid], 1, 'unlimited', 'submitted',
            ${`bd-req-${tag}-${randomUUID()}`}, now() + interval '1 day', 'retrait')
    returning id`)[0].id;
  const responseId = (await sql`insert into v2_availability_responses
    (request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, observed_at)
    values (${requestId}::uuid, ${facilityId}::uuid, ${sellerAccountId}::uuid, 'available', 1, 1000, '{}'::jsonb, now())
    returning id`)[0].id;
  return repository.createPurchaseIntent({ authUserId: buyerAuth, responseId, idempotencyKey: `bd-intent-${tag}-${randomUUID()}`, correlationId });
}

try {
  // ---- Fixtures: seller + buyer accounts, one owned facility, one published offer.
  sellerAccountId = (await sql`insert into v2_accounts (auth_user_id, phone_declared) values (${sellerAuth}, '+22890112233') returning id`)[0].id;
  buyerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${buyerAuth}) returning id`)[0].id;
  facilityId = (await sql`insert into v2_facilities (account_id, name, trust_state, operational_state, contact_phone)
    values (${sellerAccountId}::uuid, ${`BD Facility ${tag}`}, 'confirmed', 'ouvert', '+22890112233') returning id`)[0].id;
  productId = (await sql`insert into v2_products (facility_id, name, unit, price_minor, currency, quantity_allocated_omni, publication_state)
    values (${facilityId}::uuid, ${`BD Product ${tag}`}, 'unit', 1000, 'XOF', 10, 'published') returning id`)[0].id;
  step('fixtures: seller + buyer + owned facility + published offer', Boolean(sellerAccountId && buyerAccountId && facilityId && productId));

  // ---- T1: an OPEN transaction blocks deletion, and NOTHING is touched.
  const intent = await openTransaction();
  let refused = false; let refusedOpen = null;
  try {
    await repository.deleteAccount({ authUserId: sellerAuth, reason: 'test' });
  } catch (error) {
    refused = true;
    if (error instanceof AccountDeletionPolicyError) refusedOpen = error.openTransactions;
  }
  const f1 = await facilityRow();
  const p1 = await productRow();
  const a1 = await accountRow(sellerAuth);
  step('T1 open transaction blocks deletion and touches nothing',
    refused && refusedOpen === 1 && f1.account_id === sellerAccountId && f1.trust_state === 'confirmed'
      && p1.publication_state === 'published' && a1.deleted_at === null,
    `refused=${refused} open=${refusedOpen} account_id=${f1.account_id ? 'kept' : 'NULL'} trust=${f1.trust_state} pub=${p1.publication_state}`);

  // ---- T2: once the transaction is closed, the SAME account deletes.
  await sql`insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
    values (${intent.transactionId}::uuid, ${buyerAccountId}::uuid, 'closed', '{}'::jsonb, now() + interval '1 hour')
    on conflict (transaction_id, state) do nothing`;
  const result = await repository.deleteAccount({ authUserId: sellerAuth, reason: 'je pars' });
  const f2 = await facilityRow();
  const p2 = await productRow();
  const a2 = await accountRow(sellerAuth);
  step('T2 closed transaction → deletion proceeds (facility detaches to unclaimed)',
    result.facilitiesDetached === 1 && result.offersArchived === 1
      && f2.account_id === null && f2.trust_state === 'unclaimed' && f2.commercial_plan === 'free'
      && f2.contact_phone === null && f2.entity_id === null
      && p2.publication_state === 'archived' && a2.deleted_at !== null && a2.phone_declared === null,
    `detached=${result.facilitiesDetached} archived=${result.offersArchived} account_id=${f2.account_id === null ? 'NULL' : f2.account_id} trust=${f2.trust_state} pub=${p2.publication_state}`);

  // ---- T3: an audit event records the deletion.
  const audit = (await sql`select count(*)::int as n from v2_audit_events where event_type = 'account_deleted' and entity_id = ${sellerAccountId}::text`)[0];
  step('T3 deletion is audited (account_deleted)', Number(audit.n) === 1, `audit rows=${audit.n}`);

  // ---- T4: a deleted account cannot re-enter.
  const context = await repository.getAccountContext({ authUserId: sellerAuth });
  step('T4 deleted account has no context (cannot re-enter)', context === null, `context=${context === null ? 'null' : 'PRESENT'}`);

  // ---- T5: re-deleting is refused, with no double effect.
  let reRefused = false;
  try {
    await repository.deleteAccount({ authUserId: sellerAuth, reason: 'again' });
  } catch { reRefused = true; }
  const f5 = await facilityRow();
  step('T5 re-deletion refused, no double effect', reRefused && f5.account_id === null, `refused=${reRefused}`);

  // ---- T6: the buyer (no facilities, no open txn) deletes cleanly — a plain buyer path.
  const buyerResult = await repository.deleteAccount({ authUserId: buyerAuth });
  const buyerRow = await accountRow(buyerAuth);
  step('T6 buyer with no facility deletes cleanly', buyerResult.facilitiesDetached === 0 && buyerRow.deleted_at !== null,
    `detached=${buyerResult.facilitiesDetached} deleted=${buyerRow.deleted_at !== null}`);
} catch (error) {
  step('unexpected error', false, String(error?.stack ?? error).slice(0, 300));
} finally {
  // Cleanup: append-only transaction tables forbid deletes on snapshots/events, but this
  // branch is disposable and thrown away — we still clear the rows we own where allowed.
  try {
    await sql`delete from v2_availability_responses where facility_id = ${facilityId}::uuid`;
    await sql`delete from v2_availability_requests where product_id = ${productId}::uuid`;
    await sql`delete from v2_products where id = ${productId}::uuid`;
    await sql`delete from v2_facilities where id = ${facilityId}::uuid`;
    await sql`delete from v2_accounts where auth_user_id in (${sellerAuth}, ${buyerAuth})`;
    console.log('cleanup: best-effort (append-only tables may retain transaction rows on this disposable branch)');
  } catch (error) {
    console.log('cleanup: skipped —', String(error?.message ?? error).slice(0, 120));
  }
}

console.log(`bd-proof ${failures === 0 ? 'ALL PASS' : `${failures} FAIL`}`);
