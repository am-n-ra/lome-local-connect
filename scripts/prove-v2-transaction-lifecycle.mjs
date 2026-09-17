// Transaction lifecycle — end-to-end proof against a DISPOSABLE database branch.
//
// Drives the real shipped repository code (createTrunkRepository) through the
// whole locked transaction, which no other proof exercises end to end:
//   availability request → seller response → purchase intent (QR issued) →
//   seller QR verification → buyer payment declaration → seller payment
//   confirmation → fulfilment → buyer receipt → buyer rating (transaction closed).
//
// The lifecycle is LOCKED: it is not cancellable, only resumable. Each leg is
// asserted on the persisted state, and the notification to the counterparty
// (FF-7) is checked after a transition.
//
// NEVER point this at the canonical branch: it writes rows. Run it on a
// throwaway branch created from the canonical one, then delete the branch.
import { randomUUID, createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

if (process.env.FF8_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('txn-proof: set FF8_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes rows)');
  process.exit(2);
}
const dbUrl = process.env.FF8_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('txn-proof: missing FF8_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

console.log(`txn-proof correlationId=${correlationId} tag=${tag}`);

const buyerAuth = `txn-buyer-${tag}`;
const sellerAuth = `txn-seller-${tag}`;
let buyerAccountId; let sellerAccountId; let facilityId; let productId;

const now = () => new Date().toISOString();

try {
  buyerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${buyerAuth}) returning id`)[0].id;
  sellerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${sellerAuth}) returning id`)[0].id;
  facilityId = (await sql`insert into v2_facilities (account_id, name, trust_state, operational_state)
    values (${sellerAccountId}::uuid, ${`TXN Facility ${tag}`}, 'confirmed', 'ouvert') returning id`)[0].id;
  productId = (await sql`insert into v2_products (facility_id, name, unit, price_minor, currency, quantity_allocated_omni, publication_state)
    values (${facilityId}::uuid, ${`TXN Product ${tag}`}, 'unit', 1000, 'XOF', 10, 'published') returning id`)[0].id;
  step('fixtures: buyer + seller + facility + published offer (allocated 10)', Boolean(buyerAccountId && facilityId && productId));

  // 1. Availability: buyer asks, seller answers 2 available.
  const requestId = (await sql`insert into v2_availability_requests
    (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, status, idempotency_key, expires_at, delivery_mode)
    values (${buyerAccountId}::uuid, ${productId}::uuid, array[${facilityId}::uuid], 2, 'unlimited', 'submitted',
            ${`txn-req-${tag}`}, now() + interval '1 day', 'retrait')
    returning id`)[0].id;
  const responseId = (await sql`insert into v2_availability_responses
    (request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, observed_at)
    values (${requestId}::uuid, ${facilityId}::uuid, ${sellerAccountId}::uuid, 'available', 2, 1000, '{}'::jsonb, now())
    returning id`)[0].id;

  // 2. Intent: locks the offer and returns the QR token issued in the same
  //    statement (the buyer QR the production UI shows without a second call).
  const intent = await repository.createPurchaseIntent({
    authUserId: buyerAuth, responseId, idempotencyKey: `txn-intent-${tag}`, correlationId,
  });
  const currentState = async () => (await sql`select state from v2_transaction_events
    where transaction_id = ${intent.transactionId}::uuid order by created_at desc, id desc limit 1`)[0]?.state;
  step('intent created + QR issued', Boolean(intent.transactionId && intent.qrToken) && (await currentState()) === 'qr_ready',
    `txn=${intent.transactionId} qr=${Boolean(intent.qrToken)} state=${await currentState()}`);

  // 3. Seller verifies the buyer's QR (the gateway into the locked flow).
  const tokenHash = createHash('sha256').update(intent.qrToken).digest('hex');
  const verification = await repository.verifyQrToken({
    authUserId: sellerAuth, transactionId: intent.transactionId, tokenHash, now: now(),
  });
  step('seller verifies QR', verification.accepted === true && (await currentState()) === 'qr_verified',
    `accepted=${verification.accepted} state=${await currentState()}`);

  // 4. Buyer declares payment (cash), seller confirms it.
  await repository.declareExternalPayment({
    authUserId: buyerAuth, transactionId: intent.transactionId, method: 'cash', correlationId, now: now(),
  });
  const declared = await currentState();
  await repository.confirmExternalPayment({ authUserId: sellerAuth, transactionId: intent.transactionId, correlationId, now: now() });
  const confirmed = await currentState();
  step('payment declared then confirmed', declared === 'payment_declared' && confirmed === 'payment_confirmed',
    `declared=${declared} confirmed=${confirmed}`);

  // 5. Fulfilment: seller moves it to pending, then fulfilled.
  await repository.transitionTransaction({
    authUserId: sellerAuth, transactionId: intent.transactionId, from: 'payment_confirmed', to: 'fulfilment_pending',
    actorRole: 'seller', correlationId, now: now(),
  });
  await repository.transitionTransaction({
    authUserId: sellerAuth, transactionId: intent.transactionId, from: 'fulfilment_pending', to: 'fulfilled',
    actorRole: 'seller', correlationId, now: now(),
  });
  const fulfilled = await currentState();
  // FF-7: the counterparty (buyer) is notified at each accepted transition.
  const buyerNotified = (await sql`select count(*)::int as n from v2_notification_events
    where recipient_account_id = ${buyerAccountId}::uuid and entity_id = ${intent.transactionId}`)[0].n;
  step('fulfilment to fulfilled + buyer notified (FF-7)', fulfilled === 'fulfilled' && Number(buyerNotified) >= 1,
    `state=${fulfilled} buyerNotifications=${buyerNotified}`);

  // 6. Buyer confirms receipt, then rates — the rating closes the transaction.
  await repository.transitionTransaction({
    authUserId: buyerAuth, transactionId: intent.transactionId, from: 'fulfilled', to: 'received',
    actorRole: 'buyer', correlationId, now: now(),
  });
  const received = await currentState();
  const rating = await repository.submitTransactionRating({
    authUserId: buyerAuth, transactionId: intent.transactionId, score: 5, note: null, correlationId, now: now(),
  });
  const closed = await currentState();
  const intentState = (await sql`select state from v2_purchase_intents where id = ${intent.intentId}::uuid`)[0].state;
  step('buyer receipt + rating closes the transaction', received === 'received' && rating.state === 'rated' && closed === 'closed' && intentState === 'completed',
    `received=${received} rated=${rating.state} closed=${closed} intent=${intentState}`);

  // 7. The lifecycle is LOCKED: a second, competing transition must be refused.
  let refused = false; let refuseDetail = '';
  try {
    await repository.transitionTransaction({
      authUserId: buyerAuth, transactionId: intent.transactionId, from: 'received', to: 'payment_declared',
      actorRole: 'buyer', correlationId, now: now(),
    });
  } catch (error) { refused = true; refuseDetail = String(error?.message ?? error).slice(0, 70); }
  const stillClosed = await currentState();
  step('locked flow refuses an out-of-order transition', refused && stillClosed === 'closed', `state=${stillClosed} msg=${refuseDetail}`);

  // 8. No cancellation of an in-progress transaction: there is no buyer cancel
  //    transition for a locked flow — the request cancel route only accepts
  //    requests that are still pre-lock.
  const cancelResult = await repository.cancelAvailabilityRequest({ authUserId: buyerAuth, requestId, now: now() })
    .then(() => 'accepted').catch(() => 'refused');
  const requestStatus = (await sql`select status from v2_availability_requests where id = ${requestId}::uuid`)[0].status;
  step('no cancellation once the transaction is locked', cancelResult === 'refused' && requestStatus !== 'cancelled',
    `cancel=${cancelResult} requestStatus=${requestStatus}`);
} catch (error) {
  console.error('txn-proof: UNEXPECTED', String(error?.stack ?? error));
  failures += 1;
  process.exitCode = 1;
} finally {
  const attempts = [
    productId && sql`delete from v2_products where id = ${productId}::uuid`,
    facilityId && sql`delete from v2_facilities where id = ${facilityId}::uuid`,
    buyerAccountId && sql`delete from v2_accounts where id = ${buyerAccountId}::uuid`,
    sellerAccountId && sql`delete from v2_accounts where id = ${sellerAccountId}::uuid`,
  ].filter(Boolean);
  for (const attempt of attempts) {
    try { await attempt; } catch { /* append-only/FK rows remain — branch is disposable */ }
  }
  console.log('txn-proof: cleanup attempted (append-only rows remain — delete the disposable branch)');
}

console.log(failures === 0 ? 'txn-proof: ALL PASS' : `txn-proof: ${failures} FAILURE(S)`);
