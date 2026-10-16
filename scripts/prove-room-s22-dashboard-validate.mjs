// S-22 — « valider dans le dashboard = MEME VERROU que scanner », prouvé contre Postgres réel.
//
// Le défaut mesuré (2026-10-16) : à l'état `qr_ready`, la Room n'offrait AUCUN bouton au
// vendeur (`myTurn` = buyer) alors que la matrice serveur l'autorise (`qr_ready → qr_verified`).
// Un vendeur sans caméra ne pouvait donc JAMAIS verrouiller sa vente — la surface `seller-validate`
// de la maquette (S-27) était absente.
//
// Ce que cette preuve établit, sur le code LIVRÉ :
//   T1 le vendeur verrouille depuis le dashboard, SANS aucun scan ;
//   T2 l'acheteur ne peut PAS verrouiller (le rôle vendeur est requis) ;
//   T3 un tiers non-membre ne peut PAS verrouiller ;
//   T4 le double clic est idempotent (un seul événement `qr_verified`) ;
//   T5 après validation dashboard, la suite du flux est inchangée (paiement → remise).
//
// JAMAIS sur la canonique : écrit des lignes. Branche jetable, puis suppression.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

if (process.env.S22_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('s22-proof: set S22_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes rows)');
  process.exit(2);
}
const dbUrl = process.env.S22_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('s22-proof: missing S22_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();
const now = () => new Date().toISOString();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

console.log(`s22-proof correlationId=${correlationId} tag=${tag}`);

const buyerAuth = `s22-buyer-${tag}`;
const sellerAuth = `s22-seller-${tag}`;
const strangerAuth = `s22-stranger-${tag}`;
let facilityId; let productId;

try {
  const buyerId = (await sql`insert into v2_accounts (auth_user_id) values (${buyerAuth}) returning id`)[0].id;
  const sellerId = (await sql`insert into v2_accounts (auth_user_id) values (${sellerAuth}) returning id`)[0].id;
  await sql`insert into v2_accounts (auth_user_id) values (${strangerAuth})`;
  facilityId = (await sql`insert into v2_facilities (account_id, name, trust_state, operational_state)
    values (${sellerId}::uuid, ${`S22 Facility ${tag}`}, 'confirmed', 'ouvert') returning id`)[0].id;
  productId = (await sql`insert into v2_products (facility_id, name, unit, price_minor, currency, quantity_allocated_omni, publication_state)
    values (${facilityId}::uuid, ${`S22 Product ${tag}`}, 'unit', 1000, 'XOF', 10, 'published') returning id`)[0].id;

  const requestId = (await sql`insert into v2_availability_requests
    (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, status, idempotency_key, expires_at, delivery_mode)
    values (${buyerId}::uuid, ${productId}::uuid, array[${facilityId}::uuid], 2, 'unlimited', 'submitted',
            ${`s22-req-${tag}`}, now() + interval '1 day', 'retrait')
    returning id`)[0].id;
  const responseId = (await sql`insert into v2_availability_responses
    (request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, observed_at)
    values (${requestId}::uuid, ${facilityId}::uuid, ${sellerId}::uuid, 'available', 2, 1000, '{}'::jsonb, now())
    returning id`)[0].id;

  const intent = await repository.createPurchaseIntent({
    authUserId: buyerAuth, responseId, idempotencyKey: `s22-intent-${tag}`, correlationId,
  });
  const currentState = async () => (await sql`select state from v2_transaction_events
    where transaction_id = ${intent.transactionId}::uuid order by created_at desc, state_rank desc limit 1`)[0]?.state;
  step('intention créée, état qr_ready', (await currentState()) === 'qr_ready', `state=${await currentState()}`);

  // T2 — l'acheteur ne peut pas verrouiller : le rôle vendeur est exigé par la requête.
  let buyerRefused = false;
  try {
    await repository.transitionTransaction({ authUserId: buyerAuth, transactionId: intent.transactionId, from: 'qr_ready', to: 'qr_verified', actorRole: 'seller', correlationId, now: now() });
  } catch { buyerRefused = true; }
  step("T2 l'acheteur ne peut pas se faire passer pour le vendeur", buyerRefused && (await currentState()) === 'qr_ready',
    `refused=${buyerRefused} state=${await currentState()}`);

  // T3 — un tiers non-membre est refusé.
  let strangerRefused = false;
  try {
    await repository.transitionTransaction({ authUserId: strangerAuth, transactionId: intent.transactionId, from: 'qr_ready', to: 'qr_verified', actorRole: 'seller', correlationId, now: now() });
  } catch { strangerRefused = true; }
  step('T3 un tiers non-membre est refusé', strangerRefused && (await currentState()) === 'qr_ready',
    `refused=${strangerRefused} state=${await currentState()}`);

  // T1 — LE CŒUR : le vendeur verrouille depuis le dashboard, AUCUN scan.
  await repository.transitionTransaction({ authUserId: sellerAuth, transactionId: intent.transactionId, from: 'qr_ready', to: 'qr_verified', actorRole: 'seller', correlationId, now: now() });
  step('T1 le vendeur verrouille depuis le dashboard, sans scan', (await currentState()) === 'qr_verified',
    `state=${await currentState()}`);

  // T4 — idempotence : un second clic n'ajoute pas d'événement.
  await repository.transitionTransaction({ authUserId: sellerAuth, transactionId: intent.transactionId, from: 'qr_ready', to: 'qr_verified', actorRole: 'seller', correlationId, now: now() });
  const verifiedEvents = (await sql`select count(*)::int as n from v2_transaction_events
    where transaction_id = ${intent.transactionId}::uuid and state = 'qr_verified'`)[0].n;
  step('T4 double validation idempotente (1 seul événement)', verifiedEvents === 1, `qr_verified events=${verifiedEvents}`);

  // T5 — la suite du flux reste inchangée après validation dashboard.
  await repository.declareExternalPayment({ authUserId: buyerAuth, transactionId: intent.transactionId, method: 'cash', correlationId, now: now() });
  await repository.confirmExternalPayment({ authUserId: sellerAuth, transactionId: intent.transactionId, correlationId, now: now() });
  step('T5 paiement déclaré puis confirmé après validation dashboard', (await currentState()) === 'payment_confirmed',
    `state=${await currentState()}`);
} catch (error) {
  step('preuve S-22 sans exception', false, String(error?.message ?? error).slice(0, 200));
} finally {
  console.log(failures === 0 ? '\nS22 PROOF OK' : `\nS22 PROOF FAILED (${failures})`);
}
