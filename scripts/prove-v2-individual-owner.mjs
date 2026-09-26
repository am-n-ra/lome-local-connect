// R-D (S-13 / D-C6) — end-to-end proof against a DISPOSABLE database branch.
//
// Proves the path that had NO code route before this fix: a seller declaring
// `ownerKind: 'individu'` through the SHIPPED `createSellerFacility`, then reaching
// trust confirmation after ONE distinct buyer — versus THREE for an organisation.
//
// Why a disposable branch: it writes and deletes rows. Never point it at the canonical
// branch. Create a throwaway branch from the canonical one, run, then delete it.
//
//   RD_PROOF_ALLOW_DISPOSABLE_BRANCH=1 RD_PROOF_DATABASE_URL=<branch> \
//     npx tsx scripts/prove-v2-individual-owner.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.RD_PROOF_DATABASE_URL;
if (process.env.RD_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('rd-proof: set RD_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes and deletes rows)');
  process.exit(2);
}
if (!dbUrl) { console.error('rd-proof: missing RD_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

console.log(`rd-proof correlationId=${correlationId} tag=${tag}`);

const individuAuth = `rd-individu-${tag}`;
const businessAuth = `rd-business-${tag}`;
const accountIds = []; const facilityIds = [];

try {
  await sql`insert into v2_accounts (auth_user_id) values (${individuAuth}), (${businessAuth})`;

  // ---- T1: the SHIPPED create path persists the DECLARED nature.
  const individu = await repository.createSellerFacility({
    authUserId: individuAuth, name: `Couture ${tag}`, facilityType: 'digital',
    ownerKind: 'individu', category: 'Textile', description: null, address: null,
    latitude: null, longitude: null, rayonKm: null, contactPhone: null, contactWhatsapp: null,
    idempotencyKey: `rd-individu-${tag}-create`,
  });
  facilityIds.push(individu.facilityId);
  const individuEntity = (await sql`
    select e.kind, f.entity_id from v2_facilities f
    join v2_entities e on e.id = f.entity_id
    where f.id = ${individu.facilityId}::uuid`)[0];
  step('T1 shipped create path persists a declared individu',
    individuEntity?.kind === 'individu',
    `kind=${individuEntity?.kind} entity=${individuEntity?.entity_id ? 'linked' : 'MISSING'}`);

  const business = await repository.createSellerFacility({
    authUserId: businessAuth, name: `Épicerie ${tag}`, facilityType: 'fixe',
    ownerKind: 'organisation', category: null, description: null, address: 'Lomé',
    latitude: 6.13, longitude: 1.22, rayonKm: null, contactPhone: null, contactWhatsapp: null,
    idempotencyKey: `rd-business-${tag}-create`,
  });
  facilityIds.push(business.facilityId);
  const businessEntity = (await sql`
    select e.kind from v2_facilities f join v2_entities e on e.id = f.entity_id
    where f.id = ${business.facilityId}::uuid`)[0];
  step('T2 declared organisation is preserved too', businessEntity?.kind === 'organisation',
    `kind=${businessEntity?.kind}`);

  // ---- Build a real closed transaction for a given facility + buyer.
  async function closedSale(facilityId, buyerAuthId) {
    const buyerId = (await sql`insert into v2_accounts (auth_user_id) values (${buyerAuthId}) returning id`)[0].id;
    accountIds.push(buyerId);
    const sellerId = (await sql`select account_id from v2_facilities where id = ${facilityId}::uuid`)[0].account_id;
    const productId = (await sql`insert into v2_products (facility_id, name, unit, price_minor, currency, quantity_allocated_omni, publication_state)
      values (${facilityId}::uuid, ${`Offer ${tag}`}, 'unit', 1000, 'XOF', 5, 'published') returning id`)[0].id;
    const requestId = (await sql`insert into v2_availability_requests
      (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, status, idempotency_key, expires_at, delivery_mode)
      values (${buyerId}::uuid, ${productId}::uuid, array[${facilityId}::uuid], 1, 'unlimited', 'submitted',
              ${`rd-req-${tag}-${randomUUID()}`}, now() + interval '1 day', 'retrait') returning id`)[0].id;
    const responseId = (await sql`insert into v2_availability_responses
      (request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, observed_at)
      values (${requestId}::uuid, ${facilityId}::uuid, ${sellerId}::uuid, 'available', 1, 1000, '{}'::jsonb, now())
      returning id`)[0].id;
    const intent = await repository.createPurchaseIntent({
      authUserId: buyerAuthId, responseId, idempotencyKey: `rd-intent-${tag}-${randomUUID()}`, correlationId,
    });
    await sql`insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
      values (${intent.transactionId}::uuid, ${buyerId}::uuid, 'received', '{}'::jsonb, now() + interval '1 hour')
      on conflict (transaction_id, state) do nothing`;
    await repository.submitTransactionRating({
      authUserId: buyerAuthId, transactionId: intent.transactionId, score: 5, note: null,
      correlationId, now: new Date().toISOString(),
    });
  }

  // ---- T3: ONE distinct buyer CONFIRMS an individu (threshold 1).
  await closedSale(individu.facilityId, `rd-buyer-a-${tag}`);
  const afterOne = (await sql`select trust_state, qualifying_sales from v2_facilities where id = ${individu.facilityId}::uuid`)[0];
  step('T3 one sale confirms an individu (threshold 1)',
    afterOne.trust_state === 'confirmed',
    `trust=${afterOne.trust_state} qualifying=${afterOne.qualifying_sales}`);

  // ---- T4: the SAME single sale does NOT confirm an organisation (threshold 3).
  await closedSale(business.facilityId, `rd-buyer-b-${tag}`);
  const businessAfterOne = (await sql`select trust_state, qualifying_sales from v2_facilities where id = ${business.facilityId}::uuid`)[0];
  step('T4 one sale does NOT confirm an organisation (threshold 3)',
    businessAfterOne.trust_state !== 'confirmed' && Number(businessAfterOne.qualifying_sales) === 1,
    `trust=${businessAfterOne.trust_state} qualifying=${businessAfterOne.qualifying_sales}`);

  // ---- T5: control — the business reaches confirmed only after THREE distinct buyers.
  await closedSale(business.facilityId, `rd-buyer-c-${tag}`);
  await closedSale(business.facilityId, `rd-buyer-d-${tag}`);
  const businessAfterThree = (await sql`select trust_state, qualifying_sales from v2_facilities where id = ${business.facilityId}::uuid`)[0];
  step('T5 three distinct buyers confirm the organisation',
    businessAfterThree.trust_state === 'confirmed' && Number(businessAfterThree.qualifying_sales) === 3,
    `trust=${businessAfterThree.trust_state} qualifying=${businessAfterThree.qualifying_sales}`);
} catch (error) {
  console.error('rd-proof: UNEXPECTED', String(error?.stack ?? error));
  failures += 1;
  process.exitCode = 1;
} finally {
  // Transaction snapshots/events are append-only guarded: cleanup is best-effort and
  // the branch is disposable.
  for (const id of facilityIds) {
    try { await sql`delete from v2_facilities where id = ${id}::uuid`; } catch { /* append-only rows remain */ }
  }
  console.log('rd-proof: cleanup attempted (append-only rows remain — delete the disposable branch)');
}

console.log(failures === 0 ? 'rd-proof: ALL PASS' : `rd-proof: ${failures} FAILURE(S)`);
