import { chromium } from 'playwright';

// DOCK-05 browser proof — the contextual `Retour` dock item.
//
// The account family (Compte/Wallet/Plans/Recherches sauvegardées) needs a session,
// absent in the DB-less sandbox. What IS measurable without a session: the Retour
// appears on a destination sheet (facility) and navigates back to results. The
// account-family widening is proven by the falsified source guard
// (check-dock-search.mjs `dock-05-back`), same class as DS-3/DS-6 role proofs.
//
// `STUB_FIXTURE=1` intercepts ONLY /api/v2/public/facilities with the canonical shape.
const BASE = process.env.APP_URL || 'http://localhost:4181';
const STUB = process.env.STUB_FIXTURE === '1';
const FIXTURE = {
  ok: true,
  data: [
    { id: 'f-near', name: 'Épicerie proche', category: 'Épicerie', address: null, latitude: 6.131, longitude: 1.221, trust: 'confirmed', plan: 'free', productCount: 2, minPriceMinor: 126000, priceCurrency: 'XOF', maxDiscountPercent: 30 },
    { id: 'f-mid', name: 'Boulangerie du Marché', category: 'Boulangerie', address: null, latitude: 6.16, longitude: 1.25, trust: 'confirmed', plan: 'free', productCount: 3, minPriceMinor: 25500, priceCurrency: 'XOF', maxDiscountPercent: 25 },
  ],
};

const browser = await chromium.launch({ headless: true });
let failures = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures += 1;
};

for (const width of [390, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  if (STUB) await page.route('**/api/v2/public/facilities**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FIXTURE) }));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.navpill button', { timeout: 15000 });
  await page.waitForTimeout(400);

  const labels = () => page.$$eval('.navpill button .sr-only', (n) => n.map((x) => x.textContent));
  const sheet = () => page.evaluate(() => document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'));

  // Resting state: the buyer map dock carries NO Retour (it would point nowhere).
  check(!(await labels()).includes('Retour'), `${width}px resting dock has no Retour`);

  // Search -> results.
  await page.evaluate(() => { const b = [...document.querySelectorAll('.navpill button')].find((x) => /Recherche/.test(x.querySelector('.sr-only')?.textContent || '')); b?.click(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { const i = document.querySelector('.searchdock input'); i && i.focus(); });
  await page.keyboard.type('boulangerie');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#hgrid .hcard', { timeout: 20000 }).catch(() => undefined);

  // Open a facility (destination) -> the dock must offer Retour.
  const cardClicked = await page.evaluate(() => {
    const c = document.querySelector('#hgrid .hcard');
    c?.click(); return !!c;
  });
  await page.waitForTimeout(1000);
  const facilitySheet = await sheet();
  const facilityLabels = await labels();
  check(cardClicked && facilitySheet === 'facility', `${width}px a facility opens`, facilitySheet || 'none');
  check(facilityLabels.includes('Retour'), `${width}px facility dock offers Retour`, facilityLabels.join('/'));

  // Retour navigates back to results (history), not to the bare map.
  const backClicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.navpill button')].find((x) => /^Retour$/.test(x.querySelector('.sr-only')?.textContent || ''));
    b?.click(); return !!b;
  });
  await page.waitForTimeout(800);
  const afterBack = await sheet();
  check(backClicked && afterBack === 'results', `${width}px Retour returns to results`, afterBack || 'none');

  await page.close();
}

await browser.close();
console.log(failures === 0 ? '\nDOCK-05 PROOF: PASS' : `\nDOCK-05 PROOF: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
