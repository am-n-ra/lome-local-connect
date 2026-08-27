import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const width = Number(process.env.VIEWPORT_WIDTH ?? 390);
const height = Number(process.env.VIEWPORT_HEIGHT ?? (width <= 768 ? 844 : 900));
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width <= 768 });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(error.message));
const startedAt = Date.now();
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
const domContentLoadedMs = Date.now() - startedAt;
await page.waitForTimeout(1200);
const metrics = await page.evaluate(() => {
  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  return {
    domContentLoaded: navigation?.domContentLoadedEventEnd ?? null,
    responseEnd: navigation?.responseEnd ?? null,
    firstPaint: paint.find((entry) => entry.name === 'first-paint')?.startTime ?? null,
    firstContentfulPaint: paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? null,
    title: document.title,
    rootTextLength: document.querySelector('#root')?.textContent?.length ?? 0,
    mapFallbackVisible: Boolean(document.querySelector('.omni-map-loading')),
    mapCanvasVisible: Boolean(document.querySelector('.maplibregl-canvas')),
  };
});
console.log(JSON.stringify({ viewport: `${width}x${height}`, domContentLoadedMs, metrics, consoleErrors }, null, 2));
await browser.close();
