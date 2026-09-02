import { chromium } from 'playwright';
import { resolve } from 'node:path';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 520, height: 900 }, deviceScaleFactor: 2 });
const htmlPath = resolve('docs/maquette/omni-admin-operator-maquette.html');
await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
await page.screenshot({ path: 'docs/maquette/omni-admin-operator-maquette.png', fullPage: true });
await browser.close();
console.log('Rendered docs/maquette/omni-admin-operator-maquette.png');
