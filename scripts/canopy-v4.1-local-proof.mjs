import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.env.CANOPY_URL ?? 'http://localhost:4174/';
const outputDir = process.env.CANOPY_OUTPUT ?? '/home/ubuntu/lome-local-connect-git/canopy-v4-1-proof';
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  geolocation: { longitude: 1.22, latitude: 6.13, accuracy: 25 },
  permissions: ['geolocation'],
  reducedMotion: 'no-preference',
});
const page = await context.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.locator('.maplibregl-canvas').waitFor({ state: 'visible', timeout: 15000 });
await page.waitForTimeout(12000);

const readFrame = async () => page.evaluate(() => {
  const stage = document.querySelector('.map-stage');
  const input = document.querySelector('.search-anchor input');
  const buttons = [...document.querySelectorAll('.map-controls button')];
  const canvas = document.querySelector('.maplibregl-canvas');
  return {
    stage: stage ? Object.fromEntries([...stage.attributes].filter((attribute) => attribute.name.startsWith('data-')).map((attribute) => [attribute.name, attribute.value])) : null,
    controls: buttons.map((button) => ({ label: button.getAttribute('aria-label'), display: getComputedStyle(button).display, disabled: button.disabled })),
    inputFontSize: input ? getComputedStyle(input).fontSize : null,
    canvas: canvas ? { width: Math.round(canvas.getBoundingClientRect().width), height: Math.round(canvas.getBoundingClientRect().height) } : null,
    visibleHtmlPins: [...document.querySelectorAll('.map-pin')].filter((node) => getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().width > 0).length,
    visibleLocationPrompt: [...document.querySelectorAll('.location-prompt')].some((node) => getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().width > 0),
    screenReaderLocation: Boolean(document.querySelector('.location-status-sr')),
    visualViewportScale: window.visualViewport?.scale ?? 1,
  };
});

const clickControl = async (selector) => {
  await page.evaluate((controlSelector) => document.querySelector(controlSelector)?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })), selector);
};

const initial = await readFrame();
await page.waitForTimeout(1500);
const afterIdle = await readFrame();
await page.locator('.search-anchor input').click();
await page.waitForTimeout(1500);
const afterNonMapFocus = await readFrame();
let afterOptions = null;
const optionsButton = page.locator('.pill-options');
if (await optionsButton.count()) {
  await optionsButton.dispatchEvent('click');
  await page.waitForTimeout(1200);
  afterOptions = await readFrame();
  await optionsButton.dispatchEvent('click');
  await page.waitForTimeout(300);
}
let afterAccount = null;
const accountButton = page.locator('.account-orb');
if (await accountButton.count()) {
  await accountButton.dispatchEvent('click');
  await page.waitForTimeout(1200);
  afterAccount = await readFrame();
  await accountButton.dispatchEvent('click');
  await page.waitForTimeout(300);
}

await clickControl('.zoom-in-control');
await page.waitForTimeout(650);
const afterZoomOne = await readFrame();
await clickControl('.zoom-in-control');
await page.waitForTimeout(850);
const afterMercator = await readFrame();
await clickControl('.zoom-out-control');
await page.waitForTimeout(650);
const afterReverseOne = await readFrame();
await clickControl('.zoom-out-control');
await page.waitForTimeout(850);
const afterReverseGlobe = await readFrame();

const canvasBox = await page.locator('.maplibregl-canvas').boundingBox();
let touchProof = null;
if (canvasBox) {
  touchProof = await page.evaluate(({ x, y, width, height }) => {
    const canvas = document.querySelector('.maplibregl-canvas');
    if (!canvas) return null;
    const touch = (x, y, identifier = 7) => new Touch({ identifier, target: canvas, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y });
    const startX = x + width / 2;
    const startY = y + height / 2;
    canvas.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [touch(startX, startY)], targetTouches: [touch(startX, startY)], changedTouches: [touch(startX, startY)] }));
    window.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [touch(startX + 44, startY - 18)], targetTouches: [touch(startX + 44, startY - 18)], changedTouches: [touch(startX + 44, startY - 18)] }));
    window.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [touch(startX + 44, startY - 18)] }));
    return true;
  }, canvasBox);
  await page.waitForTimeout(300);
}
const afterTouch = await readFrame();
await page.screenshot({ path: `${outputDir}/canopy-v4-1-mobile-monochrome.png`, fullPage: false });

const report = {
  url,
  viewport: { width: 390, height: 844 },
  syntheticLocation: 'permission granted in isolated context; coordinates not persisted',
  initial,
  afterIdle,
  afterNonMapFocus,
  afterOptions,
  afterAccount,
  afterZoomOne,
  afterMercator,
  afterReverseOne,
  afterReverseGlobe,
  touchProof,
  afterTouch,
  assertions: {
    canvasMounted: Boolean(initial.canvas && initial.canvas.width > 0 && initial.canvas.height > 0),
    threeControlsVisible: initial.controls.length === 3 && initial.controls.every((control) => control.display !== 'none' && !control.disabled),
    mobileInputSixteenPx: initial.inputFontSize === '16px',
    visualViewportAtDefaultScale: initial.visualViewportScale === 1,
    noVisibleApproximateBand: initial.visibleLocationPrompt === false,
    screenReaderLocationPreserved: initial.screenReaderLocation,
    noVisibleHtmlPins: initial.visibleHtmlPins === 0,
    idleContinues: initial.stage?.['data-center-lng'] !== afterIdle.stage?.['data-center-lng'],
    nonMapFocusDoesNotPause: afterIdle.stage?.['data-center-lng'] !== afterNonMapFocus.stage?.['data-center-lng'],
    optionsDoesNotPause: !afterOptions || afterNonMapFocus.stage?.['data-center-lng'] !== afterOptions.stage?.['data-center-lng'],
    accountDoesNotPause: !afterAccount || (afterOptions ?? afterNonMapFocus).stage?.['data-center-lng'] !== afterAccount.stage?.['data-center-lng'],
    projectionForward: afterZoomOne.stage?.['data-projection'] === 'globe' && afterMercator.stage?.['data-projection'] === 'mercator',
    projectionReverse: afterReverseOne.stage?.['data-projection'] === 'globe' && afterReverseGlobe.stage?.['data-projection'] === 'globe',
    touchDispatched: touchProof === true,
    touchChangesCamera: touchProof === true && afterTouch.stage?.['data-center-lng'] !== afterReverseGlobe.stage?.['data-center-lng'],
    touchKeepsVerticalAxis: touchProof === true && afterTouch.stage?.['data-bearing'] === afterReverseGlobe.stage?.['data-bearing'],
  },
};
await fs.writeFile(`${outputDir}/canopy-v4-1-mobile-monochrome.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
