// TXN-G7 (GAP-7) — l'expiration d'une intention était SILENCIEUSE. Ce script prouve,
// contre une branche JETABLE et avec le CODE LIVRÉ (jamais un mock), que le balayage
// d'expiration notifie les DEUX parties, une seule fois, et sur la bonne cible.
//
// Run: TXN7_PROOF_ALLOW_DISPOSABLE_BRANCH=1 TXN7_PROOF_DATABASE_URL=<branch> npx tsx scripts/prove-txn-g7-expiry-notify.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.TXN7_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('missing TXN7_PROOF_DATABASE_URL'); process.exit(2); }
const sql = neon(dbUrl);
const repo = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

// --- Fixture réelle : vendeur (compte + entité + lieu + offre publiée) et acheteur ---
const sellerAuth = `txn7-seller-${tag}`;
const buyerAuth = `txn7-buyer-${tag}`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${sellerAuth}, 'seller_ready')`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${buyerAuth}, 'buyer_ready')`;
const seller = (await sql`select id from v2_accounts where auth_user_id = ${sellerAuth}`)[0];
const buyer = (await sql`select id from v2_accounts where auth_user_id = ${buyerAuth}`)[0];
const entityId = (await sql`insert into v2_entities (account_id, kind, display_name, trust_state) values (${seller.id}::uuid, 'organisation', ${`Txn7 ${tag}`}, 'unconfirmed') returning id`)[0].id;
const facilityId = (await sql`insert into v2_facilities (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, trust_state, operational_state) values (${seller.id}::uuid, ${entityId}::uuid, 'created', 'seller', ${`txn7-${tag}`}, ${`Txn7 ${tag}`}, 'fixe', 'unconfirmed', 'ouvert') returning id`)[0].id;
await sql`insert into v2_facility_slots (account_id, facility_id, source, status) values (${seller.id}::uuid, ${facilityId}::uuid, 'free', 'assigned')`;
const productId = (await sql`
  insert into v2_products (facility_id, entity_id, name, description, unit, currency, price_minor,
    discount_kind, discount_value, quantity_allocated_omni, publication_state, availability_state,
    position_kind, uniqueness_kind, handover_kind, price_kind, condition_kind, media)
  values (${facilityId}::uuid, ${entityId}::uuid, ${`Riz ${tag}`}, 'Riz parfumé de Lomé', 'unit', 'XOF', 1000,
    'percentage', 5, 10, 'published', 'en_stock',
    'fixe', 'renouvelable', 'retrait', 'fixe', 'neuf', ${JSON.stringify([{ url: '/demo/box-dejeuner.png', alt: 'Riz' }])}::jsonb)
  returning id`)[0].id;

// Demande de dispo + réponse vendeur, puis intention d'achat (réserve le stock).
const request = await repo.createAvailabilityRequest({
  authUserId: buyerAuth, productId, facilityId, quantity: 2, budgetMode: 'maximum', budgetMinor: 2500,
  proposedPriceMinor: null, deliveryMode: 'retrait', note: null, idempotencyKey: `txn7-req-${tag}`, correlationId: `corr-req-${tag}`,
});
const response = await repo.respondAvailability({
  authUserId: sellerAuth, requestId: request.requestId, facilityId, productId, status: 'available',
  quantityAvailable: 2, priceMinor: 1000, sellerMessage: 'Disponible', idempotencyKey: `txn7-resp-${tag}`, correlationId: `corr-resp-${tag}`,
});
const responseId = (await sql`select id from v2_availability_responses where request_id = ${request.requestId}::uuid limit 1`)[0].id;
await repo.createPurchaseIntent({
  authUserId: buyerAuth, responseId: String(responseId), quantity: 2, idempotencyKey: `txn7-intent-${tag}`, correlationId: `corr-intent-${tag}`,
});

const reservedBefore = (await sql`select quantity_reserved_omni from v2_products where id = ${productId}::uuid`)[0].quantity_reserved_omni;

// Le balayage avec une fenêtre nulle : l'intention créée à l'instant est considérée échue.
const sweep = await repo.sweepExpiredIntents({ now: new Date(Date.now() + 60_000).toISOString(), correlationId: `corr-sweep-${tag}`, windowMinutes: 1 });
step('T1 le balayage expire une intention', sweep.expired >= 1, JSON.stringify(sweep));

// T2 — l'ACHETEUR est notifié (sa demande a expiré), sur le suivi de la demande.
const buyerEvents = await sql`
  select e.event_type, e.entity_type, e.entity_id, d.channel
  from v2_notification_events e
  left join v2_notification_deliveries d on d.event_id = e.id
  where e.recipient_account_id = ${buyer.id}::uuid and e.event_type = 'availability_request_expired'`;
step('T2 l’acheteur est notifié (availability_request_expired)', buyerEvents.length >= 1, JSON.stringify(buyerEvents));
step('T2b la cible acheteur est la demande', buyerEvents[0]?.entity_type === 'availability_request' && String(buyerEvents[0]?.entity_id) === request.requestId, JSON.stringify(buyerEvents[0]));
step('T2c livraison in_app', buyerEvents.some((r) => r.channel === 'in_app'), JSON.stringify(buyerEvents.map((r) => r.channel)));

// T3 — le VENDEUR qui avait répondu est notifié (sa réponse est tombée à l'eau).
const sellerEvents = await sql`
  select e.event_type, e.entity_type, e.entity_id, d.channel
  from v2_notification_events e
  left join v2_notification_deliveries d on d.event_id = e.id
  where e.recipient_account_id = ${seller.id}::uuid and e.event_type = 'availability_response_lapsed'`;
step('T3 le vendeur qui a répondu est notifié (availability_response_lapsed)', sellerEvents.length >= 1, JSON.stringify(sellerEvents));
step('T3b livraison in_app', sellerEvents.some((r) => r.channel === 'in_app'), JSON.stringify(sellerEvents.map((r) => r.channel)));

// T4 — pas de push sans abonnement actif (on ne promet pas une alerte qui ne peut arriver).
step('T4 aucun web_push sans abonnement', ![...buyerEvents, ...sellerEvents].some((r) => r.channel === 'web_push'), JSON.stringify([...buyerEvents, ...sellerEvents].map((r) => r.channel)));

// T5 — le rejeu ne re-notifie pas (idempotent) et ne relibère pas le stock.
await repo.sweepExpiredIntents({ now: new Date(Date.now() + 120_000).toISOString(), correlationId: `corr-sweep2-${tag}`, windowMinutes: 1 });
const buyerAfter = await sql`select count(*)::int as n from v2_notification_events where recipient_account_id = ${buyer.id}::uuid and event_type = 'availability_request_expired'`;
const sellerAfter = await sql`select count(*)::int as n from v2_notification_events where recipient_account_id = ${seller.id}::uuid and event_type = 'availability_response_lapsed'`;
step('T5 rejeu : une seule notification acheteur', Number(buyerAfter[0].n) === buyerEvents.length, `${buyerAfter[0].n} vs ${buyerEvents.length}`);
step('T5b rejeu : une seule notification vendeur', Number(sellerAfter[0].n) === sellerEvents.length, `${sellerAfter[0].n} vs ${sellerEvents.length}`);

// T6 — le stock réservé a été libéré (le cœur de GAP-7 : l'acheteur doit le savoir).
const reservedAfter = (await sql`select quantity_reserved_omni from v2_products where id = ${productId}::uuid`)[0].quantity_reserved_omni;
step('T6 le stock réservé est libéré', Number(reservedAfter) === 0, `before=${reservedBefore} after=${reservedAfter}`);

// Nettoyage best-effort : la branche est jetable et sera SUPPRIMÉE. Les tables
// append-only refusent la suppression (par conception) — on l'ignore sans échouer.
const bestEffort = async (fn) => { try { await fn(); } catch { /* append-only ou FK : branche jetable */ } };
await bestEffort(() => sql`delete from v2_notification_deliveries where event_id in (select id from v2_notification_events where recipient_account_id in (${buyer.id}::uuid, ${seller.id}::uuid))`);
await bestEffort(() => sql`delete from v2_notification_events where recipient_account_id in (${buyer.id}::uuid, ${seller.id}::uuid)`);
await bestEffort(() => sql`delete from v2_transaction_events where transaction_id in (select transaction_id from v2_transaction_snapshots where product_id = ${productId}::uuid)`);
await bestEffort(() => sql`delete from v2_transaction_members where transaction_id in (select transaction_id from v2_transaction_snapshots where product_id = ${productId}::uuid)`);
await bestEffort(() => sql`delete from v2_transaction_messages where transaction_id in (select transaction_id from v2_transaction_snapshots where product_id = ${productId}::uuid)`);
await bestEffort(() => sql`delete from v2_transaction_snapshots where product_id = ${productId}::uuid`);
await bestEffort(() => sql`delete from v2_purchase_intents where buyer_account_id = ${buyer.id}::uuid`);
await bestEffort(() => sql`delete from v2_availability_responses where request_id = ${request.requestId}::uuid`);
await bestEffort(() => sql`delete from v2_availability_requests where id = ${request.requestId}::uuid`);
await bestEffort(() => sql`delete from v2_products where id = ${productId}::uuid`);
await bestEffort(() => sql`delete from v2_facility_slots where facility_id = ${facilityId}::uuid`);
await bestEffort(() => sql`delete from v2_facilities where id = ${facilityId}::uuid`);
await bestEffort(() => sql`delete from v2_entities where id = ${entityId}::uuid`);
await bestEffort(() => sql`delete from v2_accounts where id in (${buyer.id}::uuid, ${seller.id}::uuid)`);

console.log(failures === 0 ? '\nTXN-G7 proof: ALL PASS' : `\nTXN-G7 proof: ${failures} FAILURE(S)`);
