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
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8500);
  await page.getByRole('button', { name: /Atelier Kegue/ }).first().waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined);
  await page.screenshot({ path: `/tmp/omni-v2-proof/trunk-${width}.png`, fullPage: true });
  const initial = await page.locator('text=The world around you').count();
  const search = await page.getByLabel('Search nearby products and services').count();
  const dock = await page.getByRole('navigation', { name: 'Omni actions' }).count();
  const mapStatus = await page.locator('.map-status').innerText();
  const caption = await page.locator('.map-caption').innerText();
  const facilityLabels = await page.getByText(/Atelier Kegue|Pharmacie du Port|Marche de Hanoukope/).count();
  const canvasCount = await page.locator('.map-canvas canvas').count();
  await page.getByRole('button', { name: /Create your account to search/ }).click();
  const auth = await page.getByRole('dialog', { name: /Search with certainty|Start seeing before you move/ }).count();
  await page.getByRole('button', { name: 'Close' }).click();
  const facilityCard = page.getByRole('button', { name: /Atelier Kegue/ }).first();
  const facilityCardCount = await facilityCard.count();
  let detail = 0;
  let catalogue = 0;
  let availabilityAuth = 0;
  if (facilityCardCount) {
    await facilityCard.click();
    await page.getByRole('dialog', { name: /Atelier Kegue/ }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);
    detail = await page.getByRole('dialog', { name: /Atelier Kegue/ }).count();
    catalogue = await page.getByText('Kente tote bag').count();
    const verifyButton = page.getByRole('button', { name: /Verify availability/ });
    if (await verifyButton.count()) {
      await verifyButton.click();
      availabilityAuth = await page.getByRole('dialog', { name: /Search with certainty|Start seeing before you move/ }).count();
      await page.getByRole('button', { name: 'Close' }).click();
    }
  }
  results.push({ width, initial, search, dock, auth, facilityCardCount, detail, catalogue, availabilityAuth, mapStatus, caption, facilityLabels, canvasCount, bodyWidth: await page.locator('body').evaluate((node) => node.scrollWidth), apiResponses, errors });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
