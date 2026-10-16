// T-G2 / D-TXN-3b (B3) — expiration d'une transaction VERROUILLÉE jamais engagée.
//
// Prouve le code LIVRÉ (`createTrunkRepository.sweepStalledLockedTransactions`) contre un
// Postgres réel, sur une branche JETABLE créée depuis la canonique (les tables
// transaction sont append-only, on ne peut pas backdater — on pilote par l'horloge du
// sweep, puis on jette la branche).
//
// Ce qui est prouvé :
//   T1  un verrou jamais engagé (état exactement `qr_verified`, ancien) est expiré :
//       stock libéré, intention `expired`, événement `expired`, demande `expired`,
//       notification acheteur ET vendeur.
//   T2  un verrou AVANCÉ (`payment_declared`) n'est JAMAIS touché — c'est le garde qui
//       empêche de tuer une transaction où de l'argent/une remise est engagé.
//   T3  un verrou RÉCENT (`qr_verified`, dans la fenêtre) n'est pas expiré.
//   T4  rejeu idempotent : rien ne bouge, pas de double libération, pas de double notif.
//
// JAMAIS contre la canonique. Lancer sur une branche jetable, puis supprimer la branche.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.TG2_PROOF_DATABASE_URL;
if (process.env.TG2_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('tg2-proof: set TG2_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes rows)');
  process.exit(2);
}
if (!dbUrl) { console.error('tg2-proof: missing TG2_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

console.log(`tg2-proof correlationId=${correlationId} tag=${tag}`);

const buyerAuth = `tg2-buyer-${tag}`;
const sellerAuth = `tg2-seller-${tag}`;

async function stock(productId) {
  const r = (await sql`select quantity_allocated_omni, quantity_reserved_omni
    from v2_products where id = ${productId}::uuid`)[0];
  return { allocated: Number(r.quantity_allocated_omni), reserved: Number(r.quantity_reserved_omni) };
}

// Un verrou prêt : demande répondue, intention active, puis on VIEILLIT tous ses
// événements. Les événements sont append-only (trigger) : on le désarme le temps de
// backdater, on ré-arme — précédent FF-8. L'ordre relatif est préservé par `state_rank`
// (intent_created 1 < qr_verified 3), donc `qr_verified` reste l'état courant.
async function ageEvents(transactionId, minutes) {
  await sql`alter table v2_transaction_events disable trigger v2_transaction_events_append_only_guard`;
  try {
    await sql`update v2_transaction_events
      set created_at = now() - (${minutes} * interval '1 minute') + (state_rank * interval '1 second')
      where transaction_id = ${transactionId}::uuid`;
  } finally {
    await sql`alter table v2_transaction_events enable trigger v2_transaction_events_append_only_guard`;
  }
}

async function lock({ productId, facilityId, buyerAccountId, sellerAccountId, qty, ageMinutes, lockState = 'qr_verified' }) {
  const requestId = (await sql`insert into v2_availability_requests
    (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, status, idempotency_key, expires_at, delivery_mode)
    values (${buyerAccountId}::uuid, ${productId}::uuid, array[${facilityId}::uuid], ${qty}, 'unlimited', 'responding',
            ${`tg2-req-${tag}-${randomUUID()}`}, now() + interval '1 day', 'retrait') returning id`)[0].id;
  const responseId = (await sql`insert into v2_availability_responses
    (request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, observed_at)
    values (${requestId}::uuid, ${facilityId}::uuid, ${sellerAccountId}::uuid, 'available', ${qty}, 1000, '{}'::jsonb, now())
    returning id`)[0].id;
  const intent = await repository.createPurchaseIntent({
    authUserId: buyerAuth, responseId, idempotencyKey: `tg2-intent-${tag}-${randomUUID()}`, correlationId,
  });
  await sql`insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
    values (${intent.transactionId}::uuid, ${sellerAccountId}::uuid, 'qr_verified', '{}'::jsonb, now())
    on conflict (transaction_id, state) do nothing`;
  if (lockState !== 'qr_verified') {
    await sql`insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
      values (${intent.transactionId}::uuid, ${buyerAccountId}::uuid, ${lockState}, '{}'::jsonb, now())
      on conflict (transaction_id, state) do nothing`;
  }
  await ageEvents(intent.transactionId, ageMinutes);
  return { requestId, intent };
}

try {
  const buyerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${buyerAuth}) returning id`)[0].id;
  const sellerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${sellerAuth}) returning id`)[0].id;
  const facilityId = (await sql`insert into v2_facilities (account_id, name, trust_state, operational_state)
    values (${sellerAccountId}::uuid, ${`T-G2 Facility ${tag}`}, 'confirmed', 'ouvert') returning id`)[0].id;
  const productId = (await sql`insert into v2_products (facility_id, name, unit, price_minor, currency, quantity_allocated_omni, publication_state)
    values (${facilityId}::uuid, ${`T-G2 Product ${tag}`}, 'unit', 1000, 'XOF', 10, 'published') returning id`)[0].id;
  step('fixtures', Boolean(buyerAccountId && facilityId && productId));

  // T1 — verrou jamais engagé, ancien (au-delà de 72 h) → expiré, stock libéré, notifs.
  const a = await lock({ productId, facilityId, buyerAccountId, sellerAccountId, qty: 2, ageMinutes: 5 * 24 * 60 });
  const held = await stock(productId);
  const sweep = await repository.sweepStalledLockedTransactions({ now: new Date().toISOString(), correlationId });
  const released = await stock(productId);
  const intentState = (await sql`select state from v2_purchase_intents where id = ${a.intent.intentId}::uuid`)[0].state;
  const reqState = (await sql`select status from v2_availability_requests where id = ${a.requestId}::uuid`)[0].status;
  const ev = (await sql`select count(*)::int as n from v2_transaction_events where transaction_id = ${a.intent.transactionId}::uuid and state = 'expired'`)[0].n;
  const notifs = (await sql`select count(*)::int as n from v2_notification_events where entity_id = ${a.requestId} and dedupe_key like ${'%:locked:%'}`)[0].n;
  step('T1 stalled lock expired, stock released, notified',
    held.reserved === 2 && released.reserved === 0 && released.allocated === 10
      && sweep.expired >= 1 && intentState === 'expired' && reqState === 'expired' && Number(ev) >= 1 && Number(notifs) >= 2,
    `held=${held.reserved} released=${released.reserved} allocated=${released.allocated} expired=${sweep.expired} intent=${intentState} req=${reqState} ev=${ev} notifs=${notifs}`);

  // T2 — verrou AVANCÉ (payment_declared) ancien → JAMAIS touché.
  const b = await lock({ productId, facilityId, buyerAccountId, sellerAccountId, qty: 3, ageMinutes: 5 * 24 * 60, lockState: 'payment_declared' });
  const beforeB = await stock(productId);
  await repository.sweepStalledLockedTransactions({ now: new Date().toISOString(), correlationId });
  const afterB = await stock(productId);
  const intentB = (await sql`select state from v2_purchase_intents where id = ${b.intent.intentId}::uuid`)[0].state;
  const reqB = (await sql`select status from v2_availability_requests where id = ${b.requestId}::uuid`)[0].status;
  step('T2 advanced lock untouched (money engaged)',
    beforeB.reserved === 3 && afterB.reserved === 3 && intentB === 'active' && reqB === 'responding',
    `reserved=${afterB.reserved} intent=${intentB} req=${reqB}`);

  // T3 — verrou RÉCENT (dans la fenêtre) → pas expiré.
  const c = await lock({ productId, facilityId, buyerAccountId, sellerAccountId, qty: 1, ageMinutes: 10 });
  const beforeC = await stock(productId);
  await repository.sweepStalledLockedTransactions({ now: new Date().toISOString(), correlationId });
  const afterC = await stock(productId);
  const intentC = (await sql`select state from v2_purchase_intents where id = ${c.intent.intentId}::uuid`)[0].state;
  step('T3 recent lock within window untouched',
    beforeC.reserved === 4 && afterC.reserved === 4 && intentC === 'active',
    `reserved=${afterC.reserved} intent=${intentC}`);

  // T4 — rejeu idempotent : rien ne bouge.
  const beforeD = await stock(productId);
  const notifsBefore = (await sql`select count(*)::int as n from v2_notification_events where entity_id = ${a.requestId}`)[0].n;
  await repository.sweepStalledLockedTransactions({ now: new Date().toISOString(), correlationId });
  const afterD = await stock(productId);
  const notifsAfter = (await sql`select count(*)::int as n from v2_notification_events where entity_id = ${a.requestId}`)[0].n;
  step('T4 replay idempotent', beforeD.reserved === afterD.reserved && notifsBefore === notifsAfter,
    `reserved=${afterD.reserved} notifs=${notifsBefore}->${notifsAfter}`);
} catch (error) {
  console.error('tg2-proof: ABORT', error);
  process.exitCode = 1;
} finally {
  // Nettoyage best-effort (branche jetable de toute façon).
  console.log(`tg2-proof done failures=${failures}`);
}
