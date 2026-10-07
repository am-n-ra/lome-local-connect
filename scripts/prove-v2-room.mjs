// X3 (S-27) — Room de transaction : preuve contre une branche DISPOSABLE.
//
// La Room est une surface UI, mais sa promesse est serveur : (1) un NON-MEMBRE ne peut
// ni lire ni écrire ; (2) une conversation est RÉELLEMENT à deux sens (acheteur ↔ vendeur
// du même fil) ; (3) les deux rôles partagent la MÊME lecture membre-scopée (aucune requête
// vendeur dédiée) ; (4) la clôture rend le fil consultable dans l'historique.
//
// Pilote le code livré (createTrunkRepository). Écrit des lignes → branche jetable.
import { randomUUID, createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

if (!process.env.FF8_PROOF_DATABASE_URL) { console.error('room-proof: missing FF8_PROOF_DATABASE_URL'); process.exit(2); }
const sql = neon(process.env.FF8_PROOF_DATABASE_URL);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const correlationId = randomUUID();
const now = () => new Date().toISOString();

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}
console.log(`room-proof correlationId=${correlationId} tag=${tag}`);

const buyerAuth = `room-buyer-${tag}`;
const sellerAuth = `room-seller-${tag}`;
const strangerAuth = `room-stranger-${tag}`;
let buyerAccountId; let sellerAccountId; let strangerAccountId; let facilityId; let productId;

try {
  buyerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${buyerAuth}) returning id`)[0].id;
  sellerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${sellerAuth}) returning id`)[0].id;
  strangerAccountId = (await sql`insert into v2_accounts (auth_user_id) values (${strangerAuth}) returning id`)[0].id;
  facilityId = (await sql`insert into v2_facilities (account_id, name, trust_state, operational_state)
    values (${sellerAccountId}::uuid, ${`Room Facility ${tag}`}, 'confirmed', 'ouvert') returning id`)[0].id;
  productId = (await sql`insert into v2_products (facility_id, name, unit, price_minor, currency, quantity_allocated_omni, publication_state)
    values (${facilityId}::uuid, ${`Room Product ${tag}`}, 'unit', 1000, 'XOF', 10, 'published') returning id`)[0].id;

  const requestId = (await sql`insert into v2_availability_requests
    (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, status, idempotency_key, expires_at, delivery_mode)
    values (${buyerAccountId}::uuid, ${productId}::uuid, array[${facilityId}::uuid], 2, 'unlimited', 'submitted',
            ${`room-req-${tag}`}, now() + interval '1 day', 'retrait')
    returning id`)[0].id;
  const responseId = (await sql`insert into v2_availability_responses
    (request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, observed_at)
    values (${requestId}::uuid, ${facilityId}::uuid, ${sellerAccountId}::uuid, 'available', 2, 1000, '{}'::jsonb, now())
    returning id`)[0].id;
  const intent = await repository.createPurchaseIntent({ authUserId: buyerAuth, responseId, idempotencyKey: `room-intent-${tag}`, correlationId });
  const txnId = intent.transactionId;

  // 1. Chat à deux sens : l'acheteur écrit, le vendeur lit ET répond, l'acheteur relit.
  const buyerMsg = await repository.createTransactionMessage({ authUserId: buyerAuth, transactionId: txnId, body: `Bonjour ${tag}, toujours dispo ?` });
  const sellerSees = await repository.listTransactionMessages({ authUserId: sellerAuth, transactionId: txnId });
  const sellerMsg = await repository.createTransactionMessage({ authUserId: sellerAuth, transactionId: txnId, body: `Oui ${tag}, je prépare.` });
  const buyerSees = await repository.listTransactionMessages({ authUserId: buyerAuth, transactionId: txnId });
  const bodies = (buyerSees?.messages ?? []).map((m) => m.body);
  const roles = (buyerSees?.messages ?? []).map((m) => m.senderRole);
  step('chat à DEUX SENS (acheteur ↔ vendeur du même fil)',
    buyerMsg.senderRole === 'buyer' && sellerMsg.senderRole === 'seller'
    && (sellerSees?.messages ?? []).length === 1
    && bodies.includes(buyerMsg.body) && bodies.includes(sellerMsg.body)
    && roles.includes('buyer') && roles.includes('seller'),
    `buyer=${buyerMsg.senderRole} seller=${sellerMsg.senderRole} seen=${(buyerSees?.messages ?? []).length}`);

  // 2. Lecture membre-scopée PARTAGÉE : le vendeur voit la transaction via la MÊME requête
  //    que l'acheteur (aucun chemin vendeur dédié), et `actorRole` distingue les deux.
  const openBuyer = await repository.listOpenTransactions({ authUserId: buyerAuth });
  const openSeller = await repository.listOpenTransactions({ authUserId: sellerAuth });
  const buyerRow = openBuyer.transactions.find((t) => t.transactionId === txnId);
  const sellerRow = openSeller.transactions.find((t) => t.transactionId === txnId);
  step('lecture membre-scopée partagée : le vendeur voit SA transaction, avec son rôle',
    Boolean(buyerRow && sellerRow) && buyerRow.actorRole === 'buyer' && sellerRow.actorRole === 'seller',
    `buyerRole=${buyerRow?.actorRole} sellerRole=${sellerRow?.actorRole}`);

  // 3. Un NON-MEMBRE ne lit ni n'écrit (la Room ne fuit pas).
  const strangerRead = await repository.listTransactionMessages({ authUserId: strangerAuth, transactionId: txnId });
  let strangerWriteRefused = false;
  try {
    await repository.createTransactionMessage({ authUserId: strangerAuth, transactionId: txnId, body: 'intrusion' });
  } catch { strangerWriteRefused = true; }
  const strangerList = await repository.listOpenTransactions({ authUserId: strangerAuth });
  step('non-membre : ni lecture (0 message) ni écriture (refus) ni liste',
    (strangerRead?.messages ?? []).length === 0 && strangerWriteRefused && strangerList.transactions.length === 0,
    `read=${(strangerRead?.messages ?? []).length} writeRefused=${strangerWriteRefused} list=${strangerList.transactions.length}`);

  // 4. Le vendeur peut avancer SA partie du flux (le fil de ce qu'il doit faire est réel).
  const tokenHash = createHash('sha256').update(intent.qrToken).digest('hex');
  await repository.verifyQrToken({ authUserId: sellerAuth, transactionId: txnId, tokenHash, now: now() });
  await repository.declareExternalPayment({ authUserId: buyerAuth, transactionId: txnId, method: 'cash', correlationId, now: now() });
  await repository.confirmExternalPayment({ authUserId: sellerAuth, transactionId: txnId, correlationId, now: now() });
  const afterSeller = await repository.listOpenTransactions({ authUserId: sellerAuth });
  const stateNow = afterSeller.transactions.find((t) => t.transactionId === txnId)?.state;
  step('le vendeur avance sa partie (confirmation de paiement visible dans sa liste)',
    stateNow === 'payment_confirmed', `state=${stateNow}`);

  // 5. Après clôture, le fil reste consultable dans l'historique (Room d'une transaction finie).
  await repository.transitionTransaction({ authUserId: sellerAuth, transactionId: txnId, from: 'payment_confirmed', to: 'fulfilment_pending', actorRole: 'seller', correlationId, now: now() });
  await repository.transitionTransaction({ authUserId: sellerAuth, transactionId: txnId, from: 'fulfilment_pending', to: 'fulfilled', actorRole: 'seller', correlationId, now: now() });
  await repository.transitionTransaction({ authUserId: buyerAuth, transactionId: txnId, from: 'fulfilled', to: 'received', actorRole: 'buyer', correlationId, now: now() });
  await repository.submitTransactionRating({ authUserId: buyerAuth, transactionId: txnId, score: 5, note: null, correlationId, now: now() });
  const closedSeller = await repository.listClosedTransactions({ authUserId: sellerAuth });
  const closedRow = closedSeller.transactions.find((t) => t.transactionId === txnId);
  const closedMessages = await repository.listTransactionMessages({ authUserId: sellerAuth, transactionId: txnId });
  step('clôture : la Room reste consultable (historique vendeur + fil intact)',
    Boolean(closedRow) && (closedMessages?.messages ?? []).length === 2,
    `closed=${Boolean(closedRow)} messages=${(closedMessages?.messages ?? []).length}`);
} catch (error) {
  console.error('room-proof: UNEXPECTED', String(error?.stack ?? error));
  failures += 1;
  process.exitCode = 1;
} finally {
  const attempts = [
    productId && sql`delete from v2_products where id = ${productId}::uuid`,
    facilityId && sql`delete from v2_facilities where id = ${facilityId}::uuid`,
    buyerAccountId && sql`delete from v2_accounts where id = ${buyerAccountId}::uuid`,
    sellerAccountId && sql`delete from v2_accounts where id = ${sellerAccountId}::uuid`,
    strangerAccountId && sql`delete from v2_accounts where id = ${strangerAccountId}::uuid`,
  ].filter(Boolean);
  for (const attempt of attempts) { try { await attempt; } catch { /* append-only rows remain — disposable branch */ } }
  console.log('room-proof: cleanup attempted (append-only rows remain — delete the disposable branch)');
}

console.log(failures === 0 ? 'room-proof: ALL PASS' : `room-proof: ${failures} FAILURE(S)`);
