import { chromium } from 'playwright';

// SWITCHER — le sélecteur de rôle ne doit JAMAIS recouvrir un autre élément
// (catégories de carte, légende, bandeau d'installation, dock, compteur…),
// ni sur desktop ni sur mobile, à toutes les largeurs.
const BASE = process.env.APP_URL || 'http://localhost:3000';
const WIDTHS = [360, 390, 414, 600, 768, 900, 1040, 1280, 1440, 1920];

const TARGETS = ['.filterrail', '.map-legend', '.installbanner', '.countmark', '.navpill', '.searchdock', '.sheet[data-sheet="search"]'];

const b = await chromium.launch({ headless: true });
let failures = 0;
for (const width of WIDTHS) {
  const p = await b.newPage({ viewport: { width, height: 860 } });
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  const m = await p.evaluate((TARGETS) => {
    const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, w: r.width, h: r.height }; };
    const overlap = (a, b) => { const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x)); const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y)); return Math.round(x * y); };
    const rp = document.querySelector('.rolepill');
    if (!rp) return { error: 'no .rolepill' };
    const rpBox = rect(rp);
    const hits = [];
    for (const sel of TARGETS) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const o = overlap(rpBox, rect(el));
        if (o > 0) hits.push({ sel, overlap: o, box: rect(el) });
      }
    }
    // Also: any element visually ON TOP of the rolepill (paints over it).
    const cx = (rpBox.x + rpBox.right) / 2, cy = (rpBox.y + rpBox.bottom) / 2;
    const top = document.elementFromPoint(cx, cy);
    const onTop = top ? (top.closest('.rolepill') ? 'rolepill' : top.className || top.tagName) : 'none';
    return { rpBox, hits, onTop, rpCount: document.querySelectorAll('.rolepill').length };
  }, TARGETS);
  const bad = m.hits && m.hits.length ? m.hits : [];
  const ok = !m.error && m.onTop === 'rolepill' && bad.length === 0 && m.rpCount === 1;
  if (!ok) failures++;
  console.log(`width ${width}  ${ok ? 'OK' : 'FAIL'}  rolepill=${m.rpBox ? `${Math.round(m.rpBox.w)}x${Math.round(m.rpBox.h)}@(${Math.round(m.rpBox.x)},${Math.round(m.rpBox.y)})` : '—'}  onTop=${m.onTop}  count=${m.rpCount}`);
  for (const h of bad) console.log(`    overlap ${h.overlap}px² with ${h.sel} @(${Math.round(h.box.x)},${Math.round(h.box.y)})`);
  if (m.error) console.log(`    ${m.error}`);
  await p.close();
}
await b.close();
console.log(failures === 0 ? 'ALL OK — switcher never overlaps' : `FAILURES: ${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
