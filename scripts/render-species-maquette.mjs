import { chromium } from 'playwright';
import { resolve } from 'node:path';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
const htmlPath = resolve('docs/maquette/omni-species-maquette.html');
await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
await page.screenshot({ path: 'docs/maquette/omni-species-maquette.png', fullPage: true });
await browser.close();
console.log('Rendered docs/maquette/omni-species-maquette.png');
