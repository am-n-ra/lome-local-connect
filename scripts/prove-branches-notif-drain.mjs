// BRANCHES-NOTIF-DRAIN — prouve, sur une branche JETABLE et avec le code LIVRÉ, que la file
// Web Push des routes de DISPONIBILITÉ est réellement dépilée.
//
// Défaut mesuré (canonique) : la 2ᵉ demande du fondateur à « Soja zozo » a écrit sa
// notification (event + delivery in_app ET web_push) mais la livraison `web_push` est restée
// `queued` — les routes de disponibilité n'appelaient jamais `drainWebPushBestEffort`, que
// seules les routes de TRANSACTION (FF-7) appelaient. La file étant ordonnée par `created_at`,
// un ancien envoi bloqué bouchait aussi les suivants.
//
// Ici : le producteur crée la livraison, le dépileur (le MÊME que la prod, `deliverPendingPush`)
// la sort de `queued`. Un envoi stubé tient lieu de service de push (aucun réseau dans une preuve).
//
// Run: NOTIFDRAIN_PROOF_ALLOW_DISPOSABLE_BRANCH=1 NOTIFDRAIN_PROOF_DATABASE_URL=<branch> npx tsx scripts/prove-branches-notif-drain.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';
import { deliverPendingPush } from '../src/server/web-push.ts';

const dbUrl = process.env.NOTIFDRAIN_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('missing NOTIFDRAIN_PROOF_DATABASE_URL'); process.exit(2); }
const sql = neon(dbUrl);
const repo = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

// Le dépileur de prod, câblé sur le dépôt réel, avec un envoi stubé (delivered).
const sent = [];
async function drain() {
  return deliverPendingPush({
    listPending: (limit) => repo.listPendingPushDeliveries({ limit }),
    send: async (target, payload) => { sent.push({ endpoint: target.endpoint, payload }); return { ok: true, statusCode: 201 }; },
    markDelivered: (deliveryId, providerReference) => repo.markPushDeliveryDelivered({ deliveryId, providerReference }),
    markRetry: (deliveryId, attemptCount, nextAttemptAt, errorClass) => repo.markPushDeliveryRetry({ deliveryId, attemptCount, nextAttemptAt: nextAttemptAt.toISOString(), errorClass }),
    markExhausted: (deliveryId, errorClass) => repo.markPushDeliveryExhausted({ deliveryId, errorClass }),
    revokeEndpoints: (endpoints) => repo.revokePushEndpoints({ endpoints }).then(() => undefined),
  }, { limit: 25 });
}

// --- Fixture: vendeur (compte + entité + facilité + offre publiée + abonnement push) et acheteur ---
const sellerAuth = `drain-seller-${tag}`;
const buyerAuth = `drain-buyer-${tag}`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${sellerAuth}, 'seller_ready')`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${buyerAuth}, 'buyer_ready')`;
const seller = (await sql`select id from v2_accounts where auth_user_id = ${sellerAuth}`)[0];
const buyer = (await sql`select id from v2_accounts where auth_user_id = ${buyerAuth}`)[0];
// Le vendeur a un appareil abonné (permission granted) — condition du canal web_push.
await sql`insert into v2_web_push_subscriptions (account_id, endpoint, p256dh, auth, permission_state) values (${seller.id}::uuid, ${`https://push.example/seller-${tag}`}, 'p256dh', 'auth', 'granted')`;
const entityId = (await sql`insert into v2_entities (account_id, kind, display_name, trust_state) values (${seller.id}::uuid, 'organisation', ${`Drain ${tag}`}, 'unconfirmed') returning id`)[0].id;
const facilityId = (await sql`insert into v2_facilities (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, trust_state, operational_state) values (${seller.id}::uuid, ${entityId}::uuid, 'created', 'seller', ${`drain-${tag}`}, ${`Drain ${tag}`}, 'fixe', 'unconfirmed', 'ouvert') returning id`)[0].id;
await sql`insert into v2_facility_slots (account_id, facility_id, source, status) values (${seller.id}::uuid, ${facilityId}::uuid, 'free', 'assigned')`;
const productId = (await sql`
  insert into v2_products (facility_id, entity_id, name, description, unit, currency, price_minor,
    discount_kind, discount_value, quantity_allocated_omni, publication_state, availability_state,
    position_kind, uniqueness_kind, handover_kind, price_kind, condition_kind, media)
  values (${facilityId}::uuid, ${entityId}::uuid, ${`Soja ${tag}`}, 'Soja de Lomé', 'unit', 'XOF', 1000,
    'percentage', 5, 10, 'published', 'en_stock',
    'fixe', 'renouvelable', 'retrait', 'fixe', 'neuf', ${JSON.stringify([{ url: '/demo/box-dejeuner.png', alt: 'Soja' }])}::jsonb)
  returning id`)[0].id;

// T1 — le producteur met en file une livraison web_push VENDEUR, qui RESTE `queued` sans drain.
const request = await repo.createAvailabilityRequest({
  authUserId: buyerAuth, productId, facilityId, quantity: 2, budgetMode: 'maximum', budgetMinor: 2500,
  proposedPriceMinor: null, deliveryMode: 'retrait', note: null, idempotencyKey: `drain-req-${tag}`, correlationId: `corr-req-${tag}`,
});
const queuedSeller = await sql`
  select d.id, d.state from v2_notification_deliveries d
  join v2_notification_events e on e.id = d.event_id
  where e.recipient_account_id = ${seller.id}::uuid and e.event_type = 'availability_request_created'
    and e.entity_id = ${request.requestId} and d.channel = 'web_push'`;
step('T1 la demande crée une livraison web_push VENDEUR (le canal existe)', queuedSeller.length === 1, JSON.stringify(queuedSeller));
step('T1b sans drain, elle reste `queued` — c\'est le défaut mesuré en prod', queuedSeller[0]?.state === 'queued', String(queuedSeller[0]?.state));

// T2 — le dépileur (celui de la prod) la sort de `queued` et envoie réellement.
const pendingBefore = await repo.listPendingPushDeliveries({ limit: 25 });
step('T2 le dépileur voit la livraison en attente', pendingBefore.some((p) => p.deliveryId === queuedSeller[0].id), `${pendingBefore.length} pending`);
const summary = await drain();
step('T2b le dépileur livre (summary.delivered >= 1)', summary.delivered >= 1, JSON.stringify(summary));
const afterSeller = await sql`select state, delivered_at from v2_notification_deliveries where id = ${queuedSeller[0].id}::uuid`;
step('T2c la livraison vendeur passe `delivered`', afterSeller[0]?.state === 'delivered' && afterSeller[0]?.delivered_at != null, JSON.stringify(afterSeller[0]));

// T3 — la réponse vendeur met en file une livraison ACHETEUR ; le drain la livre aussi.
await sql`insert into v2_web_push_subscriptions (account_id, endpoint, p256dh, auth, permission_state) values (${buyer.id}::uuid, ${`https://push.example/buyer-${tag}`}, 'p256dh', 'auth', 'granted')`;
await repo.respondAvailability({
  authUserId: sellerAuth, requestId: request.requestId, facilityId, productId, status: 'available',
  quantityAvailable: 2, priceMinor: 1000, sellerMessage: 'Disponible', idempotencyKey: `drain-resp-${tag}`, correlationId: `corr-resp-${tag}`,
});
const queuedBuyer = await sql`
  select d.id, d.state from v2_notification_deliveries d
  join v2_notification_events e on e.id = d.event_id
  where e.recipient_account_id = ${buyer.id}::uuid and e.event_type = 'availability_response_created' and d.channel = 'web_push'`;
step('T3 la réponse crée une livraison web_push ACHETEUR', queuedBuyer.length === 1, JSON.stringify(queuedBuyer));
await drain();
const afterBuyer = await sql`select state from v2_notification_deliveries where id = ${queuedBuyer[0].id}::uuid`;
step('T3b le drain livre la réponse à l\'acheteur', afterBuyer[0]?.state === 'delivered', String(afterBuyer[0]?.state));

// T4 — un drain au repos ne fait rien (pas de boucle, pas d'envoi fantôme).
const sentBefore = sent.length;
const idle = await drain();
step('T4 un drain au repos n\'envoie rien', idle.scanned === 0 && sent.length === sentBefore, JSON.stringify(idle));

console.log(failures === 0 ? '\nNOTIF-DRAIN PROOF: all steps passed' : `\nNOTIF-DRAIN PROOF: ${failures} step(s) failed`);
