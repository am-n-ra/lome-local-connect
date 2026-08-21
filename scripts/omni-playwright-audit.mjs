import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const failures = [];
const consoleErrors = [];
const pageErrors = [];
page.on('requestfailed', request => failures.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' }));
page.on('pageerror', error => pageErrors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
const targetUrl = process.env.OMNI_AUDIT_URL ?? 'https://omni.sparkafrika.online/?pw=audit';
await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(7000);
const report = await page.evaluate(() => ({
  title: document.title,
  mapCanvas: [...document.querySelectorAll('.v2-map-canvas canvas')].map(canvas => ({ width: canvas.width, height: canvas.height, rect: canvas.getBoundingClientRect().toJSON() })),
  mapWrap: document.querySelector('.v2-map-wrap')?.getBoundingClientRect().toJSON(),
  classes: ['.v2-brand-lockup','.v2-search-dock','.v2-result-sheet','.v2-map-controls'].map(selector => ({ selector, rect: document.querySelector(selector)?.getBoundingClientRect().toJSON() })),
  bodyOverflow: getComputedStyle(document.body).overflow,
}));
await page.screenshot({ path: 'docs/visual-audit/live-1280-script.png', fullPage: false });
console.log(JSON.stringify({ report, failures, consoleErrors, pageErrors }, null, 2));
await browser.close();
