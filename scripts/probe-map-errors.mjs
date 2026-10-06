import { chromium } from 'playwright';

const APP = process.env.APP_URL || 'http://localhost:4181';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
page.on('pageerror', (e) => errs.push({ kind: 'pageerror', msg: String(e.message).slice(0, 120), stack: String(e.stack || '').split('\n').slice(0, 4).join(' | ') }));
page.on('console', (m) => { if (m.type() === 'error') errs.push({ kind: 'console', msg: m.text().slice(0, 120) }); });

await page.goto(APP, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
console.log('--- after load:', errs.length, 'errors');
errs.slice(0, 6).forEach((e) => console.log('  ', e.kind, e.msg));

// open search, type
await page.evaluate(() => { const b = [...document.querySelectorAll('.navpill button')].find((x) => /Recherche/.test(x.getAttribute('title') || x.querySelector('.sr-only')?.textContent || '')); b?.click(); });
await page.waitForTimeout(400);
const before = errs.length;
await page.evaluate(() => { const i = document.querySelector('.searchdock input'); i && i.focus(); });
await page.keyboard.type('boulangerie', { delay: 40 });
await page.waitForTimeout(600);
console.log('--- after typing:', errs.length - before, 'new errors');
errs.slice(before, before + 8).forEach((e) => console.log('  ', e.kind, e.msg, e.stack ? '\n     ' + e.stack : ''));

const b2 = errs.length;
await page.keyboard.press('Enter');
await page.waitForTimeout(7000);
console.log('--- after search/reveal:', errs.length - b2, 'new errors');
errs.slice(b2, b2 + 10).forEach((e) => console.log('  ', e.kind, e.msg, e.stack ? '\n     ' + e.stack : ''));

await browser.close();
