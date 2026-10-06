import { chromium } from 'playwright';

// SEARCH-03 proof — the search header offers a "Recherches sauvegardées" link (maquette L466).
// On mobile the search sheet shows its header (the desktop bar hides it), so we open
// the search sheet at a phone width and assert the link is present, then that it opens
// the saved sheet. Session is stubbed at the auth boundary (same class as DS-3/DS-8).
const BASE = process.env.APP_URL || 'http://localhost:4181';
const browser = await chromium.launch({ headless: true });
let failures = 0;
const check = (ok, label, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`); if (!ok) failures += 1; };

const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
await page.route('**/auth/get-session', (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  headers: { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true' },
  body: JSON.stringify({ user: { id: 'proof-buyer', email: 'demo@buyer.omni', name: 'Demo Buyer' }, session: { user: { id: 'proof-buyer' } } }),
}));
await page.route('**/auth/token', (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  headers: { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true' },
  body: JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiJ9.proof.sig' }),
}));
await page.route('**/api/v2/saved-searches', (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  headers: { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true' },
  body: JSON.stringify({ searches: [] }),
}));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.navpill button', { timeout: 15000 });
await page.waitForTimeout(1200);

// Open the search sheet from the dock.
await page.evaluate(() => { const b = [...document.querySelectorAll('.navpill button')].find((x) => /Recherche/.test(x.querySelector('.sr-only')?.textContent || '')); b?.click(); });
await page.waitForTimeout(600);

const stage = await page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
check(stage === 'search', 'the search sheet is open', stage || 'none');

const link = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-sheet="search"] button')].find((x) => /Recherches sauvegardées/.test(x.textContent || '')); return b ? { text: b.textContent.trim(), visible: b.offsetParent !== null } : null; });
console.log('  link:', JSON.stringify(link));
check(!!link && link.visible, 'the search header shows a visible « Recherches sauvegardées » link', link ? link.text : 'absent');

const opened = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-sheet="search"] button')].find((x) => /Recherches sauvegardées/.test(x.textContent || '')); b?.click(); return !!b; });
await page.waitForTimeout(900);
const after = await page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));
check(opened && after === 'saved', 'the link opens the saved-searches sheet', after || 'none');

check(errs.length === 0, 'no page error during the flow', errs.slice(0, 3).join(' | '));
await browser.close();
console.log(failures === 0 ? '\nSEARCH-03 PROOF: PASS' : `\nSEARCH-03 PROOF: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
