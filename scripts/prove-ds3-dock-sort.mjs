import { chromium } from 'playwright';

// DS-3 browser proof — the dock, the result sort and the search options render on
// the real app, across 4 widths. The buyer path is measurable without a session.
//
// The results sheet needs published supply (absent in the DB-less sandbox). With
// `STUB_FIXTURE=1` we intercept ONLY `/api/v2/public/facilities` with a fixture
// whose shape is the one proven against the canonical DB — the app, the sort
// module and the render are the real ones.
const BASE = process.env.APP_URL || 'http://localhost:4181';
const STUB = process.env.STUB_FIXTURE === '1';
const widths = [390, 768, 1280, 1920];

const FIXTURE = {
  ok: true,
  data: [
    { id: 'f-near', name: 'Épicerie proche', category: 'Épicerie', address: null, latitude: 6.131, longitude: 1.221, trust: 'confirmed', plan: 'free', productCount: 2, minPriceMinor: 126000, priceCurrency: 'XOF', maxDiscountPercent: 30 },
    { id: 'f-mid', name: 'Boulangerie du Marché', category: 'Boulangerie', address: null, latitude: 6.16, longitude: 1.25, trust: 'confirmed', plan: 'free', productCount: 3, minPriceMinor: 25500, priceCurrency: 'XOF', maxDiscountPercent: 25 },
    { id: 'f-far', name: 'Hub éloigné', category: 'Divers', address: null, latitude: 6.3, longitude: 1.4, trust: 'unconfirmed', plan: 'free', productCount: 5, minPriceMinor: 18000, priceCurrency: 'XOF', maxDiscountPercent: 10 },
  ],
};

const browser = await chromium.launch({ headless: true });
let failures = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures += 1;
};

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  if (STUB) {
    await page.route('**/api/v2/public/facilities**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FIXTURE) }));
  }
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.navpill button', { timeout: 15000 });
  await page.waitForTimeout(400);

  const dock = await page.$$eval('.navpill button', (bs) => bs.map((b) => ({
    name: (b.getAttribute('title') || b.querySelector('.sr-only')?.textContent || '').trim(),
    w: Math.round(b.getBoundingClientRect().width),
  })));
  check(dock.length === 3 && dock.every((d) => d.w >= 44), `${width}px dock: 3 buttons >= 44px`, dock.map((d) => d.name).join('/'));
  check(dock.some((d) => /Scanner une entité/.test(d.name)), `${width}px buyer dock labels the entity scan`);

  // Open search, type, submit.
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.navpill button')].find((b) => /Recherche/.test(b.getAttribute('title') || b.querySelector('.sr-only')?.textContent || ''));
    btn?.click();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => { const i = document.querySelector('.searchdock input'); i && i.focus(); });
  await page.keyboard.type('boulangerie');
  await page.keyboard.press('Enter');
  // The search reveal is a cinematic (world→…→framing) ~6s; wait for results.
  await page.waitForSelector('#hgrid .hcard', { timeout: 20000 }).catch(() => undefined);

  const r = await page.evaluate(() => ({
    sheet: document.querySelector('.omni-v13-stage')?.getAttribute('data-sheet'),
    hcards: document.querySelectorAll('#hgrid .hcard').length,
    sortbar: !!document.querySelector('.sortbar'),
    sorts: [...document.querySelectorAll('.sortbar .sortchip')].map((c) => c.textContent.trim()),
    firstPrice: document.querySelector('#hgrid .hcard .pr')?.textContent?.trim() || null,
    labels: [...document.querySelectorAll('.constraint-zone .label')].map((l) => l.textContent.trim()),
    kickerEyebrow: document.querySelectorAll('.constraint-zone .eyebrow').length,
    kickerLabel: document.querySelectorAll('.constraint-zone .label').length,
  }));
  console.log(`  [${width}px] sheet=${r.sheet} hcards=${r.hcards} sortbar=${r.sortbar} sorts=${JSON.stringify(r.sorts)} price=${r.firstPrice} kickers=${r.kickerEyebrow}eyebrow/${r.kickerLabel}label`);
  // OPT-02 — constraint family kickers are .eyebrow (not .label), design.md §38.
  if (r.kickerEyebrow + r.kickerLabel > 0) {
    check(r.kickerEyebrow >= 3 && r.kickerLabel === 0, `${width}px constraint kickers use .eyebrow`, `${r.kickerEyebrow} eyebrow / ${r.kickerLabel} label`);
  }

  if (STUB) {
    check(r.hcards === 3, `${width}px results render 3 cards`);
    check(r.sortbar && r.sorts.length === 4, `${width}px sortbar has 4 chips`, JSON.stringify(r.sorts));
    check(!!r.firstPrice && /F$|FCFA/.test(r.firstPrice), `${width}px card shows a real price`, r.firstPrice || 'none');
    // "Prix le plus bas" → the cheapest (Hub éloigné, 18000) becomes first.
    await page.evaluate(() => {
      const chip = [...document.querySelectorAll('.sortbar .sortchip')].find((c) => /Prix le plus bas/.test(c.textContent));
      chip?.click();
    });
    await page.waitForTimeout(300);
    const firstAfter = await page.evaluate(() => document.querySelector('#hgrid .hcard b')?.textContent?.trim());
    check(firstAfter === 'Hub éloigné', `${width}px "Prix le plus bas" sorts cheapest first`, firstAfter || 'none');
    // "Remise Omni" → the biggest discount (30%) first.
    await page.evaluate(() => {
      const chip = [...document.querySelectorAll('.sortbar .sortchip')].find((c) => /Remise Omni/.test(c.textContent));
      chip?.click();
    });
    await page.waitForTimeout(300);
    const discFirst = await page.evaluate(() => document.querySelector('#hgrid .hcard b')?.textContent?.trim());
    check(discFirst === 'Épicerie proche', `${width}px "Remise Omni" sorts best discount first`, discFirst || 'none');
  } else {
    // Real prod DB: no fixture — assert the surfaces actually render.
    check(r.hcards >= 1, `${width}px prod results render`, String(r.hcards));
    if (r.hcards > 1) check(r.sortbar, `${width}px prod sortbar present`);
    check(!!r.firstPrice && /F$|FCFA/.test(r.firstPrice), `${width}px prod card shows a real price`, r.firstPrice || 'none');
  }

  // MENU-03 — the menu header matches the maquette ("Menu · <Rôle>" + "Tout Omni, depuis ici").
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.navpill button')].find((b) => /Menu/.test(b.getAttribute('title') || b.querySelector('.sr-only')?.textContent || ''));
    btn?.click();
  });
  await page.waitForTimeout(300);
  const menu = await page.evaluate(() => ({
    eyebrow: document.querySelector('.sheet[data-sheet="menu"] .eyebrow')?.textContent?.trim() || null,
    h1: document.querySelector('.sheet[data-sheet="menu"] h1')?.textContent?.trim() || null,
  }));
  check(/^Menu · /.test(menu.eyebrow || ''), `${width}px menu eyebrow "Menu · <Rôle>"`, menu.eyebrow || 'none');
  check(menu.h1 === 'Tout Omni, depuis ici', `${width}px menu h1 "Tout Omni, depuis ici"`, menu.h1 || 'none');
  await page.close();
}

await browser.close();
console.log(failures === 0 ? '\nDS-3 PROOF: PASS' : `\nDS-3 PROOF: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
