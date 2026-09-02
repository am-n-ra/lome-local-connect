import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.env.CANOPY_URL ?? 'http://localhost:4174/';
const outputDir = process.env.CANOPY_OUTPUT ?? '/home/ubuntu/lome-local-connect-git/canopy-v4-1-proof';
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1024, height: 880 }, reducedMotion: 'no-preference' });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.locator('.maplibregl-canvas').waitFor({ state: 'visible', timeout: 15000 });
await page.waitForTimeout(12000);

const readFrame = () => page.evaluate(() => {
  const stage = document.querySelector('.map-stage');
  return stage ? {
    projection: stage.getAttribute('data-projection'),
    cameraMode: stage.getAttribute('data-camera-mode'),
    rotation: stage.getAttribute('data-rotation'),
    zoom: stage.getAttribute('data-zoom'),
    centerLng: stage.getAttribute('data-center-lng'),
    bearing: stage.getAttribute('data-bearing'),
    basemap: stage.getAttribute('data-basemap'),
  } : null;
});

const initial = await readFrame();
await page.waitForTimeout(1600);
const afterIdle = await readFrame();
const canvas = await page.locator('.maplibregl-canvas').boundingBox();
if (!canvas) throw new Error('MapLibre canvas was not found');
const centerX = canvas.x + canvas.width / 2;
const centerY = canvas.y + canvas.height / 2;
await page.mouse.move(centerX, centerY);
await page.mouse.down();
await page.mouse.move(centerX + 150, centerY - 24, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(400);
const afterDrag = await readFrame();
const outsideMap = await page.locator('.search-pill input').boundingBox();
if (!outsideMap) throw new Error('Search input was not found for outside-map proof');
await page.mouse.move(outsideMap.x + Math.min(24, outsideMap.width / 2), outsideMap.y + outsideMap.height / 2);
await page.waitForTimeout(3400);
const afterLeavingMap = await readFrame();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outputDir}/canopy-v4-1-desktop-monochrome.png`, fullPage: false });

const report = {
  url,
  viewport: { width: 1024, height: 880 },
  initial,
  afterIdle,
  afterDrag,
  afterLeavingMap,
  assertions: {
    idleMoves: initial?.centerLng !== afterIdle?.centerLng,
    dragChangesCenter: afterDrag?.centerLng !== afterIdle?.centerLng,
    dragPreservesVerticalAxis: afterDrag?.bearing === afterIdle?.bearing,
    releasedCameraRetained: afterLeavingMap?.centerLng !== initial?.centerLng,
    idleResumesOutsideMap: afterLeavingMap?.rotation === 'rotating',
    monochrome: afterLeavingMap?.basemap === 'monochrome',
  },
};
await fs.writeFile(`${outputDir}/canopy-v4-1-desktop-monochrome.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
