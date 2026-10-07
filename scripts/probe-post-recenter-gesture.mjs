import { chromium } from 'playwright';
// Non-regression: after a programmatic recenter completes, a REAL user gesture must
// still return cameraMode to manual_navigation (the transient guard must have cleared).
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(process.env.URL || 'http://localhost:4199', { waitUntil: 'networkidle' });
await page.waitForTimeout(5500);
await page.evaluate(() => { const b=[...document.querySelectorAll('.navpill button')].find((x)=>/Recherche/.test((x.getAttribute('title')||'')+(x.querySelector('.sr-only')?.textContent||''))); b?.click(); });
await page.waitForTimeout(400);
await page.evaluate(() => { const i=document.querySelector('.searchdock input'); i&&i.focus(); });
await page.keyboard.type('boulangerie',{delay:25});
await page.keyboard.press('Enter');
await page.waitForTimeout(9500);
const fid = await page.evaluate(()=>document.querySelector('#hgrid [data-fid]')?.getAttribute('data-fid')??null);
await page.evaluate((f)=>{document.querySelector(`#hgrid [data-fid="${f}"]`)?.click();},fid);
await page.waitForTimeout(2200);
const afterRecenter = await page.evaluate(()=>document.querySelector('.map-stage')?.getAttribute('data-camera-mode'));
// Real gesture: wheel-zoom on the canvas.
await page.mouse.move(195, 300);
await page.mouse.wheel(0, -240);
await page.waitForTimeout(900);
const afterGesture = await page.evaluate(()=>document.querySelector('.map-stage')?.getAttribute('data-camera-mode'));
console.log(JSON.stringify({ afterRecenter, afterGesture }));
await browser.close();
