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
      menuPanel: box('.menu-panel'),
      accountPanel: box('.account-panel'),
      intermediateControls: box('.intermediate-phone .controls'),
      intermediateTopbar: box('.intermediate-phone .top'),
      menuCount: document.querySelectorAll('.menu-panel').length,
      accountCount: document.querySelectorAll('.account-panel').length,
      source: Boolean(document.querySelector('.reference-panel img')),
      sections: [...document.querySelectorAll('.section-label')].map((node) => node.textContent.trim()),
    };
  });
  const checks = {
    resultDockSheet: !intersects(state.resultDock, state.resultSheet),
    focusedDockOptions: !intersects(state.focusedDock, state.focusedOptions),
    optionsControls: !intersects(state.focusedOptions, state.controls),
    optionsTopbar: !intersects(state.focusedOptions, state.topbar),
    menuTopbar: !intersects(state.menuPanel, state.intermediateTopbar),
    menuControls: !intersects(state.menuPanel, state.intermediateControls),
    accountTopbar: !intersects(state.accountPanel, state.intermediateTopbar),
    accountControls: !intersects(state.accountPanel, state.intermediateControls),
    intermediateSurfaces: state.menuCount >= 2 && state.accountCount >= 2,
    sourceVisible: state.source,
    allSectionsVisible: state.sections.length >= 3,
  };
  Object.entries(checks).forEach(([name, passed]) => { if (!passed && name !== 'sourceVisible' && name !== 'allSectionsVisible') failures.push(`${width}:${name}`); });
  if (!checks.sourceVisible) failures.push(`${width}:sourceVisible`);
  if (!checks.allSectionsVisible) failures.push(`${width}:allSectionsVisible`);

  console.log(JSON.stringify({ width, state, checks }));
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(`FAILED ${failures.join(', ')}`);
  process.exit(1);
}
console.log('Species maquette geometry proof passed');
