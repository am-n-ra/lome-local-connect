import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173/';
const widths = [320, 375, 768, 1280];
const browser = await chromium.launch({ headless: true });
const results = [];
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`page:${error.message}`));
  if (process.env.BOUNDED_FIXTURES === '1') {
    const facilities = [
      { id: '11111111-1111-4111-8111-111111111111', name: "Le Fournil d'Or", category: 'Boulangerie & Pâtisserie', address: 'Cotonou', latitude: 6.37, longitude: 2.43, trust: 'unconfirmed', plan: 'free', productCount: 1 },
      { id: '22222222-2222-4222-8222-222222222222', name: 'Cotonou Fresh Hub', category: 'Fresh produce', address: 'Cotonou', latitude: 6.39, longitude: 2.41, trust: 'unclaimed', plan: 'free', productCount: 0 },
    ];
    await page.route('**/api/v2/public/facilities**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, correlationId: 'species-proof', data: facilities }) }));
    await page.route('**/api/v2/facilities/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, correlationId: 'species-proof', data: { ...facilities[0], products: [{ id: '33333333-3333-4333-8333-333333333333', facilityId: facilities[0].id, name: 'Pain complet', description: 'Four du jour', category: 'Boulangerie', unit: 'pain', priceMinor: 250, currency: 'USD', availableQuantity: null, couponLabel: 'Offre locale' }] } }) }));
  }
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.nearby-sheet', { timeout: 15000 });
  if (process.env.BOUNDED_FIXTURES === '1') await page.waitForSelector('.nearby-card', { timeout: 15000 });
  await page.waitForTimeout(1600);
  const state = await page.evaluate(() => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { x: Number(box.x.toFixed(1)), y: Number(box.y.toFixed(1)), width: Number(box.width.toFixed(1)), height: Number(box.height.toFixed(1)), right: Number(box.right.toFixed(1)), bottom: Number(box.bottom.toFixed(1)) };
    };
    const intersects = (a, b) => a && b && a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
    const map = rect('.map-stage');
    const topbar = rect('.species-topbar');
    const controls = rect('.map-controls');
    const search = rect('.search-pill');
    const sheet = rect('.nearby-sheet');
    const rail = rect('.nearby-rail');
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight, bodyWidth: document.body.getBoundingClientRect().width },
      text: document.querySelector('.nearby-heading h1')?.textContent,
      cardCount: document.querySelectorAll('.nearby-card').length,
      hasRoleSwitch: Boolean(document.querySelector('.role-switch')),
      hasAccountOrb: Boolean(document.querySelector('.account-orb')),
      hasMapCanvas: Boolean(document.querySelector('.maplibregl-canvas')),
      geometry: { map, topbar, controls, search, sheet, rail },
      overlaps: { controlsSheet: intersects(controls, sheet), controlsSearch: intersects(controls, search), searchSheet: intersects(search, sheet), topbarSheet: intersects(topbar, sheet) },
      pageErrors: [],
    };
  });
  state.errors = errors;
  if (process.env.BOUNDED_FIXTURES === '1') await page.screenshot({ path: `/tmp/omni-species-initial-${width}.png`, fullPage: false });
  if (process.env.BOUNDED_FIXTURES === '1') {
    await page.locator('.nearby-card .card-cta').first().click();
    await page.waitForSelector('.facility-sheet', { timeout: 15000 });
    await page.waitForSelector('.catalogue-list', { timeout: 15000 });
  }
  await page.screenshot({ path: `/tmp/omni-species-${width}.png`, fullPage: false });
  results.push(state);
  await page.close();
}
await browser.close();
console.log(JSON.stringify({ base, results }, null, 2));
