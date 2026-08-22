import { chromium } from 'playwright';

const base = process.env.TRUNK_BASE_URL ?? 'https://omni.sparkafrika.online';
const widths = [320, 768];
const browser = await chromium.launch({ headless: true });
const results = [];

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`page:${error.message}`));
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => /public places in view|No public places in this view|Updating the live map/i.test(document.querySelector('.dock-context')?.textContent ?? ''), undefined, { timeout: 90000 });
  const permissionBefore = await page.evaluate(async () => {
    try { return (await navigator.permissions.query({ name: 'geolocation' })).state; } catch { return 'unsupported'; }
  });
  const zoomBefore = Number(await page.locator('.map-stage').getAttribute('data-zoom'));
  const mapControls = await page.locator('.map-controls').count();
  const locationButton = await page.getByRole('button', { name: 'Locate me' }).count();
  const locationPrompt = await page.getByRole('group', { name: 'Location permission' }).count();
  const locationAction = await page.getByRole('button', { name: 'Use my location' }).count();
  const cards = await page.locator('.facility-teaser').count();
  const geometry = await page.evaluate(() => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const overlaps = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    const rail = rect('.result-rail');
    const controls = rect('.map-controls');
    const dock = rect('.dock');
    const location = rect('.location-prompt');
    const cards = [...document.querySelectorAll('.facility-teaser')].map((node) => {
      const r = node.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    });
    return { rail, controls, dock, location, cards, railControlsOverlap: overlaps(rail, controls), railDockOverlap: overlaps(rail, dock), locationRailOverlap: overlaps(location, rail), locationControlsOverlap: overlaps(location, controls), locationDockOverlap: overlaps(location, dock), bodyWidth: document.body.scrollWidth, viewportWidth: window.innerWidth };
  });
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.waitForFunction((before) => Number(document.querySelector('.map-stage')?.getAttribute('data-zoom')) > before, zoomBefore, { timeout: 5000 }).catch(() => undefined);
  const zoomAfterButton = Number(await page.locator('.map-stage').getAttribute('data-zoom'));
  await page.getByRole('button', { name: 'Locate me' }).click();
  await page.waitForTimeout(500);
  const permissionAfter = await page.evaluate(async () => {
    try { return (await navigator.permissions.query({ name: 'geolocation' })).state; } catch { return 'unsupported'; }
  });
  results.push({ width, permissionBefore, permissionAfter, mapControls, locationButton, locationPrompt, locationAction, cards, zoomBefore, zoomAfterButton, geometry, errors });
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
