import { chromium } from "playwright";

const base = process.env.OMNI_BASE_URL ?? "http://127.0.0.1:4173";
const widths = [320, 375, 768, 1280];
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);
    if (await page.locator(".maplibregl-canvas").count() === 0) {
      console.error(JSON.stringify({ width, errors, body: await page.locator("body").innerText() }, null, 2));
      throw new Error(`MapLibre canvas missing at ${width}px`);
    }
    const canvas = await page.locator(".maplibregl-canvas").boundingBox();
    const geometry = await page.locator(".omni-map").evaluate((element) => { const rect = element.getBoundingClientRect(); const canvas = element.querySelector("canvas")?.getBoundingClientRect(); return { map: { width: rect.width, height: rect.height }, canvas: canvas ? { width: canvas.width, height: canvas.height, display: getComputedStyle(element.querySelector("canvas")).display } : null }; });
    const attribution = await page.locator(".omni-map-attribution").isVisible();
    const input = page.getByLabel("Search facilities or products");
    await input.fill("market");
    await input.press("Enter");
    await page.getByRole("dialog").waitFor({ state: "visible", timeout: 10000 });
    const resultsCount = await page.locator(".omni-result").count();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    results.push({ width, canvas, geometry, attribution, resultsCount, overflow, errors });
    await page.screenshot({ path: `/tmp/omni-v1-${width}.png`, fullPage: true });
    await page.close();
  }
} finally { await browser.close(); }
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => !result.geometry?.canvas || result.geometry.canvas.width < 300 || result.geometry.canvas.height < 300 || !result.attribution || result.resultsCount === 0 || result.overflow || result.errors.length)) process.exit(1);
