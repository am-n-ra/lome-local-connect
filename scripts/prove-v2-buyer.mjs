// T-07c Buyer slice production proof.
// Proves the buyer loop against production-connected data, mirroring prove-v2-seller.mjs.
// Requires: OMNI_PROOF_BASE_URL, OMNI_PROOF_AUTH_URL, OMNI_PROOF_DATABASE_URL,
//           OMNI_PROOF_BUYER_EMAIL, OMNI_PROOF_BUYER_PASSWORD,
//           OMNI_PROOF_ENVIRONMENT=production-connected-demo, OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED=1.
// Writes are bounded: any saved search created is deleted before exit. No public.* touch (RD-1).
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const correlationId = randomUUID();
console.log(`buyer-proof correlationId=${correlationId}`);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

if (process.env.OMNI_PROOF_ENVIRONMENT !== 'production-connected-demo' || process.env.OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED !== '1') {
  console.error('buyer-proof: requires OMNI_PROOF_ENVIRONMENT=production-connected-demo and OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED=1');
  process.exit(2);
}
for (const key of ['OMNI_PROOF_BASE_URL', 'OMNI_PROOF_AUTH_URL', 'OMNI_PROOF_DATABASE_URL', 'OMNI_PROOF_BUYER_EMAIL', 'OMNI_PROOF_BUYER_PASSWORD']) {
  if (!process.env[key]) { console.error(`buyer-proof: missing ${key}`); process.exit(2); }
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

// 1. Auth guard — buyer-scoped routes reject anonymous access.
const anonSaved = await call('GET', '/api/v2/saved-searches', null);
const anonRequests = await call('GET', '/api/v2/availability-responses', null);
step('buyer routes deployed (401 without auth)', anonSaved.status === 401 && anonRequests.status === 401, `saved=${anonSaved.status} responses=${anonRequests.status}`);

const buyer = await signIn(process.env.OMNI_PROOF_BUYER_EMAIL, process.env.OMNI_PROOF_BUYER_PASSWORD);

// 2. Public browse without account (D-05) — map/facility listing reachable anonymously.
const browse = await call('GET', '/api/v2/public/facilities', null);
step('public browse reachable without account (D-05)', browse.status === 200, `HTTP_${browse.status}`);

// 3. B19 saved searches — create, list, delete round-trip (bounded, cleaned up).
const created = await call('POST', '/api/v2/saved-searches', buyer.token, { query: 'café filtre', constraints: { category: 'Alimentation' } });
const searchId = created.body?.data?.id ?? created.body?.id;
step('B19 saved search created', created.status === 201 && typeof searchId === 'string', `HTTP_${created.status}`);
const listed = await call('GET', '/api/v2/saved-searches', buyer.token);
const searches = listed.body?.data?.searches ?? listed.body?.searches ?? [];
step('B19 saved searches listed for account', listed.status === 200 && searches.some((s) => s.id === searchId), `HTTP_${listed.status} searches=${searches.length}`);
let deletedStatus = 0;
if (searchId) {
  const del = await call('DELETE', `/api/v2/saved-searches/${searchId}`, buyer.token);
  deletedStatus = del.status;
}
step('B19 saved search deleted (cleanup, no leftover state)', deletedStatus === 200, `HTTP_${deletedStatus}`);

// 4. Buyer availability requests (inbox) — authorized, bounded list.
const requests = await call('GET', '/api/v2/availability-responses', buyer.token);
const requestData = requests.body?.data ?? requests.body ?? {};
step('buyer availability requests authorized', requests.status === 200, `HTTP_${requests.status} requests=${(requestData.requests ?? requestData.responses ?? []).length}`);

// 5. Wallet (buyer plan/wallet surface) — authorized, bounded.
const wallet = await call('GET', '/api/v2/wallet', buyer.token);
step('buyer wallet overview authorized', wallet.status === 200, `HTTP_${wallet.status}`);

// 6. DB cross-check — saved search cleaned up (0 leftover for this proof query), v2 only.
const leftover = await sql`select count(*)::int as n from v2_saved_searches s join v2_accounts a on a.id = s.account_id where a.auth_user_id = ${buyer.userId} and s.query = 'café filtre' and s.active = true`;
step('DB reflects cleanup (no active leftover saved search)', Number(leftover[0]?.n ?? 1) === 0, `active_leftover=${leftover[0]?.n}`);

if (process.exitCode === 1) {
  console.error('buyer-proof: FAIL');
} else {
  console.log('buyer-proof: PASS');
}
