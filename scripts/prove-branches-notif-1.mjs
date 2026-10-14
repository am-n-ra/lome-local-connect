// BRANCHES-NOTIF-1 — prove the notification producers against a DISPOSABLE branch, using the
// shipped code (never a mock): a buyer's availability request must notify the SELLER, and the
// seller's response must notify the BUYER. Replays must not double-notify. Web Push deliveries
// appear only when a granted subscription exists.
//
// Run: NOTIF1_PROOF_ALLOW_DISPOSABLE_BRANCH=1 NOTIF1_PROOF_DATABASE_URL=<branch> npx tsx scripts/prove-branches-notif-1.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.NOTIF1_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('missing NOTIF1_PROOF_DATABASE_URL'); process.exit(2); }
const sql = neon(dbUrl);
const repo = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

// --- Fixture: a real seller (account + entity + facility + PUBLISHED offer) and a buyer ---
const sellerAuth = `notif-seller-${tag}`;
const buyerAuth = `notif-buyer-${tag}`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${sellerAuth}, 'seller_ready')`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${buyerAuth}, 'buyer_ready')`;
const seller = (await sql`select id from v2_accounts where auth_user_id = ${sellerAuth}`)[0];
const buyer = (await sql`select id from v2_accounts where auth_user_id = ${buyerAuth}`)[0];
const entityId = (await sql`insert into v2_entities (account_id, kind, display_name, trust_state) values (${seller.id}::uuid, 'organisation', ${`Notif ${tag}`}, 'unconfirmed') returning id`)[0].id;
const facilityId = (await sql`insert into v2_facilities (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, trust_state, operational_state) values (${seller.id}::uuid, ${entityId}::uuid, 'created', 'seller', ${`notif-${tag}`}, ${`Notif ${tag}`}, 'fixe', 'unconfirmed', 'ouvert') returning id`)[0].id;
await sql`insert into v2_facility_slots (account_id, facility_id, source, status) values (${seller.id}::uuid, ${facilityId}::uuid, 'free', 'assigned')`;
const productId = (await sql`
  insert into v2_products (facility_id, entity_id, name, description, unit, currency, price_minor,
    discount_kind, discount_value, quantity_allocated_omni, publication_state, availability_state,
    position_kind, uniqueness_kind, handover_kind, price_kind, condition_kind, media)
  values (${facilityId}::uuid, ${entityId}::uuid, ${`Riz ${tag}`}, 'Riz parfumé de Lomé', 'unit', 'XOF', 1000,
    'percentage', 5, 10, 'published', 'en_stock',
    'fixe', 'renouvelable', 'retrait', 'fixe', 'neuf', ${JSON.stringify([{ url: '/demo/box-dejeuner.png', alt: 'Riz' }])}::jsonb)
  returning id`)[0].id;

// T1 — the buyer's request notifies the SELLER.
const request = await repo.createAvailabilityRequest({
  authUserId: buyerAuth, productId, facilityId, quantity: 2, budgetMode: 'maximum', budgetMinor: 2500,
  proposedPriceMinor: null, deliveryMode: 'retrait', note: null, idempotencyKey: `notif-req-${tag}`, correlationId: `corr-req-${tag}`,
});
const sellerEvents = await sql`
  select e.event_type, e.entity_type, e.entity_id, d.channel, d.state
  from v2_notification_events e
  left join v2_notification_deliveries d on d.event_id = e.id
  where e.recipient_account_id = ${seller.id}::uuid and e.event_type = 'availability_request_created'`;
step('T1 request notifies the seller (availability_request_created)', sellerEvents.length === 1, JSON.stringify(sellerEvents));
step('T1b seller event points at the request', sellerEvents[0]?.entity_type === 'availability_request' && String(sellerEvents[0]?.entity_id) === request.requestId, JSON.stringify(sellerEvents[0]));
step('T1c seller gets an in_app delivery', sellerEvents.some((r) => r.channel === 'in_app'), JSON.stringify(sellerEvents.map((r) => r.channel)));
step('T1d no web_push without a subscription', !sellerEvents.some((r) => r.channel === 'web_push'), JSON.stringify(sellerEvents.map((r) => r.channel)));

// T2 — replay is idempotent: no second seller event.
await repo.createAvailabilityRequest({
  authUserId: buyerAuth, productId, facilityId, quantity: 2, budgetMode: 'maximum', budgetMinor: 2500,
  proposedPriceMinor: null, deliveryMode: 'retrait', note: null, idempotencyKey: `notif-req-${tag}`, correlationId: `corr-req-${tag}`,
});
const sellerEventsReplay = await sql`
  select count(*)::int as n from v2_notification_events
  where recipient_account_id = ${seller.id}::uuid and event_type = 'availability_request_created'`;
step('T2 replay does not double-notify the seller', Number(sellerEventsReplay[0].n) === 1, String(sellerEventsReplay[0].n));

// T3 — the seller's response notifies the BUYER.
await repo.respondAvailability({
  authUserId: sellerAuth, requestId: request.requestId, facilityId, productId, status: 'available',
  quantityAvailable: 2, priceMinor: 1000, sellerMessage: 'Disponible', idempotencyKey: `notif-resp-${tag}`, correlationId: `corr-resp-${tag}`,
});
const buyerEvents = await sql`
  select e.event_type, e.entity_type, e.entity_id, d.channel, d.state
  from v2_notification_events e
  left join v2_notification_deliveries d on d.event_id = e.id
  where e.recipient_account_id = ${buyer.id}::uuid and e.event_type = 'availability_response_created'`;
step('T3 response notifies the buyer (availability_response_created)', buyerEvents.length === 1, JSON.stringify(buyerEvents));
step('T3b buyer event points at the request (so the tap reopens the suivi)', buyerEvents[0]?.entity_type === 'availability_request' && String(buyerEvents[0]?.entity_id) === request.requestId, JSON.stringify(buyerEvents[0]));
step('T3c buyer gets an in_app delivery', buyerEvents.some((r) => r.channel === 'in_app'), JSON.stringify(buyerEvents.map((r) => r.channel)));

// T4 — replay of the response is idempotent.
await repo.respondAvailability({
  authUserId: sellerAuth, requestId: request.requestId, facilityId, productId, status: 'available',
  quantityAvailable: 2, priceMinor: 1000, sellerMessage: 'Disponible', idempotencyKey: `notif-resp-${tag}`, correlationId: `corr-resp-${tag}`,
});
const buyerEventsReplay = await sql`
  select count(*)::int as n from v2_notification_events
  where recipient_account_id = ${buyer.id}::uuid and event_type = 'availability_response_created'`;
step('T4 replay does not double-notify the buyer', Number(buyerEventsReplay[0].n) === 1, String(buyerEventsReplay[0].n));

// T5 — a granted subscription adds a web_push delivery (the second channel).
await sql`insert into v2_web_push_subscriptions (account_id, endpoint, p256dh, auth, permission_state) values (${buyer.id}::uuid, ${`https://push.example/${tag}`}, 'p256dh-key', 'auth-key', 'granted')`;
const request2 = await repo.createAvailabilityRequest({
  authUserId: buyerAuth, productId, facilityId, quantity: 1, budgetMode: 'unlimited', budgetMinor: null,
  proposedPriceMinor: null, deliveryMode: 'retrait', note: null, idempotencyKey: `notif-req2-${tag}`, correlationId: `corr-req2-${tag}`,
});
await repo.respondAvailability({
  authUserId: sellerAuth, requestId: request2.requestId, facilityId, productId, status: 'available',
  quantityAvailable: 1, priceMinor: 1000, sellerMessage: null, idempotencyKey: `notif-resp2-${tag}`, correlationId: `corr-resp2-${tag}`,
});
const buyerChannels2 = await sql`
  select d.channel from v2_notification_events e
  join v2_notification_deliveries d on d.event_id = e.id
  where e.recipient_account_id = ${buyer.id}::uuid and e.event_type = 'availability_response_created'
    and e.entity_id = ${request2.requestId}`;
step('T5 granted subscription adds a web_push delivery', buyerChannels2.some((r) => r.channel === 'web_push'), JSON.stringify(buyerChannels2.map((r) => r.channel)));

// T6 — a BULK need notifies EVERY targeted seller (the unnest path). Two DIFFERENT sellers,
// one need → one event each (dedupe is per recipient, so a seller owning both would get ONE).
const sellerBAuth = `notif-sellerb-${tag}`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${sellerBAuth}, 'seller_ready')`;
const sellerB = (await sql`select id from v2_accounts where auth_user_id = ${sellerBAuth}`)[0];
const entityB = (await sql`insert into v2_entities (account_id, kind, display_name, trust_state) values (${sellerB.id}::uuid, 'organisation', ${`Notif B ${tag}`}, 'unconfirmed') returning id`)[0].id;
const facilityB = (await sql`insert into v2_facilities (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, trust_state, operational_state) values (${sellerB.id}::uuid, ${entityB}::uuid, 'created', 'seller', ${`notif-b-${tag}`}, ${`Notif B ${tag}`}, 'fixe', 'unconfirmed', 'ouvert') returning id`)[0].id;
await sql`insert into v2_facility_slots (account_id, facility_id, source, status) values (${sellerB.id}::uuid, ${facilityB}::uuid, 'free', 'assigned')`;
const productB = (await sql`
  insert into v2_products (facility_id, entity_id, name, unit, currency, price_minor, discount_kind, discount_value,
    quantity_allocated_omni, publication_state, availability_state, position_kind, uniqueness_kind, handover_kind, price_kind, condition_kind, media)
  values (${facilityB}::uuid, ${entityB}::uuid, ${`Huile ${tag}`}, 'unit', 'XOF', 1200, 'percentage', 5, 8, 'published', 'en_stock',
    'fixe', 'renouvelable', 'retrait', 'fixe', 'neuf', ${JSON.stringify([{ url: '/demo/box-dejeuner.png', alt: 'Huile' }])}::jsonb)
  returning id`)[0].id;
await repo.createBulkAvailabilityRequest({
  authUserId: buyerAuth, productId, facilityIds: [facilityId, facilityB], quantity: 1, budgetMode: 'unlimited', budgetMinor: null,
  proposedPriceMinor: null, deliveryMode: 'retrait', note: null, idempotencyKey: `notif-bulk-${tag}`, correlationId: `corr-bulk-${tag}`,
});
const bulkSellers = await sql`
  select recipient_account_id::text as seller from v2_notification_events
  where event_type = 'availability_request_created' and dedupe_key like '%:request_created'
    and recipient_account_id in (${seller.id}::uuid, ${sellerB.id}::uuid)
    and entity_id = (select id::text from v2_availability_requests where idempotency_key = ${`notif-bulk-${tag}`})`;
step('T6 bulk need notifies every targeted seller (unnest path)', new Set(bulkSellers.map((r) => r.seller)).size === 2, JSON.stringify(bulkSellers));

console.log(failures === 0 ? '\nNOTIF-1 PROOF: all steps passed' : `\nNOTIF-1 PROOF: ${failures} step(s) failed`);
