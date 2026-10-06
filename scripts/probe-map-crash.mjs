import { chromium } from 'playwright';
const APP = process.env.APP_URL || 'https://omni.sparkafrika.online';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 90)));
page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('C:' + m.text().slice(0, 90)); });
await page.goto(APP, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
const state = await page.evaluate(() => {
  const s = document.querySelector('.map-stage');
  return s ? { status: s.getAttribute('data-map-status'), proj: s.getAttribute('data-projection'), zoom: s.getAttribute('data-zoom'), mode: s.getAttribute('data-camera-mode') } : null;
});
console.log('map state:', JSON.stringify(state), 'errs:', errs.length);

// Zoom out to globe (wheel up), then resize repeatedly during the swap.
await page.mouse.move(640, 400);
for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(80); }
const b1 = errs.length;
// resize churn while camera may be mid-transition
for (const w of [1280, 900, 1100, 700, 1280, 640, 1280]) { await page.setViewportSize({ width: w, height: 800 }); await page.waitForTimeout(120); }
await page.waitForTimeout(1500);
console.log('after globe+resize:', errs.length - b1, 'errors');
errs.slice(b1, b1 + 8).forEach((e) => console.log('  ', e));
const s2 = await page.evaluate(() => { const s = document.querySelector('.map-stage'); return s ? s.getAttribute('data-projection') + '/' + s.getAttribute('data-zoom') : null; });
console.log('post state:', s2);
await browser.close();
