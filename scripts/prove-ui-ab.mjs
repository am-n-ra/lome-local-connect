import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

// A/B render proof. Compares the *rendered* public path between two builds.
// Determinism controls (the first version was dominated by animation noise):
//   - freeze CSS animations/transitions;
//   - wait for network idle + a fixed settle;
//   - wait for the actual content of each stage, not a fixed timeout;
//   - drop the transient map-reveal overlay so it can't appear on one side only.
const BASE = process.env.UI_BASE ?? 'http://localhost:4181';
const MODE = process.argv[2] ?? 'capture';
const FILE = process.argv[3] ?? '/tmp/ui-baseline.json';
const WIDTHS = [360, 768, 1280, 1920];

const FREEZE = '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}';

const SNAPSHOT = () => {
  const vw = window.innerWidth;
  const rows = [];
  const parse = (c) => { const m = (c || '').match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const isSr = (el) => { const c = typeof el.className === 'string' ? el.className : ''; if (/\bsr-only\b/.test(c)) return true; const r = el.getBoundingClientRect(); return r.left < -1000 || r.right > vw + 1000; };
  const transient = (el) => el.closest('.map-reveal-status, .omni-progress-track, .map-legend, .map-status, .maplibregl-ctrl, .map-controls, .map-controls *');
  for (const el of [...document.querySelectorAll('body *')]) {
    if (transient(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    if (isSr(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const tag = el.tagName.toLowerCase();
    // maplibregl-* tokens are added by the map library from touch detection and
    // are not app CSS — strip them so the fingerprint reflects our own classes.
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter((c) => c && !c.startsWith('maplibregl-')).sort().join('.') : '';
    const bg = parse(cs.backgroundColor);
    const hasBg = bg && bg.length >= 3 && (bg[3] === undefined || bg[3] > 0);
    // Structural + stable-style fingerprint. Geometry (x/y/w/h) is excluded:
    // the dock reveal morph and map controls move on a JS rAF, so geometry is
    // nondeterministic between two runs of the SAME build. Colour, size, weight
    // and radius are the properties a CSS regression would actually change.
    rows.push([`${tag}.${cls}`, cs.color, hasBg ? cs.backgroundColor : '-', cs.fontSize, cs.fontWeight, cs.borderRadius, cs.display].join('|'));
  }
  rows.sort();
  return rows;
};

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const settle = async (page, ms = 900) => { await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(ms); };
const snap = (page) => page.evaluate(SNAPSHOT);

const run = async () => {
  const out = {};
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w <= 480 ? 780 : 900 }, locale: 'fr-FR' });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.addStyleTag({ content: FREEZE }).catch(() => {});
    await settle(page, 2000);
    const stages = {};
    stages.home = await snap(page);
    await page.evaluate(() => { [...document.querySelectorAll('.navpill button')].find((b) => (b.textContent || '').trim() === 'Recherche')?.click(); });
    await page.waitForTimeout(600);
    stages.search = await snap(page);
    await page.evaluate(() => { const inp = document.querySelector('.searchdock input'); if (inp) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(inp, 'boulangerie'); inp.dispatchEvent(new Event('input', { bubbles: true })); } });
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector('form[data-sheet="search"]')?.querySelector('button[type="submit"]')?.click());
    await page.waitForSelector('.hgrid button.hcard', { timeout: 9000 }).catch(() => {});
    await settle(page, 1500);
    stages.results = await snap(page);
    await page.evaluate(() => document.querySelector('.hgrid button.hcard')?.click());
    await page.waitForSelector('[data-sheet="facility"]', { timeout: 6000 }).catch(() => {});
    await settle(page, 1500);
    stages.facility = await snap(page);
    await page.evaluate(() => { [...document.querySelectorAll('.navpill button')].find((b) => (b.textContent || '').trim() === 'Menu')?.click(); });
    await page.waitForTimeout(800);
    stages.menu = await snap(page);
    out[w] = stages;
    await ctx.close();
  }
  return out;
};

const data = await run();
await browser.close();

if (MODE === 'capture') {
  writeFileSync(FILE, JSON.stringify(data, null, 2));
  const total = Object.values(data).reduce((a, s) => a + Object.values(s).reduce((b, r) => b + r.length, 0), 0);
  console.log(`captured ${total} fingerprints -> ${FILE}`);
} else {
  if (!existsSync(FILE)) { console.error('no baseline'); process.exit(2); }
  const base = JSON.parse(readFileSync(FILE, 'utf8'));
  let diffs = 0;
  for (const w of WIDTHS) {
    for (const st of Object.keys(data[w])) {
      const a = new Set(base[w][st]); const b = new Set(data[w][st]);
      const missing = [...a].filter((x) => !b.has(x));
      const added = [...b].filter((x) => !a.has(x));
      if (missing.length || added.length) {
        diffs += missing.length + added.length;
        console.log(`[${w}/${st}] -${missing.length} +${added.length}`);
        missing.slice(0, 8).forEach((m) => console.log(`   GONE  ${m}`));
        added.slice(0, 8).forEach((m) => console.log(`   NEW   ${m}`));
      }
    }
  }
  console.log(diffs === 0 ? 'RENDER IDENTICAL ✅' : `RENDER DIFFS: ${diffs}`);
  process.exit(diffs === 0 ? 0 : 1);
}
