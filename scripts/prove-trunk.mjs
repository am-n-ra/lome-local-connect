import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = process.env.TRUNK_BASE_URL ?? 'http://127.0.0.1:4180';
const widths = [320, 375, 768, 1280];
const browser = await chromium.launch({ headless: true });
await mkdir('/tmp/omni-v2-proof', { recursive: true });
const results = [];

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  const apiResponses = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
  page.on('response', (response) => { if (response.url().includes('/api/v2/')) apiResponses.push(`${response.status()} ${response.url().split('/api/v2/')[1]}`); });
  page.on('pageerror', (error) => errors.push(`page:${error.message}`));
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => {
    const text = document.querySelector('.map-caption')?.textContent ?? '';
    return /public places in view|No facilities in this view yet|temporarily unavailable/i.test(text);
  }, undefined, { timeout: 90000 });
  await page.getByRole('button', { name: /Cotonou Fresh Hub/ }).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
  await page.screenshot({ path: `/tmp/omni-v2-proof/trunk-${width}.png`, fullPage: true });
  const initial = await page.locator('text=The world around you').count();
  const search = await page.getByLabel('Search nearby products and services').count();
  const dock = await page.getByRole('navigation', { name: 'Omni actions' }).count();
  const mapStatus = await page.locator('.map-status').innerText();
  const caption = await page.locator('.map-caption').innerText();
  const facilityLabels = await page.getByText(/Cotonou Fresh Hub|Mènontin Home Bakery|Zongo Mobile Market/).count();
  const canvasCount = await page.locator('.map-canvas canvas').count();
  const layout = await page.evaluate(() => {
    const selectors = ['.result-rail', '.dock', '.dock-status', '.map-attribution', '.maplibregl-ctrl-attrib', '.map-status', '.map-controls', '.map-caption', '.search-zone', '.topbar'];
    const rects = Object.fromEntries(selectors.map((selector) => {
      const node = document.querySelector(selector);
      if (!node) return [selector, null];
      const rect = node.getBoundingClientRect();
      return [selector, { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }];
    }));
    const overlap = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    return {
      rects,
      overlaps: {
        railDock: overlap(rects['.result-rail'], rects['.dock']),
        dockStatusAttribution: overlap(rects['.dock-status'], rects['.map-attribution']),
        dockStatusMapStatus: overlap(rects['.dock-status'], rects['.map-status']),
        railAttribution: overlap(rects['.result-rail'], rects['.map-attribution']),
        dockAttribution: overlap(rects['.dock'], rects['.map-attribution']),
        railGeneratedAttribution: overlap(rects['.result-rail'], rects['.maplibregl-ctrl-attrib']),
        dockGeneratedAttribution: overlap(rects['.dock'], rects['.maplibregl-ctrl-attrib']),
      },
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
  if (Object.values(layout.overlaps).some(Boolean)) {
    throw new Error(`Overlay collision at ${width}px: ${JSON.stringify(layout.overlaps)}`);
  }
  await page.getByRole('button', { name: /Create your account to search/ }).click();
  const auth = await page.getByRole('dialog', { name: /Search with certainty|Start seeing before you move/ }).count();
  await page.getByRole('button', { name: 'Close' }).click();
  const facilityCard = page.getByRole('button', { name: /Cotonou Fresh Hub/ }).first();
  const facilityCardCount = await facilityCard.count();
  let detail = 0;
  let catalogue = 0;
  let availabilityAuth = 0;
  if (facilityCardCount) {
    await facilityCard.click();
    await page.getByRole('dialog', { name: /Cotonou Fresh Hub/ }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
    detail = await page.getByRole('dialog', { name: /Cotonou Fresh Hub/ }).count();
    catalogue = await page.getByText('Tomatoes').count();
    const verifyButton = page.getByRole('button', { name: /Verify availability/ });
    if (await verifyButton.count()) {
      await verifyButton.click();
      availabilityAuth = await page.getByRole('dialog', { name: /Search with certainty|Start seeing before you move/ }).count();
      await page.getByRole('button', { name: 'Close' }).click();
    }
  }
  results.push({ width, initial, search, dock, auth, facilityCardCount, detail, catalogue, availabilityAuth, mapStatus, caption, facilityLabels, canvasCount, bodyWidth: layout.bodyWidth, viewportWidth: layout.viewportWidth, overlaps: layout.overlaps, apiResponses, errors });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
