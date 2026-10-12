// PROOF — BRANCHES auth loop (founder-reported 2026-10-07).
//
// The founder's exact defect: with `/get-session` returning null (a session cookie the
// browser refuses to confirm — cross-site, third-party, or a transient auth outage), the
// app ignored the user that sign-up / sign-in ALREADY returned and sent the user back to
// the OTP screen. Clicking « Se connecter » looped: OTP → sign-in → OTP.
//
// This drives the REAL built app while forcing `/get-session` → null, and asserts the user
// lands in the app (menu) instead of looping. Run against a local preview of the build
// (TARGET=http://localhost:4173) and/or prod.
import { chromium } from 'playwright';

const target = process.env.TARGET || 'https://omni.sparkafrika.online';
const results = [];
const ok = (name, pass, detail = '') => results.push({ name, pass, detail });

const b = await chromium.launch({ headless: true });
const pageErrors = [];

async function drive(mode) {
  const email = `omni.loop.${mode}.${Date.now()}@sparkafrika.online`;
  const fakeUser = { id: `sim-${mode}`, email, name: 'Probe', emailVerified: true };
  const p = await b.newPage({ viewport: { width: 390, height: 780 } });
  p.on('pageerror', (e) => pageErrors.push(String(e)));

  const hits = { getSession: 0, signUp: 0, signIn: 0, send: 0 };
  // The one thing a blocked/refused session cookie causes:
  await p.route('**/*/get-session*', (r) => { hits.getSession++; return r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }); });
  await p.route('**/*/email-otp/send-verification-otp*', (r) => { hits.send++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }); });
  await p.route('**/*/sign-up/email*', (r) => { hits.signUp++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'sim', user: fakeUser }) }); });
  await p.route('**/*/sign-in/email*', (r) => { hits.signIn++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ redirect: false, token: 'sim', user: fakeUser }) }); });

  const sheet = () => p.evaluate(() => document.querySelector('.sheet')?.getAttribute('data-sheet') ?? 'none');
  const hasOtp = () => p.evaluate(() => !!document.querySelector('#v13-auth-code'));

  await p.goto(target, { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  // Open the auth sheet (menu → « Créer un compte / se connecter »).
  await p.evaluate(() => { [...document.querySelectorAll('.navpill button, #rail button')].find((x) => /Menu/.test(x.textContent || ''))?.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => /Cr[ée]er un compte|Se connecter/i.test(x.textContent || ''))?.click(); });
  await p.waitForSelector('.sheet[data-sheet="auth"]', { timeout: 8000 });
  await p.waitForTimeout(300);

  if (mode === 'signup') {
    await p.fill('#v13-auth-firstname', 'Probe');
    await p.fill('#v13-auth-email', email);
    await p.fill('#v13-auth-password', 'Probe@2026');
    const cb = await p.$('input[type="checkbox"]'); if (cb) await cb.check();
  } else {
    // The menu opens the sheet in signup mode; switch to the sign-in tab.
    await p.evaluate(() => { [...document.querySelectorAll('button.btn.ghost.sm')].find((x) => /Se connecter/i.test(x.textContent || ''))?.click(); });
    await p.waitForTimeout(300);
    await p.fill('#v13-auth-email', email);
    await p.fill('#v13-auth-password', 'Probe@2026');
  }
  await p.evaluate(() => { [...document.querySelectorAll('button[type="submit"]')][0]?.click(); });
  await p.waitForTimeout(3000);

  const landed = await sheet();
  const otp = await hasOtp();
  await p.close();
  return { landed, otp, hits };
}

const signup = await drive('signup');
ok('signup (get-session=null) atteint l\'app, jamais l\'écran OTP', signup.landed === 'menu' && !signup.otp, JSON.stringify(signup));
ok('signup n\'a PAS besoin d\'un 2e get-session (l\'utilisateur renvoyé est adopté)', signup.hits.getSession <= 1, `getSession=${signup.hits.getSession}`);

const signin = await drive('signin');
ok('signin (get-session=null) atteint l\'app, jamais l\'écran OTP', signin.landed === 'menu' && !signin.otp, JSON.stringify(signin));

ok('0 pageerror pendant le parcours', pageErrors.length === 0, pageErrors.join(' | '));

await b.close();

const pass = results.every((r) => r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `  :: ${r.detail}`}`);
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} PASS  (target ${target})`);
process.exit(pass ? 0 : 1);
