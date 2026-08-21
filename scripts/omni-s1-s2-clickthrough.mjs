import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const results = [];
const baseUrl = process.env.OMNI_BASE_URL ?? 'https://omni.sparkafrika.online';
for (const viewport of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 768, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'narrow', width: 320, height: 720 },
]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const url = `${baseUrl}/?pw=flow-${viewport.name}-${Date.now()}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.locator('.v2-map-canvas canvas').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `docs/visual-audit/${viewport.name}-initial.png` });
  await page.locator('#v2-search').fill('Marché');
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await page.locator('.v2-result-card').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.screenshot({ path: `docs/visual-audit/${viewport.name}-results.png` });
  const resultName = await page.locator('.v2-result-card').first().locator('strong').textContent();
  await page.locator('.v2-result-card').first().click();
  await page.getByRole('button', { name: /Voir le catalogue public/ }).click();
  await page.locator('.v2-product-card').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.screenshot({ path: `docs/visual-audit/${viewport.name}-catalogue.png` });
  const productName = await page.locator('.v2-product-card').first().locator('strong').textContent();
  await page.locator('.v2-product-card').first().click();
  await page.getByRole('status').filter({ hasText: 'Produit sélectionné' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.screenshot({ path: `docs/visual-audit/${viewport.name}-selected.png` });
  results.push({ viewport, resultName, productName, canvasCount: await page.locator('.v2-map-canvas canvas').count(), horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth) });
  await page.close();
}
console.log(JSON.stringify(results, null, 2));
await browser.close();
