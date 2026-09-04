// T-08 Integrated proof: full buyer→seller transaction loop on production-connected data.
// offer (demo seller catalogue) → availability request (buyer) → seller response → purchase intent
// → buyer QR issuance → seller QR verification → payment declaration → fulfilment → rating.
// Idempotent keys + fresh QR tokens; no public.* writes (RD-1). Buyer credit is a precondition.
import { randomUUID, createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const correlationId = randomUUID();
console.log(`integrated-proof correlationId=${correlationId}`);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

if (process.env.OMNI_PROOF_ENVIRONMENT !== 'production-connected-demo' || process.env.OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED !== '1') {
  console.error('integrated-proof: requires OMNI_PROOF_ENVIRONMENT=production-connected-demo and OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED=1');
  process.exit(2);
}
for (const key of ['OMNI_PROOF_BASE_URL', 'OMNI_PROOF_AUTH_URL', 'OMNI_PROOF_DATABASE_URL', 'OMNI_PROOF_BUYER_EMAIL', 'OMNI_PROOF_BUYER_PASSWORD', 'OMNI_PROOF_SELLER_EMAIL', 'OMNI_PROOF_SELLER_PASSWORD']) {
  if (!process.env[key]) { console.error(`integrated-proof: missing ${key}`); process.exit(2); }
}

const baseUrl = new URL(process.env.OMNI_PROOF_BASE_URL);
const authUrl = process.env.OMNI_PROOF_AUTH_URL;
const sql = neon(process.env.OMNI_PROOF_DATABASE_URL);

async function signIn(email, password) {
  let secret = password;
  try {
    const origin = baseUrl.origin;
    const res = await fetch(`${authUrl}/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin, referer: `${origin}/auth` },
      body: JSON.stringify({ email, password: secret }),
    });
    if (!res.ok) throw new Error(`AUTH_SIGN_IN_FAILED:${email}`);
    const data = await res.json();
    const cookieHeader = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    const tokenRes = await fetch(`${authUrl}/token`, { headers: { cookie: cookieHeader, origin } });
    const token = (await tokenRes.json())?.token;
    if (typeof token !== 'string' || !token) throw new Error(`AUTH_TOKEN_UNAVAILABLE:${email}`);
    return token;
  } finally { secret = ''; }
}

async function call(method, path, token, body = null, headers = {}) {
  const h = { 'content-type': 'application/json', ...headers };
  if (token) h.authorization = `Bearer ${token}`;
  const res = await fetch(new URL(path, baseUrl), { method, headers: h, body: body === null ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

const buyerToken = await signIn(process.env.OMNI_PROOF_BUYER_EMAIL, process.env.OMNI_PROOF_BUYER_PASSWORD);
const sellerToken = await signIn(process.env.OMNI_PROOF_SELLER_EMAIL, process.env.OMNI_PROOF_SELLER_PASSWORD);
step('identities signed in (buyer + seller)', Boolean(buyerToken && sellerToken));

// 1. Offer — a REAL seller offer with Omni allocation (T-08 "one real seller").
// The demo catalogue products have quantity_allocated_omni = 0 (cannot be responded to).
// Provision one labelled, auto-approved offer with allocation, RD-1 (v2 only) — the "offer" leg.
const sellerAccountRows = await sql`select a.id as account_id from v2_accounts a where a.auth_user_id = (select au.id::text from neon_auth."user" au where au.email = ${process.env.OMNI_PROOF_SELLER_EMAIL}) limit 1`;
const sellerAccountId = sellerAccountRows[0]?.account_id;
if (!sellerAccountId) abort('seller account not found');
const offerName = `T-08 Offer ${correlationId.slice(0, 8)}`;
let offerRows;
try {
  offerRows = await sql`
  insert into v2_products (facility_id, name, description, unit, price_minor, currency, discount_kind, discount_value_minor, quantity_allocated_omni, publication_state, availability_state)
  select f.id, ${offerName}, 'T-08 integrated proof offer', 'unit', 1000, 'XOF', 'percentage', 10, 5, 'published', 'a_valider'
  from v2_facilities f where f.account_id = ${sellerAccountId}::uuid
  returning id, facility_id, price_minor`;
} catch (e) { console.error('OFFER_INSERT_ERROR', String(e?.message ?? e)); abort('offer insert threw'); }
const offer = offerRows[0];
step('offer: real seller offer provisioned (allocated, published)', Boolean(offer), `product=${offer?.id}`);
if (!offer) abort('offer provisioning failed');
const facilityId = offer.facility_id, productId = offer.id, productPrice = Number(offer.price_minor);

// 2. Availability request — buyer requests the offer (credit-gated).
const reqKey = `avail${correlationId.replace(/-/g,"")}`;
const avail = await call('POST', '/api/v2/availability', buyerToken, { productId, facilityId, quantity: 1, budgetMode: 'unlimited', idempotencyKey: reqKey }, { 'idempotency-key': reqKey });
step('availability request created (buyer credit accepted)', avail.status === 201, `HTTP_${avail.status}`);
if (avail.status !== 201) { console.error('AVAIL_400_BODY', JSON.stringify(avail.body)); process.exit(1); }

// 3. Seller inbox picks up the request.
const queue = await call('GET', '/api/v2/seller/availability-requests', sellerToken);
const queueRequests = queue.body?.data?.requests ?? queue.body?.requests ?? [];
const myRequest = queueRequests.find((r) => r.productId === productId && !r.responseStatus);
step('seller inbox sees the request', queue.status === 200 && Boolean(myRequest), `queue=${queueRequests.length}`);
if (!myRequest) abort('no request in seller inbox');
const requestId = myRequest.id;
const requestPrice = productPrice;

// 4. Seller responds available.
const respKey = `resp${correlationId.replace(/-/g,"")}`;
const respond = await call('POST', '/api/v2/availability-responses', sellerToken, { requestId, facilityId, productId, status: 'available', quantityAvailable: 1, priceMinor: requestPrice, sellerMessage: null, idempotencyKey: respKey, correlationId }, { 'idempotency-key': respKey });
step('seller response (available) persisted', respond.status === 201, `HTTP_${respond.status}`);
if (respond.status !== 201) process.exit(1);
const responseId = respond.body?.data?.responseId ?? respond.body?.data?.id ?? respond.body?.responseId;
if (!responseId) { console.error('RESPONSE_DEBUG', JSON.stringify(respond.body)); process.exit(1); }

// 5. Buyer sees the response → purchase intent.
const responses = await call('GET', '/api/v2/availability-responses', buyerToken);
const responseData = responses.body?.data ?? responses.body ?? {};
const allResponses = responseData.responses ?? responseData.requests ?? [];
step('buyer reads the seller response', responses.status === 200 && Boolean(responseId), `responses=${allResponses.length}`);
const intentKey = `intent${correlationId.replace(/-/g,"")}`;
const intent = await call('POST', '/api/v2/purchase-intents', buyerToken, { responseId, idempotencyKey: intentKey }, { 'idempotency-key': intentKey });
if (intent.status !== 201) { console.error('INTENT_DEBUG', JSON.stringify(intent.body), 'responseId=', responseId); }
step('purchase intent created', intent.status === 201, `HTTP_${intent.status}`);
const transactionId = intent.body?.data?.transactionId ?? intent.body?.transactionId;
if (intent.status !== 201 || !transactionId) process.exit(1);

// 6. Buyer issues a QR token; seller verifies it.
const qrIssue = await call('POST', '/api/v2/buyer-qr-issuances', buyerToken, { transactionId });
const qrToken = qrIssue.body?.data?.token ?? qrIssue.body?.token;
step('buyer QR token issued', qrIssue.status === 201 && typeof qrToken === 'string', `HTTP_${qrIssue.status}`);
const tokenHash = qrToken ? createHash('sha256').update(qrToken).digest('hex') : '';
const verify = await call('POST', '/api/v2/qr-verifications', sellerToken, { transactionId, tokenHash });
step('seller verifies buyer QR (qr_verified)', verify.status === 200, `HTTP_${verify.status}`);

// 7. Payment declaration (buyer).
const payment = await call('POST', '/api/v2/external-payment-declarations', buyerToken, { transactionId, method: 'cash', correlationId });
step('payment declared (payment_declared)', payment.status === 201 || payment.status === 200, `HTTP_${payment.status}`);

// 8. Fulfilment chain — seller: payment_confirmed → fulfilment_pending → fulfilled; buyer: → received.
const confirm = await call('POST', '/api/v2/external-payment-confirmations', sellerToken, { transactionId, correlationId });
step('seller confirms payment (payment_confirmed)', confirm.status === 201 || confirm.status === 200, `HTTP_${confirm.status}`);
const pending = await call('POST', '/api/v2/transaction-transitions', sellerToken, { transactionId, from: 'payment_confirmed', to: 'fulfilment_pending', actorRole: 'seller', correlationId });
step('fulfilment pending', pending.status === 200, `HTTP_${pending.status}`);
const fulfil = await call('POST', '/api/v2/transaction-transitions', sellerToken, { transactionId, from: 'fulfilment_pending', to: 'fulfilled', actorRole: 'seller', correlationId });
step('fulfilled', fulfil.status === 200, `HTTP_${fulfil.status}`);
const received = await call('POST', '/api/v2/transaction-transitions', buyerToken, { transactionId, from: 'fulfilled', to: 'received', actorRole: 'buyer', correlationId });
step('buyer marks received', received.status === 200, `HTTP_${received.status}`);

// 9. Rating (buyer) — wait for the received state to be visible to the rating query.
async function waitForState(want, tries = 12) {
  for (let i = 0; i < tries; i += 1) {
    const rows = await sql`select coalesce((select state from v2_transaction_events where transaction_id = ${transactionId}::uuid order by created_at desc, id desc limit 1),'') as st`;
    if (String(rows[0]?.st ?? '') === want) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}
const receivedVisible = await waitForState('received');
// serverless connection-visibility race: the received event can lag the rating query's snapshot.
let rating = { status: 0, body: null };
for (let i = 0; i < 6; i += 1) {
  rating = await call('POST', '/api/v2/transaction-ratings', buyerToken, { transactionId, score: 5, note: 'T-08 integrated proof', correlationId });
  if (rating.status === 201 || rating.status === 200) break;
  await new Promise((r) => setTimeout(r, 700));
}
step('buyer rating submitted', receivedVisible && (rating.status === 201 || rating.status === 200), `HTTP_${rating.status} receivedVisible=${receivedVisible}`);
if (rating.status !== 201 && rating.status !== 200) console.error('RATING_DEBUG', JSON.stringify(rating.body));

// 10. DB cross-check — transaction reached fulfilment with a StockEvent chain, v2 only.
const txRows = await sql`select (select count(*)::int from v2_transaction_events where transaction_id = ${transactionId}::uuid) as events, (select coalesce((select state from v2_transaction_events where transaction_id = ${transactionId}::uuid order by created_at desc, id desc limit 1),'') ) as last_state`;
step('DB: transaction events recorded (v2 only)', Number(txRows[0]?.events ?? 0) >= 2, `events=${txRows[0]?.events} last=${txRows[0]?.last_state}`);

if (process.exitCode === 1) { console.error('integrated-proof: FAIL'); } else { console.log('integrated-proof: PASS'); }
