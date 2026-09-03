import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

// T-07a admin chain proof (production-connected-demo only).
// Runs AFTER the founder pushes omni-v2-rebuild and applies 039 on Neon.
// Chain: sign-in admin → console counts → operational-state transition (ferme→ouvert
// round-trip on the demo fixture) → audit log contains the event → counter no-op
// guard is reachable → unauthenticated calls are 401.

const required = [
  'OMNI_PROOF_ENVIRONMENT',
  'OMNI_PROOF_BASE_URL',
  'OMNI_PROOF_AUTH_URL',
  'OMNI_PROOF_DATABASE_URL',
  'OMNI_PROOF_ADMIN_EMAIL',
  'OMNI_PROOF_ADMIN_PASSWORD',
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing external proof inputs: ${missing.join(', ')}`);
  process.exit(2);
}

const proofEnvironment = process.env.OMNI_PROOF_ENVIRONMENT;
if (proofEnvironment !== 'production-connected-demo') {
  console.error('Refusing to run: the admin chain proof targets the canonical demo environment only.');
  process.exit(2);
}
if (process.env.OMNI_PROOF_ALLOW_PRODUCTION_CONNECTED !== '1') {
  console.error('Refusing to run: production-connected proof requires the explicit allow flag.');
  process.exit(2);
}

const baseUrl = new URL(process.env.OMNI_PROOF_BASE_URL);
if (baseUrl.hostname !== 'omni.sparkafrika.online') {
  console.error('Refusing to run outside the canonical Omni domain.');
  process.exit(2);
}

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
    if (!signinResponse.ok) {
      const text = await signinResponse.text();
      console.error(`auth sign-in HTTP_${signinResponse.status}: ${text.slice(0, 300)}`);
      throw new Error('AUTH_SIGN_IN_FAILED');
    }
    const data = await signinResponse.json();
    const userId = data?.user?.id ?? data?.userId;
    if (typeof userId !== 'string' || !userId) throw new Error('AUTH_SIGN_IN_FAILED');
    // Session token is opaque; exchange it for the JWT the API verifies (JWKS).
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
    method,
    headers: token ? headers : { 'content-type': 'application/json' },
    body: body === null ? null : JSON.stringify(body),
  });
  let parsed = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  return { status: response.status, body: parsed };
}

function step(name, condition, detail = '') {
  if (!condition) {
    console.error(`FAIL ${name}${detail ? ` :: ${detail}` : ''}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`PASS ${name}`);
  return true;
}

const correlationId = randomUUID();
console.log(`admin-proof correlationId=${correlationId}`);

// 1. Route reachability must be 401 (deployed) before any auth concern.
const anon = await call('GET', '/api/v2/admin/console', null);
step('routes deployed (401 without auth)', anon.status === 401, `got ${anon.status}`);

// 2. Admin sign-in + console.
const admin = await signIn(process.env.OMNI_PROOF_ADMIN_EMAIL, process.env.OMNI_PROOF_ADMIN_PASSWORD);
const consoleResult = await call('GET', '/api/v2/admin/console', admin.token);
const consoleData = consoleResult.body?.data;
step('console authorized for admin account', consoleResult.status === 200 && consoleData?.authorized === true, consoleResult.body?.error?.message ?? `HTTP_${consoleResult.status}`);
step('console returns bounded integer counts', ['pendingClaims', 'pendingActivations', 'operatorRuns', 'auditEventsToday'].every((key) => Number.isInteger(consoleData?.[key])));

// 3. Operational state round-trip on the demo fixture facility.
const fixtureRows = await sql`
  select id, operational_state
  from v2_facilities
  where name = 'Omni Demo Seller Hub'
  order by created_at asc
  limit 1
`;
const fixture = fixtureRows[0];
if (!fixture) {
  console.error('FAIL fixture facility (demo seller facility must exist for the round-trip)');
  process.exit(1);
}
const toggle = await call('POST', `/api/v2/admin/facilities/${fixture.id}/operational-state`, admin.token, { state: 'ferme', reason: `proof T-07a ${correlationId}` });
step('operational state transition accepted (admin-guarded)', toggle.status === 200 && toggle.body?.data?.operationalState === 'ferme', toggle.body?.error?.message ?? `HTTP_${toggle.status}`);
const restore = await call('POST', `/api/v2/admin/facilities/${fixture.id}/operational-state`, admin.token, { state: 'ouvert', reason: `proof T-07a restore ${correlationId}` });
step('operational state restored to ouvert', restore.status === 200 && restore.body?.data?.operationalState === 'ouvert', restore.body?.error?.message ?? `HTTP_${restore.status}`);
const verifyRows = await sql`select operational_state from v2_facilities where id = ${fixture.id}`;
step('database reflects the restored operational state', verifyRows[0]?.operational_state === 'ouvert', `got ${verifyRows[0]?.operational_state}`);

// 4. Audit log contains the transition events.
const audit = await call('GET', '/api/v2/admin/audit-events?event_type=facility_operational_state_changed&limit=10', admin.token);
const auditEvents = audit.body?.data?.events ?? [];
step('audit log lists the operational-state events', audit.status === 200 && auditEvents.some((event) => String(event.reason ?? '').includes(correlationId)), `saw ${auditEvents.length} events`);
const auditEvent = auditEvents.find((event) => String(event.reason ?? '').includes(correlationId));
step('audit event carries facility coordinates for the map hop', typeof auditEvent?.latitude === 'number' && typeof auditEvent?.longitude === 'number');

// 5. Counter correction guard is reachable: no-op must be rejected, never fabricated.
const counterRows = await sql`select coalesce(qualifying_sales, 0)::int as qualifying_sales from v2_facilities where id = ${fixture.id}`;
const currentSales = Number(counterRows[0]?.qualifying_sales ?? 0);
const noop = await call('POST', `/api/v2/admin/facilities/${fixture.id}/sales-counter`, admin.token, { qualifyingSales: currentSales, reason: `proof T-07a no-op ${correlationId}` });
const noopIsReject = noop.status === 409 || (noop.status === 400 && String(noop.body?.error?.message ?? '').length > 0);
step('counter no-op is rejected (guarded, never fabricated)', noopIsReject, `HTTP_${noop.status}`);

if (process.exitCode === 1) {
  console.error('admin-proof: FAIL');
} else {
  console.log('admin-proof: PASS');
}
