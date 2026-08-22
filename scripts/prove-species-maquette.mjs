import { chromium } from 'playwright';
import { resolve } from 'node:path';

const browser = await chromium.launch({ headless: true });
const widths = [320, 375, 768, 1280];
const target = `file://${resolve('docs/maquette/omni-species-maquette.html')}`;
const failures = [];

function intersects(a, b) {
  return Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
}

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(target, { waitUntil: 'load' });
  const state = await page.evaluate(() => {
    const box = (selector) => {
      const node = document.querySelector(selector);
      const rect = node?.getBoundingClientRect();
      return rect ? { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } : null;
    };
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      resultDock: box('.separated-phone .search'),
      resultSheet: box('.separated-phone .sheet'),
      focusedDock: box('.expanded.separated-phone .search'),
      focusedOptions: box('.expanded.separated-phone .options'),
      controls: box('.expanded.separated-phone .controls'),
      topbar: box('.expanded.separated-phone .top'),
      source: Boolean(document.querySelector('.reference-panel img')),
      sections: [...document.querySelectorAll('.section-label')].map((node) => node.textContent.trim()),
    };
  });
  const checks = {
    resultDockSheet: !intersects(state.resultDock, state.resultSheet),
    focusedDockOptions: !intersects(state.focusedDock, state.focusedOptions),
    optionsControls: !intersects(state.focusedOptions, state.controls),
    optionsTopbar: !intersects(state.focusedOptions, state.topbar),
    sourceVisible: state.source,
    allSectionsVisible: state.sections.length >= 2,
  };
  Object.entries(checks).forEach(([name, passed]) => { if (!passed && name !== 'sourceVisible' && name !== 'allSectionsVisible') failures.push(`${width}:${name}`); });
  if (!state.source) failures.push(`${width}:sourceVisible`);
  if (!state.sections || state.sections.length < 2) failures.push(`${width}:allSectionsVisible`);
  console.log(JSON.stringify({ width, state, checks }));
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(`FAILED ${failures.join(', ')}`);
  process.exit(1);
}
console.log('Species maquette geometry proof passed');
