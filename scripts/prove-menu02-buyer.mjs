import { chromium } from 'playwright';

// MENU-02 (+ DOCK-05 account family) browser proof.
//
// The buyer menu only renders with a session. Real Neon sign-in is unavailable to
// this harness, so — exactly like the DS-3 proof stubs /api/v2/public/facilities —
// we stub ONLY the Neon Auth session endpoint `…/auth/get-session` with a minimal
// buyer session. The app, the menu render and the dock are the real ones.
const BASE = process.env.APP_URL || 'http://localhost:4181';
const MAQUETTE = ['Accueil', 'Mes demandes', 'Historique des transactions', 'Favoris', 'Recherches sauvegardées', 'Notifications', 'Portefeuille & Plans', 'Mon compte'];
const GONE = ['Mon espace', 'Reprendre où j\u2019en étais', 'Recherches enregistrées'];

const browser = await chromium.launch({ headless: true });
let failures = 0;
const check = (ok, label, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`); if (!ok) failures += 1; };

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
await page.route('**/auth/get-session', (route) => route.fulfill({
  status: 200,
  contentType: 'application/json',
  headers: {
    'access-control-allow-origin': BASE,
    'access-control-allow-credentials': 'true',
  },
  body: JSON.stringify({ user: { id: 'proof-buyer', email: 'demo@buyer.omni', name: 'Demo Buyer' }, session: { user: { id: 'proof-buyer' } } }),
}));
await page.route('**/auth/token', (route) => route.fulfill({
  status: 200,
  contentType: 'application/json',
  headers: { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true' },
  body: JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiJ9.proof.sig' }),
}));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.navpill button', { timeout: 15000 });
await page.waitForTimeout(1500);

await page.evaluate(() => { const b = [...document.querySelectorAll('.navpill button')].find((x) => /Menu/.test(x.querySelector('.sr-only')?.textContent || '')); b?.click(); });
await page.waitForTimeout(500);

const menuNames = await page.evaluate(() => [...document.querySelectorAll('[data-sheet="menu"] .menuitem b')].map((b) => b.textContent.trim()));
console.log('  menu:', JSON.stringify(menuNames));
check(menuNames.length >= 8, 'the buyer menu shows at least the 8 entries', String(menuNames.length));
for (const n of MAQUETTE) check(menuNames.includes(n), `menu carries « ${n} »`);
for (const g of GONE) check(!menuNames.includes(g), `menu no longer shows « ${g} »`);

// DOCK-05 account family: open "Mon compte" -> Retour present -> returns to menu.
const openedAccount = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-sheet="menu"] .menuitem')].find((x) => /Mon compte/.test(x.textContent || '')); b?.click(); return !!b; });
await page.waitForTimeout(800);
const stageAfterAccount = await page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
const accountDock = await page.$$eval('.navpill button .sr-only', (n) => n.map((x) => x.textContent));
check(openedAccount && stageAfterAccount === 'account', 'Mon compte opens the account sheet', stageAfterAccount || 'none');
check(accountDock.includes('Retour'), 'the account sheet dock offers Retour (DOCK-05)', accountDock.join('/'));
const backClicked = await page.evaluate(() => { const b = [...document.querySelectorAll('.navpill button')].find((x) => /^Retour$/.test(x.querySelector('.sr-only')?.textContent || '')); b?.click(); return !!b; });
await page.waitForTimeout(700);
const afterBack = await page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
check(backClicked && afterBack === 'menu', 'Retour returns to the menu', afterBack || 'none');

check(errs.length === 0, 'no page error during the flow', errs.slice(0, 3).join(' | '));

await browser.close();
console.log(failures === 0 ? '\nMENU-02 PROOF: PASS' : `\nMENU-02 PROOF: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
