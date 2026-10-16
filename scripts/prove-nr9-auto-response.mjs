// NR-9 — prove the automation actor against a DISPOSABLE branch, using the SHIPPED code.
//
// The pure module already proves the DECISION. Here we prove the WRITE and the HONESTY of what
// the buyer reads: a Pro + auto-enabled + fresh offer answers on its own, at the listed price,
// on behalf of the entity; and it DEFERS (leaving the request open) on negotiation, stale stock,
// insufficient stock, no Pro, and no auto setting.
//
// Run: NR9_PROOF_ALLOW_DISPOSABLE_BRANCH=1 NR9_PROOF_DATABASE_URL=<branch> npx tsx scripts/prove-nr9-auto-response.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.NR9_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('missing NR9_PROOF_DATABASE_URL'); process.exit(2); }
const sql = neon(dbUrl);
const repo = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

async function makeWorld({ autoEnabled, pro, state, expiresInHours, allocated, price = 20000, discount = 0, priceKind = 'fixe' }) {
  const sellerAuth = `nr9-seller-${tag}-${randomUUID().slice(0, 6)}`;
  const buyerAuth = `nr9-buyer-${tag}-${randomUUID().slice(0, 6)}`;
  await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${sellerAuth}, 'seller_ready')`;
  await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${buyerAuth}, 'buyer_ready')`;
  const seller = (await sql`select id from v2_accounts where auth_user_id = ${sellerAuth}`)[0];
  const buyer = (await sql`select id from v2_accounts where auth_user_id = ${buyerAuth}`)[0];
  const entityId = (await sql`insert into v2_entities (account_id, kind, display_name, trust_state) values (${seller.id}::uuid, 'organisation', ${`NR9 ${tag}`}, 'confirmed') returning id`)[0].id;
  const facilityId = (await sql`insert into v2_facilities (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, trust_state, operational_state) values (${seller.id}::uuid, ${entityId}::uuid, 'created', 'seller', ${`nr9-${tag}-${randomUUID().slice(0, 8)}`}, ${`NR9 ${tag}`}, 'fixe', 'confirmed', 'ouvert') returning id`)[0].id;
  await sql`insert into v2_facility_slots (account_id, facility_id, source, status) values (${seller.id}::uuid, ${facilityId}::uuid, 'free', 'assigned')`;
  if (pro) {
    await sql`
      insert into v2_facility_entitlements (facility_id, entity_id, entitlement_kind, state, source, starts_at, ends_at)
      values (${facilityId}::uuid, ${entityId}::uuid, 'facility_pro', 'active', 'wallet', now(), now() + interval '30 days')`;
  }
  const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();
  const productId = (await sql`
    insert into v2_products (facility_id, entity_id, name, description, unit, currency, price_minor,
      discount_kind, discount_value, quantity_allocated_omni, publication_state, availability_state,
      availability_expires_at, auto_availability, position_kind, uniqueness_kind, handover_kind, price_kind, condition_kind, media)
    values (${facilityId}::uuid, ${entityId}::uuid, ${`NR9 ${tag}`}, 'Offre de preuve NR-9', 'unit', 'XOF', ${price},
      ${discount > 0 ? 'percentage' : null}, ${discount > 0 ? discount : null}, ${allocated}, 'published', ${state},
      ${expiresAt}::timestamptz, ${autoEnabled}, 'fixe', 'renouvelable', 'retrait', ${priceKind}, 'neuf',
      ${JSON.stringify([{ url: '/demo/box-dejeuner.png', alt: 'NR9' }])}::jsonb)
    returning id`)[0].id;
  return { seller, buyer, entityId, facilityId, productId, buyerAuth };
}

async function request(world, { quantity = 2, proposedPriceMinor = null }) {
  const result = await repo.createAvailabilityRequest({
    authUserId: world.buyerAuth, productId: world.productId, facilityId: world.facilityId,
    quantity, budgetMode: 'maximum', budgetMinor: 25000, proposedPriceMinor,
    deliveryMode: 'retrait', note: null, idempotencyKey: `nr9-req-${randomUUID()}`, correlationId: `nr9-corr-${randomUUID()}`,
  });
  // La ROUTE fait ces deux appels (createAvailabilityRequest puis l'automate) : la preuve les
  // reproduit exactement, sinon elle prouverait un chemin que la prod n'emprunte pas.
  await repo.respondAvailabilityAutomatically({ requestId: result.requestId, correlationId: `nr9-auto-${randomUUID()}` });
  return result;
}

async function autoResponse(requestId) {
  return (await sql`
    select id, actor_kind, responder_account_id, status, quantity_available, price_minor
    from v2_availability_responses where request_id = ${requestId}::uuid`)[0] ?? null;
}

// T1 — the happy path: Pro + auto + fresh + enough stock ⇒ the entity answers on its own.
const happy = await makeWorld({ autoEnabled: true, pro: true, state: 'en_stock', expiresInHours: 20, allocated: 10, price: 20000, discount: 10 });
const happyReq = await request(happy, { quantity: 2 });
const happyResp = await autoResponse(happyReq.requestId);
step('T1 the automation answers (actor_kind=automation)', happyResp?.actor_kind === 'automation', JSON.stringify(happyResp));
step('T1b it answers with NO account (it is not a human)', happyResp?.responder_account_id === null, JSON.stringify(happyResp));
step('T1c it answers the requested quantity, never a partial', Number(happyResp?.quantity_available) === 2, JSON.stringify(happyResp));
// 20 000 with 10% off = 18 000. The automation quotes the LISTED price — the buyer's price.
step('T1d it quotes the LISTED price (discount applied), not the raw price', Number(happyResp?.price_minor) === 18000, String(happyResp?.price_minor));

// T1e — the buyer READS the origin from the fact (NR-7 chain, now with a real automation).
// C'est le chemin réel : la surface acheteur lit `getAvailabilityResponses`.
const read = await repo.getAvailabilityResponses({ authUserId: happy.buyerAuth, requestId: happyReq.requestId });
const readRow = (read.responses ?? []).find((r) => String(r.id) === String(happyResp.id));
step('T1e the buyer reads responderKind=automation', readRow?.responderKind === 'automation', JSON.stringify(readRow));

// T1f — the buyer is notified (the automation must surge like a human response).
const buyerNotif = await sql`
  select count(*)::int as n from v2_notification_events
  where recipient_account_id = ${happy.buyer.id}::uuid and event_type = 'availability_response_created'`;
step('T1f the buyer is notified of the automatic response', Number(buyerNotif[0]?.n) >= 1, JSON.stringify(buyerNotif[0]));

// T1g — replay is idempotent: a second call adds no second automation response.
await repo.respondAvailabilityAutomatically({ requestId: happyReq.requestId, correlationId: `nr9-corr-${randomUUID()}` });
const afterReplay = await sql`select count(*)::int as n from v2_availability_responses where request_id = ${happyReq.requestId}::uuid`;
step('T1g replay does not duplicate the automatic response', Number(afterReplay[0]?.n) === 1, JSON.stringify(afterReplay[0]));

// T2 — THE DECISION: negotiation ⇒ the automation defers, the request stays open.
const neg = await makeWorld({ autoEnabled: true, pro: true, state: 'en_stock', expiresInHours: 20, allocated: 10, priceKind: 'negociable' });
const negReq = await request(neg, { quantity: 2, proposedPriceMinor: 15000 });
const negResp = await autoResponse(negReq.requestId);
step('T2 a proposed price ⇒ NO automatic response (negotiation belongs to the seller)', negResp === null, JSON.stringify(negResp));
const negOpen = (await sql`select status from v2_availability_requests where id = ${negReq.requestId}::uuid`)[0];
step('T2b the request stays open for the seller', negOpen?.status === 'submitted', JSON.stringify(negOpen));
// Control: the SAME offer without a proposed price IS answered — otherwise T2 could pass by
// "the automation never answers", which is not what we are proving.
const negReq2 = await request(neg, { quantity: 2, proposedPriceMinor: null });
step('T2c control: the same offer without a proposal IS answered', (await autoResponse(negReq2.requestId))?.actor_kind === 'automation');

// T3 — stale stock ⇒ defer (C5: never turn old data into truth).
const stale = await makeWorld({ autoEnabled: true, pro: true, state: 'en_stock', expiresInHours: 2, allocated: 10 });
const staleReq = await request(stale, { quantity: 1 });
step('T3 stale stock ⇒ no automatic response', (await autoResponse(staleReq.requestId)) === null);
const expired = await makeWorld({ autoEnabled: true, pro: true, state: 'en_stock', expiresInHours: -1, allocated: 10 });
step('T3b expired stock ⇒ no automatic response', (await autoResponse((await request(expired, { quantity: 1 })).requestId)) === null);

// T4 — insufficient stock ⇒ defer, never a partial (Species §113).
const thin = await makeWorld({ autoEnabled: true, pro: true, state: 'en_stock', expiresInHours: 20, allocated: 1 });
step('T4 insufficient stock ⇒ no automatic response', (await autoResponse((await request(thin, { quantity: 5 })).requestId)) === null);

// T5 — no Pro ⇒ defer (D-04 / R-4b). The badge may survive the entitlement; the response may not.
const noPro = await makeWorld({ autoEnabled: true, pro: false, state: 'en_stock', expiresInHours: 20, allocated: 10 });
step('T5 no Pro ⇒ no automatic response', (await autoResponse((await request(noPro, { quantity: 1 })).requestId)) === null);

// T6 — auto disabled ⇒ defer (Species §95: an explicit setting, never a silent deduction).
const off = await makeWorld({ autoEnabled: false, pro: true, state: 'en_stock', expiresInHours: 20, allocated: 10 });
step('T6 auto disabled ⇒ no automatic response', (await autoResponse((await request(off, { quantity: 1 })).requestId)) === null);

// T7 — the schema refuses the contradictions (defence in depth, not only the module).
let refusedAccount = false;
try {
  await sql`insert into v2_availability_responses (request_id, facility_id, responder_account_id, actor_kind, status, quantity_available, price_minor)
    values (${happyReq.requestId}::uuid, ${happy.facilityId}::uuid, ${happy.seller.id}::uuid, 'automation', 'available', 1, 1000)`;
} catch { refusedAccount = true; }
step('T7 the schema refuses an automation WITH an account (C9)', refusedAccount);

let refusedQuantity = false;
try {
  await sql`insert into v2_availability_responses (request_id, facility_id, responder_account_id, actor_kind, status, quantity_available, price_minor)
    values (${negReq2.requestId}::uuid, ${neg.facilityId}::uuid, null, 'automation', 'available', null, 1000)`;
} catch { refusedQuantity = true; }
step('T7b the schema refuses an automation without a quantity (C4)', refusedQuantity);

// T8 — the audit traces the automation as an actor, distinct from a seller (C9).
const audit = await sql`
  select reason from v2_audit_events
  where entity_id = ${String(happyResp.id)} and event_type = 'availability_response_created'`;
step('T8 the audit records the automation actor', audit.some((r) => r.reason === 'automation'), JSON.stringify(audit));

console.log(failures === 0 ? 'NR9 PROOF OK' : `NR9 PROOF FAILED (${failures})`);
