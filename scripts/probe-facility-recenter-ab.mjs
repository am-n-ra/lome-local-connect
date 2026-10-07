import { chromium } from 'playwright';

// Web Mercator: screen Y (px) for a latitude, at a given zoom.
function mercY(lat, zoom) {
  const worldSize = 512 * Math.pow(2, zoom);
  const y = 0.5 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / (2 * Math.PI);
  return worldSize * y;
}

async function run(url, label) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('.navpill button')].find((x) => /Recherche/.test((x.getAttribute('title') || '') + (x.querySelector('.sr-only')?.textContent || ''))); b?.click(); });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const i = document.querySelector('.searchdock input'); i && i.focus(); });
  await page.keyboard.type('boulangerie', { delay: 25 });
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(9000);
  const fid = await page.evaluate(() => document.querySelector('#hgrid [data-fid]')?.getAttribute('data-fid') ?? null);
  if (!fid) { console.log(label, 'NO CARDS'); await browser.close(); return; }
  await page.evaluate((f) => { document.querySelector(`#hgrid [data-fid="${f}"]`)?.click(); }, fid);
  await page.waitForTimeout(2000);
  const d = await page.evaluate(() => {
    const m = document.querySelector('.map-stage');
    const g = m?.getAttribute.bind(m);
    let loc = null;
    for (const kv of document.querySelectorAll('.sheet[data-sheet="facility"] .kv')) { if (/Localisation/.test(kv.textContent || '')) loc = kv.querySelector('b')?.textContent || null; }
    const sheet = document.querySelector('.sheet[data-sheet="facility"]');
    return { mode: g?.('data-camera-mode'), zoom: Number(g?.('data-zoom')), cLat: Number(g?.('data-center-lat')), cLng: Number(g?.('data-center-lng')), pad: Number(g?.('data-pad-bottom') || 0), loc, sheetTop: sheet ? Math.round(sheet.getBoundingClientRect().top) : null };
  });
  const [pinLat, pinLng] = (d.loc || '').split(',').map((x) => Number(x.trim()));
  const H = 844;
  const visH = H - (Number.isFinite(d.pad) ? d.pad : 0);
  const pinScreenY = d.sheetTop == null || !Number.isFinite(pinLat) ? null : visH / 2 + (mercY(d.cLat, d.zoom) - mercY(pinLat, d.zoom));
  const visible = pinScreenY != null && pinScreenY < d.sheetTop && pinScreenY > 0;
  console.log(label, JSON.stringify({ mode: d.mode, zoom: d.zoom, centerLat: d.cLat, pinLat, pad: d.pad, pinScreenY: pinScreenY && Math.round(pinScreenY), sheetTop: d.sheetTop, pinVisibleAboveSheet: visible }));
  await browser.close();
}

await run(process.env.OLD_URL || 'https://omni.sparkafrika.online', 'PROD (old)  ');
await run(process.env.NEW_URL || 'http://localhost:4199', 'FIXED       ');
