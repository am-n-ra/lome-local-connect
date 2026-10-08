// Web Push proof — arming + consent round-trip, against PROD (or any deployed host).
//
//   URL=https://omni.sparkafrika.online node scripts/prove-web-push.mjs
//
// Runs the REAL routes through the REAL database:
//   T1  GET  /api/v2/notifications/push-key      → configured:true, publicKey B…  (arming)
//   T2  POST /api/v2/notifications/push?action=subscribe (authed) → then status active:1
//   T3  POST /api/v2/notifications/push?action=revoke    (authed) → then status active:0
//   T4  no page errors
//
// HONEST BOUNDARY: a real browser push (a real FCM/APNs endpoint that renders a native
// notification) needs a device-class browser and a real push service — that step is
// MANUAL and is NOT claimed here. What this proves is the server-side chain the app owns:
// the key is armed, consent persists account-scoped, and revocation works. See
// docs/push-operations.md for the full required-proof list.
import { chromium } from 'playwright';

const TARGET = process.env.URL || 'https://omni.sparkafrika.online';
const EMAIL = process.env.PROBE_EMAIL || 'demo@buyer.omni';
const PASSWORD = process.env.PROBE_PASSWORD || 'Omni@2026';
// Public Neon Auth URL (same default as src/auth.ts). Only used to exchange the session
// cookie for a JWT `Authorization: Bearer` token, exactly like the app does.
const AUTH_URL = process.env.NEON_AUTH_URL || 'https://ep-purple-fog-amwsyc3j.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth';

let failures = 0;
const fail = (m) => { failures += 1; console.log(`FAIL ${m}`); };
const pass = (m) => console.log(`PASS ${m}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.stack || String(e)));

await page.goto(TARGET, { waitUntil: 'load' });
await page.waitForTimeout(3000);
const origin = new URL(page.url()).origin;

// T1 — arming. Unauthenticated on purpose: the public key is public.
const keyRes = await page.evaluate(async (o) => {
  const r = await fetch(`${o}/api/v2/notifications/push-key`, { headers: { Accept: 'application/json' } });
  return { status: r.status, body: await r.json() };
}, origin);
const configured = keyRes.body?.data?.configured === true;
const publicKey = keyRes.body?.data?.publicKey ?? null;
if (configured && typeof publicKey === 'string' && publicKey.startsWith('B')) {
  pass(`push-key armé (configured:true, clé ${publicKey.slice(0, 12)}…)`);
} else {
  fail(`push-key NON armé (configured:${keyRes.body?.data?.configured}, publicKey:${publicKey}) — poser VAPID_* en prod puis redéployer`);
}

// Sign in through the app's proven gated-action flow (same sequence as probe-auth-resume):
// a no-session gated action opens the access portal (#v13-email).
await page.evaluate(() => { [...document.querySelectorAll('.navpill button')].find((x) => /Recherche/.test(x.querySelector('.sr-only')?.textContent || ''))?.click(); });
await page.waitForFunction(() => !!document.querySelector('input[aria-label="Recherche"]'), null, { timeout: 8000 }).catch(() => {});
await page.evaluate(() => { const i = document.querySelector('input[aria-label="Recherche"]'); i.focus(); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
await page.keyboard.type('station', { delay: 20 });
await page.keyboard.press('Enter');
await page.waitForFunction(() => document.querySelectorAll('#hgrid .hcard').length > 2, null, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);
await page.evaluate(() => { [...document.querySelectorAll('button')].find((x) => /^Comparer$/.test((x.textContent || '').trim()))?.click(); });
await page.waitForFunction(() => !!document.querySelector('#v13-email'), null, { timeout: 10000 }).catch(() => {});
const hasEmail = await page.$('#v13-email').catch(() => null);
if (hasEmail) {
  await page.fill('#v13-email', EMAIL);
  await page.fill('#v13-password', PASSWORD);
  await page.evaluate(() => document.querySelector('#v13-email')?.closest('form')?.requestSubmit?.());
  await page.waitForTimeout(6000);
} else {
  fail("l'écran de connexion ne s'est pas ouvert (gated action indisponible)");
}
const token = await page.evaluate(async (a) => {
  try {
    const r = await fetch(`${a}/token`, { headers: { Accept: 'application/json' }, credentials: 'include' });
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j.token === 'string' && j.token.split('.').length === 3 ? j.token : null;
  } catch { return null; }
}, AUTH_URL);

const endpoint = `https://web.push.example.test/omni-proof/${Date.now()}`;
// Frontière de mesure : on sépare le bruit carte (setup recherche/comparateur, pré-existant)
// des erreurs de la fenêtre push (subscribe/revoke). T4 ne juge QUE la fenêtre push — c'est la
// tranche livrée. Le bruit de setup est compté et rapporté, jamais caché.
const setupErrorCount = errors.length;
console.log(`NOTE  setup (recherche/comparateur) : ${setupErrorCount} erreur(s) carte pré-existante(s) hors périmètre`);
const pushWindowFrom = errors.length;

if (!token) {
  fail("impossible d'obtenir un jeton authentifié (connexion échouée) — T2/T3 sautés");
} else {
  // T2 — subscribe (authed), then the account-scoped counter must read 1.
  const sub = await page.evaluate(async ({ o, t, e }) => {
    const r = await fetch(`${o}/api/v2/notifications/push?action=subscribe`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ endpoint: e, keys: { p256dh: 'BProofP256dhPlaceholder0000000000000000000000000000000000000000000000000000000', auth: 'proof-auth' }, userAgent: navigator.userAgent }),
    });
    return { status: r.status, body: await r.json() };
  }, { o: origin, t: token, e: endpoint });
  const st1 = await page.evaluate(async ({ o, t }) => {
    const r = await fetch(`${o}/api/v2/notifications/push?status=1`, { headers: { Accept: 'application/json', Authorization: `Bearer ${t}` } });
    return { status: r.status, body: await r.json() };
  }, { o: origin, t: token });
  if ((sub.status === 200 || sub.status === 201) && st1.body?.data?.active === 1) {
    pass(`abonnement authentifié persisté (active:1)`);
  } else {
    fail(`abonnement non persisté (subscribe ${sub.status}, active:${st1.body?.data?.active})`);
  }

  // T3 — revoke, then the counter must fall back to 0.
  const rev = await page.evaluate(async ({ o, t, e }) => {
    const r = await fetch(`${o}/api/v2/notifications/push?action=revoke`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ endpoint: e }),
    });
    return { status: r.status, body: await r.json() };
  }, { o: origin, t: token, e: endpoint });
  const st2 = await page.evaluate(async ({ o, t }) => {
    const r = await fetch(`${o}/api/v2/notifications/push?status=1`, { headers: { Accept: 'application/json', Authorization: `Bearer ${t}` } });
    return { status: r.status, body: await r.json() };
  }, { o: origin, t: token });
  if (rev.status === 200 && st2.body?.data?.active === 0) {
    pass(`révocation authentifiée (active:0)`);
  } else {
    fail(`révocation non effective (revoke ${rev.status}, active:${st2.body?.data?.active})`);
  }
  console.log('NOTE  la notification native (endpoint FCM/APNs réel) reste une preuve MANUELLE sur appareil.');
}

// T4 — aucune erreur de page DANS LA FENÊTRE PUSH. Les erreurs carte de la phase de setup
// (recherche/comparateur, `_calcMatrices` / `Invalid LngLat`) sont pré-existantes et hors
// périmètre de cette tranche : comptées et rapportées ci-dessus, jamais cachées.
const pushErrors = errors.slice(pushWindowFrom);
if (pushErrors.length === 0) pass('no page errors dans la fenêtre push');
else { fail(`page errors dans la fenêtre push (${pushErrors.length})`); console.log(pushErrors[0].split('\n').slice(0, 6).join('\n')); }

await browser.close();
console.log(failures === 0 ? '\nWEB-PUSH PROBE: PASS' : `\nWEB-PUSH PROBE: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
