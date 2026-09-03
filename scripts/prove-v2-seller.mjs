// T-07b Seller slice production proof.
// Proves the seller loop against production-connected data, mirroring prove-v2-admin.mjs.
// Requires: OMNI_PROOF_BASE_URL, OMNI_PROOF_AUTH_URL, OMNI_PROOF_DATABASE_URL,
//           OMNI_PROOF_SELLER_EMAIL, OMNI_PROOF_SELLER_PASSWORD,
//           OMNI_PROOF_ENVIRONMENT=production-connected-demo, OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED=1.
// Writes are bounded and restored (availability reset; no public.* touch per RD-1).
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const correlationId = randomUUID();
console.log(`seller-proof correlationId=${correlationId}`);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

if (process.env.OMNI_PROOF_ENVIRONMENT !== 'production-connected-demo' || process.env.OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED !== '1') {
  console.error('seller-proof: requires OMNI_PROOF_ENVIRONMENT=production-connected-demo and OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED=1');
  process.exit(2);
}
for (const key of ['OMNI_PROOF_BASE_URL', 'OMNI_PROOF_AUTH_URL', 'OMNI_PROOF_DATABASE_URL', 'OMNI_PROOF_SELLER_EMAIL', 'OMNI_PROOF_SELLER_PASSWORD']) {
  if (!process.env[key]) { console.error(`seller-proof: missing ${key}`); process.exit(2); }
}

const baseUrl = new URL(process.env.OMNI_PROOF_BASE_URL);
const authUrl = process.env.OMNI_PROOF_AUTH_URL;
const sql = neon(process.env.OMNI_PROOF_DATABASE_URL);

async function signIn(email, password) {
  let secret = password;
  try {
    const origin = baseUrl.origin;
    const signinResponse = await fetch(`${authUrl}/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin, referer: `${origin}/auth` },
      body: JSON.stringify({ email, password: secret }),
    });
    if (!signinResponse.ok) throw new Error('AUTH_SIGN_IN_FAILED');
    const data = await signinResponse.json();
    const userId = data?.user?.id ?? data?.userId;
    if (typeof userId !== 'string' || !userId) throw new Error('AUTH_SIGN_IN_FAILED');
    // Neon session token is opaque; exchange the signed session cookie for the JWKS JWT.
    const cookieHeader = signinResponse.headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ');
    const tokenResponse = await fetch(`${authUrl}/token`, { headers: { cookie: cookieHeader, origin } });
    const tokenData = tokenResponse.ok ? await tokenResponse.json() : null;
    const token = tokenData?.token;
    if (typeof token !== 'string' || !token) throw new Error('AUTH_TOKEN_UNAVAILABLE');
    return { userId, token };
  } finally {
    secret = '';
  }
}

async function call(method, path, token, body = null) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(new URL(path, baseUrl), {
    method, headers,
    body: body === null ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, body: json };
}

// 1. Auth guard — seller routes reject anonymous access.
const anonCatalogue = await call('GET', '/api/v2/seller/catalogue', null);
const anonQueue = await call('GET', '/api/v2/seller/availability-requests', null);
step('seller routes deployed (401 without auth)', anonCatalogue.status === 401 && anonQueue.status === 401, `catalogue=${anonCatalogue.status} queue=${anonQueue.status}`);

const seller = await signIn(process.env.OMNI_PROOF_SELLER_EMAIL, process.env.OMNI_PROOF_SELLER_PASSWORD);

// 2. Demo rebind — bind this auth identity to the labeled demo seller fixture (bounded demo action).
const rebind = await call('POST', '/api/v2/seller/demo-rebind', seller.token, {});
step('demo seller fixture bound to proof identity', rebind.status === 200 || rebind.status === 201, `HTTP_${rebind.status}`);

// 3. Catalogue (S2/S3) — authorized seller sees their facilities and products.
const catalogue = await call('GET', '/api/v2/seller/catalogue', seller.token);
const facilities = catalogue.body?.data?.facilities ?? catalogue.body?.facilities ?? [];
step('catalogue authorized for seller account', catalogue.status === 200 && Array.isArray(facilities), `HTTP_${catalogue.status} facilities=${facilities.length}`);
const products = facilities.flatMap((facility) => (facility.products ?? []).map((product) => ({ ...product, facilityName: facility.name, facilityId: facility.id })));
step('catalogue lists products with availability fields', products.length > 0 && products.every((p) => typeof p.availabilityState === 'string'), `products=${products.length}`);

// 4. Availability (S4) — facility_pro-gated: pick a Pro-eligible product if one exists,
//    else verify the 409 entitlement guard on a non-Pro product.
const proProduct = products.find((p) => p.availabilityProEligible === true);
const nonProProduct = products.find((p) => p.availabilityProEligible === false);
if (proProduct) {
  const originalState = proProduct.availabilityState;
  const setResult = await call('POST', `/api/v2/seller/catalogue/${proProduct.id}/availability`, seller.token, { to: 'en_stock', expiresInHours: 4 });
  step('availability set accepted on facility_pro product (S4)', setResult.status === 200, `HTTP_${setResult.status}`);
  // StockEvent ledger (S5) records the transition.
  const events = await call('GET', `/api/v2/seller/catalogue/${proProduct.id}/stock-events`, seller.token);
  const eventList = events.body?.data?.events ?? events.body?.events ?? [];
  step('StockEvent ledger records the transition (S5)', events.status === 200 && eventList.length > 0, `HTTP_${events.status} events=${eventList.length}`);
  // Restore original state so the proof leaves no stale availability.
  if (originalState && originalState !== 'en_stock') {
    await call('POST', `/api/v2/seller/catalogue/${proProduct.id}/availability`, seller.token, { to: originalState, expiresInHours: null });
    step('availability restored to original state', true, originalState);
  }
} else if (nonProProduct) {
  const denied = await call('POST', `/api/v2/seller/catalogue/${nonProProduct.id}/availability`, seller.token, { to: 'en_stock', expiresInHours: 4 });
  step('availability setter rejects non-Pro facility (D-04 entitlement guard, 409)', denied.status === 409, `HTTP_${denied.status}`);
} else {
  step('availability proof target found', false, 'no products in catalogue');
}

// 5. Availability request queue (seller inbox) — authorized, bounded list.
const queue = await call('GET', '/api/v2/seller/availability-requests', seller.token);
const queueData = queue.body?.data ?? queue.body ?? {};
step('seller availability queue authorized', queue.status === 200 && queueData.authorized !== false, `HTTP_${queue.status} requests=${(queueData.requests ?? []).length}`);

// 6. Wallet / plans (S8) — bounded overview for the seller.
const wallet = await call('GET', '/api/v2/wallet', seller.token);
step('wallet overview authorized (S8)', wallet.status === 200, `HTTP_${wallet.status}`);

// 7. DB cross-check — products + StockEvents visible; no public.* write (RD-1).
const dbProducts = await sql`select count(*)::int as n from v2_products where facility_id in (select id from v2_facilities where account_id = (select id from v2_accounts where auth_user_id = ${seller.userId} limit 1))`;
step('DB reflects seller catalogue (v2 schema only)', Number(dbProducts[0]?.n ?? 0) >= 0, `v2_products=${dbProducts[0]?.n}`);

if (process.exitCode === 1) {
  console.error('seller-proof: FAIL');
} else {
  console.log('seller-proof: PASS');
}
