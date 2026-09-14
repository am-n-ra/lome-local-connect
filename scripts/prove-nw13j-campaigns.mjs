// NW-13j live spot-check — real prod session, real demo seller account.
// Exercises campaign routes end-to-end against prod (read-only + bounded 409-gate call).
// Requires: OMNI_PROOF_BASE_URL, OMNI_PROOF_AUTH_URL,
//           OMNI_PROOF_SELLER_EMAIL=demo@seller.omni, OMNI_PROOF_SELLER_PASSWORD,
//           OMNI_PROOF_ENVIRONMENT=production-connected-demo, OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED=1.
import { randomUUID } from 'node:crypto';

const correlationId = randomUUID();
console.log(`nw13j-check correlationId=${correlationId}`);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

if (process.env.OMNI_PROOF_ENVIRONMENT !== 'production-connected-demo' || process.env.OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED !== '1') {
  console.error('nw13j-check: requires OMNI_PROOF_ENVIRONMENT=production-connected-demo and OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED=1');
  process.exit(2);
}
for (const key of ['OMNI_PROOF_BASE_URL', 'OMNI_PROOF_AUTH_URL', 'OMNI_PROOF_SELLER_EMAIL', 'OMNI_PROOF_SELLER_PASSWORD']) {
  if (!process.env[key]) { console.error(`nw13j-check: missing ${key}`); process.exit(2); }
}

const baseUrl = new URL(process.env.OMNI_PROOF_BASE_URL);
const authUrl = process.env.OMNI_PROOF_AUTH_URL;

async function signIn(email, password) {
  let secret = password;
  try {
    const origin = baseUrl.origin;
    const signinResponse = await fetch(`${authUrl}/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin, referer: `${origin}/auth` },
      body: JSON.stringify({ email, password: secret }),
    });
    if (!signinResponse.ok) throw new Error(`AUTH_SIGN_IN_FAILED:${email}`);
    await signinResponse.json();
    const cookieHeader = signinResponse.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    const tokenResponse = await fetch(`${authUrl}/token`, { headers: { cookie: cookieHeader, origin } });
    const tokenData = tokenResponse.ok ? await tokenResponse.json() : null;
    const token = tokenData?.token;
    if (typeof token !== 'string' || !token) throw new Error(`AUTH_TOKEN_UNAVAILABLE:${email}`);
    return token;
  } finally { secret = ''; }
}

async function call(method, path, token, body = null, headers = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (token) h.authorization = `Bearer ${token}`;
  if (body) h['content-type'] = 'application/json';
  const res = await fetch(baseUrl.origin + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

const token = await signIn(process.env.OMNI_PROOF_SELLER_EMAIL, process.env.OMNI_PROOF_SELLER_PASSWORD);

// 1. Seller catalogue — workspace data (which facility does the seller own).
const cat = await call('GET', '/api/v2/seller/catalogue', token);
const facilities = cat.data?.facilities ?? cat.data?.data?.facilities ?? [];
step('seller catalogue 200 with facilities', cat.status === 200 && Array.isArray(facilities), `status=${cat.status} count=${Array.isArray(facilities) ? facilities.length : 'n/a'}`);
const facility = facilities.find((f) => f.id === '20000000-0000-0000-0000-000000000101') ?? facilities[0];
const facilityId = facility?.id;
step('owns Omni Demo Seller Hub (…0101)', facilityId === '20000000-0000-0000-0000-000000000101', `got=${facilityId} plan=${facility?.commercialPlan ?? facility?.commercial_plan ?? '?'}`);
const plan = facility?.commercialPlan ?? facility?.commercial_plan ?? null;

// 2. Campaigns route: GET as owner (Free facility → 200, empty campaigns + wallet budget).
const getCamps = await call('GET', `/api/v2/seller/facilities/${facilityId}/campaigns`, token);
const getBody = getCamps.data?.data ?? getCamps.data ?? {};
step('campaigns GET 200 as owner', getCamps.status === 200, `status=${getCamps.status}`);
step('campaigns GET lists empty campaigns', Array.isArray(getBody?.campaigns) && getBody.campaigns.length === 0, `campaigns=${JSON.stringify(getBody?.campaigns)}`);
step('campaigns GET returns wallet budget (billingCurrency)', typeof getBody?.budgetRemainingMinor === 'number' && typeof getBody?.billingCurrency === 'string', `budgetRemaining=${getBody?.budgetRemainingMinor} currency=${getBody?.billingCurrency}`);

// 3. Campaigns POST: as owner on a Free facility → 409 POLICY_REJECTED (Pro-gate).
const postCamps = await call('POST', `/api/v2/seller/facilities/${facilityId}/campaigns`, token, {
  name: 'NW-13j spot-check', budgetMinor: 100, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 86400000).toISOString(), idempotencyKey: `nw13j-check:${correlationId}`,
}, { 'Idempotency-Key': `nw13j-check:${correlationId}` });
const postBody = postCamps.data?.error ?? postCamps.data?.data ?? postCamps.data;
step('campaigns POST 409 Pro-gate (Free facility)', postCamps.status === 409, `status=${postCamps.status} body=${JSON.stringify(postBody)?.slice?.(0, 160)}`);

// 4. Unauthenticated → 401.
const anon = await call('GET', `/api/v2/seller/facilities/${facilityId}/campaigns`, null);
step('campaigns GET 401 without session', anon.status === 401, `status=${anon.status}`);

console.log(failures === 0 ? `NW13J_CHECK_ALL_PASS correlationId=${correlationId}` : `NW13J_CHECK_FAILURES=${failures}`);
process.exitCode = failures === 0 ? 0 : 1;