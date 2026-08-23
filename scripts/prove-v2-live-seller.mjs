import { createHash, randomUUID } from 'node:crypto';
import { createInternalNeonAuth } from '@neondatabase/auth';
import { neon } from '@neondatabase/serverless';

const required = [
  'OMNI_PROOF_ENVIRONMENT',
  'OMNI_PROOF_BRANCH_ID',
  'OMNI_PROOF_BASE_URL',
  'OMNI_PROOF_AUTH_URL',
  'OMNI_PROOF_DATABASE_URL',
  'OMNI_PROOF_SELLER_EMAIL',
  'OMNI_PROOF_SELLER_PASSWORD',
  'OMNI_PROOF_BUYER_EMAIL',
  'OMNI_PROOF_BUYER_PASSWORD',
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing external proof inputs: ${missing.join(', ')}`);
  process.exit(2);
}

if (process.env.OMNI_PROOF_ENVIRONMENT !== 'isolated') {
  console.error('Refusing to run: OMNI_PROOF_ENVIRONMENT must be isolated.');
  process.exit(2);
}

const baseUrl = new URL(process.env.OMNI_PROOF_BASE_URL);
if (baseUrl.hostname === 'omni.sparkafrika.online' || baseUrl.hostname.endsWith('.omni.sparkafrika.online')) {
  console.error('Refusing to run against the canonical Omni domain.');
  process.exit(2);
}

const authUrl = process.env.OMNI_PROOF_AUTH_URL;
const sql = neon(process.env.OMNI_PROOF_DATABASE_URL);
const proofLabel = process.env.OMNI_PROOF_BRANCH_ID;

function correlationId() {
  return randomUUID();
}

function idempotencyKey() {
  return randomUUID();
}

async function signInOrCreate(email, password, name) {
  let secret = password;
  const auth = createInternalNeonAuth(authUrl);
  try {
    try {
      const result = await auth.adapter.signIn.email({ email, password: secret });
      const userId = result?.data?.user?.id;
      if (typeof userId !== 'string' || !userId) throw new Error('AUTH_SIGN_IN_FAILED');
      const token = await auth.getJWTToken();
      if (typeof token !== 'string' || !token) throw new Error('AUTH_TOKEN_UNAVAILABLE');
      return { userId, token };
    } catch {
      if (process.env.OMNI_PROOF_ALLOW_SIGN_UP !== '1') throw new Error('AUTH_SIGN_IN_FAILED');
      const result = await auth.adapter.signUp.email({ email, password: secret, name });
      const userId = result?.data?.user?.id;
      if (typeof userId !== 'string' || !userId) throw new Error('AUTH_SIGN_UP_FAILED');
      const token = await auth.getJWTToken();
      if (typeof token !== 'string' || !token) throw new Error('AUTH_TOKEN_UNAVAILABLE');
      return { userId, token };
    }
  } catch {
    throw new Error('AUTH_BOOTSTRAP_FAILED');
  } finally {
    secret = '';
  }
}

async function post(path, token, body, idempotency = null) {
  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
  };
  if (idempotency) headers['idempotency-key'] = idempotency;
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  let parsed = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  return { status: response.status, body: parsed };
}

function assertStatus(step, result, expected) {
  if (result.status !== expected) throw new Error(`${step}:HTTP_${result.status}`);
  if (result.body?.ok !== true) throw new Error(`${step}:INVALID_ENVELOPE`);
}

function data(result, step) {
  const value = result.body?.data;
  if (!value || typeof value !== 'object') throw new Error(`${step}:MISSING_DATA`);
  return value;
}

async function bindSellerFixture(sellerUserId) {
  const alreadyBound = await sql`
    select count(*)::int as count
    from v2_facilities f
    join v2_accounts a on a.id = f.account_id
    where f.name = 'Omni Demo Seller Hub'
      and a.auth_user_id = ${sellerUserId}
  `;
  if (Number(alreadyBound[0]?.count) === 1) return;

  const conflicting = await sql`
    select count(*)::int as count
    from v2_accounts a
    where a.auth_user_id = ${sellerUserId}
      and not exists (
        select 1 from v2_facilities f
        where f.account_id = a.id
          and f.name = 'Omni Demo Seller Hub'
      )
  `;
  if (Number(conflicting[0]?.count) !== 0) throw new Error('SELLER_AUTH_ALREADY_BOUND');

  const rows = await sql`
    with target as (
      select f.account_id
      from v2_facilities f
      join v2_accounts a on a.id = f.account_id
      where f.name = 'Omni Demo Seller Hub'
        and a.onboarding_state in ('seller_ready', 'complete')
        and a.suspended_at is null
      limit 1
    )
    update v2_accounts a
    set auth_user_id = ${sellerUserId}
    from target t
    where a.id = t.account_id
      and (
        a.auth_user_id is null
        or not exists (
          select 1 from neon_auth."user" u where u.id::text = a.auth_user_id
        )
      )
    returning a.id
  `;
  if (!rows.length) {
    const current = await sql`
      select count(*)::int as count
      from v2_facilities f
      join v2_accounts a on a.id = f.account_id
      where f.name = 'Omni Demo Seller Hub'
        and a.onboarding_state in ('seller_ready', 'complete')
        and a.suspended_at is null
    `;
    if (Number(current[0]?.count) !== 1) throw new Error('SELLER_FIXTURE_NOT_UNIQUE');
    throw new Error('SELLER_FIXTURE_BINDING_GUARD_REJECTED');
  }
}

async function bindBuyerFixture(buyerUserId) {
  const alreadyBound = await sql`
    select count(*)::int as count
    from v2_accounts
    where onboarding_state = 'buyer_ready'
      and auth_user_id = ${buyerUserId}
  `;
  if (Number(alreadyBound[0]?.count) === 1) return;
  if (process.env.OMNI_PROOF_REBIND_FIXTURES !== '1') throw new Error('BUYER_FIXTURE_REBIND_REQUIRED');

  const target = await sql`
    update v2_accounts
    set auth_user_id = ${buyerUserId}
    where onboarding_state = 'buyer_ready'
      and suspended_at is null
      and (select count(*) from v2_accounts where onboarding_state = 'buyer_ready' and suspended_at is null) = 1
    returning id
  `;
  if (target.length !== 1) throw new Error('BUYER_FIXTURE_NOT_UNIQUE');
}

async function resolveFixture(sellerUserId) {
  const rows = await sql`
    select r.id as request_id, f.id as facility_id, p.id as product_id,
           greatest(1, least(p.quantity_allocated_omni, 1))::int as quantity_available
    from v2_availability_requests r
    join v2_facilities f on f.id = any(r.facility_scope)
    join v2_products p on p.id = r.product_id and p.facility_id = f.id
    join v2_accounts a on a.id = f.account_id
    where f.name = 'Omni Demo Seller Hub'
      and a.auth_user_id = ${sellerUserId}
      and a.onboarding_state in ('seller_ready', 'complete')
      and a.suspended_at is null
      and p.publication_state = 'published'
      and p.quantity_allocated_omni > 0
    order by r.created_at, r.id
    limit 1
  `;
  if (!rows.length) throw new Error('SELLER_FIXTURE_NOT_ELIGIBLE');
  return {
    requestId: String(rows[0].request_id),
    facilityId: String(rows[0].facility_id),
    productId: String(rows[0].product_id),
    quantityAvailable: Number(rows[0].quantity_available),
  };
}

async function createTransaction({ seller, buyer, fixture, priceMinor }) {
  const responseKey = idempotencyKey();
  const responseResult = await post('/api/v2/availability-responses', seller.token, {
    requestId: fixture.requestId,
    facilityId: fixture.facilityId,
    productId: fixture.productId,
    status: 'available',
    quantityAvailable: fixture.quantityAvailable,
    priceMinor,
    sellerMessage: 'Isolated Root proof response',
  }, responseKey);
  assertStatus('seller-response', responseResult, 201);
  const response = data(responseResult, 'seller-response');

  const replayResult = await post('/api/v2/availability-responses', seller.token, {
    requestId: fixture.requestId,
    facilityId: fixture.facilityId,
    productId: fixture.productId,
    status: 'available',
    quantityAvailable: fixture.quantityAvailable,
    priceMinor,
    sellerMessage: 'Isolated Root proof response',
  }, responseKey);
  assertStatus('seller-response-replay', replayResult, 201);
  const replay = data(replayResult, 'seller-response-replay');
  if (replay.responseId !== response.responseId) throw new Error('SELLER_RESPONSE_REPLAY_SHAPE');

  const conflictResult = await post('/api/v2/availability-responses', seller.token, {
    requestId: fixture.requestId,
    facilityId: fixture.facilityId,
    productId: fixture.productId,
    status: 'partial',
    quantityAvailable: fixture.quantityAvailable,
    priceMinor,
    sellerMessage: 'Conflicting idempotency body',
  }, responseKey);
  if (conflictResult.status !== 409 || conflictResult.body?.error?.code !== 'POLICY_REJECTED') {
    throw new Error(`seller-response-conflict:HTTP_${conflictResult.status}`);
  }

  const intentResult = await post('/api/v2/purchase-intents', buyer.token, {
    responseId: response.responseId,
  }, idempotencyKey());
  assertStatus('buyer-intent', intentResult, 201);
  const intent = data(intentResult, 'buyer-intent');

  const qrResult = await post('/api/v2/qr-issuances', seller.token, {
    transactionId: intent.transactionId,
  });
  assertStatus('seller-qr-issuance', qrResult, 201);
  const qr = data(qrResult, 'seller-qr-issuance');
  if (typeof qr.token !== 'string' || !qr.token || typeof qr.transactionId !== 'string') {
    throw new Error('seller-qr-issuance:INVALID_MATERIAL');
  }
  const tokenHash = createHash('sha256').update(qr.token).digest('hex');

  const verifiedResult = await post('/api/v2/qr-verifications', seller.token, {
    transactionId: qr.transactionId,
    tokenHash,
  });
  assertStatus('seller-qr-verification', verifiedResult, 200);

  const replayQrResult = await post('/api/v2/qr-verifications', seller.token, {
    transactionId: qr.transactionId,
    tokenHash,
  });
  if (replayQrResult.status !== 409 || replayQrResult.body?.error?.code !== 'CONFLICT') {
    throw new Error(`seller-qr-replay:HTTP_${replayQrResult.status}`);
  }

  return { transactionId: String(qr.transactionId), responseId: String(response.responseId), tokenHash };
}

async function run() {
  console.log(`proof-start branch=${proofLabel}`);
  const seller = await signInOrCreate(process.env.OMNI_PROOF_SELLER_EMAIL, process.env.OMNI_PROOF_SELLER_PASSWORD, 'Omni V2 Proof Seller');
  const buyer = await signInOrCreate(process.env.OMNI_PROOF_BUYER_EMAIL, process.env.OMNI_PROOF_BUYER_PASSWORD, 'Omni V2 Proof Buyer');
  await bindSellerFixture(seller.userId);
  await bindBuyerFixture(buyer.userId);
  const fixture = await resolveFixture(seller.userId);
  const first = await createTransaction({ seller, buyer, fixture, priceMinor: 100 });
  console.log('seller-response-qr=verified');

  const declaration = await post('/api/v2/external-payment-declarations', buyer.token, {
    transactionId: first.transactionId,
    method: 'pay_on_delivery',
  });
  assertStatus('buyer-payment-declaration', declaration, 200);
  const confirmation = await post('/api/v2/external-payment-confirmations', seller.token, {
    transactionId: first.transactionId,
  });
  assertStatus('seller-payment-confirmation', confirmation, 200);
  console.log('payment=confirmed');

  const second = await createTransaction({ seller, buyer, fixture, priceMinor: 101 });
  const sellerSessionA = await signInOrCreate(process.env.OMNI_PROOF_SELLER_EMAIL, process.env.OMNI_PROOF_SELLER_PASSWORD, 'Omni V2 Proof Seller');
  const sellerSessionB = await signInOrCreate(process.env.OMNI_PROOF_SELLER_EMAIL, process.env.OMNI_PROOF_SELLER_PASSWORD, 'Omni V2 Proof Seller');
  const concurrentResults = await Promise.all([
    post('/api/v2/qr-verifications', sellerSessionA.token, {
      transactionId: second.transactionId,
      tokenHash: second.tokenHash,
    }),
    post('/api/v2/qr-verifications', sellerSessionB.token, {
      transactionId: second.transactionId,
      tokenHash: second.tokenHash,
    }),
  ]);
  const accepted = concurrentResults.filter((result) => result.status === 200).length;
  const rejected = concurrentResults.filter((result) => result.status === 409 && result.body?.error?.code === 'CONFLICT').length;
  if (accepted !== 1 || rejected !== 1) throw new Error('qr-concurrency:UNEXPECTED_OUTCOME');
  console.log('qr-concurrency=one-accepted-one-rejected');
  console.log('proof-complete');
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : 'UNKNOWN_FAILURE';
  const safeStep = message.split(':')[0].replace(/[^a-z0-9_-]/gi, '_');
  console.error(`proof-failed step=${safeStep}`);
  process.exitCode = 1;
});
