import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = process.env.TRUNK_BASE_URL ?? 'http://127.0.0.1:4180';
const widths = [320, 375, 768, 1280];
const browser = await chromium.launch({ headless: true });
await mkdir('/tmp/omni-v2-proof', { recursive: true });
const results = [];

const rectangle = (node) => {
  if (!node) return null;
  const rect = node.getBoundingClientRect();
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
};

const overlap = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);

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
  const searchInput = await page.getByLabel('Search nearby products and services').count();
  const dock = await page.locator('.search-dock').count();
  const hamburger = await page.getByRole('button', { name: 'Open Omni menu' }).count();
  const mapControls = await page.locator('.map-controls').count();
  const mapStatus = await page.locator('.map-status').innerText();
  const caption = await page.locator('.map-caption').innerText();
  const facilityLabels = await page.getByText(/Cotonou Fresh Hub|Mènontin Home Bakery|Zongo Mobile Market/).count();
  const canvasCount = await page.locator('.map-canvas canvas').count();

  const measure = async () => page.evaluate(() => {
    const selectors = ['.result-rail', '.dock-wrap', '.dock', '.search-dock', '.dock-status', '.map-attribution', '.maplibregl-ctrl-attrib', '.map-status', '.map-controls', '.map-caption', '.topbar', '.options-popover', '.menu-popover'];
    const rects = Object.fromEntries(selectors.map((selector) => [selector, (() => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    })()]));
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
        optionsDock: overlap(rects['.options-popover'], rects['.dock']),
        optionsControls: overlap(rects['.options-popover'], rects['.map-controls']),
        menuDock: overlap(rects['.menu-popover'], rects['.dock']),
        menuControls: overlap(rects['.menu-popover'], rects['.map-controls']),
      },
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
  const baseGeometry = await measure();
  if (Object.values(baseGeometry.overlaps).some(Boolean)) throw new Error(`Base overlay collision at ${width}px: ${JSON.stringify(baseGeometry.overlaps)}`);
  const searchInputNode = page.getByLabel('Search nearby products and services');
  await searchInputNode.focus();
  if (await page.evaluate(() => document.activeElement?.getAttribute('aria-label')) !== 'Search nearby products and services') throw new Error(`Search focus was not retained at ${width}px`);

  const optionsButton = page.getByRole('button', { name: 'Open search options' });
  const optionsButtonCount = await optionsButton.count();
  let options = 0;
  let optionsCategory = 0;
  let optionsQuantity = 0;
  let optionsGeometry = null;
  let optionsAfterEscape = 0;
  let optionsAuth = 0;
  if (optionsButtonCount) {
    await optionsButton.focus();
    await page.keyboard.press('Enter');
    options = await page.getByRole('region', { name: 'Search options' }).count();
    optionsCategory = await page.locator('.options-popover select').count();
    optionsQuantity = await page.getByLabel('Request quantity').count();
    optionsGeometry = await measure();
    if (Object.values(optionsGeometry.overlaps).some(Boolean)) throw new Error(`Options overlay collision at ${width}px: ${JSON.stringify(optionsGeometry.overlaps)}`);
    await page.keyboard.press('Escape');
    optionsAfterEscape = await page.getByRole('region', { name: 'Search options' }).count();
    if (optionsAfterEscape !== 0) throw new Error(`Options Escape ownership failed at ${width}px`);
    await optionsButton.click();
    await page.getByRole('button', { name: 'Apply options' }).click();
    optionsAuth = await page.getByRole('dialog', { name: /Search with certainty|Start seeing before you move/ }).count();
    await page.getByRole('button', { name: 'Close' }).click();
  }

  let menu = 0;
  let menuActions = 0;
  const menuButton = page.getByRole('button', { name: 'Open Omni menu' });
  let menuAfterEscape = 0;
  if (await menuButton.count()) {
    await menuButton.focus();
    await page.keyboard.press('Enter');
    menu = await page.getByRole('menu', { name: 'Omni menu' }).count();
    menuActions = await page.getByRole('menuitem').count();
    const menuGeometry = await measure();
    if (Object.values(menuGeometry.overlaps).some(Boolean)) throw new Error(`Menu overlay collision at ${width}px: ${JSON.stringify(menuGeometry.overlaps)}`);
    await page.keyboard.press('Escape');
    menuAfterEscape = await page.getByRole('menu', { name: 'Omni menu' }).count();
    if (menuAfterEscape !== 0) throw new Error(`Menu Escape ownership failed at ${width}px`);
  }

  await page.getByRole('button', { name: 'Search', exact: true }).click();
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
  results.push({ width, initial, searchInput, dock, hamburger, mapControls, auth, options, optionsCategory, optionsQuantity, optionsAfterEscape, optionsAuth, menu, menuActions, menuAfterEscape, facilityCardCount, detail, catalogue, availabilityAuth, mapStatus, caption, facilityLabels, canvasCount, bodyWidth: baseGeometry.bodyWidth, viewportWidth: baseGeometry.viewportWidth, overlaps: baseGeometry.overlaps, optionsOverlaps: optionsGeometry?.overlaps ?? null, apiResponses, errors });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
