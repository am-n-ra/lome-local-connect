import { chromium } from 'playwright';

// DOCK-DUP proof (2026-10-07, spot-check occlusion X5). The dock `.navpill` used to
// leak identical sibling nodes — 1 at boot, 2 after a sheet, 3 after a role change —
// because the container carried a role-dependent key. A stable dock must stay at
// exactly ONE node across every interaction, with no duplicated a11y labels.
//
// Usage: URL=http://localhost:4199 node scripts/probe-dock-dup.mjs   (or prod URL)
// Exit code 1 if any step sees != 1 dock node.

const URL = process.env.URL || 'http://localhost:4199';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(5000);

const count = () => page.evaluate(() => document.querySelectorAll('.omni-v13-stage .navpill').length);
const labels = () => page.evaluate(() => Array.from(document.querySelectorAll('.navpill .sr-only')).map((s) => s.textContent));
const clickDock = (name) => page.evaluate((n) => {
  const b = [...document.querySelectorAll('.navpill button')].find((x) => new RegExp(n).test(x.querySelector('.sr-only')?.textContent || ''));
  b?.click();
}, name);
const clickRole = (name) => page.evaluate((n) => {
  const b = [...document.querySelectorAll('.rolepill button')].find((x) => new RegExp(n).test(x.textContent || ''));
  b?.click();
}, name);

const results = [];
const check = async (step) => { const n = await count(); results.push({ step, docks: n, labels: (await labels()).length }); return n; };

await check('boot');
await clickDock('Recherche'); await page.waitForTimeout(1200); await check('search');
await page.evaluate(() => { const i = document.querySelector('.searchdock input'); i && i.focus(); });
await page.keyboard.type('jus', { delay: 25 }); await page.keyboard.press('Enter');
await page.waitForTimeout(4000); await check('results');
await page.evaluate(() => document.querySelector('#hgrid button')?.click()); await page.waitForTimeout(2000); await check('facility');
await page.evaluate(() => document.querySelector('.sheet-close')?.click()); await page.waitForTimeout(800);
await clickDock('Menu'); await page.waitForTimeout(1200); await check('menu');
await clickRole('Vendeur'); await page.waitForTimeout(1200); await check('role-seller');
await clickRole('Acheteur'); await page.waitForTimeout(1200); await check('role-buyer');
await browser.close();

const bad = results.filter((r) => r.docks !== 1);
console.log('DOCK-DUP', JSON.stringify(results));
if (bad.length) { console.error(`DOCK-DUP FAIL: ${bad.map((b) => `${b.step}=${b.docks}`).join(' ')}`); process.exit(1); }
console.log('DOCK-DUP PASS: 1 dock node at every step');
