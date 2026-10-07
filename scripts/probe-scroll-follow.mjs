import { chromium } from 'playwright';

function mercY(lat, zoom) {
  const worldSize = 512 * Math.pow(2, zoom);
  const y = 0.5 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / (2 * Math.PI);
  return worldSize * y;
}

async function run(url, label) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('.navpill button')].find((x) => /Recherche/.test((x.getAttribute('title') || '') + (x.querySelector('.sr-only')?.textContent || ''))); b?.click(); });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const i = document.querySelector('.searchdock input'); i && i.focus(); });
  await page.keyboard.type(process.env.Q || 'hotel', { delay: 20 });
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(9000);

  // Scroll the results grid to follow the first card, then measure pin visibility.
  const before = await page.evaluate(() => document.querySelector('.map-stage')?.getAttribute('data-center-lat'));
  const scrollInfo = await page.evaluate(() => {
    const g = document.getElementById('hgrid');
    if (!g) return null;
    const t0 = g.scrollTop;
    g.scrollTop = g.scrollHeight;
    // also emit a scroll event for React
    g.dispatchEvent(new Event('scroll', { bubbles: true }));
    return { scrollHeight: g.scrollHeight, clientHeight: g.clientHeight, topBefore: t0, topAfter: g.scrollTop };
  });
  await page.waitForTimeout(2500);
  const d = await page.evaluate(() => {
    const m = document.querySelector('.map-stage');
    const g = m?.getAttribute.bind(m);
    const sheet = document.querySelector('.sheet[data-sheet="results"]') || document.querySelector('.sheet[data-sheet="facility"]');
    return { mode: g?.('data-camera-mode'), zoom: Number(g?.('data-zoom')), cLat: Number(g?.('data-center-lat')), cLng: Number(g?.('data-center-lng')), pad: Number(g?.('data-pad-bottom') || 0), cards: document.querySelectorAll('#hgrid [data-fid]').length, sheetTop: sheet ? Math.round(sheet.getBoundingClientRect().top) : null };
  });
  // follow centers the camera ON the followed pin -> the pin sits at the padded center.
  const H = 844;
  const pinScreenY = (H - d.pad) / 2;
  const visible = d.sheetTop == null ? null : pinScreenY < d.sheetTop;
  console.log(label, JSON.stringify({ centerBefore: before, centerAfter: d.cLat, moved: String(before) !== String(d.cLat), mode: d.mode, zoom: d.zoom, pad: d.pad, cards: d.cards, scroll: scrollInfo, pinScreenY: Math.round(pinScreenY), sheetTop: d.sheetTop, pinVisibleAboveSheet: visible, errors: errors.length }));
  await browser.close();
}

await run(process.env.URL || 'https://omni.sparkafrika.online', 'SCROLL-FOLLOW');
