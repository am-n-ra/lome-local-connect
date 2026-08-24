import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.env.CANOPY_URL ?? 'https://omni.sparkafrika.online/';
const useReducedMotion = process.env.CANOPY_REDUCED_MOTION === '1';
const outputDir = process.env.CANOPY_OUTPUT ?? '/home/ubuntu/lome-local-connect-git/canopy-proof';
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: useReducedMotion ? 'reduce' : 'no-preference' });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.locator('.maplibregl-canvas').waitFor({ state: 'visible', timeout: 15000 });
await page.waitForTimeout(1000);
await page.mouse.move(195, 810);
await page.waitForTimeout(1800);

const readFrame = async () => page.evaluate(() => {
  const rect = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
  };
  const stage = document.querySelector('.map-stage');
  const dock = rect('.search-anchor');
  const sheet = rect('.nearby-sheet');
  return {
    viewport: { width: innerWidth, height: innerHeight },
    stage: stage ? {
      cameraMode: stage.getAttribute('data-camera-mode'),
      rotation: stage.getAttribute('data-rotation'),
      revealStage: stage.getAttribute('data-reveal-stage'),
      zoom: stage.getAttribute('data-zoom'),
      basemap: stage.getAttribute('data-basemap'),
      location: stage.getAttribute('data-location'),
      centerLng: stage.getAttribute('data-center-lng'),
    } : null,
    canvas: rect('.map-canvas'),
    controls: [...document.querySelectorAll('.map-controls button')].map((button) => ({ label: button.getAttribute('aria-label'), disabled: button.disabled })),
    dock,
    sheet,
    dockSheetSeparated: !sheet || Boolean(dock && dock.bottom <= sheet.top),
    visibleInteractiveCount: document.querySelectorAll('button, input').length,
    bodyOverflow: getComputedStyle(document.body).overflow,
  };
});

const initial = await readFrame();
await page.waitForTimeout(1600);
const afterRotation = await readFrame();
await page.getByRole('button', { name: 'Zoom avant' }).click();
await page.waitForTimeout(700);
const afterZoom = await readFrame();
await page.screenshot({ path: `${outputDir}/canopy-compact-public.png`, fullPage: false });

const report = { url, motionPreference: useReducedMotion ? 'reduce' : 'no-preference', initial, afterRotation, afterZoom, assertions: {
  canvasMounted: Boolean(initial.canvas),
  rotationMoved: useReducedMotion ? initial.stage?.rotation === 'reduced' && afterRotation.stage?.rotation === 'reduced' && initial.stage?.centerLng === afterRotation.stage?.centerLng : afterRotation.stage?.rotation === 'rotating' && initial.stage?.zoom === afterRotation.stage?.zoom && initial.stage?.cameraMode === afterRotation.stage?.cameraMode && initial.stage?.centerLng !== afterRotation.stage?.centerLng,
  controlsEnabled: initial.controls.length > 0 && initial.controls.every((control) => !control.disabled),
  zoomIncreased: Number(afterZoom.stage?.zoom) > Number(afterRotation.stage?.zoom),
  dockSheetSeparated: initial.dockSheetSeparated,
  noHorizontalOverflow: initial.bodyOverflow !== 'visible',
} };
await fs.writeFile(`${outputDir}/canopy-compact-public.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
