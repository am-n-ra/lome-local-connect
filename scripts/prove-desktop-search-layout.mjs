import { chromium } from 'playwright';
const BASE = process.env.APP_URL || 'http://localhost:4181';
const b = await chromium.launch({ headless: true });
for (const width of [1040, 1280, 1920]) {
  const p = await b.newPage({ viewport: { width, height: 900 } });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  await p.evaluate(() => { const btn = [...document.querySelectorAll('.navpill button')].find((x) => /Recherche/.test(x.getAttribute('title') || x.querySelector('.sr-only')?.textContent || '')); if (btn) btn.click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('.searchdock input, .fld input')?.focus());
  await p.keyboard.type('boulangerie');
  await p.waitForTimeout(600);
  const m = await p.evaluate(() => {
    const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom }; };
    const overlap = (a, b) => { const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x)); const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y)); return Math.round(x * y); };
    const intersect = (a, b) => ({ x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) });
    const rp = rect(document.querySelector('.rolepill'));
    const cz = document.querySelector('.constraint-zone');
    const czBox = rect(cz);
    // A chip only paints inside the constraint-zone's clipping box (overflow:hidden).
    const visibleChips = [...document.querySelectorAll('.constraint-zone .chip')].map((el) => intersect(rect(el), czBox));
    const dock = intersect(rect(document.querySelector('.searchdock')), rect(document.querySelector('.sheet[data-sheet="search"]')));
    let maxOverlap = 0;
    for (const c of [...visibleChips, dock]) maxOverlap = Math.max(maxOverlap, overlap(rp, c));
    const inBar = rp.y >= 0 && rp.bottom <= 78;
    const el = document.elementFromPoint((rp.x + rp.right) / 2, (rp.y + rp.bottom) / 2);
    const clickable = !!el?.closest('.rolepill');
    return { rolepillInBar: inBar, rolepillClickable: clickable, maxVisibleOverlapWithRolepill: maxOverlap, barBottom: Math.round(rect(document.querySelector('.sheet[data-sheet="search"]')).bottom) };
  });
  console.log(`width ${width}`, JSON.stringify(m));
  if (!m.rolepillInBar || !m.rolepillClickable || m.maxVisibleOverlapWithRolepill !== 0) {
    console.error(`FAIL at ${width}: rolepill must stay in the top bar, clickable, with no visible overlap from the constraint row`);
    process.exitCode = 1;
  }
  await p.close();
}
await b.close();
